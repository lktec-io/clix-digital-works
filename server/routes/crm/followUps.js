import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import { crmQuery, crmQueryOne, withTransaction, pageParams, likeParam, todayInTz, addDays } from '../../db/crm.js';
import { V, OPEN_FOLLOW_UP_STATUSES } from '../../constants/crm.js';
import {
  route, clean, notFound, HttpError, fieldError, logActivity, requireClient, actor,
  idParam, requiredText, optionalText, oneOf, dateField, searchQuery,
} from './shared.js';

export const followUpsRouter = Router();

const OPEN = OPEN_FOLLOW_UP_STATUSES.map(() => '?').join(',');

/**
 * Overdue is derived, never stored: due_date < today (business timezone) and
 * not completed. "Upcoming" is everything open after today.
 */
function followUpViews(today) {
  return {
    today:     { where: `f.status IN (${OPEN}) AND f.due_date = ?`, params: [...OPEN_FOLLOW_UP_STATUSES, today], order: 'f.priority = \'high\' DESC, f.id ASC' },
    overdue:   { where: `f.status IN (${OPEN}) AND f.due_date < ?`, params: [...OPEN_FOLLOW_UP_STATUSES, today], order: 'f.due_date ASC, f.id ASC' },
    upcoming:  { where: `f.status IN (${OPEN}) AND f.due_date > ?`, params: [...OPEN_FOLLOW_UP_STATUSES, today], order: 'f.due_date ASC, f.id ASC' },
    open:      { where: `f.status IN (${OPEN})`, params: [...OPEN_FOLLOW_UP_STATUSES], order: 'f.due_date ASC, f.id ASC' },
    completed: { where: `f.status = 'completed'`, params: [], order: 'f.completed_at DESC, f.id DESC' },
  };
}
const VIEW_KEYS = Object.keys(followUpViews('2000-01-01'));

const followUpRules = [
  requiredText('title', 'Title'),
  optionalText('description', 'Description', 5000),
  dateField('due_date', 'Due date', { required: true }),
  oneOf('priority', 'Priority', V.priority),
];

const FOLLOW_UP_SELECT = `
  SELECT f.id, f.client_id, f.title, f.description, f.due_date, f.status, f.priority,
         f.completed_at, f.created_at, f.updated_at,
         c.full_name AS client_name, c.phone AS client_phone, c.status AS client_status,
         c.interested_service
  FROM follow_ups f JOIN clients c ON c.id = f.client_id`;

async function lockFollowUp(tx, id) {
  const row = await tx.queryOne(
    'SELECT id, client_id, title, due_date, status FROM follow_ups WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
    [id],
  );
  if (!row) throw notFound('Follow-up');
  return row;
}

// ── List ─────────────────────────────────────────────────────────────────────
followUpsRouter.get(
  '/follow-ups',
  searchQuery(),
  queryParam('view').optional().isIn(['', ...VIEW_KEYS]),
  queryParam('client_id').optional().isInt({ min: 1 }).toInt(),
  queryParam('priority').optional().isIn(['', ...V.priority]),
  handleValidation,
  route('follow-ups list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const q = req.query;
    const today = todayInTz();
    const views = followUpViews(today);
    const view = views[q.view] || views.today;

    // Reminders for archived clients are hidden (the client is no longer pursued).
    let filter = 'f.deleted_at IS NULL AND c.archived_at IS NULL';
    const filterParams = [];
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      filter += ' AND (f.title LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)';
      filterParams.push(like, like, like);
    }
    if (q.client_id) { filter += ' AND f.client_id = ?'; filterParams.push(q.client_id); }
    if (q.priority)  { filter += ' AND f.priority = ?';  filterParams.push(q.priority); }

    const where = `${filter} AND ${view.where}`;
    const params = [...filterParams, ...view.params];
    const countSql = VIEW_KEYS.map(k => `SUM(CASE WHEN ${views[k].where} THEN 1 ELSE 0 END) AS \`${k}\``).join(', ');

    const [total, rows, countsRow] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total FROM follow_ups f JOIN clients c ON c.id = f.client_id WHERE ${where}`, params),
      crmQuery(`${FOLLOW_UP_SELECT} WHERE ${where} ORDER BY ${view.order} LIMIT ${limit} OFFSET ${offset}`, params),
      crmQueryOne(
        `SELECT ${countSql} FROM follow_ups f JOIN clients c ON c.id = f.client_id WHERE ${filter}`,
        [...VIEW_KEYS.flatMap(k => views[k].params), ...filterParams],
      ),
    ]);

    const view_counts = Object.fromEntries(VIEW_KEYS.map(k => [k, Number(countsRow?.[k] || 0)]));
    res.json({ data: rows, total: total.total, page, limit, view_counts, today });
  }),
);

// ── Create ───────────────────────────────────────────────────────────────────
followUpsRouter.post(
  '/follow-ups',
  body('client_id').isInt({ min: 1 }).withMessage('Select a client').toInt(),
  followUpRules,
  handleValidation,
  route('follow-up create', async (req, res) => {
    const id = await withTransaction(async tx => {
      const client = await requireClient(tx, req.body.client_id, { field: 'client_id' });
      if (client.archived_at) throw new HttpError(409, 'This client is archived. Restore the client first.');
      const result = await tx.query(
        `INSERT INTO follow_ups (client_id, title, description, due_date, priority, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [client.id, clean(req.body.title), clean(req.body.description), req.body.due_date, req.body.priority, actor(req)],
      );
      await logActivity(tx, {
        clientId: client.id, entityType: 'follow_up', entityId: result.insertId, action: 'follow_up.created', req,
        description: `Follow-up added: ${clean(req.body.title)} (due ${req.body.due_date})`,
      });
      return result.insertId;
    });
    res.status(201).json({ success: true, id });
  }),
);

