import { Router } from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import { query, queryOne } from '../db/connection.js';
import { newsletterLimiter } from '../middleware/rateLimiter.js';
import { handleValidation } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

export const newsletterRouter = Router();

const subscribeRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
];

newsletterRouter.post('/subscribe', newsletterLimiter, subscribeRules, handleValidation, async (req, res) => {
  try {
    const { email, name } = req.body;
    const token = crypto.randomBytes(32).toString('hex');

    const existing = await queryOne('SELECT id, status FROM newsletter_subscribers WHERE email = ?', [email]);

    if (existing) {
      if (existing.status === 'active') {
        return res.json({ success: true, message: 'You\'re already subscribed!' });
      }
      await query(
        'UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = NULL, unsubscribe_token = ? WHERE id = ?',
        ['active', token, existing.id],
      );
    } else {
      await query(
        'INSERT INTO newsletter_subscribers (email, name, unsubscribe_token) VALUES (?, ?, ?)',
        [email, name || null, token],
      );
    }

    res.status(201).json({ success: true, message: 'Subscribed! Thank you for joining.' });
  } catch (err) {
    console.error('newsletter subscribe error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

newsletterRouter.get('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const subscriber = await queryOne(
      'SELECT id FROM newsletter_subscribers WHERE unsubscribe_token = ? AND status = ?',
      [token, 'active'],
    );

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscription not found or already unsubscribed.' });
    }

    await query(
      'UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = NOW() WHERE id = ?',
      ['unsubscribed', subscriber.id],
    );

    res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (err) {
    console.error('newsletter unsubscribe error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

newsletterRouter.get('/export', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT email, name, status, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC',
    );

    const csvLines = [
      'Email,Name,Status,Subscribed At',
      ...rows.map(r => `"${r.email}","${r.name || ''}","${r.status}","${r.subscribed_at}"`),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) {
    console.error('newsletter export error:', err);
    res.status(500).json({ error: 'Export failed.' });
  }
});
