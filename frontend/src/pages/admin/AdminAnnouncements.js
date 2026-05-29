import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

const BLANK = { title: '', content: '', type: 'general', isPinned: false, isPublished: true, expiresAt: '' };
const TYPES = ['general', 'urgent', 'event', 'prayer', 'giving'];

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const imgRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/announcements?limit=50`);
      setItems(data.announcements);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(BLANK); setImgFile(null); setShowModal(true); };
  const openEdit = (a) => {
    setEditItem(a);
    setForm({ ...BLANK, ...a, expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : '' });
    setImgFile(null); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imgFile) fd.append('image', imgFile);
      if (editItem) await axios.put(`${API_URL}/api/announcements/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post(`${API_URL}/api/announcements`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editItem ? 'Updated' : 'Created'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await axios.delete(`${API_URL}/api/announcements/${deleteId}`); toast.success('Deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  const typeColors = { general: 'badge-navy', urgent: 'badge-red', event: 'badge-gold', prayer: '', giving: 'badge-green' };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Announcements</h1>
        <p>Manage church news and announcements</p>
      </div>

      <div className="admin-action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>+ New Announcement</button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Type</th><th>Pinned</th><th>Published</th><th>Expires</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem'}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No announcements yet</td></tr>
            ) : items.map(a => (
              <tr key={a._id}>
                <td><strong>{a.title}</strong></td>
                <td><span className={`badge ${typeColors[a.type]||'badge-navy'}`}>{a.type}</span></td>
                <td>{a.isPinned ? '📌 Yes' : '—'}</td>
                <td><span className={`badge ${a.isPublished?'badge-green':'badge-red'}`}>{a.isPublished?'Yes':'No'}</span></td>
                <td>{a.expiresAt ? format(new Date(a.expiresAt), 'MMM dd, yyyy') : '—'}</td>
                <td>{format(new Date(a.createdAt), 'MMM dd, yyyy')}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-icon" onClick={() => openEdit(a)}>✏️</button>
                    <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(a._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',fontSize:'1.25rem',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea className="form-textarea" rows={4} required value={form.content} onChange={e=>setForm({...form,content:e.target.value})} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                      {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expires On</label>
                    <input className="form-input" type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Image (optional)</label>
                  <div className="upload-zone" onClick={() => imgRef.current?.click()}>
                    <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>setImgFile(e.target.files[0])} />
                    {imgFile ? <span>✅ {imgFile.name}</span> : <span>📁 Click to upload image</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:'1.5rem'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.isPinned} onChange={e=>setForm({...form,isPinned:e.target.checked})} /> 📌 Pin this
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})} /> Published
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Delete Announcement</h3></div>
            <div className="modal-body"><p>Are you sure you want to delete this announcement?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
