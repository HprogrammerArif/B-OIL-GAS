# BOGCL OneOps — Production Platform: Overview & Architecture

> **Tech-stack change (3 Nov 2026):** the active build is a backend-free Flutter pitch app in `ftr-a/` (mock data, production look and feel). See `05_MOBILE_APP_SPECIFICATION_FLUTTER.md` and `AGENTS.md`. ADRs about Express/Prisma/React/Expo (ADR-02..04, 12..17, 19, 21) are reference only; module registry, roles, scopes and conventions remain binding.

**Document:** 00 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Audience:** Engineering (backend, web, mobile), DevOps, QA, Product
**Source of truth for:** system boundaries, technology decisions, shared conventions, module registry, cross-cutting engines. Every other document in `docs/platform/` must stay consistent with this one.

> The interactive prototype in `client/` (documented in `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`) is the **functional reference** and the client-facing demo; it is kept self-contained and evolves per `docs/PROTOTYPE_ENHANCEMENT_PLAN.md`. The production system is built as three new codebases — `server/`, `frontend/`, `app/` — that reproduce the prototype's 17 modules with real persistence, security and integrations.

---

## 1. Purpose and Scope

BOGCL OneOps is the internal operations platform for Bashundhara Oil & Gas Company Limited (~800 staff at launch; design for 5,000 group-wide). It replaces paper note-sheets, spreadsheets and phone follow-ups across 17 functional modules with one role-based web portal and one mobile app, backed by a single API.

**In scope (v1 production):** all 17 modules of the prototype (§7), identity & RBAC, workflow/approval engine, notifications (in-app, push, SMS, email), document storage, audit log, scheduler/reminders, reporting exports, bilingual UI (EN/BN), web + Android/iOS apps.
**Out of scope (v1):** SAP integration (adapter interface only), biometric hardware devices, GPS tracker telematics (adapter interface only), payroll computation, legally-certified digital signatures from a licensed CA (design allows adding later).

---

## 2. System Context

```
                 ┌────────────────────────────────────────────────────────────┐
                 │                      Users (BOGCL staff)                   │
                 │  Chairman · Plant GM · HR · Transport · HOD · Staff · Driver│
                 │  Gate/Security · Compliance · HSE · Finance · Super Admin   │
                 └───────────────┬──────────────────────────┬─────────────────┘
                                 │ HTTPS                     │ HTTPS / WSS
                      ┌──────────▼──────────┐    ┌──────────▼──────────┐
                      │ frontend/ (React SPA)│    │  app/  (Expo RN)    │
                      │  Desktop + tablet   │    │  Android / iOS      │
                      └──────────┬──────────┘    └──────────┬──────────┘
                                 │   REST /api/v1 + Socket.IO│
                      ┌──────────▼───────────────────────────▼──────────┐
                      │              server/  (Express 5 API)           │
                      │  Modules · Engines · Auth · RBAC · Jobs · WS    │
                      └───┬───────────┬───────────┬───────────┬─────────┘
                          │           │           │           │
                   ┌──────▼───┐ ┌─────▼────┐ ┌────▼─────┐ ┌───▼──────────────┐
                   │PostgreSQL│ │  Redis   │ │ MinIO/S3 │ │ External adapters│
                   │   16     │ │ 7 (cache,│ │ (files)  │ │ SMS · Email · Push│
                   │ (Prisma) │ │ queues,  │ │          │ │ SAP · GPS · AD   │
                   └──────────┘ │ pub/sub) │ └──────────┘ └──────────────────┘
                                └──────────┘
```

---

## 3. Repository Layout (monorepo, independent packages)

```
B-OIL-GAS/
├── client/            Interactive prototype / client demo (self-contained; no backend)
├── server/            Express 5 + TypeScript + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO
├── frontend/          React 19 + Vite + TypeScript + React Router 7 + Redux Toolkit + RTK Query
├── app/               Expo SDK 56 + Expo Router + Redux Toolkit + RTK Query (adapted from starter)
├── infra/             docker-compose, Dockerfiles, Traefik, CI workflow templates, deployment manifests
├── docs/
│   ├── 00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md   prototype reference
│   ├── platform/      THIS SUITE (00–10)
│   └── (pitch & planning documents 01–06)
├── .cursor/rules/     agent rules (always-on + path-scoped)
├── .cursor/skills/    agent skills (scaffolding workflows)
├── AGENTS.md          entry point for AI agents
└── .gitignore
```

