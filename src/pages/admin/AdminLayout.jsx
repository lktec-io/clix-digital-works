import { Fragment, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid, FiMail, FiFileText, FiUsers, FiLogOut, FiExternalLink, FiMenu, FiX,
  FiUserCheck, FiBriefcase, FiCalendar, FiDollarSign, FiGift, FiList, FiHeart,
  FiTrendingDown, FiSun, FiMoon,
} from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import '../../styles/admin.css';

/**
 * Navigation grouped the way the business thinks: who to manage, what is
 * coming, what is owed, then the website inbox. Every entry points at a route
 * that already exists — no placeholder pages.
 *
 * Client pipeline stages (Leads, Prospects…) stay as filter tabs on the
 * Clients page rather than separate links, keeping the sidebar short.
 */
const NAV_GROUPS = [
  {
    label: 'Main',
    items: [{ to: '/admin', label: 'Dashboard', icon: FiGrid, end: true }],
  },
  {
    label: 'Customer management',
    items: [
      { to: '/admin/clients',    label: 'Clients',    icon: FiUserCheck },
      { to: '/admin/follow-ups', label: 'Follow-ups', icon: FiCalendar },
      { to: '/admin/projects',   label: 'Projects',   icon: FiBriefcase },
    ],
  },
  {
    label: 'CardHub',
    items: [
      { to: '/admin/cardhub/upcoming',  label: 'Upcoming Events', icon: FiGift },
      { to: '/admin/cardhub/events',    label: 'All Events',      icon: FiList },
      { to: '/admin/cardhub/customers', label: 'Customers',       icon: FiHeart },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/payments', label: 'Payments', icon: FiDollarSign },
      { to: '/admin/expenses', label: 'Expenses', icon: FiTrendingDown },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/contacts',   label: 'Contacts',   icon: FiMail },
      { to: '/admin/quotes',     label: 'Quotes',     icon: FiFileText },
      { to: '/admin/newsletter', label: 'Newsletter', icon: FiUsers },
    ],
  },
];

export default function AdminLayout({ children, title }) {
  const { username, logout } = useAdminAuth();
  const { theme, toggle: toggleTheme } = useAdminTheme();
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
            Clix CRM
            <span className="admin-logo-sub">Clients &amp; follow-ups</span>
          </div>
          <button className="admin-sidebar-close" onClick={close} aria-label="Close menu">
            <FiX size={18} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_GROUPS.map(group => (
            <Fragment key={group.label}>
              <span className="admin-nav-label">{group.label}</span>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a className="admin-nav-link admin-site-link" href="/" target="_blank" rel="noopener noreferrer">
            <FiExternalLink size={16} aria-hidden="true" /> <span>View website</span>
          </a>
          <div className="admin-user-row">
            <div className="admin-user-info">
              <span className="admin-user-avatar" aria-hidden="true">{(username || 'a').charAt(0).toUpperCase()}</span>
              <span className="admin-user-name">{username || 'admin'}</span>
            </div>
            <button className="admin-logout-btn" onClick={onLogout} aria-label="Sign out">
              <FiLogOut size={15} aria-hidden="true" />
            </button>
          </div>
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
          <button
            type="button"
            className="admin-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark'
              ? <><FiSun size={15} aria-hidden="true" /> <span>Light</span></>
              : <><FiMoon size={15} aria-hidden="true" /> <span>Dark</span></>}
          </button>
        </header>
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
