import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Portfolio from '../sections/Portfolio';
import Contact from '../sections/Contact';
import { FiArrowRight } from 'react-icons/fi';
import '../styles/pages.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs } from '../utils/seo';

const PAGE_SCHEMA = buildBreadcrumbs([
  { name: 'Home',      path: '/' },
  { name: 'Portfolio', path: '/portfolio' },
]);

export default function PortfolioPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Our Projects &amp; Case Studies"
        description="View our showcase of custom websites, mobile apps, management systems, and digital solutions built for clients across Tanzania and East Africa. Real projects, real impact."
        canonical="/portfolio"
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
            <span className="section-label">Our Work</span>
            <h1 className="page-hero-title">
              Projects We're <span className="gradient-text">Proud Of</span>
            </h1>
            <p className="page-hero-subtitle">
              A showcase of the systems, websites, and digital solutions we've built for clients across Tanzania and beyond.
            </p>
            <div className="page-hero-actions">
              <Link to="/contact" className="btn btn-primary">
                Start Your Project <FiArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Portfolio />
      <Contact />
    </motion.main>
  );
}
