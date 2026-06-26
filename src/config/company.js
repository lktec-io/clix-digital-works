/**
 * Company configuration — single source of truth for all contact
 * details, social links, and brand constants used across the site.
 *
 * Update this file to change information site-wide.
 */

export const COMPANY = {
  name: 'Clix Digital Works',
  shortName: 'Clix',
  tagline: 'Innovate • Create • Connect • Grow',
  description:
    'A software engineering and digital transformation company based in Mbeya, Tanzania. We build powerful digital solutions that help organizations grow.',

  // ─── Contact ──────────────────────────────────────────────────────────────
  email: 'info@clixworks.co.tz',
  emailSupport: 'support@clixworks.co.tz',
  phone: '+255 674 022 265',
  phone2: '+255 794 987 520',
  phoneWhatsApp: '255674022265',    // digits only — used in wa.me links
  phoneWhatsApp2: '255794987520',   // digits only — used in wa.me links

  // ─── Location ─────────────────────────────────────────────────────────────
  address: {
    city: 'Mbeya',
    region: 'Mbeya Region',
    country: 'Tanzania',
    continent: 'East Africa',
    full: 'Mbeya, Tanzania',
    googleMapsUrl: 'https://maps.google.com/?q=Mbeya,Tanzania',
  },

  // ─── Online presence ──────────────────────────────────────────────────────
  website: 'https://clixworks.co.tz',

  social: {
    facebook:  'https://facebook.com/clixworks.tz',
    twitter:   'https://twitter.com/clixworks_tz',
    linkedin:  'https://linkedin.com/company/clix-digital-works',
    instagram: 'https://instagram.com/clixworks.tz',
    youtube:   'https://youtube.com/@clixdigitalworks',
    whatsapp:  'https://wa.me/255674022265',
  },

  // ─── Business hours ───────────────────────────────────────────────────────
  hours: {
    weekdays: 'Monday – Friday: 08:00 AM – 06:00 PM EAT',
    saturday: 'Saturday: Closed',
    sunday: 'Sunday: 08:00 AM – 02:00 PM EAT',
    support: '24/7 (emergency technical support)',
  },

  // ─── SEO / Meta ───────────────────────────────────────────────────────────
  meta: {
    title: 'Clix Digital Works | Software Engineering & Digital Transformation | Mbeya, Tanzania',
    description:
      'Clix Digital Works builds custom software, websites, mobile apps, AI systems, ERP platforms, and cybersecurity solutions for organizations across Tanzania.',
    keywords:
      'software company Tanzania, web development Mbeya, mobile apps Tanzania, ERP system Tanzania, AI solutions, church management system, school management system, SACCO system, accounting software Tanzania, cybersecurity Tanzania',
    ogImage: '/og-image.png',
  },

  // ─── Established ──────────────────────────────────────────────────────────
  founded: 2024,
  copyright: () => `© ${new Date().getFullYear()} Clix Digital Works. All rights reserved.`,
};

export default COMPANY;
