import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL, useAuth } from '../context/AuthContext';
import './DwimTV.css';

// ─── Star Rating Component ─────────────────────────────────────────────────
function StarRating({ contentId, token }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/api/ratings/${contentId}`)
      .then(({ data }) => { setAvg(data.avg); setCount(data.count); })
      .catch(() => {});
    if (token) {
      axios.get(`${API_URL}/api/ratings/${contentId}/mine`, authCfg(token))
        .then(({ data }) => setSelected(data.stars))
        .catch(() => {});
    }
  }, [contentId, token]);

  const rate = async (stars) => {
    if (!token) return;
    try {
      const { data } = await axios.post(`${API_URL}/api/ratings/${contentId}`, { stars }, authCfg(token));
      setSelected(stars);
      setAvg(data.avg);
      setCount(data.count);
    } catch {}
  };

  const display = hovered || selected;
  return (
    <div className="dtv-rating">
      <div className="dtv-stars">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            className={`dtv-star ${s <= display ? 'filled' : ''}`}
            onMouseEnter={() => token && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => rate(s)}
            title={token ? `Rate ${s} star${s > 1 ? 's' : ''}` : 'Sign in to rate'}
          >★</button>
        ))}
      </div>
      {count > 0 && <span className="dtv-rating-info">{avg} ({count} rating{count !== 1 ? 's' : ''})</span>}
    </div>
  );
}

// ─── Continue Watching Bar ─────────────────────────────────────────────────
function ContinueWatching({ token, onSelect }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/api/watch-history/continue`, authCfg(token))
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {});
  }, [token]);

  if (!token || items.length === 0) return null;
  return (
    <div className="dtv-continue">
      <div className="dtv-section-label">▶ Continue Watching</div>
      <div className="dtv-continue-list">
        {items.map(item => {
          const pct = item.content.duration > 0 ? Math.round((item.progressSeconds / item.content.duration) * 100) : 0;
          return (
            <div key={item._id} className="dtv-continue-card" onClick={() => onSelect(item.content, item.progressSeconds)}>
              <div className="dtv-continue-thumb" style={item.content.thumbnailUrl ? { backgroundImage: `url(${item.content.thumbnailUrl})` } : {}}>
                <span className="dtv-continue-play">▶</span>
                <div className="dtv-continue-bar"><div style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="dtv-continue-title">{item.content.title}</div>
              <div className="dtv-continue-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className={`dtv-chat ${streamId ? 'dtv-chat-live' : ''}`}>
      <div className="dtv-chat-header">
        {streamId
          ? <><span className="live-dot pulse" /> Live Chat</>
          : <>&#x1F4AC; Watch Party ({comments.length})</>
        }
      </div>
      <div className="dtv-chat-messages">
        {loading ? (
          <div className="dtv-chat-empty">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="dtv-chat-empty">
            {token ? 'Be the first to comment!' : 'Sign in to join the discussion.'}
          </div>
        ) : (
          comments.map(c => (
            <div key={c._id} className={`dtv-chat-msg ${user && c.author?._id === user._id ? 'own' : ''}`}>
              <div className="dtv-chat-avatar">
                {c.author?.avatar
                  ? <img src={c.author.avatar} alt={c.author.name} />
                  : <span>{(c.author?.name || '?').charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="dtv-chat-bubble">
                <div className="dtv-chat-name">{c.author?.name || 'Member'}</div>
                <div className="dtv-chat-text">{c.text}</div>
                <div className="dtv-chat-actions">
                  <button className="dtv-chat-like" onClick={() => like(c._id)}>
                    {c.likeCount > 0 ? `❤️ ${c.likeCount}` : '❤️'}
                  </button>
                  {user && (user._id === c.author?._id || user.role === 'admin') && (
                    <button className="dtv-chat-del" onClick={() => del(c._id)}>x</button>
                  )}
                  <span className="dtv-chat-time">{format(new Date(c.createdAt), 'HH:mm')}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {token ? (
        <form className="dtv-chat-form" onSubmit={send}>
          <input
            className="dtv-chat-input"
            placeholder={streamId ? 'Say something...' : 'Add a comment...'}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
          <button type="submit" className="dtv-chat-send" disabled={submitting || !text.trim()}>
            {streamId ? 'Send' : 'Post'}
          </button>
        </form>
      ) : (
        <div className="dtv-chat-signin">
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
      className={`dtv-watchlist-btn ${saved ? 'saved' : ''}`}
      onClick={toggle}
      disabled={busy}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      &#x1F516; <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}

export default function DwimTV() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [subtitles, setSubtitles] = useState([]);
  const [resumeFrom, setResumeFrom] = useState(0);
  const playerRef = useRef(null);
  const progressRef = useRef(null);

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

  const saveProgress = useCallback((contentId, progress, duration) => {
    if (!token || !contentId || progress < 5) return;
    axios.post(`${API_URL}/api/watch-history/${contentId}`, { progressSeconds: Math.round(progress), durationSeconds: Math.round(duration) }, authCfg(token)).catch(() => {});
  }, [token]);

  const handlePlay = useCallback((item, resumeSecs = 0) => {
    setPlaying(item);
    setResumeFrom(resumeSecs);
    setShowWatchlist(false);
    setSubtitles([]);
    if (item._id) {
      axios.get(`${API_URL}/api/tv/content/${item._id}/subtitles`)
        .then(({ data }) => setSubtitles(data.subtitles || []))
        .catch(() => {});
      if (token) {
        axios.post(`${API_URL}/api/watch-history/${item._id}`, { progressSeconds: resumeSecs, durationSeconds: item.duration || 0 }, authCfg(token)).catch(() => {});
      }
    }
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [token]);

  // Load content from URL param — after handlePlay is defined
  useEffect(() => {
    const vid = searchParams.get('v');
    if (vid) {
      axios.get(`${API_URL}/api/tv/content/${vid}`)
        .then(({ data }) => handlePlay(data.content))
        .catch(() => {});
    }
  }, [handlePlay]);
    try {
      const { data } = await axios.get(`${API_URL}/api/tv/content/${item._id}/download`);
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.title || 'video';
      a.target = '_blank';
      a.click();
    } catch {
      alert('Download not available for this content.');
    }
  };

  const embedUrl = playing ? getEmbedUrl(playing.videoUrl) : null;

  return (
    <div className="dtv-page">
      {/* Hero */}
      <div className="dtv-hero">
        <div className="dtv-hero-bg" />
        <div className="container dtv-hero-inner">
          <div className="dtv-hero-badge">
            <span className="live-dot" />
            DWIM TV
          </div>
          <h1>Watch. Listen. Be Transformed.</h1>
          <p>Sermons, worship sessions, teachings, and live services — all in one place. Churches worldwide, one platform.</p>
          <div className="dtv-hero-actions">
            {token
              ? <button className="dtv-hero-watchlist-btn" onClick={loadWatchlist}>&#x1F516; My Watchlist</button>
              : <a href="/signup" className="dtv-hero-watchlist-btn">&#x1F381; Sign Up Free to Save Videos</a>
            }
            <Link to="/churches" className="dtv-hero-churches-btn">⛪ Browse Churches</Link>
          </div>
        </div>
      </div>

      <div className="container dtv-body">

        {/* CONTINUE WATCHING */}
        <ContinueWatching token={token} onSelect={handlePlay} />

        {/* LIVE BANNER */}
        {live && (
          <div className="dtv-live-banner">
            <div className="dtv-live-label"><span className="live-dot pulse" />LIVE NOW</div>
            <div className="dtv-live-info">
              <h2>{live.title}</h2>
              {live.description && <p>{live.description}</p>}
            </div>
            <button className="btn btn-primary dtv-watch-live" onClick={() => handlePlay({ ...live, videoUrl: live.streamUrl, _isLiveStream: true, _streamId: live._id })}>
              ▶ Watch Live
            </button>
          </div>
        )}

        {/* VIDEO PLAYER + WATCH PARTY CHAT */}
        {playing && (
          <div className="dtv-player-section" ref={playerRef}>
            <div className="dtv-player-with-chat">
              <div className="dtv-player-col">
                <div className="dtv-player-wrapper">
                  {isDirectVideo(playing.videoUrl) ? (
                    <video
                      controls
                      autoPlay
                      className="dtv-video-el"
                      src={playing.videoUrl}
                      ref={progressRef}
                      onTimeUpdate={e => {
                        const vid = e.target;
                        if (vid.duration && playing._id) {
                          saveProgress(playing._id, vid.currentTime, vid.duration);
                        }
                      }}
                    >
                      {subtitles.map(s => (
                        <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label} />
                      ))}
                    </video>
                  ) : embedUrl ? (
                    <iframe
                      title={playing.title}
                      src={embedUrl}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="dtv-iframe"
                    />
                  ) : (
                    <div className="dtv-no-video">
                      <div className="dtv-no-video-icon">&#x1F4FA;</div>
                      <p>No playable video source available.</p>
                    </div>
                  )}
                </div>
                <div className="dtv-player-meta">
                  <div className="dtv-player-info">
                    <span className={`dtv-cat-badge cat-${playing.category}`}>{playing.category}</span>
                    <h2>{playing.title}</h2>
                    {playing.speaker && <p className="dtv-meta-speaker">&#x1F464; {playing.speaker}</p>}
                    {playing.description && <p className="dtv-meta-desc">{playing.description}</p>}
                    {playing.date && <p className="dtv-meta-date">&#x1F4C5; {format(new Date(playing.date), 'MMMM dd, yyyy')}</p>}
                    {/* Star Rating */}
                    {!playing._isLiveStream && playing._id && (
                      <StarRating contentId={playing._id} token={token} />
                    )}
                    {/* Subtitles info */}
                    {subtitles.length > 0 && (
                      <div className="dtv-subtitles-info">
                        🔤 Subtitles available: {subtitles.map(s => s.label).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="dtv-player-btns">
                    {!playing._isLiveStream && (
                      <WatchlistBtn itemId={playing._id} token={token} initialSaved={watchlistIds.includes(playing._id)} />
                    )}
                    {!playing._isLiveStream && playing.allowDownload && (
                      <button className="btn btn-ghost dtv-download-btn" onClick={() => handleDownload(playing)}>
                        ⬇ Download
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setPlaying(null)}>✕ Close</button>
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
          <div className="dtv-watchlist-panel">
            <div className="dtv-watchlist-header">
              <h2>&#x1F516; My Watchlist</h2>
              <button className="dtv-close-btn" onClick={() => setShowWatchlist(false)}>x Close</button>
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
              <div className="dtv-grid">
                {watchlistItems.map(item => (
                  <div key={item._id} className="dtv-card" onClick={() => handlePlay(item)}>
                    <div className="dtv-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                      <div className="dtv-play-overlay"><div className="dtv-play-btn">&#x25BA;</div></div>
                      <span className={`dtv-cat-badge dtv-badge-over cat-${item.category}`}>{item.category}</span>
                      {item.duration > 0 && <span className="dtv-duration">{formatDuration(item.duration)}</span>}
                    </div>
                    <div className="dtv-card-body">
                      <h3 className="dtv-card-title">{item.title}</h3>
                      {item.speaker && <p className="dtv-card-speaker">&#x1F464; {item.speaker}</p>}
                      <div className="dtv-card-footer">
                        <span className="dtv-card-date">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                        <span className="dtv-card-views">&#x1F441; {item.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div className="dtv-controls">
          <div className="dtv-search">
            <input
              className="form-input"
              placeholder="🔍 Search videos, speakers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="dtv-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`dtv-cat-btn ${activeCategory === cat ? 'active' : ''}`}
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
            <div className="dtv-grid">
              {content.map(item => (
                <div
                  key={item._id}
                  className={`dtv-card ${playing?._id === item._id ? 'dtv-card-active' : ''}`}
                  onClick={() => handlePlay(item)}
                >
                  <div className="dtv-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                    <div className="dtv-play-overlay">
                      <div className="dtv-play-btn">▶</div>
                    </div>
                    <span className={`dtv-cat-badge dtv-badge-over cat-${item.category}`}>{item.category}</span>
                    {item.duration > 0 && <span className="dtv-duration">{formatDuration(item.duration)}</span>}
                    {item.isPinned && <span className="dtv-pinned-badge">&#x1F4CC;</span>}
                    {token && (
                      <div className="dtv-card-bookmark" onClick={e => e.stopPropagation()}>
                        <WatchlistBtn itemId={item._id} token={token} initialSaved={watchlistIds.includes(item._id)} />
                      </div>
                    )}
                  </div>
                  <div className="dtv-card-body">
                    <h3 className="dtv-card-title">{item.title}</h3>
                    {item.speaker && <p className="dtv-card-speaker">👤 {item.speaker}</p>}
                    <div className="dtv-card-footer">
                      <span className="dtv-card-date">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                      <span className="dtv-card-views">👁 {item.views}</span>
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
