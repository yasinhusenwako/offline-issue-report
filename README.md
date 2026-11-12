# Offline Infrastructure Reporting and Maintenance Management System

A full-stack web application for reporting infrastructure problems, managing maintenance requests, and coordinating field operations — with offline-first reporting and automatic synchronization when internet connectivity is restored.

## 1. Project Overview

The Offline Infrastructure Reporting and Maintenance Management System enables field workers to report infrastructure problems even when internet connectivity is unavailable.

Reports are stored locally on the user's device and automatically synchronized with the central database when a network connection becomes available.

Coordinators can review submitted reports, assign maintenance personnel, monitor progress, and maintain a history of infrastructure-related activities.

### Key Features

- **Offline Reporting:** Create and save reports without an internet connection.
- **Automatic Synchronization:** Synchronize locally stored reports when connectivity returns.
- **Report Management:** Create, view, update, assign, and manage reports.
- **Priority Assessment:** Classify reports as Low, Medium, High, or Critical.
- **Infrastructure Categories:** Water Point, Equipment Damage, Service Interruption, Safety Concern, Maintenance Requirement, and Other.
- **Report Tracking:** Monitor report progress through defined workflow statuses.
- **Synchronization Monitoring:** Track Pending, Synchronized, Failed, and Conflict states.
- **Activity History:** Maintain a record of report creation, updates, assignments, and status changes.
- **Dashboard:** View report statistics and operational information.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Programming Language | TypeScript / JavaScript |
| Styling | Tailwind CSS |
| Backend | Node.js and Express.js |
| Database | Supabase PostgreSQL |
| Offline Storage | IndexedDB (Dexie.js, if implemented) |
| API Communication | REST API |
| Data Validation | Zod (if implemented) |
| Version Control | Git and GitHub |

## 3. System Architecture

The system follows a client-server architecture with an offline-first data management strategy.

```text
                 FIELD WORKER
                      |
                      v
             React Web Application
                      |
             +--------+--------+
             |                 |
             v                 v
       Online Mode         Offline Mode
             |                 |
             v                 v
       Express API         IndexedDB
             |                 |
             |           Pending Reports
             |                 |
             |          Network Restored
             |                 |
             +--------+--------+
                      |
                      v
               Express Backend
                      |
                      v
              Supabase Database
                      |
             +--------+--------+
             |                 |
             v                 v
       Reports Table     Activity History
             |
             v
       Coordinator Dashboard
```

### Main Components

**Frontend**

- Provides the reporting form and dashboard.
- Validates user input.
- Stores reports locally when offline.
- Displays synchronization status.
- Communicates with the backend API when online.

**Offline Storage**

- Stores reports in the browser's IndexedDB database.
- Maintains locally created reports until synchronization succeeds.
- Tracks synchronization state and retry information.
- Preserves local records across page refreshes and browser restarts, subject to browser storage availability.

**Backend**

- Provides REST API endpoints.
- Validates incoming report data.
- Processes report creation and updates.
- Handles synchronization requests.
- Enforces report workflow and coordinator permissions.

**Database**

Supabase PostgreSQL provides centralized storage for:

- `reports`: Main infrastructure reports.
- `report_activity`: Report activity and audit history.
- `sync_operations`: Synchronization operation tracking.

## 4. Report Workflow

Reports follow the following lifecycle:

```text
Draft
  |
  v
Submitted
  |
  v
Assigned
  |
  v
In Progress
  |
  v
Resolved
```

A report may also be rejected during the applicable review stages.

### Synchronization States

| State | Description |
|---|---|
| Pending | Report is waiting to synchronize. |
| Processing | Synchronization is currently underway. |
| Synchronized | Report has been successfully stored on the server. |
| Failed | Synchronization failed and may be retried. |
| Conflict | A synchronization conflict requires resolution. |

Report workflow status and synchronization status are separate concepts. For example, a report can be `Submitted` while its synchronization state is `Pending`.

## 5. Project Structure

The recommended project structure is:

```text
infrastructure-reporting-system/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── database/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── server.ts
│   ├── package.json
│   └── .env
│
├── database/
│   └── schema.sql
│
├── README.md
└── .gitignore
```

*The structure above is a recommended organization. Update it to match the actual repository.*

## 6. Installation and Setup

### Prerequisites

