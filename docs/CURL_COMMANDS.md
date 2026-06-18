# API curl Commands — Genda Phool Break-A-Thon

Copy and run these commands in your terminal to test every API.

**Prerequisites:**
- Backend running at `http://localhost:3000`
- Replace `<MARSHAL_TOKEN>` with the token from the login command below
- Replace `<BUG_ID>`, `<REG_ID>`, `<SETTINGS_ID>` with real IDs from responses

---

## STEP 0 — Get a Marshal Token (run this first, save the token)

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marshal@breakathon.com","password":"marshal123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])"
```
Copy the printed token and set it:
```bash
TOKEN="paste_your_token_here"
```

---

## 1. AUTH

### Marshal Login — valid credentials
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marshal@breakathon.com","password":"marshal123"}'
```
**Expected:** `200` with `token` field

---

### Marshal Login — wrong password
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marshal@breakathon.com","password":"wrongpass"}'
```
**Expected:** `401` with `Invalid email or password`

---

### Verify Token (who am I?)
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
**Expected:** `200` with `role: "marshal"`

---

### Verify Token — no token
```bash
curl http://localhost:3000/api/v1/auth/me
```
**Expected:** `401`

---

## 2. PARTICIPANT LOGIN

### Participant Login — valid (checked-in participant)
```bash
curl -X POST http://localhost:3000/api/apps/default/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dhruvsaini765@gmail.com","phone":"9376721221"}'
```
**Expected:** `200` with `participant_id`, `name`, `registration_id`

---

### Participant Login — wrong phone
```bash
curl -X POST http://localhost:3000/api/apps/default/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dhruvsaini765@gmail.com","phone":"0000000000"}'
```
**Expected:** `401` error

---

### Participant Login — not checked in
```bash
curl -X POST http://localhost:3000/api/apps/default/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notcheckedin@example.com","phone":"9999999999"}'
```
**Expected:** `403` with "must be checked in" message

---

## 3. EVENT SETTINGS

### Get Event Settings (public — no auth needed)
```bash
curl http://localhost:3000/api/apps/default/entities/EventSettings
```
**Expected:** `200` array with 1 object containing all settings + `current_participants`

---

### Update Event Settings (marshal only)
```bash
# First get the settings ID
SETTINGS_ID=$(curl -s http://localhost:3000/api/apps/default/entities/EventSettings \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

curl -X PUT "http://localhost:3000/api/apps/default/admin/entities/EventSettings/$SETTINGS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Genda Phool Break-A-Thon",
    "event_date": "2026-06-20",
    "event_time": "10:00 AM",
    "venue": "Vadodara Tech Hub",
    "registration_fee": 149,
    "registration_open": true,
    "event_started": true,
    "event_ended": false,
    "leaderboard_visible": true
  }'
```
**Expected:** `200` with updated settings

---

### Update Event Settings — no auth (should fail)
```bash
SETTINGS_ID=$(curl -s http://localhost:3000/api/apps/default/entities/EventSettings \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

curl -X PUT "http://localhost:3000/api/apps/default/admin/entities/EventSettings/$SETTINGS_ID" \
  -H "Content-Type: application/json" \
  -d '{"event_name":"Hacked"}'
```
**Expected:** `401`

---

### Toggle Event Started ON
```bash
SETTINGS_ID=$(curl -s http://localhost:3000/api/apps/default/entities/EventSettings \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/EventSettings/$SETTINGS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_started": true}'
```

---

### Toggle Event Ended ON
```bash
SETTINGS_ID=$(curl -s http://localhost:3000/api/apps/default/entities/EventSettings \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/EventSettings/$SETTINGS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_ended": true}'
```

---

### Hide Leaderboard
```bash
SETTINGS_ID=$(curl -s http://localhost:3000/api/apps/default/entities/EventSettings \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/EventSettings/$SETTINGS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"leaderboard_visible": false}'
```

---

## 4. REGISTRATIONS

### List All Registrations (marshal only)
```bash
curl http://localhost:3000/api/apps/default/admin/entities/Registration \
  -H "Authorization: Bearer $TOKEN"
```
**Expected:** `200` array of all registrations

---

### List Registrations — no auth (should fail)
```bash
curl http://localhost:3000/api/apps/default/admin/entities/Registration
```
**Expected:** `401`

---

### Register a New Participant (public)
```bash
curl -X POST http://localhost:3000/api/apps/default/entities/Registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Participant",
    "email": "testparticipant@example.com",
    "phone": "9123456789",
    "college": "Test University",
    "payment_status": "Pending Verification",
    "payment_reference": "pay_test123"
  }'
```
**Expected:** `201` with registration object

---

### Register — duplicate email (should fail)
```bash
curl -X POST http://localhost:3000/api/apps/default/entities/Registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate",
    "email": "dhruvsaini765@gmail.com",
    "phone": "9999999999",
    "payment_status": "Pending Verification"
  }'
```
**Expected:** `422` or `409`

---

### Verify Payment + Assign Participant ID (marshal only)
```bash
# Replace REG_ID with actual registration ID
REG_ID="your_registration_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/Registration/$REG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "Verified",
    "participant_id": "GP-099"
  }'
```
**Expected:** `200` with updated registration

---

### Check In a Participant (marshal only)
```bash
REG_ID="your_registration_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/Registration/$REG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"checked_in": true}'
```
**Expected:** `200`

---

## 5. BUG REPORTS

### List All Bugs (public — no auth needed)
```bash
curl "http://localhost:3000/api/apps/default/entities/BugReport"
```
**Expected:** `200` array of all bugs

---

### List All Bugs (marshal view — same data, different context)
```bash
curl "http://localhost:3000/api/apps/default/admin/entities/BugReport" \
  -H "Authorization: Bearer $TOKEN"
```

---

### List Bugs by Status (e.g. Pending Review)
```bash
curl "http://localhost:3000/api/apps/default/entities/BugReport?status=Pending%20Review"
```

---

### List Bugs by Module
```bash
curl "http://localhost:3000/api/apps/default/entities/BugReport?module=Payment%20System"
```

---

### Submit a Bug Report (participant — no JWT needed)
```bash
curl -X POST http://localhost:3000/api/apps/default/user/entities/BugReport \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Payment System",
    "bug_title": "Checkout button freezes on tap",
    "steps_to_reproduce": "1. Open Customer App 2. Add item to cart 3. Tap Checkout",
    "expected_behavior": "Payment screen should open",
    "actual_behavior": "Button freezes, nothing happens",
    "screenshot_url": "http://localhost:3000/uploads/test.png",
    "screen_recording_url": "",
    "participant_id": "GP-002",
    "participant_name": "dhruvsaini",
    "status": "Pending Review",
    "points_awarded": 0
  }'
