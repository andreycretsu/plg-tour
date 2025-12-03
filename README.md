# 🎯 TourLayer - Product Tour Platform

A complete SaaS platform for creating interactive product tours on any website. Like Hopscotch or Pendo, but with a Chrome Extension-first approach.

## 🌟 Features

- 🎨 **Web Dashboard** - Manage tours with beautiful UI
- 🔐 **Authentication** - Secure user accounts with JWT
- 🔌 **Chrome Extension** - Connect via API token
- 📊 **Analytics** - Track tour performance (coming soon)
- 👥 **Team Collaboration** - Share tours (coming soon)

## 🏗️ Architecture

### Web Platform
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based
- **Deployment**: Vercel

### Chrome Extension
- **Purpose**: API connector
- **Auth**: API token from settings
- **Player**: Shadow DOM isolated

## 📁 Project Structure

```
PLG/
├── web/                 # Next.js web application
│   ├── app/            # App router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities & database
│   └── public/         # Static assets
│
└── extension/          # Chrome extension
    ├── src/            # Extension source
    └── public/         # Extension assets
```

## 🚀 Quick Start (Development)

### Prerequisites

- Node.js 18+
- PostgreSQL or Supabase account

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/tourlayer.git
cd tourlayer/web
npm install
```

### 2. Setup Environment

Create `web/.env.local`:

```env
DATABASE_URL=your_supabase_postgres_url
JWT_SECRET=your_random_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Database

```bash
# Run migrations
psql $DATABASE_URL < lib/db/schema.sql
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment (Vercel + Supabase)

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Run SQL from `web/lib/db/schema.sql` in SQL Editor

### 2. Vercel Deployment

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory: `web`
5. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_API_URL` (your vercel URL)
   - `NEXT_PUBLIC_APP_URL` (your vercel URL)
6. Deploy!

## 📖 Documentation

- [Platform Architecture](PLATFORM-ARCHITECTURE.md)
- [Complete Setup Guide](COMPLETE-SETUP-GUIDE.md)
- [API Documentation](web/lib/API.md)

## 🎯 Usage

### For Product Managers

1. **Sign up** at your deployed URL
2. **Create tours** in the dashboard
3. **Copy API token** from Settings
4. **Install extension** and paste token
5. **Tours appear** on matching websites!

### For Developers

Check out the [API Documentation](web/lib/API.md) to integrate tours programmatically.

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT with bcrypt
- **API**: Next.js API Routes
- **Deployment**: Vercel
- **Extension**: Chrome Manifest V3

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tours
- `GET /api/tours` - List tours
- `POST /api/tours` - Create tour
- `GET /api/tours/:id` - Get tour details
- `PATCH /api/tours/:id` - Update tour
- `DELETE /api/tours/:id` - Delete tour

### Public (Extension)
- `GET /api/public/tours?url=` - Get tours for URL

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with inspiration from Hopscotch, Pendo, and Intercom.

---

**Made with ❤️ for Product Managers who want to ship faster**
