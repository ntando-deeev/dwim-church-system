import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import './PlaylistPage.css';

function formatDuration(secs) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PlaylistPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/playlists/${id}`)
      .then(({ data }) => setPlaylist(data.playlist))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pl-loading"><div className="spinner" /></div>;
  if (!playlist) return <div className="pl-notfound"><h2>Playlist not found</h2><Link to="/tv" className="btn btn-primary">Back to Dwim TV</Link></div>;

  const totalDuration = playlist.items?.reduce((a, v) => a + (v.duration || 0), 0) || 0;
  const totalMins = Math.round(totalDuration / 60);

  return (
    <div className="pl-page">
      <div className="container pl-wrap">
        <div className="pl-header">
          <div className="pl-cover" style={playlist.coverImage ? { backgroundImage: `url(${playlist.coverImage})` } : {}} />
          <div className="pl-header-info">
            <div className="pl-label">PLAYLIST</div>
            <h1 className="pl-title">{playlist.title}</h1>
            {playlist.description && <p className="pl-desc">{playlist.description}</p>}
            {playlist.church && (
              <Link to={`/churches/${playlist.church.slug}`} className="pl-church">
                {playlist.church.logo && <img src={playlist.church.logo} alt={playlist.church.name} />}
                {playlist.church.name}
              </Link>
            )}
            <div className="pl-stats">
              <span>{playlist.items?.length || 0} videos</span>
              {totalMins > 0 && <span>• {totalMins} min total</span>}
            </div>
            {playlist.items?.length > 0 && (
              <Link to={`/tv?v=${playlist.items[0]._id}&playlist=${playlist._id}`} className="btn btn-primary pl-play-btn">
                ▶ Play All
              </Link>
            )}
          </div>
        </div>

        <div className="pl-items">
          {playlist.items?.map((item, idx) => (
            <Link key={item._id} to={`/tv?v=${item._id}&playlist=${playlist._id}`} className="pl-item">
              <div className="pl-item-num">{idx + 1}</div>
              <div className="pl-item-thumb" style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : {}}>
                {!item.thumbnailUrl && <span>▶</span>}
                {item.duration > 0 && <span className="pl-item-dur">{formatDuration(item.duration)}</span>}
              </div>
              <div className="pl-item-info">
                <div className="pl-item-title">{item.title}</div>
                {item.speaker && <div className="pl-item-speaker">{item.speaker}</div>}
                <div className="pl-item-meta">
                  <span>👁 {item.views || 0}</span>
                  {item.ratingAvg > 0 && <span>⭐ {item.ratingAvg}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
