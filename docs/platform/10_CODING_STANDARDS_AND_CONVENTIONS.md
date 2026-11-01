# 10 — Coding Standards & Engineering Conventions

**Document:** 10 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Audience:** All engineers (server, web, mobile), QA automation, DevOps, AI agents
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (ADR-01..25, §5 conventions), `02_DATABASE_SCHEMA.md`, `03_API_SPECIFICATION.md`, `04_WEB_FRONTEND_SPECIFICATION.md`, `05_MOBILE_APP_SPECIFICATION.md`, `08_DEVOPS_ENVIRONMENTS_AND_CICD.md`
**Also binding:** `.cursor/rules/project.mdc` (working rules), `app/.agents/AGENTS.md` and `app/.agents/skills/*` (Expo starter conventions — this document extends them; where they differ, this document states the resolution)

Key words MUST, MUST NOT, SHOULD, SHOULD NOT, MAY are used as in RFC 2119. Rules apply to `server/`, `frontend/`, `app/`, `infra/`. `client/` is frozen and exempt (ADR, doc 00 §3).

---

## 1. General Rules (all codebases)

### 1.1 Language & compiler

| Rule | Requirement |
| :--- | :--- |
| G1 | TypeScript everywhere. JavaScript files MAY exist only for tool configs that do not support TS. |
| G2 | `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `useUnknownInCatchVariables`, `verbatimModuleSyntax` (server/web). |
| G3 | ESM only (`"type": "module"`), `import`/`export`; no `require` outside config files that must be CJS (Expo's `eslint.config.js`, `metro.config.js`, `babel.config.js`). |
| G4 | `any` is forbidden (`@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrowing, generics, or zod `z.infer`. `as` casts need a comment explaining why; `as unknown as X` needs reviewer approval. |
| G5 | Non-null assertions (`!`) are forbidden except in tests. Handle nullable values with narrowing, `??`, or early return. |
| G6 | Prefer `readonly` arrays/props for inputs; prefer `satisfies` over annotations for config objects. |
| G7 | Enums: do **not** use TS `enum`. Use `as const` objects + derived union types. Prisma enums are imported from `@prisma/client` on the server and mirrored via generated OpenAPI types on clients. |

```ts
export const PunchResult = {
  ACCEPTED: 'ACCEPTED',
  REJECTED_OUTSIDE_FENCE: 'REJECTED_OUTSIDE_FENCE',
} as const;
export type PunchResult = (typeof PunchResult)[keyof typeof PunchResult];
```

### 1.2 Naming

| Thing | Convention | Example |
| :--- | :--- | :--- |
| Server files | `kebab-case.ts`, suffix by layer | `parcels.service.ts`, `scope-where.ts` |
| React component files | `PascalCase.tsx`, one component per file | `ParcelTimeline.tsx` |
| Hook files | `useX.ts` (camelCase, matches doc 00 §5.2) | `useGeofence.ts` |
| RTK Query API files | `<feature>.api.ts` | `parcels.api.ts` |
| Redux slices | `<feature>.slice.ts` | `ui.slice.ts` |
| Test files | `<name>.test.ts(x)` next to the code, or `__tests__/` for integration | `parcels.service.test.ts` |
| Variables, functions | `camelCase`; booleans prefixed `is/has/can/should` | `isWithinFence` |
| Types, interfaces, classes, components | `PascalCase`; no `I` prefix | `ParcelEvent`, `AppError` |
| Constants (module-level, immutable) | `UPPER_SNAKE_CASE` | `OTP_TTL_MINUTES` |
| Zod schemas | `PascalCase` + `Schema`; inferred type without suffix | `CreateParcelSchema`, `type CreateParcel` |
| Permissions | `<module>:<action>` (doc 00 §5.2) | `parcels:scan` |
| i18n keys | `<namespace>.<screen>.<element>` lower camel | `parcels.detail.verifyOtp` |
| Env vars | `UPPER_SNAKE_CASE`; mobile public vars prefixed `EXPO_PUBLIC_`; web `VITE_` | `DATABASE_URL`, `VITE_API_URL` |
| Branches | see §9 | `feat/mod-04-parcels-otp` |
| DB | per doc 00 §5.2 / doc 02 | `parcel_events` |

Existing `app/` files that use other patterns (`profileApi.ts`, `use-theme.ts`) SHOULD be renamed in the Phase 0 adaptation (E0.8) when touched; new files MUST follow this table.

### 1.3 Folder conventions

```
server/src/
├── core/            config.ts, logger.ts, errors.ts, http/ (middleware), prisma.ts, redis.ts, openapi.ts
├── engines/         workflow/, notifications/, due-dates/, files/, audit/, sequence/, geo/
├── modules/<module>/ (see §2.1)
├── jobs/            BullMQ workers + queue definitions (separate process entry)
├── realtime/        Socket.IO server, namespaces, auth handshake
├── shared/          pure utilities, no I/O (money.ts, dates.ts, pagination.ts)
└── index.ts         API entry; jobs/index.ts worker entry

frontend/src/
├── app/             router.tsx, providers.tsx, store.ts, layouts/
├── features/<feature>/ api/, components/, pages/, hooks/, schemas/, i18n/, index.ts
├── shared/          ui/ (shadcn), api/ (baseApi, generated/), hooks/, lib/, i18n/
└── main.tsx

app/src/            (extends app/.agents/AGENTS.md)
├── app/             Expo Router: (auth)/, (app)/(tabs)/, (app)/<feature>/
├── features/<feature>/ api/, components/, hooks/, schemas/
├── components/ui/   shared primitives (Screen, Button, TextField, FormField, Card, Badge, EmptyState)
├── redux/           api/baseApi.ts, store.ts, hooks.ts, storage.ts, offline/ (queue)
├── lib/             logger.ts, sentry.ts, i18n.ts, permissions.ts, location.ts
├── constants/       theme.ts, index.ts
├── hooks/, types/generated/
```

Module/feature names MUST match doc 00 §7 directories (`notices`, `note-sheets`, `parcels`, `assets`, `compliance`, `incidents`, `visitors`, `fleet`, `attendance`, `leave`, `claims`, `bus`, `chat`, `employees`, `workflow`, `admin`, `dashboards`, `briefings`; web uses `dashboard`, `workforce`, `approvals` as listed).

### 1.4 Imports & boundaries

- Order (enforced by `import/order`): node builtins → external → internal aliases (`@/`) → parent → sibling → type imports last. One blank line between groups. Alphabetised within groups.
- Use path alias `@/` → `src/` in all three apps. No relative imports crossing more than one directory up (`../../` is the maximum).
- Boundaries (`eslint-plugin-boundaries`):
  - server: `modules/*` MAY import `core`, `engines`, `shared`; MUST NOT import another module's internals — only its public `index.ts` (events, types, a narrow service façade). `engines` MUST NOT import `modules`. `shared` imports nothing internal.
  - frontend/app: `features/*` MAY import `shared`/`components/ui`, `redux`; MUST NOT import another feature except via its `index.ts`. `shared` MUST NOT import `features`.
