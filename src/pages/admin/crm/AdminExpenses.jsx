import { Link } from 'react-router-dom';
import { FiPlus, FiTrendingDown, FiCalendar, FiBriefcase, FiHome } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { formatDate, formatTZS, formatTZSCompact, labelFor, qs, SW } from '../../../utils/crm';
import {
  Badge, DataView, FilterTabs, MetricBar, Pagination, SearchBox, Select, Toolbar,
} from '../../../components/admin/crm/ui';
import ExpenseForm, { VoidExpenseForm } from '../../../components/admin/crm/ExpenseForm';

const LIMIT = 25;

const TYPE_TABS = [
  { value: '', label: 'All costs' },
  { value: 'project', label: 'Project costs' },
  { value: 'general', label: 'General costs' },
];

/** Where an expense belongs: a project, an event, a client, or the business. */
function expenseTarget(x) {
  if (x.project_name) return { label: x.project_name, sub: 'Project', to: `/admin/clients/${x.client_id}?tab=projects` };
  if (x.event_name) return { label: x.event_name, sub: 'CardHub', to: `/admin/cardhub/events/${x.cardhub_event_id}` };
  if (x.client_name) return { label: x.client_name, sub: 'Client', to: `/admin/clients/${x.client_id}` };
  return { label: 'Business', sub: 'General', to: null };
}

