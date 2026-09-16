import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiPhone, FiMail, FiMessageCircle, FiBriefcase, FiMapPin, FiEdit2, FiCalendar,
  FiMessageSquare, FiPlus, FiArchive, FiRotateCcw,
} from 'react-icons/fi';
import AdminLayout from '../AdminLayout';
import { API } from '../../../config/api';
import { useApi, useCrmOptions, useDialog, useMutation, useQueryFilters } from '../../../hooks/useCrm';
import {
  dueInfo, formatDate, formatDateTime, formatMonth, formatTZS, hasBalance, labelFor, whatsappLink,
} from '../../../utils/crm';
import {
  Badge, ConfirmDialog, DataView, EmptyState, FilterTabs, FormError, InfoList, PanelHeader, Select,
} from '../../../components/admin/crm/ui';
import {
  ActivityTimeline, EventRow, FollowUpDialogs, FollowUpRow, MoneySummary, PaymentRows, ProjectModal,
} from '../../../components/admin/crm/lists';
import ClientForm from '../../../components/admin/crm/ClientForm';
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

  const openFollowUps = data?.follow_ups.filter(x => x.status !== 'completed') || [];
  const tabs = data ? [
    { value: 'overview', label: 'Overview' },
    { value: 'projects', label: `Projects (${data.projects.length})` },
    { value: 'cardhub', label: `CardHub (${data.cardhub_events.length})` },
    { value: 'follow-ups', label: `Follow-ups (${openFollowUps.length})` },
    { value: 'payments', label: `Payments (${data.payments.length})` },
    { value: 'notes', label: `Notes (${data.notes.length})` },
    { value: 'activity', label: 'Activity' },
  ] : [];

  const changeStatus = async status => {
    try { await statusMutation.run(`${API.clients}/${id}/status`, { method: 'PATCH', body: { status } }); reload(); } catch { /* shown */ }
  };

  const goToNotes = () => {
    update({ tab: 'notes' });
    setTimeout(() => noteRef.current?.focus(), 50);
  };

  return (
    <AdminLayout title={client?.full_name || 'Client'}>
      <Link to="/admin/clients" className="crm-back"><FiArrowLeft size={14} /> Clients</Link>

      <DataView loading={loading} error={error} data={data} what="this client" onRetry={reload} rows={6} cols={3}>
        {client && (
          <div className="crm-stack">
            {/* ── Header ── */}
            <div className="crm-panel">
              <div className="crm-detail-head">
                <div className="crm-detail-identity">
                  <h2>{client.full_name}</h2>
                  <div className="crm-detail-badges">
                    <Badge value={client.status} options={options?.client_statuses} />
                    <Badge value={client.priority} label={`${labelFor(options?.priorities, client.priority)} priority`} />
                    <Badge value="muted" label={labelFor(options?.client_sources, client.source)} tone="muted" />
                    {client.archived_at && <Badge value="cancelled" label="Archived" />}
                  </div>
                  <div className="crm-contact-line">
                    {client.phone && <a href={`tel:${client.phone}`}><FiPhone size={13} /> {client.phone}</a>}
                    {whatsappLink(client.phone) && (
                      <a href={whatsappLink(client.phone)} target="_blank" rel="noopener noreferrer"><FiMessageCircle size={13} /> WhatsApp</a>
                    )}
                    {client.email && <a href={`mailto:${client.email}`}><FiMail size={13} /> {client.email}</a>}
                    {client.company && <span><FiBriefcase size={13} /> {client.company}</span>}
                    {(client.location || client.city || client.region) && (
                      <span><FiMapPin size={13} /> {[client.location, client.city, client.region].filter(Boolean).join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="crm-page-actions">
                  {!client.archived_at && (
                    <>
                      <Select
                        aria-label="Change status"
                        value={client.status}
                        onChange={changeStatus}
                        options={options?.client_statuses}
                        disabled={statusMutation.busy || !options}
                        style={{ width: 'auto' }}
                      />
                      <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('edit')}><FiEdit2 size={13} /> Edit</button>
                      <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('followup')}><FiCalendar size={13} /> Follow-up</button>
                      <button type="button" className="crm-btn crm-btn-ghost" onClick={goToNotes}><FiMessageSquare size={13} /> Note</button>
                    </>
                  )}
                  <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('archive')}>
                    {client.archived_at ? <><FiRotateCcw size={13} /> Restore</> : <><FiArchive size={13} /> Archive</>}
                  </button>
                </div>
              </div>
              {statusMutation.error && <div style={{ padding: '0 var(--space-lg) var(--space-md)' }}><FormError error={statusMutation.error} /></div>}
              <MoneySummary
                total={data.summary.total_billed}
                paid={data.summary.total_paid}
                balance={data.summary.balance}
                labels={['Total value', 'Paid', 'Owes']}
              />
            </div>

            <FilterTabs tabs={tabs} value={f.tab} onChange={tab => update({ tab })} label="Client sections" flush />

            {f.tab === 'overview' && (
              <div className="crm-detail-grid">
                <div className="crm-stack">
                  <div className="crm-panel">
                    <PanelHeader title="Next follow-ups">
                      {!client.archived_at && (
                        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => open('followup')}><FiPlus size={12} /> Add</button>
                      )}
                    </PanelHeader>
                    {openFollowUps.length
                      ? <ul className="crm-rows">{openFollowUps.slice(0, 5).map(x => <FollowUpRow key={x.id} item={x} today={today} showClient={false} onAction={open} />)}</ul>
                      : <EmptyState>No open follow-ups.</EmptyState>}
                  </div>

                  <div className="crm-panel">
                    <PanelHeader title="Projects & CardHub events" />
                    {data.projects.length || data.cardhub_events.length ? (
                      <ul className="crm-rows">
                        {data.projects.filter(p => !p.archived_at).map(p => (
                          <ProjectRow key={`p${p.id}`} project={p} options={options} onOpen={() => open('project', p)} />
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
                    <PanelHeader title="Details" />
                    <div className="crm-panel-body" style={{ paddingTop: 0, paddingBottom: 0 }}>
                      <InfoList single items={[
                        { label: 'Interested service', value: client.interested_service },
                        { label: 'Expected start', value: client.expected_start_date ? formatMonth(client.expected_start_date) : null },
                        {
                          label: 'Next follow-up',
                          value: client.next_follow_up_date
                            ? <span className={`crm-text-${dueInfo(client.next_follow_up_date, today).tone}`}>{formatDate(client.next_follow_up_date)} · {dueInfo(client.next_follow_up_date, today).label}</span>
                            : null,
                        },
                        { label: 'Estimated budget', value: client.estimated_budget ? formatTZS(client.estimated_budget) : null },
                        { label: 'Last contacted', value: client.last_contacted_at ? formatDateTime(client.last_contacted_at) : 'Never' },
                        { label: 'Client since', value: formatDateTime(client.created_at) },
                      ]} />
                    </div>
                  </div>

                  <div className="crm-panel">
                    <PanelHeader title="Latest notes">
                      <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={goToNotes}>All notes</button>
                    </PanelHeader>
                    {data.notes.length
                      ? data.notes.slice(0, 3).map(n => <NoteItem key={n.id} note={n} />)
                      : <EmptyState>No notes yet.</EmptyState>}
                  </div>
                </div>
              </div>
            )}

            {f.tab === 'projects' && (
              <div className="crm-panel">
                <PanelHeader title="Projects">
                  {!client.archived_at && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('newProject')}><FiPlus size={12} /> New project</button>
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
                  {!client.archived_at && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('newEvent')}><FiPlus size={12} /> New event</button>
                  )}
                </PanelHeader>
                {data.cardhub_events.length
                  ? <ul className="crm-rows">{data.cardhub_events.map(e => <EventRow key={e.id} event={e} options={options} today={today} showClient={false} />)}</ul>
                  : <EmptyState>No CardHub events for this client.</EmptyState>}
              </div>
            )}

            {f.tab === 'follow-ups' && (
              <div className="crm-panel">
                <PanelHeader title="Follow-ups">
                  {!client.archived_at && (
                    <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => open('followup')}><FiPlus size={12} /> Add follow-up</button>
                  )}
                </PanelHeader>
                {data.follow_ups.length
                  ? <ul className="crm-rows">{data.follow_ups.map(x => <FollowUpRow key={x.id} item={x} today={today} showClient={false} onAction={open} />)}</ul>
                  : <EmptyState>No follow-ups for this client.</EmptyState>}
              </div>
            )}

            {f.tab === 'payments' && (
              <div className="crm-panel">
                <PanelHeader title="Payments" />
                {data.payments.length
                  ? <PaymentRows payments={data.payments} options={options} showParent onVoid={p => open('void', p)} />
                  : <EmptyState>No payments recorded. Add payments from a project or CardHub event.</EmptyState>}
              </div>
            )}

            {f.tab === 'notes' && (
              <div className="crm-panel">
                <PanelHeader title="Notes" />
                <NoteForm clientId={client.id} inputRef={noteRef} onSaved={reload} />
                {data.notes.length
                  ? data.notes.map(n => <NoteItem key={n.id} note={n} />)
                  : <EmptyState>No notes yet. Notes are permanent communication history.</EmptyState>}
              </div>
            )}

            {f.tab === 'activity' && (
              <div className="crm-panel">
                <PanelHeader title="Activity" />
                {data.activity.length ? <ActivityTimeline items={data.activity} /> : <EmptyState>No activity yet.</EmptyState>}
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
          {dialog?.type === 'archive' && (
            <ConfirmDialog
              open
              danger={!client.archived_at}
              title={client.archived_at ? 'Restore client' : 'Archive client'}
              message={client.archived_at
                ? `Restore ${client.full_name} to active clients?`
                : `Archive ${client.full_name}? They will be hidden from lists and reminders. Projects, events, payments and notes are kept.`}
              confirmLabel={client.archived_at ? 'Restore' : 'Archive'}
              busy={archiveMutation.busy}
              error={archiveMutation.error}
              onClose={close}
              onConfirm={async () => {
                try {
                  await archiveMutation.run(`${API.clients}/${client.id}${client.archived_at ? '/restore' : ''}`, {
                    method: client.archived_at ? 'POST' : 'DELETE',
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

function ProjectRow({ project, options, onOpen, onPay }) {
  return (
    <li className="crm-row">
      <div className="crm-row-main">
        <button type="button" className="crm-link crm-row-title" onClick={onOpen}>{project.project_name}</button>
        <div className="crm-row-sub">
          {[project.service, project.expected_start_date && `Start ${formatDate(project.expected_start_date)}`].filter(Boolean).join(' · ') || 'Project'}
        </div>
        {Number(project.total_price) > 0 && (
          <div className="crm-row-sub crm-money">
            {formatTZS(project.amount_paid, 'TZS 0')} of {formatTZS(project.total_price)}
            {hasBalance(project.balance) && <> · <span className="crm-text-amber">owes {formatTZS(project.balance)}</span></>}
          </div>
        )}
      </div>
      <div className="crm-row-side">
        <Badge value={project.status} options={options?.project_statuses} />
        {project.archived_at && <Badge value="cancelled" label="Archived" />}
        {onPay && !project.archived_at && hasBalance(project.balance) && (
          <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={onPay}><FiPlus size={12} /> Payment</button>
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
      <label htmlFor="crm-new-note" className="crm-sr-only">New note</label>
      <textarea
        id="crm-new-note"
        ref={inputRef}
        className="crm-input"
        rows={3}
        maxLength={5000}
        placeholder="e.g. Followed up via WhatsApp. Client said they are still preparing."
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="crm-note-form-foot">
        <label className="crm-check">
          <input type="checkbox" checked={contacted} onChange={e => setContacted(e.target.checked)} />
          I contacted the client
        </label>
        <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" disabled={busy || !body.trim()}>
          {busy ? 'Saving…' : 'Add note'}
        </button>
      </div>
      <FormError error={error} />
    </form>
  );
}
