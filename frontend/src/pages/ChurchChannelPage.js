import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import './ChurchChannelPage.css';

const CATEGORIES = ['all', 'sermon', 'worship', 'prayer', 'teaching', 'testimony', 'event', 'other'];

function formatDuration(secs) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function StarDisplay({ avg, count }) {
  return (
    <span className="cc-stars">
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= Math.round(avg) ? '#facc15' : '#444' }}>★</span>
      ))}
      {count > 0 && <span className="cc-stars-count">({count})</span>}
    </span>
  );
}

export default function ChurchChannelPage() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  const [content, setContent] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState('videos'); // videos | playlists | about
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchChurch();
  }, [slug]);

  useEffect(() => {
    if (church) fetchContent();
  }, [church, category]);

  useEffect(() => {
    if (church && tab === 'playlists') fetchPlaylists();
  }, [church, tab]);

  const fetchChurch = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/churches/${slug}`);
      setChurch(data.church);
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  };

  const fetchContent = async () => {
    setContentLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/churches/${slug}/content`, {
        params: { category, limit: 24 }
      });
      setContent(data.content || []);
    } catch {}
    setContentLoading(false);
  };

  const fetchPlaylists = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/churches/${slug}/playlists`);
      setPlaylists(data.playlists || []);
    } catch {}
  };

  if (loading) return <div className="cc-loading"><div className="spinner" /></div>;
  if (notFound) return (
    <div className="cc-notfound">
      <div>⛪</div>
      <h2>Church not found</h2>
      <Link to="/churches" className="btn btn-primary">Browse Churches</Link>
    </div>
  );

  return (
    <div className="cc-page">
      {/* Cover */}
      <div className="cc-cover" style={church.coverImage ? { backgroundImage: `url(${church.coverImage})` } : {}}>
        <div className="cc-cover-overlay" />
      </div>

      {/* Header */}
      <div className="container cc-header">
        <div className="cc-logo-wrap">
          {church.logo
            ? <img src={church.logo} alt={church.name} className="cc-logo" />
            : <div className="cc-logo-placeholder">✝</div>
          }
        </div>
        <div className="cc-header-info">
          <h1 className="cc-name">{church.name}</h1>
          {(church.city || church.country) && (
            <div className="cc-location">📍 {[church.city, church.country].filter(Boolean).join(', ')}</div>
          )}
          <div className="cc-meta">
            <span>👁 {church.viewCount || 0} views</span>
            {church.website && <a href={church.website} target="_blank" rel="noopener noreferrer" className="cc-website">🌐 Website</a>}
          </div>
          <div className="cc-socials">
            {church.socialLinks?.facebook && <a href={church.socialLinks.facebook} target="_blank" rel="noopener noreferrer">📘</a>}
            {church.socialLinks?.youtube && <a href={church.socialLinks.youtube} target="_blank" rel="noopener noreferrer">📺</a>}
            {church.socialLinks?.instagram && <a href={church.socialLinks.instagram} target="_blank" rel="noopener noreferrer">📸</a>}
            {church.socialLinks?.whatsapp && <a href={church.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">💬</a>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cc-tabs-bar">
        <div className="container cc-tabs">
          {['videos', 'playlists', 'about'].map(t => (
            <button key={t} className={`cc-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="container cc-content">
        {/* Videos Tab */}
        {tab === 'videos' && (
          <>
            <div className="cc-cats">
              {CATEGORIES.map(c => (
                <button key={c} className={`cc-cat ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
            {contentLoading ? (
              <div className="cc-grid">{[...Array(8)].map((_, i) => <div key={i} className="cc-card-skeleton" />)}</div>
            ) : content.length === 0 ? (
              <div className="cc-empty">No videos in this category yet.</div>
            ) : (
              <div className="cc-grid">
                {content.map(item => (
                  <Link key={item._id} to={`/tv?v=${item._id}`} className="cc-card">
                    <div className="cc-card-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                      {!item.thumbnailUrl && <div className="cc-card-thumb-icon">▶</div>}
                      {item.duration > 0 && <span className="cc-card-dur">{formatDuration(item.duration)}</span>}
                    </div>
                    <div className="cc-card-body">
                      <div className="cc-card-title">{item.title}</div>
                      {item.speaker && <div className="cc-card-speaker">{item.speaker}</div>}
                      <div className="cc-card-meta">
                        <span>👁 {item.views || 0}</span>
                        {item.ratingAvg > 0 && <StarDisplay avg={item.ratingAvg} count={item.ratingCount} />}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Playlists Tab */}
        {tab === 'playlists' && (
          playlists.length === 0 ? (
            <div className="cc-empty">No playlists yet.</div>
          ) : (
            <div className="cc-playlists">
              {playlists.map(pl => (
                <Link key={pl._id} to={`/playlists/${pl._id}`} className="cc-playlist-card">
                  <div className="cc-playlist-thumb" style={pl.coverImage ? { backgroundImage: `url(${pl.coverImage})` } : {}}>
                    <span className="cc-playlist-count">{pl.items?.length || 0} videos</span>
                  </div>
                  <div className="cc-playlist-info">
                    <div className="cc-playlist-title">{pl.title}</div>
                    {pl.description && <div className="cc-playlist-desc">{pl.description}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* About Tab */}
        {tab === 'about' && (
          <div className="cc-about">
            {church.description && <p>{church.description}</p>}
            <div className="cc-about-details">
              {church.phone && <div><strong>📞 Phone:</strong> {church.phone}</div>}
              {church.email && <div><strong>✉️ Email:</strong> {church.email}</div>}
              {church.website && <div><strong>🌐 Website:</strong> <a href={church.website} target="_blank" rel="noopener noreferrer">{church.website}</a></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
