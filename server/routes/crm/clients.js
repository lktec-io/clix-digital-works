import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import {
  crmQuery, crmQueryOne, withTransaction, normalizePhone, pageParams, likeParam, todayInTz,
} from '../../db/crm.js';
import { V, CLIENT_STATUSES, OPEN_FOLLOW_UP_STATUSES } from '../../constants/crm.js';
import {
  route, actor, clean, normalizeMoney, notFound, HttpError, logActivity, labelOf,
  idParam, requiredText, optionalText, oneOf, dateField, moneyField, emailField, phoneField, searchQuery,
} from './shared.js';
import { MONEY_COLS } from './finance.js';

export const clientsRouter = Router();

const OPEN_FU = OPEN_FOLLOW_UP_STATUSES.map(() => '?').join(',');

/** Next open follow-up date — derived from follow_ups, never stored separately, so it cannot go stale. */
const NEXT_FOLLOW_UP_SQL = `(
  SELECT MIN(f.due_date) FROM follow_ups f
  WHERE f.client_id = c.id AND f.deleted_at IS NULL AND f.status IN (${OPEN_FU})
)`;

const CLIENT_SORTS = {
  newest:         'c.created_at DESC, c.id DESC',
  oldest:         'c.created_at ASC, c.id ASC',
  name:           'c.full_name ASC, c.id ASC',
  updated:        'c.updated_at DESC, c.id DESC',
  next_follow_up: 'next_follow_up_date IS NULL, next_follow_up_date ASC, c.id DESC',
  last_contacted: 'c.last_contacted_at IS NULL, c.last_contacted_at DESC, c.id DESC',
};

const clientRules = [
  requiredText('full_name', 'Full name'),
  phoneField('phone'),
  emailField('email'),
  optionalText('company', 'Company'),
  optionalText('location', 'Location'),
  optionalText('city', 'City', 100),
  optionalText('region', 'Region', 100),
  oneOf('source', 'Source', V.clientSource),
  oneOf('status', 'Status', V.clientStatus),
  oneOf('priority', 'Priority', V.priority),
  optionalText('interested_service', 'Interested service'),
  moneyField('estimated_budget', 'Estimated budget'),
  dateField('expected_start_date', 'Expected start date'),
];

/** Optional extras on create only: an opening note and a first follow-up. */
const createExtrasRules = [
  optionalText('initial_note', 'Note', 5000),
  dateField('next_follow_up_date', 'Next follow-up date'),
  optionalText('next_follow_up_title', 'Follow-up title'),
];

function clientValues(b) {
  return {
    full_name:           clean(b.full_name),
    phone:               clean(b.phone),
    phone_normalized:    normalizePhone(clean(b.phone)),
    email:               clean(b.email),
    company:             clean(b.company),
    location:            clean(b.location),
    city:                clean(b.city),
    region:              clean(b.region),
    source:              b.source,
    status:              b.status,
    priority:            b.priority,
    interested_service:  clean(b.interested_service),
    estimated_budget:    normalizeMoney(clean(b.estimated_budget)),
    expected_start_date: clean(b.expected_start_date),
  };
}

const CLIENT_FIELDS = Object.keys(clientValues({}));

