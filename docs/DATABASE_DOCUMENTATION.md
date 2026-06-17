# Database Documentation — Genda Phool Break-A-Thon

---

## Overview

| Item | Detail |
|------|--------|
| Database | PostgreSQL (hosted on Neon — serverless) |
| ORM | Prisma 5.x |
| Schema file | `breakathon-backend/prisma/schema.prisma` |
| Migration method | `npx prisma db push` (pushes schema directly, no migration files) |
| Connection | `DATABASE_URL` env var with `?sslmode=require` for Neon |

---

## Models

### User

Stores marshal credentials. Participants do NOT have User records.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | String | PK, cuid() | auto |
| name | String | required | — |
| email | String | unique | — |
| password | String | bcrypt hash | — |
| role | Role (enum) | required | — |
| createdAt | DateTime | — | now() |
| updatedAt | DateTime | auto-update | — |

DB table name: `users`

---

### Registration

Stores all participant registrations.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | String | PK, cuid() | auto |
| name | String | required | — |
| email | String | unique | — |
| phone | String | required | — |
| college | String | optional | — |
| payment_status | PaymentStatus (enum) | required | PENDING_VERIFICATION |
| payment_reference | String | optional | — |
| participant_id | String | optional, unique when set | — |
| checked_in | Boolean | — | false |
| createdAt | DateTime | — | now() |
| updatedAt | DateTime | auto-update | — |

DB table name: `registrations`

#### Key behaviors
- `email` must be unique — duplicate registrations from the same email are rejected with 409
- `participant_id` is assigned manually by a marshal after payment verification (e.g., "GP-001")
- `checked_in` is flipped to `true` at the event check-in desk
- Participant login requires: matching email + phone, `checked_in = true`

---

### BugReport

Core entity. Stores all bug submissions.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | String | PK, cuid() | auto |
| participant_id | String | required | — |
| participant_name | String | required | — |
| module | BugCategory (enum) | required | — |
| bug_title | String | required, max 100 | — |
| steps_to_reproduce | String | required, max 300 | — |
| expected_behavior | String | required, max 200 | — |
| actual_behavior | String | required, max 200 | — |
| screenshot_url | String | required | — |
| screen_recording_url | String | optional | — |
| status | BugStatus (enum) | required | PENDING_REVIEW |
| severity | BugSeverity (enum) | optional | — |
| points_awarded | Float | required | 0 |
| marshal_notes | String | optional | — |
| duplicate_of | String | optional | — |
| is_confirming_duplicate | Boolean | — | false |
| createdAt | DateTime | — | now() |
| updatedAt | DateTime | auto-update | — |

DB table name: `bug_reports`

#### Key behaviors
- `participant_id` is a string foreign key into `registrations.participant_id`, not an enforced DB relation
- `severity` and `points_awarded` are set by marshals after review
- `duplicate_of` stores the ID of the original bug when status = DUPLICATE
- `is_confirming_duplicate` is set by the participant at submission to acknowledge they reviewed existing bugs

---

### EventSettings

Singleton row. All event configuration lives here.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | String | PK, cuid() | auto |
| event_name | String | required | "Genda Phool Break-A-Thon" |
| event_description | String | optional | — |
| event_date | String | optional | — |
| event_time | String | optional | — |
| venue | String | optional | — |
| registration_fee | Int | required | 149 |
| registration_deadline | String | optional | — |
| max_participants | Int | optional | — |
| event_banner | String | optional | — |
| upi_id | String | optional | — |
| upi_qr_url | String | optional | — |
| registration_open | Boolean | required | true |
| event_started | Boolean | required | false |
| event_ended | Boolean | required | false |
| leaderboard_visible | Boolean | required | true |
| createdAt | DateTime | — | now() |
| updatedAt | DateTime | auto-update | — |

DB table name: `event_settings`

#### Key behaviors
- `event_date` and `event_time` are stored as strings (e.g., "2025-06-15", "10:00 AM") for flexibility in display
- `registration_deadline` is stored as an ISO date string; compared with `new Date()` on the frontend
- The row is auto-created on first `GET /entities/EventSettings` if it doesn't exist (upsert pattern)
- `current_participants` is NOT a DB column — it's computed at query time via `prisma.registration.count()`

---

## Enums

### Role
```prisma
enum Role {
  MARSHAL
  PARTICIPANT
}
```

Note: `shapeUser()` in `auth.service.js` lowercases the role to `"marshal"` when returning from `/auth/me`. Controllers must check both cases.

---

### BugStatus
```prisma
enum BugStatus {
  PENDING_REVIEW
  VALIDATED
  REJECTED
  NEEDS_MORE_INFO
  DUPLICATE
}
```

The translation layer in `bugs.entity.controller.js` maps between DB enums and human-readable labels used by the frontend:

