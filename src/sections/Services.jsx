import { motion } from 'framer-motion';
import {
  FiCode, FiSmartphone, FiCpu, FiBriefcase,
  FiShield, FiDollarSign, FiCloud, FiTool,
  FiBookOpen, FiGitMerge, FiTrendingUp, FiMonitor
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useInView } from '../hooks/useInView';
import '../styles/services.css';

const SERVICES = [
  {
    icon: FiMonitor,
    title: 'Website Development',
    description: 'High-performance, SEO-optimised websites and web applications built to convert visitors into paying customers — with animated design systems, CMS integration, and WhatsApp chat.',
    highlight: 'Built with React + Vite for sub-2s load times',
    color: '#00E5FF',
    tags: ['React', 'HTML/CSS', 'SEO'],
  },
  {
    icon: FiSmartphone,
    title: 'Mobile App Development',
    description: 'Native-quality cross-platform apps for iOS and Android — offline-capable, M-Pesa integrated, and optimized for low-bandwidth networks across Tanzania.',
    highlight: 'One codebase · iOS + Android · Offline mode',
    color: '#39FF14',
    tags: ['iOS', 'Android', 'Cross-Platform'],
  },
  {
    icon: FiCode,
    title: 'Custom Software',
    description: 'Bespoke management systems engineered from scratch — church, school, SACCO, clinic, NGO. We map your exact workflow and build software that fits, not the other way around.',
    highlight: 'Delivered in 4–8 weeks · Full source code handover',
    color: '#00E5FF',
    tags: ['Node.js', 'React', 'MySQL'],
  },
  {
    icon: FiCpu,
    title: 'AI Solutions',
    description: 'AI-powered tools that automate repetitive work: document OCR, intelligent chatbots, decision engines, and smart dashboards — built on proven open-source ML frameworks.',
    highlight: 'Automate 80%+ of repetitive data tasks',
    color: '#39FF14',
    tags: ['Machine Learning', 'NLP', 'Computer Vision'],
  },
  {
    icon: FiTrendingUp,
    title: 'Data & Analytics',
    description: 'Predictive models and interactive dashboards that surface the insights hidden in your operational data — sales forecasts, stock optimization, customer behaviour, and more.',
    highlight: 'Real-time dashboards · Predictive models',
    color: '#00E5FF',
    tags: ['Predictive', 'Analytics', 'Data'],
  },
  {
    icon: FiShield,
    title: 'Cybersecurity',
    description: 'Full-spectrum security: penetration testing, firewall configuration, SSL/TLS setup, staff phishing simulations, and monthly security audits to keep your systems watertight.',
    highlight: 'Includes monthly vulnerability scan reports',
    color: '#39FF14',
    tags: ['Penetration Testing', 'Firewall', 'Audit'],
  },
  {
    icon: FiDollarSign,
    title: 'Accounting Systems',
    description: 'Double-entry accounting with automated invoicing, multi-currency payroll, tax computation (TRA-compliant), and one-click audit-ready financial statements.',
    highlight: 'TRA-compliant · M-Pesa payment integration',
    color: '#00E5FF',
    tags: ['Finance', 'Payroll', 'Reporting'],
  },
  {
    icon: FiCloud,
    title: 'Cloud & VPS Hosting',
    description: 'Fully managed VPS hosting on enterprise-grade infrastructure with automated backups, SSL certificates, performance monitoring, and a 99.9% uptime SLA.',
    highlight: '99.9% uptime SLA · Daily automated backups',
    color: '#39FF14',
    tags: ['Contabo', 'Linux', 'DevOps'],
  },
  {
    icon: FiTool,
    title: 'Maintenance & Support',
    description: '24/7 technical support with defined SLA response times, proactive monitoring, security patching, feature updates, and a dedicated WhatsApp support channel.',
    highlight: '< 2hr critical response · WhatsApp support line',
    color: '#00E5FF',
    tags: ['24/7 Support', 'Updates', 'Monitoring'],
  },
  {
    icon: FiBookOpen,
    title: 'Training & Consultation',
    description: 'Hands-on IT workshops for your staff, digital transformation roadmapping, technology stack advisory, and executive-level technology strategy consultation.',
    highlight: 'On-site or remote · Certificate of completion',
    color: '#39FF14',
    tags: ['Workshops', 'IT Strategy', 'Consulting'],
  },
  {
    icon: FiGitMerge,
    title: 'IoT & Automation',
    description: 'Smart IoT solutions that connect sensors, devices, and cloud dashboards — for energy monitoring, access control, asset tracking, and industrial automation.',
    highlight: 'Real-time device monitoring dashboards',
    color: '#00E5FF',
    tags: ['IoT', 'Smart Systems', 'Automation'],
  },
  {
    icon: FiBriefcase,
    title: 'ERP Systems',
    description: 'End-to-end ERP platforms that unify procurement, inventory, HR, payroll, accounting, and CRM into a single system — eliminating silos and manual reconciliation.',
    highlight: 'Fully integrated · Role-based access control',
    color: '#39FF14',
    tags: ['ERP', 'Integration', 'Business'],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' }
  })
};

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
          <span className="section-label">What We Offer</span>
          <h2 className="section-title">
            End-to-End <span>Digital Services</span>
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
              whileHover={{ y: -8 }}
            >
              <div className="service-card-top">
                <div
                  className="service-icon-wrap"
                  style={{ '--service-color': service.color }}
                >
                  <service.icon size={22} />
                </div>
                <div className="service-tags">
                  {service.tags.map(tag => (
                    <span key={tag} className="service-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>

              {service.highlight && (
                <div className="service-highlight" style={{ '--service-color': service.color }}>
                  <span className="service-highlight-dot" aria-hidden="true" />
                  {service.highlight}
                </div>
              )}

              <div className="service-card-footer">
                <Link to="/services" className="service-link">
                  Learn more <span>→</span>
                </Link>
              </div>

              <div className="service-card-glow" style={{ '--service-color': service.color }} />
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
            View All Services
          </Link>
          <Link to="/contact" className="btn btn-primary">
            Get a Free Quote
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