// ── List ─────────────────────────────────────────────────────────────────────
clientsRouter.get(
  '/clients',
  searchQuery(),
  queryParam('status').optional().isIn(['', ...V.clientStatus]),
  queryParam('source').optional().isIn(['', ...V.clientSource]),
  queryParam('priority').optional().isIn(['', ...V.priority]),
  queryParam('city').optional().isString().isLength({ max: 100 }),
  queryParam('view').optional().isIn(['', 'active', 'archived', 'cardhub']),
  queryParam('sort').optional().isIn(['', ...Object.keys(CLIENT_SORTS)]),
  handleValidation,
  route('clients list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const q = req.query;
    const view = q.view || 'active';

    // Base scope (view) + search/city/source/priority — shared by the list
    // and by the per-status counts so the filter tabs always add up.
    let scope = view === 'archived' ? 'c.archived_at IS NOT NULL' : 'c.archived_at IS NULL';
    const scopeParams = [];

    if (view === 'cardhub') {
      scope += ` AND (c.source = 'cardhub' OR EXISTS (
        SELECT 1 FROM cardhub_events e WHERE e.client_id = c.id AND e.archived_at IS NULL))`;
    }
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      const phone = normalizePhone(search);
      scope += ` AND (c.full_name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.phone LIKE ?${phone ? ' OR c.phone_normalized LIKE ?' : ''})`;
      scopeParams.push(like, like, like, like);
      if (phone) scopeParams.push(likeParam(phone));
    }
    if (q.source)   { scope += ' AND c.source = ?';    scopeParams.push(q.source); }
    if (q.priority) { scope += ' AND c.priority = ?';  scopeParams.push(q.priority); }
    if (q.city)     { scope += ' AND c.city LIKE ?';   scopeParams.push(likeParam(q.city.trim())); }

    let where = scope;
    const params = [...scopeParams];
    if (q.status) { where += ' AND c.status = ?'; params.push(q.status); }

    const orderBy = CLIENT_SORTS[q.sort] || CLIENT_SORTS.newest;

    const [total, rows, counts] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total FROM clients c WHERE ${where}`, params),
      crmQuery(
        `SELECT c.id, c.full_name, c.phone, c.email, c.company, c.city, c.region, c.source,
                c.status, c.priority, c.interested_service, c.expected_start_date,
                c.last_contacted_at, c.archived_at, c.created_at,
                ${NEXT_FOLLOW_UP_SQL} AS next_follow_up_date,
                (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.archived_at IS NULL) AS projects_count,
                (SELECT COUNT(*) FROM cardhub_events e WHERE e.client_id = c.id AND e.archived_at IS NULL) AS events_count,
                (SELECT MIN(e.event_date) FROM cardhub_events e
                  WHERE e.client_id = c.id AND e.archived_at IS NULL
                    AND e.status NOT IN ('event_completed','cancelled') AND e.event_date >= ?) AS next_event_date,
                (SELECT COALESCE(SUM(p.balance), 0) FROM projects p
                  WHERE p.client_id = c.id AND p.archived_at IS NULL AND p.status <> 'cancelled')
              + (SELECT COALESCE(SUM(e.balance), 0) FROM cardhub_events e
                  WHERE e.client_id = c.id AND e.archived_at IS NULL AND e.status <> 'cancelled') AS balance
         FROM clients c
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ${limit} OFFSET ${offset}`,
        [...OPEN_FOLLOW_UP_STATUSES, todayInTz(), ...params],
      ),
      crmQuery(`SELECT c.status, COUNT(*) AS total FROM clients c WHERE ${scope} GROUP BY c.status`, scopeParams),
    ]);

    const status_counts = Object.fromEntries(V.clientStatus.map(s => [s, 0]));
    let all = 0;
    for (const r of counts) { status_counts[r.status] = r.total; all += r.total; }
    status_counts.all = all;

    res.json({ data: rows, total: total.total, page, limit, status_counts });
  }),
);

// ── Duplicate check (warn only — never blocks or merges) ─────────────────────
clientsRouter.get(
  '/clients/duplicates',
  queryParam('phone').optional().isString().isLength({ max: 50 }),
  queryParam('email').optional().isString().isLength({ max: 190 }),
  queryParam('exclude_id').optional().isInt({ min: 1 }).toInt(),
  handleValidation,
  route('clients duplicates', async (req, res) => {
    const phone = normalizePhone(req.query.phone);
    const email = (req.query.email || '').trim().toLowerCase();
    const matchers = [];
    const params = [];
    if (phone && phone.length >= 9) { matchers.push('phone_normalized = ?'); params.push(phone); }
    if (email) { matchers.push('email = ?'); params.push(email); }
    if (!matchers.length) return res.json({ data: [] });

    let sql = `SELECT id, full_name, phone, email, company, status, archived_at FROM clients WHERE (${matchers.join(' OR ')})`;
    if (req.query.exclude_id) { sql += ' AND id <> ?'; params.push(req.query.exclude_id); }
    res.json({ data: await crmQuery(`${sql} ORDER BY created_at DESC LIMIT 5`, params) });
  }),
);

// ── Detail (everything the client page needs, in one request) ────────────────
clientsRouter.get(
  '/clients/:id',
  idParam(),
  handleValidation,
  route('client detail', async (req, res) => {
    const id = req.params.id;
    const client = await crmQueryOne(
      `SELECT c.*, ${NEXT_FOLLOW_UP_SQL} AS next_follow_up_date FROM clients c WHERE c.id = ?`,
      [...OPEN_FOLLOW_UP_STATUSES, id],
    );
    if (!client) throw notFound('Client');
    delete client.phone_normalized;

    const DETAIL_LIMIT = 100;
    const [projects, events, followUps, payments, notes, activity] = await Promise.all([
      crmQuery(
        `SELECT p.id, p.project_name, p.service, p.status, ${MONEY_COLS('p')},
                p.expected_start_date, p.expected_completion_date, p.description, p.archived_at, p.created_at
         FROM projects p WHERE p.client_id = ? ORDER BY p.archived_at IS NOT NULL, p.created_at DESC`,
        [id],
      ),
      crmQuery(
        `SELECT e.id, e.event_type, e.event_name, e.event_date, e.event_location, e.status, ${MONEY_COLS('e')},
                e.number_of_cards, e.package, e.archived_at, e.created_at
         FROM cardhub_events e WHERE e.client_id = ?
         ORDER BY e.archived_at IS NOT NULL, e.event_date IS NULL, e.event_date DESC`,
        [id],
      ),
      crmQuery(
        `SELECT f.id, f.title, f.description, f.due_date, f.status, f.priority, f.completed_at, f.created_at
         FROM follow_ups f WHERE f.client_id = ? AND f.deleted_at IS NULL
         ORDER BY f.status = 'completed', f.due_date ASC, f.id DESC LIMIT ${DETAIL_LIMIT}`,
        [id],
      ),
      crmQuery(
        `SELECT cp.id, cp.amount, cp.payment_method, cp.payment_date, cp.reference, cp.notes, cp.recorded_by,
                cp.voided_at, cp.void_reason, cp.project_id, cp.cardhub_event_id, cp.created_at,
                COALESCE(p.project_name, e.event_name) AS parent_name
         FROM client_payments cp
         LEFT JOIN projects p ON p.id = cp.project_id
         LEFT JOIN cardhub_events e ON e.id = cp.cardhub_event_id
         WHERE cp.client_id = ?
         ORDER BY cp.payment_date DESC, cp.id DESC LIMIT ${DETAIL_LIMIT}`,
        [id],
      ),
      crmQuery(
        `SELECT id, body, author, created_at FROM client_notes WHERE client_id = ?
         ORDER BY created_at DESC, id DESC LIMIT ${DETAIL_LIMIT}`,
        [id],
      ),
      crmQuery(
        `SELECT id, entity_type, entity_id, action, description, actor, created_at FROM activity_log
         WHERE client_id = ? ORDER BY created_at DESC, id DESC LIMIT ${DETAIL_LIMIT}`,
        [id],
      ),
    ]);

    // Financial summary is computed in SQL from the stored DECIMAL columns,
    // excluding archived/cancelled work so "owes" means money genuinely due.
    const summary = await crmQueryOne(
      `SELECT
         COALESCE(SUM(total_price), 0) AS total_billed,
         COALESCE(SUM(amount_paid), 0) AS total_paid,
         COALESCE(SUM(balance), 0)     AS balance
       FROM (
         SELECT total_price, amount_paid, balance FROM projects
         WHERE client_id = ? AND archived_at IS NULL AND status <> 'cancelled'
         UNION ALL
         SELECT total_price, amount_paid, balance FROM cardhub_events
         WHERE client_id = ? AND archived_at IS NULL AND status <> 'cancelled'
       ) money`,
      [id, id],
    );

    res.json({
      data: client,
      summary,
      projects,
      cardhub_events: events,
      follow_ups: followUps,
      payments,
      notes,
      activity,
      today: todayInTz(),
    });
  }),
);

// ── Create ───────────────────────────────────────────────────────────────────
clientsRouter.post(
  '/clients',
  clientRules,
  createExtrasRules,
  handleValidation,
  route('client create', async (req, res) => {
    const v = clientValues(req.body);
    const note = clean(req.body.initial_note);
    const followUpDate = clean(req.body.next_follow_up_date);

    const id = await withTransaction(async tx => {
      const cols = CLIENT_FIELDS;
      const result = await tx.query(
        `INSERT INTO clients (${cols.join(', ')}, created_by) VALUES (${cols.map(() => '?').join(', ')}, ?)`,
        [...cols.map(k => v[k]), actor(req)],
      );
      const clientId = result.insertId;
      await logActivity(tx, {
        clientId, entityType: 'client', entityId: clientId, action: 'client.created', req,
        description: `Client created as ${labelOf(CLIENT_STATUSES, v.status)}`,
      });

      if (note) {
        await tx.query('INSERT INTO client_notes (client_id, body, author) VALUES (?, ?, ?)', [clientId, note, actor(req)]);
      }
      if (followUpDate) {
        const title = clean(req.body.next_follow_up_title)
          || (v.interested_service ? `Follow up: ${v.interested_service}` : 'Follow up');
        const fu = await tx.query(
          `INSERT INTO follow_ups (client_id, title, due_date, priority, created_by) VALUES (?, ?, ?, ?, ?)`,
          [clientId, title.slice(0, 190), followUpDate, v.priority, actor(req)],
        );
        await logActivity(tx, {
          clientId, entityType: 'follow_up', entityId: fu.insertId, action: 'follow_up.created', req,
          description: `Follow-up added: ${title} (due ${followUpDate})`,
        });
      }
      return clientId;
    });

    res.status(201).json({ success: true, id });
  }),
);

// ── Update ───────────────────────────────────────────────────────────────────
clientsRouter.put(
  '/clients/:id',
  idParam(),
  clientRules,
  handleValidation,
  route('client update', async (req, res) => {
    const id = req.params.id;
    const v = clientValues(req.body);

    await withTransaction(async tx => {
      const before = await tx.queryOne('SELECT status FROM clients WHERE id = ? FOR UPDATE', [id]);
      if (!before) throw notFound('Client');

      await tx.query(
        `UPDATE clients SET ${CLIENT_FIELDS.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...CLIENT_FIELDS.map(k => v[k]), id],
      );
      await logActivity(tx, {
        clientId: id, entityType: 'client', entityId: id, action: 'client.updated', req,
        description: 'Client details updated',
      });
      if (before.status !== v.status) {
        await logActivity(tx, {
          clientId: id, entityType: 'client', entityId: id, action: 'client.status_changed', req,
          description: `Status changed from ${labelOf(CLIENT_STATUSES, before.status)} to ${labelOf(CLIENT_STATUSES, v.status)}`,
        });
      }
    });

    res.json({ success: true });
  }),
);

