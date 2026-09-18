const BASE = import.meta.env.VITE_API_URL || "";

export const API = {
  contact:             `${BASE}/api/contact`,
  quotes:              `${BASE}/api/quotes`,
  quoteOptions:        `${BASE}/api/quotes/options`,
  newsletterSubscribe: `${BASE}/api/newsletter/subscribe`,
  adminLogin:          `${BASE}/api/admin/login`,
  adminStats:          `${BASE}/api/admin/stats`,
  adminContacts:       `${BASE}/api/admin/contacts`,
  adminQuotes:         `${BASE}/api/admin/quotes`,
  adminNewsletter:     `${BASE}/api/admin/newsletter`,
  newsletterExport:    `${BASE}/api/newsletter/export`,

  // CRM + CardHub management (admin-only)
  crmOptions:          `${BASE}/api/admin/crm/options`,
  crmDashboard:        `${BASE}/api/admin/crm/dashboard`,
  crmSearch:           `${BASE}/api/admin/crm/search`,
  clients:             `${BASE}/api/admin/clients`,
  projects:            `${BASE}/api/admin/projects`,
  followUps:           `${BASE}/api/admin/follow-ups`,
  cardhubEvents:       `${BASE}/api/admin/cardhub/events`,
  payments:            `${BASE}/api/admin/payments`,
  expenses:            `${BASE}/api/admin/expenses`,
  expensesSummary:     `${BASE}/api/admin/expenses-summary`,
};

export async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('clix_admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    // Additive: callers that only read err.message are unaffected.
    err.status = res.status;
    err.details = data.details || [];
    throw err;
  }
  return data;
}
