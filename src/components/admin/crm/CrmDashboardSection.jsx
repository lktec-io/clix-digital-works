import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiBriefcase, FiCalendar, FiGift, FiAlertTriangle, FiClock, FiDollarSign, FiPlayCircle, FiSearch,
} from 'react-icons/fi';
import { API, apiFetch } from '../../../config/api';
import { useApi, useCrmOptions, useDebounced, useDialog, useSessionGuard } from '../../../hooks/useCrm';
import { formatDate, formatTZS, labelFor, qs } from '../../../utils/crm';
import { EmptyState, ErrorState, LoadingState, PanelHeader } from './ui';
import { EventRow, FollowUpDialogs, FollowUpRow } from './lists';

function Kpi({ to, label, value, sub, icon: Icon, color }) {
  return (
    <Link to={to} className="admin-stat-card crm-kpi" style={{ '--s-color': color }}>
      <div className="admin-stat-icon"><Icon size={18} /></div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </Link>
  );
}

function FollowUpPanel({ title, items, total, today, empty, to, onAction }) {
  return (
    <div className="crm-panel">
      <PanelHeader title={`${title} (${total})`}>
        {total > items.length && <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={to}>View all</Link>}
      </PanelHeader>
      {items.length
        ? <ul className="crm-rows">{items.map(x => <FollowUpRow key={x.id} item={x} today={today} onAction={onAction} />)}</ul>
        : <EmptyState>{empty}</EmptyState>}
    </div>
  );
}

