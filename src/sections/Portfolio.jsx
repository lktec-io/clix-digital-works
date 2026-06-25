import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiLayers } from 'react-icons/fi';
import '../styles/portfolio.css';

const CATEGORIES = ['All', 'Web', 'Mobile', 'ERP', 'AI', 'Management'];

const PROJECTS = [
  {
    id: 1,
    title: 'Church Management System',
    category: 'Management',
    tags: ['Web', 'Management'],
    description: 'A complete digital management platform for a congregation of 3 000+ members. Handles tithe tracking, member registration, event scheduling, cell groups, SMS/email broadcasts, and financial reporting.',
    impact: 'Reduced admin workload by 70%',
    tech: ['React', 'Node.js', 'MySQL'],
    color: '#39FF14',
    emoji: '⛪',
    badge: 'Live System',
  },
  {
    id: 2,
    title: 'Accounting & Finance System',
    category: 'ERP',
    tags: ['Web', 'ERP'],
    description: 'Full double-entry accounting platform with automated invoicing, multi-currency support, payroll processing, tax computation, and audit-ready financial statements.',
    impact: 'Eliminated manual bookkeeping errors',
    tech: ['React', 'Express', 'MySQL'],
    color: '#00E5FF',
    emoji: '📊',
    badge: 'Enterprise',
  },
  {
    id: 3,
    title: 'SACCO Contribution System',
    category: 'Management',
    tags: ['Web', 'Management', 'ERP'],
    description: 'End-to-end SACCO management with member savings, loan applications, share capital tracking, automated dividend computation, and SACCOS regulatory compliance reporting.',
    impact: 'Loan processing time: days → minutes',
    tech: ['React', 'Node.js', 'MySQL'],
    color: '#39FF14',
    emoji: '🏦',
    badge: 'FinTech',
  },
  {
    id: 4,
    title: 'Premium Business Website',
    category: 'Web',
    tags: ['Web'],
    description: 'High-conversion corporate website with animated design system, integrated CRM lead capture, SEO optimisation, WhatsApp chat widget, and Google Analytics dashboard.',
    impact: '+200% organic enquiries in 3 months',
    tech: ['React', 'Vite', 'CSS3'],
    color: '#00E5FF',
    emoji: '🌐',
    badge: 'Featured',
  },
  {
    id: 5,
    title: 'E-Commerce Platform',
    category: 'Web',
    tags: ['Web', 'Mobile'],
    description: 'Full-featured online store with product catalogue, inventory management, shopping cart, M-Pesa & card payment integration, order tracking, and a seller analytics dashboard.',
    impact: '500+ orders processed at launch',
    tech: ['React', 'Node.js', 'MySQL'],
    color: '#39FF14',
    emoji: '🛒',
    badge: 'E-Commerce',
  },
  {
    id: 6,
    title: 'School Management System',
    category: 'Management',
    tags: ['Web', 'Management'],
    description: 'Comprehensive school ERP covering student enrollment, academic records, attendance tracking, fee collection with M-Pesa integration, exam results, and a parent self-service portal.',
    impact: '4 schools onboarded in year one',
    tech: ['React', 'Express', 'MySQL'],
    color: '#00E5FF',
    emoji: '🎓',
    badge: 'EdTech',
  },
  {
    id: 7,
    title: 'Online Booking System',
    category: 'Web',
    tags: ['Web', 'Mobile'],
    description: 'Real-time appointment and reservation platform for clinics, salons, and hospitality businesses. Features calendar management, SMS reminders, prepayment, and staff scheduling.',
    impact: 'No-show rate reduced by 55%',
    tech: ['React', 'Node.js', 'MySQL'],
    color: '#39FF14',
    emoji: '📅',
    badge: 'SaaS',
  },
  {
    id: 8,
    title: 'Manufacturing ERP',
    category: 'ERP',
    tags: ['Web', 'ERP'],
    description: 'Enterprise Resource Planning system integrating procurement, production planning, inventory, quality control, HR & payroll, and financial accounting for a mid-size manufacturer.',
    impact: '40% reduction in inventory losses',
    tech: ['React', 'Express', 'MySQL'],
    color: '#00E5FF',
    emoji: '⚙️',
    badge: 'Enterprise',
  },
  {
    id: 9,
    title: 'AI Document Processor',
    category: 'AI',
    tags: ['AI', 'Web'],
    description: 'Intelligent OCR and natural language processing system that automatically extracts, classifies, and routes data from invoices, forms, and official documents — eliminating manual data entry.',
    impact: '90% faster document processing',
    tech: ['Python', 'React', 'TensorFlow'],
    color: '#39FF14',
    emoji: '🤖',
    badge: 'AI / ML',
  },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);

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
          <span className="section-label">Our Work</span>
          <h2 className="section-title">
            Projects We're <span>Proud Of</span>
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
                whileHover={{ y: -8 }}
                style={{ '--proj-color': project.color }}
              >
                {/* Card image / hero area */}
                <div className="portfolio-card-img">
                  <div className="portfolio-emoji">{project.emoji}</div>
                  <span className="portfolio-badge">{project.badge}</span>
                  <div className="portfolio-img-glow" />
                  <button
                    className="portfolio-preview-btn"
                    aria-label={`Expand ${project.title}`}
                    onClick={() => setExpanded(expanded === project.id ? null : project.id)}
                  >
                    <FiLayers size={16} />
                  </button>
                </div>

                {/* Card body */}
                <div className="portfolio-card-body">
                  <h3 className="portfolio-title">{project.title}</h3>
                  <p className="portfolio-desc">{project.description}</p>

                  {/* Impact stat */}
                  <div className="portfolio-impact">
                    <span className="impact-dot" aria-hidden="true" />
                    {project.impact}
                  </div>

                  <div className="portfolio-tech">
                    {project.tech.map(t => (
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
            View All Projects <FiArrowRight size={16} />
          </Link>
          <Link to="/contact" className="btn btn-primary">
            Start Your Project
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
