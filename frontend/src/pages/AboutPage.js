import React from 'react';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="page-hero">
        <div className="container">
          <h1>About Us</h1>
          <p>Rooted in faith. Growing in love. Reaching the world.</p>
        </div>
      </div>

      <div className="container about-body">
        <section className="about-section">
          <div className="about-text">
            <h2>Our Mission</h2>
            <div className="divider-gold" style={{margin:'0.75rem 0'}} />
            <p>
              Destiny Word International Ministries (DWIM) exists to preach the undiluted Word of God, raise disciples, and transform communities through the power of the Holy Spirit. We believe that every person has a God-given destiny — and we are committed to helping them discover and walk in it.
            </p>
          </div>
          <div className="about-cross-visual">✝</div>
        </section>

        <div className="values-grid">
          {[
            { icon: '📖', title: 'Word-Centered', desc: 'Everything we do is grounded in the truth of Scripture.' },
            { icon: '🙏', title: 'Prayer First', desc: 'We are a house of prayer that seeks God above all things.' },
            { icon: '❤️', title: 'Community Love', desc: 'We care for one another as family, bearing each other\'s burdens.' },
            { icon: '🌍', title: 'Global Reach', desc: 'Our vision extends beyond our walls to the nations of the world.' },
            { icon: '🔥', title: 'Spirit-Led', desc: 'We welcome the presence and power of the Holy Spirit in all we do.' },
            { icon: '🌱', title: 'Discipleship', desc: 'We raise and equip believers to mature in Christ and serve effectively.' },
          ].map(v => (
            <div key={v.title} className="value-card">
              <div className="value-icon">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>

        <section className="about-section vision">
          <div className="about-text">
            <h2>Our Vision</h2>
            <div className="divider-gold" style={{margin:'0.75rem 0'}} />
            <p>
              To be a beacon of light in every community we touch — a ministry that raises up an army of believers who are skilled in the Word, empowered by the Spirit, and committed to walking in their God-given destiny.
            </p>
            <p style={{marginTop:'1rem'}}>
              We envision churches planted across nations, lives restored by the grace of God, and a generation that stands firmly on the foundation of God's Word.
            </p>
          </div>
        </section>

        <section className="contact-section">
          <h2>Visit Us</h2>
          <div className="divider-gold" />
          <div className="contact-grid">
            <div className="contact-card">
              <div className="cc-icon">📅</div>
              <h4>Service Times</h4>
              <p>Sunday: 9:00 AM & 11:00 AM</p>
              <p>Wednesday: 7:00 PM (Bible Study)</p>
              <p>Friday: 6:00 PM (Prayer Night)</p>
            </div>
            <div className="contact-card">
              <div className="cc-icon">📍</div>
              <h4>Find Us</h4>
              <p>Destiny Word International Ministries</p>
              <p>Contact your local DWIM branch for address</p>
            </div>
            <div className="contact-card">
              <div className="cc-icon">📞</div>
              <h4>Connect</h4>
              <p>Reach out to us through our social media channels or visit us on a Sunday.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
