const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (!GA_ID || import.meta.env.DEV) return;

  const script = document.createElement('script');
  script.async = true;
  script.src   = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // send_page_view: false — we fire page views manually via trackPageView
  window.gtag('config', GA_ID, { send_page_view: false });

  // Inject Search Console and Bing Webmaster verification tags after GA boots
  injectVerificationTags();
}

export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path:     path,
    page_location: window.location.href,
  });
}

export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

export function trackFormSubmit(formName) {
  trackEvent('form_submit', { form_name: formName });
}

export function trackQuoteRequest(projectType) {
  trackEvent('quote_request', { project_type: projectType });
}

export function trackNewsletterSignup() {
  trackEvent('newsletter_signup');
}

/**
 * Inject Google Search Console and Bing Webmaster Tools verification meta tags.
 * Reads from VITE_GSC_VERIFICATION and VITE_BING_VERIFICATION env vars.
 * Safe to call multiple times — checks for existing tags before inserting.
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
