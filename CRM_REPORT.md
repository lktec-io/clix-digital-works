# CRM & CardHub Management — Implementation Report

**Date:** 17 Sep 2026 · **Scope:** Client management (CRM), projects, follow-ups, payments and CardHub event management inside the existing Clix admin panel.

---

## 1. What was inspected

| Area | Finding |
|---|---|
| Frontend | React 19 + Vite 8, React Router 7, `react-icons/fi`, plain CSS (`admin.css`, CSS variables) |
| Backend | Express 4 + `mysql2`, `express-validator`, `helmet`, `express-rate-limit` |
| Auth | Single admin from `.env`, JWT via `requireAuth`, token in `sessionStorage` |
| Migrations | Idempotent `CREATE TABLE IF NOT EXISTS` in `server/db/migrate.js`, run on server boot |
| API conventions | Admin routes under `/api/admin`, lists return `{ data, total, page, limit }`, errors `{ error }`, validation 422 `{ error, details[] }` |
| Existing data | `contacts`, `quote_requests`, `newsletter_subscribers` only — **no** client, project, payment, follow-up or activity tables |
| CardHub | **A separate application** (`../cardhub`): own database (`cardhub`), own API (port 4006), own JWT, own domain. Its `events`/`orders`/`payments` model self-service *digital* invitations with a Beem payment-gateway lifecycle |

## 2. Integration decision

CardHub's data lives in a different database the Clix server has no credentials for, and its tables are governed by CardHub's own service rules (order contact checks, gateway payment states). Reading/writing it from Clix would couple two production systems and bypass those rules.

**Therefore:** CRM tables were added to `clix_db`. A CardHub customer **is a Clix client** (same `clients` row), so one person can have projects *and* CardHub events without duplication. CardHub events carry an optional `external_reference` for matching a CardHub order later. No CardHub code or data was touched.

## 3. Database changes (additive only)

New tables, created by `server/db/migrations/crm.js` (called at the end of `runMigrations`):

| Table | Purpose |
|---|---|
| `clients` | Master person/company record; lifecycle status, source, priority, budget, expected start |
| `projects` | Many per client; `total_price`, `amount_paid`, generated `balance` + `payment_status` |
| `cardhub_events` | Many per client; event details, cards/package, same money columns |
| `client_payments` | One ledger for project **or** event payments (DB CHECK enforces exactly one parent) |
| `follow_ups` | Reminders per client; overdue is derived, never stored |
| `client_notes` | Append-only communication history |
| `activity_log` | Append-only audit of every change |

Safety properties:
- Money is `DECIMAL(14,2)`; `amount_paid` is **recalculated from the ledger** inside a transaction with the parent row locked (`SELECT … FOR UPDATE`); balance/status are STORED generated columns. Overpayment is rejected (app + DB CHECK).
- No hard deletes: clients/projects/events archive (`archived_at`), follow-ups soft-delete, payments are **voided with a reason** (kept in history). Foreign keys are `RESTRICT`.
- Existing tables are not altered. Existing data is untouched.

## 4. New API endpoints (all behind existing `requireAuth`)

```
GET  /api/admin/crm/options            allowlists + timezone + today
GET  /api/admin/crm/dashboard          KPIs, pipeline, follow-ups, upcoming events, alerts
GET  /api/admin/crm/search?q=          clients, projects, events, payment references

GET    /api/admin/clients               ?search&status&source&priority&city&view&sort&page
GET    /api/admin/clients/duplicates    ?phone&email&exclude_id  (warn only)
GET    /api/admin/clients/:id           client + projects, events, follow-ups, payments, notes, activity
POST   /api/admin/clients               (optional initial note + first follow-up)
PUT    /api/admin/clients/:id
PATCH  /api/admin/clients/:id/status
DELETE /api/admin/clients/:id           archive
POST   /api/admin/clients/:id/restore
POST   /api/admin/clients/:id/notes

GET    /api/admin/projects              ?search&status&payment_status&client_id&view&sort&page
GET    /api/admin/projects/:id
POST   /api/admin/projects
PUT    /api/admin/projects/:id
PATCH  /api/admin/projects/:id/status
DELETE /api/admin/projects/:id          archive
POST   /api/admin/projects/:id/restore
POST   /api/admin/projects/:id/payments

GET    /api/admin/follow-ups            ?view=today|overdue|upcoming|open|completed&search&priority&page
POST   /api/admin/follow-ups
PUT    /api/admin/follow-ups/:id
POST   /api/admin/follow-ups/:id/complete    (optional outcome → saved as note)
POST   /api/admin/follow-ups/:id/reschedule  (due_date or snooze_days)
POST   /api/admin/follow-ups/:id/reopen
DELETE /api/admin/follow-ups/:id             soft delete

GET    /api/admin/cardhub/events        ?view=upcoming|next_7|next_30|next_60|next_90|this_month|next_month|completed|cancelled|all|archived
GET    /api/admin/cardhub/events/:id
POST   /api/admin/cardhub/events
PUT    /api/admin/cardhub/events/:id
PATCH  /api/admin/cardhub/events/:id/status
DELETE /api/admin/cardhub/events/:id    archive
POST   /api/admin/cardhub/events/:id/restore
POST   /api/admin/cardhub/events/:id/payments

GET    /api/admin/payments              ?type&method&from&to&search&include_voided&page
POST   /api/admin/payments/:id/void
```