/** Global CRM search: clients, projects, CardHub events and payment references. */
function CrmSearch() {
  const [term, setTerm] = useState('');
  const [state, setState] = useState({ results: null, loading: false, error: null });
  const [openList, setOpenList] = useState(false);
  const q = useDebounced(term.trim(), 350);
  const guard = useSessionGuard();
  const boxRef = useRef(null);

  useEffect(() => {
    if (q.length < 2) return undefined;
    let alive = true;
    apiFetch(`${API.crmSearch}${qs({ q })}`)
      .then(results => { if (alive) setState({ results, loading: false, error: null }); })
      .catch(err => { if (alive && !guard(err)) setState({ results: null, loading: false, error: err }); });
    return () => { alive = false; };
  }, [q, guard]);

  useEffect(() => {
    const onDown = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpenList(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const r = state.results;
  const total = r ? r.clients.length + r.projects.length + r.events.length + r.payments.length : 0;
  const show = openList && term.trim().length >= 2;
  const close = () => { setOpenList(false); setTerm(''); };

  return (
    <div className="crm-search" ref={boxRef}>
      <FiSearch className="crm-search-icon" size={15} aria-hidden="true" />
      <input
        type="search"
        className="crm-input"
        placeholder="Search clients, phones, projects, events, references…"
        aria-label="Search CRM"
        value={term}
        onChange={e => {
          setTerm(e.target.value);
          setOpenList(true);
          if (e.target.value.trim().length >= 2) setState(s => ({ ...s, loading: true }));
        }}
        onFocus={() => setOpenList(true)}
        onKeyDown={e => { if (e.key === 'Escape') setOpenList(false); }}
      />
      {show && (
        <div className="crm-search-results">
          {state.loading && !r && <div className="crm-search-empty">Searching…</div>}
          {state.error && <div className="crm-search-empty">Search failed. Please try again.</div>}
          {r && !state.loading && total === 0 && <div className="crm-search-empty">No results for “{term.trim()}”.</div>}
          {r && r.clients.length > 0 && (
            <div className="crm-search-group">
              <h4>Clients</h4>
              {r.clients.map(c => (
                <Link key={c.id} className="crm-search-item" to={`/admin/clients/${c.id}`} onClick={close}>
                  {c.full_name}<small>{[c.phone, c.email, c.company, c.archived_at && 'archived'].filter(Boolean).join(' · ')}</small>
                </Link>
              ))}
            </div>
          )}
          {r && r.projects.length > 0 && (
            <div className="crm-search-group">
              <h4>Projects</h4>
              {r.projects.map(p => (
                <Link key={p.id} className="crm-search-item" to={`/admin/clients/${p.client_id}?tab=projects`} onClick={close}>
                  {p.project_name}<small>{p.client_name}</small>
                </Link>
              ))}
            </div>
          )}
          {r && r.events.length > 0 && (
            <div className="crm-search-group">
              <h4>CardHub events</h4>
              {r.events.map(e => (
                <Link key={e.id} className="crm-search-item" to={`/admin/cardhub/events/${e.id}`} onClick={close}>
                  {e.event_name}<small>{[e.client_name, e.event_date && formatDate(e.event_date)].filter(Boolean).join(' · ')}</small>
                </Link>
              ))}
            </div>
          )}
          {r && r.payments.length > 0 && (
            <div className="crm-search-group">
              <h4>Payment references</h4>
              {r.payments.map(p => (
                <Link key={p.id} className="crm-search-item" to={`/admin/clients/${p.client_id}?tab=payments`} onClick={close}>
                  {p.reference} · {formatTZS(p.amount)}<small>{p.client_name} · {formatDate(p.payment_date)}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CRM + CardHub widgets for the existing admin dashboard. Every number comes
 * from GET /api/admin/crm/dashboard; this section loads independently, so a
 * CRM failure never affects the existing website-lead stats above it.
 */
export default function CrmDashboardSection() {
  const { options } = useCrmOptions();
  const { data, loading, error, reload } = useApi(API.crmDashboard);
  const { dialog, open, close } = useDialog();

  const header = (
    <div className="crm-dash-section-title">
      <h2>Clients & CardHub</h2>
      <CrmSearch />
    </div>
  );

  if (!data) {
    return (
      <>
        {header}
        {error ? <div className="crm-panel"><ErrorState error={error} what="CRM overview" onRetry={reload} /></div>
          : loading && <div className="crm-panel"><LoadingState rows={4} cols={4} /></div>}
      </>
    );
  }

  const k = data.kpis;
  const today = data.today;
  const w = data.windows;

  const alerts = [
    k.follow_ups_overdue > 0 && { tone: 'red', icon: FiAlertTriangle, to: '/admin/follow-ups?view=overdue',
      text: `${k.follow_ups_overdue} overdue follow-up${k.follow_ups_overdue === 1 ? '' : 's'}` },
    k.follow_ups_today > 0 && { tone: 'green', icon: FiClock, to: '/admin/follow-ups',
      text: `${k.follow_ups_today} follow-up${k.follow_ups_today === 1 ? '' : 's'} due today` },
    k.upcoming_events_with_balance > 0 && { tone: 'amber', icon: FiGift, to: '/admin/cardhub/upcoming?view=next_30',
      text: `${k.upcoming_events_with_balance} CardHub event${k.upcoming_events_with_balance === 1 ? '' : 's'} in the next ${w.event_days} days with a balance due` },
    Number(k.outstanding_balance) > 0 && { tone: 'amber', icon: FiDollarSign, to: '/admin/payments',
      text: `${formatTZS(k.outstanding_balance)} outstanding across ${k.outstanding_items} project${k.outstanding_items === 1 ? '' : 's'} / event${k.outstanding_items === 1 ? '' : 's'}` },
    k.projects_starting_soon > 0 && { tone: 'cyan', icon: FiPlayCircle, to: '/admin/projects?sort=start',
      text: `${k.projects_starting_soon} project${k.projects_starting_soon === 1 ? '' : 's'} expected to start within ${w.project_days} days` },
  ].filter(Boolean);

  const pipelineTotal = Object.values(data.pipeline).reduce((a, b) => a + b, 0);
  const pipelineStatuses = (options?.client_statuses || []).filter(s => s.value !== 'inactive');

  return (
    <>
      {header}

      {alerts.length > 0 && (
        <div className="crm-alerts" aria-label="Needs attention">
          {alerts.map(a => (
            <Link key={a.text} to={a.to} className={`crm-alert crm-alert-${a.tone}`}>
              <a.icon size={15} aria-hidden="true" /><span>{a.text}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="admin-stats">
        <Kpi to="/admin/clients" label="Total Clients" icon={FiUsers} color="#39FF14" value={k.total_clients}
          sub={`${k.prospects} prospect${k.prospects === 1 ? '' : 's'} · ${k.clients_added_last_30} new in 30 days`} />
        <Kpi to="/admin/projects?status=in_progress" label="Active Projects" icon={FiBriefcase} color="#00E5FF" value={k.active_projects}
          sub={`${k.projects_starting_soon} starting within ${w.project_days} days`} />
        <Kpi to="/admin/follow-ups" label="Follow-ups Today" icon={FiCalendar} color={k.follow_ups_overdue ? '#ff6b6b' : '#39FF14'} value={k.follow_ups_today}
          sub={`${k.follow_ups_overdue} overdue · ${k.follow_ups_upcoming} upcoming`} />
        <Kpi to="/admin/cardhub/upcoming?view=next_30" label="Upcoming CardHub Events" icon={FiGift} color="#FFA500" value={k.upcoming_events}
          sub={`Next ${w.event_days} days`} />
      </div>

      <div className="crm-dash-grid">
        <FollowUpPanel title="Follow-ups today" items={data.follow_ups.today} total={k.follow_ups_today} today={today}
          empty="No follow-ups today." to="/admin/follow-ups?view=today" onAction={open} />
        <FollowUpPanel title="Overdue" items={data.follow_ups.overdue} total={k.follow_ups_overdue} today={today}
          empty="Nothing overdue." to="/admin/follow-ups?view=overdue" onAction={open} />
        <FollowUpPanel title="Upcoming" items={data.follow_ups.upcoming} total={k.follow_ups_upcoming} today={today}
          empty={`Nothing in the next ${w.follow_up_days} days.`} to="/admin/follow-ups?view=upcoming" onAction={open} />
      </div>

      <div className="crm-dash-grid">
        <div className="crm-panel crm-span-2">
          <PanelHeader title={`CardHub events — next ${w.event_days} days`}>
            <Link className="crm-btn crm-btn-ghost crm-btn-sm" to="/admin/cardhub/upcoming">All upcoming</Link>
          </PanelHeader>
          {data.upcoming_events.length
            ? <ul className="crm-rows">{data.upcoming_events.map(e => <EventRow key={e.id} event={e} options={options} today={today} />)}</ul>
            : <EmptyState>No upcoming CardHub events.</EmptyState>}
        </div>

        <div className="crm-stack">
          <div className="crm-panel">
            <PanelHeader title="Client pipeline" />
            <ul className="crm-pipeline">
              {pipelineStatuses.map(s => {
                const count = data.pipeline[s.value] || 0;
                return (
                  <li key={s.value}>
                    <Link to={`/admin/clients?status=${s.value}`}>
                      <div className="crm-pipeline-top"><span>{s.label}</span><strong>{count}</strong></div>
                      <div className="crm-pipeline-bar"><span style={{ width: `${pipelineTotal ? (count / pipelineTotal) * 100 : 0}%` }} /></div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="crm-panel">
            <PanelHeader title="Projects starting soon" />
            {data.projects_starting.length ? (
              <ul className="crm-rows">
                {data.projects_starting.map(p => (
                  <li key={p.id} className="crm-row">
                    <div className="crm-row-main">
                      <Link className="crm-row-title" to={`/admin/clients/${p.client_id}?tab=projects`}>{p.project_name}</Link>
                      <div className="crm-row-sub">{p.client_name} · {labelFor(options?.project_statuses, p.status)}</div>
                    </div>
                    <div className="crm-row-side"><span className="crm-countdown crm-text-cyan">{formatDate(p.expected_start_date)}</span></div>
                  </li>
                ))}
              </ul>
            ) : <EmptyState>No projects starting in the next {w.project_days} days.</EmptyState>}
          </div>
        </div>
      </div>

      <FollowUpDialogs dialog={dialog} close={close} options={options} onChanged={reload} />
    </>
  );
}
