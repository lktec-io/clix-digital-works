import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiPhone, FiMail, FiMessageCircle, FiEdit2, FiCalendar, FiMessageSquare, FiPlus,
  FiArchive, FiRotateCcw, FiGift, FiBriefcase, FiTrendingDown,
} from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useMutation, useQueryFilters } from '../../../hooks/useCrm';
import {
  dueInfo, formatDate, formatDateTime, formatMonth, formatTZS, hasBalance, labelFor, STATUS_HELP, SW, whatsappLink,
} from '../../../utils/crm';
import {
  Badge, ConfirmDialog, DataView, EmptyState, FormError, InfoList, MoreMenu, PanelHeader, SectionNav, Select,
} from '../../../components/admin/crm/ui';
import {
  ActivityTimeline, EventRow, ExpenseRows, FollowUpDialogs, FollowUpRow, PaymentRows, ProfitSummary, ProjectModal,
} from '../../../components/admin/crm/lists';
import ClientForm from '../../../components/admin/crm/ClientForm';
import ExpenseForm, { VoidExpenseForm } from '../../../components/admin/crm/ExpenseForm';
import {
  CardHubEventForm, FollowUpForm, PaymentForm, ProjectForm, VoidPaymentForm,
} from '../../../components/admin/crm/forms';

export default function AdminClientDetail() {
  const { id } = useParams();
  const { options } = useCrmOptions();
  const { data, loading, error, reload } = useApi(`${API.clients}/${id}`);
  const [f, update] = useQueryFilters({ tab: 'overview' });
  const { dialog, open, close } = useDialog();
  const statusMutation = useMutation();
  const archiveMutation = useMutation();
  const noteRef = useRef(null);

  const client = data?.data;
  const today = data?.today || options?.today;
  const done = () => { close(); reload(); };
  const archived = Boolean(client?.archived_at);

  const openFollowUps = data?.follow_ups.filter(x => x.status !== 'completed') || [];
  const sections = data ? [
    { value: 'overview', label: 'Overview' },
    { value: 'follow-ups', label: `Follow-ups (${openFollowUps.length})` },
    { value: 'projects', label: `Projects (${data.projects.length})` },
    { value: 'cardhub', label: `CardHub (${data.cardhub_events.length})` },
    { value: 'payments', label: `Money (${data.payments.length + (data.expenses?.length || 0)})` },
    { value: 'notes', label: `Notes (${data.notes.length})` },
    { value: 'activity', label: 'History' },
  ] : [];

  const changeStatus = async status => {
    try { await statusMutation.run(`${API.clients}/${id}/status`, { method: 'PATCH', body: { status } }); reload(); } catch { /* shown */ }
  };

  const goToNotes = () => {
    update({ tab: 'notes' });
    setTimeout(() => noteRef.current?.focus(), 60);
  };

  const nextDue = client?.next_follow_up_date ? dueInfo(client.next_follow_up_date, today) : null;

  return (
    <AdminLayout title={client?.full_name || 'Client'}>
      <Link to="/admin/clients" className="crm-back"><FiArrowLeft size={14} aria-hidden="true" /> Clients</Link>

      <DataView loading={loading} error={error} data={data} what="this client" onRetry={reload} rows={6} cols={3}>
        {client && (
          <div className="crm-stack">
            {/* ── Who is this, and what needs doing ── */}
            <div className="crm-panel">
              <div className="crm-detail-head">
                <div className="crm-detail-identity">
                  <h2>{client.full_name}</h2>
                  <div className="crm-detail-badges">
                    <Badge value={client.status} options={options?.client_statuses} />
                    {client.priority === 'high' && <Badge value="high" label="High priority" />}
                    {archived && <Badge value="cancelled" label="Archived" />}
                  </div>
                  <div className="crm-contact-line">
                    {client.phone && <a href={`tel:${client.phone}`}><FiPhone size={14} aria-hidden="true" /> {client.phone}</a>}
                    {whatsappLink(client.phone) && (
                      <a href={whatsappLink(client.phone)} target="_blank" rel="noopener noreferrer"><FiMessageCircle size={14} aria-hidden="true" /> WhatsApp</a>
                    )}
                    {client.email && <a href={`mailto:${client.email}`}><FiMail size={14} aria-hidden="true" /> {client.email}</a>}
                  </div>
                </div>
              </div>

              <dl className="crm-facts">
                <div>
                  <dt>Next follow-up</dt>
                  <dd>
                    {nextDue
                      ? <span className={`crm-text-${nextDue.tone}`}>{nextDue.tone === 'muted' ? formatDate(client.next_follow_up_date) : `${nextDue.label} · ${formatDate(client.next_follow_up_date)}`}</span>
                      : <span className="crm-muted">None scheduled</span>}
                  </dd>
                </div>
                <div>
                  <dt>Owes</dt>
                  <dd>
                    {hasBalance(data.summary.balance)
                      ? <span className="crm-text-amber">{formatTZS(data.summary.balance)}</span>
                      : <span className="crm-muted">{Number(data.summary.total_billed) > 0 ? 'Fully paid' : 'Nothing yet'}</span>}
                  </dd>
                </div>
                <div>
                  <dt>Needs</dt>
                  <dd>
                    {client.interested_service || <span className="crm-muted">Not recorded</span>}
                    {client.expected_start_date && <span className="crm-muted"> · starts {formatMonth(client.expected_start_date)}</span>}
                  </dd>
                </div>
              </dl>

              <div className="crm-detail-actions">
                {!archived && (
                  <>
                    <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('followup')}>
                      <FiCalendar size={14} aria-hidden="true" /> Add Follow-up
                    </button>
                    <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('newProject')}>
                      <FiPlus size={14} aria-hidden="true" /> Add Project
                    </button>
                    <button type="button" className="crm-btn crm-btn-ghost" onClick={goToNotes}>
                      <FiMessageSquare size={14} aria-hidden="true" /> Add Note
                    </button>
                  </>
                )}
                <MoreMenu items={[
                  !archived && { label: 'Edit client', icon: FiEdit2, onClick: () => open('edit') },
                  !archived && { label: 'Add CardHub event', icon: FiGift, onClick: () => open('newEvent') },
                  !archived && { label: 'Add expense', icon: FiTrendingDown, onClick: () => open('expense') },
                  { label: archived ? 'Restore client' : 'Archive client', icon: archived ? FiRotateCcw : FiArchive, danger: !archived, onClick: () => open('archive') },
                ]} />
                {!archived && (
                  <label className="crm-status-control">
                    <span>Status</span>
                    <Select
                      aria-label="Change client status"
                      value={client.status}
                      onChange={changeStatus}
                      options={options?.client_statuses}
                      disabled={statusMutation.busy || !options}
                    />
                  </label>
                )}
              </div>
              {!archived && STATUS_HELP.client[client.status] && (
                <p className="crm-status-help"><span className="crm-sw">{SW.status}</span> {STATUS_HELP.client[client.status]}</p>
              )}
              {statusMutation.error && <div className="crm-panel-body" style={{ paddingTop: 0 }}><FormError error={statusMutation.error} /></div>}
            </div>

            <SectionNav tabs={sections} value={f.tab} onChange={tab => update({ tab })} label="Client sections" />

            {f.tab === 'overview' && (
              <div className="crm-detail-grid">
                <div className="crm-stack">
                  <div className="crm-panel">
                    <PanelHeader title="Follow-ups">
                      {!archived && (
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('followup')}><FiPlus size={13} aria-hidden="true" /> Add</button>
                      )}
                    </PanelHeader>
                    {openFollowUps.length
                      ? <ul className="crm-rows">{openFollowUps.slice(0, 5).map(x => <FollowUpRow key={x.id} item={x} today={today} showClient={false} onAction={open} />)}</ul>
                      : <EmptyState sw="Weka tarehe ya kumfuatilia mteja huyu ili asisahaulike.">No follow-up scheduled.</EmptyState>}
                  </div>

                  <div className="crm-panel">
                    <PanelHeader title="Projects & events" />
                    {data.projects.some(p => !p.archived_at) || data.cardhub_events.some(e => !e.archived_at) ? (
                      <ul className="crm-rows">
                        {data.projects.filter(p => !p.archived_at).map(p => (
                          <ProjectRow key={`p${p.id}`} project={p} options={options} onOpen={() => open('project', p)} onPay={() => open('payProject', p)} />
                        ))}
                        {data.cardhub_events.filter(e => !e.archived_at).map(e => (
                          <EventRow key={`e${e.id}`} event={e} options={options} today={today} showClient={false} />
                        ))}
                      </ul>
                    ) : <EmptyState>No projects or events yet.</EmptyState>}
                  </div>
                </div>

                <div className="crm-stack">
                  <div className="crm-panel">
                    <PanelHeader title="Latest notes">
                      <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={goToNotes}>All notes</button>
                    </PanelHeader>
                    {data.notes.length
                      ? data.notes.slice(0, 3).map(n => <NoteItem key={n.id} note={n} />)
                      : <EmptyState>No notes yet.</EmptyState>}
                  </div>

                  <div className="crm-panel">
                    <PanelHeader title="Details" />
                    <div className="crm-panel-body crm-panel-body-flush">
                      <InfoList single items={[
                        client.company && { label: 'Company', value: client.company },
                        (client.location || client.city || client.region) && {
                          label: 'Location', value: [client.location, client.city, client.region].filter(Boolean).join(', '),
                        },
                        { label: 'Priority', value: labelFor(options?.priorities, client.priority) },
                        { label: 'How they found us', value: labelFor(options?.client_sources, client.source) },
                        client.estimated_budget && { label: 'Estimated budget', value: formatTZS(client.estimated_budget) },
                        { label: 'Last contacted', value: client.last_contacted_at ? formatDateTime(client.last_contacted_at) : 'Never' },
                        { label: 'Client since', value: formatDateTime(client.created_at) },
                      ]} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {f.tab === 'follow-ups' && (
              <div className="crm-panel">
                <PanelHeader title="Follow-ups">
                  {!archived && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('followup')}><FiPlus size={13} aria-hidden="true" /> Add Follow-up</button>
                  )}
                </PanelHeader>
                {data.follow_ups.length
                  ? <ul className="crm-rows">{data.follow_ups.map(x => <FollowUpRow key={x.id} item={x} today={today} showClient={false} onAction={open} />)}</ul>
                  : <EmptyState sw="Weka tarehe ya kumfuatilia mteja huyu ili asisahaulike.">No follow-ups for this client.</EmptyState>}
              </div>
            )}

            {f.tab === 'projects' && (
              <div className="crm-panel">
                <PanelHeader title="Projects">
                  {!archived && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('newProject')}><FiPlus size={13} aria-hidden="true" /> Add Project</button>
                  )}
                </PanelHeader>
                {data.projects.length
                  ? <ul className="crm-rows">{data.projects.map(p => <ProjectRow key={p.id} project={p} options={options} onOpen={() => open('project', p)} onPay={() => open('payProject', p)} />)}</ul>
                  : <EmptyState>No projects for this client yet.</EmptyState>}
              </div>
            )}

            {f.tab === 'cardhub' && (
              <div className="crm-panel">
                <PanelHeader title="CardHub events">
                  {!archived && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('newEvent')}><FiPlus size={13} aria-hidden="true" /> Add Event</button>
                  )}
                </PanelHeader>
                {data.cardhub_events.length
                  ? <ul className="crm-rows">{data.cardhub_events.map(e => <EventRow key={e.id} event={e} options={options} today={today} showClient={false} />)}</ul>
                  : <EmptyState>No CardHub events for this client.</EmptyState>}
              </div>
            )}

            {f.tab === 'payments' && (
              <div className="crm-stack">
                <div className="crm-panel">
                  <PanelHeader title="Financial summary" />
                  <ProfitSummary
                    money={{
                      contract_value: data.summary.total_billed,
                      collected: data.summary.total_paid,
                      outstanding: data.summary.balance,
                      costs: data.summary.costs,
                      collected_profit: data.summary.collected_profit,
                      contract_margin: (Number(data.summary.total_billed) - Number(data.summary.costs)).toFixed(2),
                    }}
                    labels={{ contract: 'Total value' }}
                  />
                </div>

                <div className="crm-panel">
                  <PanelHeader title={`Payments in (${data.payments.length})`} />
                  {data.payments.length
                    ? <PaymentRows payments={data.payments} options={options} showParent onVoid={p => open('void', p)} />
                    : <EmptyState sw="Malipo hurekodiwa kupitia project au tukio la CardHub.">No payments recorded yet.</EmptyState>}
                </div>

                <div className="crm-panel">
                  <PanelHeader title={`Costs out (${data.expenses?.length || 0})`}>
                    {!archived && (
                      <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('expense')}>
                        <FiPlus size={13} aria-hidden="true" /> Add Expense
                      </button>
                    )}
                  </PanelHeader>
                  {data.expenses?.length
                    ? <ExpenseRows expenses={data.expenses} options={options} showTarget
                        onEdit={x => open('editExpense', x)} onVoid={x => open('voidExpense', x)} />
                    : <EmptyState sw={SW.projectCost}>No costs recorded for this client.</EmptyState>}
                </div>
              </div>
            )}

            {f.tab === 'notes' && (
              <div className="crm-panel">
                <PanelHeader title="Notes" />
                <NoteForm clientId={client.id} inputRef={noteRef} onSaved={reload} />
                {data.notes.length
                  ? data.notes.map(n => <NoteItem key={n.id} note={n} />)
                  : <EmptyState sw="Andika kile mteja alichosema ili kisisahaulike.">No notes yet.</EmptyState>}
              </div>
            )}

            {f.tab === 'activity' && (
              <div className="crm-panel">
                <PanelHeader title="History" />
                {data.activity.length ? <ActivityTimeline items={data.activity} /> : <EmptyState>No history yet.</EmptyState>}
              </div>
            )}
          </div>
        )}
      </DataView>

      {client && (
        <>
          {dialog?.type === 'edit' && <ClientForm client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'followup' && <FollowUpForm client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'newProject' && <ProjectForm client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'newEvent' && <CardHubEventForm client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'project' && <ProjectModal projectId={dialog.item.id} options={options} onClose={close} onChanged={reload} />}
          {dialog?.type === 'payProject' && (
            <PaymentForm url={`${API.projects}/${dialog.item.id}/payments`} parentName={dialog.item.project_name}
              balance={dialog.item.balance} options={options} onClose={close} onSaved={done} />
          )}
          {dialog?.type === 'void' && <VoidPaymentForm payment={dialog.item} onClose={close} onSaved={done} />}
          {dialog?.type === 'expense' && <ExpenseForm client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'editExpense' && <ExpenseForm expense={dialog.item} client={client} options={options} onClose={close} onSaved={done} />}
          {dialog?.type === 'voidExpense' && <VoidExpenseForm expense={dialog.item} onClose={close} onSaved={done} />}
          {dialog?.type === 'archive' && (
            <ConfirmDialog
              open
              danger={!archived}
              title={archived ? 'Restore Client' : 'Archive Client'}
              message={archived
                ? `Restore ${client.full_name} to active clients?`
                : `Archive ${client.full_name}? They will be hidden from lists and reminders. Projects, events, payments and notes are kept.`}
              confirmLabel={archived ? 'Restore' : 'Archive'}
              busy={archiveMutation.busy}
              error={archiveMutation.error}
              onClose={close}
              onConfirm={async () => {
                try {
                  await archiveMutation.run(`${API.clients}/${client.id}${archived ? '/restore' : ''}`, {
                    method: archived ? 'POST' : 'DELETE',
                  });
                  done();
                } catch { /* shown */ }
              }}
            />
          )}
          <FollowUpDialogs dialog={dialog} close={close} options={options} onChanged={reload} />
        </>
      )}
    </AdminLayout>
  );
}

