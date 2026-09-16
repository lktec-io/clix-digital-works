import { FiPlus } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useQueryFilters } from '../../../hooks/useCrm';
import { qs } from '../../../utils/crm';
import { DataView, FilterTabs, Pagination, SearchBox, Select } from '../../../components/admin/crm/ui';
import { FollowUpDialogs, FollowUpRow } from '../../../components/admin/crm/lists';
import { FollowUpForm } from '../../../components/admin/crm/forms';

const LIMIT = 25;

const VIEWS = [
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const EMPTY = {
  today: 'No follow-ups today.',
  overdue: 'Nothing overdue. Well done.',
  upcoming: 'No upcoming follow-ups.',
  completed: 'No completed follow-ups yet.',
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

  return (
    <AdminLayout title="Follow-ups">
      <div className="crm-page-head">
        <div>
          <h2>Follow-ups</h2>
          <p>Reminders so no potential client is forgotten.</p>
        </div>
        <div className="crm-page-actions">
          <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('new')}><FiPlus size={14} /> New follow-up</button>
        </div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={VIEWS} value={f.view} onChange={view => update({ view })} counts={data?.view_counts} label="Follow-up view" />
        <div className="crm-toolbar">
          <SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Client, phone or title…" />
          <Select aria-label="Priority" value={f.priority} onChange={priority => update({ priority })} options={options?.priorities} placeholder="Any priority" />
        </div>

        <DataView loading={loading} error={error} data={data} isEmpty={!rows.length} what="follow-ups" onRetry={reload}
          empty={f.search || f.priority ? 'No follow-ups match these filters.' : EMPTY[f.view] || 'No follow-ups.'} cols={4}>
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
