import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, apiFetch } from '../config/api';
import { useAdminAuth } from '../context/AdminAuthContext';

/**
 * Handles an expired/invalid admin session the same way everywhere in the
 * CRM: sign out and return to the existing login page.
 */
export function useSessionGuard() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  return useCallback((err) => {
    if (err?.status === 401) {
      logout();
      navigate('/admin/login', { replace: true });
      return true;
    }
    return false;
  }, [logout, navigate]);
}

/**
 * Loads a URL and exposes { data, loading, error, reload }. Keeps the
 * previous data visible while reloading so lists don't flash empty after
 * every action, and ignores responses from superseded requests.
 */
export function useApi(url) {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: null });
  const guard = useSessionGuard();
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!url) return;
    const id = ++requestId.current;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiFetch(url);
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (id !== requestId.current || guard(err)) return;
      setState(s => ({ ...s, loading: false, error: err }));
    }
  }, [url, guard]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}

/** Mutation helper: { run, busy, error, fieldErrors } — 401s are routed to login. */
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const guard = useSessionGuard();

  const run = useCallback(async (url, { method = 'POST', body } = {}) => {
    setBusy(true);
    setError(null);
    try {
      return await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
    } catch (err) {
      if (!guard(err)) setError(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }, [guard]);

  const reset = useCallback(() => setError(null), []);
  return { run, busy, error, reset };
}

/* Options (statuses, sources, types…) change only with a deploy, so they are
   fetched once per page load and shared by every CRM screen. */
let optionsPromise = null;

export function useCrmOptions() {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);
  const guard = useSessionGuard();

  useEffect(() => {
    let alive = true;
    if (!optionsPromise) {
      optionsPromise = apiFetch(API.crmOptions).catch(err => {
        optionsPromise = null;
        throw err;
      });
    }
    optionsPromise
      .then(o => { if (alive) setOptions(o); })
      .catch(err => { if (alive && !guard(err)) setError(err); });
    return () => { alive = false; };
  }, [guard]);

  return { options, error };
}

/**
 * List filters stored in the URL (?status=lead&page=2), so views are linkable
 * from the sidebar/dashboard and survive refresh and back navigation.
 * Changing any filter other than `page` returns to page 1.
 */
export function useQueryFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();

  const filters = useMemo(() => {
    const out = {};
    for (const [k, d] of Object.entries(defaults)) out[k] = searchParams.get(k) ?? d;
    out.page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
    return out;
    // `defaults` is a literal per page; the URL string is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((patch) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === '' || v === null || v === undefined || (k !== 'page' && v === defaults[k])) next.delete(k);
        else next.set(k, String(v));
      }
      if (!('page' in patch)) next.delete('page');
      if (next.get('page') === '1') next.delete('page');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams]);

  return [filters, update];
}

/**
 * Controlled form state: `bind('field')` returns { value, onChange } for inputs.
 * Initialised once on mount — CRM forms are mounted only while their modal is
 * open, so a parent re-render can never wipe what the user is typing.
 */
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const set = (field, value) => setValues(v => ({ ...v, [field]: value }));
  const bind = field => ({ value: values[field] ?? '', onChange: e => set(field, e.target.value) });
  return { values, set, bind };
}

/** One open dialog at a time: dialog = { type, item } | null. */
export function useDialog() {
  const [dialog, setDialog] = useState(null);
  const open = useCallback((type, item = null) => setDialog({ type, item }), []);
  const close = useCallback(() => setDialog(null), []);
  return { dialog, open, close };
}

/** Debounces a value (search inputs), so typing doesn't fire a request per keystroke. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
