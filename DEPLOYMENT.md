# 🚀 Deployment Guide - Vercel + Supabase

Complete step-by-step guide to deploy TourLayer to production.

---

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: `tourlayer` (or your choice)
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free
6. Click "Create new project" (takes ~2 minutes)

### 1.2 Setup Database Schema

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy the entire contents of `/web/lib/db/schema.sql`
4. Paste into the editor
5. Click "Run" (bottom right)
6. You should see: "Success. No rows returned"

### 1.3 Get Connection String

1. Click "Settings" (⚙️ icon in sidebar)
2. Click "Database"
3. Scroll to "Connection string"
4. Select "URI" tab
5. Copy the connection string
6. **Important**: Replace `[YOUR-PASSWORD]` with your actual password
7. Save this! You'll need it for Vercel

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

---

## 📦 Step 2: Prepare Git Repository

### 2.1 Initialize Git

```bash
cd /Users/brightonbeach/Documents/PLG

# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: TourLayer platform"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `tourlayer` (or your choice)
3. Description: "Product tour platform with Chrome extension"
4. Choose **Private** or **Public**
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 2.3 Push to GitHub

```bash
# Add GitHub as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR-USERNAME/tourlayer.git

# Push code
git branch -M main
git push -u origin main
```

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Find your `tourlayer` repository
5. Click "Import"

### 3.2 Configure Project

**Important Settings:**

1. **Root Directory**: 
   - Click "Edit" next to Root Directory
   - Set to: `web`
   - Click "Continue"

2. **Framework Preset**: 
   - Should auto-detect "Next.js"

3. **Build Command**: 
   - Leave default: `npm run build`

4. **Install Command**: 
   - Leave default: `npm install`

### 3.3 Add Environment Variables

Click "Environment Variables" and add these:

```bash
# Database
DATABASE_URL
# Paste your Supabase connection string
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# JWT Secret (generate random string)
JWT_SECRET
# Generate: openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/32

# API URLs (update after first deploy)
NEXT_PUBLIC_API_URL
https://your-project.vercel.app/api

NEXT_PUBLIC_APP_URL
https://your-project.vercel.app
```

**Note**: For NEXT_PUBLIC vars, use temporary values for now. Update after first deploy.

### 3.4 Deploy!

1. Click "Deploy"
2. Wait ~2-3 minutes
3. You'll see "🎉 Congratulations!"
4. Click "Visit" to see your live site

### 3.5 Update Environment Variables

1. Copy your Vercel URL (e.g., `https://tourlayer.vercel.app`)
2. Go to Vercel dashboard → Your Project → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL`:
   - Value: `https://your-project.vercel.app/api`
4. Edit `NEXT_PUBLIC_APP_URL`:
   - Value: `https://your-project.vercel.app`
5. Go to Deployments tab
6. Click "..." → "Redeploy"

---

## ✅ Step 4: Test Your Deployment

### 4.1 Create Account

1. Visit your Vercel URL
2. Click "Sign up"
3. Create account with email/password
4. You should be redirected to dashboard

### 4.2 Test API

Create a tour:
1. Click "Create New Tour"
2. Fill in details
3. Save

Check settings:
1. Go to Settings
2. You should see your API token
3. Copy it!

---

## 🔧 Step 5: Update Chrome Extension

Now that your API is live, update the extension to use it.

Edit `/extension/src/config.ts` (or similar):

```typescript
export const API_URL = 'https://your-project.vercel.app/api';
```

Rebuild extension:
```bash
cd extension
npm run build
```

---

## 🎉 You're Live!

Your platform is now deployed:

- ✅ Web app on Vercel
- ✅ Database on Supabase
- ✅ API working
- ✅ Authentication working

---

## 🔄 Future Deploys

Every time you push to GitHub `main` branch, Vercel will auto-deploy!

```bash
git add .
git commit -m "Your changes"
git push
# Vercel auto-deploys in ~2 minutes
```

---

## 🐛 Troubleshooting

### Database Connection Error

Check:
1. DATABASE_URL is correct in Vercel
2. Password has no special characters issues
3. Try connection string from Supabase Settings → Database

### Build Fails

Check:
1. Root directory is set to `web`
2. All environment variables are set
3. Check build logs in Vercel

### API Not Working

Check:
1. NEXT_PUBLIC_API_URL matches your domain
2. No trailing slashes in URLs
3. Check Network tab in browser DevTools

---

## 📊 Monitoring

### Vercel Dashboard

- View deployments
- Check logs
- Monitor performance

### Supabase Dashboard

- View database
- Check logs
- Monitor queries

---

## 💰 Costs

### Free Tier Limits

**Vercel Free:**
- 100GB bandwidth/month
- Unlimited projects
- Perfect for MVP

**Supabase Free:**
- 500MB database
- 2GB bandwidth/month
- 50,000 API requests/month
- Perfect for testing

### When to Upgrade

- Vercel: ~$20/month for Pro (more bandwidth)
- Supabase: ~$25/month for Pro (more storage)

---

## 🔐 Security Checklist

- ✅ Environment variables not in Git
- ✅ JWT_SECRET is random and secure
- ✅ Database password is strong
- ✅ HTTPS enabled (Vercel does this)
- ✅ API endpoints validate auth

---

**You're all set! Your platform is production-ready! 🚀**

