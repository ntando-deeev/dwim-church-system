import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import './ChurchesPage.css';

export default function ChurchesPage() {
  const [churches, setChurches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => fetchChurches(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/churches`, { params: { search, limit: 24 } });
      setChurches(data.churches || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="churches-page">
      {/* Hero */}
      <div className="churches-hero">
        <div className="container">
          <h1>⛪ Church Channels</h1>
          <p>Discover worship communities on Dwim TV. Every church has their own channel — sermons, worship, events, and more.</p>
          <div className="churches-search-wrap">
            <input
              className="churches-search"
              type="text"
              placeholder="Search churches by name, city, country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link to="/churches/register" className="btn btn-primary churches-register-btn">
            📋 Register Your Church — $5 via EcoCash
          </Link>
        </div>
      </div>

      <div className="container churches-content">
        {loading ? (
          <div className="churches-loading">
            {[...Array(8)].map((_, i) => <div key={i} className="church-card-skeleton" />)}
          </div>
        ) : churches.length === 0 ? (
          <div className="churches-empty">
            <div className="churches-empty-icon">⛪</div>
            <h3>No churches found</h3>
            <p>{search ? 'Try a different search term.' : 'Be the first to register your church on Dwim TV!'}</p>
            <Link to="/churches/register" className="btn btn-primary">Register Your Church</Link>
          </div>
        ) : (
          <>
            <div className="churches-count">{total} church{total !== 1 ? 'es' : ''} on Dwim TV</div>
            <div className="churches-grid">
              {churches.map(church => (
                <Link key={church._id} to={`/churches/${church.slug}`} className="church-card">
                  <div className="church-card-cover" style={church.coverImage ? { backgroundImage: `url(${church.coverImage})` } : {}}>
                    <div className="church-card-logo-wrap">
                      {church.logo
                        ? <img src={church.logo} alt={church.name} className="church-card-logo" />
                        : <div className="church-card-logo-placeholder">✝</div>
                      }
                    </div>
                  </div>
                  <div className="church-card-body">
                    <h3 className="church-card-name">{church.name}</h3>
                    {(church.city || church.country) && (
                      <div className="church-card-location">📍 {[church.city, church.country].filter(Boolean).join(', ')}</div>
                    )}
                    {church.description && (
                      <p className="church-card-desc">{church.description.slice(0, 100)}{church.description.length > 100 ? '…' : ''}</p>
                    )}
                    <div className="church-card-stats">
                      <span>👁 {church.viewCount || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
