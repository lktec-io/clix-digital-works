import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { dueInfo, formatDate, formatMonth, formatTZS, hasBalance, labelFor, qs } from '../../../utils/crm';
import { Badge, DataView, FilterTabs, Pagination, SearchBox, Select } from '../../../components/admin/crm/ui';
import ClientForm from '../../../components/admin/crm/ClientForm';
import { FollowUpForm } from '../../../components/admin/crm/forms';

const LIMIT = 20;

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'next_follow_up', label: 'Next follow-up' },
  { value: 'last_contacted', label: 'Last contacted' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name A–Z' },
];

/**
 * Clients list. `mode="cardhub"` renders the CardHub Customers view: the
 * same client records, scoped to people with CardHub events, so a customer is
 * never duplicated between the two modules.
 */
export default function AdminClients({ mode = 'clients' }) {
  const isCardhub = mode === 'cardhub';
  const navigate = useNavigate();
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ search: '', status: '', source: '', priority: '', city: '', sort: 'newest', archived: '' });
  const { dialog, open, close } = useDialog();

  const view = isCardhub ? 'cardhub' : f.archived === '1' ? 'archived' : 'active';
  const url = `${API.clients}${qs({
    view, search: f.search, status: f.status, source: f.source, priority: f.priority, city: f.city,
    sort: f.sort, page: f.page, limit: LIMIT,
  })}`;
  const { data, loading, error, reload } = useApi(url);
  const rows = data?.data || [];
  const today = options?.today;

  const tabs = [{ value: '', label: 'All' }, ...(options?.client_statuses || [])];
  const counts = data?.status_counts ? { ...data.status_counts, '': data.status_counts.all } : null;

  const title = isCardhub ? 'CardHub Customers' : 'Clients';
  const onSaved = id => { close(); navigate(`/admin/clients/${id}`); };

  const followUpCell = c => {
    if (!c.next_follow_up_date || !today) return <span className="crm-muted">—</span>;
    const due = dueInfo(c.next_follow_up_date, today);
    return <span className={`crm-text-${due.tone} crm-nowrap`}>{due.label}</span>;
  };

  return (
    <AdminLayout title={title}>
      <div className="crm-page-head">
        <div>
          <h2>{title}</h2>
          <p>{isCardhub
            ? 'Clients with CardHub events. Customers are shared with the Clients module.'
            : 'Leads, prospects and active clients in one place.'}</p>
        </div>
        <div className="crm-page-actions">
          {isCardhub && (
            <Link className="crm-btn crm-btn-ghost" to="/admin/cardhub/events?new=1"><FiCalendar size={14} /> New event</Link>
          )}
          <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('client')}>
            <FiPlus size={14} /> {isCardhub ? 'New customer' : 'New client'}
          </button>
        </div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={tabs} value={f.status} onChange={status => update({ status })} counts={counts} label="Client status" />

        <div className="crm-toolbar">
          <SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Name, phone, email, company…" />
          <Select aria-label="Source" value={f.source} onChange={source => update({ source })} options={options?.client_sources} placeholder="All sources" />
          <Select aria-label="Priority" value={f.priority} onChange={priority => update({ priority })} options={options?.priorities} placeholder="Any priority" />
          <Select aria-label="Sort" value={f.sort} onChange={sort => update({ sort })} options={SORTS} />
          {!isCardhub && (
            <label className="crm-check">
              <input type="checkbox" checked={f.archived === '1'} onChange={e => update({ archived: e.target.checked ? '1' : '' })} />
              Archived
            </label>
          )}
        </div>

        <DataView
          loading={loading}
          error={error}
          data={data}
          isEmpty={!rows.length}
          what="clients"
          onRetry={reload}
          empty={f.search || f.status || f.source || f.priority
            ? 'No clients match these filters.'
            : isCardhub ? 'No CardHub customers yet.' : 'No clients found.'}
          cols={6}
        >
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>{isCardhub ? 'Next event' : 'Service'}</th>
                  <th>Next follow-up</th>
                  <th className="crm-col-optional">{isCardhub ? 'Events' : 'Projects'}</th>
                  <th>Balance</th>
                  <th className="crm-col-optional" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id}>
                    <td className="crm-wrap">
                      <Link className="crm-cell-main" to={`/admin/clients/${c.id}`} style={{ textDecoration: 'none' }}>{c.full_name}</Link>
                      <div className="crm-cell-sub">{[c.phone, c.company || c.city].filter(Boolean).join(' · ') || '—'}</div>
                    </td>
                    <td>
                      <Badge value={c.status} options={options?.client_statuses} />
                      {c.priority === 'high' && <div style={{ marginTop: 4 }}><Badge value="high" label="High" /></div>}
                    </td>
                    <td className="crm-wrap">
                      {isCardhub
                        ? (c.next_event_date ? formatDate(c.next_event_date) : <span className="crm-muted">—</span>)
                        : (
                          <>
                            {c.interested_service || <span className="crm-muted">—</span>}
                            {c.expected_start_date && <div className="crm-cell-sub">Start {formatMonth(c.expected_start_date)}</div>}
                          </>
                        )}
                    </td>
                    <td>{followUpCell(c)}</td>
                    <td className="crm-col-optional">{isCardhub ? c.events_count : c.projects_count}</td>
                    <td className={`crm-money ${hasBalance(c.balance) ? 'crm-text-amber' : 'crm-muted'}`}>
                      {hasBalance(c.balance) ? formatTZS(c.balance) : '—'}
                    </td>
                    <td className="crm-col-optional">
                      <div className="crm-row-actions">
                        <Link className="action-btn action-btn-status" to={`/admin/clients/${c.id}`} title="View"><FiEye size={12} /></Link>
                        {!c.archived_at && (
                          <button type="button" className="action-btn action-btn-status" title="Add follow-up" onClick={() => open('followup', c)}>
                            <FiCalendar size={12} />
                          </button>
                        )}
                        <Link className="action-btn action-btn-status" to={`/admin/clients/${c.id}?tab=notes`} title="Add note"><FiMessageSquare size={12} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="crm-card-list">
            {rows.map(c => (
              <li key={c.id} className="crm-card">
                <div className="crm-card-top">
                  <Link className="crm-card-title" to={`/admin/clients/${c.id}`}>{c.full_name}</Link>
                  <Badge value={c.status} options={options?.client_statuses} />
                </div>
                <div className="crm-card-meta">
                  {c.phone && <a href={`tel:${c.phone}`} style={{ color: 'inherit' }}>{c.phone}</a>}
                  {c.company && <span>{c.company}</span>}
                  {!isCardhub && c.interested_service && <span>{c.interested_service}</span>}
                  {isCardhub && <span>{c.events_count} event{c.events_count === 1 ? '' : 's'}</span>}
                  {isCardhub && c.next_event_date && <span>Next {formatDate(c.next_event_date)}</span>}
                  <span>{labelFor(options?.client_sources, c.source)}</span>
                </div>
                {(c.next_follow_up_date || hasBalance(c.balance)) && (
                  <div className="crm-card-meta">
                    {c.next_follow_up_date && <span>Follow-up: {followUpCell(c)}</span>}
                    {hasBalance(c.balance) && <span>Balance <span className="crm-text-amber">{formatTZS(c.balance)}</span></span>}
                  </div>
                )}
                <div className="crm-card-actions">
                  <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={`/admin/clients/${c.id}`}><FiEye size={12} /> View</Link>
                  {!c.archived_at && (
                    <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('followup', c)}>
                      <FiCalendar size={12} /> Follow-up
                    </button>
                  )}
                  <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={`/admin/clients/${c.id}?tab=notes`}><FiMessageSquare size={12} /> Note</Link>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'client' && (
        <ClientForm
          options={options}
          initial={isCardhub ? { source: 'cardhub', status: 'confirmed' } : undefined}
          onClose={close}
          onSaved={onSaved}
        />
      )}
      {dialog?.type === 'followup' && (
        <FollowUpForm client={dialog.item} options={options} onClose={close} onSaved={() => { close(); reload(); }} />
      )}
    </AdminLayout>
  );
}
