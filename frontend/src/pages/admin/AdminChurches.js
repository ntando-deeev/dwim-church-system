import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import '../admin/Admin.css';

const STATUS_COLORS = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' };

export default function AdminChurches() {
  const { token } = useAuth();
  const [churches, setChurches] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const fetchChurches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/churches/admin/all`, {
        params: { status: filter }, ...cfg
      });
      setChurches(data.churches || []);
    } catch {}
    setLoading(false);
  }, [filter, token]);

  useEffect(() => { fetchChurches(); }, [fetchChurches]);

  const approve = async (id) => {
    setActionBusy(true);
    try {
      await axios.patch(`${API_URL}/api/churches/admin/${id}/approve`, {}, cfg);
      fetchChurches();
      setSelected(null);
    } catch {}
    setActionBusy(false);
  };

  const reject = async (id) => {
    setActionBusy(true);
    try {
      await axios.patch(`${API_URL}/api/churches/admin/${id}/reject`, { reason: rejectReason }, cfg);
      fetchChurches();
      setSelected(null);
      setRejectReason('');
    } catch {}
    setActionBusy(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this church registration?')) return;
    try {
      await axios.delete(`${API_URL}/api/churches/admin/${id}`, cfg);
      fetchChurches();
      setSelected(null);
    } catch {}
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>⛪ Church Registrations</h2>
        <div className="admin-filter-tabs">
          {['pending','approved','rejected'].map(s => (
            <button key={s} className={`admin-filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : churches.length === 0 ? (
        <div className="admin-empty">No {filter} churches.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Church</th>
                <th>Email</th>
                <th>Location</th>
                <th>Payment Ref</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {churches.map(ch => (
                <tr key={ch._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      {ch.logo
                        ? <img src={ch.logo} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1a1040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem' }}>✝</div>
                      }
                      <span style={{ fontWeight: 600 }}>{ch.name}</span>
                    </div>
                  </td>
                  <td>{ch.email}</td>
                  <td>{[ch.city, ch.country].filter(Boolean).join(', ') || '—'}</td>
                  <td><code style={{ fontSize: '.8rem', color: '#aaa' }}>{ch.paymentRef || '—'}</code></td>
                  <td>
                    <span style={{ color: STATUS_COLORS[ch.paymentStatus], fontWeight: 600, textTransform: 'capitalize', fontSize: '.85rem' }}>
                      {ch.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '.8rem', color: '#888' }}>
                    {ch.createdAt ? new Date(ch.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button className="admin-btn-sm" onClick={() => setSelected(ch)}>View</button>
                      {ch.paymentStatus === 'pending' && (
                        <button className="admin-btn-sm success" onClick={() => approve(ch._id)} disabled={actionBusy}>Approve</button>
                      )}
                      <button className="admin-btn-sm danger" onClick={() => del(ch._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{selected.name}</h3>
              <button className="admin-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-row"><span>Email:</span><span>{selected.email}</span></div>
              <div className="admin-detail-row"><span>Location:</span><span>{[selected.city, selected.country].filter(Boolean).join(', ') || '—'}</span></div>
              <div className="admin-detail-row"><span>Phone:</span><span>{selected.phone || '—'}</span></div>
              <div className="admin-detail-row"><span>Website:</span><span>{selected.website || '—'}</span></div>
              <div className="admin-detail-row"><span>Payment Ref:</span><span>{selected.paymentRef || '—'}</span></div>
              <div className="admin-detail-row"><span>Status:</span><span style={{ color: STATUS_COLORS[selected.paymentStatus], fontWeight: 600, textTransform: 'capitalize' }}>{selected.paymentStatus}</span></div>
              {selected.description && (
                <div className="admin-detail-row column"><span>Description:</span><p style={{ color: '#ccc', marginTop: '.4rem' }}>{selected.description}</p></div>
              )}
              {selected.paymentProof && (
                <div className="admin-detail-row column">
                  <span>Payment Screenshot:</span>
                  <a href={selected.paymentProof} target="_blank" rel="noopener noreferrer">
                    <img src={selected.paymentProof} alt="Payment proof" style={{ maxWidth: '100%', borderRadius: 8, marginTop: '.5rem', border: '1px solid rgba(255,255,255,.1)' }} />
                  </a>
                </div>
              )}

              {selected.paymentStatus === 'pending' && (
                <div className="admin-modal-actions">
                  <button className="btn btn-primary" onClick={() => approve(selected._id)} disabled={actionBusy}>✅ Approve & Activate</button>
                  <div style={{ display: 'flex', gap: '.5rem', flexDirection: 'column' }}>
                    <input
                      placeholder="Rejection reason (optional)"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '.6rem .9rem', color: '#fff', fontSize: '.9rem' }}
                    />
                    <button className="btn btn-danger" onClick={() => reject(selected._id)} disabled={actionBusy}>❌ Reject</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
