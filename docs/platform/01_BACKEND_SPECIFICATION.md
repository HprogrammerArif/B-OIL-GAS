# 01 — Backend Specification (`server/`)

**Status:** Baseline v1.0 · **Stack:** Node.js 22 LTS · Express 5 · TypeScript (ESM, strict) · Prisma 6 · PostgreSQL 16 · Redis 7 · BullMQ · Socket.IO 4 · zod · pino
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (ADRs, conventions), `02_DATABASE_SCHEMA.md` (data model), `03_API_SPECIFICATION.md` (contract), `06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` (business rules), `07_SECURITY_COMPLIANCE_AND_NFR.md`.

---

## 1. Responsibilities

The server is the only system of record. It:

1. Serves the REST API (`/api/v1`) consumed by `frontend/` and `app/`.
2. Enforces authentication, RBAC with scopes, delegations, and every business rule in doc 06 — clients never enforce rules, only reflect them.
3. Runs the shared engines (doc 00 §6): Workflow & Approval, Due-Date/Scheduler, Notification, Document/File, Audit, Sequence, Geospatial.
4. Runs background workers (BullMQ) for notifications, reminders, PDF rendering, AV scanning, depreciation, attendance day roll-up, escalations.
5. Pushes realtime events over Socket.IO (`/notifications`, `/chat`, `/presence`).
6. Publishes its own OpenAPI 3.1 document, from which both clients generate types.

Non-goals: server-side rendering of UI, direct SAP writes in v1 (adapter interface only), storing files on local disk (object storage only).

---

## 2. Process Topology

```
                 ┌─────────────────────────────┐
  HTTPS/WSS ───▶ │ api  (Express + Socket.IO)  │  × N replicas, stateless
                 └──────────┬──────────────────┘
                            │ enqueue / publish
                 ┌──────────▼──────────────────┐
                 │ worker (BullMQ processors)  │  × M replicas
                 └──────────┬──────────────────┘
                            │
                 ┌──────────▼──────────────────┐
                 │ scheduler (BullMQ repeatable)│  × 1 (leader via Redis lock)
                 └─────────────────────────────┘
        PostgreSQL 16  ·  Redis 7  ·  MinIO/S3  ·  SMTP / SMS / Expo Push
```

One codebase, three entrypoints: `src/main.api.ts`, `src/main.worker.ts`, `src/main.scheduler.ts` (selected by `PROCESS_ROLE` env or npm script). Locally, `npm run dev` starts all three in one process (`PROCESS_ROLE=all`).

---

## 3. Project Structure

```
server/
├── prisma/
│   ├── schema.prisma               ← from doc 02
│   ├── migrations/
│   └── seed.ts  seed/ (per-domain seed files)
├── src/
│   ├── main.api.ts · main.worker.ts · main.scheduler.ts
│   ├── app.ts                      express app factory (no listen)
│   ├── core/                       cross-cutting, no business rules
│   │   ├── config.ts               zod-validated env → typed Config
│   │   ├── logger.ts               pino, redaction, child(requestId)
│   │   ├── errors.ts               AppError hierarchy + error handler
│   │   ├── http/                   middlewares: requestId, security, cors, rateLimit, bodyLimits,
│   │   │                           validate(zod), authenticate, authorize, idempotency, etag, asyncHandler
│   │   ├── prisma.ts               PrismaClient + extensions (softDelete, audit, pagination)
│   │   ├── redis.ts                ioredis clients (cache, pubsub, bullmq)
│   │   ├── queue/                  BullMQ queue registry, job names, defaults
│   │   ├── realtime/               Socket.IO server, auth, namespaces, emit helpers
│   │   ├── openapi/                registry, generator, swagger route
│   │   ├── i18n/                   server-side message catalog en/bn for notifications & PDFs
│   │   └── utils/                  money, dates (Asia/Dhaka), hashing, ids, pagination, canonical-json
│   ├── engines/                    shared platform engines (doc 00 §6)
│   │   ├── workflow/               templates, instance service, step resolution, escalation
│   │   ├── notifications/          service, channel adapters (in-app, push, sms, email), templates
│   │   ├── due-dates/              DueItem service, reminder scheduler
│   │   ├── files/                  presign, complete, scan, download, attachments
│   │   ├── audit/                  audit writer (Prisma extension + explicit API)
│   │   ├── sequence/               next('PKG') → PKG-2026-0001 (SELECT … FOR UPDATE)
│   │   ├── geo/                    haversine, point-in-polygon, geofence lookup
│   │   └── pdf/                    Playwright/Chromium HTML→PDF, templates, SHA-256, QR
│   ├── modules/                    one folder per business module (doc 00 §7)
│   │   ├── auth/ · users/ · employees/ · org/ (sites, departments, grades, designations)
│   │   ├── notices/ · briefings/ · dashboards/ · note-sheets/ · parcels/ · assets/
│   │   ├── compliance/ · incidents/ · visitors/ · fleet/ · attendance/ · leave/
│   │   ├── claims/ · bus/ · chat/ · workforce/ · workflow/ (inbox API) · admin/
│   │   └── search/
│   ├── integrations/               outbound adapters behind interfaces
│   │   ├── sms/  (interface + providers: ssl-wireless, banglalink, console)
│   │   ├── email/ (nodemailer SMTP, console)
│   │   ├── push/  (expo-server-sdk)
│   │   ├── storage/ (S3 client; MinIO locally)
│   │   ├── av/ (ClamAV TCP; noop)
│   │   └── sap/ (interface only; CSV import in v1)
│   ├── jobs/                       BullMQ processors grouped by queue
│   └── types/                      ambient types (Express Request augmentation)
├── test/                           integration helpers, factories, testcontainers setup
├── openapi.json                    generated artifact (committed, CI verifies freshness)
├── Dockerfile · .env.example · package.json · tsconfig.json · eslint.config.js · vitest.config.ts
```

