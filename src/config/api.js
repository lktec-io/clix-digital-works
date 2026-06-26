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
};

export async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('clix_admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
