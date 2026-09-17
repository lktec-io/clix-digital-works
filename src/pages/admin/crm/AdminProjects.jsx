import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { formatDate, formatTZS, hasBalance, qs } from '../../../utils/crm';
import { Badge, DataView, FilterTabs, Pagination, SearchBox, Select, Toolbar } from '../../../components/admin/crm/ui';
import { ProjectModal } from '../../../components/admin/crm/lists';
import { PaymentForm, ProjectForm } from '../../../components/admin/crm/forms';

const LIMIT = 20;
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'start', label: 'Start date' },
  { value: 'balance', label: 'Highest balance' },
  { value: 'name', label: 'Name A–Z' },
];

export default function AdminProjects() {
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ search: '', status: '', payment_status: '', sort: 'newest', archived: '' });
  const { dialog, open, close } = useDialog();

  const url = `${API.projects}${qs({
    search: f.search, status: f.status, payment_status: f.payment_status, sort: f.sort,
    view: f.archived === '1' ? 'archived' : 'active', page: f.page, limit: LIMIT,
  })}`;
  const { data, loading, error, reload } = useApi(url);
  const rows = data?.data || [];
  const done = () => { close(); reload(); };

  const tabs = [{ value: '', label: 'All' }, ...(options?.project_statuses || [])];
  const counts = data?.status_counts ? { ...data.status_counts, '': data.status_counts.all } : null;
  const activeFilters = [f.payment_status, f.archived, f.sort !== 'newest' ? f.sort : ''].filter(Boolean).length;
  const filtered = Boolean(f.search || f.status || activeFilters);

  const addButton = (
    <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('new')}>
      <FiPlus size={14} aria-hidden="true" /> Add Project
    </button>
  );
  const canPay = p => !p.archived_at && hasBalance(p.balance);

  return (
    <AdminLayout title="Projects">
      <div className="crm-page-head">
        <div>
          <h2>Projects</h2>
          <p>Systems, websites and apps for each client, with what is paid and what is owed.</p>
        </div>
        <div className="crm-page-actions">{addButton}</div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={tabs} value={f.status} onChange={status => update({ status })} counts={counts} label="Project status" />
        <Toolbar
          activeCount={activeFilters}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search project or client…" label="Search projects" />}
        >
          <Select aria-label="Payment" value={f.payment_status} onChange={v => update({ payment_status: v })} options={options?.payment_statuses} placeholder="Any payment" />
          <Select aria-label="Sort" value={f.sort} onChange={sort => update({ sort })} options={SORTS} />
          <label className="crm-check">
            <input type="checkbox" checked={f.archived === '1'} onChange={e => update({ archived: e.target.checked ? '1' : '' })} />
            Show archived
          </label>
        </Toolbar>

        <DataView
          loading={loading} error={error} data={data} isEmpty={!rows.length} what="projects" onRetry={reload}
          empty={filtered ? 'No projects match your search or filters.' : 'No projects yet.'}
          emptySw={filtered ? undefined : 'Ongeza project ya kwanza ya mteja.'}
          emptyAction={filtered
            ? <button type="button" className="crm-btn crm-btn-ghost" onClick={() => update({ search: '', status: '', payment_status: '', archived: '', sort: 'newest' })}>Clear filters</button>
            : addButton}
          cols={6}
        >
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th className="crm-col-optional">Paid</th>
                  <th>Balance</th>
                  <th className="crm-col-optional">Starts</th>
                  <th className="crm-col-optional"><span className="crm-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id}>
                    <td className="crm-wrap">
                      <button type="button" className="crm-link crm-cell-main" onClick={() => open('view', p)}>{p.project_name}</button>
                      <div className="crm-cell-sub"><Link className="crm-link" to={`/admin/clients/${p.client_id}`}>{p.client_name}</Link></div>
                    </td>
                    <td><Badge value={p.status} options={options?.project_statuses} /></td>
                    <td className="crm-money">{Number(p.total_price) > 0 ? formatTZS(p.total_price) : <span className="crm-muted">Not priced</span>}</td>
                    <td className="crm-money crm-col-optional">{Number(p.total_price) > 0 ? formatTZS(p.amount_paid, 'TZS 0') : '—'}</td>
                    <td className={`crm-money ${hasBalance(p.balance) ? 'crm-text-amber' : 'crm-muted'}`}>{hasBalance(p.balance) ? formatTZS(p.balance) : '—'}</td>
                    <td className="crm-nowrap crm-col-optional">{formatDate(p.expected_start_date)}</td>
                    <td className="crm-col-optional">
                      {canPay(p) && (
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('pay', p)}>Record Payment</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="crm-card-list">
            {rows.map(p => (
              <li key={p.id} className="crm-card">
                <div className="crm-card-top">
                  <button type="button" className="crm-link crm-card-title" onClick={() => open('view', p)}>{p.project_name}</button>
                  <Badge value={p.status} options={options?.project_statuses} />
                </div>
                <div className="crm-card-meta">
                  <Link className="crm-link" to={`/admin/clients/${p.client_id}`}>{p.client_name}</Link>
                  {p.expected_start_date && <span>Starts {formatDate(p.expected_start_date)}</span>}
                </div>
                {Number(p.total_price) > 0 && (
                  <dl className="crm-mini-money">
                    <div><dt>Total</dt><dd>{formatTZS(p.total_price)}</dd></div>
                    <div><dt>Paid</dt><dd>{formatTZS(p.amount_paid, 'TZS 0')}</dd></div>
                    <div><dt>Balance</dt><dd className={hasBalance(p.balance) ? 'crm-text-amber' : ''}>{formatTZS(p.balance, 'TZS 0')}</dd></div>
                  </dl>
                )}
                <div className="crm-card-actions">
                  {canPay(p) && (
                    <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('pay', p)}>Record Payment</button>
                  )}
                  <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('view', p)}>View</button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'new' && <ProjectForm options={options} onClose={close} onSaved={done} />}
      {dialog?.type === 'view' && <ProjectModal projectId={dialog.item.id} options={options} onClose={close} onChanged={reload} />}
      {dialog?.type === 'pay' && (
        <PaymentForm url={`${API.projects}/${dialog.item.id}/payments`} parentName={dialog.item.project_name}
          balance={dialog.item.balance} options={options} onClose={close} onSaved={done} />
      )}
    </AdminLayout>
  );
}
