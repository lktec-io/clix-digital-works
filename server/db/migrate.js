import pool from './connection.js';

async function hasColumn(table, column) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column],
  );
  return rows.length > 0;
}

async function addIfMissing(table, column, definition) {
  if (!(await hasColumn(table, column))) {
    console.log(`[migrate] Adding missing column: ${table}.${column}`);
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

export async function runMigrations() {
  console.log('[migrate] Checking database schema…');

  // ── contacts ──────────────────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) NOT NULL,
      phone        VARCHAR(50),
      company      VARCHAR(255),
      project_type VARCHAR(100),
      message      TEXT NOT NULL,
      status       ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
      ip_address   VARCHAR(45),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contacts_status (status),
      INDEX idx_contacts_email  (email),
      INDEX idx_contacts_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await addIfMissing('contacts', 'project_type', "VARCHAR(100)");
  await addIfMissing('contacts', 'status',       "ENUM('new','contacted','closed') NOT NULL DEFAULT 'new'");
  await addIfMissing('contacts', 'ip_address',   "VARCHAR(45)");
  await addIfMissing('contacts', 'created_at',   "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  await addIfMissing('contacts', 'updated_at',   "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // ── quote_requests ────────────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS quote_requests (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) NOT NULL,
      phone        VARCHAR(50),
      company      VARCHAR(255),
      project_type VARCHAR(100) NOT NULL,
      budget       VARCHAR(100),
      timeline     VARCHAR(100),
      requirements TEXT,
      status       ENUM('new','reviewing','quoted','accepted','rejected') NOT NULL DEFAULT 'new',
      ip_address   VARCHAR(45),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_quotes_status  (status),
      INDEX idx_quotes_email   (email),
      INDEX idx_quotes_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await addIfMissing('quote_requests', 'project_type', "VARCHAR(100) NOT NULL DEFAULT ''");
  await addIfMissing('quote_requests', 'budget',       "VARCHAR(100)");
  await addIfMissing('quote_requests', 'timeline',     "VARCHAR(100)");
  await addIfMissing('quote_requests', 'requirements', "TEXT");
  await addIfMissing('quote_requests', 'status',       "ENUM('new','reviewing','quoted','accepted','rejected') NOT NULL DEFAULT 'new'");
  await addIfMissing('quote_requests', 'ip_address',   "VARCHAR(45)");
  await addIfMissing('quote_requests', 'created_at',   "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  await addIfMissing('quote_requests', 'updated_at',   "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // ── newsletter_subscribers ────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      email             VARCHAR(255) NOT NULL UNIQUE,
      name              VARCHAR(255),
      status            ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
      unsubscribe_token VARCHAR(64) UNIQUE,
      subscribed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at   TIMESTAMP NULL,
      INDEX idx_newsletter_status (status),
      INDEX idx_newsletter_email  (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await addIfMissing('newsletter_subscribers', 'name',              "VARCHAR(255)");
  await addIfMissing('newsletter_subscribers', 'status',            "ENUM('active','unsubscribed') NOT NULL DEFAULT 'active'");
  await addIfMissing('newsletter_subscribers', 'unsubscribe_token', "VARCHAR(64) UNIQUE");
  await addIfMissing('newsletter_subscribers', 'subscribed_at',     "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  await addIfMissing('newsletter_subscribers', 'unsubscribed_at',   "TIMESTAMP NULL");

  console.log('[migrate] Schema up to date.');
}
