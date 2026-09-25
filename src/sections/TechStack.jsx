import { motion } from 'framer-motion';
import {
  FiMonitor, FiZap, FiLayers, FiGlobe, FiLink, FiSave,
  FiActivity, FiUsers, FiBarChart2, FiDollarSign, FiFileText,
  FiShoppingCart, FiCalendar, FiSmartphone, FiCpu, FiRadio
} from 'react-icons/fi';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/techstack.css';

/**
 * What we build, described by the work it does rather than the tools used to
 * do it. Every entry here corresponds to something already offered in the
 * services list or shipped in the portfolio — nothing new is promised.
 */
const CAPABILITY_GROUPS = [
  {
    label: 'Running the business',
    icon: FiLayers,
    color: '#3B7DFF',
    items: [
      { name: 'Business management systems', detail: 'Daily operations in one place', Icon: FiMonitor },
      { name: 'Sales & stock', detail: 'Products, purchases, stock levels', Icon: FiActivity },
      { name: 'Customer management', detail: 'Contacts, follow-ups, service history', Icon: FiUsers },
      { name: 'Business reports', detail: 'Clear numbers owners can act on', Icon: FiBarChart2 },
    ],
  },
  {
    label: 'Money & records',
    icon: FiDollarSign,
    color: '#19C39B',
    items: [
      { name: 'Accounting & finance', detail: 'Income, expenses and balances', Icon: FiDollarSign },
      { name: 'Invoicing & payments', detail: 'Bills issued, payments recorded', Icon: FiFileText },
      { name: 'Payroll', detail: 'Staff pay and records', Icon: FiUsers },
      { name: 'Business information', detail: 'Organised, secure and backed up', Icon: FiSave },
    ],
  },
  {
    label: 'Reaching customers',
    icon: FiGlobe,
    color: '#3B7DFF',
    items: [
      { name: 'Websites & online platforms', detail: 'Present your services and get found', Icon: FiGlobe },
      { name: 'Online stores', detail: 'Sell, take payment, track orders', Icon: FiShoppingCart },
      { name: 'Booking & appointments', detail: 'Schedules, reminders, prepayment', Icon: FiCalendar },
      { name: 'Mobile applications', detail: 'For customers, staff or field teams', Icon: FiSmartphone },
    ],
  },
  {
    label: 'Working smarter',
    icon: FiZap,
    color: '#19C39B',
    items: [
      { name: 'Process automation', detail: 'Less repetitive manual work', Icon: FiZap },
      { name: 'Connected business systems', detail: 'Your tools sharing the same information', Icon: FiLink },
      { name: 'Intelligent data solutions', detail: 'Patterns and forecasts from your records', Icon: FiCpu },
      { name: 'Connected devices', detail: 'Monitor equipment and activity remotely', Icon: FiRadio },
    ],
  },
];

export default function TechStack() {
  const [trustRef, trustVisible] = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="section techstack-section" id="tech">
      <div className="techstack-bg" aria-hidden="true" />

      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">What we build</span>
          <h2 className="section-title">
            Software for the <span>work you do every day</span>
          </h2>
          <p className="section-subtitle">
            Whatever your organization runs on today — paperwork, spreadsheets or a system that has
            outgrown you — these are the kinds of solutions we build to replace it.
          </p>
        </motion.div>

        <div className="tech-grid">
          {CAPABILITY_GROUPS.map((cat, i) => (
            <motion.div
              key={cat.label}
              className="tech-category glass-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ '--cat-color': cat.color }}
            >
              <div className="tech-cat-header">
                <div className="tech-cat-icon">
                  <cat.icon size={18} aria-hidden="true" />
                </div>
                <span className="tech-cat-label">{cat.label}</span>
              </div>

              <div className="tech-items">
                {cat.items.map((item, j) => (
                  <motion.div
                    key={item.name}
                    className="tech-item"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + j * 0.06 }}
                    whileHover={{ x: 6 }}
                  >
                    <span className="tech-item-icon" aria-hidden="true">
                      <item.Icon size={14} />
                    </span>
                    <div className="tech-item-info">
                      <span className="tech-item-name">{item.name}</span>
                      <span className="tech-item-detail">{item.detail}</span>
                    </div>
                    <div className="tech-item-dot" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          ref={trustRef}
          className={`tech-trust sa-hidden sa-scale ${trustVisible ? 'sa-visible' : ''}`}
          role="list"
          aria-label="What every Clix system includes"
        >
          {['Secure staff access', 'Works on phone and computer', 'Daily backups', 'Fast on slow connections', 'Room to grow', 'Supported after launch'].map(item => (
            <div key={item} className="trust-item" role="listitem">
              <span className="trust-dot" aria-hidden="true">✦</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
