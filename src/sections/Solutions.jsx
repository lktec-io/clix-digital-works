import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import '../styles/solutions.css';

const SOLUTIONS = [
  {
    id: 'schools',
    emoji: '🎓',
    title: 'Schools & Universities',
    tagline: 'Smart Education Management',
    problem: 'Manual enrollment, scattered records, inefficient communication between staff, students, and parents.',
    solution: 'A complete school management system with student enrollment, grades tracking, attendance, fee management, and parent portals.',
    features: ['Student Information System', 'Online Fee Payment', 'Timetable Management', 'Parent Communication Portal', 'Exam & Results Management', 'Library System'],
    color: '#39FF14',
  },
  {
    id: 'churches',
    emoji: '⛪',
    title: 'Churches & Religious Orgs',
    tagline: 'Digital Ministry Management',
    problem: 'Poor member tracking, disorganized tithe/offering records, no communication system for congregation.',
    solution: 'A church management system for member registration, contribution tracking, event scheduling, and digital communication.',
    features: ['Member Registry', 'Tithe & Offering Tracking', 'Event Management', 'Group & Cell Management', 'SMS/Email Broadcasts', 'Financial Reports'],
    color: '#00E5FF',
  },
  {
    id: 'hospitals',
    emoji: '🏥',
    title: 'Hospitals & Clinics',
    tagline: 'Healthcare Information Systems',
    problem: 'Paper-based patient records, appointment chaos, billing errors, and no inventory control for medical supplies.',
    solution: 'An integrated hospital management platform covering patient records, appointments, billing, pharmacy, and lab management.',
    features: ['Electronic Patient Records', 'Appointment Booking', 'Pharmacy Management', 'Lab Result System', 'Billing & Insurance', 'Doctor Dashboard'],
    color: '#39FF14',
  },
  {
    id: 'saccos',
    emoji: '🏦',
    title: 'SACCOs & MFIs',
    tagline: 'Financial Cooperative Systems',
    problem: 'Slow loan processing, manual savings records, no mobile access, difficult reporting for regulators.',
    solution: 'A full-featured SACCO management system with member savings, loans, shares, dividend computation, and regulatory reports.',
    features: ['Member Management', 'Savings & Deposits', 'Loan Processing', 'Share Capital', 'Dividend Computation', 'Regulatory Reporting'],
    color: '#00E5FF',
  },
  {
    id: 'businesses',
    emoji: '🏢',
    title: 'Businesses & Enterprises',
    tagline: 'End-to-End Business Software',
    problem: 'Fragmented tools, no real-time data, poor inventory control, and disconnected departments.',
    solution: 'Custom ERP systems, POS solutions, and business automation tools that connect every part of your operation.',
    features: ['Inventory Management', 'POS System', 'HR & Payroll', 'CRM', 'Financial Accounting', 'Business Analytics'],
    color: '#39FF14',
  },
  {
    id: 'ngos',
    emoji: '🌍',
    title: 'NGOs & Non-Profits',
    tagline: 'Impact Management Systems',
    problem: 'Difficulty tracking project impact, donor management, beneficiary records, and grant reporting.',
    solution: 'NGO management software for donor tracking, beneficiary management, project monitoring, and automated impact reports.',
    features: ['Donor Management', 'Project Tracking', 'Beneficiary Database', 'Grant Management', 'Impact Reporting', 'Volunteer Management'],
    color: '#00E5FF',
  },
  {
    id: 'government',
    emoji: '🏛️',
    title: 'Government Institutions',
    tagline: 'Digital Government Solutions',
    problem: 'Paper-based processes, citizen service delays, lack of transparency, and poor inter-department communication.',
    solution: 'E-government platforms, digital service portals, document management systems, and citizen engagement tools.',
    features: ['Citizen Service Portal', 'Document Management', 'Service Request Tracking', 'Inter-dept Communication', 'Public Records', 'Reporting & Analytics'],
    color: '#39FF14',
  },
  {
    id: 'logistics',
    emoji: '🚚',
    title: 'Logistics Companies',
    tagline: 'Smart Logistics Platforms',
    problem: 'No real-time tracking, manual dispatch, poor route optimization, and difficult customer updates.',
    solution: 'Fleet management, shipment tracking, route optimization, and customer notification systems for logistics businesses.',
    features: ['Fleet Tracking (GPS)', 'Shipment Management', 'Route Optimization', 'Customer Notifications', 'Driver Management', 'Delivery Analytics'],
    color: '#00E5FF',
  },
];

export default function Solutions() {
  const [active, setActive] = useState(SOLUTIONS[0]);

  return (
    <section className="section solutions-section" id="solutions">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Industry Solutions</span>
          <h2 className="section-title">
            Built for <span>Your Industry</span>
          </h2>
          <p className="section-subtitle">
            We understand the unique challenges of different sectors. Our solutions are tailored to solve real problems.
          </p>
        </motion.div>

        <div className="solutions-layout">
          {/* Tab List */}
          <div className="solutions-tabs" role="tablist" aria-label="Industry solutions">
            {SOLUTIONS.map(sol => (
              <button
                key={sol.id}
                className={`sol-tab ${active.id === sol.id ? 'active' : ''}`}
                onClick={() => setActive(sol)}
                role="tab"
                aria-selected={active.id === sol.id}
                aria-controls={`panel-${sol.id}`}
                style={{ '--sol-color': sol.color }}
              >
                <span className="sol-tab-emoji">{sol.emoji}</span>
                <span className="sol-tab-title">{sol.title.split('&')[0].trim()}</span>
                {active.id === sol.id && (
                  <motion.div className="sol-tab-indicator" layoutId="solIndicator" />
                )}
              </button>
            ))}
          </div>

          {/* Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              className="solutions-panel glass-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              id={`panel-${active.id}`}
              role="tabpanel"
              style={{ '--sol-color': active.color }}
            >
              <div className="panel-header">
                <div className="panel-emoji">{active.emoji}</div>
                <div>
                  <div className="panel-tagline" style={{ color: active.color }}>{active.tagline}</div>
                  <h3 className="panel-title">{active.title}</h3>
                </div>
              </div>

              <div className="panel-body">
                <div className="panel-col">
                  <div className="panel-section-label">The Challenge</div>
                  <p className="panel-text">{active.problem}</p>

                  <div className="panel-section-label">Our Solution</div>
                  <p className="panel-text">{active.solution}</p>
                </div>

                <div className="panel-col">
                  <div className="panel-section-label">Key Features</div>
                  <ul className="panel-features">
                    {active.features.map(f => (
                      <li key={f}>
                        <span className="feature-check" style={{ color: active.color }}>
                          <FiCheck size={14} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="panel-footer">
                <Link to="/contact" className="btn btn-primary btn-sm">
                  Get This Solution <FiArrowRight size={16} />
                </Link>
                <Link to="/solutions" className="btn btn-ghost btn-sm">
                  View Case Studies
                </Link>
              </div>

              <div className="panel-glow" style={{ '--sol-color': active.color }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
