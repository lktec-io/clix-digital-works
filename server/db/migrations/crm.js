/**
 * CRM + CardHub management schema. Additive only: creates new tables, never
 * alters or drops existing ones. Every statement is CREATE TABLE IF NOT
 * EXISTS, so it is safe to run on every boot (same model as migrate.js).
 *
 * Design notes
 * - Statuses/sources/types are VARCHAR validated against constants/crm.js
 *   (no ENUM migrations needed to add a value).
 * - Money is DECIMAL(14,2). `amount_paid` is recalculated from the payment
 *   ledger inside the payment transaction (never incremented, never taken
 *   from the client). `balance` and `payment_status` are STORED generated
 *   columns, so they can never disagree with the totals they derive from.
 * - Nothing here is hard-deleted by the app: clients/projects/events use
 *   archived_at, follow-ups use deleted_at, payments use voided_at, notes and
 *   activity are append-only. Foreign keys are therefore RESTRICT, which also
 *   keeps payment history from ever disappearing with a parent row.
 */

const TABLE_OPTS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

const PAYMENT_STATUS_EXPR = `(CASE
  WHEN amount_paid <= 0 THEN 'unpaid'
  WHEN amount_paid >= total_price THEN 'paid'
  ELSE 'partial' END)`;

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS clients (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(190) NOT NULL,
    phone               VARCHAR(50)  NULL,
    phone_normalized    VARCHAR(20)  NULL,
    email               VARCHAR(190) NULL,
    company             VARCHAR(190) NULL,
    location            VARCHAR(190) NULL,
    city                VARCHAR(100) NULL,
    region              VARCHAR(100) NULL,
    source              VARCHAR(30)  NOT NULL DEFAULT 'other',
    status              VARCHAR(30)  NOT NULL DEFAULT 'lead',
    priority            VARCHAR(10)  NOT NULL DEFAULT 'medium',
    interested_service  VARCHAR(190) NULL,
    estimated_budget    DECIMAL(14,2) NULL,
    expected_start_date DATE NULL,
    last_contacted_at   TIMESTAMP NULL,
    archived_at         TIMESTAMP NULL,
    created_by          VARCHAR(100) NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clients_archived_status (archived_at, status),
    INDEX idx_clients_phone_norm (phone_normalized),
    INDEX idx_clients_email (email),
    INDEX idx_clients_source (source),
    INDEX idx_clients_city (city),
    INDEX idx_clients_created (created_at),
    CONSTRAINT chk_clients_budget CHECK (estimated_budget IS NULL OR estimated_budget >= 0)
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS projects (
    id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id                INT UNSIGNED NOT NULL,
    project_name             VARCHAR(190) NOT NULL,
    service                  VARCHAR(190) NULL,
    status                   VARCHAR(30)  NOT NULL DEFAULT 'planned',
    total_price              DECIMAL(14,2) NOT NULL DEFAULT 0,
    amount_paid              DECIMAL(14,2) NOT NULL DEFAULT 0,
    balance                  DECIMAL(14,2) AS (total_price - amount_paid) STORED,
    payment_status           VARCHAR(10) AS ${PAYMENT_STATUS_EXPR} STORED,
    expected_start_date      DATE NULL,
    expected_completion_date DATE NULL,
    description              TEXT NULL,
    archived_at              TIMESTAMP NULL,
    created_by               VARCHAR(100) NULL,
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_projects_client (client_id),
    INDEX idx_projects_archived_status (archived_at, status),
    INDEX idx_projects_start (expected_start_date),
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
    CONSTRAINT chk_projects_money CHECK (total_price >= 0 AND amount_paid >= 0 AND amount_paid <= total_price)
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS cardhub_events (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id          INT UNSIGNED NOT NULL,
    event_type         VARCHAR(30)  NOT NULL,
    event_name         VARCHAR(190) NOT NULL,
    event_date         DATE NULL,
    event_location     VARCHAR(190) NULL,
    expected_guests    INT UNSIGNED NULL,
    card_type          VARCHAR(100) NULL,
    number_of_cards    INT UNSIGNED NULL,
    package            VARCHAR(100) NULL,
    total_price        DECIMAL(14,2) NOT NULL DEFAULT 0,
    amount_paid        DECIMAL(14,2) NOT NULL DEFAULT 0,
    balance            DECIMAL(14,2) AS (total_price - amount_paid) STORED,
    payment_status     VARCHAR(10) AS ${PAYMENT_STATUS_EXPR} STORED,
    status             VARCHAR(30)  NOT NULL DEFAULT 'new',
    notes              TEXT NULL,
    external_reference VARCHAR(100) NULL,
    delivered_at       TIMESTAMP NULL,
    archived_at        TIMESTAMP NULL,
    created_by         VARCHAR(100) NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ch_events_client (client_id),
    INDEX idx_ch_events_date (event_date),
    INDEX idx_ch_events_status_date (status, event_date),
    INDEX idx_ch_events_reference (external_reference),
    CONSTRAINT fk_ch_events_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
    CONSTRAINT chk_ch_events_money CHECK (total_price >= 0 AND amount_paid >= 0 AND amount_paid <= total_price)
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS client_payments (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id        INT UNSIGNED NOT NULL,
    project_id       INT UNSIGNED NULL,
    cardhub_event_id INT UNSIGNED NULL,
    amount           DECIMAL(14,2) NOT NULL,
    payment_method   VARCHAR(30)  NOT NULL,
    payment_date     DATE NOT NULL,
    reference        VARCHAR(100) NULL,
    notes            VARCHAR(500) NULL,
    recorded_by      VARCHAR(100) NULL,
    voided_at        TIMESTAMP NULL,
    void_reason      VARCHAR(255) NULL,
    voided_by        VARCHAR(100) NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payments_client_date (client_id, payment_date),
    INDEX idx_payments_project (project_id),
    INDEX idx_payments_event (cardhub_event_id),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_reference (reference),
    CONSTRAINT fk_payments_client  FOREIGN KEY (client_id)        REFERENCES clients (id)        ON DELETE RESTRICT,
    CONSTRAINT fk_payments_project FOREIGN KEY (project_id)       REFERENCES projects (id)       ON DELETE RESTRICT,
    CONSTRAINT fk_payments_event   FOREIGN KEY (cardhub_event_id) REFERENCES cardhub_events (id) ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_parent CHECK ((project_id IS NULL) <> (cardhub_event_id IS NULL))
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS follow_ups (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id    INT UNSIGNED NOT NULL,
    title        VARCHAR(190) NOT NULL,
    description  TEXT NULL,
    due_date     DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority     VARCHAR(10) NOT NULL DEFAULT 'medium',
    completed_at TIMESTAMP NULL,
    deleted_at   TIMESTAMP NULL,
    created_by   VARCHAR(100) NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_follow_ups_status_due (status, due_date),
    INDEX idx_follow_ups_client_status_due (client_id, status, due_date),
    CONSTRAINT fk_follow_ups_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS client_notes (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id  INT UNSIGNED NOT NULL,
    body       TEXT NOT NULL,
    author     VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_notes_client (client_id, created_at),
    CONSTRAINT fk_client_notes_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
  ) ${TABLE_OPTS}`,

  `CREATE TABLE IF NOT EXISTS activity_log (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id   INT UNSIGNED NULL,
    entity_type VARCHAR(30)  NOT NULL,
    entity_id   INT UNSIGNED NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    description VARCHAR(500) NOT NULL,
    actor       VARCHAR(100) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_client (client_id, created_at),
    INDEX idx_activity_entity (entity_type, entity_id, created_at),
    INDEX idx_activity_created (created_at),
    CONSTRAINT fk_activity_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
  ) ${TABLE_OPTS}`,
];

export async function runCrmMigrations(pool) {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}
