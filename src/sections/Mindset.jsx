import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlay } from 'react-icons/fi';
import { MOTIVATION_VIDEOS, POSTER_EXTENSIONS } from '../data/motivation';
import VideoModal from '../components/VideoModal';
import '../styles/motivation.css';

/* Posters are optional. The configured path is tried first, then the same
   basename with each supported extension; if none resolve the card falls back
   to a technical plate drawn in CSS. No stock imagery, no generated frames. */
function buildPosterCandidates(src) {
  if (!src) return [];
  const base = src.replace(/\.(jpe?g|png)$/i, '');
  return [...new Set([src, ...POSTER_EXTENSIONS.map(ext => base + ext)])];
}

function VideoCard({ item, index, onOpen }) {
  const candidates = useMemo(() => buildPosterCandidates(item.poster), [item.poster]);
  const [attempt, setAttempt] = useState(0);
  const posterSrc = attempt < candidates.length ? candidates[attempt] : null;

  return (
    <motion.article
      className="mindset-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: Math.min(index, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className="mindset-card__trigger"
        onClick={() => onOpen({ ...item, resolvedPoster: posterSrc })}
        aria-label={`Play video: ${item.title}`}
      >
        <span className="mindset-poster">
          {/* The plate is always present underneath. A poster simply covers it
              once it decodes, so there is never a blank frame — including the
              window where a lazy image has not been fetched yet, and on hosts
              that answer a missing file with the SPA's index.html (200) rather
              than a 404, where the error arrives late. */}
          <span className="mindset-poster__plate" aria-hidden="true">
            <span className="mindset-poster__index">{String(index + 1).padStart(2, '0')}</span>
          </span>

          {posterSrc && (
            <img
              className="mindset-poster__img"
              src={posterSrc}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setAttempt(i => i + 1)}
            />
          )}

          <span className="mindset-play" aria-hidden="true">
            <FiPlay size={16} />
          </span>
        </span>
      </button>

      <div className="mindset-card__body">
        <span className="mindset-card__meta">{item.category}</span>
        <h3 className="mindset-card__title">{item.title}</h3>
        <p className="mindset-card__desc">{item.description}</p>
      </div>
    </motion.article>
  );
}

export default function Mindset() {
  // One open video at a time, by construction: a single piece of state.
  const [active, setActive] = useState(null);

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
            <VideoCard key={item.id} item={item} index={i} onOpen={setActive} />
          ))}
        </div>
      </div>

      <VideoModal item={active} onClose={() => setActive(null)} />
    </section>
  );
}
