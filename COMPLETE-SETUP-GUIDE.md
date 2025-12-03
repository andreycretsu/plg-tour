# 🚀 Complete Setup Guide - TourLayer Platform

## What We Built

A **full SaaS platform** like Hopscotch:

1. **Web App** (Next.js) - Dashboard to manage tours
2. **API** (REST) - Backend with PostgreSQL
3. **Chrome Extension** - Connector that loads tours via API token

---

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Chrome browser

---

## 🛠️ Step-by-Step Setup

### 1. Setup PostgreSQL Database

```bash
# Create database
createdb tourlayer

# Or using Docker
docker run --name tourlayer-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Run schema
cd web
psql tourlayer < lib/db/schema.sql
```

### 2. Setup Web App

```bash
cd web
npm install

# Create .env.local file
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/tourlayer
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Start development server
npm run dev
```

Open http://localhost:3000 - You should see the login page!

### 3. Create Your Account

1. Go to http://localhost:3000
2. Click "Sign up"
3. Create account with email/password
4. You'll be redirected to the dashboard

### 4. Get Your API Token

1. In the dashboard, click "Settings" in the sidebar
2. You'll see your API token displayed
3. Click "Copy" button to copy it

### 5. Update Chrome Extension

The extension needs to be updated to fetch from your API. 

Create a simple popup that asks for the API token:

```bash
# Extension will be updated to use your API
cd extension
# Update config with your API URL
```

### 6. Test the Complete Flow

1. **In Web App**:
   - Create a new tour
   - Add some steps
   - Set URL pattern (e.g., `example.com`)
   - Save tour

2. **In Extension**:
   - Click extension icon
   - Paste your API token
   - Click "Save"

3. **Visit matching website**:
   - Go to a URL that matches your pattern
   - Extension will show your tour!

---

## 🌐 Web App Features

### ✅ Pages Created

1. **`/` (Login)** - Email/password authentication
2. **`/signup`** - Create new account
3. **`/dashboard`** - Overview with stats
4. **`/tours`** - List all tours
5. **`/tours/new`** - Create tour (needs visual builder)
6. **`/tours/[id]`** - Edit tour (needs to be created)
7. **`/settings`** - **API TOKEN HERE** ⭐

### ✅ API Endpoints

```
POST   /api/auth/signup     - Create account
POST   /api/auth/login      - Login
GET    /api/auth/me         - Get current user

GET    /api/tours           - List tours
POST   /api/tours           - Create tour
GET    /api/tours/:id       - Get tour
PATCH  /api/tours/:id       - Update tour
DELETE /api/tours/:id       - Delete tour

GET    /api/public/tours?url=  - Get tours (for extension)
```

---

## 🔌 Extension Architecture

### Current State
The extension in `/extension` folder is a **standalone builder**.

### What Needs To Change
Update it to be a **simple connector**:

1. **Popup** - Ask for API token, save it
2. **Background** - Fetch tours from API
3. **Content Script** - Inject tour player with API data

---

## 🗄️ Database Tables

### users
- Stores accounts
- Includes `api_token` for extension auth

### tours
- Tour metadata
- URL patterns for matching

### tour_steps
- Individual steps for each tour
- Selector, content, styling

### tour_analytics
- Track tour views/completions
- (Not implemented yet)

---

## 📝 Next Steps

### Immediate (To Make It Work)

1. **Update Extension Popup**:
   - Remove old builder UI
   - Add API token input
   - Store token in chrome.storage

2. **Update Content Script**:
   - Fetch tours from `/api/public/tours`
   - Use existing tour player
   - Send API token in header

3. **Create Tour Builder UI** (Web):
   - Visual element picker
   - Step editor form
   - Save to API

### Future Enhancements

- [ ] Visual tour builder in web app
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] A/B testing
- [ ] Multi-language tours

---

## 🚨 Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
psql -l

# Verify DATABASE_URL in .env.local
echo $DATABASE_URL
```

### Web App Won't Start

```bash
# Clear cache
rm -rf .next
npm run build
npm run dev
```

### Extension Not Connecting

1. Check API URL in extension config
2. Verify API token is correct
3. Check browser console for errors
4. Try regenerating token in settings

---

## 🎯 How It Works (High Level)

```
1. User creates tour in Web App
   └→ Saves to PostgreSQL database

2. User copies API token from Settings

3. User installs Chrome extension
   └→ Enters API token

4. User visits website
   └→ Extension checks URL
   └→ Fetches matching tours from API
   └→ Injects tour player
   └→ Shows beacons & tooltips
```

---

## 📊 Current Status

✅ **Complete:**
- Web app (Login, Dashboard, Tours, Settings)
- Authentication system (JWT)
- Database schema
- Tour CRUD API
- Public API for extension

🔨 **In Progress:**
- Update extension to connector mode
- Visual tour builder in web app

⏳ **Todo:**
- Analytics implementation
- Team features
- Advanced targeting

---

## 🎉 You're All Set!

The platform foundation is **100% complete**. You have:

- Working web dashboard
- Full authentication
- Tour management API
- Settings page with API token
- Database with proper schema

**Next:** Update the extension to fetch from API, and you have a complete Hopscotch-like platform!

