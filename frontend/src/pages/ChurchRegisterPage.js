import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import './ChurchRegisterPage.css';

const ECOCASH_NUMBER = '263786831091';

export default function ChurchRegisterPage() {
  const [step, setStep] = useState(1); // 1=form, 2=success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [proofPreview, setProofPreview] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', country: '', city: '', description: '',
    website: '', phone: '', paymentRef: '',
    facebookUrl: '', youtubeUrl: '', instagramUrl: '', whatsappUrl: '',
  });
  const [proofFile, setProofFile] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleProof = e => {
    const file = e.target.files[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!proofFile) { setError('Please upload your EcoCash payment screenshot.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('paymentProof', proofFile);
      await axios.post(`${API_URL}/api/churches/register`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (step === 2) {
    return (
      <div className="creg-page">
        <div className="creg-success">
          <div className="creg-success-icon">✅</div>
          <h2>Registration Submitted!</h2>
          <p>We received your application for <strong>{form.name}</strong>. Our team will review your EcoCash payment and activate your channel within <strong>24 hours</strong>.</p>
          <p className="creg-success-note">You'll be notified at <strong>{form.email}</strong> once approved.</p>
          <div className="creg-success-actions">
            <Link to="/churches" className="btn btn-primary">Browse Churches</Link>
            <Link to="/tv" className="btn btn-ghost">Watch Dwim TV</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creg-page">
      <div className="creg-wrap">
        {/* Payment Instructions */}
        <div className="creg-payment-box">
          <div className="creg-payment-step">
            <div className="creg-payment-num">1</div>
            <div>
              <strong>Send $5 via EcoCash</strong>
              <p>Send <strong>USD $5.00</strong> to EcoCash number:</p>
              <div className="creg-ecocash-num">📱 {ECOCASH_NUMBER}</div>
              <p className="creg-payment-note">Reference: Your church name</p>
            </div>
          </div>
          <div className="creg-payment-step">
            <div className="creg-payment-num">2</div>
            <div>
              <strong>Take a screenshot</strong>
              <p>Screenshot your EcoCash confirmation message showing the transaction.</p>
            </div>
          </div>
          <div className="creg-payment-step">
            <div className="creg-payment-num">3</div>
            <div>
              <strong>Fill in the form & submit</strong>
              <p>Complete the registration form below and upload your screenshot. We'll activate your channel within 24 hours.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="creg-form" onSubmit={handleSubmit}>
          <h2 className="creg-title">Register Your Church on Dwim TV</h2>

          <div className="creg-section-label">Church Info</div>
          <div className="creg-row">
            <div className="creg-field">
              <label>Church Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Grace Gospel Church" />
            </div>
            <div className="creg-field">
              <label>Contact Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="pastor@yourgrace.org" />
            </div>
          </div>
          <div className="creg-row">
            <div className="creg-field">
              <label>Country</label>
              <input name="country" value={form.country} onChange={handleChange} placeholder="Zimbabwe" />
            </div>
            <div className="creg-field">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Harare" />
            </div>
          </div>
          <div className="creg-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Tell people about your church..." />
          </div>
          <div className="creg-row">
            <div className="creg-field">
              <label>Website</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourgrace.org" />
            </div>
            <div className="creg-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+263..." />
            </div>
          </div>

          <div className="creg-section-label">Social Links (optional)</div>
          <div className="creg-row">
            <div className="creg-field">
              <label>📘 Facebook</label>
              <input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/yourpage" />
            </div>
            <div className="creg-field">
              <label>📺 YouTube</label>
              <input name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} placeholder="https://youtube.com/@yourchannel" />
            </div>
          </div>
          <div className="creg-row">
            <div className="creg-field">
              <label>📸 Instagram</label>
              <input name="instagramUrl" value={form.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/yourpage" />
            </div>
            <div className="creg-field">
              <label>💬 WhatsApp</label>
              <input name="whatsappUrl" value={form.whatsappUrl} onChange={handleChange} placeholder="https://wa.me/263..." />
            </div>
          </div>

          <div className="creg-section-label">Payment Verification</div>
          <div className="creg-field">
            <label>EcoCash Transaction Reference</label>
            <input name="paymentRef" value={form.paymentRef} onChange={handleChange} placeholder="e.g. ECA123456789" />
          </div>
          <div className="creg-field">
            <label>Payment Screenshot * <span className="creg-req">(required)</span></label>
            <div className="creg-upload-area" onClick={() => document.getElementById('proofInput').click()}>
              {proofPreview
                ? <img src={proofPreview} alt="Payment proof" className="creg-proof-preview" />
                : <>
                    <div className="creg-upload-icon">📷</div>
                    <div>Click to upload your EcoCash screenshot</div>
                    <div className="creg-upload-hint">PNG, JPG, JPEG — max 5MB</div>
                  </>
              }
            </div>
            <input id="proofInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProof} />
          </div>

          {error && <div className="creg-error">{error}</div>}

          <button type="submit" className="btn btn-primary creg-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : '🚀 Submit Registration'}
          </button>
          <p className="creg-terms">By registering, your church agrees to Dwim TV content guidelines. Payments are non-refundable once your channel is approved.</p>
        </form>
      </div>
    </div>
  );
}