- `import type` for type-only imports (`consistent-type-imports`).

### 1.5 Exports & barrels

- Named exports everywhere. Default exports are allowed only where a framework requires them: React Router lazy route modules, Expo Router screen files, config files.
- One barrel per feature/module (`index.ts`) listing the public surface. No nested barrels, no `export *` from barrels (explicit re-exports only) to keep tree-shaking and boundaries analysable.

### 1.6 Comments, JSDoc, TODOs

- Code explains *what*; comments explain *why*. No commented-out code in PRs.
- JSDoc is REQUIRED on: exported functions in `engines/` and `shared/`, service methods that implement a `BR-` rule (reference it: `/** Implements BR-04-06: OTP attempts limit. */`), zod schemas with non-obvious constraints.
- TODO format: `// TODO(<tracker-id>): <action>` e.g. `// TODO(ONEOPS-231): switch to uuidv7 when extension available`. CI fails on `TODO` without an id and on `FIXME`/`XXX`.

### 1.7 Error message style

- Server error `message` values: English, sentence case, no trailing period, no PII, actionable: `"Parcel is not at a stage where OTP can be verified"`. Clients translate by `code` + `details`, never by parsing `message`.
- Thrown errors always carry a stable `code` from doc 00 §5.1 plus optional `details` (zod issues, field names, state names).
- Never `throw` strings; never swallow errors silently; log once at the boundary (error middleware / job wrapper), not at every layer.

### 1.8 Bilingual strings (ADR-16)

- UI text MUST NOT be hardcoded in components. Every string is an i18n key with `en` and `bn` entries in the feature namespace JSON (`features/<feature>/i18n/{en,bn}.json` on web; `app/src/i18n/<feature>/{en,bn}.json` on mobile).
- Server-generated text (notifications, PDFs, emails, SMS) uses templates stored per type with `en`/`bn` variants; language chosen from `Accept-Language` or `user.preferredLang`.
- Missing `bn` keys fall back to `en` and are flagged by the `i18n:check` script (CI warning in Phases 0–4, error in Phase 5).
- Use ICU plurals/variables (`{{count}}`), never string concatenation. Numbers and dates use `Intl` with locale `bn-BD`/`en-BD`, timezone `Asia/Dhaka`.

### 1.9 Date & time

- Transport: ISO 8601 UTC with `Z`. DB: `timestamptz`. Date-only business fields (`joinDate`, `expiresAt` on licences) are `@db.Date` and transported as `YYYY-MM-DD`.
- Library: `date-fns` + `date-fns-tz` on all platforms. No `moment`, no `dayjs`. No `new Date(string)` parsing of non-ISO input.
- Display in `Asia/Dhaka` via `formatInTimeZone`. Business-day/holiday logic lives in `server/src/shared/dates.ts` only.
- Never compare dates with `==`; use `isBefore/isAfter/isEqual`. Server time is authoritative; device time is recorded as data (`punchedAt`) not trusted for ordering.

### 1.10 Money (ADR-23)

- JSON: decimal **string** (`"48500000.00"`). DB: `Decimal(14,2)`. Server arithmetic: `Prisma.Decimal` (decimal.js). Clients: display only, formatted with `Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' })` or a shared `formatBdt()`; never parse to `number` for computation.
- No `parseFloat`, no `+` arithmetic on money. Rounding: half-up to 2 dp at service boundary only.
- Zod: `MoneySchema = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/)`.

### 1.11 Identifiers (ADR-22)

- Primary keys: `uuid` strings; validated with `z.string().uuid()`.
- Business reference numbers are generated server-side by the Sequence engine; clients never compose them.
- Never expose integer ids (`AuditLog.id` is internal; API returns it as string if at all).

### 1.12 Configuration & secrets

- Environment is read **only** in `core/config.ts` (server), `shared/lib/env.ts` (web), `lib/env.ts` (app); each parses with zod at boot and exports a frozen typed object. `process.env.X` anywhere else fails lint (`no-process-env`).
- No secrets in code, tests, fixtures, logs, or docs. `.env.example` lists every variable with a dummy value. `gitleaks` runs in pre-commit and CI.

### 1.13 Logging

- Server: pino, child logger per request with `requestId`, `userId`; levels `error|warn|info|debug`. Never log tokens, passwords, OTPs, NID, phone numbers, request bodies of auth endpoints, or file contents. Redact paths configured in `core/logger.ts`.
- Web: no `console.*` in committed code (`no-console: error`); use `shared/lib/logger.ts` (Sentry breadcrumbs in prod).
- Mobile: `logger` from `@/lib/logger` (existing); `console.*` fails lint.

---

## 2. Server (Express 5 + Prisma)

### 2.1 Module structure

```
server/src/modules/parcels/
├── parcels.router.ts      routes + OpenAPI registration; wires middleware → controller
├── parcels.controller.ts  HTTP ↔ service mapping only (parse ctx, call service, send envelope)
├── parcels.service.ts     business rules, transactions, engine calls, events
├── parcels.repository.ts  Prisma queries for this module's models (select shapes, pagination)
├── parcels.schemas.ts     zod request/response schemas (+ OpenAPI metadata)
├── parcels.events.ts      typed domain events emitted by the service (consumed by engines/other modules)
├── parcels.policies.ts    permission keys, scope rules, state-transition table
├── parcels.types.ts       internal types not derivable from zod/Prisma (optional)
├── index.ts               public surface: router, events, narrow façade
└── __tests__/
    ├── parcels.service.test.ts       unit (vitest)
    └── parcels.router.int.test.ts    integration (supertest + testcontainers)
```

### 2.2 Request lifecycle

`requestId` → `httpLogger` → `rateLimit` → `authenticate` (JWT → `req.user`) → `authorize(permission)` (loads scope) → `validate({ body, query, params })` (zod) → `idempotency` (if `Idempotency-Key`) → controller → service (transaction boundary) → repository → response envelope → `errorHandler`.

Rules:
- Controllers MUST NOT contain business logic, Prisma calls, or conditionals beyond mapping. One controller function per route.
- Services own transactions. A service method that writes MUST either be wholly inside one `prisma.$transaction` or be explicitly idempotent.
- Repositories expose intention-revealing methods (`findActiveByTrackingNo`), always with explicit `select`; they never throw domain errors, only return `null`/arrays.
- Scope: every list/read in a service calls `scopeWhere(ctx.user, 'parcels:read')` and merges it into the `where` (doc 00 §5.4). Tests MUST include a cross-scope negative case.
- Express 5 handles async errors natively; still wrap handlers in `asyncHandler` to attach the route name for logging.

