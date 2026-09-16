import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import {
  crmQuery, crmQueryOne, withTransaction, pageParams, likeParam, todayInTz, addDays, monthRange, isValidYmd,
} from '../../db/crm.js';
import {
  V, CARDHUB_EVENT_STATUSES, CARDHUB_EVENT_TYPES, CLOSED_EVENT_STATUSES, PAYMENT_METHODS,
} from '../../constants/crm.js';
import {
  route, clean, normalizeMoney, toCents, notFound, HttpError, logActivity, labelOf, requireClient, actor,
  idParam, requiredText, optionalText, oneOf, dateField, moneyField, optionalCount, searchQuery,
} from './shared.js';
import { MONEY_COLS, lockParent, insertPayment, assertPriceCoversPaid } from './finance.js';
import { paymentRules, paymentValues } from './projects.js';

export const cardhubRouter = Router();

const CLOSED = CLOSED_EVENT_STATUSES.map(() => '?').join(',');

/**
 * Every date window is resolved from "today" in the business timezone and
 * compared against the stored DATE column — never hardcoded. Upcoming
 * windows are inclusive ("next 30 days" on 16 Sep = 16 Sep … 16 Oct) and
 * exclude completed/cancelled events.
 */
function eventViews(today) {
  const upcoming = days => ({
    where: `e.event_date BETWEEN ? AND ? AND e.status NOT IN (${CLOSED})`,
    params: [today, addDays(today, days), ...CLOSED_EVENT_STATUSES],
    order: 'e.event_date ASC, e.id ASC',
  });
  const month = offset => {
    const [from, to] = monthRange(today, offset);
    return {
      where: `e.event_date BETWEEN ? AND ? AND e.status <> 'cancelled'`,
      params: [from, to],
      order: 'e.event_date ASC, e.id ASC',
    };
  };
  return {
    all:        { where: '1=1', params: [], order: 'e.event_date IS NULL, e.event_date DESC, e.id DESC' },
    upcoming:   { where: `(e.event_date IS NULL OR e.event_date >= ?) AND e.status NOT IN (${CLOSED})`,
                  params: [today, ...CLOSED_EVENT_STATUSES], order: 'e.event_date IS NULL, e.event_date ASC, e.id ASC' },
    next_7:     upcoming(7),
    next_30:    upcoming(30),
    next_60:    upcoming(60),
    next_90:    upcoming(90),
    this_month: month(0),
    next_month: month(1),
    completed:  { where: `e.status = 'event_completed'`, params: [], order: 'e.event_date DESC, e.id DESC' },
    cancelled:  { where: `e.status = 'cancelled'`, params: [], order: 'e.event_date DESC, e.id DESC' },
    archived:   { where: '1=1', params: [], order: 'e.updated_at DESC', archived: true },
  };
}

const VIEW_KEYS = Object.keys(eventViews('2000-01-01'));

const eventRules = [
  body('client_id').isInt({ min: 1 }).withMessage('Select a customer').toInt(),
  oneOf('event_type', 'Event type', V.eventType),
  requiredText('event_name', 'Event name'),
  dateField('event_date', 'Event date'),
  optionalText('event_location', 'Location'),
  optionalCount('expected_guests', 'Expected guests'),
  optionalText('card_type', 'Card type', 100),
  optionalCount('number_of_cards', 'Number of cards'),
  optionalText('package', 'Package', 100),
  moneyField('total_price', 'Total price'),
  oneOf('status', 'Status', V.eventStatus),
  optionalText('notes', 'Notes', 5000),
  optionalText('external_reference', 'Reference', 100),
];

const intOrNull = v => (v === '' || v === null || v === undefined ? null : Number(v));

const eventValues = b => ({
  client_id:          b.client_id,
  event_type:         b.event_type,
  event_name:         clean(b.event_name),
  event_date:         clean(b.event_date),
  event_location:     clean(b.event_location),
  expected_guests:    intOrNull(b.expected_guests),
  card_type:          clean(b.card_type),
  number_of_cards:    intOrNull(b.number_of_cards),
  package:            clean(b.package),
  total_price:        normalizeMoney(clean(b.total_price)) ?? '0',
  status:             b.status,
  notes:              clean(b.notes),
  external_reference: clean(b.external_reference),
});

const EVENT_FIELDS = Object.keys(eventValues({}));

const EVENT_SELECT = `
  SELECT e.id, e.client_id, e.event_type, e.event_name, e.event_date, e.event_location,
         e.expected_guests, e.card_type, e.number_of_cards, e.package, ${MONEY_COLS('e')},
         e.status, e.notes, e.external_reference, e.delivered_at, e.archived_at, e.created_at, e.updated_at,
         c.full_name AS client_name, c.phone AS client_phone, c.email AS client_email
  FROM cardhub_events e JOIN clients c ON c.id = e.client_id`;

/** Sets delivered_at the first time an event reaches "delivered". */
const deliveredSql = status => (status === 'delivered'
  ? ', delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)' : '');

