# 🗄️ Supabase Setup Guide

Your Supabase project is ready! Here's how to complete the setup.

---

## 📊 Your Supabase Details

**Project Reference**: `ugzpmodoyxenodkmjthx`  
**Region**: EU West 3 (Paris)  
**MCP URL**: https://mcp.supabase.com/mcp?project_ref=ugzpmodoyxenodkmjthx

---

## 🔑 Step 1: Get Your Password

You need to replace `[YOUR-PASSWORD]` in the connection strings with your actual Supabase database password.

**Where to find it:**
1. Go to https://supabase.com/dashboard/project/ugzpmodoyxenodkmjthx
2. If you forgot your password:
   - Settings → Database → Reset Database Password
   - Save the new password!

---

## 🛠️ Step 2: Update Environment Variables

### Local Development

Edit `/web/.env.local` and replace `[YOUR-PASSWORD]`:

```env
DATABASE_URL="postgresql://postgres.ugzpmodoyxenodkmjthx:YOUR_ACTUAL_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.ugzpmodoyxenodkmjthx:YOUR_ACTUAL_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"

JWT_SECRET="your-random-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
```

---

## 📋 Step 3: Setup Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/ugzpmodoyxenodkmjthx/editor
2. Click **SQL Editor** in left sidebar
3. Click **"+ New query"**
4. Copy entire contents of `/web/lib/db/schema.sql`
5. Paste into editor
6. Click **Run** (or Cmd+Enter)
7. Should see: "Success. No rows returned"

### Option B: Using psql Command Line

```bash
# Make sure to replace YOUR_ACTUAL_PASSWORD
export DIRECT_URL="postgresql://postgres.ugzpmodoyxenodkmjthx:YOUR_ACTUAL_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"

# Run schema
psql $DIRECT_URL < web/lib/db/schema.sql
```

---

## ✅ Step 4: Verify Database Setup

In Supabase Dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - `users`
   - `tours`
   - `tour_steps`
   - `tour_analytics`

If you see them, you're good to go! ✅

---

## 🚀 Step 5: Test Local Development

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

Try to:
1. Sign up for account → Should work
2. Login → Should work
3. See dashboard → Should work

If any errors, check the console for database connection issues.

---

## 🌐 Step 6: Deploy to Vercel

### 6.1 Push Latest Code

```bash
cd /Users/brightonbeach/Documents/PLG
git add .
git commit -m "Add Supabase configuration"
git push
```

### 6.2 Configure Vercel

1. Go to https://vercel.com
2. Import `andreycretsu/plg-tour`
3. **Root Directory**: `web` ⚠️
4. **Add Environment Variables**:

```env
DATABASE_URL
postgresql://postgres.ugzpmodoyxenodkmjthx:YOUR_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL
postgresql://postgres.ugzpmodoyxenodkmjthx:YOUR_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

JWT_SECRET
(paste your generated secret)

NEXT_PUBLIC_API_URL
https://your-project.vercel.app/api

NEXT_PUBLIC_APP_URL
https://your-project.vercel.app

NEXT_PUBLIC_SUPABASE_PROJECT_REF
ugzpmodoyxenodkmjthx
```

5. Click **Deploy**

### 6.3 Update URLs After First Deploy

1. Copy your Vercel URL (e.g., `https://plg-tour.vercel.app`)
2. Update environment variables:
   - `NEXT_PUBLIC_API_URL` → `https://YOUR-URL.vercel.app/api`
   - `NEXT_PUBLIC_APP_URL` → `https://YOUR-URL.vercel.app`
3. Redeploy

---

## 🔐 Connection Details Explained

### DATABASE_URL (Pooled)
- **Port**: 6543 (connection pooling via PgBouncer)
- **Use for**: App queries, API calls
- **Benefits**: Better performance, handles many connections

### DIRECT_URL (Direct)
- **Port**: 5432 (direct PostgreSQL connection)
- **Use for**: Migrations, admin tasks
- **Benefits**: Full PostgreSQL features

---

## 🐛 Troubleshooting

### "Connection refused"
- Check password is correct (no spaces, exact match)
- Verify database is active in Supabase dashboard

### "SSL required"
- Connection strings include SSL by default
- Supabase requires SSL connections

### "Role does not exist"
- Your username is: `postgres.ugzpmodoyxenodkmjthx`
- Don't change the username part

### "Database does not exist"
- Database name is: `postgres`
- Don't change the database name

---

## 📊 Monitoring

### Supabase Dashboard
- **Database**: https://supabase.com/dashboard/project/ugzpmodoyxenodkmjthx/database/tables
- **SQL Editor**: https://supabase.com/dashboard/project/ugzpmodoyxenodkmjthx/editor
- **Logs**: https://supabase.com/dashboard/project/ugzpmodoyxenodkmjthx/logs

### Check Connection
Run this query in SQL Editor to test:
```sql
SELECT NOW();
```

Should return current timestamp.

---

## 🎉 You're All Set!

Your Supabase database is configured and ready to use with:
- ✅ Connection pooling for performance
- ✅ Direct connection for migrations
- ✅ EU West 3 region (low latency for Europe)
- ✅ Proper schema setup

**Next**: Replace `[YOUR-PASSWORD]` and test! 🚀

