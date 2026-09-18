import { useEffect, useState } from 'react';
import { API, apiFetch } from '../../../config/api';
import { useFormState, useMutation, useSessionGuard } from '../../../hooks/useCrm';
import { fieldErrors, formatDate, formatTZS, localToday, SW } from '../../../utils/crm';
import { Modal, Field, Select, FormSection, FormError, MoreDetails } from './ui';
import { ClientPicker } from './forms';

const DEFAULTS = {
  title: '', amount: '', expense_type: 'project', category: '', expense_date: '',
  payment_method: '', vendor: '', reference: '', notes: '',
};

const str = v => (v === null || v === undefined ? '' : String(v));

/**
 * Add / edit a cost. The link fields only appear for a project expense, so a
 * general business cost is three fields plus a date. Nothing about client
 * payments is touched here — this records money going out.
 */
export default function ExpenseForm({ expense, client, project, event, options, onClose, onSaved }) {
  const isEdit = Boolean(expense?.id);
  // A cost opened from a project/event/client is pre-linked and stays that way.
  const locked = Boolean(client || project || event);

  const { values, set, bind } = useFormState(() => ({
    ...Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, expense?.[k] != null ? str(expense[k]) : d])),
    expense_date: expense?.expense_date || localToday(),
    expense_type: expense?.expense_type || (locked ? 'project' : 'general'),
  }));
  const [selectedClient, setSelectedClient] = useState(() => {
    if (client) return client;
    if (project) return { id: project.client_id, full_name: project.client_name };
    if (event) return { id: event.client_id, full_name: event.client_name };
    if (expense?.client_id) return { id: expense.client_id, full_name: expense.client_name };
    return null;
  });
  const [linkId, setLinkId] = useState(() => {
    if (project) return `project:${project.id}`;
    if (event) return `event:${event.id}`;
    if (expense?.project_id) return `project:${expense.project_id}`;
    if (expense?.cardhub_event_id) return `event:${expense.cardhub_event_id}`;
    return '';
  });
  const [links, setLinks] = useState([]);
  const [showMore, setShowMore] = useState(isEdit);
  const { run, busy, error } = useMutation();
  const guard = useSessionGuard();

  const errors = fieldErrors(error);
  const isProjectCost = values.expense_type === 'project';
  const clientId = selectedClient?.id;

  // Offer that client's projects and events to narrow the cost down.
  const wantsLinks = isProjectCost && clientId && !locked;
  useEffect(() => {
    if (!wantsLinks) return undefined;
    let alive = true;
    apiFetch(`${API.clients}/${clientId}`)
      .then(res => {
        if (!alive) return;
        setLinks([
          ...res.projects.filter(p => !p.archived_at).map(p => ({ value: `project:${p.id}`, label: `Project — ${p.project_name}` })),
          ...res.cardhub_events.filter(e => !e.archived_at).map(e => ({ value: `event:${e.id}`, label: `CardHub — ${e.event_name}` })),
        ]);
      })
      .catch(err => { if (alive) { guard(err); setLinks([]); } });
    return () => { alive = false; };
  }, [wantsLinks, clientId, guard]);
  const linkOptions = wantsLinks ? links : [];

  const submit = async e => {
    e.preventDefault();
    const [kind, id] = linkId ? linkId.split(':') : [];
    const body = {
      ...values,
      client_id: isProjectCost ? clientId || null : null,
      project_id: isProjectCost && kind === 'project' ? Number(id) : null,
      cardhub_event_id: isProjectCost && kind === 'event' ? Number(id) : null,
    };
    try {
      await run(isEdit ? `${API.expenses}/${expense.id}` : API.expenses, { method: isEdit ? 'PUT' : 'POST', body });
      onSaved?.();
    } catch { /* shown below */ }
  };

  const lockedName = project?.project_name || event?.event_name || selectedClient?.full_name;

  return (
    <Modal
      open
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      onClose={onClose}
      busy={busy}
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="crm-expense-form" className="crm-btn crm-btn-primary" disabled={busy || !options}>
            {busy ? 'Saving…' : 'Save Expense'}
          </button>
        </>
      )}
    >
      <form id="crm-expense-form" onSubmit={submit} noValidate>
        {locked && <p className="crm-form-context">Cost for {lockedName}</p>}

        <FormSection>
          <Field label="What was it for?" required error={errors.title} full>
            {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. SMS credits for wedding invitations" {...bind('title')} />}
          </Field>
          <Field label="Amount (TZS)" required sw={SW.expense} error={errors.amount}>
            {id => <input id={id} className="crm-input crm-input-lg" inputMode="decimal" autoComplete="off" placeholder="e.g. 80,000" {...bind('amount')} />}
          </Field>
          <Field label="Date" required error={errors.expense_date}>
            {id => <input id={id} className="crm-input" type="date" {...bind('expense_date')} />}
          </Field>
          {!locked && (
            <Field
              label="Type"
              required
              sw={isProjectCost ? SW.projectCost : SW.generalExpense}
              error={errors.expense_type}
              full
            >
              {id => <Select id={id} value={values.expense_type} onChange={v => set('expense_type', v)} options={options?.expense_types} />}
            </Field>
          )}
          <Field label="Category" required error={errors.category} full>
            {id => (
              <Select
                id={id}
                value={values.category}
                onChange={v => set('category', v)}
                options={options?.expense_categories}
                placeholder="Choose a category"
              />
            )}
          </Field>
        </FormSection>

        {isProjectCost && !locked && (
          <FormSection title="Who was it for?">
            <Field label="Client" required sw={SW.projectCost} error={errors.client_id} full>
              {id => <ClientPicker id={id} value={selectedClient} onChange={c => { setSelectedClient(c); setLinkId(''); }} error={errors.client_id} />}
            </Field>
            {clientId && (
              <Field label="Project or event" optional error={errors.project_id || errors.cardhub_event_id} full
                hint={linkOptions.length ? 'Leave empty to record it against the client only.' : 'This client has no projects or events yet.'}>
                {id => (
                  <Select id={id} value={linkId} onChange={setLinkId} options={linkOptions} placeholder="Client only" disabled={!linkOptions.length} />
                )}
              </Field>
            )}
          </FormSection>
        )}

        <MoreDetails open={showMore || Boolean(errors.payment_method || errors.vendor || errors.reference || errors.notes)} onToggle={() => setShowMore(o => !o)}>
          <FormSection title="More details">
            <Field label="Paid with" optional error={errors.payment_method}>
              {id => <Select id={id} value={values.payment_method} onChange={v => set('payment_method', v)} options={options?.payment_methods} placeholder="Not recorded" />}
            </Field>
            <Field label="Vendor / provider" optional error={errors.vendor}>
              {id => <input id={id} className="crm-input" maxLength={190} placeholder="e.g. Beem, Cloudinary" {...bind('vendor')} />}
            </Field>
            <Field label="Reference" optional sw={SW.reference} error={errors.reference}>
              {id => <input id={id} className="crm-input" maxLength={100} {...bind('reference')} />}
            </Field>
            <Field label="Notes" optional error={errors.notes} full>
              {id => <input id={id} className="crm-input" maxLength={500} {...bind('notes')} />}
            </Field>
          </FormSection>
        </MoreDetails>

        <FormError error={error} />
      </form>
    </Modal>
  );
}

