# API Documentation — Genda Phool Break-A-Thon

All API calls from the frontend use the SDK adapter namespace:
`/api/apps/{APP_ID}/admin/*` (marshal, JWT required)
`/api/apps/{APP_ID}/user/*` (participant/public, no JWT)

`APP_ID` = value of `VITE_APP_ID` env var (`default` by default).

---

## Authentication

### Marshal Login
`POST /api/v1/auth/login`

**Body**
```json
{ "email": "marshal@example.com", "password": "secret" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "<JWT>",
    "user": { "id": "...", "name": "...", "email": "...", "role": "MARSHAL" }
  }
}
```

**Response 401**
```json
{ "success": false, "message": "Invalid email or password" }
```

---

### Marshal Me (verify token)
`GET /api/v1/auth/me`
`Authorization: Bearer <token>`

**Response 200**
```json
{ "success": true, "data": { "id": "...", "name": "...", "email": "...", "role": "marshal" } }
```

Note: `role` is lowercased by `shapeUser()` in the auth service.

---

### Participant Login
`POST /api/apps/:appId/user/functions/userLogin`

**Body**
```json
{ "email": "participant@example.com", "phone": "9876543210" }
```

**Response 200**
```json
{
  "participant_id": "GP-001",
  "name": "Jane Doe",
  "registration_id": "clxyz123",
  "email": "participant@example.com"
}
```

**Response 404**
```json
{ "error": "No registration found with this email" }
```

**Response 401**
```json
{ "error": "Phone number does not match" }
```

**Response 403**
```json
{ "error": "You must be checked in at the event to submit bugs" }
```

---

## Event Settings

### Get Event Settings
`GET /api/apps/:appId/entities/EventSettings`

No auth required.

**Response 200**
```json
[{
  "id": "clxyz",
  "event_name": "Genda Phool Break-A-Thon",
  "event_description": "...",
  "event_date": "2025-06-15",
  "event_time": "10:00 AM",
  "venue": "Hall B, Tech Park",
  "registration_fee": 149,
  "registration_deadline": "2025-06-14",
  "max_participants": 100,
  "current_participants": 42,
  "event_banner": "http://localhost:3000/uploads/banner.jpg",
  "upi_id": "event@upi",
  "upi_qr_url": "http://localhost:3000/uploads/qr.png",
  "registration_open": true,
  "event_started": false,
  "event_ended": false,
  "leaderboard_visible": true,
  "created_date": "2025-01-01T00:00:00.000Z",
  "updated_date": "2025-06-10T10:00:00.000Z"
}]
```

Note: `current_participants` is a live count from the registrations table, injected at query time.

---

### Update Event Settings
`PUT /api/apps/:appId/admin/entities/EventSettings/:id`
`Authorization: Bearer <marshal_token>`

**Body** (all fields optional)
```json
{
  "event_name": "Updated Name",
  "event_date": "2025-06-15",
  "event_time": "10:00 AM",
  "venue": "Hall B",
  "registration_fee": 199,
  "registration_deadline": "2025-06-14",
  "max_participants": 150,
  "event_banner": "http://...",
  "upi_id": "event@upi",
  "upi_qr_url": "http://...",
  "registration_open": true,
  "event_started": true,
  "event_ended": false,
  "leaderboard_visible": true
}
```

**Response 200**: Updated EventSettings object (same shape as GET).

---

## Bug Reports

### List All Bug Reports
`GET /api/apps/:appId/entities/BugReport`

Optional query params:
- `sort` — field name, prefix `-` for DESC (e.g., `-created_date`)
- `limit` — max results (default 100)
- Filter params: `module`, `status`, `severity`, `participant_id`

**Auth behavior:**
- No JWT → filtered results (public/participant view, no PII)
- Marshal JWT → full results including all participant data

**Response 200** (array)
```json
[{
  "id": "clxyz",
  "bug_title": "Checkout button freezes",
  "module": "Payment System",
  "status": "Pending Review",
  "severity": null,
  "points_awarded": 0,
  "participant_id": "GP-001",
  "participant_name": "Jane Doe",
  "steps_to_reproduce": "...",
  "expected_behavior": "...",
  "actual_behavior": "...",
  "screenshot_url": "http://...",
  "screen_recording_url": "",
  "marshal_notes": null,
  "duplicate_of": null,
  "created_date": "2025-06-15T10:30:00.000Z",
  "updated_date": "2025-06-15T10:30:00.000Z"
}]
```

Status values (human-readable, from translation layer):
`"Pending Review"`, `"Validated"`, `"Rejected"`, `"Needs More Info"`, `"Duplicate"`

Severity values (human-readable):
`"Launch Blocker"`, `"Critical"`, `"High"`, `"Medium"`, `"Low"`, `null`

---

### Create Bug Report
`POST /api/apps/:appId/entities/BugReport`

No JWT required. Participant identity is validated via `participant_id` matching a checked-in Registration.