### 3.1 Module anatomy (mandatory)

```
modules/parcels/
├── parcels.router.ts      Express Router: paths, middlewares (authenticate, authorize('parcels:create'), validate(schema))
├── parcels.controller.ts  maps req → service call → envelope; no logic
├── parcels.service.ts     business rules (doc 06), transactions, calls engines
├── parcels.repository.ts  Prisma queries only (select shapes, scope filters, pagination)
├── parcels.schemas.ts     zod request/response schemas; registered with OpenAPI registry
├── parcels.policies.ts    scope predicates (canView(user, parcel)), transition guards
├── parcels.events.ts      domain event names + payload types (ParcelDelivered …)
├── parcels.jobs.ts        processors specific to this module (otp expiry, dwell alerts)
├── parcels.mapper.ts      Prisma row → API DTO (Decimal→string, Date→ISO)
└── __tests__/             parcels.service.test.ts (unit), parcels.api.test.ts (supertest)
```

Rules: controllers never touch Prisma; services never read `req`; repositories never throw `AppError` (they return `null`/arrays); one transaction per use case, opened in the service.

---

## 4. Request Lifecycle

```
requestId → pino child → helmet/cors → rateLimit(bucket) → body parse (1 MB json, 25 MB multipart none — uploads go to S3)
→ authenticate (JWT → req.user {id, roles, permissions[scope], employee{id, departmentId, siteId, lineManagerId}, delegationsFor[]})
→ authorize(permission) (checks permission ∈ user.permissions; attaches req.scope)
→ idempotency (POST with Idempotency-Key → replay cached response if seen for this user within 24 h)
→ validate({params, query, body}) with zod → req.valid
→ controller → service (transaction) → mapper → envelope {data, meta}
→ ETag on GET single resources (hash of updatedAt+id); If-Match on PATCH → 412 PRECONDITION_FAILED
→ error handler: AppError → {error:{code,message,details,requestId}}; unknown → 500 INTERNAL + Sentry
```

**Express 5 note:** async route handlers propagate rejections automatically; still wrap with `asyncHandler` for explicit typing.

### 4.1 Auth context resolution (cached)

`authenticate` verifies the access JWT (EdDSA, `kid`), then loads the user's effective permission set from Redis key `authz:user:{id}:v{version}` (TTL 10 min). The key is invalidated on role grant/revoke, delegation change, or employee transfer by bumping `users.authz_version` (add this int column in the first migration) and emitting `authz:changed` on Redis pub/sub so all API replicas drop the cache.

Effective permissions = ⋃ RolePermission(scope) over the user's roles ∪ delegated permissions (restricted to `Delegation.modules` and `maxAmount`, flagged `viaDelegation: fromUserId`).

