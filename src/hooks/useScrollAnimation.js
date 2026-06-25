import { useEffect, useRef, useState } from 'react';

/**
 * useScrollAnimation
 *
 * Returns a [ref, isVisible] tuple. `isVisible` becomes true once the
 * element enters the viewport. By default the observation fires once and
 * stops (triggerOnce: true). Pass `triggerOnce: false` to allow repeated
 * toggling as the element leaves and re-enters view.
 *
 * @param {object} options
 * @param {number}  options.threshold   - 0–1 visibility fraction (default 0.15)
 * @param {string}  options.rootMargin  - CSS margin applied to root (default '0px')
 * @param {boolean} options.triggerOnce - fire only once, then disconnect (default true)
 *
 * @returns {[React.RefObject, boolean]}
 *
 * Usage:
 *   const [ref, visible] = useScrollAnimation({ threshold: 0.2 });
 *   <div ref={ref} className={visible ? 'animate-in' : 'animate-out'} />
 */
export function useScrollAnimation({
  threshold   = 0.15,
  rootMargin  = '0px 0px -40px 0px',
  triggerOnce = true,
} = {}) {
  const ref     = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip heavy observation if the user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, visible];
}

export default useScrollAnimation;
