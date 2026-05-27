import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../context/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const [data, setData] = useState({ events: [], sermons: [], announcements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/events?upcoming=true&limit=3`),
      axios.get(`${API_URL}/api/sermons?limit=3&featured=true`),
      axios.get(`${API_URL}/api/announcements?limit=3&pinned=true`),
    ]).then(([events, sermons, announcements]) => {
      setData({
        events: events.data.events,
        sermons: sermons.data.sermons,
        announcements: announcements.data.announcements,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-badge">🙏 Welcome to DWIM</div>
          <h1 className="hero-title">
            Destiny Word<br />
            <span className="gold-text">International</span><br />
            Ministries
          </h1>
          <p className="hero-desc">
            Building lives through the transforming power of God's Word. Join our community of faith, hope, and love.
          </p>
          <div className="hero-actions">
            <Link to="/sermons" className="btn btn-primary hero-btn">Watch Sermons</Link>
            <Link to="/events" className="btn btn-ghost hero-btn">Upcoming Events</Link>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <div className="scroll-dot" />
        </div>
      </section>

      {/* Service Times */}
      <section className="service-times">
        <div className="container">
          <div className="times-grid">
            {[
              { day: 'Sunday', time: '9:00 AM & 11:00 AM', icon: '☀️', label: 'Sunday Service' },
              { day: 'Wednesday', time: '7:00 PM', icon: '📖', label: 'Midweek Bible Study' },
              { day: 'Friday', time: '6:00 PM', icon: '🙏', label: 'Prayer & Fasting' },
            ].map(s => (
              <div key={s.day} className="time-card">
                <span className="time-icon">{s.icon}</span>
                <div>
                  <div className="time-label">{s.label}</div>
                  <div className="time-day">{s.day}</div>
                  <div className="time-time">{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <section className="section-padded">
          <div className="container">
            <div className="section-header">
              <h2>Latest Announcements</h2>
              <div className="divider-gold" />
            </div>
            <div className="announcements-strip">
              {data.announcements.map(a => (
                <div key={a._id} className={`ann-card ann-${a.type}`}>
                  {a.isPinned && <span className="ann-pin">📌 Pinned</span>}
                  <h3>{a.title}</h3>
                  <p>{a.content.slice(0, 120)}{a.content.length > 120 ? '...' : ''}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/announcements" className="btn btn-secondary">View All Announcements</Link>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="section-padded bg-dark">
        <div className="container">
          <div className="section-header light">
            <h2>Upcoming Events</h2>
            <div className="divider-gold" />
            <p>Don't miss what God is doing at DWIM</p>
          </div>
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : data.events.length > 0 ? (
            <div className="events-grid">
              {data.events.map(event => (
                <div key={event._id} className="event-card">
                  {event.posterUrl && <div className="event-img" style={{ backgroundImage: `url(${event.posterUrl})` }} />}
                  <div className="event-body">
                    <span className="badge badge-gold">{event.category}</span>
                    <h3>{event.title}</h3>
                    <p className="event-date">
                      📅 {format(new Date(event.startDate), 'MMM dd, yyyy')} — {format(new Date(event.startDate), 'h:mm a')}
                    </p>
                    <p className="event-location">📍 {event.location}</p>
                    <p className="event-desc">{event.description.slice(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{textAlign:'center',color:'rgba(255,255,255,0.5)'}}>No upcoming events at this time.</p>
          )}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/events" className="btn btn-secondary">View All Events</Link>
          </div>
        </div>
      </section>

      {/* Featured Sermons */}
      <section className="section-padded">
        <div className="container">
          <div className="section-header">
            <h2>Featured Sermons</h2>
            <div className="divider-gold" />
            <p>Be transformed by the Word of God</p>
          </div>
          {data.sermons.length > 0 ? (
            <div className="sermons-grid">
              {data.sermons.map(sermon => (
                <Link key={sermon._id} to={`/sermons/${sermon._id}`} className="sermon-card">
                  <div className="sermon-thumb" style={sermon.thumbnailUrl ? { backgroundImage: `url(${sermon.thumbnailUrl})` } : {}}>
                    {!sermon.thumbnailUrl && <span className="sermon-play">▶</span>}
                    {sermon.thumbnailUrl && <span className="sermon-play-overlay">▶</span>}
                  </div>
                  <div className="sermon-body">
                    <span className="badge badge-gold">{format(new Date(sermon.date), 'MMM dd, yyyy')}</span>
                    <h3>{sermon.title}</h3>
                    <p className="sermon-speaker">👤 {sermon.speaker}</p>
                    {sermon.scripture && <p className="sermon-scripture">📜 {sermon.scripture}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !loading && <p style={{textAlign:'center',color:'var(--text-muted)'}}>No sermons yet.</p>
          )}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/sermons" className="btn btn-secondary">All Sermons</Link>
          </div>
        </div>
      </section>

      {/* Synagogue TV Banner */}
      <section className="section-padded stv-promo-section">
        <div className="container">
          <div className="stv-promo-box">
            <div className="stv-promo-icon">📺</div>
            <div className="stv-promo-content">
              <h2>Synagogue TV</h2>
              <p>Watch sermons, worship sessions, teachings, testimonies and live services — anytime, anywhere.</p>
            </div>
            <Link to="/tv" className="btn btn-primary stv-promo-btn">Watch Now</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>Join Our Community</h2>
            <p>Experience the love of God and the warmth of a faith community that cares for you.</p>
            <div className="cta-actions">
              <Link to="/events" className="btn btn-primary">Plan Your Visit</Link>
              <Link to="/gallery" className="btn btn-ghost">View Gallery</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
