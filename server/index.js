import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import { globalRateLimiter } from './middleware/rateLimiter.js';
import { contactRouter }    from './routes/contact.js';
import { quotesRouter }     from './routes/quotes.js';
import { newsletterRouter } from './routes/newsletter.js';
import { adminRouter }      from './routes/admin.js';
import { runMigrations }    from './db/migrate.js';

dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

const app  = express();
// Trust Nginx / Cloudflare reverse proxy
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (
    process.env.ALLOWED_ORIGIN ||
    'https://clixworks.co.tz,https://www.clixworks.co.tz,http://localhost:5173'
)
.split(',')
.map(o => o.trim())
.filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('[cors] Blocked origin:', origin);
    callback(new Error(`Origin ${origin} not allowed.`));
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
  console.error('[error]', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
  } catch (err) {
    console.error('[migrate] Migration error (server will still start):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`✓ Clix API running on port ${PORT}`);
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  DB:       ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
  });
}

start();
