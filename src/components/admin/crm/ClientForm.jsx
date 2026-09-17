import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { API, apiFetch } from '../../../config/api';
import { useFormState, useMutation, useSessionGuard } from '../../../hooks/useCrm';
import { fieldErrors, labelFor, qs, STATUS_HELP, SW } from '../../../utils/crm';
import { Modal, Field, Select, FormSection, FormError, MoreDetails } from './ui';

const EMPTY = {
  full_name: '', phone: '', email: '', company: '', location: '', city: '', region: '',
  // Safe defaults: a new person is a Lead with normal priority. Source stays
  // neutral ("Other") rather than guessing where they came from.
  source: 'other', status: 'lead', priority: 'medium',
  interested_service: '', estimated_budget: '', expected_start_date: '',
  next_follow_up_date: '', next_follow_up_title: '', initial_note: '',
};

/** Fields that live behind "Add more details". */
const DETAIL_FIELDS = [
  'email', 'company', 'location', 'city', 'region', 'source', 'status', 'priority',
  'interested_service', 'estimated_budget', 'expected_start_date',
];

const fromClient = c => Object.fromEntries(
  Object.keys(EMPTY).map(k => [k, c?.[k] === null || c?.[k] === undefined ? EMPTY[k] : String(c[k])]),
);

/**
 * Add / edit a client. Adding needs only a name (phone recommended); a
 * follow-up date and a note can be captured in the same step so the person is
 * never forgotten. Everything else is optional and tucked behind
 * "Add more details". Possible duplicates (same phone or email) are shown as a
 * warning only — family members and businesses legitimately share contacts.
 */
export default function ClientForm({ client, initial, options, onClose, onSaved }) {
  const isEdit = Boolean(client?.id);
  const formId = useId();
  const { values, set, bind } = useFormState(() => fromClient(client || initial));
  const { run, busy, error } = useMutation();
  const [duplicates, setDuplicates] = useState([]);
  const [showMore, setShowMore] = useState(isEdit);
  const guard = useSessionGuard();

  const errors = fieldErrors(error);
  const detailsOpen = showMore || DETAIL_FIELDS.some(f => errors[f]);

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
      title={isEdit ? `Edit ${client.full_name}` : 'Add Client'}
      onClose={onClose}
      busy={busy}
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form={formId} className="crm-btn crm-btn-primary" disabled={busy || !options}>
            {busy ? 'Saving…' : 'Save Client'}
          </button>
        </>
      )}
    >
      <form id={formId} onSubmit={submit} noValidate>
        {duplicates.length > 0 && (
          <div className="crm-notice" role="status">
            <strong>This client may already exist.</strong> Same phone or email as:
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

        <FormSection title="Client">
          <Field label="Full name" required error={errors.full_name}>
            {id => <input id={id} className="crm-input" autoComplete="off" maxLength={190} placeholder="e.g. John Mwanga" {...bind('full_name')} />}
          </Field>
          <Field label="Phone" error={errors.phone}>
            {id => <input id={id} className="crm-input" type="tel" inputMode="tel" autoComplete="off" placeholder="07XX XXX XXX" {...bind('phone')} onBlur={checkDuplicates} />}
          </Field>
          {!isEdit && (
            <Field label="What do they need?" optional error={errors.interested_service} full>
              {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Pharmacy system, website, wedding cards" {...bind('interested_service')} />}
            </Field>
          )}
        </FormSection>

        {!isEdit && (
          <FormSection title="Follow-up">
            <Field label="Next follow-up date" optional sw={SW.followUpDate} error={errors.next_follow_up_date}>
              {id => <input id={id} className="crm-input" type="date" {...bind('next_follow_up_date')} />}
            </Field>
            <Field label="Reason" optional error={errors.next_follow_up_title}>
              {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Call to confirm start" {...bind('next_follow_up_title')} />}
            </Field>
            <Field label="Notes" optional error={errors.initial_note} full>
              {id => <textarea id={id} className="crm-input" rows={2} maxLength={5000} placeholder="What did the client say?" {...bind('initial_note')} />}
            </Field>
          </FormSection>
        )}

        <MoreDetails open={detailsOpen} onToggle={() => setShowMore(o => !o)}>
          <FormSection title="More details">
            <Field label="Status" sw={SW.status} hint={STATUS_HELP.client[values.status]} error={errors.status}>
              {id => <Select id={id} value={values.status} onChange={v => set('status', v)} options={options?.client_statuses} />}
            </Field>
            <Field label="Priority" sw={SW.priority} error={errors.priority}>
              {id => <Select id={id} value={values.priority} onChange={v => set('priority', v)} options={options?.priorities} />}
            </Field>
            {isEdit && (
              <Field label="What do they need?" optional error={errors.interested_service} full>
                {id => <input id={id} className="crm-input" maxLength={190} {...bind('interested_service')} />}
              </Field>
            )}
            <Field label="Expected start date" optional sw={SW.expectedStart} error={errors.expected_start_date}>
              {id => <input id={id} className="crm-input" type="date" {...bind('expected_start_date')} />}
            </Field>
            <Field label="Estimated budget (TZS)" optional sw={SW.budget} error={errors.estimated_budget}>
              {id => <input id={id} className="crm-input" inputMode="decimal" placeholder="e.g. 2,500,000" {...bind('estimated_budget')} />}
            </Field>
            <Field label="Email" optional error={errors.email}>
              {id => <input id={id} className="crm-input" type="email" autoComplete="off" {...bind('email')} onBlur={checkDuplicates} />}
            </Field>
            <Field label="Company" optional error={errors.company}>
              {id => <input id={id} className="crm-input" maxLength={190} {...bind('company')} />}
            </Field>
            <Field label="City" optional error={errors.city}>
              {id => <input id={id} className="crm-input" maxLength={100} {...bind('city')} />}
            </Field>
            <Field label="Area / street" optional error={errors.location}>
              {id => <input id={id} className="crm-input" maxLength={190} {...bind('location')} />}
            </Field>
            <Field label="Region" optional error={errors.region}>
              {id => <input id={id} className="crm-input" maxLength={100} {...bind('region')} />}
            </Field>
            <Field label="How they found us" sw={SW.source} error={errors.source}>
              {id => <Select id={id} value={values.source} onChange={v => set('source', v)} options={options?.client_sources} />}
            </Field>
          </FormSection>
        </MoreDetails>

        <FormError error={error} />
      </form>
    </Modal>
  );
}
