import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMap } from 'react-icons/fi';
import '../styles/legal.css';

const SITE_STRUCTURE = [
  {
    heading: 'Main Pages',
    links: [
      { label: 'Home', path: '/', desc: 'Company overview and highlights' },
      { label: 'Services', path: '/services', desc: 'All digital services we offer' },
      { label: 'Solutions', path: '/solutions', desc: 'Industry-specific solutions' },
      { label: 'Portfolio', path: '/portfolio', desc: 'Completed projects showcase' },
      { label: 'About Us', path: '/about', desc: 'Our story, team, and values' },
      { label: 'Blog', path: '/blog', desc: 'Articles and digital guides' },
      { label: 'Contact', path: '/contact', desc: 'Get in touch with our team' },
    ],
  },
  {
    heading: 'Our Services',
    links: [
      { label: 'Website Development', path: '/services', desc: 'Responsive web applications' },
      { label: 'Mobile App Development', path: '/services', desc: 'iOS and Android apps' },
      { label: 'Custom Software', path: '/services', desc: 'Bespoke business software' },
      { label: 'AI & ML Solutions', path: '/services', desc: 'Artificial intelligence tools' },
      { label: 'Cybersecurity', path: '/services', desc: 'Security assessments and solutions' },
      { label: 'ERP Systems', path: '/services', desc: 'Enterprise resource planning' },
      { label: 'Accounting Systems', path: '/services', desc: 'Financial management software' },
      { label: 'Cloud & VPS Hosting', path: '/services', desc: 'Reliable hosting infrastructure' },
      { label: 'IoT & Automation', path: '/services', desc: 'Smart system integration' },
    ],
  },
  {
    heading: 'Industry Solutions',
    links: [
      { label: 'Schools & Universities', path: '/solutions', desc: 'Education management systems' },
      { label: 'Churches & Religious Orgs', path: '/solutions', desc: 'Congregation management' },
      { label: 'Hospitals & Clinics', path: '/solutions', desc: 'Healthcare information systems' },
      { label: 'SACCOs & MFIs', path: '/solutions', desc: 'Financial cooperative software' },
      { label: 'Businesses & Enterprises', path: '/solutions', desc: 'ERP and business tools' },
      { label: 'NGOs & Non-Profits', path: '/solutions', desc: 'Impact management systems' },
      { label: 'Government Institutions', path: '/solutions', desc: 'E-government platforms' },
      { label: 'Logistics Companies', path: '/solutions', desc: 'Fleet and shipment tracking' },
    ],
  },
  {
    heading: 'Legal & Info',
    links: [
      { label: 'Privacy Policy', path: '/privacy', desc: 'How we handle your data' },
      { label: 'Terms of Service', path: '/terms', desc: 'Service agreement terms' },
      { label: 'Sitemap', path: '/sitemap', desc: 'Full site structure' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <motion.main
      className="legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <motion.div
          className="legal-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <FiMap size={12} /> Navigation
          </span>
          <h1>Sitemap</h1>
          <p className="legal-meta">Complete structure of the Clix Digital Works website</p>
        </motion.div>

        <motion.div
          className="legal-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ maxWidth: '100%' }}
        >
          <div className="sitemap-grid">
            {SITE_STRUCTURE.map((group, gi) => (
              <motion.div
                key={group.heading}
                className="sitemap-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: gi * 0.08, duration: 0.4 }}
              >
                <h3>{group.heading}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.path} title={link.desc}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
