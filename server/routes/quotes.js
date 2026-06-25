import { Router } from 'express';
import { body } from 'express-validator';
import { query } from '../db/connection.js';
import { quoteLimiter } from '../middleware/rateLimiter.js';
import { handleValidation } from '../middleware/validate.js';

export const quotesRouter = Router();

const PROJECT_TYPES = [
  'Website Development', 'Mobile App', 'Custom Software', 'ERP System',
  'AI / Machine Learning', 'Cybersecurity', 'Accounting System', 'Management System',
  'Cloud & VPS Hosting', 'IoT & Automation', 'Other',
];

const BUDGETS = [
  'Under $500', '$500–$1,000', '$1,000–$3,000', '$3,000–$10,000', '$10,000+', 'Discuss with team',
];

const TIMELINES = [
  'ASAP (< 2 weeks)', '1 month', '2–3 months', '3–6 months', 'Flexible',
];

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('company').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('project_type').trim().notEmpty().withMessage('Project type is required').isIn(PROJECT_TYPES),
  body('budget').optional({ checkFalsy: true }).trim().isIn([...BUDGETS, '']),
  body('timeline').optional({ checkFalsy: true }).trim().isIn([...TIMELINES, '']),
  body('requirements').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
];

quotesRouter.post('/', quoteLimiter, rules, handleValidation, async (req, res) => {
  try {
    const { name, email, phone, company, project_type, budget, timeline, requirements } = req.body;
    const ip = req.ip || req.socket.remoteAddress;

    await query(
      `INSERT INTO quote_requests (name, email, phone, company, project_type, budget, timeline, requirements, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, company || null, project_type, budget || null, timeline || null, requirements || null, ip],
    );

    res.status(201).json({ success: true, message: 'Quote request received! We\'ll send a detailed proposal within 48 hours.' });
  } catch (err) {
    console.error('quotes route error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

quotesRouter.get('/options', (req, res) => {
  res.json({ project_types: PROJECT_TYPES, budgets: BUDGETS, timelines: TIMELINES });
});