**Decision — no npm workspaces.** `client/`, `frontend/`, `app/`, `server/` each keep their own `package.json` and lockfile. Reason: Expo/Metro hoisting problems and the prototype's independence. Shared contracts are achieved by **generating TypeScript types from the server's OpenAPI document** (`openapi-typescript`) into `frontend/src/shared/api/generated/` and `app/src/types/generated/`, not by a shared package.

---

## 4. Technology Decisions (ADR summary)

| # | Area | Decision | Rationale |
| :-- | :--- | :--- | :--- |
| ADR-01 | API style | REST, JSON, `/api/v1`, OpenAPI 3.1 generated from zod schemas | Simple, cacheable, client-agnostic, type generation for web/app |
| ADR-02 | Backend runtime | Node.js 22 LTS, Express 5, TypeScript (ESM), `tsx` dev, `tsc` build | Client requirement; Express 5 has native async error handling |
| ADR-03 | ORM / DB | Prisma 6 on PostgreSQL 16; migrations committed; `prisma migrate deploy` in CI/CD | Client requirement; type-safe queries; JSONB for workflow definitions |
| ADR-04 | Cache / queue / realtime fan-out | Redis 7: BullMQ queues, rate-limit counters, session/refresh-token store, Socket.IO adapter | One infra piece covers four needs |
| ADR-05 | Files | S3-compatible object storage (MinIO on-prem or cloud S3), presigned PUT/GET, private buckets | Data sovereignty (on-prem possible), no file bytes through the API |
| ADR-06 | Auth | Email/Emp-ID/phone + password (argon2id); JWT access token 15 min signed EdDSA (Ed25519) with `kid` rotation; rotating refresh token 30 days with family reuse-detection (httpOnly SameSite=Strict cookie on web, SecureStore on mobile); device sessions table; TOTP MFA for executive roles; OIDC (Azure AD) adapter later | Standard, revocable, works for SPA and native |
| ADR-07 | Authorisation | RBAC with scope: users ↔ roles (many), role ↔ permissions (`module:action`), permission grants carry a scope (`SELF/TEAM/DEPARTMENT/SITE/COMPANY`); delegation with date range; enforced in middleware + service-layer scope filters | Mirrors the prototype's role tailoring; permissions are data, not code |
| ADR-08 | Validation | zod at API boundary (body/query/params), shared schema → OpenAPI | Single schema for validation and docs |
| ADR-09 | Logging / observability | pino (JSON) with request-id, OpenTelemetry traces (optional), Sentry for errors, Prometheus `/metrics`, health `/healthz` `/readyz` | Production diagnosability |
| ADR-10 | Jobs | BullMQ workers in a separate process (`server/src/jobs`) for notifications, due-date reminders, escalations, exports | Isolation from request path; retries |
| ADR-11 | Realtime | Socket.IO (namespaces: `/notifications`, `/chat`, `/presence`), Redis adapter, JWT handshake | Chat, presence, live approvals |
| ADR-12 | Web framework | React 19, Vite 6, TypeScript strict, React Router 7 (data routers, lazy routes) | Client requirement |
| ADR-13 | Web state | Redux Toolkit + RTK Query (single `baseApi`, `injectEndpoints` per feature, tag invalidation); UI-only state in slices; no server data in slices | Client requirement; cache & invalidation built in |
| ADR-14 | Web UI | Tailwind CSS v4 + shadcn/ui (Radix primitives) themed with the prototype's tokens (`--brand-crimson #A51C30`, `--brand-slate-900 #0B132B`, `--brand-gold #D4AF37`, `--brand-canvas #F8FAFC`); lucide-react icons | Accessible primitives, design continuity with the demo |
| ADR-15 | Forms | react-hook-form + zod (same schemas pattern on web and mobile) | Consistency across clients |
| ADR-16 | i18n | i18next (react-i18next on web, i18next + expo-localization on mobile); namespaces per module; `en` and `bn` JSON; ICU plurals; `Intl` for numbers/dates in `Asia/Dhaka` | Replaces the prototype's inline `t(en, bn)` pairs |
| ADR-17 | Mobile framework | Expo SDK 56 with its bundled Expo Router, Redux Toolkit + RTK Query + redux-persist (AsyncStorage/MMKV for `auth` metadata, `ui`, `offlineQueue`; tokens **only** in `expo-secure-store`, which is limited to 2 KB per key on Android), react-hook-form + zod — adapted from the existing `app/` starter | Already present; aligns state model with web |
| ADR-18 | Mobile offline | Offline-first for attendance punch, incident report, parcel/guest scans: persisted mutation queue, replay on reconnect, server idempotency keys | Field sites have poor connectivity |
| ADR-19 | Testing | Server: Vitest + Supertest + Testcontainers (PG, Redis). Web: Vitest + React Testing Library + MSW; Playwright e2e. Mobile: Jest + jest-expo + RNTL; Maestro smoke flows | Industry standard per platform |
| ADR-20 | Quality gates | ESLint (flat) + Prettier + Husky + lint-staged + commitlint (Conventional Commits); CI must pass typecheck, lint, tests, build | Consistency |
| ADR-21 | Deployment | Docker images per service; docker-compose for dev/staging; production on-prem (Bashundhara DC) or BD Tier-III cloud via Docker Compose/Swarm initially, Kubernetes-ready | Hosting undecided; containers keep both options |
| ADR-22 | IDs | Internal primary keys `uuid` (v7, time-ordered); business reference numbers generated by a `Sequence` service (`BOGCL/{DEPT}/{YYYY}/{NNNN}`); never expose auto-increment ints in APIs (append-only internal tables such as `audit_logs`/`trip_locations` may use `bigserial` PKs behind opaque cursors) | Stable, non-enumerable, matches prototype conventions |
| ADR-23 | Time & money | Store `timestamptz` UTC; display `Asia/Dhaka`; money as `BIGINT` paisa (1 BDT = 100 paisa) or `NUMERIC(14,2)` — **decision: `NUMERIC(14,2)` BDT**; never floats | Accounting correctness |
| ADR-24 | Soft delete & audit | `deletedAt` soft delete on business records; immutable `AuditLog` written by a Prisma middleware/extension for all create/update/delete on audited models | Advisory requirement; compliance |
| ADR-25 | Document integrity | Final PDFs rendered server-side (Playwright/Chromium), real `SHA-256` stored and printed with a verification URL/QR; signatures stored as image + metadata + OTP evidence | Replaces the prototype's cosmetic hashes |

