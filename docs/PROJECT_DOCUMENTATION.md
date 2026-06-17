# Genda Phool Break-A-Thon — Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Features](#4-features)
5. [System Architecture](#5-system-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Database Architecture](#8-database-architecture)
9. [Authentication Flow](#9-authentication-flow)
10. [Authorization Flow](#10-authorization-flow)
11. [API Architecture](#11-api-architecture)
12. [File Upload Flow](#12-file-upload-flow)
13. [Bug Submission Flow](#13-bug-submission-flow)
14. [Bug Validation Workflow](#14-bug-validation-workflow)
15. [Severity & Points System](#15-severity--points-system)
16. [Leaderboard Logic](#16-leaderboard-logic)
17. [Event Settings Synchronization](#17-event-settings-synchronization)
18. [Notification Flow](#18-notification-flow)
19. [Payment Flow (Razorpay)](#19-payment-flow-razorpay)
20. [Error Handling Strategy](#20-error-handling-strategy)
21. [Security Measures](#21-security-measures)
22. [Folder Structure](#22-folder-structure)
23. [Environment Variables](#23-environment-variables)
24. [Third-Party Dependencies](#24-third-party-dependencies)
25. [Design Decisions](#25-design-decisions)
26. [Future Enhancements](#26-future-enhancements)

---

## 1. Project Overview

**Genda Phool Break-A-Thon** is a full-stack web application for managing a live bug-hunting competition. Participants register, pay a registration fee, attend the event, and submit bug reports against a target application. Marshals (event organizers) review, validate, and score bug reports in real time. A live leaderboard aggregates participant scores and ranks them publicly.

| Item | Detail |
|------|--------|
| Project Name | Genda Phool Break-A-Thon |
| Type | Event Management + Bug Tracking Platform |
| Frontend | React 18 + Vite 6 |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL (hosted on Neon) via Prisma ORM |
| Authentication | Dual — JWT (marshals) + session token (participants) |
| Payment | Razorpay |
| Email | Nodemailer via Gmail SMTP |

---

## 2. Problem Statement

Running a live bug-hunting competition manually involves:

- Managing participant registrations and payments
- Verifying identities at event check-in
- Collecting bug reports in a structured way
- Preventing duplicate bug submissions
- Scoring and ranking participants fairly in real time
- Giving marshals tools to review and approve reports quickly

Spreadsheets and ad-hoc tools cannot handle this at scale. A dedicated platform is required.

---

## 3. Objectives

- Provide a self-service registration portal with online payment
- Give marshals a real-time dashboard to manage the event lifecycle
- Allow checked-in participants to submit structured bug reports
- Enforce duplicate awareness before submission
- Enable marshals to validate, reject, or score bug reports
- Display a live leaderboard reflecting validated scores
- Centralize all event configuration in a single settings panel

---

## 4. Features

### Participant Features
- Public event registration with Razorpay payment
- Email confirmation on registration
- Participant login using registered email + phone number
- Bug submission form with screenshot upload and optional screen recording
- Duplicate awareness list — shows existing bugs before submission
- My Reports view showing all submitted bugs, statuses, and points
- Live leaderboard

### Marshal Features
- Secure login with JWT
- Bug Queue — full list of all submitted bugs with filters
- Quick action buttons — Validate, Reject, Duplicate, Needs More Info
- Bug Detail Panel — full bug view with severity assignment, notes, and points override
- Registrations management — view, verify payment, assign participant IDs
- Check-In desk — scan or search participants by ID/email and check them in
- Stats Dashboard — charts for bug status, module, severity, and top participants
- Event Settings — full control of event lifecycle, registration, and leaderboard visibility

### Administrative Features
- Event Settings as single source of truth for all pages
- Registration open/close toggle
- Registration deadline enforcement
- Maximum participant cap enforcement
- Event started / event ended lifecycle flags
- Leaderboard visibility toggle
- Email notification dispatch on registration and payment approval
- File upload with rate limiting

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                             │
│                                                         │
│   React 18 + Vite   ←→   TanStack React Query          │
│   React Router DOM        Radix UI + Tailwind CSS       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  EXPRESS SERVER (port 3000)              │
│                                                         │
│  Helmet  │  CORS  │  Morgan  │  express-async-errors   │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │              appRouter.js (Base44 adapter)         │ │
│  │  /api/apps/:appId/user/*                          │ │
│  │  /api/apps/:appId/admin/*                         │ │
│  │  /api/apps/:appId/*                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Auth Module │  │ Bug Module│  │Registration Module │ │
│  └─────────────┘  └──────────┘  └────────────────────┘ │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │EventSettings │  │ Razorpay │  │   Email Service   │ │
│  └──────────────┘  └──────────┘  └───────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│             PostgreSQL — Neon (cloud hosted)             │
│                                                         │
│  users  │  registrations  │  bug_reports  │             │
│  event_settings                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Frontend Architecture

### Technology Stack
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 6.1 | Build tool and dev server |
| React Router DOM | 6.26 | Client-side routing |
| TanStack React Query | 5.x | Server state management and caching |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | Various | Accessible headless UI primitives |
| Lucide React | 0.475 | Icon library |
| Recharts | 2.15 | Charts and data visualization |
| Nodemailer | — | (backend only) |

### Application Entry Point
```
main.jsx → App.jsx → AuthProvider → QueryClientProvider → ParticipantSessionProvider → Router → Routes
```

### Route Structure
| Path | Component | Auth |
|------|-----------|------|
| `/event-register` | PublicRegister | Public |
| `/user/login` | ParticipantLogin | Public |
| `/admin/login` | MarshalLogin | Public |
| `/login` | → redirect to `/user/login` | Public |
| `/` | Home (redirect) | Public |
| `/submit` | SubmitBug | ParticipantGate |
| `/my-reports` | MyReports | ParticipantGate |
| `/leaderboard` | Leaderboard | Public |
| `/marshal/queue` | MarshalQueue | JWT required |
| `/marshal/registrations` | MarshalRegistrations | JWT required |
| `/marshal/checkin` | MarshalCheckin | JWT required |
| `/marshal/stats` | MarshalStats | JWT required |
| `/marshal/settings` | AdminSettings | JWT required |

### State Management
- **Server state**: TanStack React Query with query keys per resource
- **Marshal auth state**: `AuthContext` — reads `bat_marshal_token` from localStorage
- **Participant session**: `ParticipantSessionProvider` — reads `bat_participant_session` from sessionStorage
- **Local UI state**: `useState` per component

### API Client (`src/api/apiClient.js`)
The API client is the single point of contact with the backend. It:
- Determines the namespace (`admin` vs `user`) based on whether a marshal JWT is present
- Auto-unwraps `{ success, data }` shaped responses
- Exposes entity methods: `.list()`, `.filter()`, `.create()`, `.update()`, `.get()`
- Exposes `auth`, `userAuth`, `functions`, `uploadFile` helpers

---

## 7. Backend Architecture

### Technology Stack
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4.18 | HTTP server framework |
| Prisma | 5.22 | ORM and query builder |
| Zod | 3.22 | Request body validation |
| jsonwebtoken | 9.0 | JWT sign and verify |
| bcrypt | 5.1 | Password hashing |
| multer | 1.4.5 | File upload handling |
| nodemailer | 6.9 | Transactional email |
| helmet | 7.1 | HTTP security headers |
| cors | 2.8 | Cross-origin resource sharing |
| morgan | 1.10 | HTTP request logging |
| express-rate-limit | 8.5 | Upload endpoint rate limiting |
| express-async-errors | 3.1 | Async error propagation |

### Module Structure
Each domain is a self-contained module with its own controller, service, routes, and validation:

```
src/modules/
  auth/              — login, token generation, /auth/me
  bugs/              — bug CRUD, entity adapter, business logic
  email/             — Nodemailer transactional email
  eventsettings/     — event configuration, public and marshal views
  razorpay/          — order creation, HMAC signature verification
  registrations/     — registration CRUD, check-in, payment verification
  upload/            — file upload via multer
```

### Middleware Stack
| Middleware | Purpose |
|-----------|---------|
| `authenticate` | Verifies JWT, loads user from DB, attaches to `req.user` |
| `requireMarshal()` | Blocks non-MARSHAL roles with 403 |
| `softAuth` | Decodes JWT if present, returns null if missing — never throws |
| `validateBodyZod` | Validates request body against a Zod schema, strips unknown fields |
| `validateBody` | Validates against a Joi schema (legacy routes) |
| `errorHandler` | Global 500 error handler |
| `notFoundHandler` | 404 catch-all |

### appRouter.js — Base44 Adapter Layer
The frontend was originally built against the Base44 SDK, which uses URL patterns like:
- `GET /entities/BugReport`
- `POST /entities/Registration`
- `POST /functions/sendRegistrationConfirmation`

`appRouter.js` maps these SDK patterns to Express handlers, providing a compatibility layer. This avoids any frontend changes while running a fully custom backend.

---

## 8. Database Architecture

### ORM: Prisma 5 with PostgreSQL (Neon)

### Models

#### User
Stores marshal credentials only. Participants do not have User records.

#### Registration
Stores participant registrations. Payment status, check-in state, and participant_id are managed here.

#### BugReport
Core entity. Stores all bug submissions. Points, severity, and status are managed by marshals.

#### EventSettings
Singleton row. All event configuration lives here. Pages read from this as the single source of truth.

### Enums
- `Role` — MARSHAL, PARTICIPANT
- `BugStatus` — PENDING_REVIEW, VALIDATED, REJECTED, NEEDS_MORE_INFO, DUPLICATE
- `BugSeverity` — LAUNCH_BLOCKER, CRITICAL, HIGH, MEDIUM, LOW
- `BugCategory` — 9 modules (CUSTOMER_APP, ADMIN_DASHBOARD, etc.)
- `PaymentStatus` — PENDING_VERIFICATION, VERIFIED, REJECTED

---

## 9. Authentication Flow

### Marshal Authentication (JWT)

```
1. Marshal POSTs to /admin/login with { email, password }
2. Backend verifies bcrypt hash
3. JWT signed with JWT_SECRET, expiry 7 days
4. Token stored in localStorage as bat_marshal_token
5. All subsequent marshal requests include Authorization: Bearer <token>
6. authenticate middleware verifies JWT and looks up user in DB
7. req.user is set from DB record (not JWT payload) — ensures deactivated accounts are blocked
```

### Participant Authentication (Session Token)

```
1. Participant POSTs to /user/login with { email, phone }
2. Backend looks up Registration by email, verifies phone matches
3. Returns registration data (participant_id, name, registration_id)
4. Frontend stores { participant_id, name, registration_id } in sessionStorage as bat_participant_session
5. No JWT is ever issued to participants
6. ParticipantGateWrapper reads sessionStorage and gates participant pages
7. Bug submissions include participant_id as a field, validated against checked-in registrations
```

### Key Design Decision
Participants use session-only auth (no JWT) because they don't have User records in the database. Their identity is tied to their Registration record and checked_in status.

---

## 10. Authorization Flow

### Namespace Routing
The API client selects between two namespaces based on token presence:
- Token present → `/api/apps/{APP_ID}/admin/*`
- No token → `/api/apps/{APP_ID}/user/*`

Both namespaces are served by the same `appRouter.js`, so the route handlers are identical — the namespace is cosmetic but makes request intent explicit.

### Route-Level Authorization

| Resource | Action | Auth Required |
|----------|--------|---------------|
| EventSettings GET | List | None |
| EventSettings POST/PUT | Modify | JWT + MARSHAL role |
| BugReport GET | List | softAuth (null = public/participant, JWT = marshal full access) |
| BugReport POST | Create | None (participant_id validated against checked-in Registration) |
| BugReport PUT/PATCH | Update | JWT + MARSHAL role |
| Registration GET | List | JWT + MARSHAL role |
| Registration POST | Create | None (public registration) |
| Registration PUT/PATCH | Update | JWT + MARSHAL role |

### Role Enforcement in Bug Listing
When `GET /entities/BugReport` is called:
- `req.user === null` → public access, filtered by `?q=` parameters (leaderboard, DuplicateAwarenessList)
- `req.user.role === "marshal"` → full access, no participant filter
- `req.user.role === other` → filtered to own bugs via checked-in Registration lookup

---

## 11. API Architecture

The backend exposes two API namespaces:

### Legacy API (`/api/v1/*`)
Traditional REST routes used internally and for direct API access.

### SDK Adapter API (`/api/apps/:appId/*`)
Base44-compatible routes consumed by the frontend. All frontend requests go through this namespace.

### Response Shape
All SDK adapter routes return raw JSON (not wrapped in `{ success, data }`).
All `/api/v1/` routes return `{ success: true, message: "...", data: {...} }`.

The frontend `apiClient.request()` auto-unwraps `{ success, data }` shapes, so legacy-format responses from functions like `createRazorpayOrder` are transparently unwrapped before reaching page code.

---

## 12. File Upload Flow

```
1. Frontend selects file (screenshot or recording)
2. POST /api/apps/:appId/integrations/Core/UploadFile
   — multipart/form-data with field name "file"
   — uploadRateLimit middleware (30 uploads/IP/15 min)
   — multer saves to /uploads/ with timestamped filename
3. Backend returns { file_url: "http://localhost:3000/uploads/<filename>" }
4. Frontend stores file_url and includes it in the bug report payload
5. Uploaded files are served as static assets from /uploads/
```

### Supported File Types
- Screenshots: image/* (jpg, png, gif, webp)
- Recordings: video/* (mp4, webm, mov)

### Rate Limiting
30 uploads per IP per 15-minute window via `express-rate-limit`.

---

## 13. Bug Submission Flow

```
1. Participant logs in → session stored in sessionStorage
2. ParticipantGateWrapper validates session exists and participant_id is set
3. Participant selects module → DuplicateAwarenessList loads existing bugs for that module
4. Participant confirms this is not a duplicate (required checkbox)
5. Participant fills bug form (title, steps, expected, actual behavior)
6. Participant uploads screenshot (required) and optional screen recording
7. POST /entities/BugReport with full payload including participant_id
8. Backend validates:
   — createBugSchema (Zod)
   — participant_id must match a checked-in Registration
9. Bug created with status PENDING_REVIEW, points_awarded 0
10. Participant sees success screen with report ID
```

### Validation Rules
- `module`: Must be one of 9 valid modules
- `bug_title`: Required, max 100 characters
- `steps_to_reproduce`: Required, max 300 characters
- `expected_behavior`: Required, max 200 characters
- `actual_behavior`: Required, max 200 characters
- `screenshot_url`: Required, must be a valid URL
- `participant_id`: Required, must match a checked-in Registration

---

## 14. Bug Validation Workflow

### Status Lifecycle
```
PENDING_REVIEW → VALIDATED       (marshal validates, assigns severity + points)
             → REJECTED          (not a real bug, points = 0)
             → NEEDS_MORE_INFO   (marshal requests clarification)
             → DUPLICATE         (already reported, points = 0.5)
```

### Marshal Actions

#### Quick Actions (from Bug Queue table)
| Button | Status Set | Points Set |
|--------|-----------|------------|
| ✓ Validate | Validated | Unchanged (set separately in detail panel) |
| ✗ Reject | Rejected | 0 (auto) |
| ⧉ Duplicate | Duplicate | 0.5 (auto) |
| ? Needs Info | Needs More Info | Unchanged |

#### Detail Panel Actions (per-bug side panel)
- Set severity → points auto-calculated
- Override points manually
- Add marshal notes (visible to participant on Needs More Info)
- Set duplicate_of reference ID

### API Call
All quick actions and detail panel saves use `PATCH /entities/BugReport/:id` with the marshal's JWT.

---

## 15. Severity & Points System

### Point Values
| Severity | Points |
|----------|--------|
| Launch Blocker | 15 |
| Critical | 10 |
| High | 7 |
| Medium | 4 |
| Low | 1 |
| Duplicate | 0.5 (automatic) |
| Rejected | 0 (automatic) |

### Auto-Calculation
When a marshal sets severity in the BugDetailPanel:
1. Frontend: `handleSeverityChange()` immediately sets the points field in the UI
2. Backend: `updateBugReport()` auto-calculates points if `points_awarded` is not explicitly provided in the request

Marshals may override the auto-calculated points manually using the Points Awarded input field.

### Points Persistence
Points are stored in the `points_awarded` (Float) column on the `bug_reports` table and are the authoritative source for all leaderboard calculations.

---

## 16. Leaderboard Logic

### Data Source
The leaderboard is computed entirely on the frontend from raw bug report data fetched via `GET /entities/BugReport`. No separate leaderboard endpoint exists.

### Aggregation Algorithm
```javascript
for each bug report:
  accumulate reports_submitted++
  if status === "Validated" OR status === "Duplicate":
    accumulate total_points += points_awarded
  if status === "Validated":
    accumulate reports_validated++

sort by:
  1. total_points DESC
  2. reports_validated DESC (tiebreaker)
```

### Display
- Top 3 participants → podium visualization with gold/silver/bronze
- Remaining participants → ranked table
- Auto-refreshes every 60 seconds

### Visibility Control
If `EventSettings.leaderboard_visible === false`, the leaderboard page shows a hidden message instead of rankings.

### Scoring Rule
Only **Validated** and **Duplicate** statuses contribute to scores. Pending, Rejected, and Needs More Info bugs have no effect on rankings.

---

## 17. Event Settings Synchronization

EventSettings is the single source of truth for all event configuration. All pages that display event data fetch from `GET /entities/EventSettings`.

### Synchronized Fields
| Field | Type | Used By |
|-------|------|---------|
| event_name | String | PublicRegister, all pages |
| event_description | String | PublicRegister |
| event_date | String | PublicRegister |
| event_time | String | PublicRegister |
| venue | String | PublicRegister |
| registration_fee | Int | PublicRegister |
| registration_deadline | String | PublicRegister (auto-close) |
| max_participants | Int | PublicRegister (auto-close) |
| event_banner | String | PublicRegister |
| upi_id | String | AdminSettings |
| upi_qr_url | String | AdminSettings |
| registration_open | Boolean | PublicRegister |
| event_started | Boolean | SubmitBug |
| event_ended | Boolean | SubmitBug |
| leaderboard_visible | Boolean | Leaderboard |

### Registration Gate Logic (PublicRegister)
Evaluated in this priority order:
1. `registration_open === false` → "Registrations are currently closed."
2. `registration_deadline` passed → "Registration deadline has passed."
3. `current_participants >= max_participants` → "Participant limit reached."

### Bug Submission Gate Logic (SubmitBug)
1. `event_ended === true` → "Bug submissions are closed — the event has ended."
2. `event_started === false` → "Bug submissions will open once the marshal starts the event."

### Live Participant Count
`GET /entities/EventSettings` includes `current_participants` — a live count from `SELECT COUNT(*) FROM registrations` — so the frontend can enforce the max participant cap without a separate API call.

---

## 18. Notification Flow

### Registration Confirmation Email
```
1. Participant completes registration (step 3)
2. Frontend calls POST /functions/sendRegistrationConfirmation
   with { registration_id, email, name }
3. Backend fires sendRegistrationConfirmation() via Nodemailer
4. Email is non-blocking (fire and forget)
5. Participant sees success screen regardless of email outcome
```

### Payment Verification Email
```
1. Marshal verifies payment and assigns participant_id in MarshalRegistrations
2. Marshal updates registration with payment_status = "Verified"
3. Backend calls sendVerificationApprovedEmail() with { name, email, participant_id }
4. Participant receives email containing their unique Participant ID
```

### Email Configuration
Emails are sent via Gmail SMTP using Nodemailer. The SMTP transporter is lazily initialized — if SMTP credentials are missing, email is silently skipped (logged as warning).

---

## 19. Payment Flow (Razorpay)

```
Step 1 — Create Order
  Frontend: POST /functions/createRazorpayOrder {}
  Backend:  calls Razorpay API → creates order for ₹149 (14900 paise)
  Returns:  { order_id, amount, currency, key_id }

Step 2 — Open Checkout
  Frontend: opens Razorpay checkout modal with order details
  User:     completes payment inside Razorpay's modal

Step 3 — Receive Confirmation
  Razorpay: calls handler() callback with
            { razorpay_order_id, razorpay_payment_id, razorpay_signature }

Step 4 — Verify Signature
  Frontend: POST /functions/createRazorpayOrder/verify
            with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  Backend:  HMAC-SHA256 verification using RAZORPAY_KEY_SECRET
  Returns:  { verified: true, payment_id } or 400 error

Step 5 — Complete Registration
  Frontend: stores payment_reference = razorpay_payment_id
  User:     clicks "Complete Registration"
  Frontend: POST /entities/Registration with payment_reference
```

### Security Note
The HMAC signature check on the backend prevents tampered or fabricated payment confirmations from reaching the registration database.

---

## 20. Error Handling Strategy

### Backend
- `express-async-errors` wraps all async route handlers — uncaught promise rejections are forwarded to Express error middleware
- Global `errorHandler` middleware catches all unhandled errors and returns `{ success: false, message }` with appropriate HTTP status
- `notFoundHandler` returns 404 for unmatched routes
- Zod validation failures return 422 with per-field error details
- JWT errors return 401 with specific messages (expired, invalid)
- Prisma unique constraint violations (P2002) are caught and return 409

### Frontend
- TanStack React Query retry logic handles transient network failures
- `onError` callbacks in mutations display user-facing error messages
- Payment verification errors show inline error messages without breaking the flow
- Email sending errors are silently ignored (non-blocking)

---

## 21. Security Measures

| Measure | Implementation |
|---------|---------------|
| HTTP security headers | `helmet` middleware |
| CORS restriction | Whitelist: CLIENT_URL + localhost:5173 |
| Password hashing | bcrypt (salt rounds: 10) |
| JWT signing | HS256, 7-day expiry, verified against DB on every request |
| Role enforcement | `requireMarshal()` middleware on all write operations |
| PII protection | `GET /entities/Registration` requires marshal JWT |
| Upload rate limiting | 30 uploads/IP/15 min via `express-rate-limit` |
| Payment verification | HMAC-SHA256 signature check before storing payment reference |
| Input validation | Zod schemas on all POST/PUT/PATCH endpoints |
| Participant ID validation | Bug creation requires `participant_id` matching a checked-in Registration |
| Environment secrets | Loaded via dotenvx, never committed to source control |

---

## 22. Folder Structure

```
/
├── breakathon-backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── db.js              — Prisma client singleton
│   │   │   └── env.js             — dotenvx loader
│   │   ├── middleware/
│   │   │   ├── auth.js            — JWT authenticate middleware
│   │   │   ├── errorHandler.js    — Global error + 404 handler
│   │   │   ├── role.js            — requireMarshal()
│   │   │   └── validate.js        — validateBody, validateBodyZod
│   │   ├── modules/
│   │   │   ├── auth/              — login, JWT, /auth/me
│   │   │   ├── bugs/              — bug CRUD, entity adapter, validation
│   │   │   ├── email/             — Nodemailer service
│   │   │   ├── eventsettings/     — settings CRUD
│   │   │   ├── razorpay/          — payment order + verification
│   │   │   ├── registrations/     — registration CRUD, check-in
│   │   │   └── upload/            — multer file upload
│   │   ├── routes/
│   │   │   └── appRouter.js       — Base44 SDK adapter routes
│   │   └── utils/
│   │       ├── apiResponse.js     — sendSuccess, sendError helpers
│   │       └── jwt.js             — sign and verify token
│   ├── uploads/                   — uploaded files (gitignored)
│   ├── server.js
│   └── package.json
│
└── breakathon-frontend/
    ├── src/
    │   ├── api/
    │   │   └── apiClient.js       — HTTP client, auth, entity helpers
    │   ├── components/
    │   │   ├── AppLayout.jsx      — Nav + Outlet wrapper
    │   │   ├── AuthLayout.jsx     — Centered auth card wrapper
    │   │   ├── DuplicateAwarenessList.jsx
    │   │   ├── MarshalGateWrapper.jsx
    │   │   ├── ParticipantGateWrapper.jsx
    │   │   ├── ParticipantSessionProvider.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── SeverityBadge.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── marshal/
    │   │   │   └── BugDetailPanel.jsx
    │   │   └── ui/                — Radix + shadcn component library
    │   ├── lib/
    │   │   ├── AuthContext.jsx    — Marshal JWT auth context
    │   │   ├── marshalSession.js  — localStorage helpers
    │   │   ├── participantSession.js — sessionStorage helpers
    │   │   └── query-client.js    — TanStack Query client config
    │   ├── pages/
    │   │   ├── AdminSettings.jsx
    │   │   ├── Home.jsx
    │   │   ├── Leaderboard.jsx
    │   │   ├── Login.jsx          — Combined participant + marshal login
    │   │   ├── MarshalCheckin.jsx
    │   │   ├── MarshalLogin.jsx   — Marshal-only login page
    │   │   ├── MarshalQueue.jsx
    │   │   ├── MarshalRegistrations.jsx
    │   │   ├── MarshalStats.jsx
    │   │   ├── MyReports.jsx
    │   │   ├── ParticipantLogin.jsx — Participant-only login page
    │   │   ├── PublicRegister.jsx
    │   │   └── SubmitBug.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 23. Environment Variables

### Backend (`breakathon-backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JWTs | 64-character hex string |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS whitelist | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay public key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | `...` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP sender email | `you@gmail.com` |
| `SMTP_PASS` | SMTP app password (quoted if spaces) | `"xxxx xxxx xxxx xxxx"` |
| `SMTP_FROM` | From display name + email | `"Event Name <you@gmail.com>"` |

### Frontend (`breakathon-frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend base URL | `http://localhost:3000` |
| `VITE_APP_ID` | App ID path segment | `default` |

---

## 24. Third-Party Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| `@prisma/client` | Database ORM client |
| `prisma` | Schema management and migrations |
| `express` | HTTP server |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT generation and verification |
| `zod` | Runtime schema validation |
| `multer` | Multipart file upload |
| `nodemailer` | SMTP email sending |
| `helmet` | Security HTTP headers |
| `cors` | Cross-origin resource sharing |
| `morgan` | HTTP request logging |
| `express-rate-limit` | Rate limiting |
| `express-async-errors` | Async error forwarding |
| `dotenv` | Environment variable loading |

### Frontend
| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state management |
| `@radix-ui/*` | Headless UI primitives |
| `tailwindcss` | Utility CSS framework |
| `lucide-react` | Icon library |
| `recharts` | Chart library for Stats Dashboard |
| `vite` | Build tool and dev server |
| `zod` | Client-side form validation |

### External Services
| Service | Purpose |
|---------|---------|
| Neon | Serverless PostgreSQL hosting |
| Razorpay | Payment processing (test mode) |
| Gmail SMTP | Transactional email delivery |

---

## 25. Design Decisions

### Dual Auth System
Participants are not Users in the database — they are Registrations. This simplifies onboarding (no password creation required) and prevents participants from accessing the marshal API. The phone number acts as a lightweight password for participant login.

### Base44 Adapter Pattern
The frontend was originally built against the Base44 SDK. Rather than rewriting all frontend API calls, `appRouter.js` implements a compatibility adapter that maps SDK URL patterns to custom Express handlers. This reduces migration risk and keeps frontend changes minimal.

### softAuth Middleware
`GET /entities/BugReport` serves three audiences simultaneously — public (leaderboard), participants (MyReports), and marshals (full queue). `softAuth` allows all three to share one route handler while enforcing appropriate data filtering per caller type.

### Singleton EventSettings
Rather than per-page configuration, all event state lives in one database row. This eliminates configuration drift and makes the marshal settings panel the true single source of truth.

### Server-side Point Auto-calculation
Points are calculated both on the frontend (for immediate UI feedback) and on the backend (as a safety net). The backend calculation ensures direct API calls cannot bypass point assignment.

### No Separate Leaderboard Endpoint
The leaderboard is computed on the frontend from raw bug data. This avoids maintaining a separate aggregate endpoint and keeps the data fresh without cache invalidation complexity.

---

## 26. Future Enhancements

- Forgot password / reset password flow (currently stubbed)
- Real-time updates via WebSockets or Server-Sent Events (currently polls every 60s)
- Participant comments on bug reports for two-way communication
- Bulk marshal actions (validate/reject multiple bugs at once)
- Export leaderboard to PDF or CSV
- QR code check-in scanning (currently manual entry)
- Dark mode toggle
- Multi-event support (currently single-event singleton)
- Email templates for rejection and needs-more-info status changes
- Admin dashboard for super-admin above marshal role
