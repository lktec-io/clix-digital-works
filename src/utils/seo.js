const BASE_URL = 'https://clixworks.co.tz';

export function setPageMeta({ title, description, canonical, ogImage } = {}) {
  const fullTitle = title
    ? `${title} | Clix Digital Works`
    : 'Clix Digital Works | Software Engineering & Digital Transformation | Mbeya, Tanzania';

  document.title = fullTitle;

  setMeta('name', 'description', description || 'Software engineering and digital transformation company in Mbeya, Tanzania.');
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description || '');
  setMeta('property', 'og:url', canonical ? `${BASE_URL}${canonical}` : BASE_URL);
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

export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}
