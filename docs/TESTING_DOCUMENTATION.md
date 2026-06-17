# Testing Documentation — Genda Phool Break-A-Thon

This document covers manual testing procedures for all major features. No automated test suite exists in the current codebase — all testing is performed manually using curl, a browser, and Prisma Studio.

---

## Test Environment Setup

### Start Backend
```bash
cd breakathon-backend
npm run dev
# Server starts at http://localhost:3000
```

### Start Frontend
```bash
cd breakathon-frontend
npm run dev
# App starts at http://localhost:5173
```

### Open Database GUI (optional)
```bash
cd breakathon-backend
npx prisma studio
# GUI at http://localhost:5555
```

---

## 1. Marshal Authentication

### Test: Marshal login with valid credentials
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marshal@example.com","password":"password123"}'
```
**Expected**: `{ "success": true, "data": { "token": "...", "user": { "role": "MARSHAL" } } }`

### Test: Marshal login with wrong password
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marshal@example.com","password":"wrong"}'
```
**Expected**: `401 { "success": false, "message": "Invalid email or password" }`

### Test: Token verification
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```
**Expected**: `{ "success": true, "data": { "role": "marshal" } }` (note: lowercase role)

---

## 2. Participant Login

### Test: Valid participant login (checked in)
1. Open `http://localhost:5173/user/login`
2. Enter email and phone matching a Registration with `checked_in = true`
3. **Expected**: Redirect to `/submit`, participant session stored in sessionStorage

### Test: Participant not checked in
1. Use email/phone for a Registration with `checked_in = false`
2. **Expected**: Error — "You must be checked in at the event to submit bugs"

### Test: Wrong phone number
1. Use correct email but wrong phone
2. **Expected**: Error — "Phone number does not match"

### Test: No routing collision with marshal
1. Log in as participant → verify redirect goes to `/submit`, not `/marshal/queue`
2. Open browser DevTools → Application → Session Storage
3. **Expected**: `bat_participant_session` key exists, no `bat_marshal_token` in localStorage

---

## 3. Public Registration

### Test: Registration form displays settings values
1. Open `http://localhost:5173/event-register`
2. **Expected**: Event name, date, time, venue, and fee all match values in EventSettings (not hardcoded)

### Test: Registration with closed registrations
1. In AdminSettings, turn OFF "Registration Open"
2. Open `/event-register`
3. **Expected**: "Registrations are currently closed" message, no form visible

### Test: Registration deadline enforcement
1. Set `registration_deadline` to a date in the past (e.g., "2020-01-01")
2. Open `/event-register`
3. **Expected**: "Registration deadline has passed" message

### Test: Participant cap enforcement
1. Set `max_participants` to a number equal to or less than `current_participants`
2. Open `/event-register`
3. **Expected**: "Participant limit reached" message

### Test: Duplicate email registration
1. Register with an email that already exists in the DB
2. **Expected**: Error — "Email already registered" or similar

---

## 4. Payment Flow

### Test: Create Razorpay order
```bash
curl -X POST http://localhost:3000/api/apps/default/user/functions/createRazorpayOrder \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected**: `{ "success": true, "data": { "order_id": "order_...", "amount": 14900 } }`

### Test: Payment verification with tampered signature
```bash
curl -X POST http://localhost:3000/api/apps/default/user/functions/createRazorpayOrder/verify \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"fake","razorpay_payment_id":"fake","razorpay_signature":"invalid"}'
```
**Expected**: `400 { "verified": false, "message": "Payment verification failed" }`

### Test: Successful end-to-end registration (test mode)
1. Use Razorpay test card: 4111 1111 1111 1111, any CVV, any future expiry
2. Complete payment in the Razorpay modal
3. **Expected**: Registration saved in DB with `payment_reference = pay_...` and `payment_status = PENDING_VERIFICATION`

---

## 5. Bug Submission

### Test: Bug submissions blocked before event started
1. Ensure `event_started = false` in EventSettings
2. Log in as a checked-in participant
3. Navigate to `/submit`
4. **Expected**: "Bug submissions will open once the marshal starts the event" message

### Test: Bug submission form requires screenshot
1. Fill all fields except screenshot
2. **Expected**: Submit button stays disabled, "Screenshot is required" message shown

### Test: Bug submission requires duplicate confirmation
1. Select a module
2. Do not check the duplicate confirmation checkbox
3. **Expected**: Submit button stays disabled

### Test: Successful bug submission
```bash
# First upload a screenshot
curl -X POST http://localhost:3000/api/apps/default/user/integrations/Core/UploadFile \
  -F "file=@/path/to/screenshot.png"
# Note the file_url

# Then submit the bug
curl -X POST http://localhost:3000/api/apps/default/user/entities/BugReport \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Payment System",
    "bug_title": "Test bug",
    "steps_to_reproduce": "1. Go to checkout",
    "expected_behavior": "Payment succeeds",
    "actual_behavior": "Page freezes",
    "screenshot_url": "http://localhost:3000/uploads/...",
    "participant_id": "GP-001",
    "participant_name": "Test User",
    "status": "Pending Review",
    "points_awarded": 0
  }'
```
**Expected**: `201` with created bug report including `id`

### Test: Bug submission with non-checked-in participant ID
1. Use a `participant_id` for a registration with `checked_in = false`
2. **Expected**: `403` error

---

## 6. Bug Queue (Marshal)

### Test: Bug queue shows all reports
1. Log in as marshal
2. Navigate to `/marshal/queue`
3. **Expected**: All submitted bugs visible with status, module, and participant info

### Test: Quick validate action
1. Click the ✓ button on a Pending Review bug
2. **Expected**: Status changes to "Validated" immediately in the UI

### Test: Role check (non-marshal accessing bug queue endpoint)
```bash
curl http://localhost:3000/api/apps/default/admin/entities/BugReport \
  -H "Authorization: Bearer <PARTICIPANT_OR_MISSING_TOKEN>"