### 2.3 Errors

```ts
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,          // doc 00 §5.1 codes
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) { super(message); }
}
export class ValidationError extends AppError { constructor(details: unknown) { super('VALIDATION_ERROR', 422, 'Request validation failed', details); } }
export class UnauthenticatedError extends AppError { constructor() { super('UNAUTHENTICATED', 401, 'Authentication required'); } }
export class ForbiddenError extends AppError { constructor(permission?: string) { super('FORBIDDEN', 403, 'Not permitted', permission ? { permission } : undefined); } }
export class NotFoundError extends AppError { constructor(entity: string, id?: string) { super('NOT_FOUND', 404, `${entity} not found`, id ? { id } : undefined); } }
export class ConflictError extends AppError { constructor(message: string, details?: unknown) { super('CONFLICT', 409, message, details); } }
export class InvalidStateTransitionError extends AppError { constructor(from: string, action: string) { super('INVALID_STATE_TRANSITION', 409, `Cannot ${action} from state ${from}`, { from, action }); } }
export class RateLimitedError extends AppError { constructor(retryAfterSec: number) { super('RATE_LIMITED', 429, 'Too many requests', { retryAfterSec }); } }
```

- `errorHandler` maps `AppError` → envelope; zod → `ValidationError`; Prisma `P2002` → `ConflictError`, `P2025` → `NotFoundError`; everything else → `INTERNAL` 500 with Sentry capture and no stack in the response.
- New error codes require a doc 00 §5.1 update in the same PR.

### 2.4 Prisma rules

| Rule | Requirement |
| :--- | :--- |
| P1 | Always `select` (or `include` with nested `select`); never return whole models to clients. Define reusable select objects `parcelListSelect satisfies Prisma.ParcelSelect`. |
| P2 | No N+1: lists load relations with `include`/`select` or a second `findMany ... in`. Reviewers check loops containing `await prisma`. |
| P3 | Transactions: interactive `$transaction(async (tx) => …)` for multi-write; pass `tx` down to repositories. Use `isolationLevel: 'Serializable'` for sequence/seat allocation/OTP attempts; default elsewhere. Keep transactions short; no external I/O inside. |
| P4 | Soft delete: the client extension adds `deletedAt: null` to reads of soft-deletable models and converts `delete` to update. Use `prisma.$extends` from `core/prisma.ts`; raw bypass only in admin purge jobs. |
| P5 | Pagination: offset for admin tables (`page/pageSize`, max 100) via `paginate()` helper returning `{ data, meta }`; **cursor (keyset)** for feeds (notifications, chat, events, audit) via `cursorPaginate()` on `(createdAt, id)`. |
| P6 | Audit: audited models (doc 02 §1) write `AuditLog` through the extension; domain actions call `audit.record(ctx, 'APPROVE', 'NoteSheet', id, { before, after })`. |
| P7 | Raw SQL only in `*.repository.ts` with `Prisma.sql` tagged templates (views, trigram search, `FOR UPDATE`). No string concatenation. |
| P8 | Migrations: one migration per PR, named `YYYYMMDDHHMM_<verb>_<object>`; destructive changes follow expand/contract (doc 02 §7); views/indexes/grants as raw SQL migrations; `prisma migrate diff` output reviewed. |
| P9 | Seeds: `prisma/seed.ts` is idempotent (`upsert` by natural key), split per domain under `prisma/seed/*.ts`, parametrised by env for persona passwords. |

### 2.5 Jobs (BullMQ, ADR-10)

- Queue names `kebab-case` per domain: `notifications`, `workflow-sla`, `due-dates`, `exports`, `files-scan`, `pdf-render`.
- Job names `verb-object` (`send-notification`, `escalate-step`). Payloads are zod-validated at the worker; carry ids, not entities.
- Every job MUST be idempotent (check state before acting; use `jobId` derived from the business key, e.g. `step:${stepId}:reminder`).
- Defaults: `attempts: 5`, exponential backoff from 10 s, `removeOnComplete: 1000`, `removeOnFail: false`; failed jobs after max attempts go to the `<queue>-dlq` queue with an alert.
- Workers run in `server/src/jobs` process; concurrency per queue configured in `config.ts`. No HTTP handler enqueues more than O(1) jobs synchronously — fan-out happens inside a job.

### 2.6 Socket.IO (ADR-11)

- Namespaces: `/notifications`, `/chat`, `/presence`. Handshake with access token; reject on failure; rooms `user:{id}`, `channel:{id}`, `site:{id}`.
- Event names `domain:event` lower camel: `notification:new`, `chat:message`, `approval:updated`. Payloads are zod-validated and typed in `realtime/events.ts`; server→client payloads mirror REST DTOs.
- Clients never trust realtime payloads as source of truth; they invalidate RTK Query tags and refetch (or patch cache optimistically with the same DTO).
- Redis adapter mandatory in all non-local environments.

### 2.7 OpenAPI registration

- `@asteasolutions/zod-to-openapi` registry in `core/openapi.ts`. Each router registers paths with `request`/`responses` schemas, `operationId` = `<module>.<action>` (`parcels.verifyOtp`), tags = module, `security: bearerAuth` unless public.
- Response schemas wrap in `envelope(DataSchema)` / `listEnvelope(ItemSchema)`.
- CI: `openapi:generate` writes `server/openapi.json`; `openapi:lint` (Spectral) and `openapi:diff` (breaking-change check vs `develop`) must pass; clients run `openapi-typescript` to regenerate types (`npm run api:types`), and the generated files are committed.

### 2.8 Testing (ADR-19)

| Layer | Tool | Rules |
| :--- | :--- | :--- |
| Service unit | Vitest | Prisma mocked with `vitest-mock-extended` *or* real DB via Testcontainers when behaviour depends on constraints/transactions (sequence, seats, OTP). Pure rule functions (depreciation, DA, FIFO, haversine) are property/table tested. |
| Router integration | Vitest + Supertest + Testcontainers (PG, Redis) | One file per router; tests auth 401, forbidden 403, scope leakage, validation 422, happy path, state-transition 409. |
| Jobs | Vitest | Worker handler invoked directly with a fake job; idempotency tested by double invocation. |
| Factories | `tests/factories/*.ts` using `@faker-js/faker` | Build DB rows with sensible defaults; never share mutable fixtures. |
| Isolation | One database per Vitest worker (`oneops_test_${VITEST_POOL_ID}`), migrated once, truncated between tests. |
| Coverage | ≥ 80 % lines/branches per module (`vitest --coverage`), ≥ 85 % for `engines/` and `core/`. |

### 2.9 Performance

