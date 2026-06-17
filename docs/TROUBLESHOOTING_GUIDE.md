# Troubleshooting Guide — Genda Phool Break-A-Thon

---

## Quick Diagnosis Commands

```bash
# Check if backend is running
curl http://localhost:3000/api/apps/default/entities/EventSettings

# Check if DB is connected (should return user list or empty array)
curl http://localhost:3000/api/apps/default/admin/entities/Registration \
  -H "Authorization: Bearer <MARSHAL_TOKEN>"

# Clear browser session for participant
localStorage.removeItem("bat_marshal_token")
sessionStorage.removeItem("bat_participant_session")

# View DB in browser
cd breakathon-backend && npx prisma studio
```

---

## Authentication Issues

### Marshal can't log in — "Invalid email or password"

**Cause 1**: Wrong password or email typo.
**Fix**: Verify credentials. If forgotten, reset the password hash:
```bash
cd breakathon-backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
bcrypt.hash('new-password', 10).then(hash =>
  prisma.user.update({ where: { email: 'marshal@example.com' }, data: { password: hash } })
).then(console.log);
"
```

**Cause 2**: Marshal account doesn't exist yet.
**Fix**: Create it (see Deployment Guide, Part 1, Step 4).

---

### Participant can't log in — "You must be checked in"

**Cause**: Registration exists but `checked_in = false`.
**Fix**: Go to Marshal Check-In (`/marshal/checkin`), find the participant, and click Check In. Or update directly in Prisma Studio.

---

### Participant logs in but gets redirected to marshal queue

**Cause**: `bat_marshal_token` exists in localStorage from a previous marshal session.
**Fix (browser console)**:
```javascript
localStorage.removeItem("bat_marshal_token")
```
Then refresh and log in as participant again.

This happens when the same browser was used for both marshal and participant testing.

---

### JWT token is accepted but user shows wrong role

**Cause**: `shapeUser()` in `auth.service.js` lowercases the role. If any middleware checks `=== "MARSHAL"` (uppercase only), it will fail.
**Fix**: The controller must check both cases:
```javascript
if (req.user.role !== "MARSHAL" && req.user.role !== "marshal") {
  return res.status(403).json({ error: "Forbidden" });
}
```

---

## Bug Queue Issues

### Bug Queue shows "0 reports" despite bugs in DB

**Cause**: Role case mismatch in `bugs.entity.controller.js`.
**Check**:
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <MARSHAL_TOKEN>"
```
If `role` is `"marshal"` (lowercase) but controller checks `=== "MARSHAL"`, the request falls through to participant view which may return empty results.

**Fix**: Ensure the controller checks both `"MARSHAL"` and `"marshal"`:
```javascript
// In bugs.entity.controller.js listBugReports:
const isMarshalf = req.user?.role === "MARSHAL" || req.user?.role === "marshal";
```

---

### Bug severity not saving — always null

**Cause**: Zod `marshalUpdateSchema` uses `BugSeverity` (DB enum: `LAUNCH_BLOCKER`) but frontend sends `"Launch Blocker"` (human-readable). Zod rejects the value with 422.
**Check**: Look at server logs for `422 Unprocessable Entity` on PATCH requests.
**Fix**: The `marshalUpdateSchema` must use `BugSeverityLabel` (human-readable enum), not `BugSeverity`. See `bugs.validation.js`.

---

### Bug status not saving

Same root cause as severity. Verify `BugStatusLabel` is used in `marshalUpdateSchema`, not `BugStatus`.

---

## Leaderboard Issues

### Leaderboard shows wrong points / too high

**Cause**: Counting points from Pending, Rejected, or Needs More Info bugs.
**Fix**: Points should only accumulate for `"Validated"` and `"Duplicate"` statuses:
```javascript
if (r.status === "Validated" || r.status === "Duplicate") {
  participantMap[pid].total_points += r.points_awarded || 0;
}
```

---

### Leaderboard shows "hidden" message unexpectedly

**Cause**: `leaderboard_visible` is `false` in EventSettings.
**Fix**: In AdminSettings, turn ON the "Leaderboard Visible" toggle.

---

## Registration Issues

### Registration form not showing event details (shows defaults)

**Cause**: EventSettings row doesn't exist in DB, or frontend can't reach the backend.
**Check**:
```bash
curl http://localhost:3000/api/apps/default/entities/EventSettings
```
If empty array `[]`, the settings row hasn't been created yet.
**Fix**: Log in as marshal and save anything in AdminSettings — this triggers the upsert and creates the row.

---

### Registration is closed even though toggle is ON

**Cause 1**: `registration_deadline` is set to a past date.
**Fix**: Clear or update the deadline in AdminSettings.

**Cause 2**: `max_participants` is set and `current_participants >= max_participants`.
**Fix**: Increase `max_participants` or clear it in AdminSettings.

---

### "Email already registered" but participant can't log in

**Cause**: The registration exists but email/phone combo is wrong, or they're not checked in.
**Check in Prisma Studio**: Find the registration by email, verify the phone stored matches what they're typing (no spaces or formatting differences).

---

## Payment Issues

### Razorpay checkout doesn't open

**Cause 1**: `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is missing or wrong.
**Check**: `curl http://localhost:3000/api/apps/default/user/functions/createRazorpayOrder -X POST -H "Content-Type: application/json" -d '{}'`
Should return `{ success: true, data: { order_id: "..." } }`.

**Cause 2**: Frontend is not getting the order_id back.
**Check**: Open browser DevTools → Network → filter `createRazorpayOrder` → check response.