/** Void keeps the record and its history; totals simply stop counting it. */
export function VoidExpenseForm({ expense, onClose, onSaved }) {
  const { values, bind } = useFormState(() => ({ reason: '' }));
  const { run, busy, error } = useMutation();
  const errors = fieldErrors(error);

  const submit = async e => {
    e.preventDefault();
    try {
      await run(`${API.expenses}/${expense.id}/void`, { method: 'POST', body: values });
      onSaved?.();
    } catch { /* shown below */ }
  };

  return (
    <Modal
      open
      title="Void Expense"
      onClose={onClose}
      busy={busy}
      size="sm"
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="crm-void-expense" className="crm-btn crm-btn-danger" disabled={busy}>
            {busy ? 'Saving…' : 'Void Expense'}
          </button>
        </>
      )}
    >
      <form id="crm-void-expense" onSubmit={submit} noValidate>
        <p className="crm-confirm-text" style={{ marginBottom: 'var(--space-md)' }}>
          Void {formatTZS(expense.amount)} — “{expense.title}” from {formatDate(expense.expense_date)}? It stays in the
          history, marked as voided, and stops counting towards costs and profit.
        </p>
        <Field label="Reason" required error={errors.reason}>
          {id => <input id={id} className="crm-input" maxLength={255} placeholder="e.g. Recorded twice" {...bind('reason')} />}
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  );
}
