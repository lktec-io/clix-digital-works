import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/admin.css';

export default function AdminLogin() {
  const { login, loading, error } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.username, form.password);
    if (ok) navigate('/admin');
  };

  return (
    <div className="admin-login-page">
      <motion.div
        className="admin-login-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="admin-login-logo">
          <div className="admin-logo-mark">C</div>
          <div>
            <div className="admin-logo-text">Clix Digital Works</div>
            <span className="admin-logo-sub">Admin Panel</span>
          </div>
        </div>

        <h1 className="admin-login-title">Welcome back</h1>
        <p className="admin-login-sub">Sign in to manage leads and submissions.</p>

        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label htmlFor="adm-user" className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <FiUser size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="adm-user" name="username" type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="admin"
                value={form.username}
                onChange={onChange}
                required autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="adm-pass" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="adm-pass" name="password" type="password"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">
              <FiAlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 'var(--space-sm)', justifyContent: 'center' }}>
            {loading
              ? <span className="btn-loading"><span className="loading-spinner" />Signing in…</span>
              : <><FiLogIn size={16} /> Sign In</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}
