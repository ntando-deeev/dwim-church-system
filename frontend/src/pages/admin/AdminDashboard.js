import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import './Admin.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/dashboard/stats`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const { stats, recentMedia, upcomingEvents, latestSermons, activeAnnouncements } = data;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welcome to the DWIM Admin Panel</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#1a2f4a', link: '/admin/users' },
          { label: 'Total Media', value: stats.totalMedia, icon: '🎬', color: '#c9a84c', link: '/admin/media' },
          { label: 'Videos', value: stats.videoCount, icon: '📹', color: '#7c3aed', link: '/admin/media' },
          { label: 'Images', value: stats.imageCount, icon: '🖼️', color: '#059669', link: '/admin/media' },
          { label: 'Events', value: stats.totalEvents, icon: '📅', color: '#dc2626', link: '/admin/events' },
          { label: 'Sermons', value: stats.totalSermons, icon: '📖', color: '#0891b2', link: '/admin/sermons' },
          { label: 'Announcements', value: stats.totalAnnouncements, icon: '📢', color: '#d97706', link: '/admin/announcements' },
          { label: 'Total Views', value: stats.totalViews, icon: '👁', color: '#6366f1', link: '/admin/media' },
        ].map(s => (
          <Link key={s.label} to={s.link} className="stat-card" style={{ '--accent': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value?.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-cols">
        {/* Recent Media */}
        <div className="dash-col">
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Recent Media</h3>
              <Link to="/admin/media" className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'0.3rem 0.75rem'}}>View All</Link>
            </div>
            <div className="dash-media-list">
              {recentMedia.map(m => (
                <div key={m._id} className="dash-media-item">
                  {m.url && m.type === 'image' ? (
                    <div className="dmi-thumb" style={{ backgroundImage: `url(${m.url})` }} />
                  ) : (
                    <div className="dmi-thumb dmi-video">{m.type === 'video' ? '🎬' : '📄'}</div>
                  )}
                  <div className="dmi-info">
                    <div className="dmi-title">{m.title}</div>
                    <div className="dmi-meta">{m.type} · {m.uploadedBy?.name}</div>
                  </div>
                  <span className={`badge badge-${m.type === 'video' ? 'navy' : m.type === 'poster' ? 'gold' : 'green'}`}>{m.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="dash-col">
          {/* Upcoming Events */}
          <div className="dash-card" style={{marginBottom:'1.5rem'}}>
            <div className="dash-card-header">
              <h3>Upcoming Events</h3>
              <Link to="/admin/events" className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'0.3rem 0.75rem'}}>Manage</Link>
            </div>
            {upcomingEvents.length === 0 ? <p className="dash-empty">No upcoming events</p> : upcomingEvents.map(e => (
              <div key={e._id} className="dash-event-item">
                <div className="dei-date">
                  <div className="dei-month">{format(new Date(e.startDate), 'MMM')}</div>
                  <div className="dei-day">{format(new Date(e.startDate), 'dd')}</div>
                </div>
                <div className="dei-info">
                  <div className="dei-title">{e.title}</div>
                  <div className="dei-meta">{e.location} · {format(new Date(e.startDate), 'h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Latest Sermons */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Latest Sermons</h3>
              <Link to="/admin/sermons" className="btn btn-secondary" style={{fontSize:'0.75rem',padding:'0.3rem 0.75rem'}}>Manage</Link>
            </div>
            {latestSermons.map(s => (
              <div key={s._id} className="dash-sermon-item">
                <span className="dsi-icon">📖</span>
                <div>
                  <div className="dsi-title">{s.title}</div>
                  <div className="dsi-meta">{s.speaker} · {s.views} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
