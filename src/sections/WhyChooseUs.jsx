import { motion } from 'framer-motion';
import {
  FiAward, FiCpu, FiHeadphones, FiTrendingUp, FiShield, FiTarget,
  FiGitBranch, FiMapPin, FiLifeBuoy, FiActivity
} from 'react-icons/fi';
import '../styles/whychooseus.css';

const REASONS = [
  {
    icon: FiAward,
    title: 'Expert Software Engineering',
    description: 'Our team brings deep expertise in modern software architecture, design patterns, and best practices to deliver enterprise-grade solutions.',
  },
  {
    icon: FiCpu,
    title: 'Modern Technologies',
    description: 'We use cutting-edge technologies and frameworks to build fast, scalable, and future-proof digital solutions.',
  },
  {
    icon: FiHeadphones,
    title: 'Reliable 24/7 Support',
    description: 'Our dedicated support team is available around the clock to ensure your systems run smoothly without interruption.',
  },
  {
    icon: FiTrendingUp,
    title: 'Scalable Systems',
    description: 'Every solution we build is designed to grow with your organization — from startup to enterprise scale.',
  },
  {
    icon: FiShield,
    title: 'Cybersecurity First',
    description: 'Security is built into every layer of our solutions. We protect your data, users, and reputation from digital threats.',
  },
  {
    icon: FiTarget,
    title: 'Business-Driven Solutions',
    description: 'We focus on your business outcomes, not just technical deliverables. Every line of code serves a business purpose.',
  },
];

/**
 * What we commit to on every engagement.
 *
 * This band replaced a counter bar of unverifiable percentages
 * ("98% client satisfaction", "3x faster delivery") which also duplicated
 * the hero figures. Each line below restates a commitment already made
 * elsewhere on the site (services, support, location) rather than a claim
 * about results we cannot evidence.
 */
const COMMITMENTS = [
  { icon: FiGitBranch, label: 'Full source code handover' },
  { icon: FiLifeBuoy, label: '24/7 support · WhatsApp line' },
  { icon: FiActivity, label: 'Monitoring & maintenance' },
  { icon: FiMapPin, label: 'Built in Mbeya, Tanzania' },
];

export default function WhyChooseUs() {
  return (
    <section className="section why-section" id="why">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">Why Clix</span>
          <h2 className="section-title">
            An engineering partner, <span>not a vendor</span>
          </h2>
          <p className="section-subtitle">
            We don't just build software — we build partnerships. Here's why leading organizations choose us.
          </p>
        </motion.div>

        <div className="why-commitments">
          {COMMITMENTS.map(({ icon: Icon, label }) => (
            <div className="why-commitment" key={label}>
              <Icon size={16} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="why-grid">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              className="why-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: Math.min(i, 3) * 0.05, duration: 0.4 }}
            >
              <div className="why-icon-wrap">
                <reason.icon size={20} />
              </div>
              <h3 className="why-title">{reason.title}</h3>
              <p className="why-desc">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