// ── Quick status change ──────────────────────────────────────────────────────
clientsRouter.patch(
  '/clients/:id/status',
  idParam(),
  oneOf('status', 'Status', V.clientStatus),
  handleValidation,
  route('client status', async (req, res) => {
    const id = req.params.id;
    await withTransaction(async tx => {
      const before = await tx.queryOne('SELECT status FROM clients WHERE id = ? FOR UPDATE', [id]);
      if (!before) throw notFound('Client');
      if (before.status === req.body.status) return;

      await tx.query('UPDATE clients SET status = ? WHERE id = ?', [req.body.status, id]);
      await logActivity(tx, {
        clientId: id, entityType: 'client', entityId: id, action: 'client.status_changed', req,
        description: `Status changed from ${labelOf(CLIENT_STATUSES, before.status)} to ${labelOf(CLIENT_STATUSES, req.body.status)}`,
      });
    });
    res.json({ success: true });
  }),
);

// ── Archive / restore (soft; history is always kept) ─────────────────────────
async function setArchived(req, res, archived) {
  const id = req.params.id;
  await withTransaction(async tx => {
    const row = await tx.queryOne('SELECT archived_at FROM clients WHERE id = ? FOR UPDATE', [id]);
    if (!row) throw notFound('Client');
    if (Boolean(row.archived_at) === archived) {
      throw new HttpError(409, archived ? 'Client is already archived' : 'Client is not archived');
    }
    await tx.query(`UPDATE clients SET archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`, [id]);
    await logActivity(tx, {
      clientId: id, entityType: 'client', entityId: id, req,
      action: archived ? 'client.archived' : 'client.restored',
      description: archived ? 'Client archived' : 'Client restored from archive',
    });
  });
  res.json({ success: true });
}

