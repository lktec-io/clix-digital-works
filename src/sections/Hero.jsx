import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFileText, FiLayers, FiSmartphone, FiCpu, FiDatabase, FiGlobe, FiServer } from 'react-icons/fi';
import { useCounter } from '../hooks/useCounter';
import { useQuoteModal } from '../context/QuoteModalContext';
import '../styles/hero.css';

const TYPING_WORDS = ['web platforms', 'mobile apps', 'AI systems', 'ERP solutions', 'business software'];

/**
 * The capability ticker. Deliberately kept OUT of the <h1>: the headline is
 * the LCP element and must render once, immediately, with stable text.
 */
function TypingEffect() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const currentWord = TYPING_WORDS[wordIndex];
    if (!deleting) {
      if (displayed.length < currentWord.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(currentWord.slice(0, displayed.length + 1));
        }, 70);
      } else {
        timeoutRef.current = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (displayed.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 35);
      } else {
        // Scheduled rather than set synchronously: the pause between words is
        // part of the rhythm, and it keeps the effect free of cascading renders.
        timeoutRef.current = setTimeout(() => {
          setDeleting(false);
          setWordIndex(i => (i + 1) % TYPING_WORDS.length);
        }, 320);
      }
    }
    return () => clearTimeout(timeoutRef.current);
  }, [displayed, deleting, wordIndex]);

  return (
    <span className="typing-text">
      {displayed}
      <span className="typing-cursor" aria-hidden="true" />
    </span>
  );
}

const STATS = [
  { value: 50, suffix: '+', label: 'Projects delivered' },
  { value: 10, suffix: '+', label: 'Technologies' },
  { value: 24, suffix: '/7', label: 'Support' },
  { value: 100, suffix: '%', label: 'Client focus' },
];

function StatItem({ value, suffix, label, inView }) {
  const count = useCounter(value, 1600, inView);
  return (
    <div className="stat-item">
      <div className="stat-value">
        <span className="stat-number">{count}</span>
        <span className="stat-suffix">{suffix}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* The architecture panel: the shape of a system we actually ship —
   the people using it, controlled access, the daily work, the records. No
   invented numbers. */
const STACK_LAYERS = [
  {
    tier: 'Your team & customers',
    nodes: [
      { label: 'Computer', Icon: FiGlobe },
      { label: 'Phone', Icon: FiSmartphone },
    ],
  },
  {
    tier: 'Secure access',
    nodes: [
      { label: 'Sign-in · roles · permissions', Icon: FiServer, wide: true },
    ],
  },
  {
    tier: 'Daily operations',
    nodes: [
      { label: 'Sales & customers', Icon: FiLayers },
      { label: 'Automation', Icon: FiCpu },
    ],
  },
  {
    tier: 'Business records',
    nodes: [
      { label: 'Stored safely · backed up daily', Icon: FiDatabase, wide: true },
    ],
  },
];

export default function Hero() {
  const { openModal } = useQuoteModal();
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsInView(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-ambient" aria-hidden="true">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
      </div>

      <div className="container">
        <div className="hero-inner">
          {/* ---- Left: the proposition ---- */}
          <div className="hero-content">
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Mbeya, Tanzania · Software engineering
            </motion.span>

            <motion.h1
              className="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              We build the software<br />
              businesses <span className="gradient-text">actually run on</span>.
            </motion.h1>

            <motion.p
              className="hero-subheadline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Websites, mobile apps, AI systems, business software, cybersecurity and
              intelligent automation — designed, engineered and maintained end to end.
            </motion.p>

            <motion.div
              className="hero-ticker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <span className="hero-ticker__key">building</span>
              <span className="hero-ticker__sep">›</span>
              <TypingEffect />
            </motion.div>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/contact" className="btn btn-primary btn-lg">
                Start a project <FiArrowRight size={18} />
              </Link>
              <button className="btn btn-outline btn-lg" onClick={openModal}>
                <FiFileText size={16} /> Get a free quote
              </button>
            </motion.div>

            <motion.div
              ref={statsRef}
              className="hero-stats"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {STATS.map((s, i) => (
                <StatItem key={i} {...s} inView={statsInView} />
              ))}
            </motion.div>
          </div>

          {/* ---- Right: how a Clix system is put together ---- */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            aria-hidden="true"
          >
            <div className="arch-panel">
              <div className="arch-panel__bar">
                <span className="arch-panel__dots">
                  <i /><i /><i />
                </span>
                <span className="arch-panel__title">system architecture</span>
              </div>

              <div className="arch-panel__body">
                {STACK_LAYERS.map((layer, li) => (
                  <div className="arch-tier" key={layer.tier}>
                    <span className="arch-tier__label">{layer.tier}</span>
                    <div className="arch-tier__nodes">
                      {layer.nodes.map(({ label, Icon, wide }) => (
                        <motion.div
                          key={label}
                          className={`arch-node${wide ? ' arch-node--wide' : ''}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.45 + li * 0.1 }}
                        >
                          <Icon size={14} />
                          <span>{label}</span>
                        </motion.div>
                      ))}
                    </div>
                    {li < STACK_LAYERS.length - 1 && (
                      <span className="arch-connector">
                        <span className="arch-connector__pulse" style={{ animationDelay: `${li * 0.9}s` }} />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="arch-panel__foot">
                <span className="arch-chip">build</span>
                <span className="arch-chip">test</span>
                <span className="arch-chip">deploy</span>
                <span className="arch-chip arch-chip--ok">maintain</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
