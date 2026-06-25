import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { globalRateLimiter } from './middleware/rateLimiter.js';
import { contactRouter }    from './routes/contact.js';
import { quotesRouter }     from './routes/quotes.js';
import { newsletterRouter } from './routes/newsletter.js';
import { adminRouter }      from './routes/admin.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/contact',    contactRouter);
app.use('/api/quotes',     quotesRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin',      adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✓ Clix API running on http://localhost:${PORT}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
