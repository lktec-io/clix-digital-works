import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiFileText, FiUsers, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { API, apiFetch } from '../../config/api';
import { SkeletonCard } from '../../components/Skeleton';
import CrmDashboardSection from '../../components/admin/crm/CrmDashboardSection';
import { MetricBar } from '../../components/admin/crm/ui';

/**
 * Dashboard order follows business importance: the CRM section (follow-ups,
 * events, money owed) first, then the website inbox — contact forms, quote
 * requests and newsletter sign-ups that have not become clients yet.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(API.adminStats)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const inbox = [
    { to: '/admin/contacts', label: 'Contact forms', icon: FiMail, value: stats?.contacts ?? '—', sub: `${stats?.new_contacts ?? 0} new · ${stats?.recent_contacts ?? 0} this week` },
    { to: '/admin/quotes', label: 'Quote requests', icon: FiFileText, value: stats?.quotes ?? '—', sub: `${stats?.new_quotes ?? 0} new · ${stats?.recent_quotes ?? 0} this week` },
    { to: '/admin/newsletter', label: 'Subscribers', icon: FiUsers, value: stats?.subscribers ?? '—', sub: 'Active newsletter subscribers' },
    { to: '/admin/contacts', label: 'This week', icon: FiTrendingUp, value: (stats?.recent_contacts ?? 0) + (stats?.recent_quotes ?? 0), sub: 'New website enquiries' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <CrmDashboardSection />

      <div className="crm-section-heading">
        <h3>Website enquiries</h3>
        <Link className="crm-link" to="/admin/contacts">Open inbox <FiArrowRight size={12} aria-hidden="true" /></Link>
      </div>

      {loading ? (
        <div className="admin-grid-loading">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <MetricBar items={inbox} />
      )}
    </AdminLayout>
  );
}
