import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiMail, FiFileText, FiUsers, FiLogOut, FiExternalLink } from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NAV = [
  { to: '/admin',            label: 'Dashboard',    icon: FiGrid,     end: true },
  { to: '/admin/contacts',   label: 'Contacts',     icon: FiMail },
  { to: '/admin/quotes',     label: 'Quotes',       icon: FiFileText },
  { to: '/admin/newsletter', label: 'Newsletter',   icon: FiUsers },
];

export default function AdminLayout({ children, title }) {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();

  const onLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className="admin-sidebar">
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
