import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import { crmQuery, crmQueryOne, withTransaction, pageParams, likeParam } from '../../db/crm.js';
import { V, PROJECT_STATUSES, PAYMENT_METHODS } from '../../constants/crm.js';
import {
  route, clean, normalizeMoney, toCents, notFound, HttpError, logActivity, labelOf, requireClient, actor,
  idParam, requiredText, optionalText, oneOf, dateField, moneyField, searchQuery,
} from './shared.js';
import { MONEY_COLS, lockParent, insertPayment, assertPriceCoversPaid } from './finance.js';

export const projectsRouter = Router();

const PROJECT_SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  start:  'p.expected_start_date IS NULL, p.expected_start_date ASC, p.id DESC',
  balance: 'p.balance DESC, p.id DESC',
  name:   'p.project_name ASC, p.id ASC',
};

const projectRules = [
  requiredText('project_name', 'Project name'),
  optionalText('service', 'Service'),
  oneOf('status', 'Status', V.projectStatus),
  moneyField('total_price', 'Total price'),
  dateField('expected_start_date', 'Expected start date'),
  dateField('expected_completion_date', 'Expected completion date'),
  optionalText('description', 'Description', 5000),
  body('expected_completion_date').custom((end, { req }) => {
    const start = clean(req.body.expected_start_date);
    return !end || !start || end >= start;
  }).withMessage('Completion date cannot be before the start date'),
];

export const paymentRules = [
  moneyField('amount', 'Amount', { required: true, positive: true }),
  oneOf('payment_method', 'Payment method', V.paymentMethod),
  dateField('payment_date', 'Payment date', { required: true }),
  optionalText('reference', 'Reference', 100),
  optionalText('notes', 'Notes', 500),
];

export const paymentValues = b => ({
  amount:         normalizeMoney(b.amount),
  payment_method: b.payment_method,
  payment_date:   b.payment_date,
  reference:      clean(b.reference),
  notes:          clean(b.notes),
});

const projectValues = b => ({
  project_name:             clean(b.project_name),
  service:                  clean(b.service),
  status:                   b.status,
  total_price:              normalizeMoney(clean(b.total_price)) ?? '0',
  expected_start_date:      clean(b.expected_start_date),
  expected_completion_date: clean(b.expected_completion_date),
  description:              clean(b.description),
});

const PROJECT_FIELDS = Object.keys(projectValues({}));

const PROJECT_SELECT = `
  SELECT p.id, p.client_id, p.project_name, p.service, p.status, ${MONEY_COLS('p')},
         p.expected_start_date, p.expected_completion_date, p.description,
         p.archived_at, p.created_at, p.updated_at,
         c.full_name AS client_name, c.phone AS client_phone
  FROM projects p JOIN clients c ON c.id = p.client_id`;

