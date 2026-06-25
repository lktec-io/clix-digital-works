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
  email: 'info@clixdigitalworks.co.tz',
  emailSupport: 'support@clixdigitalworks.co.tz',
  phone: '+255 XXX XXX XXX',          // replace with real number
  phoneWhatsApp: '+255XXX000000',     // used for wa.me links (digits only)

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
  website: 'https://clixdigitalworks.co.tz',

  social: {
    facebook:  'https://facebook.com/clixdigitalworks',
    twitter:   'https://twitter.com/clixdigitalworks',
    linkedin:  'https://linkedin.com/company/clixdigitalworks',
    instagram: 'https://instagram.com/clixdigitalworks',
    youtube:   'https://youtube.com/@clixdigitalworks',
    whatsapp:  'https://wa.me/255XXX000000',  // replace phone digits
  },

  // ─── Business hours ───────────────────────────────────────────────────────
  hours: {
    weekdays: 'Monday – Friday, 8 AM – 6 PM EAT',
    saturday: 'Saturday, 9 AM – 2 PM EAT',
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
