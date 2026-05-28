import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicLayout.css';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/tv', label: '📺 Synagogue TV' },
  { to: '/sermons', label: 'Sermons' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <div className="public-layout">
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">✝</div>
            <div>
              <div className="brand-title">DWIM</div>
              <div className="brand-sub">Destiny Word International Ministries</div>
            </div>
          </Link>

          <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}>
                {l.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="nav-link admin-link">Admin Panel</Link>}
            {user ? (
              <>
                <Link to="/member" className="btn btn-primary nav-btn">My Portal</Link>
                <button className="btn btn-secondary nav-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary nav-btn">Sign Up Free</Link>
                <Link to="/login" className="btn btn-secondary nav-btn">Sign In</Link>
              </>
            )}
          </div>

          <button className={`hamburger ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <main className="public-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">✝ DWIM</div>
              <p>Destiny Word International Ministries — Building lives through the power of God's Word.</p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              {navLinks.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}
            </div>
            <div className="footer-col">
              <h4>Member Portal</h4>
              <Link to="/signup">🎁 Sign Up Free — Get Church Email</Link>
              <Link to="/member">📬 My Inbox</Link>
              <Link to="/member?tab=prayer">🙏 Prayer Wall</Link>
              <Link to="/member?tab=giving">💛 Giving</Link>
            </div>
            <div className="footer-col">
              <h4>Connect With Us</h4>
              <p>📍 Join us every Sunday</p>
              <p>🙏 Midweek Service: Wednesday</p>
              <p>📖 Prayer & Fasting: Friday</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Destiny Word International Ministries. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
