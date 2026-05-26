import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/admin/media', label: 'Media Library', icon: '🎬' },
  { to: '/admin/sermons', label: 'Sermons', icon: '📖' },
  { to: '/admin/events', label: 'Events', icon: '📅' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="sidebar-cross">✝</span>
            <div>
              <div className="sidebar-title">DWIM</div>
              <div className="sidebar-sub">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link small">
            <span className="sidebar-icon">🌐</span>
            <span>View Site</span>
          </Link>
          <button className="sidebar-link small logout" onClick={() => { logout(); navigate('/login'); }}>
            <span className="sidebar-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="hamburger-admin" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="admin-header-title" />
          <div className="admin-user-info">
            <div className="admin-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div className="admin-user-name">{user?.name}</div>
              <div className="admin-user-role">{user?.role}</div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
