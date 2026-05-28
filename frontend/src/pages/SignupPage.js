import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, useAuth } from '../context/AuthContext';
import './SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=form, 2=success
  const [loading, setLoading] = useState(false);
  const [churchEmail, setChurchEmail] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', idNumber: '', country: '', password: '', confirmPassword: ''
  });

  const countries = [
    'South Africa','Zimbabwe','Nigeria','Kenya','Ghana','Uganda','Tanzania','Zambia','Botswana',
    'Namibia','Mozambique','Malawi','Rwanda','Ethiopia','United States','United Kingdom',
    'Canada','Australia','Germany','Netherlands','Other'
  ];

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/signup`, {
        name: form.name,
        phone: form.phone,
        idNumber: form.idNumber,
        country: form.country,
        password: form.password,
      });
      setChurchEmail(data.churchEmail);
      login(data.token, data.user);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div className="signup-success-page">
        <div className="signup-success-card">
          <div className="signup-success-icon">✝</div>
          <h1>Welcome to the Family!</h1>
          <p className="signup-success-sub">You are now a member of Destiny Word International Ministries.</p>
          <div className="church-email-box">
            <div className="church-email-label">🎉 Your Church Email</div>
            <div className="church-email-value">{churchEmail}</div>
            <p className="church-email-note">Use this email to sign in to the DWIM portal anytime. It's yours forever.</p>
          </div>
          <div className="signup-success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/member')}>
              Go to My Dashboard →
            </button>
            <Link to="/" className="btn btn-secondary">Return Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-cross">✝</div>
          <h1>Join DWIM</h1>
          <p>Sign up for free and get your personal church email</p>
        </div>

        <form onSubmit={submit} className="signup-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input name="name" className="form-input" placeholder="Your full name" value={form.name} onChange={handle} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input name="phone" className="form-input" placeholder="+27 123 456 789" value={form.phone} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>ID / Passport Number *</label>
              <input name="idNumber" className="form-input" placeholder="National ID or Passport" value={form.idNumber} onChange={handle} required />
            </div>
          </div>

          <div className="form-group">
            <label>Country *</label>
            <select name="country" className="form-input" value={form.country} onChange={handle} required>
              <option value="">Select your country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input name="confirmPassword" type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={handle} required />
            </div>
          </div>

          <div className="signup-email-preview">
            <span>🎁 You will receive a free church email:</span>
            <strong>
              {form.name
                ? `${form.name.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim().split(/\s+/).join('.')}@ntando.org`
                : 'yourname@ntando.org'}
            </strong>
          </div>

          <button type="submit" className="btn btn-primary signup-btn" disabled={loading}>
            {loading ? 'Creating your account...' : '🙏 Sign Up for Free'}
          </button>
        </form>

        <div className="signup-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
