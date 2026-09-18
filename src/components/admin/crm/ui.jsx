import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  FiX, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp,
  FiInbox, FiMoreHorizontal, FiFilter,
} from 'react-icons/fi';
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

/* ── Metric strip ───────────────────────────────────────────────────────── */

/**
 * Compact analytics bar: one hairline-separated cell per business question.
 * Cells are links when `to` is given. Values come from the API only — no
 * invented trends or comparisons.
 */
export function MetricBar({ items }) {
  return (
    <div className="crm-metrics">
      {items.filter(Boolean).map(({ to, label, value, sub, subTone, icon: Icon, title }) => {
        const Tag = to ? Link : 'div';
        return (
          <Tag key={label} {...(to ? { to } : {})} className="crm-metric" title={title}>
            <span className="crm-metric-label">
              {Icon && <Icon size={13} aria-hidden="true" />}
              {label}
            </span>
            <span className="crm-metric-value">{value}</span>
            {sub && <span className={`crm-metric-sub${subTone ? ` crm-text-${subTone}` : ''}`}>{sub}</span>}
          </Tag>
        );
      })}
    </div>
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

export function EmptyState({ children, sw, action }) {
  return (
    <div className="crm-state crm-state-empty">
      <FiInbox size={18} aria-hidden="true" />
      <p>{children}</p>
      {sw && <p className="crm-sw">{sw}</p>}
      {action}
    </div>
  );
}

/** Renders loading / error / empty / content in one place. */
export function DataView({ loading, error, data, isEmpty, what, onRetry, empty, emptySw, emptyAction, children, rows, cols }) {
  if (error && !data) return <ErrorState error={error} what={what} onRetry={onRetry} />;
  if (loading && !data) return <LoadingState rows={rows} cols={cols} />;
  if (!data) return null;
  return (
    <>
      {error && <ErrorState error={error} what={what} onRetry={onRetry} />}
      {isEmpty ? <EmptyState sw={emptySw} action={emptyAction}>{empty}</EmptyState> : children}
    </>
  );
}

/* ── More menu (secondary actions, so rows don't carry many buttons) ────── */

export function MoreMenu({ items, label = 'More actions', buttonLabel = 'More' }) {
  const [open, setOpen] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const ref = useRef(null);

  // Open towards whichever side has room, so the menu never leaves the screen
  // when the button wraps to the left edge on a narrow phone.
  const toggle = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setAlignLeft(rect.right < 260);
    setOpen(o => !o);
  };
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="crm-menu" ref={ref}>
      <button
        type="button"
        className="crm-btn crm-btn-ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={toggle}
      >
        <FiMoreHorizontal size={15} aria-hidden="true" /> {buttonLabel}
      </button>
      {open && (
        <div className={`crm-menu-list${alignLeft ? ' is-left' : ''}`} role="menu" id={menuId}>
          {visible.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`crm-menu-item${item.danger ? ' is-danger' : ''}`}
              onClick={() => { setOpen(false); item.onClick(); }}
            >
              {item.icon && <item.icon size={14} aria-hidden="true" />} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toolbar: search always visible, other filters behind [Filter] on phones ─ */

export function Toolbar({ search, activeCount = 0, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`crm-toolbar${open ? ' filters-open' : ''}`}>
      {search}
      {children && (
        <>
          <button
            type="button"
            className="crm-btn crm-btn-ghost crm-filter-toggle"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <FiFilter size={14} aria-hidden="true" /> Filter{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <div className="crm-filters">{children}</div>
        </>
      )}
    </div>
  );
}

/* ── Section navigation: tabs on larger screens, a dropdown on phones ───── */

export function SectionNav({ tabs, value, onChange, label }) {
  const id = useId();
  return (
    <>
      <div className="crm-section-tabs"><FilterTabs tabs={tabs} value={value} onChange={onChange} label={label} flush /></div>
      <div className="crm-section-select">
        <label htmlFor={id} className="crm-sr-only">{label}</label>
        <select id={id} className="crm-input" value={value} onChange={e => onChange(e.target.value)}>
          {tabs.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
    </>
  );
}

/* ── Progressive disclosure for optional form fields ────────────────────── */

export function MoreDetails({ open, onToggle, label = 'Add more details', children }) {
  return (
    <div className="crm-more-details">
      <button type="button" className="crm-more-toggle" aria-expanded={open} onClick={onToggle}>
        {open ? <FiChevronUp size={14} aria-hidden="true" /> : <FiChevronDown size={14} aria-hidden="true" />}
        {open ? 'Hide extra details' : label}
      </button>
      {open && children}
    </div>
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

/**
 * `sw` adds a short Swahili explanation under the label; `optional` marks the
 * field as not required so required fields stand out without extra noise.
 */
export function Field({ label, error, hint, sw, required, optional, children, full }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <div className={`crm-field${full ? ' crm-field-full' : ''}${error ? ' has-error' : ''}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="crm-required" aria-hidden="true"> *</span>}
          {optional && <span className="crm-optional"> (optional)</span>}
        </label>
      )}
      {sw && <span className="crm-sw">{sw}</span>}
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

/** Label/value pairs for detail views. Empty values are skipped to keep pages calm. */
export function InfoList({ items, single = false }) {
  const shown = items.filter(item => item && item.value !== null && item.value !== undefined && item.value !== '' && item.value !== '—');
  if (!shown.length) return null;
  return (
    <dl className={`crm-info-list${single ? ' is-single' : ''}`}>
      {shown.map(({ label, value }) => (
        <div key={label} className="crm-info-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
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