clientsRouter.delete('/clients/:id', idParam(), handleValidation,
  route('client archive', (req, res) => setArchived(req, res, true)));

clientsRouter.post('/clients/:id/restore', idParam(), handleValidation,
  route('client restore', (req, res) => setArchived(req, res, false)));

// ── Notes (append-only history) ──────────────────────────────────────────────
clientsRouter.post(
  '/clients/:id/notes',
  idParam(),
  body('body').isString().withMessage('Note is required').trim()
    .notEmpty().withMessage('Note is required')
    .isLength({ max: 5000 }).withMessage('Note must be at most 5000 characters'),
  body('mark_contacted').optional().isBoolean().toBoolean(),
  handleValidation,
  route('client note', async (req, res) => {
    const id = req.params.id;
    const noteId = await withTransaction(async tx => {
      const client = await tx.queryOne('SELECT id FROM clients WHERE id = ? FOR UPDATE', [id]);
      if (!client) throw notFound('Client');

      const result = await tx.query(
        'INSERT INTO client_notes (client_id, body, author) VALUES (?, ?, ?)',
        [id, req.body.body, actor(req)],
      );
      if (req.body.mark_contacted) {
        await tx.query('UPDATE clients SET last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      }
      await logActivity(tx, {
        clientId: id, entityType: 'note', entityId: result.insertId, action: 'note.added', req,
        description: req.body.mark_contacted ? 'Note added (client contacted)' : 'Note added',
      });
      return result.insertId;
    });
    res.status(201).json({ success: true, id: noteId });
  }),
);
