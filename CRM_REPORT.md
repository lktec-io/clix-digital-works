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

---

## 10. UX simplification pass (17 Sep 2026)

Goal: a partner with no technical background can use it from a phone. No features removed; API behaviour unchanged (one additive change: the dashboard's upcoming-events rows now include `number_of_cards`, `total_price`, `amount_paid`).

- **Forms:** Add Client needs only a name (phone recommended); follow-up date, reason and notes are optional in the same step; everything else is behind "Add more details" (auto-opens on edit or on an error). Follow-up = Client, Reason, Date with one-tap Tomorrow / In 3 days / Next week / Next month. Payment form shows Current balance / This payment / Remaining live (server validation unchanged). Optional fields are labelled "(optional)".
- **Defaults:** client Lead / Medium / source Other; project Planned; event New; follow-up Pending + Medium; payment date today, method M-Pesa.
- **Swahili helpers** (short, subtle, only where terms can confuse): status, priority, next follow-up date, expected start, budget, total price, amount paid, balance, event date, expected guests, payment reference, source; one-line Swahili explanation of the selected status; helpful empty states.
- **Actions:** one primary action per screen (Add Follow-up on a client, Record Payment on an event/project, Complete on a follow-up); secondary actions in a "More" menu; consistent labels (Add Client, Save Client, Add Follow-up, Complete, Reschedule, Record Payment, Update Event).
- **Dashboard:** 4 actionable KPIs (Clients, Follow up today + overdue, Events in 30 days + balances due, Outstanding TZS) replace the alert list; overdue + today follow-ups merged into one panel; projects starting soon; CardHub next 30 days; compact pipeline; Add Client button.
- **Client page:** name, status, phone/WhatsApp/email, then Next follow-up / Owes / Needs, then actions and status. Sections are tabs on desktop and a dropdown on phones.
- **Lists:** phone cards show only what matters with Add Follow-up + View; filters behind a [Filter] button on phones; CardHub date tabs reduced to 6 (past/cancelled/all under Filter); Projects list shows Total / Paid / Balance directly; empty detail values are hidden.
- **Mobile:** 44px buttons/inputs on phones and touch screens, bottom-sheet modals, menus that stay on screen.
- **Radius:** admin-only token override (`.admin-app`, `.admin-login-page`, CRM modals): 4px controls/cards/modals, 2–3px small elements and badges; hardcoded 10px/9px/6px admin values fixed. Public website unchanged (verified: still 9999px buttons / 20px cards).

Verification: API 86/86; lint unchanged at the pre-CRM baseline; build passes; headless Chrome at 320–1280px on 14 routes (incl. Contacts, Quotes, Newsletter): body scroll width = viewport, no clipping, no touch target under 40px on phones, no radius above 4px, no console errors; the five mobile flows pass (clicks: add client 2, follow-up add+complete 5, project + payment 4, event + payment 6, search + status 2).

---

## 11. Navigation & analytics pass (18 Sep 2026)

UI only. No database, auth, route, payment, follow-up or CardHub logic changed; the one server edit is additive and read-only (see below).

- **Sidebar:** branded "Clix CRM — Clients & follow-ups" and grouped as Main / Customer management (Clients, Follow-ups, Projects) / CardHub (Upcoming Events, All Events, Customers) / Finance (Payments) / Website (Contacts, Quotes, Newsletter). Every entry is an existing route — no "Outstanding" page was invented; outstanding money is a dashboard panel and the Payments page's own metric. Active state = 2px accent rail + tinted row + bold text + accent icon (no large colour block); inactive rows stay muted. Denser rhythm (1px gaps, 9px rows), footer holds "View website" plus a compact user row with an icon-only sign-out. The mobile drawer gained its own close button; nav rows are 44px on phones.
- **Dashboard:** greeting header ("Good morning") with supporting line, search and the single primary action (Add Client). KPIs became one hairline-divided analytics strip — Clients / Follow-ups (today + overdue) / Events (upcoming + unpaid) / Owed (compact TZS, exact figure in the tooltip). Order is now Follow-ups → Outstanding payments → Upcoming events → Projects starting soon → Client pipeline (full width) → Website enquiries. No charts, trends or invented comparisons.
- **New Outstanding payments panel:** lists who owes what (client, project/event, balance, status) — the rows behind the "Owed" total, largest first. This needed one additive read-only query in `GET /api/admin/crm/dashboard` (`outstanding[]`, existing columns only); no response field was changed or removed.
- **Website leads** kept, moved below the CRM and shown in the same metric strip; the old Quick Actions / Lead Overview panels were duplicates of those links and numbers, so they are represented by the (clickable) tiles instead.
- **Consistency:** the Payments page uses the same metric strip; dead `.admin-stat-*` / `.admin-grid-panels` CSS removed. Radius stays 2–4px admin-wide; the public site is unchanged (verified: 9999px buttons, 20px cards).

Verification: lint back to the 52-problem baseline, build passes, API 86/86 unaffected; headless Chrome sweep over 14 routes at 320/360/375/390/412/430/768/1024/1280/1440 — body scroll width = viewport everywhere, no clipping, no small touch targets, no radius > 4px, no console errors; all five mobile flows still pass; mobile drawer opens/closes and fits at 320px.

---

## 12. Light/dark theme + expense & profit tracking (18–19 Sep 2026)

### Theme
- Topbar switch (Feather sun/moon icon + "Light"/"Dark" label; icon-only on phones). The button shows the theme it switches **to**.
- **Default is dark** — the admin's existing look (the brief assumed the current look was light). One-line change: `DEFAULT_THEME` in `src/hooks/useAdminTheme.js`.
- Persisted in `localStorage` as `clix_admin_theme` (no backend preference system existed). Survives refresh and sign-out/sign-in; the login screen follows it.
- Implemented as semantic tokens in `admin.css` (`--admin-bg/surface/surface-2/raised/line/line-strong/text/text-2/text-muted`, `--tone-green|cyan|amber|red` + `-bg`/`-border`). Dark values are the defaults; `html[data-admin-theme="light"]` swaps them. 164 hard-coded colours in `admin.css`/`crm.css` were migrated to tokens; none remain. The shared variables.css names (`--bg`, `--text-primary`, …) are mapped onto the tokens **inside admin scopes only**, so the public site is untouched (verified). Light mode hides the public site's dark decorations and neon cursor while an admin screen is open; the attribute is removed when admin unmounts.

### Expenses (money OUT — never mixed with client payments, money IN)
- New table `expenses` (DECIMAL(14,2) amount; type `project`/`general`; category; date; optional method/vendor/reference/notes; optional client_id / project_id / cardhub_event_id with RESTRICT FKs; void fields; recorded_by). DB CHECKs: amount > 0; general ⇒ no links; project ⇒ client required; never both project and event. App also rejects a project/event belonging to a different client.
- Categories: API / Service, SMS, Hosting / Server, Domain, Software / Tools, Payment Fees, Cloud Services, Design / Assets, Printing, Transport, Marketing, Equipment, Internet, Other.
- Endpoints (admin auth): `GET/POST /api/admin/expenses`, `GET/PUT /api/admin/expenses/:id`, `POST /api/admin/expenses/:id/void`, `GET /api/admin/expenses-summary`. List supports type, category, client, project, event, date range, search, include_voided, pagination; returns headline totals + by-category totals.
- Voids keep the record (reason, time, admin) and drop it from every total; voided expenses cannot be edited.
- Existing detail endpoints gained additive fields only: client `summary.costs`, `summary.collected_profit`, `expenses[]`; project and CardHub event `money{contract_value, collected, outstanding, costs, collected_profit, contract_margin}` + `expenses[]`; dashboard `money{…}`.

### Profit rules (as implemented)
- Revenue = payments actually received. Outstanding = price − received (never profit).
- Project/event/client **profit so far** = received − linked costs. **Contract margin** = price − costs, shown only as "if paid in full".
- General business costs are never charged to a client; the dashboard reports project vs general costs separately and **Profit so far = all revenue received − all expenses**.
- Verified with the brief's dataset: price 1,500,000 · paid 1,000,000 · project costs 250,000 · general 100,000 → outstanding 500,000, project profit 750,000, general kept out of the client's figures; business cash result = revenue − (250,000 + 100,000). CardHub: 500,000 paid − (80,000 + 30,000 + 20,000) = 370,000.

### UI
- Sidebar Finance: Payments, **Expenses**. New Expenses page: Total / This month / Project costs / General costs strip, "Where the money went" breakdown (click to filter), type tabs, filters behind [Filter] on phones, table on desktop / cards on mobile, Edit and Void.
- Add Expense: what / amount / date / type / category; client + project/event only for project costs; method, vendor, reference, notes under "Add more details". Date defaults to today; amount, category and client are never guessed.
- Project modal, CardHub event and client **Money** tab: Price · Paid · Outstanding · Costs · Profit so far, with Swahili helpers, plus "Costs out" lists and Add Expense. Dashboard gained a **Money** strip: Revenue received · Expenses · Outstanding · Profit so far.

### Verification
86/86 existing API tests + 45/45 new expense/profit tests; lint at the 52-problem baseline; build passes. Headless Chrome: theme toggles, persists across refresh and login, and leaves the public site unchanged; expense flows (general, project from project modal, void restores profit, client money summary, dashboard money) pass; both themes swept on 12 routes × 10 widths (320–1440) — no page overflow, clipping, radius > 4px, low-contrast text, or console errors on any CRM page. Only pre-existing Contacts/Quotes controls are under 40px on phones (not changed here).

---

## 13. Final polish (19 Sep 2026)

- **Custom cursor removed from the admin.** `<CustomCursor />` is now mounted only in the public-site branch of `App.jsx`, so no admin screen (dashboard, CRM pages, login, modals, bottom sheets) creates the cursor dot/ring, the touch glow, or any `mousemove`/`mouseover` listener. The global `cursor: none` rules in `global.css` now apply only while the public cursor is actually running (`body.has-custom-cursor`), so the admin always shows the browser's normal cursor, with `pointer` on buttons, links and selects and a text cursor in inputs. The public website still has its custom cursor, unchanged.
- **Light is the default theme** for anyone who has never chosen one (`DEFAULT_THEME = 'light'`). A saved `clix_admin_theme` choice always wins; the theme is applied before first paint, so there is no dark flash.
- **Contacts / Quotes / Newsletter on phones and touch screens:** search and filter fields 44px (16px text, no iOS zoom), row actions at least 40×40px, pagination 44px. Mouse-driven desktop sizes are unchanged. Their tables still scroll inside their own card on phones, as before.
- Verified: API 86/86 + 45/45; lint at the 52-problem baseline; build passes. In the browser: 12 admin pages + login + modals have 0 cursor elements, 0 `mousemove` listeners and `cursor: auto`; SPA navigation from the public site into the admin tears the cursor down completely; a first-time visitor gets Light; Dark persists across refresh and login; both themes swept on 13 pages × 10 widths with no page overflow, clipping, radius > 4px, low contrast or console errors.
