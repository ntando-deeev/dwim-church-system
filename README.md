# ✝ Destiny Word International Ministries — Church Management System

A full-stack web application for DWIM to manage and publish videos, images, events, sermons, announcements, and church members.

---

## 🚀 Features

### Public Website
- **Home** — Hero, service times, announcements, upcoming events, featured sermons
- **Sermons** — Searchable sermon library with video player
- **Events** — Events calendar with filters and registration links
- **Gallery** — Masonry photo gallery with lightbox
- **Announcements** — Pinned + categorized announcements
- **About** — Mission, vision, values, service times

### Admin Panel (`/admin`)
- **Dashboard** — Stats overview (users, media, events, sermons, views)
- **Media Library** — Upload images, videos, and posters (Cloudinary)
- **Sermons** — Add/edit/delete sermons with video URL or upload
- **Events** — Create events with poster, date, location, registration
- **Announcements** — Create/pin/expire announcements with images
- **Users** — Create/edit/delete users with role-based access (admin, pastor, deacon, member)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Axios, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Media Storage | Cloudinary (free tier — 25GB) |
| Authentication | JWT (JSON Web Tokens) |
| Deployment | Render.com |

---

## ⚙️ Environment Variables

Create `backend/.env` (copy from `backend/.env.example`):

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm run install:all

# 2. Create backend/.env (from .env.example)

# 3. Seed the default admin user
npm run seed

# 4. Start backend (port 5000)
npm run dev:backend

# 5. Start frontend (port 3000) — in another terminal
npm run dev:frontend
```

### Default Admin Login
- **Email:** admin@dwim.org
- **Password:** Admin@2024!
- ⚠️ **Change this immediately after first login!**

---

## 🌐 Deploy to Render

### Step 1: Set up services (free tier works)
1. **MongoDB Atlas** — [mongodb.com/atlas](https://mongodb.com/atlas) — Free M0 cluster
2. **Cloudinary** — [cloudinary.com](https://cloudinary.com) — Free 25GB storage

### Step 2: Deploy on Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`
5. Add environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` — your Render app URL (e.g. `https://dwim-church.onrender.com`)

### Step 3: Seed the database
After deployment, run in Render Shell or locally (with production MONGODB_URI):
```bash
npm run seed
```

---

## 📁 Project Structure

```
dwim-church/
├── backend/
│   ├── models/          # User, Media, Event, Sermon, Announcement
│   ├── routes/          # auth, users, media, events, sermons, announcements, gallery, dashboard
│   ├── middleware/       # JWT auth, role-based access
│   ├── config/          # Cloudinary setup
│   ├── scripts/         # Database seed
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/        # Public + Admin pages
│       ├── components/   # Layouts (Public, Admin)
│       └── context/      # AuthContext
├── render.yaml           # Render deployment config
└── README.md
```

---

## 🔐 Roles

| Role | Access |
|------|--------|
| `admin` | Full access — all CRUD, user management |
| `pastor` | Content access (future expansion) |
| `deacon` | Limited access (future expansion) |
| `member` | Read-only public content |

---

Built with ❤️ for Destiny Word International Ministries