### 4.2 Scope enforcement

Every repository list/get accepts `ScopeFilter` built by `authorize`:

| Scope | Prisma filter injected |
| :-- | :--- |
| SELF | `ownerUserId = user.id` (or `employeeId = user.employee.id`) |
| TEAM | owner ∈ direct reports of user (`employees.line_manager_id = me`) ∪ self |
| DEPARTMENT | `departmentId ∈ user.managedDepartmentIds` (head or HOD role at dept) |
| SITE | `siteId ∈ user.siteIds` (from UserRole.siteId; null = all) |
| COMPANY | no filter |

Single-resource reads re-check with `policies.canView(user, row)`; failures return 404 (not 403) for SELF/TEAM scopes to avoid existence leaks, 403 otherwise.

---

## 5. Core Components

### 5.1 Configuration (`core/config.ts`)
zod schema; process exits with a readable list of missing/invalid vars. Groups: `app` (NODE_ENV, PORT, APP_BASE_URL, API_BASE_URL, CORS_ORIGINS[]), `db`, `redis`, `jwt` (private/public keys PEM or JWKS path, access TTL 900 s, refresh TTL 30 d), `s3`, `smtp`, `sms`, `push`, `security` (ENCRYPTION_KEY 32 bytes base64, ARGON2_*), `rate`, `sentry`, `features` (FEATURE_* flags). Full catalog in doc 08.

### 5.2 Logging (`core/logger.ts`)
pino JSON; levels per env; redaction paths: `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.otp`, `*.token`, `*.nid`, `*.idProofNo`. Every log line carries `requestId`, `userId` (if any), `module`. `pino-http` for access logs with `durationMs`, `statusCode`, `route` (matched pattern, not raw path).

### 5.3 Errors (`core/errors.ts`)

| Class | HTTP | code |
| :-- | :-- | :-- |
| `ValidationError(details[])` | 422 | VALIDATION_ERROR |
| `UnauthenticatedError` | 401 | UNAUTHENTICATED |
| `ForbiddenError` | 403 | FORBIDDEN |
| `NotFoundError(entity, id)` | 404 | NOT_FOUND |
| `ConflictError` | 409 | CONFLICT |
| `InvalidStateTransitionError(from, to)` | 409 | INVALID_STATE_TRANSITION |
| `PreconditionFailedError` | 412 | PRECONDITION_FAILED |
| `RateLimitedError(retryAfter)` | 429 | RATE_LIMITED |
| `PayloadTooLargeError` | 413 | PAYLOAD_TOO_LARGE |
| `DependencyError(service)` | 502 | UPSTREAM_UNAVAILABLE |
| anything else | 500 | INTERNAL |

`details` for validation: `[{path: "lines[2].amount", code: "too_small", message}]` (zod issues mapped). Messages are English; clients localise by `code`.

### 5.4 Prisma (`core/prisma.ts`)
Single `PrismaClient` with `$extends`:
- **softDelete** — models with `deletedAt` get `findMany/findFirst/count` filtered by `deletedAt: null` unless `{ includeDeleted: true }`; `delete` → `update deletedAt`.
- **audit** — `create/update/delete` on audited models write `AuditLog` inside the same transaction with `before/after` diffs (whitelisted fields; PII fields masked), actor from AsyncLocalStorage request context.
- **pagination** — `paginate(model, {page, pageSize ≤ 100, sort, where, select})` → `{items, meta:{page,pageSize,total}}`; `cursorPaginate` for feeds (chat, events).
Connection pool: `connection_limit = 10` per API replica, `5` per worker; statement timeout 15 s; `pgbouncer=true` when behind PgBouncer (transaction mode) — then no prepared statements and no advisory-lock-dependent code outside explicit transactions.

### 5.5 Redis (`core/redis.ts`)
Three ioredis connections: `cache` (authz cache, rate limits, idempotency, geofence cache), `pub`/`sub` (Socket.IO adapter + `authz:changed`), `bull` (BullMQ requires `maxRetriesPerRequest: null`). Key prefixes: `oneops:{env}:`. All cache entries have TTLs.

### 5.6 Queues (`core/queue/`)

