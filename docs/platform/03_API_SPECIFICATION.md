# 03 — API Specification (REST `/api/v1`, OpenAPI 3.1)

**Document:** 03 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (ADR-01, ADR-06..08, §5 conventions, §6 engines, §7 registry) and `02_DATABASE_SCHEMA.md` (model, enum and field names are used here verbatim).
**Functional reference:** the frozen prototype in `client/` as described in `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`. Every screen action in the prototype maps to an endpoint below. Where the prototype's behaviour is a demo simulation (fake hashes, always-accepted OTP, immediate FIFO promotion, unchecked passwords), this document specifies the production behaviour and marks the difference with **Prototype note**.

---

## 0. Table of Contents

1. Conventions (envelope, errors, pagination, headers, concurrency)
2. Authentication & sessions
3. `/me`
4. Platform & shared services (files, notifications, due-items, audit, settings, workflow, search)
5. Master data (sites, departments, grades, designations, roles, permissions, users, delegations)
6. Realtime (Socket.IO)
7. MOD-01 Notices & Broadcasts
8. MOD-02 Dashboards & Voice Briefings
9. MOD-03 Note-Sheets & E-Sign
10. MOD-04 Parcels
11. MOD-05 Assets & EAM
12. MOD-06 Licence & Compliance
13. MOD-07 HSE Incidents & CAPA
14. MOD-08 Visitors & VIP Passes
15. MOD-09 Fleet & Dispatch
16. MOD-10 Attendance & Leave
17. MOD-11/12/13 Claims
18. MOD-14 Commuter Bus & FIFO
19. MOD-15 Inner-Circle Chat
20. MOD-16 Workforce & Exit Clearance
21. MOD-17 Approvals Center (workflow inbox)
22. MOD-18 Administration
23. Webhooks & outbound integrations
24. Appendix A — Permission keys
25. Appendix B — OpenAPI generation

---

## 1. Conventions

Restates and extends doc 00 §5.1. Where this section adds a rule not in doc 00, it is marked **(extension)**.

### 1.1 Base URL and versioning

| Item | Value |
| :--- | :--- |
| Base URL | `https://oneops.bashundhara.com/api/v1` (per environment, doc 00 §8) |
| Versioning | Path version. Additive changes (new optional fields, new endpoints, new enum values on *output*) ship in `v1`. Breaking changes (removed/renamed fields, changed semantics, new required inputs, new enum values that clients must handle on *input*) ship as `/api/v2` and `v1` is kept for ≥ 6 months with a `Deprecation` and `Sunset` response header. |
| Content type | `application/json; charset=utf-8` for requests and responses. Files never pass through the API (presigned S3). |
| Unversioned infra routes | `/healthz`, `/readyz`, `/metrics` (doc 00 ADR-09) are outside `/api/v1` and unauthenticated (metrics restricted by network policy). |

### 1.2 Envelopes

Success:

```json
{ "data": { "...": "..." }, "meta": { "requestId": "01J9X…" } }
```

List success (always paginated):

```json
{
  "data": [ { "...": "..." } ],
  "meta": { "page": 1, "pageSize": 20, "total": 143, "sort": "-createdAt", "requestId": "01J9X…" }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body is invalid.",
    "details": [ { "path": ["amount"], "message": "Must be a decimal string with ≤ 2 fraction digits" } ],
    "requestId": "01J9X…"
  }
}
```

`details` is an array; for `VALIDATION_ERROR` it is the flattened zod issue list (`path`, `message`, optional `code`). For other codes it is optional and documented per endpoint. `message` is in the language selected by `Accept-Language`; `code` is stable and is what clients branch on.

### 1.3 Error codes

| Code | HTTP | When |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | 422 | zod body/query/params failure; also semantic validation (e.g. date range) |
| `UNAUTHENTICATED` | 401 | Missing/expired/invalid access token, revoked session, MFA pending (`details: [{ "reason": "MFA_REQUIRED" }]`) |
| `FORBIDDEN` | 403 | Permission missing or record outside the caller's scope |
| `NOT_FOUND` | 404 | Record missing or soft-deleted; also used instead of 403 when revealing existence would leak (confidential parcels, watchlist) |
| `CONFLICT` | 409 | Uniqueness violation, stale `If-Match`-less update, idempotency key reused with a different payload (`details: [{ "reason": "IDEMPOTENCY_PAYLOAD_MISMATCH" }]`) |
| `INVALID_STATE_TRANSITION` | 409 | Verb not allowed from the current status; `details: [{ "from": "DELIVERED", "action": "dispatch", "allowedFrom": ["CREATED"] }]` |
| `RATE_LIMITED` | 429 | Rate limit exceeded; `Retry-After` header set |
| `INTERNAL` | 500 | Unhandled; logged with `requestId`, reported to Sentry |
| `PRECONDITION_FAILED` **(extension)** | 412 | `If-Match` ETag does not match current record version |
| `PAYLOAD_TOO_LARGE` **(extension)** | 413 | Body > 1 MB (JSON) or presign request exceeds per-kind size cap |
| `UNSUPPORTED_MEDIA_TYPE` **(extension)** | 415 | Non-JSON body, or presign MIME not on allow-list |
| `POLICY_VIOLATION` **(extension)** | 422 | Business rule breach that is not a plain schema error (claim exceeds cap without justification, punch outside geofence, seat offer expired). `details[0].rule` names the rule. |

### 1.4 Pagination, sorting, filtering, search

- `?page=1&pageSize=20` — `pageSize` ∈ [1, 100], default 20. Out-of-range → `VALIDATION_ERROR`.
- `?sort=-createdAt,title` — comma-separated, `-` prefix = descending. Each list endpoint documents its sortable fields; unknown field → `VALIDATION_ERROR`. Default `-createdAt` unless stated.
- Filters are explicit query params per endpoint. Multi-value filters accept repeated params or comma lists: `?status=ACTIVE,SUSPENDED`. Date ranges use `From`/`To` suffixes (`?occurredAtFrom=2026-10-01T00:00:00Z`).
- `?q=` — trigram full-text over the fields named per endpoint (doc 02 §4). Min 2 characters.
- Cursor pagination **(extension)** is used only for append-only streams (chat messages, audit logs, parcel/trip events): `?cursor=<opaque>&limit=50`, response `meta: { nextCursor, hasMore }`.
- Lists never return soft-deleted rows unless the caller holds `admin:read-deleted` and passes `?includeDeleted=true`.

### 1.5 Data formats

| Type | Wire format | Example |
| :--- | :--- | :--- |
| Timestamps | ISO-8601 UTC with `Z` | `"2026-11-01T08:49:00.000Z"` |
| Dates (Prisma `@db.Date`) | `YYYY-MM-DD` | `"2026-11-01"` |
| Times of day (`Shift.startTime`, quiet hours) | `HH:mm` 24 h, Asia/Dhaka | `"09:00"` |
| Money (`Decimal(14,2)`) | Decimal **string**, `.` separator, ≤ 2 fraction digits, no grouping | `"4850000.00"` |
| Other decimals (lat/lng, km, liters) | Decimal string | `"23.810332"` |
| IDs | UUID string | `"3f1c…"` |
| Enums | `SCREAMING_SNAKE` exactly as doc 02 | `"IN_TRANSIT"` |
| Bilingual text | Separate fields `title` / `titleBn` as in schema | — |
| Booleans in query | `true` / `false` | `?isPinned=true` |

zod base schemas (shared by all modules, `server/src/core/schemas.ts`): `zUuid`, `zMoney` (`/^\d{1,12}(\.\d{1,2})?$/`), `zDate`, `zDateTime`, `zPhoneBd` (`/^\+8801[3-9]\d{8}$/`), `zEmail`, `zLang` (`EN|BN`), `zPagination`, `zSort(fields)`.

### 1.6 Request headers

| Header | Direction | Required | Purpose |
| :--- | :--- | :--- | :--- |
| `Authorization: Bearer <access>` | req | all authenticated routes (mobile & web) | JWT access token. Web also accepts the `oneops_at` cookie **(extension)**; the Bearer header wins if both present. |
| `X-Client-Platform: WEB\|ANDROID\|IOS` | req | yes | Selects refresh-token transport (cookie vs body), recorded on `UserSession.platform`. |
| `X-Client-Version` | req | yes | Semver of web build / app build; used for forced-upgrade (`426 Upgrade Required`, code `CLIENT_OUTDATED` **(extension)**). |
| `X-Request-Id` | req/res | optional in; always out | Client may send a UUID; server echoes or generates (uuid v7). Logged by pino, stored on `AuditLog.requestId`. |
| `Idempotency-Key` | req | **required** on every `POST` that creates or transitions a record (all POSTs except `/auth/*`, `/search`, `/files/presign`); UUID v4 | Stored in Redis keyed by `(userId, key)` for 24 h (doc 00 §5.1); replay returns the stored `statusCode` + `response` with header `Idempotent-Replayed: true`. Same key with a different `method+path+bodyHash` → `CONFLICT`. |
| `If-Match: "<etag>"` | req | required on `PATCH`/`PUT` of records marked *versioned* below; optional elsewhere | ETag = weak hash of `updatedAt` (`W/"<updatedAt epoch ms>"`). Mismatch → `PRECONDITION_FAILED`. |
| `ETag` | res | on every single-record `GET`/`PATCH`/`POST` that returns a versioned record | — |
| `Accept-Language: en\|bn` | req | optional (default user `preferredLang`, then `en`) | Server-generated text (error messages, notification bodies, PDFs). |
| `X-Device-Id` | req | required for mobile | Stable device identifier → `UserSession.deviceId`, `AttendancePunch.deviceId`. |

Response headers on lists: `X-Total-Count` mirrors `meta.total`. Rate-limit headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (IETF draft) on every response.

### 1.7 Authorisation model (summary of doc 00 ADR-07, §5.3, §5.4)

- Each endpoint declares one **permission key** (`module:action`) and the **scope dimension** the record is checked against (`owner`, `department`, `site`, or `—` for company-wide master data).
- The caller's effective grants = union over roles (`RolePermission` with `scope`) ∪ active `Delegation`s (delegated grants are limited to `modules` and `maxAmount`).
- The middleware checks the key; the service applies `scopeWhere(user, permission)` to every list/read and re-checks the single record on write. Scope semantics: `SELF` → record owner/claimant/employee is me; `TEAM` → owner's `Employee.lineManagerId` is my employee id (one level); `DEPARTMENT` → owner's `departmentId` ∈ my department subtree; `SITE` → record `siteId` = my site (or `UserRole.siteId`); `COMPANY` → no filter.
- State-transition verbs additionally require the caller to be the **resolved actor** (e.g. `WorkflowStep.approverUserId` or `delegatedToId` for approvals, `Trip.driverId` for driver verbs) unless the caller holds the module's `*:override` key.

### 1.8 Common response shapes

Every business record returned by the API includes: `id`, `createdAt`, `updatedAt`, and — when the model has one — `refNo`-style identifier (`fileNo`, `trackingNo`, `claimNo`, …), `status`/`stage`, and `workflow` `{ instanceId, status, currentStepNo, currentApprover: { userId, name } | null }` for approvable objects. Relations are returned as compact embeds `{ id, name }` (`site`, `department`, `requester`, …); clients fetch detail through the relation's own endpoint. Audit/event trails are separate sub-resources (`/…/{id}/events`, `/…/{id}/actions`) so list payloads stay small.

---

## 2. Authentication & Sessions

Module dir `server/src/modules/auth`. Implements doc 00 ADR-06.

### 2.1 Tokens

