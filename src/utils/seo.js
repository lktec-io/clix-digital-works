const BASE_URL = 'https://clixworks.co.tz';

// ── Legacy helper (kept for backwards compatibility) ──────────────────────────
export function setPageMeta({ title, description, canonical, ogImage } = {}) {
  const fullTitle = title
    ? `${title} | Clix Digital Works`
    : 'Clix Digital Works | Software Engineering & Digital Transformation | Mbeya, Tanzania';

  document.title = fullTitle;

  setMeta('name', 'description', description || 'Software engineering and digital transformation company in Mbeya, Tanzania.');
  setMeta('property', 'og:title',       fullTitle);
  setMeta('property', 'og:description', description || '');
  setMeta('property', 'og:url',         canonical ? `${BASE_URL}${canonical}` : BASE_URL);
  if (ogImage) setMeta('property', 'og:image', `${BASE_URL}${ogImage}`);

  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${BASE_URL}${canonical}`;
  }
}

function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Kept to avoid breaking any imports, but trackEvent lives in analytics.js too
export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// ── Schema builders ───────────────────────────────────────────────────────────

/**
 * BreadcrumbList schema.
 * @param {Array<{name: string, path: string}>} crumbs
 */
export function buildBreadcrumbs(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       crumb.name,
      item:       crumb.path.startsWith('http')
                    ? crumb.path
                    : `${BASE_URL}${crumb.path}`,
    })),
  };
}

/**
 * FAQPage schema.
 * @param {Array<{q: string, a: string}>} items
 */
export function buildFAQ(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name:    q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    a,
      },
    })),
  };
}

/**
 * Service schema.
 * @param {{ name: string, description: string, url?: string }} service
 */
export function buildService({ name, description, url }) {
  return {
    '@context':   'https://schema.org',
    '@type':      'Service',
    serviceType:  name,
    description,
    provider: {
      '@type': 'Organization',
      name:    'Clix Digital Works',
      url:     BASE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name:    'Tanzania',
    },
    url: url ? `${BASE_URL}${url}` : `${BASE_URL}/services`,
  };
}

/**
 * Inject Search Console and Bing verification meta tags
 * based on VITE_ environment variables. Safe to call multiple times.
 */
export function injectVerificationTags() {
  const gsc  = import.meta.env.VITE_GSC_VERIFICATION;
  const bing = import.meta.env.VITE_BING_VERIFICATION;

  if (gsc && !document.querySelector('meta[name="google-site-verification"]')) {
    const m = document.createElement('meta');
    m.name    = 'google-site-verification';
    m.content = gsc;
    document.head.appendChild(m);
  }

  if (bing && !document.querySelector('meta[name="msvalidate.01"]')) {
    const m = document.createElement('meta');
    m.name    = 'msvalidate.01';
    m.content = bing;
    document.head.appendChild(m);
  }
}
