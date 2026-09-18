import { Router } from 'express';
import { query as queryParam } from 'express-validator';
import { handleValidation } from '../../middleware/validate.js';
import { crmQuery, crmQueryOne, todayInTz, addDays, likeParam, normalizePhone, isValidYmd } from '../../db/crm.js';
import {
  CRM_OPTIONS, CRM_TIMEZONE, V, OPEN_FOLLOW_UP_STATUSES, CLOSED_EVENT_STATUSES,
  ACTIVE_PROJECT_STATUSES, PRE_START_PROJECT_STATUSES,
} from '../../constants/crm.js';
import { route } from './shared.js';

export const dashboardRouter = Router();

const ph = list => list.map(() => '?').join(',');

/** Windows used by dashboard widgets and alerts. */
const UPCOMING_FOLLOW_UP_DAYS = 14;
const UPCOMING_EVENT_DAYS = 30;
const PROJECT_START_DAYS = 30;
const WIDGET_LIMIT = 6;

// ── Options (allowlists + business timezone + today) ─────────────────────────
dashboardRouter.get('/crm/options', route('crm options', async (req, res) => {
  res.json({ ...CRM_OPTIONS, timezone: CRM_TIMEZONE, today: todayInTz() });
}));

// ── Dashboard (every number comes from the database) ─────────────────────────
dashboardRouter.get('/crm/dashboard', route('crm dashboard', async (req, res) => {
  const today = todayInTz();
  const followUpUntil = addDays(today, UPCOMING_FOLLOW_UP_DAYS);
  const eventUntil = addDays(today, UPCOMING_EVENT_DAYS);
  const projectUntil = addDays(today, PROJECT_START_DAYS);

  const OPEN_FU = ph(OPEN_FOLLOW_UP_STATUSES);
  const CLOSED_EV = ph(CLOSED_EVENT_STATUSES);

  const followUpList = (condition, params, order) => crmQuery(
    `SELECT f.id, f.client_id, f.title, f.due_date, f.priority, f.status,
            c.full_name AS client_name, c.phone AS client_phone, c.interested_service
     FROM follow_ups f JOIN clients c ON c.id = f.client_id
     WHERE f.deleted_at IS NULL AND c.archived_at IS NULL AND f.status IN (${OPEN_FU}) AND ${condition}
     ORDER BY ${order} LIMIT ${WIDGET_LIMIT}`,
    [...OPEN_FOLLOW_UP_STATUSES, ...params],
  );

  const [
    clientCounts, pipeline, projectCounts, followUpCounts, eventCounts, outstanding, monthPayments,
    todayList, overdueList, upcomingList, eventsList, projectsStarting, outstandingList,
  ] = await Promise.all([
    crmQueryOne(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS added_last_30
       FROM clients WHERE archived_at IS NULL`,
      [addDays(today, -30)],
    ),
    crmQuery('SELECT status, COUNT(*) AS total FROM clients WHERE archived_at IS NULL GROUP BY status'),
    crmQueryOne(
      `SELECT SUM(CASE WHEN status IN (${ph(ACTIVE_PROJECT_STATUSES)}) THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN status IN (${ph(PRE_START_PROJECT_STATUSES)}) AND expected_start_date BETWEEN ? AND ? THEN 1 ELSE 0 END) AS starting_soon
       FROM projects WHERE archived_at IS NULL`,
      [...ACTIVE_PROJECT_STATUSES, ...PRE_START_PROJECT_STATUSES, today, projectUntil],
    ),
    crmQueryOne(
      `SELECT SUM(CASE WHEN f.due_date = ? THEN 1 ELSE 0 END) AS today,
              SUM(CASE WHEN f.due_date < ? THEN 1 ELSE 0 END) AS overdue,
              SUM(CASE WHEN f.due_date > ? AND f.due_date <= ? THEN 1 ELSE 0 END) AS upcoming
       FROM follow_ups f JOIN clients c ON c.id = f.client_id
       WHERE f.deleted_at IS NULL AND c.archived_at IS NULL AND f.status IN (${OPEN_FU})`,
      [today, today, today, followUpUntil, ...OPEN_FOLLOW_UP_STATUSES],
    ),
    crmQueryOne(
      `SELECT COUNT(*) AS upcoming,
              SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) AS upcoming_with_balance
       FROM cardhub_events
       WHERE archived_at IS NULL AND status NOT IN (${CLOSED_EV}) AND event_date BETWEEN ? AND ?`,
      [...CLOSED_EVENT_STATUSES, today, eventUntil],
    ),
    crmQueryOne(
      `SELECT COALESCE(SUM(balance), 0) AS total, COUNT(*) AS items FROM (
         SELECT balance FROM projects WHERE archived_at IS NULL AND status <> 'cancelled' AND balance > 0
         UNION ALL
         SELECT balance FROM cardhub_events WHERE archived_at IS NULL AND status <> 'cancelled' AND balance > 0
       ) b`,
    ),
    crmQueryOne(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM client_payments
       WHERE voided_at IS NULL AND payment_date BETWEEN ? AND ?`,
      [`${today.slice(0, 7)}-01`, today],
    ),
    followUpList('f.due_date = ?', [today], "f.priority = 'high' DESC, f.id ASC"),
    followUpList('f.due_date < ?', [today], 'f.due_date ASC, f.id ASC'),
    followUpList('f.due_date > ? AND f.due_date <= ?', [today, followUpUntil], 'f.due_date ASC, f.id ASC'),
    crmQuery(
      `SELECT e.id, e.client_id, e.event_type, e.event_name, e.event_date, e.event_location, e.number_of_cards,
              e.status, e.payment_status, e.total_price, e.amount_paid, e.balance, c.full_name AS client_name
       FROM cardhub_events e JOIN clients c ON c.id = e.client_id
       WHERE e.archived_at IS NULL AND e.status NOT IN (${CLOSED_EV}) AND e.event_date BETWEEN ? AND ?
       ORDER BY e.event_date ASC, e.id ASC LIMIT ${WIDGET_LIMIT}`,
      [...CLOSED_EVENT_STATUSES, today, eventUntil],
    ),
    crmQuery(
      `SELECT p.id, p.client_id, p.project_name, p.status, p.expected_start_date, c.full_name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
       WHERE p.archived_at IS NULL AND p.status IN (${ph(PRE_START_PROJECT_STATUSES)})
         AND p.expected_start_date BETWEEN ? AND ?
       ORDER BY p.expected_start_date ASC LIMIT ${WIDGET_LIMIT}`,
      [...PRE_START_PROJECT_STATUSES, today, projectUntil],
    ),
    // Who the outstanding_balance total is actually owed by — same rows the
    // total is summed from, largest first.
    crmQuery(
      `SELECT * FROM (
         SELECT 'project' AS kind, p.id, p.client_id, p.project_name AS name, p.balance, p.payment_status,
                c.full_name AS client_name
         FROM projects p JOIN clients c ON c.id = p.client_id
         WHERE p.archived_at IS NULL AND p.status <> 'cancelled' AND p.balance > 0
         UNION ALL
         SELECT 'event' AS kind, e.id, e.client_id, e.event_name AS name, e.balance, e.payment_status,
                c.full_name AS client_name
         FROM cardhub_events e JOIN clients c ON c.id = e.client_id
         WHERE e.archived_at IS NULL AND e.status <> 'cancelled' AND e.balance > 0
       ) owed
       ORDER BY balance DESC, id ASC LIMIT ${WIDGET_LIMIT}`,
    ),
  ]);

  const pipelineCounts = Object.fromEntries(V.clientStatus.map(s => [s, 0]));
  for (const r of pipeline) pipelineCounts[r.status] = r.total;

  const n = v => Number(v || 0);
  res.json({
    today,
    windows: { follow_up_days: UPCOMING_FOLLOW_UP_DAYS, event_days: UPCOMING_EVENT_DAYS, project_days: PROJECT_START_DAYS },
    kpis: {
      total_clients:           n(clientCounts.total),
      clients_added_last_30:   n(clientCounts.added_last_30),
      prospects:               pipelineCounts.prospect,
      active_projects:         n(projectCounts.active),
      projects_starting_soon:  n(projectCounts.starting_soon),
      follow_ups_today:        n(followUpCounts.today),
      follow_ups_overdue:      n(followUpCounts.overdue),
      follow_ups_upcoming:     n(followUpCounts.upcoming),
      upcoming_events:         n(eventCounts.upcoming),
      upcoming_events_with_balance: n(eventCounts.upcoming_with_balance),
      outstanding_balance:     outstanding.total,
      outstanding_items:       n(outstanding.items),
      collected_this_month:    monthPayments.total,
    },
    pipeline: pipelineCounts,
    follow_ups: { today: todayList, overdue: overdueList, upcoming: upcomingList },
    outstanding: outstandingList,
    upcoming_events: eventsList,
    projects_starting: projectsStarting,
  });
}));

