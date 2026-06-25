import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Services from '../sections/Services';
import Contact from '../sections/Contact';
import { FiArrowRight } from 'react-icons/fi';
import '../styles/pages.css';

export default function ServicesPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
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
