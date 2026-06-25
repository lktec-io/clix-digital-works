import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMapPin, FiPhone, FiMail, FiCheck, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
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
    name: '', email: '', phone: '', company: '',
    projectType: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch(API.contact, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          project_type: formData.projectType,
          message: formData.message,
        }),
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Submission failed');
        return data;
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again or contact us directly.');
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
            Tell us about your project and we'll get back to you within 24 hours with a free consultation.
          </p>
        </motion.div>

        <div className="contact-layout">
          {/* Info Column */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="contact-info-header">
              <h3>Let's Build Something <span className="gradient-text">Amazing</span> Together</h3>
              <p>Whether you have a clear project plan or just an idea, we're here to help turn it into a working digital product.</p>
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
                  style={{ '--c-color': info.color, textDecoration: 'none' }}
                  target={info.external ? '_blank' : undefined}
                  rel={info.external ? 'noopener noreferrer' : undefined}
                  whileHover={{ x: 4 }}
                >
                  <div className="contact-card-icon">
                    <info.icon size={18} aria-hidden="true" />
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
                'Free Initial Consultation',
                'Response Within 24 Hours',
                'No Commitment Required',
                'Transparent Pricing',
              ].map(p => (
                <div key={p} className="promise-item">
                  <FiCheck size={14} className="promise-check" aria-hidden="true" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
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
                <div className="success-icon">
                  <FiCheck size={32} aria-hidden="true" />
                </div>
                <h3>Message Sent Successfully!</h3>
                <p>
                  Thank you for reaching out. Our team will contact you within 24 hours to
                  discuss your project in detail.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-outline" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </button>
                  <a
                    href={COMPANY.social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </motion.div>
            ) : (
              <form
                className="contact-form glass-card"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Project enquiry form"
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="contact-name" className="form-label">Full Name *</label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      className="form-input"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email" className="form-label">Email Address *</label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      className="form-input"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-phone" className="form-label">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      className="form-input"
                      placeholder="+255 XXX XXX XXX"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-company" className="form-label">Company / Organization</label>
                    <input
                      type="text"
                      id="contact-company"
                      name="company"
                      className="form-input"
                      placeholder="Your Company Name"
                      value={formData.company}
                      onChange={handleChange}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-projectType" className="form-label">Project Type *</label>
                  <select
                    id="contact-projectType"
                    name="projectType"
                    className="form-input form-select"
                    value={formData.projectType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select project type…</option>
                    {PROJECT_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">Project Details *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="form-input form-textarea"
                    placeholder="Describe your project, goals, timeline, and any specific requirements…"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                  />
                </div>

                {error && (
                  <div className="form-error" role="alert">
                    <FiAlertCircle size={15} aria-hidden="true" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary form-submit"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="loading-spinner" aria-hidden="true" />
                      Sending…
                    </span>
                  ) : (
                    <><FiSend size={18} aria-hidden="true" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
