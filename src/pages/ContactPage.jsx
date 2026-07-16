import { motion } from 'framer-motion';
import Contact from '../sections/Contact';
import '../styles/pages.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs } from '../utils/seo';

const PAGE_SCHEMA = [
  buildBreadcrumbs([
    { name: 'Home',    path: '/' },
    { name: 'Contact', path: '/contact' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type':    'ContactPage',
    name:       'Contact Clix Digital Works',
    description: 'Get in touch with Clix Digital Works for a free consultation on your software or digital transformation project.',
    url:        'https://clixworks.co.tz/contact',
    mainEntity: {
      '@type':    'LocalBusiness',
      '@id':      'https://clixworks.co.tz/#localbusiness',
      name:       'Clix Digital Works',
      telephone:  '+255674022265',
      email:      'info@clixworks.co.tz',
      address: {
        '@type':           'PostalAddress',
        addressLocality:   'Mbeya',
        addressRegion:     'Mbeya Region',
        addressCountry:    'TZ',
      },
    },
  },
];

export default function ContactPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Contact Us — Free Consultation"
        description="Ready to start your digital transformation? Contact Clix Digital Works for a free consultation and we'll respond within 24 hours to discuss your software, website, or app project."
        canonical="/contact"
        schema={PAGE_SCHEMA}
      />

      <div className="page-hero">
        <div className="page-hero-bg" />
        <div className="container">
          <motion.div
            className="page-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Get In Touch</span>
            <h1 className="page-hero-title">
              Let's Build Something <span className="gradient-text">Great Together</span>
            </h1>
            <p className="page-hero-subtitle">
              Ready to start your digital transformation? Reach out and we'll provide a free consultation within 24 hours.
            </p>
          </motion.div>
        </div>
      </div>

      <Contact />
    </motion.main>
  );
}
