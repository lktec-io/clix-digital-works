import { motion } from 'framer-motion';
import BlogPreview from '../sections/BlogPreview';
import Contact from '../sections/Contact';
import '../styles/pages.css';

export default function BlogPage() {
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
            <span className="section-label">Knowledge Hub</span>
            <h1 className="page-hero-title">
              Insights & <span className="gradient-text">Digital Guides</span>
            </h1>
            <p className="page-hero-subtitle">
              Expert articles on technology, software, cybersecurity, and digital transformation for modern organizations.
            </p>
          </motion.div>
        </div>
      </div>

      <BlogPreview />
      <Contact />
    </motion.main>
  );
}
