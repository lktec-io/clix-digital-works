import { useEffect, useId, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { API, apiFetch } from '../../../config/api';
import { useDebounced, useFormState, useMutation, useSessionGuard } from '../../../hooks/useCrm';
import { fieldErrors, formatDate, formatTZS, localToday, qs } from '../../../utils/crm';
import { Modal, Field, Select, FormSection, FormError } from './ui';

const str = v => (v === null || v === undefined ? '' : String(v));
const pick = (source, defaults) =>
  Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, source?.[k] != null ? str(source[k]) : d]));

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
        className="crm-input"
        placeholder="Search by name or phone…"
        value={term}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        onChange={e => { setTerm(e.target.value); if (e.target.value.trim().length >= 2) setLoading(true); }}
      />
      {showResults && (
        <div className="crm-search-results" role="listbox">
          {loading && !results.length ? <div className="crm-search-empty">Searching…</div>
            : !results.length ? <div className="crm-search-empty">No clients found. Create the client first.</div>
              : results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="crm-search-item"
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
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
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);

  const onSubmit = () => (isEdit
    ? submit(`${API.projects}/${project.id}`, 'PUT', values)
    : submit(API.projects, 'POST', { ...values, client_id: selected?.id }));

  return (
    <FormModal
      title={isEdit ? `Edit ${project.project_name}` : 'New project'}
      submitLabel={isEdit ? 'Save changes' : 'Create project'}
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
    >
      <FormSection title="Project">
        {!isEdit && (
          <Field label="Client" required error={errors.client_id} full>
            {id => (client
              ? <div className="crm-picker-selected"><div>{client.full_name}{client.phone && <small>{client.phone}</small>}</div></div>
              : <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />)}
          </Field>
        )}
        <Field label="Project name" required error={errors.project_name}>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Pharmacy POS" {...bind('project_name')} />}
        </Field>
        <Field label="Service" error={errors.service}>
          {id => <input id={id} className="crm-input" maxLength={190} {...bind('service')} />}
        </Field>
        <Field label="Status" required error={errors.status}>
          {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.project_statuses} />}
        </Field>
        <Field
          label="Total price (TZS)"
          error={errors.total_price}
          hint={isEdit && Number(project.amount_paid) > 0 ? `Already paid: ${formatTZS(project.amount_paid)}` : undefined}
        >
          {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 2,500,000" {...bind('total_price')} />}
        </Field>
        <Field label="Expected start" error={errors.expected_start_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('expected_start_date')} />}
        </Field>
        <Field label="Expected completion" error={errors.expected_completion_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('expected_completion_date')} />}
        </Field>
        <Field label="Description / notes" error={errors.description} full>
          {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} {...bind('description')} />}
        </Field>
      </FormSection>
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

  return (
    <FormModal
      title="Record payment"
      submitLabel="Record payment"
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={() => submit(url, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
        {parentName} · Outstanding balance <strong className="crm-strong">{formatTZS(balance)}</strong>
      </p>
      <FormSection>
        <Field label="Amount (TZS)" required error={errors.amount} full>
          {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 500,000" {...bind('amount')} />}
        </Field>
        <Field label="Method" required error={errors.payment_method}>
          {id => <Select id={id} value={values.payment_method} onChange={v => set('payment_method', v)} options={options?.payment_methods} />}
        </Field>
        <Field label="Payment date" required error={errors.payment_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('payment_date')} />}
        </Field>
        <Field label="Reference" error={errors.reference} full hint="Transaction ID, receipt or bank reference">
          {id => <input id={id} className="crm-input" maxLength={100} {...bind('reference')} />}
        </Field>
        <Field label="Notes" error={errors.notes} full>
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
      title="Void payment"
      submitLabel="Void payment"
      busy={busy}
      onClose={onClose}
      onSubmit={() => submit(`${API.payments}/${payment.id}/void`, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
        Void the {formatTZS(payment.amount)} payment from {formatDate(payment.payment_date)}? The record is kept in
        history, marked as voided, and the balance is recalculated.
      </p>
      <Field label="Reason" required error={errors.reason}>
        {id => <input id={id} className="crm-input" maxLength={255} placeholder="e.g. Entered twice" {...bind('reason')} />}
      </Field>
    </FormModal>
  );
}

/* ── Follow-ups ──────────────────────────────────────────────────────────── */

export function FollowUpForm({ followUp, client, options, onClose, onSaved }) {
  const isEdit = Boolean(followUp?.id);
  const { values, set, bind } = useFormState(() => pick(followUp, {
    title: client?.interested_service ? `Follow up: ${client.interested_service}` : '',
    description: '', due_date: '', priority: client?.priority || 'medium',
  }));
  const [selected, setSelected] = useState(client || null);
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);

  const onSubmit = () => (isEdit
    ? submit(`${API.followUps}/${followUp.id}`, 'PUT', values)
    : submit(API.followUps, 'POST', { ...values, client_id: selected?.id }));

  return (
    <FormModal
      title={isEdit ? 'Edit follow-up' : 'New follow-up'}
      submitLabel={isEdit ? 'Save changes' : 'Add follow-up'}
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
    >
      <FormSection>
        {!isEdit && (
          <Field label="Client" required error={errors.client_id} full>
            {id => (client
              ? <div className="crm-picker-selected"><div>{client.full_name}{client.phone && <small>{client.phone}</small>}</div></div>
              : <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />)}
          </Field>
        )}
        <Field label="Title" required error={errors.title} full>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Call about pharmacy system" {...bind('title')} />}
        </Field>
        <Field label="Due date" required error={errors.due_date}>
          {id => <input id={id} className="crm-input" type="date" {...bind('due_date')} />}
        </Field>
        <Field label="Priority" required error={errors.priority}>
          {id => <Select id={id} value={values.priority} onChange={v => set('priority', v)} options={options?.priorities} />}
        </Field>
        <Field label="Details" error={errors.description} full>
          {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} placeholder='e.g. "Call me after Eid"' {...bind('description')} />}
        </Field>
      </FormSection>
    </FormModal>
  );
}

const SNOOZES = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 30, label: '1 month' },
];

