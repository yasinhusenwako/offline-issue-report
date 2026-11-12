# InfraSync Backend API

**Offline Infrastructure Reporting & Maintenance Management System**

A production-ready Express + TypeScript REST API with offline synchronization support, backed by Supabase PostgreSQL.

---

## Project Structure

```
infrasync/
├── client/                   # React + Vite + TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                   # Express + TypeScript backend (this document)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts         # Environment variable validation
│   │   │   └── supabase.ts    # Supabase admin + anon clients
│   │   ├── controllers/
│   │   │   ├── report.controller.ts
│   │   │   └── sync.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # Dev role simulation
│   │   │   ├── error.middleware.ts   # Centralized error handling
│   │   │   └── validate.middleware.ts
│   │   ├── routes/
│   │   │   ├── report.routes.ts
│   │   │   ├── sync.routes.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── report.service.ts    # Business logic
│   │   │   └── sync.service.ts      # Sync engine
│   │   ├── types/
│   │   │   ├── api.ts               # API types
│   │   │   └── database.ts          # DB schema types
│   │   ├── utils/
│   │   │   ├── errors.ts            # Custom error classes
│   │   │   ├── response.ts          # Response helpers
│   │   │   └── status-machine.ts    # State machine
│   │   ├── validators/
│   │   │   └── report.validators.ts # Zod schemas
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── fixtures/
│   │   │   ├── reports.fixtures.ts
│   │   │   └── supabase.mock.ts
│   │   ├── integration/
│   │   │   ├── reports.test.ts
│   │   │   ├── status.test.ts
│   │   │   └── sync.test.ts
│   │   ├── unit/
│   │   │   └── status-machine.test.ts
│   │   └── setup.ts
│   ├── .env.example
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Monorepo root
└── .gitignore
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project with the InfraSync schema applied

### 1. Install Dependencies

```bash
# From server/ directory
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

> **⚠️ Security:** Never commit `.env`. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

### 3. Run Development Server

```bash
npm run dev
```

The API starts at **http://localhost:4000**

---

## Database Schema

The backend connects to an existing Supabase PostgreSQL database with these tables:

### `reports`
| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Server-generated report ID |
| `client_report_id` | UUID UNIQUE | Offline client ID (idempotency key) |
| `title` | TEXT | Report title |
| `description` | TEXT | Detailed description |
| `category` | ENUM | road, bridge, water, electricity, sewage, building, other |
| `priority` | ENUM | low, medium, high, critical |
| `status` | ENUM | draft, submitted, assigned, in_progress, resolved, rejected |
| `location_lat/lng` | FLOAT | GPS coordinates |
| `location_address` | TEXT | Human-readable address |
| `assigned_to` | TEXT | Assignee identifier |
| `rejection_reason` | TEXT | Required when rejecting |
| `version` | INT | Optimistic concurrency version |
| `sync_state` | ENUM | synced, pending, conflict |
| `created_at / updated_at` | TIMESTAMPTZ | Timestamps |

### `report_activity`
Append-only audit log. Every status change, assignment, creation, and sync is recorded here.

### `sync_operations`
Tracks every sync attempt — including pending, success, partial, and failed states.

---

## API Reference

### Base URL

```
http://localhost:4000/api
```

### Authentication (Development)

This project uses **simulated development roles** via a request header:

```http
X-Dev-Role: field_worker    # Default
X-Dev-Role: coordinator
```

> ⚠️ **This is NOT production authentication.** Replace with real JWT/OAuth before deploying.

---

### Reports

#### `POST /api/reports`

Create a new report.

**Headers:** `X-Dev-Role: field_worker`

**Body:**
```json
{
  "client_report_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Pothole on Main Road",
  "description": "Large pothole approximately 1m wide blocking the right lane near the school entrance",
  "category": "road",
  "priority": "high",
  "status": "draft",
  "location_lat": -1.2921,
  "location_lng": 36.8219,
  "location_address": "123 Main St, Nairobi"
}
```

**Responses:**
- `201` — Report created
- `400` — Validation error
- `409` — Duplicate `client_report_id` (returns existing report ID)

---

#### `GET /api/reports`

List reports with filtering and pagination.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `status` | string | Filter by status |
| `category` | string | Filter by category |
| `priority` | string | Filter by priority |
| `search` | string | Search in title, description, address |
| `dateFrom` | ISO8601 | Filter reports created after |
| `dateTo` | ISO8601 | Filter reports created before |

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### `GET /api/reports/:id`

Get a single report with its full activity history.

---

#### `PATCH /api/reports/:id`

Update editable fields. Only works on `draft` or `submitted` reports.

**Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description that is long enough",
  "version": 1
}
```

> `version` is required for optimistic concurrency. Use the version returned by GET.

**Errors:**
- `409` — Version conflict (server has a newer version)
- `403` — Report is not in an editable state

---

#### `DELETE /api/reports/:id`

Delete a report. **Only `draft` reports can be deleted.**

---

### Status Management

#### `PATCH /api/reports/:id/status`

Transition a report's status.

**Valid state machine:**

```
draft → submitted
submitted → assigned | rejected
assigned → in_progress | rejected
in_progress → resolved | rejected
resolved → in_progress  (explicit reopen only)
rejected → (no automatic transitions)
```

**Body:**
```json
{
  "status": "rejected",
  "rejection_reason": "Insufficient location information provided",
  "notes": "Optional coordinator notes",
  "version": 2
}
```

**Rules:**
- `rejection_reason` is **required** when status is `rejected`
- Only coordinators can assign, put in-progress, or reject
- Returns `422` for invalid transitions with `allowed` list in response

---

### Assignment

#### `PATCH /api/reports/:id/assign`

Assign a report to a worker. **Coordinator only.**

**Body:**
```json
{
  "assigned_to": "worker-id-or-name",
  "notes": "Please investigate urgently",
  "version": 1
}
```

---

### Synchronization

#### `POST /api/sync/reports`

Sync a batch of offline-created reports to the server.

**Design guarantees:**
- ✅ Idempotent — safe to retry the same batch
- ✅ Partial success — successful reports saved even if others fail
- ✅ Duplicate detection — returns existing ID for `client_report_id` matches
- ✅ Per-item results — each report gets an individual success/failure response

**Body:**
```json
{
  "device_id": "optional-device-identifier",
  "reports": [
    {
      "client_report_id": "uuid-1",
      "title": "Report 1",
      "description": "Description of the issue long enough for validation",
      "category": "road",
      "priority": "high"
    },
    {
      "client_report_id": "uuid-2",
      "title": "Report 2",
      "description": "Another description of the issue long enough for validation",
      "category": "water",
      "priority": "critical"
    }
  ]
}
```

**Response (200/207):**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "created": 1,
    "duplicates": 1,
    "failed": 0,
    "results": [
      {
        "client_report_id": "uuid-1",
        "status": "created",
        "server_report_id": "server-uuid-abc"
      },
      {
        "client_report_id": "uuid-2",
        "status": "duplicate",
        "server_report_id": "server-uuid-xyz"
      }
    ]
  }
}
```

**HTTP Status:**
- `200` — All succeeded (or all duplicates)
- `207 Multi-Status` — Mixed results (some created, some failed)
- `422` — All failed

---

### Activity History

#### `GET /api/reports/:id/activity`

Returns chronological activity log for a report.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "report_id": "uuid",
      "activity_type": "created",
      "performed_by": "user-id",
      "performed_by_role": "field_worker",
      "old_value": null,
      "new_value": { "status": "draft" },
      "notes": "Report created",
      "created_at": "2026-11-12T10:00:00Z"
    }
  ]
}
```

---

### Health Check

#### `GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-11-12T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "ok"
  }
}
```

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "category", "message": "Invalid category" }
    ]
  },
  "timestamp": "2026-11-12T10:00:00.000Z"
}
```

**Error codes:**

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Version conflict or duplicate |
| `DUPLICATE` | 409 | Duplicate `client_report_id` |
| `INVALID_TRANSITION` | 422 | Invalid status transition |
| `DATABASE_ERROR` | 503 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `RATE_LIMITED` | 429 | Too many requests |

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

| # | Test | Location |
|---|---|---|
| 1 | Creating valid reports | `reports.test.ts` |
| 2 | Rejecting invalid data | `reports.test.ts` |
| 3 | Duplicate prevention | `reports.test.ts` |
| 4 | Valid status transitions | `status.test.ts` |
| 5 | Invalid status transitions | `status.test.ts` |
| 6 | Report assignment | `status.test.ts` |
| 7 | Batch synchronization | `sync.test.ts` |
| 8 | Retry idempotency | `sync.test.ts` |
| 9 | Partial sync failures | `sync.test.ts` |
| 10 | Version conflicts | `reports.test.ts` |
| 11 | Activity history | `status.test.ts` |

Tests use an **in-memory mock** of the Supabase client — no real database connection needed.

---

## Synchronization Strategy

The sync engine (`sync.service.ts`) implements these guarantees:

1. **Idempotent** — submitting the same `client_report_id` twice returns the existing record
2. **Partial success** — each report in a batch is processed independently
3. **Retry-safe** — interrupted batches can be re-submitted without duplicates
4. **Audit trail** — every sync attempt is recorded in `sync_operations`
5. **Conflict-safe** — version numbers prevent silent overwrites

### Concurrency Control

All mutating operations (`PATCH`, status transitions, assignments) require the current `version` number. If the server version differs, a `409 CONFLICT` is returned with both versions so the client can resolve.

---

## Roles & Permissions

| Operation | field_worker | coordinator |
|---|---|---|
| Create report | ✅ | ✅ |
| View reports | ✅ | ✅ |
| Edit draft/submitted | ✅ | ✅ |
| Submit (draft → submitted) | ✅ | ✅ |
| Assign report | ❌ | ✅ |
| Reject report | ❌ | ✅ |
| Move to in_progress | ❌ | ✅ |
| Delete draft | ✅ | ✅ |
| Sync batch | ✅ | ✅ |

---

## Scripts

```bash
npm run dev        # Start with hot reload (tsx watch)
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled build
npm test           # Jest test suite
npm run lint       # TypeScript type check
npm run clean      # Remove dist/
```

