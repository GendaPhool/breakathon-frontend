# User Manual — Genda Phool Break-A-Thon

This manual covers how to use the platform from three perspectives: participants, marshals, and event organizers.

---

## Part 1: Participant Guide

### Step 1 — Register for the Event

1. Visit the event registration page: `/event-register`
2. Fill in your details:
   - Full name
   - Email address (this is your login ID — use one you have access to)
   - Phone number (this is your password — remember it exactly as you type it)
   - College / organization name
3. Click **Pay ₹149** to proceed to payment
4. Complete the Razorpay payment using any UPI, card, or net banking method
5. After successful payment, click **Complete Registration**
6. You will receive a confirmation email at the address you provided
7. Wait for an organizer to verify your payment and assign your Participant ID

---

### Step 2 — Check In at the Event

On the day of the event:
1. Arrive at the venue and find the check-in desk
2. Tell the marshal your registered email or phone number
3. The marshal will look you up and check you in
4. You will receive a unique Participant ID (e.g., GP-001) via email once your payment is verified

You **must be checked in** before you can log in and submit bugs.

---

### Step 3 — Log In as a Participant

1. Go to `/user/login` (or `/login` → Participant tab)
2. Enter your registered **email address**
3. Enter your **phone number** as the password
4. Click **Sign In**
5. You will be taken to the Bug Submission page

If you see an error about not being checked in, contact a marshal at the check-in desk.

---

### Step 4 — Submit a Bug Report

1. From the navigation menu, go to **Submit Bug** (`/submit`)
2. Select the **module** where you found the bug
3. Review the **Duplicate Awareness List** — this shows bugs already submitted for the same module
   - Check if your bug has already been reported
   - If it is a new bug, tick the confirmation checkbox
4. Fill in the bug details:
   - **Bug Title**: Short, clear description (max 100 characters)
   - **Steps to Reproduce**: Numbered steps to trigger the bug (max 300 characters)
   - **Expected Behavior**: What should have happened (max 200 characters)
   - **Actual Behavior**: What actually happened (max 200 characters)
5. Upload a **Screenshot** (required)
6. Upload a **Screen Recording** (optional but recommended for complex bugs)
7. Click **Submit Bug Report**

You'll see a confirmation screen with your Report ID. You can submit multiple bugs throughout the event.

> **Note**: Bug submissions only open after a marshal starts the event. If you see a "submissions not open" message, wait for the marshal to begin.

---

### Step 5 — Track Your Reports

1. Go to **My Reports** (`/my-reports`) from the navigation menu
2. You'll see all your submitted bug reports with their current status:
   - **Pending Review** — Waiting for a marshal to review
   - **Validated** — Bug confirmed! Points awarded.
   - **Duplicate** — Already reported by someone else (0.5 points)
   - **Needs More Info** — Marshal needs clarification (check marshal notes)
   - **Rejected** — Not accepted as a valid bug (0 points)

---

### Step 6 — Check the Leaderboard

1. Go to **Leaderboard** (`/leaderboard`)
2. See your ranking among all participants
3. Points are updated as marshals validate bugs
4. The leaderboard refreshes automatically every 60 seconds

---

### Tips for Better Bug Reports

- Be specific in your steps — another person should be able to reproduce the bug by following your steps exactly
- Include what you expected vs. what actually happened
- Upload a clear screenshot that shows the bug
- Screen recordings are especially helpful for bugs that involve multiple steps or animations
- Submit bugs across different modules — don't focus on just one area
- Higher severity bugs (Launch Blockers) earn more points

---

## Part 2: Marshal Guide

### Logging In as a Marshal

1. Go to `/admin/login` (or `/login` → Marshal tab)
2. Enter your marshal email and password
3. You'll be taken to the Bug Queue

Your marshal session lasts 7 days. Do not share your credentials.

---

### Marshal Navigation

| Page | URL | Purpose |
|------|-----|---------|
| Bug Queue | `/marshal/queue` | Review all submitted bugs |
| Registrations | `/marshal/registrations` | Manage participant registrations |
| Check-In | `/marshal/checkin` | Check in participants at the venue |
| Stats | `/marshal/stats` | View event analytics |
| Settings | `/marshal/settings` | Configure event settings |

---

### Managing Registrations

1. Go to **Registrations** (`/marshal/registrations`)
2. Review new registrations with "Pending Verification" status
3. For each registration:
   - Verify the payment using the payment reference ID in Razorpay dashboard
   - If payment is confirmed: set status to **Verified** and assign a **Participant ID** (e.g., GP-001)
   - If payment failed or fraudulent: set status to **Rejected**
