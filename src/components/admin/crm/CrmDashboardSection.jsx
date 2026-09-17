import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiCalendar, FiGift, FiDollarSign, FiSearch, FiPlus, FiArrowRight } from 'react-icons/fi';
import { API, apiFetch } from '../../../config/api';
import { useApi, useCrmOptions, useDebounced, useDialog, useSessionGuard } from '../../../hooks/useCrm';
import { formatDate, formatTZS, labelFor, qs } from '../../../utils/crm';
import { EmptyState, ErrorState, LoadingState, PanelHeader } from './ui';
import { EventRow, FollowUpDialogs, FollowUpRow } from './lists';
import ClientForm from './ClientForm';

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

function Kpi({ to, label, value, sub, subTone, icon: Icon, color, money }) {
  return (
    <Link to={to} className="admin-stat-card crm-kpi" style={{ '--s-color': color }}>
      <div className="admin-stat-icon"><Icon size={18} aria-hidden="true" /></div>
      <div className="admin-stat-label">{label}</div>
      <div className={`admin-stat-value${money ? ' crm-kpi-money' : ''}`}>{value}</div>
      {sub && <div className={`admin-stat-sub${subTone ? ` crm-text-${subTone}` : ''}`}>{sub}</div>}
    </Link>
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
        placeholder="Search client, phone, event or payment…"
        aria-label="Search clients, phones, events and payments"
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
          {r && !state.loading && total === 0 && <div className="crm-search-empty">Nothing found for “{term.trim()}”.</div>}
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
              <h4>Payments</h4>
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
 * CRM + CardHub section of the existing admin dashboard. It answers only:
 * who to follow up, what is overdue, which events are close, what is owed and
 * which projects are coming. Every number comes from GET /api/admin/crm/dashboard;
 * the section loads independently of the website-lead stats above it.
 */
export default function CrmDashboardSection() {
  const navigate = useNavigate();
  const { options } = useCrmOptions();
  const { data, loading, error, reload } = useApi(API.crmDashboard);
  const { dialog, open, close } = useDialog();

  const header = (
    <div className="crm-dash-section-title">
      <h2>Clients & CardHub</h2>
      <CrmSearch />
      <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('client')}>
        <FiPlus size={14} aria-hidden="true" /> Add Client
      </button>
    </div>
  );

  const clientDialog = dialog?.type === 'client' && (
    <ClientForm options={options} onClose={close} onSaved={id => { close(); navigate(`/admin/clients/${id}`); }} />
  );

  if (!data) {
    return (
      <>
        {header}
        {error ? <div className="crm-panel"><ErrorState error={error} what="the client overview" onRetry={reload} /></div>
          : loading && <div className="crm-panel"><LoadingState rows={4} cols={4} /></div>}
        {clientDialog}
      </>
    );
  }

  const k = data.kpis;
  const today = data.today;
  const w = data.windows;
  const { overdue, today: dueToday } = data.follow_ups;
  const pipelineTotal = Object.values(data.pipeline).reduce((a, b) => a + b, 0);
  const pipelineStatuses = (options?.client_statuses || []).filter(s => s.value !== 'inactive');

  return (
    <>
      {header}

      <div className="admin-stats">
        <Kpi to="/admin/clients" label="Clients" icon={FiUsers} color="#39FF14" value={k.total_clients}
          sub={plural(k.prospects, 'prospect')} />
        <Kpi to={k.follow_ups_overdue ? '/admin/follow-ups?view=overdue' : '/admin/follow-ups'}
          label="Follow up today" icon={FiCalendar} color={k.follow_ups_overdue ? '#ff6b6b' : '#39FF14'}
          value={k.follow_ups_today}
          sub={k.follow_ups_overdue ? `${k.follow_ups_overdue} overdue` : 'Nothing overdue'}
          subTone={k.follow_ups_overdue ? 'red' : undefined} />
        <Kpi to="/admin/cardhub/upcoming?view=next_30" label={`Events in ${w.event_days} days`} icon={FiGift} color="#FFA500"
          value={k.upcoming_events}
          sub={k.upcoming_events_with_balance ? `${k.upcoming_events_with_balance} with balance due` : 'All paid up'} />
        <Kpi to="/admin/payments" label="Outstanding" icon={FiDollarSign} color="#00E5FF" money
          value={formatTZS(k.outstanding_balance, 'TZS 0')}
          sub={k.outstanding_items ? `${plural(k.outstanding_items, 'project or event', 'projects & events')} unpaid` : 'Nothing owed'} />
      </div>

      <div className="crm-dash-grid">
        <div className="crm-panel crm-span-2">
          <PanelHeader title="Follow up">
            <Link className="crm-btn crm-btn-ghost crm-btn-sm" to="/admin/follow-ups">All follow-ups</Link>
          </PanelHeader>
          {overdue.length === 0 && dueToday.length === 0 ? (
            <EmptyState sw="Kwa sasa huna mteja wa kumfuatilia leo.">No follow-ups today.</EmptyState>
          ) : (
            <>
              {overdue.length > 0 && (
                <>
                  <div className="crm-group-heading crm-text-red">Overdue ({k.follow_ups_overdue})</div>
                  <ul className="crm-rows">{overdue.map(x => <FollowUpRow key={x.id} item={x} today={today} onAction={open} />)}</ul>
                </>
              )}
              {dueToday.length > 0 && (
                <>
                  <div className="crm-group-heading">Today ({k.follow_ups_today})</div>
                  <ul className="crm-rows">{dueToday.map(x => <FollowUpRow key={x.id} item={x} today={today} onAction={open} />)}</ul>
                </>
              )}
            </>
          )}
          {k.follow_ups_upcoming > 0 && (
            <Link className="crm-panel-foot-link" to="/admin/follow-ups?view=upcoming">
              {plural(k.follow_ups_upcoming, 'more follow-up')} in the next {w.follow_up_days} days <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          )}
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
                    <div className="crm-row-sub crm-text-cyan">Starts {formatDate(p.expected_start_date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState>No projects starting in the next {w.project_days} days.</EmptyState>}
        </div>
      </div>

      <div className="crm-dash-grid">
        <div className="crm-panel crm-span-2">
          <PanelHeader title={`CardHub events — next ${w.event_days} days`}>
            <Link className="crm-btn crm-btn-ghost crm-btn-sm" to="/admin/cardhub/upcoming">All events</Link>
          </PanelHeader>
          {data.upcoming_events.length
            ? <ul className="crm-rows">{data.upcoming_events.map(e => <EventRow key={e.id} event={e} options={options} today={today} />)}</ul>
            : <EmptyState sw="Hakuna tukio linalokuja ndani ya siku 30.">No upcoming CardHub events.</EmptyState>}
        </div>

        <div className="crm-panel">
          <PanelHeader title="Client pipeline" />
          <ul className="crm-pipeline">
            {pipelineStatuses.map(s => {
              const count = data.pipeline[s.value] || 0;
              return (
                <li key={s.value}>
                  <Link to={`/admin/clients?status=${s.value}`}>
                    <div className="crm-pipeline-top"><span>{s.label}</span><strong>{count}</strong></div>
                    <div className="crm-pipeline-bar" aria-hidden="true"><span style={{ width: `${pipelineTotal ? (count / pipelineTotal) * 100 : 0}%` }} /></div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {clientDialog}
      <FollowUpDialogs dialog={dialog} close={close} options={options} onChanged={reload} />
    </>
  );
}
