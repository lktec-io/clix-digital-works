import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiUsers, FiDollarSign, FiCreditCard, FiGlobe,
  FiShoppingCart, FiBook, FiCalendar, FiSettings, FiCpu
} from 'react-icons/fi';
import '../styles/portfolio.css';

const CATEGORIES = ['All', 'Web', 'Mobile', 'Platforms', 'AI', 'Management'];

const PROJECTS = [
  {
    id: 1,
    title: 'Church Management System',
    category: 'Management',
    tags: ['Web', 'Management'],
    description: 'A complete digital management platform for a congregation of 3 000+ members. Handles tithe tracking, member registration, event scheduling, cell groups, SMS/email broadcasts, and financial reporting.',
    impact: 'Reduced admin workload by 70%',
    capabilities: ['Member records', 'Contributions', 'Event planning'],
    Icon: FiUsers,
    badge: 'Live system',
  },
  {
    id: 2,
    title: 'Accounting & Finance System',
    category: 'Business platform',
    tags: ['Web', 'Platforms'],
    description: 'Full double-entry accounting platform with automated invoicing, multi-currency support, payroll processing, tax computation, and audit-ready financial statements.',
    impact: 'Eliminated manual bookkeeping errors',
    capabilities: ['Invoicing', 'Payroll', 'Financial statements'],
    Icon: FiDollarSign,
    badge: 'Enterprise',
  },
  {
    id: 3,
    title: 'SACCO Contribution System',
    category: 'Management',
    tags: ['Web', 'Management', 'Platforms'],
    description: 'End-to-end SACCO management with member savings, loan applications, share capital tracking, automated dividend computation, and SACCOS regulatory compliance reporting.',
    impact: 'Loan processing time: days → minutes',
    capabilities: ['Savings & loans', 'Member accounts', 'Compliance reports'],
    Icon: FiCreditCard,
    badge: 'Finance',
  },
  {
    id: 4,
    title: 'Premium Business Website',
    category: 'Web',
    tags: ['Web'],
    description: 'High-conversion corporate website with animated design system, integrated CRM lead capture, SEO optimisation, WhatsApp chat widget, and Google Analytics dashboard.',
    impact: '+200% organic enquiries in 3 months',
    capabilities: ['Online presence', 'Enquiry capture', 'Found on Google'],
    Icon: FiGlobe,
    badge: 'Featured',
  },
  {
    id: 5,
    title: 'E-Commerce Platform',
    category: 'Web',
    tags: ['Web', 'Mobile'],
    description: 'Full-featured online store with product catalogue, inventory management, shopping cart, M-Pesa & card payment integration, order tracking, and a seller analytics dashboard.',
    impact: '500+ orders processed at launch',
    capabilities: ['Online selling', 'Stock control', 'Order tracking'],
    Icon: FiShoppingCart,
    badge: 'Online store',
  },
  {
    id: 6,
    title: 'School Management System',
    category: 'Management',
    tags: ['Web', 'Management'],
    description: 'Comprehensive school ERP covering student enrollment, academic records, attendance tracking, fee collection with M-Pesa integration, exam results, and a parent self-service portal.',
    impact: '4 schools onboarded in year one',
    capabilities: ['Student records', 'Fee collection', 'Parent portal'],
    Icon: FiBook,
    badge: 'Education',
  },
  {
    id: 7,
    title: 'Online Booking System',
    category: 'Web',
    tags: ['Web', 'Mobile'],
    description: 'Real-time appointment and reservation platform for clinics, salons, and hospitality businesses. Features calendar management, SMS reminders, prepayment, and staff scheduling.',
    impact: 'No-show rate reduced by 55%',
    capabilities: ['Appointments', 'Reminders', 'Prepayment'],
    Icon: FiCalendar,
    badge: 'Online service',
  },
  {
    id: 8,
    title: 'Manufacturing Management System',
    category: 'Business platform',
    tags: ['Web', 'Platforms'],
    description: 'One system joining up procurement, production planning, inventory, quality control, HR & payroll, and financial accounting for a mid-size manufacturer.',
    impact: '40% reduction in inventory losses',
    capabilities: ['Production planning', 'Stock control', 'Staff & payroll'],
    Icon: FiSettings,
    badge: 'Enterprise',
  },
  {
    id: 9,
    title: 'AI Document Processor',
    category: 'AI',
    tags: ['AI', 'Web'],
    description: 'Intelligent OCR and natural language processing system that automatically extracts, classifies, and routes data from invoices, forms, and official documents — eliminating manual data entry.',
    impact: '90% faster document processing',
    capabilities: ['Document reading', 'Automatic filing', 'No manual entry'],
    Icon: FiCpu,
    badge: 'Smart automation',
  },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter(p => p.tags.includes(activeCategory));

  return (
    <section className="section portfolio-section" id="portfolio">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Selected work</span>
          <h2 className="section-title">
            Systems we have <span>designed and shipped</span>
          </h2>
          <p className="section-subtitle">
            A selection of systems, platforms, and applications we've built for clients across Tanzania.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <div className="portfolio-filters" role="group" aria-label="Filter projects by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div className="portfolio-grid" layout>
          <AnimatePresence>
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                className="portfolio-card glass-card"
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
              >
                {/* Schematic plate. No screenshot is invented here — the plate
                    is a deliberate placeholder until real captures exist. */}
                <div className="portfolio-card-img" aria-hidden="true">
                  <div className="portfolio-plate">
                    <span className="portfolio-plate__icon">
                      <project.Icon size={26} />
                    </span>
                    <span className="portfolio-plate__id">
                      {String(project.id).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="portfolio-badge">{project.badge}</span>
                </div>

                {/* Card body */}
                <div className="portfolio-card-body">
                  <span className="portfolio-category">{project.category}</span>
                  <h3 className="portfolio-title">{project.title}</h3>
                  <p className="portfolio-desc">{project.description}</p>

                  <div className="portfolio-impact">
                    <span className="impact-dot" aria-hidden="true" />
                    {project.impact}
                  </div>

                  <div className="portfolio-tech">
                    {project.capabilities.map(t => (
                      <span key={t} className="portfolio-tech-tag">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="portfolio-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link to="/portfolio" className="btn btn-outline">
            View all projects <FiArrowRight size={16} />
          </Link>
          <Link to="/contact" className="btn btn-primary">
            Start a project
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