**Body**
```json
{
  "module": "Payment System",
  "bug_title": "Checkout button freezes",
  "steps_to_reproduce": "1. Go to checkout...",
  "expected_behavior": "Should complete payment",
  "actual_behavior": "Button freezes and nothing happens",
  "screenshot_url": "http://localhost:3000/uploads/abc123.jpg",
  "screen_recording_url": "",
  "participant_id": "GP-001",
  "participant_name": "Jane Doe",
  "status": "Pending Review",
  "points_awarded": 0
}
```

**Response 201**: Created BugReport object.

**Response 422**: Zod validation error with field details.

**Response 403**: Participant not checked in.

---

### Update Bug Report (Marshal Only)
`PATCH /api/apps/:appId/admin/entities/BugReport/:id`
`Authorization: Bearer <marshal_token>`

**Body** (all fields optional)
```json
{
  "status": "Validated",
  "severity": "Critical",
  "points_awarded": 10,
  "marshal_notes": "Confirmed on staging",
  "duplicate_of": null
}
```

Status values accepted: `"Pending Review"`, `"Validated"`, `"Rejected"`, `"Needs More Info"`, `"Duplicate"`
Severity values accepted: `"Launch Blocker"`, `"Critical"`, `"High"`, `"Medium"`, `"Low"`

**Auto-point assignment** (backend):
- If `severity` is set and `points_awarded` is not provided → points auto-calculated
- If `status` = `"Duplicate"` and no points → 0.5
- If `status` = `"Rejected"` and no points → 0

**Response 200**: Updated BugReport object.

**Response 403**: Non-marshal attempt.

**Response 422**: Zod validation error.

---

## Registrations

### List Registrations (Marshal Only)
`GET /api/apps/:appId/admin/entities/Registration`
`Authorization: Bearer <marshal_token>`

**Response 200** (array)
```json
[{
  "id": "clxyz",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "college": "MIT",
  "payment_status": "Verified",
  "payment_reference": "pay_abc123",
  "participant_id": "GP-001",
  "checked_in": false,
  "created_date": "2025-06-10T10:00:00.000Z"
}]
```

Payment status values: `"Pending Verification"`, `"Verified"`, `"Rejected"`

---

### Create Registration (Public)
`POST /api/apps/:appId/entities/Registration`

No auth required.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "college": "MIT",
  "payment_reference": "pay_abc123",
  "payment_status": "Pending Verification"
}
```

**Response 201**: Created Registration object.

**Response 409**: Email already registered.

---

### Update Registration (Marshal Only)
`PATCH /api/apps/:appId/admin/entities/Registration/:id`
`Authorization: Bearer <marshal_token>`

**Body** (all fields optional)
```json
{
  "payment_status": "Verified",
  "participant_id": "GP-001",
  "checked_in": true
}
```

**Response 200**: Updated Registration object.

---

## File Upload

### Upload File
`POST /api/apps/:appId/integrations/Core/UploadFile`

Content-Type: `multipart/form-data`
Field name: `file`

Rate limited: 30 uploads per IP per 15 minutes.

**Response 200**
```json
{ "file_url": "http://localhost:3000/uploads/1234567890-screenshot.jpg" }
```

**Response 429**: Rate limit exceeded.

---

## Razorpay Payment

### Create Order
`POST /api/apps/:appId/functions/createRazorpayOrder`

No auth required. Fixed amount: ₹149.

**Body**: `{}` (no body required)

**Response 200**
```json
{
  "success": true,
  "data": {
    "order_id": "order_abc123",
    "amount": 14900,
    "currency": "INR",
    "key_id": "rzp_test_..."
  }
}
```

---

### Verify Payment
`POST /api/apps/:appId/functions/createRazorpayOrder/verify`

**Body**
```json
{
  "razorpay_order_id": "order_abc123",
  "razorpay_payment_id": "pay_xyz789",
  "razorpay_signature": "<hmac_sha256_signature>"
}
```

**Response 200**
```json
{ "verified": true, "payment_id": "pay_xyz789" }
```

**Response 400**
```json
{ "verified": false, "message": "Payment verification failed" }
```

---

## Email Functions

### Send Registration Confirmation
`POST /api/apps/:appId/functions/sendRegistrationConfirmation`

**Body**
```json
{
  "registration_id": "clxyz",
  "email": "jane@example.com",
  "name": "Jane Doe"
}
```

**Response 200**
```json
{ "success": true, "message": "Email sent" }
```

Fails silently (200 response) if SMTP is not configured.

---

### Send Verification Approved Email
Called internally by the backend when marshal marks payment as Verified. Not called directly from frontend.

---

## Error Responses

All errors follow this shape for `/api/v1/` routes:
```json
{ "success": false, "message": "Human-readable error" }
```

For SDK adapter routes (`/api/apps/*/`):
```json
{ "error": "Human-readable error" }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation, payment verification) |
| 401 | Unauthorized (invalid/expired JWT) |
| 403 | Forbidden (wrong role, not checked in) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 422 | Unprocessable entity (Zod schema validation failed) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
