import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiCpu, FiHeadphones, FiTrendingUp, FiShield, FiTarget } from 'react-icons/fi';
import { useCounter } from '../hooks/useCounter';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/whychooseus.css';

const REASONS = [
  {
    icon: FiAward,
    title: 'Expert Software Engineering',
    description: 'Our team brings deep expertise in modern software architecture, design patterns, and best practices to deliver enterprise-grade solutions.',
    color: '#39FF14',
  },
  {
    icon: FiCpu,
    title: 'Modern Technologies',
    description: 'We use cutting-edge technologies and frameworks to build fast, scalable, and future-proof digital solutions.',
    color: '#00E5FF',
  },
  {
    icon: FiHeadphones,
    title: 'Reliable 24/7 Support',
    description: 'Our dedicated support team is available around the clock to ensure your systems run smoothly without interruption.',
    color: '#39FF14',
  },
  {
    icon: FiTrendingUp,
    title: 'Scalable Systems',
    description: 'Every solution we build is designed to grow with your organization — from startup to enterprise scale.',
    color: '#00E5FF',
  },
  {
    icon: FiShield,
    title: 'Cybersecurity First',
    description: 'Security is built into every layer of our solutions. We protect your data, users, and reputation from digital threats.',
    color: '#39FF14',
  },
  {
    icon: FiTarget,
    title: 'Business-Driven Solutions',
    description: 'We focus on your business outcomes, not just technical deliverables. Every line of code serves a business purpose.',
    color: '#00E5FF',
  },
];

const STATS = [
  { value: 50, suffix: '+', label: 'Projects Delivered' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
  { value: 3, suffix: 'x', label: 'Faster Delivery' },
  { value: 24, suffix: '/7', label: 'Support Hours' },
];

function Counter({ value, suffix, label, inView }) {
  const count = useCounter(value, 2200, inView);
  return (
    <motion.div
      className="why-stat"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="why-stat-value">
        <span>{count}</span><span className="why-stat-suffix">{suffix}</span>
      </div>
      <div className="why-stat-label">{label}</div>
    </motion.div>
  );
}

export default function WhyChooseUs() {
  // useScrollAnimation replaces the manual IntersectionObserver for the stats bar
  const [ref, inView] = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="section why-section" id="why">
      <div className="why-bg-glow" aria-hidden="true" />

      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Why Clix Digital Works</span>
          <h2 className="section-title">
            The Partner You <span>Can Trust</span>
          </h2>
          <p className="section-subtitle">
            We don't just build software — we build partnerships. Here's why leading organizations choose us.
          </p>
        </motion.div>

        {/* Stats bar */}
        <div className="why-stats" ref={ref}>
          {STATS.map((s, i) => (
            <Counter key={i} {...s} inView={inView} />
          ))}
        </div>

        {/* Reasons grid */}
        <div className="why-grid">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              className="why-card glass-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
              style={{ '--why-color': reason.color }}
            >
              <div className="why-icon-wrap">
                <reason.icon size={24} />
                <div className="why-icon-ring" />
              </div>
              <h3 className="why-title">{reason.title}</h3>
              <p className="why-desc">{reason.description}</p>
              <div className="why-card-line" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
