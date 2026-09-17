import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiPlus, FiTruck, FiPhone, FiMail, FiMessageCircle, FiArchive, FiRotateCcw } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useMutation } from '../../../hooks/useCrm';
import {
  eventCountdown, daysUntil, formatDate, formatDateTime, hasBalance, labelFor, STATUS_HELP, whatsappLink,
} from '../../../utils/crm';
import {
  Badge, ConfirmDialog, DataView, EmptyState, FormError, InfoList, MoreMenu, PanelHeader, Select,
} from '../../../components/admin/crm/ui';
import { ActivityTimeline, DateBlock, MoneySummary, PaymentRows } from '../../../components/admin/crm/lists';
import { CardHubEventForm, PaymentForm, VoidPaymentForm } from '../../../components/admin/crm/forms';

const CLOSED = ['event_completed', 'cancelled'];

export default function AdminCardHubEventDetail() {
  const { id } = useParams();
  const { options } = useCrmOptions();
  const { data, loading, error, reload } = useApi(`${API.cardhubEvents}/${id}`);
  const { dialog, open, close } = useDialog();
  const status = useMutation();
  const archive = useMutation();

  const event = data?.data;
  const today = data?.today || options?.today;
  const done = () => { close(); reload(); };
  const archived = Boolean(event?.archived_at);
  const priced = Number(event?.total_price) > 0;

  const setStatus = async value => {
    try { await status.run(`${API.cardhubEvents}/${id}/status`, { method: 'PATCH', body: { status: value } }); reload(); } catch { /* shown */ }
  };

  const countdownTone = () => {
    if (!event?.event_date || !today || CLOSED.includes(event.status)) return 'muted';
    const diff = daysUntil(event.event_date, today);
    if (diff < 0) return 'muted';
    if (diff <= 7) return 'red';
    if (diff <= 30) return 'amber';
    return 'cyan';
  };

  return (
    <AdminLayout title={event?.event_name || 'CardHub event'}>
      <Link to="/admin/cardhub/upcoming" className="crm-back"><FiArrowLeft size={14} aria-hidden="true" /> CardHub events</Link>

      <DataView loading={loading} error={error} data={data} what="this event" onRetry={reload} rows={6} cols={3}>
        {event && (
          <div className="crm-stack">
            <div className="crm-panel">
              <div className="crm-event-hero">
                <DateBlock ymd={event.event_date} />
                <div className="crm-detail-identity">
                  <span className="crm-eyebrow">{labelFor(options?.cardhub_event_types, event.event_type)}</span>
                  <h2 className="crm-event-title">{event.event_name}</h2>
                  <div className={`crm-countdown crm-text-${countdownTone()}`}>
                    {event.event_date ? `${formatDate(event.event_date)} · ${eventCountdown(event.event_date, today)}` : 'Event date not set'}
                  </div>
                  <div className="crm-row-sub">
                    {[event.event_location, event.number_of_cards && `${event.number_of_cards} cards`, event.package].filter(Boolean).join(' · ')}
                  </div>
                  <div className="crm-detail-badges">
                    <Badge value={event.status} options={options?.cardhub_event_statuses} />
                    {archived && <Badge value="cancelled" label="Archived" />}
                  </div>
                </div>
              </div>

              {priced
                ? <MoneySummary total={event.total_price} paid={event.amount_paid} balance={event.balance} labels={['Price', 'Paid', 'Balance']} help />
                : <p className="crm-status-help">No price set yet. Edit the event to add the price before recording payments.</p>}

              <div className="crm-detail-actions">
                {!archived && hasBalance(event.balance) && (
                  <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('pay')}>
                    <FiPlus size={14} aria-hidden="true" /> Record Payment
                  </button>
                )}
                {!archived && !['delivered', ...CLOSED].includes(event.status) && (
                  <button type="button" className="crm-btn crm-btn-ghost" onClick={() => setStatus('delivered')} disabled={status.busy}>
                    <FiTruck size={14} aria-hidden="true" /> Mark Delivered
                  </button>
                )}
                <MoreMenu items={[
                  !archived && { label: 'Edit event', icon: FiEdit2, onClick: () => open('edit') },
                  { label: archived ? 'Restore event' : 'Archive event', icon: archived ? FiRotateCcw : FiArchive, danger: !archived, onClick: () => open('archive') },
                ]} />
                {!archived && (
                  <label className="crm-status-control">
                    <span>Status</span>
                    <Select aria-label="Update event status" value={event.status} onChange={setStatus}
                      options={options?.cardhub_event_statuses} disabled={status.busy || !options} />
                  </label>
                )}
              </div>
              {!archived && STATUS_HELP.event[event.status] && (
                <p className="crm-status-help">{STATUS_HELP.event[event.status]}</p>
              )}
              {status.error && <div className="crm-panel-body" style={{ paddingTop: 0 }}><FormError error={status.error} /></div>}
            </div>

            <div className="crm-detail-grid">
              <div className="crm-stack">
                <div className="crm-panel">
                  <PanelHeader title={`Payments (${data.payments.length})`} />
                  {data.payments.length
                    ? <PaymentRows payments={data.payments} options={options} onVoid={p => open('void', p)} />
                    : <EmptyState>{priced ? 'No payments recorded yet.' : 'Set a price to record payments.'}</EmptyState>}
                </div>

                <div className="crm-panel">
                  <PanelHeader title="Event details" />
                  <div className="crm-panel-body crm-panel-body-flush">
                    <InfoList items={[
                      { label: 'Location', value: event.event_location },
                      { label: 'Expected guests', value: event.expected_guests },
                      { label: 'Number of cards', value: event.number_of_cards },
                      { label: 'Card type', value: event.card_type },
                      { label: 'Package', value: event.package },
                      event.external_reference && { label: 'Order reference', value: event.external_reference },
                      event.delivered_at && { label: 'Delivered', value: formatDateTime(event.delivered_at) },
                      { label: 'Added', value: formatDateTime(event.created_at) },
                    ]} />
                  </div>
                  {event.notes && <div className="crm-note"><div className="crm-note-meta">Notes</div><div className="crm-note-body">{event.notes}</div></div>}
                </div>
              </div>

              <div className="crm-stack">
                <div className="crm-panel">
                  <PanelHeader title="Customer">
                    <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={`/admin/clients/${event.client_id}`}>View Client</Link>
                  </PanelHeader>
                  <div className="crm-panel-body">
                    <Link className="crm-row-title" to={`/admin/clients/${event.client_id}`}>{event.client_name}</Link>
                    <div className="crm-contact-line crm-contact-stack">
                      {event.client_phone && <a href={`tel:${event.client_phone}`}><FiPhone size={14} aria-hidden="true" /> {event.client_phone}</a>}
                      {whatsappLink(event.client_phone) && (
                        <a href={whatsappLink(event.client_phone)} target="_blank" rel="noopener noreferrer"><FiMessageCircle size={14} aria-hidden="true" /> WhatsApp</a>
                      )}
                      {event.client_email && <a href={`mailto:${event.client_email}`}><FiMail size={14} aria-hidden="true" /> {event.client_email}</a>}
                    </div>
                  </div>
                </div>

                <div className="crm-panel">
                  <PanelHeader title="History" />
                  {data.activity.length ? <ActivityTimeline items={data.activity} /> : <EmptyState>No history yet.</EmptyState>}
                </div>
              </div>
            </div>
          </div>
        )}
      </DataView>

      {event && dialog?.type === 'edit' && <CardHubEventForm event={event} options={options} onClose={close} onSaved={done} />}
      {event && dialog?.type === 'pay' && (
        <PaymentForm url={`${API.cardhubEvents}/${event.id}/payments`} parentName={event.event_name}
          balance={event.balance} options={options} onClose={close} onSaved={done} />
      )}
      {dialog?.type === 'void' && <VoidPaymentForm payment={dialog.item} onClose={close} onSaved={done} />}
      {event && dialog?.type === 'archive' && (
        <ConfirmDialog
          open
          danger={!archived}
          title={archived ? 'Restore Event' : 'Archive Event'}
          message={archived
            ? `Restore ${event.event_name}?`
            : `Archive ${event.event_name}? It will be hidden from event lists. Payment history is kept.`}
          confirmLabel={archived ? 'Restore' : 'Archive'}
          busy={archive.busy}
          error={archive.error}
          onClose={close}
          onConfirm={async () => {
            try {
              await archive.run(`${API.cardhubEvents}/${event.id}${archived ? '/restore' : ''}`, { method: archived ? 'POST' : 'DELETE' });
              done();
            } catch { /* shown */ }
          }}
        />
      )}
    </AdminLayout>
  );
}
