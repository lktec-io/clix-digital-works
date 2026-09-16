import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { API, apiFetch } from '../../../config/api';
import { useFormState, useMutation, useSessionGuard } from '../../../hooks/useCrm';
import { fieldErrors, labelFor, qs } from '../../../utils/crm';
import { Modal, Field, Select, FormSection, FormError } from './ui';

const EMPTY = {
  full_name: '', phone: '', email: '', company: '', location: '', city: '', region: '',
  source: 'whatsapp', status: 'lead', priority: 'medium',
  interested_service: '', estimated_budget: '', expected_start_date: '',
  next_follow_up_date: '', next_follow_up_title: '', initial_note: '',
};

const fromClient = c => Object.fromEntries(
  Object.keys(EMPTY).map(k => [k, c?.[k] === null || c?.[k] === undefined ? EMPTY[k] : String(c[k])]),
);

/**
 * Create / edit a client. On create it can also record an opening note and
 * schedule the first follow-up in the same transaction. Possible duplicates
 * (same phone or email) are shown as a warning only — family members and
 * businesses legitimately share contact details.
 */
export default function ClientForm({ client, initial, options, onClose, onSaved }) {
  const isEdit = Boolean(client?.id);
  const formId = useId();
  const { values, set, bind } = useFormState(() => fromClient(client || initial));
  const { run, busy, error } = useMutation();
  const [duplicates, setDuplicates] = useState([]);
  const guard = useSessionGuard();

  const errors = fieldErrors(error);

  const checkDuplicates = async () => {
    const phone = values.phone.trim();
    const email = values.email.trim();
    if (!phone && !email) { setDuplicates([]); return; }
    try {
      const res = await apiFetch(`${API.clients}/duplicates${qs({ phone, email, exclude_id: client?.id })}`);
      setDuplicates(res.data);
    } catch (err) {
      guard(err); // a failed hint is non-blocking
    }
  };

  const submit = async e => {
    e.preventDefault();
    const body = { ...values };
    if (isEdit) {
      delete body.next_follow_up_date;
      delete body.next_follow_up_title;
      delete body.initial_note;
    }
    try {
      const res = await run(isEdit ? `${API.clients}/${client.id}` : API.clients, {
        method: isEdit ? 'PUT' : 'POST', body,
      });
      onSaved?.(isEdit ? client.id : res.id, values);
    } catch { /* shown via error */ }
  };

  return (
    <Modal
      open
      title={isEdit ? `Edit ${client.full_name}` : 'New client'}
      onClose={onClose}
      busy={busy}
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form={formId} className="crm-btn crm-btn-primary" disabled={busy || !options}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
          </button>
        </>
      )}
    >
      <form id={formId} onSubmit={submit} noValidate>
        {duplicates.length > 0 && (
          <div className="crm-notice" role="status">
            <strong>Possible existing client.</strong> Same phone or email as:
            <ul>
              {duplicates.map(d => (
                <li key={d.id}>
                  <Link className="crm-link" to={`/admin/clients/${d.id}`} onClick={onClose}>{d.full_name}</Link>
                  {' '}<span className="crm-muted">
                    {[d.phone, d.email, labelFor(options?.client_statuses, d.status)].filter(Boolean).join(' · ')}
                    {d.archived_at ? ' · archived' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FormSection title="Basic information">
          <Field label="Full name" required error={errors.full_name} full>
            {id => <input id={id} className="crm-input" autoComplete="off" maxLength={190} {...bind('full_name')} />}
          </Field>
          <Field label="Phone" error={errors.phone}>
            {id => <input id={id} className="crm-input" type="tel" inputMode="tel" autoComplete="off" placeholder="07XX XXX XXX" {...bind('phone')} onBlur={checkDuplicates} />}
          </Field>
          <Field label="Email" error={errors.email}>
            {id => <input id={id} className="crm-input" type="email" autoComplete="off" {...bind('email')} onBlur={checkDuplicates} />}
          </Field>
          <Field label="Company" error={errors.company}>
            {id => <input id={id} className="crm-input" maxLength={190} {...bind('company')} />}
          </Field>
          <Field label="Location / area" error={errors.location}>
            {id => <input id={id} className="crm-input" maxLength={190} {...bind('location')} />}
          </Field>
          <Field label="City" error={errors.city}>
            {id => <input id={id} className="crm-input" maxLength={100} {...bind('city')} />}
          </Field>
          <Field label="Region" error={errors.region}>
            {id => <input id={id} className="crm-input" maxLength={100} {...bind('region')} />}
          </Field>
        </FormSection>

        <FormSection title="Business information">
          <Field label="Status" required error={errors.status}>
            {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.client_statuses} />}
          </Field>
          <Field label="Source" required error={errors.source}>
            {id => <Select id={id} value={values.source} onChange={v => set('source', v)} options={options?.client_sources} />}
          </Field>
          <Field label="Priority" required error={errors.priority}>
            {id => <Select id={id} value={values.priority} onChange={v => set('priority', v)} options={options?.priorities} />}
          </Field>
          <Field label="Interested service" error={errors.interested_service}>
            {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Pharmacy Management System" {...bind('interested_service')} />}
          </Field>
          <Field label="Estimated budget (TZS)" error={errors.estimated_budget}>
            {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 2,500,000" {...bind('estimated_budget')} />}
          </Field>
          <Field label="Expected start date" error={errors.expected_start_date}>
            {id => <input id={id} className="crm-input" type="date" {...bind('expected_start_date')} />}
          </Field>
        </FormSection>

        {!isEdit && (
          <FormSection title="Follow-up & notes">
            <Field label="Next follow-up date" error={errors.next_follow_up_date} hint="Creates a reminder on the dashboard">
              {id => <input id={id} className="crm-input" type="date" {...bind('next_follow_up_date')} />}
            </Field>
            <Field label="Follow-up title" error={errors.next_follow_up_title}>
              {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Confirm project start" {...bind('next_follow_up_title')} />}
            </Field>
            <Field label="Notes" error={errors.initial_note} full>
              {id => <textarea id={id} className="crm-input" rows={3} maxLength={5000} placeholder="What did the client say?" {...bind('initial_note')} />}
            </Field>
          </FormSection>
        )}

        <FormError error={error} />
      </form>
    </Modal>
  );
}
