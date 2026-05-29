import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicLayout.css';

const navLinks = [
  { to: '/', label: 'Home', exact: true },
  { to: '/tv', label: '📺 Dwim TV' },
  { to: '/churches', label: '⛪ Churches' },
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
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const isActive = (link) => link.exact
    ? location.pathname === link.to
    : location.pathname.startsWith(link.to);

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
              <Link key={l.to} to={l.to} className={`nav-link ${isActive(l) ? 'active' : ''}`}>
                {l.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="nav-link admin-link">⚙ Admin</Link>}
            {user ? (
              <>
                <Link to="/member" className="btn btn-primary nav-btn">My Portal</Link>
                <button className="btn btn-ghost nav-btn" onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost nav-btn">Sign In</Link>
                <Link to="/signup" className="btn btn-primary nav-btn">Join Us</Link>
              </>
            )}
          </div>

          <button className={`hamburger ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
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
              <div className="footer-logo">
                <div className="footer-logo-icon">✝</div>
                DWIM
              </div>
              <p>Destiny Word International Ministries — Building lives through the transforming power of God's Word. Join our family of faith, hope, and love.</p>
              <div className="footer-socials">
                <a href="#" className="footer-social" aria-label="Facebook">📘</a>
                <a href="#" className="footer-social" aria-label="YouTube">📺</a>
                <a href="#" className="footer-social" aria-label="Instagram">📸</a>
                <a href="#" className="footer-social" aria-label="WhatsApp">💬</a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              {navLinks.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}
            </div>

            <div className="footer-col">
              <h4>Member Portal</h4>
              <Link to="/signup">✨ Join Free — Get Church Email</Link>
              <Link to="/member">📬 My Inbox</Link>
              <Link to="/member?tab=prayer">🙏 Prayer Wall</Link>
              <Link to="/member?tab=giving">💛 Online Giving</Link>
              <Link to="/login">🔐 Sign In</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Destiny Word International Ministries. All rights reserved.</span>
            <div className="footer-bottom-links">
              <Link to="/about">About</Link>
              <a href="mailto:info@dwim.church">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
