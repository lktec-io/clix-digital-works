import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiDollarSign } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { formatDate, formatTZS, hasBalance, qs } from '../../../utils/crm';
import { Badge, DataView, FilterTabs, Pagination, SearchBox, Select } from '../../../components/admin/crm/ui';
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

  const actions = (p, compact) => (
    <>
      <button type="button" className={compact ? 'action-btn action-btn-status' : 'crm-btn crm-btn-ghost crm-btn-sm'} title="View" onClick={() => open('view', p)}>
        <FiEye size={12} />{!compact && ' View'}
      </button>
      {!p.archived_at && (
        <button type="button" className={compact ? 'action-btn action-btn-status' : 'crm-btn crm-btn-ghost crm-btn-sm'} title="Edit" onClick={() => open('edit', p)}>
          <FiEdit2 size={12} />{!compact && ' Edit'}
        </button>
      )}
      {!p.archived_at && hasBalance(p.balance) && (
        <button type="button" className={compact ? 'action-btn action-btn-status' : 'crm-btn crm-btn-ghost crm-btn-sm'} title="Add payment" onClick={() => open('pay', p)}>
          <FiDollarSign size={12} />{!compact && ' Payment'}
        </button>
      )}
    </>
  );

  return (
    <AdminLayout title="Projects">
      <div className="crm-page-head">
        <div>
          <h2>Projects</h2>
          <p>Every system, website and app per client, with payments and balances.</p>
        </div>
        <div className="crm-page-actions">
          <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('new')}><FiPlus size={14} /> New project</button>
        </div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={tabs} value={f.status} onChange={status => update({ status })} counts={counts} label="Project status" />
        <div className="crm-toolbar">
          <SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Project, service or client…" />
          <Select aria-label="Payment status" value={f.payment_status} onChange={v => update({ payment_status: v })} options={options?.payment_statuses} placeholder="Any payment" />
          <Select aria-label="Sort" value={f.sort} onChange={sort => update({ sort })} options={SORTS} />
          <label className="crm-check">
            <input type="checkbox" checked={f.archived === '1'} onChange={e => update({ archived: e.target.checked ? '1' : '' })} />
            Archived
          </label>
        </div>

        <DataView loading={loading} error={error} data={data} isEmpty={!rows.length} what="projects" onRetry={reload}
          empty={f.search || f.status || f.payment_status ? 'No projects match these filters.' : 'No projects yet.'} cols={6}>
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th className="crm-col-optional">Start</th>
                  <th>Price</th>
                  <th>Balance</th>
                  <th className="crm-col-optional" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id}>
                    <td className="crm-wrap">
                      <button type="button" className="crm-link crm-cell-main" onClick={() => open('view', p)}>{p.project_name}</button>
                      {p.service && <div className="crm-cell-sub">{p.service}</div>}
                    </td>
                    <td className="crm-wrap"><Link className="crm-link" to={`/admin/clients/${p.client_id}`}>{p.client_name}</Link></td>
                    <td><Badge value={p.status} options={options?.project_statuses} /></td>
                    <td className="crm-nowrap crm-col-optional">{formatDate(p.expected_start_date)}</td>
                    <td className="crm-money">
                      {formatTZS(p.total_price)}
                      {Number(p.total_price) > 0 && <div style={{ marginTop: 4 }}><Badge value={p.payment_status} options={options?.payment_statuses} /></div>}
                    </td>
                    <td className={`crm-money ${hasBalance(p.balance) ? 'crm-text-amber' : 'crm-muted'}`}>{hasBalance(p.balance) ? formatTZS(p.balance) : '—'}</td>
                    <td className="crm-col-optional"><div className="crm-row-actions">{actions(p, true)}</div></td>
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
                  {p.service && <span>{p.service}</span>}
                  {p.expected_start_date && <span>Start {formatDate(p.expected_start_date)}</span>}
                </div>
                {Number(p.total_price) > 0 && (
                  <div className="crm-card-meta">
                    <span className="crm-money">{formatTZS(p.amount_paid, 'TZS 0')} of {formatTZS(p.total_price)}</span>
                    {hasBalance(p.balance) && <span className="crm-text-amber crm-money">Owes {formatTZS(p.balance)}</span>}
                  </div>
                )}
                <div className="crm-card-actions">{actions(p, false)}</div>
              </li>
            ))}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'new' && <ProjectForm options={options} onClose={close} onSaved={done} />}
      {dialog?.type === 'edit' && <ProjectForm project={dialog.item} options={options} onClose={close} onSaved={done} />}
      {dialog?.type === 'view' && <ProjectModal projectId={dialog.item.id} options={options} onClose={close} onChanged={reload} />}
      {dialog?.type === 'pay' && (
        <PaymentForm url={`${API.projects}/${dialog.item.id}/payments`} parentName={dialog.item.project_name}
          balance={dialog.item.balance} options={options} onClose={close} onSaved={done} />
      )}
    </AdminLayout>
  );
}
