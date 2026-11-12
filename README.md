# InfraSync — Offline Infrastructure Reporting & Maintenance Management System

An offline-first field reporting and infrastructure maintenance management system with local IndexedDB persistence, idempotent batch synchronization, optimistic concurrency control, and role-based coordinator workflows.

---

## Repository Structure

```
infrasync/
├── client/          # React + Vite + TypeScript PWA (Dexie.js offline storage)
├── server/          # Node.js + Express + TypeScript REST API (Supabase PostgreSQL)
├── package.json     # npm workspaces root
└── .gitignore
```

---

## Tech Stack

- **Frontend (`client/`)**: React 19, Vite, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), React Query, React Hook Form, Zod, `vite-plugin-pwa`
- **Backend (`server/`)**: Node.js, Express, TypeScript, `@supabase/supabase-js`, Zod, UUID, Helmet, CORS, Express Rate Limit
- **Database**: Supabase PostgreSQL (`reports`, `report_activity`, `sync_operations`)
- **Testing**: Jest + Supertest

---

## Getting Started

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Configure Backend Environment

```bash
cp server/.env.example server/.env
```

Fill in your Supabase credentials in `server/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

> **Security:** Never commit `server/.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

### 3. Run Locally

Start the backend API (`http://localhost:4000`):

```bash
cd server
npm run dev
```

Start the frontend client (`http://localhost:3000`) in a separate terminal:

```bash
cd client
npm run dev
```

---

## Backend API Endpoints

See [server/README.md](server/README.md) for full request/response documentation.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health and database connectivity check |
| `POST` | `/api/reports` | Create a report (idempotent by `client_report_id`) |
| `GET` | `/api/reports` | List reports with pagination, filters, and search |
| `GET` | `/api/reports/:id` | Get report details and activity history |
| `PATCH` | `/api/reports/:id` | Update editable report fields (optimistic `version` check) |
| `DELETE` | `/api/reports/:id` | Delete eligible `Draft` reports only |
| `PATCH` | `/api/reports/:id/status` | Transition report status (`Draft → Submitted → Assigned → In Progress → Resolved`, or `Rejected`) |
| `PATCH` | `/api/reports/:id/assign` | Assign a report (coordinator role) |
| `GET` | `/api/reports/:id/activity` | Chronological report activity log |
| `POST` | `/api/sync/reports` | Idempotent batch sync for offline-created reports |

### Development Role Simulation

Requests accept a development-only header:

```http
X-Dev-Role: field_worker   # default
X-Dev-Role: coordinator
```

---

## Running Tests

```bash
cd server
npm test
```
