import { useEffect, useState, useCallback } from 'react';
import { FiTrash2, FiDownload, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { API, apiFetch } from '../../config/api';
import { SkeletonTable } from '../../components/Skeleton';

export default function AdminNewsletter() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('active');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status, page, limit: LIMIT });
      const res = await apiFetch(`${API.adminNewsletter}?${params}`);
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const del = async (id) => {
    if (!confirm('Remove this subscriber?')) return;
    await apiFetch(`${API.adminNewsletter}/${id}`, { method: 'DELETE' });
    load();
  };

  const exportCsv = () => {
    const token = sessionStorage.getItem('clix_admin_token');
    window.open(`${API.newsletterExport}?token=${token}`, '_blank');
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="Newsletter Subscribers">
      <div className="admin-table-card">
        <div className="admin-table-header">
          <span className="admin-table-title">Subscribers ({total})</span>
          <div className="admin-search">
            <input
              type="search" placeholder="Search email or name…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filter">
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
          <button className="action-btn action-btn-status" onClick={load} title="Refresh">
            <FiRefreshCw size={13} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiDownload size={14} /> Export CSV
          </button>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div style={{ padding: '20px' }}><SkeletonTable rows={8} cols={4} /></div>
          ) : data.length === 0 ? (
            <div className="admin-empty">No subscribers found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Subscribed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      <a href={`mailto:${row.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        {row.email}
                      </a>
                    </td>
                    <td>{row.name || '—'}</td>
                    <td><span className={`status-badge status-${row.status}`}>{row.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(row.subscribed_at).toLocaleDateString()}</td>
                    <td>
                      <button className="action-btn action-btn-delete" onClick={() => del(row.id)} title="Remove subscriber">
                        <FiTrash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <span>Page {page} of {totalPages} ({total} records)</span>
            <div className="pagination-btns">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <FiChevronLeft size={14} />
              </button>
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
