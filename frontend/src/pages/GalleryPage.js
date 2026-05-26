import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { API_URL } from '../context/AuthContext';
import './SermonsPage.css';
import './GalleryPage.css';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/gallery`, { params: { page, limit: 24 } });
        setImages(prev => page === 1 ? data.images : [...prev, ...data.images]);
        setTotalPages(data.pages);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [page]);

  return (
    <div className="sermons-page">
      <div className="page-hero">
        <div className="container">
          <h1>Gallery</h1>
          <p>Moments of worship, fellowship, and ministry</p>
        </div>
      </div>

      <div className="container page-body">
        {loading && page === 1 ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : images.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🖼️</div><h3>No images yet</h3></div>
        ) : (
          <>
            <div className="gallery-grid">
              {images.map((img, idx) => (
                <div key={img._id} className="gallery-item" onClick={() => setLightboxIndex(idx)}>
                  <img src={img.url} alt={img.title} loading="lazy" />
                  <div className="gallery-overlay">
                    <span className="gallery-title">{img.title}</span>
                  </div>
                </div>
              ))}
            </div>
            {page < totalPages && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={images.map(img => ({ src: img.url, alt: img.title }))}
      />
    </div>
  );
}
