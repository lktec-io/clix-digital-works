import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import COMPANY from '../config/company';
import '../styles/legal.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs } from '../utils/seo';

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us when you:`,
    list: [
      'Fill out our contact form (name, email address, phone number, company name, and project details)',
      'Subscribe to our newsletter (email address)',
      'Communicate with us by email or phone',
      'Request a quote or consultation',
    ],
    after: `We also automatically collect certain technical information when you visit our website, including your IP address, browser type, pages visited, and time spent on pages.`,
  },
  {
    title: 'How We Use Your Information',
    content: `Clix Digital Works uses the information we collect to:`,
    list: [
      'Respond to your enquiries and provide requested services',
      'Send you project updates, quotes, and communications relevant to your request',
      'Send our newsletter (only if you have subscribed)',
      'Improve our website and service offerings',
      'Comply with legal obligations',
    ],
  },
  {
    title: 'Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:`,
    list: [
      'With service providers who assist us in operating our website and conducting our business (under strict confidentiality)',
      'When required by law or to respond to legal process',
      'To protect the rights, property, or safety of Clix Digital Works, our clients, or the public',
    ],
  },
  {
    title: 'Data Security',
    content: `We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: 'Cookies',
    content: `Our website may use cookies to enhance your browsing experience. Cookies are small files stored on your device that help us understand how visitors use our site. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. If you do not accept cookies, some portions of our site may not function properly.`,
  },
  {
    title: 'Third-Party Links',
    content: `Our website may contain links to third-party websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites. We encourage you to review the privacy policy of any site you visit.`,
  },
  {
    title: "Children's Privacy",
    content: `Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to:`,
    list: [
      'Access the personal information we hold about you',
      'Request correction of inaccurate information',
      'Request deletion of your personal information',
      'Opt out of marketing communications at any time',
      'Lodge a complaint with the relevant data protection authority',
    ],
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
];

const PAGE_SCHEMA = buildBreadcrumbs([
  { name: 'Home',           path: '/' },
  { name: 'Privacy Policy', path: '/privacy' },
]);

export default function PrivacyPage() {
  return (
    <motion.main
      className="legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Privacy Policy"
        description="Read how Clix Digital Works collects, uses, and protects your personal data. Our privacy policy is transparent about your data rights and how we handle your information securely."
        canonical="/privacy"
        schema={PAGE_SCHEMA}
      />

      <div className="container">
        <motion.div
          className="legal-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <FiShield size={12} /> Legal
          </span>
          <h1>Privacy Policy</h1>
          <p className="legal-meta">Last Updated: June 2025 · Clix Digital Works, Mbeya, Tanzania</p>
        </motion.div>

        <motion.div
          className="legal-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="legal-section">
            <p>
              Clix Digital Works ("we", "our", or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website or engage our services. Please read this
              policy carefully.
            </p>
          </div>

          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.title}
              className="legal-section"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <h2>{sec.title}</h2>
              {sec.content && <p>{sec.content}</p>}
              {sec.list && (
                <ul>
                  {sec.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {sec.after && <p>{sec.after}</p>}
            </motion.div>
          ))}

          <div className="legal-contact-box">
            <h2 style={{ fontSize: 'var(--fs-lg)', borderLeft: 'none', paddingLeft: 0 }}>Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>{COMPANY.name}</strong><br />
              {COMPANY.address.full}<br />
              Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />
              Phone: <a href={`tel:${COMPANY.phone.replace(/\s/g,'')}`}>{COMPANY.phone}</a>
            </p>
            <p>
              <Link to="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Send us a message →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