"CardHub Customers" uses `GET /api/admin/clients?view=cardhub` (same records, no duplication).

**Dates/timezone:** "today" is computed in `Africa/Dar_es_Salaam` (override with `CRM_TIMEZONE`) and passed to SQL; DATE columns are returned as `YYYY-MM-DD` strings, so reminders never shift by a day.

## 5. New frontend

Sidebar groups added (existing links unchanged): **Clients** (Clients, Projects, Follow-ups, Payments) and **CardHub** (Upcoming Events, All Events, Customers). Pipeline stages are filter tabs on the Clients page rather than 7 sidebar links.

| Route | Page |
|---|---|
| `/admin` | Existing dashboard **plus** CRM section: global search, attention alerts, KPIs, follow-ups today/overdue/upcoming with Complete/Reschedule, CardHub next 30 days, pipeline, projects starting soon |
| `/admin/clients` | List with status tabs + counts, search, source/priority/sort, archived toggle |
| `/admin/clients/:id` | Client hub: header + quick actions + money summary; tabs Overview, Projects, CardHub, Follow-ups, Payments, Notes, Activity |
| `/admin/projects` | Projects with status/payment filters; project modal with payments + void |
| `/admin/follow-ups` | Today / Overdue / Upcoming / Completed |
| `/admin/cardhub/upcoming`, `/admin/cardhub/events` | Date-window tabs, grouped by month, prominent date blocks |
| `/admin/cardhub/events/:id` | Event detail: date/countdown, status, Mark delivered, payments, customer, activity |
| `/admin/cardhub/customers` | Clients with CardHub events |
| `/admin/payments` | Ledger, collected this month, outstanding balances, void |

Key files: `src/components/admin/crm/*`, `src/pages/admin/crm/*`, `src/hooks/useCrm.js`, `src/utils/crm.js`, `src/styles/crm.css`.
Existing files touched (additive): `App.jsx` (routes), `AdminLayout.jsx` (nav groups), `AdminDashboard.jsx` (section appended), `config/api.js` (endpoints; errors now also carry `status`/`details`), `server/index.js` (mount), `server/db/migrate.js` (call).

No new dependencies (frontend or backend).

## 6. Existing functionality preserved

Login, `/stats`, contacts, quotes, newsletter routes and pages unchanged and re-tested. Public website untouched. Admin mobile sidebar behaviour unchanged.

## 7. Verification performed

Tests ran against a **throwaway MySQL 8.0.43 instance** started from the installed binaries on port 3399 with a scratch data directory — production credentials/databases were never used.

- **API: 86/86 passing** on a fresh database — auth (401), validation (422 field details), CRUD, archive/restore, duplicate warning (local vs +255 phone), exact-cent money (0.1+0.2), overpayment rejected by 1 cent, price below paid rejected, void recalculation, derived overdue, snooze/reschedule, date windows (next 30 excludes past/cancelled), search by date/reference, LIKE-wildcard escaping, sort-injection rejected, existing routes still working. Migration verified idempotent (ran twice).
- **Browser (headless Chrome): 12–14 routes × 320/360/375/390/412/430/768/1024/1280** — no page-level horizontal overflow and no content clipped inside panels; modals fit at 320px (bottom sheet), Escape closes; mobile sidebar scrolls.
- **UI flows:** complete follow-up from dashboard (KPI updates), record payment (balance updates), overpayment shows inline server error, server-side search, quick status change.
- **Console:** no errors other than the intentionally triggered 422s.
- **Lint:** all new files clean; project total unchanged from before this work (52 pre-existing problems in unrelated files). **Build:** passes.

## 8. Remaining issues / notes

1. **Global rate limit (200 requests / 15 min per IP) also applies to admin use.** The CRM is designed to be economical (one request per detail page, debounced search, cached options), but heavy continuous admin use can still reach it and show "Too many requests". Not changed, per the instruction not to weaken security settings — consider an authenticated-admin allowance if it becomes a problem.
2. CardHub online orders (in the separate CardHub database) are **not** shown in this module. Linking them would need read-only credentials to that database; `external_reference` is ready for matching.
3. Single admin account: `author`/`actor` fields record the JWT username.
4. Pre-existing lint errors (e.g. `AdminLayout.jsx` effect, server files linted with browser globals) were left as they were.

## 9. Deployment

No new environment variables are required. Optional:

```
CRM_TIMEZONE=Africa/Dar_es_Salaam   # default if unset
```

Steps:

```bash
# 1. Back up the production database first
mysqldump -u <user> -p clix_db > clix_db_backup_$(date +%F).sql

# 2. Pull code, install (no new packages, but keep lockfiles in sync)
cd server && npm ci && cd ..
npm ci

# 3. Build frontend
npm run build

# 4. Restart API — migrations run automatically on boot and log "[migrate] Schema up to date."
pm2 restart <clix-api-process-name>
pm2 logs <clix-api-process-name> --lines 30
```

The database user needs `CREATE` and `REFERENCES` privileges for the first boot (table creation with foreign keys).