// ── List (with per-view counts for the filter tabs) ──────────────────────────
cardhubRouter.get(
  '/cardhub/events',
  searchQuery(),
  queryParam('view').optional().isIn(['', ...VIEW_KEYS]),
  queryParam('status').optional().isIn(['', ...V.eventStatus]),
  queryParam('payment_status').optional().isIn(['', ...V.paymentStatus]),
  queryParam('client_id').optional().isInt({ min: 1 }).toInt(),
  handleValidation,
  route('cardhub events list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const q = req.query;
    const today = todayInTz();
    const views = eventViews(today);
    const view = views[q.view] || views.all;

    // Filters shared by the list and the view counts.
    let filter = '1=1';
    const filterParams = [];
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      filter += ' AND (e.event_name LIKE ? OR e.event_location LIKE ? OR e.external_reference LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?';
      filterParams.push(like, like, like, like, like);
      if (isValidYmd(search)) { filter += ' OR e.event_date = ?'; filterParams.push(search); }
      filter += ')';
    }
    if (q.status)         { filter += ' AND e.status = ?';         filterParams.push(q.status); }
    if (q.payment_status) { filter += ' AND e.payment_status = ?'; filterParams.push(q.payment_status); }
    if (q.client_id)      { filter += ' AND e.client_id = ?';      filterParams.push(q.client_id); }

    const archivedClause = view.archived ? 'e.archived_at IS NOT NULL' : 'e.archived_at IS NULL';
    const where = `${archivedClause} AND ${filter} AND ${view.where}`;
    const params = [...filterParams, ...view.params];

    // One aggregate query for every tab count instead of one query per view.
    const countKeys = VIEW_KEYS.filter(k => !views[k].archived);
    const countSql = countKeys.map(k => `SUM(CASE WHEN ${views[k].where} THEN 1 ELSE 0 END) AS \`${k}\``).join(', ');
    const countParams = countKeys.flatMap(k => views[k].params);

    const [total, rows, countsRow] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total FROM cardhub_events e JOIN clients c ON c.id = e.client_id WHERE ${where}`, params),
      crmQuery(`${EVENT_SELECT} WHERE ${where} ORDER BY ${view.order} LIMIT ${limit} OFFSET ${offset}`, params),
      crmQueryOne(
        `SELECT ${countSql} FROM cardhub_events e JOIN clients c ON c.id = e.client_id
         WHERE e.archived_at IS NULL AND ${filter}`,
        [...countParams, ...filterParams],
      ),
    ]);

    const view_counts = Object.fromEntries(countKeys.map(k => [k, Number(countsRow?.[k] || 0)]));
    res.json({ data: rows, total: total.total, page, limit, view_counts, today });
  }),
);

// ── Detail ───────────────────────────────────────────────────────────────────
cardhubRouter.get(
  '/cardhub/events/:id',
  idParam(),
  handleValidation,
  route('cardhub event detail', async (req, res) => {
    const event = await crmQueryOne(`${EVENT_SELECT} WHERE e.id = ?`, [req.params.id]);
    if (!event) throw notFound('CardHub event');
    const [payments, activity] = await Promise.all([
      crmQuery(
        `SELECT id, amount, payment_method, payment_date, reference, notes, recorded_by, voided_at, void_reason, created_at
         FROM client_payments WHERE cardhub_event_id = ? ORDER BY payment_date DESC, id DESC`,
        [req.params.id],
      ),
      crmQuery(
        `SELECT id, action, description, actor, created_at FROM activity_log
         WHERE entity_type = 'cardhub_event' AND entity_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
        [req.params.id],
      ),
    ]);
    res.json({ data: event, payments, activity, today: todayInTz() });
  }),
);

