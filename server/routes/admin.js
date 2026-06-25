import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';

export const adminRouter = Router();

// ── Login ────────────────────────────────────────────────────────────────────
adminRouter.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    );

    res.json({ token, username });
  } catch (err) {
    console.error('admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Dashboard Stats ──────────────────────────────────────────────────────────
adminRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const [contacts, newContacts, quotes, newQuotes, subscribers] = await Promise.all([
      queryOne('SELECT COUNT(*) AS total FROM contacts'),
      queryOne('SELECT COUNT(*) AS total FROM contacts WHERE status = ?', ['new']),
      queryOne('SELECT COUNT(*) AS total FROM quote_requests'),
      queryOne('SELECT COUNT(*) AS total FROM quote_requests WHERE status = ?', ['new']),
      queryOne('SELECT COUNT(*) AS total FROM newsletter_subscribers WHERE status = ?', ['active']),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const [recentContacts, recentQuotes] = await Promise.all([
      queryOne('SELECT COUNT(*) AS total FROM contacts WHERE created_at >= ?', [weekAgo]),
      queryOne('SELECT COUNT(*) AS total FROM quote_requests WHERE created_at >= ?', [weekAgo]),
    ]);

    res.json({
      contacts:          contacts.total,
      new_contacts:      newContacts.total,
      quotes:            quotes.total,
      new_quotes:        newQuotes.total,
      subscribers:       subscribers.total,
      recent_contacts:   recentContacts.total,
      recent_quotes:     recentQuotes.total,
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ── Contacts ─────────────────────────────────────────────────────────────────
adminRouter.get('/contacts', requireAuth, async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const [total, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM contacts ${where}`, params),
      query(`SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]),
    ]);

    res.json({ data: rows, total: total.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('admin contacts list error:', err);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

adminRouter.patch('/contacts/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await query('UPDATE contacts SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('admin contacts patch error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

adminRouter.delete('/contacts/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('admin contacts delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ── Quote Requests ────────────────────────────────────────────────────────────
adminRouter.get('/quotes', requireAuth, async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR project_type LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const [total, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM quote_requests ${where}`, params),
      query(`SELECT * FROM quote_requests ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]),
    ]);

    res.json({ data: rows, total: total.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('admin quotes list error:', err);
    res.status(500).json({ error: 'Failed to load quotes' });
  }
});

adminRouter.patch('/quotes/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'reviewing', 'quoted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await query('UPDATE quote_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

adminRouter.delete('/quotes/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM quote_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ── Newsletter ────────────────────────────────────────────────────────────────
adminRouter.get('/newsletter', requireAuth, async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (email LIKE ? OR name LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const [total, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM newsletter_subscribers ${where}`, params),
      query(`SELECT id, email, name, status, subscribed_at FROM newsletter_subscribers ${where} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]),
    ]);

    res.json({ data: rows, total: total.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load subscribers' });
  }
});

adminRouter.delete('/newsletter/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});
