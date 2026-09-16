import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import { crmQuery, crmQueryOne, withTransaction, pageParams, likeParam, todayInTz, monthRange } from '../../db/crm.js';
import { V } from '../../constants/crm.js';
import { route, notFound, HttpError, logActivity, actor, idParam, searchQuery } from './shared.js';
import { lockParent, recalcPaid } from './finance.js';

export const paymentsRouter = Router();

// ── Ledger ───────────────────────────────────────────────────────────────────
paymentsRouter.get(
  '/payments',
  searchQuery(),
  queryParam('type').optional().isIn(['', 'project', 'cardhub']),
  queryParam('method').optional().isIn(['', ...V.paymentMethod]),
  queryParam('from').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  queryParam('to').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  queryParam('include_voided').optional().isIn(['', '0', '1']),
  handleValidation,
  route('payments list', async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const q = req.query;

    let where = '1=1';
    const params = [];
    if (q.include_voided !== '1') where += ' AND cp.voided_at IS NULL';
    if (q.type === 'project') where += ' AND cp.project_id IS NOT NULL';
    if (q.type === 'cardhub') where += ' AND cp.cardhub_event_id IS NOT NULL';
    if (q.method) { where += ' AND cp.payment_method = ?'; params.push(q.method); }
    if (q.from)   { where += ' AND cp.payment_date >= ?';  params.push(q.from.slice(0, 10)); }
    if (q.to)     { where += ' AND cp.payment_date <= ?';  params.push(q.to.slice(0, 10)); }
    const search = (q.search || '').trim();
    if (search) {
      const like = likeParam(search);
      where += ' AND (cp.reference LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR p.project_name LIKE ? OR e.event_name LIKE ?)';
      params.push(like, like, like, like, like);
    }

    const FROM = `FROM client_payments cp
      JOIN clients c ON c.id = cp.client_id
      LEFT JOIN projects p ON p.id = cp.project_id
      LEFT JOIN cardhub_events e ON e.id = cp.cardhub_event_id`;

    const [thisMonthFrom, thisMonthTo] = monthRange(todayInTz(), 0);

    const [total, rows, sums, outstanding] = await Promise.all([
      crmQueryOne(`SELECT COUNT(*) AS total ${FROM} WHERE ${where}`, params),
      crmQuery(
        `SELECT cp.id, cp.client_id, cp.project_id, cp.cardhub_event_id, cp.amount, cp.payment_method,
                cp.payment_date, cp.reference, cp.notes, cp.recorded_by, cp.voided_at, cp.void_reason, cp.created_at,
                c.full_name AS client_name, COALESCE(p.project_name, e.event_name) AS parent_name
         ${FROM} WHERE ${where}
         ORDER BY cp.payment_date DESC, cp.id DESC LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
      crmQueryOne(
        `SELECT COALESCE(SUM(CASE WHEN ${where} THEN cp.amount END), 0) AS filtered_total,
                COALESCE(SUM(CASE WHEN cp.voided_at IS NULL AND cp.payment_date BETWEEN ? AND ? THEN cp.amount END), 0) AS this_month_total
         ${FROM}`,
        [...params, thisMonthFrom, thisMonthTo],
      ),
      crmQueryOne(
        `SELECT COALESCE(SUM(balance), 0) AS total, COUNT(*) AS items FROM (
           SELECT balance FROM projects WHERE archived_at IS NULL AND status <> 'cancelled' AND balance > 0
           UNION ALL
           SELECT balance FROM cardhub_events WHERE archived_at IS NULL AND status <> 'cancelled' AND balance > 0
         ) b`,
      ),
    ]);

    res.json({
      data: rows,
      total: total.total,
      page,
      limit,
      totals: {
        filtered: sums.filtered_total,
        this_month: sums.this_month_total,
        outstanding: outstanding.total,
        outstanding_items: outstanding.items,
      },
    });
  }),
);

// ── Void (keeps the record; recalculates the parent's totals) ────────────────
paymentsRouter.post(
  '/payments/:id/void',
  idParam(),
  body('reason').isString().withMessage('Give a reason for voiding').trim()
    .notEmpty().withMessage('Give a reason for voiding')
    .isLength({ max: 255 }).withMessage('Reason must be at most 255 characters'),
  handleValidation,
  route('payment void', async (req, res) => {
    await withTransaction(async tx => {
      const payment = await tx.queryOne(
        'SELECT id, client_id, project_id, cardhub_event_id, amount, voided_at FROM client_payments WHERE id = ?',
        [req.params.id],
      );
      if (!payment) throw notFound('Payment');
      if (payment.voided_at) throw new HttpError(409, 'Payment is already voided');

      const kind = payment.project_id ? 'project' : 'event';
      const parentId = payment.project_id || payment.cardhub_event_id;
      const parent = await lockParent(tx, kind, parentId);

      await tx.query(
        'UPDATE client_payments SET voided_at = CURRENT_TIMESTAMP, void_reason = ?, voided_by = ? WHERE id = ? AND voided_at IS NULL',
        [req.body.reason, actor(req), payment.id],
      );
      await recalcPaid(tx, kind, parentId);
      await logActivity(tx, {
        clientId: payment.client_id, entityType: kind === 'project' ? 'project' : 'cardhub_event', entityId: parentId,
        action: 'payment.voided', req,
        description: `Payment voided: TZS ${Number(payment.amount).toLocaleString('en-US')} for ${parent.name} — ${req.body.reason}`,
      });
    });
    res.json({ success: true });
  }),
);
