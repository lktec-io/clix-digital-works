import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiInbox } from 'react-icons/fi';
import { SkeletonTable } from '../../Skeleton';
import { labelFor, toneFor } from '../../../utils/crm';
import { useDebounced } from '../../../hooks/useCrm';
import '../../../styles/crm.css';

/* ── Search box (debounced; server-side search) ─────────────────────────── */

export function SearchBox({ value, onSearch, placeholder, label = 'Search' }) {
  const [term, setTerm] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow external changes (e.g. a sidebar link clearing the URL filter).
  if (value !== synced) {
    setSynced(value);
    setTerm(value);
  }
  const debounced = useDebounced(term, 350);
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);
  useEffect(() => {
    // Only act once the debounce has caught up with the input; otherwise a
    // stale value could undo an external filter change.
    if (debounced === term && debounced.trim() !== value.trim()) onSearchRef.current(debounced.trim());
  }, [debounced, term, value]);

  return (
    <div className="crm-toolbar-search">
      <input
        type="search"
        className="crm-input"
        placeholder={placeholder}
        aria-label={label}
        value={term}
        maxLength={100}
        onChange={e => setTerm(e.target.value)}
      />
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────────── */

export function Badge({ value, options, label, tone }) {
  if (!value && !label) return null;
  return (
    <span className={`crm-badge crm-tone-${tone || toneFor(value)}`}>
      {label || labelFor(options, value)}
    </span>
  );
}

/* ── Data states ────────────────────────────────────────────────────────── */

export function LoadingState({ rows = 6, cols = 5 }) {
  return (
    <div className="crm-state" role="status" aria-live="polite">
      <span className="crm-sr-only">Loading…</span>
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  );
}

export function ErrorState({ error, what = 'data', onRetry }) {
  const message = error?.status === 429
    ? error.message
    : `Unable to load ${what}. Please try again.`;
  return (
    <div className="crm-state crm-state-error" role="alert">
      <FiAlertCircle size={18} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="crm-btn crm-btn-ghost crm-btn-sm" onClick={onRetry}>
          <FiRefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children, action }) {
  return (
    <div className="crm-state crm-state-empty">
      <FiInbox size={18} />
      <p>{children}</p>
      {action}
    </div>
  );
}

/** Renders loading / error / empty / content in one place. */
export function DataView({ loading, error, data, isEmpty, what, onRetry, empty, emptyAction, children, rows, cols }) {
  if (error && !data) return <ErrorState error={error} what={what} onRetry={onRetry} />;
  if (loading && !data) return <LoadingState rows={rows} cols={cols} />;
  if (!data) return null;
  return (
    <>
      {error && <ErrorState error={error} what={what} onRetry={onRetry} />}
      {isEmpty ? <EmptyState action={emptyAction}>{empty}</EmptyState> : children}
    </>
  );
}

/* ── Pagination (same markup as the existing admin tables) ──────────────── */

export function Pagination({ page, limit, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>Page {page} of {totalPages} ({total} records)</span>
      <div className="pagination-btns">
        <button type="button" className="page-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <FiChevronLeft size={14} />
        </button>
        <button type="button" className="page-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Filter tabs ────────────────────────────────────────────────────────── */

export function FilterTabs({ tabs, value, onChange, counts, label = 'Filter', flush = false }) {
  return (
    <div className={`crm-tabs${flush ? ' crm-tabs-flush' : ''}`} role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={`crm-tab${value === t.value ? ' is-active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {counts && counts[t.value] !== undefined && <span className="crm-tab-count">{counts[t.value]}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────── */

export function Modal({ open, title, onClose, children, footer, size = 'md', busy = false }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = e => {
      if (e.key === 'Escape' && !busy) { e.stopPropagation(); onCloseRef.current(); }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      panelRef.current?.querySelector('input:not([type=hidden]), select, textarea, button')?.focus();
    }, 30);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, busy]);

  if (!open) return null;

  return createPortal(
    <div className="crm-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div ref={panelRef} className={`crm-modal crm-modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="crm-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="crm-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>
        <div className="crm-modal-body">{children}</div>
        {footer && <div className="crm-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, busy, error, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      busy={busy}
      footer={(
        <>
          <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`crm-btn ${danger ? 'crm-btn-danger' : 'crm-btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <p className="crm-confirm-text">{message}</p>
      <FormError error={error} />
    </Modal>
  );
}

/* ── Form primitives ────────────────────────────────────────────────────── */

export function Field({ label, error, hint, required, children, full }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <div className={`crm-field${full ? ' crm-field-full' : ''}${error ? ' has-error' : ''}`}>
      {label && (
        <label htmlFor={id}>
          {label}{required && <span className="crm-required" aria-hidden="true"> *</span>}
        </label>
      )}
      {child}
      {error ? <span className="crm-field-error" role="alert">{error}</span>
        : hint ? <span className="crm-field-hint">{hint}</span> : null}
    </div>
  );
}

export function Select({ id, value, onChange, options, placeholder, ...rest }) {
  return (
    <select id={id} className="crm-input" value={value ?? ''} onChange={e => onChange(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function FormSection({ title, children }) {
  return (
    <fieldset className="crm-form-section">
      {title && <legend>{title}</legend>}
      <div className="crm-form-grid">{children}</div>
    </fieldset>
  );
}

/** Non-field error (409/500/429). Field-level 422s are shown next to inputs instead. */
export function FormError({ error }) {
  if (!error) return null;
  const message = error.status === 422 && error.details?.length
    ? 'Please correct the highlighted fields.'
    : error.message;
  return <div className="crm-form-error" role="alert"><FiAlertCircle size={14} /> {message}</div>;
}

/** Plain row of label/value pairs for detail views. */
export function InfoList({ items, single = false }) {
  return (
    <dl className={`crm-info-list${single ? ' is-single' : ''}`}>
      {items.filter(Boolean).map(({ label, value }) => (
        <div key={label} className="crm-info-row">
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PanelHeader({ title, children }) {
  return (
    <div className="crm-panel-head">
      <h3>{title}</h3>
      {children && <div className="crm-panel-actions">{children}</div>}
    </div>
  );
}
