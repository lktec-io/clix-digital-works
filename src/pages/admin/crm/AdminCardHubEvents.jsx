import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useQueryFilters } from '../../../hooks/useCrm';
import { qs } from '../../../utils/crm';
import { DataView, FilterTabs, Pagination, SearchBox, Select } from '../../../components/admin/crm/ui';
import { EventRow } from '../../../components/admin/crm/lists';
import { CardHubEventForm } from '../../../components/admin/crm/forms';
import ClientForm from '../../../components/admin/crm/ClientForm';

const LIMIT = 25;

const VIEWS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'next_7', label: 'Next 7 days' },
  { value: 'next_30', label: 'Next 30 days' },
  { value: 'next_60', label: 'Next 60 days' },
  { value: 'next_90', label: 'Next 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_month', label: 'Next month' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All events' },
];

const EMPTY = {
  upcoming: 'No upcoming CardHub events.',
  completed: 'No completed events yet.',
  cancelled: 'No cancelled events.',
  all: 'No CardHub events yet.',
};

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

  const showEventForm = f.new === '1' && newCustomer !== 'form';
  const closeEventForm = () => { setNewCustomer(null); update({ new: '' }); };

  return (
    <AdminLayout title={title}>
      <div className="crm-page-head">
        <div>
          <h2>{title}</h2>
          <p>Invitation card orders by event date, with payment status and balances.</p>
        </div>
        <div className="crm-page-actions">
          <button type="button" className="crm-btn crm-btn-primary" onClick={() => update({ new: '1' })}><FiPlus size={14} /> New event</button>
        </div>
      </div>

      <div className="admin-table-card">
        <FilterTabs tabs={VIEWS} value={f.view} onChange={view => update({ view })} counts={data?.view_counts} label="Event date range" />
        <div className="crm-toolbar">
          <SearchBox value={f.search} onSearch={search => update({ search })} placeholder="Event, customer, location, date (YYYY-MM-DD)…" />
          <Select aria-label="Event status" value={f.status} onChange={status => update({ status })} options={options?.cardhub_event_statuses} placeholder="Any status" />
          <Select aria-label="Payment status" value={f.payment_status} onChange={v => update({ payment_status: v })} options={options?.payment_statuses} placeholder="Any payment" />
        </div>

        <DataView loading={loading} error={error} data={data} isEmpty={!rows.length} what="CardHub events" onRetry={reload}
          empty={f.search || f.status || f.payment_status ? 'No events match these filters.' : EMPTY[f.view] || 'No events in this period.'} cols={4}>
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