/** Project line with its money state visible without opening anything. */
function ProjectRow({ project, options, onOpen, onPay }) {
  const priced = Number(project.total_price) > 0;
  return (
    <li className="crm-row">
      <div className="crm-row-main">
        <span className="crm-eyebrow"><FiBriefcase size={11} aria-hidden="true" /> Project</span>
        <button type="button" className="crm-link crm-row-title" onClick={onOpen}>{project.project_name}</button>
        {(project.service || project.expected_start_date) && (
          <div className="crm-row-sub">
            {[project.service, project.expected_start_date && `Starts ${formatDate(project.expected_start_date)}`].filter(Boolean).join(' · ')}
          </div>
        )}
        {priced && (
          <div className="crm-row-sub crm-money-line">
            {formatTZS(project.total_price)} · Paid {formatTZS(project.amount_paid, 'TZS 0')}
            {hasBalance(project.balance) && <> · <span className="crm-text-amber">Balance {formatTZS(project.balance)}</span></>}
          </div>
        )}
      </div>
      <div className="crm-row-side">
        <Badge value={project.status} options={options?.project_statuses} />
        {project.archived_at && <Badge value="cancelled" label="Archived" />}
        {onPay && !project.archived_at && hasBalance(project.balance) && (
          <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={onPay}><FiPlus size={13} aria-hidden="true" /> Record Payment</button>
        )}
      </div>
    </li>
  );
}

