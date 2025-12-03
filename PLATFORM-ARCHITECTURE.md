# 🏗️ TourLayer Platform Architecture

## Overview

Complete SaaS platform with **Web App + API + Chrome Extension**

Like Hopscotch: Users manage tours in web dashboard, extension connects via API token.

---

## 📁 Project Structure

```
PLG/
├── extension/                    # Chrome Extension (Bridge/Connector)
│   ├── manifest.json
│   ├── popup/                    # Simple popup asking for API token
│   ├── content/                  # Tour player injected on websites
│   └── background/               # API communication
│
├── web/                          # Web Platform (Main App)
│   ├── app/
│   │   ├── (auth)/               # Login/Signup pages
│   │   ├── dashboard/            # Main dashboard
│   │   ├── tours/                # Tour management
│   │   │   ├── page.tsx          # Tour list
│   │   │   ├── new/              # Tour builder
│   │   │   └── [id]/             # Edit tour
│   │   ├── settings/             # Settings (API token)
│   │   └── api/                  # API Routes
│   │       ├── auth/             # Authentication endpoints
│   │       ├── tours/            # Tour CRUD
│   │       └── public/           # Public endpoints for extension
│   │
│   ├── components/               # React components
│   └── lib/                      # Utilities
│       ├── db.ts                 # Database connection
│       ├── auth.ts               # Authentication
│       └── types.ts              # TypeScript types
│
└── snippet/                      # Optional JS snippet (for end users)
    └── tourlayer.js              # Tiny script (<5KB)
```

---

## 🔄 Data Flow

### 1. User Creates Tour (Web App)

```
User → Dashboard → Tour Builder → API → Database
```

1. Login to web app
2. Create new tour
3. Add steps (visual builder)
4. Save to database via API

### 2. Extension Loads Tour (Website)

```
Extension → API (with token) → Get Tours → Inject Player
```

1. User installs extension
2. Enters API token from settings page
3. Extension requests tours from API
4. Injects tour player on matching websites

### 3. End User Views Tour

```
Website → Extension detects URL → Shows beacon → User clicks → Tooltip appears
```

---

## 🗄️ Database Schema

### Users
- id, email, password_hash, name
- **api_token** (for extension authentication)
- created_at

### Tours
- id, user_id, name, url_pattern
- is_active, created_at, updated_at

### Tour Steps
- id, tour_id, step_order
- selector, title, content
- image_url, button_text, placement
- pulse_enabled

### Analytics
- id, tour_id, step_id
- event_type (started/completed/skipped)
- user_identifier, timestamp

---

## 🔐 Authentication

### Web App (JWT)
- User logs in with email/password
- Receives JWT token
- Token stored in localStorage
- All API calls include `Authorization: Bearer <token>`

### Extension (API Token)
- User copies token from settings page
- Extension stores token
- All requests include `X-API-Token: <token>`

---

## 🌐 API Endpoints

### Authentication (Web App)
```
POST /api/auth/signup      - Create account
POST /api/auth/login       - Login
GET  /api/auth/me          - Get current user
```

### Tours (Web App - Requires JWT)
```
GET    /api/tours          - List tours
POST   /api/tours          - Create tour
GET    /api/tours/:id      - Get tour with steps
PATCH  /api/tours/:id      - Update tour
DELETE /api/tours/:id      - Delete tour
```

### Public (Extension - Requires API Token)
```
GET /api/public/tours?url=  - Get tours for URL
POST /api/public/analytics  - Track tour events
```

---

## 🎨 Web Dashboard Pages

### 1. Login/Signup (`/`)
- Email/password form
- Create account or sign in

### 2. Dashboard (`/dashboard`)
- Overview stats
- Recent tours
- Quick actions

### 3. Tours List (`/tours`)
- Table of all tours
- Search and filter
- Create new button

### 4. Tour Builder (`/tours/new`)
- Visual interface to create tours
- Add steps with form
- Preview tours

### 5. Settings (`/settings`)
- **API Token displayed** (copy button)
- Regenerate token
- Account settings

---

## 🔌 Chrome Extension (Updated)

### Popup
```html
┌─────────────────────────┐
│  🎯 TourLayer           │
│                         │
│  API Token:             │
│  [____________________] │
│  [Save]                 │
│                         │
│  Status: ✅ Connected   │
│                         │
│  Active Tours: 3        │
│  └ View Dashboard       │
└─────────────────────────┘
```

### How It Works
1. User enters API token (from web app)
2. Extension fetches tours from `/api/public/tours`
3. Injects content script on matching URLs
4. Shows beacons and tooltips
5. Tracks analytics back to API

---

## 📦 Deployment

### Web App
- **Platform**: Vercel / Railway / AWS
- **Database**: PostgreSQL (Supabase / Neon / RDS)
- **Environment Variables**:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_API_URL`

### Extension
- Build with `npm run build`
- Submit to Chrome Web Store
- Users install from store

### Snippet (Optional)
- Host on CDN
- Users add `<script>` tag to website
- Alternative to extension

---

## 🚀 Getting Started

### 1. Setup Database
```bash
# Create PostgreSQL database
createdb tourlayer

# Run schema
psql tourlayer < web/lib/db/schema.sql
```

### 2. Setup Web App
```bash
cd web
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

### 3. Build Extension
```bash
cd extension
npm install
npm run build
# Load dist/ in Chrome
```

### 4. Test Flow
1. Open http://localhost:3000
2. Sign up for account
3. Create a tour
4. Go to Settings → Copy API token
5. Open extension → Paste token
6. Visit matching URL → See tour!

---

## ✨ Key Features

### Web App
- ✅ User authentication
- ✅ Tour management dashboard
- ✅ Visual tour builder
- ✅ API token management
- ✅ Analytics (basic)

### Extension
- ✅ API token authentication
- ✅ Fetches tours from API
- ✅ Shadow DOM tour player
- ✅ Smart element selectors
- ✅ Beautiful UI (beacons & tooltips)

### Coming Soon
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Multi-language support
- [ ] Video embeds

---

**This is the correct architecture!** Extension is just a bridge, all management happens in the web app. 🎯

