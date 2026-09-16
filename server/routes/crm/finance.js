import { fieldError, notFound, toCents, fromCents, HttpError } from './shared.js';

/**
 * Payment parents. Both projects and CardHub events carry the same money
 * columns (total_price, amount_paid, generated balance/payment_status), so
 * one implementation serves both. Table/column names come only from this
 * fixed map, never from request input.
 */
export const PARENTS = {
  project: { table: 'projects',       fk: 'project_id',       label: 'Project',       nameCol: 'project_name' },
  event:   { table: 'cardhub_events', fk: 'cardhub_event_id', label: 'CardHub event', nameCol: 'event_name' },
};

/** Locks the parent row for the rest of the transaction so concurrent payments serialize. */
export async function lockParent(tx, kind, id) {
  const p = PARENTS[kind];
  const row = await tx.queryOne(
    `SELECT id, client_id, ${p.nameCol} AS name, total_price, amount_paid, archived_at
     FROM ${p.table} WHERE id = ? FOR UPDATE`,
    [id],
  );
  if (!row) throw notFound(p.label);
  return row;
}

/**
 * Recomputes amount_paid from the non-voided ledger. Recalculating (rather
 * than incrementing) means totals self-heal and can never drift from the
 * payment history. Must run in the same transaction as the ledger change.
 */
export async function recalcPaid(tx, kind, id) {
  const p = PARENTS[kind];
  await tx.query(
    `UPDATE ${p.table}
     SET amount_paid = (
       SELECT COALESCE(SUM(amount), 0) FROM client_payments
       WHERE ${p.fk} = ? AND voided_at IS NULL
     )
     WHERE id = ?`,
    [id, id],
  );
}

/** Rejects a payment that would push total paid above the agreed price (overpayments are not supported). */
export function assertWithinBalance(parent, amount) {
  const balance = toCents(parent.total_price) - toCents(parent.amount_paid);
  if (toCents(parent.total_price) === 0) {
    throw fieldError('amount', 'Set a total price before recording payments');
  }
  if (toCents(amount) > balance) {
    throw fieldError('amount', `Amount exceeds the outstanding balance of TZS ${Number(fromCents(Math.max(balance, 0))).toLocaleString('en-US')}`);
  }
}

/** A price edit may never drop below what has already been paid. */
export function assertPriceCoversPaid(currentPaid, newTotal) {
  if (toCents(newTotal) < toCents(currentPaid)) {
    throw fieldError('total_price', `Total price cannot be less than the amount already paid (TZS ${Number(currentPaid).toLocaleString('en-US')})`);
  }
}

export async function insertPayment(tx, kind, parent, data, recordedBy) {
  const p = PARENTS[kind];
  if (parent.archived_at) throw new HttpError(409, `This ${p.label.toLowerCase()} is archived`);
  assertWithinBalance(parent, data.amount);

  const result = await tx.query(
    `INSERT INTO client_payments
       (client_id, ${p.fk}, amount, payment_method, payment_date, reference, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [parent.client_id, parent.id, data.amount, data.payment_method, data.payment_date,
      data.reference, data.notes, recordedBy],
  );
  await recalcPaid(tx, kind, parent.id);
  return result.insertId;
}

/** Money summary columns every list/detail response uses. */
export const MONEY_COLS = alias =>
  `${alias}.total_price, ${alias}.amount_paid, ${alias}.balance, ${alias}.payment_status`;
