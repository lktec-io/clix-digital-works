import { motion } from 'framer-motion';
import {
  FiCode, FiSmartphone, FiCpu, FiBriefcase,
  FiShield, FiDollarSign, FiCloud, FiTool,
  FiBookOpen, FiGitMerge, FiTrendingUp, FiMonitor, FiArrowRight
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useInView } from '../hooks/useInView';
import '../styles/services.css';

const SERVICES = [
  {
    icon: FiMonitor,
    title: 'Website Development',
    description: 'Fast, search-friendly websites built to turn visitors into enquiries — with a polished design, pages your team can update, and WhatsApp chat for customers who prefer it.',
    highlight: 'Opens quickly, even on a slow connection',
    tags: ['Websites', 'Found on Google', 'Mobile-ready'],
  },
  {
    icon: FiSmartphone,
    title: 'Mobile App Development',
    description: 'One app that runs on both Android and iPhone — keeps working without network, accepts M-Pesa, and is built for the connections your customers actually have.',
    highlight: 'One app for Android and iPhone · keeps working offline',
    tags: ['Android', 'iPhone', 'Works offline'],
  },
  {
    icon: FiCode,
    title: 'Custom Software',
    description: 'Bespoke management systems engineered from scratch — church, school, SACCO, clinic, NGO. We map your exact workflow and build software that fits, not the other way around.',
    highlight: 'Delivered in 4–8 weeks · the finished system is yours to keep',
    tags: ['Built around you', 'Web & mobile', 'You own it'],
  },
  {
    icon: FiCpu,
    title: 'AI Solutions',
    description: 'Tools that take repetitive work off your staff: reading and filing documents, answering common customer questions, flagging what needs attention, and surfacing the numbers that matter.',
    highlight: 'Automate 80%+ of repetitive data tasks',
    tags: ['Document reading', 'Chat assistants', 'Smart automation'],
  },
  {
    icon: FiTrendingUp,
    title: 'Business Insights & Reports',
    description: 'Predictive models and interactive dashboards that surface the insights hidden in your operational data — sales forecasts, stock optimization, customer behaviour, and more.',
    highlight: 'Real-time dashboards · Predictive models',
    tags: ['Business reports', 'Forecasting', 'Live overview'],
  },
  {
    icon: FiShield,
    title: 'Cybersecurity',
    description: 'Protecting your systems and customer information: controlled staff access, secure connections, tested defences, staff awareness training, and a monthly check that everything is still sound.',
    highlight: 'Includes monthly vulnerability scan reports',
    tags: ['Security checks', 'Safe access', 'Monitoring'],
  },
  {
    icon: FiDollarSign,
    title: 'Accounting Systems',
    description: 'Proper books without the manual work: invoices raised automatically, payroll in more than one currency, tax worked out to TRA rules, and statements ready for your auditor in one click.',
    highlight: 'TRA-compliant · M-Pesa payment integration',
    tags: ['Invoicing', 'Payroll', 'Tax records'],
  },
  {
    icon: FiCloud,
    title: 'Hosting & Uptime',
    description: 'We keep your website or system online and look after it for you — automatic daily backups, a secure connection for visitors, performance watched around the clock, and a 99.9% uptime commitment.',
    highlight: '99.9% uptime SLA · Daily automated backups',
    tags: ['Always online', 'Daily backups', 'Secure connection'],
  },
  {
    icon: FiTool,
    title: 'Maintenance & Support',
    description: '24/7 technical support with defined SLA response times, proactive monitoring, security patching, feature updates, and a dedicated WhatsApp support channel.',
    highlight: '< 2hr critical response · WhatsApp support line',
    tags: ['24/7 Support', 'Updates', 'Monitoring'],
  },
  {
    icon: FiBookOpen,
    title: 'Training & Consultation',
    description: 'Hands-on IT workshops for your staff, digital transformation roadmapping, technology stack advisory, and executive-level technology strategy consultation.',
    highlight: 'On-site or remote · Certificate of completion',
    tags: ['Workshops', 'IT Strategy', 'Consulting'],
  },
  {
    icon: FiGitMerge,
    title: 'Connected Devices & Automation',
    description: 'Smart IoT solutions that connect sensors, devices, and cloud dashboards — for energy monitoring, access control, asset tracking, and industrial automation.',
    highlight: 'Real-time device monitoring dashboards',
    tags: ['Sensors', 'Remote monitoring', 'Process automation'],
  },
  {
    icon: FiBriefcase,
    title: 'Complete Business Platforms',
    description: 'End-to-end ERP platforms that unify procurement, inventory, HR, payroll, accounting, and CRM into a single system — eliminating silos and manual reconciliation.',
    highlight: 'Fully integrated · Role-based access control',
    tags: ['One connected system', 'Every department', 'Secure access'],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: Math.min(i, 5) * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  })
};

const pad = n => String(n).padStart(2, '0');

export default function Services() {
  const [ref, inView] = useInView({ threshold: 0.05 });

  return (
    <section className="section services-section" id="services">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Capabilities</span>
          <h2 className="section-title">
            End-to-end <span>engineering services</span>
          </h2>
          <p className="section-subtitle">
            From concept to deployment — everything your organization needs to thrive in the digital era.
          </p>
        </motion.div>

        <div className="services-grid" ref={ref}>
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              className="service-card glass-card"
              custom={i}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={cardVariants}
            >
              <div className="service-card-top">
                <div className="service-icon-wrap">
                  <service.icon size={20} />
                </div>
                <span className="service-index">{pad(i + 1)}</span>
              </div>

              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>

              {service.highlight && (
                <div className="service-highlight">
                  <span className="service-highlight-dot" aria-hidden="true" />
                  {service.highlight}
                </div>
              )}

              <div className="service-tags">
                {service.tags.map(tag => (
                  <span key={tag} className="service-tag">{tag}</span>
                ))}
              </div>

              <div className="service-card-footer">
                <Link to="/services" className="service-link">
                  Learn more <FiArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="services-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/services" className="btn btn-outline">
            View all services
          </Link>
          <Link to="/contact" className="btn btn-primary">
            Get a free quote
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
