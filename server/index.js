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
import path from 'path';
dotenv.config({
  path: path.resolve('./server/.env')
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
    "https://clixworks.co.tz,https://www.clixworks.co.tz,http://localhost:5173"
)
.split(",")
.map(origin => origin.trim());

app.use(cors({
    origin(origin, callback) {

        // requests without origin (curl, Postman, server-server)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("Blocked Origin:", origin);

        callback(new Error(`Origin ${origin} not allowed.`));
    },

    credentials: true
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
  console.log(`✓ Clix API running on https://clixworks.co.tz:${PORT}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
