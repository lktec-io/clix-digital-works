import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Global SPA scroll reset.
 *
 * Three separate things were dropping the viewport mid-page / near the footer
 * on navigation, and all three are handled here:
 *
 * 1. `history.scrollRestoration` defaults to 'auto', so on POP navigations
 *    (back/forward, and any browser-restored entry) the browser re-applies the
 *    OLD scroll offset asynchronously — after our effect has already run. That
 *    is the "lands near the footer" bug. We switch it to 'manual'.
 *
 * 2. <AnimatePresence mode="wait"> keeps the outgoing route mounted while it
 *    animates out, so the incoming route mounts ~400ms AFTER the pathname
 *    changes. A single scrollTo on pathname change fires while the document is
 *    still the old (tall) page; the later height change can shift the viewport.
 *    We re-assert the reset across the exit window.
 *
 * 3. Browser scroll anchoring adjusts the offset to keep an anchored element
 *    stable when content above it changes height. Disabled on #main-content in
 *    global.css via `overflow-anchor: none`.
 *
 * Route changes reset instantly by design: a smooth scroll here would race the
 * route exit animation and visibly rewind the outgoing page. Smooth scrolling
 * stays where it belongs — the manual ScrollToTop button and in-page anchors.
 */

// Covers the AnimatePresence exit window (0.35s) plus the incoming route's
// mount/paint. Each frame re-asserts only if nothing has scrolled since.
const REASSERT_MS = 600;

export default function ScrollReset({ behavior = 'instant' }) {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useLayoutEffect(() => {
    // Let in-page anchor targets (e.g. /contact#quote-form) win.
    if (hash) return undefined;

    const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior });

    scrollTop();
    startRef.current = performance.now();

    // Re-assert while the outgoing route animates out and the incoming route
    // mounts. Bail the moment the user scrolls on their own, so we never fight
    // real input.
    let cancelled = false;
    const onUserScroll = () => {
      if (performance.now() - startRef.current > 100) cancelled = true;
    };
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });

    const tick = () => {
      if (cancelled) return;
      if (performance.now() - startRef.current > REASSERT_MS) return;
      if (window.scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    };
    // navigationType is included so repeat navigations to the same path
    // (logo click while already on "/") still reset.
  }, [pathname, hash, navigationType, behavior]);

  return null;
}
