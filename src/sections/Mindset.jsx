import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MOTIVATION_VIDEOS } from '../data/motivation';
import '../styles/motivation.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function VideoCard({ item, index }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  // `armed` gates the src: nothing is fetched until the card nears the
  // viewport. These files are 14–17 MB, so attaching all three on mount would
  // cost the page far more than the section is worth.
  const [armed, setArmed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || failed) return undefined;

    const reduced = prefersReducedMotion();

    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) setArmed(true);

      const video = videoRef.current;
      if (!video) return;

      // Pause off-screen, resume on return. Never reset currentTime: the clip
      // picks up where the viewer left it rather than restarting on every
      // scroll past.
      if (entry.intersectionRatio >= 0.3) {
        if (reduced || !video.paused) return;
        const attempt = video.play();
        // Autoplay can still be refused (data saver, battery saver, policy).
        // The native controls stay available, so refusal is a non-event.
        if (attempt?.catch) attempt.catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }, { rootMargin: '200px 0px', threshold: [0, 0.3, 0.75] });

    io.observe(el);
    return () => io.disconnect();
  }, [failed, armed]);

  return (
    <motion.article
      ref={cardRef}
      className="mindset-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: Math.min(index, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mindset-media">
        {/* The plate sits underneath at all times: the video covers it once it
            has frames, so there is never a blank or broken frame — including
            before the src is attached, and on hosts that answer a missing file
            with the SPA's index.html instead of a 404. */}
        <div className="mindset-poster__plate" aria-hidden="true">
          <span className="mindset-poster__index">{String(index + 1).padStart(2, '0')}</span>
        </div>

        {armed && !failed && (
          <video
            ref={videoRef}
            className="mindset-video"
            src={item.video}
            /* Optional: shown only in the moment before the first frame
               decodes. A missing poster is silently ignored by the browser —
               the plate underneath covers that moment either way. */
            poster={item.poster || undefined}
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label={`${item.title} — ${item.description}`}
            onError={() => setFailed(true)}
          />
        )}

      </div>

      <div className="mindset-card__body">
        <span className="mindset-card__meta">
          <span className="mindset-card__index">{String(index + 1).padStart(2, '0')}</span>
          {item.category}
        </span>
        <h3 className="mindset-card__title">{item.title}</h3>
        <p className="mindset-card__desc">{item.description}</p>
      </div>
    </motion.article>
  );
}

export default function Mindset() {
  return (
    <section className="section mindset-section" id="mindset" aria-labelledby="mindset-heading">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">The mindset</span>
          <h2 id="mindset-heading" className="section-title">
            Great software starts with <span>people who keep building</span>
          </h2>
          <p className="section-subtitle">
            Writing code is the easy part. What carries a project is curiosity, persistence,
            and caring whether the thing actually works for the person using it.
          </p>
        </motion.div>

        <div className="mindset-grid">
          {MOTIVATION_VIDEOS.map((item, i) => (
            <VideoCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
