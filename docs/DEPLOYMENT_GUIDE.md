# Deployment Guide — Genda Phool Break-A-Thon

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18.x or higher |
| npm | 9.x or higher |
| Git | Any recent version |
| PostgreSQL | via Neon (serverless, no local install needed) |

---

## Part 1: Local Development

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Set Up the Backend

```bash
cd breakathon-backend
npm install
```

Create `.env` in `breakathon-backend/`:
```env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
JWT_SECRET="your-64-char-random-secret"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="you@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="Break-A-Thon <you@gmail.com>"
```

Push the schema to the database:
```bash
npx prisma db push
npx prisma generate
```

Start the backend:
```bash
npm run dev
# Server runs at http://localhost:3000
```

### 3. Set Up the Frontend

```bash
cd ../breakathon-frontend
npm install
```

Create `.env.local` in `breakathon-frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ID=default
```

Start the frontend:
```bash
npm run dev
# App runs at http://localhost:5173
```

### 4. Create the First Marshal Account

```bash
cd breakathon-backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
bcrypt.hash('your-password', 10).then(hash =>
  prisma.user.create({
    data: {
      name: 'Head Marshal',
      email: 'marshal@yourdomain.com',
      password: hash,
      role: 'MARSHAL'
    }
  })
).then(u => { console.log('Created:', u.email); prisma.\$disconnect(); });
"
```

---

## Part 2: Production Deployment

### Backend — Deploy to Railway / Render / Fly.io

The backend is a standard Node.js Express app. Use any Node-compatible hosting.

#### Using Railway (recommended)

1. Create a new Railway project
2. Connect your GitHub repo
3. Set the **root directory** to `breakathon-backend`
4. Set **start command**: `npm start`
5. Add all environment variables from `.env` in Railway's Variables tab
6. Deploy — Railway auto-detects Node.js

#### Using Render

1. Create a new Web Service
2. Connect repo, set root directory to `breakathon-backend`
3. Build command: `npm install && npx prisma generate`
4. Start command: `node server.js`
5. Add environment variables
6. Deploy

#### Port Configuration
The backend reads `PORT` from env. Railway/Render/Fly.io set this automatically. Your `PORT` env var will be overridden — that's expected.

#### After First Deploy
Run schema migration against the production database:
```bash
# From local machine with production DATABASE_URL
DATABASE_URL="<production-url>" npx prisma db push
```

Or if your host supports running commands, run it in the deployment shell.

---

### Frontend — Deploy to Vercel / Netlify

The frontend is a Vite React app and deploys as a static site.

#### Using Vercel (recommended)

1. Push frontend folder to GitHub (can be same repo or separate)
2. Create new Vercel project
3. Set **Root Directory** to `breakathon-frontend`
4. Framework preset: **Vite**
5. Add environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   VITE_APP_ID=default
   ```
6. Deploy

#### Using Netlify

1. Connect repo to Netlify
2. Base directory: `breakathon-frontend`
3. Build command: `npm run build`
4. Publish directory: `breakathon-frontend/dist`
5. Add environment variables
6. Deploy

#### CORS Configuration
After deploying the frontend, update `CLIENT_URL` in your backend environment to match the production frontend URL:
```
CLIENT_URL=https://your-app.vercel.app
```

Redeploy the backend after changing this.

---

### Database — Neon (PostgreSQL)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (includes SSL mode)
4. Use it as `DATABASE_URL` in backend env vars
5. Run `npx prisma db push` to initialize the schema

Neon automatically handles connection pooling and SSL. The connection string format:
```
postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require
```

---

### Razorpay — Switch to Live Mode

1. Log in to Razorpay Dashboard
2. Switch toggle from Test to Live mode
3. Generate new API keys under **Settings → API Keys**
4. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in production env

The frontend's Razorpay checkout auto-detects test vs. live based on the `key_id` prefix (`rzp_test_` vs. `rzp_live_`).

---

### Email — Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Go to **Google Account → Security → App Passwords**
3. Create an app password for "Mail"
4. Copy the 16-character app password (with spaces)
5. Set in env:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@gmail.com
   SMTP_PASS="xxxx xxxx xxxx xxxx"
   SMTP_FROM="Genda Phool Break-A-Thon <you@gmail.com>"
   ```

Daily limit: 500 emails/day on Gmail. For larger events, use SendGrid or Mailgun instead (update `email.service.js` accordingly).

---

## Part 3: File Uploads in Production

The current setup saves uploaded files to a local `/uploads` directory. This does not work on serverless platforms (files are lost on deploy/restart).

### Option A: Persist with a Volume (Railway/Fly.io)
- Mount a persistent volume to the `/uploads` path
- Files survive restarts but not horizontal scaling

### Option B: Migrate to Cloud Storage (Recommended for Production)
Replace the local multer storage with cloud storage:

1. Create an S3 bucket or Cloudinary account
2. Replace `multer.diskStorage` in `upload.controller.js` with `multer-s3` or a Cloudinary upload
3. Update `file_url` to point to the cloud URL instead of `localhost:3000/uploads/`

For a one-day event, a persistent volume on Railway is sufficient.

---

## Part 4: Environment Variables Reference

### Backend (Required)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `PORT` | No | HTTP port (default: 3000) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `RAZORPAY_KEY_ID` | Yes | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret key |
| `SMTP_HOST` | No | SMTP hostname (email skipped if missing) |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address for emails |

### Frontend (Required)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend URL (no trailing slash) |
| `VITE_APP_ID` | Yes | App ID path segment (use `default`) |

---

## Part 5: Monitoring

### Server Logs
Morgan logs all HTTP requests to stdout. View in Railway/Render's logging dashboard.

### Health Check
The backend has no explicit health check endpoint. You can verify it's running:
```bash
curl https://your-backend.railway.app/api/apps/default/entities/EventSettings
```
Should return an array (possibly empty).

### Database
Use Prisma Studio for database inspection:
```bash
DATABASE_URL="<production-url>" npx prisma studio
```

---

## Part 6: Post-Deployment Checklist

- [ ] Backend URL is accessible from the internet
- [ ] Frontend loads without console errors
- [ ] CORS headers allow the frontend origin
- [ ] `GET /entities/EventSettings` returns data (or empty array)
- [ ] Marshal login works
- [ ] Test participant registration with Razorpay test card
- [ ] Test file upload returns a valid `file_url`
- [ ] Email is sent on registration
- [ ] Razorpay switched to live mode before event day
- [ ] Production DATABASE_URL is Neon, not local
