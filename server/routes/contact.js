import { Router } from 'express';
import { body } from 'express-validator';
import nodemailer from 'nodemailer';
import { query } from '../db/connection.js';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { handleValidation } from '../middleware/validate.js';

export const contactRouter = Router();

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('company').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('project_type').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
];

async function sendNotificationEmail(data) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: `"Clix Digital Works" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Contact: ${data.name} — ${data.project_type || 'General Inquiry'}`,
    text: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || '—'}`,
      `Company: ${data.company || '—'}`,
      `Project Type: ${data.project_type || '—'}`,
      ``,
      `Message:`,
      data.message,
    ].join('\n'),
  });
}

contactRouter.post('/', contactLimiter, rules, handleValidation, async (req, res) => {
  try {
    const { name, email, phone, company, project_type, message } = req.body;
    const ip = req.ip || req.socket.remoteAddress;

    await query(
      `INSERT INTO contacts (name, email, phone, company, project_type, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, company || null, project_type || null, message, ip],
    );

    sendNotificationEmail({ name, email, phone, company, project_type, message }).catch(() => {});

    res.status(201).json({ success: true, message: 'Message received. We\'ll be in touch shortly!' });
  } catch (err) {
    console.error('contact route error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});
