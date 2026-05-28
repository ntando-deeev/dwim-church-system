import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL, useAuth } from '../context/AuthContext';
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


function authCfg(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}


// Watch Party Chat
function WatchPartyChat({ contentId, streamId, token, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const endpoint = streamId
    ? `${API_URL}/api/tv/streams/${streamId}/comments`
    : `${API_URL}/api/tv/content/${contentId}/comments`;

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(endpoint);
      const sorted = streamId ? data.comments : [...data.comments].reverse();
      setComments(sorted);
    } catch {}
    setLoading(false);
  }, [endpoint, streamId]);

  useEffect(() => {
    load();
    const ms = streamId ? 5000 : 15000;
    pollRef.current = setInterval(load, ms);
    return () => clearInterval(pollRef.current);
  }, [load, streamId]);

  useEffect(() => {
    if (streamId) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, streamId]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim() || !token) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(endpoint, { text }, authCfg(token));
      setComments(prev => streamId ? [...prev, data.comment] : [data.comment, ...prev]);
      setText('');
    } catch {}
    setSubmitting(false);
  };

  const like = async id => {
    if (!token) return;
    try {
      const { data } = await axios.patch(`${API_URL}/api/tv/comments/${id}/like`, {}, authCfg(token));
      setComments(cs => cs.map(c => c._id === id ? { ...c, likeCount: data.likeCount } : c));
    } catch {}
  };

  const del = async id => {
    try {
      await axios.delete(`${API_URL}/api/tv/comments/${id}`, authCfg(token));
      setComments(cs => cs.filter(c => c._id !== id));
    } catch {}
  };

  return (
    <div className={`stv-chat ${streamId ? 'stv-chat-live' : ''}`}>
      <div className="stv-chat-header">
        {streamId
          ? <><span className="live-dot pulse" /> Live Chat</>
          : <>&#x1F4AC; Watch Party ({comments.length})</>
        }
      </div>
      <div className="stv-chat-messages">
        {loading ? (
          <div className="stv-chat-empty">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="stv-chat-empty">
            {token ? 'Be the first to comment!' : 'Sign in to join the discussion.'}
          </div>
        ) : (
          comments.map(c => (
            <div key={c._id} className={`stv-chat-msg ${user && c.author?._id === user._id ? 'own' : ''}`}>
              <div className="stv-chat-avatar">
                {c.author?.avatar
                  ? <img src={c.author.avatar} alt={c.author.name} />
                  : <span>{(c.author?.name || '?').charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="stv-chat-bubble">
                <div className="stv-chat-name">{c.author?.name || 'Member'}</div>
                <div className="stv-chat-text">{c.text}</div>
                <div className="stv-chat-actions">
                  <button className="stv-chat-like" onClick={() => like(c._id)}>
                    {c.likeCount > 0 ? `❤️ ${c.likeCount}` : '❤️'}
                  </button>
                  {user && (user._id === c.author?._id || user.role === 'admin') && (
                    <button className="stv-chat-del" onClick={() => del(c._id)}>x</button>
                  )}
                  <span className="stv-chat-time">{format(new Date(c.createdAt), 'HH:mm')}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {token ? (
        <form className="stv-chat-form" onSubmit={send}>
          <input
            className="stv-chat-input"
            placeholder={streamId ? 'Say something...' : 'Add a comment...'}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
          <button type="submit" className="stv-chat-send" disabled={submitting || !text.trim()}>
            {streamId ? 'Send' : 'Post'}
          </button>
        </form>
      ) : (
        <div className="stv-chat-signin">
          <a href="/signup">Sign up free</a> or <a href="/login">sign in</a> to comment.
        </div>
      )}
    </div>
  );
}

// Watchlist Bookmark Button
function WatchlistBtn({ itemId, token, initialSaved }) {
  const [saved, setSaved] = useState(!!initialSaved);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSaved(!!initialSaved); }, [initialSaved]);

  const toggle = async e => {
    e.stopPropagation();
    if (!token) { window.location.href = '/signup'; return; }
    setBusy(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/tv/watchlist/${itemId}`, {}, authCfg(token));
      setSaved(data.saved);
    } catch {}
    setBusy(false);
  };

  return (
    <button
      className={`stv-watchlist-btn ${saved ? 'saved' : ''}`}
      onClick={toggle}
      disabled={busy}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      &#x1F516; <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}

export default function SynagogueTV() {
  const { user, token } = useAuth();
  const [live, setLive] = useState(null);
  const [content, setContent] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playing, setPlaying] = useState(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/tv/live`).then(r => setLive(r.data.stream)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/tv/watchlist`, authCfg(token))
      .then(r => setWatchlistIds(r.data.watchlist.map(w => w._id || w)))
      .catch(() => {});
  }, [token]);

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

  const loadWatchlist = async () => {
    if (!token) { window.location.href = '/signup'; return; }
    setWatchlistLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/tv/watchlist`, authCfg(token));
      setWatchlistItems(data.watchlist);
      setWatchlistIds(data.watchlist.map(w => w._id));
    } catch {}
    setWatchlistLoading(false);
    setShowWatchlist(true);
  };

  const handlePlay = item => {
    setPlaying(item);
    setShowWatchlist(false);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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
          {token
            ? <button className="stv-hero-watchlist-btn" onClick={loadWatchlist}>&#x1F516; My Watchlist</button>
            : <a href="/signup" className="stv-hero-watchlist-btn">&#x1F381; Sign Up Free to Save Videos</a>
          }
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
            <button className="btn btn-primary stv-watch-live" onClick={() => handlePlay({ ...live, videoUrl: live.streamUrl, _isLiveStream: true, _streamId: live._id })}>
              ▶ Watch Live
            </button>
          </div>
        )}

        {/* VIDEO PLAYER + WATCH PARTY CHAT */}
        {playing && (
          <div className="stv-player-section" ref={playerRef}>
            <div className="stv-player-with-chat">
              <div className="stv-player-col">
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
                      <div className="stv-no-video-icon">&#x1F4FA;</div>
                      <p>No playable video source available.</p>
                    </div>
                  )}
                </div>
                <div className="stv-player-meta">
                  <div className="stv-player-info">
                    <span className={`stv-cat-badge cat-${playing.category}`}>{playing.category}</span>
                    <h2>{playing.title}</h2>
                    {playing.speaker && <p className="stv-meta-speaker">&#x1F464; {playing.speaker}</p>}
                    {playing.description && <p className="stv-meta-desc">{playing.description}</p>}
                    {playing.date && <p className="stv-meta-date">&#x1F4C5; {format(new Date(playing.date), 'MMMM dd, yyyy')}</p>}
                  </div>
                  <div className="stv-player-btns">
                    {!playing._isLiveStream && (
                      <WatchlistBtn itemId={playing._id} token={token} initialSaved={watchlistIds.includes(playing._id)} />
                    )}
                    <button className="btn btn-secondary" onClick={() => setPlaying(null)}>x Close</button>
                  </div>
                </div>
              </div>
              <WatchPartyChat
                contentId={!playing._isLiveStream ? playing._id : undefined}
                streamId={playing._isLiveStream ? playing._streamId : undefined}
                token={token}
                user={user}
              />
            </div>
          </div>
        )}

        {/* WATCHLIST PANEL */}
        {showWatchlist && (
          <div className="stv-watchlist-panel">
            <div className="stv-watchlist-header">
              <h2>&#x1F516; My Watchlist</h2>
              <button className="stv-close-btn" onClick={() => setShowWatchlist(false)}>x Close</button>
            </div>
            {watchlistLoading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : watchlistItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#x1F516;</div>
                <h3>Your watchlist is empty</h3>
                <p>Click the bookmark icon on any video card to save it here.</p>
              </div>
            ) : (
              <div className="stv-grid">
                {watchlistItems.map(item => (
                  <div key={item._id} className="stv-card" onClick={() => handlePlay(item)}>
                    <div className="stv-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                      <div className="stv-play-overlay"><div className="stv-play-btn">&#x25BA;</div></div>
                      <span className={`stv-cat-badge stv-badge-over cat-${item.category}`}>{item.category}</span>
                      {item.duration > 0 && <span className="stv-duration">{formatDuration(item.duration)}</span>}
                    </div>
                    <div className="stv-card-body">
                      <h3 className="stv-card-title">{item.title}</h3>
                      {item.speaker && <p className="stv-card-speaker">&#x1F464; {item.speaker}</p>}
                      <div className="stv-card-footer">
                        <span className="stv-card-date">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                        <span className="stv-card-views">&#x1F441; {item.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    {item.isPinned && <span className="stv-pinned-badge">&#x1F4CC;</span>}
                    {token && (
                      <div className="stv-card-bookmark" onClick={e => e.stopPropagation()}>
                        <WatchlistBtn itemId={item._id} token={token} initialSaved={watchlistIds.includes(item._id)} />
                      </div>
                    )}
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
