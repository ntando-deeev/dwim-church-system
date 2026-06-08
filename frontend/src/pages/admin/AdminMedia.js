import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

const TABS = [
  { id: 'image', label: '🖼️ Image', endpoint: '/api/media/upload/image', accept: 'image/*' },
  { id: 'video', label: '🎬 Video', endpoint: '/api/media/upload/video', accept: 'video/*' },
  { id: 'poster', label: '📋 Poster', endpoint: '/api/media/upload/poster', accept: 'image/*,.pdf' },
];

const CATEGORIES = ['sermon', 'worship', 'event', 'announcement', 'gallery', 'poster', 'other'];

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState('image');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileRef = useRef();
  const [form, setForm] = useState({ title: '', description: '', category: 'gallery', tags: '', featured: false, isPublic: true });
  const [file, setFile] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search };
      if (filter !== 'all') params.type = filter;
      const { data } = await axios.get(`${API_URL}/api/media/admin/all`, { params });
      setMedia(data.media);
      setTotalPages(data.pages);
    } catch (e) { toast.error('Failed to load media'); }
    setLoading(false);
  };

  useEffect(() => { loadMedia(); }, [page, filter, search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const tab = TABS.find(t => t.id === uploadTab);
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    setUploading(true);
    try {
      await axios.post(`${API_URL}${tab.endpoint}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Uploaded successfully!');
      setFile(null); setForm({ title: '', description: '', category: 'gallery', tags: '', featured: false, isPublic: true });
      if (fileRef.current) fileRef.current.value = '';
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/media/${id}`);
      toast.success('Deleted'); setDeleteId(null); loadMedia();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Media Library</h1>
        <p>Upload and manage videos, images, and posters</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`upload-tab ${uploadTab === t.id ? 'active' : ''}`} onClick={() => setUploadTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Media title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} placeholder="Optional description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" placeholder="worship, sunday, 2024" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Options</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} /> Featured
                </label>
                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} /> Public
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">File</label>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept={TABS.find(t=>t.id===uploadTab)?.accept} onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>✅ <strong>{file.name}</strong> ({(file.size/1024/1024).toFixed(2)} MB)</div>
              ) : (
                <div>
                  <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📁</div>
                  <strong>Click to select {uploadTab}</strong>
                  <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.25rem'}}>
                    {uploadTab === 'video' ? 'MP4, MOV, AVI, MKV — up to 500MB' : 'JPG, PNG, WEBP — up to 20MB'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? <><div className="spinner" style={{width:'1rem',height:'1rem',borderWidth:'2px'}} /> Uploading…</> : `Upload ${uploadTab.charAt(0).toUpperCase()+uploadTab.slice(1)}`}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="admin-action-bar">
        <div className="admin-filters">
          {['all','image','video','poster'].map(f => (
            <button key={f} className={`upload-tab ${filter===f?'active':''}`} onClick={() => { setFilter(f); setPage(1); }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)+'s'}
            </button>
          ))}
        </div>
        <input className="form-input admin-search" placeholder="🔍 Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th><th>Title</th><th>Type</th><th>Category</th><th>Views</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem'}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
            ) : media.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No media found</td></tr>
            ) : media.map(m => (
              <tr key={m._id}>
                <td>
                  {m.type === 'image' || m.type === 'poster' ? (
                    <img src={m.url} alt={m.title} className="thumb-sm" />
                  ) : (
                    <div className="thumb-sm" style={{background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',borderRadius:'6px'}}>🎬</div>
                  )}
                </td>
                <td><strong>{m.title}</strong></td>
                <td><span className={`badge ${m.type==='video'?'badge-navy':m.type==='poster'?'badge-gold':'badge-green'}`}>{m.type}</span></td>
                <td><span className="badge badge-navy">{m.category}</span></td>
                <td>{m.views}</td>
                <td>{format(new Date(m.createdAt), 'MMM dd, yyyy')}</td>
                <td>
                  <div className="table-actions">
                    <a href={m.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-icon">👁</a>
                    <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(m._id)}>🗑</button>
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

      {/* Confirm delete */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Confirm Delete</h3></div>
            <div className="modal-body"><p>This will permanently delete the media file from Cloudinary. Are you sure?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
