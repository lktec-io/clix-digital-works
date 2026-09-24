import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFilm } from 'react-icons/fi';

/**
 * VideoModal — a centred player for one local MP4.
 *
 * The <video> element only exists while the modal is open, so closing it
 * stops playback and releases the stream; nothing can keep playing in the
 * background and two videos can never overlap. Native controls are used
 * rather than a custom control bar: play/pause, volume, fullscreen, seeking
 * and keyboard support all come from the browser, already accessible.
 *
 * A missing file resolves to a plain "not available" panel of the same size,
 * never a broken media icon.
 */
export default function VideoModal({ item, onClose }) {
  const open = Boolean(item);
  const panelRef = useRef(null);
  const videoRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // Reset the error state when a different video is opened.
  const [lastId, setLastId] = useState(item?.id);
  if (item?.id !== lastId) {
    setLastId(item?.id);
    setFailed(false);
  }

  /* Lock body scroll while open, preserving the underlying offset. */
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

  /* Escape to close, focus trapped inside, focus returned on close. */
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
        'video, a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

    // Land focus on the close button: it is the way out, and focusing the
    // video itself would swallow the space bar before the user expects it.
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector('.vmodal-close')?.focus();
    }, 60);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      const previous = restoreFocusRef.current;
      const usable = previous && previous !== document.body && document.contains(previous);
      (usable ? previous : null)?.focus?.();
    };
  }, [open, onClose]);

  /* Playback follows the click that opened the modal — a user gesture, so
     the browser allows sound. Muted autoplay is never used. */
  useEffect(() => {
    if (!open || failed) return;
    const el = videoRef.current;
    if (!el) return;
    const attempt = el.play();
    if (attempt?.catch) attempt.catch(() => { /* autoplay policy: user presses play */ });
  }, [open, failed, lastId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="vmodal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18 } }}
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={panelRef}
            className="vmodal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Video: ${item.title}`}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 6, scale: 0.995, transition: { duration: 0.14 } }}
          >
            <header className="vmodal-head">
              <div className="vmodal-head__text">
                <span className="vmodal-head__eyebrow">{item.category}</span>
                <h2 className="vmodal-head__title">{item.title}</h2>
              </div>
              <button
                type="button"
                className="vmodal-close"
                onClick={onClose}
                aria-label="Close video"
              >
                <FiX size={18} />
              </button>
            </header>

            <div className="vmodal-stage">
              {failed ? (
                <div className="vmodal-missing">
                  <FiFilm size={22} aria-hidden="true" />
                  <p className="vmodal-missing__title">This video has not been added yet</p>
                  <p className="vmodal-missing__path">{item.video}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="vmodal-video"
                  src={item.video}
                  poster={item.resolvedPoster || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  onError={() => setFailed(true)}
                >
                  {/* Text alternative for browsers that cannot play the file at all */}
                  Your browser cannot play this video.
                </video>
              )}
            </div>

            <p className="vmodal-desc">{item.description}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
