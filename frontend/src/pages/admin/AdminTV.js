import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';
import './AdminTV.css';

const CONTENT_BLANK = {
  title: '', description: '', category: 'sermon', speaker: '',
  date: '', videoUrl: '', thumbnailUrl: '', duration: '',
  featured: false, isPublished: true, isPinned: false, tags: ''
};

const STREAM_BLANK = {
  title: '', description: '', streamUrl: '', chatUrl: '',
  thumbnailUrl: '', scheduledAt: ''
};

const CATEGORIES = ['sermon', 'worship', 'prayer', 'teaching', 'testimony', 'event', 'live', 'other'];

export default function AdminTV() {
  const [tab, setTab] = useState('content'); // 'content' | 'live'

  // Content state
  const [content, setContent] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editContent, setEditContent] = useState(null);
  const [contentForm, setContentForm] = useState(CONTENT_BLANK);
  const [savingContent, setSavingContent] = useState(false);
  const [deleteContentId, setDeleteContentId] = useState(null);

  // File upload state
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef();
  const thumbRef = useRef();

  // Streams state
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [editStream, setEditStream] = useState(null);
  const [streamForm, setStreamForm] = useState(STREAM_BLANK);
  const [savingStream, setSavingStream] = useState(false);
  const [deleteStreamId, setDeleteStreamId] = useState(null);

  const loadContent = async () => {
    setContentLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/tv/admin/content`);
      setContent(data.content);
    } catch { toast.error('Failed to load TV content'); }
    setContentLoading(false);
  };

  const loadStreams = async () => {
    setStreamsLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/tv/admin/streams`);
      setStreams(data.streams);
    } catch { toast.error('Failed to load streams'); }
    setStreamsLoading(false);
  };

  useEffect(() => { loadContent(); loadStreams(); }, []);

  // ── Content CRUD ──────────────────────────────────────
  const openCreateContent = () => {
    setEditContent(null);
    setContentForm({ ...CONTENT_BLANK, date: new Date().toISOString().split('T')[0] });
    setVideoFile(null);
    setThumbFile(null);
    setUploadProgress(0);
    setShowContentModal(true);
  };
  const openEditContent = (item) => {
    setEditContent(item);
    setContentForm({
      ...CONTENT_BLANK, ...item,
      date: item.date?.split('T')[0] || '',
      tags: item.tags?.join(', ') || '',
      featured: item.featured || false,
      isPublished: item.isPublished !== false,
      isPinned: item.isPinned || false,
    });
    setVideoFile(null);
    setThumbFile(null);
    setUploadProgress(0);
    setShowContentModal(true);
  };
  const handleContentSubmit = async (e) => {
    e.preventDefault(); setSavingContent(true); setUploadProgress(0);
    try {
      const fd = new FormData();
      Object.entries(contentForm).forEach(([k, v]) => fd.append(k, String(v)));
      if (videoFile) fd.append('video', videoFile);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      if (editContent) {
        await axios.put(`${API_URL}/api/tv/content/${editContent._id}`, fd, config);
        toast.success('Updated successfully');
      } else {
        await axios.post(`${API_URL}/api/tv/content`, fd, config);
        toast.success('Video added to Synagogue TV');
      }
      setShowContentModal(false);
      setVideoFile(null); setThumbFile(null); setUploadProgress(0);
      loadContent();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    setSavingContent(false);
  };
  const handleDeleteContent = async () => {
    try {
      await axios.delete(`${API_URL}/api/tv/content/${deleteContentId}`);
      toast.success('Deleted'); setDeleteContentId(null); loadContent();
    } catch { toast.error('Delete failed'); }
  };

  // ── Stream CRUD ───────────────────────────────────────
  const openCreateStream = () => { setEditStream(null); setStreamForm(STREAM_BLANK); setShowStreamModal(true); };
  const openEditStream = (s) => {
    setEditStream(s);
    setStreamForm({
      ...STREAM_BLANK, ...s,
      scheduledAt: s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 16) : ''
    });
    setShowStreamModal(true);
  };
  const handleStreamSubmit = async (e) => {
    e.preventDefault(); setSavingStream(true);
    try {
      if (editStream) {
        await axios.put(`${API_URL}/api/tv/streams/${editStream._id}`, streamForm);
        toast.success('Stream updated');
      } else {
        await axios.post(`${API_URL}/api/tv/streams`, streamForm);
        toast.success('Stream created');
      }
      setShowStreamModal(false); loadStreams();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSavingStream(false);
  };
  const handleGoLive = async (id) => {
    try {
      await axios.post(`${API_URL}/api/tv/streams/${id}/go-live`);
      toast.success('🔴 You are now LIVE!'); loadStreams();
    } catch { toast.error('Failed to go live'); }
  };
  const handleEndStream = async (id) => {
    try {
      await axios.post(`${API_URL}/api/tv/streams/${id}/end`);
      toast.success('Stream ended'); loadStreams();
    } catch { toast.error('Failed to end stream'); }
  };
  const handleDeleteStream = async () => {
    try {
      await axios.delete(`${API_URL}/api/tv/streams/${deleteStreamId}`);
      toast.success('Deleted'); setDeleteStreamId(null); loadStreams();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>📺 Synagogue TV</h1>
        <p>Manage video content and live streams for your congregation</p>
      </div>

      {/* Tab switcher */}
      <div className="atv-tabs">
        <button className={`atv-tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>
          🎬 Video Content
        </button>
        <button className={`atv-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          🔴 Live Streams
          {streams.some(s => s.isLive) && <span className="atv-live-indicator" />}
        </button>
      </div>

      {/* ── VIDEO CONTENT TAB ───────────────────────────── */}
      {tab === 'content' && (
        <>
          <div className="admin-action-bar">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {content.length} video{content.length !== 1 ? 's' : ''} in your library
            </p>
            <button className="btn btn-primary" onClick={openCreateContent}>+ Add Video</button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thumbnail</th><th>Title</th><th>Category</th>
                  <th>Speaker</th><th>Date</th><th>Views</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : content.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No videos yet. Add your first!</td></tr>
                ) : content.map(item => (
                  <tr key={item._id}>
                    <td>
                      {item.thumbnailUrl
                        ? <img src={item.thumbnailUrl} alt="" className="thumb-sm" />
                        : <div className="thumb-sm" style={{ background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', borderRadius: '6px', fontSize: '1.1rem' }}>▶</div>
                      }
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                      {item.isPinned && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>📌</span>}
                      {item.featured && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>⭐</span>}
                    </td>
                    <td><span className={`badge cat-${item.category}`}>{item.category}</span></td>
                    <td>{item.speaker || '—'}</td>
                    <td>{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                    <td>👁 {item.views}</td>
                    <td>
                      <span className={`badge ${item.isPublished ? 'badge-success' : 'badge-muted'}`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-icon" onClick={() => openEditContent(item)}>✏️</button>
                        <button className="btn btn-danger btn-icon" onClick={() => setDeleteContentId(item._id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── LIVE STREAMS TAB ────────────────────────────── */}
      {tab === 'live' && (
        <>
          <div className="admin-action-bar">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Schedule and manage your live streams
            </p>
            <button className="btn btn-primary" onClick={openCreateStream}>+ New Stream</button>
          </div>

          <div className="atv-stream-list">
            {streamsLoading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : streams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <h3>No streams yet</h3>
                <p>Create a stream to go live with your congregation.</p>
              </div>
            ) : streams.map(s => (
              <div key={s._id} className={`atv-stream-card ${s.isLive ? 'stream-live' : ''}`}>
                <div className="atv-stream-status">
                  {s.isLive
                    ? <span className="atv-live-badge"><span className="live-dot pulse" /> LIVE</span>
                    : <span className="atv-scheduled-badge">Scheduled</span>
                  }
                </div>
                <div className="atv-stream-info">
                  <h3>{s.title}</h3>
                  {s.description && <p>{s.description}</p>}
                  {s.scheduledAt && <p className="atv-stream-time">📅 {format(new Date(s.scheduledAt), 'MMM dd, yyyy h:mm a')}</p>}
                  {s.streamUrl && (
                    <a href={s.streamUrl} target="_blank" rel="noreferrer" className="atv-stream-url">
                      🔗 {s.streamUrl.length > 50 ? s.streamUrl.slice(0, 50) + '…' : s.streamUrl}
                    </a>
                  )}
                </div>
                <div className="atv-stream-actions">
                  {!s.isLive
                    ? <button className="btn btn-primary" onClick={() => handleGoLive(s._id)}>🔴 Go Live</button>
                    : <button className="btn btn-danger" onClick={() => handleEndStream(s._id)}>⏹ End Stream</button>
                  }
                  <button className="btn btn-secondary btn-icon" onClick={() => openEditStream(s)}>✏️</button>
                  <button className="btn btn-danger btn-icon" onClick={() => setDeleteStreamId(s._id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ADD/EDIT CONTENT MODAL ────────────────────── */}
      {showContentModal && (
        <div className="modal-overlay" onClick={() => setShowContentModal(false)}>
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editContent ? 'Edit Video' : 'Add Video to Synagogue TV'}</h2>
              <button className="modal-close" onClick={() => setShowContentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleContentSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group form-span-2">
                  <label>Title *</label>
                  <input required className="form-input" value={contentForm.title}
                    onChange={e => setContentForm({ ...contentForm, title: e.target.value })} placeholder="e.g. The Power of Faith" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={contentForm.category}
                    onChange={e => setContentForm({ ...contentForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Speaker / Host</label>
                  <input className="form-input" value={contentForm.speaker}
                    onChange={e => setContentForm({ ...contentForm, speaker: e.target.value })} placeholder="e.g. Pastor John" />
                </div>
                <div className="form-group form-span-2">
                  <label>Video File <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(or paste a URL below)</span></label>
                  <div className="upload-zone" onClick={() => videoRef.current?.click()} style={{ cursor: 'pointer' }}>
                    <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
                      onChange={e => { setVideoFile(e.target.files[0]); setContentForm({ ...contentForm, videoUrl: '' }); }} />
                    {videoFile
                      ? <span>🎬 {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      : <span>📁 Click to upload video (MP4, MOV, AVI, MKV, WebM — max 500 MB)</span>}
                  </div>
                  <input className="form-input" style={{ marginTop: '0.5rem' }} value={contentForm.videoUrl}
                    onChange={e => { setContentForm({ ...contentForm, videoUrl: e.target.value }); if (e.target.value) setVideoFile(null); }}
                    placeholder="— or paste YouTube / Vimeo / direct video URL" />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', height: '8px' }}>
                        <div style={{ width: `${uploadProgress}%`, background: 'var(--gold)', height: '100%', transition: 'width 0.3s' }} />
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Uploading… {uploadProgress}%</small>
                    </div>
                  )}
                </div>
                <div className="form-group form-span-2">
                  <label>Thumbnail Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(or paste a URL below)</span></label>
                  <div className="upload-zone" onClick={() => thumbRef.current?.click()} style={{ cursor: 'pointer' }}>
                    <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { setThumbFile(e.target.files[0]); setContentForm({ ...contentForm, thumbnailUrl: '' }); }} />
                    {thumbFile
                      ? <span>🖼️ {thumbFile.name}</span>
                      : <span>📁 Click to upload thumbnail image</span>}
                  </div>
                  <input className="form-input" style={{ marginTop: '0.5rem' }} value={contentForm.thumbnailUrl}
                    onChange={e => { setContentForm({ ...contentForm, thumbnailUrl: e.target.value }); if (e.target.value) setThumbFile(null); }}
                    placeholder="— or paste image URL" />
                </div>
                <div className="form-group form-span-2">
                  <label>Description</label>
                  <textarea className="form-input" rows={3} value={contentForm.description}
                    onChange={e => setContentForm({ ...contentForm, description: e.target.value })}
                    placeholder="Brief description of the content..." />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-input" value={contentForm.date}
                    onChange={e => setContentForm({ ...contentForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input type="number" className="form-input" value={contentForm.duration}
                    onChange={e => setContentForm({ ...contentForm, duration: e.target.value })}
                    placeholder="e.g. 3600 for 1 hour" />
                </div>
                <div className="form-group form-span-2">
                  <label>Tags (comma separated)</label>
                  <input className="form-input" value={contentForm.tags}
                    onChange={e => setContentForm({ ...contentForm, tags: e.target.value })}
                    placeholder="faith, prayer, worship" />
                </div>
                <div className="form-group form-span-2">
                  <div className="form-checkboxes">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={contentForm.isPublished}
                        onChange={e => setContentForm({ ...contentForm, isPublished: e.target.checked })} />
                      Published (visible to public)
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={contentForm.featured}
                        onChange={e => setContentForm({ ...contentForm, featured: e.target.checked })} />
                      Featured ⭐
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={contentForm.isPinned}
                        onChange={e => setContentForm({ ...contentForm, isPinned: e.target.checked })} />
                      Pinned to top 📌
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowContentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingContent}>
                  {savingContent ? 'Saving...' : editContent ? 'Save Changes' : 'Add to TV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT STREAM MODAL ─────────────────────── */}
      {showStreamModal && (
        <div className="modal-overlay" onClick={() => setShowStreamModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editStream ? 'Edit Stream' : 'Create Live Stream'}</h2>
              <button className="modal-close" onClick={() => setShowStreamModal(false)}>✕</button>
            </div>
            <form onSubmit={handleStreamSubmit} className="modal-form">
              <div className="form-group">
                <label>Stream Title *</label>
                <input required className="form-input" value={streamForm.title}
                  onChange={e => setStreamForm({ ...streamForm, title: e.target.value })}
                  placeholder="e.g. Sunday Morning Service" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows={2} value={streamForm.description}
                  onChange={e => setStreamForm({ ...streamForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Stream URL</label>
                <input className="form-input" value={streamForm.streamUrl}
                  onChange={e => setStreamForm({ ...streamForm, streamUrl: e.target.value })}
                  placeholder="YouTube Live URL, Zoom link, etc." />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Paste your YouTube Live or streaming platform URL here
                </small>
              </div>
              <div className="form-group">
                <label>Chat / Interaction URL (optional)</label>
                <input className="form-input" value={streamForm.chatUrl}
                  onChange={e => setStreamForm({ ...streamForm, chatUrl: e.target.value })}
                  placeholder="YouTube chat embed or other chat URL" />
              </div>
              <div className="form-group">
                <label>Thumbnail URL (optional)</label>
                <input className="form-input" value={streamForm.thumbnailUrl}
                  onChange={e => setStreamForm({ ...streamForm, thumbnailUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Scheduled Date & Time</label>
                <input type="datetime-local" className="form-input" value={streamForm.scheduledAt}
                  onChange={e => setStreamForm({ ...streamForm, scheduledAt: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStreamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingStream}>
                  {savingStream ? 'Saving...' : editStream ? 'Save Changes' : 'Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONTENT CONFIRM ────────────────────── */}
      {deleteContentId && (
        <div className="modal-overlay" onClick={() => setDeleteContentId(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Video?</h2></div>
            <p style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>This will permanently remove this video from Synagogue TV.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteContentId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteContent}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE STREAM CONFIRM ─────────────────────── */}
      {deleteStreamId && (
        <div className="modal-overlay" onClick={() => setDeleteStreamId(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Stream?</h2></div>
            <p style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>This will permanently delete this stream.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteStreamId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteStream}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
