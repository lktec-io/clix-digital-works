import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Solutions from '../sections/Solutions';
import Contact from '../sections/Contact';
import { FiArrowRight } from 'react-icons/fi';
import '../styles/pages.css';

export default function SolutionsPage() {
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
            <span className="section-label">Industry Solutions</span>
            <h1 className="page-hero-title">
              Solutions Built for <span className="gradient-text">Your Sector</span>
            </h1>
            <p className="page-hero-subtitle">
              We understand that every industry has unique challenges. Our solutions are tailored to the specific needs of your organization.
            </p>
            <div className="page-hero-actions">
              <Link to="/contact" className="btn btn-primary">
                Find Your Solution <FiArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Solutions />
      <Contact />
    </motion.main>
  );
}
