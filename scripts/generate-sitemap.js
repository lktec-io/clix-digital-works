#!/usr/bin/env node
// Usage: node scripts/generate-sitemap.js
// Regenerates public/sitemap.xml with today's lastmod date.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL  = 'https://clixworks.co.tz';
const TODAY     = new Date().toISOString().slice(0, 10);

const ROUTES = [
  { path: '/',          priority: '1.0', changefreq: 'weekly' },
  { path: '/services',  priority: '0.9', changefreq: 'monthly' },
  { path: '/solutions', priority: '0.8', changefreq: 'monthly' },
  { path: '/portfolio', priority: '0.8', changefreq: 'monthly' },
  { path: '/about',     priority: '0.7', changefreq: 'monthly' },
  { path: '/blog',      priority: '0.7', changefreq: 'weekly' },
  { path: '/contact',   priority: '0.9', changefreq: 'monthly' },
  { path: '/privacy',   priority: '0.3', changefreq: 'yearly' },
  { path: '/terms',     priority: '0.3', changefreq: 'yearly' },
];

const urls = ROUTES.map(r => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>
`;

const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`✓ sitemap.xml generated (${ROUTES.length} URLs) → ${outPath}`);
