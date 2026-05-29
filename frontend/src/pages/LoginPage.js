import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🙏`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed — check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left brand panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-tagline">
            Your faith<br />community,<br /><span>all in one place.</span>
          </div>
          <p className="login-tagline-sub">
            Access sermons, events, prayer requests, and your personal church inbox — anytime, anywhere.
          </p>
          <div className="login-features">
            {[
              { icon: '📺', label: 'Watch live services on Synagogue TV' },
              { icon: '📬', label: 'Private church email inbox' },
              { icon: '🙏', label: 'Submit and view prayer requests' },
              { icon: '💛', label: 'Give online securely' },
            ].map(f => (
              <div key={f.icon} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="login-cross">✝</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your DWIM member account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@dwim.church"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <button type="button" style={{ background: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} onClick={() => setShowPw(v => !v)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Signing in…</>
                : '→ Sign In'}
            </button>
          </form>

          <div className="login-divider">or</div>

          <div className="login-footer">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--gold)', fontWeight: 600 }}>Join Free</Link>
            </span>
            <Link to="/">← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
