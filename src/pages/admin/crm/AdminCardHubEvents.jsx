import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useQueryFilters } from '../../../hooks/useCrm';
import { qs } from '../../../utils/crm';
import { DataView, FilterTabs, Pagination, SearchBox, Select, Toolbar } from '../../../components/admin/crm/ui';
import { EventRow } from '../../../components/admin/crm/lists';
import { CardHubEventForm } from '../../../components/admin/crm/forms';
import ClientForm from '../../../components/admin/crm/ClientForm';

const LIMIT = 25;

/** Simple date windows people actually think in. */
const DATE_TABS = [
  { value: 'upcoming', label: 'All upcoming' },
  { value: 'next_7', label: 'Next 7 days' },
  { value: 'next_30', label: 'Next 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_month', label: 'Next month' },
  { value: 'next_60', label: 'Next 60 days' },
];

/** Past/closed views live in the filter panel to keep the tab strip short. */
const OTHER_VIEWS = [
  { value: 'completed', label: 'Completed events' },
  { value: 'cancelled', label: 'Cancelled events' },
  { value: 'all', label: 'All events' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthKey = ymd => (ymd ? ymd.slice(0, 7) : 'unset');
const monthLabel = key => {
  if (key === 'unset') return 'Date not set';
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

export default function AdminCardHubEvents({ defaultView = 'upcoming' }) {
  const navigate = useNavigate();
  const { options } = useCrmOptions();
  const [f, update] = useQueryFilters({ view: defaultView, search: '', status: '', payment_status: '', new: '' });
  const [newCustomer, setNewCustomer] = useState(null); // null | 'form' | { client }

  const { data, loading, error, reload } = useApi(`${API.cardhubEvents}${qs({
    view: f.view, search: f.search, status: f.status, payment_status: f.payment_status, page: f.page, limit: LIMIT,
  })}`);
  const rows = data?.data || [];
  const today = data?.today || options?.today;
  const title = defaultView === 'upcoming' ? 'Upcoming Events' : 'CardHub Events';

  const otherView = OTHER_VIEWS.some(v => v.value === f.view) ? f.view : '';
  const activeFilters = [f.status, f.payment_status, otherView].filter(Boolean).length;
  const filtered = Boolean(f.search || f.status || f.payment_status);

  const showEventForm = f.new === '1' && newCustomer !== 'form';
  const closeEventForm = () => { setNewCustomer(null); update({ new: '' }); };

  const addButton = (
    <button type="button" className="crm-btn crm-btn-primary" onClick={() => update({ new: '1' })}>
      <FiPlus size={14} aria-hidden="true" /> Add Event
    </button>
  );

  return (
    <AdminLayout title={title}>
      <div className="crm-page-head">
        <div>
          <h2>{title}</h2>
          <p>Invitation card orders by event date, with what is paid and what is still owed.</p>
        </div>
        <div className="crm-page-actions">{addButton}</div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={DATE_TABS} value={f.view} onChange={view => update({ view })} counts={data?.view_counts} label="Event dates" />
        <Toolbar
          activeCount={activeFilters}
          search={<SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Search customer or event…" label="Search events" />}
        >
          <Select aria-label="Show past events" value={otherView} onChange={v => update({ view: v || 'upcoming' })} options={OTHER_VIEWS} placeholder="Upcoming events" />
          <Select aria-label="Event status" value={f.status} onChange={status => update({ status })} options={options?.cardhub_event_statuses} placeholder="Any status" />
          <Select aria-label="Payment" value={f.payment_status} onChange={v => update({ payment_status: v })} options={options?.payment_statuses} placeholder="Any payment" />
        </Toolbar>

        <DataView
          loading={loading} error={error} data={data} isEmpty={!rows.length} what="CardHub events" onRetry={reload}
          empty={filtered ? 'No events match your search or filters.' : 'No events in this period.'}
          emptySw={filtered ? undefined : 'Hakuna tukio katika kipindi hiki.'}
          emptyAction={filtered ? undefined : addButton}
          cols={4}
        >
          <ul className="crm-rows">
            {rows.map((event, i) => {
              const key = monthKey(event.event_date);
              const newMonth = i === 0 || monthKey(rows[i - 1].event_date) !== key;
              return (
                <Fragment key={event.id}>
                  {newMonth && <li className="crm-month-heading">{monthLabel(key)}</li>}
                  <EventRow event={event} options={options} today={today} />
                </Fragment>
              );
            })}
          </ul>
          <Pagination page={data?.page || 1} limit={LIMIT} total={data?.total || 0} onPage={page => update({ page })} />
        </DataView>
      </div>

      {showEventForm && (
        <CardHubEventForm
          client={newCustomer?.client}
          options={options}
          onClose={closeEventForm}
          onSaved={res => { closeEventForm(); navigate(`/admin/cardhub/events/${res.id}`); }}
          onNewCustomer={() => setNewCustomer('form')}
        />
      )}
      {f.new === '1' && newCustomer === 'form' && (
        <ClientForm
          options={options}
          initial={{ source: 'cardhub', status: 'confirmed' }}
          onClose={() => setNewCustomer(null)}
          onSaved={(id, values) => setNewCustomer({ client: { id, full_name: values.full_name, phone: values.phone } })}
        />
      )}
    </AdminLayout>
  );
}
