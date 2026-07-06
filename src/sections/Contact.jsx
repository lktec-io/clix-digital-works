import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiSend, FiMapPin, FiPhone, FiMail,
  FiCheck, FiMessageSquare, FiAlertCircle
} from 'react-icons/fi';

import COMPANY from '../config/company';
import { API } from '../config/api';
import '../styles/contact.css';

const PROJECT_TYPES = [
  'Website Development',
  'Mobile App',
  'Custom Software',
  'AI / ML Solution',
  'ERP System',
  'Accounting System',
  'Church Management',
  'School Management',
  'SACCO System',
  'Cybersecurity',
  'Cloud & Hosting',
  'Other',
];

const CONTACT_INFO = [
  {
    icon: FiMapPin,
    label: 'Location',
    value: COMPANY.address.full,
    sub: COMPANY.address.continent,
    color: '#39FF14',
    href: COMPANY.address.googleMapsUrl,
    external: true,
  },
  {
    icon: FiPhone,
    label: 'Phone / WhatsApp',
    value: COMPANY.phone,
    sub: COMPANY.hours.weekdays,
    color: '#00E5FF',
    href: `tel:${COMPANY.phone.replace(/\s/g, '')}`,
  },
  {
    icon: FiMail,
    label: 'Email',
    value: COMPANY.email,
    sub: 'We reply within 24 hours',
    color: '#39FF14',
    href: `mailto:${COMPANY.email}`,
  },
  {
    icon: FiMessageSquare,
    label: 'WhatsApp',
    value: 'Chat with us',
    sub: 'Quick response guaranteed',
    color: '#00E5FF',
    href: COMPANY.social.whatsapp,
    external: true,
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API.contact, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          project_type: formData.projectType || '',
          message: formData.message,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err?.message ||
          'Something went wrong. Please try again or contact us directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section contact-section" id="contact">
      <div className="contact-bg" aria-hidden="true" />

      <div className="container">

        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Get In Touch</span>
          <h2 className="section-title">
            Start Your <span>Project Today</span>
          </h2>
          <p className="section-subtitle">
            Tell us about your project and we'll respond within 24 hours.
          </p>
        </motion.div>

        <div className="contact-layout">

          {/* INFO */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="contact-info-header">
              <h3>
                Let's Build Something <span className="gradient-text">Amazing</span>
              </h3>
              <p>
                We help turn your ideas into working digital systems.
              </p>
            </div>

            <div className="contact-cards">
              {CONTACT_INFO.map((info, i) => (
                <motion.a
                  key={info.label}
                  href={info.href}
                  className="contact-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{ '--c-color': info.color }}
                  target={info.external ? '_blank' : undefined}
                  rel={info.external ? 'noopener noreferrer' : undefined}
                >
                  <div className="contact-card-icon">
                    <info.icon size={18} />
                  </div>

                  <div className="contact-card-text">
                    <div className="contact-card-label">{info.label}</div>
                    <div className="contact-card-value">{info.value}</div>
                    <div className="contact-card-sub">{info.sub}</div>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="contact-promise">
              {[
                'Free Consultation',
                '24h Response',
                'No Commitment',
                'Transparent Pricing',
              ].map((p) => (
                <div key={p} className="promise-item">
                  <FiCheck size={14} />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FORM */}
          <motion.div
            className="contact-form-wrap"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >

            {submitted ? (
              <motion.div
                className="form-success glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FiCheck size={32} />
                <h3>Message Sent!</h3>
                <p>We will contact you within 24 hours.</p>

                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      projectType: '',
                      message: '',
                    });
                  }}
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form className="contact-form glass-card" onSubmit={handleSubmit}>

                <input name="name" placeholder="Full Name"
                  value={formData.name} onChange={handleChange} required />

                <input name="email" type="email" placeholder="Email"
                  value={formData.email} onChange={handleChange} required />

                <input name="phone" placeholder="Phone"
                  value={formData.phone} onChange={handleChange} />

                <input name="company" placeholder="Company"
                  value={formData.company} onChange={handleChange} />

                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Project Type</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <textarea
                  name="message"
                  placeholder="Project Details"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />

                {error && (
                  <div className="form-error">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <button disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>

              </form>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}