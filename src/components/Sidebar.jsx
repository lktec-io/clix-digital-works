import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import '../styles/sidebar.css';

/* Same routes and labels as the desktop navbar — this is the same navigation,
   laid out for a phone, not a second information architecture. */
const navItems = [
  { label: 'Home',      path: '/' },
  { label: 'Services',  path: '/services' },
  { label: 'Solutions', path: '/solutions' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'About',     path: '/about' },
  { label: 'Blog',      path: '/blog' },
  { label: 'Contact',   path: '/contact' },
];

/* One short transition for the whole panel. No per-item stagger: at this size
   the list is read in a glance, and staggering it only delays the tap. */
const panelVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12, ease: 'easeIn' } },
};

const scrimVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  /* Lock body scroll while open, preserving the underlying offset so closing
     never jumps the page. */
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

  /* Escape to close, focus trapped inside the panel, focus returned to the
     hamburger on close. */
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
    // Short: the panel settles in 180ms, so focus lands as it arrives.
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector('a[href], button')?.focus();
    }, 190);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      // Prefer whatever had focus, but fall back to the trigger: a tap does
      // not focus a button on iOS, so without this focus would land on <body>
      // and a keyboard user would restart from the top of the document.
      const previous = restoreFocusRef.current;
      const usable = previous && previous !== document.body && document.contains(previous);
      const target = usable ? previous : document.querySelector('[aria-controls="premium-sidebar"]');
      target?.focus?.();
    };
  }, [open, onClose]);

  /* Rotating a phone into landscape can cross the desktop breakpoint, where the
     full navbar takes over — the panel must not be left hanging over it. */
  useEffect(() => {
    if (!open) return undefined;
    const mq = window.matchMedia('(min-width: 1081px)');
    const onChange = (e) => { if (e.matches) onClose(); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mnav-scrim"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            id="premium-sidebar"
            className="mnav-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <nav className="mnav-nav" aria-label="Primary">
              <ul role="list">
                {navItems.map(({ label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`mnav-link${isActive ? ' is-active' : ''}`}
                        onClick={onClose}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="mnav-link__label">{label}</span>
                        <ArrowRight className="mnav-link__chevron" size={14} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mnav-foot">
              <Link to="/contact" className="btn btn-primary mnav-cta" onClick={onClose}>
                Start a project <ArrowRight size={15} />
              </Link>

              <div className="mnav-contact">
                <a href="tel:+255674022265" className="mnav-contact__row">
                  <Phone size={13} aria-hidden="true" />
                  <span>+255 674 022 265</span>
                </a>
                <a href="mailto:info@clixworks.co.tz" className="mnav-contact__row">
                  <Mail size={13} aria-hidden="true" />
                  <span>info@clixworks.co.tz</span>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
