import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { API_URL } from '../context/AuthContext';
import './SermonsPage.css';
import './GalleryPage.css';

const CATEGORIES = ['all', 'gallery', 'event', 'worship', 'poster', 'other'];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 24 };
        if (category !== 'all') params.category = category;
        const { data } = await axios.get(`${API_URL}/api/gallery`, { params });
        setImages(prev => page === 1 ? (data.images || []) : [...prev, ...(data.images || [])]);
        setTotalPages(data.pages || 1);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [page, category]);

  const handleCategoryChange = (c) => { setCategory(c); setPage(1); setImages([]); };

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <div className="page-hero-badge">📸 Photo Gallery</div>
          <h1>Moments of Ministry</h1>
          <p>Worship, fellowship, and community captured in every frame</p>
        </div>
      </div>

      <div className="container gallery-page-wrap">
        {/* Filters */}
        <div className="gallery-filters">
          {CATEGORIES.map(c => (
            <button key={c} className={`gallery-filter-btn ${category === c ? 'active' : ''}`} onClick={() => handleCategoryChange(c)}>
              {c === 'all' ? '✦ All Photos' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading && page === 1 ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : images.length === 0 ? (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">🖼️</div>
            <p>No photos in this category yet.</p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {images.map((img, idx) => (
                <div key={img._id} className="gallery-item" onClick={() => setLightboxIndex(idx)}>
                  <img src={img.url} alt={img.title} loading="lazy" />
                  <div className="gallery-overlay">
                    <span className="gallery-title">{img.title}</span>
                  </div>
                  {img.category && img.category !== 'gallery' && (
                    <span className="gallery-type-badge">{img.category}</span>
                  )}
                </div>
              ))}
            </div>
            {page < totalPages && (
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
                  {loading ? '⏳ Loading…' : 'Load More Photos'}
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
