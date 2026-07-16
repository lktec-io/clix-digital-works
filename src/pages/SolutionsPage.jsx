import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Solutions from '../sections/Solutions';
import Contact from '../sections/Contact';
import { FiArrowRight } from 'react-icons/fi';
import '../styles/pages.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs, buildFAQ } from '../utils/seo';

const BREADCRUMB_SCHEMA = buildBreadcrumbs([
  { name: 'Home',      path: '/' },
  { name: 'Solutions', path: '/solutions' },
]);

const FAQ_SCHEMA = buildFAQ([
  {
    q: 'Do you build school management systems in Tanzania?',
    a: 'Yes. We build full school management systems including student enrollment, fee management, exam results, attendance tracking, timetable management, and parent communication portals — tailored for Tanzanian schools and universities.',
  },
  {
    q: 'Can you build a church management system for our congregation?',
    a: 'Yes. Our church management system covers member registration, tithe and offering tracking, event management, group management, SMS/email broadcasts to the congregation, and detailed financial reports.',
  },
  {
    q: 'Do you develop hospital and clinic management software?',
    a: 'Yes. We build integrated hospital information systems that include electronic patient records, appointment booking, pharmacy management, lab result tracking, billing, and doctor dashboards.',
  },
  {
    q: 'Do you build SACCO and microfinance management systems?',
    a: 'Yes. Our SACCO management platform handles member savings, loans, shares, dividend computation, regulatory reporting, and mobile access — built to Tanzania\'s cooperative regulations.',
  },
  {
    q: 'Can you build an NGO donor and beneficiary management system?',
    a: 'Yes. We build NGO management software for donor tracking, beneficiary databases, project monitoring, grant management, impact reporting, and volunteer management.',
  },
]);

const PAGE_SCHEMA = [BREADCRUMB_SCHEMA, FAQ_SCHEMA];

export default function SolutionsPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Industry Software Solutions for Tanzania"
        description="Custom software solutions for schools, hospitals, churches, SACCOs, NGOs, government institutions, logistics companies, and businesses across Tanzania. Built to solve real sector challenges."
        canonical="/solutions"
        schema={PAGE_SCHEMA}
      />

      <div className="page-hero">
        <div className="page-hero-bg" />
        <div className="container">
          <motion.div
            className="page-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Industry Solutions</span>
            <h1 className="page-hero-title">
              Solutions Built for <span className="gradient-text">Your Sector</span>
            </h1>
            <p className="page-hero-subtitle">
              We understand that every industry has unique challenges. Our solutions are tailored to the specific needs of your organization.
            </p>
            <div className="page-hero-actions">
              <Link to="/contact" className="btn btn-primary">
                Find Your Solution <FiArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Solutions />
      <Contact />
    </motion.main>
  );
}