// ── Global CRM search ────────────────────────────────────────────────────────
dashboardRouter.get(
  '/crm/search',
  queryParam('q').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Type at least 2 characters'),
  handleValidation,
  route('crm search', async (req, res) => {
    const q = req.query.q;
    const like = likeParam(q);
    const phone = normalizePhone(q);
    const LIMIT = 5;

    const [clients, projects, events, payments] = await Promise.all([
      crmQuery(
        `SELECT id, full_name, phone, email, company, status, archived_at FROM clients
         WHERE full_name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?${phone && phone.length >= 4 ? ' OR phone_normalized LIKE ?' : ''}
         ORDER BY archived_at IS NOT NULL, full_name LIMIT ${LIMIT}`,
        [like, like, like, like, ...(phone && phone.length >= 4 ? [likeParam(phone)] : [])],
      ),
      crmQuery(
        `SELECT p.id, p.client_id, p.project_name, p.status, c.full_name AS client_name
         FROM projects p JOIN clients c ON c.id = p.client_id
         WHERE p.project_name LIKE ? OR p.service LIKE ?
         ORDER BY p.archived_at IS NOT NULL, p.created_at DESC LIMIT ${LIMIT}`,
        [like, like],
      ),
      crmQuery(
        `SELECT e.id, e.client_id, e.event_name, e.event_type, e.event_date, e.status, c.full_name AS client_name
         FROM cardhub_events e JOIN clients c ON c.id = e.client_id
         WHERE e.event_name LIKE ? OR e.event_location LIKE ? OR e.external_reference LIKE ?${isValidYmd(q) ? ' OR e.event_date = ?' : ''}
         ORDER BY e.archived_at IS NOT NULL, e.event_date DESC LIMIT ${LIMIT}`,
        [like, like, like, ...(isValidYmd(q) ? [q] : [])],
      ),
      crmQuery(
        `SELECT cp.id, cp.client_id, cp.amount, cp.payment_date, cp.reference, c.full_name AS client_name
         FROM client_payments cp JOIN clients c ON c.id = cp.client_id
         WHERE cp.reference LIKE ? ORDER BY cp.payment_date DESC LIMIT ${LIMIT}`,
        [like],
      ),
    ]);

    res.json({ clients, projects, events, payments });
  }),
);