Install the following software:

- Node.js (LTS version recommended).
- npm.
- Git.
- Visual Studio Code or another code editor.
- A Supabase account and project.

Verify the installations:

```bash
node --version
npm --version
git --version
```

### Step 1: Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
cd infrastructure-reporting-system
```

### Step 2: Configure the Supabase Database

1. Create a new project in Supabase.
2. Open the SQL Editor.
3. Execute the database schema from `database/schema.sql`.
4. Verify that the following tables exist:

```text
reports
report_activity
sync_operations
```

5. Obtain the project URL and service-role key from your Supabase project settings.

**Security:** The Supabase service-role key must only be used by the backend. Never expose it in frontend environment variables or commit it to GitHub.

### Step 3: Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

FRONTEND_URL=http://localhost:5173
```

Replace the placeholder values with your actual configuration.

Start the backend:

```bash
npm run dev
```

The backend should be available at:

```text
http://localhost:5000
```

### Step 4: Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

**Note:** The commands above assume your `package.json` files contain the corresponding scripts. Adjust them if your implementation uses different script names.

## 7. Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port. |
| `NODE_ENV` | Application environment. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Private backend database key. |
| `FRONTEND_URL` | Frontend origin for CORS configuration. |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL. |

Do not commit `.env` files or credentials to version control.

## 8. Running Automated Tests

Automated tests should verify the reliability of report creation, validation, synchronization, and report management.

### Install Test Dependencies

Install the testing libraries appropriate to your project.

For a Vite frontend using Vitest:

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

For a Node.js backend, use your chosen testing framework, such as Vitest or Jest, with Supertest for API testing.

### Run Frontend Tests

```bash
cd frontend
npm run test
```

Run tests in watch mode if supported:

```bash
npm run test -- --watch
```

### Run Backend Tests

```bash
cd backend
npm run test
```

### Recommended Test Coverage

| Test Area | Expected Result |
|---|---|
| Report form validation | Invalid reports are rejected. |
| Report creation | Valid reports are saved successfully. |
| Offline storage | Reports remain available after refreshing the page. |
| Synchronization | Pending reports synchronize when connectivity returns. |
| Duplicate prevention | Retried submissions do not create duplicate reports. |
| Failed synchronization | Failed reports remain available for retry. |
| Report assignment | Coordinators can assign submitted reports. |
| Status updates | Only permitted workflow transitions succeed. |
| Activity history | Report changes are recorded. |
| API validation | Invalid requests return appropriate errors. |

*Only report tests as passing when they have actually been implemented and executed.*

## 9. Seed and Demonstration Data

The following SQL inserts five demonstration reports into the Supabase database.

```sql
INSERT INTO public.reports (
    client_report_id,
    category,
    description,
    location,
    priority,
    status,
    reported_at
)
VALUES
(
    gen_random_uuid(),
    'Water Point',
    'Community water pump has stopped supplying water. Mechanical or electrical inspection is required.',
    'Deder Community Water Supply Station',
    'High',
    'Submitted',
    NOW() - INTERVAL '5 days'
),
(
    gen_random_uuid(),
    'Equipment Damage',
    'Electrical control panel has visible damage and requires technical inspection.',
    'District Infrastructure Office',
    'Critical',
    'Submitted',
    NOW() - INTERVAL '4 days'
),
(
    gen_random_uuid(),
    'Service Interruption',
    'Blocked drainage has caused water accumulation and disrupted access along the community road.',
    'Deder Main Market Road',
    'High',
    'Submitted',
    NOW() - INTERVAL '3 days'
),
(
    gen_random_uuid(),
    'Safety Concern',
    'Exposed electrical wiring has been identified near the entrance of a public community facility.',
    'Public Community Hall',
    'Critical',
    'Submitted',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'Maintenance Requirement',
    'Roof leakage has been observed in an administrative building and requires maintenance.',
    'District Administrative Building',
    'Medium',
    'Submitted',
    NOW() - INTERVAL '1 day'
);
```

### Verify Demonstration Data

```sql
SELECT
    id,
    category,
    description,
    location,
    priority,
    status,
    reported_at
FROM public.reports
ORDER BY reported_at DESC;
```

These records are fictional demonstration data and should not be treated as verified infrastructure incidents.

## 10. Offline Synchronization Strategy