- Keyset pagination for anything a user scrolls; indexes for every `where`/`orderBy` combination used in a repository (checked with `EXPLAIN` in PR for new list endpoints).
- Redis cache for read models (`dashboards`, `v_licence_dashboard`, permission sets) with key pattern `oneops:<domain>:<id>:<version>` and TTL; invalidation by key or domain event — no "cache forever".
- `ETag`/`If-None-Match` on GET detail endpoints (hash of `updatedAt` + id); `Cache-Control: private, no-store` on everything else.
- Streaming for exports (CSV via `fast-csv` pipe), PDF rendering in the job process, never in request path for documents > 1 page.

---

## 3. Web (React 19 + Redux Toolkit)

### 3.1 Components

- Function components only; props typed with an exported `interface XProps` (no `React.FC`). Children typed as `React.ReactNode`.
- Co-locate styles with Tailwind utility classes; compose with `cn()` (`clsx` + `tailwind-merge`). No CSS modules or styled-components; global CSS only for tokens/fonts in `shared/styles/`.
- shadcn/ui primitives live in `shared/ui/`; feature components compose them. Do not fork a primitive inside a feature.
- Max ~250 lines per component file; split by responsibility (list, filters, detail, dialogs). No prototype-style 2,000-line views.
- States: every data component renders loading (skeleton), error (with retry), empty (with CTA), success. Use `shared/ui/AsyncState`.

### 3.2 Hooks

- `react-hooks/rules-of-hooks` and `exhaustive-deps` as errors. Custom hooks start with `use`, return objects (not tuples) when > 2 values.
- Side effects that fetch data are forbidden in `useEffect` — use RTK Query. `useEffect` is for subscriptions, DOM, and analytics only.

### 3.3 RTK Query (ADR-13)

- Single `baseApi` in `shared/api/baseApi.ts` with `fetchBaseQuery` (`credentials: 'include'`, `baseUrl: env.VITE_API_URL + '/api/v1'`), `reauth` wrapper calling `POST /auth/refresh` once with a mutex, and `tagTypes` declared centrally (one tag per resource noun: `Parcel`, `ParcelEvent`, `ApprovalInbox`, …).
- Each feature has `features/<feature>/api/<feature>.api.ts` using `baseApi.injectEndpoints({ overrideExisting: false })`; export hooks from there.
- `providesTags`: list → `[{ type: 'Parcel', id: 'LIST' }, ...items.map(id)]`; detail → `[{ type, id }]`. `invalidatesTags` on mutations by id and `LIST`. Realtime events dispatch `baseApi.util.invalidateTags`.
- `transformResponse` unwraps the `{ data, meta }` envelope and converts money strings to `Decimal`-safe display models only if needed; keep DTOs otherwise unchanged.
- Server state lives **only** in RTK Query cache. Slices hold UI state (filters, selections, theme, sidebar). Copying query results into a slice fails review.
- Use `selectFromResult` to subscribe to a sub-slice of a query and `skip` for conditional queries. Prefer `useXQuery(arg, { pollingInterval })` over hand-rolled timers.
- Optimistic updates via `onQueryStarted` + `updateQueryData` for approve/acknowledge/read actions; roll back on error.
- Generated types from `shared/api/generated/schema.d.ts` type every endpoint (`paths['/parcels']['get']['responses']['200']…` via helper aliases).

### 3.4 Forms (ADR-15)

- `react-hook-form` + `zodResolver`. Schemas in `features/<feature>/schemas/*.ts`, built from (or identical to) the API DTO shape; when the server publishes the zod schema via OpenAPI constraints, mirror the constraints and add a contract test against a sample payload.
- Use `shared/ui/form/*` wrappers (`FormField`, `FormSelect`, `FormDate`, `FormMoney`) that bind labels, errors, `aria-*` and i18n.
- Server `VALIDATION_ERROR.details` are mapped to field errors with `setError`; unknown fields go to a form-level alert.

### 3.5 Routing (ADR-12)

- `createBrowserRouter` data router; every feature exposes `routes.tsx` with `lazy: () => import('./pages/X')`. Route paths in kebab-case mirror modules (`/note-sheets/:id`).
- Guards: `RequireAuth` and `RequirePermission(permission)` layout routes; unauthorised → 403 page, not redirect loops.
- Loaders are optional and MAY prefetch via `store.dispatch(api.endpoints.x.initiate())`; no data fetching in components on mount beyond RTK hooks.

### 3.6 i18n

- `react-i18next`; namespace per feature; `useTranslation('parcels')`. Keys per §1.2. `Trans` component for rich text. Dates/numbers through `shared/lib/format.ts` (`formatDate`, `formatBdt`).

### 3.7 Accessibility

- `jsx-a11y` strict. Every interactive element is a `button`/`a`/input with a label; icons have `aria-hidden` and a visible or `sr-only` text.
- Keyboard: dialogs trap focus and restore on close (Radix handles this; custom overlays MUST too). Visible focus ring (`focus-visible:ring`).
- Colour contrast ≥ 4.5:1 with the brand tokens; status is never colour-only (add icon/text).
- Target: WCAG 2.1 AA; axe checks in RTL tests for shared components.

### 3.8 Performance

- Code splitting per route (lazy) and per heavy dialog. Initial bundle ≤ 300 kB gz; route chunks ≤ 150 kB gz (CI `size-limit`).
- `memo`/`useMemo`/`useCallback` only when a profiler measurement justifies it; add a comment with the finding.
- Virtualise lists > 100 rows (`@tanstack/react-virtual`). Images lazy with explicit dimensions.
- Avoid context for high-frequency state; use RTK selectors with `selectFromResult`.

### 3.9 Testing

- Vitest + React Testing Library + MSW. Test behaviour from the user's perspective (`getByRole`, `findByText`), not implementation (no snapshot tests of large trees, no testing of internal state).
- MSW handlers in `shared/testing/handlers/<feature>.ts` built from generated types; one `renderWithProviders()` helper sets up store, router, i18n.
- Playwright for critical paths listed in doc 09 §9, run against `dev` nightly and on `release/*`. Page objects per feature in `frontend/e2e/`.
- Storybook is OPTIONAL; if used, stories live next to shared UI components only and are not a quality gate.

---

## 4. Mobile (Expo SDK 56 + Redux Toolkit)

Extends `app/.agents/AGENTS.md`, `skills/rtk-query`, `skills/expo-router-auth`, `skills/expo-install`. Those remain valid; the following adds OneOps-specific rules and resolves differences.

### 4.1 Structure & routing

- Expo Router groups: `(auth)/`, `(app)/(tabs)/` (Home, Approvals, Notifications, Profile) and `(app)/<feature>/` stacks per module (`(app)/attendance/punch.tsx`, `(app)/parcels/[id].tsx`). Typed routes enabled; `router.replace` for auth transitions.
- Every screen wraps content in the shared `Screen` component (safe area, keyboard avoidance). Headers via `ScreenHeader`.
- Feature code lives in `src/features/<feature>/` (api, components, hooks, schemas); route files under `src/app/` are thin (compose a feature screen component, read params).

