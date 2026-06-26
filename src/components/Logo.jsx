import COMPANY from '../config/company';

/*
 * REPLACE: When you have a final brand logo, drop the file into
 * src/assets/logo/ and update this component to render an <img> or
 * inline SVG instead of the CSS mark below.
 *
 * Usage:
 *   <Logo />                    — navbar variant (mark + full text)
 *   <Logo showText={false} />   — mark only (e.g. favicon, compact nav)
 *   <Logo variant="footer" />   — footer variant (uses footer CSS classes)
 */

export default function Logo({ variant = 'navbar', showText = true }) {
  if (variant === 'footer') {
    return <div className="footer-logo-mark" aria-hidden="true">C</div>;
  }

  return (
    <>
      <div className="logo-mark" aria-hidden="true">
        <span>C</span>
      </div>
      {showText && (
        <div className="logo-text">
          <span className="logo-main">{COMPANY.shortName}</span>
          <span className="logo-dot"> Digital Works</span>
        </div>
      )}
    </>
  );
}
