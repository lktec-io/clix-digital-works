import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import { crmQuery, crmQueryOne, withTransaction, pageParams, likeParam, todayInTz, monthRange } from '../../db/crm.js';
import { V, EXPENSE_CATEGORIES } from '../../constants/crm.js';
import {
  route, clean, normalizeMoney, notFound, HttpError, fieldError, logActivity, labelOf, actor,
  idParam, requiredText, optionalText, oneOf, dateField, moneyField, searchQuery,
} from './shared.js';

export const expensesRouter = Router();

/**
 * Expenses = money Clix spends. Never mixed with client_payments (money
 * received): no endpoint here reads or writes a payment, and voided expenses
 * are excluded from every total but kept in the table.
 */

const EXPENSE_SELECT = `
  SELECT e.id, e.title, e.amount, e.expense_type, e.category, e.expense_date, e.payment_method,
         e.vendor, e.reference, e.notes, e.client_id, e.project_id, e.cardhub_event_id,
         e.voided_at, e.void_reason, e.recorded_by, e.created_at,
         c.full_name AS client_name, p.project_name, ev.event_name
  FROM expenses e
  LEFT JOIN clients c ON c.id = e.client_id
  LEFT JOIN projects p ON p.id = e.project_id
  LEFT JOIN cardhub_events ev ON ev.id = e.cardhub_event_id`;

const expenseRules = [
  requiredText('title', 'Description'),
  moneyField('amount', 'Amount', { required: true, positive: true }),
  oneOf('expense_type', 'Expense type', V.expenseType),
  oneOf('category', 'Category', V.expenseCategory),
  dateField('expense_date', 'Date', { required: true }),
  oneOf('payment_method', 'Payment method', V.paymentMethod, { required: false }),
  optionalText('vendor', 'Vendor', 190),
  optionalText('reference', 'Reference', 100),
  optionalText('notes', 'Notes', 500),
  body('client_id').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('project_id').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('cardhub_event_id').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
];

const expenseValues = b => ({
  title:          clean(b.title),
  amount:         normalizeMoney(b.amount),
  expense_type:   b.expense_type,
  category:       b.category,
  expense_date:   b.expense_date,
  payment_method: clean(b.payment_method),
  vendor:         clean(b.vendor),
  reference:      clean(b.reference),
  notes:          clean(b.notes),
  client_id:        b.expense_type === 'general' ? null : (b.client_id || null),
  project_id:       b.expense_type === 'general' ? null : (b.project_id || null),
  cardhub_event_id: b.expense_type === 'general' ? null : (b.cardhub_event_id || null),
});

const EXPENSE_FIELDS = Object.keys(expenseValues({ expense_type: 'general' }));

/**
 * A project expense must name the client it was spent on, and may narrow that
 * to one project OR one CardHub event — never both, and never one belonging to
 * a different client.
 */
async function assertLinks(tx, v) {
  if (v.expense_type === 'general') return;
  if (!v.client_id) throw fieldError('client_id', 'Choose the client this cost belongs to');
  if (v.project_id && v.cardhub_event_id) {
    throw fieldError('project_id', 'Link the cost to a project or an event, not both');
  }
  const client = await tx.queryOne('SELECT id FROM clients WHERE id = ?', [v.client_id]);
  if (!client) throw fieldError('client_id', 'Client not found');

  if (v.project_id) {
    const project = await tx.queryOne('SELECT client_id FROM projects WHERE id = ?', [v.project_id]);
    if (!project) throw fieldError('project_id', 'Project not found');
    if (project.client_id !== v.client_id) throw fieldError('project_id', 'That project belongs to another client');
  }
  if (v.cardhub_event_id) {
    const event = await tx.queryOne('SELECT client_id FROM cardhub_events WHERE id = ?', [v.cardhub_event_id]);
    if (!event) throw fieldError('cardhub_event_id', 'Event not found');
    if (event.client_id !== v.client_id) throw fieldError('cardhub_event_id', 'That event belongs to another customer');
  }
}

/** Human line for the activity log, e.g. "SMS credits (SMS) — TZS 80,000". */
const describe = v =>
  `${v.title} (${labelOf(EXPENSE_CATEGORIES, v.category)}) — TZS ${Number(v.amount).toLocaleString('en-US')}`;