### 4.2 State, API, storage

- `baseApi` is re-pointed to `${EXPO_PUBLIC_API_URL}/api/v1`; refresh endpoint `POST /auth/refresh` with the SecureStore refresh token (replaces the starter's `/api/token/refresh/`). Public endpoints listed in `skipAuth` as per the skill.
- Feature APIs via `baseApi.injectEndpoints` in `features/<feature>/api/<feature>.api.ts`; tags declared in `baseApi.ts`. Same tag/invalidation rules as §3.3.
- Tokens, refresh tokens, device id: `expo-secure-store` only. Preferences (lang, theme, last site): AsyncStorage/MMKV via redux-persist whitelist. Never persist query cache except the offline queue.
- Use `useAppDispatch`/`useAppSelector`; selectors `selectX` at the bottom of slices.

### 4.3 Offline queue (ADR-18)

- Only mutations marked offline-capable may be queued: attendance punch, incident report, parcel scan/OTP, visitor check-in/out, custody acknowledgement. Each is declared in `redux/offline/registry.ts` with its endpoint, idempotency-key builder, conflict policy, and max age.
- Queue entries store `{ id, endpoint, args, idempotencyKey, createdAt, attempts, lastError }` in SecureStore-backed persist; replay FIFO on reconnect (`useNetworkStatus`) with the original `Idempotency-Key` and `X-Client-Timestamp`.
- UI MUST show queued state (badge + list under Profile → Pending uploads) and surface 409/422 replay failures for user action; never drop silently.
- Reads while offline come from RTK cache (`keepUnusedDataFor` raised for offline-capable features); show `OfflineBanner`.

### 4.4 Device capabilities & permissions UX

- Permission flow: explain (in-app sheet with reason, BN/EN) → request → handle denied (settings deep link) → degrade gracefully. Never request on app start; request at the moment of use. Pattern in `hooks/usePermission.ts`.
- Location: `expo-location` foreground for punch/scan (accuracy `Highest`, timeout 15 s, reject if `accuracy > 50 m` or `mocked === true`); background location only in the driver trip flow with explicit consent screen and a persistent notification.
- Camera/QR: `expo-camera` barcode scanner wrapped by `components/QrScanner` with torch + manual entry fallback.
- Push: `expo-notifications`; register token on login and on token refresh; unregister on logout; CRITICAL notifications use Android channel `critical` with sound + `ackRequired` screen.
- Biometrics (`expo-local-authentication`) only for app unlock; never as attendance proof.
- Adding a native module requires: justification in the PR, `npx expo install`, config plugin instead of editing `android/`/`ios/`, dev-client rebuild note, and an entry in doc 05.

### 4.5 Lists, images, styling

- Lists > 20 items use `@shopify/flash-list` with `estimatedItemSize`; item components are `memo`'d with stable callbacks.
- Images via `expo-image` with `cachePolicy="memory-disk"`.
- Styling: `StyleSheet.create` + tokens from `constants/theme.ts` (brand tokens from ADR-14 added); colours via `useTheme()`. No NativeWind/Tailwind (per AGENTS.md). Reuse `components/ui/*`.

### 4.6 Logging & errors

- `logger` from `@/lib/logger`; `console.*` fails lint. Sentry init remains opt-in by DSN. `ErrorBoundary` wraps the root; feature screens handle query errors with retry UI.

### 4.7 Testing

- Jest + `jest-expo` + RNTL; `await render(...)` (React 19). Tests next to code. Mock `expo-location`/`expo-camera` with `jest.mock`; offline queue has deterministic replay tests.
- Maestro flows in `app/.maestro/` for the smoke list in doc 09 §9; run on EAS `preview` builds nightly.

---

## 5. Git & Workflow

### 5.1 Commits (Conventional Commits, ADR-20)

`<type>(<scope>): <subject>` — types `feat|fix|chore|docs|refactor|test|perf|ci|build|revert`; scope = module (`mod-04`, `parcels`), app (`server|web|app|infra`), or engine (`workflow`, `notifications`). Subject imperative, ≤ 72 chars, no trailing period. Body explains why; footer `Refs: BR-04-06, ONEOPS-231` and `BREAKING CHANGE:` when applicable.

### 5.2 Branches

`<type>/<scope>-<short-desc>` e.g. `feat/mod-04-parcels-otp`, `fix/web-approvals-history-label`, `chore/ci-openapi-diff`. Branch from `develop`; `release/x.y` and `hotfix/x.y.z` from `main` rules in doc 09 §10.

### 5.3 Pull requests

- Size ≤ 400 changed LOC (excluding generated files, lockfiles, snapshots, migrations SQL). Larger changes are split (stacked PRs allowed).
- Template (Appendix E) is mandatory; CI checks that boxes relevant to the diff are ticked.
- Reviews: 1 approval default; **2 approvals including the Tech Lead** for changes under `server/src/core/auth*`, `server/src/engines/workflow`, `*.policies.ts`, `prisma/migrations`, `infra/`, CI workflows, and dependency additions.
- Squash merge only; the squash message follows §5.1. Delete branch on merge.
- Reviewer checklist: boundaries respected, scope filter present, tests for negative paths, i18n keys, audit entries, OpenAPI updated, no secrets, migration reversible.

### 5.4 Versioning & changelog

- Semver tags `vX.Y.Z` on `main`; minor per release train, patch for hotfixes. `CHANGELOG.md` generated by `conventional-changelog` in the release PR; mobile `app.json` `version` and `runtimeVersion` bumped in the same PR.

---

## 6. Tooling Configuration

### 6.1 ESLint (flat config) — outline per app

Common base (`eslint.config.base.mjs` copied into each package; no shared package per doc 00 §3):

```js
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier';

export const base = tseslint.config(
  { ignores: ['dist', 'coverage', '**/generated/**', 'node_modules'] },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { projectService: true } } },
  importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript,
  security.configs.recommended,
  {
    plugins: { boundaries, unicorn },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import/order': ['error', { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'type'], 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
      'import/no-default-export': 'error',
      'import/no-cycle': 'error',
      'no-console': 'error',
      'no-process-env': 'error',
      'no-warning-comments': ['error', { terms: ['fixme', 'xxx'] }],
      'unicorn/filename-case': ['error', { cases: { kebabCase: true, pascalCase: true } }],
      'unicorn/no-null': 'off', 'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-for-each': 'error', 'unicorn/prefer-node-protocol': 'error',
      'boundaries/element-types': ['error', { default: 'disallow', rules: [/* per app, see §1.4 */] }],
    },
  },
  prettier,
);
```

| App | Additions |
| :--- | :--- |
| `server/` | `plugin:n` subset (`n/no-missing-import` off for aliases), override `no-process-env` allowed only in `src/core/config.ts`, `import/no-default-export` off for `prisma/seed.ts` |
| `frontend/` | `eslint-plugin-react` (jsx-runtime), `react-hooks` (both rules error), `jsx-a11y` strict, `react-refresh/only-export-components`, `import/no-default-export` off for `**/pages/**` and `routes.tsx`, `tailwindcss` plugin (class order) |
| `app/` | Keep `eslint-config-expo/flat` as first layer, then the base; `import/no-default-export` off for `src/app/**` (Expo Router); `react-native/no-inline-styles` warn; `no-restricted-imports` blocking `react-native` `Image`/`FlatList` in favour of `expo-image`/`FlashList` |

### 6.2 Prettier

`{ "printWidth": 100, "singleQuote": true, "trailingComma": "all", "semi": true, "tabWidth": 2, "endOfLine": "lf" }` for `server/` and `frontend/`. `app/` currently has `singleQuote: false` (starter); it MUST be switched to `true` in the Phase 0 adaptation PR with a single formatting commit (`chore(app): prettier single quotes`) so that all three apps share one config. Tailwind class sorting via `prettier-plugin-tailwindcss` on web.

### 6.3 EditorConfig

```
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
[*.md]
trim_trailing_whitespace = false
```

### 6.4 lint-staged, commitlint, Husky

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{js,mjs,cjs,json,md,yml,yaml,css}": ["prettier --write"],
  "prisma/schema.prisma": ["prisma format"]
}
```

- `commitlint.config.mjs`: `@commitlint/config-conventional` + `scope-enum` generated from module/app list; `subject-max-length` 72.
- Husky hooks (each package has its own `.husky/`; root hooks delegate to changed packages):
  - `pre-commit`: `lint-staged` + `tsc --noEmit -p tsconfig.json` scoped to the package(s) with staged files + `gitleaks protect --staged`.
  - `commit-msg`: `commitlint --edit $1`.
  - `pre-push`: `vitest run --changed origin/develop` (server/web) / `jest --onlyChanged` (app); skip allowed only with `SKIP_TESTS=1` and a reason in the PR.
- Never bypass hooks with `--no-verify` (AGENTS.md rule retained).

### 6.5 tsconfig bases

| File | Key settings |
| :--- | :--- |
| `server/tsconfig.json` | `target ES2022`, `module NodeNext`, `moduleResolution NodeNext`, `outDir dist`, `rootDir src`, `paths { "@/*": ["./src/*"] }` (resolved at build by `tsc-alias`), strict set from §1.1, `types: ["node"]` |
| `frontend/tsconfig.json` | `target ES2022`, `module ESNext`, `moduleResolution bundler`, `jsx react-jsx`, `lib ["ES2022","DOM","DOM.Iterable"]`, `noEmit`, `paths @/*`, strict set; `tsconfig.node.json` for Vite config |
| `app/tsconfig.json` | `extends expo/tsconfig.base`, strict set added (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — enable `exactOptionalPropertyTypes` after fixing starter types in E0.8), `paths @/*` as today |
| All | `skipLibCheck: true`, `isolatedModules: true`, `forceConsistentCasingInFileNames: true`, `resolveJsonModule: true` |

---

## 7. Documentation Standards

- **ADRs:** `docs/platform/adr/NNNN-title.md` (4-digit, kebab title). Template in Appendix F. ADR-01..25 in doc 00 are the seed; new decisions get a file and a one-line entry in doc 00 §4. Status values: Proposed, Accepted, Superseded (by NNNN), Deprecated.
- **Module README:** every `server/src/modules/<module>/README.md` and `frontend/src/features/<feature>/README.md` follows Appendix G (purpose, BR coverage, endpoints, permissions, events, jobs, open items). Updated in the same PR as behaviour changes.
- **API docs:** generated from OpenAPI; served at `/api/docs` (authenticated outside `local`). Hand-written API prose lives only in doc 03 and must match `operationId`s.
- **Suite sync rule:** any behaviour change updates doc 06 (business rule) **and** doc 03 (endpoint) in the same PR; schema changes update doc 02; new cross-cutting decisions update doc 00. PR template has a "Docs" section; reviewers reject behaviour PRs without doc diffs or an explicit "no doc impact" justification.
- **Diagrams:** Mermaid in Markdown; no binary diagram sources.
- **Changelog & release notes:** per §5.4; user-facing notes in EN/BN published through MOD-01.

---

## 8. AI-Assisted Development

- Entry point: root `AGENTS.md`. Cursor rules live in `.cursor/rules/`: always-on `project.mdc` and `security.mdc`; path-scoped `backend.mdc` (`server/**`), `frontend.mdc` (`frontend/**`), `mobile.mdc` (`app/**`), `database-prisma.mdc` (`server/prisma/**`), `api-conventions.mdc` (router/schema/api files), `testing.mdc` (test files), `prototype-reference.mdc` (`client/**`, read-only); on-request `handoff-summary.mdc`. Skills under `.cursor/skills/`: `port-prototype-module`, `add-backend-module`, `add-web-feature`, `add-mobile-screen`, `prisma-migration`, `update-platform-docs`, plus the existing `app/.agents/skills/*`.
- Before any task, an agent MUST read `docs/platform/00` and the relevant module section of doc 06, then this document. Agents MUST NOT contradict an ADR; if a change seems necessary, they propose an ADR instead.
- Agents MUST NOT edit anything under `client/` (frozen prototype) or any `.env*` file, and MUST NOT run destructive DB commands (`migrate reset`, `db push --force-reset`, `DROP`) without explicit human approval.
- Agents MUST NOT commit secrets, MUST explain any new dependency (why, alternatives considered, size, licence) in the PR, and MUST NOT replace an existing library (project.mdc).
- Generated code MUST pass the same gates; agents run `lint`, `typecheck`, `test` for touched packages before declaring work done and report results.
- Agents keep edits scoped to the task; unrelated refactors are proposed, not performed. Large tasks get a short plan first (project.mdc "Workflow").
- Handoff: when a session ends mid-task, the agent writes a handoff note (what changed, files, decisions, remaining work, commands run) using the template in `.cursor/rules/handoff-summary.mdc`.

---

## Appendix A — Server module skeleton

`parcels.schemas.ts`

```ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const VerifyOtpParamsSchema = z.object({ id: z.string().uuid() });
export const VerifyOtpBodySchema = z.object({
  otp: z.string().regex(/^\d{6}$/).openapi({ example: '482913' }),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type VerifyOtpBody = z.infer<typeof VerifyOtpBodySchema>;

export const ParcelSchema = z.object({
  id: z.string().uuid(),
  trackingNo: z.string(),
  status: z.enum(['CREATED', 'DISPATCHED', 'IN_TRANSIT', 'AT_GATE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_INITIATED', 'RETURN_IN_TRANSIT', 'RETURNED', 'LOST', 'DAMAGED', 'QUARANTINED']),
  declaredValue: z.string().nullable(),           // money as string
  deliveredAt: z.string().datetime().nullable(),
}).openapi('Parcel');
```

`parcels.policies.ts`

```ts
export const ParcelPermissions = { read: 'parcels:read', scan: 'parcels:scan', verifyOtp: 'parcels:verify-otp' } as const;

/** Allowed status transitions (BR-04-04). */
export const ParcelTransitions: Readonly<Record<string, readonly string[]>> = {
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURN_INITIATED', 'QUARANTINED'],
  AT_GATE: ['OUT_FOR_DELIVERY', 'QUARANTINED'],
};
```

`parcels.repository.ts`

```ts
import type { Prisma, PrismaClient } from '@prisma/client';

