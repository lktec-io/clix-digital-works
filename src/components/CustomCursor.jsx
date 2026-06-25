import { useEffect, useRef } from 'react';
import '../styles/cursor.css';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label[for], ' +
  '.btn, .service-card, .portfolio-card, .solution-card, .sol-tab, ' +
  '.filter-btn, .control-btn, .side-card, .social-link, .nav-link, ' +
  '.mobile-link, .footer-link, .scroll-to-top, .team-card';

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const posRef  = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafRef  = useRef(null);
  const hovered = useRef(false);

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;

    // ── Track mouse position ────────────────────────────────────────────────
    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (dot) dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    // ── Ring follows with lag via RAF ───────────────────────────────────────
    const animate = () => {
      ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.12;
      if (ring) {
        ring.style.transform =
          `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    // ── Click states ────────────────────────────────────────────────────────
    const onDown = () => {
      dot?.classList.add('cursor-click');
      ring?.classList.add('cursor-click');
    };
    const onUp = () => {
      dot?.classList.remove('cursor-click');
      ring?.classList.remove('cursor-click');
    };

    // ── Hover via event delegation (picks up dynamic elements) ─────────────
    const onOver = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        if (!hovered.current) {
          hovered.current = true;
          dot?.classList.add('cursor-hover');
          ring?.classList.add('cursor-hover');
        }
      } else {
        if (hovered.current) {
          hovered.current = false;
          dot?.classList.remove('cursor-hover');
          ring?.classList.remove('cursor-hover');
        }
      }
    };

    // ── Hide cursor when it leaves the window ───────────────────────────────
    const onLeave = () => {
      dot?.classList.add('cursor-hidden');
      ring?.classList.add('cursor-hidden');
    };
    const onEnter = () => {
      dot?.classList.remove('cursor-hidden');
      ring?.classList.remove('cursor-hidden');
    };

    document.addEventListener('mousemove',  onMove,  { passive: true });
    document.addEventListener('mouseover',  onOver,  { passive: true });
    document.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseup',    onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseover',  onOver);
      document.removeEventListener('mousedown',  onDown);
      document.removeEventListener('mouseup',    onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