function NoteItem({ note }) {
  return (
    <div className="crm-note">
      <div className="crm-note-meta">{formatDateTime(note.created_at)}{note.author ? ` · ${note.author}` : ''}</div>
      <div className="crm-note-body">{note.body}</div>
    </div>
  );
}

function NoteForm({ clientId, inputRef, onSaved }) {
  const [body, setBody] = useState('');
  const [contacted, setContacted] = useState(true);
  const { run, busy, error } = useMutation();

  const submit = async e => {
    e.preventDefault();
    try {
      await run(`${API.clients}/${clientId}/notes`, { body: { body, mark_contacted: contacted } });
      setBody('');
      onSaved();
    } catch { /* shown */ }
  };

  return (
    <form className="crm-note-form" onSubmit={submit}>
      <label htmlFor="crm-new-note" className="crm-field-label">New note</label>
      <textarea
        id="crm-new-note"
        ref={inputRef}
        className="crm-input"
        rows={3}
        maxLength={5000}
        placeholder="e.g. Called on WhatsApp. Client is still preparing."
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="crm-note-form-foot">
        <label className="crm-check">
          <input type="checkbox" checked={contacted} onChange={e => setContacted(e.target.checked)} />
          I spoke with the client
        </label>
        <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" disabled={busy || !body.trim()}>
          {busy ? 'Saving…' : 'Save Note'}
        </button>
      </div>
      <FormError error={error} />
    </form>
  );
}
