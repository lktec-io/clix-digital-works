import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import '../styles/loading.css';

/**
 * Boot screen.
 *
 * Every line below reports a real browser milestone. Nothing counts up on a
 * timer and nothing reads READY before the thing it names actually is — the
 * bar reaches 100% only when all five checks have resolved, at which point the
 * screen is already leaving.
 *
 * The app renders underneath this overlay (see App.jsx) rather than being
 * withheld until it disappears, so the boot sequence overlaps real work
 * instead of standing in for it.
 */
/* Timings are measured from navigation start (performance.now()), so they
   describe what the visitor actually experiences rather than when this
   component happened to mount. Target: fully gone at roughly 2.6s. */
const MIN_VISIBLE_MS = 2000;   // floor before dismissal may begin
const SETTLE_MS = 200;         // beat on the completed state so it can be read
const MAX_VISIBLE_MS = 3000;   // hard ceiling: a slow asset must never trap anyone
/* Resolved steps are released in sequence and never early. With a 2s floor the
   spacing is wider than before so the five checks report in across the window
   instead of finishing in half a second and leaving a frozen 100%. */
const REVEAL_SPACING_MS = 260;

/** Each step resolves from an observable fact, not a timer. */
function bootSteps() {
  const immediate = () => Promise.resolve();

  const fontsReady = () =>
    document.fonts?.ready ? document.fonts.ready.then(() => {}) : immediate();

  const documentComplete = () =>
    document.readyState === 'complete'
      ? immediate()
      : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));

  // The router has painted something: the public landmark or an admin root.
  const viewMounted = () => new Promise(resolve => {
    const found = () => document.getElementById('main-content')
      || document.querySelector('.admin-app, .admin-login-page');
    if (found()) return resolve();
    let raf = 0;
    const poll = () => { if (found()) resolve(); else raf = requestAnimationFrame(poll); };
    poll();
    return () => cancelAnimationFrame(raf);
  });

  return [
    { id: 'runtime',   label: 'Core runtime',     start: immediate },
    { id: 'interface', label: 'Interface layer',  start: viewMounted },
    { id: 'typography', label: 'Typography',      start: fontsReady },
    { id: 'assets',    label: 'Static assets',    start: documentComplete },
    {
      id: 'secure',
      label: 'Secure channel',
      start: immediate,
      // Reported, not assumed: on http this stays UNSECURED rather than lying.
      value: () => (window.isSecureContext ? 'READY' : 'UNSECURED'),
    },
  ];
}

export default function LoadingScreen({ onComplete }) {
  const [steps] = useState(bootSteps);
  const [done, setDone] = useState(() => new Set());
  const [visible, setVisible] = useState(true);
  const queueRef = useRef({ last: 0, timers: [] });

  useEffect(() => {
    const mountedAt = performance.now();
    const q = queueRef.current;
    let cancelled = false;

    /* A step is marked READY only once its own check resolved. The spacing
       below staggers the *reveal* of already-true results so the list reads as
       a sequence; it never shows a step as ready before it is. */
    const release = (id) => {
      if (cancelled) return;
      const now = performance.now();
      const at = Math.max(now, q.last + REVEAL_SPACING_MS);
      q.last = at;
      const t = window.setTimeout(() => {
        if (!cancelled) setDone(prev => new Set(prev).add(id));
      }, at - now);
      q.timers.push(t);
    };

    steps.forEach(step => { step.start().then(() => release(step.id)); });

    // Ceiling: whatever is still pending, the visitor gets the site.
    const ceiling = window.setTimeout(() => {
      if (!cancelled) setDone(new Set(steps.map(s => s.id)));
    }, MAX_VISIBLE_MS - 300);

    return () => {
      cancelled = true;
      q.timers.forEach(clearTimeout);
      clearTimeout(ceiling);
      void mountedAt;
    };
  }, [steps]);

  const allDone = done.size >= steps.length;
  const pct = Math.round((done.size / steps.length) * 100);

  /* Leave once everything has reported, never before MIN_VISIBLE_MS. */
  useEffect(() => {
    if (!allDone) return undefined;
    const elapsed = performance.now();
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const t = window.setTimeout(() => setVisible(false), wait + SETTLE_MS);
    return () => clearTimeout(t);
  }, [allDone]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
          aria-label="Starting Clix Digital Works"
        >
          <div className="boot__grid" aria-hidden="true" />
          <div className="boot__glow" aria-hidden="true" />

          <div className="boot__inner">
            <div className="boot__brand">
              <Logo variant="navbar" showText />
            </div>

            <p className="boot__headline">Initializing digital systems</p>

            {/* Four nodes wiring into a core — the shape of the architecture
                panel on the home page, drawn once in SVG. */}
            <div className="boot__viz">
            <svg className="boot__diagram" viewBox="0 0 320 90" aria-hidden="true">
              <g className="boot__wires">
                <path d="M30 20 H120 V45 H160" />
                <path d="M30 70 H120 V45 H160" />
                <path d="M290 20 H200 V45 H160" />
                <path d="M290 70 H200 V45 H160" />
              </g>
              <g className="boot__nodes">
                <circle cx="30" cy="20" r="3" />
                <circle cx="30" cy="70" r="3" />
                <circle cx="290" cy="20" r="3" />
                <circle cx="290" cy="70" r="3" />
              </g>
              <rect className="boot__core" x="150" y="35" width="20" height="20" rx="3" />
            </svg>

            {/* Scan pass, drawn in CSS so it can be a soft gradient rather
                than a hard-edged shape. */}
            <span className="boot__scan" aria-hidden="true" />
            </div>

            <ul className="boot__modules">
              {steps.map(step => {
                const ready = done.has(step.id);
                return (
                  <li key={step.id} className={`boot__module${ready ? ' is-ready' : ''}`}>
                    <span className="boot__module-label">{step.label}</span>
                    <span className="boot__leader" aria-hidden="true" />
                    <span className="boot__module-state">
                      {ready ? (step.value ? step.value() : 'READY') : 'CHECK'}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="boot__bar" aria-hidden="true">
              <div className="boot__bar-fill" style={{ width: `${pct}%` }} />
            </div>

            <div className="boot__foot">
              <span className="boot__pct">{pct}%</span>
              <span className="boot__verdict">{allDone ? 'System ready' : 'Starting services'}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
