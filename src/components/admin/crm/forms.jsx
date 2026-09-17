import { useEffect, useId, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { API, apiFetch } from '../../../config/api';
import { useDebounced, useFormState, useMutation, useSessionGuard } from '../../../hooks/useCrm';
import {
  fieldErrors, formatDate, formatTZS, localToday, parseAmount, qs, STATUS_HELP, SW,
} from '../../../utils/crm';
import { Modal, Field, Select, FormSection, FormError, MoreDetails } from './ui';

const str = v => (v === null || v === undefined ? '' : String(v));
const pick = (source, defaults) =>
  Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, source?.[k] != null ? str(source[k]) : d]));

const addDaysLocal = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

/** Standard modal form: Cancel + submit button bound to the inner <form>. */
function FormModal({ title, submitLabel, busy, disabled, onClose, onSubmit, error, size, children }) {
  const formId = useId();
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      busy={busy}
      size={size}
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form={formId} className="crm-btn crm-btn-primary" disabled={busy || disabled}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </>
      )}
    >
      <form id={formId} onSubmit={e => { e.preventDefault(); onSubmit(); }} noValidate>
        {children}
        <FormError error={error} />
      </form>
    </Modal>
  );
}

/** Submits and calls onSaved; errors surface through useMutation's `error`. */
function useSubmit(onSaved) {
  const m = useMutation();
  const submit = async (url, method, body) => {
    try {
      const res = await m.run(url, { method, body });
      onSaved?.(res);
    } catch { /* rendered by FormError / field errors */ }
  };
  return { ...m, submit };
}

/** Read-only "who is this for" line used when the client is already known. */
function FixedClient({ client }) {
  return (
    <div className="crm-picker-selected">
      <div>{client.full_name}{client.phone && <small>{client.phone}</small>}</div>
    </div>
  );
}

/* ── Client picker (server-side search, never loads the whole table) ─────── */