// ── Update ───────────────────────────────────────────────────────────────────
followUpsRouter.put(
  '/follow-ups/:id',
  idParam(),
  followUpRules,
  handleValidation,
  route('follow-up update', async (req, res) => {
    await withTransaction(async tx => {
      const row = await lockFollowUp(tx, req.params.id);
      await tx.query(
        'UPDATE follow_ups SET title = ?, description = ?, due_date = ?, priority = ? WHERE id = ?',
        [clean(req.body.title), clean(req.body.description), req.body.due_date, req.body.priority, row.id],
      );
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'follow_up', entityId: row.id, action: 'follow_up.updated', req,
        description: `Follow-up updated: ${clean(req.body.title)}${row.due_date !== req.body.due_date ? ` (due ${row.due_date} → ${req.body.due_date})` : ''}`,
      });
    });
    res.json({ success: true });
  }),
);

// ── Complete ─────────────────────────────────────────────────────────────────
followUpsRouter.post(
  '/follow-ups/:id/complete',
  idParam(),
  optionalText('outcome', 'Outcome', 5000),
  handleValidation,
  route('follow-up complete', async (req, res) => {
    await withTransaction(async tx => {
      const row = await lockFollowUp(tx, req.params.id);
      if (row.status === 'completed') throw new HttpError(409, 'Follow-up is already completed');

      await tx.query("UPDATE follow_ups SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?", [row.id]);
      await tx.query('UPDATE clients SET last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?', [row.client_id]);

      // An outcome is a communication record, so it becomes a permanent client note.
      const outcome = clean(req.body.outcome);
      if (outcome) {
        await tx.query('INSERT INTO client_notes (client_id, body, author) VALUES (?, ?, ?)',
          [row.client_id, `Follow-up "${row.title}": ${outcome}`, actor(req)]);
      }
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'follow_up', entityId: row.id, action: 'follow_up.completed', req,
        description: `Follow-up completed: ${row.title}`,
      });
    });
    res.json({ success: true });
  }),
);

// ── Reschedule / snooze ──────────────────────────────────────────────────────
followUpsRouter.post(
  '/follow-ups/:id/reschedule',
  idParam(),
  dateField('due_date', 'New date'),
  body('snooze_days').optional({ values: 'falsy' }).isInt({ min: 1, max: 365 }).withMessage('Invalid snooze').toInt(),
  handleValidation,
  route('follow-up reschedule', async (req, res) => {
    const { due_date: dueDate, snooze_days: snoozeDays } = req.body;
    if (!dueDate && !snoozeDays) throw fieldError('due_date', 'Choose a new date');

    const today = todayInTz();
    const newDate = snoozeDays ? addDays(today, snoozeDays) : dueDate;
    if (newDate < today) throw fieldError('due_date', 'New date cannot be in the past');

    await withTransaction(async tx => {
      const row = await lockFollowUp(tx, req.params.id);
      if (row.status === 'completed') throw new HttpError(409, 'Completed follow-ups cannot be rescheduled');

      const status = snoozeDays ? 'snoozed' : 'pending';
      await tx.query('UPDATE follow_ups SET due_date = ?, status = ? WHERE id = ?', [newDate, status, row.id]);
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'follow_up', entityId: row.id, req,
        action: snoozeDays ? 'follow_up.snoozed' : 'follow_up.rescheduled',
        description: `Follow-up ${snoozeDays ? 'snoozed' : 'rescheduled'}: ${row.title} (${row.due_date} → ${newDate})`,
      });
    });
    res.json({ success: true, due_date: newDate });
  }),
);

// ── Reopen a completed follow-up ─────────────────────────────────────────────
followUpsRouter.post(
  '/follow-ups/:id/reopen',
  idParam(),
  handleValidation,
  route('follow-up reopen', async (req, res) => {
    await withTransaction(async tx => {
      const row = await lockFollowUp(tx, req.params.id);
      if (row.status !== 'completed') throw new HttpError(409, 'Follow-up is not completed');
      await tx.query("UPDATE follow_ups SET status = 'pending', completed_at = NULL WHERE id = ?", [row.id]);
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'follow_up', entityId: row.id, action: 'follow_up.reopened', req,
        description: `Follow-up reopened: ${row.title}`,
      });
    });
    res.json({ success: true });
  }),
);

// ── Remove (soft) ────────────────────────────────────────────────────────────
followUpsRouter.delete(
  '/follow-ups/:id',
  idParam(),
  handleValidation,
  route('follow-up delete', async (req, res) => {
    await withTransaction(async tx => {
      const row = await lockFollowUp(tx, req.params.id);
      await tx.query('UPDATE follow_ups SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'follow_up', entityId: row.id, action: 'follow_up.removed', req,
        description: `Follow-up removed: ${row.title}`,
      });
    });
    res.json({ success: true });
  }),
);
