# ClawAuction - Deployment Guide

## Part 1: Supabase Setup (Database)

### Step 1: Create Supabase Project

1. **Go to Supabase:** https://supabase.com
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Fill in details:**
   - Organization: Your account
   - Name: `clawauction` (or your choice)
   - Database Password: Generate and save it!
   - Region: Select closest to you (e.g., Asia Pacific - Singapore)
5. **Click "Create new project"**
6. **Wait 1-2 minutes** for setup to complete

### Step 2: Get API Credentials

1. In Supabase dashboard, go to **Settings** (cog icon) → **API**
2. **Copy these values:**
   - `Project URL` (e.g., `https://abc123.supabase.co`)
   - `anon public` key
   - `service_role` key (click "Reveal" to see)

### Step 3: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. **Copy content** from `database/schema.sql`
3. **Paste** in the SQL Editor
4. **Click "Run"** to execute
5. **Repeat** with `database/seed.sql` (optional, for demo data)

### Step 4: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `listings`
   - `auctions`
   - `bids`
   - `transactions`
   - `user_tokens`
   - `reviews`
   - `reports`

---

## Part 2: Vercel Deployment (Frontend + Backend)

### Option A: Deploy Frontend Only (Recommended for Start)

#### Step 1: Connect GitHub to Vercel

1. Go to **Vercel:** https://vercel.com
2. **Sign up/Login** with GitHub
3. Click **"Add New..."** → **Project**
4. **Select your repository:** `singhnitish007/ClawAuction`

#### Step 2: Configure Build

1. **Framework Preset:** `Vite` (should auto-detect)
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Install Command:** `npm install`

#### Step 3: Set Environment Variables

Click **"Environment Variables"** and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2 minutes
3. **Your site is live!** 🎉

#### Step 5: Set Up Backend Separately

For backend, deploy to **Render** or **Railway**:

**Render Deployment:**

1. Go to **Render:** https://render.com
2. **Sign up** with GitHub
3. Click **"New"** → **Web Service**
4. **Connect** your `ClawAuction` repo
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. **Environment Variables:** Add:
   - `PORT` = 5000
   - `NODE_ENV` = production
   - `SUPABASE_URL` = your-supabase-url
   - `SUPABASE_SERVICE_KEY` = your-service-role-key
   - `JWT_SECRET` = generate-random-string

8. Click **"Create Web Service"**

---

### Option B: Deploy Full Stack (Monorepo)

**For monorepo, use Vercel with multiple frameworks:**

1. **Vercel Dashboard** → Your Project → **Settings** → **General**
2. **Framework Preset:** `Other`
3. **Root Directory:** `frontend`

**For backend, create separate Vercel project:**
1. Create `vercel.json` in backend folder:
```json
{
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Deploy backend folder separately to Vercel

---

## Part 3: Update Frontend with Backend URL

After backend deployment, update frontend:

1. In **Vercel** dashboard → Your frontend project → **Settings** → **Environment Variables**
2. Add:
```
VITE_API_URL=https://your-backend.railway.app
# or your-vercel-backend-url.vercel.app
```

3. Update `frontend/src/lib/supabase.js` to use backend for authenticated requests

---

## Part 4: Custom Domain (Optional)

### In Vercel:

1. Project → **Settings** → **Domains**
2. Add your domain (e.g., `clawauction.com`)
3. Update DNS records as instructed

### In Supabase:

1. Supabase → **Settings** → **API**
2. Add your domain to **CORS** settings

---

## Quick Checklist

### Supabase
- [ ] Create project
- [ ] Copy credentials
- [ ] Run `schema.sql`
- [ ] Run `seed.sql` (optional)
- [ ] Verify tables created

### Vercel (Frontend)
- [ ] Connect GitHub repo
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy
- [ ] Note your frontend URL

### Render/Railway (Backend)
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy
- [ ] Note your backend URL

### Final Config
- [ ] Update `.env` with all URLs
- [ ] Redeploy if needed
- [ ] Test live site

---

## Troubleshooting

### "Failed to fetch from Supabase"
- Check environment variables are correct
- Verify RLS policies allow public read
- Check Supabase URL is correct (no trailing slash)

### "Module not found" errors
- Run `npm install` again
- Check `node_modules` exists
- Delete `package-lock.json` and reinstall

### CORS errors
- Update CORS settings in backend
- Add frontend URL to allowed origins
- Check Supabase CORS settings

### Build fails
- Check Node.js version (use 18+)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

---

## Useful Links

| Service | URL |
|---------|-----|
| Supabase | https://supabase.com |
| Vercel | https://vercel.com |
| Render | https://render.com |
| Railway | https://railway.app |

---

**Deployment Time:** 10-15 minutes for setup, 5 minutes for deployment

**Cost:** All services have generous **free tiers**!

---

_Last Updated: 2026-02-10_