The application uses an offline-first strategy to support field workers operating in areas with unreliable internet connectivity.

### Report Creation

1. A field worker completes the reporting form.
2. The frontend validates the entered information.
3. A unique `client_report_id` is generated.
4. The report is saved to IndexedDB.
5. Its synchronization state is set to `Pending`.

### Automatic Synchronization

When network connectivity becomes available:

1. The frontend identifies pending reports.
2. It sends them to the backend API.
3. The backend validates the report.
4. The backend checks the idempotency key or client report identifier.
5. The report is inserted or safely reconciled with an existing record.
6. The backend records the synchronization operation.
7. The frontend marks the local report as `Synchronized` only after receiving successful server confirmation.

### Duplicate Prevention

Each locally created report receives a unique `client_report_id`.

The database enforces uniqueness on this identifier.

The backend uses this identifier and an idempotency strategy to prevent duplicate records when a request is retried after an interrupted connection.

### Failed Synchronization

If synchronization fails:

- The local report remains stored.
- Its synchronization state remains `Failed` or returns to `Pending`, depending on the implementation.
- The error can be displayed to the user.
- The report can be retried when connectivity is available.

### Conflict Handling

If a local report conflicts with a server-side update, the application should detect the conflict rather than silently overwrite server data.

A conflict-resolution strategy should determine which changes are retained.

### Data Preservation Principle

Local data must not be deleted simply because a synchronization request was sent.

It should only be marked as synchronized after the backend confirms successful persistence.

## 11. Assumptions and Design Decisions

The following assumptions guide the current design:

1. Field workers may experience intermittent or unavailable internet connectivity.
2. Reports must remain available locally until successful synchronization.
3. A report can be created before the backend is reachable.
4. Coordinators are responsible for reviewing, assigning, and managing reports.
5. The application uses a predefined set of infrastructure categories and priority levels.
6. Report workflow status and synchronization status are managed separately.
7. PostgreSQL provides centralized persistent storage.
8. IndexedDB provides browser-based offline persistence.
9. The backend is responsible for validating requests and enforcing workflow permissions.
10. Demonstration data is fictional and intended for development and testing.

### Important Design Decisions

**Why IndexedDB?**

IndexedDB supports structured browser storage and is more appropriate than localStorage for managing multiple offline reports and their synchronization metadata.

**Why Supabase PostgreSQL?**

It provides a relational database, constraints, indexing, and centralized storage for reports and activity history.

**Why a Unique Client Report ID?**

A client-generated identifier allows the backend to recognize a report across retries and reduce duplicate submissions.

**Why Keep Activity History?**

Infrastructure reports may involve multiple people and status changes. An activity history improves traceability and accountability.

**Why Separate Synchronization and Workflow Status?**

A report can be submitted locally while still waiting for server synchronization. Combining these statuses would make the system harder to manage accurately.

## 12. Known Limitations

The following limitations should be reviewed against the final implementation:

- Browser-based offline storage depends on available device storage and browser behavior.
- Clearing browser data may remove locally stored reports that have not synchronized.
- The application may require an initial online visit to load its frontend assets unless service-worker caching is configured.
- GPS availability depends on device hardware, browser permissions, and location services.
- Conflict resolution may require additional development for simultaneous updates from multiple users.
- Authentication and production-grade role management may be limited if simulated roles are used.
- Synchronization reliability depends on backend availability and network conditions.
- Real-time notifications may not be implemented.
- The system may not yet support image attachments, document uploads, or advanced reporting analytics.

## 13. Manual Quality Assurance Checklist

Use this checklist to verify the application before submission or demonstration.

### Application Setup

- [ ] Frontend starts successfully.
- [ ] Backend starts successfully.
- [ ] Supabase database connection works.
- [ ] Dashboard loads without errors.
- [ ] Environment variables are configured correctly.

### Report Creation

- [ ] A user can create a report.
- [ ] Required fields are validated.
- [ ] All infrastructure categories are available.
- [ ] All priority levels are available.
- [ ] Observation date and time are saved correctly.
- [ ] Valid reports can be submitted.

### Offline Functionality

- [ ] Open the application while connected to the internet.
- [ ] Disconnect the network.
- [ ] Create a new infrastructure report.
- [ ] Confirm that the report is saved locally.
- [ ] Refresh the page while still offline.
- [ ] Confirm that the report is still available.
- [ ] Confirm that its synchronization state is Pending.

