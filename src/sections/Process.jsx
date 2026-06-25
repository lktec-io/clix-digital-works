import { motion } from 'framer-motion';
import {
  FiSearch, FiClipboard, FiLayout, FiCode,
  FiCheckCircle, FiUploadCloud, FiHeadphones
} from 'react-icons/fi';
import '../styles/process.css';

const STEPS = [
  {
    num: '01',
    icon: FiSearch,
    title: 'Discovery',
    description: 'We analyze your business needs, goals, and challenges through detailed consultations to define the perfect solution.',
    color: '#39FF14',
  },
  {
    num: '02',
    icon: FiClipboard,
    title: 'Planning',
    description: 'Our team creates a detailed project roadmap with timelines, milestones, budget estimates, and technical architecture.',
    color: '#00E5FF',
  },
  {
    num: '03',
    icon: FiLayout,
    title: 'Design',
    description: 'We craft beautiful, intuitive UI/UX designs and interactive prototypes that align with your brand identity.',
    color: '#39FF14',
  },
  {
    num: '04',
    icon: FiCode,
    title: 'Development',
    description: 'Our engineers build your solution using modern tech stacks, clean code practices, and agile development sprints.',
    color: '#00E5FF',
  },
  {
    num: '05',
    icon: FiCheckCircle,
    title: 'Testing',
    description: 'Rigorous QA testing across all devices and scenarios ensures your product is bug-free and production-ready.',
    color: '#39FF14',
  },
  {
    num: '06',
    icon: FiUploadCloud,
    title: 'Deployment',
    description: 'We deploy to your production environment with zero-downtime strategies and complete monitoring setup.',
    color: '#00E5FF',
  },
  {
    num: '07',
    icon: FiHeadphones,
    title: 'Support',
    description: 'Post-launch, we provide ongoing maintenance, updates, training, and 24/7 technical support for your team.',
    color: '#39FF14',
  },
];

export default function Process() {
  return (
    <section className="section process-section" id="process">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">How We Work</span>
          <h2 className="section-title">
            Our Proven <span>Process</span>
          </h2>
          <p className="section-subtitle">
            A structured, transparent approach that ensures every project is delivered on time, on budget, and beyond expectations.
          </p>
        </motion.div>

        <div className="process-timeline">
          {/* Connecting line */}
          <div className="process-line" aria-hidden="true" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className={`process-step ${i % 2 === 0 ? 'step-left' : 'step-right'}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              {/* Node */}
              <div className="step-node" style={{ '--step-color': step.color }}>
                <div className="step-node-inner">
                  <step.icon size={20} />
                </div>
                <div className="step-node-pulse" />
              </div>

              {/* Card */}
              <motion.div
                className="step-card glass-card"
                whileHover={{ scale: 1.02 }}
                style={{ '--step-color': step.color }}
              >
                <div className="step-num">{step.num}</div>
                <div className="step-icon-badge">
                  <step.icon size={16} />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
                <div className="step-accent-line" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
