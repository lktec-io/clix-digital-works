import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://clixworks.co.tz';
const SITE_NAME = 'Clix Digital Works';
const DEFAULT_DESCRIPTION =
  'Clix Digital Works builds custom software, websites, mobile apps, AI systems, ERP platforms, and cybersecurity solutions for organizations across Tanzania.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.svg`;

function upsertMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href, extra = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

/**
 * SEO — drop-in per-page meta, OG, Twitter and JSON-LD manager.
 *
 * Props:
 *  title       Short page title (without site name). Appended as "Title | Clix Digital Works".
 *  description Meta description — aim for 140-160 chars.
 *  canonical   URL path, e.g. '/services'. Falls back to location.pathname.
 *  ogImage     Absolute path to OG image, e.g. '/og-services.png'.
 *  ogType      Open Graph type (default: 'website').
 *  noindex     Pass true for 404 and other non-indexable pages.
 *  schema      One or an array of JSON-LD objects (with @context on each, or omit and they share).
 */
export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  schema,
}) {
  const location = useLocation();
  const tagId = useRef(`page-schema-${Math.random().toString(36).slice(2)}`);

  // Stringify schema so primitive equality check works inside useEffect deps
  const schemaJSON = useMemo(
    () => (schema ? JSON.stringify(schema) : null),
    [schema],
  );

  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} Clix Digital Works | Software & App Development, Tanzania`;

    const desc = description || DEFAULT_DESCRIPTION;
    const path  = canonical != null ? canonical : location.pathname;
    const canonUrl = `${BASE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
    const imageUrl = ogImage ? `${BASE_URL}${ogImage}` : DEFAULT_OG_IMAGE;

    // ── Document title ────────────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Core meta ─────────────────────────────────────────────────────────────
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // ── Open Graph ────────────────────────────────────────────────────────────
    upsertMeta('property', 'og:title',       fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url',         canonUrl);
    upsertMeta('property', 'og:image',       imageUrl);
    upsertMeta('property', 'og:type',        ogType);
    upsertMeta('property', 'og:locale',      'en_TZ');
    upsertMeta('property', 'og:site_name',   SITE_NAME);

    // ── Twitter Card ──────────────────────────────────────────────────────────
    upsertMeta('name', 'twitter:card',        'summary_large_image');
    upsertMeta('name', 'twitter:title',       fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image',       imageUrl);
    upsertMeta('name', 'twitter:site',        '@clixworks_tz');
    upsertMeta('name', 'twitter:creator',     '@clixworks_tz');

    // ── Canonical ─────────────────────────────────────────────────────────────
    upsertLink('canonical', canonUrl);

    // ── Page-level JSON-LD schema ─────────────────────────────────────────────
    if (schemaJSON) {
      const schemas = JSON.parse(schemaJSON);
      const items   = Array.isArray(schemas) ? schemas : [schemas];

      // Strip @context from each item and wrap in @graph so they share one <script>
      const stripped = items.map(({ '@context': _ctx, ...rest }) => rest);
      const payload  = stripped.length === 1
        ? { '@context': 'https://schema.org', ...stripped[0] }
        : { '@context': 'https://schema.org', '@graph': stripped };

      let scriptEl = document.getElementById(tagId.current);
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.type = 'application/ld+json';
        scriptEl.id   = tagId.current;
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(payload);
    }

    return () => {
      // Remove page-specific schema when navigating away
      document.getElementById(tagId.current)?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, ogImage, ogType, noindex, schemaJSON, location.pathname]);

  return null;
}
