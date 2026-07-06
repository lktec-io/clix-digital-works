import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiFileText, FiUsers, FiTrendingUp } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { API, apiFetch } from '../../config/api';
import { SkeletonCard } from '../../components/Skeleton';

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="admin-stat-card" style={{ '--s-color': color }}>
      <div className="admin-stat-icon"><Icon size={18} /></div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value ?? '—'}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(API.adminStats)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="admin-grid-loading">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <StatCard
              label="Total Contacts" icon={FiMail} color="#39FF14"
              value={stats?.contacts}
              sub={`${stats?.new_contacts} new · ${stats?.recent_contacts} this week`}
            />
            <StatCard
              label="Quote Requests" icon={FiFileText} color="#00E5FF"
              value={stats?.quotes}
              sub={`${stats?.new_quotes} new · ${stats?.recent_quotes} this week`}
            />
            <StatCard
              label="Subscribers" icon={FiUsers} color="#39FF14"
              value={stats?.subscribers}
              sub="Active newsletter subscribers"
            />
            <StatCard
              label="This Week" icon={FiTrendingUp} color="#00E5FF"
              value={(stats?.recent_contacts ?? 0) + (stats?.recent_quotes ?? 0)}
              sub="Total leads (contacts + quotes)"
            />
          </div>

          <div className="admin-grid-panels">
            <div className="admin-table-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { to: '/admin/contacts', label: 'View Contact Submissions', badge: stats?.new_contacts },
                  { to: '/admin/quotes',   label: 'Review Quote Requests',    badge: stats?.new_quotes },
                  { to: '/admin/newsletter', label: 'Manage Newsletter',      badge: null },
                ].map(({ to, label, badge }) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                      color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--fs-sm)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                    {badge > 0 && (
                      <span className="nav-badge" style={{ background: 'var(--gradient-accent)', color: 'var(--bg)', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                        {badge} new
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="admin-table-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                Lead Overview
              </h3>
              {[
                { label: 'New Contacts',     value: stats?.new_contacts,   color: '#39FF14' },
                { label: 'New Quotes',       value: stats?.new_quotes,     color: '#00E5FF' },
                { label: 'Total Leads',      value: (stats?.contacts ?? 0) + (stats?.quotes ?? 0), color: '#39FF14' },
                { label: 'Newsletter Total', value: stats?.subscribers,    color: '#00E5FF' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontSize: 'var(--fs-sm)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{value ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