| Queue | Jobs | Concurrency | Retry |
| :-- | :--- | :-- | :-- |
| `notifications` | `deliver.inApp`, `deliver.push`, `deliver.sms`, `deliver.email`, `digest.daily` | 20 | 5 × exp backoff 2 s, DLQ |
| `files` | `scan.av`, `thumbnail`, `pdf.render` | 4 | 3 |
| `workflow` | `step.activate`, `step.escalate`, `sla.check` | 10 | 3 |
| `reminders` | `dueItems.tick` (every 15 min), `licence.autoRenewal`, `asset.calibrationDue`, `vehicle.docExpiry` | 2 | 3 |
| `attendance` | `day.rollup` (nightly 00:30 Dhaka), `punch.verify` | 5 | 3 |
| `assets` | `depreciation.monthly` (1st 01:00), `health.recompute` | 1 | 3 |
| `bus` | `offer.expire` (delayed job per offer, 48 h), `waitlist.advance` | 5 | 3 |
| `parcels` | `otp.expire`, `dwell.alert` | 5 | 3 |
| `visitors` | `overdue.check` (every 5 min) | 2 | 3 |
| `maintenance` | `audit.anchor` (monthly hash), `retention.purge` (nightly) | 1 | 1 |

All jobs idempotent (keyed by `jobId` = deterministic string, e.g. `offer.expire:{offerId}`); processors load fresh state and no-op if already handled. Bull Board mounted at `/admin/queues` behind SUPER_ADMIN in non-prod.

### 5.7 Realtime (`core/realtime/`)
Socket.IO with `@socket.io/redis-adapter`. Handshake auth: `auth.token` (access JWT) → `socket.data.user`. Rooms: `user:{id}`, `role:{key}`, `site:{id}`, `dept:{id}`, `chat:{channelId}`, `trip:{id}`. Namespaces and events are catalogued in doc 03 §Realtime. Emit helpers: `emitToUser(id, event, payload)`, `emitToRoom`. Servers never trust client-emitted business events; clients emit only `chat:typing`, `presence:set`, `trip:location` (driver, validated and rate-limited 1/5 s).

### 5.8 OpenAPI (`core/openapi/`)
`@asteasolutions/zod-to-openapi` registry; each `*.schemas.ts` registers paths; `npm run openapi:gen` writes `openapi.json`; served at `GET /api/v1/openapi.json` and Swagger UI `/api/docs` (non-prod). CI fails if the committed file is stale.

### 5.9 Security middleware
helmet (CSP for `/api/docs` only), CORS allowlist with credentials, `express-rate-limit` + `rate-limit-redis` (matrix in doc 07), `hpp`, body limit 1 MB, cookie parser (signed), CSRF for cookie-auth routes: double-submit `X-CSRF-Token` checked on state-changing requests when auth came from cookie (mobile uses bearer → exempt).

---

## 6. Engines (implementation notes; rules in doc 06)

### 6.1 Workflow & Approval (`engines/workflow/`)
- `WorkflowTemplate.definition` JSON: `{ steps: [{ key, name, approverRule: ROLE|LINE_MANAGER|DEPARTMENT_HEAD|USER|DYNAMIC, approverRef, condition?: "amount > 500000", parallel?: boolean, slaHours, escalateTo?: {rule, ref}, requiresSignature?: boolean }] }`; conditions evaluated with a tiny safe expression evaluator over the instance `summary` (no `eval`).
- API: `start(objectType, objectId, templateKey, summary, initiator)` → creates instance DRAFT; `submit()` resolves step 1 approver, ACTIVE, `dueAt = now + slaHours`; `act(stepId, actor, decision, comment, signature?)` validates actor ∈ {approver, delegate}, applies decision: APPROVED → next step or instance APPROVED; REJECTED → instance REJECTED; RETURNED → instance RETURNED (initiator may edit & resubmit → new step set); `withdraw()` by initiator while not completed.
- Module integration via `WorkflowSubscriber` interface: `onInstanceStatusChanged(objectType, objectId, status)` — module service updates its own status column (e.g. `NoteSheet.status`, `Claim.status`) in the same transaction. Keeps module tables queryable without joins.
- Escalation: `sla.check` every 15 min → steps past `dueAt` get `ESCALATED`, notify `escalateTo`, and (configurable) reassign.
- Inbox query: `v_approval_inbox` view filtered by `approverUserId = me OR delegatedToId = me`.

