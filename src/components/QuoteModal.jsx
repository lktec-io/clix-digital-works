import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useQuoteModal } from '../context/QuoteModalContext';
import { API } from '../config/api';
import '../styles/quotemodal.css';

const PROJECT_TYPES = [
  'Website Development', 'Mobile App', 'Custom Software', 'ERP System',
  'AI / Machine Learning', 'Cybersecurity', 'Accounting System',
  'Management System', 'Cloud & VPS Hosting', 'IoT & Automation', 'Other',
];

const BUDGETS = [
  'Under $500', '$500–$1,000', '$1,000–$3,000',
  '$3,000–$10,000', '$10,000+', 'Discuss with team',
];

const TIMELINES = [
  'ASAP (< 2 weeks)', '1 month', '2–3 months', '3–6 months', 'Flexible',
];

const BLANK = { name: '', email: '', phone: '', company: '', project_type: '', budget: '', timeline: '', requirements: '' };

export default function QuoteModal() {
  const { open, closeModal } = useQuoteModal();
  const [form, setForm]         = useState(BLANK);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSubmitted(false);
      setError('');
      setForm(BLANK);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeModal]);

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API.quotes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="qm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
          aria-label="Request a Quote"
        >
          <motion.div
            className="qm-panel glass-card"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="qm-header">
              <div>
                <span className="section-label" style={{ fontSize: '11px' }}>Free Estimate</span>
                <h2 className="qm-title">Request a Quote</h2>
              </div>
              <button className="qm-close" onClick={closeModal} aria-label="Close quote modal">
                <FiX size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="qm-success">
                <div className="qm-success-icon"><FiCheck size={28} /></div>
                <h3>Quote Request Received!</h3>
                <p>We'll send a detailed proposal within 48 hours. Check your inbox at <strong>{form.email}</strong>.</p>
                <button className="btn btn-primary" onClick={closeModal}>Close</button>
              </div>
            ) : (
              <form className="qm-form" onSubmit={onSubmit} noValidate>
                <div className="qm-grid">
                  <div className="form-group">
                    <label htmlFor="qm-name" className="form-label">Full Name *</label>
                    <input id="qm-name" name="name" type="text" className="form-input"
                      placeholder="John Doe" value={form.name} onChange={onChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="qm-email" className="form-label">Email Address *</label>
                    <input id="qm-email" name="email" type="email" className="form-input"
                      placeholder="john@company.com" value={form.email} onChange={onChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="qm-phone" className="form-label">Phone / WhatsApp</label>
                    <input id="qm-phone" name="phone" type="tel" className="form-input"
                      placeholder="+255 XXX XXX XXX" value={form.phone} onChange={onChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="qm-company" className="form-label">Company / Organization</label>
                    <input id="qm-company" name="company" type="text" className="form-input"
                      placeholder="Your Company" value={form.company} onChange={onChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="qm-project_type" className="form-label">Project Type *</label>
                  <select id="qm-project_type" name="project_type" className="form-input form-select"
                    value={form.project_type} onChange={onChange} required>
                    <option value="">Select project type…</option>
                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="qm-grid">
                  <div className="form-group">
                    <label htmlFor="qm-budget" className="form-label">Budget Range</label>
                    <select id="qm-budget" name="budget" className="form-input form-select"
                      value={form.budget} onChange={onChange}>
                      <option value="">Select budget…</option>
                      {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="qm-timeline" className="form-label">Timeline</label>
                    <select id="qm-timeline" name="timeline" className="form-input form-select"
                      value={form.timeline} onChange={onChange}>
                      <option value="">Select timeline…</option>
                      {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="qm-requirements" className="form-label">Project Requirements</label>
                  <textarea id="qm-requirements" name="requirements" className="form-input form-textarea"
                    rows={4} placeholder="Describe what you need — features, integrations, design preferences, existing systems…"
                    value={form.requirements} onChange={onChange} />
                </div>

                {error && (
                  <div className="form-error" role="alert">
                    <FiAlertCircle size={15} /> {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary qm-submit" disabled={loading} aria-busy={loading}>
                  {loading
                    ? <span className="btn-loading"><span className="loading-spinner" />Sending…</span>
                    : <><FiSend size={16} /> Send Quote Request</>
                  }
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
