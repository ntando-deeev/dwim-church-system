import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

const BLANK = { title: '', speaker: '', description: '', scripture: '', series: '', date: '', featured: false, isPublished: true, tags: '', videoUrl: '', thumbnailUrl: '' };

export default function AdminSermons() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSermon, setEditSermon] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const videoRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/sermons?limit=30`);
      setSermons(data.sermons);
    } catch { toast.error('Failed to load sermons'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditSermon(null); setForm(BLANK); setVideoFile(null); setShowModal(true); };
  const openEdit = (s) => {
    setEditSermon(s);
    setForm({ ...BLANK, ...s, date: s.date?.split('T')[0]||'', tags: s.tags?.join(',') || '' });
    setVideoFile(null); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (videoFile) fd.append('video', videoFile);
      if (editSermon) await axios.put(`${API_URL}/api/sermons/${editSermon._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post(`${API_URL}/api/sermons`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editSermon ? 'Sermon updated' : 'Sermon created');
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await axios.delete(`${API_URL}/api/sermons/${deleteId}`); toast.success('Sermon deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Sermons</h1>
        <p>Upload and manage sermon videos and messages</p>
      </div>

      <div className="admin-action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>+ Add Sermon</button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>Thumbnail</th><th>Title</th><th>Speaker</th><th>Series</th><th>Date</th><th>Views</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem'}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
            ) : sermons.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No sermons yet. Add one!</td></tr>
            ) : sermons.map(s => (
              <tr key={s._id}>
                <td>
                  {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" className="thumb-sm" /> :
                    <div className="thumb-sm" style={{background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',borderRadius:'6px',fontSize:'1.1rem'}}>▶</div>}
                </td>
                <td><strong>{s.title}</strong></td>
                <td>{s.speaker}</td>
                <td>{s.series || '—'}</td>
                <td>{format(new Date(s.date), 'MMM dd, yyyy')}</td>
                <td>👁 {s.views}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-icon" onClick={() => openEdit(s)}>✏️</button>
                    <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(s._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{maxWidth:'700px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editSermon ? 'Edit Sermon' : 'Add Sermon'}</h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',fontSize:'1.25rem',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{maxHeight:'70vh',overflowY:'auto'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Speaker *</label>
                    <input className="form-input" required value={form.speaker} onChange={e=>setForm({...form,speaker:e.target.value})} placeholder="Pastor Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scripture Reference</label>
                    <input className="form-input" value={form.scripture} onChange={e=>setForm({...form,scripture:e.target.value})} placeholder="John 3:16" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Series Name</label>
                  <input className="form-input" value={form.series} onChange={e=>setForm({...form,series:e.target.value})} placeholder="E.g. Walking in Faith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Video URL (YouTube, Vimeo, or direct link)</label>
                  <input className="form-input" type="url" value={form.videoUrl} onChange={e=>setForm({...form,videoUrl:e.target.value})} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Thumbnail URL</label>
                  <input className="form-input" type="url" value={form.thumbnailUrl} onChange={e=>setForm({...form,thumbnailUrl:e.target.value})} placeholder="https://..." />
                </div>
                {!editSermon && (
                  <div className="form-group">
                    <label className="form-label">Upload Video File (optional, overrides URL)</label>
                    <div className="upload-zone" onClick={() => videoRef.current?.click()}>
                      <input ref={videoRef} type="file" accept="video/*" style={{display:'none'}} onChange={e=>setVideoFile(e.target.files[0])} />
                      {videoFile ? <span>✅ {videoFile.name}</span> : <span>📹 Click to upload video (MP4, MOV — up to 500MB)</span>}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input className="form-input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="faith, healing, prayer" />
                </div>
                <div style={{display:'flex',gap:'1.5rem'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})} /> Featured
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})} /> Published
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editSermon ? 'Update' : 'Create Sermon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Delete Sermon</h3></div>
            <div className="modal-body"><p>This will permanently delete the sermon. Continue?</p></div>
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
