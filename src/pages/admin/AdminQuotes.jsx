import { useEffect, useState, useCallback } from 'react';
import { FiTrash2, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { API, apiFetch } from '../../config/api';
import { SkeletonTable } from '../../components/Skeleton';

export default function AdminQuotes() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status, page, limit: LIMIT });
      const res = await apiFetch(`${API.adminQuotes}?${params}`);
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

  const updateStatus = async (id, newStatus) => {
    await apiFetch(`${API.adminQuotes}/${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this quote request?')) return;
    await apiFetch(`${API.adminQuotes}/${id}`, { method: 'DELETE' });
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="Quote Requests">
      <div className="admin-table-card">
        <div className="admin-table-header">
          <span className="admin-table-title">All Quotes ({total})</span>
          <div className="admin-search">
            <input
              type="search" placeholder="Search name, email, project…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filter">
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="quoted">Quoted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="action-btn action-btn-status" onClick={load} title="Refresh">
            <FiRefreshCw size={13} />
          </button>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div style={{ padding: '20px' }}><SkeletonTable rows={8} cols={6} /></div>
          ) : data.length === 0 ? (
            <div className="admin-empty">No quote requests found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Project Type</th>
                  <th>Budget</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {row.name}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        <a href={`mailto:${row.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{row.email}</a>
                      </div>
                      {row.company && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.company}</div>}
                    </td>
                    <td>{row.project_type}</td>
                    <td>{row.budget || '—'}</td>
                    <td>{row.timeline || '—'}</td>
                    <td><span className={`status-badge status-${row.status}`}>{row.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <select
                          className="action-btn action-btn-status"
                          value={row.status}
                          onChange={e => updateStatus(row.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="quoted">Quoted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button className="action-btn action-btn-delete" onClick={() => del(row.id)}>
                          <FiTrash2 size={12} />
                        </button>
                      </div>
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