| Token | Format | Lifetime | Storage | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Access | JWT (ES256, `kid` header, keys rotated quarterly) | **15 min** | Web: memory (+ `oneops_at` httpOnly cookie for SSE/socket handshake fallback); mobile: SecureStore | Stateless; revocation checked via Redis `session:{sid}:revoked` on each request (cheap SETNX lookup). |
| Refresh | 256-bit random, base64url | **30 days**, rotating | Web: `oneops_rt` httpOnly, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth`; mobile: response body → SecureStore | SHA-256 stored in `UserSession.refreshTokenHash`. Each refresh issues a new token and revokes the old; **reuse of a rotated token revokes the whole session** (theft detection). |
| MFA ticket | opaque, Redis | 5 min | body only | Issued by `/auth/login` when `User.mfaEnabled`; exchanged at `/auth/mfa/verify`. |
| Password reset | opaque, Redis | 30 min, single use | SMS/email link | — |

Access-token claims:

```json
{
  "iss": "oneops",
  "aud": "oneops-api",
  "sub": "3f1c…",                 // User.id
  "sid": "9b2e…",                 // UserSession.id — binds token to a device session
  "roles": ["HOD", "FINANCE"],    // Role.key[]; used only for coarse UI gating
  "emp": "7a4d…",                 // Employee.id (null for system users)
  "lang": "EN",
  "iat": 1761986940,
  "exp": 1761987840,
  "jti": "01J9X…"
}
```

Permissions and scopes are **not** in the token; they are resolved server-side per request from `UserRole → RolePermission` (cached in Redis `perm:{userId}` for 60 s, invalidated on role change) and exposed to clients via `GET /me/permissions`.

### 2.2 Endpoints

All `/auth/*` endpoints are unauthenticated unless stated. None require `Idempotency-Key`.

| Method | Path | Rate limit | Description |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | 5/min per identifier, 20/min per IP | Password login. Returns tokens or an MFA challenge. |
| POST | `/auth/mfa/verify` | 5 per ticket | Exchange MFA ticket + TOTP for tokens. |
| POST | `/auth/mfa/enroll` (auth) | 3/hr | Start TOTP enrolment → `{ otpauthUrl, secretMasked }`. Mandatory for `CHAIRMAN`, `DIRECTOR`, `PLANT_GM`, `SUPER_ADMIN`, `FINANCE` (enforced: these roles get `UNAUTHENTICATED` + `MFA_ENROLMENT_REQUIRED` on every route except `/auth/mfa/*`, `/me`). |
| POST | `/auth/mfa/enroll/confirm` (auth) | 5/hr | Confirm with first TOTP; sets `User.mfaEnabled`; returns 10 recovery codes once. |
| DELETE | `/auth/mfa` (auth) | — | Disable (requires current password + TOTP; not allowed for mandatory roles). |
| POST | `/auth/refresh` | 30/min per session | Rotate refresh token; issue new access token. |
| POST | `/auth/logout` (auth) | — | Revoke current session (`UserSession.revokedAt`), clear cookies. |
| POST | `/auth/logout-all` (auth) | — | Revoke all sessions of the user except optionally the current one (`?keepCurrent=true`). |
| POST | `/auth/password/forgot` | 3/hr per identifier | Always `202`; sends reset link via SMS (phone) or email. |
| POST | `/auth/password/reset` | 5/hr per IP | `{ token, newPassword }`. Revokes all sessions. |
| POST | `/auth/password/change` (auth) | 5/hr | `{ currentPassword, newPassword }`. Revokes other sessions. |
| GET | `/auth/sessions` (auth) | — | List my `UserSession`s (`id, platform, deviceName, ip, lastSeenAt, createdAt, isCurrent`). |
| DELETE | `/auth/sessions/{id}` (auth) | — | Revoke one session (own only). |
| POST | `/auth/devices` (auth) | — | Register/refresh Expo push token → `DeviceToken` (upsert on `token`). |
| DELETE | `/auth/devices/{token}` (auth) | — | Unregister push token (on logout / app uninstall callback). |

Prototype mapping: `LoginPage` (persona pills, email/Emp-ID, password, remember-me, forgot password, SSO) → `/auth/login` (+ future OIDC `/auth/oidc/azure/start|callback`, out of v1 scope); `LockScreenModal` (PIN 1234 / fingerprint) → **client-side only**: biometric unlock re-reads the refresh token from SecureStore and calls `/auth/refresh`; there is no server PIN. `UserProfileModal › Devices & Sign-In Log` → `/auth/sessions`. **Prototype note:** password was not validated; production validates argon2id and locks after 5 failures (`UserCredential.failedAttempts`, `lockedUntil` = 15 min, doubling).

#### POST `/auth/login`

```json
// request
{ "identifier": "tanvir.ahmed@bogcl.com", "password": "•••••", "rememberMe": true,
  "device": { "name": "Chrome on Windows", "id": "web-6d1f…" } }
```

`identifier` is matched, in order, against `User.email`, `User.phone` (normalised to `+880…`), `Employee.empCode` (`EMP-1042`). Validation: `identifier` 3–120 chars; `password` 8–128.

```json
// 200 — no MFA (web: refresh in cookie, body omits refreshToken)
{ "data": { "accessToken": "eyJ…", "expiresIn": 900, "tokenType": "Bearer",
            "refreshToken": "f3Gk…",          // mobile only (X-Client-Platform ≠ WEB)
            "refreshExpiresAt": "2026-12-01T08:49:00.000Z",
            "user": { "id": "3f1c…", "email": "…", "roles": ["EMPLOYEE"], "preferredLang": "EN", "mfaEnabled": false },
            "mustChangePassword": false } }

// 200 — MFA required
{ "data": { "mfaRequired": true, "mfaTicket": "mt_8c…", "methods": ["TOTP"], "expiresIn": 300 } }
```

Errors: `UNAUTHENTICATED` (`details[0].reason`: `INVALID_CREDENTIALS` | `ACCOUNT_LOCKED` (+`lockedUntil`) | `ACCOUNT_DISABLED` | `EMPLOYEE_OFFBOARDED`), `RATE_LIMITED`. Audit: `LOGIN_SUCCESS` / `LOGIN_FAILED` with ip/userAgent. `rememberMe=false` on web → session cookie (no `Max-Age`) and `UserSession.expiresAt` = 12 h.

#### POST `/auth/mfa/verify`
`{ "mfaTicket": "mt_8c…", "code": "123456" }` (`code` 6 digits or 10-char recovery code). Same 200 body as login. Errors: `UNAUTHENTICATED` (`MFA_INVALID_CODE`, `MFA_TICKET_EXPIRED`), `RATE_LIMITED` after 5 wrong codes (ticket destroyed).

#### POST `/auth/refresh`
Web: no body (cookie). Mobile: `{ "refreshToken": "f3Gk…" }`. Response like login (new access + new refresh). Errors: `UNAUTHENTICATED` (`REFRESH_INVALID`, `REFRESH_REUSED` → session revoked, `SESSION_REVOKED`, `SESSION_EXPIRED`). Updates `UserSession.lastSeenAt`, `ip`, `userAgent`.

#### Password rules
Min 10 chars, ≥ 1 upper, ≥ 1 lower, ≥ 1 digit; not in the top-10k breached list; not equal to the last 5 hashes (kept in `Setting` `auth.passwordHistory` per user — **(schema gap, see §25)**). `newPassword` ≠ `currentPassword`.

---

## 3. `/me`

All require authentication; no permission key (self scope).

| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/me` | Profile: `User` (`id,email,phone,preferredLang,mfaEnabled,lastLoginAt`) + `employee` (`id,empCode,fullName,fullNameBn,designation{id,title,titleBn},grade{id,code,name},department{id,code,name,nameBn},site{id,code,name},lineManager{id,fullName},joinDate,status,photoFileId,bloodGroup,emergencyContact`) + `roles[]` (`{key,name,siteId}`) + `features` (server flags). |
| PATCH | `/me` | Self-editable fields only: `phone` (triggers re-verification OTP), `preferredLang`, `employee.emergencyContact`, `employee.bloodGroup`, `employee.photoFileId`. Versioned (`If-Match`). |
| GET | `/me/permissions` | Flattened grants `[{ "key": "claims:approve", "scope": "DEPARTMENT", "via": "ROLE:HOD" \| "DELEGATION:<id>", "maxAmount": "500000.00" \| null }]` plus `navigation[]` (module keys the frontend/mobile shells may show — derived server-side, replaces the prototype's `ROLE_NAV`). ETag; clients re-fetch on `permissions:changed` socket event. |
| GET | `/me/preferences` | `{ lang, theme: "LIGHT"\|"DARK"\|"SYSTEM", notifications: NotificationPreference, dashboardLayout? }` (`theme`/`dashboardLayout` stored in `Setting` key `user:{id}:prefs`). |
| PATCH | `/me/preferences` | Partial update; `notifications.channels ⊆ [IN_APP,PUSH,SMS,EMAIL]`, `IN_APP` cannot be removed; `quietStart/quietEnd` `HH:mm`. |
| GET | `/me/delegations` | `{ given: Delegation[], received: Delegation[] }` (active and future). |
| POST | `/me/delegations` | Create a delegation from me (prototype *Leave Handover*). Body: `{ toUserId, modules: string[] (empty = all; values = module keys from §7 registry), startsAt, endsAt, maxAmount?, reason? }`. Rules: `toUserId ≠ me`, delegate must be ACTIVE and hold at least one role that can act in each listed module (else `POLICY_VIOLATION` rule `DELEGATE_LACKS_ROLE`); `endsAt − startsAt ≤ 90 days`; overlapping active delegation for same module set → `CONFLICT`. Emits notification `DELEGATION_CREATED` to delegate; `permissions:changed` to both. |
| PATCH | `/me/delegations/{id}` | Shorten `endsAt` or set `isActive=false` (revoke). Pending steps already re-routed stay with the delegate until decided (the step records `delegatedToId`). |
| GET | `/me/activity` | My recent `AuditLog` entries (cursor) — powers *My Recent Activity*. Redacted: `{ id, action, entityType, entityId, createdAt }` only (no before/after). Mutations audit field names, never PII values. |
| GET | `/me/dashboard` | Alias of `GET /dashboards/me` (§8). |

---

## 4. Platform & Shared Services

### 4.1 Files (doc 00 §6.4)

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| POST | `/files/presign` | `files:upload` | Reserve a `FileObject` and get a presigned PUT URL. (Pitch mock: `uploadUrl` is `mock-bucket://files/{id}`; the client writes bytes to the on-device private vault instead of an HTTP PUT. `GET /files/{id}/download` returns `{url, expiresAt, inline}` and `403` with `reason` `SCAN_PENDING`/`INFECTED` until the scan is CLEAN.) |
| POST | `/files/{id}/complete` | `files:upload` (owner) | Finalise after the client PUT; server HEADs the object, verifies `sizeBytes` and (if provided) `sha256`, enqueues ClamAV scan job. |
| GET | `/files/{id}` | `files:read` + owner-object access | Metadata (`fileName,mime,sizeBytes,sha256,scanStatus,createdAt`). |
| GET | `/files/{id}/download` | same | `302` to a 5-minute presigned GET (or `{ "url": … }` with `?redirect=false`). Blocked (`FORBIDDEN`, reason `SCAN_PENDING`/`INFECTED`) unless `scanStatus = CLEAN`; images < 2 MB served with `Content-Disposition: inline`. |
| DELETE | `/files/{id}` | owner, only while unattached | Hard delete object + row. |

Access rule: a file is readable if the caller may read **any** `Attachment` owner that references it (`ownerType/ownerId` scope check delegated to the owning module), or is the uploader and the file is unattached (< 24 h; orphan sweeper deletes after that).

```json
// POST /files/presign
{ "fileName": "hotel-invoice.pdf", "mime": "application/pdf", "sizeBytes": 348112, "sha256": "9f86d0…",
  "purpose": "CLAIM_RECEIPT" }
// 201
{ "data": { "id": "f1a2…", "uploadUrl": "https://minio…/oneops-private/claims/2026/11/f1a2…?X-Amz-…",
            "method": "PUT", "headers": { "Content-Type": "application/pdf" }, "expiresAt": "2026-11-01T09:04:00Z" } }
```

`purpose` enum selects bucket prefix, MIME allow-list and size cap: `CLAIM_RECEIPT` (pdf/jpeg/png, 10 MB), `PHOTO` (jpeg/png/heic, 15 MB), `DOCUMENT` (pdf/docx/xlsx, 25 MB), `SIGNATURE` (png, 1 MB), `VOICE` (m4a/aac/ogg, 20 MB), `AVATAR` (jpeg/png, 3 MB), `CERTIFICATE` (pdf, 25 MB). Uploads to presigned URLs expire in 15 min. Attachments are created by the owning module (`POST /claims/{id}/lines` with `receiptFileId`, `POST /incidents/{id}/attachments`, …), never directly.

### 4.2 Notifications (doc 00 §6.3)

| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/notifications` | My notifications, cursor paginated. Filters `?unread=true`, `?priority=CRITICAL`, `?module=fleet`, `?category=APPROVALS\|SAFETY\|TRANSPORT\|ALL` (prototype `NotificationCenter` filter chips; category is derived from `type` prefix). |
| GET | `/notifications/unread-count` | `{ "total": 7, "critical": 1, "pendingAck": 1, "byModule": { "workflow": 3, "parcels": 1 } }` (cached 10 s; also pushed via socket). |
| POST | `/notifications/{id}/read` | Sets `readAt`. Idempotent. |
| POST | `/notifications/read-all` | Body `{ "before": "<ISO>" }` optional. Returns `{ "updated": n }`. |
| POST | `/notifications/{id}/ack` | Required when `ackRequired=true` (CRITICAL). Sets `ackedAt`; audit `NOTIFICATION_ACKED`. When `data.objectType = Notice`, also sets the caller's `NoticeReceipt.ackedAt` (and acknowledging the notice acks its notification), so the blocking modal and the notice never disagree. Reading the notice does not clear a pending `ackRequired` notification. |
| GET/PATCH | `/notifications/preferences` | Same resource as `/me/preferences.notifications`. |

Notification record (wire):

```json
{ "id": "n1…", "type": "APPROVAL_PENDING", "priority": "HIGH", "title": "Approval needed: BOGCL/PROC/2026/0894",
  "body": "Generator overhaul ৳48,50,000 awaits your signature.", "data": { "module": "note-sheets", "objectType": "NoteSheet",
  "objectId": "ns1…", "route": "/note-sheets/ns1…", "workflowInstanceId": "wf1…" }, "readAt": null, "ackRequired": false,
  "ackedAt": null, "createdAt": "2026-11-01T08:49:00Z" }
```

Notification `type` catalogue (prefix = module): `APPROVAL_PENDING`, `APPROVAL_REMINDER`, `APPROVAL_ESCALATED`, `APPROVAL_DECIDED`, `APPROVAL_RETURNED`, `DELEGATION_CREATED`, `NOTICE_PUBLISHED`, `NOTICE_ACK_REQUIRED`, `BROADCAST`, `BRIEFING_PUBLISHED`, `NOTE_SHEET_SIGN_REQUIRED`, `NOTE_SHEET_APPROVED`, `NOTE_SHEET_RETURNED`, `PARCEL_DISPATCHED`, `PARCEL_AT_GATE`, `PARCEL_OTP`, `PARCEL_DELIVERED`, `PARCEL_TAMPER`, `PARCEL_DWELL_ALERT`, `PARCEL_RETURN`, `ASSET_CUSTODY_ASSIGNED`, `ASSET_DUE` (calibration/warranty/AMC/insurance), `ASSET_WO_ASSIGNED`, `ASSET_SPARE_LOW`, `LICENCE_DUE`, `LICENCE_STAGE_CHANGED`, `INCIDENT_REPORTED`, `INCIDENT_CRITICAL`, `CAPA_ASSIGNED`, `CAPA_DUE`, `INCIDENT_CLOSURE_REQUIRED`, `VISIT_PRE_REGISTERED`, `VISIT_APPROVAL_REQUIRED`, `VISIT_ARRIVED`, `VISIT_OVERDUE`, `VISIT_MUSTER`, `FLEET_REQ_ENDORSE`, `FLEET_ASSIGNED`, `FLEET_TRIP_STARTED`, `FLEET_TRIP_COMPLETED`, `FLEET_SOS`, `FLEET_DOC_DUE`, `FLEET_TOLL_SUBMITTED`, `ATT_PUNCH_REJECTED`, `ATT_REGULARISATION`, `LEAVE_REQUESTED`, `LEAVE_DECIDED`, `CLAIM_SUBMITTED`, `CLAIM_DECIDED`, `CLAIM_SETTLED`, `BUS_OFFER`, `BUS_OFFER_EXPIRING`, `BUS_SEAT_CONFIRMED`, `BUS_BROADCAST`, `CHAT_MENTION`, `CHAT_DIRECTIVE`, `CLEARANCE_ITEM_PENDING`, `CLEARANCE_COMPLETED`, `SYSTEM`. Each type has EN/BN templates in `server/src/engines/notifications/templates/`.

### 4.3 Due items (doc 00 §6.2)

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/due-items` | `due-items:read` (scope by owner/dept/site) | Filters `?module=`, `?status=OPEN,OVERDUE`, `?dueBefore=`, `?ownerUserId=me`. Sort `dueAt`. |
| GET | `/due-items/summary` | same | Counts per module and urgency band (`≤7`, `≤30`, `≤90` days) — feeds dashboards and sidebar badges. |
| POST | `/due-items/{id}/snooze` | owner or `due-items:manage` | `{ "until": ISO, "reason": string≤200 }`; max 30 days; status `SNOOZED`. |
| POST | `/due-items/{id}/done` | owner or module auto-action | Status `DONE`. |

Due items are created by modules (licence expiry, asset dates, vehicle docs, driver licence, bus fitness, visit pass expiry, CAPA due, parcel dwell) — never via public POST.

### 4.4 Audit logs

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/audit-logs` | `admin:audit-read` | Cursor list. Filters `?entityType=&entityId=&actorUserId=&action=&from=&to=`. |
| GET | `/audit-logs/export` | `admin:audit-read` | Enqueues CSV export job → `202 { jobId }`; result delivered as `FileObject` + notification `SYSTEM`. |

Modules also expose `/…/{id}/audit` convenience routes that proxy to this with `entityType` fixed, protected by the module's read permission (so a HOD can see a claim's trail without `admin:audit-read`).

### 4.5 Settings

| Method | Path | Permission |
| :--- | :--- | :--- |
| GET | `/settings` | `admin:settings` — all keys |
| GET | `/settings/public` | none (auth) — whitelisted keys (`company.name`, `sites.default`, `attendance.graceMinutes`, `bus.offerWindowHours`, `claims.receiptRequiredAbove`, feature flags) |
| PUT | `/settings/{key}` | `admin:settings` — `{ value }`; value validated by a per-key zod schema registered in `server/src/modules/admin/settings-registry.ts`; audit `SETTING_CHANGED` |

Sequences (`Sequence`) have **no public endpoint**; `GET /admin/sequences` (read-only) exists for support.

### 4.6 Workflow engine (doc 00 §6.1) — generic API

Module dir `workflow`. The same endpoints power MOD-17 (§21).

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/workflow/inbox` | `workflow:inbox` (self) | Active steps where I am `approverUserId` or `delegatedToId`, from `v_approval_inbox`. Filters `?objectType=NoteSheet,Claim`, `?category=PROCUREMENT\|CLAIMS\|FLEET\|LEAVE\|HR\|ASSETS\|VISITORS\|BUS\|COMPLIANCE` (prototype chips), `?urgency=`, `?q=`, `?slaBreachedOnly=true`. Sort `dueAt`, `-submittedAt`, `-summary.amount`. **Alias:** `GET /approvals/inbox` (doc 00 §6.1 wording) serves the same handler. |
| GET | `/workflow/inbox/summary` | same | `{ pending, breachingIn12h, breached, totalAmount: "…" }` for KPI cards & badges. |
| GET | `/workflow/history` | `workflow:inbox` | Steps I decided (`decidedById = me`) + instances I initiated; filters `?decision=`, `?from=&to=`. |
| GET | `/workflow/instances/{id}` | read permission of the underlying object | Instance + ordered `steps[]` (with resolved approver `{userId,name,title}`, `delegatedTo`, `status`, `decision`, `comment`, `activatedAt`, `dueAt`, `decidedAt`) + `actions[]` (audit trail). |
| POST | `/workflow/instances/{id}/actions` | `workflow:act` + must be resolved actor of the ACTIVE step (or initiator for `WITHDRAW`/`COMMENT`) | Perform an action (below). |
| POST | `/workflow/instances/batch-actions` | `workflow:act` | `{ "instanceIds": uuid[] ≤ 50, "type": "APPROVE", "comment"? }` → per-item results `[{ instanceId, ok, error? }]` (`207`-style inside 200). Only `APPROVE` allowed in batch (prototype *Batch Approve*). |
| POST | `/workflow/instances/{id}/reassign` | `workflow:reassign` | Admin override `{ stepId, toUserId, reason }` → action `REASSIGN`. |
| GET | `/workflow/templates` | `workflow:templates` | List `WorkflowTemplate` (key, objectType, version, isActive). |
| POST/PUT | `/workflow/templates`, `/workflow/templates/{id}` | `workflow:templates` | Create new version (templates are immutable once an instance uses them; PUT creates `version+1`). `definition` validated against the step schema below. |
| GET | `/workflow/templates/resolve?objectType=NoteSheet&amount=4850000.00&departmentId=…` | create permission of the object | Preview which template/route will apply (prototype *routing presets* preview in Initiate Note-Sheet). |

Action body:

```json
{ "type": "APPROVE", "comment": "Approved within OPEX budget.",
  "signature": { "method": "DRAWN", "imageFileId": "f9…", "otpCode": "482913" },   // required when step.requiresSignature
  "delegateToUserId": null }                                                    // required when type = DELEGATE
```

| `type` | Allowed when | Effect |
| :--- | :--- | :--- |
| `APPROVE` | step ACTIVE, caller = approver/delegate | Step `COMPLETED/APPROVED`; next step(s) activated, or instance `APPROVED` + module `onApproved` hook |
| `REJECT` | same; `comment` ≥ 10 chars required | Instance `REJECTED`; module `onRejected` |
| `RETURN` | same; `comment` ≥ 10 chars; optional `details: { reasonCategory, improvementsRequired }` (prototype `RejectionExplanationModal`) | Instance `RETURNED` to initiator; initiator may edit and `POST /<resource>/{id}/submit` again → new steps materialised |
| `DELEGATE` | same; one-off | Step `delegatedToId` set; notification to delegate |
| `COMMENT` | any participant while not terminal | Appends `WorkflowAction COMMENT`; no state change |
| `WITHDRAW` | initiator, instance SUBMITTED/IN_REVIEW/RETURNED | Instance `WITHDRAWN`; module `onWithdrawn` |

Errors: `INVALID_STATE_TRANSITION` (step not ACTIVE / instance terminal), `FORBIDDEN` (not the resolved actor), `VALIDATION_ERROR` (missing comment/signature), `POLICY_VIOLATION` rule `DELEGATION_AMOUNT_EXCEEDED` (delegate acting above `Delegation.maxAmount`), rule `SELF_APPROVAL` (approver = initiator; always blocked). Every action: audit `WORKFLOW_<TYPE>`; notification `APPROVAL_DECIDED`/`APPROVAL_RETURNED` to initiator, `APPROVAL_PENDING` to next approver(s); socket `approval:updated` to initiator + all step actors; `inbox:changed` to affected approvers.

Template `definition` (zod, JSONB):

```json
{ "steps": [
  { "key": "HOD", "name": "Head of Department", "approverRule": "DEPARTMENT_HEAD", "slaHours": 24, "escalateTo": "LINE_MANAGER" },
  { "key": "FIN", "name": "Finance", "approverRule": "ROLE", "approverRef": "FINANCE", "condition": "amount > 50000", "slaHours": 24, "requiresSignature": false },
  { "key": "CMD", "name": "Chairman", "approverRule": "ROLE", "approverRef": "CHAIRMAN", "condition": "amount > 500000", "slaHours": 18, "requiresSignature": true, "isFinal": true }
] }
```

`condition` is a restricted expression over `summary` fields (`amount`, `departmentCode`, `siteCode`, `urgency`, `type`, `days`) evaluated with `jsonata`-subset; `approverRule=USER` needs `approverRef=userId`; `DYNAMIC` calls a module-registered resolver by name. Steps with `parallel: true` sharing the same `stepNo` all must approve.

### 4.7 Search

`GET /search?q=&types=employees,assets,note-sheets,vehicles,licences,parcels,visits,claims,notices&limit=5` — `search:use` (auth). Returns grouped hits `{ "data": { "employees": [{ id, label, sublabel, route }], "assets": [...] } }`, each group already scope-filtered by the caller's module read permission (prototype *Command Palette › Live Records*). Min `q` length 2; `limit` ≤ 10 per group; cached 30 s per (user, q).

---

## 5. Master Data

Module dir `admin` (MOD-18) unless noted; employees live in `employees` (MOD-16, §20) and are referenced here. All master-data writes are audited and return the record with `ETag`.

| Resource | Methods | Permission (write) | Read permission | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/sites` | GET, POST, PATCH `/{id}` | `admin:sites` | any auth | `code` `^[A-Z_]{3,30}$` unique; cannot deactivate a site with active employees/assets (`CONFLICT`). |
| `/sites/{id}/geofences` | GET, POST, PATCH `/{gid}`, DELETE | `admin:geofences` | `attendance:read` | `type=CIRCLE` needs `centerLat/centerLng/radiusMeters (50–5000)`; `POLYGON` needs GeoJSON Polygon ≤ 200 points. |
| `/departments` | GET (`?tree=true` nested), POST, PATCH | `admin:departments` | any auth | `code` unique; `headUserId` must be ACTIVE; cycle check on `parentId`. |
| `/grades` | GET, POST, PATCH | `admin:grades` | any auth | `rank` unique. |
| `/designations` | GET, POST, PATCH | `admin:grades` | any auth | — |
| `/roles` | GET, POST, PATCH, DELETE | `admin:roles` | `admin:roles-read` | `isSystem` roles: name/description editable, key not; delete blocked if assigned. |
| `/roles/{id}/permissions` | GET, PUT | `admin:roles` | `admin:roles-read` | PUT replaces the full set `[{ permissionKey, scope }]`; invalidates `perm:*` cache; emits `permissions:changed` to affected users. |
| `/permissions` | GET | — | `admin:roles-read` | Static catalogue (Appendix A) seeded from code; `?module=`. |
| `/users` | GET, POST, GET `/{id}`, PATCH `/{id}` | `admin:users` | `admin:users-read` | POST creates `User` (+ optional `employee` payload → `Employee`) and sends a set-password link. Filters `?isActive=&role=&q=` (email, empCode, fullName). |
| `/users/{id}/roles` | PUT | `admin:users` | — | `[{ roleKey, siteId? }]`; granting `SUPER_ADMIN` requires caller `SUPER_ADMIN`; audit `ROLE_GRANTED`/`ROLE_REVOKED`. |
| `/users/{id}/deactivate`, `/activate` | POST | `admin:users` | — | Deactivate revokes all sessions + push tokens, cancels delegations, reassigns ACTIVE workflow steps to the user's line manager (audit each). |
| `/users/{id}/reset-password` | POST | `admin:users` | — | Admin-triggered reset link; `{ "channel": "EMAIL"\|"SMS" }`. |
| `/users/{id}/sessions` | GET, DELETE `/{sid}` | `admin:users` | — | Support tooling. |
| `/delegations` | GET, POST, PATCH | `workflow:delegate-admin` | `workflow:delegate-admin` | Admin view/creation on behalf of others (e.g. HR sets delegation for an executive on leave). Same rules as `/me/delegations`. |
| `/employees` | see §20 | `employees:*` | `employees:read` | — |

---

## 6. Realtime (Socket.IO)

Server: Socket.IO 4 with Redis adapter (doc 00 ADR-11). Path `/socket.io`. Handshake `auth: { token: "<access JWT>" }` (web may fall back to the `oneops_at` cookie). Invalid/expired token → `connect_error` with `data.code = "UNAUTHENTICATED"`; clients must refresh and reconnect. On access-token expiry mid-connection the server emits `auth:expiring` 60 s before `exp` and disconnects at `exp + 30 s` unless the client sends `auth:refresh { token }`.

Rooms: on connect the server joins the socket to `user:{userId}`, `role:{roleKey}` for each role, `site:{siteId}`, `dept:{departmentId}`; module rooms are joined on demand (`join`/`leave` events) after a permission check.

### 6.1 Namespaces and events

**`/notifications`** (all users)

| Event (server → client) | Payload | Receivers |
| :--- | :--- | :--- |
| `notification:new` | `Notification` (wire shape §4.2) | `user:{id}` |
| `notification:count` | `{ total, critical }` | `user:{id}` after any read/ack/new |
| `approval:updated` | `{ instanceId, objectType, objectId, status, currentStepNo, action: { type, actorId, at } }` | initiator + all step actors |
| `inbox:changed` | `{ delta: +1\|-1, instanceId }` | affected approver(s) |
| `permissions:changed` | `{ reason: "ROLE"\|"DELEGATION" }` | affected `user:{id}` |
| `notice:published` | `{ noticeId, title, titleBn, priority, requiresAck, isBroadcast, showBanner }` | resolved audience users (fan-out via rooms `site:*`, `dept:*`, `role:*`, `user:*`) |
| `briefing:published` | `{ briefingId, title, durationSec }` | audience |
| `due-item:changed` | `{ id, module, status, dueAt }` | owner |
| `parcel:status` | `{ parcelId, trackingNo, status, tamperStatus, event: ParcelEvent }` | sender, recipient, courier, room `parcels:site:{destSiteId}` (mailroom/gate) |
| `asset:changed` | `{ assetId, stage, healthScore }` | custodian + room `assets:site:{siteId}` |
| `incident:critical` | `{ incidentId, incidentNo, riskCategory, siteId }` (priority CRITICAL, `ackRequired`) | `role:HSE_OFFICER`, `role:PLANT_GM`, `role:CHAIRMAN`, `site:{siteId}` |
| `visit:status` | `{ visitId, status, badgeNo }` | host, room `visitors:site:{siteId}` |
| `visit:muster` | `{ siteId, active: boolean, safe, total }` | `site:{siteId}` |
| `trip:status` | `{ tripId, requisitionId, status, event: TripEvent }` | requester, driver, `role:TRANSPORT_ADMIN`, `role:SECURITY_GATE` |
| `trip:location` | `{ tripId, lat, lng, speedKph, heading, at }` | room `trip:{tripId}` (requester, dispatcher) — throttled 1/10 s |
| `fleet:sos` | `{ tripId, driverId, lat, lng, at }` (CRITICAL) | `role:TRANSPORT_ADMIN`, `role:PLANT_GM`, `role:SECURITY_GATE` |
| `attendance:punch` | `{ employeeId, type, result, punchedAt, siteId }` | `role:HR_ADMIN`, line manager, room `attendance:site:{siteId}` |
| `bus:offer` | `SeatOffer` + `{ routeCode, seatNo, expiresAt }` | offered employee |
| `bus:occupancy` | `{ routeId, occupied, vacated, waiting }` | room `bus:route:{routeId}` |
| `bus:broadcast` | `BusBroadcast` | riders of route (or all bus users) |
| `claim:status` | `{ claimId, claimNo, status }` | claimant |
| `leave:status` | `{ leaveRequestId, status }` | employee, line manager |
| `clearance:changed` | `{ clearanceId, itemKey, status }` | HR + item owner role |

Client → server: `join { room }`, `leave { room }` (rooms above with prefix validation + permission check), `auth:refresh { token }`.

**`/chat`** (MOD-15 inner circle + MOD-09 fleet chat share one namespace; rooms `chat:{channelId}` and `fleet:{channel}` where fleet channel ∈ `REQ:{requisitionId}|DESK|BROADCAST|SOS`)

| Event | Direction | Payload |
| :--- | :--- | :--- |
| `chat:join` / `chat:leave` | c→s | `{ channelId }` — membership checked |
| `chat:message` | c→s (ack) / s→c | c→s `{ channelId, clientMsgId, type, body?, fileId?, voiceDurationSec?, replyToId?, isUrgent? }` → ack `{ ok, message }`; s→c `ChatMessage` + `sender {id,name}` to room members |
| `chat:typing` | c→s / s→c | `{ channelId, isTyping }` → broadcast `{ channelId, userId, isTyping }` (throttled 2 s, not persisted) |
| `chat:read` | c→s / s→c | `{ channelId, lastMessageId }` → `ChatReadReceipt` upserts; s→c `{ channelId, userId, lastMessageId }` |
| `chat:reaction` | c→s / s→c | `{ messageId, emoji, op: "ADD"\|"REMOVE" }` |
| `chat:pinned` | s→c | `{ channelId, messageId, isPinned }` |
| `chat:directive` | s→c | `Directive` + `{ channelId, messageId }` (also a CRITICAL notification) |
| `chat:directive:ack` | c→s / s→c | `{ directiveId }` → `{ directiveId, userId, at }` |
| `fleet:message` | c→s / s→c | fleet-channel equivalent of `chat:message` producing `FleetChatMessage` (`type` TEXT/LOCATION/VOICE/ATTACHMENT; `TOLL_CLAIM` and `SYSTEM` are server-generated) |

REST fallbacks exist for every chat write (§19) so offline queues can replay.

**`/presence`**

| Event | Direction | Payload |
| :--- | :--- | :--- |
| `presence:set` | c→s | `{ status: "ONLINE"\|"AWAY"\|"IN_MEETING", note?: string≤80 }` (`OFFLINE` set by server on last socket disconnect + 60 s grace) |
| `presence:update` | s→c | `{ userId, status, note, lastSeenAt }` to users sharing a chat channel / inner-circle roster |
| `presence:snapshot` | s→c on join | `[{ userId, status, note, lastSeenAt }]` |

Presence lives in Redis (`presence:{userId}`, TTL 90 s heartbeat); not persisted in PostgreSQL.

---

## 7. MOD-01 — Notices & Broadcasts

Module dir `notices`. Models `Notice`, `NoticeAudience`, `NoticeReceipt`, `Broadcast`. Ref `NOT-{YYYY}-{NNN}`. Workflow optional (template key `NOTICE_PUBLISH`, used when `Setting notices.requireApproval=true` or `category=EXECUTIVE` authored by non-executive).

### 7.1 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/notices` | `notices:read` | audience-resolved | Feed of notices visible to me (PUBLISHED, not expired, audience match) + my own drafts if `notices:create`. Filters `?category=`, `?isPinned=true`, `?unreadOnly=true`, `?requiresAck=true`, `?status=` (authors/admins), `?q=` (title/titleBn/body). Sort `-isPinned,-publishAt` default. Each item embeds `receipt: { readAt, ackedAt }`. |
| POST | `/notices` | `notices:create` | — | Create DRAFT. |
| GET | `/notices/compose-options` | `notices:create` or `notices:publish` | caller's publish scope | `{ categories: NoticeCategory[], audiences: [{ type, refId, label, labelBn, recipientCount }], maxPinned, pinnedCount }` — what the caller may publish (categories by role; audiences limited by the `notices:publish` scope: COMPANY all, SITE own site + own department, DEPARTMENT own department). Clients build the compose form from this instead of hardcoding role rules. |
| GET | `/notices/{id}` | `notices:read` | audience | Full record + `audiences[]` + counts; marks `NoticeReceipt.readAt` on first read by a recipient. |
| PATCH | `/notices/{id}` | `notices:update` (author or `notices:manage`) | — | DRAFT/SCHEDULED only; versioned. |
| POST | `/notices/{id}/publish` | `notices:publish` | — | DRAFT/SCHEDULED → PUBLISHED (or SUBMITTED to workflow when approval required). |
| POST | `/notices/{id}/schedule` | `notices:publish` | — | `{ publishAt }` future → SCHEDULED; job publishes at time. |
| POST | `/notices/{id}/archive` | `notices:manage` | — | PUBLISHED/EXPIRED → ARCHIVED. |
| POST | `/notices/{id}/pin` / `/unpin` | `notices:manage` | — | Toggle `isPinned` (max 5 pinned company-wide → `CONFLICT` with `details[].rule = PIN_LIMIT`, BR-01-06). |
| POST | `/notices/{id}/ack` | `notices:read` (recipient) | self | Sets `NoticeReceipt.ackedAt`; increments `ackCount`. `POLICY_VIOLATION` `ACK_NOT_REQUIRED` if `requiresAck=false`. |
| GET | `/notices/{id}/receipts` | `notices:manage` or author | — | Per-user read/ack list, `?acked=false` for chase list; CSV `?format=csv`. |
| GET | `/notices/{id}/pdf` | `notices:read` | audience | Letterhead PDF (rendered, cached as `FileObject`). |
| POST | `/notices/audience/preview` | `notices:create` | — | `{ audiences: [...] }` → `{ recipientCount, sample: [{id,name}] }` (prototype audience counts 1,240/218/520/142/32). |
| POST | `/broadcasts` | `notices:broadcast` (CHAIRMAN, SUPER_ADMIN, HR_ADMIN) | — | Chairman "Announce": creates a pinned, PUBLISHED, `category=EXECUTIVE` notice + `Broadcast` row with banner. |
| GET | `/broadcasts/active` | any auth | — | Current banner (`Broadcast` with `activeUntil` ≥ now and my receipt), `null` if none. |
| POST | `/broadcasts/{id}/dismiss` | any auth | self | Stores dismissal in `Setting user:{id}:dismissedBroadcasts` (banner hidden, notice remains). |

### 7.2 Create / publish

```json
// POST /notices
{ "title": "Plant Maintenance Window — Unit 2", "titleBn": "প্ল্যান্ট রক্ষণাবেক্ষণ …", "body": "…", "bodyBn": "…",
  "category": "OPERATIONS", "priority": "HIGH", "isPinned": false, "requiresAck": true,
  "publishAt": null, "expiresAt": "2026-11-30T18:00:00Z",
  "audiences": [ { "type": "SITE", "refId": "<siteId>" }, { "type": "ROLE", "refId": "HOD" } ],
  "attachmentFileIds": ["f1…"],
  "channels": ["IN_APP", "PUSH", "SMS"] }
```

Validation: `title` 5–160; `body` 10–20 000 (markdown subset); `titleBn/bodyBn` optional but required when `Setting notices.requireBangla=true`; `category ∈ NoticeCategory`; `priority ∈ Priority`; `audiences` 1–20 items, `type ∈ AudienceType`, `refId` required unless `type=ALL`, must resolve; `expiresAt > publishAt ?? now`; `channels` ⊆ `NotificationChannel`, `SMS` requires `notices:sms`; `attachmentFileIds` ≤ 5, each `scanStatus=CLEAN`.

`POST /notices/{id}/publish` — response `200` notice with `status=PUBLISHED`, `recipientCount`. Side-effects: `refNo` assigned if null; `NoticeReceipt` rows created lazily (on first read) but `recipientCount` computed now; notification `NOTICE_PUBLISHED` (or `NOTICE_ACK_REQUIRED` with `priority` mirrored; CRITICAL → `ackRequired`) to all recipients via requested channels; socket `notice:published`. Errors: `INVALID_STATE_TRANSITION` unless DRAFT/SCHEDULED; `POLICY_VIOLATION` `APPROVAL_REQUIRED` → returns `workflow.instanceId` (status SUBMITTED) instead of publishing.

```json
// POST /broadcasts
{ "title": "Chairman's Message", "body": "…", "bodyBn": "…", "requiresAck": true, "sendSms": true,
  "showBanner": true, "activeUntil": "2026-11-02T18:00:00Z" }
// 201 → { "data": { "broadcast": Broadcast, "notice": Notice } }
```

**Prototype note:** the prototype stored a single `acknowledgedCount` integer and claimed "788 employees"; production keeps per-user `NoticeReceipt` and computes counts from it.

### 7.3 Pitch-app mock mapping (Flutter `ftr-a`)

The in-app mock implements a reduced, role-aware subset (Phase 3c). Paths are relative to the mock base URL; envelope as §1.

| Method | Path | Permission | Notes |
| :--- | :--- | :--- | :--- |
| GET | `/notices/options` | `notices:create` | Replaces `compose-options`: `{ categories[], audiences[{type,refId,label,labelBn,recipientCount}], maxPinned, pinnedCount }`. POLICY category is not offered (its approval workflow `NOTICE_PUBLISH` arrives with Phase 4); EXECUTIVE only for Chairman/EA. |
| GET | `/notices` | `notices:read` | `?filter=all|unread|ack|mine`; each item embeds `receipt`. |
| GET | `/notices/unread-count` | `notices:read` | `{ unread, awaitingAck }` for list chips. |
| GET | `/notices/{id}` | `notices:read` | Marks the receipt read. Authors also get `stats` (recipients/read/acked). |
| POST | `/notices/{id}/ack` | `notices:read` | `CONFLICT` if already acknowledged. |
| POST | `/notices` | `notices:create` | Create-and-publish in one step (no draft or scheduling). Pin over the limit of 5 → `CONFLICT` rule `MAX_PINNED`. Audience outside the caller's `notices:publish` scope → `FORBIDDEN`. |
| GET | `/notices/{id}/receipts` | author or `notices:manage` | Per-recipient read/ack rows. |

Deferred in the mock: drafts, scheduling, edit, archive, attachments, PDF, SMS channel, broadcasts banner.


---

## 8. MOD-02 — Dashboards & Voice Briefings

Module dirs `dashboards`, `briefings`. Models `VoiceBriefing`, `VoiceBriefingListen`. Ref `VB-{YYYY}-{NNNN}`.

### 8.1 Dashboards (read models)

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/dashboards/me` | any auth | Role-composed dashboard: `{ layout: "CHAIRMAN"\|"PLANT_GM"\|"HR_ADMIN"\|"TRANSPORT_ADMIN"\|"HOD"\|"EMPLOYEE"\|"DRIVER", widgets: [{ key, data }] }`. Layout chosen from the highest-precedence role; widgets only included if the caller holds the widget's permission. Cached 30 s per user. |
| GET | `/dashboards/widgets/{key}` | per widget | Single widget refresh. Keys: `kpi.headcount` (`v_attendance_live`), `kpi.approvals` (inbox summary), `kpi.incidents` (open, safe days, TRIR), `kpi.compliance` (`v_licence_dashboard` bands), `kpi.fleet` (available/on-trip/maintenance), `kpi.parcels`, `kpi.assets` (`v_asset_financials` NBV, availability, due ≤30 d), `kpi.bus` (`v_bus_route_occupancy`), `kpi.claims`, `approvals.priority` (top N by amount/urgency, CHAIRMAN/HOD), `inner-circle.roster` (§8.3), `production.output` (adapter stub; static until SCADA adapter), `alarms.dcs` (adapter stub), `permits.loto` (adapter stub), `hod.queue`, `my.activity`, `driver.today` (my trips), `transport.queue`. |
| GET | `/dashboards/roi` | `dashboards:roi` | Executive ROI dossier data (savings pillars, GL lines) from `Setting roi.*` maintained by Finance — **values are configuration, not computed** in v1. `?format=pdf` renders dossier. |
| POST | `/dashboards/roi/share` | `dashboards:roi` | `{ recipientUserIds[] }` → emails PDF; audit `ROI_SHARED`. |

### 8.2 Voice briefings

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/briefings` | `briefings:read` | Published briefings for my audience (+ my drafts if author). `?active=true` returns the latest unlistened. |
| POST | `/briefings` | `briefings:create` (CHAIRMAN, EXECUTIVE_ASSISTANT) | Draft: `{ title (3–120), transcript (10–5000), transcriptBn?, audioFileId? (purpose VOICE), durationSec? (≤ 600), priority, audience: NoticeAudience-like[] }`. |
| POST | `/briefings/{id}/publish` | `briefings:create` | Sets `publishedAt`, `refNo`; notification `BRIEFING_PUBLISHED`; socket `briefing:published`. Once published, immutable (`INVALID_STATE_TRANSITION`). |
| POST | `/briefings/{id}/listen` | `briefings:read` | Upsert `VoiceBriefingListen`; idempotent. |
| GET | `/briefings/{id}/listens` | author | Listen receipts. |
| GET | `/briefings/{id}/tts` | `briefings:read` | `{ lang, text }` for client TTS (`speechSynthesis` on web, `expo-speech` on mobile) when `audioFileId` is null. Server TTS is out of scope. |

### 8.3 Inner-circle roster (Chairman "informed / uninformed / sick / meeting")

`GET /dashboards/widgets/inner-circle.roster` (permission `dashboards:inner-circle`) returns, for each member of channel `executive-leadership` (or `Setting dashboards.innerCircleUserIds`): `{ user, presence (from `/presence`), todayStatus: "PRESENT"|"ON_APPROVED_LEAVE"|"SICK"|"UNINFORMED_ABSENT"|"IN_MEETING"|"FIELD_DUTY"|"OFF", leave: { refNo, leaveType, isInformed } | null, location?: string }`. `UNINFORMED_ABSENT` = no punch today, no approved/pending `LeaveRequest`, shift started > grace; `SICK` = approved leave of type `SL`; `IN_MEETING` from presence.

### 8.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/dashboard_engine.dart`) implements a subset with these differences:

- `GET /dashboards/me` returns `{ layout, needs[], kpis[], extras[], canBrief, canBroadcast, badges, broadcast }` computed from live collections (BR-02-04/09). Layout is the highest role: CHAIRMAN → PLANT_GM → HR_ADMIN → TRANSPORT_ADMIN → HOD → DRIVER → EMPLOYEE. ROI figures are the declared `DashboardPolicy.roi` constants (BR-02-07). Briefings are transcript-only (`POST /briefings` publishes immediately). Plant extras include work-permit LOTO restore and shift-handover sign (`POST /work-permits/:id/restore`, `POST /shift-handovers/:id/sign`). No SCADA / DCS adapter widgets.
- `GET /search?q=` finds people, notices and refs. `POST /broadcasts` / `POST /broadcasts/:id/dismiss` pin one company announcement on Home.
- `GET /attendance/team` is the manager roster (scope from `attendance:read`). Inbox `GET /notifications` upserts derived rows (expiring permit, unsigned custody, guest today, assigned trip).
- `GET/POST /fleet/chat/{REQ:id}/messages` is trip chat. `GET /fleet/pooling` suggests two same-route pending trips.
- `POST /bus/routes/:id/verify` (EMP or seat), `POST /bus/routes/:id/swap`, `POST /bus/swaps/:id/accept`.
- `POST /auth/unlock` checks the account password (5 failures revoke the session).
- Demo menu **Play next live event** (`POST /demo/events/next`) writes a leadership chat line and an inbox ping.

---

## 9. MOD-03 — Note-Sheets & E-Sign

Module dir `note-sheets`. Models `NoteSheet`, `NoteParagraph`, `NoteSignatory`, `VendorQuote`, `Signature`. Ref `BOGCL/{DEPT}/{YYYY}/{NNNN}` (`fileNo`). Workflow templates `NOTE_SHEET_*` (`plant_internal`, `dept_finance`, `hr_policy`, `capex_boardroom` presets become template keys `NOTE_SHEET_PLANT`, `NOTE_SHEET_DEPT_FIN`, `NOTE_SHEET_HR_POLICY`, `NOTE_SHEET_CAPEX`). `NoteSignatory` rows mirror `WorkflowStep`s 1:1 (`stepNo`); the engine drives state, signatories carry the signature evidence.

### 9.1 State machine

`NoteSheetStatus`: `DRAFT → IN_REVIEW → (RETURNED → IN_REVIEW)* → APPROVED | REJECTED | WITHDRAWN`. `SignatoryStatus`: `UPCOMING → PENDING → SIGNED | RETURNED | SKIPPED`. **Prototype note:** the prototype marked the whole file `approved` on the first "Sign & Forward"; production advances exactly one step per signature and sets `APPROVED` only when the `isFinal` signatory signs.

### 9.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/note-sheets` | `note-sheets:read` | initiator/signatory/department/site/company | Filters `?status=`, `?departmentId=`, `?urgency=`, `?mine=initiated\|to-sign\|signed`, `?amountMin/amountMax`, `?q=` (title, fileNo, subject). Sort `-updatedAt`, `amount`, `fileNo`. |
| POST | `/note-sheets` | `note-sheets:create` | — | Create DRAFT (fileNo assigned on submit). |
| GET | `/note-sheets/{id}` | `note-sheets:read` | participant | Full: paragraphs (ordered), signatories (with signature stamp codes), quotes, budget, `workflow`, `attachments`, `verificationCode`. ETag. |
| PATCH | `/note-sheets/{id}` | initiator | — | DRAFT/RETURNED only; versioned. |
| POST | `/note-sheets/{id}/submit` | `note-sheets:submit` (initiator) | — | DRAFT/RETURNED → IN_REVIEW: assigns `fileNo`, resolves template (`templateKey` or amount rules), materialises signatories, writes paragraph #1 hash chain, activates step 1. |
| POST | `/note-sheets/{id}/paragraphs` | participant (initiator or current signatory) | — | Append note/query paragraph `{ body (1–10 000), kind: "NOTE"\|"QUERY" }`; `contentHash = sha256(prevHash + body + authorId + ts)` computed server-side. Not allowed in terminal states. |
| POST | `/note-sheets/{id}/sign` | `note-sheets:sign` + current signatory | — | Sign & forward (intermediate) or final sanction (`isFinal`). See 9.3. |
| POST | `/note-sheets/{id}/return` | current signatory | — | Return/Query: `{ comment ≥ 10, reasonCategory, improvementsRequired? }` → RETURNED; paragraph kind `RETURN` appended; workflow `RETURN`. |
| POST | `/note-sheets/{id}/reject` | current signatory | — | Terminal REJECTED (`comment` required). |
| POST | `/note-sheets/{id}/withdraw` | initiator | — | IN_REVIEW/RETURNED → WITHDRAWN. |
| GET/POST/PATCH/DELETE | `/note-sheets/{id}/quotes[/{qid}]` | initiator (DRAFT/RETURNED) ; read: participant | — | `VendorQuote`: `vendorName 2–120`, `amount zMoney`, `deliveryDays ≥0`, `warrantyMonths ≥0`, `isRecommended` (exactly one recommended when ≥ 2 quotes and amount > `Setting procurement.quoteThreshold` else `POLICY_VIOLATION` `QUOTES_REQUIRED`). |
| POST | `/note-sheets/{id}/attachments` | initiator/participant | — | `{ fileId, kind }`. |
| GET | `/note-sheets/{id}/pdf` | participant | — | Current rendering (draft watermark unless APPROVED). |
| GET | `/note-sheets/{id}/certificate` | participant | — | Final approval certificate PDF (APPROVED only) — contains `finalPdfSha256`, QR to verify URL. |
| GET | `/note-sheets/{id}/audit` | participant | — | Trail. |
| GET | `/verify/note-sheets/{verificationCode}` | **public (no auth)** | — | `{ fileNo, title, approvedAt, finalPdfSha256, signatories: [{ roleTitle, signedAt, stampCode }] }` — no amounts/body. Rate limit 30/min per IP. |
| GET | `/note-sheets/budget-heads` | `note-sheets:create` | — | Budget heads with `allocated/available` (from `Setting finance.budgetHeads` until SAP adapter). |

### 9.3 Create, submit, sign

```json
// POST /note-sheets
{ "title": "Overhaul of 1,200 kVA Cummins Generator — Unit 2", "subject": "CAPEX maintenance",
  "departmentId": "d-proc…", "amount": "4850000.00", "urgency": "HIGH", "confidentiality": "INTERNAL",
  "budgetHead": "GL-2026-OPEX", "sapPrRef": "SAP-PR-2026-01877",
  "templateKey": "NOTE_SHEET_CAPEX",
  "signatories": [ { "stepNo": 1, "userId": "u-gm…", "roleTitle": "Plant General Manager" },
                   { "stepNo": 2, "userId": "u-fin…", "roleTitle": "Head of Finance" },
                   { "stepNo": 3, "userId": "u-ch…", "roleTitle": "Chairman & MD", "isFinal": true } ],
  "paragraphs": [ { "body": "Para 1 — Background …" } ],
  "quotes": [ { "vendorName": "Energypac", "amount": "4850000.00", "deliveryDays": 21, "warrantyMonths": 12, "isRecommended": true } ] }
```

Validation: `title` 5–200; `amount` zMoney ≤ `99999999999.99` or null for non-financial; `urgency ∈ Priority`; `confidentiality ∈ INTERNAL|CONFIDENTIAL|SECRET`; `signatories` 1–8, `stepNo` contiguous from 1, exactly one `isFinal` (last), no duplicate users, no user = initiator (`POLICY_VIOLATION` `SELF_APPROVAL`); when `templateKey` given, signatories must satisfy the template's `approverRule`s (server fills them if omitted); `budgetHead` must exist and `amount ≤ available` unless `urgency=CRITICAL` with `overBudgetJustification` (≥ 50 chars). `paragraphs[0]` required at submit.

Submit response: `200` with `status=IN_REVIEW`, `fileNo`, `workflow`. Notifications `NOTE_SHEET_SIGN_REQUIRED` (+ `APPROVAL_PENDING`) to signatory 1; sockets `approval:updated`, `inbox:changed`.

```json
// POST /note-sheets/{id}/sign
{ "remark": "Reviewed and forwarded.", "signature": { "method": "DRAWN", "imageFileId": "f-sig…" }, "otpCode": "482913" }
// 200
{ "data": { "status": "IN_REVIEW", "currentStepNo": 2,
            "signatory": { "stepNo": 1, "status": "SIGNED", "signedAt": "…", "signature": { "id": "s1…", "stampCode": "VERIFIED-SIGN-2026-7F3A91C2", "documentHash": "e3b0…" } } } }
```

Rules: caller must be `NoteSignatory.userId` of the PENDING step (or its workflow delegate, recorded on the signature `metadata`); `signature.method ∈ SignatureMethod`, `DRAWN/UPLOADED` require `imageFileId` (purpose SIGNATURE, CLEAN), `TYPED/STAMP` use the server-rendered stamp; **OTP required** for `isFinal` steps and for any step when `amount > Setting notesheets.otpAbove` (default 500 000): server sends a 6-digit OTP via SMS/push on `POST /note-sheets/{id}/sign/otp` (rate 3/10 min), valid 5 min, 5 attempts; `documentHash = sha256` of the canonical JSON of paragraphs+quotes+amount at signing time, stored on `Signature.documentHash`; `stampCode` = `VERIFIED-SIGN-{YYYY}-{8 hex of documentHash}` / `APPROVED-{YYYY}-…` for final. Final signature: status `APPROVED`, `approvedAt`, PDF rendered → `finalPdfFileId`, `finalPdfSha256`, `verificationCode` (22-char base32). Errors: `INVALID_STATE_TRANSITION`, `FORBIDDEN` (not current signatory), `POLICY_VIOLATION` `OTP_REQUIRED` / `OTP_INVALID` / `OTP_EXPIRED`, `VALIDATION_ERROR`. Audit `SIGNED`, `OTP_VERIFIED`. Notifications: next signatory `NOTE_SHEET_SIGN_REQUIRED`; on final `NOTE_SHEET_APPROVED` to initiator and all signatories.

**Prototype note:** "SHA-256 seal" was `Math.random()`; production hashes are real and verifiable at `/verify/note-sheets/{code}` (ADR-25).

### 9.4 Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/note_sheet_engine.dart`) implements a subset with these differences:

- Paragraphs, quotes and signatures are embedded in the note-sheet record (no separate resources). `GET /note-sheets?view=mine|to-sign|all` replaces the `mine` query; drafts are visible only to their author.
- `POST /note-sheets/{id}/sign` takes `{ method: DRAWN|TYPED|STAMP, otp, typedName?, imageFileId?, comment? }`. There is no SMS gateway: the OTP is the fixed demo code `123456` and no `/sign/otp` call exists. Every step of the NOTE_SHEET template requires a signature. A signer's comment becomes a NOTE paragraph that is part of the signed content.
- Return, reject, withdraw and delegate use the shared `/workflow/instances/{id}/actions`. A return adds a RETURN paragraph with the reason and clears signatures; the author edits (`PUT`) and submits again.
- `documentHash`, `stampCode` (`BG-XXXXXXXX`), the paragraph hash chain and `finalHash` are real SHA-256 values. The `verificationCode` is `NS-` plus 10 hex characters of the final hash.
- PDF is built on the device (`pdf`/`printing`); only an approved sheet carries the stamp and QR. Bengali conjuncts may render without full shaping in the PDF.
- Deferred: budget check (BR-03-05), public verify endpoint, confidentiality hiding rules, SAP references, OTP rate limits, delegated final-signature rules.

---

## 10. MOD-04 — Parcel Chain-of-Custody

Module dir `parcels`. Models `Parcel`, `ParcelEvent`, `ParcelReturn`. Ref `PKG-{YYYY}-{NNNN}` (`trackingNo`); `waybillNo` optional carrier/legacy number (prototype `BOGCL-WB-2026-####`). Due item: dwell > 24 h at any non-terminal status (`PARCEL_DWELL_ALERT` to mailroom + sender).

### 10.1 State machine (`ParcelStatus`)

```
CREATED ─dispatch→ DISPATCHED ─scan(HANDOVER)→ IN_TRANSIT ─scan(CHECKPOINT)*→ IN_TRANSIT ─scan(GATE_IN)→ AT_GATE
  ─scan(OUT_FOR_DELIVERY)→ OUT_FOR_DELIVERY ─verify-otp→ DELIVERED
Any non-terminal ─flag→ QUARANTINED ─return→ RETURN_INITIATED ─scan(RETURN_CHECKPOINT)*→ RETURN_IN_TRANSIT ─return/verify-otp→ RETURNED
Any non-terminal ─exception→ LOST | DAMAGED (admin only)
```

`tamperStatus`: `SECURE → INSPECTED` (gate scan with seal intact) → `FLAGGED` (seal broken).

### 10.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/parcels` | `parcels:read` | sender/recipient/courier = me (SELF) · site (MAILROOM/SECURITY_GATE) · COMPANY | Filters `?direction=INWARD\|OUTWARD` (relative to my site), `?status=`, `?category=`, `?urgency=`, `?tamperStatus=`, `?originSiteId=&destSiteId=`, `?courierUserId=`, `?mine=true`, `?q=` (trackingNo, waybillNo, description, recipientName). Confidential parcels (`isConfidential`) are listed only to sender/recipient/mailroom with `parcels:confidential`. |
| POST | `/parcels` | `parcels:create` | — | Register consignment → CREATED. |
| GET | `/parcels/{id}` | `parcels:read` | as above | Full + `events[]` (hash chain) + `return` + `trip {id, passNo, vehicle, driver}` + `courier`. `GET /parcels/by-tracking/{trackingNo}` alias. |
| PATCH | `/parcels/{id}` | sender/mailroom | — | CREATED only (description, recipient, urgency, declaredValue). Versioned. |
| POST | `/parcels/{id}/dispatch` | `parcels:dispatch` (sender or MAILROOM) | — | CREATED → DISPATCHED; assigns `sealNo` (if not supplied), `courierUserId`, optional `tripId`; generates delivery OTP (6 digits, bcrypt → `otpHash`, `otpExpiresAt` = +72 h) and sends to recipient via SMS/push `PARCEL_OTP`. |
| POST | `/parcels/{id}/scan` | `parcels:scan` (courier, SECURITY_GATE, MAILROOM) | — | Checkpoint handshake `{ eventType: HANDOVER\|CHECKPOINT\|GATE_IN\|OUT_FOR_DELIVERY\|RETURN_CHECKPOINT, location?, lat?, lng?, note?, photoFileId?, sealIntact: boolean }`. Transitions per 10.1; `sealIntact=false` → `tamperStatus=FLAGGED` + event `TAMPER_FLAGGED` + status QUARANTINED. Offline-capable (`Idempotency-Key`). |
| POST | `/parcels/{id}/verify-otp` | `parcels:deliver` (courier/gate) | — | `{ otp: "6 digits", receivedByName?, signatureFileId?, photoFileId? }` → DELIVERED. See 10.3. |
| POST | `/parcels/{id}/resend-otp` | sender/MAILROOM/recipient | — | Regenerate + resend; rate 3 per parcel per hour; resets `otpAttempts`. |
| POST | `/parcels/{id}/flag` | `parcels:scan` | — | `{ reason: "TAMPER_BROKEN"\|"DAMAGED_CONTENTS", note, photoFileId }` → QUARANTINED, `FLAGGED`. Notification `PARCEL_TAMPER` (HIGH) to sender, recipient, mailroom, security. |
| POST | `/parcels/{id}/return` | `parcels:return` (recipient, MAILROOM, gate for quarantined) | — | `{ reason: ReturnReason, details? }` → RETURN_INITIATED, creates `ParcelReturn` (`returnNo = RTN-{YYYY}-{NNNN}`), new return OTP sent to **sender**. |
| POST | `/parcels/{id}/return/verify-otp` | courier/MAILROOM | — | `{ otp }` → RETURNED, `ParcelReturn.returnedAt`. |
| POST | `/parcels/{id}/exception` | `parcels:manage` | — | `{ status: "LOST"\|"DAMAGED", note ≥ 20 }`; terminal; audit. |
| POST | `/parcels/{id}/note` | participant | — | Append `NOTE` event. |
| GET | `/parcels/{id}/events` | participant | — | Cursor list of `ParcelEvent` incl. `eventHash/prevHash`; `?verify=true` returns `{ chainValid }`. |
| GET | `/parcels/{id}/manifest` | participant | — | Waybill/manifest PDF. |
| GET | `/parcels/{id}/label` | sender/MAILROOM | — | QR label PDF (QR = `trackingNo`). |
| GET | `/parcels/manifest` | `parcels:manage` | site | Daily gate manifest PDF `?siteId=&date=` ("Master Corporate Manifest"). |
| GET | `/parcels/kpis` | `parcels:read` | scope | `{ inTransit, atGate, deliveredToday, flagged, avgTransitHours }`. |

### 10.3 Create and OTP delivery

```json
// POST /parcels
{ "category": "TENDER_BID", "urgency": "CRITICAL", "description": "Sealed bid — Terminal expansion contract",
  "declaredValue": "145000000.00", "weightKg": "1.20", "isConfidential": true,
  "recipientUserId": "u-ch…", "originSiteId": "s-hq…", "destSiteId": "s-ker…",
  "specialHandling": "Hand-carry only", "courierUserId": "u-drv…", "tripId": null }
// 201 → { "data": { "id": "p1…", "trackingNo": "PKG-2026-9041", "status": "CREATED", "sealNo": null, … } }
```

Validation: `category ∈ ParcelCategory`; `description` 5–500; `declaredValue` zMoney optional; exactly one of `recipientUserId` or (`recipientName` 2–120 + `recipientPhone` zPhoneBd); `originSiteId ≠ destSiteId` unless `intraSite=true`; `courierUserId` must hold `DRIVER`/`MAILROOM` role; `tripId` if given must be a non-completed `Trip`.

```json
// POST /parcels/{id}/verify-otp
{ "otp": "748213", "receivedByName": "Ahmed Akbar Sobhan", "signatureFileId": "f-sig…", "lat": "23.70", "lng": "90.38" }
// 200 → { "data": { "status": "DELIVERED", "deliveredAt": "…", "event": { "type": "OTP_VERIFIED", "eventHash": "…" } } }
```

Rules: status must be `OUT_FOR_DELIVERY` or `AT_GATE` (`INVALID_STATE_TRANSITION`); bcrypt compare against `otpHash`; wrong → `POLICY_VIOLATION` `OTP_INVALID` with `details[0].attemptsLeft`; after 5 failures OTP invalidated (`OTP_LOCKED`, resend required); expired → `OTP_EXPIRED`. Events `OTP_VERIFIED` then `DELIVERED` appended with hash chain `eventHash = sha256(prevHash + type + actorUserId + createdAt + note)`. Notifications `PARCEL_DELIVERED` to sender & recipient; socket `parcel:status`; due item DONE. **Prototype note:** the prototype accepted a master PIN `1234` and displayed the OTP in the error toast; production has no master code and never returns the OTP. Gate/security role can override delivery only via `/exception` with audit.

### 10.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/parcel_engine.dart`, `handlers/parcel_handlers.dart`) implements this module with these differences:

- The recipient must be a system user chosen from `GET /people?q=` (name, title, department and site only, no PII; the caller is excluded). Destination site is the recipient's site; same-site parcels are `intraSite` and may go out for delivery straight from DISPATCHED/IN_TRANSIT without the gate step.
- `GET /parcels?view=mine|sent|incoming|carrying|site|all&status&q&stuck=true`; `GET /parcels/couriers` (needs `parcels:dispatch`; users holding DRIVER or MAILROOM); `GET /parcels/by-tracking/{no}`. Each parcel carries a `me` block of booleans (`canDispatch`, `canGateIn`, `canAccept`, ...) computed from role, state and scope; the app only shows buttons that will work. Confidential parcels hide the description (`hidden: true`) from people who only handle them.
- There is no SMS: the 6-digit code is delivered as an in-app notification to the recipient (return code: to the sender) and stored hashed. `POST /parcels/{id}/accept` lets the recipient confirm in the app instead of reading the code out (sender, for a returned parcel). Resending is limited to 3 per hour.
- Marking LOST is allowed only after 72 hours without movement (`LOST_TOO_EARLY`); DAMAGED needs a photo and stays returnable. Seal is required above ৳1,00,000; delivery photo above ৳50,000. A broken seal is reported through `/flag` (photo plus note, parcel goes to QUARANTINED), never through `/checkpoint`.
- The custody trail is a SHA-256 chain (`prev|type|actor|location|note|photo|at`) and `chainValid` is recomputed on read. Photos are uploaded as `PHOTO` files and attached to the parcel; file access follows parcel participants or a wider-than-self `parcels:read` grant.
- Label PDF with QR is printed on the device (`pdf`/`printing`).
- Deferred: manifest PDF, trip linking (BR-04-10), `parcels:reassign`, escalation above ৳5,00,000, COMPLIANCE notification.

---

## 11. MOD-05 — Asset Lifecycle & EAM

Module dir `assets`. Models `AssetCategory`, `Asset`, `AssetEvent`, `AssetCustody`, `AssetSpare`, `WorkOrder`, `AssetRequisition`, `AssetTransfer`, `AssetDisposal`, `DepreciationSnapshot`; read model `v_asset_financials`. Refs: `tag` `BOGCL-{SITE}-{CAT}-{n}` (prototype) — doc 00 §5.2 lists `AST-{NNN}`; see §25. `WO-{YYYY}-{NNNN}`, `ARQ-{YYYY}-{NNN}`, `TRF-{YYYY}-{NNN}`, `GP-{NNNN}` gate pass, disposal voucher `VCH-RET-{YYYY}-{NNNN}`. Workflows: `ASSET_REQUISITION` (HOD → Executive when `estimatedCost ≥ 1 000 000`), `ASSET_WRITE_OFF` (HOD → Finance → Executive).

### 11.1 Stage machine (`AssetStage`)

`REQUESTED → PROCURED → IN_STOCK → OPERATIONAL ⇄ {IN_TRANSFER, MAINTENANCE, CALIBRATION_DUE, QUARANTINE_LOTO} → DECOMMISSIONED → DISPOSED`; `LOST` from any active stage (admin). Each transition writes an `AssetEvent` with `fromStage/toStage` and `eventHash = sha256(prev.eventHash + type + assetId + createdAt + note)` (**Prototype note:** FNV-1a replaced by SHA-256).

### 11.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/assets` | `assets:read` | SELF = my custody · SITE · COMPANY | Filters `?categoryId=`, `?assetClass=`, `?siteId=`, `?stage=`, `?criticality=`, `?custodianEmployeeId=me`, `?dueWithinDays=30` (any of calibration/service/warranty/AMC/insurance), `?healthBelow=`, `?q=` (tag, name, serialNo, oem). Sort `tag`, `name`, `-healthScore`, `nextCalibrationAt`, `nbv`. Embeds `financials { gross, accumulatedDepreciation, nbv, annualDepreciation, tco, repairRatio, remainingLifeYears, isEolCandidate }` from the view. |
| POST | `/assets` | `assets:create` | — | Register asset (IN_STOCK or OPERATIONAL). Optional `photoFileId` (CLEAN PHOTO owned by the caller). |
| GET | `/assets/{id}` | `assets:read` | — | Full record + financials + `currentCustody` + `openWorkOrders` + `nextAction` (server-computed smart banner, enum `ACK_CUSTODY\|COMPLETE_WO\|CALIBRATE\|RETIRE_REVIEW\|RESTOCK_SPARES\|NONE`). |
| PATCH | `/assets/{id}` | `assets:update` | — | Descriptive fields, dates, `location`, `ratedLifeHours`, `runtimeHours` (monotonic non-decreasing); versioned. |
| GET | `/assets/{id}/events` | `assets:read` | — | Cursor; `?verify=true`. |
| GET | `/assets/{id}/depreciation-schedule` | `assets:read` | — | Year rows (`openingNbv, depreciation, closingNbv`) computed by method; `?method=` to preview another. |
| POST | `/assets/{id}/depreciation-method` | `assets:depreciation-policy` | — | `{ method: DepreciationMethod, usefulLifeYears?, salvageValue?, ratedLifeHours?, reason ≥ 10 }`; event `NOTE`; snapshots recomputed. |
| POST | `/assets/{id}/custody` | `assets:custody-assign` | — | `{ employeeId, note? }` → `AssetCustody` (previous released), event `CUSTODY_ASSIGNED`; notification `ASSET_CUSTODY_ASSIGNED`. |
| POST | `/assets/{id}/custody/ack` | custodian (SELF) | — | Sets `acknowledgedAt`; event `CUSTODY_SIGNED`; optional `{ signatureFileId }`. `INVALID_STATE_TRANSITION` if already acked. |
| POST | `/assets/{id}/custody/release` | `assets:custody-assign` or custodian | — | `{ reason }`; event `CUSTODY_RECLAIMED`. |
| GET | `/assets/{id}/custody` | `assets:read` | — | Custody history. |
| POST | `/assets/{id}/transfer` | `assets:transfer` | — | Initiate `AssetTransfer` `{ toSiteId, toLocation?, toEmployeeId?, reason }` → `IN_TRANSFER`, gate pass number minted, event `TRANSFER_INITIATED`. |
| POST | `/assets/{id}/transfer/{tid}/complete` | `assets:transfer` (receiving site) | — | `{ receivedById, note? }` → `COMPLETED`, asset `siteId/location` updated, custody moved, back to `OPERATIONAL`; event `TRANSFER_COMPLETED`. |
| POST | `/assets/{id}/transfer/{tid}/cancel` | initiator | — | INITIATED only. |
| GET | `/asset-transfers` | `assets:read` | site | `?status=&fromSiteId=&toSiteId=`. |
| GET/POST/PATCH | `/assets/{id}/spares[/{sid}]` | `assets:spares` | — | `AssetSpare` CRUD; `POST /assets/{id}/spares/{sid}/consume { qty, workOrderId? }` and `/restock { qty, unitCost? }`; low stock (`qtyOnHand ≤ reorderLevel`) → notification `ASSET_SPARE_LOW`, event `STOCK_ADJUSTED`. |
| POST | `/assets/{id}/flag-defect` | `assets:flag-defect` (any custodian/operator) | — | `{ description ≥ 10, severity: LOW\|MEDIUM\|HIGH, photoFileId? }` → `healthScore −10` (floor 25), event `DEFECT_FLAGGED`, auto-creates CM `WorkOrder` (estimatedCost from `Setting assets.defaultCmCost`, 0 if under warranty). |
| POST | `/assets/{id}/loto` | `assets:maintain` | — | `{ action: "APPLY"\|"RELEASE", permitNo }` → `QUARANTINE_LOTO` / back; events `LOTO_APPLIED/RELEASED`. |
| POST | `/assets/{id}/certify` | `assets:calibrate` | — | Direct calibration/PM certification without WO `{ type: PM\|CAL, certificateNo?, regulator?, nextDueAt }`; event `PM_CERTIFIED`; health `+7`. |
| POST | `/assets/{id}/decommission` | `assets:decommission` | — | `{ reason: DisposalReason, surveyNotes }` → `DECOMMISSIONED`, `AssetDisposal` created (checklist all false), workflow `ASSET_WRITE_OFF` submitted; event `DECOMMISSION_SURVEY`. |
| PATCH | `/assets/{id}/disposal/checklist` | `assets:write-off` roles per item | — | `{ technicalSurveySigned?, decontaminationCertified?, sparesHarvested?, financeVetted? }` — `financeVetted` requires `FINANCE`. |
| POST | `/assets/{id}/dispose` | `assets:write-off` | — | Finalise `{ method: DisposalMethod, buyer?, proceeds: zMoney }`; requires all checklist true and write-off workflow APPROVED (`POLICY_VIOLATION` `CHECKLIST_INCOMPLETE` / `WRITE_OFF_NOT_APPROVED`); computes `nbvAtDisposal`, `gainLoss = proceeds − nbv`, mints `voucherNo`; stage `DISPOSED`; event `DISPOSED`. |
| GET | `/assets/export` | `assets:export` | scope | `202 { jobId }` → CSV FI-AA ledger (`BOGCL_Enterprise_Asset_Lifetime_FI_AA_Ledger.csv`). |
| GET | `/assets/kpis` | `assets:read` | scope | `{ totalNbv, availabilityPct, dueIn30d, retired, byClass[] }`. |
| GET | `/assets/scan/{code}` | `assets:read` | — | Resolve QR/RFID payload (`qrPayload` or `tag`) → asset summary. |
| GET/POST/PATCH | `/asset-categories[/{id}]` | `admin:asset-categories` ; read any | — | `code` unique, `defaultLifeYears 1–50`, `defaultSalvagePct 0–50`, `calibrationCycleDays?`. |

**Work orders**

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/work-orders` | `assets:maintain` (or `assets:read` for own assignee) | `?assetId=&type=&status=&assigneeUserId=me&dueBefore=&priority=`. Sort `dueAt`, `-priority`. |
| POST | `/work-orders` | `assets:maintain` | `{ assetId, type: WorkOrderType, priority, title 3–160, description?, assigneeUserId?, lotoPermitNo?, regulator?, isCapex, estimatedCost?, dueAt }`; asset → `MAINTENANCE` (or `CALIBRATION_DUE` for CAL); notification `ASSET_WO_ASSIGNED`. |
| GET/PATCH | `/work-orders/{id}` | same | PATCH while SCHEDULED/ON_HOLD; versioned. |
| POST | `/work-orders/{id}/start` | assignee or `assets:maintain` | SCHEDULED/ON_HOLD → IN_PROGRESS (`startedAt`). |
| POST | `/work-orders/{id}/hold` | same | IN_PROGRESS → ON_HOLD `{ reason }`. |
| POST | `/work-orders/{id}/complete` | same | `{ actualCost: zMoney, certificateNo?, notes?, partsConsumed?: [{spareId, qty}], nextDueAt? }` → COMPLETED. Effects: `isCapex` → `capexAdditions += actualCost`, `usefulLifeYears += 2`, health `+15`, event `CAPEX_OVERHAUL`; else `opexToDate += actualCost`, health `+7`, event `PM_CERTIFIED`; CM under warranty forces `actualCost="0.00"` (`POLICY_VIOLATION` `WARRANTY_COVERED` if non-zero); asset returns to `OPERATIONAL`; `certificateNo` auto `CERT-{TYPE}-{YYYY}-{NNN}` if omitted for PM/CAL; due item for `nextCalibrationAt`/`nextServiceAt` refreshed. |
| POST | `/work-orders/{id}/cancel` | `assets:maintain` | `{ reason }`; asset stage restored. |

**Asset requisitions**

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/asset-requisitions` | `assets:requisition` (SELF) / `assets:approve-requisition` (DEPARTMENT/COMPANY) | `?stage=&departmentId=&siteId=&requesterId=me`. |
| POST | `/asset-requisitions` | `assets:requisition` | `{ title 5–160, categoryId, siteId, estimatedCost zMoney > 0, justification ≥ 30, urgency }`; `departmentId` = requester's; `reqNo` minted; workflow `ASSET_REQUISITION` submitted → stage `PENDING_HOD`; mirrors to inbox. |
| POST | `/asset-requisitions/{id}/approve` / `/reject` / `/return` | `assets:approve-requisition` + current approver | Workflow wrappers; stage advances `PENDING_HOD → PENDING_EXECUTIVE (if ≥ 1 000 000) → APPROVED_PROCURING`; reject → `REJECTED` (`comment` required). |
| POST | `/asset-requisitions/{id}/commission` | `assets:commission` | `{ asset: <POST /assets body>, purchaseCost, vendor, purchaseDate }` → creates `Asset` (`OPERATIONAL`, tag minted, WDV for VEHICLE class else category default), stage `COMMISSIONED`, `commissionedAssetId`; events `PROCURED, CAPITALIZED, COMMISSIONED`. `INVALID_STATE_TRANSITION` unless `APPROVED_PROCURING`. |

### 11.3 Register asset

```json
// POST /assets
{ "name": "1,200 kVA Cummins Generator", "categoryId": "c-gen…", "siteId": "s-ker…", "location": "Powerhouse Bay 2",
  "criticality": "CRITICAL_A", "stage": "OPERATIONAL", "oem": "Cummins", "model": "C1250D5", "serialNo": "CGX-88213",
  "vendor": "Energypac", "purchaseDate": "2022-03-14", "commissionedAt": "2022-04-01",
  "purchaseCost": "24000000.00", "salvageValue": "1920000.00", "usefulLifeYears": 15, "depreciationMethod": "SLM",
  "ratedLifeHours": 60000, "runtimeHours": 18240, "warrantyExpiresAt": "2027-04-01", "amcExpiresAt": "2026-12-31",
  "insuranceExpiresAt": "2027-03-31", "nextCalibrationAt": null, "nextServiceAt": "2026-12-15",
  "custodianEmployeeId": "e-gm…", "sapAssetNo": "100045221" }
// 201 → { "data": { "id": "a1…", "tag": "BOGCL-KER-GEN-101", "qrPayload": "AST:a1…", "healthScore": 100, "financials": { … } } }
```

Validation: `name` 3–160; `purchaseCost ≥ 0`; `salvageValue ≤ 50 % of (purchaseCost + capexAdditions)` else `POLICY_VIOLATION` `SALVAGE_CAP`; `usefulLifeYears 1–60` (defaults from category); `depreciationMethod=UOP` requires `ratedLifeHours`; `stage ∈ IN_STOCK|OPERATIONAL` at registration; dates `commissionedAt ≥ purchaseDate`; `tag` optional (unique, `^BOGCL-[A-Z]{2,4}-[A-Z]{2,5}-\d{1,5}$`), minted if omitted. Side-effects: due items for each expiry date; events `CAPITALIZED` (+ `COMMISSIONED`, `CUSTODY_ASSIGNED` when applicable).

Financial formulas (implemented in SQL view + TS service, single source `server/src/modules/assets/depreciation.ts`): gross = purchaseCost + capexAdditions; **SLM** annual = (gross − salvage)/life; **WDV** rate = clamp(1 − (salvage/gross)^(1/life), 0.12, 0.35); **UOP** accumulated = (gross − salvage) × min(1, runtimeHours/ratedLifeHours); NBV floored at salvage, 0 when DISPOSED; `isEolCandidate` = repairRatio ≥ 0.5 ∨ (remainingLife ≤ 0.5 ∧ health < 55) ∨ DECOMMISSIONED. `DepreciationSnapshot` written by a yearly job (fiscal year July–June) and on method change.

### 11.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/asset_engine.dart`) implements a subset with these differences:

- Register (`POST /assets`) creates `IN_STOCK` (or commissions immediately). Custody assign / ack / release, defect → CM work order, WO start/complete, LOTO apply/release, calibration certify, transfer initiate/complete, decommission + checklist + write-off approve + dispose. Events are SHA-256 chained (BR-05-01). Financials (SLM / WDV / UOP, NBV floor, EOL flag) are computed on read (BR-05-03–06).
- Write-off is two permissions on the record (`POST /assets/{id}/write-off` then `dispose`), not an `ASSET_WRITE_OFF` workflow. LOTO uses `assets:loto` (Plant GM also holds HSE). Transport `assets:read` is company-wide but vehicle-class only, unless the person currently holds the kit.
- `GET /assets?view=mine|attention|custody-pending|maintenance|calibration|eol|vehicles|stock|all`. Each asset carries a `me` block and `nextAction`. Notifications use `data.route` `/home/assets/{id}`. Calibration-due is applied lazily (BR-05-08). Vehicles `veh_sedan` / `veh_tanker` stay linked (BR-05-15).
- Deferred: asset requisition workflow, spares consume/restock UI, depreciation-method change, FI-AA CSV, QR scan screen, monthly snapshot job, exit reclaim UI (engine method `reclaimEmployeeAssets` is ready for MOD-16).

---

## 12. MOD-06 — Licence & Compliance

Module dir `compliance`. Models `RegulatoryBody`, `LicenceType`, `Licence`, `LicenceRenewal`, `LicenceChecklistItem`, `LicenceDocument`; read model `v_licence_dashboard`. Workflow per renewal stage when `LicenceType.workflowTemplateKey` set (e.g. fund approval before `APPLICATION_FILED`). Due items at `reminderDays` from `expiresAt`; auto-action `CREATE_LICENCE_RENEWAL` at `leadTimeDays` (default 90).

### 12.1 Renewal stage machine (`LicenceStage`)

`INTERNAL_REVIEW → APPLICATION_FILED → FIELD_INSPECTION → MINISTRY_VETTING → RENEWED`. Back-steps allowed one stage at a time by `compliance:manage` with reason. **Prototype note:** moving a card to stage 5 silently auto-renewed for 365 days; production requires explicit `newExpiresAt` and a `CERTIFICATE` document.

### 12.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/licences` | `compliance:read` | SITE / COMPANY (owner always) | Filters `?bodyCode=`, `?typeId=`, `?siteId=`, `?status=`, `?urgency=CRITICAL\|WARNING\|ACTIVE\|EXPIRED` (≤30 / 31–90 / >90 / ≤0 days), `?stage=` (current renewal), `?expiresBefore=`, `?q=` (title, licenceNo). Sort `expiresAt` default. Embeds `daysToExpiry`, `urgency`, `currentRenewal { id, cycleNo, stage }`, `exposurePerDay`. |
| POST | `/licences` | `compliance:create` | — | `{ typeId, siteId, licenceNo 2–60, title 3–160, ownerUserId, issuedAt, expiresAt > issuedAt, feeAmount?, shutdownRiskPerDay?, criticality }`. Creates due items. |
| GET/PATCH | `/licences/{id}` | `compliance:read` / `compliance:update` | — | Dossier: renewals (latest first) with checklist + documents + workflow. Versioned. |
| POST | `/licences/{id}/renewals` | `compliance:manage` | — | Start renewal cycle (if none open): `cycleNo = max+1`, stage `INTERNAL_REVIEW`, checklist copied from `LicenceType.checklistTemplate`; licence `status = RENEWAL_IN_PROGRESS`. `CONFLICT` if a renewal is open. |
| POST | `/licences/{id}/renewals/{rid}/advance` | `compliance:manage` | — | `{ toStage, note?, data? }` — must be next stage; stage-specific required `data`: `APPLICATION_FILED` → `appliedAt`, (`fundApprovedAt` auto-set when fund workflow APPROVED else `POLICY_VIOLATION` `FUND_NOT_APPROVED`); `FIELD_INSPECTION` → `inspectionAt`, `inspectorName`; `MINISTRY_VETTING` → `auditFindings?`, `feePaidAt`, `chalanNo`; `RENEWED` → `newExpiresAt`, `renewedAt`, certificate document present, checklist no `FAILED`/`PENDING` (`POLICY_VIOLATION` `CHECKLIST_INCOMPLETE`). On RENEWED: licence `expiresAt = newExpiresAt`, `status = ACTIVE`, due items regenerated. Notification `LICENCE_STAGE_CHANGED` to owner + `COMPLIANCE_OFFICER`. |
| POST | `/licences/{id}/renewals/{rid}/back` | `compliance:manage` | — | `{ reason ≥ 10 }` one stage back (not from RENEWED). |
| PATCH | `/licences/{id}/renewals/{rid}/checklist/{itemId}` | `compliance:manage` | — | `{ status: ChecklistStatus, note? }`. |
| POST | `/licences/{id}/documents` | `compliance:update` | — | `{ fileId, kind: CERTIFICATE\|CHALAN\|APPLICATION\|INSPECTION_REPORT\|LETTER }`. |
| POST | `/licences/{id}/letters` | `compliance:dispatch-letter` | — | DO letter `{ channel: "ENOTHI"\|"EMAIL"\|"COURIER", recipient, subject, body }` → PDF rendered (`memoNo = BOGCL/CMD-DO/{bodyCode}-{YYYY}/{NNN}`), stored as `LicenceDocument kind=LETTER`; ENOTHI/EMAIL adapters (stub returns `QUEUED`). Allowed only when `daysToExpiry ≤ 30` or stage ≥ `MINISTRY_VETTING` (`POLICY_VIOLATION` `LETTER_NOT_DUE`). |
| POST | `/licences/{id}/suspend` / `/reinstate` | `compliance:manage` | — | `{ reason }` → `SUSPENDED` / `ACTIVE`. |
| GET | `/licences/dashboard` | `compliance:read` | scope | KPIs: next expiry, total `shutdownRiskPerDay` of CRITICAL/WARNING, counts per stage, per body; `readinessPct` = checklist PASSED / total across open renewals. |
| POST | `/licences/sync` | `compliance:manage` | — | Trigger regulator-status adapter run (`202 { jobId }`); stub in v1. |
| GET/POST/PATCH | `/regulatory-bodies[/{id}]`, `/licence-types[/{id}]` | `admin:compliance-master` ; read `compliance:read` | — | Master data; `LicenceType.checklistTemplate` = `[{ label }]`. |

Errors on `advance`: `INVALID_STATE_TRANSITION` (skipping stages), `POLICY_VIOLATION` as listed, `FORBIDDEN` (owner without `compliance:manage` may only update checklist/documents).

### 12.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/licence_engine.dart`) implements a subset with these differences:

- Register, lazy auto-renewal at `leadTimeDays` (BR-06-03), checklist ticks, stage advance/back, fund approve on the record (`POST /licences/{id}/fund`) instead of a `LICENCE_FUND_APPROVAL` workflow, chairman DO letter (memo number, no e-Nothi). Complete requires `certificateNo` + `newExpiresAt` (BR-06-05/11), not a file upload.
- `GET /licences?view=mine|critical|warning|expired|renewing|all`. Each licence carries a `me` block. Notifications use `data.route` `/home/licences/{id}`. Plant GM (`EMP-0012`) runs site renewals; Finance (`EMP-0062`) approves fees; Chairman sends letters. Urgency bands follow BR-06-01.
- Deferred: certificate file upload, fund workflow, regulator sync, dashboard KPIs, vehicle/driver documents (BR-06-12 stay on MOD-09).

---

## 13. MOD-07 — HSE Incidents & CAPA

Module dir `incidents`. Models `Incident`, `IncidentPerson`, `IncidentRca`, `CapaAction`, `IncidentClosure`. Refs `INC-{YYYY}-{NNN}`, `CAPA-{YYYY}-{NNN}`. Workflow `INCIDENT_CLOSURE` (HSE officer → site manager two-signature closure). Due items: CAPA `dueAt`, statutory `statutoryDueAt`.

### 13.1 Stage machine (`IncidentStage`)

`REPORTED → TRIAGED → UNDER_INVESTIGATION → CAPA_EXECUTION → MANAGEMENT_REVIEW → CLOSED`. Computed on report: `riskScore = severity × likelihood`; `riskCategory`: ≥15 EXTREME, ≥10 HIGH, ≥5 MEDIUM, else LOW; `statutoryReportable = severity ≥ 3 ∨ type ∈ {FATALITY, LOST_TIME, FIRE_THERMAL, SPILL_LEAK(volume ≥ threshold)}`; `statutoryBodyCode` from `Setting hse.statutoryMap[type]` (default `DOEXP`), `statutoryDueAt = occurredAt + 24 h`.

### 13.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/incidents` | `incidents:read` | SELF (reporter/involved) · SITE · COMPANY | Filters `?type=`, `?stage=`, `?riskCategory=`, `?severity=`, `?zone=`, `?siteId=`, `?statutoryReportable=true`, `?occurredAtFrom/To`, `?q=` (incidentNo, title, description). Sort `-occurredAt`, `-riskScore`. Anonymous incidents hide `reporterId` for everyone except `HSE_OFFICER`+`incidents:deanonymise`. |
| POST | `/incidents` | `incidents:report` (every employee; also mobile offline) | — | Report (3-step wizard or Quick Hazard Spotter). |
| GET | `/incidents/{id}` | `incidents:read` | — | Full: people, rca, capas (with owner), closure, attachments, workflow, statutory block. |
| PATCH | `/incidents/{id}` | reporter (REPORTED stage) or `incidents:manage` | — | Versioned. |
| POST | `/incidents/{id}/triage` | `incidents:triage` (HSE_OFFICER, PLANT_GM) | — | `{ severity 1–5, likelihood 1–5, investigatorId, zone?, statutoryReportable? (override with reason) }` → TRIAGED (recomputes risk). |
| POST | `/incidents/{id}/investigate` | investigator or `incidents:manage` | — | TRIAGED → UNDER_INVESTIGATION. |
| PUT | `/incidents/{id}/rca` | investigator | — | `{ why1..why5 (each ≤ 500), rootCause 10–2000, fishbone: { Equipment?, Procedure?, Material?, Staffing?, Inspection?, Environment? } }` → upsert `IncidentRca`; `completedAt` set when `rootCause` present. |
| POST | `/incidents/{id}/people` / DELETE `/{pid}` | investigator | — | `{ employeeId? \| name, role: PersonRole, injuryDesc? }`. |
| POST | `/incidents/{id}/capas` | `incidents:capa` | — | `{ type: CapaType, description ≥ 10, ownerUserId, priority, dueAt ≥ today }` → `CapaAction PENDING`; first CAPA moves stage to `CAPA_EXECUTION` (requires RCA completed else `POLICY_VIOLATION` `RCA_REQUIRED`); notification `CAPA_ASSIGNED`; due item. |
| POST | `/capas/{id}/start` / `/complete` / `/verify` | owner / owner / `incidents:capa-verify` | — | `PENDING → IN_PROGRESS → COMPLETED (evidence ≥ 10 chars or attachment) → VERIFIED (verifiedById)`. Nightly job flips past-due open CAPAs to `OVERDUE` (notification `CAPA_DUE`). |
| GET | `/capas` | `incidents:read` | owner/site/company | `?ownerUserId=me&status=&dueBefore=&incidentId=`. |
| POST | `/incidents/{id}/statutory/submit` | `incidents:statutory` | — | `{ bodyCode, submittedAt, receiptNo, fileId? }` → sets `statutoryReceiptNo`; due item DONE; generates Form B-12 PDF (`GET /incidents/{id}/statutory/form`). |
| POST | `/incidents/{id}/review` | `incidents:close` | — | CAPA_EXECUTION → MANAGEMENT_REVIEW; requires all CAPAs `VERIFIED` (`POLICY_VIOLATION` `CAPA_OPEN` with list). Creates `IncidentClosure` (safetyOfficerId = caller if HSE, managerId = site PLANT_GM) and submits `INCIDENT_CLOSURE` workflow. |
| POST | `/incidents/{id}/close` | `incidents:close` + closure signatory | — | Each signatory calls once (`{ remarks?, signature? }`) → sets `safetySignedAt` / `managerSignedAt`; when both set → `CLOSED`. `FORBIDDEN` if caller is neither; `INVALID_STATE_TRANSITION` unless MANAGEMENT_REVIEW. |
| POST | `/incidents/{id}/reopen` | `incidents:manage` | — | CLOSED → CAPA_EXECUTION `{ reason }`. |
| POST | `/incidents/{id}/attachments` | reporter/investigator | — | `{ fileId, kind: PHOTO\|REPORT\|EVIDENCE }`. |
| POST | `/incidents/{id}/escalate` | `incidents:manage` | — | Emergency escalation `{ channels: [SMS, PUSH], recipients: ROLE keys }` — CRITICAL notification with ack (prototype "Emergency Siren & Drill"; SCADA valve isolation is **not** in scope). |
| GET | `/incidents/kpis` | `incidents:read` | scope | `{ safeDays, safeManHours, trir, capaCompletionPct, statutoryOpen, matrix: number[5][5] }` (`safeManHours` = headcount × hours from attendance). |
| GET | `/incidents/{id}/pdf` | `incidents:read` | — | Investigation report PDF. |

### 13.3 Report

```json
// POST /incidents
{ "type": "SPILL_LEAK", "title": "Bitumen seepage at TK-102 flange", "description": "…", "siteId": "s-ker…", "zone": "Tank Farm A",
  "occurredAt": "2026-11-01T06:40:00Z", "severity": 3, "likelihood": 3, "shift": "Morning Shift (07:00 - 15:00)",
  "immediateActions": "Area cordoned, spill kit deployed", "isAnonymous": false,
  "people": [ { "employeeId": "e-…", "role": "WITNESS" } ], "attachmentFileIds": ["f-photo…"], "lat": "23.70", "lng": "90.38" }
// 201 → { "data": { "id": "i1…", "incidentNo": "INC-2026-041", "stage": "REPORTED", "riskScore": 9, "riskCategory": "MEDIUM",
//           "statutoryReportable": true, "statutoryBodyCode": "DOEXP", "statutoryDueAt": "2026-11-02T06:40:00Z" } }
```

Validation: `type ∈ IncidentType`; `title` 5–160; `description` 20–10 000 (Quick Spotter: ≥ 10 with `quick=true`); `occurredAt ≤ now` and ≥ now − 30 days; `severity/likelihood` int 1–5; `people ≤ 20`; `isAnonymous=true` nulls `reporterId` but keeps `AuditLog.actorUserId` (sealed, `admin:audit-read` only). Side-effects: notifications `INCIDENT_REPORTED` to `HSE_OFFICER` + site `PLANT_GM`; `riskCategory ∈ {HIGH, EXTREME}` → `INCIDENT_CRITICAL` (CRITICAL, ack) + socket `incident:critical` to CHAIRMAN too; statutory due item. Offline: `Idempotency-Key` honoured; attachments uploaded after reconnect via `/incidents/{id}/attachments`.

### 13.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/incident_engine.dart`) implements a subset with these differences:

- Risk uses BR-07-01 (`EXTREME ≥ 16`). Statutory bodies follow BR-07-03 (DIFE / DOENV / FSCD / DOEXP / BRTA). RCA needs why1–why3 and a root cause. CAPA overdue is applied lazily. The last VERIFIED CAPA moves the incident to `MANAGEMENT_REVIEW`.
- Closure is two signatures on the record (`POST /incidents/{id}/close`), not an `INCIDENT_CLOSURE` workflow. The Plant GM persona also holds `HSE_OFFICER`, so the same login signs as safety then as plant head.
- `GET /incidents?view=mine|open|serious|statutory|to-triage|my-capa|all`. Each incident carries a `me` block. Anonymous reports hide the reporter except from `incidents:manage`. Notifications use `data.route` `/home/incidents/{id}`.
- One plant safety lead (`EMP-0012`). Employees report from any site; HSE/GM see plant-scope records. A CAPA on the gantry fire is owned by Tanvir so he can start and finish it; Harunur confirms other people's fixes.
- Deferred: 5×5 matrix UI, Form B-12 PDF, incident workflow template, auto work-order from equipment damage, hourly statutory reminders, GPS on report.

---

## 14. MOD-08 — Guest & VIP Passes

Module dir `visitors`. Models `Visitor`, `Visit`, `VisitPpe`, `VisitZone`, `VisitInspectionFinding`, `Watchlist`. Ref `VIS-{YYYY}-{NNNN}`. Workflow `VISIT_VIP_APPROVAL` for `category ∈ {VIP, GOVT}` or any RED zone (approver: site PLANT_GM / Chairman's office). Due item: pass expiry (`expectedEndAt`) → `OVERDUE` when still CHECKED_IN.

### 14.1 Status machine (`VisitStatus`)

`PRE_REGISTERED → (APPROVED | DENIED) → CHECKED_IN → CHECKED_OUT`; `CHECKED_IN → OVERDUE` (job) `→ CHECKED_OUT`; `PRE_REGISTERED|APPROVED → CANCELLED`. Visits not requiring approval go `PRE_REGISTERED → APPROVED` automatically on create. **Prototype note:** `overdue` was unreachable; production sets it by job at `expectedEndAt + 30 min`.

### 14.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/visits` | `visitors:read` | SELF (host) · SITE (gate/reception) · COMPANY | Filters `?status=`, `?category=`, `?siteId=`, `?hostUserId=me`, `?inside=true` (CHECKED_IN/OVERDUE), `?expectedOn=YYYY-MM-DD`, `?vip=true` (VIP+GOVT), `?q=` (visitNo, visitor name, organisation, vehiclePlate). Sort `expectedAt`. |
| POST | `/visits` | `visitors:create` (any employee as host; RECEPTION on behalf) | — | Pre-register (creates/links `Visitor` by phone). Watchlist/blacklist check → `POLICY_VIOLATION` `WATCHLIST_MATCH` (details only to `visitors:watchlist`). |
| GET | `/visits/{id}` | `visitors:read` | host/site | Full: visitor (idProof masked), ppe, zones, findings, escort, workflow, `passUrl`. |
| PATCH | `/visits/{id}` | host or `visitors:manage` | — | PRE_REGISTERED/APPROVED only; versioned. |
| POST | `/visits/{id}/approve` / `/deny` | `visitors:approve` + approver | — | Workflow wrappers (VIP/GOVT/RED zone). |
| POST | `/visits/{id}/cancel` | host | — | `{ reason }`. |
| POST | `/visits/{id}/check-in` | `visitors:gate` (SECURITY_GATE, RECEPTION) | site | See 14.3. |
| POST | `/visits/{id}/ppe` | `visitors:gate` or `HSE_OFFICER` | site | `{ hardHat, goggles, shoes, hiVisVest, h2sBriefing }` → `VisitPpe` with `clearedById/At`. Required before check-in at plant/terminal sites when any zone is YELLOW/RED (`POLICY_VIOLATION` `PPE_NOT_CLEARED`). |
| POST | `/visits/{id}/zones` / DELETE | host or `visitors:manage` | — | `{ zone 2–80, level: ZoneLevel, escortRequired }`; RED requires `escortUserId` on the visit. |
| POST | `/visits/{id}/findings` | `visitors:inspect` (HSE, host) | — | `{ area, finding ≥ 5, status: FindingStatus }`; `CRITICAL` → notification to HSE_OFFICER. |
| POST | `/visits/{id}/check-out` | `visitors:gate` | site | `{ badgeReturned: boolean, note? }` → CHECKED_OUT (`badgeReturned=false` → finding `OBSERVATION` auto-added). |
| POST | `/visits/{id}/extend` | host | — | `{ expectedEndAt }` ≤ +8 h; clears OVERDUE back to CHECKED_IN. |
| GET | `/visits/{id}/pass` | host/visitor-link | — | Gate-pass PDF with QR (`qrToken`); public variant `GET /gate-pass/{qrToken}` (no auth, rate-limited, shows name/date/site only) for the WhatsApp/SMS/Email link sent via `POST /visits/{id}/send-pass { channels }`. |
| POST | `/visits/scan` | `visitors:gate` | site | `{ qrToken \| visitNo \| vehiclePlate }` → resolves visit and returns the check-in preconditions (`approved`, `ppeCleared`, `escortPresent`, `watchlist`). Used by "Fast Gate Scan"/ANPR adapter. |
| GET | `/visits/muster` | `visitors:gate` or `HSE_OFFICER` | site | `{ active, visits: [{ id, name, zone, musterSafeAt }] }` — everyone CHECKED_IN/OVERDUE on site. |
| POST | `/visits/muster/start` / `/end` | `HSE_OFFICER`, `SECURITY_GATE` | site | Evacuation roll-call session (Redis flag); socket `visit:muster`; CRITICAL notification to hosts/escorts. |
| POST | `/visits/{id}/muster-safe` | gate/host/escort | site | Sets `musterSafeAt`; `POST /visits/muster/mark-all-safe` for bulk. |
| GET | `/visitors` / `/visitors/{id}` / PATCH | `visitors:read` / `visitors:manage` | — | Visitor master; `idProofNoEnc` decrypted only for `visitors:pii`. `POST /visitors/{id}/blacklist { reason }` (`visitors:watchlist`). |
| GET/POST/DELETE | `/watchlist[/{id}]` | `visitors:watchlist` | — | `{ fullName, phone?, idProofNo? (hashed on write), reason }`. |
| GET | `/visits/kpis` | `visitors:read` | site | `{ insideNow, expectedToday, vipInside, ppeCompliancePct, overdue }`. |

### 14.3 Create and check-in

```json
// POST /visits
{ "visitor": { "fullName": "Dr. Laurent Michaud", "organisation": "Axens", "phone": "+33612345678", "email": "…",
               "idProofType": "Passport", "idProofNo": "19FV…", "category": "VIP" },
  "siteId": "s-ker…", "category": "VIP", "vipTier": "VVIP_L1", "purpose": "Catalyst licensing review",
  "expectedAt": "2026-11-03T04:00:00Z", "expectedEndAt": "2026-11-03T10:00:00Z", "escortUserId": "u-gm…",
  "vehiclePlate": "DHAKA METRO GHA-13-8821", "parkingSlot": "VIP-1",
  "zones": [ { "zone": "Control Room", "level": "YELLOW", "escortRequired": true }, { "zone": "Tank Farm A", "level": "RED", "escortRequired": true } ],
  "hospitality": { "executiveSuite": "Boardroom 2", "dietaryPreferences": "Halal, no shellfish" }, "notes": "…" }
// 201 → { "data": { "id": "v1…", "visitNo": "VIS-2026-0811", "status": "PRE_REGISTERED", "workflow": { "status": "SUBMITTED", … } } }
```

Validation: `visitor.fullName` 2–120; `phone` E.164; `idProofType ∈ NID|PASSPORT|GOVT_BADGE|COMPANY_ID` (+ `idProofNo` required for VIP/GOVT/CONTRACTOR); `expectedAt ≥ now − 1 h`, `expectedEndAt ≤ expectedAt + 24 h`; `vipTier` required iff `category ∈ {VIP, GOVT}`; `zones ≤ 10`; `hostUserId` defaults to caller (RECEPTION may set another). `hospitality` is stored in `Visit.notes` JSON block (**schema gap**, §25).

```json
// POST /visits/{id}/check-in
{ "badgeNo": "VIP-02", "vehiclePlate": "DHAKA METRO GHA-13-8821", "photoFileId": "f-…", "ndaSigned": true, "safetyBriefingDone": true }
// 200 → { "data": { "status": "CHECKED_IN", "checkedInAt": "…", "badgeNo": "VIP-02", "escort": { … } } }
```

Rules: status must be `APPROVED` (`INVALID_STATE_TRANSITION`; `PRE_REGISTERED` with pending VIP approval → `POLICY_VIOLATION` `APPROVAL_PENDING`); `expectedAt − 2 h ≤ now ≤ expectedEndAt` else `POLICY_VIOLATION` `OUTSIDE_WINDOW` (gate supervisor override with `overrideReason`); PPE rule (14.2); RED zone requires escort check-in presence (escort must be punched-in today per MOD-10 else `ESCORT_ABSENT`); `badgeNo` unique among currently inside visits per site. Notifications `VISIT_ARRIVED` to host (+ escort); socket `visit:status`; pass due item created.

### 14.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/visitor_engine.dart`) implements a subset with these differences:

- Visitor master is reused by normalised phone. ID numbers are stored hashed with last-4 only; the wire never returns the full number. There is no public `/gate-pass/{token}` or SMS: the 6-digit-style QR is the `qrToken` on the in-app pass PDF.
- Regular / vendor / client / contractor visits auto-approve unless any selected zone is RED. VIP, GOVT and any RED-zone visit stay `PRE_REGISTERED` until `POST /visits/{id}/approve` (`visitors:approve`). There is no `VISIT_VIP_APPROVAL` workflow instance.
- Watchlist is an exact name or phone match. A hit blocks approve and check-in until `POST /visits/{id}/watchlist { action: clear|deny }` (`visitors:watchlist`). Blacklist throws `VISITOR_BLACKLISTED`.
- Check-in always needs a `PHOTO` file. YELLOW/RED zones need PPE cleared in the last 12 hours; RED also needs an escort who works at the site. Badge numbers are `BDG-{HQ|PLT|CTG}-NN`, `VIP-NN` or `GOVT-NN`. Overstay (`OVERDUE`) is applied lazily at `expectedEndAt + 30 min`. Hosts may extend twice, up to 8 hours.
- `GET /visits?view=mine|expected|inside|overdue|to-approve|all`. Each visit carries a `me` block of booleans. `POST /visits/scan { q }` matches visit number, token, plate or badge. Muster is a per-site flag (`/visits/muster/start|end`, `/visits/{id}/muster-safe`).
- HQ reception is the HR Admin persona (`visitors:gate` at site). Plant gate and HSE (on the Plant GM account) share `visitors:gate`. Chairman holds `visitors:approve` at company scope.
- Deferred: Levenshtein watchlist, public pass link, ANPR/barrier, hospitality JSON, incident auto-create from CRITICAL findings, escort punch-in check, site-capacity override UI, WhatsApp/SMS.

---

## 15. MOD-09 — Fleet & Dispatch

Module dir `fleet`. Models `Driver`, `Vehicle`, `VehicleDocument`, `VehicleRequisition`, `Trip`, `TripEvent`, `FuelVoucher`, `TollClaim`, `FleetChatMessage`. Refs `REQ-{YYYY}-{NNNN}`, `PASS-{YYYY}-{NNNN}`, `FUEL-{YYYY}-{NNNN}`, `TOL-{YYYY}-{NNNN}`. Workflow `VEHICLE_REQUISITION` (HOD endorsement; Finance when `estimatedCost > Setting fleet.financeAbove`). Due items: `VehicleDocument.expiresAt`, `Driver.licenceExpiresAt`, `nextServiceKm` (odometer-triggered).

### 15.1 Requisition status machine (`RequisitionStatus`)

`DRAFT → PENDING_APPROVAL → APPROVED → ASSIGNED → IN_TRANSIT → COMPLETED`; `PENDING_APPROVAL → REJECTED`; `DRAFT|PENDING_APPROVAL|APPROVED|ASSIGNED → CANCELLED` (requester; ASSIGNED cancel notifies driver). Trip events: `ASSIGNED → GATE_OUT → CHECKPOINT* → GATE_IN → COMPLETED`, plus `SOS`, `ROUTE_DEVIATION`, `NOTE`.

### 15.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/vehicle-requisitions` | `fleet:request` (SELF) · `fleet:endorse` (DEPARTMENT) · `fleet:dispatch` (SITE/COMPANY) · `fleet:drive` (assigned to me) | per permission | Filters `?status=`, `?departAtFrom/To`, `?departmentId=`, `?priority=`, `?capacityClass=`, `?requesterId=me`, `?driverId=me`, `?pooled=true`, `?q=` (reqNo, purpose, destination). Sort `departAt`, `-createdAt`, `-priority`. |
| POST | `/vehicle-requisitions` | `fleet:request` | — | Create & submit (or `?draft=true`). |
| GET | `/vehicle-requisitions/{id}` | as list | — | Full + `trip` (vehicle, driver with phone, events, tolls, cost) + `workflow` + `chatChannel = "REQ:{id}"`. |
| PATCH | `/vehicle-requisitions/{id}` | requester | — | DRAFT/RETURNED; versioned. |
| POST | `/vehicle-requisitions/{id}/submit` | requester | — | DRAFT → PENDING_APPROVAL (workflow). |
| POST | `/vehicle-requisitions/{id}/approve` / `/reject` / `/return` | `fleet:endorse` + current approver | — | Workflow wrappers; approve → APPROVED; reject `{ comment }` → REJECTED (`rejectionReason`). Notification `FLEET_REQ_ENDORSE` on submit, `APPROVAL_DECIDED` after. |
| POST | `/vehicle-requisitions/{id}/assign` | `fleet:dispatch` | site | `{ vehicleId, driverId, dispatchNote?, startKm? }` → creates `Trip` (`passNo`), status ASSIGNED. Vehicle and driver statuses do **not** change until gate-out; they are considered *reserved* by the open trip (overlap checks use trips, not status). Preconditions: requisition APPROVED; vehicle `AVAILABLE`, no overlapping open trip, `capacity ≥ passengerCount`, all `VehicleDocument`s valid at `departAt` (`POLICY_VIOLATION` `VEHICLE_DOC_EXPIRED`), hazmat vehicle ⇒ driver `licenceClass=HEAVY_HAZMAT`; driver `AVAILABLE`, licence valid, `dutyHoursToday + estimated ≤ 12` (`DRIVER_DUTY_LIMIT`), breathalyzer PASSED within 12 h if `Setting fleet.requireBreathalyzer`. Notifications `FLEET_ASSIGNED` to requester (with driver phone/plate) and driver (push CRITICAL if `departAt < 2 h`); socket `trip:status`; trip pass PDF rendered. |
| POST | `/vehicle-requisitions/{id}/reassign` | `fleet:dispatch` | site | Same body; allowed while ASSIGNED; event `NOTE`. |
| POST | `/vehicle-requisitions/{id}/cancel` | requester or `fleet:dispatch` | — | `{ reason }`. |
| POST | `/vehicle-requisitions/pool` | `fleet:dispatch` | site | `{ primaryId, secondaryIds: uuid[] ≤ 3, vehicleId, driverId }` — all APPROVED, `departAt` within ±45 min, same origin site, combined passengers ≤ capacity, destination similarity check (`Setting fleet.poolMaxDetourKm`, haversine on `stops`/destination coords) else `POLICY_VIOLATION` `POOL_INCOMPATIBLE`; secondaries get `pooledWithId`, one `Trip`. **Prototype note:** replaces the hard-coded REQ-441+443 merge. |
| POST | `/vehicle-requisitions/estimate` | `fleet:request` | — | `{ origin, destination, stops[], tripType, passengerCount, departAt }` → `{ estimatedKm, estimatedMinutes, estimatedFuelL, estimatedCost, suggestedCapacityClass }`. Cost = `Setting fleet.baseFare` (1400) + stops × 350 + (ROUND_TRIP ? 950 : 0) + km × `ratePerKm`; distances from `Setting fleet.distanceMatrix` until a maps adapter exists. |

**Trips (driver console, gate)**

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/trips` | `fleet:dispatch` / `fleet:gate` (site) / `fleet:drive` (mine) | `?status=OPEN\|CLOSED&driverId=me&date=&vehicleId=`. |
| GET | `/trips/{id}` | participant | Trip + requisition summary + events + tolls + fuel. |
| POST | `/trips/{id}/arrive` | driver | Event `NOTE` "Arrived at pickup"; notification to requester. |
| POST | `/trips/{id}/gate-out` | driver or `fleet:gate` | `{ odometerKm ≥ vehicle.odometerKm, lat?, lng?, passengersOnBoard? }` → `startKm`, `gateOutAt`, requisition IN_TRANSIT, vehicle IN_TRANSIT, driver ON_TRIP; event `GATE_OUT`. `INVALID_STATE_TRANSITION` unless ASSIGNED. |
| POST | `/trips/{id}/checkpoint` | driver | `{ lat, lng, odometerKm?, note? }` event `CHECKPOINT` (offline-capable). |
| POST | `/trips/{id}/location` | driver | `{ lat, lng, speedKph?, heading?, at }` — high-frequency, **not persisted per point**; Redis last-known + socket `trip:location`; every 5 min sampled into `TripEvent CHECKPOINT`. |
| POST | `/trips/{id}/sos` | driver | `{ lat, lng, note? }` → event `SOS`, CRITICAL notification `FLEET_SOS`, socket `fleet:sos`, system message in `SOS` fleet channel. |
| POST | `/trips/{id}/gate-in` | driver or `fleet:gate` | `{ odometerKm ≥ startKm, lat?, lng? }` → `gateInAt`, event `GATE_IN`. |
| POST | `/trips/{id}/complete` | driver or `fleet:dispatch` | `{ endKm (≥ startKm, required if no gate-in), rating 1–5?, feedback ≤ 500? }` → requisition COMPLETED, vehicle AVAILABLE (`odometerKm = endKm`), driver AVAILABLE (`dutyHoursToday += actual hours`, `totalTrips+1`), `totalCost` = fuel + approved tolls + km × rate; event `COMPLETED`; notification `FLEET_TRIP_COMPLETED` to requester (rating prompt). `INVALID_STATE_TRANSITION` unless IN_TRANSIT. |
| POST | `/trips/{id}/rate` | requester | `{ rating, feedback? }` within 7 days of completion. |
| GET | `/trips/{id}/pass` | participant / gate | Trip challan pass PDF (barcode `*BOGCL-TRIP-{passNo}*`). |
| GET | `/trips/manifest` | `fleet:gate` | Gate roster PDF `?siteId=&date=`. |

**Tolls & fuel**

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| POST | `/trips/{id}/tolls` | driver | `{ plaza 2–80, amount zMoney ≤ 5000, photoFileId? (required > 200), receiptNo? }` → `TollClaim PENDING` (+ `FleetChatMessage type=TOLL_CLAIM` in `REQ:{id}`); notification `FLEET_TOLL_SUBMITTED` to dispatcher. |
| POST | `/toll-claims/{id}/approve` / `/reject` | `fleet:tolls-approve` | approve adds to `Trip.totalCost`, system chat message; reject `{ reason }`. |
| POST | `/toll-claims/{id}/pay` | `FINANCE` (`fleet:tolls-pay`) | `{ paidAt?, voucherNo }` → PAID. |
| GET | `/toll-claims` | dispatcher/finance/driver(mine) | `?status=&driverUserId=&from=&to=`. |
| POST | `/fuel-vouchers` | `fleet:fuel` | `{ vehicleId, tripId?, station 2–80, fuelType, liters (0.1–`tankLiters`), amount?, odometerKm? }` → `FuelVoucher` with `qrToken`; **Prototype note:** the prototype never persisted the voucher. |
| POST | `/fuel-vouchers/{id}/redeem` | `fleet:fuel` or station device token | `{ qrToken }` → `redeemedAt`; `CONFLICT` if already redeemed. |
| GET | `/fuel-vouchers` | `fleet:fuel` | `?vehicleId=&redeemed=&from=&to=`; `/fuel-vouchers/{id}/pdf`. |

**Vehicles & drivers (master)**

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET/POST/PATCH | `/vehicles[/{id}]` | read `fleet:read`; write `fleet:manage-vehicles` | `plateNo` `^[A-Z ]+-\d{2}-\d{4}$` (BRTA format) unique; `type ∈ VehicleType`; `capacity 1–60`; `isHazmat` requires `HAZMAT_PERMIT` doc. Filters `?type=&status=&siteId=&docExpiringDays=`. Embeds `documents[]`, `currentTrip`, `assetId`. |
| POST | `/vehicles/{id}/status` | `fleet:manage-vehicles` | `{ status: MAINTENANCE\|GROUNDED\|AVAILABLE\|RETIRED, reason?, until? }`; cannot change while open trip (`CONFLICT`). RETIRED terminal; also moves linked `Asset` to DECOMMISSIONED. |
| GET/POST/PATCH/DELETE | `/vehicles/{id}/documents[/{did}]` | `fleet:manage-vehicles` | `kind ∈ FITNESS\|TAX_TOKEN\|ROUTE_PERMIT\|INSURANCE\|HAZMAT_PERMIT`, `expiresAt`, `fileId`; due items. |
| GET/POST/PATCH | `/drivers[/{id}]` | read `fleet:read`; write `fleet:manage-drivers` | `employeeId` (must be ACTIVE employee), `driverCode` minted `DRV-{NN}`, `licenceNo`, `licenceClass`, `licenceExpiresAt > today`. Filters `?status=&licenceClass=&available=true`. |
| POST | `/drivers/{id}/status` | `fleet:manage-drivers` or self (`OFF_DUTY`/`REST_REQUIRED` only) | `{ status: DriverStatus, reason?, until? }`; not allowed while ON_TRIP. |
| POST | `/drivers/{id}/breathalyzer` | `fleet:manage-drivers`, `fleet:gate` | `{ result: "PASSED"\|"FAILED", bac?: "0.00", deviceId? }` → `lastBreathalyzerAt/Result`; FAILED sets `SUSPENDED` + notification to transport admin + HR. |
| GET | `/fleet/kpis` | `fleet:read` | `{ vehicles: { available, inTransit, maintenance }, drivers: {…}, openRequisitions, tripsToday, fuelCostMonth, docsExpiring30d }`. |
| GET | `/fleet/notifications` | — | Alias of `/notifications?module=fleet` (prototype drawer). |

**Fleet chat** — REST mirror of `/chat` namespace fleet events: `GET /fleet/chat/{channel}/messages?cursor=` (`channel` = `REQ:{id}`|`DESK`|`BROADCAST`|`SOS`; membership: requester/driver/dispatcher for REQ, dispatchers+drivers for DESK/SOS, dispatchers write / all fleet read BROADCAST), `POST /fleet/chat/{channel}/messages { type, body?, data?, fileId? }`. **Prototype note:** scripted auto-replies and the simulated VoIP call are removed; "Call driver" opens the native dialer with `Driver.phone`.

### 15.3 Create requisition

```json
// POST /vehicle-requisitions
{ "purpose": "Keraniganj turnaround planning meeting", "tripType": "ROUND_TRIP",
  "origin": "HQ Baridhara", "destination": "Keraniganj Plant", "stops": [ { "label": "Babubazar Bridge", "waitMinutes": 15 } ],
  "departAt": "2026-11-03T03:30:00Z", "returnAt": "2026-11-03T11:00:00Z",
  "passengers": [ { "employeeId": "e-1042…" }, { "name": "Vendor rep — Energypac" } ], "capacityClass": "SEDAN_4",
  "priority": "NORMAL", "costCenter": "CC-BOGCL-2026", "phone": "+8801711000000" }
// 201 → { "data": { "id": "r1…", "reqNo": "REQ-2026-0441", "status": "PENDING_APPROVAL", "estimatedKm": "76.80",
//           "estimatedCost": "2700.00", "workflow": { "status": "SUBMITTED", "currentApprover": { "name": "Farida Begum" } } } }
```

Validation: `purpose` 5–300; `origin/destination` 2–160; `stops ≤ 6`, each `label` 2–120, `waitMinutes 0–240`; `departAt ≥ now + 30 min` (admins may backdate ≤ 24 h with `priority=CRITICAL`); `returnAt > departAt` and required for ROUND_TRIP; `passengers 1–7` (> 4 forces `MICROBUS_7` or higher else `POLICY_VIOLATION` `CAPACITY_CLASS`); `passengerCount` = `passengers.length`; `departmentId` = requester's; `phone` zPhoneBd. Estimate fields computed server-side (15.2 `/estimate`). Submit side-effects: workflow instance, `FLEET_REQ_ENDORSE` to HOD, `inbox:changed`.

### 15.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/fleet_engine.dart`) implements a subset with these differences:

- Create is always a `DRAFT`; `POST /vehicle-requisitions` with `submit: true` (or `POST …/submit`) starts `VEHICLE_REQUISITION`. There is no Finance step, pooling, GPS stream, fleet chat, maps adapter, or vehicle/driver CRUD UI.
- Estimate is `GET /fleet/estimate` (destination presets: Keraniganj Plant, Chattogram Terminal, Head Office). Cost is the flat fare + stops + round-trip surcharge; km × rate is applied only when the trip completes.
- Assign reserves the vehicle and driver (`reservedTripId`) without changing their status. Gate-out (±120 min of `departAt`, transport may override) sets IN_TRANSIT. One loginable driver (`EMP-0821`, LIGHT, breathalyzer PASSED).
- `GET /vehicle-requisitions?view=mine|driving|to-endorse|dispatch|live|all`. Each requisition carries a `me` block. Notifications use `data.route` `/home/fleet/{id}`.
- SOS: `POST /trips/{id}/sos` (CRITICAL `FLEET_SOS`, ack required) and standalone `POST /fleet/sos` (list at `/home/fleet/sos`). Tolls over ৳200 need a photo. Fuel vouchers are issued from the engine (`/fuel-vouchers`) without a dedicated screen.
- HOD endorsement uses the existing template: same-department head, else the line manager (Farida Begum endorses Tanvir Rahman). HQ reception / plant gate is the Transport persona (`fleet:gate`). Chairman and Plant GM have `fleet:read`.
- Deferred: pooling, live GPS, fleet chat, breathalyzer capture UI, parcel-linked trips (BR-04-10), vehicle/driver master screens.

---

## 16. MOD-10 — Attendance & Leave

Module dirs `attendance`, `leave`. Models `Shift`, `ShiftAssignment`, `AttendancePunch`, `AttendanceDay`, `Regularisation`, `LeaveType`, `LeaveBalance`, `LeaveRequest`, `Geofence`; read model `v_attendance_live`. Refs `LV-{YYYY}-{NNN}`, `REG-{YYYY}-{NNN}`. Workflows `LEAVE_REQUEST` (line manager; HR for > 5 days or `ML`), `REGULARISATION` (line manager). **Prototype note:** the prototype had no geolocation, no haversine and never called the store; production implements doc 00 §6.7 server-side.

### 16.1 Attendance

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/attendance/punch` | `attendance:punch` | self | Geo-fenced punch (mobile; web allowed only from whitelisted office IPs with `Setting attendance.webPunchCidrs`). Offline queue + `Idempotency-Key` (stored on `AttendancePunch.idempotencyKey`). |
| GET | `/attendance/me/today` | `attendance:punch` | self | `{ date, shift, day: AttendanceDay, nextPunchType, overtimeMinutesMtd, nearestGeofence: { id, site, name, nameBn, distanceM, inside } }` (nearest fence computed from `?lat&lng` if given). `AttendanceDay` = `{ date, status, firstInAt, lastOutAt, lateMinutes, workedMinutes, overtimeMinutes, site, holiday, flags { missingOut, earlyLeave, pendingReview }, leave, punches[] }`. |
| GET | `/geofences` | any authenticated | — | Active geofences `{ id, site, name, centerLat, centerLng, radiusMeters }`. |
| GET | `/attendance/me` | `attendance:punch` | self | My `AttendanceDay`s `?from=&to=` + monthly summary (`present, late, absent, leave, overtimeMinutes`). |
| GET | `/attendance/live` | `attendance:read` | TEAM / DEPARTMENT / SITE / COMPANY | Today's roster from `v_attendance_live`: `?siteId=&departmentId=&status=&q=`; embeds `insideFence` (last accepted punch within fence and no OUT), `distanceM`. Socket `attendance:punch` keeps it live. |
| GET | `/attendance/days` | `attendance:read` | scope | `?employeeId=&from=&to=&status=`; `?format=csv` muster export (`attendance:export`). |
| GET | `/attendance/kpis` | `attendance:read` | scope | `{ present, late, absent, onLeave, fieldDuty, headcount, overtimeCost }`. |
| GET/POST/PATCH | `/attendance/shifts[/{id}]` | `attendance:manage-shifts` | — | `Shift` master (`startTime/endTime HH:mm`, `graceMinutes 0–60`, `isNight`). |
| GET/POST/DELETE | `/attendance/shift-assignments` | `attendance:manage-shifts` | dept/site | `{ employeeId, shiftId, startsOn, endsOn? }`; overlapping → `CONFLICT`. |
| POST | `/attendance/regularisations` | `attendance:punch` | self | `{ date ≤ today, ≥ today−7 (the mock enforces 7 days; `FIELD_DUTY` may be up to 30 days ahead), type: RegularisationType, requestedIn?, requestedOut?, reason ≥ 10, attachmentFileId? }` → PENDING + workflow. `FIELD_DUTY` for a future date acts as pre-approval (`fieldDutyApproved`). |
| GET | `/attendance/regularisations` | self / `attendance:approve-regularisation` | scope | `?status=&employeeId=&from=&to=`. |
| POST | `/attendance/regularisations/{id}/approve` / `/reject` | `attendance:approve-regularisation` + approver | — | Approve → `AttendanceDay` recomputed (`PENDING_REGULARISATION` punches become effective; `FIELD_DUTY` day status). |
| POST | `/attendance/recompute` | `attendance:manage-shifts` | — | `{ date, employeeIds? }` admin recompute job. |

```json
// POST /attendance/punch
{ "type": "IN", "punchedAt": "2026-11-01T03:02:11Z", "lat": "23.812345", "lng": "90.421111", "accuracyM": "12.4",
  "isMockLocation": false, "platform": "ANDROID", "deviceId": "a1b2…", "siteId": "s-hq…", "selfieFileId": null }
// 201 ACCEPTED
{ "data": { "id": "p1…", "result": "ACCEPTED", "geofence": { "id": "g-hq…", "name": "HQ Baridhara 300 m", "distanceM": "42.10" },
            "day": { "status": "PRESENT", "lateMinutes": 0, "firstInAt": "2026-11-01T03:02:11Z" } } }
// 201 REJECTED (record kept for audit)
{ "data": { "id": "p2…", "result": "REJECTED_OUTSIDE_FENCE", "geofence": { "id": "g-hq…", "distanceM": "812.00" },
            "canRegularise": true } }
```

Rules (doc 00 §6.7): `type ∈ PunchType`; `punchedAt` within ±10 min of server time (else clamped & flagged `NOTE`); `lat/lng` required; `accuracyM ≤ 50` else `REJECTED_ACCURACY`; `isMockLocation=true` (or OS mock-provider flag / rooted-device signal) → `REJECTED_MOCK`; haversine to nearest active `Geofence` of `siteId` (or any site if omitted) must be ≤ `radiusMeters` (+`accuracyM/2` tolerance) or point-in-polygon, else `REJECTED_OUTSIDE_FENCE` — unless an approved `FIELD_DUTY` regularisation covers the day → `ACCEPTED` with day status `FIELD_DUTY`; duplicate `IN` without `OUT` within 2 min → `CONFLICT`; `deviceId` must match the session's `X-Device-Id` and, when `Setting attendance.bindDevice=true`, the employee's registered device (`POLICY_VIOLATION` `DEVICE_MISMATCH`). Rejected punches return `201` with the rejection `result` (not an error) so the client can offer regularisation; they emit `ATT_PUNCH_REJECTED`. `AttendanceDay` is recomputed synchronously (late = `firstIn − shift.start − grace`). Biometric/face matching is **not** server-side in v1 (optional selfie stored for audit). Socket `attendance:punch`.

### 16.2 Leave

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/leave/policy` | any auth | — | `{ weekendDays (1=Mon…7=Sun), holidays[{date,name,nameBn}], maxConsecutiveCl, hrReviewAboveDays, backdateDays, backdateTypes, docRequiredAboveDays, reasonMin, reasonMax }` so clients show the day count and rule hints before submitting (pitch mock; server remains authoritative). |
| GET | `/leave/types` | any auth | — | `LeaveType` list. |
| GET | `/leave/balances` | `leave:request` (self) / `leave:read` | self/scope | `?employeeId=&year=` → `[{ leaveType, entitled, used, pending, available }]`. |
| GET | `/leave/requests` | `leave:request` (self) / `leave:read` / `leave:approve` | scope | `?status=&employeeId=&leaveTypeId=&from=&to=&isInformed=`. |
| POST | `/leave/requests` | `leave:request` | self (HR may file for others with `leave:manage`) | Create + submit. Body `{ leaveTypeId, startDate, endDate, halfDay: null\|FIRST\|SECOND, reason (5–500), attachmentFileId? }` → `201` detail. Errors: `VALIDATION_ERROR` (dates, reason, half-day on a multi-day range, attachment unusable), `POLICY_VIOLATION` rules `INSUFFICIENT_BALANCE` (`available`), `MAX_CONSECUTIVE_CL`, `NOT_ELIGIBLE`; `CONFLICT` rule `OVERLAP`. A requester with no line manager (chairman) is auto-approved. |
| GET | `/leave/requests/{id}` | participant | — | + workflow. |
| POST | `/leave/requests/{id}/approve` / `/reject` / `/return` | `leave:approve` + approver | — | Approve → `APPROVED`, `LeaveBalance.used += days`, `AttendanceDay`s pre-marked `ON_LEAVE`, `reviewedById/At`; notification `LEAVE_DECIDED`; socket `leave:status`. |
| POST | `/leave/requests/{id}/cancel` | employee | — | PENDING → CANCELLED; APPROVED and `startDate > today` → CANCELLED with balance restored. |
| POST | `/leave/requests/{id}/mark-informed` | `leave:manage` (HR) / line manager | — | `{ isInformed: boolean }` — for emergency/sick leave logged after the fact (Chairman's "informed vs uninformed"). |
| GET | `/leave/calendar` | `leave:read` | scope | `?from=&to=&departmentId=` → approved leaves per day (team planner). |
| GET/POST/PATCH | `/leave/types[/{id}]` (admin) | `leave:manage-types` | — | `code`, `annualQuota`, `requiresDoc`. |
| POST | `/leave/balances/adjust` | `leave:manage-balances` | — | `{ employeeId, leaveTypeId, year, delta, reason }`; audit. |

```json
// POST /leave/requests
{ "leaveTypeId": "lt-sl…", "startDate": "2026-11-04", "endDate": "2026-11-08", "reason": "Viral fever — doctor's advice",
  "halfDay": null, "attachmentFileId": "f-med…", "handoverToEmployeeId": "e-…" }
// 201 → { "data": { "id": "l1…", "refNo": "LV-2026-089", "days": "5.0", "status": "PENDING", "isInformed": true, "workflow": { … } } }
```

Validation: `endDate ≥ startDate`; `days` computed excluding weekends/holidays (`Setting calendar.holidays`), `halfDay ∈ null|FIRST|SECOND` (single-day only → 0.5); `days ≤ available` for the type/year else `POLICY_VIOLATION` `INSUFFICIENT_BALANCE` (LWP exempt); `requiresDoc` types need `attachmentFileId` when `days ≥ 3`; overlapping PENDING/APPROVED request → `CONFLICT`; `startDate < today` allowed only for `SL`/`LWP` within 3 days (sets `isInformed=false` unless HR marks informed); `reason` 5–500. Notifications `LEAVE_REQUESTED` to approver, `APPROVAL_PENDING` inbox mirror.

---

## 17. MOD-11/12/13 — Claims (TA/DA, Conveyance, Tour & Event)

Module dir `claims`. Models `ExpensePolicy`, `Claim`, `ClaimLine`, `Advance`. Refs `TADA-{YYYY}-{NNNN}`, `CNV-{YYYY}-{NNNN}`, `TOUR-{YYYY}-{NNNN}`, `ADV-{YYYY}-{NNNN}`, voucher `VCH-{YYYY}-{NNNNN}`. Workflow `CLAIM` (line manager/HOD → Finance; Executive when `totalAmount > Setting claims.executiveAbove` = 500 000) and `ADVANCE` (HOD → Finance). One engine, three `ClaimType`s, as in the prototype.

### 17.1 Status machine (`ClaimStatus`)

`DRAFT → PENDING_MANAGER → PENDING_FINANCE → APPROVED → SETTLED`; `PENDING_* → REJECTED | RETURNED`; `RETURNED → PENDING_MANAGER` (resubmit); `DRAFT|RETURNED → CANCELLED`. `Claim.status` is derived from the workflow instance (`PENDING_MANAGER` = step key `MGR` active, `PENDING_FINANCE` = `FIN`/`EXEC` active). **Prototype note:** approving from the Approvals Center jumped straight to `approved`; production always passes Finance. `SETTLED` is reachable via `/settle`.

### 17.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/claims` | `claims:read` | SELF (claimant) · TEAM/DEPARTMENT (`claims:approve`) · COMPANY (`claims:finance`) | Filters `?type=`, `?status=`, `?claimantId=me`, `?departmentId=`, `?periodFrom/To`, `?amountMin/Max`, `?hasPolicyFlags=true`, `?q=` (claimNo, purpose, destination). Sort `-createdAt`, `-totalAmount`, `status`. |
| POST | `/claims` | `claims:create` | self | Create DRAFT (with lines) or create+submit with `?submit=true`. |
| GET | `/claims/{id}` | participant | — | Full: lines (with receipt file meta), `policyFlags`, `policyAmount`, `advance`, `netSettlement`, workflow, voucher. |
| PATCH | `/claims/{id}` | claimant | — | DRAFT/RETURNED; header fields; versioned. |
| PUT | `/claims/{id}/lines` | claimant | — | Replace full line set (DRAFT/RETURNED); server recomputes totals and `policyFlags`. |
| POST | `/claims/{id}/submit` | `claims:submit` (claimant) | — | DRAFT/RETURNED → PENDING_MANAGER; claimNo minted on first submit; blocking policy violations → `POLICY_VIOLATION` (see 17.3); non-blocking produce `policyFlags` that approvers see. Notification `CLAIM_SUBMITTED` to approver; inbox mirror (urgency CRITICAL when `totalAmount > 50 000`, SLA 24 h). |
| POST | `/claims/{id}/approve` / `/reject` / `/return` | `claims:approve` (manager step) or `claims:finance` (finance step) + current approver | — | Workflow wrappers. Finance approve may include `{ adjustments: [{ lineId, approvedAmount, reason }] }` reducing `totalAmount` (audited; claimant notified). Reject/return require `comment ≥ 10` (+ `reasonCategory`, `improvementsRequired`). |
| POST | `/claims/{id}/settle` | `claims:settle` (FINANCE) | — | APPROVED → SETTLED `{ voucherNo? (minted if omitted), paidAt, paymentRef?, method: "BEFTN"\|"CASH"\|"PAYROLL" }`; if linked `Advance`, `Advance.settledAt` set; negative `netSettlement` → `refundDue` recorded. Notification `CLAIM_SETTLED`. |
| POST | `/claims/{id}/cancel` | claimant | — | DRAFT/RETURNED. |
| POST | `/claims/{id}/withdraw` | claimant | — | PENDING_* → WITHDRAWN (workflow). |
| GET | `/claims/{id}/pdf` | participant | — | Claim form + vouchers list. |
| GET | `/claims/export` | `claims:export` | scope | CSV (`BOGCL_Expense_Claims_{date}.csv`) `?from=&to=&status=&type=`; sync if ≤ 5 000 rows else `202 { jobId }`. |
| GET | `/claims/kpis` | `claims:read` | scope | `{ pendingCount, pendingAmount, approvedMonth, conveyanceUsedMonth, conveyanceCap, avgSettlementHours }`. |
| GET | `/claims/policy` | `claims:read` | self | Effective `ExpensePolicy` for my grade (or `?gradeId=` with `claims:policy-manage`) + derived `{ daPerDay: { dhaka, district }, halfDayPct, hotelCap, conveyanceCap, mileageRate, modes[], receiptAbove }`. |
| GET/POST/PATCH | `/claims/policies[/{id}]` | `claims:policy-manage` (HR_ADMIN/FINANCE) | — | `ExpensePolicy` per grade with `effectiveFrom/To`; overlapping windows for a grade → `CONFLICT`. |
| POST | `/claims/compute` | `claims:create` | self | Dry-run: body = claim payload → `{ totalAmount, policyAmount, policyFlags[], netSettlement }` (live validation in the Submit modal). |
| GET/POST | `/advances` | `claims:advance` (self) / `claims:finance` | scope | `{ purpose, amount, neededBy, claimTypeIntended }` → `Advance PENDING_MANAGER` + workflow; `POST /advances/{id}/approve|reject`, `POST /advances/{id}/disburse { disbursedAt, paymentRef }` (FINANCE). An advance can be linked by at most one claim (`CONFLICT`). |

### 17.3 Create and policy rules

```json
// POST /claims?submit=true
{ "type": "TADA", "purpose": "Chittagong depot dealer network inspection", "destination": "Chattogram & Sitakunda",
  "periodStart": "2026-10-20", "periodEnd": "2026-10-23", "travelMode": "AC_BUS", "costCenter": "CC-BOGCL-2026",
  "advanceId": null,
  "lines": [
    { "date": "2026-10-20", "category": "DA", "description": "Daily allowance — district", "amount": "2000.00", "isDeclaration": true },
    { "date": "2026-10-20", "category": "HOTEL", "description": "Hotel Peninsula CTG (Mushak-6.3)", "amount": "7200.00", "receiptFileId": "f-r1…" },
    { "date": "2026-10-20", "category": "TRANSPORT", "description": "Shohoz AC bus DHK→CTG", "fromPlace": "Dhaka", "toPlace": "Chattogram", "amount": "1650.00", "receiptFileId": "f-r2…" }
  ] }
// 201
{ "data": { "id": "c1…", "claimNo": "TADA-2026-0419", "status": "PENDING_MANAGER", "totalAmount": "10850.00",
            "policyAmount": "8000.00", "netSettlement": "10850.00",
            "policyFlags": [ { "lineId": "ln2…", "rule": "HOTEL_CAP", "severity": "WARN", "message": "Hotel ৳7,200 exceeds Grade 8 cap ৳3,000/night" } ],
            "workflow": { "status": "SUBMITTED", "currentApprover": { "name": "Farida Begum" } } } }
```

Validation: `type ∈ ClaimType`; `purpose` 5–300; `periodStart/periodEnd` required for TADA/TOUR_EVENT (`periodEnd ≥ periodStart`, ≤ 30 days, within last 90 days); CONVEYANCE lines must fall in one calendar month; `lines` 1–60; `category ∈ DA|HOTEL|TRANSPORT|FUEL|MEALS|RICKSHAW|CNG|RIDE_SHARE|MILEAGE|OTHER` (DA/HOTEL only for TADA/TOUR_EVENT; RICKSHAW/CNG/RIDE_SHARE/MILEAGE only for CONVEYANCE/TADA); `amount` zMoney > 0; `MILEAGE` requires `distanceKm` and `amount = distanceKm × mileageRatePerKm` (server overwrites); `receiptFileId` required when `amount > receiptRequiredAbove` unless `isDeclaration=true` and category ∈ `RICKSHAW|CNG|DA`; `travelMode ∈ allowedTravelModes` of grade policy else blocking flag `MODE_NOT_ALLOWED`; `advanceId` must be mine, `disbursedAt` set, unsettled.

Policy engine (`server/src/modules/claims/policy.ts`), producing `policyFlags[{lineId?, rule, severity: WARN|BLOCK, message}]`:

| Rule | Computation | Severity |
| :--- | :--- | :--- |
| `DA_ENTITLEMENT` | `policyAmount` DA = Σ days × (`daDistrict` outside Dhaka else `daDhaka`); departure/return days at `daHalfDayPct` when travel < 12 h that day; claimed DA above entitlement is **capped** (line amount reduced, flag WARN) | WARN |
| `HOTEL_CAP` | per night > `hotelCapPerNight` | WARN (BLOCK if > 2× cap without `justification`) |
| `CONVEYANCE_MONTHLY_CAP` | month-to-date approved + this claim > `conveyanceMonthlyCap` | BLOCK unless `justification ≥ 50` chars → WARN |
| `RECEIPT_REQUIRED` | missing receipt above threshold | BLOCK |
| `DUPLICATE_LINE` | same date+category+amount in another claim of mine | WARN |
| `DATE_OUTSIDE_PERIOD` | line date outside period | BLOCK |
| `MODE_NOT_ALLOWED` | travel mode not permitted for grade | BLOCK |
| `TRIP_OVERLAP` | TADA period overlaps approved leave or no attendance `FIELD_DUTY`/punch at destination site | WARN |

`netSettlement = totalAmount − advance.amount` (negative = refund to treasury). **Prototype note:** the prototype used a flat ৳1,500/day; production uses the grade's `ExpensePolicy` and half-day rule.

### 17.4 Pitch-app mock mapping (Flutter `ftr-a`)

Implemented by `mock/engines/claim_engine.dart` (Phase 3d). Differences from §17.2:

| Method | Path | Permission | Notes |
| :--- | :--- | :--- | :--- |
| GET | `/claims/policy` | `claims:read` | Band A–E derived from grade, DA (Dhaka/district), hotel and conveyance caps, mileage rate, receipt threshold, declaration limit (৳1,000 for CNG/rickshaw/meals), allowed categories and modes, conveyance used this month. |
| GET | `/claims` | `claims:read` | `?scope=mine|team|payable&status=&type=`. |
| POST / PUT | `/claims`, `/claims/{id}` | `claims:create` | Header and the full line set in one body (replaces PATCH + PUT lines). The server re-computes DA lines (BR-11-03 full/half day), mileage amounts, totals, `policyAmount`, `netSettlement` and flags on every save. Receipts reference uploaded `receiptFileId`s. |
| POST | `/claims/{id}/submit` | `claims:submit` | HARD flags (`NO_LINES`, `RECEIPT_REQUIRED`, `HOTEL_CAP_EXCEEDED`, `CONVEYANCE_CAP_EXCEEDED`, `DUPLICATE_RECEIPT`, `OVERLAPPING_PERIOD`, `LATE_SUBMISSION`) → `POLICY_VIOLATION` with `details[].rule`. SOFT flags (`MODE_ABOVE_ENTITLEMENT`, `MILEAGE_LONG`) go to approvers. Files workflow `CLAIM`; no line manager → auto-approved. |
| POST | `/claims/{id}/cancel` | claimant | DRAFT/RETURNED cancel; pending claims are withdrawn through the workflow. |
| POST | `/claims/{id}/pay` | `claims:settle` | Replaces `/settle`: APPROVED → SETTLED, mints `VCH-{YYYY}-{NNNNN}`, settles a linked advance, notifies the claimant. The claimant cannot pay their own claim. |
| GET / POST | `/claims/advances` | `claims:advance` | Replaces `/advances`; `?scope=mine|payable`; body `{ amount, purpose, tourStart, tourEnd }`; max ৳5,00,000; `CONFLICT` rule `ADVANCE_OVERDUE` if an earlier disbursed advance is unlinked 30 days after its tour ended. Workflow `TOUR_ADVANCE` (manager → Finance). |
| POST | `/claims/advances/{id}/cancel` | self | Before disbursement. |
| POST | `/claims/advances/{id}/disburse` | `claims:settle` | APPROVED → DISBURSED. |

Deferred in the mock: BEFTN CSV export, Finance line adjustments, executive step above ৳5,00,000, `ADVANCE_SETTLEMENT_OVERDUE` notifications, PDF, KPIs, policy CRUD. Approver actions use the Approvals Center (Phase 4).


---

## 18. MOD-14 — Commuter Bus & FIFO Waitlist

Module dir `bus`. Models `Bus`, `BusRoute`, `BusStop`, `BusSeat`, `SeatAllocation`, `SeatWaitlist`, `SeatOffer`, `BusBroadcast`; read model `v_bus_route_occupancy`. Workflow `BUS_SEAT_CONFIRM` (optional admin confirmation after offer acceptance, enabled by `Setting bus.adminConfirm`). Due item: offer expiry (48 h) with reminder at 36 h (`BUS_OFFER_EXPIRING`).

### 18.1 FIFO algorithm (server, transactional)

When a seat becomes `VACATED` (release, offboarding, admin vacate) or a new seat is added, job `bus:allocate(routeId)` runs under `SELECT … FOR UPDATE` on the route:
1. Pick the oldest `SeatWaitlist` with `status=WAITING` ordered by `priority DESC, appliedAt ASC` (priority > 0 only via admin override with `priorityReason`, audited).
2. Create `SeatOffer { seatId, expiresAt = now + Setting bus.offerWindowHours (48) }`, waitlist → `OFFERED`, seat → `BLOCKED`; notification `BUS_OFFER` (PUSH + SMS), socket `bus:offer`.
3. On `accept` → `SeatAllocation` (PERMANENT, `startsOn` = next working day), seat `OCCUPIED`, waitlist `ACCEPTED`, others re-ranked; on `decline` or expiry → waitlist `DECLINED`/`EXPIRED` (employee may re-apply, going to the back), seat back to `VACATED`, loop to step 1.
4. Seat categories: `LADY_PRIORITY` seats are offered first to female employees on the waitlist (gender from `Employee` — **schema gap**, §25), then to anyone; `EXECUTIVE`/`SENIOR_STAFF` require grade rank ≤ `Setting bus.execGradeRank`.

**Prototype note:** the prototype promoted applicants immediately without a claim window; production implements the 48-hour offer.

### 18.2 Resources

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/bus/routes` | `bus:read` | — | Routes with stops (both directions), occupancy (`capacity, occupied, vacated, blocked, waiting`), assigned bus, next departure. `?siteId=&active=true`. |
| GET | `/bus/routes/{id}` | `bus:read` | — | + seat map `seats[{ id, seatNo, category, status, allocation: { employee {id,name,dept}, bookingType, pickupStop } | null }]`. Names hidden for non-admins except own seat (`bus:manage` sees all). |
| GET | `/bus/routes/{id}/waitlist` | `bus:read` (own rank only) / `bus:manage` | — | Ordered queue `[{ rank, employee, appliedAt, priority, status, offer? }]`. |
| GET | `/bus/me` | `bus:seat-self` | self | `{ allocation, waitlist: [{ route, rank, status }], offers: [pending], boardingPass: { qrToken } }`. |
| POST | `/bus/routes/{id}/waitlist` | `bus:seat-self` | self | Join: `{ pickupStopId, shiftCode? }`. Rules: not already allocated on any route (`CONFLICT`), not already WAITING/OFFERED on this route (`CONFLICT`), employee ACTIVE, `pickupStopId ∈ route`. If a seat is `EMPTY`/`VACATED` the allocation job runs immediately (offer issued). |
| DELETE | `/bus/waitlist/{id}` | self or `bus:manage` | — | WAITING → CANCELLED. |
| POST | `/bus/waitlist/{id}/offer/accept` | offered employee | self | See 18.3. |
| POST | `/bus/waitlist/{id}/offer/decline` | offered employee | self | `{ reason? }` → DECLINED; next in queue. |
| POST | `/bus/waitlist/{id}/priority` | `bus:manage` | — | `{ priority 1–9, priorityReason ≥ 10 }` (Shift/Emergency/Overtime cases); audited. |
| POST | `/bus/allocations/{id}/release` | holder or `bus:manage` | — | `{ reason: "TRANSFER"\|"OWN_VEHICLE"\|"RESIGNED"\|"TEMPORARY"\|"OTHER", releaseNote?, endsOn? }` → `releasedAt` (or future `endsOn` for TEMPORARY ≤ 30 days: seat becomes `SHIFT_PASS` pool) ; seat `VACATED`; triggers FIFO. |
| POST | `/bus/allocations/{id}/reclaim` | former holder | — | Within `Setting bus.reclaimDays` (7) and only if seat still VACATED/BLOCKED-by-offer-not-yet-accepted (`CONFLICT` otherwise). |
| POST | `/bus/allocations/swap` | `bus:seat-self` | self | `{ withAllocationId }` → creates a swap request accepted by the counterpart via `POST /bus/swaps/{id}/accept`; same route only. |
| POST | `/bus/routes/{id}/seats/{seatId}/allocate` | `bus:allocate` | — | Supervisor direct reserve `{ employeeId, bookingType: PERMANENT\|SHIFT_PASS\|GUEST, pickupStopId?, startsOn, endsOn?, reason }`; bypasses queue → flag `BYPASSED_FIFO` in audit; `GUEST` requires `endsOn ≤ +3 days`. Seat must be `EMPTY`/`VACATED`. |
| POST | `/bus/routes/{id}/seats/{seatId}/vacate` | `bus:allocate` | — | `{ reason }` admin vacate. |
| POST | `/bus/routes/{id}/seats/{seatId}/block` / `/unblock` | `bus:manage` | — | Maintenance/VIP hold. |
| POST | `/bus/routes/{id}/allocate-run` | `bus:manage` | — | Manually trigger FIFO job (prototype "Auto FIFO") → `{ offersIssued }`. |
| GET/POST/PATCH | `/bus/routes[/{id}]` (write) | `bus:manage-routes` | — | `code` unique `^R\d{1,2}$`, `capacity 10–60` (creates `BusSeat` rows 1..capacity; reducing capacity below occupied → `CONFLICT`), `stops` ≥ 2 per direction with `seqNo`, `scheduledTime HH:mm`, optional lat/lng. `PUT /bus/routes/{id}/stops` replaces stops. |
| GET/POST/PATCH | `/bus/buses[/{id}]` | read `bus:read`; write `bus:manage-buses` | — | `plateNo` unique; `capacity`; `fitnessExpiresAt` (due item); `driverId`; `routeId` (`POST /bus/buses/{id}/assign-route { routeId }`; a route has ≤ 1 active bus → `CONFLICT`). |
| POST | `/bus/broadcasts` | `bus:broadcast` | — | `{ routeId?, message 5–300, messageBn?, sendSms }` → `BusBroadcast`; notification `BUS_BROADCAST` to riders (route or all); socket `bus:broadcast`. |
| GET | `/bus/routes/{id}/manifest` | `bus:manifest` | — | Gate manifest PDF `?date=&direction=`. |
| POST | `/bus/boardings` | `bus:scan` (conductor device) | — | `{ routeId, direction, date, qrToken \| employeeId }` → boarding record. **Schema gap** (§25.3 #9): until a `bus_boardings` table is added, v1 stores boardings as `AuditLog action=BUS_BOARDED`; headcount via `GET /bus/routes/{id}/boardings?date=`. |
| GET | `/bus/kpis` | `bus:read` | — | `{ routes, seats, occupied, vacated, waiting, offersPending, fitnessExpiring }`. |
| GET | `/bus/timetable` / `/bus/rules` | any auth | — | Static content from `Setting bus.timetable` / `bus.rules` (EN/BN). |

### 18.3 Offer acceptance

```json
// POST /bus/waitlist/{id}/offer/accept
{ "pickupStopId": "st-…" }
// 200
{ "data": { "allocation": { "id": "al…", "seat": { "routeCode": "R1", "seatNo": 17, "category": "REGULAR" }, "bookingType": "PERMANENT",
                            "startsOn": "2026-11-02", "pickupStop": { "name": "Mirpur-10", "scheduledTime": "07:18" } },
            "boardingPass": { "qrToken": "bp_…", "pdfUrl": "/api/v1/bus/me/pass" } } }
```

Errors: `INVALID_STATE_TRANSITION` (offer not PENDING), `POLICY_VIOLATION` `OFFER_EXPIRED` (`expiresAt < now`, job may not have run yet — accept fails and the expiry is applied), `CONFLICT` (employee got a seat elsewhere meanwhile). Side-effects: notification `BUS_SEAT_CONFIRMED` (or `APPROVAL_PENDING` to supervisor when `bus.adminConfirm`), socket `bus:occupancy` to route room, due item DONE, audit `BUS_SEAT_ALLOCATED`.

### 18.4 Pitch-app mock mapping (Flutter `ftr-a`)

Implemented by `mock/engines/bus_engine.dart` (Phase 3e). Offer expiry is processed lazily by `BusEngine.tick` on every `/bus/*` request (stands in for the server job). Offer window 48 h; queue order `priority DESC, appliedAt ASC`.

| Method | Path | Permission | Notes |
| :--- | :--- | :--- | :--- |
| GET | `/bus/routes` | `bus:read` | Occupancy (`capacity, occupied, vacated, free, occupancyPct, waitlistLength`), stops with morning/evening times, `myStatus` = `SEAT|WAITING|OFFERED|null`. |
| GET | `/bus/routes/{id}` | `bus:read` | Adds `admin: { seats[], queue[] }` when the caller has `bus:manage`. |
| GET | `/bus/my-seat` | `bus:read` | Replaces `/bus/me`: `{ allocation, waitlist }` with position and estimated wait (14 days per place). |
| POST | `/bus/routes/{id}/waitlist` | `bus:seat-self` | Join. `CONFLICT` rules `ALREADY_HAS_SEAT`, `ALREADY_WAITING`. A free seat is offered to the head of the queue immediately. |
| POST | `/bus/waitlist/{id}/accept` | `bus:seat-self` | `{ stopId }`; `POLICY_VIOLATION` `OFFER_EXPIRED` after the window. Replaces `/offer/accept`. |
| POST | `/bus/waitlist/{id}/decline`, `/cancel` | `bus:seat-self` | Decline an offer / leave the queue; the seat moves on. |
| POST | `/bus/waitlist/{id}/priority` | `bus:manage` | `{ priority 0–9, reason ≥ 10 when > 0 }`, audited. |
| POST | `/bus/allocations/{id}/release` | `bus:seat-self` | `{ from, to, reason }`, at most 60 days; seat shows as VACATED and may be offered to the queue. |
| POST | `/bus/allocations/{id}/reclaim` | `bus:seat-self` | Only while the seat is still free. |
| POST | `/bus/allocations/{id}/end` | `bus:allocate` | Admin ends an allocation; the seat is re-offered. |
| POST | `/bus/broadcasts` | `bus:broadcast` | `{ routeId?, message }` → `{ recipients }`. |

Deferred in the mock: lady/executive seat categories, SHIFT_PASS/GUEST bookings, swaps, boarding scans, manifests, route and bus CRUD, admin-confirm workflow.


---

## 19. MOD-15 — Inner-Circle Chat & Directives

Module dir `chat`. Models `ChatChannel`, `ChatMember`, `ChatMessage`, `ChatReadReceipt`, `Directive`. Ref `BOGCL-DIR-{YYYY}-{NNNN}`. Realtime in §6 (`/chat`); the REST surface below is the source of truth and the offline replay path. Transport security = TLS; messages are stored encrypted at rest (DB-level, see doc 07). **Prototype note:** "AES-256 SOVEREIGN ENCLAVE" labelling is dropped; E2EE is out of v1 scope.

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/chat/channels` | `chat:use` | My channels (+ public channels I may join) with `unreadCount`, `lastMessage`, `members[]` (presence from Redis), `isLocked`. `?type=CHANNEL\|DIRECT`. |
| POST | `/chat/channels` | `chat:create-channel` (CHAIRMAN, EXECUTIVE_ASSISTANT, SUPER_ADMIN) | `{ name 2–60, key? (slug), memberUserIds 1–200, isLocked?, retentionDays? }`. Caller is always a member and admin. Direct: `POST /chat/direct { userId }` (idempotent, returns existing). |
| DELETE | `/chat/channels/{id}` | `chat:create-channel` + member | Archive (`archivedAt`). Hidden from lists. Locked standing rooms and DMs return `POLICY_VIOLATION`. |
| GET/PATCH | `/chat/channels/{id}` | member / channel admin | Rename, lock (`isLocked` = only admins post), retention. Archived channels 404. |
| POST/DELETE | `/chat/channels/{id}/members[/{userId}]` | channel admin | Add/remove; `PATCH …/members/{userId} { isAdmin, mutedUntil }`. System message on join/leave. |
| GET | `/chat/channels/{id}/messages` | member | Cursor (`?before=<msgId>&limit=50`, `?pinned=true`, `?q=`); includes `sender`, `replyTo` summary, `reactions`, `readBy` count, `file` meta, `directive`. Deleted messages return `{ id, deletedAt }` tombstones. |
| POST | `/chat/channels/{id}/messages` | member, channel not locked (or admin) | `{ clientMsgId (uuid, dedupe), type: TEXT\|VOICE\|DOCUMENT, body? (≤ 4000), fileId?, voiceDurationSec? (≤ 300), replyToId?, isUrgent? }`; `TEXT` needs body; `VOICE/DOCUMENT` need `fileId`. `isUrgent` → push to members bypassing quiet hours (NORMAL priority, not ack). Mentions `@userId` → `CHAT_MENTION`. |
| PATCH / DELETE | `/chat/messages/{id}` | sender (≤ 15 min edit) / sender or channel admin | Edit body (`editedAt`) / soft delete. |
| POST | `/chat/messages/{id}/reactions` | member | `{ emoji (one of allow-list), op }`. |
| POST | `/chat/messages/{id}/pin` / `/unpin` | channel admin | Max 10 pinned per channel. |
| POST | `/chat/channels/{id}/read` | member | `{ lastMessageId }` → receipts for all earlier unread. |
| POST | `/chat/channels/{id}/directives` | `chat:directive-issue` (CHAIRMAN; others per role grant) | `{ title 3–120, body 10–4000, priority (default HIGH), dueAt?, requireAckFrom?: userIds (default all members) }` → `Directive` + `ChatMessage type=DIRECTIVE` (pinned) + CRITICAL notification `CHAT_DIRECTIVE` with `ackRequired`; socket `chat:directive`. |
| POST | `/directives/{id}/ack` | member | Appends `{ userId, at }` to `acknowledgements`; idempotent. |
| POST | `/directives/{id}/execute` | issuer or assignee | `{ note? }` → `executedAt`. |
| GET | `/directives` | `chat:use` | `?issuerId=&open=true` — directives I issued or must ack, with ack matrix. |
| GET | `/chat/channels/{id}/files` | member | "Vault": all `DOCUMENT`/`VOICE` messages' files. |
| GET | `/chat/members/{userId}/dossier` | member of a shared channel | `{ user, employee summary, presence, location (from last trip/visit/punch site), todayStatus }` (right drawer). |
| POST | `/chat/calls` | member | `{ channelId \| userId }` → returns a signalling room token for the WebRTC/voice adapter (**stub in v1**: returns `NOT_IMPLEMENTED` `501` **(extension code)** until the calls provider is selected). |

Retention job deletes messages older than `retentionDays` (hard delete + file objects). Chat is excluded from `AuditLog` (doc 02 §1) but channel membership and directive actions are audited.

### 19.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/chat_engine.dart`) implements a subset with these differences:

- Four seeded rooms: Leadership (locked), Plant operations, Finance, Permits (locked). Members are Chairman, Plant GM, HR and Finance HOD only. Employee, driver and transport personas have no `chat:use`. Copy never claims end-to-end encryption (BR-15-05/17).
- Send, read, react, DM, issue/ack/execute directive. A send in Plant operations gets a scripted Plant GM reply. Voice, files, calls, retention job and channel admin UI are deferred.

---

## 20. MOD-16 — Workforce Directory & Exit Clearance

Module dir `employees`. Models `Employee` (+ `User`), `ExitClearance`, `ExitClearanceItem`; read model `v_employee_directory`. Workflow `EXIT_CLEARANCE` (parallel steps per `ClearanceItemKey`, owner roles `IT_ADMIN`, `HR_ADMIN`, `TRANSPORT_ADMIN`, `FINANCE`; final HR). **Prototype note:** the prototype had no role gating; production gates every write with `employees:*` keys.

| Method | Path | Permission | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/employees` | `employees:read` (directory: name, designation, dept, site, phone, photo) / `employees:read-full` (HR: all fields) | DEPARTMENT/SITE/COMPANY | From `v_employee_directory`. Filters `?status=ACTIVE,ON_LEAVE` (default active set), `?departmentId=`, `?siteId=`, `?gradeId=`, `?roleKey=`, `?lineManagerId=`, `?former=true` (OFFBOARDED), `?q=` (fullName, fullNameBn, empCode, sapPernr, designation, phone). Sort `fullName`, `empCode`, `joinDate`. |
| POST | `/employees` | `employees:create` (HR_ADMIN) | — | Onboard: creates `User` + `Employee` (+ roles, + set-password link). |
| GET | `/employees/{id}` | `employees:read` (+ `-full` for PII) | — | Profile; `nid` decrypted only with `employees:pii`; `reports[]`, `custodyAssets[]`, `leaveBalances[]`, `busAllocation`, `exitClearance`. |
| PATCH | `/employees/{id}` | `employees:update` (HR) ; self for contact fields | — | Versioned; changing `departmentId/siteId/lineManagerId` re-routes ACTIVE workflow steps where this employee's manager/department head was resolved (audited). |
| POST | `/employees/{id}/offboard` | `employees:offboard` (HR_ADMIN) | — | Initiate exit clearance (see below) → `Employee.status = OFFBOARDING`. |
| GET | `/exit-clearances` | `employees:clearance` (owner role sees own items) / HR | — | `?status=&itemOwnerRole=me`. |
| GET | `/exit-clearances/{id}` | HR / item owners / employee | — | Items with status, `autoChecks` (open custody assets, active bus seat, unsettled advances/claims, fuel cards, active sessions). |
| POST | `/exit-clearances/{id}/items/{key}/clear` | `employees:clearance` + holder of `ownerRoleKey` | — | `{ note?, waive?: boolean, waiveReason? }` → CLEARED/WAIVED. Preconditions per key: `ASSETS_RETURNED` requires no open `AssetCustody` (`POLICY_VIOLATION` `ASSETS_OUTSTANDING` with list — use `POST /exit-clearances/{id}/reclaim-assets`); `BUS_SEAT` requires no active `SeatAllocation` (auto-release offered); `FINANCE_SETTLEMENT` requires no APPROVED-unsettled claims / undisbursed-unsettled advances; `IT_ACCESS` revokes all sessions, device tokens, roles (keeps `User` row, `isActive=false` at finalisation). |
| POST | `/exit-clearances/{id}/reclaim-assets` | `employees:clearance` (HR/IT) | — | Calls assets custody release for every open custody `{ reason: "OFFBOARDING" }`; returns released tags; auto-clears `ASSETS_RETURNED`. |
| POST | `/exit-clearances/{id}/finalize` | `employees:offboard` | — | All items CLEARED/WAIVED (`POLICY_VIOLATION` `ITEMS_PENDING`) → `status=APPROVED`, `completedAt`, `finalSettlementVoucher`, `Employee.status=OFFBOARDED`, `exitDate`, `User.isActive=false`; notifications `CLEARANCE_COMPLETED`. |
| POST | `/exit-clearances/{id}/cancel` | `employees:offboard` | — | `{ reason }` → `CANCELLED`, employee back to ACTIVE. |
| POST | `/employees/{id}/reactivate` | `employees:offboard` | — | OFFBOARDED → ACTIVE (re-hire): new `joinDate`, roles must be re-granted; audit `EMPLOYEE_REACTIVATED`. |
| GET | `/employees/kpis` | `employees:read` | scope | `{ active, bySite{}, byDepartment{}, former, onboardingMonth }`. |
| GET | `/employees/{id}/org-chart` | `employees:read` | — | Manager chain + direct reports. |

### 20.x Pitch-app mock mapping

The in-app mock (`ftr-a/lib/mock/engines/workforce_engine.dart`) implements a subset with these differences:

- `GET /people` remains the lightweight picker (no PII). The directory is `GET /employees?view=all|team|leaving|former`. Every signed-in role holds limited `employees:read` COMPANY so Home shows People. `nid` / emergency / grade / joinDate only for HR, self, or the manager chain (`employees:pii` / `read-full`).
- Exit is a record with seven items, not an `EXIT_CLEARANCE` workflow. HR (`EMP-0028`) starts, cancels, waives and finalises. Item owners: Plant GM assets, Transport bus/fuel, Gate RFID, Finance settlement, HR interview. `IT_ACCESS` has no SUPER_ADMIN persona — HR waives. `POST /exit-clearances/{id}/reclaim-assets` calls `AssetEngine.reclaimEmployeeAssets`. Chairman cannot be offboarded (BR-16-10). Notifications use `data.route` `/home/people/{id}`.
- Seed: Nazmul Huda (`EMP-1104`, plant HSE, no login) is mid-exit with every desk pending; Shakil and Khadija stay former. Tariqul stays on leave. Demo logins are never offboarded.
- Deferred: org-chart screen, set-password mail, session revoke on IT clear, bus auto-release, SAP PERNR sync.

```json
// POST /employees
{ "user": { "email": "nusrat.jahan@bogcl.com", "phone": "+8801711223344", "preferredLang": "BN", "roleKeys": ["EMPLOYEE"] },
  "fullName": "Nusrat Jahan", "fullNameBn": "নুসরাত জাহান", "designationId": "dg-…", "gradeId": "g8…", "departmentId": "d-sales…",
  "siteId": "s-hq…", "lineManagerId": "e-…", "joinDate": "2026-11-10", "sapPernr": "00012345", "nid": "1992…",
  "bloodGroup": "O+", "emergencyContact": "+8801911000000 (spouse)", "photoFileId": null, "shiftId": "sh-gen…", "leaveYearEntitlements": "DEFAULT" }
// 201 → { "data": { "id": "e-new…", "empCode": "EMP-1108", "status": "ACTIVE", "user": { "id": "u-…", "mustSetPassword": true } } }
```

Validation: `email` unique; `phone` zPhoneBd unique; `fullName` 2–120; `nid` 10/13/17 digits (encrypted); `joinDate` ≤ today + 60 days; `lineManagerId ≠ self`, ACTIVE; `roleKeys ⊆` roles caller may grant; `bloodGroup ∈ A+|A-|B+|B-|AB+|AB-|O+|O-`. Side-effects: `LeaveBalance` rows for the year (pro-rated), `ShiftAssignment`, welcome notification, audit `EMPLOYEE_CREATED`.

```json
// POST /employees/{id}/offboard
{ "lastWorkingDay": "2026-11-30", "reason": "Resignation", "notifyOwners": true }
// 201 → { "data": { "id": "x1…", "status": "IN_REVIEW", "items": [ { "key": "IT_ACCESS", "ownerRoleKey": "IT_ADMIN", "status": "PENDING" },
//           { "key": "RFID_BADGE", "ownerRoleKey": "SECURITY_GATE", "status": "PENDING" }, { "key": "ASSETS_RETURNED", "ownerRoleKey": "HR_ADMIN", … },
//           { "key": "VEHICLE_FUEL_CARD", "ownerRoleKey": "TRANSPORT_ADMIN", … }, { "key": "BUS_SEAT", "ownerRoleKey": "TRANSPORT_ADMIN", … },
//           { "key": "FINANCE_SETTLEMENT", "ownerRoleKey": "FINANCE", … }, { "key": "HR_EXIT_INTERVIEW", "ownerRoleKey": "HR_ADMIN", … } ] } }
```

Rules: `lastWorkingDay ≥ today`; employee ACTIVE/ON_LEAVE (`INVALID_STATE_TRANSITION`); existing clearance → `CONFLICT`; `CHAIRMAN` cannot be offboarded via API (`FORBIDDEN`). Notifications `CLEARANCE_ITEM_PENDING` to each owner role; socket `clearance:changed`.

---

## 21. MOD-17 — Approvals Center & Delegation

Module dir `workflow`; web feature `approvals`. This module has **no endpoints of its own** beyond §4.6 and §3 (`/me/delegations`). Mapping of prototype screens:

| Prototype element | Endpoint(s) |
| :--- | :--- |
| Actionable Pending Requests tab, category chips, search, SLA badges | `GET /workflow/inbox?category=&q=&sort=dueAt` (each row: `instanceId, objectType, objectId, summary { refNo, title, titleBn, amount, requester {name,designation,department}, urgency, category }, step { stepNo, key, activatedAt, dueAt, slaHoursLeft }, delegatedFrom?`) |
| Approval History & Archive | `GET /workflow/history` |
| KPI cards (pending, total value, completed) | `GET /workflow/inbox/summary` |
| Expand "Review History" trail | `GET /workflow/instances/{id}` (`actions[]`, `steps[]`) |
| Approve Now / AuthorizeDirectiveModal (directive note, signature stamp, notify SMS) | `POST /workflow/instances/{id}/actions { type: APPROVE, comment, signature?, notify: { sms: true } }` |
| Return for Correction / RejectionExplanationModal (reason category, observation, improvements) | `POST /workflow/instances/{id}/actions { type: RETURN \| REJECT, comment, details: { reasonCategory, improvementsRequired } }` |
| Batch Approve (n) | `POST /workflow/instances/batch-actions` |
| DetailDrawer metrics | `GET /<module resource>/{objectId}` (route from `summary.route`) |
| Leave Handover (delegate, until, scope) | `POST /me/delegations` |
| Chairman "Priority Approvals" | `GET /dashboards/widgets/approvals.priority` (= inbox sorted by `-summary.amount,dueAt` limit 5) |

**Prototype note:** approver attribution now comes from the authenticated actor (`WorkflowAction.actorId`), history shows the real `decision`, and `signatureHash`/`notifySms` from the modal are honoured (`Signature` row; SMS to initiator). Category mapping `objectType → category`: `NoteSheet, AssetRequisition → PROCUREMENT`; `Claim, Advance → CLAIMS`; `VehicleRequisition → FLEET`; `LeaveRequest, Regularisation → LEAVE`; `ExitClearance → HR`; `AssetDisposal → ASSETS`; `Visit → VISITORS`; `SeatWaitlist → BUS`; `LicenceRenewal → COMPLIANCE`; `Incident → HSE`; `Notice → NOTICES`.


### 21.x Pitch-app mock additions

`GET /workflow/delegates` (`workflow:act`): active colleagues the caller may delegate a decision to (users holding `workflow:act`, excluding the caller) as `[{ userId, name, nameBn, title }]`. Workflow notifications carry `data.route = /home/approvals/{instanceId}` so the Inbox can open the request.

---

## 22. MOD-18 — Administration

Module dir `admin`. Endpoints are defined in §4.4 (audit), §4.5 (settings), §4.6 (workflow templates), §5 (master data), §11.2 (`/asset-categories`), §12.2 (`/regulatory-bodies`, `/licence-types`), §16 (`/attendance/shifts`, `/leave/types`), §17.2 (`/claims/policies`), §18.2 (routes/buses). Additional admin-only endpoints:

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/admin/overview` | `admin:read` | Counts (users, active sessions, queued jobs, failed deliveries 24 h, storage used), integration health (SMS/email/push/S3/Redis). |
| GET | `/admin/jobs` / POST `/admin/jobs/{queue}/{jobId}/retry` | `admin:jobs` | BullMQ visibility (failed/delayed) — mirrors Bull Board. |
| GET | `/admin/notification-deliveries` | `admin:read` | `?status=FAILED&channel=SMS&from=` — `NotificationDelivery` triage; `POST …/{id}/retry`. |
| GET | `/admin/sequences` | `admin:read` | Read-only `Sequence` table. |
| POST | `/admin/cache/invalidate` | `SUPER_ADMIN` | `{ keys: ["perm:*", "settings"] }`. |
| GET | `/admin/integrations` / PUT `/admin/integrations/{key}` | `admin:integrations` | Adapter config (provider, sender id, enabled) — **secrets are env-only**, never returned. `POST /admin/integrations/{key}/test` sends a test SMS/email/push to the caller. |
| GET | `/admin/export/{entity}` | `admin:export` | Bulk CSV job for master data. |
| POST | `/admin/impersonate/{userId}` | `SUPER_ADMIN` + MFA within 5 min | Issues a 15-min access token with `act: { sub: adminId }` claim; every request audited `IMPERSONATED`; write actions on `/auth/*`, `/me/*` blocked. |

The prototype's `SapGatewayModal` ("Run Connection Check") maps to `GET /admin/integrations` + `POST /admin/integrations/sap/test` (adapter stub returns `{ status: "NOT_CONFIGURED" }` in v1).

---

## 23. Webhooks & Outbound Integrations

### 23.1 Inbound provider callbacks (unauthenticated path, signature-verified)

| Method | Path | Provider | Verification | Effect |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/webhooks/sms/{provider}` | SSL Wireless / Banglalink / GP DLR | Shared secret header `X-Webhook-Secret` (per provider, env) + IP allow-list | Body normalised by adapter → `NotificationDelivery.status` (`DELIVERED`/`FAILED`), `providerRef` matched; retries idempotent on `(providerRef, status)`. |
| POST | `/webhooks/push/expo-receipts` | Expo push receipts (also pulled by job every 15 min) | Expo signature | `DeviceNotRegistered` → delete `DeviceToken`; others → delivery `FAILED` + error. |
| POST | `/webhooks/email/{provider}` | SMTP relay bounce/complaint (SES/SendGrid-style) | Provider signature | Delivery status; hard bounce flags `User.email` for HR review (`Setting`). |
| POST | `/webhooks/av/scan-result` | ClamAV worker (internal network) | mTLS / internal token | `FileObject.scanStatus`; `INFECTED` → attachment owners notified, file quarantined (moved to `quarantine/` prefix). |
| POST | `/webhooks/gps/{provider}` | Telematics adapter (future) | Provider HMAC | `POST /trips/{id}/location` equivalent keyed by `Vehicle.gpsDeviceId`. |
| POST | `/webhooks/anpr/{siteCode}` | Gate camera adapter (future) | HMAC | Resolves `Visit.vehiclePlate` / `Trip` and emits `visit:status`/`trip:status` pre-arrival events. |

All webhook handlers: respond `200` within 2 s, enqueue processing (BullMQ `webhooks` queue), store raw payload 7 days for replay (`webhook_events` table — **schema gap**, §25), rate-limit 600/min per provider.

### 23.2 Outbound (server → external), adapter interfaces in `server/src/adapters/`

| Adapter | Interface | v1 implementation |
| :--- | :--- | :--- |
| `SmsProvider` | `send({ to, body, lang, ref }) → { providerRef }` | SSL Wireless HTTP API + `MockSmsProvider` (logs; used in local/dev) |
| `PushProvider` | `send(tokens[], { title, body, data, priority, channelId })` | Expo Push API with receipt polling |
| `EmailProvider` | `send({ to, subject, html, text, attachments })` | Nodemailer SMTP (MailHog locally) |
| `StorageProvider` | presign/put/get/head/delete | S3 SDK v3 (MinIO/S3) |
| `PdfRenderer` | `render(templateKey, data, lang) → FileObject` | Playwright/Chromium worker |
| `SapAdapter` | `pushVoucher(claim)`, `pushAssetCapitalisation(asset)`, `pullBudgetHead(code)` | `NotConfigured` stub; interface only (doc 00 §1) |
| `RegulatorStatusAdapter` | `pull(licence)` | stub |
| `MapsAdapter` | `distance(origin, dest, stops)` | matrix from `Setting`, Google/OSRM later |

Outbound calls are made only from BullMQ workers, never in the request path, with exponential backoff (5 attempts) and dead-letter queue visible at `/admin/jobs`.

---

## 24. Appendix A — Permission Keys

Seeded into `Permission` (`module`, `key`, `description`) by `prisma/seed.ts`; the list is generated from `server/src/core/permissions.ts` (single source) and this appendix is regenerated by `npm run docs:permissions`. Default role grants are in doc 06; `SUPER_ADMIN` holds all keys at `COMPANY` scope.

| Module | Keys |
| :--- | :--- |
| `platform` | `files:upload`, `files:read`, `search:use`, `due-items:read`, `due-items:manage` |
| `workflow` | `workflow:inbox`, `workflow:act`, `workflow:reassign`, `workflow:templates`, `workflow:delegate-admin`, `workflow:view-all` |
| `dashboards` | `dashboards:read`, `dashboards:roi`, `dashboards:inner-circle`, `dashboards:plant`, `dashboards:hr`, `dashboards:transport` |
| `notices` | `notices:read`, `notices:create`, `notices:update`, `notices:publish`, `notices:manage`, `notices:broadcast`, `notices:sms` |
| `briefings` | `briefings:read`, `briefings:create` |
| `note-sheets` | `note-sheets:read`, `note-sheets:create`, `note-sheets:submit`, `note-sheets:sign`, `note-sheets:manage`, `note-sheets:override` |
| `parcels` | `parcels:read`, `parcels:create`, `parcels:dispatch`, `parcels:scan`, `parcels:deliver`, `parcels:return`, `parcels:manage`, `parcels:confidential` |
| `assets` | `assets:read`, `assets:create`, `assets:update`, `assets:custody-assign`, `assets:transfer`, `assets:spares`, `assets:flag-defect`, `assets:maintain`, `assets:calibrate`, `assets:requisition`, `assets:approve-requisition`, `assets:commission`, `assets:decommission`, `assets:write-off`, `assets:depreciation-policy`, `assets:export`, `admin:asset-categories` |
| `compliance` | `compliance:read`, `compliance:create`, `compliance:update`, `compliance:manage`, `compliance:dispatch-letter`, `admin:compliance-master` |
| `incidents` | `incidents:read`, `incidents:report`, `incidents:triage`, `incidents:manage`, `incidents:capa`, `incidents:capa-verify`, `incidents:statutory`, `incidents:close`, `incidents:deanonymise` |
| `visitors` | `visitors:read`, `visitors:create`, `visitors:approve`, `visitors:gate`, `visitors:inspect`, `visitors:manage`, `visitors:watchlist`, `visitors:pii` |
| `fleet` | `fleet:read`, `fleet:request`, `fleet:endorse`, `fleet:dispatch`, `fleet:drive`, `fleet:gate`, `fleet:fuel`, `fleet:tolls-approve`, `fleet:tolls-pay`, `fleet:manage-vehicles`, `fleet:manage-drivers`, `fleet:chat` |
| `attendance` | `attendance:punch`, `attendance:read`, `attendance:export`, `attendance:approve-regularisation`, `attendance:manage-shifts`, `admin:geofences` |
| `leave` | `leave:request`, `leave:read`, `leave:approve`, `leave:manage`, `leave:manage-types`, `leave:manage-balances` |
| `claims` | `claims:read`, `claims:create`, `claims:submit`, `claims:approve`, `claims:finance`, `claims:settle`, `claims:advance`, `claims:export`, `claims:policy-manage` |
| `bus` | `bus:read`, `bus:seat-self`, `bus:manage`, `bus:allocate`, `bus:broadcast`, `bus:manifest`, `bus:scan`, `bus:manage-routes`, `bus:manage-buses` |
| `chat` | `chat:use`, `chat:create-channel`, `chat:directive-issue` |
| `employees` | `employees:read`, `employees:read-full`, `employees:pii`, `employees:create`, `employees:update`, `employees:offboard`, `employees:clearance` |
| `admin` | `admin:read`, `admin:users`, `admin:users-read`, `admin:roles`, `admin:roles-read`, `admin:sites`, `admin:departments`, `admin:grades`, `admin:settings`, `admin:audit-read`, `admin:jobs`, `admin:integrations`, `admin:export`, `admin:read-deleted` |

Scope dimension per key (what `scopeWhere` filters on): `*:read`/`*:create` keys use the record's owner/department/site; approval keys (`*:approve`, `*:endorse`, `claims:finance`, `leave:approve`) use the requester's department/site; master-data `admin:*` keys are `COMPANY` only; `*-self` and `attendance:punch`, `incidents:report`, `fleet:request`, `claims:create`, `leave:request`, `bus:seat-self` are always `SELF`.

Prototype persona → default grants (summary; full matrix in doc 06): `EMPLOYEE` = all `*:read` at SELF, `notices:read`, `note-sheets:create/submit`, `parcels:create`, `assets:flag-defect`, `incidents:report`, `visitors:create`, `fleet:request`, `attendance:punch`, `leave:request`, `claims:create/submit/advance`, `bus:seat-self`, `briefings:read`, `dashboards:read`; `DRIVER` = EMPLOYEE + `fleet:drive`, `parcels:scan/deliver`, `fleet:chat`; `HOD` = EMPLOYEE + DEPARTMENT-scoped reads + `workflow:act`, `note-sheets:sign`, `claims:approve`, `leave:approve`, `fleet:endorse`, `assets:approve-requisition`, `attendance:read/approve-regularisation`; `FINANCE` = `claims:finance/settle/policy-manage`, `fleet:tolls-pay`, `assets:write-off/depreciation-policy`; `HR_ADMIN` = `employees:*`, `notices:*`, `leave:manage*`, `attendance:*`, `admin:users(-read)`; `TRANSPORT_ADMIN` = `fleet:*` except `tolls-pay`, `bus:*`, `assets:*` for VEHICLE class (SITE); `PLANT_GM` = SITE-scoped everything + `incidents:triage/close`, `visitors:approve`, `assets:maintain/calibrate/decommission`, `compliance:manage`; `CHAIRMAN` = COMPANY reads, `workflow:act`, `note-sheets:sign`, `notices:broadcast`, `briefings:create`, `chat:create-channel/directive-issue`, `dashboards:roi/inner-circle`.

---

## 25. Appendix B — OpenAPI Generation & Client Types

### 25.1 Pipeline

1. Every route module declares `zod` schemas for `params`, `query`, `body`, `response` and registers them with `@asteasolutions/zod-to-openapi` (`extendZodWithOpenApi(z)`; `registry.registerPath({ method, path, operationId, tags, security, request, responses })`). Shared components: `Envelope<T>`, `ListEnvelope<T>`, `ErrorEnvelope`, `Pagination`, all enums (generated from Prisma enums by `scripts/gen-enum-schemas.ts` so `zod` enums never drift from doc 02).
2. `npm run openapi:build` → `server/openapi/openapi.json` (OpenAPI 3.1, `info.version` = package version, `servers` per env). Committed; CI fails if the generated file differs from the committed one (`openapi:check`).
3. Served at runtime: `GET /api/v1/openapi.json` (auth required outside `local`/`dev`) and Swagger UI at `/api/v1/docs` (`dev`/`staging` only).
4. Clients: `frontend/` runs `openapi-typescript ../server/openapi/openapi.json -o src/shared/api/generated/schema.d.ts`; `app/` runs the same into `src/types/generated/schema.d.ts` (doc 00 §3). RTK Query endpoints are typed with `paths["/claims"]["get"]["responses"]["200"]["content"]["application/json"]`-style helpers (`ApiResponse<"/claims","get">`) exported from `generated/helpers.ts`. Both clients fail CI if the schema file is stale (`npm run api:types:check`).

### 25.2 Conventions inside the document

- `operationId` = `<module>.<verb><Resource>` (`claims.submitClaim`, `workflow.actOnInstance`); tags = module names from §7 registry.
- Security schemes: `bearerAuth` (JWT), `cookieAuth` (`oneops_at`), `webhookSecret` (apiKey header). Public routes (`/verify/*`, `/gate-pass/*`, `/webhooks/*`, `/auth/login|refresh|mfa/verify|password/forgot|reset`) declare `security: []`.
- Each operation lists `x-permission` (key) and `x-scope` (dimension) vendor extensions; the permission middleware is generated from them (`server/src/core/route-permissions.ts`), so Appendix A, the middleware and the OpenAPI document cannot diverge.
- `x-idempotent: true` on POSTs that require `Idempotency-Key`; `x-versioned: true` on resources that use `ETag`/`If-Match`.
- Error responses are referenced components (`#/components/responses/ValidationError`, `…/Forbidden`, `…/InvalidStateTransition`, `…/PolicyViolation`); per-endpoint `POLICY_VIOLATION` rule names appear in the operation description.
- Socket.IO events (§6) are documented in a sibling AsyncAPI 3 file `server/openapi/asyncapi.yaml` generated from the same zod payload schemas (`zod-to-json-schema`); clients generate event payload types from it.
- Money fields are `type: string, pattern: ^\d{1,12}(\.\d{1,2})?$, x-money: BDT`; timestamps `format: date-time`; dates `format: date`.

### 25.3 Reconciliation items found while writing this document

| # | Where | Issue | Proposed resolution |
| :-- | :--- | :--- | :--- |
| 1 | doc 00 §6.1 vs this doc | Doc 00 names the inbox `GET /approvals/inbox` and `POST /approvals/{id}/approve`; this doc makes `/workflow/*` canonical (module dir `workflow`) and keeps `/approvals/inbox` as an alias. | Update doc 00 §6.1 wording or drop the alias. |
| 2 | doc 00 ADR-06 vs login requirement | ADR-06 says "Email/Emp-ID + password"; this doc accepts email, phone or `empCode` as `identifier`. | Confirm phone login is wanted (SMS reset depends on verified phone). |
| 3 | doc 00 §5.1 vs doc 02 | Doc 00 stores idempotency keys "24 h in Redis"; doc 02 had an `IdempotencyKey` table. | **Resolved:** Redis only; table removed from doc 02. |
| 4 | doc 00 §5.1 error list | Needed additional codes: `PRECONDITION_FAILED` 412, `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_MEDIA_TYPE` 415, `POLICY_VIOLATION` 422, `CLIENT_OUTDATED` 426, `NOT_IMPLEMENTED` 501. | Add to doc 00 §5.1. |
| 5 | doc 00 §5.2 vs doc 02/prototype | Doc 00 lists asset ref `AST-{NNN}`; doc 02 `Asset.tag` example and the prototype use `BOGCL-{SITE}-{CAT}-{n}`. `ARQ-`, `TRF-`, `GP-`, `RTN-`, `REG-`, `ADV-`, `CAPA-` prefixes used here are absent from doc 00 §5.2. | Extend doc 00 §5.2 list; decide whether `AST-{NNN}` is a secondary short code. |
| 6 | doc 00 §5.3 vs doc 02 | `ExitClearanceItem.ownerRoleKey` example lists `IT_ADMIN`, which is not in doc 00's role list. | Add `IT_ADMIN` role or map IT clearance to `SUPER_ADMIN`/`HR_ADMIN`. |
| 7 | doc 02 `Employee` | No `gender` column; bus `LADY_PRIORITY` seats and HR reports need it. | Add `gender` enum column. |
| 8 | doc 02 `Visit` | VIP hospitality fields from the prototype (`executiveSuite`, `dietaryPreferences`, `ndaSigned`, `safetyBriefingCompleted`) have no columns; this doc parks them in `notes` JSON. | Add `hospitality Json?`, `ndaSignedAt`, `briefingDoneAt`. |
| 9 | doc 02 | No table for bus boardings (conductor headcount), webhook raw events, password history, user UI prefs (theme/dashboard layout) — this doc uses `AuditLog`, a proposed `webhook_events` table and `Setting` rows respectively. | Add `bus_boardings`, `webhook_events`, `password_history` (or JSON on `UserCredential`), `user_preferences`. |
| 10 | doc 02 `Parcel` | Prototype has `weight` and `specialHandling`; schema lacks them (this doc sends `weightKg`, `specialHandling`). | Add `weight_kg Decimal(8,2)?`, `special_handling String?`. |
| 11 | doc 02 `WorkflowStep` vs this doc | Step-level `requiresSignature` lives only in template JSON; `WorkflowStep` has `signatureId` but no flag. | Fine as-is (flag read from template), noted for implementers. |
| 12 | doc 02 `Trip` | No `status` column; trip state is derived from `TripEvent`/requisition status. This doc exposes a derived `status` (`ASSIGNED/IN_TRANSIT/COMPLETED`). | Optionally add `status` for indexing. |
| 13 | doc 00 §7 vs §5 | Employees CRUD is listed under MOD-18 `admin` in doc 00 §7 but the server module is `employees` (MOD-16). This doc places `/employees` in MOD-16 and has admin reuse it. | Clarify ownership in doc 00 §7. |
| 14 | doc 00 ADR-22 vs doc 02 | ADR-22 mandates uuid v7; doc 02 defaults to `gen_random_uuid()` (v4) pending extension. Already noted in doc 02 header. | Keep; generate v7 in application layer (`uuidv7` npm) until the PG extension is available. |
| 15 | Prototype vs doc 02 | Prototype fleet `hodApproval` + requisition `pending` is one state; schema separates `PENDING_APPROVAL → APPROVED → ASSIGNED`. Prototype claims `pending_hod` approves straight to `approved` from the hub; schema/this doc require the Finance step. | Behaviour change to communicate to the client (demo script). |
| 16 | doc 02 `SeatWaitlist @@unique([routeId, employeeId, status])` | Allows a second WAITING row only after the first changes status — correct — but a re-application after `EXPIRED` creates a second `EXPIRED` row conflict on the next expiry. | Change to a partial unique index on `status IN ('WAITING','OFFERED')`. |


