-- Clix Digital Works — Database Schema
-- Run: mysql -u root -p < server/db/schema.sql

CREATE DATABASE IF NOT EXISTS clix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clix_db;

-- ─── Contact Form Submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  company     VARCHAR(255),
  project_type VARCHAR(100),
  message     TEXT NOT NULL,
  status      ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Quote Requests ─────────────────────────────────────────────────────────
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
  status       ENUM('new', 'reviewing', 'quoted', 'accepted', 'rejected') NOT NULL DEFAULT 'new',
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Newsletter Subscribers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255),
  status          ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
  unsubscribe_token VARCHAR(64) UNIQUE,
  subscribed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  INDEX idx_status (status),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