export default function AdminExpenses() {
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ search: '', type: '', category: '', from: '', to: '', voided: '' });
  const { dialog, open, close } = useDialog();

  const { data, loading, error, reload } = useApi(`${API.expenses}${qs({
    search: f.search, type: f.type, category: f.category, from: f.from, to: f.to,
    include_voided: f.voided === '1' ? '1' : '', page: f.page, limit: LIMIT,
  })}`);
  const rows = data?.data || [];
  const t = data?.totals;
  const filtered = Boolean(f.search || f.category || f.from || f.to);
  const done = () => { close(); reload(); };

  const addButton = (
    <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('new')}>
      <FiPlus size={14} aria-hidden="true" /> Add Expense
    </button>
  );

  return (
    <AdminLayout title="Expenses">
      <div className="crm-page-head">
        <div>
          <h2>Expenses</h2>
          <p>Money Clix spends — on client work and on running the business.</p>
          <p className="crm-sw">{SW.expense}</p>
        </div>
        <div className="crm-page-actions">{addButton}</div>
      </div>

      {t && (
        <MetricBar items={[
          {
            label: 'Total spent', icon: FiTrendingDown,
            value: formatTZSCompact(t.total), title: formatTZS(t.total, 'TZS 0'),
            sub: 'All recorded costs',
          },
          {
            label: 'This month', icon: FiCalendar,
            value: formatTZSCompact(t.this_month), title: formatTZS(t.this_month, 'TZS 0'),
            sub: 'Since the 1st',
          },
          {
            label: 'Project costs', icon: FiBriefcase,
            value: formatTZSCompact(t.project_costs), title: formatTZS(t.project_costs, 'TZS 0'),
            sub: 'Spent delivering client work',
          },
          {
            label: 'General costs', icon: FiHome,
            value: formatTZSCompact(t.general_costs), title: formatTZS(t.general_costs, 'TZS 0'),
            sub: 'Business running costs',
          },
        ]} />
      )}

      {data?.by_category?.length > 0 && (
        <div className="crm-panel crm-cat-panel">
          <div className="crm-panel-head"><h3>Where the money went</h3></div>
          <ul className="crm-cat-list">
            {data.by_category.slice(0, 6).map(c => {
              const share = Number(t.total) > 0 ? (Number(c.total) / Number(t.total)) * 100 : 0;
              return (
                <li key={c.category}>
                  <button type="button" className="crm-cat-row" onClick={() => update({ category: c.category })}>
                    <span className="crm-cat-name">{labelFor(options?.expense_categories, c.category)}</span>
                    <span className="crm-cat-value crm-money">{formatTZS(c.total)}</span>
                    <span className="crm-cat-bar" aria-hidden="true"><span style={{ width: `${share}%` }} /></span>
                    <span className="crm-cat-share">{share.toFixed(0)}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="admin-table-card">
        <FilterTabs tabs={TYPE_TABS} value={f.type} onChange={type => update({ type })} label="Expense type" />
        <Toolbar
          activeCount={[f.category, f.from, f.to, f.voided].filter(Boolean).length}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search cost, vendor or reference…" label="Search expenses" />}
        >
          <Select aria-label="Category" value={f.category} onChange={category => update({ category })} options={options?.expense_categories} placeholder="Any category" />
          <label className="crm-inline-field">From <input type="date" className="crm-input" value={f.from} onChange={e => update({ from: e.target.value })} /></label>
          <label className="crm-inline-field">To <input type="date" className="crm-input" value={f.to} onChange={e => update({ to: e.target.value })} /></label>
          <label className="crm-check">
            <input type="checkbox" checked={f.voided === '1'} onChange={e => update({ voided: e.target.checked ? '1' : '' })} />
            Show voided
          </label>
        </Toolbar>

        <DataView
          loading={loading} error={error} data={data} isEmpty={!rows.length} what="expenses" onRetry={reload}
          empty={filtered || f.type ? 'No expenses match your search or filters.' : 'No expenses recorded yet.'}
          emptySw={filtered || f.type ? undefined : 'Anza kwa kuweka gharama ya kwanza.'}
          emptyAction={filtered || f.type ? undefined : addButton}
          cols={6}
        >
          <div className="admin-table-wrap crm-table-desktop">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense</th>
                  <th className="crm-col-optional">Category</th>
                  <th>For</th>
                  <th>Amount</th>
                  <th><span className="crm-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(x => {
                  const target = expenseTarget(x);
                  return (
                    <tr key={x.id} className={x.voided_at ? 'is-voided-row' : undefined}>
                      <td className="crm-nowrap">{formatDate(x.expense_date)}</td>
                      <td className="crm-wrap">
                        <span className="crm-cell-main">{x.title}</span>
                        {x.vendor && <div className="crm-cell-sub">{x.vendor}</div>}
                      </td>
                      <td className="crm-wrap crm-col-optional">{labelFor(options?.expense_categories, x.category)}</td>
                      <td className="crm-wrap">
                        {target.to
                          ? <Link className="crm-link" to={target.to}>{target.label}</Link>
                          : <span>{target.label}</span>}
                        <div className="crm-cell-sub">{target.sub}</div>
                      </td>
                      <td className="crm-money crm-strong">{formatTZS(x.amount)}</td>
                      <td>
                        {x.voided_at
                          ? <span title={x.void_reason}><Badge value="cancelled" label="Voided" /></span>
                          : (
                            <div className="crm-row-actions">
                              <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('edit', x)}>Edit</button>
                              <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('void', x)}>Void</button>
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="crm-card-list">
            {rows.map(x => {
              const target = expenseTarget(x);
              return (
                <li key={x.id} className="crm-card" style={x.voided_at ? { opacity: 0.6 } : undefined}>
                  <div className="crm-card-top">
                    <span className="crm-card-title">{x.title}</span>
                    <span className="crm-money crm-strong crm-nowrap">{formatTZS(x.amount)}</span>
                  </div>
                  <div className="crm-card-meta">
                    {target.to ? <Link className="crm-link" to={target.to}>{target.label}</Link> : <span>{target.label}</span>}
                    <span>{labelFor(options?.expense_categories, x.category)}</span>
                    <span>{formatDate(x.expense_date)}</span>
                  </div>
                  {x.voided_at
                    ? <div className="crm-card-meta"><Badge value="cancelled" label="Voided" /> <span className="crm-text-red">{x.void_reason}</span></div>
                    : (
                      <div className="crm-card-actions">
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('edit', x)}>Edit</button>
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('void', x)}>Void</button>
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'new' && <ExpenseForm options={options} onClose={close} onSaved={done} />}
      {dialog?.type === 'edit' && <ExpenseForm expense={dialog.item} options={options} onClose={close} onSaved={done} />}
      {dialog?.type === 'void' && <VoidExpenseForm expense={dialog.item} onClose={close} onSaved={done} />}
    </AdminLayout>
  );
}