| DB Enum | Frontend Label |
|---------|---------------|
| PENDING_REVIEW | Pending Review |
| VALIDATED | Validated |
| REJECTED | Rejected |
| NEEDS_MORE_INFO | Needs More Info |
| DUPLICATE | Duplicate |

---

### BugSeverity
```prisma
enum BugSeverity {
  LAUNCH_BLOCKER
  CRITICAL
  HIGH
  MEDIUM
  LOW
}
```

Translation:

| DB Enum | Frontend Label | Points |
|---------|---------------|--------|
| LAUNCH_BLOCKER | Launch Blocker | 15 |
| CRITICAL | Critical | 10 |
| HIGH | High | 7 |
| MEDIUM | Medium | 4 |
| LOW | Low | 1 |

---

### BugCategory
```prisma
enum BugCategory {
  CUSTOMER_APP
  ADMIN_DASHBOARD
  DELIVERY_PARTNER_APP
  PRODUCTION_DASHBOARD
  ROUTE_MANAGEMENT
  SUBSCRIPTION_MANAGEMENT
  PAYMENT_SYSTEM
  WALLET_SYSTEM
  NOTIFICATION_SYSTEM
}
```

Frontend labels map from human-readable module names (e.g., "Customer App") to these DB enums via the translation layer.

---

### PaymentStatus
```prisma
enum PaymentStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
}
```

Frontend labels:

| DB Enum | Frontend Label |
|---------|---------------|
| PENDING_VERIFICATION | Pending Verification |
| VERIFIED | Verified |
| REJECTED | Rejected |

---

## Enum Translation Layer

The backend maintains a bidirectional mapping in `bugs.entity.controller.js`:

```javascript
// DB → Frontend (used when reading from DB)
const STATUS_TO_FRONTEND = {
  PENDING_REVIEW: "Pending Review",
  VALIDATED:      "Validated",
  REJECTED:       "Rejected",
  NEEDS_MORE_INFO:"Needs More Info",
  DUPLICATE:      "Duplicate",
};

const SEVERITY_TO_FRONTEND = {
  LAUNCH_BLOCKER: "Launch Blocker",
  CRITICAL:       "Critical",
  HIGH:           "High",
  MEDIUM:         "Medium",
  LOW:            "Low",
};

// Frontend → DB (used when writing to DB)
const STATUS_TO_DB = { /* reverse map */ };
const SEVERITY_TO_DB = { /* reverse map */ };
```

All bug report reads apply `STATUS_TO_FRONTEND` and `SEVERITY_TO_FRONTEND`.
All bug report writes apply `STATUS_TO_DB` and `SEVERITY_TO_DB` before Prisma calls.

---

## Database Operations

### Common Queries

**Get all bug reports (marshal view)**
```javascript
prisma.bugReport.findMany({
  orderBy: { createdAt: "desc" },
  take: 100,
});
```

**Get bug reports for a participant**
```javascript
prisma.bugReport.findMany({
  where: { participant_id: "GP-001" },
  orderBy: { createdAt: "desc" },
});
```

**Get EventSettings with participant count**
```javascript
const [settings, count] = await Promise.all([
  prisma.eventSettings.findFirst(),
  prisma.registration.count(),
]);
return { ...settings, current_participants: count };
```

**Upsert EventSettings**
```javascript
prisma.eventSettings.upsert({
  where: { id: existingId || "singleton" },
  update: data,
  create: { ...defaults, ...data },
});
```

**Check-in a participant**
```javascript
prisma.registration.update({
  where: { id: registrationId },
  data: { checked_in: true },
});
```

---

## Schema Management

### Applying Schema Changes
```bash
cd breakathon-backend
npx prisma db push
```

This pushes the current `schema.prisma` to the database without creating migration files. Suitable for rapid development.

### Generating Prisma Client
```bash
npx prisma generate
```

Run after any schema change before restarting the server.

### Viewing Database (Prisma Studio)
```bash
npx prisma studio
```

Opens a browser-based GUI at `http://localhost:5555`.

### Resetting Database (Development Only)
```bash
npx prisma db push --force-reset
```

**WARNING**: Drops and recreates all tables. All data is lost.

---

## Indexes and Constraints

| Table | Column | Constraint |
|-------|--------|-----------|
| users | email | UNIQUE |
| registrations | email | UNIQUE |
| registrations | participant_id | UNIQUE (when set) |
| bug_reports | — | No additional indexes |
| event_settings | — | Single row pattern (no enforced constraint) |

---

## Data Integrity Notes

1. **No cascading deletes** — bug reports retain `participant_id` even if the registration is deleted.
2. **No foreign key enforcement** — `bug_reports.participant_id` references `registrations.participant_id` by convention only.
3. **EventSettings singleton** — only one row is expected. The service uses `findFirst()` to read and upserts to the first row's ID to update.
4. **Soft currency** — `points_awarded` is a Float to support 0.5 points for Duplicate bugs.
5. **Nullable severity** — bugs start with `severity = null` until a marshal assigns it.
