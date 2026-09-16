import { body, param, query as queryParam } from 'express-validator';
import { isValidYmd } from '../../db/crm.js';

/* ── Errors ─────────────────────────────────────────────────────────────────
   Same response shapes as the existing admin routes: { error } for failures,
   { error: 'Validation failed', details: [{ field, message }] } for 422. */

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = 'Record') => new HttpError(404, `${what} not found`);
export const fieldError = (field, message) =>
  new HttpError(422, 'Validation failed', [{ field, message }]);

/** Wraps an async handler: known HttpErrors keep their status, anything else is logged and becomes a generic 500. */
export function route(label, handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json(
          err.details ? { error: err.message, details: err.details } : { error: err.message },
        );
      }
      console.error(`[crm] ${label} error:`, err);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

export const actor = req => req.admin?.username || 'admin';

/* ── Value helpers ──────────────────────────────────────────────────────── */

/** Empty strings from HTML forms become NULL; strings are trimmed. */
export function clean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? null : t;
  }
  return value;
}

const MONEY_RE = /^\d{1,12}(\.\d{1,2})?$/;

export function normalizeMoney(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value).replace(/,/g, '').trim();
}

/** Exact integer cents from a DECIMAL string — safe up to DECIMAL(14,2). */
export function toCents(value) {
  const [whole, frac = ''] = String(value ?? '0').split('.');
  return Number(whole) * 100 + Number((frac + '00').slice(0, 2));
}

export const fromCents = cents => (cents / 100).toFixed(2);

/* ── Validators (express-validator chains) ──────────────────────────────── */

export const idParam = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage('Invalid id').toInt();

export const requiredText = (field, label, max = 190) =>
  body(field)
    .isString().withMessage(`${label} is required`)
    .trim().notEmpty().withMessage(`${label} is required`)
    .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);

export const optionalText = (field, label, max = 190) =>
  body(field)
    .optional({ values: 'null' })
    .isString().withMessage(`${label} must be text`)
    .trim()
    .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);

export const oneOf = (field, label, allowed, { required = true } = {}) => {
  const chain = body(field);
  return (required ? chain : chain.optional({ values: 'falsy' }))
    .isIn(allowed).withMessage(`${label} is not a valid option`);
};

export const dateField = (field, label, { required = false } = {}) => {
  const chain = body(field);
  return (required ? chain : chain.optional({ values: 'falsy' }))
    .custom(v => isValidYmd(v)).withMessage(`${label} must be a valid date`);
};

export const moneyField = (field, label, { required = false, positive = false } = {}) => {
  const chain = body(field);
  return (required ? chain : chain.optional({ values: 'falsy' }))
    .custom(v => {
      const s = normalizeMoney(v);
      if (s === null || !MONEY_RE.test(s)) return false;
      return positive ? toCents(s) > 0 : true;
    })
    .withMessage(positive ? `${label} must be an amount greater than 0` : `${label} must be a valid amount`);
};

export const optionalCount = (field, label, max = 1_000_000) =>
  body(field)
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max }).withMessage(`${label} must be a whole number`);

export const emailField = field =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .isLength({ max: 190 })
    .customSanitizer(v => v.toLowerCase());

export const phoneField = field =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?[\d\s\-()]{7,25}$/).withMessage('Enter a valid phone number')
    .custom(v => {
      const digits = v.replace(/\D/g, '').length;
      return digits >= 7 && digits <= 15;
    }).withMessage('Enter a valid phone number');

export const searchQuery = () =>
  queryParam('search').optional().isString().trim().isLength({ max: 100 });

/* ── Activity log ───────────────────────────────────────────────────────── */

/** Append-only. Always called with the transaction handle of the change it describes. */
export function logActivity(tx, { clientId, entityType, entityId, action, description, req }) {
  return tx.query(
    `INSERT INTO activity_log (client_id, entity_type, entity_id, action, description, actor)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [clientId ?? null, entityType, entityId, action, description.slice(0, 500), actor(req)],
  );
}

/** Loads a non-archived client inside a transaction, or throws 404/422. */
export async function requireClient(tx, clientId, { field } = {}) {
  const client = await tx.queryOne(
    'SELECT id, full_name, status, archived_at FROM clients WHERE id = ?',
    [clientId],
  );
  if (!client) {
    throw field ? fieldError(field, 'Client not found') : notFound('Client');
  }
  return client;
}

/** "lead" -> "Lead" using a constants option list. */
export const labelOf = (options, value) => options.find(o => o.value === value)?.label || value;