---

## 5. Shared Conventions (binding for all three codebases)

### 5.1 API
- Base path `/api/v1`. Resource nouns plural, kebab-case: `/api/v1/note-sheets/{id}/paragraphs`.
- Actions that are not CRUD are sub-resources with verbs in POST: `POST /workflow/instances/{id}/actions`, `POST /parcels/{id}/dispatch`, `POST /claims/{id}/submit`.
- Success envelope: `{ "data": ..., "meta": { ... } }`. List `meta`: `{ page, pageSize, total, sort }`.
- Error envelope: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...], "requestId": "..." } }`.
- Error codes (string, stable): `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `MFA_REQUIRED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INVALID_STATE_TRANSITION` 409, `POLICY_VIOLATION` 422, `PRECONDITION_FAILED` 412, `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_MEDIA_TYPE` 415, `RATE_LIMITED` 429, `UPSTREAM_UNAVAILABLE` 502, `INTERNAL` 500. Doc 03 §1 is the authoritative table.
- Pagination: `?page=1&pageSize=20` (max 100), sorting `?sort=-createdAt,title`, filtering by explicit query params documented per endpoint; full-text `?q=`.
- Idempotency: every POST that creates or transitions accepts `Idempotency-Key` (UUID); the first response is cached in Redis for 24 h keyed by `(userId, key)` and replayed on retry. No database table is used.
- Versioning: path version; breaking changes → `/api/v2`.
- All timestamps ISO 8601 UTC with `Z`. All money numbers as strings in JSON (`"48500000.00"`) to avoid float loss.
- Language: `Accept-Language: bn|en` selects server-generated text (notifications, PDFs).

