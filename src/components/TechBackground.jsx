/**
 * TechBackground — the site-wide technical backdrop.
 *
 * Replaces the old animated particle canvas. Everything here is CSS: an
 * engineering grid masked to fade at the edges, two ambient washes and a
 * vignette. No canvas, no requestAnimationFrame loop, no resize or pointer
 * listeners, so it costs nothing per frame and never competes with scrolling
 * on a mid-range phone.
 *
 * The node/connector layer is a static SVG drawn once; only a handful of
 * short data pulses animate, and `prefers-reduced-motion` stops those via the
 * global contract in global.css.
 */
export default function TechBackground() {
  return (
    <div className="tech-bg" aria-hidden="true">
      <div className="tech-bg__grid" />
      <svg className="tech-bg__nodes" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <g className="tech-bg__net">
          {/* A small, deliberate network: three routes between four nodes. */}
          <path d="M180 240 H520 V430 H880" />
          <path d="M1260 180 H980 V430" />
          <path d="M300 700 H700 V430" />
          <path d="M880 430 H1180 V680" />
        </g>
        <g className="tech-bg__dots">
          <circle cx="180" cy="240" r="3" />
          <circle cx="520" cy="430" r="3" />
          <circle cx="880" cy="430" r="4" />
          <circle cx="980" cy="430" r="3" />
          <circle cx="1260" cy="180" r="3" />
          <circle cx="700" cy="430" r="3" />
          <circle cx="1180" cy="680" r="3" />
        </g>
      </svg>
      <div className="tech-bg__wash" />
      <div className="tech-bg__vignette" />
    </div>
  );
}