export function RescheduleForm({ followUp, onClose, onSaved }) {
  const { values, bind } = useFormState(() => ({ due_date: '' }));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const url = `${API.followUps}/${followUp.id}/reschedule`;

  return (
    <FormModal
      title="Reschedule follow-up"
      submitLabel="Reschedule"
      busy={busy}
      disabled={!values.due_date}
      onClose={onClose}
      onSubmit={() => submit(url, 'POST', { due_date: values.due_date })}
      error={error}
      size="sm"
    >
      <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
        {followUp.title} · currently due {formatDate(followUp.due_date)}
      </p>
      <div className="crm-field" style={{ marginBottom: 'var(--space-md)' }}>
        <span className="crm-field-hint">Snooze</span>
        <div className="crm-card-actions">
          {SNOOZES.map(s => (
            <button key={s.days} type="button" className="crm-btn crm-btn-ghost crm-btn-sm" disabled={busy}
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
      title="Complete follow-up"
      submitLabel="Mark complete"
      busy={busy}
      onClose={onClose}
      onSubmit={() => submit(`${API.followUps}/${followUp.id}/complete`, 'POST', values)}
      error={error}
      size="sm"
    >
      <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
        {followUp.client_name ? `${followUp.client_name} · ` : ''}{followUp.title}
      </p>
      <Field label="Outcome (optional)" error={errors.outcome} hint="Saved to the client's notes">
        {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} placeholder="What was agreed?" {...bind('outcome')} />}
      </Field>
    </FormModal>
  );
}

/* ── CardHub event ───────────────────────────────────────────────────────── */

const EVENT_DEFAULTS = {
  event_type: 'wedding', event_name: '', event_date: '', event_location: '', expected_guests: '',
  card_type: '', number_of_cards: '', package: '', total_price: '', status: 'new', notes: '', external_reference: '',
};

export function CardHubEventForm({ event, client, options, onClose, onSaved, onNewCustomer }) {
  const isEdit = Boolean(event?.id);
  const { values, set, bind } = useFormState(() => pick(event, EVENT_DEFAULTS));
  const [selected, setSelected] = useState(() => (event
    ? { id: event.client_id, full_name: event.client_name, phone: event.client_phone }
    : client || null));
  const { submit, busy, error } = useSubmit(onSaved);
  const errors = fieldErrors(error);
  const customerLocked = isEdit && Number(event.amount_paid) > 0;

  const onSubmit = () => submit(
    isEdit ? `${API.cardhubEvents}/${event.id}` : API.cardhubEvents,
    isEdit ? 'PUT' : 'POST',
    { ...values, client_id: selected?.id },
  );

  return (
    <FormModal
      title={isEdit ? `Edit ${event.event_name}` : 'New CardHub event'}
      submitLabel={isEdit ? 'Save changes' : 'Create event'}
      busy={busy}
      disabled={!options}
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
      size="lg"
    >
      <FormSection title="Customer">
        <Field
          label="Customer"
          required
          error={errors.client_id}
          full
          hint={customerLocked ? 'Customer cannot be changed after payments are recorded' : undefined}
        >
          {id => (client || customerLocked
            ? <div className="crm-picker-selected"><div>{selected?.full_name}{selected?.phone && <small>{selected.phone}</small>}</div></div>
            : (
              <>
                <ClientPicker id={id} value={selected} onChange={setSelected} error={errors.client_id} />
                {!selected && onNewCustomer && (
                  <button type="button" className="crm-link" style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }} onClick={onNewCustomer}>
                    + New customer
                  </button>
                )}
              </>
            ))}
        </Field>
      </FormSection>

      <FormSection title="Event">
        <Field label="Event type" required error={errors.event_type}>
          {id => <Select id={id} value={values.event_type} onChange={v => set('event_type', v)} options={options?.cardhub_event_types} />}
        </Field>
        <Field label="Event name" required error={errors.event_name}>
          {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. John & Asha" {...bind('event_name')} />}
        </Field>
        <Field label="Event date" error={errors.event_date} hint="Leave empty if not confirmed yet">
          {id => <input id={id} className="crm-input" type="date" {...bind('event_date')} />}
        </Field>
        <Field label="Location" error={errors.event_location}>
          {id => <input id={id} className="crm-input" maxLength={190} {...bind('event_location')} />}
        </Field>
        <Field label="Expected guests" error={errors.expected_guests}>
          {id => <input id={id} className="crm-input" type="number" min="0" inputMode="numeric" {...bind('expected_guests')} />}
        </Field>
        <Field label="Status" required error={errors.status}>
          {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.cardhub_event_statuses} />}
        </Field>
      </FormSection>

      <FormSection title="Cards & pricing">
        <Field label="Card type" error={errors.card_type}>
          {id => <input id={id} className="crm-input" maxLength={100} {...bind('card_type')} />}
        </Field>
        <Field label="Number of cards" error={errors.number_of_cards}>
          {id => <input id={id} className="crm-input" type="number" min="0" inputMode="numeric" {...bind('number_of_cards')} />}
        </Field>
        <Field label="Package" error={errors.package}>
          {id => <input id={id} className="crm-input" maxLength={100} {...bind('package')} />}
        </Field>
        <Field
          label="Total price (TZS)"
          error={errors.total_price}
          hint={isEdit && Number(event.amount_paid) > 0 ? `Already paid: ${formatTZS(event.amount_paid)}` : undefined}
        >
          {id => <input id={id} className="crm-input" inputMode="decimal" {...bind('total_price')} />}
        </Field>
        <Field label="Reference" error={errors.external_reference} hint="Optional CardHub order or invoice reference">
          {id => <input id={id} className="crm-input" maxLength={100} {...bind('external_reference')} />}
        </Field>
        <Field label="Notes" error={errors.notes} full>
          {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} {...bind('notes')} />}
        </Field>
      </FormSection>
    </FormModal>
  );
}
