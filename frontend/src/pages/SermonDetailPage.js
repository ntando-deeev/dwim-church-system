import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';
import { API_URL } from '../context/AuthContext';
import './SermonDetailPage.css';

export default function SermonDetailPage() {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/sermons/${id}`)
      .then(r => setSermon(r.data.sermon))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loader" style={{minHeight:'80vh'}}><div className="spinner"/></div>;
  if (!sermon) return <div style={{padding:'4rem',textAlign:'center'}}><h2>Sermon not found</h2><Link to="/sermons" className="btn btn-primary" style={{marginTop:'1rem'}}>← Back to Sermons</Link></div>;

  return (
    <div className="sermon-detail">
      <div className="sd-hero">
        <div className="container">
          <Link to="/sermons" className="back-link">← Back to Sermons</Link>
          <div className="sd-meta">
            <span className="badge badge-gold">{format(new Date(sermon.date), 'MMMM dd, yyyy')}</span>
            {sermon.series && <span className="badge badge-navy">📚 {sermon.series}</span>}
          </div>
          <h1>{sermon.title}</h1>
          <p className="sd-speaker">By {sermon.speaker}</p>
          {sermon.scripture && <p className="sd-scripture">📜 {sermon.scripture}</p>}
        </div>
      </div>

      <div className="container sd-body">
        {(sermon.videoUrl || sermon.youtubeUrl) && (
          <div className="video-wrapper">
            <ReactPlayer
              url={sermon.videoUrl}
              width="100%" height="100%"
              controls playing={false}
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            />
          </div>
        )}

        {sermon.description && (
          <div className="sd-desc">
            <h2>About This Message</h2>
            <p>{sermon.description}</p>
          </div>
        )}

        <div className="sd-stats">
          <span>👁 {sermon.views} views</span>
          {sermon.duration > 0 && <span>⏱ {Math.floor(sermon.duration / 60)}:{String(sermon.duration % 60).padStart(2,'0')} min</span>}
        </div>
      </div>
    </div>
  );
}
