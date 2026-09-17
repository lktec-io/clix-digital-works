import { Link } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { formatDate, formatTZS, labelFor, qs } from '../../../utils/crm';
import { Badge, DataView, FilterTabs, Pagination, SearchBox, Select, Toolbar } from '../../../components/admin/crm/ui';
import { VoidPaymentForm } from '../../../components/admin/crm/forms';

const LIMIT = 25;
const TYPES = [
  { value: '', label: 'All payments' },
  { value: 'project', label: 'Projects' },
  { value: 'cardhub', label: 'CardHub' },
];

const parentLink = p => (p.project_id
  ? { to: `/admin/clients/${p.client_id}?tab=projects`, kind: 'Project' }
  : { to: `/admin/cardhub/events/${p.cardhub_event_id}`, kind: 'CardHub' });

export default function AdminPayments() {
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ type: '', method: '', search: '', from: '', to: '', voided: '' });
  const { dialog, open, close } = useDialog();

  const { data, loading, error, reload } = useApi(`${API.payments}${qs({
    type: f.type, method: f.method, search: f.search, from: f.from, to: f.to,
    include_voided: f.voided === '1' ? '1' : '', page: f.page, limit: LIMIT,
  })}`);
  const rows = data?.data || [];
  const t = data?.totals;

  return (
    <AdminLayout title="Payments">
      <div className="crm-page-head">
        <div>
          <h2>Payments</h2>
          <p>Every payment received. To record a new one, open the project or CardHub event it belongs to.</p>
        </div>
      </div>

      {t && (
        <div className="crm-dash-grid">
          <div className="admin-stat-card" style={{ '--s-color': '#39FF14' }}>
            <div className="admin-stat-label">Collected this month</div>
            <div className="admin-stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{formatTZS(t.this_month)}</div>
          </div>
          <div className="admin-stat-card" style={{ '--s-color': '#FFA500' }}>
            <div className="admin-stat-label">Outstanding balances</div>
            <div className="admin-stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{formatTZS(t.outstanding)}</div>
            <div className="admin-stat-sub">{t.outstanding_items} unpaid project{t.outstanding_items === 1 ? '' : 's'} / event{t.outstanding_items === 1 ? '' : 's'}</div>
          </div>
          <div className="admin-stat-card" style={{ '--s-color': '#00E5FF' }}>
            <div className="admin-stat-label">Total (current filter)</div>
            <div className="admin-stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{formatTZS(t.filtered)}</div>
            <div className="admin-stat-sub">{data.total} payment{data.total === 1 ? '' : 's'}</div>
          </div>
        </div>
      )}

      <div className="admin-table-card">
        <FilterTabs tabs={TYPES} value={f.type} onChange={type => update({ type })} label="Payment type" />
        <Toolbar
          activeCount={[f.method, f.from, f.to, f.voided].filter(Boolean).length}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search reference, client or event…" label="Search payments" />}
        >
          <Select aria-label="Method" value={f.method} onChange={method => update({ method })} options={options?.payment_methods} placeholder="Any method" />
          <label className="crm-inline-field">From <input type="date" className="crm-input" value={f.from} onChange={e => update({ from: e.target.value })} /></label>
          <label className="crm-inline-field">To <input type="date" className="crm-input" value={f.to} onChange={e => update({ to: e.target.value })} /></label>
          <label className="crm-check">
            <input type="checkbox" checked={f.voided === '1'} onChange={e => update({ voided: e.target.checked ? '1' : '' })} />
            Show voided
          </label>
        </Toolbar>

        <DataView loading={loading} error={error} data={data} isEmpty={!rows.length} what="payments" onRetry={reload}
          empty={f.search || f.method || f.from || f.to ? 'No payments match your search or filters.' : 'No payments recorded yet.'}
          emptySw={f.search || f.method || f.from || f.to ? undefined : 'Malipo hurekodiwa kupitia project au tukio la CardHub.'}
          cols={6}>
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>For</th>
                  <th className="crm-col-optional">Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const parent = parentLink(p);
                  return (
                    <tr key={p.id} style={p.voided_at ? { opacity: 0.55 } : undefined}>
                      <td className="crm-nowrap">{formatDate(p.payment_date)}</td>
                      <td className="crm-wrap"><Link className="crm-link" to={`/admin/clients/${p.client_id}`}>{p.client_name}</Link></td>
                      <td className="crm-wrap">
                        <Link className="crm-link" to={parent.to}>{p.parent_name}</Link>
                        <div className="crm-cell-sub">{parent.kind}</div>
                      </td>
                      <td className="crm-col-optional">{labelFor(options?.payment_methods, p.payment_method)}</td>
                      <td className="crm-wrap">{p.reference || <span className="crm-muted">—</span>}</td>
                      <td className="crm-money crm-strong" style={p.voided_at ? { textDecoration: 'line-through' } : undefined}>{formatTZS(p.amount)}</td>
                      <td>
                        {p.voided_at
                          ? <span title={p.void_reason}><Badge value="cancelled" label="Voided" /></span>
                          : <button type="button" className="action-btn action-btn-status" onClick={() => open('void', p)}>Void</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="crm-card-list">
            {rows.map(p => {
              const parent = parentLink(p);
              return (
                <li key={p.id} className="crm-card" style={p.voided_at ? { opacity: 0.6 } : undefined}>
                  <div className="crm-card-top">
                    <span className="crm-card-title crm-money">{formatTZS(p.amount)}</span>
                    {p.voided_at ? <Badge value="cancelled" label="Voided" /> : <span className="crm-muted" style={{ fontSize: 'var(--fs-xs)' }}>{formatDate(p.payment_date)}</span>}
                  </div>
                  <div className="crm-card-meta">
                    <Link className="crm-link" to={`/admin/clients/${p.client_id}`}>{p.client_name}</Link>
                    <Link className="crm-link" to={parent.to}>{p.parent_name}</Link>
                  </div>
                  <div className="crm-card-meta">
                    <span>{labelFor(options?.payment_methods, p.payment_method)}</span>
                    {p.reference && <span>Ref {p.reference}</span>}
                    {p.voided_at && <span className="crm-text-red">{p.void_reason}</span>}
                  </div>
                  {!p.voided_at && (
                    <div className="crm-card-actions">
                      <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('void', p)}>Void</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'void' && <VoidPaymentForm payment={dialog.item} onClose={close} onSaved={() => { close(); reload(); }} />}
    </AdminLayout>
  );
}