export const parcelDetailSelect = {
  id: true, trackingNo: true, status: true, declaredValue: true, deliveredAt: true,
  otpHash: true, otpExpiresAt: true, otpAttempts: true, recipientUserId: true,
} satisfies Prisma.ParcelSelect;

export class ParcelsRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient) {}

  findById(id: string, scope: Prisma.ParcelWhereInput) {
    return this.db.parcel.findFirst({ where: { id, ...scope }, select: parcelDetailSelect });
  }

  markDelivered(id: string, data: { deliveredAt: Date }) {
    return this.db.parcel.update({ where: { id }, data: { ...data, status: 'DELIVERED', otpHash: null }, select: parcelDetailSelect });
  }

  incrementOtpAttempts(id: string) {
    return this.db.parcel.update({ where: { id }, data: { otpAttempts: { increment: 1 } }, select: { otpAttempts: true } });
  }
}
```

`parcels.service.ts`

```ts
import bcrypt from 'bcryptjs';
import { isBefore } from 'date-fns';

import { audit } from '@/engines/audit';
import { scopeWhere } from '@/core/http/scope';
import { ForbiddenError, InvalidStateTransitionError, NotFoundError } from '@/core/errors';
import type { RequestContext } from '@/core/http/context';
import { prisma } from '@/core/prisma';