// ── List ─────────────────────────────────────────────────────────────────────
projectsRouter.get(
  '/projects',
  searchQuery(),
  queryParam('status').optional().isIn(['', ...V.projectStatus]),
  queryParam('payment_status').optional().isIn(['', ...V.paymentStatus]),
  queryParam('client_id').optional().isInt({ min: 1 }).toInt(),
  queryParam('view').optional().isIn(['', 'active', 'archived']),
  queryParam('sort').optional().isIn(['', ...Object.keys(PROJECT_SORTS)]),
  handleValidation,
  route('projects list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const q = req.query;

    let scope = q.view === 'archived' ? 'p.archived_at IS NOT NULL' : 'p.archived_at IS NULL';
    const scopeParams = [];
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      scope += ' AND (p.project_name LIKE ? OR p.service LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)';
      scopeParams.push(like, like, like, like);
    }
    if (q.client_id)      { scope += ' AND p.client_id = ?';      scopeParams.push(q.client_id); }
    if (q.payment_status) { scope += ' AND p.payment_status = ?'; scopeParams.push(q.payment_status); }

    let where = scope;
    const params = [...scopeParams];
    if (q.status) { where += ' AND p.status = ?'; params.push(q.status); }

    const [total, rows, counts] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total FROM projects p JOIN clients c ON c.id = p.client_id WHERE ${where}`, params),
      crmQuery(`${PROJECT_SELECT} WHERE ${where} ORDER BY ${PROJECT_SORTS[q.sort] || PROJECT_SORTS.newest} LIMIT ${limit} OFFSET ${offset}`, params),
      crmQuery(`SELECT p.status, COUNT(*) AS total FROM projects p JOIN clients c ON c.id = p.client_id WHERE ${scope} GROUP BY p.status`, scopeParams),
    ]);

    const status_counts = Object.fromEntries(V.projectStatus.map(s => [s, 0]));
    let all = 0;
    for (const r of counts) { status_counts[r.status] = r.total; all += r.total; }
    status_counts.all = all;

    res.json({ data: rows, total: total.total, page, limit, status_counts });
  }),
);

// ── Detail ───────────────────────────────────────────────────────────────────
projectsRouter.get(
  '/projects/:id',
  idParam(),
  handleValidation,
  route('project detail', async (req, res) => {
    const project = await crmQueryOne(`${PROJECT_SELECT} WHERE p.id = ?`, [req.params.id]);
    if (!project) throw notFound('Project');
    const [payments, activity, expenses, costs] = await Promise.all([
      crmQuery(
        `SELECT id, amount, payment_method, payment_date, reference, notes, recorded_by, voided_at, void_reason, created_at
         FROM client_payments WHERE project_id = ? ORDER BY payment_date DESC, id DESC`,
        [req.params.id],
      ),
      crmQuery(
        `SELECT id, action, description, actor, created_at FROM activity_log
         WHERE entity_type = 'project' AND entity_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
        [req.params.id],
      ),
      crmQuery(
        `SELECT id, title, amount, category, expense_date, vendor, reference, voided_at, void_reason
         FROM expenses WHERE project_id = ? ORDER BY expense_date DESC, id DESC`,
        [req.params.id],
      ),
      crmQueryOne(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE project_id = ? AND voided_at IS NULL',
        [req.params.id],
      ),
    ]);

    // Revenue = money received (amount_paid). Profit is derived from money
    // actually collected, never from the unpaid contract value.
    const money = {
      contract_value: project.total_price,
      collected: project.amount_paid,
      outstanding: project.balance,
      costs: costs.total,
      collected_profit: (Number(project.amount_paid) - Number(costs.total)).toFixed(2),
      contract_margin: (Number(project.total_price) - Number(costs.total)).toFixed(2),
    };
    res.json({ data: project, payments, expenses, money, activity });
  }),
);

// ── Create ───────────────────────────────────────────────────────────────────
projectsRouter.post(
  '/projects',
  body('client_id').isInt({ min: 1 }).withMessage('Select a client').toInt(),
  projectRules,
  handleValidation,
  route('project create', async (req, res) => {
    const v = projectValues(req.body);
    const id = await withTransaction(async tx => {
      const client = await requireClient(tx, req.body.client_id, { field: 'client_id' });
      if (client.archived_at) throw new HttpError(409, 'This client is archived. Restore the client first.');

      const result = await tx.query(
        `INSERT INTO projects (client_id, ${PROJECT_FIELDS.join(', ')}, created_by)
         VALUES (?, ${PROJECT_FIELDS.map(() => '?').join(', ')}, ?)`,
        [client.id, ...PROJECT_FIELDS.map(k => v[k]), actor(req)],
      );
      await logActivity(tx, {
        clientId: client.id, entityType: 'project', entityId: result.insertId, action: 'project.created', req,
        description: `Project created: ${v.project_name} (${labelOf(PROJECT_STATUSES, v.status)})`,
      });
      return result.insertId;
    });
    res.status(201).json({ success: true, id });
  }),
);

