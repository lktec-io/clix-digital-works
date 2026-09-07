import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutGrid,
  Boxes,
  BriefcaseBusiness,
  Users,
  Newspaper,
  MessageSquare,
  ArrowRight,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import Logo from './Logo';
import '../styles/sidebar.css';

const navItems = [
  { label: 'Home',      path: '/',          Icon: Home,              hint: 'Start here' },
  { label: 'Services',  path: '/services',  Icon: LayoutGrid,        hint: 'What we build' },
  { label: 'Solutions', path: '/solutions', Icon: Boxes,             hint: 'Ready-made systems' },
  { label: 'Portfolio', path: '/portfolio', Icon: BriefcaseBusiness, hint: 'Our work' },
  { label: 'About',     path: '/about',     Icon: Users,             hint: 'Who we are' },
  { label: 'Blog',      path: '/blog',      Icon: Newspaper,         hint: 'Insights' },
  { label: 'Contact',   path: '/contact',   Icon: MessageSquare,     hint: "Let's talk" },
];

/* Spring physics: weighted enough to feel like a real panel, damped enough
   that it settles without wobble. */
const panelSpring = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 };

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

const panelVariants = {
  hidden:  { x: '100%' },
  visible: { x: 0, transition: { ...panelSpring, when: 'beforeChildren', staggerChildren: 0.045, delayChildren: 0.08 } },
  exit:    { x: '100%', transition: { type: 'spring', stiffness: 400, damping: 40, mass: 0.7 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 420, damping: 32 } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.12 } },
};

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  /* Lock body scroll while open, and preserve the underlying scroll offset so
     closing the drawer never jumps the page. */
  useEffect(() => {
    if (!open) return undefined;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    };
  }, [open]);

  /* Escape to close, and focus management for keyboard + screen-reader users. */
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector('a[href], button')?.focus();
    }, 260);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sidebar-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            ref={panelRef}
            id="premium-sidebar"
            className="sidebar-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className="sidebar-glow" aria-hidden="true" />

            <motion.header className="sidebar-head" variants={itemVariants}>
              <Link to="/" className="sidebar-brand" onClick={onClose}>
                <Logo variant="navbar" showText={true} />
              </Link>
              <button
                type="button"
                className="sidebar-close"
                onClick={onClose}
                aria-label="Close navigation"
              >
                <X size={20} strokeWidth={2.2} />
              </button>
            </motion.header>

            <motion.p className="sidebar-eyebrow" variants={itemVariants}>
              Navigation
            </motion.p>

            <nav className="sidebar-nav" aria-label="Primary">
              <ul role="list">
                {navItems.map(({ label, path, Icon, hint }) => {
                  const isActive = location.pathname === path;
                  return (
                    <motion.li key={path} variants={itemVariants}>
                      <Link
                        to={path}
                        className={`sidebar-link ${isActive ? 'is-active' : ''}`}
                        onClick={onClose}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {isActive && (
                          <motion.span
                            className="sidebar-link-rail"
                            layoutId="sidebarRail"
                            transition={panelSpring}
                            aria-hidden="true"
                          />
                        )}
                        <span className="sidebar-link-icon" aria-hidden="true">
                          <Icon size={18} strokeWidth={2.1} />
                        </span>
                        <span className="sidebar-link-text">
                          <span className="sidebar-link-label">{label}</span>
                          <span className="sidebar-link-hint">{hint}</span>
                        </span>
                        <ArrowRight className="sidebar-link-chevron" size={16} aria-hidden="true" />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <motion.div className="sidebar-footer" variants={itemVariants}>
              <Link to="/contact" className="btn btn-primary sidebar-cta" onClick={onClose}>
                Let's Talk <ArrowRight size={16} />
              </Link>

              <div className="sidebar-contact">
                <a href="tel:+255674022265" className="sidebar-contact-row">
                  <Phone size={14} aria-hidden="true" />
                  <span>+255 674 022 265</span>
                </a>
                <a href="mailto:info@clixworks.co.tz" className="sidebar-contact-row">
                  <Mail size={14} aria-hidden="true" />
                  <span>info@clixworks.co.tz</span>
                </a>
              </div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