import { ParcelEvents } from './parcels.events';
import { ParcelPermissions, ParcelTransitions } from './parcels.policies';
import { ParcelsRepository } from './parcels.repository';
import type { VerifyOtpBody } from './parcels.schemas';

const OTP_MAX_ATTEMPTS = 5;

export class ParcelsService {
  /** Implements BR-04-06: recipient OTP verification with attempt limit and expiry. */
  async verifyOtp(ctx: RequestContext, parcelId: string, body: VerifyOtpBody) {
    return prisma.$transaction(async (tx) => {
      const repo = new ParcelsRepository(tx);
      const parcel = await repo.findById(parcelId, scopeWhere(ctx.user, ParcelPermissions.verifyOtp));
      if (!parcel) throw new NotFoundError('Parcel', parcelId);
      if (!ParcelTransitions[parcel.status]?.includes('DELIVERED')) {
        throw new InvalidStateTransitionError(parcel.status, 'verify OTP');
      }
      if (!parcel.otpHash || !parcel.otpExpiresAt || isBefore(parcel.otpExpiresAt, ctx.now)) {
        throw new ForbiddenError('otp-expired');
      }
      if (parcel.otpAttempts >= OTP_MAX_ATTEMPTS) throw new ForbiddenError('otp-locked');

      const ok = await bcrypt.compare(body.otp, parcel.otpHash);
      if (!ok) {
        await repo.incrementOtpAttempts(parcel.id);
        throw new ForbiddenError('otp-invalid');          // no hint of the correct code (T25)
      }
      const updated = await repo.markDelivered(parcel.id, { deliveredAt: ctx.now });
      await audit.record(ctx, 'OTP_VERIFIED', 'Parcel', parcel.id, { after: { status: updated.status } }, tx);
      ctx.events.emit(ParcelEvents.delivered, { parcelId: parcel.id, actorId: ctx.user.id, lat: body.lat, lng: body.lng });
      return updated;
    }, { isolationLevel: 'Serializable' });
  }
}
```

`parcels.controller.ts` and `parcels.router.ts`

```ts
// controller
export const parcelsController = {
  verifyOtp: asyncHandler(async (req, res) => {
    const { id } = req.valid.params as VerifyOtpParams;
    const data = await parcelsService.verifyOtp(req.ctx, id, req.valid.body as VerifyOtpBody);
    res.status(200).json({ data });
  }),
};

// router
export const parcelsRouter = Router();
registerPath({
  method: 'post', path: '/parcels/{id}/verify-otp', operationId: 'parcels.verifyOtp', tags: ['parcels'],
  request: { params: VerifyOtpParamsSchema, body: jsonBody(VerifyOtpBodySchema) },
  responses: { 200: envelope(ParcelSchema), 403: errorResponse(), 404: errorResponse(), 409: errorResponse() },
});
parcelsRouter.post(
  '/:id/verify-otp',
  authenticate, authorize(ParcelPermissions.verifyOtp),
  validate({ params: VerifyOtpParamsSchema, body: VerifyOtpBodySchema }),
  idempotent(), parcelsController.verifyOtp,
);
```

## Appendix B — RTK Query feature API (web; mobile identical apart from import paths)

```ts
// frontend/src/features/parcels/api/parcels.api.ts
import { baseApi } from '@/shared/api/baseApi';
import type { ApiData, ApiList, components } from '@/shared/api/types';

export type Parcel = components['schemas']['Parcel'];
export interface ListParcelsArgs { page?: number; pageSize?: number; status?: Parcel['status']; q?: string }

export const parcelsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listParcels: build.query<ApiList<Parcel>, ListParcelsArgs>({
      query: (params) => ({ url: '/parcels', params }),
      providesTags: (result) =>
        result ? [{ type: 'Parcel', id: 'LIST' }, ...result.data.map((p) => ({ type: 'Parcel' as const, id: p.id }))] : [{ type: 'Parcel', id: 'LIST' }],
    }),
    getParcel: build.query<Parcel, string>({
      query: (id) => `/parcels/${id}`,
      transformResponse: (res: ApiData<Parcel>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Parcel', id }],
    }),
    verifyParcelOtp: build.mutation<Parcel, { id: string; otp: string; idempotencyKey: string }>({
      query: ({ id, otp, idempotencyKey }) => ({
        url: `/parcels/${id}/verify-otp`, method: 'POST', body: { otp }, headers: { 'Idempotency-Key': idempotencyKey },
      }),
      transformResponse: (res: ApiData<Parcel>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Parcel', id }, { type: 'Parcel', id: 'LIST' }, 'ParcelEvent'],
    }),
  }),
  overrideExisting: false,
});

