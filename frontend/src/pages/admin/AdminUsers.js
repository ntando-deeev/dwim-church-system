import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

const ROLES = ['admin', 'pastor', 'deacon', 'member'];
const BLANK = { name: '', email: '', password: '', role: 'member', phone: '', department: '', bio: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/users`, { params: { page, limit: 15, search } });
      setUsers(data.users); setTotalPages(data.pages);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const openCreate = () => { setEditUser(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone||'', department: u.department||'', bio: u.bio||'' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await axios.put(`${API_URL}/api/users/${editUser._id}`, form);
        toast.success('User updated');
      } else {
        await axios.post(`${API_URL}/api/users`, form);
        toast.success('User created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/users/${deleteId}`);
      toast.success('User deleted'); setDeleteId(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) return toast.error('Password must be at least 6 chars');
    try {
      await axios.put(`${API_URL}/api/users/${resetId}/reset-password`, { newPassword: newPwd });
      toast.success('Password reset'); setResetId(null); setNewPwd('');
    } catch { toast.error('Reset failed'); }
  };

  const roleColor = { admin: 'badge-red', pastor: 'badge-gold', deacon: 'badge-navy', member: 'badge-green' };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <p>Create and manage church members and staff</p>
      </div>

      <div className="admin-action-bar">
        <input className="form-input admin-search" placeholder="🔍 Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem'}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--gold-dark))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:700,flexShrink:0}}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td>{u.email}</td>
                <td><span className={`badge ${roleColor[u.role]||'badge-navy'}`}>{u.role}</span></td>
                <td>{u.department || '—'}</td>
                <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{format(new Date(u.createdAt), 'MMM dd, yyyy')}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-icon" onClick={() => openEdit(u)}>✏️</button>
                    <button className="btn btn-secondary btn-icon" title="Reset password" onClick={() => { setResetId(u._id); setNewPwd(''); }}>🔑</button>
                    <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(u._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="btn btn-secondary btn-icon" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
            <span>{page} / {totalPages}</span>
            <button className="btn btn-secondary btn-icon" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>→</button>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',fontSize:'1.25rem',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="john@dwim.org" />
                  </div>
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" required={!editUser} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters" />
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+1 234 567 890" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department / Ministry</label>
                  <input className="form-input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Worship, Youth, Ushering..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows={2} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Short bio..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetId && (
        <div className="modal-overlay" onClick={() => setResetId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Reset Password</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min 6 characters" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResetId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPwd}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Delete User</h3></div>
            <div className="modal-body"><p>This will permanently delete the user. This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