```
**Expected:** `201` with new bug object

---

### Submit Bug — fake participant ID (should fail)
```bash
curl -X POST http://localhost:3000/api/apps/default/user/entities/BugReport \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Payment System",
    "bug_title": "Fake bug",
    "steps_to_reproduce": "Steps",
    "expected_behavior": "Works",
    "actual_behavior": "Breaks",
    "screenshot_url": "http://localhost:3000/uploads/test.png",
    "participant_id": "GP-FAKE",
    "participant_name": "Hacker",
    "status": "Pending Review",
    "points_awarded": 0
  }'
```
**Expected:** `403`

---

### Validate a Bug + Set Severity (marshal only)
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Validated", "severity": "Critical"}'
```
**Expected:** `200` with `points_awarded: 10`

---

### All Severity → Points (run each one)
```bash
BUG_ID="your_bug_id_here"

# Launch Blocker → 15
curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "Launch Blocker"}'

# Critical → 10
curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "Critical"}'

# High → 7
curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "High"}'

# Medium → 4
curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "Medium"}'

# Low → 1
curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "Low"}'
```

---

### Reject a Bug (auto sets points to 0)
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Rejected"}'
```
**Expected:** `200` with `points_awarded: 0`

---

### Mark as Duplicate (auto sets points to 0.5)
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Duplicate", "duplicate_of": "original_bug_id"}'
```
**Expected:** `200` with `points_awarded: 0.5`

---

### Needs More Info with Marshal Notes
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Needs More Info", "marshal_notes": "Please provide a clearer screenshot showing the error"}'
```

---

### Invalid Severity (DB enum — should be rejected)
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"severity": "LAUNCH_BLOCKER"}'
```
**Expected:** `422` Zod validation error

---

### Update Bug — no auth (should fail)
```bash
BUG_ID="your_bug_id_here"

curl -X PATCH "http://localhost:3000/api/apps/default/admin/entities/BugReport/$BUG_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "Validated"}'
```
**Expected:** `401`

---

## 6. FILE UPLOAD

### Upload a File (screenshot or recording)
```bash
curl -X POST http://localhost:3000/api/apps/default/user/integrations/Core/UploadFile \
  -F "file=@/path/to/your/screenshot.png"
```
**Expected:** `200` with `file_url`

### Verify Uploaded File is Accessible
```bash
# After upload, check the file_url is accessible
curl -I "http://localhost:3000/uploads/your_filename.png"
```
**Expected:** `200` with `Content-Type: image/png`

---

## 7. RAZORPAY PAYMENT

### Create Payment Order
```bash
curl -X POST http://localhost:3000/api/apps/default/user/functions/createRazorpayOrder \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** `200` with `order_id`, `amount: 14900`, `currency: "INR"`

---

### Verify Payment — tampered signature (should fail)
```bash
curl -X POST http://localhost:3000/api/apps/default/user/functions/createRazorpayOrder/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_fake123",
    "razorpay_payment_id": "pay_fake123",
    "razorpay_signature": "invalidsignature"
  }'
```
**Expected:** `400` with `verified: false`

---

## 8. EMAIL

### Send Registration Confirmation Email
```bash
curl -X POST http://localhost:3000/api/apps/default/functions/sendRegistrationConfirmation \
  -H "Content-Type: application/json" \
  -d '{
    "registration_id": "your_registration_id",
    "email": "test@example.com",
    "name": "Test User"
  }'
```
**Expected:** `200` (even if SMTP not configured — it fails silently)

---

## 9. QUICK ONE-LINERS

```bash
# Count all bugs
curl -s http://localhost:3000/api/apps/default/entities/BugReport | python3 -c "import sys,json; print('Bugs:', len(json.load(sys.stdin)))"

# Count Pending Review bugs
curl -s http://localhost:3000/api/apps/default/entities/BugReport | python3 -c "import sys,json; d=json.load(sys.stdin); print('Pending:', sum(1 for b in d if b['status']=='Pending Review'))"

# Show leaderboard scores
curl -s http://localhost:3000/api/apps/default/entities/BugReport | python3 -c "
import sys,json
from collections import defaultdict
d=json.load(sys.stdin)
scores=defaultdict(float)
for b in d:
    if b['status'] in ['Validated','Duplicate']:
        scores[b['participant_name']] += b['points_awarded'] or 0
for name,pts in sorted(scores.items(), key=lambda x: -x[1]):
    print(f'{pts:5.1f} pts  {name}')
"

# Check current_participants count
curl -s http://localhost:3000/api/apps/default/entities/EventSettings | python3 -c "import sys,json; print('Participants:', json.load(sys.stdin)[0]['current_participants'])"
```