export function ClientPicker({ id, value, onChange, error }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(term.trim(), 300);
  const guard = useSessionGuard();

  useEffect(() => {
    if (value || debounced.length < 2) return undefined;
    let alive = true;
    apiFetch(`${API.clients}${qs({ search: debounced, limit: 8, sort: 'name' })}`)
      .then(res => { if (alive) setResults(res.data); })
      .catch(err => { if (alive) { guard(err); setResults([]); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [debounced, value, guard]);

  if (value) {
    return (
      <div className="crm-picker-selected">
        <div>
          {value.full_name}
          {value.phone && <small>{value.phone}</small>}
        </div>
        <button type="button" className="crm-icon-btn" onClick={() => onChange(null)} aria-label="Change client">
          <FiX size={14} />
        </button>
      </div>
    );
  }

  const showResults = debounced.length >= 2 && term.trim().length >= 2;
  return (
    <div className="crm-picker">
      <input
        id={id}
        type="search"
        className="crm-input"
        placeholder="Search client name or phone…"
        value={term}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        onChange={e => { setTerm(e.target.value); if (e.target.value.trim().length >= 2) setLoading(true); }}
      />
      {showResults && (
        <div className="crm-search-results" role="listbox">
          {loading && !results.length ? <div className="crm-search-empty">Searching…</div>
            : !results.length ? <div className="crm-search-empty">No client found. Add the client first.</div>
              : results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="crm-search-item crm-search-option"
                  onClick={() => { onChange(c); setTerm(''); setResults([]); }}
                >
                  {c.full_name}
                  <small>{[c.phone, c.company, c.archived_at ? 'archived' : null].filter(Boolean).join(' · ')}</small>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

/* ── Project ─────────────────────────────────────────────────────────────── */

const PROJECT_DEFAULTS = {
  project_name: '', service: '', status: 'planned', total_price: '',
  expected_start_date: '', expected_completion_date: '', description: '',
};

export function ProjectForm({ project, client, options, onClose, onSaved }) {
  const isEdit = Boolean(project?.id);
  const { values, set, bind } = useFormState(() => ({
    ...pick(project, PROJECT_DEFAULTS),
    service: project ? str(project.service) : str(client?.interested_service),
  }));
  const [selected, setSelected] = useState(client || null);
  const [showMore, setShowMore] = useState(isEdit);
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const detailsOpen = showMore || ['service', 'expected_completion_date', 'description'].some(f => errors[f]);

  const onSubmit = () => (isEdit
    ? submit(`${API.projects}/${project.id}`, 'PUT', values)
    : submit(API.projects, 'POST', { ...values, client_id: selected?.id }));

  return (
    <FormModal
      title={isEdit ? `Edit ${project.project_name}` : 'Add Project'}
      submitLabel="Save Project"
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
    >
      <FormSection>
        {!isEdit && (
          <Field label="Client" required error={errors.client_id} full>
            {id => (client ? <FixedClient client={client} />
              : <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />)}
          </Field>
        )}
        <Field label="Project name" required error={errors.project_name} full>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Pharmacy POS" {...bind('project_name')} />}
        </Field>
        <Field
          label="Total price (TZS)"
          optional
          sw={SW.totalPrice}
          error={errors.total_price}
          hint={isEdit && Number(project.amount_paid) > 0 ? `Already paid: ${formatTZS(project.amount_paid)}` : undefined}
        >
          {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 2,500,000" {...bind('total_price')} />}
        </Field>
        <Field label="Status" hint={STATUS_HELP.project[values.status]} error={errors.status}>
          {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.project_statuses} />}
        </Field>
        <Field label="Expected start" optional sw={SW.expectedStart} error={errors.expected_start_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('expected_start_date')} />}
        </Field>
      </FormSection>

      <MoreDetails open={detailsOpen} onToggle={() => setShowMore(o => !o)}>
        <FormSection title="More details">
          <Field label="Service" optional error={errors.service}>
            {id => <input id={id} className="crm-input" maxLength={190} {...bind('service')} />}
          </Field>
          <Field label="Expected completion" optional error={errors.expected_completion_date}>
            {id => <input id={id} className="crm-input" type="date" {...bind('expected_completion_date')} />}
          </Field>
          <Field label="Description / notes" optional error={errors.description} full>
            {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} {...bind('description')} />}
          </Field>
        </FormSection>
      </MoreDetails>
    </FormModal>
  );
}

/* ── Payment (project or CardHub event) ──────────────────────────────────── */

export function PaymentForm({ url, parentName, balance, options, onClose, onSaved }) {
  const { values, set, bind } = useFormState(() => ({
    amount: '', payment_method: 'mpesa', payment_date: localToday(), reference: '', notes: '',
  }));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);

  // Display-only preview so mistakes are visible before saving; the server
  // still validates the amount and rejects overpayment.
  const current = Number(balance) || 0;
  const typed = parseAmount(values.amount);
  const remaining = typed === null ? null : Math.round((current - typed) * 100) / 100;

  return (
    <FormModal
      title="Record Payment"
      submitLabel="Record Payment"
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={() => submit(url, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-form-context">{parentName}</p>
      <dl className="crm-pay-preview" aria-live="polite">
        <div><dt>Current balance</dt><dd>{formatTZS(current, 'TZS 0')}</dd></div>
        <div><dt>This payment</dt><dd>{typed === null ? '—' : formatTZS(typed)}</dd></div>
        <div className={remaining !== null && remaining < 0 ? 'is-over' : ''}>
          <dt>Remaining</dt>
          <dd>{remaining === null ? '—' : remaining < 0 ? 'More than the balance' : formatTZS(remaining, 'TZS 0')}</dd>
        </div>
      </dl>
      <FormSection>
        <Field label="Amount (TZS)" required error={errors.amount} full>
          {id => <input id={id} className="crm-input crm-input-lg" inputMode="decimal" autoComplete="off" placeholder="e.g. 500,000" {...bind('amount')} />}
        </Field>
        <Field label="Method" error={errors.payment_method}>
          {id => <Select id={id} value={values.payment_method} onChange={v => set('payment_method', v)} options={options?.payment_methods} />}
        </Field>
        <Field label="Date" error={errors.payment_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('payment_date')} />}
        </Field>
        <Field label="Reference" optional sw={SW.reference} error={errors.reference} full>
          {id => <input id={id} className="crm-input" maxLength={100} placeholder="e.g. M-Pesa code" {...bind('reference')} />}
        </Field>
        <Field label="Notes" optional error={errors.notes} full>
          {id => <input id={id} className="crm-input" maxLength={500} {...bind('notes')} />}
        </Field>
      </FormSection>
    </FormModal>
  );
}

export function VoidPaymentForm({ payment, onClose, onSaved }) {
  const { bind, values } = useFormState(() => ({ reason: '' }));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  return (
    <FormModal
      title="Void Payment"
      submitLabel="Void Payment"
      busy={busy}
      onClose={onClose}
      onSubmit={() => submit(`${API.payments}/${payment.id}/void`, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
        Void the {formatTZS(payment.amount)} payment from {formatDate(payment.payment_date)}? It stays in the history,
        marked as voided, and the balance is recalculated.
      </p>
      <Field label="Reason" required error={errors.reason}>
        {id => <input id={id} className="crm-input" maxLength={255} placeholder="e.g. Entered twice" {...bind('reason')} />}
      </Field>
    </FormModal>
  );
}

/* ── Follow-ups ──────────────────────────────────────────────────────────── */

const QUICK_DATES = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: 'In 3 days' },
  { days: 7, label: 'Next week' },
  { days: 30, label: 'Next month' },
];

export function FollowUpForm({ followUp, client, options, onClose, onSaved }) {
  const isEdit = Boolean(followUp?.id);
  const { values, set, bind } = useFormState(() => pick(followUp, {
    title: client?.interested_service ? `Follow up: ${client.interested_service}` : '',
    description: '', due_date: '', priority: client?.priority || 'medium',
  }));
  const [selected, setSelected] = useState(client || null);
  const [showMore, setShowMore] = useState(isEdit && Boolean(followUp.description));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const today = localToday();

  const onSubmit = () => (isEdit
    ? submit(`${API.followUps}/${followUp.id}`, 'PUT', values)
    : submit(API.followUps, 'POST', { ...values, client_id: selected?.id }));

  return (
    <FormModal
      title={isEdit ? 'Edit Follow-up' : 'Add Follow-up'}
      submitLabel="Save Follow-up"
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
      size="sm"
    >
      <FormSection>
        {!isEdit && (
          <Field label="Follow-up for" required error={errors.client_id} full>
            {id => (client ? <FixedClient client={client} />
              : <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />)}
          </Field>
        )}
        <Field label="Reason" required error={errors.title} full>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Call about pharmacy system" {...bind('title')} />}
        </Field>
        <Field label="Date" required sw={SW.followUpDate} error={errors.due_date} full>
          {id => (
            <>
              <div className="crm-quick-dates" role="group" aria-label="Quick dates">
                {QUICK_DATES.map(q => {
                  const date = addDaysLocal(today, q.days);
                  return (
                    <button key={q.days} type="button"
                      className={`crm-chip${values.due_date === date ? ' is-active' : ''}`}
                      aria-pressed={values.due_date === date}
                      onClick={() => set('due_date', date)}>
                      {q.label}
                    </button>
                  );
                })}
              </div>
              <input id={id} className="crm-input" type="date" {...bind('due_date')} />
            </>
          )}
        </Field>
      </FormSection>

      <MoreDetails open={showMore || Boolean(errors.priority || errors.description)} onToggle={() => setShowMore(o => !o)} label="Add details">
        <FormSection>
          <Field label="Priority" sw={SW.priority} error={errors.priority}>
            {id => <Select id={id} value={values.priority} onChange={v => set('priority', v)} options={options?.priorities} />}
          </Field>
          <Field label="Details" optional error={errors.description} full>
            {id => <textarea id={id} className="crm-input" rows={2} maxLength={5000} placeholder='e.g. "Call me after Eid"' {...bind('description')} />}
          </Field>
        </FormSection>
      </MoreDetails>
    </FormModal>
  );
}

export function RescheduleForm({ followUp, onClose, onSaved }) {
  const { values, bind } = useFormState(() => ({ due_date: '' }));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const url = `${API.followUps}/${followUp.id}/reschedule`;

  return (
    <FormModal
      title="Reschedule"
      submitLabel="Save Date"
      busy={busy}
      disabled={!values.due_date}
      onClose={onClose}
      onSubmit={() => submit(url, 'POST', { due_date: values.due_date })}
      error={error}
      size="sm"
    >
      <p className="crm-form-context">
        {followUp.client_name ? `${followUp.client_name} · ` : ''}{followUp.title}
        <br /><span className="crm-muted">Currently {formatDate(followUp.due_date)}</span>
      </p>
      <div className="crm-field" style={{ marginBottom: 'var(--space-md)' }}>
        <span className="crm-field-label">Move to</span>
        <div className="crm-quick-dates">
          {QUICK_DATES.map(s => (
            <button key={s.days} type="button" className="crm-chip" disabled={busy}
              onClick={() => submit(url, 'POST', { snooze_days: s.days })}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Or pick a date" error={errors.due_date}>
        {id => <input id={id} className="crm-input" type="date" min={localToday()} {...bind('due_date')} />}
      </Field>
    </FormModal>
  );
}

export function CompleteFollowUpForm({ followUp, onClose, onSaved }) {
  const { values, bind } = useFormState(() => ({ outcome: '' }));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  return (
    <FormModal
      title="Complete Follow-up"
      submitLabel="Complete"
      busy={busy}
      onClose={onClose}
      onSubmit={() => submit(`${API.followUps}/${followUp.id}/complete`, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-form-context">
        {followUp.client_name ? `${followUp.client_name} · ` : ''}{followUp.title}
      </p>
      <Field label="What was agreed?" optional error={errors.outcome} hint="Saved to the client's notes">
        {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} placeholder="e.g. Will start in November" {...bind('outcome')} />}
      </Field>
    </FormModal>
  );
}

/* ── CardHub event ───────────────────────────────────────────────────────── */

const EVENT_DEFAULTS = {
  event_type: 'wedding', event_name: '', event_date: '', event_location: '', expected_guests: '',
  card_type: '', number_of_cards: '', package: '', total_price: '', status: 'new', notes: '', external_reference: '',
};

const EVENT_DETAIL_FIELDS = ['expected_guests', 'card_type', 'package', 'external_reference', 'notes'];

export function CardHubEventForm({ event, client, options, onClose, onSaved, onNewCustomer }) {
  const isEdit = Boolean(event?.id);
  const { values, set, bind } = useFormState(() => pick(event, EVENT_DEFAULTS));
  const [selected, setSelected] = useState(() => (event
    ? { id: event.client_id, full_name: event.client_name, phone: event.client_phone }
    : client || null));
  const [showMore, setShowMore] = useState(isEdit);
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const customerLocked = isEdit && Number(event.amount_paid) > 0;
  const detailsOpen = showMore || EVENT_DETAIL_FIELDS.some(f => errors[f]);

  const onSubmit = () => submit(
    isEdit ? `${API.cardhubEvents}/${event.id}` : API.cardhubEvents,
    isEdit ? 'PUT' : 'POST',
    { ...values, client_id: selected?.id },
  );

  return (
    <FormModal
      title={isEdit ? `Edit ${event.event_name}` : 'Add CardHub Event'}
      submitLabel={isEdit ? 'Update Event' : 'Save Event'}
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
    >
      <FormSection>
        <Field
          label="Customer"
          required
          error={errors.client_id}
          full
          hint={customerLocked ? 'The customer cannot change after payments are recorded.' : undefined}
        >
          {id => (client || customerLocked
            ? <FixedClient client={selected} />
            : (
              <>
                <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />
                {!selected && onNewCustomer && (
                  <button type="button" className="crm-link crm-inline-action" onClick={onNewCustomer}>
                    + Add new customer
                  </button>
                )}
              </>
            ))}
        </Field>
        <Field label="Event type" error={errors.event_type}>
          {id => <Select id={id} value={values.event_type} onChange={v => set('event_type', v)} options={options?.cardhub_event_types} />}
        </Field>
        <Field label="Event name" required error={errors.event_name}>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. John & Asha" {...bind('event_name')} />}
        </Field>
        <Field label="Event date" optional sw={SW.eventDate} hint="Leave empty if not confirmed yet" error={errors.event_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('event_date')} />}
        </Field>
        <Field label="Location" optional error={errors.event_location}>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Dar es Salaam" {...bind('event_location')} />}
        </Field>
        <Field label="Number of cards" optional error={errors.number_of_cards}>
          {id => <input id={id} className="crm-input" type="number" min="0" inputMode="numeric" {...bind('number_of_cards')} />}
        </Field>
        <Field
          label="Total price (TZS)"
          optional
          sw={SW.totalPrice}
          error={errors.total_price}
          hint={isEdit && Number(event.amount_paid) > 0 ? `Already paid: ${formatTZS(event.amount_paid)}` : undefined}
        >
          {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 850,000" {...bind('total_price')} />}
        </Field>
        <Field label="Status" hint={STATUS_HELP.event[values.status]} error={errors.status} full>
          {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.cardhub_event_statuses} />}
        </Field>
      </FormSection>

      <MoreDetails open={detailsOpen} onToggle={() => setShowMore(o => !o)}>
        <FormSection title="More details">
          <Field label="Expected guests" optional sw={SW.expectedGuests} error={errors.expected_guests}>
            {id => <input id={id} className="crm-input" type="number" min="0" inputMode="numeric" {...bind('expected_guests')} />}
          </Field>
          <Field label="Card type" optional error={errors.card_type}>
            {id => <input id={id} className="crm-input" maxLength={100} {...bind('card_type')} />}
          </Field>
          <Field label="Package" optional error={errors.package}>
            {id => <input id={id} className="crm-input" maxLength={100} {...bind('package')} />}
          </Field>
          <Field label="Order reference" optional hint="CardHub order or invoice number" error={errors.external_reference}>
            {id => <input id={id} className="crm-input" maxLength={100} {...bind('external_reference')} />}
          </Field>
          <Field label="Notes" optional error={errors.notes} full>
            {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} {...bind('notes')} />}
          </Field>
        </FormSection>
      </MoreDetails>
    </FormModal>
  );
}