### Synchronization

- [ ] Restore internet connectivity.
- [ ] Confirm that pending reports are detected.
- [ ] Confirm that reports are sent to the backend.
- [ ] Confirm that successful reports are marked Synchronized.
- [ ] Confirm that failed reports remain available for retry.
- [ ] Retry a previously failed request.
- [ ] Confirm that retries do not create duplicate server records.
- [ ] Confirm that conflicts are handled without silently losing data.

### Coordinator Operations

- [ ] View submitted reports.
- [ ] Assign a report to a maintenance coordinator.
- [ ] Change a report's status.
- [ ] Reject a report with a reason.
- [ ] Resolve a report.
- [ ] View report activity history.

### Data Integrity and Security

- [ ] Verify that reports are correctly stored in PostgreSQL.
- [ ] Verify that required fields cannot be empty.
- [ ] Verify that invalid status transitions are rejected.
- [ ] Verify that the frontend does not expose the Supabase service-role key.
- [ ] Verify that users cannot perform unauthorized coordinator operations.

## 14. Approximate Development Time

Record the actual time spent by the development team. The following is an illustrative estimate, not a verified project time log.

| Development Activity | Estimated Time |
|---|---:|
| Requirements analysis and planning | 2 hours |
| Database design and implementation | 1.5 hours |
| Frontend development | 1.5 hours |
| Backend API development | 2 hours |
| Offline storage and synchronization | 2 hours |
| Integration and debugging | 1 hours |
| Testing and documentation | 1 hours |
| **Estimated Total** | **46–70 hours** |

Actual time may vary depending on team size, implementation complexity, and debugging requirements.

## 15. Future Improvements

With additional development time, the following improvements could be implemented:

1. **Authentication and Authorization:** Integrate Supabase Auth with dedicated field-worker, coordinator, and administrator roles.
2. **Advanced Conflict Resolution:** Add version-based conflict detection and a user-assisted resolution interface.
3. **GPS Integration:** Capture and display accurate report coordinates on an interactive map.
4. **Image Attachments:** Allow field workers to attach photos of damaged infrastructure.
5. **Push Notifications:** Notify coordinators when new reports arrive and workers when assignments change.
6. **Advanced Analytics:** Add dashboards for infrastructure categories, geographical distribution, maintenance performance, and response times.
7. **Progressive Web App Improvements:** Add reliable service-worker caching and installability.
8. **Automated Integration Tests:** Expand API, database, and end-to-end test coverage.
9. **Deployment:** Deploy the frontend and backend with production-ready configuration, monitoring, and backups.
10. **Accessibility and Localization:** Improve accessibility and support English, Amharic, and Afaan Oromo.

## 16. AI and Development-Tool Disclosure

AI-assisted tools were used as development support during project planning and documentation.

### AI Assistance

ChatGPT was used to assist with:

- Requirements clarification and project planning.
- Database schema design and SQL query examples.
- Architecture and synchronization-strategy discussions.
- Documentation structure and README preparation.
- Technical explanations and debugging guidance.


### Development Tools

| Tool | Purpose |
|---|---|
| Visual Studio Code and AntiGravity | Source-code editing and development. |
| Git and GitHub | Version control and repository management. |
| Supabase | PostgreSQL database and backend infrastructure. |
| Postman or equivalent | API testing, if used. |
| Browser Developer Tools | Debugging and network inspection. |

AI-generated suggestions and code were intended as development assistance. The development team remains responsible for reviewing, adapting, testing, and validating all implementation details.

## 17. Conclusion

The Offline Infrastructure Reporting and Maintenance Management System aims to improve infrastructure issue reporting and maintenance coordination, especially in environments with unreliable internet connectivity.

By combining local browser storage, automatic synchronization, centralized PostgreSQL storage, and report workflow management, the system provides a foundation for reliable field reporting and coordinated maintenance operations.

The project can be extended into a more comprehensive infrastructure management platform through authentication, GPS-based reporting, image attachments, analytics, notifications, and improved synchronization conflict resolution.

---

**Project Status:** Update this section to reflect the actual implementation status.

**Repository:** (https://github.com/yasinhusenwako/offline-issue-report)

**Developed By:** Yasin Husen