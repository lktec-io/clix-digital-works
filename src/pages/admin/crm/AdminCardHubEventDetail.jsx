import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiPlus, FiTruck, FiPhone, FiMail, FiMessageCircle, FiArchive, FiRotateCcw } from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useMutation } from '../../../hooks/useCrm';
import { eventCountdown, daysUntil, formatDate, formatDateTime, hasBalance, labelFor, whatsappLink } from '../../../utils/crm';
import { Badge, ConfirmDialog, DataView, EmptyState, FormError, InfoList, PanelHeader, Select } from '../../../components/admin/crm/ui';
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
      <Link to="/admin/cardhub/upcoming" className="crm-back"><FiArrowLeft size={14} /> CardHub events</Link>

      <DataView loading={loading} error={error} data={data} what="this event" onRetry={reload} rows={6} cols={3}>
        {event && (
          <div className="crm-stack">
            <div className="crm-panel">
              <div className="crm-event-hero">
                <DateBlock ymd={event.event_date} />
                <div className="crm-detail-identity">
                  <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{event.event_name}</h2>
                  <div className="crm-detail-badges">
                    <Badge value="muted" tone="muted" label={labelFor(options?.cardhub_event_types, event.event_type)} />
                    <Badge value={event.status} options={options?.cardhub_event_statuses} />
                    {Number(event.total_price) > 0 && <Badge value={event.payment_status} options={options?.payment_statuses} />}
                    {event.archived_at && <Badge value="cancelled" label="Archived" />}
                  </div>
                  <div className={`crm-countdown crm-text-${countdownTone()}`}>
                    {event.event_date ? `${formatDate(event.event_date)} · ${eventCountdown(event.event_date, today)}` : 'Event date not set'}
                    {event.event_location ? ` · ${event.event_location}` : ''}
                  </div>
                </div>
                <div className="crm-page-actions">
                  {!event.archived_at && (
                    <>
                      <Select aria-label="Event status" value={event.status} onChange={setStatus}
                        options={options?.cardhub_event_statuses} disabled={status.busy || !options} style={{ width: 'auto' }} />
                      {!['delivered', ...CLOSED].includes(event.status) && (
                        <button type="button" className="crm-btn crm-btn-ghost" onClick={() => setStatus('delivered')} disabled={status.busy}>
                          <FiTruck size={13} /> Mark delivered
                        </button>
                      )}
                      <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('edit')}><FiEdit2 size={13} /> Edit</button>
                      {hasBalance(event.balance) && (
                        <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('pay')}><FiPlus size={13} /> Add payment</button>
                      )}
                    </>
                  )}
                  <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('archive')}>
                    {event.archived_at ? <><FiRotateCcw size={13} /> Restore</> : <><FiArchive size={13} /> Archive</>}
                  </button>
                </div>
              </div>
              {status.error && <div style={{ padding: '0 var(--space-lg) var(--space-md)' }}><FormError error={status.error} /></div>}
              <MoneySummary total={event.total_price} paid={event.amount_paid} balance={event.balance} labels={['Price', 'Paid', 'Balance']} />
            </div>

            <div className="crm-detail-grid">
              <div className="crm-stack">
                <div className="crm-panel">
                  <PanelHeader title="Event details" />
                  <div className="crm-panel-body" style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <InfoList items={[
                      { label: 'Event type', value: labelFor(options?.cardhub_event_types, event.event_type) },
                      { label: 'Event date', value: formatDate(event.event_date, 'Not set') },
                      { label: 'Location', value: event.event_location },
                      { label: 'Expected guests', value: event.expected_guests },
                      { label: 'Card type', value: event.card_type },
                      { label: 'Number of cards', value: event.number_of_cards },
                      { label: 'Package', value: event.package },
                      { label: 'Reference', value: event.external_reference },
                      event.delivered_at && { label: 'Delivered', value: formatDateTime(event.delivered_at) },
                      { label: 'Created', value: formatDateTime(event.created_at) },
                    ]} />
                  </div>
                  {event.notes && <div className="crm-note"><div className="crm-note-meta">Notes</div><div className="crm-note-body">{event.notes}</div></div>}
                </div>

                <div className="crm-panel">
                  <PanelHeader title={`Payments (${data.payments.length})`}>
                    {!event.archived_at && hasBalance(event.balance) && (
                      <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('pay')}><FiPlus size={12} /> Add</button>
                    )}
                  </PanelHeader>
                  {data.payments.length
                    ? <PaymentRows payments={data.payments} options={options} onVoid={p => open('void', p)} />
                    : <EmptyState>{Number(event.total_price) > 0 ? 'No payments recorded yet.' : 'Set a total price to record payments.'}</EmptyState>}
                </div>
              </div>

              <div className="crm-stack">
                <div className="crm-panel">
                  <PanelHeader title="Customer">
                    <Link className="crm-btn crm-btn-ghost crm-btn-sm" to={`/admin/clients/${event.client_id}`}>Open client</Link>
                  </PanelHeader>
                  <div className="crm-panel-body">
                    <Link className="crm-row-title" to={`/admin/clients/${event.client_id}`}>{event.client_name}</Link>
                    <div className="crm-contact-line" style={{ flexDirection: 'column', marginTop: 8 }}>
                      {event.client_phone && <a href={`tel:${event.client_phone}`}><FiPhone size={13} /> {event.client_phone}</a>}
                      {whatsappLink(event.client_phone) && (
                        <a href={whatsappLink(event.client_phone)} target="_blank" rel="noopener noreferrer"><FiMessageCircle size={13} /> WhatsApp</a>
                      )}
                      {event.client_email && <a href={`mailto:${event.client_email}`}><FiMail size={13} /> {event.client_email}</a>}
                    </div>
                  </div>
                </div>

                <div className="crm-panel">
                  <PanelHeader title="Activity" />
                  {data.activity.length ? <ActivityTimeline items={data.activity} /> : <EmptyState>No activity yet.</EmptyState>}
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
          danger={!event.archived_at}
          title={event.archived_at ? 'Restore event' : 'Archive event'}
          message={event.archived_at
            ? `Restore ${event.event_name}?`
            : `Archive ${event.event_name}? It will be hidden from event lists and alerts. Payment history is kept.`}
          confirmLabel={event.archived_at ? 'Restore' : 'Archive'}
          busy={archive.busy}
          error={archive.error}
          onClose={close}
          onConfirm={async () => {
            try {
              await archive.run(`${API.cardhubEvents}/${event.id}${event.archived_at ? '/restore' : ''}`, { method: event.archived_at ? 'POST' : 'DELETE' });
              done();
            } catch { /* shown */ }
          }}
        />
      )}
    </AdminLayout>
  );
}