### 5.2 Naming
- DB: tables `snake_case` plural via Prisma `@@map`; columns `snake_case` via `@map`; Prisma models `PascalCase`; enums `SCREAMING_SNAKE`.
- Code: files `kebab-case.ts`, React components `PascalCase.tsx`, hooks `useX.ts`, RTK Query APIs `<feature>.api.ts`, slices `<feature>.slice.ts`.
- Permissions: `<module>:<action>` e.g. `claims:approve`, `assets:write-off`, `notices:publish`.
- Reference numbers (Sequence engine, unique per prefix per year, zero-padded to 4 unless noted): note-sheets `BOGCL/{DEPT}/{YYYY}/{NNNN}`; notices `NOT`; briefings `BRF`; directives `BOGCL-DIR-{YYYY}-{NNNN}`; parcels `PKG`, returns `RTN`; asset tags `BOGCL-{SITE}-{CAT}-{NNN}` (not yearly), work orders `WO`, asset requisitions `ARQ`, transfers `TRF`, gate passes `GP`; incidents `INC`, CAPA `CAPA`; visits `VIS`; vehicle requisitions `REQ`, trip passes `PASS`, fuel vouchers `FUEL`, toll receipts `TOL`; leave `LV`, regularisations `REG`; claims `TADA` / `CNV` / `TOUR`, advances `ADV`, payment vouchers `VCH` (5 digits); exit clearances `EXIT`. Format `{PREFIX}-{YYYY}-{NNNN}` unless shown otherwise.

### 5.3 Roles (system roles; users may hold several)
`SUPER_ADMIN`, `CHAIRMAN`, `DIRECTOR`, `PLANT_GM`, `HOD`, `LINE_MANAGER`, `HR_ADMIN`, `FINANCE`, `TRANSPORT_ADMIN`, `COMPLIANCE_OFFICER`, `HSE_OFFICER`, `SECURITY_GATE`, `RECEPTION`, `MAILROOM`, `IT_ADMIN`, `DRIVER`, `EMPLOYEE`, `EXECUTIVE_ASSISTANT`.
Login identifier: email **or** employee code **or** phone (all unique); password required; MFA for executive/finance/admin roles (doc 07).
The prototype's 7 personas map to: chairman→`CHAIRMAN`, plant_gm→`PLANT_GM`, hr_admin→`HR_ADMIN`, transport_admin→`TRANSPORT_ADMIN`, hod→`HOD`+`FINANCE`, employee→`EMPLOYEE`, driver→`DRIVER`.

### 5.4 Scopes
`SELF` (own records), `TEAM` (direct reports), `DEPARTMENT`, `SITE`, `COMPANY`. Each permission grant has one scope. Services must apply the scope filter to every list/read query (`scopeWhere(user, permission)` helper).

### 5.5 Sites
`HQ_BARIDHARA`, `PLANT_KERANIGANJ`, `TERMINAL_CTG` seeded; sites are master data (table), not an enum.

### 5.6 Workflow states (generic engine, §6.1)
Every approvable object has `workflowInstanceId`. Instance status: `DRAFT → SUBMITTED → IN_REVIEW → APPROVED | REJECTED | RETURNED | WITHDRAWN | CANCELLED`. Step status: `PENDING → ACTIVE → COMPLETED | SKIPPED | ESCALATED`.

---

## 6. Cross-Cutting Engines (server)

