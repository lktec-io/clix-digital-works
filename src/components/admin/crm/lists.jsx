import { Link } from 'react-router-dom';
import { FiCheck, FiClock, FiEdit2, FiPlus, FiRotateCcw, FiTrash2, FiArchive } from 'react-icons/fi';
import { API } from '../../../config/api';
import { useApi, useDialog, useMutation } from '../../../hooks/useCrm';
import {
  daysUntil, dueInfo, eventCountdown, formatDate, formatDateTime, formatTZS, hasBalance, labelFor, SW,
} from '../../../utils/crm';
import { Badge, ConfirmDialog, DataView, InfoList, Modal, MoreMenu } from './ui';
import {
  CompleteFollowUpForm, FollowUpForm, PaymentForm, ProjectForm, RescheduleForm, VoidPaymentForm,
} from './forms';

/* ── Follow-ups ─────────────────────────────────────────────────────────── */

/**
 * One follow-up. "Complete" is the primary action; Reschedule is secondary;
 * Edit/Remove live in a menu so the row stays calm.
 */
export function FollowUpRow({ item, today, onAction, showClient = true }) {
  const done = item.status === 'completed';
  const due = dueInfo(item.due_date, today, { closed: done });
  return (
    <li className="crm-row crm-fu-row">
      <div className="crm-row-main">
        {showClient
          ? <Link className="crm-row-title" to={`/admin/clients/${item.client_id}`}>{item.client_name}</Link>
          : <span className="crm-row-title">{item.title}</span>}
        <div className="crm-row-sub">
          {showClient ? item.title : item.description}
        </div>
        <div className="crm-row-meta">
          <span className={`crm-due crm-text-${due.tone}`}>
            {done ? `Completed ${formatDateTime(item.completed_at)}` : due.label}
          </span>
          {item.priority === 'high' && !done && <Badge value="high" label="High priority" />}
          {item.status === 'snoozed' && !done && <Badge value="snoozed" label="Snoozed" />}
        </div>
      </div>
      {onAction && (
        <div className="crm-row-actions-inline">
          {!done ? (
            <>
              <button type="button" className="crm-btn crm-btn-complete crm-btn-sm" onClick={() => onAction('fu.complete', item)}>
                <FiCheck size={14} aria-hidden="true" /> Complete
              </button>
              <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => onAction('fu.reschedule', item)}>
                <FiClock size={13} aria-hidden="true" /> Reschedule
              </button>
            </>
          ) : (
            <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => onAction('fu.reopen', item)}>
              <FiRotateCcw size={13} aria-hidden="true" /> Reopen
            </button>
          )}
          {!showClient && (
            <MoreMenu
              label={`More actions for ${item.title}`}
              buttonLabel=""
              items={[
                !done && { label: 'Edit', icon: FiEdit2, onClick: () => onAction('fu.edit', item) },
                { label: 'Remove', icon: FiTrash2, danger: true, onClick: () => onAction('fu.remove', item) },
              ]}
            />
          )}
        </div>
      )}
    </li>
  );
}

/** Renders the dialogs behind follow-up quick actions; `onChanged` reloads the owning view. */
export function FollowUpDialogs({ dialog, close, options, onChanged }) {
  const confirm = useMutation();
  const done = () => { close(); onChanged(); };
  const item = dialog?.item;

  const runConfirm = async (url, method) => {
    try { await confirm.run(url, { method }); done(); } catch { /* shown in dialog */ }
  };

  switch (dialog?.type) {
    case 'fu.complete': return <CompleteFollowUpForm followUp={item} onClose={close} onSaved={done} />;
    case 'fu.reschedule': return <RescheduleForm followUp={item} onClose={close} onSaved={done} />;
    case 'fu.edit':    return <FollowUpForm followUp={item} options={options} onClose={close} onSaved={done} />;
    case 'fu.reopen':
      return (
        <ConfirmDialog open title="Reopen Follow-up" message={`Mark "${item.title}" as not done yet?`}
          confirmLabel="Reopen" busy={confirm.busy} error={confirm.error} onClose={close}
          onConfirm={() => runConfirm(`${API.followUps}/${item.id}/reopen`, 'POST')} />
      );
    case 'fu.remove':
      return (
        <ConfirmDialog open danger title="Remove Follow-up" message={`Remove "${item.title}"? It will no longer appear in reminders.`}
          confirmLabel="Remove" busy={confirm.busy} error={confirm.error} onClose={close}
          onConfirm={() => runConfirm(`${API.followUps}/${item.id}`, 'DELETE')} />
      );
    default: return null;
  }
}

