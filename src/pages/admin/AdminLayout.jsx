import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiMail, FiFileText, FiUsers, FiLogOut, FiExternalLink, FiMenu, FiX } from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: FiGrid,     end: true },
  { to: '/admin/contacts',   label: 'Contacts',   icon: FiMail },
  { to: '/admin/quotes',     label: 'Quotes',     icon: FiFileText },
  { to: '/admin/newsletter', label: 'Newsletter', icon: FiUsers },
];

export default function AdminLayout({ children, title }) {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onLogout = () => { logout(); navigate('/admin/login'); };
  const close    = () => setSidebarOpen(false);

  // Close on route change
  useEffect(() => { close(); }, [location.pathname]);

  // ESC key closes sidebar
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="admin-app">
      {/* Mobile overlay — click to close */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar${sidebarOpen ? ' admin-sidebar-open' : ''}`}
      >
        <div className="admin-logo">
          <div className="admin-logo-mark">C</div>
          <div className="admin-logo-text">
            Clix Admin
            <span className="admin-logo-sub">Control Panel</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="admin-nav-label">Main</span>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <span className="admin-nav-label">Site</span>
          <a className="admin-nav-link" href="/" target="_blank" rel="noopener noreferrer">
            <FiExternalLink size={16} /> View Website
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            Signed in as <strong>{username || 'admin'}</strong>
          </div>
          <button className="admin-logout-btn" onClick={onLogout}>
            <FiLogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          {/* Hamburger — visible below 768px */}
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          <h1 className="admin-topbar-title">{title}</h1>
          <span className="admin-topbar-time">
            {new Date().toLocaleDateString('en-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