4. Once payment is verified, the participant receives an email with their Participant ID

---

### Checking In Participants

1. Go to **Check-In** (`/marshal/checkin`)
2. Search for a participant by their email, phone, or Participant ID
3. Once you find them, click **Check In**
4. The participant can now log in and submit bugs

---

### Reviewing Bug Reports

1. Go to **Bug Queue** (`/marshal/queue`)
2. You'll see all submitted bugs with module, title, status, and submitter info
3. Use quick action buttons in the table:
   - **✓ (green)** — Validate the bug (confirms it's a real bug)
   - **✗ (red)** — Reject the bug (not a real bug)
   - **⧉ (blue)** — Mark as Duplicate (sets 0.5 points automatically)
   - **? (amber)** — Request more info from the participant

4. Click on a bug row to open the **Bug Detail Panel** on the right side
5. In the detail panel you can:
   - Set the **Severity** (auto-calculates points)
   - Override **Points Awarded** manually
   - Add **Marshal Notes** (visible to the participant when status is "Needs More Info")
   - Set the **Duplicate Of** ID if marking as duplicate

---

### Points Auto-Assignment

When you set a severity in the Bug Detail Panel:

| Severity | Points |
|----------|--------|
| Launch Blocker | 15 |
| Critical | 10 |
| High | 7 |
| Medium | 4 |
| Low | 1 |

When you set status to **Duplicate**: points auto-set to 0.5
When you set status to **Rejected**: points auto-set to 0

You can override these by manually typing in the Points Awarded field before saving.

---

### Managing Event Settings

Go to **Settings** (`/marshal/settings`) to configure the event.

#### Registration Settings
- **Registration Open**: Toggle to open/close registrations
- **Registration Deadline**: Date after which registrations auto-close
- **Max Participants**: Cap on registrations (auto-closes when reached)
- **Registration Fee**: Fee displayed on the registration page

#### Event Details
- **Event Name, Description, Date, Time, Venue**: Displayed on the public registration page
- **Event Banner**: Upload an image shown on the registration page

#### Payment Settings
- **UPI ID and QR Code**: Displayed to participants for payment reference

#### Event Lifecycle
- **Event Started**: Toggle ON to open bug submissions (do this at the start of the event)
- **Event Ended**: Toggle ON to close bug submissions (do this at the end of the event)
- **Leaderboard Visible**: Toggle OFF to hide the leaderboard (useful before announcing results)

---

### Event Day Checklist

- [ ] Verify all registrations and assign Participant IDs
- [ ] Check in arriving participants
- [ ] Turn ON **Event Started** to open bug submissions
- [ ] Monitor the Bug Queue throughout the event
- [ ] Validate, reject, or request info on submitted bugs
- [ ] At end of event, turn ON **Event Ended** to close submissions
- [ ] Turn OFF **Leaderboard Visible** before announcing winners
- [ ] Announce winners, then turn leaderboard back ON

---

## Part 3: Event Organizer Guide

### Initial Setup

1. **Create a marshal account** using the backend:
   ```bash
   cd breakathon-backend
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const bcrypt = require('bcrypt');
   const prisma = new PrismaClient();
   bcrypt.hash('your-password', 10).then(hash =>
     prisma.user.create({ data: { name: 'Marshal Name', email: 'marshal@example.com', password: hash, role: 'MARSHAL' } })
   ).then(console.log);
   "
   ```

2. **Configure environment variables** in `breakathon-backend/.env`:
   - Set `DATABASE_URL` to your Neon PostgreSQL connection string
   - Set `JWT_SECRET` to a long random string
   - Set Razorpay credentials from your Razorpay dashboard
   - Set SMTP credentials for email (Gmail recommended)

3. **Log in as marshal** at `/admin/login` and go to **Settings** to configure:
   - Event name, date, time, and venue
   - Registration fee
   - UPI ID and QR code for payments
   - Upload event banner

4. **Open registrations** by toggling "Registration Open" to ON

### Pre-Event Checklist

- [ ] Backend deployed and running (port 3000)
- [ ] Frontend deployed and pointing to backend URL
- [ ] `DATABASE_URL` connected to Neon
- [ ] Razorpay credentials configured (switch to live mode for actual payments)
- [ ] SMTP configured and test email sent
- [ ] Event details filled in AdminSettings
- [ ] Registration Open toggle is ON
- [ ] Test registration flow end-to-end

### Post-Event

1. Toggle **Event Ended** to ON
2. Toggle **Leaderboard Visible** to OFF
3. Export leaderboard data (from MarshalStats page)
4. Announce winners
5. Toggle **Leaderboard Visible** back ON for public visibility