/* ── Payments ───────────────────────────────────────────────────────────── */

export function PaymentRows({ payments, options, onVoid, showParent = false }) {
  return (
    <ul className="crm-rows">
      {payments.map(p => (
        <li key={p.id} className={`crm-row${p.voided_at ? ' is-voided' : ''}`}>
          <div className="crm-row-main">
            <span className="crm-row-title crm-money">{formatTZS(p.amount)}</span>
            <div className="crm-row-sub">
              {formatDate(p.payment_date)} · {labelFor(options?.payment_methods, p.payment_method)}
              {p.reference ? ` · Ref ${p.reference}` : ''}
            </div>
            {showParent && p.parent_name && <div className="crm-row-sub">For {p.parent_name}</div>}
            {p.notes && <div className="crm-row-sub">{p.notes}</div>}
            {p.voided_at && <div className="crm-row-sub crm-text-red">Voided: {p.void_reason}</div>}
          </div>
          <div className="crm-row-side">
            {p.voided_at
              ? <Badge value="cancelled" label="Voided" />
              : onVoid && (
                <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => onVoid(p)}>Void</button>
              )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Activity ───────────────────────────────────────────────────────────── */

export function ActivityTimeline({ items }) {
  return (
    <ol className="crm-timeline">
      {items.map(a => (
        <li key={a.id}>
          <time dateTime={a.created_at}>{formatDateTime(a.created_at)}{a.actor ? ` · ${a.actor}` : ''}</time>
          {a.description}
        </li>
      ))}
    </ol>
  );
}

/* ── Money ──────────────────────────────────────────────────────────────── */

/** Total / Paid / Balance. `help` adds the short Swahili explanations. */
export function MoneySummary({ total, paid, balance, labels = ['Total', 'Paid', 'Balance'], help = false }) {
  return (
    <div className="crm-money-grid">
      <div className="crm-money-cell">
        <span>{labels[0]}</span>
        <strong>{formatTZS(total, 'TZS 0')}</strong>
      </div>
      <div className="crm-money-cell">
        <span>{labels[1]}{help && <em className="crm-sw">{SW.amountPaid}</em>}</span>
        <strong className="crm-text-green">{formatTZS(paid, 'TZS 0')}</strong>
      </div>
      <div className="crm-money-cell">
        <span>{labels[2]}{help && <em className="crm-sw">{SW.balance}</em>}</span>
        <strong className={hasBalance(balance) ? 'crm-text-amber' : ''}>{formatTZS(balance, 'TZS 0')}</strong>
      </div>
    </div>
  );
}

/* ── CardHub events ─────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DateBlock({ ymd }) {
  if (!ymd) {
    return <div className="crm-date-block is-unset" aria-label="Date not set"><span className="d">—</span><span className="m">TBC</span></div>;
  }
  const [y, m, d] = ymd.split('-').map(Number);
  return (
    <div className="crm-date-block" aria-label={formatDate(ymd)}>
      <span className="d">{d}</span><span className="m">{MONTHS[m - 1]}</span><span className="y">{y}</span>
    </div>
  );
}

/** Scannable event line: type · name · date + countdown · place · cards · money · status. */
export function EventRow({ event, options, today, showClient = true }) {
  const closed = ['event_completed', 'cancelled'].includes(event.status);
  const upcoming = event.event_date && today && daysUntil(event.event_date, today) >= 0 && !closed;
  const soon = upcoming && daysUntil(event.event_date, today) <= 7;
  const priced = Number(event.total_price) > 0;
  return (
    <li className="crm-row crm-event-row">
      <DateBlock ymd={event.event_date} />
      <div className="crm-row-main">
        <span className="crm-eyebrow">{labelFor(options?.cardhub_event_types, event.event_type)}</span>
        <Link className="crm-row-title" to={`/admin/cardhub/events/${event.id}`}>{event.event_name}</Link>
        <div className="crm-row-sub">
          {event.event_date
            ? <>{formatDate(event.event_date)}{upcoming && <span className={soon ? 'crm-text-cyan' : ''}> · {eventCountdown(event.event_date, today).toLowerCase()}</span>}</>
            : 'Date not set'}
        </div>
        <div className="crm-row-sub">
          {[showClient && event.client_name, event.event_location, event.number_of_cards && `${event.number_of_cards} cards`]
            .filter(Boolean).join(' · ')}
        </div>
        {priced && event.status !== 'cancelled' && (
          <div className="crm-row-sub crm-money-line">
            {formatTZS(event.total_price)} · Paid {formatTZS(event.amount_paid, 'TZS 0')}
            {hasBalance(event.balance) && <> · <span className="crm-text-amber">Balance {formatTZS(event.balance)}</span></>}
          </div>
        )}
      </div>
      <div className="crm-row-side">
        <Badge value={event.status} options={options?.cardhub_event_statuses} />
      </div>
    </li>
  );
}

/* ── Project detail modal (view, edit, pay, void, archive) ──────────────── */

export function ProjectModal({ projectId, options, onClose, onChanged }) {
  const { data, loading, error, reload } = useApi(`${API.projects}/${projectId}`);
  const { dialog, open, close } = useDialog();
  const archive = useMutation();
  const project = data?.data;

  const changed = () => { close(); reload(); onChanged?.(); };

  if (dialog?.type === 'edit') {
    return <ProjectForm project={project} options={options} onClose={close} onSaved={changed} />;
  }
  if (dialog?.type === 'pay') {
    return (
      <PaymentForm url={`${API.projects}/${projectId}/payments`} parentName={project.project_name}
        balance={project.balance} options={options} onClose={close} onSaved={changed} />
    );
  }
  if (dialog?.type === 'void') {
    return <VoidPaymentForm payment={dialog.item} onClose={close} onSaved={changed} />;
  }
  if (dialog?.type === 'archive') {
    const archived = Boolean(project.archived_at);
    return (
      <ConfirmDialog
        open
        danger={!archived}
        title={archived ? 'Restore Project' : 'Archive Project'}
        message={archived
          ? `Restore ${project.project_name}?`
          : `Archive ${project.project_name}? It will be hidden from active lists. Payment history is kept.`}
        confirmLabel={archived ? 'Restore' : 'Archive'}
        busy={archive.busy}
        error={archive.error}
        onClose={close}
        onConfirm={async () => {
          try {
            await archive.run(`${API.projects}/${projectId}${archived ? '/restore' : ''}`, { method: archived ? 'POST' : 'DELETE' });
            changed();
          } catch { /* shown */ }
        }}
      />
    );
  }

  return (
    <Modal open title={project?.project_name || 'Project'} onClose={onClose} size="lg">
      <DataView loading={loading} error={error} data={data} what="project" onRetry={reload} rows={4} cols={3}>
        {project && (
          <div className="crm-stack">
            <div className="crm-detail-badges">
              <Badge value={project.status} options={options?.project_statuses} />
              {project.archived_at && <Badge value="cancelled" label="Archived" />}
            </div>

            <div className="crm-panel">
              <MoneySummary total={project.total_price} paid={project.amount_paid} balance={project.balance} help />
            </div>

            <div className="crm-card-actions">
              {!project.archived_at && hasBalance(project.balance) && (
                <button type="button" className="crm-btn crm-btn-primary" onClick={() => open('pay')}>
                  <FiPlus size={14} aria-hidden="true" /> Record Payment
                </button>
              )}
              {!project.archived_at && (
                <button type="button" className="crm-btn crm-btn-ghost" onClick={() => open('edit')}>
                  <FiEdit2 size={13} aria-hidden="true" /> Edit
                </button>
              )}
              <MoreMenu items={[{
                label: project.archived_at ? 'Restore project' : 'Archive project',
                icon: project.archived_at ? FiRotateCcw : FiArchive,
                danger: !project.archived_at,
                onClick: () => open('archive'),
              }]} />
            </div>

            <InfoList items={[
              { label: 'Client', value: <Link className="crm-link" to={`/admin/clients/${project.client_id}`} onClick={onClose}>{project.client_name}</Link> },
              { label: 'Service', value: project.service },
              { label: 'Expected start', value: formatDate(project.expected_start_date) },
              { label: 'Expected completion', value: formatDate(project.expected_completion_date) },
            ]} />
            {project.description && <p className="crm-note-body">{project.description}</p>}

            <div className="crm-panel">
              <div className="crm-panel-head"><h3>Payments ({data.payments.length})</h3></div>
              {data.payments.length
                ? <PaymentRows payments={data.payments} options={options} onVoid={p => open('void', p)} />
                : <p className="crm-state crm-muted">No payments recorded yet.</p>}
            </div>

            {data.activity.length > 0 && (
              <div className="crm-panel">
                <div className="crm-panel-head"><h3>History</h3></div>
                <ActivityTimeline items={data.activity} />
              </div>
            )}
          </div>
        )}
      </DataView>
    </Modal>
  );
}
