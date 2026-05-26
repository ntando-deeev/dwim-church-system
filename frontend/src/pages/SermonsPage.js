import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../context/AuthContext';
import './SermonsPage.css';

export default function SermonsPage() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/sermons`, { params: { page, limit: 12, search } });
        setSermons(data.sermons);
        setTotalPages(data.pages);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  return (
    <div className="sermons-page">
      <div className="page-hero">
        <div className="container">
          <h1>Sermons</h1>
          <p>Be transformed by the renewing of your mind</p>
        </div>
      </div>

      <div className="container page-body">
        <div className="search-bar">
          <input className="form-input" placeholder="🔍 Search sermons, speakers, scripture..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : sermons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No sermons found</h3>
            <p>Check back soon for new messages.</p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {sermons.map(sermon => (
                <Link key={sermon._id} to={`/sermons/${sermon._id}`} className="sermon-card-full">
                  <div className="sermon-thumb-full" style={sermon.thumbnailUrl ? { backgroundImage: `url(${sermon.thumbnailUrl})` } : {}}>
                    <div className="play-btn">▶</div>
                    <div className="sermon-views">👁 {sermon.views}</div>
                  </div>
                  <div className="sermon-info">
                    <span className="badge badge-gold">{format(new Date(sermon.date), 'MMM dd, yyyy')}</span>
                    <h3>{sermon.title}</h3>
                    <p className="s-speaker">👤 {sermon.speaker}</p>
                    {sermon.scripture && <p className="s-scripture">📜 {sermon.scripture}</p>}
                    {sermon.series && <p className="s-series">📚 Series: {sermon.series}</p>}
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>{page} / {totalPages}</span>
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
