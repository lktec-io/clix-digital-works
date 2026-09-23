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
    output: 'Requirements brief',
  },
  {
    num: '02',
    icon: FiClipboard,
    title: 'Planning',
    description: 'Our team creates a detailed project roadmap with timelines, milestones, budget estimates, and technical architecture.',
    output: 'Roadmap & architecture',
  },
  {
    num: '03',
    icon: FiLayout,
    title: 'Design',
    description: 'We craft beautiful, intuitive UI/UX designs and interactive prototypes that align with your brand identity.',
    output: 'Prototype',
  },
  {
    num: '04',
    icon: FiCode,
    title: 'Development',
    description: 'Our engineers build your solution using modern tech stacks, clean code practices, and agile development sprints.',
    output: 'Working increments',
  },
  {
    num: '05',
    icon: FiCheckCircle,
    title: 'Testing',
    description: 'Rigorous QA testing across all devices and scenarios ensures your product is bug-free and production-ready.',
    output: 'QA sign-off',
  },
  {
    num: '06',
    icon: FiUploadCloud,
    title: 'Deployment',
    description: 'We deploy to your production environment with zero-downtime strategies and complete monitoring setup.',
    output: 'Live system',
  },
  {
    num: '07',
    icon: FiHeadphones,
    title: 'Support',
    description: 'Post-launch, we provide ongoing maintenance, updates, training, and 24/7 technical support for your team.',
    output: 'Ongoing SLA',
  },
];

export default function Process() {
  return (
    <section className="section process-section" id="process">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">How we build</span>
          <h2 className="section-title">
            A workflow you can <span>follow week by week</span>
          </h2>
          <p className="section-subtitle">
            A structured, transparent approach that ensures every project is delivered on time, on budget, and beyond expectations.
          </p>
        </motion.div>

        {/* A single rail, read top to bottom, with the deliverable of each
            stage stated explicitly — the same shape on every screen size. */}
        <ol className="process-rail">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.num}
              className="process-stage"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: Math.min(i, 3) * 0.05 }}
            >
              <div className="stage-marker" aria-hidden="true">
                <span className="stage-marker__box">
                  <step.icon size={17} />
                </span>
              </div>

              <div className="stage-body">
                <div className="stage-head">
                  <span className="stage-num">{step.num}</span>
                  <h3 className="stage-title">{step.title}</h3>
                </div>
                <p className="stage-desc">{step.description}</p>
                <div className="stage-output">
                  <span className="stage-output__key">output</span>
                  <span className="stage-output__val">{step.output}</span>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
