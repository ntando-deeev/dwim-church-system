import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../context/AuthContext';
import './SermonsPage.css';
import './AnnouncementsPage.css';

const typeColors = { general: 'badge-navy', urgent: 'badge-red', event: 'badge-gold', prayer: '', giving: 'badge-green' };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/announcements?limit=50`)
      .then(r => setAnnouncements(r.data.announcements))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="sermons-page">
      <div className="page-hero">
        <div className="container">
          <h1>Announcements</h1>
          <p>Stay informed about what's happening at DWIM</p>
        </div>
      </div>
      <div className="container page-body">
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : announcements.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📢</div><h3>No announcements</h3></div>
        ) : (
          <div className="ann-list">
            {announcements.map(ann => (
              <div key={ann._id} className={`ann-item ${ann.type}`}>
                {ann.imageUrl && <img src={ann.imageUrl} alt={ann.title} className="ann-img" />}
                <div className="ann-item-body">
                  <div className="ann-item-header">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {ann.isPinned && <span className="badge badge-gold">📌 Pinned</span>}
                      <span className={`badge ${typeColors[ann.type] || 'badge-navy'}`}>{ann.type}</span>
                    </div>
                    <span className="ann-date">{format(new Date(ann.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <h2>{ann.title}</h2>
                  <p>{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
