import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiHome } from 'react-icons/fi';
import '../styles/notfound.css';

const QUICK_LINKS = [
  { label: 'Services', path: '/services' },
  { label: 'Solutions', path: '/solutions' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'About', path: '/about' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <motion.main
      className="notfound-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="notfound-bg" aria-hidden="true">
        <div className="notfound-glow-1" />
        <div className="notfound-glow-2" />
      </div>

      <div className="notfound-content">
        {/* Big 404 */}
        <div style={{ position: 'relative' }}>
          <motion.div
            className="notfound-code"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
            aria-hidden="true"
          >
            404
          </motion.div>
          <div className="notfound-code-overlay" aria-hidden="true">
            <motion.div
              className="notfound-icon-wrap"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
            >
              <FiAlertCircle size={40} />
            </motion.div>
          </div>
        </div>

        {/* Text */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="notfound-title">
            Page Not Found
          </h1>
          <p className="notfound-desc">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="notfound-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FiArrowLeft size={16} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            <FiHome size={16} /> Back to Home
          </Link>
        </motion.div>

        {/* Quick nav */}
        <motion.div
          className="notfound-links"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {QUICK_LINKS.map((link) => (
            <Link key={link.path} to={link.path} className="notfound-quick-link">
              {link.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </motion.main>
  );
}
