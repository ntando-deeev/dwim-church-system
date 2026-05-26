import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../context/AuthContext';
import './SermonsPage.css';
import './EventsPage.css';

const CATEGORIES = ['all', 'service', 'conference', 'prayer', 'youth', 'women', 'men', 'outreach', 'special'];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [upcoming, setUpcoming] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit: 20 };
        if (category !== 'all') params.category = category;
        if (upcoming) params.upcoming = 'true';
        const { data } = await axios.get(`${API_URL}/api/events`, { params });
        setEvents(data.events);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [category, upcoming]);

  return (
    <div className="sermons-page">
      <div className="page-hero">
        <div className="container">
          <h1>Events</h1>
          <p>Stay connected with what God is doing in our community</p>
        </div>
      </div>

      <div className="container page-body">
        <div className="events-filters">
          <div className="filter-tabs">
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <label className="toggle-label">
            <input type="checkbox" checked={upcoming} onChange={e => setUpcoming(e.target.checked)} />
            Upcoming only
          </label>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><h3>No events found</h3></div>
        ) : (
          <div className="events-list">
            {events.map(event => (
              <div key={event._id} className="event-list-card">
                {event.posterUrl && (
                  <div className="elc-poster" style={{ backgroundImage: `url(${event.posterUrl})` }} />
                )}
                <div className="elc-body">
                  <div className="elc-date-box">
                    <div className="elc-month">{format(new Date(event.startDate), 'MMM')}</div>
                    <div className="elc-day">{format(new Date(event.startDate), 'dd')}</div>
                  </div>
                  <div className="elc-info">
                    <span className={`badge badge-gold`}>{event.category}</span>
                    <h3>{event.title}</h3>
                    <p className="elc-time">🕐 {format(new Date(event.startDate), 'EEEE, MMMM dd, yyyy — h:mm a')}</p>
                    <p className="elc-location">📍 {event.location}</p>
                    <p className="elc-desc">{event.description}</p>
                    {event.registrationRequired && event.registrationLink && (
                      <a href={event.registrationLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{marginTop:'0.75rem',fontSize:'0.8rem',padding:'0.4rem 1rem'}}>
                        Register Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
