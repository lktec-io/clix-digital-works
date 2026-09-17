import { FiPlus } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { qs } from '../../../utils/crm';
import { DataView, FilterTabs, Pagination, SearchBox, Select, Toolbar } from '../../../components/admin/crm/ui';
import { FollowUpDialogs, FollowUpRow } from '../../../components/admin/crm/lists';
import { FollowUpForm } from '../../../components/admin/crm/forms';

const LIMIT = 25;

const VIEWS = [
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Done' },
];

const EMPTY = {
  today:     ['No follow-ups today.', 'Kwa sasa huna mteja wa kumfuatilia leo.'],
  overdue:   ['Nothing overdue.', 'Hakuna ufuatiliaji uliopitwa na tarehe.'],
  upcoming:  ['No upcoming follow-ups.', 'Ongeza ufuatiliaji ili usimsahau mteja.'],
  completed: ['No completed follow-ups yet.', null],
};

export default function AdminFollowUps() {
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ view: 'today', search: '', priority: '' });
  const { dialog, open, close } = useDialog();

  const { data, loading, error, reload } = useApi(
    `${API.followUps}${qs({ view: f.view, search: f.search, priority: f.priority, page: f.page, limit: LIMIT })}`,
  );
  const rows = data?.data || [];
  const today = data?.today || options?.today;
  const filtered = Boolean(f.search || f.priority);
  const [emptyText, emptySw] = EMPTY[f.view] || ['No follow-ups.', null];

  const addButton = (
    <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('new')}>
      <FiPlus size={14} aria-hidden="true" /> Add Follow-up
    </button>
  );

  return (
    <AdminLayout title="Follow-ups">
      <div className="crm-page-head">
        <div>
          <h2>Follow-ups</h2>
          <p>Who to call or message, and when — so no client is forgotten.</p>
        </div>
        <div className="crm-page-actions">{addButton}</div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={VIEWS} value={f.view} onChange={view => update({ view })} counts={data?.view_counts} label="Follow-ups to show" />
        <Toolbar
          activeCount={f.priority ? 1 : 0}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search client, phone or reason…" label="Search follow-ups" />}
        >
          <Select aria-label="Priority" value={f.priority} onChange={priority => update({ priority })} options={options?.priorities} placeholder="Any priority" />
        </Toolbar>

        <DataView
          loading={loading} error={error} data={data} isEmpty={!rows.length} what="follow-ups" onRetry={reload}
          empty={filtered ? 'No follow-ups match your search.' : emptyText}
          emptySw={filtered ? undefined : emptySw}
          emptyAction={!filtered && f.view !== 'completed' ? addButton : undefined}
          cols={4}
        >
          <ul className="crm-rows">
            {rows.map(item => <FollowUpRow key={item.id} item={item} today={today} onAction={open} />)}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {dialog?.type === 'new' && <FollowUpForm options={options} onClose={close} onSaved={() => { close(); reload(); }} />}
      <FollowUpDialogs dialog={dialog} close={close} options={options} onChanged={reload} />
    </AdminLayout>
  );
}
