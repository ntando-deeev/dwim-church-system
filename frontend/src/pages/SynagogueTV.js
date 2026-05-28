import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../context/AuthContext';
import './SynagogueTV.css';

const CATEGORIES = ['all', 'sermon', 'worship', 'prayer', 'teaching', 'testimony', 'event', 'other'];

function getEmbedUrl(url) {
  if (!url) return '';
  // YouTube watch links: youtube.com/watch?v=ID (with any extra params)
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?rel=0&autoplay=1`;
  // youtu.be short links
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?rel=0&autoplay=1`;
  // YouTube embed links (already correct)
  const ytEmbed = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytEmbed) return `https://www.youtube.com/embed/${ytEmbed[1]}?rel=0&autoplay=1`;
  // YouTube Live links: youtube.com/live/ID (strip query params)
  const ytLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}?autoplay=1`;
  // YouTube Shorts: youtube.com/shorts/ID
  const ytShorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}?rel=0&autoplay=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  // Cloudinary / direct video — handled by isDirectVideo, return as-is
  return url;
}

function isDirectVideo(url) {
  return url && (url.includes('cloudinary') || url.endsWith('.mp4') || url.endsWith('.webm'));
}

function formatDuration(secs) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SynagogueTV() {
  const [live, setLive] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playing, setPlaying] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/tv/live`).then(r => setLive(r.data.stream)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/tv/content`, {
          params: { page, limit: 12, category: activeCategory, search }
        });
        setContent(data.content);
        setTotalPages(data.pages);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [page, activeCategory, search]);

  const handlePlay = (item) => {
    setPlaying(item);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const embedUrl = playing ? getEmbedUrl(playing.videoUrl) : null;

  return (
    <div className="stv-page">
      {/* Hero */}
      <div className="stv-hero">
        <div className="stv-hero-bg" />
        <div className="container stv-hero-inner">
          <div className="stv-hero-badge">
            <span className="live-dot" />
            SYNAGOGUE TV
          </div>
          <h1>Watch. Listen. Be Transformed.</h1>
          <p>Sermons, worship sessions, teachings, and live services — all in one place.</p>
        </div>
      </div>

      <div className="container stv-body">

        {/* LIVE BANNER */}
        {live && (
          <div className="stv-live-banner">
            <div className="stv-live-label"><span className="live-dot pulse" />LIVE NOW</div>
            <div className="stv-live-info">
              <h2>{live.title}</h2>
              {live.description && <p>{live.description}</p>}
            </div>
            <button className="btn btn-primary stv-watch-live" onClick={() => setPlaying({ ...live, videoUrl: live.streamUrl })}>
              ▶ Watch Live
            </button>
          </div>
        )}

        {/* VIDEO PLAYER */}
        {playing && (
          <div className="stv-player-section" ref={playerRef}>
            <div className="stv-player-wrapper">
              {isDirectVideo(playing.videoUrl) ? (
                <video controls autoPlay className="stv-video-el" src={playing.videoUrl} />
              ) : embedUrl ? (
                <iframe
                  title={playing.title}
                  src={embedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="stv-iframe"
                />
              ) : (
                <div className="stv-no-video">
                  <div className="stv-no-video-icon">📺</div>
                  <p>No playable video source available.</p>
                </div>
              )}
            </div>
            <div className="stv-player-meta">
              <div className="stv-player-info">
                <span className={`stv-cat-badge cat-${playing.category}`}>{playing.category}</span>
                <h2>{playing.title}</h2>
                {playing.speaker && <p className="stv-meta-speaker">👤 {playing.speaker}</p>}
                {playing.description && <p className="stv-meta-desc">{playing.description}</p>}
                {playing.date && <p className="stv-meta-date">📅 {format(new Date(playing.date), 'MMMM dd, yyyy')}</p>}
              </div>
              <button className="btn btn-secondary" onClick={() => setPlaying(null)}>✕ Close Player</button>
            </div>
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div className="stv-controls">
          <div className="stv-search">
            <input
              className="form-input"
              placeholder="🔍 Search videos, speakers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="stv-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`stv-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat); setPage(1); }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* VIDEO GRID */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📺</div>
            <h3>No content yet</h3>
            <p>Check back soon for new videos.</p>
          </div>
        ) : (
          <>
            <div className="stv-grid">
              {content.map(item => (
                <div
                  key={item._id}
                  className={`stv-card ${playing?._id === item._id ? 'stv-card-active' : ''}`}
                  onClick={() => handlePlay(item)}
                >
                  <div className="stv-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                    <div className="stv-play-overlay">
                      <div className="stv-play-btn">▶</div>
                    </div>
                    <span className={`stv-cat-badge stv-badge-over cat-${item.category}`}>{item.category}</span>
                    {item.duration > 0 && <span className="stv-duration">{formatDuration(item.duration)}</span>}
                    {item.isPinned && <span className="stv-pinned-badge">📌</span>}
                  </div>
                  <div className="stv-card-body">
                    <h3 className="stv-card-title">{item.title}</h3>
                    {item.speaker && <p className="stv-card-speaker">👤 {item.speaker}</p>}
                    <div className="stv-card-footer">
                      <span className="stv-card-date">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                      <span className="stv-card-views">👁 {item.views}</span>
                    </div>
                  </div>
                </div>
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
