import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiCode, FiSmartphone, FiCpu, FiShield, FiCloud, FiDatabase, FiFileText } from 'react-icons/fi';
import { useCounter } from '../hooks/useCounter';
import { useQuoteModal } from '../context/QuoteModalContext';
import '../styles/hero.css';

const TYPING_WORDS = ['Websites', 'Mobile Apps', 'AI Systems', 'ERP Solutions', 'Business Software'];

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
        }, 80);
      } else {
        timeoutRef.current = setTimeout(() => setDeleting(true), 1800);
      }
    } else {
      if (displayed.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 45);
      } else {
        setDeleting(false);
        setWordIndex(i => (i + 1) % TYPING_WORDS.length);
      }
    }
    return () => clearTimeout(timeoutRef.current);
  }, [displayed, deleting, wordIndex]);

  return (
    <span className="typing-text">
      {displayed}
      <span className="typing-cursor">|</span>
    </span>
  );
}

const STATS = [
  { value: 50, suffix: '+', label: 'Projects' },
  { value: 10, suffix: '+', label: 'Technologies' },
  { value: 24, suffix: '/7', label: 'Support' },
  { value: 100, suffix: '%', label: 'Client Focus' },
];

function StatItem({ value, suffix, label, inView }) {
  const count = useCounter(value, 2000, inView);
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

const FLOAT_ICONS = [
  { Icon: FiCode, style: { top: '12%', left: '8%' }, delay: 0 },
  { Icon: FiSmartphone, style: { top: '25%', right: '6%' }, delay: 0.5 },
  { Icon: FiCpu, style: { bottom: '30%', left: '5%' }, delay: 1 },
  { Icon: FiShield, style: { top: '60%', right: '8%' }, delay: 1.5 },
  { Icon: FiCloud, style: { bottom: '15%', right: '20%' }, delay: 0.8 },
  { Icon: FiDatabase, style: { top: '45%', left: '10%' }, delay: 0.3 },
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
      {/* BG Glows */}
      <div className="hero-bg-glows" aria-hidden="true">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />
      </div>

      {/* Floating Icons */}
      {FLOAT_ICONS.map(({ Icon, style, delay }, i) => (
        <motion.div
          key={i}
          className="hero-float-icon"
          style={style}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 1, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: delay }}
          >
            <Icon size={22} />
          </motion.div>
        </motion.div>
      ))}

      <div className="container">
        <div className="hero-inner">
          {/* Left Content */}
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-label">
                Mbeya, Tanzania · Est. 2024
              </span>
            </motion.div>

            <motion.h1
              className="hero-headline"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Transforming Ideas Into{' '}
              <span className="gradient-text">Powerful</span>
              <br />
              <TypingEffect />
            </motion.h1>

            <motion.p
              className="hero-subheadline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              We build websites, mobile apps, AI systems, business software, cybersecurity
              solutions and intelligent automation that help organizations grow.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/contact" className="btn btn-primary btn-lg">
                Start Your Project <FiArrowRight size={18} />
              </Link>
              <button className="btn btn-outline btn-lg" onClick={openModal}>
                <FiFileText size={16} /> Get a Free Quote
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              ref={statsRef}
              className="hero-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              {STATS.map((s, i) => (
                <StatItem key={i} {...s} inView={statsInView} />
              ))}
            </motion.div>
          </div>

          {/* Right Illustration */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="hero-visual-inner">
              {/* Central orb */}
              <div className="visual-orb-wrap">
                <motion.div
                  className="visual-orb"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="orb-core">
                    <div className="orb-logo">
                      <span>CDW</span>
                    </div>
                  </div>
                  <div className="orb-ring orb-ring-1" />
                  <div className="orb-ring orb-ring-2" />
                  <div className="orb-ring orb-ring-3" />
                </motion.div>
              </div>

              {/* Orbit cards */}
              {[
                { label: 'Web Dev', icon: '🌐', angle: 0 },
                { label: 'Mobile', icon: '📱', angle: 60 },
                { label: 'AI / ML', icon: '🤖', angle: 120 },
                { label: 'Cloud', icon: '☁️', angle: 180 },
                { label: 'ERP', icon: '⚙️', angle: 240 },
                { label: 'Security', icon: '🔒', angle: 300 },
              ].map(({ label, icon, angle }, i) => {
                const rad = (angle - 90) * (Math.PI / 180);
                const r = 140;
                const x = Math.cos(rad) * r;
                const y = Math.sin(rad) * r;
                return (
                  <motion.div
                    key={i}
                    className="orbit-card"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                  >
                    <span className="orbit-icon">{icon}</span>
                    <span className="orbit-label">{label}</span>
                  </motion.div>
                );
              })}

              {/* Code lines decoration */}
              <div className="code-lines" aria-hidden="true">
                {['const solution = AI.build();', '> Deploying to Cloud...', '✓ System online', '> 100% uptime']}
                {['const solution = AI.build();', '> Deploying to Cloud...', '✓ System online', '> 100% uptime'].map((line, i) => (
                  <motion.div
                    key={i}
                    className="code-line"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + i * 0.2 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="scroll-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="scroll-dot"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