// ── List + totals ────────────────────────────────────────────────────────────
expensesRouter.get(
  '/expenses',
  searchQuery(),
  queryParam('type').optional().isIn(['', ...V.expenseType]),
  queryParam('category').optional().isIn(['', ...V.expenseCategory]),
  queryParam('client_id').optional().isInt({ min: 1 }).toInt(),
  queryParam('project_id').optional().isInt({ min: 1 }).toInt(),
  queryParam('cardhub_event_id').optional().isInt({ min: 1 }).toInt(),
  queryParam('from').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  queryParam('to').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  queryParam('include_voided').optional().isIn(['', '0', '1']),
  handleValidation,
  route('expenses list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query, 25);
    const q = req.query;

    let where = '1=1';
    const params = [];
    if (q.include_voided !== '1') where += ' AND e.voided_at IS NULL';
    if (q.type)     { where += ' AND e.expense_type = ?';     params.push(q.type); }
    if (q.category) { where += ' AND e.category = ?';         params.push(q.category); }
    if (q.client_id){ where += ' AND e.client_id = ?';        params.push(q.client_id); }
    if (q.project_id) { where += ' AND e.project_id = ?';     params.push(q.project_id); }
    if (q.cardhub_event_id) { where += ' AND e.cardhub_event_id = ?'; params.push(q.cardhub_event_id); }
    if (q.from)     { where += ' AND e.expense_date >= ?';    params.push(q.from.slice(0, 10)); }
    if (q.to)       { where += ' AND e.expense_date <= ?';    params.push(q.to.slice(0, 10)); }
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      where += ' AND (e.title LIKE ? OR e.vendor LIKE ? OR e.reference LIKE ? OR c.full_name LIKE ? OR p.project_name LIKE ? OR ev.event_name LIKE ?)';
      params.push(like, like, like, like, like, like);
    }

    const today = todayInTz();
    const [monthFrom, monthTo] = monthRange(today, 0);

    const [total, rows, filtered, totals, byCategory] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total FROM expenses e
                   LEFT JOIN clients c ON c.id = e.client_id
                   LEFT JOIN projects p ON p.id = e.project_id
                   LEFT JOIN cardhub_events ev ON ev.id = e.cardhub_event_id
                   WHERE ${where}`, params),
      crmQuery(`${EXPENSE_SELECT} WHERE ${where} ORDER BY e.expense_date DESC, e.id DESC LIMIT ${limit} OFFSET ${offset}`, params),
      crmQueryOne(`SELECT COALESCE(SUM(e.amount), 0) AS total FROM expenses e
                   LEFT JOIN clients c ON c.id = e.client_id
                   LEFT JOIN projects p ON p.id = e.project_id
                   LEFT JOIN cardhub_events ev ON ev.id = e.cardhub_event_id
                   WHERE ${where}`, params),
      // Headline totals always describe all live expenses, not the filter.
      crmQueryOne(
        `SELECT COALESCE(SUM(amount), 0) AS total,
                COALESCE(SUM(CASE WHEN expense_date BETWEEN ? AND ? THEN amount END), 0) AS this_month,
                COALESCE(SUM(CASE WHEN expense_type = 'project' THEN amount END), 0) AS project_costs,
                COALESCE(SUM(CASE WHEN expense_type = 'general' THEN amount END), 0) AS general_costs
         FROM expenses WHERE voided_at IS NULL`,
        [monthFrom, monthTo],
      ),
      crmQuery(
        `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS items
         FROM expenses WHERE voided_at IS NULL
         GROUP BY category ORDER BY total DESC`,
      ),
    ]);

    res.json({
      data: rows,
      total: total.total,
      page,
      limit,
      totals: { ...totals, filtered: filtered.total },
      by_category: byCategory,
      today,
    });
  }),
);

// ── Single expense ───────────────────────────────────────────────────────────
expensesRouter.get(
  '/expenses/:id',
  idParam(),
  handleValidation,
  route('expense detail', async (req, res) => {
    const expense = await crmQueryOne(`${EXPENSE_SELECT} WHERE e.id = ?`, [req.params.id]);
    if (!expense) throw notFound('Expense');
    res.json({ data: expense });
  }),
);

// ── Create ───────────────────────────────────────────────────────────────────
expensesRouter.post(
  '/expenses',
  expenseRules,
  handleValidation,
  route('expense create', async (req, res) => {
    const v = expenseValues(req.body);
    const id = await withTransaction(async tx => {
      await assertLinks(tx, v);
      const result = await tx.query(
        `INSERT INTO expenses (${EXPENSE_FIELDS.join(', ')}, recorded_by)
         VALUES (${EXPENSE_FIELDS.map(() => '?').join(', ')}, ?)`,
        [...EXPENSE_FIELDS.map(k => v[k]), actor(req)],
      );
      if (v.client_id) {
        await logActivity(tx, {
          clientId: v.client_id, entityType: 'expense', entityId: result.insertId, action: 'expense.recorded', req,
          description: `Cost recorded: ${describe(v)}`,
        });
      }
      return result.insertId;
    });
    res.status(201).json({ success: true, id });
  }),
);

// ── Update ───────────────────────────────────────────────────────────────────
expensesRouter.put(
  '/expenses/:id',
  idParam(),
  expenseRules,
  handleValidation,
  route('expense update', async (req, res) => {
    const id = req.params.id;
    const v = expenseValues(req.body);
    await withTransaction(async tx => {
      const before = await tx.queryOne('SELECT id, client_id, voided_at FROM expenses WHERE id = ? FOR UPDATE', [id]);
      if (!before) throw notFound('Expense');
      if (before.voided_at) throw new HttpError(409, 'A voided expense cannot be edited');
      await assertLinks(tx, v);

      await tx.query(
        `UPDATE expenses SET ${EXPENSE_FIELDS.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...EXPENSE_FIELDS.map(k => v[k]), id],
      );
      if (v.client_id || before.client_id) {
        await logActivity(tx, {
          clientId: v.client_id || before.client_id, entityType: 'expense', entityId: id, action: 'expense.updated', req,
          description: `Cost updated: ${describe(v)}`,
        });
      }
    });
    res.json({ success: true });
  }),
);