// ── Update ───────────────────────────────────────────────────────────────────
projectsRouter.put(
  '/projects/:id',
  idParam(),
  projectRules,
  handleValidation,
  route('project update', async (req, res) => {
    const id = req.params.id;
    const v = projectValues(req.body);
    await withTransaction(async tx => {
      const before = await lockParent(tx, 'project', id);
      const current = await tx.queryOne('SELECT status FROM projects WHERE id = ?', [id]);
      assertPriceCoversPaid(before.amount_paid, v.total_price);

      await tx.query(
        `UPDATE projects SET ${PROJECT_FIELDS.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...PROJECT_FIELDS.map(k => v[k]), id],
      );
      const changes = [];
      if (current.status !== v.status) {
        changes.push(`status ${labelOf(PROJECT_STATUSES, current.status)} → ${labelOf(PROJECT_STATUSES, v.status)}`);
      }
      if (toCents(before.total_price) !== toCents(v.total_price)) {
        changes.push(`price TZS ${Number(before.total_price).toLocaleString('en-US')} → TZS ${Number(v.total_price).toLocaleString('en-US')}`);
      }
      await logActivity(tx, {
        clientId: before.client_id, entityType: 'project', entityId: id, action: 'project.updated', req,
        description: `Project updated: ${v.project_name}${changes.length ? ` (${changes.join(', ')})` : ''}`,
      });
    });
    res.json({ success: true });
  }),
);

projectsRouter.patch(
  '/projects/:id/status',
  idParam(),
  oneOf('status', 'Status', V.projectStatus),
  handleValidation,
  route('project status', async (req, res) => {
    const id = req.params.id;
    await withTransaction(async tx => {
      const row = await tx.queryOne('SELECT client_id, project_name, status FROM projects WHERE id = ? FOR UPDATE', [id]);
      if (!row) throw notFound('Project');
      if (row.status === req.body.status) return;
      await tx.query('UPDATE projects SET status = ? WHERE id = ?', [req.body.status, id]);
      await logActivity(tx, {
        clientId: row.client_id, entityType: 'project', entityId: id, action: 'project.status_changed', req,
        description: `${row.project_name}: status changed from ${labelOf(PROJECT_STATUSES, row.status)} to ${labelOf(PROJECT_STATUSES, req.body.status)}`,
      });
    });
    res.json({ success: true });
  }),
);

// ── Archive / restore (payments are never touched) ───────────────────────────
async function setProjectArchived(req, res, archived) {
  const id = req.params.id;
  await withTransaction(async tx => {
    const row = await tx.queryOne('SELECT client_id, project_name, archived_at FROM projects WHERE id = ? FOR UPDATE', [id]);
    if (!row) throw notFound('Project');
    if (Boolean(row.archived_at) === archived) {
      throw new HttpError(409, archived ? 'Project is already archived' : 'Project is not archived');
    }
    await tx.query(`UPDATE projects SET archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`, [id]);
    await logActivity(tx, {
      clientId: row.client_id, entityType: 'project', entityId: id, req,
      action: archived ? 'project.archived' : 'project.restored',
      description: `${row.project_name} ${archived ? 'archived' : 'restored'}`,
    });
  });
  res.json({ success: true });
}

projectsRouter.delete('/projects/:id', idParam(), handleValidation,
  route('project archive', (req, res) => setProjectArchived(req, res, true)));
projectsRouter.post('/projects/:id/restore', idParam(), handleValidation,
  route('project restore', (req, res) => setProjectArchived(req, res, false)));

// ── Payments ─────────────────────────────────────────────────────────────────
projectsRouter.post(
  '/projects/:id/payments',
  idParam(),
  paymentRules,
  handleValidation,
  route('project payment', async (req, res) => {
    const data = paymentValues(req.body);
    const paymentId = await withTransaction(async tx => {
      const parent = await lockParent(tx, 'project', req.params.id);
      const id = await insertPayment(tx, 'project', parent, data, actor(req));
      await logActivity(tx, {
        clientId: parent.client_id, entityType: 'project', entityId: parent.id, action: 'payment.recorded', req,
        description: `Payment recorded: TZS ${Number(data.amount).toLocaleString('en-US')} via ${labelOf(PAYMENT_METHODS, data.payment_method)} for ${parent.name}`,
      });
      return id;
    });
    res.status(201).json({ success: true, id: paymentId });
  }),
);
