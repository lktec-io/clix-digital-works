import pool from './connection.js';
import { CRM_TIMEZONE } from '../constants/crm.js';

/**
 * CRM query helpers. They use the shared pool but return DATE columns as
 * 'YYYY-MM-DD' strings: mysql2's default converts DATE to a JS Date at local
 * midnight, which shifts a calendar date by a day whenever the server's
 * timezone differs from the viewer's. DECIMAL columns already come back as
 * exact strings. The shared pool's defaults are deliberately left unchanged
 * so existing routes behave exactly as before.
 */
const DATE_AS_STRING = ['DATE'];

async function run(executor, sql, params = []) {
  const [rows] = await executor.execute({ sql, values: params, dateStrings: DATE_AS_STRING });
  return rows;
}

export const crmQuery = (sql, params) => run(pool, sql, params);

export async function crmQueryOne(sql, params) {
  const rows = await run(pool, sql, params);
  return rows[0] || null;
}

/**
 * Runs `fn` inside a transaction. `fn` receives { query, queryOne } bound to
 * the transaction's connection, so every write inside it commits or rolls
 * back together (e.g. payment insert + parent total recalculation + activity).
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  const tx = {
    query:    (sql, params) => run(conn, sql, params),
    queryOne: async (sql, params) => (await run(conn, sql, params))[0] || null,
  };
  try {
    await conn.beginTransaction();
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/* ── Calendar dates ─────────────────────────────────────────────────────────
   "Today" is resolved in the business timezone in Node and passed to SQL as a
   parameter, so reminders never depend on the MySQL server's time_zone.
   Date arithmetic is done on UTC calendar values (no DST in EAT, and UTC math
   on Y-M-D is timezone-free regardless). */

export function todayInTz(timeZone = CRM_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

const toYmd = d => d.toISOString().slice(0, 10);
const parseYmd = ymd => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function addDays(ymd, days) {
  const d = parseYmd(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return toYmd(d);
}

/** [first, last] day of the month `offset` months from the month containing `ymd`. */
export function monthRange(ymd, offset = 0) {
  const d = parseYmd(ymd);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
  const last  = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset + 1, 0));
  return [toYmd(first), toYmd(last)];
}

/** Strict YYYY-MM-DD that is also a real calendar date (rejects 2026-02-30). */
export function isValidYmd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toYmd(parseYmd(value)) === value;
}

/**
 * Canonical phone for duplicate detection only (the display value is stored
 * untouched). Tanzanian local numbers "07XX…" and "+255 7XX…" normalize to
 * the same "2557XX…" form.
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = `255${digits.slice(1)}`;
  return digits.slice(0, 20);
}

/** Pagination parsed the same way as the existing admin list routes. */
export function pageParams(q, defaultLimit = 20) {
  const page  = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
export const likeParam = s => `%${String(s).replace(/[\\%_]/g, m => `\\${m}`)}%`;