---

### Payment verification fails / returns 400

**Cause**: HMAC signature doesn't match — the payment may have been tampered with, or the wrong `RAZORPAY_KEY_SECRET` is in env.
**Fix**: Verify `RAZORPAY_KEY_SECRET` in `.env` matches exactly what's in the Razorpay Dashboard under API Keys. Test/live keys are different.

---

## File Upload Issues

### File upload returns 429

**Cause**: Rate limit hit — 30 uploads per IP per 15 minutes.
**Fix**: Wait 15 minutes, or temporarily increase the limit in `upload.controller.js`:
```javascript
const uploadRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
```

---

### Uploaded file URL returns 404

**Cause**: Server restarted and `/uploads` folder was wiped (happens on serverless platforms).
**Fix for development**: Files are in `breakathon-backend/uploads/`. Restart shouldn't clear them locally.
**Fix for production**: Mount a persistent volume or switch to cloud storage (S3/Cloudinary).

---

### Screenshot uploads but image doesn't show in Bug Detail Panel

**Cause**: `file_url` contains `localhost:3000` but the marshal is viewing from a different machine or production URL.
**Fix**: Ensure `VITE_API_BASE_URL` in the frontend matches the actual backend URL. In production, uploaded `file_url` values should point to the production backend URL, not localhost.

---

## Email Issues

### Registration confirmation emails not sent

**Cause 1**: SMTP credentials not configured — email is silently skipped.
**Check**: Look for `"SMTP not configured"` warning in server logs.
**Fix**: Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` to `.env`.

**Cause 2**: Gmail app password has spaces — must be quoted in `.env`:
```
SMTP_PASS="xxxx xxxx xxxx xxxx"
```

**Cause 3**: Gmail account doesn't have 2FA enabled — app passwords require 2FA.

**Cause 4**: "Less secure app access" is not a solution — use an app password instead.

---

### Emails go to spam

**Fix options**:
- Add a custom "From" domain instead of Gmail
- Set up SPF/DKIM records for your domain
- Use a transactional email service (SendGrid, Mailgun, Resend) instead of Gmail SMTP for production

---

## CORS Issues

### API calls blocked with "has been blocked by CORS policy"

**Cause**: `CLIENT_URL` in backend env doesn't match the frontend origin.
**Fix**: Update `CLIENT_URL` to exactly match the frontend URL (no trailing slash):
```
CLIENT_URL=http://localhost:5173          # development
CLIENT_URL=https://your-app.vercel.app    # production
```
Restart the backend after changing.

---

## Database Issues

### "Can't reach database server"

**Cause**: `DATABASE_URL` is wrong or Neon project is paused.
**Check**: Log in to [neon.tech](https://neon.tech), verify the project is active and the connection string matches.

**Cause 2**: Missing `?sslmode=require` at end of Neon connection string.
**Fix**: Add `?sslmode=require` to `DATABASE_URL`.

---

### Schema out of sync — "Unknown field" Prisma errors

**Cause**: `schema.prisma` was updated but `prisma generate` or `prisma db push` wasn't run.
**Fix**:
```bash
cd breakathon-backend
npx prisma db push
npx prisma generate
npm run dev  # restart
```

---

### EventSettings row keeps resetting

**Cause**: `db push --force-reset` was run, wiping all data.
**Fix**: Re-save settings in AdminSettings. Consider backing up the DB before running destructive Prisma commands.

---

## Frontend Issues

### Pages load but show no data / blank content

**Cause 1**: `VITE_API_BASE_URL` not set or pointing to wrong URL.
**Check**: Open DevTools → Network tab → look at what URL the API calls are hitting.

**Cause 2**: Backend not running.
**Fix**: `cd breakathon-backend && npm run dev`

---

### Settings changes in AdminSettings don't reflect on other pages

**Cause**: TanStack React Query caches the `["eventSettings"]` query. Cache has a stale time — other pages may not refetch immediately.
**Fix**: Refresh the page. In production, the cache stale time can be reduced in `query-client.js`.

---

### "Submit Bug" page shows submission closed even after Event Started is ON

**Cause**: Browser has a cached version of EventSettings with `event_started = false`.
**Fix**: Refresh the page — the `["eventSettings"]` query will re-fetch from the server.

---

## GitHub / Version Control Issues

### Duplicate files in repo (e.g., "Login 2.jsx", "main 2.css")

**Cause**: macOS auto-renames files instead of replacing them when copying a folder that already contains same-named files.
**Fix**: Delete the numbered duplicates in GitHub Desktop (right-click → Discard Changes, or delete the files directly). Keep only the originals without numbers.

---

### Merge conflicts on Login.jsx or ParticipantLogin.jsx

**Cause**: The old repo had a different version of these files (with `navigate("/")` instead of `navigate("/submit")`).
**Fix**: Accept "Use the modified file from main" — the newer version with `navigate("/submit")` is correct. The old `navigate("/")` caused participants to be redirected to the marshal queue.

---

## Performance Issues

### Bug Queue loads slowly with many reports

**Cause**: Fetching all bug reports in one request.
**Fix (short-term)**: Reduce `limit` parameter in the API call.
**Fix (long-term)**: Implement pagination in `bugs.entity.controller.js` using Prisma's `skip` and `take`.

---

### Leaderboard is slow to update

**Cause**: Leaderboard polls every 60 seconds by design.
**Fix for immediate update**: Refresh the page manually. For real-time updates, a WebSocket implementation would be needed (not currently built).