export const { useListParcelsQuery, useGetParcelQuery, useVerifyParcelOtpMutation } = parcelsApi;
```

## Appendix C — React page with RHF form (web)

```tsx
// frontend/src/features/parcels/pages/VerifyOtpPage.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useGetParcelQuery, useVerifyParcelOtpMutation } from '../api/parcels.api';
import { VerifyOtpFormSchema, type VerifyOtpForm } from '../schemas/verify-otp.schema';
import { AsyncState } from '@/shared/ui/AsyncState';
import { Button } from '@/shared/ui/button';
import { Form, FormField } from '@/shared/ui/form';
import { applyServerErrors } from '@/shared/lib/forms';
import { toast } from '@/shared/ui/toast';

export default function VerifyOtpPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation('parcels');
  const parcel = useGetParcelQuery(id, { skip: !id });
  const [verifyOtp, { isLoading }] = useVerifyParcelOtpMutation();
  const form = useForm<VerifyOtpForm>({ resolver: zodResolver(VerifyOtpFormSchema), defaultValues: { otp: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await verifyOtp({ id, otp: values.otp, idempotencyKey: crypto.randomUUID() }).unwrap();
      toast.success(t('detail.otpVerified'));
    } catch (err) {
      applyServerErrors(err, form, t);
    }
  });

  return (
    <AsyncState query={parcel} empty={t('detail.notFound')}>
      {(data) => (
        <section className="mx-auto max-w-md space-y-6">
          <h1 className="text-xl font-semibold">{t('detail.verifyTitle', { trackingNo: data.trackingNo })}</h1>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField control={form.control} name="otp" label={t('detail.otpLabel')} inputMode="numeric" autoComplete="one-time-code" />
              <Button type="submit" disabled={isLoading} className="w-full">{t('detail.verifyCta')}</Button>
            </form>
          </Form>
        </section>
      )}
    </AsyncState>
  );
}
```

## Appendix D — Expo screen with offline mutation

```tsx
// app/src/app/(app)/attendance/punch.tsx
import { useTranslation } from 'react-i18next';

import { Button, Screen } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useOfflineMutation } from '@/redux/offline/useOfflineMutation';
import { useCurrentLocation } from '@/features/attendance/hooks/useCurrentLocation';
import { usePunchMutation } from '@/features/attendance/api/attendance.api';
import { Toast } from '@/lib/toast';

export default function PunchScreen() {
  const { t } = useTranslation('attendance');
  const { getFix, status } = useCurrentLocation({ maxAccuracyM: 50 });
  const punch = useOfflineMutation(usePunchMutation, {
    key: 'attendance.punch',
    idempotencyKey: (args) => `${args.employeeId}:${args.type}:${args.punchedAt}`,
    onQueued: () => Toast.show({ type: 'info', text1: t('punch.queuedOffline') }),
  });

  const onPunch = async (type: 'IN' | 'OUT') => {
    const fix = await getFix();                 // throws PermissionDenied / LowAccuracy / MockLocation
    if (!fix) return;
    await punch.run({
      type, punchedAt: new Date().toISOString(),
      lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM, isMockLocation: fix.mocked, deviceId: fix.deviceId,
    });
  };

  return (
    <Screen>
      <ScreenHeader title={t('punch.title')} />
      <Button label={t('punch.in')} onPress={() => void onPunch('IN')} disabled={status === 'locating' || punch.isLoading} />
      <Button label={t('punch.out')} variant="secondary" onPress={() => void onPunch('OUT')} disabled={status === 'locating' || punch.isLoading} />
    </Screen>
  );
}
```

## Appendix E — PR template (`.github/pull_request_template.md`)

```markdown
## Summary
<!-- What and why. Link stories / BR ids: Refs ONEOPS-123, BR-04-06 -->

## Type
- [ ] feat  - [ ] fix  - [ ] refactor  - [ ] chore/ci  - [ ] docs  - [ ] test  - [ ] perf

## Scope
- [ ] server  - [ ] web  - [ ] app  - [ ] infra  - [ ] docs/platform

## Checklist
- [ ] ≤ 400 LOC (or stacked PR explained)
- [ ] Tests added/updated; negative cases (401/403/scope/422/409) covered
- [ ] Permission + scope checks present for new endpoints/screens
- [ ] Audit log verified for new mutations
- [ ] OpenAPI updated; `npm run api:types` regenerated in frontend/app
- [ ] i18n keys added for `en` and `bn` (BN flagged `needs-review` if machine draft)
- [ ] Offline behaviour considered (mobile)
- [ ] Migration reversible / expand-contract plan (if schema change)
- [ ] No secrets, no `console.*`, no `any`, no `TODO` without id
- [ ] New dependency justified below (if any)

## Docs
- [ ] doc 06 updated  - [ ] doc 03 updated  - [ ] doc 02 updated  - [ ] ADR added  - [ ] No doc impact (why: …)

## Screenshots / recordings
<!-- web + mobile, EN and BN where UI changed -->

## Deployment notes
<!-- env vars, jobs, seed, feature flags, manual steps -->
```

## Appendix F — ADR template (`docs/platform/adr/NNNN-title.md`)

```markdown
# NNNN — <Title>
Status: Proposed | Accepted | Superseded by NNNN | Deprecated
Date: YYYY-MM-DD
Deciders: <names/roles>

## Context
## Decision
## Consequences
### Positive
### Negative / risks
## Alternatives considered
## References (docs, BR ids, PRs)
```

## Appendix G — Module README template

```markdown
# <module> (MOD-NN)
Purpose · Owner · Phase
## Business rules covered
| BR id | Summary | Status |
## Endpoints (operationId → method path → permission)
## Events emitted / consumed
## Jobs
## Data (models touched, views)
## Open items / known gaps
```

## Appendix H — Commit examples

```
feat(mod-04): verify recipient OTP with attempt limit and expiry

Implements BR-04-06. OTP compared with bcrypt, 5 attempts max, 10 min TTL.
Emits parcel.delivered for notification fan-out.

Refs: ONEOPS-231, BR-04-06
```

```
fix(frontend/approvals): show actual decision label in history tab

History rendered every item as Approved regardless of decisionStatus
(prototype defect §15.6).

Refs: ONEOPS-240
```

```
chore(ci): add openapi breaking-change check against develop
perf(mod-17): keyset pagination for approvals inbox
docs(platform): add ADR-0026 SMS provider fallback strategy
refactor(app/attendance): extract useCurrentLocation hook
test(workflow): cover parallel step escalation
```

## Appendix I — Document history

| Version | Date | Change |
| :-- | :-- | :-- |
| 1.0 | 1 Nov 2026 | Baseline aligned with docs 00/02, project.mdc, app/.agents |
