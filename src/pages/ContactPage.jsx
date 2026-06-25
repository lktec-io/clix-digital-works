import { motion } from 'framer-motion';
import Contact from '../sections/Contact';
import '../styles/pages.css';

export default function ContactPage() {
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
