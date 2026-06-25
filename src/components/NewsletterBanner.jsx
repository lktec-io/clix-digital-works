import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { API } from '../config/api';
import '../styles/newsletter.css';

export default function NewsletterBanner() {
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState('idle'); // idle | loading | success | error
  const [message, setMessage]   = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(API.newsletterSubscribe, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStatus('success');
      setMessage(data.message || 'Subscribed!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="newsletter-section" aria-label="Newsletter signup">
      <div className="newsletter-glow" aria-hidden="true" />
      <div className="container">
        <motion.div
          className="newsletter-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="newsletter-icon" aria-hidden="true">
            <FiMail size={24} />
          </div>
          <div className="newsletter-text">
            <h3 className="newsletter-title">Stay Ahead of the Curve</h3>
            <p className="newsletter-subtitle">
              Get monthly insights on technology, digital transformation, and business growth — delivered to your inbox.
            </p>
          </div>

          {status === 'success' ? (
            <div className="newsletter-success">
              <FiCheck size={18} />
              <span>{message}</span>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={onSubmit} noValidate>
              <div className="newsletter-input-wrap">
                <input
                  type="email"
                  className="form-input newsletter-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-label="Email address for newsletter"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  className="btn btn-primary newsletter-btn"
                  disabled={status === 'loading'}
                  aria-busy={status === 'loading'}
                >
                  {status === 'loading'
                    ? <span className="loading-spinner" aria-hidden="true" />
                    : <><FiSend size={15} /> Subscribe</>
                  }
                </button>
              </div>
              {status === 'error' && (
                <div className="newsletter-error" role="alert">
                  <FiAlertCircle size={13} /> {message}
                </div>
              )}
              <p className="newsletter-note">No spam, ever. Unsubscribe at any time.</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
