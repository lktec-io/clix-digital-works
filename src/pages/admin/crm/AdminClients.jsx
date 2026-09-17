import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { dueInfo, formatDate, formatMonth, formatTZS, hasBalance, qs } from '../../../utils/crm';
import { Badge, DataView, FilterTabs, Pagination, SearchBox, Select, Toolbar } from '../../../components/admin/crm/ui';
import ClientForm from '../../../components/admin/crm/ClientForm';
import { FollowUpForm } from '../../../components/admin/crm/forms';

const LIMIT = 20;

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'next_follow_up', label: 'Next follow-up' },
  { value: 'last_contacted', label: 'Last contacted' },
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
  const activeFilters = [f.source, f.priority, f.archived, f.sort !== 'newest' ? f.sort : ''].filter(Boolean).length;
  const filtered = Boolean(f.search || f.status || activeFilters);

  const title = isCardhub ? 'CardHub Customers' : 'Clients';
  const addLabel = isCardhub ? 'Add Customer' : 'Add Client';
  const onSaved = id => { close(); navigate(`/admin/clients/${id}`); };

  const followUp = c => {
    if (!c.next_follow_up_date || !today) return null;
    const due = dueInfo(c.next_follow_up_date, today);
    return <span className={`crm-text-${due.tone} crm-nowrap`}>{due.tone === 'muted' ? formatDate(c.next_follow_up_date) : due.label}</span>;
  };
  const needs = c => (isCardhub
    ? (c.next_event_date ? `Next event ${formatDate(c.next_event_date)}` : `${c.events_count} event${c.events_count === 1 ? '' : 's'}`)
    : c.interested_service);

  const addButton = (
    <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('client')}>
      <FiPlus size={14} aria-hidden="true" /> {addLabel}
    </button>
  );

  return (
    <AdminLayout title={title}>
      <div className="crm-page-head">
        <div>
          <h2>{title}</h2>
          <p>{isCardhub
            ? 'People with CardHub events. They are the same records as in Clients.'
            : 'Manage all Clix customers and prospects.'}</p>
        </div>
        <div className="crm-page-actions">
          {isCardhub && (
            <Link className="crm-btn crm-btn-ghost" to="/admin/cardhub/events?new=1"><FiCalendar size={14} aria-hidden="true" /> Add Event</Link>
          )}
          {addButton}
        </div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={tabs} value={f.status} onChange={status => update({ status })} counts={counts} label="Client status" />

        <Toolbar
          activeCount={activeFilters}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search client, phone or email…" label="Search clients" />}
        >
          <Select aria-label="How they found us" value={f.source} onChange={source => update({ source })} options={options?.client_sources} placeholder="Any source" />
          <Select aria-label="Priority" value={f.priority} onChange={priority => update({ priority })} options={options?.priorities} placeholder="Any priority" />
          <Select aria-label="Sort" value={f.sort} onChange={sort => update({ sort })} options={SORTS} />
          {!isCardhub && (
            <label className="crm-check">
              <input type="checkbox" checked={f.archived === '1'} onChange={e => update({ archived: e.target.checked ? '1' : '' })} />
              Show archived
            </label>
          )}
        </Toolbar>

        <DataView
          loading={loading}
          error={error}
          data={data}
          isEmpty={!rows.length}
          what="clients"
          onRetry={reload}
          empty={filtered ? 'No clients match your search or filters.' : isCardhub ? 'No CardHub customers yet.' : 'No clients yet.'}
          emptySw={filtered ? undefined : 'Anza kwa kuongeza mteja wako wa kwanza.'}
          emptyAction={filtered
            ? <button type="button" className="crm-btn crm-btn-ghost" onClick={() => update({ search: '', status: '', source: '', priority: '', archived: '', sort: 'newest' })}>Clear filters</button>
            : addButton}
          cols={5}
        >
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>{isCardhub ? 'Events' : 'Needs'}</th>
                  <th>Next follow-up</th>
                  <th>Balance</th>
                  <th className="crm-col-optional"><span className="crm-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id}>
                    <td className="crm-wrap">
                      <Link className="crm-cell-main crm-cell-link" to={`/admin/clients/${c.id}`}>{c.full_name}</Link>
                      <div className="crm-cell-sub">{[c.phone, c.company || c.city].filter(Boolean).join(' · ') || '—'}</div>
                    </td>
                    <td>
                      <Badge value={c.status} options={options?.client_statuses} />
                      {c.priority === 'high' && <div className="crm-cell-sub crm-text-red">High priority</div>}
                    </td>
                    <td className="crm-wrap">
                      {needs(c) || <span className="crm-muted">—</span>}
                      {!isCardhub && c.expected_start_date && <div className="crm-cell-sub">Start {formatMonth(c.expected_start_date)}</div>}
                    </td>
                    <td>{followUp(c) || <span className="crm-muted">—</span>}</td>
                    <td className={`crm-money ${hasBalance(c.balance) ? 'crm-text-amber' : 'crm-muted'}`}>
                      {hasBalance(c.balance) ? formatTZS(c.balance) : '—'}
                    </td>
                    <td className="crm-col-optional">
                      {!c.archived_at && (
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('followup', c)}>
                          <FiCalendar size={12} aria-hidden="true" /> Follow-up
                        </button>
                      )}
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
                {(c.phone || needs(c)) && (
                  <div className="crm-card-meta">
                    {c.phone && <a href={`tel:${c.phone}`} className="crm-tel">{c.phone}</a>}
                    {needs(c) && <span>{needs(c)}</span>}
                  </div>
                )}
                {(followUp(c) || hasBalance(c.balance)) && (
                  <div className="crm-card-meta">
                    {followUp(c) && <span>Follow-up: {followUp(c)}</span>}
                    {hasBalance(c.balance) && <span>Owes <span className="crm-text-amber">{formatTZS(c.balance)}</span></span>}
                  </div>
                )}
                <div className="crm-card-actions">
                  {!c.archived_at && (
                    <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('followup', c)}>
                      <FiCalendar size={13} aria-hidden="true" /> Add Follow-up
                    </button>
                  )}
                  <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={`/admin/clients/${c.id}`}>View</Link>
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
