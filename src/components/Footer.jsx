import { Link } from 'react-router-dom';
import { FiTwitter, FiLinkedin, FiFacebook, FiInstagram, FiYoutube, FiMapPin, FiPhone, FiMail, FiArrowRight } from 'react-icons/fi';
import COMPANY from '../config/company';
import '../styles/footer.css';

const QUICK_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Solutions', path: '/solutions' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'About', path: '/about' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

const SERVICE_LINKS = [
  'Website Development',
  'Mobile App Development',
  'Custom Software',
  'AI & ML Solutions',
  'Cybersecurity',
  'Cloud & VPS Hosting',
  'ERP Systems',
  'Accounting Systems',
  'IoT & Automation',
];

const SOLUTION_LINKS = ['Schools', 'Churches', 'Hospitals', 'SACCOs', 'Businesses', 'NGOs', 'Government', 'Logistics'];

const SOCIAL_ITEMS = [
  { Icon: FiFacebook,  label: 'Facebook',  href: COMPANY.social.facebook },
  { Icon: FiTwitter,   label: 'Twitter/X', href: COMPANY.social.twitter },
  { Icon: FiLinkedin,  label: 'LinkedIn',  href: COMPANY.social.linkedin },
  { Icon: FiInstagram, label: 'Instagram', href: COMPANY.social.instagram },
  { Icon: FiYoutube,   label: 'YouTube',   href: COMPANY.social.youtube },
];

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      {/* Newsletter strip */}
      <div className="footer-newsletter">
        <div className="container">
          <div className="newsletter-inner">
            <div className="newsletter-text">
              <h3>Stay Ahead with Digital Insights</h3>
              <p>Get the latest tips, guides, and updates from {COMPANY.shortName} Digital Works.</p>
            </div>
            <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="newsletter-input"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Subscribe <FiArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">

            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo" aria-label={`${COMPANY.name} — Home`}>
                <div className="footer-logo-mark">C</div>
                <div>
                  <div className="footer-logo-name">{COMPANY.name}</div>
                  <div className="footer-logo-tag">{COMPANY.tagline}</div>
                </div>
              </Link>

              <p className="footer-desc">{COMPANY.description}</p>

              <div className="footer-contact-list">
                <a
                  href={COMPANY.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-item"
                >
                  <FiMapPin size={14} aria-hidden="true" />
                  <span>{COMPANY.address.full}</span>
                </a>
                <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="footer-contact-item">
                  <FiPhone size={14} aria-hidden="true" />
                  <span>{COMPANY.phone}</span>
                </a>
                <a href={`mailto:${COMPANY.email}`} className="footer-contact-item">
                  <FiMail size={14} aria-hidden="true" />
                  <span>{COMPANY.email}</span>
                </a>
              </div>

              <div className="footer-social" role="list" aria-label="Social media links">
                {SOCIAL_ITEMS.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="social-link"
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-links-list">
                {QUICK_LINKS.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="footer-link">
                      <span aria-hidden="true">›</span> {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="footer-col">
              <h4 className="footer-col-title">Our Services</h4>
              <ul className="footer-links-list">
                {SERVICE_LINKS.map(service => (
                  <li key={service}>
                    <Link to="/services" className="footer-link">
                      <span aria-hidden="true">›</span> {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="footer-col">
              <h4 className="footer-col-title">Industry Solutions</h4>
              <ul className="footer-links-list">
                {SOLUTION_LINKS.map(sol => (
                  <li key={sol}>
                    <Link to="/solutions" className="footer-link">
                      <span aria-hidden="true">›</span> {sol}
                    </Link>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <h4 className="footer-col-title">Business Hours</h4>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {COMPANY.hours.weekdays}<br />
                  {COMPANY.hours.saturday}<br />
                  <span style={{ color: 'var(--secondary)' }}>Support: {COMPANY.hours.support}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-inner">
            <p className="footer-copy">{COMPANY.copyright()}</p>
            <div className="footer-bottom-links">
              <Link to="/privacy" className="footer-bottom-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-bottom-link">Terms of Service</Link>
              <Link to="/sitemap" className="footer-bottom-link">Sitemap</Link>
            </div>
            <p className="footer-made">Made with ❤️ in {COMPANY.address.city}, Tanzania 🇹🇿</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
