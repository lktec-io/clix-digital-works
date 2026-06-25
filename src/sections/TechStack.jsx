import { motion } from 'framer-motion';
import {
  FiCode, FiDatabase, FiServer, FiGitBranch,
  FiMonitor, FiZap, FiLayers, FiGlobe
} from 'react-icons/fi';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/techstack.css';

const TECH_CATEGORIES = [
  {
    label: 'Client Interfaces',
    icon: FiMonitor,
    color: '#00E5FF',
    items: [
      { name: 'React', detail: 'UI Framework', icon: '⚛️' },
      { name: 'Vite', detail: 'Build Tool', icon: '⚡' },
      { name: 'HTML5', detail: 'Markup', icon: '🌐' },
      { name: 'CSS3', detail: 'Styling', icon: '🎨' },
    ],
  },
  {
    label: 'Server & Logic',
    icon: FiServer,
    color: '#39FF14',
    items: [
      { name: 'Node.js', detail: 'Runtime', icon: '🟢' },
      { name: 'Express', detail: 'Framework', icon: '🚂' },
      { name: 'REST APIs', detail: 'Integration', icon: '🔗' },
      { name: 'Linux', detail: 'Server OS', icon: '🐧' },
    ],
  },
  {
    label: 'Data Layer',
    icon: FiDatabase,
    color: '#00E5FF',
    items: [
      { name: 'MySQL', detail: 'Relational DB', icon: '🗄️' },
      { name: 'Backups', detail: 'Data Safety', icon: '💾' },
      { name: 'Encryption', detail: 'Data Security', icon: '🔐' },
      { name: 'Analytics', detail: 'Insights', icon: '📊' },
    ],
  },
  {
    label: 'Infrastructure',
    icon: FiGlobe,
    color: '#39FF14',
    items: [
      { name: 'Contabo VPS', detail: 'Cloud Hosting', icon: '☁️' },
      { name: 'Git', detail: 'Version Control', icon: '🌿' },
      { name: 'CI/CD', detail: 'Deployment', icon: '🚀' },
      { name: 'SSL/TLS', detail: 'Security', icon: '🔒' },
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
          <span className="section-label">Technology Foundation</span>
          <h2 className="section-title">
            Built on <span>Proven Technology</span>
          </h2>
          <p className="section-subtitle">
            We use industry-standard, battle-tested technologies to deliver solutions that perform reliably at any scale.
          </p>
        </motion.div>

        <div className="tech-grid">
          {TECH_CATEGORIES.map((cat, i) => (
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
                  <cat.icon size={18} />
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
                    <span className="tech-item-emoji">{item.icon}</span>
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

        {/* Trust strip — uses useScrollAnimation hook */}
        <div
          ref={trustRef}
          className={`tech-trust sa-hidden sa-scale ${trustVisible ? 'sa-visible' : ''}`}
        >
          {['Enterprise-Grade Security', 'High Performance', '99.9% Uptime SLA', 'Scalable Architecture', 'Modern Standards', 'Regular Updates'].map(item => (
            <div key={item} className="trust-item">
              <span className="trust-dot">✦</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