```
**Expected**: `403` or `401`

---

## 7. Bug Validation Workflow

### Test: Validate with severity auto-assigns points
1. Open Bug Detail Panel for a Pending Review bug
2. Set severity to "Critical"
3. **Expected**: Points field auto-fills to 10 in the UI

### Test: Points override
1. Set severity to "Critical" (points auto-fills 10)
2. Manually change points to 12
3. Save
4. **Expected**: Bug saved with `severity = Critical`, `points_awarded = 12`

### Test: Reject sets points to 0
```bash
curl -X PATCH http://localhost:3000/api/apps/default/admin/entities/BugReport/<ID> \
  -H "Authorization: Bearer <MARSHAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"Rejected"}'
```
**Expected**: `points_awarded = 0` in response

### Test: Duplicate sets points to 0.5
```bash
curl -X PATCH http://localhost:3000/api/apps/default/admin/entities/BugReport/<ID> \
  -H "Authorization: Bearer <MARSHAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"Duplicate"}'
```
**Expected**: `points_awarded = 0.5` in response

### Test: Human-readable severity is accepted
```bash
curl -X PATCH http://localhost:3000/api/apps/default/admin/entities/BugReport/<ID> \
  -H "Authorization: Bearer <MARSHAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"severity":"Launch Blocker"}'
```
**Expected**: `200`, severity saved as LAUNCH_BLOCKER in DB, returned as "Launch Blocker"

### Test: Unknown severity is rejected by Zod
```bash
curl -X PATCH http://localhost:3000/api/apps/default/admin/entities/BugReport/<ID> \
  -H "Authorization: Bearer <MARSHAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"severity":"LAUNCH_BLOCKER"}'
```
**Expected**: `422` — Zod rejects DB enum strings, only human-readable labels accepted

---

## 8. Leaderboard

### Test: Leaderboard shows only validated + duplicate scores
1. Submit 3 bugs for the same participant
2. Marshal: Validate 1 (10 pts), Reject 1 (0 pts), leave 1 Pending
3. Navigate to `/leaderboard`
4. **Expected**: Participant shows 10 points, not 10.5, not 30

### Test: Leaderboard hidden when flag is false
1. In AdminSettings, toggle "Leaderboard Visible" to OFF
2. Navigate to `/leaderboard`
3. **Expected**: "The leaderboard is currently hidden" card, no rankings visible

### Test: Leaderboard sorts by points then validated count
1. Ensure at least 2 participants with different point totals
2. **Expected**: Higher points = higher rank; equal points → more validated bugs wins

---

## 9. Event Settings Synchronization

### Test: All pages use settings data
1. Change `event_name` in AdminSettings
2. Open `/event-register`
3. **Expected**: New event name appears immediately (after React Query cache refresh)

### Test: event_started controls bug submission gate
1. In AdminSettings, set Event Started = OFF
2. Log in as checked-in participant, go to `/submit`
3. **Expected**: "Bug submissions will open once the marshal starts the event"
4. In AdminSettings, set Event Started = ON
5. Refresh `/submit`
6. **Expected**: Bug submission form appears

### Test: event_ended blocks submissions even if event_started is true
1. Set both `event_started = true` and `event_ended = true`
2. Go to `/submit`
3. **Expected**: "Bug submissions are closed — the event has ended"

---

## 10. File Upload Rate Limiting

### Test: Rate limit is enforced
```bash
for i in {1..31}; do
  curl -X POST http://localhost:3000/api/apps/default/user/integrations/Core/UploadFile \
    -F "file=@/path/to/small.png" -s -o /dev/null -w "%{http_code}\n"
done
```
**Expected**: First 30 return `200`, 31st returns `429`

---

## 11. Email Notifications

### Test: Registration confirmation email
1. Complete registration for a new participant
2. Frontend calls `sendRegistrationConfirmation`
3. **Expected**: Email delivered to the registered email address

### Test: SMTP not configured (graceful degradation)
1. Remove SMTP env vars or set invalid values
2. Complete registration
3. **Expected**: Registration saves successfully, no crash, warning logged in server console

---

## 12. Security Tests

### Test: Participant cannot access marshal endpoints
```bash
# Use participant session token (not a JWT) — no Authorization header
curl http://localhost:3000/api/apps/default/admin/entities/BugReport
```
**Expected**: `401 Unauthorized`

### Test: Expired JWT is rejected
1. Wait for JWT to expire (or manually create one with `exp` in the past)
2. Make any authenticated request
3. **Expected**: `401 { "message": "Token expired" }` or similar

### Test: Marshal cannot be impersonated via registration
1. Create a registration with email matching a marshal's email
2. Try to log in via participant login
3. **Expected**: Fails because `registrations` and `users` are separate tables

### Test: CORS blocks unexpected origins
```bash
curl http://localhost:3000/api/apps/default/entities/EventSettings \
  -H "Origin: http://evil.com"
```
**Expected**: CORS error in browser; curl shows no `Access-Control-Allow-Origin` header for unknown origins

---

## Quick Sanity Checklist

Run before any deployment:

- [ ] Marshal login → JWT issued → redirect to `/marshal/queue`
- [ ] Participant login → session stored → redirect to `/submit`
- [ ] Bug submission with screenshot → visible in Marshal Queue
- [ ] Marshal validates bug → points appear on leaderboard
- [ ] Event Started OFF → submit page shows gate message
- [ ] Leaderboard Visible OFF → leaderboard shows hidden message
- [ ] `GET /entities/EventSettings` returns `current_participants` count
- [ ] File upload returns `file_url`
- [ ] Razorpay order created with amount 14900