### 6.2 Due-Date (`engines/due-dates/`)
`upsert(objectType, objectId, {title, ownerUserId, dueAt, reminderDays, autoAction})`; `dueItems.tick` finds items where `dueAt - now ∈ reminderDays` not yet sent → Notification; past due → OVERDUE + `autoAction` dispatch (e.g. `CREATE_LICENCE_RENEWAL` at lead time, `CREATE_CAL_WO`). Modules call `complete(objectType, objectId)` on resolution.

### 6.3 Notification (`engines/notifications/`)
`notify({type, recipients: userIds | {role, siteId?} | {dept}, priority, data, i18n: {key, params}})` → inserts `Notification` per user (title/body rendered per user's `preferredLang`), emits `notification:new` to `user:{id}`, enqueues channel deliveries per `NotificationPreference` and type policy (CRITICAL ignores quiet hours; SMS only for types in `SMS_TYPES` setting). Templates in `core/i18n/notifications.{en,bn}.json`. Push via Expo with receipts check job; invalid tokens pruned.

### 6.4 Files (`engines/files/`)
`POST /files/presign {fileName, mime, sizeBytes, purpose}` → validates MIME allowlist & size by purpose → creates `FileObject(scanStatus PENDING)` → returns presigned PUT (5 min, content-type & length conditions). `POST /files/:id/complete` → HEAD object, record `sha256` (computed by `scan.av` job streaming the object), enqueue scan. Attachments link files to owners; downloads via presigned GET (2 min) only if caller can view the owner object and `scanStatus = CLEAN`. Buckets: `uploads` (private), `documents` (private, object-lock for `SIGNED_PDF`), `public` (logos only).

### 6.5 Audit (`engines/audit/`)
Prisma extension (5.4) + explicit `audit.log(action, entity, {before, after, meta})` for non-CRUD events (LOGIN, LOGIN_FAILED, OTP_VERIFY, SIGN, EXPORT, PERMISSION_DENIED). `audit_logs` has `REVOKE UPDATE, DELETE` for the app role; monthly `audit.anchor` job writes SHA-256 of the month's rows into `Setting('audit.anchor.YYYY-MM')`.

### 6.6 Sequence (`engines/sequence/`)
`next(prefix)` in a short transaction: `INSERT … ON CONFLICT (prefix, year) DO UPDATE SET current = sequences.current + 1 RETURNING current` → formats `PREFIX-YYYY-NNNN` (width from settings; grows past 9999 naturally). Called inside the creating transaction so numbers are never skipped on success but may have gaps on rollback (acceptable; documented).

### 6.7 Geospatial (`engines/geo/`)
Geofences cached in Redis (`geo:site:{id}`); `check(siteId, lat, lng, accuracyM)` → `{inside, distanceM, geofenceId}` using haversine for CIRCLE and ray-casting for POLYGON (PostGIS `ST_DWithin`/`ST_Contains` available for reporting queries).

### 6.8 PDF (`engines/pdf/`)
HTML templates (Handlebars) rendered with headless Chromium (`playwright-core` + system Chromium in the worker image) → PDF → SHA-256 → upload to `documents` bucket (object-lock, retention per doc 07) → `FileObject` + `Attachment(kind: SIGNED_PDF)`; QR encodes `${APP_BASE_URL}/verify/${code}`. Used for note-sheets, gate passes, vehicle passes, visit badges, claim vouchers, incident reports.

---

## 7. Module Services — Key Server-Side Behaviours

Only server-specific points; full rules in doc 06, endpoints in doc 03.

| Module | Server behaviours |
| :-- | :--- |
| auth | argon2id verify; lockout counters in `user_credentials`; refresh rotation with family reuse detection (`UserSession`); MFA TOTP (`otplib`), secrets AES-GCM; password reset tokens hashed, 30 min; `/me` resolves employee + permissions |
| users/employees/org | CRUD with audit; employee transfer bumps `authz_version`; directory search via `pg_trgm` |
| notices | audience resolution to concrete user set at publish time (`NoticeReceipt` rows created lazily on first read for ALL audiences to avoid 5k inserts; counts via query); scheduled publish job; expiry job |
| briefings | audio upload via files engine; transcript optional; listen receipts |
| note-sheets | paragraph hash chain; signing requires OTP (SMS/email) or MFA step-up within 5 min; final PDF job; `verificationCode` public lookup |
| parcels | OTP generate (crypto random 6 digits, bcrypt, 10 min, 5 attempts, lock 30 min); event hash chain; dwell alert job when `AT_GATE` > 4 h |
| assets | lifecycle transitions with guards (LOTO blocks custody/transfer); depreciation job writes `DepreciationSnapshot`; `v_asset_financials` for live NBV; calibration due → DueItem + auto WO |
| compliance | renewal cycle auto-created at `leadTimeDays`; stage transitions; dashboard view |
| incidents | risk score computed server-side; statutory due computed from type; anonymous reports strip reporter; CAPA overdue job |
| visitors | QR token (random 32 bytes, single-use), watchlist/blacklist check on approval, overdue job, muster export |
| fleet | assignment guards (driver status/licence/class/duty hours, vehicle status/docs); pooling suggestion (same window ±30 min & destination similarity); trip location ingestion (socket `trip:location` or batched `POST /trips/:id/locations`, rate-limited; buffered in a Redis stream and bulk-inserted into `trip_locations` every 15 s by the worker; latest position cached in `trip:{id}:pos` for the live map; checkpoints still create `trip_events`); SOS → CRITICAL notification to TRANSPORT_ADMIN + SECURITY |
| attendance | punch verification synchronous (geo check) → result; `day.rollup` computes `AttendanceDay` using shift + grace + approved leave + holidays; regularisation via workflow |
| leave | balance check in transaction (`SELECT … FOR UPDATE` on `leave_balances`); overlapping request rejection |
| claims | policy engine computes `policyAmount` and `policyFlags` on every save; submit requires receipts above threshold; advance netting; settlement marks SETTLED and voucher no |
| bus | seat allocation and waitlist advance are serialised per route with `pg_advisory_xact_lock(hashtext(routeId))`; `offer.expire` delayed jobs |
| chat | message fan-out through Socket.IO rooms; persistence first, then emit; read receipts batched; retention purge |
| workforce | exit clearance creates items for configured owners; completion gates `Employee.status = OFFBOARDED`, revokes sessions, releases custody/seat |
| admin | role/permission management with 4-eyes (second SUPER_ADMIN approval for granting SUPER_ADMIN/CHAIRMAN); settings with schema per key; template editor validation |
| search | unified `GET /search?q=` across employees, assets, note-sheets, parcels, visits (scope-filtered), trigram ranked |

---

## 8. Integrations (adapters)

All outbound integrations implement an interface and have a `console`/`noop` provider for local and tests.

| Interface | Methods | v1 provider |
| :-- | :--- | :--- |
| `SmsProvider` | `send(to, text, {ref})`, `status(ref)` | SSL Wireless / Banglalink HTTP API (config-selected) |
| `EmailProvider` | `send({to, subject, html, text, attachments})` | SMTP via nodemailer (Mailpit locally) |
| `PushProvider` | `send(tokens[], message)`, `receipts(ids)` | `expo-server-sdk` |
| `StorageProvider` | `presignPut/Get`, `head`, `stream`, `setRetention` | AWS SDK v3 S3 client (MinIO locally) |
| `AvScanner` | `scan(stream)` | ClamAV clamd TCP; `noop` in dev |
| `SapAdapter` | `importEmployees(csv)`, `exportVouchers()` | CSV files v1; RFC/OData later |
| `GpsProvider` (optional) | `lastPosition(deviceId)` | vendor HTTP; otherwise driver app positions |

Timeouts 5 s, retries 2 with jitter, circuit breaker (`opossum`) per provider; failures logged and surfaced as `DependencyError` only where user-facing (e.g. OTP SMS send).

---

## 9. Health, Lifecycle, Operations

- `GET /healthz` (process up) · `GET /readyz` (PG `SELECT 1`, Redis `PING`, S3 `HEAD bucket`) · `GET /metrics` (Prometheus via `prom-client`: http duration histogram by route/status, queue depth, socket connections, PG pool, job durations).
- Graceful shutdown on SIGTERM: stop accepting, drain sockets (notify clients `server:restarting`), wait ≤ 25 s for in-flight requests and jobs, close Prisma/Redis.
- Startup order: config → logger → Prisma connect → Redis → migrations check (`prisma migrate status` fails fast if pending in prod) → queues → HTTP listen → ready.
- Clock: all timestamps UTC; business-day math via `date-fns-tz` with `Asia/Dhaka`.

---

## 10. Testing

| Layer | Tool | Scope | Target |
| :-- | :-- | :--- | :-- |
| Unit | Vitest | services, engines, policies, utils; Prisma via repository mocks | fast, no I/O |
| Integration | Vitest + Supertest + Testcontainers (PG 16 + Redis 7) | each router end-to-end with real DB, seeded factories; auth via test tokens | every endpoint has ≥ 1 happy + 1 authz + 1 validation test |
| Contract | `openapi.json` validated with `@redocly/cli lint`; responses validated against schema in integration tests (`express-openapi-validator` in test mode) | contract drift | CI gate |
| Load | k6 scripts under `test/load/` | login, inbox, punch, parcel OTP, chat | doc 07 NFRs |
| Coverage | `@vitest/coverage-v8` | lines/branches | ≥ 80 % (engines & auth ≥ 90 %) |

Test DB per worker (`DATABASE_URL` with schema suffix); migrations applied once per run; transactions rolled back per test where possible.

---

## 11. Dependencies (initial `package.json`)

Runtime: `express@5`, `@prisma/client@6`, `prisma@6` (dev), `zod`, `@asteasolutions/zod-to-openapi`, `ioredis`, `bullmq`, `socket.io`, `@socket.io/redis-adapter`, `pino`, `pino-http`, `argon2`, `jose` (JWT EdDSA), `otplib`, `qrcode`, `bcryptjs` (OTP hashes), `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `rate-limit-redis`, `hpp`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `nodemailer`, `expo-server-sdk`, `handlebars`, `playwright-core`, `date-fns`, `date-fns-tz`, `decimal.js`, `opossum`, `prom-client`, `@sentry/node`, `uuid`, `file-type`, `clamdjs`.
Dev: `typescript`, `tsx`, `vitest`, `@vitest/coverage-v8`, `supertest`, `@testcontainers/postgresql`, `@testcontainers/redis`, `eslint` (+ `typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-security`, `eslint-plugin-unicorn`), `prettier`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `@redocly/cli`, `k6` (binary), `@types/*`.

Each addition beyond this list requires a one-line justification in the PR (project rule).

### Scripts
```
dev            tsx watch src/main.api.ts  (PROCESS_ROLE=all)
build          tsc -p tsconfig.build.json
start:api|worker|scheduler
prisma:generate | prisma:migrate (dev) | prisma:deploy | prisma:seed | prisma:studio
openapi:gen    tsx scripts/generate-openapi.ts
test | test:int | test:cov | lint | typecheck | format
```

---

## 12. Performance Guidelines

- Keyset pagination for feeds; offset pagination capped at `pageSize ≤ 100` and `page × pageSize ≤ 10 000`.
- Explicit `select` everywhere; `include` only for 1:1 or small 1:N; batch with `in` queries, never per-row lookups.
- Cache read-mostly data in Redis with explicit invalidation: settings (∞, bust on write), geofences, role/permission maps, bus route layouts, expense policies (1 h).
- Heavy work (PDF, AV, roll-ups, exports) always in workers; API handlers must finish < 300 ms p95.
- Exports (CSV/XLSX) generated by job → file → notification with download link; no streaming large result sets through API replicas.
- Socket emissions coalesced (e.g. trip positions every 5 s per trip room).
- Indexes per doc 02 §4; `EXPLAIN ANALYZE` required in PR for new list queries over large tables.

---

## 13. Open Items

| # | Item | Owner | Target |
| :-- | :--- | :--- | :--- |
| 1 | Choose SMS provider & contract (SSL Wireless vs Banglalink) | PO | Phase 0 |
| 2 | Confirm corporate SSO (Azure AD) availability for OIDC adapter | IT | Phase 2 |
| 3 | SAP integration scope (employee master import only vs vouchers) | Finance/IT | Phase 3 |
| 4 | GPS vendor API for vehicles (or driver-app only) | Transport | Phase 3 |
| 5 | On-prem vs cloud hosting decision (affects S3 vs MinIO, KMS) | IT | Phase 0 |