### 6.1 Workflow & Approval Engine
- `WorkflowTemplate` (per module/object type, versioned, JSONB `definition`): ordered steps, each `{ key, approverRule: ROLE | LINE_MANAGER | DEPARTMENT_HEAD | USER | DYNAMIC(expr), parallel?: boolean, condition?: expr (e.g. amount > 500000), slaHours, escalateTo }`.
- `WorkflowInstance` per object; `WorkflowStep` rows materialised on submit; `WorkflowAction` audit (APPROVE / REJECT / RETURN / DELEGATE / ESCALATE / COMMENT / WITHDRAW).
- Delegation: `Delegation(fromUserId, toUserId, scope: ALL | module list, startsAt, endsAt)`; resolver substitutes approver at step activation and records it.
- Escalation: BullMQ delayed job per active step at `slaHours`; reminder at 50%; escalation at 100% to `escalateTo` or line manager.
- Unified inbox: `GET /workflow/inbox` (alias `GET /approvals/inbox`) = active steps where `approverUserId = me` (or delegated), joined with the instance `summary` via the `v_approval_inbox` view; decisions via `POST /workflow/instances/{id}/actions`.
- Modules using it: note-sheets, claims (3 types), vehicle requisitions, leave, asset requisitions, asset write-off, licence renewal steps, guest VIP approval, bus seat (admin confirmation), notice publication (optional), tour advance.

### 6.2 Due-Date & Reminder Engine
- `DueItem(ownerUserId, module, objectType, objectId, dueAt, reminderPlan: [90,60,30,15,7,1,0] days, status)`; nightly scan + per-item delayed jobs; produces notifications and optional auto-created tasks (e.g. licence renewal instance at T-90, calibration work order at T-30).
- Feeds: licences, asset calibration/warranty/AMC/insurance, vehicle fitness/tax/route permit, driver licence expiry, bus fitness, visitor pass expiry, parcel dwell-time (>24 h at a stage).

### 6.3 Notification Service
- `Notification(userId, type, title, body, data JSON, channels, readAt)`; templates per type in EN/BN with variables; channels: `IN_APP` (always), `PUSH` (Expo Push → FCM/APNs), `SMS` (BD gateway adapter: SSL Wireless / Banglalink / GP; interface + mock), `EMAIL` (SMTP). User preferences + quiet hours; `CRITICAL` priority bypasses quiet hours and requires acknowledgement.
- Delivery tracking `NotificationDelivery(channel, status, providerRef, error)`.
- Realtime fan-out via Socket.IO `/notifications` room `user:{id}`.

### 6.4 Document & File Service
- `FileObject(bucket, key, mime, size, sha256, uploadedBy, scanStatus)`; presigned upload flow: `POST /files/presign` → client PUT to MinIO → `POST /files/{id}/complete` (server verifies size/hash, runs ClamAV scan job).
- Attachments are polymorphic `Attachment(ownerType, ownerId, fileId, kind)`.
- PDF rendering service (Playwright) for note-sheet final documents, trip passes, gate passes, certificates; stores PDF as `FileObject` and records `documentHash` on the owner.

### 6.5 Audit Log
- `AuditLog(actorUserId, action, entityType, entityId, before JSONB, after JSONB, ip, userAgent, requestId, createdAt)` append-only (no UPDATE/DELETE grants for app role); written by Prisma client extension for audited models + explicit calls for domain actions (`APPROVED`, `SIGNED`, `OTP_VERIFIED`).
- Exposed read-only to `SUPER_ADMIN` and auditors: `GET /audit-logs?entityType=&entityId=`.

### 6.6 Sequence / Reference Number Service
- `Sequence(prefix, year, current)` with `SELECT … FOR UPDATE` in a transaction; API `nextRef('NOTE', 'PROC')`.

### 6.7 Geospatial Verification
- `Geofence(siteId, type CIRCLE|POLYGON, center, radiusMeters | polygon GeoJSON)`; server-side haversine (circle) or point-in-polygon; `AttendancePunch` stores lat/lng/accuracy/mockLocationFlag/deviceId; rejects accuracy > 50 m, mock flag, or outside fence unless `fieldDutyApproved`.

---

## 7. Module Registry (production)