// ── Void (never delete a financial record) ───────────────────────────────────
expensesRouter.post(
  '/expenses/:id/void',
  idParam(),
  body('reason').isString().withMessage('Give a reason for voiding').trim()
    .notEmpty().withMessage('Give a reason for voiding')
    .isLength({ max: 255 }).withMessage('Reason must be at most 255 characters'),
  handleValidation,
  route('expense void', async (req, res) => {
    await withTransaction(async tx => {
      const expense = await tx.queryOne(
        'SELECT id, client_id, title, amount, category, voided_at FROM expenses WHERE id = ? FOR UPDATE',
        [req.params.id],
      );
      if (!expense) throw notFound('Expense');
      if (expense.voided_at) throw new HttpError(409, 'Expense is already voided');

      await tx.query(
        'UPDATE expenses SET voided_at = CURRENT_TIMESTAMP, void_reason = ?, voided_by = ? WHERE id = ?',
        [req.body.reason, actor(req), expense.id],
      );
      if (expense.client_id) {
        await logActivity(tx, {
          clientId: expense.client_id, entityType: 'expense', entityId: expense.id, action: 'expense.voided', req,
          description: `Cost voided: ${describe(expense)} — ${req.body.reason}`,
        });
      }
    });
    res.json({ success: true });
  }),
);

// ── Summary (totals only, for widgets) ───────────────────────────────────────
expensesRouter.get(
  '/expenses-summary',
  queryParam('client_id').optional().isInt({ min: 1 }).toInt(),
  handleValidation,
  route('expenses summary', async (req, res) => {
    const today = todayInTz();
    const [monthFrom, monthTo] = monthRange(today, 0);
    const scope = req.query.client_id ? 'AND client_id = ?' : '';
    const scopeParams = req.query.client_id ? [req.query.client_id] : [];

    const totals = await crmQueryOne(
      `SELECT COALESCE(SUM(amount), 0) AS total,
              COALESCE(SUM(CASE WHEN expense_date BETWEEN ? AND ? THEN amount END), 0) AS this_month,
              COALESCE(SUM(CASE WHEN expense_type = 'project' THEN amount END), 0) AS project_costs,
              COALESCE(SUM(CASE WHEN expense_type = 'general' THEN amount END), 0) AS general_costs
       FROM expenses WHERE voided_at IS NULL ${scope}`,
      [monthFrom, monthTo, ...scopeParams],
    );
    res.json({ totals, today });
  }),
);
