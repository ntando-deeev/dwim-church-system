import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

const BLANK = { title: '', description: '', category: 'service', startDate: '', endDate: '', location: 'Main Sanctuary', address: '', isRecurring: false, recurringPattern: '', registrationRequired: false, registrationLink: '', capacity: '', featured: false, isPublished: true, tags: '' };
const CATEGORIES = ['service', 'conference', 'prayer', 'youth', 'women', 'men', 'outreach', 'special', 'other'];

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [poster, setPoster] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/events?limit=30`);
      setEvents(data.events);
    } catch { toast.error('Failed to load events'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditEvent(null); setForm(BLANK); setPoster(null); setShowModal(true); };
  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({ ...BLANK, ...ev, startDate: ev.startDate?.split('T')[0]||'', endDate: ev.endDate?.split('T')[0]||'', tags: ev.tags?.join(',') || '' });
    setPoster(null); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (poster) fd.append('poster', poster);
      if (editEvent) await axios.put(`${API_URL}/api/events/${editEvent._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post(`${API_URL}/api/events`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editEvent ? 'Event updated' : 'Event created');
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await axios.delete(`${API_URL}/api/events/${deleteId}`); toast.success('Event deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Events</h1>
        <p>Manage church events, conferences, and services</p>
      </div>

      <div className="admin-action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>+ New Event</button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>Poster</th><th>Title</th><th>Category</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem'}}><div className="spinner" style={{margin:'0 auto'}} /></td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No events yet. Create one!</td></tr>
            ) : events.map(ev => (
              <tr key={ev._id}>
                <td>
                  {ev.posterUrl ? <img src={ev.posterUrl} alt="" className="thumb-sm" /> :
                    <div className="thumb-sm" style={{background:'var(--cream)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'6px',border:'1px solid var(--border)'}}>📅</div>}
                </td>
                <td><strong>{ev.title}</strong></td>
                <td><span className="badge badge-gold">{ev.category}</span></td>
                <td>{format(new Date(ev.startDate), 'MMM dd, yyyy')}</td>
                <td>{ev.location}</td>
                <td><span className={`badge ${ev.isPublished?'badge-green':'badge-red'}`}>{ev.isPublished?'Published':'Draft'}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-icon" onClick={() => openEdit(ev)}>✏️</button>
                    <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(ev._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{maxWidth:'700px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',fontSize:'1.25rem',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{maxHeight:'70vh',overflowY:'auto'}}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Event title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" required rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date & Time *</label>
                    <input className="form-input" type="datetime-local" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date & Time *</label>
                    <input className="form-input" type="datetime-local" required value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Event Poster</label>
                  <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>setPoster(e.target.files[0])} />
                    {poster ? <span>✅ {poster.name}</span> : <span>📁 Click to upload poster image</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})} /> Featured
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})} /> Published
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.registrationRequired} onChange={e=>setForm({...form,registrationRequired:e.target.checked})} /> Registration Required
                  </label>
                </div>
                {form.registrationRequired && (
                  <div className="form-group" style={{marginTop:'1rem'}}>
                    <label className="form-label">Registration Link</label>
                    <input className="form-input" type="url" value={form.registrationLink} onChange={e=>setForm({...form,registrationLink:e.target.value})} placeholder="https://..." />
                  </div>
                )}
                <div className="form-group" style={{marginTop:'1rem'}}>
                  <label className="form-label">Tags</label>
                  <input className="form-input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="conference, 2024, healing" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-header"><h3>Delete Event</h3></div>
            <div className="modal-body"><p>This will permanently delete the event. Continue?</p></div>
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