| ID | Module | Server module dir | Web feature dir | Mobile | Workflow | Due-dates | Realtime |
| :-- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| MOD-01 | Notices & Broadcasts | `notices` | `notices` | ✔ | optional | — | ✔ |
| MOD-02 | Chairman Command Suite (dashboards, voice briefing, ROI) | `dashboards`, `briefings` | `dashboard` | ✔ (read) | — | — | ✔ |
| MOD-03 | Note-Sheets & E-Sign | `note-sheets` | `note-sheets` | ✔ (approve/sign) | ✔ | — | ✔ |
| MOD-04 | Parcel Chain-of-Custody | `parcels` | `parcels` | ✔ (scan, OTP) | — | ✔ dwell | ✔ |
| MOD-05 | Asset Lifecycle & EAM | `assets` | `assets` | ✔ (scan, custody ack) | ✔ (requisition, write-off) | ✔ | — |
| MOD-06 | Licence & Compliance | `compliance` | `compliance` | read | ✔ (renewal steps) | ✔ | — |
| MOD-07 | HSE Incidents & CAPA | `incidents` | `incidents` | ✔ (report) | ✔ (closure) | ✔ CAPA due | ✔ critical |
| MOD-08 | Guest & VIP Passes | `visitors` | `visitors` | ✔ (gate) | ✔ (VIP/Govt) | ✔ pass expiry | ✔ |
| MOD-09 | Fleet & Dispatch | `fleet` | `fleet` | ✔ (driver, request) | ✔ | ✔ docs | ✔ chat |
| MOD-10 | Attendance & Leave | `attendance`, `leave` | `attendance` | ✔ (punch) | ✔ leave/regularise | — | — |
| MOD-11/12/13 | Claims (TA/DA, Conveyance, Tour) | `claims` | `claims` | ✔ (submit) | ✔ | — | — |
| MOD-14 | Commuter Bus & FIFO | `bus` | `bus` | ✔ (my seat) | ✔ admin confirm | ✔ 48 h offer | ✔ |
| MOD-15 | Inner-Circle Chat | `chat` | `chat` | ✔ | — | — | ✔ |
| MOD-16 | Workforce & Exit Clearance | `employees` | `workforce` | read | ✔ clearance | — | — |
| MOD-17 | Approvals Center & Delegation | `workflow` | `approvals` | ✔ | core | — | ✔ |
| MOD-18 | Administration & Master Data | `admin` (users, roles, permissions, sites, departments, grades, policies, geofences, templates, settings) | `admin` | — | — | — | — |

Detailed functional specifications: `06_MODULE_FUNCTIONAL_SPECIFICATIONS.md`.

---

## 8. Environments

| Env | Purpose | Data | URL pattern |
| :-- | :--- | :--- | :--- |
| `local` | developer machine, docker-compose (PG 16 + PostGIS, Redis 7, MinIO, Mailpit, ClamAV optional) | seed | `http://localhost:5173` web, `:4000` api |
| `dev` | shared integration, auto-deploy from `main` (trunk-based) | seed + QA | `https://dev-oneops.bashundhara.com` |
| `staging` | UAT with client, mirrors prod config | anonymised copy | `https://staging-oneops.bashundhara.com` |
| `production` | live | real | `https://oneops.bashundhara.com` web, `https://api.oneops.bashundhara.com`, `https://files.oneops.bashundhara.com` — Traefik edge (TLS, routing); nginx only serves the SPA inside its container |

Configuration via environment variables only (12-factor); validated at boot with zod (`server/src/core/config.ts`); `.env.example` committed, `.env*` ignored.

---

## 9. Suite Index

| Doc | Title |
| :-- | :--- |
| 00 | Platform Overview & Architecture (this) |
| 01 | Backend Specification (Express + Prisma + Redis) |
| 02 | Database Schema (Prisma) |
| 03 | API Specification (REST, OpenAPI conventions, endpoints per module) |
| 04 | Web Frontend Specification (React + Router + RTK Query) |
| 05 | Mobile App Specification (Expo) |
| 06 | Module Functional Specifications (MOD-01…18) |
| 07 | Security, Compliance & Non-Functional Requirements |
| 08 | DevOps, Environments & CI/CD |
| 09 | Delivery Roadmap & Work Plan |
| 10 | Coding Standards & Engineering Conventions |
