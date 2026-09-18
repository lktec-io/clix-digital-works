/**
 * CRM display helpers. Calendar dates arrive from the API as 'YYYY-MM-DD'
 * strings and are formatted without going through the browser's timezone, so
 * a due date can never shift by a day. Timestamps are shown in the business
 * timezone. Money arrives as exact DECIMAL strings and is only converted to a
 * number for display.
 */

export const CRM_TZ = 'Africa/Dar_es_Salaam';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-12-12' -> '12 Dec 2026' */
export function formatDate(ymd, fallback = '—') {
  if (!ymd || typeof ymd !== 'string') return fallback;
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return fallback;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** '2026-11-01' -> 'Nov 2026' (for expected start dates, which are usually approximate). */
export function formatMonth(ymd, fallback = '—') {
  if (!ymd) return fallback;
  const [y, m] = ymd.slice(0, 10).split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

const dateTimeParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: CRM_TZ, day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Timestamp -> '16 Sep 2026, 14:05' in business time (same month style as formatDate). */
export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const p = Object.fromEntries(dateTimeParts.formatToParts(d).map(x => [x.type, x.value]));
  return `${Number(p.day)} ${MONTHS[Number(p.month) - 1]} ${p.year}, ${p.hour}:${p.minute}`;
}

/** Today in the business timezone (used only until the server's `today` arrives). */
export function localToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CRM_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const dayNumber = ymd => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

/** Whole days from `today` to `ymd` (negative = past). */
export const daysUntil = (ymd, today) => Math.round(dayNumber(ymd) - dayNumber(today));

/** Human due label + tone for a follow-up or event date. */
export function dueInfo(ymd, today, { closed = false } = {}) {
  if (!ymd) return { label: 'No date', tone: 'muted' };
  const diff = daysUntil(ymd, today);
  if (closed) return { label: formatDate(ymd), tone: 'muted' };
  if (diff === 0) return { label: 'Today', tone: 'green' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'cyan' };
  if (diff === -1) return { label: '1 day overdue', tone: 'red' };
  if (diff < 0) return { label: `${-diff} days overdue`, tone: 'red' };
  if (diff <= 7) return { label: `In ${diff} days`, tone: 'cyan' };
  return { label: formatDate(ymd), tone: 'muted' };
}

/** Event countdown: 'In 12 days', 'Today', 'Passed'. */
export function eventCountdown(ymd, today) {
  if (!ymd) return 'Date not set';
  const diff = daysUntil(ymd, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} ago`;
  return `In ${diff} days`;
}

const tzsWhole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const tzsCents = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 'TZS 2,500,000' for whole amounts, 'TZS 18,150,000.50' when cents exist. */
export function formatTZS(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return `TZS ${(Number.isInteger(n) ? tzsWhole : tzsCents).format(n)}`;
}

export const hasBalance = value => Number(value) > 0;

/**
 * Short money for metric tiles, where a full figure would wrap on a phone:
 * 'TZS 18.2M' / 'TZS 450K'. The exact amount is kept in the tile's tooltip.
 */
export function formatTZSCompact(value, fallback = 'TZS 0') {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return fallback;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (abs >= 10_000) return `TZS ${Math.round(n / 1000)}K`;
  return formatTZS(n, fallback);
}

/** Option list lookup: labelFor(options.client_statuses, 'lead') -> 'Lead'. */
export function labelFor(list, value, fallback = '—') {
  if (!value) return fallback;
  return list?.find(o => o.value === value)?.label || value.replace(/_/g, ' ');
}

/** Visual tone per status value. Kept to the admin panel's existing badge colours. */
const TONES = {
  // client pipeline
  lead: 'muted', prospect: 'cyan', negotiation: 'amber', confirmed: 'green', active: 'green', inactive: 'red',
  // projects
  planned: 'muted', quoted: 'cyan', in_progress: 'cyan', on_hold: 'amber', cancelled: 'red',
  // payments
  unpaid: 'red', partial: 'amber', paid: 'green',
  // follow-ups
  pending: 'cyan', snoozed: 'amber', overdue: 'red',
  // cardhub events
  new: 'cyan', planning: 'muted', designing: 'amber', ready: 'green', delivered: 'green', event_completed: 'muted',
  // shared
  completed: 'muted', high: 'red', medium: 'amber', low: 'muted',
};

export const toneFor = value => TONES[value] || 'muted';

/**
 * Short Swahili helpers, shown under labels only where a term may be unclear
 * to a non-technical user. One sentence maximum — keep it that way.
 */
export const SW = {
  status:          'Hatua ambayo mteja alipo kwa sasa.',
  priority:        'Umuhimu wa kumfuatilia mteja huyu.',
  followUpDate:    'Ni tarehe ya kumfuatilia tena mteja.',
  expectedStart:   'Tarehe ambayo mteja anatarajia kuanza huduma au project.',
  budget:          'Kiasi ambacho mteja anakadiria kutumia.',
  totalPrice:      'Bei kamili iliyokubaliwa.',
  amountPaid:      'Kiasi ambacho tayari kimeshalipwa.',
  balance:         'Kiasi ambacho bado hakijalipwa.',
  eventDate:       'Tarehe ya tukio.',
  expectedGuests:  'Idadi ya wageni wanaotarajiwa.',
  reference:       'Namba au kumbukumbu ya malipo.',
  source:          'Mteja alitufahamu kupitia wapi.',
};

/** One-line plain explanations of statuses, shown for the currently selected value. */
export const STATUS_HELP = {
  client: {
    lead:        'Amewasiliana nasi kwa mara ya kwanza.',
    prospect:    'Mteja anayevutiwa na huduma lakini bado hajathibitisha.',
    negotiation: 'Tunajadiliana bei au masharti.',
    confirmed:   'Amekubali kufanya kazi nasi.',
    active:      'Kazi yake inaendelea sasa.',
    completed:   'Kazi yake imekamilika.',
    inactive:    'Hafuatiliwi tena kwa sasa.',
  },
  project: {
    planned:     'Imepangwa, bado haijaanza.',
    quoted:      'Mteja amepewa bei.',
    confirmed:   'Mteja amekubali, tayari kuanza.',
    in_progress: 'Kazi inaendelea.',
    on_hold:     'Imesimamishwa kwa muda.',
    completed:   'Imekamilika.',
    cancelled:   'Imesitishwa.',
  },
  event: {
    new:             'Oda mpya imepokelewa.',
    planning:        'Tunakusanya taarifa za tukio.',
    designing:       'Kadi zinasanifiwa.',
    ready:           'Kadi ziko tayari.',
    delivered:       'Kadi zimekabidhiwa kwa mteja.',
    event_completed: 'Tukio limeshafanyika.',
    cancelled:       'Oda imesitishwa.',
  },
};

/** Parses a typed amount ("1,500,000") to a number for display maths only; the server re-validates. */
export function parseAmount(value) {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return String(value ?? '').trim() === '' || Number.isNaN(n) ? null : n;
}

/** Maps API 422 details to { field: message }. */
export function fieldErrors(err) {
  return Object.fromEntries((err?.details || []).map(d => [d.field, d.message]));
}

/** WhatsApp deep link for a Tanzanian or international number. */
export function whatsappLink(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) digits = `255${digits.slice(1)}`;
  return digits.length >= 9 ? `https://wa.me/${digits}` : null;
}

/** Builds a query string, dropping empty values. */
export function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}