// ── Create ───────────────────────────────────────────────────────────────────
cardhubRouter.post(
  '/cardhub/events',
  eventRules,
  handleValidation,
  route('cardhub event create', async (req, res) => {
    const v = eventValues(req.body);
    const id = await withTransaction(async tx => {
      const client = await requireClient(tx, v.client_id, { field: 'client_id' });
      if (client.archived_at) throw new HttpError(409, 'This customer is archived. Restore them first.');

      const result = await tx.query(
        `INSERT INTO cardhub_events (${EVENT_FIELDS.join(', ')}, created_by, delivered_at)
         VALUES (${EVENT_FIELDS.map(() => '?').join(', ')}, ?, ${v.status === 'delivered' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
        [...EVENT_FIELDS.map(k => v[k]), actor(req)],
      );
      await logActivity(tx, {
        clientId: client.id, entityType: 'cardhub_event', entityId: result.insertId, action: 'cardhub_event.created', req,
        description: `CardHub event created: ${labelOf(CARDHUB_EVENT_TYPES, v.event_type)} — ${v.event_name}${v.event_date ? ` on ${v.event_date}` : ''}`,
      });
      return result.insertId;
    });
    res.status(201).json({ success: true, id });
  }),
);

// ── Update ───────────────────────────────────────────────────────────────────
cardhubRouter.put(
  '/cardhub/events/:id',
  idParam(),
  eventRules,
  handleValidation,
  route('cardhub event update', async (req, res) => {
    const id = req.params.id;
    const v = eventValues(req.body);
    await withTransaction(async tx => {
      const before = await lockParent(tx, 'event', id);
      const current = await tx.queryOne('SELECT status, event_date, client_id FROM cardhub_events WHERE id = ?', [id]);
      assertPriceCoversPaid(before.amount_paid, v.total_price);

      // Moving an event with payments to another customer would split the
      // payment ledger from its event; the client link is fixed once paid.
      if (current.client_id !== v.client_id) {
        if (toCents(before.amount_paid) > 0) {
          throw new HttpError(409, 'This event already has payments, so its customer cannot be changed.');
        }
        await requireClient(tx, v.client_id, { field: 'client_id' });
      }

      await tx.query(
        `UPDATE cardhub_events SET ${EVENT_FIELDS.map(k => `${k} = ?`).join(', ')}${deliveredSql(v.status)} WHERE id = ?`,
        [...EVENT_FIELDS.map(k => v[k]), id],
      );

      const changes = [];
      if (current.status !== v.status) {
        changes.push(`status ${labelOf(CARDHUB_EVENT_STATUSES, current.status)} → ${labelOf(CARDHUB_EVENT_STATUSES, v.status)}`);
      }
      if (current.event_date !== v.event_date) {
        changes.push(`date ${current.event_date || 'not set'} → ${v.event_date || 'not set'}`);
      }
      await logActivity(tx, {
        clientId: v.client_id, entityType: 'cardhub_event', entityId: id, action: 'cardhub_event.updated', req,
        description: `CardHub event updated: ${v.event_name}${changes.length ? ` (${changes.join(', ')})` : ''}`,
      });
    });
    res.json({ success: true });
  }),
);

cardhubRouter.patch(
  '/cardhub/events/:id/status',
  idParam(),
  oneOf('status', 'Status', V.eventStatus),
  handleValidation,
  route('cardhub event status', async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    await withTransaction(async tx => {
      const row = await tx.queryOne('SELECT client_id, event_name, status FROM cardhub_events WHERE id = ? FOR UPDATE', [id]);
      if (!row) throw notFound('CardHub event');
      if (row.status === status) return;
      await tx.query(`UPDATE cardhub_events SET status = ?${deliveredSql(status)} WHERE id = ?`, [status, id]);
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'cardhub_event', entityId: id, action: 'cardhub_event.status_changed', req,
        description: `${row.event_name}: status changed from ${labelOf(CARDHUB_EVENT_STATUSES, row.status)} to ${labelOf(CARDHUB_EVENT_STATUSES, status)}`,
      });
    });
    res.json({ success: true });
  }),
);

async function setEventArchived(req, res, archived) {
  const id = req.params.id;
  await withTransaction(async tx => {
    const row = await tx.queryOne('SELECT client_id, event_name, archived_at FROM cardhub_events WHERE id = ? FOR UPDATE', [id]);
    if (!row) throw notFound('CardHub event');
    if (Boolean(row.archived_at) === archived) {
      throw new HttpError(409, archived ? 'Event is already archived' : 'Event is not archived');
    }
    await tx.query(`UPDATE cardhub_events SET archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`, [id]);
    await logActivity(tx, {
      clientId: row.client_id, entityType: 'cardhub_event', entityId: id, req,
      action: archived ? 'cardhub_event.archived' : 'cardhub_event.restored',
      description: `${row.event_name} ${archived ? 'archived' : 'restored'}`,
    });
  });
  res.json({ success: true });
}

cardhubRouter.delete('/cardhub/events/:id', idParam(), handleValidation,
  route('cardhub event archive', (req, res) => setEventArchived(req, res, true)));
cardhubRouter.post('/cardhub/events/:id/restore', idParam(), handleValidation,
  route('cardhub event restore', (req, res) => setEventArchived(req, res, false)));

// ── Payments ─────────────────────────────────────────────────────────────────
cardhubRouter.post(
  '/cardhub/events/:id/payments',
  idParam(),
  paymentRules,
  handleValidation,
  route('cardhub event payment', async (req, res) => {
    const data = paymentValues(req.body);
    const paymentId = await withTransaction(async tx => {
      const parent = await lockParent(tx, 'event', req.params.id);
      const id = await insertPayment(tx, 'event', parent, data, actor(req));
      await logActivity(tx, {
        clientId: parent.client_id, entityType: 'cardhub_event', entityId: parent.id, action: 'payment.recorded', req,
        description: `Payment recorded: TZS ${Number(data.amount).toLocaleString('en-US')} via ${labelOf(PAYMENT_METHODS, data.payment_method)} for ${parent.name}`,
      });
      return id;
    });
    res.status(201).json({ success: true, id: paymentId });
  }),
);
