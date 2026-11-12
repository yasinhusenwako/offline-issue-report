# InfraSync — Offline-First Infrastructure Reporting & Maintenance Management System

An offline-first field reporting and maintenance management system designed for municipal and utility field crews operating in intermittent- or zero-connectivity environments. InfraSync pairs a local-first **React PWA (Dexie.js IndexedDB)** client with a resilient **Node.js Express TypeScript REST API** backed by **Supabase PostgreSQL**.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Synchronization Strategy & Offline-First Guarantees](#synchronization-strategy--offline-first-guarantees)
3. [Setup & Execution Instructions](#setup--execution-instructions)
4. [Automated Test Execution](#automated-test-execution)
5. [Seed & Demonstration Data](#seed--demonstration-data)
6. [Design Decisions & Assumptions](#design-decisions--assumptions)
7. [Known Limitations & Edge Cases](#known-limitations--edge-cases)
8. [Manual QA Verification Checklist](#manual-qa-verification-checklist)
9. [Project Retrospective: Time Spent & Future Improvements](#project-retrospective-time-spent--future-improvements)
10. [AI & Development Tool Disclosure](#ai--development-tool-disclosure)

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FIELD WORKER / COORDINATOR                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      React 19 + Vite PWA                       │   │
│   │                                                                │   │
│   │  • Field Reporting Form (Zod + React Hook Form)                │   │
│   │  • Coordinator Dashboard & Status Transition Matrix            │   │
│   │  • Conflict Resolution Drawer (Local vs Server Diffs)          │   │
│   │  • Role-based access (Field Worker / Coordinator views)        │   │
│   └──────────────┬───────────────────────────────────▲─────────────┘   │
│                  │ Instant write                     │ Reactive query  │
│                  ▼                                   │                 │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                  Dexie.js (Browser IndexedDB)                  │   │
│   │                                                                │   │
│   │  • reports (client_report_id, version, syncStatus, metadata)   │   │
│   │  • syncQueue (pending creates, status transitions, updates)    │   │
│   │  • activities (audit logs generated both offline & online)     │   │
│   │  • settings (offline simulation toggles, retry backoff state)  │   │
│   └──────────────┬───────────────────────────────────▲─────────────┘   │
│                  │                                   │                 │
│                  ▼                                   │                 │
│   ┌──────────────────────────────────────────────────┴─────────────┐   │
│   │                   Client Sync Engine & API Client              │   │
│   │  • Exponential backoff (1s, 2s, 4s, 8s, 16s, capped at 60s)    │   │
│   │  • Non-retryable error short-circuiting (400, 403, 404, 422)   │   │
│   │  • Idempotent client_report_id deduplication                   │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ HTTPS / REST (X-Dev-Role header)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS + EXPRESS BACKEND API                       │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Security, Middlewares & Validation                            │   │
│   │  • Helmet headers, CORS wildcard handling (*.vercel.app)       │   │
│   │  • Rate limiting (200 requests / 15 min window)                │   │
│   │  • Zod schema validation on route params, queries, and bodies  │   │
│   │  • Dev role simulation middleware (`X-Dev-Role`)               │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────┴─────────────────────────────────┐   │
│   │  Business Logic & State Machines                               │   │
│   │  • /api/sync/reports — atomic batch insert/upsert              │   │
│   │  • /api/reports/:id/status — strict transition state machine   │   │
│   │  • /api/reports/:id/assign — coordinator assignment gate       │   │
│   │  • /api/reports/:id (PATCH) — optimistic versioning (HTTP 409) │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │ Service Role Key (Server-only)      │
│                                  ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    SUPABASE POSTGRESQL                         │   │
│   │  • public.reports (UUID id, client_report_id UNIQUE, version)  │   │
│   │  • public.report_activity (immutable audit trail)              │   │
│   │  • public.sync_operations (idempotency & operation ledger)     │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Synchronization Strategy & Offline-First Guarantees

### 1. Offline-First Report Creation
1. Every report created on the client immediately gets a UUID `clientReportId` (using `crypto.randomUUID()` with fallback).
2. The form is validated using Zod against structural constraints (minimum description length, valid category, GPS/address validation).
3. The report is written synchronously to **IndexedDB (`reports` table)** with `syncStatus: 'Pending'`, `version: 1`, and `isDraft: false`.
4. A companion queue record is placed in **IndexedDB (`syncQueue` table)** with `action: 'create'`, `attempts: 0`, and `status: 'Pending'`.
5. An offline activity record is added to `activities`.
6. Immediate feedback is rendered to the user: the report appears on the dashboard and listing pages with an amber **Pending Sync** badge.
7. If the browser is online, synchronization triggers in the background; if offline, data stays securely in IndexedDB across browser reloads or device restarts.

### 2. Automatic Synchronization Lifecycle
Synchronization activates across multiple triggers:
- **Application Startup**: Verifies network connectivity and flushes any pending queue items while pulling latest server state.
- **Browser Online Event**: An event listener on `window.addEventListener('online', ...)` fires queue drain immediately upon network restoration.
- **Background Interval**: A periodic poll (default 30 seconds, user-configurable in Settings) sweeps the queue for items whose retry delay has elapsed.
- **Manual "Sync Now" Button**: Triggers both `syncService.processQueue(true)` (ignoring retry backoff) and `syncService.pullFromServer()`.

### 3. Batch Ingestion & Idempotency (`POST /api/sync/reports`)
- Pending creation items are grouped into batches (up to 50 items) and posted to `/api/sync/reports`.
- The server checks `reports.client_report_id` before inserting. If the report was previously received:
  - The server returns `{ status: 'duplicate', server_report_id: existing.id }`.
  - The client treats this as a success, records the server UUID, and deletes the queue item.
- If new, the server inserts the row, creates an initial `REPORT_CREATED` activity record, and returns `{ status: 'created', server_report_id: new.id }`.

### 4. Exponential Backoff & Retry Logic
- Failed network requests or server `5xx` errors trigger retry backoff calculated as:
  $$\text{delayMs} = \min(60000, 1000 \times 2^{\text{attempts}} \pm \text{jitter})$$
- After reaching `maxAttempts` (5 attempts), the item transitions to `status: 'Failed'` and is visually marked in red on the Sync Queue page with a manual retry option.
- **Client Error Short-Circuiting**: HTTP `400` (Bad Request), `403` (Forbidden), `404` (Not Found), and `422` (Invalid State Transition) do **not** enter exponential retry loops; they immediately mark the item as `Failed` with the exact backend rejection reason, preventing console spam and server hammering.

### 5. Optimistic Concurrency & Conflict Resolution (`HTTP 409`)
- Every report record has an integer `version` initialized at `1`.
- When updating or transitioning status, the client sends `{ version: currentVersion }`.
- If another user or coordinator updated the server record in the meantime, the database `version` will be higher, causing the server to return:
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "Version conflict: expected 3, got 2",
      "details": { "serverVersion": 3, "clientVersion": 2 }
    }
  }
  ```
- **Conflict Handling Workflow**:
  - The client captures the `409 Conflict` error and halts automatic syncing for that report.
  - The report state in IndexedDB is updated to `syncStatus: 'Conflict'`.
  - A conflict badge appears on the report with a **Resolve Conflict** action.
  - The user opens a side-by-side comparison modal displaying their local modifications vs. the live server state.
  - The user chooses between:
    - **Keep Server Version**: Overwrites local record with server snapshot and increments local version.
    - **Force Local Overwrite**: Refetches current server version number, re-applies local changes with `serverVersion`, and resubmits.

---

## Setup & Execution Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Supabase Account**: A free Supabase project with PostgreSQL enabled

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yasinhusenwako/offline-issue-report.git
cd offline-issue-report

# Install root, client, and server dependencies in one command
npm install
```

### 2. Configure Backend Environment
Create `server/.env` using the provided template:
```bash
cp server/.env.example server/.env
```

Populate `server/.env` with your Supabase credentials:
```env
# Supabase Configuration (from Supabase Dashboard -> Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Direct Postgres Connection URL (Settings -> Database -> Connection string -> URI)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Server Settings
PORT=4000
NODE_ENV=development

# Allowed CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://infra-sync-navy.vercel.app,https://*.vercel.app
```

> **Security Note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses PostgreSQL Row-Level Security (RLS) and must **never** be shared, committed to git, or exposed to the client bundle. The client communicates strictly with the Express API.

### 3. Initialize Database Tables
Run the migration script in your Supabase SQL Editor:
```sql
-- 1. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_report_id UUID UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Pothole', 'Water Leak', 'Power Outage', 'Streetlight', 'Traffic Signal', 'Waste / Debris', 'Safety Concern', 'Road Damage', 'Equipment Damage', 'Flooding', 'Signage', 'Other')),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_to TEXT,
    resolved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

-- 2. Activity Log Table
CREATE TABLE IF NOT EXISTS public.report_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    description TEXT NOT NULL,
    performed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Sync Operations Log
CREATE TABLE IF NOT EXISTS public.sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_report_id UUID NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_report_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_activity_report_id ON public.report_activity(report_id);
```

### 4. Configure Client Environment
Create `client/.env` (optional for local development, as it defaults to `http://localhost:4000/api`):
```bash
cp client/.env.example client/.env
```

```env
# When omitted in development, defaults to http://localhost:4000/api
# When omitted in production, defaults to https://offline-issue-report.vercel.app/api
VITE_API_BASE_URL=http://localhost:4000/api
```

### 5. Running the Application Locally
Open two terminal windows:

**Terminal 1 — Backend Server:**
```bash
npm run dev:server
# Server will run on http://localhost:4000
# Health check: http://localhost:4000/api/health
```

**Terminal 2 — Frontend Client:**
```bash
npm run dev:client
# Vite client will run on http://localhost:3000
```

Alternatively, from the repository root:
```bash
npm run build     # Builds both client and server
npm run lint      # Runs TypeScript typechecks on both workspaces
```

---

## Automated Test Execution

The backend contains a test suite covering unit validation, optimistic version concurrency, state machine transitions, and idempotent sync operations using **Jest** and **Supertest** with mocked database fixtures.

### Running the Tests
```bash
# Run server test suite from root
npm run test:server

# Or directly inside the server directory
cd server
npm test
```

### Test Suite Structure & Output
```
PASS tests/unit/status-machine.test.ts
  ✓ validates legal status transitions
  ✓ rejects illegal status transitions
  ✓ enforces coordinator-only roles for triage
  ✓ requires rejection reason on Rejected state
  ✓ validates explicit reopen flag on Resolved -> In Progress

PASS tests/integration/reports.test.ts
  ✓ POST /api/reports - creates report and enforces client_report_id uniqueness
  ✓ GET /api/reports - lists reports with pagination and status filters
  ✓ PATCH /api/reports/:id - updates fields and enforces version check
  ✓ DELETE /api/reports/:id - allows deletion of Drafts only

PASS tests/integration/status.test.ts
  ✓ PATCH /api/reports/:id/status - transitions status through workflow
  ✓ PATCH /api/reports/:id/status - returns 409 on version mismatch
  ✓ PATCH /api/reports/:id/status - returns 422 on illegal transition
  ✓ PATCH /api/reports/:id/assign - assigns technician with coordinator role
  ✓ GET /api/reports/:id/activity - returns chronological activity logs

PASS tests/integration/sync.test.ts
  ✓ POST /api/sync/reports - handles batch sync of new reports
  ✓ POST /api/sync/reports - idempotently handles duplicate client_report_ids
  ✓ POST /api/sync/reports - reports partial batch failures accurately

Test Suites: 4 passed, 4 total
Tests:       64 passed, 64 total
Snapshots:   0 total
```

To run test coverage:
```bash
cd server
npm run test:coverage
```

---

## Seed & Demonstration Data

To test synchronization and coordinator triage workflows without manual data entry, use the following sample payloads:

### Sample 1: Critical Equipment Damage (Submitted)
```json
{
  "client_report_id": "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
  "category": "Equipment Damage",
  "priority": "Critical",
  "status": "Submitted",
  "location": "North Substation, Transformer Bay #4",
  "description": "Oil seepage detected near primary cooling valve. Visual pressure gauge indicates operating anomaly.",
  "reported_at": "2026-11-12T08:30:00.000Z"
}
```

### Sample 2: Moderate Road Hazard (Draft)
```json
{
  "client_report_id": "b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e",
  "category": "Pothole",
  "priority": "Medium",
  "status": "Draft",
  "location": "Avenue 42 & 5th Boulevard Westbound",
  "description": "Asphalt depression approximately 40cm wide and 8cm deep in center lane.",
  "reported_at": "2026-11-12T09:15:00.000Z"
}
```

### Sample 3: High Priority Safety Hazard (Assigned)
```json
{
  "client_report_id": "c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e0f",
  "category": "Traffic Signal",
  "priority": "High",
  "status": "Assigned",
  "assigned_to": "Electrical Response Crew Alpha",
  "location": "Central Crossing Ring Road",
  "description": "Signal sequence stuck on flashing amber following early morning power surge.",
  "reported_at": "2026-11-12T07:45:00.000Z"
}
```

---

## Design Decisions & Assumptions

| Area | Decision Made | Rationale |
|---|---|---|
| **Client Primary Key vs Server ID** | Dual identification (`id` client string + `clientReportId` UUID + optional `serverId` UUID). | Field workers create reports with zero server contact. `clientReportId` is generated immediately at creation and remains permanent across all retries to guarantee backend idempotency. |
| **Optimistic Concurrency Control** | Integer `version` column checked on every `PATCH` or status transition. | Prevents coordinators from overwriting each other's status notes or field edits if editing the same ticket concurrently. |
| **Strict Transition Matrix** | `Draft → Submitted → Assigned → In Progress → Resolved`, with `Rejected` as terminal and explicit `reopen` for `Resolved → In Progress`. | Prevents reports from skipping steps (e.g., submitting directly to resolved) and creates a dependable audit trail for municipal work orders. |
| **Batch Synchronization Endpoint** | Dedicated `POST /api/sync/reports` handling up to 50 reports per request. | Mobile devices reconnecting after hours in the field may have dozens of queued reports; issuing individual HTTP requests creates connection exhaustion and high latency. |
| **Offline Storage Engine** | Dexie.js wrapping IndexedDB with schema migrations. | IndexedDB provides multi-megabyte structured storage unaffected by browser tab closures, unlike `localStorage`. |
| **Role Simulation** | Header-based development auth (`X-Dev-Role: coordinator` / `field_worker`) toggled via top navigation UI. | Allows complete evaluation of role-based workflows and permission restrictions without requiring third-party OAuth infrastructure during local testing. |

---

## Known Limitations & Edge Cases

1. **Binary Attachment Storage**: Image attachments are currently stored as Base64 strings or local preview URIs. In high-volume production, this should be transitioned to direct Supabase Storage S3 presigned URLs.
2. **True Peer-to-Peer Mesh**: The current architecture is "client-to-server offline-first". If two field workers meet in the field without internet, reports cannot sync peer-to-peer over Bluetooth or Wi-Fi Direct without an intermediary gateway.
3. **PWA Storage Quota Warnings**: While modern mobile browsers typically allocate several gigabytes for IndexedDB, aggressive device memory cleanup on low-end iOS devices can theoretically purge IndexedDB if storage pressure is reached. The app requests persistent storage (`navigator.storage.persist()`) where supported.
4. **WebSocket Real-time Updates**: Real-time push updates from Supabase are not active by default to minimize battery consumption on mobile clients; client reconciliation currently relies on interval polling and manual/event triggers.

---

## Manual QA Verification Checklist

Use this checklist to verify full offline and online functionality:

- [ ] **1. Online Report Creation**:
  - Open app with active connection.
  - Fill out and submit a new report.
  - Confirm report appears immediately with green **Synchronized** badge.
  - Verify record appears in Supabase `reports` table.
- [ ] **2. Offline Report Creation**:
  - In DevTools, set Network to **Offline** (or toggle "Simulate Offline" in app Settings).
  - Submit a new report.
  - Confirm confirmation modal appears and report shows amber **Pending Sync** badge.
  - Verify report is visible on Dashboard and All Reports.
- [ ] **3. Offline Persistence**:
  - Keep browser offline and refresh the page (`F5`).
  - Confirm previously created offline report remains intact in the table and details view.
- [ ] **4. Automatic Reconnection Sync**:
  - Switch Network back to **Online**.
  - Within seconds (or on next interval), observe sync indicator animating.
  - Confirm report badge transitions from **Pending** to **Synchronized**.
- [ ] **5. Idempotent Retry Safety**:
  - Navigate to **Pending Sync** page and click **Sync Now**.
  - Confirm backend returns duplicate acknowledgment without creating duplicate rows in Supabase.
- [ ] **6. Coordinator Status Triage**:
  - Switch active user role to **Coordinator** in the top bar.
  - Navigate to **Report Management**.
  - Assign an unassigned report to a technician and transition status to **In Progress**.
  - Verify transition is saved and logged in **Activity History**.
- [ ] **7. Version Conflict Handling**:
  - Simulate a conflict by altering the report version in server database or updating from another browser.
  - Submit an edit from client with outdated version.
  - Verify app displays **Conflict Detected** modal without losing local changes.

---

## Project Retrospective: Time Spent & Future Improvements

### Approximate Time Spent
- **Total Development & Integration Time**: ~8.5 hours
  - *Phase 1: Codebase inspection & schema gap analysis*: ~1.0 hour
  - *Phase 2: Centralized API client & TypeScript typing alignment*: ~1.5 hours
  - *Phase 3: Dexie.js schema upgrade & offline queue engine*: ~2.0 hours
  - *Phase 4: Conflict resolution & state machine alignment*: ~1.5 hours
  - *Phase 5: Automated test suite & Vercel deployment debugging*: ~2.5 hours

### What Would Be Improved With More Time
1. **Background Sync API (`ServiceWorkerRegistration.sync`)**: Implement the W3C Background Sync API so reports queue for background transmission even if the user completely closes the browser tab before reconnecting.
2. **Delta / Partial Field Synchronization**: Currently, record updates send the full snapshot; implementing JSON patch or delta updates would reduce cellular bandwidth consumption in low-bandwidth field scenarios.
3. **GeoJSON & Offline Tile Caching**: Add offline map tile caching via CacheStorage API so field workers can visualize location pins on satellite/road maps without internet access.
4. **End-to-End Playwright Tests**: Complement the existing 64 Jest/Supertest backend tests with full Playwright E2E tests simulating browser network toggles and IndexedDB transactions.

---

## AI & Development Tool Disclosure

In accordance with transparent engineering practices:
- **AI Coding Assistance**: Google Antigravity Agentic Assistant was utilized during this project for codebase cross-analysis, generating initial Jest integration test suites, diagnosing CORS wildcard and Vercel build-cache edge cases, and drafting technical architecture documentation.
- **Human Verification**: All code, architectural design decisions, state machine boundaries, IndexedDB schema versions, and security constraints were reviewed, executed, verified locally, and deployed to production.
- **Primary Tooling**: Node.js, Vite, TypeScript Compiler (`tsc`), Tailwind CSS, Jest, Supertest, Git, cURL, and Vercel CLI.
