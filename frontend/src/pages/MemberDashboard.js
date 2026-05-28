import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL, useAuth } from '../context/AuthContext';
import './MemberDashboard.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function authHeaders(token) { return { headers: { Authorization: `Bearer ${token}` } }; }

// ── Sub-components ────────────────────────────────────────────────────────────

function DashboardHome({ user, stats, verse, notifications, onMarkAllRead }) {
  return (
    <div className="md-section">
      <div className="md-welcome-banner">
        <div>
          <h2>Welcome back, {user.name.split(' ')[0]} 🙏</h2>
          <p className="md-church-email">{user.churchEmail}</p>
        </div>
        <div className="md-role-badge">{user.role}</div>
      </div>

      {verse && (
        <div className="md-verse-card">
          <div className="md-verse-icon">📖</div>
          <div>
            <p className="md-verse-text">"{verse.text}"</p>
            <p className="md-verse-ref">— {verse.ref}</p>
          </div>
        </div>
      )}

      <div className="md-stats-grid">
        <div className="md-stat-card">
          <span className="md-stat-icon">💛</span>
          <span className="md-stat-num">${stats.totalGiven || 0}</span>
          <span className="md-stat-label">Total Given</span>
        </div>
        <div className="md-stat-card">
          <span className="md-stat-icon">📅</span>
          <span className="md-stat-num">{stats.eventsRegistered || 0}</span>
          <span className="md-stat-label">Events Registered</span>
        </div>
        <div className="md-stat-card">
          <span className="md-stat-icon">🙏</span>
          <span className="md-stat-num">{stats.givingCount || 0}</span>
          <span className="md-stat-label">Giving Records</span>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="md-notifications-panel">
          <div className="md-panel-header">
            <h3>🔔 Notifications</h3>
            <button className="md-text-btn" onClick={onMarkAllRead}>Mark all read</button>
          </div>
          <div className="md-notif-list">
            {notifications.slice(0, 8).map(n => (
              <div key={n._id} className={`md-notif-item ${!n.isRead ? 'unread' : ''}`}>
                <div className="md-notif-title">{n.title}</div>
                {n.message && <div className="md-notif-msg">{n.message}</div>}
                <div className="md-notif-time">{format(new Date(n.createdAt), 'MMM dd, HH:mm')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Inbox({ token, user }) {
  const [tab, setTab] = useState('inbox');
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/mail/${tab}`, authHeaders(token));
      setMails(data.mails);
    } catch { }
    setLoading(false);
  }, [tab, token]);

  useEffect(() => { load(); setSelected(null); }, [load]);

  const openMail = async (mail) => {
    setSelected(mail);
    if (!mail.isRead && tab === 'inbox') {
      await axios.patch(`${API_URL}/api/mail/${mail._id}/read`, {}, authHeaders(token));
      setMails(ms => ms.map(m => m._id === mail._id ? { ...m, isRead: true } : m));
    }
  };

  const deleteMail = async (id) => {
    await axios.delete(`${API_URL}/api/mail/${id}`, authHeaders(token));
    toast.success('Mail deleted');
    setSelected(null);
    load();
  };

  const send = async e => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/mail/send`, {
        toChurchEmail: compose.to,
        subject: compose.subject,
        body: compose.body
      }, authHeaders(token));
      toast.success('Message sent!');
      setComposing(false);
      setCompose({ to: '', subject: '', body: '' });
      if (tab === 'sent') load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    }
  };

  return (
    <div className="md-section">
      <div className="md-inbox-header">
        <h2>📬 Church Inbox</h2>
        <button className="btn btn-primary md-compose-btn" onClick={() => setComposing(true)}>✉️ Compose</button>
      </div>
      <div className="md-inbox-tabs">
        {['inbox','sent'].map(t => (
          <button key={t} className={`md-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'inbox' ? '📥 Inbox' : '📤 Sent'}
          </button>
        ))}
      </div>

      {composing && (
        <div className="md-compose-overlay">
          <div className="md-compose-card">
            <div className="md-compose-header">
              <h3>New Message</h3>
              <button className="md-close-btn" onClick={() => setComposing(false)}>✕</button>
            </div>
            <form onSubmit={send} className="md-compose-form">
              <input className="form-input" placeholder="To (church email e.g. john.doe@ntando.org)" value={compose.to} onChange={e => setCompose({...compose, to: e.target.value})} required />
              <input className="form-input" placeholder="Subject" value={compose.subject} onChange={e => setCompose({...compose, subject: e.target.value})} required />
              <textarea className="form-input md-compose-body" placeholder="Write your message..." value={compose.body} onChange={e => setCompose({...compose, body: e.target.value})} required rows={6} />
              <div className="md-compose-actions">
                <button type="submit" className="btn btn-primary">Send Message</button>
                <button type="button" className="btn btn-secondary" onClick={() => setComposing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="md-inbox-body">
        <div className="md-mail-list">
          {loading ? <div className="md-loading">Loading...</div> :
           mails.length === 0 ? <div className="md-empty">No messages yet</div> :
           mails.map(m => (
            <div key={m._id} className={`md-mail-row ${selected?._id === m._id ? 'active' : ''} ${!m.isRead && tab === 'inbox' ? 'unread' : ''}`} onClick={() => openMail(m)}>
              <div className="md-mail-from">{tab === 'inbox' ? m.from?.name : m.to?.name}</div>
              <div className="md-mail-subject">{m.subject}</div>
              <div className="md-mail-date">{format(new Date(m.createdAt), 'MMM dd')}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="md-mail-view">
            <div className="md-mail-view-header">
              <div>
                <h3>{selected.subject}</h3>
                <p className="md-mail-meta">
                  {tab === 'inbox' ? `From: ${selected.from?.name} (${selected.from?.churchEmail})` : `To: ${selected.to?.name} (${selected.to?.churchEmail})`}
                  {' · '}{format(new Date(selected.createdAt), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
              <button className="md-delete-btn" onClick={() => deleteMail(selected._id)}>🗑 Delete</button>
            </div>
            <div className="md-mail-body">{selected.body}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrayerWall({ token, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/prayer`).then(r => setRequests(r.data.requests)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/prayer`, form, authHeaders(token));
      setRequests(rs => [data.request, ...rs]);
      setForm({ title: '', body: '', isAnonymous: false });
      toast.success('Prayer request submitted 🙏');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSubmitting(false);
  };

  const pray = async (id) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/prayer/${id}/pray`, {}, authHeaders(token));
      setRequests(rs => rs.map(r => r._id === id ? { ...r, prayerCount: data.prayerCount } : r));
      toast.success('You prayed for this request 🙏');
    } catch (err) { toast.error(err.response?.data?.error || 'Already prayed'); }
  };

  const respond = async (id) => {
    if (!responseText.trim()) return;
    try {
      const { data } = await axios.post(`${API_URL}/api/prayer/${id}/respond`, { text: responseText }, authHeaders(token));
      setRequests(rs => rs.map(r => r._id === id ? data.request : r));
      setResponding(null); setResponseText('');
      toast.success('Response added');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="md-section">
      <h2>🙏 Prayer Request Wall</h2>
      <form onSubmit={submit} className="md-prayer-form">
        <input className="form-input" placeholder="Prayer title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <textarea className="form-input" placeholder="Share your prayer request with the congregation..." rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} required />
        <div className="md-prayer-form-footer">
          <label className="md-checkbox">
            <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})} />
            Post anonymously
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : '🙏 Submit Request'}
          </button>
        </div>
      </form>

      {loading ? <div className="md-loading">Loading prayers...</div> :
       requests.length === 0 ? <div className="md-empty">No prayer requests yet. Be the first to share.</div> :
       <div className="md-prayer-list">
         {requests.map(r => (
           <div key={r._id} className={`md-prayer-card ${r.isAnswered ? 'answered' : ''}`}>
             <div className="md-prayer-card-header">
               <div>
                 <h3>{r.title}</h3>
                 <p className="md-prayer-author">
                   {r.isAnonymous ? '🙏 Anonymous' : `👤 ${r.author?.name}`}
                   {' · '}{format(new Date(r.createdAt), 'MMM dd, yyyy')}
                   {r.isAnswered && <span className="md-answered-badge">✅ Answered</span>}
                 </p>
               </div>
               <button className="md-pray-btn" onClick={() => pray(r._id)}>
                 🙏 {r.prayerCount}
               </button>
             </div>
             <p className="md-prayer-body">{r.body}</p>
             {r.responses?.length > 0 && (
               <div className="md-prayer-responses">
                 {r.responses.map((resp, i) => (
                   <div key={i} className="md-prayer-response">
                     <strong>{resp.author?.name}:</strong> {resp.text}
                   </div>
                 ))}
               </div>
             )}
             <div className="md-prayer-actions">
               {(user.role === 'admin' || user.role === 'pastor') && (
                 <button className="md-text-btn" onClick={() => setResponding(r._id)}>Respond</button>
               )}
             </div>
             {responding === r._id && (
               <div className="md-prayer-respond">
                 <textarea className="form-input" placeholder="Write a pastoral response..." rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} />
                 <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                   <button className="btn btn-primary" style={{padding:'0.4rem 1rem',fontSize:'0.875rem'}} onClick={() => respond(r._id)}>Post Response</button>
                   <button className="btn btn-secondary" style={{padding:'0.4rem 1rem',fontSize:'0.875rem'}} onClick={() => {setResponding(null);setResponseText('');}}>Cancel</button>
                 </div>
               </div>
             )}
           </div>
         ))}
       </div>
      }
    </div>
  );
}

function GivingPortal({ token }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ amount: '', category: 'tithe', note: '', currency: 'USD' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/giving/my`, authHeaders(token))
      .then(r => { setRecords(r.data.records); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const give = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/api/giving`, form, authHeaders(token));
      setRecords(rs => [data.record, ...rs]);
      setTotal(t => t + Number(form.amount));
      setForm({ amount: '', category: 'tithe', note: '', currency: 'USD' });
      toast.success('Giving recorded. Thank you! 💛');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const categories = ['tithe', 'offering', 'building_fund', 'missions', 'other'];

  return (
    <div className="md-section">
      <h2>💛 Giving & Tithes</h2>
      <div className="md-giving-total">
        <span>Total Given</span>
        <span className="md-giving-total-num">${total.toFixed(2)}</span>
      </div>
      <form onSubmit={give} className="md-giving-form">
        <h3>Record a Gift</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Amount *</label>
            <input className="form-input" type="number" min="1" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select className="form-input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              {['USD','ZAR','GBP','EUR','NGN','KES','GHS'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {categories.map(c => <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Note (optional)</label>
          <input className="form-input" placeholder="e.g. Sunday offering" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
        </div>
        <button type="submit" className="btn btn-primary">💛 Record Giving</button>
      </form>

      {loading ? <div className="md-loading">Loading...</div> :
       records.length === 0 ? <div className="md-empty">No giving records yet.</div> :
       <div className="md-giving-table">
         <table>
           <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead>
           <tbody>
             {records.map(r => (
               <tr key={r._id}>
                 <td>{format(new Date(r.createdAt), 'MMM dd, yyyy')}</td>
                 <td><span className={`md-cat-badge cat-${r.category}`}>{r.category.replace('_',' ')}</span></td>
                 <td className="md-giving-amount">{r.currency} {r.amount}</td>
                 <td>{r.note || '—'}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
      }
    </div>
  );
}

function MyEvents({ token }) {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/registrations/my`, authHeaders(token)),
      axios.get(`${API_URL}/api/events?upcoming=true&limit=10`),
    ]).then(([myRegs, allEvents]) => {
      setEvents(myRegs.data.registrations);
      setUpcoming(allEvents.data.events);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const register = async (eventId) => {
    try {
      await axios.post(`${API_URL}/api/registrations`, { eventId }, authHeaders(token));
      toast.success('Registered successfully! ✅');
      const myRegs = await axios.get(`${API_URL}/api/registrations/my`, authHeaders(token));
      setEvents(myRegs.data.registrations);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to register'); }
  };

  const cancel = async (eventId) => {
    try {
      await axios.delete(`${API_URL}/api/registrations/${eventId}`, authHeaders(token));
      toast.success('Registration cancelled');
      setEvents(es => es.filter(e => e.event?._id !== eventId));
    } catch { toast.error('Failed'); }
  };

  const registeredIds = events.map(e => e.event?._id);

  return (
    <div className="md-section">
      <h2>📅 Events</h2>
      <h3 className="md-subsection-title">Upcoming Events</h3>
      {loading ? <div className="md-loading">Loading...</div> :
       upcoming.length === 0 ? <div className="md-empty">No upcoming events.</div> :
       <div className="md-events-grid">
         {upcoming.map(ev => (
           <div key={ev._id} className="md-event-card">
             {ev.posterUrl && <div className="md-event-poster" style={{backgroundImage:`url(${ev.posterUrl})`}} />}
             <div className="md-event-body">
               <span className="md-event-date">{format(new Date(ev.startDate), 'MMM dd, yyyy')}</span>
               <h4>{ev.title}</h4>
               {ev.location && <p className="md-event-loc">📍 {ev.location}</p>}
               {registeredIds.includes(ev._id) ? (
                 <div className="md-registered-label">✅ Registered <button className="md-text-btn danger" onClick={() => cancel(ev._id)}>Cancel</button></div>
               ) : (
                 <button className="btn btn-primary md-reg-btn" onClick={() => register(ev._id)}>Register</button>
               )}
             </div>
           </div>
         ))}
       </div>
      }

      <h3 className="md-subsection-title" style={{marginTop:'2rem'}}>My Registrations</h3>
      {events.length === 0 ? <div className="md-empty">You have not registered for any events yet.</div> :
       <div className="md-events-grid">
         {events.map(r => r.event && (
           <div key={r._id} className="md-event-card">
             {r.event.posterUrl && <div className="md-event-poster" style={{backgroundImage:`url(${r.event.posterUrl})`}} />}
             <div className="md-event-body">
               <span className="md-event-date">{format(new Date(r.event.startDate), 'MMM dd, yyyy')}</span>
               <h4>{r.event.title}</h4>
               {r.event.location && <p className="md-event-loc">📍 {r.event.location}</p>}
               <span className={`md-status-badge status-${r.status}`}>{r.status}</span>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  );
}

function MemberDirectory({ token }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/members/directory`, {
        ...authHeaders(token), params: { search }
      });
      setMembers(data.members);
    } catch { }
    setLoading(false);
  }, [search, token]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div className="md-section">
      <h2>👥 Member Directory</h2>
      <input className="form-input md-directory-search" placeholder="🔍 Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <div className="md-loading">Loading...</div> :
       members.length === 0 ? <div className="md-empty">No members found.</div> :
       <div className="md-directory-grid">
         {members.map(m => (
           <div key={m._id} className="md-member-card">
             <div className="md-member-avatar">
               {m.avatar ? <img src={m.avatar} alt={m.name} /> : <div className="md-avatar-placeholder">{m.name.charAt(0).toUpperCase()}</div>}
             </div>
             <div className="md-member-info">
               <h4>{m.name}</h4>
               <p className="md-member-email">{m.churchEmail}</p>
               {m.country && <p className="md-member-meta">🌍 {m.country}</p>}
               {m.department && <p className="md-member-meta">⛪ {m.department}</p>}
               {m.bio && <p className="md-member-bio">{m.bio}</p>}
               <p className="md-member-since">Member since {format(new Date(m.createdAt), 'MMM yyyy')}</p>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const [stats, setStats] = useState({});
  const [verse, setVerse] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadMail, setUnreadMail] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const headers = authHeaders(token);
    Promise.all([
      axios.get(`${API_URL}/api/members/dashboard`, headers),
      axios.get(`${API_URL}/api/members/bible-verse`),
      axios.get(`${API_URL}/api/notifications`, headers),
      axios.get(`${API_URL}/api/mail/unread-count`, headers),
    ]).then(([dash, bv, notifs, mail]) => {
      setStats(dash.data);
      setVerse(bv.data.verse);
      setNotifications(notifs.data.notifications);
      setUnreadNotif(notifs.data.unread);
      setUnreadMail(mail.data.count);
    }).catch(() => {});
  }, [user, token, navigate]);

  const markAllRead = async () => {
    await axios.patch(`${API_URL}/api/notifications/read-all`, {}, authHeaders(token));
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadNotif(0);
    toast.success('All notifications marked as read');
  };

  const setTab = (t) => { setSearchParams({ tab: t }); setSidebarOpen(false); };

  if (!user) return null;

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'inbox', label: 'Inbox', icon: '📬', badge: unreadMail },
    { id: 'prayer', label: 'Prayer Wall', icon: '🙏' },
    { id: 'giving', label: 'Giving', icon: '💛' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'directory', label: 'Directory', icon: '👥' },
  ];

  return (
    <div className="md-layout">
      {/* Sidebar */}
      <aside className={`md-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="md-sidebar-brand">
          <div className="md-sidebar-cross">✝</div>
          <div>
            <div className="md-sidebar-title">DWIM</div>
            <div className="md-sidebar-sub">Member Portal</div>
          </div>
        </div>
        <nav className="md-sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`md-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <span className="md-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && <span className="md-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="md-sidebar-footer">
          <div className="md-sidebar-user">
            <div className="md-sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="md-sidebar-user-name">{user.name}</div>
              <div className="md-sidebar-user-email">{user.churchEmail}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem'}}>
            <Link to="/" className="btn btn-secondary md-sidebar-btn">🏠 Site</Link>
            <button className="btn btn-secondary md-sidebar-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md-mobile-header">
        <button className="md-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <span className="md-mobile-title">DWIM Portal</span>
        <div className="md-mobile-badges">
          {unreadNotif > 0 && <span className="md-mobile-badge">{unreadNotif}</span>}
        </div>
      </div>

      {/* Main content */}
      <main className="md-main">
        {activeTab === 'home' && <DashboardHome user={user} stats={stats} verse={verse} notifications={notifications} onMarkAllRead={markAllRead} />}
        {activeTab === 'inbox' && <Inbox token={token} user={user} />}
        {activeTab === 'prayer' && <PrayerWall token={token} user={user} />}
        {activeTab === 'giving' && <GivingPortal token={token} />}
        {activeTab === 'events' && <MyEvents token={token} />}
        {activeTab === 'directory' && <MemberDirectory token={token} />}
      </main>

      {sidebarOpen && <div className="md-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
