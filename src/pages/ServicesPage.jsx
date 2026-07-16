import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Services from '../sections/Services';
import Contact from '../sections/Contact';
import { FiArrowRight } from 'react-icons/fi';
import '../styles/pages.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs, buildFAQ } from '../utils/seo';

const BREADCRUMB_SCHEMA = buildBreadcrumbs([
  { name: 'Home',     path: '/' },
  { name: 'Services', path: '/services' },
]);

const FAQ_SCHEMA = buildFAQ([
  {
    q: 'How much does it cost to build a website in Tanzania?',
    a: 'Website costs depend on complexity. A professional business site starts from TZS 500,000, while custom web applications range from TZS 1,500,000 upward. We provide a free, detailed quote within 24 hours — contact us to get started.',
  },
  {
    q: 'How long does it take to build a mobile app?',
    a: 'A standard cross-platform mobile app typically takes 6–12 weeks. We build iOS and Android apps with React Native, which significantly reduces both development time and cost without sacrificing quality.',
  },
  {
    q: 'Do you integrate M-Pesa and other local payment methods?',
    a: 'Yes. We integrate M-Pesa, Airtel Money, and other Tanzanian mobile payment gateways into websites, mobile apps, and business management systems.',
  },
  {
    q: 'Do you provide technical support after the project is delivered?',
    a: 'Yes. We offer 24/7 emergency support, monthly maintenance retainers, proactive monitoring, and a dedicated WhatsApp support channel with under-2-hour response times for critical issues.',
  },
  {
    q: 'What industries do you build software for?',
    a: 'We build for schools, hospitals, churches, SACCOs, NGOs, government institutions, logistics companies, and businesses of all sizes across Tanzania and East Africa.',
  },
  {
    q: 'Do you offer cloud hosting and server management?',
    a: 'Yes. We provide fully managed VPS hosting on enterprise-grade infrastructure with automated backups, SSL certificates, performance monitoring, and a 99.9% uptime SLA.',
  },
]);

const PAGE_SCHEMA = [BREADCRUMB_SCHEMA, FAQ_SCHEMA];

export default function ServicesPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Web, Mobile, AI &amp; Digital Services"
        description="Explore 12 professional digital services: website development, mobile apps, AI solutions, ERP systems, cybersecurity, cloud hosting, accounting software, and more — built for Tanzania."
        canonical="/services"
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
            <span className="section-label">What We Offer</span>
            <h1 className="page-hero-title">
              Complete Digital <span className="gradient-text">Services</span>
            </h1>
            <p className="page-hero-subtitle">
              From web development to AI solutions — we have the expertise to build any digital product your organization needs.
            </p>
            <div className="page-hero-actions">
              <Link to="/contact" className="btn btn-primary">
                Get a Free Quote <FiArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Services />
      <Contact />
    </motion.main>
  );
}
