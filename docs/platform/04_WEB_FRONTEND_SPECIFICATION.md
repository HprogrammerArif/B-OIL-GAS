# 04 — Web Frontend Specification (React 19 + React Router 7 + RTK Query)

**Document:** 04 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Audience:** Web engineers, QA, design, DevOps
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (ADR-12..16, ADR-19, ADR-20, §5, §7), `02_DATABASE_SCHEMA.md` (entity/enum names), `03_API_SPECIFICATION.md` (endpoint paths), `06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` (business rules). Where this document names an endpoint, the path follows doc 00 §5.1 conventions and must match doc 03; if doc 03 differs, doc 03 wins and the hook name here is renamed accordingly.

---

## 1. Purpose, Scope, Audience

### 1.1 Purpose
Defines how the production web application in `frontend/` is built: stack, folder structure, routing, state, realtime, design system, shell, per-module pages, forms, i18n, performance, accessibility, client security, error handling, testing, configuration. It is the contract between the web team and the backend/API team and the acceptance baseline for QA.

### 1.2 Scope
- In scope: every screen of the 18 modules (MOD-01 … MOD-18), authentication screens, admin, profile, notifications, shell. Desktop (≥1280 px) and tablet (≥768 px) are first-class; phone layouts must be usable (no horizontal scroll, 44 px targets) but the native app (`app/`, doc 05) is the primary phone client.
- Out of scope: native/mobile (doc 05), server behaviour (doc 01), API contract details (doc 03), infra (doc 08).

### 1.3 Relationship to the prototype (`client/`)
`client/` is the **frozen visual and functional reference** (documented in `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`). It is never modified and never imported by `frontend/`. The production app must reproduce its:
- Visual language: crimson `#A51C30`, navy/slate `#0B132B`, gold `#D4AF37`, canvas `#F8FAFC`; Inter body, Outfit display; 272 px dark sidebar, 68 px white topbar; card/KPI/pill-tab/kanban idioms.
- UX: role-tailored sidebar with live badges, bilingual EN/BN everywhere, Ctrl+K command palette, notification bell, announcement banner, lock screen, right-hand detail drawers, letterhead documents.
- Module behaviours: the state machines and rules verified in the report §9 — except where the report flags a defect or a simulation (§13/§15). Those are replaced by real server behaviour defined in docs 01/03/06.

What is **not** carried over: hand-rolled observable stores (→ RTK Query), inline `t(en, bn)` pairs (→ i18next), the view-switch without URLs (→ React Router), 12 k lines of hand-written CSS (→ Tailwind v4 + shadcn/ui themed with the same tokens), string-matched identity (→ `user.id` from `/auth/me`), client-side role gating (→ permissions from the server), persona switcher in the user menu (→ admin "impersonate" is out of scope v1; QA logs in as seeded users).

---

## 2. Technology Stack

Major versions only (ADR-12..16, 19, 20). Exact pins live in `frontend/package.json`; renovate keeps them current within the major.

| Package | Major | Role | Why this one |
| :--- | :-- | :--- | :--- |
| `react`, `react-dom` | 19 | UI runtime | Client requirement (ADR-12); Actions/`useOptimistic` available; Suspense-first lazy routes |
| `react-router` | 7 | Routing | Data router with `lazy()` per route, loaders not used for data (RTK Query owns data), `errorElement` per route, typed params |
| `@reduxjs/toolkit`, `react-redux` | 2 / 9 | State + server cache | ADR-13; RTK Query provides cache, tags, polling, optimistic updates; single `baseApi` |
| `redux-persist` | 6 | Persist `ui` and non-secret `auth` slice fields only | Remember sidebar collapse, language, last route; never tokens |
| `tailwindcss`, `@tailwindcss/vite` | 4 | Styling | ADR-14; CSS-first `@theme` config maps prototype tokens 1:1 |
| `shadcn/ui` (copied components on `radix-ui`) | — | Accessible primitives | Owned source, Radix a11y (Dialog, Popover, DropdownMenu, Tabs, Tooltip, Command, Sheet, Toast via sonner) |
| `lucide-react` | latest | Icons | Same icon set as prototype → identical glyphs |
| `react-hook-form`, `@hookform/resolvers` | 7 / 3 | Forms | ADR-15; uncontrolled perf for long forms (claims lines, requisitions) |
| `zod` | 3 | Schemas | Shared pattern with server; `z.infer` types for forms |
| `i18next`, `react-i18next`, `i18next-http-backend` | 24 / 15 | i18n | ADR-16; namespaces per module, lazy-loaded JSON |
| `socket.io-client` | 4 | Realtime | ADR-11 server uses Socket.IO; namespaces `/notifications`, `/chat`, `/presence` |
| `date-fns`, `date-fns-tz` | 4 / 3 | Dates | Tree-shakable; `formatInTimeZone(..., 'Asia/Dhaka')` |
| `recharts` | 2 | Charts | Dashboard KPIs, depreciation schedule, refinery output; SVG, SSR-free |
| `@tanstack/react-table` | 8 | Headless tables | Sorting/column visibility/selection for every list; styling stays in our `DataTable` |
| `@tanstack/react-virtual` | 3 | Virtualisation | Lists > 100 rows (audit logs, attendance roster, chat) |
| `sonner` | 1 | Toasts | Replaces `ToastManager`; promise toasts for mutations |
| `cmdk` | 1 | Command palette | Used by shadcn `Command` |
| `dompurify` | 3 | Sanitise rich text | Notice bodies, note-sheet paragraphs rendered as HTML |
| `maplibre-gl` + `react-map-gl` | 4 / 7 | Maps | Open tiles (`VITE_MAP_TILES_URL`), geofence circles, trip/parcel positions; no Google key |
| `signature_pad` | 4 | Signature canvas | Robust pointer handling, `toDataURL()`; replaces hand-written canvas code |
| `@zxing/browser` | latest | QR/barcode (web) | Gate console & mailroom scan from webcam |
| `openapi-typescript` | 7 | Generated API types | ADR-01/§3: `frontend/src/shared/api/generated/schema.d.ts` from the server's OpenAPI JSON |
| `vite`, `@vitejs/plugin-react` | 6 / 4 | Build | ADR-12 |
| `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` | 2 / 16 | Unit + component tests | ADR-19 |
| `msw` | 2 | API mocking in tests/Storybook | Handlers generated from OpenAPI (`@msw/openapi` style script, see §16) |
| `@playwright/test` | 1 | e2e | ADR-19 |
| `eslint` (flat) + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` + `eslint-plugin-import-x` | 9 | Lint | ADR-20; import boundaries enforced |
| `prettier` | 3 | Format | ADR-20 |
| `typescript` | 5 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `exactOptionalPropertyTypes`) | Types | Prototype had unused-locals off; production turns everything on |
| `@sentry/react` | 8 | Error reporting | ADR-09 |
| `husky`, `lint-staged`, `@commitlint/cli` | — | Hooks | ADR-20 |

Not used: `zustand` (prototype leftover), any CSS-in-JS, moment, axios (fetchBaseQuery suffices), Google Maps.

---

## 3. Project Structure (`frontend/`)

Feature-sliced. Layers from bottom to top: `shared` → `entities` → `features` → `widgets` → `pages` → `app`. A layer may import only from layers **below** it and from its own layer (features may not import other features; cross-feature needs go through `entities` or `shared`).

```
frontend/
├── index.html
├── package.json · vite.config.ts · tsconfig.json · eslint.config.js · playwright.config.ts
├── .env.example
├── Dockerfile · nginx.conf
├── public/            favicon.svg, icons.svg, fonts/ (self-hosted Inter, Outfit, Noto Sans Bengali)
└── src/
    ├── main.tsx                       createRoot → <AppProviders><RouterProvider/></AppProviders>
    ├── app/
    │   ├── providers/                 StoreProvider, I18nProvider, SocketProvider, ThemeProvider, SentryBoundary
    │   ├── router/                    routes.tsx (tree), guards.tsx (RequireAuth, RequirePermission), lazy.ts
    │   ├── store/                     store.ts, root-reducer.ts, persist.ts, hooks.ts (useAppDispatch/useAppSelector)
    │   └── styles/                    globals.css (@import "tailwindcss"; @theme …), fonts.css, print.css
    ├── shared/
    │   ├── api/                       base-api.ts, base-query.ts (reauth), tags.ts, error.ts, generated/schema.d.ts
    │   ├── config/                    env.ts (zod-validated import.meta.env), constants.ts, permissions.ts
    │   ├── i18n/                      i18n.ts, locales/{en,bn}/<ns>.json, format.ts (money/date/number)
    │   ├── hooks/                     useDebounce, useMediaQuery, useHotkey, useCopy, useInterval, usePermission
    │   ├── lib/                       cn.ts, money.ts (decimal strings), dates.ts, refno.ts, download.ts, sanitize.ts
    │   ├── ui/                        shadcn primitives (button, dialog, sheet, tabs, …) + custom primitives (§7.4)
    │   └── types/                     branded ids, Paginated<T>, ApiError, Lang
    ├── entities/                      per domain object: types re-exported from generated schema, display helpers,
    │   ├── user/                      small presentational cards (UserAvatar, EmployeeChip, SiteBadge, StatusPill maps)
    │   ├── employee/ · department/ · site/ · workflow/ · notification/ · file/ …
    ├── features/<module>/             one folder per web feature dir of doc 00 §7
    │   ├── api/<module>.api.ts        baseApi.injectEndpoints(...)
    │   ├── model/                     <module>.slice.ts (UI-only), selectors.ts, status-maps.ts
    │   ├── schemas/                   zod schemas for forms
    │   ├── components/                feature-specific components (dialogs, tables, cards)
    │   ├── hooks/                     use<Feature>Realtime.ts, use<Feature>Filters.ts
    │   ├── pages/                     route components (default export for lazy())
    │   └── index.ts                   public surface (pages + a few components) — nothing else is importable
    ├── widgets/                       composed shell pieces: app-shell/, sidebar/, topbar/, command-palette/,
    │                                  notification-center/, announcement-banner/, lock-screen/, page-header/
    ├── pages/                         route-level glue that is not a feature: not-found, forbidden, auth/*
    └── test/                          setup.ts, msw/ (server.ts, handlers/), factories/, render.tsx
```

Feature folders (match doc 00 §7 "Web feature dir"): `notices`, `dashboard`, `note-sheets`, `parcels`, `assets`, `compliance`, `incidents`, `visitors`, `fleet`, `attendance` (incl. leave), `claims`, `bus`, `chat`, `workforce`, `approvals`, `admin`, plus `auth`, `profile`, `notifications`, `files`.

### 3.1 Rules
- `eslint-plugin-import-x` `no-restricted-paths` enforces layer order; `features/*` → `features/*` is an error except via `index.ts` of `entities`/`shared`.
- Path aliases: `@/app`, `@/shared`, `@/entities`, `@/features`, `@/widgets`, `@/pages`.
- A page component is the only default export in `pages/`; everything else is named.
- Server data lives only in RTK Query cache; slices hold UI state (filters that must survive navigation, drawer open ids, sidebar collapse, language).
- No `any`; API types come from `generated/schema.d.ts` via `components['schemas']['Parcel']` re-exported in `entities/*/types.ts`.
- File naming per doc 00 §5.2: `kebab-case.ts`, `PascalCase.tsx`, `useX.ts`, `<feature>.api.ts`, `<feature>.slice.ts`.

---

## 4. Routing

React Router 7 data router (`createBrowserRouter`), every page `lazy()`-loaded, `HydrateFallback` = `PageSkeleton`. Layouts: `AuthLayout` (centered card on canvas with brand panel), `AppShellLayout` (sidebar + topbar + banner + outlet + command palette + lock screen), `PublicLayout` (verification pages), `PrintLayout` (letterhead documents without chrome).

### 4.1 Guards

```tsx
// app/router/guards.tsx
export function RequireAuth() {
  const { data: me, isLoading } = useGetMeQuery();
  const location = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!me) return <Navigate to="/login" state={{ from: location }} replace />;
  if (me.mfaRequired) return <Navigate to="/mfa" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RequirePermission({ anyOf }: { anyOf: PermissionKey[] }) {
  const can = usePermission();            // reads me.permissions (Set<string>) via createSelector
  return anyOf.some(can) ? <Outlet /> : <Forbidden />;   // renders 403 page, status set via <meta>
}
```

`usePermission()` returns `(key: PermissionKey) => boolean` where `PermissionKey` is the union generated from the server's `permissions` seed (`shared/config/permissions.ts`, regenerated with the API types). Permission checks in the UI are UX only (§14); the server enforces.

### 4.2 Route table

Permission column = `anyOf`. `*` = any authenticated user. Deep links in the last column are the `data.route` values the notification service sends (doc 00 §6.3).

| Path | Page module (`features/.../pages`) | Permission | Layout | Notes / deep links |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `auth/pages/LoginPage` | public | Auth | Email or Emp-ID + password; remember device |
| `/mfa` | `auth/pages/MfaPage` | session w/ `mfaRequired` | Auth | TOTP 6 digits |
| `/forgot-password`, `/reset-password/:token` | `auth/pages/*` | public | Auth | |
| `/verify/:code` | `note-sheets/pages/VerifyDocumentPage` | public | Public | QR on final PDFs (`verificationCode`) |
| `/` | redirect → `/dashboard` | * | — | |
| `/dashboard` | `dashboard/pages/DashboardPage` | `dashboards:read` | Shell | Picks role dashboard by `me.roles` precedence: CHAIRMAN/DIRECTOR → Executive, PLANT_GM → Plant, HR_ADMIN → HR, TRANSPORT_ADMIN → Transport, HOD/FINANCE/LINE_MANAGER → Department, DRIVER → Driver, else Employee |
| `/notices` | `notices/pages/NoticeListPage` | `notices:read` | Shell | |
| `/notices/new`, `/notices/:id/edit` | `notices/pages/NoticeEditorPage` | `notices:write` | Shell | |
| `/notices/:id` | `notices/pages/NoticeDetailPage` | `notices:read` | Shell | deep link `NOTICE_PUBLISHED` |
| `/briefings`, `/briefings/new` | `dashboard/pages/BriefingsPage`, `BriefingComposerPage` | `briefings:read` / `briefings:write` | Shell | Chairman voice briefings |
| `/approvals` | `approvals/pages/InboxPage` | `workflow:approve` | Shell | tabs `?tab=pending|history` |
| `/approvals/:instanceId` | `approvals/pages/ApprovalDetailPage` | `workflow:approve` | Shell | deep link `APPROVAL_PENDING`, `APPROVAL_ESCALATED` |
| `/approvals/delegations` | `approvals/pages/DelegationsPage` | `workflow:delegate` | Shell | |
| `/note-sheets` | `note-sheets/pages/NoteSheetListPage` | `note-sheets:read` | Shell | |
| `/note-sheets/new` | `note-sheets/pages/NoteSheetCreatePage` | `note-sheets:create` | Shell | wizard |
| `/note-sheets/:id` | `note-sheets/pages/NoteSheetDetailPage` | `note-sheets:read` | Shell | `?tab=sheet|quotes|history`; deep link `NOTE_SHEET_*` |
| `/note-sheets/:id/print` | `note-sheets/pages/NoteSheetPrintPage` | `note-sheets:read` | Print | |
| `/parcels` | `parcels/pages/ParcelListPage` | `parcels:read` | Shell | `?scope=mine|all` |
| `/parcels/new` | `parcels/pages/ParcelCreatePage` | `parcels:create` | Shell | |
| `/parcels/:id` | `parcels/pages/ParcelDetailPage` | `parcels:read` | Shell | deep link `PARCEL_*` |
| `/parcels/scan` | `parcels/pages/ParcelScanPage` | `parcels:scan` | Shell | webcam QR + manual tracking no |
| `/assets` | `assets/pages/AssetRegisterPage` | `assets:read` | Shell | `?view=cards|table` |
| `/assets/new` | `assets/pages/AssetRegisterFormPage` | `assets:create` | Shell | |
| `/assets/:id` | `assets/pages/AssetDetailPage` | `assets:read` | Shell | `?tab=specs|events|custody|spares|financials` |
| `/assets/work-orders`, `/assets/work-orders/:id` | `assets/pages/WorkOrder*Page` | `assets:maintain` | Shell | deep link `WORK_ORDER_DUE` |
| `/assets/requisitions`, `/assets/requisitions/:id` | `assets/pages/AssetRequisition*Page` | `assets:requisition` | Shell | |
| `/assets/transfers` | `assets/pages/TransfersPage` | `assets:transfer` | Shell | |
| `/assets/valuation` | `assets/pages/ValuationPage` | `assets:financials` | Shell | depreciation, CSV export |
| `/assets/disposals` | `assets/pages/DisposalsPage` | `assets:write-off` | Shell | |
| `/compliance` | `compliance/pages/LicenceBoardPage` | `compliance:read` | Shell | Kanban; `?view=board|table` |
| `/compliance/licences/:id` | `compliance/pages/LicenceDetailPage` | `compliance:read` | Shell | deep link `LICENCE_DUE` |
| `/compliance/renewals/:id` | `compliance/pages/RenewalDetailPage` | `compliance:renew` | Shell | |
| `/incidents` | `incidents/pages/IncidentListPage` | `incidents:read` | Shell | risk matrix + list |
| `/incidents/new` | `incidents/pages/ReportIncidentPage` | `incidents:report` | Shell | 3-step wizard; quick hazard mode `?quick=1` |
| `/incidents/:id` | `incidents/pages/IncidentDetailPage` | `incidents:read` | Shell | `?tab=overview|rca|capa|closure`; deep link `INCIDENT_CRITICAL`, `CAPA_DUE` |
| `/visitors` | `visitors/pages/VisitListPage` | `visitors:read` | Shell | `?scope=mine|all&status=` |
| `/visitors/new` | `visitors/pages/PreRegisterPage` | `visitors:create` | Shell | |
| `/visitors/:id` | `visitors/pages/VisitDetailPage` | `visitors:read` | Shell | `?tab=details|protocol|inspection|ppe|vehicle|zones`; deep link `VISIT_*` |
| `/visitors/gate` | `visitors/pages/GateConsolePage` | `visitors:gate` | Shell | scan/check-in/out, barrier |
| `/visitors/muster` | `visitors/pages/MusterPage` | `visitors:gate` | Shell | evacuation roll-call |
| `/fleet` | redirect → `/fleet/requisitions` | | | |
| `/fleet/requisitions` | `fleet/pages/RequisitionListPage` | `fleet:read` | Shell | admin queue or "my requests" by scope |
| `/fleet/requisitions/new` | `fleet/pages/RequisitionCreatePage` | `fleet:request` | Shell | prototype `vehicle_request` view |
| `/fleet/requisitions/:id` | `fleet/pages/RequisitionDetailPage` | `fleet:read` | Shell | assign/dispatch/trip; deep link `REQUISITION_*`, `TRIP_*` |
| `/fleet/vehicles`, `/fleet/vehicles/:id` | `fleet/pages/Vehicle*Page` | `fleet:manage` | Shell | |
| `/fleet/drivers`, `/fleet/drivers/:id` | `fleet/pages/Driver*Page` | `fleet:manage` | Shell | |
| `/fleet/fuel` | `fleet/pages/FuelVouchersPage` | `fleet:manage` | Shell | |
| `/fleet/gate` | `fleet/pages/GateRosterPage` | `fleet:gate` | Shell | gate out/in with odometer |
| `/fleet/desk` | `fleet/pages/DispatchDeskPage` | `fleet:read` | Shell | fleet chat (REQ/DESK/BROADCAST/SOS) |
| `/fleet/my-trips` | `fleet/pages/DriverConsolePage` | `fleet:drive` | Shell | driver terminal (large targets) |
| `/attendance` | `attendance/pages/MyAttendancePage` | `attendance:read` | Shell | punch (web is informational; geofenced punch is mobile), my month |
| `/attendance/team` | `attendance/pages/TeamAttendancePage` | `attendance:read` (TEAM+) | Shell | live roster |
| `/attendance/regularisations` | `attendance/pages/RegularisationsPage` | `attendance:regularise` | Shell | |
| `/leave` | `attendance/pages/LeaveListPage` | `leave:read` | Shell | balances + requests |
| `/leave/new` | `attendance/pages/LeaveRequestPage` | `leave:request` | Shell | |
| `/leave/:id` | `attendance/pages/LeaveDetailPage` | `leave:read` | Shell | deep link `LEAVE_*` |
| `/claims` | `claims/pages/ClaimListPage` | `claims:read` | Shell | `?type=TADA|CONVEYANCE|TOUR_EVENT` |
| `/claims/new` | `claims/pages/ClaimCreatePage` | `claims:create` | Shell | `?type=` preselect |
| `/claims/:id` | `claims/pages/ClaimDetailPage` | `claims:read` | Shell | deep link `CLAIM_*` |
| `/claims/policies` | `claims/pages/PolicyRatesPage` | `claims:read` | Shell | grade table |
| `/bus` | `bus/pages/BusOverviewPage` | `bus:read` | Shell | staff: my seat/routes; supervisor: fleet grid |
| `/bus/routes/:id` | `bus/pages/RouteSeatMapPage` | `bus:read` | Shell | 52-seat coach, waitlist, stops |
| `/bus/my-seat` | `bus/pages/MySeatPage` | `bus:read` | Shell | deep link `SEAT_OFFER` (48 h) |
| `/bus/fleet` | `bus/pages/BusFleetPage` | `bus:manage` | Shell | buses, crew, timetable, broadcasts |
| `/chat`, `/chat/:channelId` | `chat/pages/ChatPage` | `chat:read` | Shell (no padding) | deep link `CHAT_MESSAGE`, `DIRECTIVE_ISSUED` |
| `/workforce` | `workforce/pages/EmployeeDirectoryPage` | `employees:read` | Shell | `?status=active|former` |
| `/workforce/new` | `workforce/pages/OnboardEmployeePage` | `employees:create` | Shell | |
| `/workforce/:employeeId` | `workforce/pages/EmployeeProfilePage` | `employees:read` | Shell | |
| `/workforce/:employeeId/exit-clearance` | `workforce/pages/ExitClearancePage` | `employees:offboard` | Shell | deep link `CLEARANCE_ITEM_PENDING` |
| `/notifications` | `notifications/pages/NotificationListPage` | * | Shell | full inbox |
| `/profile` | `profile/pages/ProfilePage` | * | Shell | `?tab=info|security|delegation|sessions|preferences` |
| `/admin` | redirect → `/admin/users` | `admin:read` | | |
| `/admin/users`, `/admin/users/:id` | `admin/pages/Users*Page` | `admin:users` | Shell | roles, scopes, reset MFA, deactivate |
| `/admin/roles`, `/admin/roles/:id` | `admin/pages/Roles*Page` | `admin:roles` | Shell | permission matrix with scope per grant |
| `/admin/departments`, `/admin/sites`, `/admin/grades`, `/admin/designations` | `admin/pages/MasterDataPage` | `admin:master-data` | Shell | one generic CRUD page parameterised by entity |
| `/admin/geofences` | `admin/pages/GeofencesPage` | `admin:master-data` | Shell | map editor (circle/polygon) |
| `/admin/workflow-templates`, `/admin/workflow-templates/:id` | `admin/pages/WorkflowTemplate*Page` | `admin:workflows` | Shell | step editor |
| `/admin/policies` | `admin/pages/ExpensePoliciesPage` | `admin:policies` | Shell | |
| `/admin/settings` | `admin/pages/SettingsPage` | `admin:settings` | Shell | |
| `/admin/audit-logs` | `admin/pages/AuditLogPage` | `admin:audit` | Shell | virtualised |
| `/403` | `pages/forbidden` | * | Shell | |
| `*` | `pages/not-found` | * | Shell or Auth | |

Prototype view → route mapping is in Appendix A. The prototype's `vehicle_request` alias is `/fleet/requisitions/new`.

### 4.3 Route definition pattern

```tsx
// app/router/routes.tsx (excerpt)
export const router = createBrowserRouter([
  { element: <AuthLayout />, children: [
      { path: '/login', lazy: () => import('@/features/auth/pages/LoginPage') },
      { path: '/mfa',   lazy: () => import('@/features/auth/pages/MfaPage') },
  ]},
  { path: '/verify/:code', lazy: () => import('@/features/note-sheets/pages/VerifyDocumentPage') },
  { element: <RequireAuth />, children: [
    { element: <AppShellLayout />, errorElement: <RouteErrorBoundary />, children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: () => import('@/features/dashboard/pages/DashboardPage') },
      { element: <RequirePermission anyOf={['parcels:read']} />, children: [
        { path: 'parcels',      lazy: () => import('@/features/parcels/pages/ParcelListPage') },
        { path: 'parcels/:id',  lazy: () => import('@/features/parcels/pages/ParcelDetailPage') },
      ]},
      // …
      { path: '403', element: <Forbidden /> },
      { path: '*',   element: <NotFound /> },
    ]},
  ]},
]);
```

Each lazy module exports `Component` (and optionally `handle: { crumb, titleKey, permission }` consumed by breadcrumbs/PageHeader). Notification clicks call `navigate(notification.data.route)`; unknown routes land on 404 with a "go to dashboard" action.

```tsx
// features/parcels/pages/ParcelDetailPage.tsx — lazy route module shape
export const handle: RouteHandle = {
  titleKey: 'parcels:detail.title',
  crumb: (params) => <RefNoCrumb id={params.id} />,     // resolves tracking no from cache
  i18nNamespaces: ['parcels', 'enums'],
};
export function Component() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGetParcelQuery(id!);
  if (isLoading) return <DetailSkeleton />;
  if (isError)   return <ErrorState error={error} onRetry={refetch} />;
  return <ParcelCockpit parcel={data} />;
}
Component.displayName = 'ParcelDetailPage';
```

### 4.4 AppShellLayout

```tsx
export function AppShellLayout() {
  const collapsed = useAppSelector(s => s.ui.sidebarCollapsed);
  return (
    <div className="flex min-h-dvh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <Sidebar />
      <div className={cn('flex min-w-0 flex-1 flex-col transition-[margin]', collapsed ? 'md:ml-sidebar-collapsed' : 'md:ml-sidebar')}>
        <Topbar />
        <AnnouncementBanner />
        <OfflineBanner />
        <main id="main" className="flex-1 p-5 pb-20 md:pb-5">
          <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
        </main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
      <LockScreen />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
```

Scroll restoration: `<ScrollRestoration getKey={(loc) => loc.pathname} />` so list pages keep position when returning from a detail page; detail pages scroll to top.

---

## 5. State Management

### 5.1 Store

```ts
// app/store/store.ts
const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: persistReducer({ key: 'auth', storage, whitelist: ['lastUserId', 'rememberedLogin'] }, authReducer),
  ui:   persistReducer({ key: 'ui', storage, whitelist: ['lang', 'sidebarCollapsed', 'theme', 'density'] }, uiReducer),
  notices: noticesUiReducer,        // dismissed banner ids (session only)
  approvals: approvalsUiReducer,    // selected ids for batch, active filters
  chat: chatUiReducer,              // draft per channel, open drawer
});
export const store = configureStore({
  reducer: rootReducer,
  middleware: (gDM) => gDM({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } })
    .concat(baseApi.middleware, rtkQueryErrorToast),
});
setupListeners(store.dispatch);     // refetchOnFocus / refetchOnReconnect
```

Rules:
- `auth` slice never stores tokens (httpOnly cookies, §14). It stores `status: 'anonymous'|'authenticated'|'locked'`, `lockedAt`, remembered login hint.
- `ui` slice: `lang`, `sidebarCollapsed`, `theme` (light only in v1, dark prepared), `density`.
- Per-feature UI slices only when state must outlive a component (filters shared across list + drawer, batch selection, chat drafts). Component-local `useState` is the default for dialog open/close, wizard step, hover.
- **No server data in slices.** Derived server data (badge counts, inbox grouping) is computed with `createSelector` over `baseApi.endpoints.X.select(args)` results or with `selectFromResult` in hooks.

### 5.2 baseApi with reauth

```ts
// shared/api/base-query.ts
import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { env } from '@/shared/config/env';

const mutex = new Mutex();
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${env.VITE_API_URL}/api/v1`,
  credentials: 'include',                                   // httpOnly cookies
  prepareHeaders: (headers, { getState }) => {
    headers.set('Accept-Language', (getState() as RootState).ui.lang);
    headers.set('X-Requested-With', 'OneOps-Web');          // CSRF custom header (§14)
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extra) => {
    await mutex.waitForUnlock();
    let result = await rawBaseQuery(args, api, extra);
    if (result.error?.status === 401 && !isAuthRoute(args)) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          const refresh = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extra);
          if (refresh.error) {
            api.dispatch(sessionExpired());               // auth slice → RequireAuth redirects to /login
            return result;
          }
          result = await rawBaseQuery(args, api, extra);
        } finally { release(); }
      } else {
        await mutex.waitForUnlock();
        result = await rawBaseQuery(args, api, extra);
      }
    }
    return result;
  };
```

```ts
// shared/api/base-api.ts
export const TAG_TYPES = ['Me','Notification','Notice','Briefing','Approval','Delegation','NoteSheet','Parcel','Asset',
  'WorkOrder','AssetRequisition','AssetTransfer','Licence','Renewal','Incident','Capa','Visit','Visitor',
  'Requisition','Trip','Vehicle','Driver','FuelVoucher','TollClaim','FleetMessage','AttendanceDay','Punch',
  'Regularisation','LeaveRequest','LeaveBalance','Claim','Advance','Policy','BusRoute','Seat','Waitlist','SeatOffer',
  'Bus','Channel','Message','Directive','Employee','ExitClearance','User','Role','Permission','Department','Site',
  'Grade','Geofence','WorkflowTemplate','Setting','AuditLog','File','Dashboard'] as const;
export type TagType = typeof TAG_TYPES[number];

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
});
```

### 5.3 Tag taxonomy and helpers

```ts
// shared/api/tags.ts
export const listTag = <T extends TagType>(type: T) => ({ type, id: 'LIST' as const });
export const idTag   = <T extends TagType>(type: T, id: string) => ({ type, id });
export const providesList = <T extends TagType, R extends { id: string }>(type: T) =>
  (result?: { data: R[] }) => result ? [listTag(type), ...result.data.map(r => idTag(type, r.id))] : [listTag(type)];
export const providesOne = <T extends TagType>(type: T) => (_r: unknown, _e: unknown, id: string) => [idTag(type, id)];
```

Conventions: list endpoints provide `LIST` + each id; detail endpoints provide `id`; create invalidates `LIST`; update/action invalidates `id` (and `LIST` only if a list-visible field changes — status, amount, title; otherwise rely on `id` + `updateQueryData` on the list). Cross-entity invalidation is explicit: e.g. approving a workflow step invalidates `Approval LIST`, the owner object's id tag (`NoteSheet id`), and `Dashboard`.

### 5.4 injectEndpoints example (parcels)

```ts
// features/parcels/api/parcels.api.ts
import { baseApi } from '@/shared/api/base-api';
import { listTag, idTag, providesList, providesOne } from '@/shared/api/tags';
import type { Parcel, ParcelEvent, Paginated, ParcelListQuery } from '@/entities/parcel/types';

export const parcelsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getParcels: b.query<Paginated<Parcel>, ParcelListQuery>({
      query: (params) => ({ url: '/parcels', params }),
      providesTags: providesList('Parcel'),
    }),
    getParcel: b.query<Parcel & { events: ParcelEvent[] }, string>({
      query: (id) => `/parcels/${id}`,
      providesTags: providesOne('Parcel'),
    }),
    createParcel: b.mutation<Parcel, CreateParcelInput>({
      query: (body) => ({ url: '/parcels', method: 'POST', body }),
      invalidatesTags: [listTag('Parcel'), 'Dashboard'],
    }),
    scanParcel: b.mutation<Parcel, { id: string; type: ParcelEventType; location?: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/parcels/${id}/scan`, method: 'POST', body,
        headers: { 'Idempotency-Key': crypto.randomUUID() } }),
      invalidatesTags: (_r, _e, { id }) => [idTag('Parcel', id), listTag('Parcel')],
    }),
    verifyParcelOtp: b.mutation<Parcel, { id: string; otp: string }>({
      query: ({ id, otp }) => ({ url: `/parcels/${id}/verify-otp`, method: 'POST', body: { otp } }),
      invalidatesTags: (_r, _e, { id }) => [idTag('Parcel', id), listTag('Parcel'), 'Dashboard'],
    }),
    initiateParcelReturn: b.mutation<Parcel, { id: string; reason: ReturnReason; details?: string }>({
      query: ({ id, ...body }) => ({ url: `/parcels/${id}/return`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [idTag('Parcel', id), listTag('Parcel')],
    }),
    flagParcelTamper: b.mutation<Parcel, { id: string; note: string; photoFileId?: string }>({
      query: ({ id, ...body }) => ({ url: `/parcels/${id}/flag-tamper`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [idTag('Parcel', id), listTag('Parcel')],
    }),
  }),
  overrideExisting: false,
});
export const { useGetParcelsQuery, useGetParcelQuery, useCreateParcelMutation, useScanParcelMutation,
  useVerifyParcelOtpMutation, useInitiateParcelReturnMutation, useFlagParcelTamperMutation } = parcelsApi;
```

### 5.5 Optimistic updates
Used where the user expects instant feedback and the server rarely rejects: approve/reject in the inbox (remove row, restore on error with toast), notification mark-read and mark-all-read, notice acknowledge, chat read receipts, seat offer accept/decline, CAPA checkbox toggles. Pattern:

```ts
approveStep: b.mutation<WorkflowInstance, { instanceId: string; stepId: string; comment?: string; signatureId?: string }>({
  query: ({ instanceId, stepId, ...body }) => ({ url: `/approvals/${instanceId}/steps/${stepId}/approve`, method: 'POST', body }),
  async onQueryStarted({ instanceId }, { dispatch, queryFulfilled, getState }) {
    const patches = approvalsApi.util.selectCachedArgsForQuery(getState(), 'getInbox').map(args =>
      dispatch(approvalsApi.util.updateQueryData('getInbox', args, draft => {
        draft.data = draft.data.filter(i => i.instanceId !== instanceId);
        draft.meta.total -= 1;
      })));
    try { await queryFulfilled; } catch { patches.forEach(p => p.undo()); }
  },
  invalidatesTags: (_r, _e, { instanceId }) => [idTag('Approval', instanceId), listTag('Approval'), 'Dashboard'],
}),
```

Never optimistic: money-affecting finalisations (claim settle, disposal finalize), OTP verification, signature submission, anything with server-generated reference numbers.

### 5.6 Polling vs socket
- Default: socket-driven invalidation (§6). Polling is the fallback when the socket is disconnected > 10 s: `pollingInterval` is set from `useSocketStatus()` → `connected ? 0 : 30_000` for inbox, notifications, parcel detail, gate console, dispatch queue.
- Always poll regardless of socket: attendance live roster (60 s), bus GPS positions when telematics adapter is enabled (15 s), dashboard KPI cards (120 s).
- `refetchOnFocus` enabled globally; `refetchOnMountOrArgChange: 30` for detail pages.

### 5.7 Selectors
```ts
export const selectMe = baseApi.endpoints.getMe.select();
export const selectPermissions = createSelector(selectMe, r => new Set(r.data?.permissions ?? []));
export const selectUnreadCount = createSelector(notificationsApi.endpoints.getUnreadCount.select(), r => r.data?.count ?? 0);
```
Badge counts for the sidebar come from one endpoint `GET /dashboards/badges` (server computes per user/scope: pending approvals, unread chat, licences ≤ 90 d, open incidents, visitors inside, active trips, waitlist, pending claims, asset actions), tagged `Dashboard`, invalidated by sockets. This replaces the prototype's eleven client-side badge rules.

Narrow subscriptions with `selectFromResult` so a row re-renders only when its own data changes:

```ts
const { parcel } = useGetParcelsQuery(args, {
  selectFromResult: ({ data }) => ({ parcel: data?.data.find(p => p.id === id) }),
});
```

### 5.8 List query params hook
Every list page keeps its filters in the URL so links are shareable and back/forward works:

```ts
// shared/hooks/useListParams.ts
export function useListParams<T extends z.ZodTypeAny>(schema: T, defaults: z.infer<T>) {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => schema.parse({ ...defaults, ...Object.fromEntries(sp) }), [sp]);
  const update = (patch: Partial<z.infer<T>>) =>
    setSp(prev => { const n = new URLSearchParams(prev); Object.entries(patch).forEach(([k, v]) =>
      v == null || v === '' ? n.delete(k) : n.set(k, String(v))); if (!('page' in patch)) n.set('page', '1'); return n; }, { replace: true });
  return [params, update] as const;
}
// usage: const [q, setQ] = useListParams(parcelListQuerySchema, { page: 1, pageSize: 20, sort: '-createdAt' });
```

### 5.9 Generic CRUD endpoint factory (admin master data)

```ts
export function makeCrudEndpoints<T extends { id: string }, C, U = Partial<C>>(path: string, tag: TagType) {
  return baseApi.injectEndpoints({ endpoints: (b) => ({
    [`get${tag}s`]: b.query<Paginated<T>, ListQuery>({ query: (params) => ({ url: `/${path}`, params }), providesTags: providesList(tag) }),
    [`get${tag}`]:  b.query<T, string>({ query: (id) => `/${path}/${id}`, providesTags: providesOne(tag) }),
    [`create${tag}`]: b.mutation<T, C>({ query: (body) => ({ url: `/${path}`, method: 'POST', body }), invalidatesTags: [listTag(tag)] }),
    [`update${tag}`]: b.mutation<T, { id: string } & U>({ query: ({ id, ...body }) => ({ url: `/${path}/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [idTag(tag, id), listTag(tag)] }),
    [`delete${tag}`]: b.mutation<void, string>({ query: (id) => ({ url: `/${path}/${id}`, method: 'DELETE' }), invalidatesTags: [listTag(tag)] }),
  }) });
}
```
Typed wrappers per entity (`departments.api.ts`) re-export the generated hooks with concrete generics so call sites stay strictly typed.

---

## 6. Realtime

### 6.1 SocketProvider
```tsx
// app/providers/SocketProvider.tsx
export function SocketProvider({ children }: PropsWithChildren) {
  const me = useAppSelector(selectMe).data;
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!me) return;
    const notif = io(`${env.VITE_WS_URL}/notifications`, { withCredentials: true, transports: ['websocket'],
      reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 15000, randomizationFactor: 0.5 });
    const chat  = io(`${env.VITE_WS_URL}/chat`, { withCredentials: true, transports: ['websocket'] });
    const pres  = io(`${env.VITE_WS_URL}/presence`, { withCredentials: true, transports: ['websocket'] });
    const off = bindRealtimeHandlers({ notif, chat, pres }, dispatch);
    notif.on('connect', () => dispatch(socketStatus('connected')));
    notif.on('disconnect', () => dispatch(socketStatus('disconnected')));
    notif.on('connect_error', (e) => { if (e.message === 'UNAUTHENTICATED') dispatch(sessionExpired()); });
    return () => { off(); notif.close(); chat.close(); pres.close(); };
  }, [me?.id]);
  return <SocketContext.Provider value={socketsRef}>{children}</SocketContext.Provider>;
}
```
Auth is the same httpOnly cookie (server validates on handshake, ADR-11). On `sessionExpired`, sockets close; on `/auth/refresh` success they reconnect because `me.id` is unchanged and `connect` re-fires. The user is joined server-side to `user:{id}`, their department/site rooms, and channel rooms.

### 6.2 Event → cache mapping

| Namespace | Event | Payload | Client action |
| :--- | :--- | :--- | :--- |
| `/notifications` | `notification:new` | `Notification` | `updateQueryData('getNotifications', …)` prepend; `invalidateTags(['Dashboard'])`; sonner toast (CRITICAL → persistent toast with "Acknowledge") |
| | `approval:updated` | `{ instanceId, status, objectType, objectId }` | `invalidateTags([{Approval,id},{Approval,LIST},{<objectType>,objectId},'Dashboard'])` |
| | `note-sheet:updated` | `{ id }` | `invalidateTags([{NoteSheet,id},{NoteSheet,LIST}])` |
| | `parcel:event` | `{ parcelId, event }` | `updateQueryData('getParcel', parcelId, d => d.events.push(event); d.status = event.status)`; `invalidateTags([{Parcel,LIST}])` |
| | `notice:published` | `{ noticeId, broadcast?: Broadcast }` | `invalidateTags([{Notice,LIST}])`; if `broadcast.showBanner` → `noticesUi.showBanner(noticeId)` |
| | `incident:critical` | `{ incidentId }` | invalidate Incident LIST/id; red persistent toast |
| | `visit:status` | `{ visitId, status }` | invalidate Visit id/LIST (gate console live) |
| | `trip:event` | `{ tripId, requisitionId, type }` | invalidate Requisition id, Trip id, LIST |
| | `seat:offer` | `SeatOffer` | invalidate Waitlist/SeatOffer; toast with 48 h countdown link `/bus/my-seat` |
| | `due:reminder` | `DueItem` | invalidate Licence/WorkOrder/Capa id |
| `/chat` | `message:new` | `ChatMessage` | `updateQueryData('getMessages', {channelId}, append)`; invalidate `Channel LIST` (unread); if channel open → emit `message:read` |
| | `message:updated`/`message:deleted` | `{ id, channelId, … }` | patch in place |
| | `typing` | `{ channelId, userId }` | chat UI slice (ephemeral, 3 s TTL) |
| | `directive:ack` | `{ directiveId, userId }` | patch Directive |
| `/presence` | `presence:update` | `{ userId, status, location? }` | `updateQueryData('getPresence', …)` |

Handlers live in `features/<module>/hooks/use<Module>Realtime.ts` and are registered centrally by `bindRealtimeHandlers` so a feature can be code-split without losing events (handlers are thin; they only dispatch RTK util actions).

```ts
// shared/realtime/bind-handlers.ts
export function bindRealtimeHandlers({ notif, chat }: Sockets, dispatch: AppDispatch) {
  const inv = (tags: TagDescription<TagType>[]) => dispatch(baseApi.util.invalidateTags(tags));

  notif.on('notification:new', (n: Notification) => {
    dispatch(notificationsApi.util.updateQueryData('getNotifications', { cursor: undefined }, d => { d.data.unshift(n); }));
    dispatch(notificationsApi.util.updateQueryData('getUnreadCount', undefined, d => { d.count += 1; }));
    inv(['Dashboard']);
    n.priority === 'CRITICAL' ? showCriticalToast(n) : showInfoToast(n);
  });
  notif.on('approval:updated', ({ instanceId, objectType, objectId }: ApprovalUpdated) =>
    inv([idTag('Approval', instanceId), listTag('Approval'), idTag(objectTypeToTag(objectType), objectId), 'Dashboard']));
  notif.on('parcel:event', ({ parcelId, event }: ParcelEventPayload) => {
    dispatch(parcelsApi.util.updateQueryData('getParcel', parcelId, d => { d.events.push(event); d.status = event.resultingStatus; }));
    inv([listTag('Parcel')]);
  });
  chat.on('message:new', (m: ChatMessage) => {
    dispatch(chatApi.util.updateQueryData('getMessages', { channelId: m.channelId }, d => { if (!d.data.some(x => x.id === m.id)) d.data.push(m); }));
    inv([listTag('Channel')]);
  });
  return () => { notif.removeAllListeners(); chat.removeAllListeners(); };
}
```

`objectTypeToTag` maps workflow `objectType` strings (`NoteSheet`, `Claim`, `VehicleRequisition`, `LeaveRequest`, `AssetRequisition`, `Visit`, `SeatAllocation`, `ExitClearance`) to tag types so the owning record refreshes when a decision lands.

### 6.3 Reconnection behaviour
On `reconnect`: `dispatch(baseApi.util.invalidateTags(['Notification','Approval','Dashboard','Message']))` to catch anything missed; chat requests `messages:since` with last known `createdAt` per open channel. Offline banner (§15) appears when `navigator.onLine === false` or socket disconnected > 10 s.

---

## 7. Design System

### 7.1 Token mapping (prototype `variables.css` → Tailwind v4 `@theme`)

```css
/* app/styles/globals.css */
@import "tailwindcss";
@plugin "tailwindcss-animate";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  /* brand */
  --color-crimson:        #A51C30;  --color-crimson-dark: #7F1424;  --color-crimson-light: #C8102E;
  --color-crimson-muted:  rgb(165 28 48 / 0.08);
  --color-navy-950: #060D1F; --color-navy-900: #0B132B; --color-navy-800: #111A38;
  --color-slate-700: #1E293B; --color-slate-600: #334155; --color-slate-500: #475569; --color-slate-400: #64748B;
  --color-slate-300: #94A3B8; --color-slate-200: #E2E8F0; --color-slate-100: #F1F5F9;
  --color-canvas: #F8FAFC;
  --color-gold: #D4AF37; --color-gold-dark: #AA820A; --color-gold-light: #F0DFA0; --color-gold-muted: rgb(212 175 55 / 0.12);
  /* status */
  --color-success: #059669; --color-success-bg: #ECFDF5;
  --color-warning: #D97706; --color-warning-bg: #FFFBEB;
  --color-danger:  #DC2626; --color-danger-bg:  #FEF2F2;
  --color-info:    #0284C7; --color-info-bg:    #F0F9FF;
  --color-purple:  #7C3AED; --color-purple-bg:  #F5F3FF;
  /* shadcn semantic aliases */
  --color-background: var(--color-canvas); --color-foreground: var(--color-slate-700);
  --color-card: #FFFFFF; --color-card-header: #FAFAFC; --color-border: var(--color-slate-200);
  --color-primary: var(--color-crimson); --color-primary-foreground: #FFFFFF;
  --color-accent: var(--color-gold); --color-accent-foreground: var(--color-navy-900);
  --color-muted: var(--color-slate-100); --color-muted-foreground: var(--color-slate-400);
  --color-destructive: var(--color-danger); --color-ring: var(--color-gold);
  --color-sidebar: #080E21; --color-sidebar-border: rgb(255 255 255 / 0.08);
  /* typography */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", "Inter", sans-serif;
  --font-bengali: "Noto Sans Bengali", "Hind Siliguri", sans-serif;
  --font-mono: ui-monospace, "JetBrains Mono", monospace;
  /* radii */
  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px;
  /* shadows */
  --shadow-xs: 0 1px 2px rgb(11 19 43 / 0.05);
  --shadow-sm: 0 2px 4px rgb(11 19 43 / 0.06), 0 1px 2px rgb(11 19 43 / 0.04);
  --shadow-md: 0 4px 12px rgb(11 19 43 / 0.08), 0 2px 4px rgb(11 19 43 / 0.04);
  --shadow-lg: 0 12px 24px rgb(11 19 43 / 0.10), 0 4px 8px rgb(11 19 43 / 0.06);
  --shadow-xl: 0 24px 48px rgb(11 19 43 / 0.14), 0 8px 16px rgb(11 19 43 / 0.08);
  --shadow-crimson: 0 6px 20px rgb(165 28 48 / 0.22);
  --shadow-gold: 0 6px 20px rgb(212 175 55 / 0.28);
  /* layout */
  --spacing-sidebar: 272px; --spacing-sidebar-collapsed: 72px; --spacing-topbar: 68px;
  --ease-brand: cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] { /* prepared, not shipped in v1 */
  --color-background: #060D1F; --color-card: #0B132B; --color-card-header: #111A38; --color-border: #1E293B;
  --color-foreground: #E2E8F0; --color-muted: #111E3D; --color-muted-foreground: #94A3B8;
}
:lang(bn), .font-bengali { font-family: var(--font-bengali); }
```

Usage: `bg-crimson text-white shadow-crimson`, `bg-success-bg text-success`, `font-display`, `w-sidebar`. No hex values in components; eslint rule `tailwindcss/no-arbitrary-value` warns on `[#…]`.

### 7.2 Typography
| Role | Class | Prototype equivalent |
| :--- | :--- | :--- |
| Page title | `font-display text-[14.5px] font-bold tracking-tight text-navy-900` | `.topbar-page-title` |
| Card title | `font-display text-sm font-bold text-navy-900` | `.card-title` |
| KPI value | `font-display text-[22px] font-extrabold leading-tight` | `.kpi-value` |
| Section label | `text-[9.5px] font-bold uppercase tracking-[1.2px] text-slate-400` | `.nav-section` |
| Body | `text-[12.5px] text-slate-600 leading-relaxed` | `.doc-body` |
| Table header | `text-[11px] font-bold uppercase tracking-wide text-slate-500` | `.fleet-table th` |
| Mono ref no | `font-mono text-[10.5px] font-bold bg-slate-200 px-2 py-0.5 rounded-xs` | `.file-number` |

Bengali: when `lang === 'bn'`, `<html lang="bn">` is set so `:lang(bn)` switches the family; Bengali line-height is 1.65 (`.leading-bn`). Mixed strings (EN ref numbers in BN sentences) rely on font fallback — Noto Sans Bengali includes Latin glyphs.

### 7.3 Spacing & layout
Tailwind default 4 px scale. Page padding 20 px (`p-5`), card body 20 px, card header 16/20 px, grid gap 20 px (`gap-5`), KPI grid `grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4`. Breakpoints: `sm 640`, `md 768` (sidebar becomes Sheet drawer; `MobileBottomNav` shows), `lg 1024`, `xl 1280` (two-column cockpit layouts), `2xl 1536`.

### 7.4 Component inventory

shadcn/ui primitives (copied into `shared/ui`): `button` (variants: `primary` crimson, `gold`, `outline`, `ghost`, `destructive`, `link`; sizes `sm 28px`, `md 34px`, `lg 40px`, `icon`), `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `label`, `form` (RHF bindings), `dialog`, `alert-dialog`, `sheet` (right drawers), `popover`, `dropdown-menu`, `command`, `tabs`, `tooltip`, `badge`, `card`, `separator`, `skeleton`, `scroll-area`, `avatar`, `calendar` + `date-picker`, `progress`, `table`, `toggle-group`, `sonner`.

Custom primitives (`shared/ui`):

| Component | Purpose | Props (key) | Prototype origin |
| :--- | :--- | :--- | :--- |
| `StatCard` | KPI tile with label, value (`AnimatedCounter`), delta/sub, icon, tone, optional sparkline, clickable | `label, value, sub?, tone?, icon?, onClick?, trend?` | `.kpi-card`, `AnimatedCounter`, `Sparkline` |
| `StatusPill` | Enum → colour/label; `role="status"`, `aria-label` | `status, map: StatusMap, size?` | `.badge.*` |
| `PillTabs` | Segmented tabs synced to `?tab=` | `items, value, onChange` | `.pill-tabs` |
| `Timeline` | Vertical event trail with actor, time, hash chip | `items: TimelineItem[]` | approval trail, custody log, asset events |
| `ApprovalCard` | Inbox row/card: summary, SLA badge, urgency, actions | `item: InboxItem, onApprove, onReject, selectable?` | `.approval-interactive-card`, `DetailDrawer` |
| `DataTable` | TanStack table: sorting, column visibility, row selection, sticky header, server pagination, empty/loading/error, virtual rows > 100 | `columns, data, meta, onPageChange, onSortChange, rowSelection?, virtualize?` | `.fleet-table`, `Pagination` |
| `FilterBar` | Search + chips + selects + date range; writes to URL search params | `fields: FilterField[]` | pill filters in every view |
| `SplitPane` | List/detail two-column with mobile toggle (Feed/Tracker) | `list, detail, selectedId` | Parcel/Guest/Claims cockpit |
| `SignaturePad` | `signature_pad` canvas + typed stamp mode; returns PNG blob | `mode: 'draw'|'typed', onChange` | `.sig-canvas` |
| `QrScanner` | `@zxing/browser` webcam decode with fallback manual input | `onDecode, formats?` | scanner modals |
| `MapPreview` | MapLibre static/interactive map; markers, circle geofence, polyline | `center, markers?, geofence?, path?, height` | corridor diagram, radar card |
| `FileDropzone` | Presign + PUT with progress, type/size validation, ClamAV status chip | `accept, maxSizeMb, multiple, value: FileRef[], onChange` | voucher chips |
| `BilingualText` | Renders `{ en, bn }` pair by current lang, with fallback marker | `value: { en: string; bn?: string }` | `t(en, bn)` |
| `BilingualInput` | Two inputs (EN required, BN optional) with "same as EN" toggle | RHF field names `name`, `nameBn` | notice/route forms |
| `MoneyInput` / `Money` | BDT input with lakh/crore grouping; display `৳48,50,000.00` | `value: string` (decimal string) | `৳` labels |
| `DateTimeDhaka` | `<time dateTime=UTC>` rendered in Asia/Dhaka | `value, format` | hard-coded dates |
| `RefNo` | Monospace chip with copy button | `value` | `.file-number`, `.vehicle-plate` |
| `PageHeader` | Title, subtitle, breadcrumbs, actions slot | `titleKey, actions` | Topbar heading + view header |
| `EmptyState` | Icon, title, description, primary action | | ad-hoc |
| `ErrorState` | Message, requestId, retry | | ad-hoc |
| `Letterhead` | Printable BOGCL letterhead frame + QR + stamp | `title, refNo, qrUrl, stamp?` | `OfficialDocumentModal` |
| `Stepper` | Horizontal stage stepper (lifecycle, renewal, parcel) | `steps, current` | `AssetLifecycleStepper` |
| `KanbanBoard` | Columns with cards, keyboard-reorder, optional drag | `columns, onMove` | `.kanban` |
| `RiskMatrix` | 5×5 clickable heat grid | `counts, onSelect` | IncidentView matrix |
| `SeatMap` | 52-seat coach layout (4 cols × 13 rows), categories, selection | `seats, onSelect` | BusView coach |
| `AnnouncementBanner` | Crimson gradient banner with gold border, Acknowledge/dismiss | | `App.tsx` banner |
| `LockScreen` | Overlay; unlock = password re-entry via `POST /auth/unlock` | | `LockScreenModal` (PIN 1234 removed) |

`StatusPill` pattern — one status map per enum, colocated with the entity so every module renders the same colours:

```tsx
// entities/parcel/status-map.ts
export const parcelStatusMap: StatusMap<ParcelStatus> = {
  CREATED: 'neutral', DISPATCHED: 'info', IN_TRANSIT: 'info', AT_GATE: 'warning', OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success', RETURN_INITIATED: 'purple', RETURN_IN_TRANSIT: 'purple', RETURNED: 'neutral',
  LOST: 'danger', DAMAGED: 'danger', QUARANTINED: 'danger',
};
// shared/ui/status-pill.tsx
const toneClass: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600', success: 'bg-success-bg text-success', warning: 'bg-warning-bg text-[#B45309]',
  danger: 'bg-danger-bg text-danger', info: 'bg-info-bg text-info', purple: 'bg-purple-bg text-purple', gold: 'bg-gold-muted text-gold-dark',
};
export function StatusPill<E extends string>({ status, map, ns = 'enums', enumName }: StatusPillProps<E>) {
  const { t } = useTranslation(ns);
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold', toneClass[map[status]])}>
    <span aria-hidden className="size-1.5 rounded-full bg-current" />{t(`${enumName}.${status}`)}</span>;
}
```

Dark mode: tokens prepared under `[data-theme=dark]`; no toggle shipped in v1 (hidden behind `VITE_FEATURE_DARK_MODE`). RTL: not required; no `rtl:` classes.

### 7.5 Print styles
`app/styles/print.css` (`@media print`): hide shell (`.no-print`), white background, `Letterhead` full width A4 with 18 mm margins, page-break rules for note-sheet paragraphs and tables, QR and stamp at fixed positions, footer with `fileNo`, SHA-256 and verification URL on every page. Print pages (`/…/print`) render in `PrintLayout` and call `window.print()` after fonts load (`document.fonts.ready`).

---

## 8. Application Shell (`widgets/`)

### 8.1 Sidebar
- Navigation is **derived from permissions**, not from role: `shared/config/navigation.ts` defines all sections/items with `permission` and `labelKey`; `useNavigation()` filters by `usePermission()` and returns the first non-empty sections. Section grouping and label variants per primary role (e.g. Chairman sees "Executive Overview", Employee sees "My Workspace") come from `labelByRole` overrides keyed by the user's highest role, mirroring prototype `ROLE_NAV` labels.
- Width 272 px, collapsed 72 px (icons + tooltips); state in `ui.sidebarCollapsed` (persisted). `< md`: Sheet drawer with backdrop, closes on navigation.
- Header: emblem "B" (crimson gradient, gold border), "BASHUNDHARA / Oil & Gas Co. Ltd."; role badge (pulsing gold dot, "Signed in as • EMP-ID", role label); nav sections (uppercase 9.5 px); active item crimson gradient with 3 px crimson left border and gold icon; badges from `GET /dashboards/badges` (danger crimson, warn amber, info blue, dot when collapsed); footer connection status (socket state) + version from `import.meta.env.VITE_APP_VERSION`.
- Uses `<NavLink>`; `aria-current="page"`.

```ts
// shared/config/navigation.ts (excerpt)
export const NAVIGATION: NavSection[] = [
  { id: 'work', titleKey: 'common:nav.sections.work', items: [
    { id: 'dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'dashboards:read', labelKey: 'common:nav.dashboard',
      labelByRole: { CHAIRMAN: 'common:nav.dashboard.executive', PLANT_GM: 'common:nav.dashboard.plant', HR_ADMIN: 'common:nav.dashboard.hr',
                     TRANSPORT_ADMIN: 'common:nav.dashboard.transport', HOD: 'common:nav.dashboard.department', DRIVER: 'common:nav.dashboard.driver' } },
    { id: 'chat',      to: '/chat',       icon: MessageSquare,  permission: 'chat:read',        labelKey: 'common:nav.chat', badge: 'unreadChat' },
    { id: 'approvals', to: '/approvals',  icon: ClipboardCheck, permission: 'workflow:approve', labelKey: 'common:nav.approvals', badge: 'pendingApprovals' },
    { id: 'noteSheets',to: '/note-sheets',icon: FileSignature,  permission: 'note-sheets:read', labelKey: 'common:nav.noteSheets', badge: 'pendingNoteSheets' },
  ]},
  { id: 'operations', titleKey: 'common:nav.sections.operations', items: [
    { id: 'assets',     to: '/assets',     icon: Wrench,        permission: 'assets:read',     labelKey: 'common:nav.assets',
      labelByRole: { PLANT_GM: 'common:nav.assets.plant', TRANSPORT_ADMIN: 'common:nav.assets.vehicles', EMPLOYEE: 'common:nav.assets.mine', DRIVER: 'common:nav.assets.myVehicle' }, badge: 'assetActions' },
    { id: 'compliance', to: '/compliance', icon: ShieldCheck,   permission: 'compliance:read', labelKey: 'common:nav.compliance', badge: 'licencesDue' },
    // … visitors, incidents, attendance, workforce, parcels, fleet, bus, claims, admin
  ]},
];
```

The prototype's seven `ROLE_NAV` trees are reproduced by seed permissions (doc 02 §6) + these label overrides; QA compares the rendered sidebar per seeded persona against report §7.2.

### 8.2 Topbar
Left: hamburger (`< md`), page title + breadcrumb (`BOGCL OneOps / Section / Page`, from route `handle.crumb`). Right: search trigger (`Ctrl+K`, shows kbd), system status capsule (socket connected + live clock in Asia/Dhaka; click opens `SystemStatusSheet` with `/healthz` summary — replaces the fake SAP modal), notification bell (unread count from `getUnreadCount`, popover with filters All/Approvals/Safety/Transport, mark all read, "View all" → `/notifications`), language toggle (`EN`/`বাং`, persists `ui.lang`, also `PATCH /users/me { preferredLang }`), Chairman-only "Announce" (permission `notices:broadcast`), user menu (avatar colour from `hashColor(userId)`, name, title, access level text, items: My Profile, Password & Security, Handover / Out of Office, Devices & Sign-in Log, Lock Screen, Sign Out). The prototype's "Switch Role (Preview)" is removed.

### 8.3 Command palette
`cmdk` dialog, `Ctrl/⌘+K`, `Esc`. Groups: Pages (permission-filtered from navigation), Records (debounced 250 ms `GET /search?q=` returning typed hits: note-sheets, assets, employees, vehicles, licences, parcels, visits — server applies scope), Actions (New note-sheet, New claim, Report incident, Request vehicle — permission-filtered), Settings (language). Arrow/Enter navigation; recent items in `ui.recentCommands` (max 8).

### 8.4 Breadcrumbs & PageHeader
Route `handle: { crumb: (data, params) => ReactNode | i18n key, titleKey }`. `PageHeader` renders title (bilingual), optional subtitle, actions on the right (primary CTA + overflow), sticky under topbar when the page scrolls. Document `<title>` = `${page} · BOGCL OneOps` via `useDocumentTitle`.

### 8.5 Other shell pieces
Announcement banner (active broadcasts from `GET /notices/broadcasts/active`; dismissed ids in `notices` UI slice for the session; Acknowledge → `POST /notices/{id}/ack`); lock screen (auto after 15 min idle if `me.settings.autoLockMinutes`); offline banner; global `RouteErrorBoundary`; `Toaster` (sonner, bottom-right, 4.5 s, rich colours mapped to tokens); `MobileBottomNav` (`< md`, first 4 nav items + "More" opens Sheet).

---

## 9. Per-Module Page Specifications

Common conventions applied to every module (not repeated below): list pages use `PageHeader + FilterBar + DataTable` (or cards) with URL-synced filters, server pagination `page/pageSize/sort`, `Skeleton` rows while loading, `EmptyState` with the module's primary action, `ErrorState` with retry; detail pages use `PageHeader` with `StatusPill` and action buttons gated by permission + state; destructive or irreversible actions use `AlertDialog`; all mutations use `toast.promise`; server 422 maps to fields (§10.1); forms are `react-hook-form` + `zodResolver`. Permission keys follow `<module>:<action>`; `scope` filtering is server-side, the UI only switches between "mine" and "all" tabs when the user has a scope wider than `SELF`.

### MOD-01 Notices & Broadcasts (`features/notices`)

| Pages | `/notices`, `/notices/:id`, `/notices/new`, `/notices/:id/edit`; banner widget |
| :--- | :--- |
| Components | `NoticeCard`, `NoticeFilters` (category, pinned, requiresAck, status), `NoticeEditor` (templates: Chairman's Directive, Safety & LOTO, Maintenance Window, HR Policy; EN/BN body with sanitized rich text; audience builder), `AudiencePicker` (ALL/SITE/DEPARTMENT/ROLE/GRADE/USER with live recipient count from `POST /notices/audience-count`), `NoticePreview` (letterhead), `AckProgress`, `BroadcastDialog` |
| Endpoints | `useGetNoticesQuery`, `useGetNoticeQuery`, `useCreateNoticeMutation`, `useUpdateNoticeMutation`, `usePublishNoticeMutation`, `useScheduleNoticeMutation`, `useArchiveNoticeMutation`, `useAckNoticeMutation` (optimistic), `useMarkNoticeReadMutation`, `useGetNoticeReceiptsQuery`, `useCreateBroadcastMutation`, `useGetActiveBroadcastsQuery`, `useGetAudienceCountMutation` |
| Form (zod) | `title` 5–160, `titleBn?`, `body` (sanitized HTML ≤ 20 k), `bodyBn?`, `category: NoticeCategory`, `priority: Priority`, `isPinned`, `requiresAck`, `publishAt?` (future), `expiresAt?` (> publishAt), `audiences: {type, refId?}[]` min 1, `attachments: FileRef[]`; broadcast: `showBanner`, `sendSms`, `activeUntil?` |
| Table | Ref no · Title (BN under EN) · Category pill · Priority · Status pill · Published · Recipients/Acks (progress) · Pinned |
| States & UI | `DRAFT → SCHEDULED/PUBLISHED → EXPIRED/ARCHIVED`; Publish = AlertDialog with recipient count; Schedule needs `publishAt`; Archive confirm. Detail: letterhead, print (`PrintLayout`), Acknowledge button if `requiresAck` and not acked; receipts tab (HR/author) with export CSV |
| Permissions | `notices:read`, `notices:write`, `notices:publish`, `notices:broadcast` (Chairman/EA), receipts: `notices:read` with DEPARTMENT+ scope |
| Realtime | `notice:published` → list invalidate + banner |

### MOD-02 Dashboards & Voice Briefings (`features/dashboard`)

| Pages | `/dashboard` (7 role dashboards), `/briefings`, `/briefings/new` |
| :--- | :--- |
| Components | `ExecutiveDashboard` (ROI StatCards with AnimatedCounter, "3-Point Decision Briefing" ribbon, `VoiceBriefingPlayer` using `<audio>` for recorded file with `speechSynthesis` fallback for transcript, `PriorityApprovals` (top 3 from inbox with inline approve → ApprovalDialog), `LeadershipRoster` (presence + leave status: informed/uninformed/sick/meeting from `/dashboards/leadership`), `NoticesTab`), `PlantDashboard` (`RefineryOutputChart` recharts area + tank cards from `/dashboards/plant`, DCS alarms, LOTO permits, shift handover), `HrDashboard` (headcount, attendance today, leave queue, clearance), `TransportDashboard` (dispatch queue, drivers available, vehicles status), `DepartmentDashboard` (HOD queue, budget, team attendance), `EmployeeDashboard` (my tasks, recent activity, quick actions), `DriverDashboard` (today's trips, duty status, SOS), `BriefingComposer` (MediaRecorder → upload via presign; transcript EN/BN; audience), `RoiDossierSheet` |
| Endpoints | `useGetDashboardQuery({ kind })` (tag `Dashboard`, poll 120 s), `useGetBadgesQuery`, `useGetLeadershipStatusQuery`, `useGetBriefingsQuery`, `useGetBriefingQuery`, `useCreateBriefingMutation`, `usePublishBriefingMutation`, `useMarkBriefingListenedMutation` |
| Form | briefing: `title` 3–120, `transcript` ≤ 5 k, `transcriptBn?`, `audioFileId?`, `durationSec?` ≤ 300, `priority`, `audience` (same shape as notices) |
| States & UI | Dashboard cards link to module routes; approvals from dashboard use the same `ApprovalDialog` as MOD-17 (one implementation). Briefing publish confirm shows audience count |
| Permissions | `dashboards:read` (variant by role), `briefings:read`, `briefings:write` (Chairman/EA) |
| Realtime | `approval:updated`, `notification:new` invalidate `Dashboard`; `presence:update` for roster |

### MOD-03 Note-Sheets & E-Sign (`features/note-sheets`)

| Pages | `/note-sheets`, `/note-sheets/new`, `/note-sheets/:id?tab=sheet|quotes|history`, `/note-sheets/:id/print`, public `/verify/:code` |
| :--- | :--- |
| Components | `NoteSheetTable`, `FileChipBar` (recent files), `CreateNoteSheetWizard` (3 steps: Basics → Routing → Review; routing presets from `WorkflowTemplate` keys `NOTE_SHEET_*`; budget head lookup), `NoteSheetDocument` (letterhead, numbered paragraphs `.note-para` with left-border tone by kind, signatory block), `ParagraphComposer` (append NOTE/QUERY), `SignatoryRoute` (Stepper of `NoteSignatory` with status), `VendorQuotesTable` (+ `AddQuoteDialog`, recommend toggle), `SignDialog` (SignaturePad draw/typed/stamp, OTP step `POST /note-sheets/{id}/sign/otp` then `/sign`, remark), `ReturnDialog` (reason category, observation, improvements — from prototype `RejectionExplanationModal` presets), `ApprovalCertificate` (final PDF link, SHA-256, verification URL QR), `HistoryTimeline` (`WorkflowAction`s + paragraph hashes) |
| Endpoints | `useGetNoteSheetsQuery`, `useGetNoteSheetQuery`, `useCreateNoteSheetMutation`, `useUpdateNoteSheetMutation` (DRAFT only), `useSubmitNoteSheetMutation`, `useAddParagraphMutation`, `useAddVendorQuoteMutation`, `useRecommendQuoteMutation`, `useRequestSignOtpMutation`, `useSignNoteSheetMutation`, `useReturnNoteSheetMutation`, `useWithdrawNoteSheetMutation`, `useGetNoteSheetPdfQuery` (presigned URL), `useVerifyDocumentQuery(code)` (public) |
| Form | create: `title` 5–200, `subject?`, `departmentId`, `amount?` money string, `urgency: Priority`, `budgetHead?`, `sapPrRef?`, `confidentiality: 'INTERNAL'|'CONFIDENTIAL'|'RESTRICTED'`, `templateKey`, `paragraphs[0].body` ≥ 20 chars, `quotes?: {vendorName, amount, deliveryDays?, warrantyMonths?, isRecommended}[]`, `attachments`; sign: `method: SignatureMethod`, `imageFileId?` (required for DRAWN/UPLOADED), `otp` 6 digits, `remark?` ≤ 500; return: `reasonCategory`, `observation` ≥ 10, `improvementsRequired` ≥ 10 |
| Table | File no (RefNo) · Title · Dept · Amount (Money) · Urgency · Status pill (`NoteSheetStatus`) · Current signatory · Updated |
| States & UI | `DRAFT → IN_REVIEW → (RETURNED → IN_REVIEW) → APPROVED | REJECTED | WITHDRAWN`. Buttons shown only when `me.id` is the ACTIVE signatory (`steps[current].approverUserId === me.id` or delegate): "Sign & Forward" (intermediate) / "Final Sanction & Approve" (isFinal) / "Return / Query". Initiator sees Withdraw while IN_REVIEW with no signatures. Fixes prototype defect: intermediate sign advances the route, does not approve. After APPROVED: certificate card with real hash + QR |
| Permissions | `note-sheets:read`, `note-sheets:create`, `note-sheets:sign` (plus being the active signatory), `note-sheets:withdraw` |
| Realtime | `note-sheet:updated`, `approval:updated` |

### MOD-04 Parcel Chain-of-Custody (`features/parcels`)

| Pages | `/parcels?scope=mine|all&status=`, `/parcels/new`, `/parcels/:id`, `/parcels/scan` |
| :--- | :--- |
| Components | `ParcelKpis` (in transit, at gate, delivered today, exceptions), `ParcelList` (SplitPane list), `ParcelCockpit` tabs: `TransitCorridor` (MapPreview origin→destination with event markers), `CustodyTimeline` (events with hash chips + photos), `PackageSpecs`; `CreateParcelForm`, `ScanDialog` (QrScanner → `scanParcel` with event type by current status), `OtpVerifyDialog` (6-digit input, 3 attempts, lockout message), `FlagTamperDialog` (note + photo), `InitiateReturnDialog` (ReturnReason), `WaybillPrint` (Letterhead + barcode) |
| Endpoints | §5.4 plus `useGetParcelEventsQuery`, `useResendParcelOtpMutation`, `useGetParcelWaybillQuery` |
| Form | `category: ParcelCategory`, `urgency`, `description` 3–500, `declaredValue?` money, `recipientUserId` xor (`recipientName` + `recipientPhone` BD format `^01[3-9]\d{8}$`), `originSiteId`, `destSiteId` ≠ origin, `sealNo?`, `isConfidential`, `courierUserId?`, `photos?` |
| Table | Tracking no · Category · From → To (sites) · Recipient · Status pill (`ParcelStatus`) · Tamper pill · Dwell (hours at stage, amber > 24 h) · Updated |
| States & UI | `CREATED → DISPATCHED → IN_TRANSIT → AT_GATE → OUT_FOR_DELIVERY → DELIVERED`; return branch `RETURN_INITIATED → RETURN_IN_TRANSIT → RETURNED`; exceptions `LOST/DAMAGED/QUARANTINED`. Next-action button computed from status + permission (`parcels:scan` for handovers, recipient or `parcels:deliver` for OTP). OTP never displayed client-side (prototype hint removed). Flag tamper → status QUARANTINED, offers Initiate Return |
| Permissions | `parcels:read` (SELF for employees → `scope=mine` only), `parcels:create`, `parcels:scan`, `parcels:deliver`, `parcels:return` |
| Realtime | `parcel:event` patches detail + invalidates list |

### MOD-05 Asset Lifecycle & EAM (`features/assets`)

| Pages | `/assets?view=cards|table`, `/assets/new`, `/assets/:id?tab=specs|events|custody|spares|financials`, `/assets/work-orders(/:id)`, `/assets/requisitions(/:id)`, `/assets/transfers`, `/assets/valuation`, `/assets/disposals` |
| :--- | :--- |
| Components | `AssetKpis` (total NBV, availability %, servicing due ≤ 30 d, retired) clickable → filters; `AssetFilters` (category, site, stage, criticality, q); `AssetCard`/`AssetTable`; `NextActionBanner` (server-provided `nextAction` per asset); `AssetInspector` tabs; `LifecycleStepper` (8 steps); `AssetEventsTimeline` (hash chips); `CustodyHistory` + `AssignCustodyDialog` + `AcknowledgeCustodyButton`; `SparesTable` (+ consume/restock dialogs, low-stock pill); `FinancialsPanel` (NBV, TCO, repair ratio, `DepreciationScheduleChart` recharts bar from `/assets/{id}/depreciation`); `WorkOrderTable`, `CreateWorkOrderDialog` (PM/CM/CBM/CAL, LOTO permit, capex flag), `CompleteWorkOrderDialog` (actual cost, certificate no); `FlagDeficiencyDialog`; `RequisitionForm`, `RequisitionStepper` (`AssetReqStage`); `TransferDialog` (to site/location/employee, gate pass); `DecommissionDialog`; `DisposalChecklist` (4 items must be true) + `FinalizeDisposalDialog` (method, buyer, proceeds → gain/loss preview); `ValuationTable` + CSV export; `ScanAssetDialog` (QR) |
| Endpoints | `useGetAssetsQuery`, `useGetAssetQuery`, `useCreateAssetMutation`, `useUpdateAssetMutation`, `useGetAssetEventsQuery`, `useGetAssetDepreciationQuery`, `useAssignCustodyMutation`, `useAcknowledgeCustodyMutation`, `useReclaimCustodyMutation`, `useGetAssetSparesQuery`, `useConsumeSpareMutation`, `useRestockSpareMutation`, `useGetWorkOrdersQuery`, `useGetWorkOrderQuery`, `useCreateWorkOrderMutation`, `useStartWorkOrderMutation`, `useCompleteWorkOrderMutation`, `useFlagDeficiencyMutation`, `useCertifyAssetMutation`, `useGetAssetRequisitionsQuery`, `useCreateAssetRequisitionMutation`, `useCommissionRequisitionMutation`, `useGetTransfersQuery`, `useInitiateTransferMutation`, `useCompleteTransferMutation`, `useInitiateDecommissionMutation`, `useUpdateDisposalChecklistMutation`, `useFinalizeDisposalMutation`, `useChangeDepreciationMethodMutation`, `useExportValuationQuery` (lazy, CSV blob) |
| Forms | asset: `name`, `categoryId`, `siteId`, `location?`, `criticality`, `oem?`, `model?`, `serialNo?`, `vendor?`, `purchaseDate?`, `purchaseCost` money, `salvageValue` money ≤ 50 % of cost, `usefulLifeYears` 1–50, `depreciationMethod`, `ratedLifeHours?` (required for UOP), warranty/AMC/insurance/calibration dates, `custodianEmployeeId?`; work order: `assetId`, `type`, `priority`, `title`, `description?`, `assigneeUserId?`, `lotoPermitNo?` (required when `type !== 'CAL'` and asset `criticality === 'CRITICAL_A'`), `isCapex`, `estimatedCost?`, `dueAt`; requisition: `title`, `categoryId`, `departmentId`, `siteId`, `estimatedCost`, `justification` ≥ 30, `urgency`; disposal finalize: `method: DisposalMethod`, `buyer?`, `proceeds` money, `voucherNo?` |
| Table | Tag (RefNo) · Name · Category/class · Site · Stage pill (`AssetStage`) · Criticality · Health (progress) · NBV (Money) · Next service/calibration · Custodian |
| States & UI | Stage transitions per schema `AssetStage`; UI exposes only the transitions the server lists in `asset.allowedActions[]` (server-driven to avoid duplicating rules). Requisition approvals happen in MOD-17; this module shows the stepper and "Commission" when `APPROVED_PROCURING`. Write-off (`assets:write-off`) requires all checklist items; finalize is AlertDialog with gain/loss figure |
| Permissions | `assets:read` (SELF → "My equipment" view only), `assets:create`, `assets:maintain`, `assets:custody`, `assets:transfer`, `assets:requisition`, `assets:financials`, `assets:write-off`, `assets:policy` |
| Realtime | none (due reminders arrive as notifications) |

### MOD-06 Licence & Compliance (`features/compliance`)

| Pages | `/compliance?view=board|table&urgency=`, `/compliance/licences/:id`, `/compliance/renewals/:id` |
| :--- | :--- |
| Components | `ComplianceKpis` (next expiry, shutdown exposure/day Money, filings monitored, expired), `RegulatorChips` (RegulatoryBody filter), `LicenceKanban` (5 `LicenceStage` columns; card = `k-card` with regulator tag, days-left countdown tone: ≤ 30 danger, ≤ 90 warning), `LicenceTable`, `LicenceDossier` (metrics, owner, fee, documents vault via `FileDropzone`, checklist), `RenewalStepper` + `AdvanceStageDialog` (stage-specific fields: fund approval ref; applied date; inspection date + inspector; audit findings; fee paid chalan + new expiry), `ChecklistEditor` (PENDING/PASSED/FAILED/NA), `DoLetterDialog` (memo generation → PDF), `CreateLicenceDialog` |
| Endpoints | `useGetLicencesQuery`, `useGetLicenceQuery`, `useCreateLicenceMutation`, `useUpdateLicenceMutation`, `useGetLicenceDashboardQuery` (view `v_licence_dashboard`), `useStartRenewalMutation`, `useGetRenewalQuery`, `useAdvanceRenewalStageMutation`, `useRevertRenewalStageMutation`, `useUpdateChecklistItemMutation` (optimistic), `useAddLicenceDocumentMutation`, `useGenerateDoLetterMutation`, `useGetRegulatoryBodiesQuery`, `useGetLicenceTypesQuery` |
| Form | licence: `typeId`, `siteId`, `licenceNo`, `title`, `ownerUserId`, `issuedAt`, `expiresAt` > issuedAt, `feeAmount?`, `shutdownRiskPerDay?`, `criticality`; advance: discriminated union on target stage (`APPLICATION_FILED`: `appliedAt`; `FIELD_INSPECTION`: `inspectionAt`, `inspectorName`; `MINISTRY_VETTING`: `auditFindings?`; `RENEWED`: `feePaidAt`, `chalanNo`, `newExpiresAt`, `certificateFileId`) |
| Table | Licence no · Title · Regulator · Site · Expires (DateTimeDhaka + days-left pill) · Status (`LicenceStatus`) · Renewal stage · Owner |
| States & UI | Kanban move = `AdvanceStageDialog` (no free drag between non-adjacent columns; keyboard move via card menu). Reaching `RENEWED` requires the renewal fields; server updates `Licence.expiresAt`. Auto-created renewals (T-90) appear with "Started by system" chip |
| Permissions | `compliance:read`, `compliance:write`, `compliance:renew`, `compliance:letters` |
| Realtime | `due:reminder` invalidates Licence |

### MOD-07 HSE Incidents & CAPA (`features/incidents`)

| Pages | `/incidents`, `/incidents/new?quick=1`, `/incidents/:id?tab=overview|rca|capa|closure` |
| :--- | :--- |
| Components | `SafetyKpis` (safe days, safe man-hours, TRIR, CAPA completion %, statutory open), `RiskMatrix` (5×5, click filters), `IncidentFilters` (type, zone, severity, stage, statutory, site), `IncidentTable`, `ReportIncidentWizard` (Step 1 what/where/when with MapPreview pin + site/zone; Step 2 people — `EmployeePicker` from directory + external names, injuries; Step 3 severity/likelihood sliders → live risk score/category, photos, anonymous toggle), `QuickHazardForm` (single screen), `IncidentOverview`, `RcaPanel` (5-Whys inputs + `FishboneEditor` 6M), `CapaTable` + `AddCapaDialog` (type, owner, priority, dueAt) + `CompleteCapaDialog` (evidence, files) + `VerifyCapaButton`, `StatutoryCard` (body, due in 24 h countdown, receipt no input, Form B-12 print), `ClosurePanel` (two sign-offs: HSE officer + Plant GM; `SignaturePad`), `TriageDialog` (assign investigator, confirm risk) |
| Endpoints | `useGetIncidentsQuery`, `useGetIncidentQuery`, `useCreateIncidentMutation` (Idempotency-Key), `useTriageIncidentMutation`, `useStartInvestigationMutation`, `useSaveRcaMutation`, `useGetCapasQuery`, `useCreateCapaMutation`, `useCompleteCapaMutation`, `useVerifyCapaMutation`, `useRecordStatutoryReceiptMutation`, `useSignClosureMutation`, `useGetIncidentStatsQuery`, `useGetIncidentFormQuery` (B-12 PDF) |
| Form | report: `type: IncidentType`, `title` 5–160, `description` ≥ 20, `siteId`, `zone?`, `occurredAt` ≤ now, `lat/lng?`, `shift?`, `people: {employeeId? | name, role: PersonRole, injuryDesc?}[]`, `severity` 1–5, `likelihood` 1–5, `isAnonymous`, `photos`; CAPA: `type: CapaType`, `description` ≥ 10, `ownerUserId`, `priority`, `dueAt` ≥ today |
| Table | Incident no · Type · Title · Site/zone · Occurred · Risk (score + category pill) · Stage pill (`IncidentStage`) · Statutory flag · CAPA n/m |
| States & UI | `REPORTED → TRIAGED → UNDER_INVESTIGATION → CAPA_EXECUTION → MANAGEMENT_REVIEW → CLOSED`. Stage CTA from `incident.allowedActions`. Closure enabled only when all CAPAs `VERIFIED`; two signatures required; closure button visible for `incidents:close`. `statutoryReportable` derived server-side (severity ≥ 3) and shown as red card with 24 h timer |
| Permissions | `incidents:report` (everyone), `incidents:read` (SELF for reporters), `incidents:investigate`, `incidents:capa`, `incidents:close`, `incidents:statutory` |
| Realtime | `incident:critical` → red persistent toast (ack required) + invalidate |

### MOD-08 Guest & VIP Passes (`features/visitors`)

| Pages | `/visitors?scope=&status=&category=`, `/visitors/new`, `/visitors/:id?tab=…`, `/visitors/gate`, `/visitors/muster` |
| :--- | :--- |
| Components | `VisitorKpis` (inside now, expected today, VIP/Govt, overdue), `VisitList` (SplitPane), `VisitCockpit` tabs: Details, `VipProtocol` (tier, escort, hospitality notes), `Inspection` (findings table + add), `PpeChecklist` (hard hat/goggles/shoes/hi-vis/H₂S; cleared-by), `VehicleBarrier` (plate, parking, barrier status with live socket), `PermittedZones` (GREEN/YELLOW/RED chips, escort flag); `PreRegisterForm` (visitor lookup by phone → reuse `Visitor`, watchlist check result banner), `GateConsole` (QrScanner or search → `CheckInDialog` badge no/vehicle/PPE → `CheckOutButton`; barrier control if integrated), `MusterBoard` (checked-in list, mark safe, "Mark all safe", export), `PassPreview` (Letterhead + QR token, send via SMS/Email/WhatsApp link) |
| Endpoints | `useGetVisitsQuery`, `useGetVisitQuery`, `useCreateVisitMutation`, `useUpdateVisitMutation`, `useApproveVisitMutation` (VIP/Govt via MOD-17), `useCheckInVisitMutation`, `useCheckOutVisitMutation`, `useCancelVisitMutation`, `useDenyVisitMutation`, `useSavePpeMutation`, `useAddFindingMutation`, `useSetZonesMutation`, `useMarkMusterSafeMutation` (optimistic), `useSendPassMutation`, `useLookupVisitorQuery` (by phone), `useGetWatchlistQuery`, `useGetGateQueueQuery` (poll 30 s when socket down) |
| Form | `visitor: {fullName, organisation?, phone (BD), email?, idProofType?, idProofNo?}`, `hostUserId` (default me), `siteId`, `category: VisitorCategory`, `vipTier?` (required if VIP), `purpose` ≥ 5, `expectedAt` ≥ now, `expectedEndAt?`, `vehiclePlate?`, `escortUserId?`, `zones: {zone, level, escortRequired}[]`, `ppeRequired` (auto true for PLANT sites) |
| Table | Visit no · Visitor (org) · Category/tier pill · Host · Site · Expected · Status pill (`VisitStatus`) · Badge · Inside since |
| States & UI | `PRE_REGISTERED → (APPROVED for VIP/GOVT) → CHECKED_IN → CHECKED_OUT`; `OVERDUE` set by server when `expectedEndAt` passed (prototype never set it); `CANCELLED/DENIED`. Check-in blocked with explanation when watchlist hit or PPE not cleared on plant sites. Employees see only `scope=mine` |
| Permissions | `visitors:read`, `visitors:create` (invite), `visitors:approve`, `visitors:gate` (SECURITY_GATE/RECEPTION), `visitors:watchlist` |
| Realtime | `visit:status` → gate console/muster |

### MOD-09 Fleet & Dispatch (`features/fleet`)

| Pages | `/fleet/requisitions(/new|/:id)`, `/fleet/vehicles(/:id)`, `/fleet/drivers(/:id)`, `/fleet/fuel`, `/fleet/gate`, `/fleet/desk`, `/fleet/my-trips` |
| :--- | :--- |
| Components | `FleetTabs` (role-aware set from permissions: admin 6 tabs, employee 2, driver 2 as in prototype), `RequisitionQueue` (DataTable, pooling suggestion banner from `GET /fleet/requisitions/pool-suggestions` — server computes route overlap), `RequisitionForm` (purpose presets, origin/stops/destination with MapPreview, passengers picker, trip type, capacity class auto by pax, estimated km/cost from `POST /fleet/requisitions/estimate`), `RequisitionDetail` (status stepper, HOD endorsement card, `AssignVehicleDialog` (available vehicles/drivers filtered by capacity, hazmat, duty hours; breathalyzer status), `RejectDialog`, `TripCard` with `GateOutDialog`/`GateInDialog` (odometer), `CompleteTripDialog` (rating, feedback), `TripPassPrint`), `VehicleTable` + `RegisterVehicleDialog` (docs: fitness/tax/route permit/insurance/hazmat expiry), `VehicleDetail` (documents, fuel history, trips, link to asset), `DriverTable` + `EnrollDriverDialog` + `DriverStatusDialog` + `BreathalyzerDialog`, `FuelVoucherTable` + `IssueVoucherDialog` (QR), `GateRoster` (today's out/in), `DispatchDesk` (3-pane: channels REQ/DESK/BROADCAST/SOS, `FleetChatThread`, toll claim drawer → approve/reject), `DriverConsole` (large targets: duty status, arrived/start/complete, toll log with plaza presets, SOS, chat, call link `tel:`) |
| Endpoints | `useGetRequisitionsQuery`, `useGetRequisitionQuery`, `useCreateRequisitionMutation`, `useEstimateRequisitionMutation`, `useEndorseRequisitionMutation` (HOD; or via MOD-17), `useRejectRequisitionMutation`, `useAssignRequisitionMutation`, `usePoolRequisitionsMutation`, `useGetPoolSuggestionsQuery`, `useGateOutTripMutation`, `useGateInTripMutation`, `useCompleteTripMutation`, `useAddTripEventMutation` (SOS/checkpoint), `useGetTripPassQuery`, `useGetVehiclesQuery`, `useGetVehicleQuery`, `useCreateVehicleMutation`, `useUpdateVehicleStatusMutation`, `useRetireVehicleMutation`, `useAddVehicleDocumentMutation`, `useGetDriversQuery`, `useGetDriverQuery`, `useCreateDriverMutation`, `useUpdateDriverStatusMutation`, `useRecordBreathalyzerMutation`, `useGetFuelVouchersQuery`, `useIssueFuelVoucherMutation`, `useRedeemFuelVoucherMutation`, `useGetFleetMessagesQuery({channel})`, `useSendFleetMessageMutation`, `useGetTollClaimsQuery`, `useSubmitTollClaimMutation`, `useApproveTollClaimMutation`, `useRejectTollClaimMutation`, `useGetMyTripsQuery` |
| Form | requisition: `purpose` ≥ 5, `tripType`, `origin`, `stops: {label, lat?, lng?}[]` ≤ 5, `destination`, `departAt` ≥ now + 30 min, `returnAt?` > departAt (required for ROUND_TRIP), `passengers: {employeeId?|name}[]` 1–7, `capacityClass` (auto, editable), `priority`, `costCenter?`; assign: `vehicleId`, `driverId`, `dispatchNote?`; gate out: `startKm` ≥ vehicle.odometerKm; gate in: `endKm` > startKm; complete: `rating` 1–5, `feedback?`; vehicle: `plateNo` (BD format), `type: VehicleType`, `make`, `model`, `year?`, `capacity`, `siteId`, `fuelType?`, `tankLiters?`, `isHazmat`, `documents[]`; driver: `employeeId`, `licenceNo`, `licenceClass`, `licenceExpiresAt` > today; toll: `plaza`, `amount` money, `photoFileId?` |
| Table | Req no · Requester/dept · Route (origin → destination) · Depart · Pax/capacity · Priority · Status pill (`RequisitionStatus`) · Vehicle/driver · Est. cost |
| States & UI | `DRAFT → PENDING_APPROVAL → APPROVED → ASSIGNED → IN_TRANSIT → COMPLETED` / `REJECTED/CANCELLED`. Assign only when APPROVED; Gate out only when ASSIGNED; pooled requisitions show "Pooled with REQ-…". Fuel voucher issue actually calls the mutation (prototype gap). Driver console actions each use Idempotency-Key |
| Permissions | `fleet:request`, `fleet:read` (SELF/DEPARTMENT/COMPANY), `fleet:endorse`, `fleet:dispatch`, `fleet:manage`, `fleet:gate`, `fleet:drive`, `fleet:fuel`, `fleet:tolls` |
| Realtime | `trip:event`, `/chat`-style `fleet:message` on `/notifications` namespace (room `fleet:{channel}`) |

### MOD-10 Attendance & Leave (`features/attendance`)

| Pages | `/attendance`, `/attendance/team`, `/attendance/regularisations`, `/leave`, `/leave/new`, `/leave/:id` |
| :--- | :--- |
| Components | `PunchCard` (web: shows today's punches, shift, and a "Punch from the mobile app" hint; web punch allowed only for sites with `webPunchAllowed` setting and uses browser geolocation → server geofence check; accuracy/mock flags displayed), `MyMonthCalendar` (DayStatus colours), `MonthSummary` (present/late/leave/OT minutes), `TeamLiveRoster` (DataTable from `v_attendance_live`, filters site/department/status, poll 60 s), `MusterExportButton` (CSV/XLSX), `RegularisationForm` (type, date, in/out, reason) + `RegularisationTable` (approve/reject for managers), `LeaveBalances` (StatCards per LeaveType), `LeaveRequestForm` (type, dates → working days computed server-side preview, reason, document if `requiresDoc`), `LeaveTable`, `LeaveDetail` (status, reviewer, timeline), `ShiftRosterTable` (HR) |
| Endpoints | `useGetMyAttendanceQuery({month})`, `usePunchMutation` (Idempotency-Key, body lat/lng/accuracy/deviceId/platform WEB), `useGetTeamAttendanceQuery`, `useGetAttendanceDaysQuery`, `useExportAttendanceQuery` (lazy), `useGetRegularisationsQuery`, `useCreateRegularisationMutation`, `useDecideRegularisationMutation`, `useGetLeaveBalancesQuery`, `useGetLeaveRequestsQuery`, `useGetLeaveRequestQuery`, `useCreateLeaveRequestMutation`, `useCancelLeaveRequestMutation`, `usePreviewLeaveDaysMutation`, `useGetLeaveTypesQuery`, `useGetShiftsQuery`, `useAssignShiftMutation` |
| Form | leave: `leaveTypeId`, `startDate`, `endDate` ≥ start, `reason` ≥ 10, `isInformed`, `documentFileId?` (required if type.requiresDoc), `handoverToUserId?`; regularisation: `date` ≤ today, `type: RegularisationType`, `requestedIn?`, `requestedOut?` (at least one), `reason` ≥ 10 |
| Table | leave: Ref · Employee · Type · Dates · Days · Status pill (`LeaveStatus`) · Reviewer; roster: Employee · Dept · Shift · First in · Last out · Status pill (`DayStatus`) · Late min |
| States & UI | Leave `PENDING → APPROVED/REJECTED` (decision in MOD-17 or inline for `leave:approve`), `CANCELLED` by requester while PENDING. Punch result `REJECTED_*` shows reason and offers Regularisation. No fake biometric/GPS copy |
| Permissions | `attendance:read` (SELF/TEAM/DEPARTMENT/SITE), `attendance:punch-web`, `attendance:regularise`, `attendance:approve`, `attendance:roster`, `leave:read`, `leave:request`, `leave:approve` |
| Realtime | none; polling as above |

### MOD-11/12/13 Claims — TA/DA, Conveyance, Tour (`features/claims`)

| Pages | `/claims?type=&status=`, `/claims/new?type=`, `/claims/:id`, `/claims/policies` |
| :--- | :--- |
| Components | `ClaimKpis` (pending, approved this month, conveyance cap used/limit for me, settlement SLA), `ClaimTypeTabs` (All / TADA / CONVEYANCE / TOUR_EVENT / Policy rates), `ClaimTable`, `ClaimDetail` (header, lines table with receipts, policy flags list, advance & net settlement card, voucher, timeline, actions), `ClaimWizard` (Step 1 type + purpose preset; Step 2 header fields; Step 3 `ClaimLinesEditor` (RHF `useFieldArray`, category per type, receipt `FileDropzone`, declaration toggle for receipt-less rickshaw ≤ policy.receiptRequiredAbove, mileage km → amount auto); Step 4 review with server `POST /claims/validate` returning `policyAmount`, `policyFlags`, `netSettlement`), `PolicyRatesTable` (ExpensePolicy by grade), `ResubmitDialog`, `SettleDialog` (Finance: voucher no, paidAt), `ReturnDialog` (presets) |
| Endpoints | `useGetClaimsQuery`, `useGetClaimQuery`, `useCreateClaimMutation`, `useUpdateClaimMutation` (DRAFT/RETURNED), `useValidateClaimMutation`, `useSubmitClaimMutation`, `useWithdrawClaimMutation`, `useResubmitClaimMutation`, `useSettleClaimMutation`, `useGetAdvancesQuery`, `useCreateAdvanceMutation`, `useGetExpensePoliciesQuery`, `useGetMyPolicyQuery`, `useExportClaimsQuery` (lazy CSV) |
| Form | header: `type: ClaimType`, `purpose` ≥ 5, `destination?` (required TADA/TOUR), `periodStart?/periodEnd?` (required TADA/TOUR; end ≥ start), `travelMode?` ∈ `policy.allowedTravelModes`, `costCenter?`, `advanceId?` (TOUR); line: `date` within period, `category` (per type list), `description`, `fromPlace?/toPlace?` (CONVEYANCE), `distanceKm?` (MILEAGE), `amount` money > 0, `receiptFileId?` (required when `amount > policy.receiptRequiredAbove && !isDeclaration`), `isDeclaration`; `lines` min 1 |
| Table | Claim no · Type pill · Claimant · Purpose · Period · Total (Money) · Policy flags count · Status pill (`ClaimStatus`) · Updated |
| States & UI | `DRAFT → PENDING_MANAGER → PENDING_FINANCE → APPROVED → SETTLED` / `RETURNED → (edit) → PENDING_MANAGER` / `REJECTED/CANCELLED`. Approvals in MOD-17 (two steps). `SETTLED` is reachable via Finance's Settle (prototype gap fixed). Policy flags render amber with rule text; hard violations block Submit (server 422) |
| Permissions | `claims:read` (SELF/TEAM/COMPANY), `claims:create`, `claims:approve` (via workflow), `claims:settle` (FINANCE), `claims:policy` (admin) |
| Realtime | `approval:updated` |

### MOD-14 Commuter Bus & FIFO (`features/bus`)

| Pages | `/bus`, `/bus/routes/:id`, `/bus/my-seat`, `/bus/fleet` |
| :--- | :--- |
| Components | `PerspectiveToggle` (Staff/Supervisor if `bus:manage`), `DirectionToggle` (INBOUND/OUTBOUND), `RouteCards` (occupancy from `v_bus_route_occupancy`), `RouteSeatMapPage` tabs: `SeatMap` (52 seats; colours EMPTY/OCCUPIED/VACATED/BLOCKED, category icons) + `SeatDossier` (allocation, pickup stop, booking type, actions), `WaitlistPanel` (ordered by priority desc, appliedAt asc; `PromoteButton` for supervisor, `OverridePriorityDialog` with reason), `StopsTimeline` (scheduled times, MapPreview), `FleetCrewPanel`, `ShiftRosterPanel`; `MySeatCard` (allocation or waitlist rank; `SeatOfferCard` with 48 h countdown Accept/Decline), `JoinWaitlistDialog`, `ReleaseSeatDialog` (reason, dates for temporary), `SwapSeatDialog`, `GuestBookingDialog` (SHIFT_PASS/GUEST with dates); supervisor: `RegisterBusDialog`, `RouteBuilderDialog` (stops `useFieldArray` ≥ 2, map pick), `ReassignBusDialog`, `DelayBroadcastDialog` (EN/BN message, sendSms), `GateManifestPrint`, `ConductorScannerSheet` (QR boarding count), `TimetableSheet` |
| Endpoints | `useGetBusRoutesQuery`, `useGetBusRouteQuery` (stops, seats, waitlist), `useCreateBusRouteMutation`, `useUpdateBusRouteMutation`, `useGetSeatsQuery({routeId})`, `useAllocateSeatMutation`, `useReleaseSeatMutation`, `useBlockSeatMutation`, `useSwapSeatMutation`, `useGetWaitlistQuery({routeId})`, `useJoinWaitlistMutation`, `useLeaveWaitlistMutation`, `useSetWaitlistPriorityMutation`, `usePromoteWaitlistMutation` (manual FIFO run), `useGetMySeatQuery`, `useGetMyOffersQuery`, `useRespondSeatOfferMutation` (optimistic), `useGetBusesQuery`, `useCreateBusMutation`, `useAssignBusRouteMutation`, `useCreateBusBroadcastMutation`, `useGetRouteManifestQuery`, `useRecordBoardingMutation` |
| Form | route: `code`, `name`, `nameBn?`, `siteId`, `capacity` 1–60, `stops: {direction, seqNo, name, nameBn?, lat?, lng?, scheduledTime HH:mm}[]` ≥ 2 per direction; join waitlist: `routeId`, `pickupStopId?`; release: `reason` ≥ 3, `endsOn?`; priority override: `priority` 1–9, `priorityReason` ≥ 10; broadcast: `routeId?`, `message` ≤ 300, `messageBn?`, `sendSms` |
| Table | waitlist: Rank · Employee · Dept · Applied · Priority (reason tooltip) · Status pill (`WaitlistStatus`) · Offer expires |
| States & UI | Seat `EMPTY/OCCUPIED/VACATED/BLOCKED`; waitlist `WAITING → OFFERED (48 h) → ACCEPTED/DECLINED/EXPIRED`. Offers are server-generated when a seat vacates (FIFO engine); supervisor's "Promote" triggers the engine, never allocates directly over the queue. Admin confirmation of permanent allocations goes through MOD-17 |
| Permissions | `bus:read`, `bus:apply` (employees), `bus:manage` (TRANSPORT_ADMIN/HR_ADMIN), `bus:broadcast` |
| Realtime | `seat:offer` → toast + invalidate; seat map invalidated on `seat:changed` |

### MOD-15 Inner-Circle Chat (`features/chat`)

| Pages | `/chat`, `/chat/:channelId` (shell without page padding) |
| :--- | :--- |
| Components | `ChannelList` (tabs All/Channels/Direct; sections; unread counts; locked icon), `ConversationPane` (virtualised `MessageList` with date dividers from real `createdAt`, `MessageBubble` text/voice (`<audio>`)/document (file card with scan status)/directive (gold card with ack list)/system; reactions popover; pinned bar; typing indicator), `Composer` (text, `@mention`, attach via FileDropzone, voice via MediaRecorder → upload, urgent flag, directive mode → `CreateDirectiveDialog` title/body/dueAt with presets), `MemberDrawer` (presence, location text, pinned directives, shared files), `CallLink` (`tel:`; VoIP out of scope), `DirectiveAckButton` |
| Endpoints | `useGetChannelsQuery`, `useGetChannelQuery`, `useCreateChannelMutation`, `useUpdateChannelMembersMutation`, `useGetMessagesQuery({channelId, before?})` (cursor, `merge` for infinite scroll), `useSendMessageMutation` (optimistic append with temp id, Idempotency-Key), `useEditMessageMutation`, `useDeleteMessageMutation`, `useReactMutation`, `usePinMessageMutation`, `useMarkReadMutation` (optimistic), `useGetDirectivesQuery`, `useCreateDirectiveMutation`, `useAcknowledgeDirectiveMutation`, `useGetPresenceQuery` |
| Form | message: `body` ≤ 4 000 or `fileId` or voice; directive: `title` 3–120, `body` ≥ 10, `priority` default HIGH, `dueAt?` |
| States & UI | Outgoing/incoming decided by `senderId === me.id` (prototype hard-coded chairman). Locked channels: composer disabled unless `isAdmin`. Retention notice if `retentionDays` |
| Permissions | `chat:read` (members only; channel membership server-side), `chat:write`, `chat:directive` (CHAIRMAN/DIRECTOR), `chat:manage` |
| Realtime | `/chat` namespace events (§6.2); `/presence` |

### MOD-16 Workforce & Exit Clearance (`features/workforce`)

| Pages | `/workforce?status=active|former`, `/workforce/new`, `/workforce/:employeeId`, `/workforce/:employeeId/exit-clearance` |
| :--- | :--- |
| Components | `WorkforceKpis` (active, by site, former), `EmployeeTable` (from `v_employee_directory`, filters dept/site/grade/q) with mobile cards, `OnboardEmployeeForm` (two sections: employee + user account/roles; NID masked input), `EmployeeProfile` (info, roles & scopes (read-only link to admin), custody assets, leave balances, bus seat, documents), `InitiateClearanceDialog` (last working day, reason), `ClearanceChecklist` (7 `ClearanceItemKey`s with owner role, status PENDING/CLEARED/WAIVED, note; "Reclaim assets" calls MOD-05 `reclaimCustody` and auto-clears `ASSETS_RETURNED`), `FinalizeClearanceDialog` (requires all CLEARED/WAIVED; final settlement voucher), `ReactivateButton` |
| Endpoints | `useGetEmployeesQuery`, `useGetEmployeeQuery`, `useCreateEmployeeMutation`, `useUpdateEmployeeMutation`, `useGetEmployeeAssetsQuery`, `useInitiateExitClearanceMutation`, `useGetExitClearanceQuery`, `useUpdateClearanceItemMutation` (optimistic), `useFinalizeExitClearanceMutation`, `useReactivateEmployeeMutation`, `useGetDepartmentsQuery`, `useGetSitesQuery`, `useGetGradesQuery`, `useGetDesignationsQuery` |
| Form | employee: `fullName`, `fullNameBn?`, `email`, `phone` BD, `empCode?` (auto), `sapPernr?`, `designationId?`, `gradeId`, `departmentId`, `siteId`, `lineManagerId?`, `joinDate` ≤ today, `nid?` (10/13/17 digits), `bloodGroup?` enum, `emergencyContact?`, `roleKeys[]` ≥ 1, `photoFileId?`; clearance item: `status`, `note?` (required for WAIVED) |
| Table | Emp code · Name (BN) · Designation · Dept · Site · Grade · Status pill (`EmploymentStatus`) · Line manager · Actions |
| States & UI | `ACTIVE → OFFBOARDING → OFFBOARDED`; each clearance item editable only by its `ownerRoleKey` holders (server enforces; UI disables). Chairman row has no destructive actions |
| Permissions | `employees:read` (DEPARTMENT/COMPANY), `employees:create`, `employees:update`, `employees:offboard`, `employees:clear-item` |
| Realtime | none |

### MOD-17 Approvals Center & Delegation (`features/approvals`)

| Pages | `/approvals?tab=pending|history&category=&q=`, `/approvals/:instanceId`, `/approvals/delegations` |
| :--- | :--- |
| Components | `InboxKpis` (pending, total value Money in lakh/crore, completed this week, overdue SLA), `CategoryChips` (objectType groups: Procurement/Note-sheets, Claims, Vehicle, Leave, Assets, Visitors, Bus, Clearance), `InboxTable` (row = `ApprovalCard`: summary, initiator, amount, SLA badge (<12 h danger, <24 h warn), urgency; selectable; expand → `TrailTimeline`), `BatchApproveBar` (n selected → `ApprovalDialog` once; server endpoint `POST /approvals/batch`), `ApprovalDialog` (prototype `AuthorizeDirectiveModal`: directive presets, required comment, optional `SignaturePad` when template step `requiresSignature`, notify toggle), `RejectDialog` (prototype `RejectionExplanationModal` presets by objectType), `ApprovalDetailPage` (object summary panel rendered by `entities/workflow/ObjectSummary` switch on `objectType` with "Open record" link, steps stepper, actions, trail), `HistoryTable` (decision pill shows real `StepDecision` — prototype showed "Approved" for all), `DelegationForm` (toUserId, modules multi-select or all, maxAmount?, startsAt/endsAt, reason) + `DelegationTable` (active/upcoming/expired, revoke) |
| Endpoints | `useGetInboxQuery` (view `v_approval_inbox`), `useGetApprovalHistoryQuery`, `useGetApprovalQuery(instanceId)`, `useApproveStepMutation` (optimistic §5.5), `useRejectStepMutation`, `useReturnStepMutation`, `useReassignStepMutation`, `useCommentMutation`, `useBatchApproveMutation`, `useGetDelegationsQuery`, `useCreateDelegationMutation`, `useRevokeDelegationMutation` |
| Form | approve: `comment` ≥ 3 (required when template says so), `signatureId?`, `notify`; reject/return: `reasonCategory`, `observation` ≥ 10, `improvementsRequired?` (return only); delegation: `toUserId` ≠ me, `modules[]`, `maxAmount?` money, `startsAt` ≥ today, `endsAt` > startsAt ≤ 90 days, `reason?` |
| Table | Ref · Type pill · Title · Initiator · Dept · Amount · Submitted · SLA badge · Step n/m · Actions |
| States & UI | Decisions propagate server-side (workflow engine), so this module never calls module mutations directly. Delegation actually re-routes (prototype stored but ignored); inbox rows show "Delegated from X" chip. Approving as delegate records both ids |
| Permissions | `workflow:approve` (must be step approver or delegate), `workflow:delegate`, `workflow:reassign` (admin), `workflow:read-all` (auditor history) |
| Realtime | `approval:updated` |

### MOD-18 Administration & Master Data (`features/admin`)

| Pages | `/admin/users(/:id)`, `/admin/roles(/:id)`, `/admin/departments`, `/admin/sites`, `/admin/grades`, `/admin/designations`, `/admin/geofences`, `/admin/workflow-templates(/:id)`, `/admin/policies`, `/admin/settings`, `/admin/audit-logs` |
| :--- | :--- |
| Components | `UserTable` + `UserForm` (email, phone, roles with optional site restriction, active, force MFA, reset password link, revoke sessions), `RolePermissionMatrix` (rows permissions grouped by module, columns scope select per grant; diff preview before save), `MasterDataPage<T>` (generic DataTable + Dialog form driven by a column/field config per entity), `GeofenceEditor` (MapPreview interactive: circle radius slider / polygon draw; test-point tool calling `POST /admin/geofences/{id}/test`), `WorkflowTemplateEditor` (steps `useFieldArray`: key, approverRule, approverRef, parallel, condition expression with validation `POST /admin/workflow-templates/validate`, slaHours, escalateTo; version bump on save; JSON view), `ExpensePolicyTable` (by grade, effective dates), `SettingsForm` (key/value with typed editors), `AuditLogTable` (virtualised, filters entityType/entityId/actor/date, before/after JSON diff viewer) |
| Endpoints | `useGetUsersQuery`, `useGetUserQuery`, `useCreateUserMutation`, `useUpdateUserMutation`, `useSetUserRolesMutation`, `useDeactivateUserMutation`, `useResetUserMfaMutation`, `useRevokeUserSessionsMutation`, `useGetRolesQuery`, `useGetRoleQuery`, `useCreateRoleMutation`, `useUpdateRolePermissionsMutation`, `useGetPermissionsQuery`, CRUD hooks for `Departments/Sites/Grades/Designations/LeaveTypes/Shifts/AssetCategories/RegulatoryBodies/LicenceTypes/BusRoutes` (generic factory `makeCrudEndpoints('departments','Department')`), `useGetGeofencesQuery`, `useUpsertGeofenceMutation`, `useTestGeofenceMutation`, `useGetWorkflowTemplatesQuery`, `useGetWorkflowTemplateQuery`, `useSaveWorkflowTemplateMutation`, `useValidateWorkflowTemplateMutation`, `useGetExpensePoliciesQuery`, `useUpsertExpensePolicyMutation`, `useGetSettingsQuery`, `useUpdateSettingMutation`, `useGetAuditLogsQuery` |
| Form | user: `email`, `phone?`, `isActive`, `mfaEnabled`, `roles: {roleKey, siteId?}[]` ≥ 1, `employeeId?`; role: `key` `^[A-Z_]+$`, `name`, `description?`, `grants: {permissionKey, scope}[]`; geofence: `siteId`, `name`, `type`, circle (`centerLat/Lng`, `radiusMeters` 50–5000) xor `polygon` GeoJSON ≥ 3 points; template step: `key`, `approverRule`, `approverRef?` (required for ROLE/USER), `parallel`, `condition?`, `slaHours` 1–720, `escalateTo?` |
| Table | users: Email · Name · Roles · Sites · MFA · Active · Last login; audit: Time · Actor · Action · Entity · Request id |
| States & UI | Destructive admin actions (deactivate user, revoke sessions, delete master row) → AlertDialog with typed confirmation for users. Settings changes show "requires restart" chip where flagged |
| Permissions | `admin:users`, `admin:roles`, `admin:master-data`, `admin:workflows`, `admin:policies`, `admin:settings`, `admin:audit` (SUPER_ADMIN; audit also auditors) |
| Realtime | none |

### Cross-cutting: Auth, Profile, Notifications, Files

| Feature | Pages / components | Endpoints |
| :--- | :--- | :--- |
| `auth` | `LoginPage` (identifier email/emp-code, password, remember device; brand panel with sites; language toggle), `MfaPage`, `ForgotPasswordPage`, `ResetPasswordPage`; `LockScreen` widget | `useLoginMutation` (`POST /auth/login` → sets cookies; response `{ mfaRequired }`), `useVerifyMfaMutation`, `useLogoutMutation` (clears cookies, `resetApiState`), `useRefreshMutation` (internal), `useGetMeQuery` (`GET /auth/me` → user, employee, roles, `permissions: string[]` with scopes, settings), `useForgotPasswordMutation`, `useResetPasswordMutation`, `useUnlockMutation` |
| `profile` | `ProfilePage` tabs: Info (read-only employee data, photo upload), Security (change password, TOTP enrol with QR, recovery codes), Delegation (links MOD-17 form), Sessions (`UserSession` list, revoke), Preferences (language, notification channels, quiet hours, digest) | `useUpdateMeMutation`, `useChangePasswordMutation`, `useEnrolMfaMutation`, `useConfirmMfaMutation`, `useDisableMfaMutation`, `useGetSessionsQuery`, `useRevokeSessionMutation`, `useGetNotificationPrefsQuery`, `useUpdateNotificationPrefsMutation` |
| `notifications` | `NotificationBell` popover, `NotificationListPage` (filters type/priority/unread, infinite scroll), `AckRequiredDialog` for CRITICAL | `useGetNotificationsQuery` (cursor, `merge`), `useGetUnreadCountQuery`, `useMarkNotificationReadMutation` (optimistic), `useMarkAllReadMutation` (optimistic), `useAckNotificationMutation` |
| `files` | `FileDropzone`, `FilePreview` (image/pdf), `useUpload()` hook | `usePresignUploadMutation` (`POST /files/presign` → `{ fileId, url, headers }`), raw `fetch PUT` to storage with `XMLHttpRequest` progress, `useCompleteUploadMutation` (`POST /files/{id}/complete`), `useGetFileUrlQuery` (`GET /files/{id}/url` presigned GET, cached 50 min) |

---

## 10. Forms & Validation Conventions

### 10.1 RHF + zod
```ts
const schema = z.object({ title: z.string().min(5).max(200), amount: moneySchema.optional(), departmentId: z.string().uuid() });
type FormValues = z.infer<typeof schema>;
const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur', defaultValues });
const [create, { isLoading }] = useCreateNoteSheetMutation();
const onSubmit = form.handleSubmit(async (values) => {
  try { const created = await create(values).unwrap(); toast.success(t('noteSheets:created', { ref: created.fileNo })); navigate(`/note-sheets/${created.id}`); }
  catch (e) { applyServerErrors(e, form.setError, t); }
});
```
`applyServerErrors` (`shared/api/error.ts`): for `VALIDATION_ERROR` (422) iterate `error.details[] = { path: 'lines.2.amount', code, message }` → `setError(path, { type: 'server', message })`, focus first; unmapped paths → `setError('root.server', …)` rendered under the form; other codes → toast with `requestId` and i18n message by `error.code` (`errors:INVALID_STATE_TRANSITION` etc.). Zod messages use `zod-i18n-map` with EN/BN maps. Schemas live in `features/<module>/schemas/*.schema.ts`, named `createParcelSchema`, exported with inferred types; field-level reuse: `moneySchema`, `bdPhoneSchema`, `uuidSchema`, `dateIsoSchema`, `bilingualSchema({ required: 'en' })`, `fileRefSchema`.

### 10.2 File uploads
`useUpload()` → for each file: validate type/size client-side → `presignUpload({ fileName, mime, sizeBytes, ownerType?, ownerId? })` → `PUT` to presigned URL with progress → `completeUpload(fileId)` → returns `FileRef { id, fileName, mime, sizeBytes, scanStatus }`. The form stores `fileId`s only.

```ts
// features/files/hooks/useUpload.ts
export function useUpload() {
  const [presign] = usePresignUploadMutation();
  const [complete] = useCompleteUploadMutation();
  return useCallback(async (file: File, onProgress: (pct: number) => void, opts?: UploadOpts): Promise<FileRef> => {
    const { fileId, url, headers } = await presign({ fileName: file.name, mime: file.type, sizeBytes: file.size, ...opts }).unwrap();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new UploadError(xhr.status)));
      xhr.onerror = () => reject(new UploadError(0));
      xhr.send(file);
    });
    return complete(fileId).unwrap();              // server verifies size/sha256, queues ClamAV
  }, [presign, complete]);
}
``` `FileDropzone` shows per-file progress, retry, remove, and a `scanStatus` chip (PENDING spinner / CLEAN / INFECTED red with removal). Submit is blocked while any file is uploading; `INFECTED` blocks submit. Max 20 MB per file (configurable via `settings.files.maxSizeMb` from `/auth/me`), accepted types per field (`image/*`, `application/pdf`, audio for voice).

### 10.3 Money
Transport: strings with two decimals (`"48500000.00"`), currency BDT only. `moneySchema = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/)`. `MoneyInput` accepts user typing with lakh/crore separators and `৳` prefix, stores normalized string; `Money` displays `formatMoney(value, lang)` using `Intl.NumberFormat('en-IN' | 'bn-BD', { minimumFractionDigits: 2 })` and optional compact `৳48.5 L` / `৳2.4 Cr` for KPIs (`compact: 'lakh'`). Never `parseFloat` for arithmetic; client-side sums use `big.js` only in `ClaimLinesEditor` preview (server is authoritative).

### 10.4 Dates
Transport: ISO 8601 UTC. Display: `formatInTimeZone(date, 'Asia/Dhaka', pattern, { locale })` with patterns `dd MMM yyyy`, `dd MMM yyyy, hh:mm a`, relative via `formatDistanceToNowStrict`. `DatePicker` returns `yyyy-MM-dd` for `@db.Date` fields (no timezone conversion); `DateTimePicker` returns UTC ISO from a Dhaka wall-clock input (`fromZonedTime`). `<time dateTime>` always carries the ISO value. Bengali numerals are **not** used for dates/money by default (`settings.ui.bnDigits=false`); if enabled, `Intl` with `bn-BD-u-nu-beng`.

### 10.5 Bilingual content inputs
`BilingualInput` renders EN (required unless `required: 'either'`) and BN fields side by side (`xl:`), stacked below; "Copy EN → BN" helper. Server fields follow `title`/`titleBn`. Lists display `BilingualText` with EN fallback and a subtle "EN" marker when BN missing in BN mode.

---

## 11. Internationalisation

- i18next with `react-i18next`, `i18next-http-backend` loading `/locales/{lng}/{ns}.json` (built into `dist/locales`, hashed), `fallbackLng: 'en'`, `supportedLngs: ['en','bn']`, `load: 'currentOnly'`.
- Namespaces: `common` (buttons, states, nav, shell), `errors`, `validation`, `enums` (every schema enum label: `enums:ParcelStatus.AT_GATE`), and one per feature: `notices`, `dashboard`, `noteSheets`, `parcels`, `assets`, `compliance`, `incidents`, `visitors`, `fleet`, `attendance`, `claims`, `bus`, `chat`, `workforce`, `approvals`, `admin`, `auth`, `profile`, `notifications`. A lazy route declares `handle.i18nNamespaces` and the loader awaits `i18n.loadNamespaces(ns)`.
- Key naming: `camelCase` dotted paths — `parcels:list.title`, `parcels:actions.verifyOtp`, `parcels:status.AT_GATE` (enum labels may also live in `enums`). Interpolation `{{count}}` with ICU-style plurals via `i18next-icu` (`_one`/`_other`; Bengali uses `other` only). No string concatenation in components.
- Language: `ui.lang` persisted; initial from `me.preferredLang` → persisted → `navigator.language`; toggle updates i18next, `<html lang>`, `Accept-Language` header, and `PATCH /users/me`.
- Fonts: self-hosted `Noto Sans Bengali` (400/500/600/700, `font-display: swap`, subset `bengali`) + Inter + Outfit under `public/fonts`; `Hind Siliguri` listed as fallback for continuity with the prototype. `<link rel="preload">` for the two body fonts.
- Numbers/dates: `Intl.NumberFormat('en-IN')` grouping (lakh/crore) in both languages; Bengali locale `bn-BD` for month names when `lang === 'bn'`.
- Lint: `i18next/no-literal-string` (eslint-plugin-i18next) on JSX text; CI script `i18n:check` fails on keys missing in `bn` (warn) or unused keys (error).

```json
// locales/bn/parcels.json (excerpt — strings carried over from the prototype)
{
  "list": { "title": "অফিস চিঠিপত্র ও পার্সেল ট্র্যাকার", "subtitle": "প্রেরক থেকে প্রাপকের হাতে পৌঁছানো পর্যন্ত ট্র্যাকিং",
            "empty": "কোনো পার্সেল পাওয়া যায়নি", "scopeMine": "আমার পার্সেল", "scopeAll": "সকল পার্সেল" },
  "actions": { "create": "নতুন পার্সেল নিবন্ধন", "scan": "স্ক্যান ও হস্তান্তর", "verifyOtp": "ওটিপি যাচাই করুন",
               "flagTamper": "সিল ভাঙা রিপোর্ট", "initiateReturn": "ফেরত পাঠান" },
  "otp": { "title": "প্রাপকের ওটিপি", "help": "প্রাপকের ফোনে পাঠানো ৬-সংখ্যার কোড", "attemptsLeft_other": "{{count}}টি চেষ্টা বাকি" },
  "toast": { "created": "পার্সেল {{ref}} নিবন্ধিত হয়েছে", "delivered": "পার্সেল {{ref}} সফলভাবে হস্তান্তর হয়েছে" }
}
```

```ts
// shared/i18n/i18n.ts
i18n.use(HttpBackend).use(ICU).use(initReactI18next).init({
  fallbackLng: 'en', supportedLngs: ['en', 'bn'], load: 'currentOnly', ns: ['common', 'errors', 'validation', 'enums'], defaultNS: 'common',
  backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' }, interpolation: { escapeValue: false }, react: { useSuspense: true },
});
i18n.on('languageChanged', (lng) => { document.documentElement.lang = lng; });
```

---

## 12. Performance Budget

| Metric | Target | Enforcement |
| :--- | :--- | :--- |
| Initial JS (login → dashboard shell) | < 250 kB gz | `rollup-plugin-visualizer` report in CI; `size-limit` check on `dist/assets/index-*.js` + vendor chunks loaded on `/dashboard` |
| Per-route chunk | < 120 kB gz (fleet/assets allowed 180 kB) | `size-limit` entries per lazy chunk |
| LCP | < 2.5 s on staging (Fast 3G CPU 4× throttle) | Lighthouse CI assertions |
| INP | < 200 ms | Lighthouse CI + Web Vitals → Sentry performance |
| CLS | < 0.1 | Skeletons sized like content; fonts `swap` with `size-adjust` |
| TTI dashboard (warm) | < 1.5 s | Playwright trace in nightly |

Rules:
- Code split per route (§4) and per heavy widget: `MapPreview` (maplibre ~200 kB) and `recharts` loaded via `React.lazy` inside the component, `QrScanner`, `SignaturePad`, `AuditLog` JSON diff viewer.
- Manual chunks: `react-vendor` (react, react-dom, react-router), `redux-vendor`, `ui-vendor` (radix), `i18n`. Avoid a single `vendor` chunk.
- Prefetch: `onMouseEnter`/`onFocus` on sidebar links calls the route's `lazy` import (`prefetchRoute(path)`) and `dispatch(api.util.prefetch('getX', args, { ifOlderThan: 30 }))` for list endpoints.
- Virtualise lists > 100 rows (`DataTable virtualize`, chat, audit logs, attendance roster, seat waitlist).
- Images: `loading="lazy"`, `decoding="async"`, fixed aspect boxes; employee photos via presigned URL with `?w=` variants if the file service supports resizing (otherwise 96 px avatar cache).
- `React.memo` only for list rows and chart wrappers that receive stable props; `useMemo`/`useCallback` only when a measured re-render cost exists or when passing to memoised children/virtualisers; prefer `selectFromResult` to narrow RTK Query subscriptions.
- No polling faster than 15 s; sockets drive freshness. Avoid `refetchOnMountOrArgChange: true` on heavy lists.
- `web-vitals` reports to Sentry (`VITE_SENTRY_DSN`) with route name tags. Lighthouse CI (`lighthouserc.json`) runs on `/login`, `/dashboard`, `/approvals`, `/assets` against the preview build in CI; budgets as above fail the job.

---

## 13. Accessibility

- Target WCAG 2.1 AA. `eslint-plugin-jsx-a11y` strict; `@axe-core/playwright` runs on every e2e page visit (no `serious`/`critical` violations).
- Keyboard: every action reachable by Tab/Enter/Space; `Kanban`, `SeatMap`, `RiskMatrix` provide roving tabindex and a menu alternative for drag; command palette fully keyboard driven; skip link "Skip to content" first in DOM.
- Focus management: Radix Dialog/Sheet trap and restore focus; after route change focus moves to `PageHeader` `<h1 tabIndex=-1>`; after optimistic row removal focus moves to the next row; toasts are `aria-live="polite"` (CRITICAL `assertive`).
- Status pills: colour never the only cue — text label always present; `role="status"` only for live-updating pills; icons `aria-hidden`.
- Forms: `<Label htmlFor>`, `aria-describedby` for help and errors, `aria-invalid`, error summary at top for > 5 fields.
- Contrast (checked against §7.1 tokens): crimson `#A51C30` on white 7.3:1 ✔; gold `#D4AF37` on white 2.1:1 ✘ → gold is decorative or paired with `gold-dark #AA820A` (4.1:1, AA for large text only) → use `text-gold-dark` on `gold-muted` backgrounds and never gold text under 18 px on white; `slate-400 #64748B` on white 4.6:1 ✔ (minimum body-secondary); `slate-300 #94A3B8` on white 2.9:1 → placeholders/decoration only; white on crimson 7.3:1 ✔; white on `success #059669` 3.6:1 → button text ≥ 14 px bold only; status pill pairs (`success` on `success-bg` 4.9:1, `warning #D97706` on `#FFFBEB` 3.9:1 → darken to `#B45309` for pill text, `danger` on `danger-bg` 5.4:1, `info` on `info-bg` 4.7:1) — `StatusPill` uses the darkened text tokens.
- `prefers-reduced-motion`: disable pulse/AnimatedCounter/sidebar transitions.
- Language: `<html lang>` switches; mixed-language spans get `lang` attributes via `BilingualText`.

---

## 14. Client-Side Security

- Tokens: access + refresh are `httpOnly; Secure; SameSite=Strict` cookies set by the API (ADR-06). The SPA never reads or stores tokens; `redux-persist` whitelist excludes anything auth-sensitive. On 401 the reauth wrapper calls `/auth/refresh` (cookie) once.
- CSRF: SameSite=Strict + mandatory custom header `X-Requested-With: OneOps-Web` on all mutating requests (server rejects state-changing requests without it); the API's CORS allows only the web origin with credentials.
- CSP (served by nginx): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (Tailwind runtime-free, inline needed for Radix/recharts style attrs — tracked to remove with nonces); `img-src 'self' data: blob: https://<minio-host>`; `connect-src 'self' https://<api> wss://<api> https://<minio-host> https://<sentry>`; `font-src 'self'`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`. Plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)`.
- Sanitisation: any HTML from the server (notice bodies, note paragraphs, directive bodies) passes `DOMPurify.sanitize(html, { ALLOWED_TAGS: [...], ALLOWED_ATTR: ['href','title'], ADD_ATTR: ['target'] })` with `target=_blank` + `rel=noopener` enforced; `dangerouslySetInnerHTML` only in `shared/ui/RichText.tsx` (eslint rule bans it elsewhere).
- Permission checks are UX only; every action's authority is the server's 403. 403 responses on actions show "You no longer have permission" and refetch `getMe`.
- No secrets in the bundle: `VITE_*` are public config only; `env.ts` zod-validates presence and shape at boot.
- Idle lock after `autoLockMinutes` (default 15) → `LockScreen` (re-enter password → `/auth/unlock`); sign-out on 30 min idle if `settings.security.idleLogout`.
- Clipboard/print: confidential note-sheets (`confidentiality !== 'INTERNAL'`) disable print CSS and show a watermark with user id.
- Dependencies: `npm audit` + Renovate; `lockfile-lint`; Subresource integrity not needed (same-origin assets).

---

## 15. Error Handling & Observability

- `RouteErrorBoundary` per layout and per lazy route (`errorElement`): renders `ErrorState` with message, `requestId` when the error is an `ApiError`, Retry (revalidates route + `refetch`), "Go to dashboard"; reports to Sentry with route and user id.
- `@sentry/react`: `Sentry.init({ dsn: env.VITE_SENTRY_DSN, release: VITE_APP_VERSION, environment, tracesSampleRate: 0.2, replaysOnErrorSampleRate: 1.0, integrations: [reactRouterV7BrowserTracingIntegration, replayIntegration({ maskAllText: true })] })`; PII scrubbed (`beforeSend` strips emails/phones), `Sentry.setUser({ id })` only.
- `rtkQueryErrorToast` middleware: on `isRejectedWithValue` for mutations → toast error with i18n by `error.code` unless the mutation set `meta.silent`; for queries → no toast (components render `ErrorState`); 401 handled by reauth; 403 → toast + `getMe` refetch; 429 → toast with retry-after; network error → offline banner.
- Toast conventions (sonner): success ≤ 4.5 s with ref number (`"Note-sheet BOGCL/PROC/2026/0894 submitted"`), info 4.5 s, warning 6 s, error sticky until dismissed with "Copy request id"; `toast.promise` for mutations longer than 300 ms (loading → success/error); CRITICAL notifications use a persistent toast with Acknowledge.
- Offline banner: `useOnlineStatus()` + socket status; shows "You're offline — showing cached data" and disables mutation buttons via `useMutationGuard()`; queued offline actions are a mobile concern (ADR-18), web just blocks.
- Logging: `console` stripped in production except `console.error`; `env.VITE_LOG_LEVEL` enables RTK Query devtools logging in dev.

---

## 16. Testing Strategy

| Level | Tooling | Scope | Target |
| :--- | :--- | :--- | :--- |
| Unit | Vitest | `shared/lib` (money, dates, refno, sanitize), selectors, zod schemas, slices, `applyServerErrors`, navigation filter | 90 % lines on `shared/lib`, 80 % overall statements |
| Component | Vitest + RTL + user-event + MSW | Every page renders loading/empty/error/success; every dialog validates and submits; permission gating hides/disables; StatusPill maps every enum value (snapshot of label keys) | Each feature ≥ 70 % statements; pages 100 % of the four states |
| Contract | MSW handlers generated from OpenAPI | `scripts/gen-msw.ts` reads `server/openapi.json` → `src/test/msw/handlers/*.ts` with example responses; hand-written overrides per test for state transitions | Types + handlers regenerated in CI; drift fails the build |
| e2e | Playwright (Chromium + WebKit), against docker-compose stack with seed | Critical paths below | All green on PR; nightly full |
| a11y | `@axe-core/playwright`, `jsx-a11y` | Every e2e page | No serious/critical |
| Visual | Playwright screenshots of shell + 1 page per module (light) | Catch theme regressions vs prototype look | Diff threshold 0.2 % |

Critical e2e paths: (1) login (password; MFA path with seeded TOTP secret) → dashboard by role; (2) HOD approves a seeded note-sheet via inbox with signature → status changes, certificate shows hash; (3) create parcel → scan through stages (mailroom user) → recipient enters OTP read from test mail hook → DELIVERED; (4) attendance punch (web-punch-enabled test site with mocked geolocation inside/outside fence) → ACCEPTED / REJECTED_OUTSIDE_FENCE; (5) bus: employee joins waitlist → supervisor releases a seat → offer appears via socket → employee accepts within window; (6) claim submit with policy flag → manager approve → finance settle; (7) incident quick hazard report → appears in HSE list with risk category; (8) visitor pre-register → gate check-in → muster mark safe; (9) language toggle persists and switches fonts; (10) 403 for a route without permission, deep link from notification.

Conventions: `render.tsx` wraps with store (fresh `baseApi` per test via `setupApiStore`), router (`createMemoryRouter`), i18n (EN, `cimode` for key-assertion tests); MSW `server.listen({ onUnhandledRequest: 'error' })`; factories in `test/factories` built from generated types; no snapshot tests of full pages.

```tsx
// features/parcels/pages/ParcelDetailPage.test.tsx
it('verifies OTP and shows delivered state', async () => {
  const parcel = parcelFactory({ status: 'AT_GATE', recipientUserId: ME.id });
  server.use(
    http.get('*/api/v1/parcels/:id', () => HttpResponse.json({ data: parcel })),
    http.post('*/api/v1/parcels/:id/verify-otp', async ({ request }) => {
      const { otp } = await request.json() as { otp: string };
      return otp === '482913'
        ? HttpResponse.json({ data: { ...parcel, status: 'DELIVERED' } })
        : HttpResponse.json({ error: { code: 'VALIDATION_ERROR', details: [{ path: 'otp', message: 'Invalid OTP' }] } }, { status: 422 });
    }),
  );
  renderRoute(`/parcels/${parcel.id}`, { me: meFactory({ permissions: ['parcels:read', 'parcels:deliver'] }) });
  await userEvent.click(await screen.findByRole('button', { name: 'parcels:actions.verifyOtp' }));
  await userEvent.type(screen.getByLabelText('parcels:otp.title'), '000000');
  await userEvent.click(screen.getByRole('button', { name: 'common:actions.confirm' }));
  expect(await screen.findByText('Invalid OTP')).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText('parcels:otp.title'));
  await userEvent.type(screen.getByLabelText('parcels:otp.title'), '482913');
  await userEvent.click(screen.getByRole('button', { name: 'common:actions.confirm' }));
  expect(await screen.findByText('enums:ParcelStatus.DELIVERED')).toBeInTheDocument();
});
```

MSW handler generation (`scripts/gen-msw.ts`): walks `paths` in `server/openapi.json`, emits one `http.<method>()` handler per operation returning the first `example` of the 2xx response (or a factory-built object when absent), grouped per tag into `src/test/msw/handlers/<tag>.ts`; `handlers/index.ts` spreads them in order so test-local `server.use()` overrides win.

Commands: `npm run test` (vitest run), `npm run test:watch`, `npm run test:coverage`, `npm run e2e` (playwright), `npm run e2e:ui`, `npm run lint`, `npm run typecheck` (`tsc -b --noEmit`), `npm run gen:api` (openapi-typescript + msw), `npm run i18n:check`, `npm run lhci`.

---

## 17. Environment & Configuration

`.env.example` (committed; `.env*` ignored):

```
VITE_API_URL=http://localhost:4000            # API origin; client appends /api/v1
VITE_WS_URL=http://localhost:4000             # Socket.IO origin (same host in prod behind nginx)
VITE_SENTRY_DSN=                              # empty disables Sentry
VITE_MAP_TILES_URL=https://tiles.example.com/styles/basic/style.json   # MapLibre style JSON
VITE_APP_VERSION=dev                          # injected by CI from git tag/sha
VITE_ENV=local                                # local | dev | staging | production
VITE_FEATURE_DARK_MODE=false
VITE_FEATURE_WEB_PUNCH=false                  # show web punch button where site allows
VITE_LOG_LEVEL=warn
```

`shared/config/env.ts` validates with zod at import time (`z.string().url()` for URLs; fail fast with a readable error page in dev).

Commands: `npm run dev` (Vite 5173, proxy `/api` and `/socket.io` to `VITE_API_URL` to keep cookies first-party in local), `npm run build` (`tsc -b && vite build`), `npm run preview`, `npm run analyze` (visualizer), `npm run storybook` (optional, shared/ui only).

Dockerfile (multi-stage): `node:22-alpine` build stage runs `npm ci && npm run gen:api && npm run build` with `VITE_*` passed as build args (public values only); `nginx:1.27-alpine` runtime copies `dist/` and `nginx.conf`: gzip + brotli static, `try_files $uri /index.html` for SPA routes, long-cache hashed assets (`Cache-Control: public, max-age=31536000, immutable`), `index.html` `no-store`, security headers + CSP from §14, `/healthz` returning 200. In production nginx (infra) fronts both `web` and `api` on one origin (`https://oneops.bashundhara.com`, `/api/*` and `/socket.io/*` proxied), which is what makes `SameSite=Strict` cookies work. Runtime config override: `/config.json` fetched at boot (optional) allows changing `VITE_API_URL`-equivalents without rebuild; `env.ts` merges `window.__ONEOPS_CONFIG__` over build-time values.

```nginx
# frontend/nginx.conf (container-local; TLS and /api proxy live in infra/nginx)
server {
  listen 8080;
  root /usr/share/nginx/html;
  include /etc/nginx/mime.types;
  gzip on; gzip_types text/css application/javascript application/json image/svg+xml; gzip_min_length 1024;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header Permissions-Policy "camera=(self), microphone=(self), geolocation=(self)" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${MINIO_ORIGIN}; connect-src 'self' ${API_ORIGIN} ${WS_ORIGIN} ${MINIO_ORIGIN} ${SENTRY_ORIGIN}; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'" always;
  location /healthz { return 200 'ok'; add_header Content-Type text/plain; }
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; try_files $uri =404; }
  location /locales/ { add_header Cache-Control "public, max-age=3600"; try_files $uri =404; }
  location = /index.html { add_header Cache-Control "no-store"; }
  location / { try_files $uri /index.html; }
}
```
`${…}` placeholders are substituted by `envsubst` in the container entrypoint from runtime env, so one image serves dev/staging/production.

---

## 18. Appendix

### A. Prototype → production mapping

| Prototype (`client/src`) | Production (`frontend/src`) | Notes |
| :--- | :--- | :--- |
| `App.tsx` view switch + `useState` role/lang/theme | `app/router/routes.tsx`, `ui` slice, `getMe` | URLs, guards |
| `types.ts` `AppRole`, `ROLE_META`, `t()` | `entities/user`, `shared/config/permissions.ts`, i18next | roles come from server |
| `LoginPage` persona grid | `features/auth/pages/LoginPage` | no persona picker; seeded users for QA |
| `TelemetryLoader` | `FullPageSpinner` + real login latency | removed fake steps |
| `Sidebar.tsx` `ROLE_NAV`, `useLiveNavBadges` | `widgets/sidebar`, `shared/config/navigation.ts`, `GET /dashboards/badges` | permission-filtered |
| `Topbar.tsx` | `widgets/topbar` | role switcher removed; SAP modal → `SystemStatusSheet` |
| `CommandPalette` | `widgets/command-palette` (cmdk) + `GET /search` | |
| `NotificationCenter` | `features/notifications` + `widgets/notification-center` | server inbox |
| `UserProfileModal` | `features/profile/pages/ProfilePage` | route, not modal |
| `LockScreenModal` (PIN 1234) | `widgets/lock-screen` + `/auth/unlock` | password re-entry |
| `SapGatewayModal` | `SystemStatusSheet` (`/healthz`) | SAP adapter status when available |
| `BroadcastModal` + banner | `features/notices/components/BroadcastDialog`, `widgets/announcement-banner` | |
| `MobileBottomNav` | `widgets/app-shell/MobileBottomNav` | |
| `DetailDrawer` | `features/approvals/components/ApprovalDetailSheet` | |
| `OfficialDocumentModal` | `shared/ui/Letterhead` + `PrintLayout` pages | real PDF link + QR |
| `RejectionExplanationModal` | `features/approvals/components/RejectDialog` (presets per objectType) | shared by modules |
| `AuthorizeDirectiveModal` | `features/approvals/components/ApprovalDialog` | |
| `ToastManager` | sonner `Toaster` | |
| `Pagination` | `DataTable` server pagination | |
| `AnimatedCounter`, `Sparkline`, `RefineryOutputChart` | `StatCard` (+ recharts) | |
| `views/DashboardView` + 7 dashboards + `dashboardData.tsx` | `features/dashboard/pages/DashboardPage` + role components; data from `/dashboards/*` | constants → API |
| `NoticeDetailModal`, `PublishNoticeModal` | `NoticeDetailPage`, `NoticeEditorPage` | routes |
| `SendVoiceBriefingModal`, `ExecutiveROIDossierModal` | `BriefingComposerPage`, `RoiDossierSheet` | MediaRecorder upload |
| `NotesheetView`, `InitiateNotesheetModal` | `features/note-sheets/*` | defect fix: intermediate sign advances |
| `ParcelView` | `features/parcels/*` | dead duplicate seed removed; OTP hidden |
| `AssetView`, `AssetModals`, `AssetLifecycleStepper` | `features/assets/*`, `shared/ui/Stepper` | financial engine server-side (`v_asset_financials`) |
| `ComplianceView` | `features/compliance/*`, `shared/ui/KanbanBoard` | |
| `IncidentView` | `features/incidents/*`, `shared/ui/RiskMatrix` | |
| `GuestView` | `features/visitors/*` | OVERDUE now set by server |
| `FleetView` + `components/fleet/*` (10) | `features/fleet/*` | scripted chat replies removed; pooling server-side |
| `AttendanceView` | `features/attendance/*` | real geolocation; leave form added |
| `ClaimsView`, `SubmitClaimModal` | `features/claims/*` | policy via `/claims/validate` |
| `BusView` + `components/bus/*` (7), `busData.ts` | `features/bus/*`, `shared/ui/SeatMap` | single data source (API) |
| `InnerCircleChat` | `features/chat/*` | Socket.IO |
| `WorkforceView`, `OnboardEmployeeModal`, `OffboardClearanceDrawer` | `features/workforce/*` | 7 clearance items per schema |
| `ApprovalsView` | `features/approvals/*` | real `StepDecision` in history |
| `store/*Store.ts` (9) | `features/*/api/*.api.ts` + UI slices | server data in RTK Query only |
| `styles/*.css` (12 k lines) | `app/styles/globals.css` `@theme` + Tailwind classes + shadcn | dark.css → prepared tokens |
| `index.html` Google Fonts | self-hosted fonts in `public/fonts` | Noto Sans Bengali |

### B. Checklist for porting a prototype view

1. Read the view and its modals in `client/src`; list every user action, state transition, filter, KPI, and toast message. Cross-check against the module section in doc 06 and the report §9/§15 (apply defect fixes; drop simulations).
2. Confirm endpoints in doc 03; add missing ones to the API backlog before building UI. Write `features/<module>/api/<module>.api.ts` with tags per §5.3; regenerate types (`npm run gen:api`).
3. Create routes in `app/router/routes.tsx` with lazy pages, `handle.crumb/titleKey/i18nNamespaces`, permission guard; add navigation entry in `shared/config/navigation.ts` with `permission` and role label overrides matching prototype labels.
4. Build pages with `PageHeader`, `FilterBar` (URL-synced), `DataTable`/cards, `SplitPane` where the prototype had list/cockpit; implement loading (skeleton), empty, error, success.
5. Port dialogs to `Dialog`/`Sheet`/`AlertDialog`; define zod schemas in `schemas/`; wire RHF; map server errors; use `toast.promise`.
6. Replace every `t('en','bn')` with i18n keys in `locales/en/<ns>.json` and `locales/bn/<ns>.json` (copy the prototype's BN strings — they are reviewed copy); enum labels go to `enums.json`.
7. Replace role checks (`role === 'chairman'`, name matching) with `usePermission()` and `me.id` comparisons; hide/disable per permission + object state (`allowedActions` when provided).
8. Map CSS classes to Tailwind tokens (`.kpi-card` → `StatCard`, `.badge.*` → `StatusPill`, `.pill-tabs` → `PillTabs`, `.kanban` → `KanbanBoard`); no hex literals; verify contrast per §13.
9. Add realtime hook (`use<Module>Realtime`) if the module has ✔ in doc 00 §7 "Realtime"; otherwise set polling fallback only where the UI is operational (gate, dispatch).
10. Tests: component tests for the four page states and each dialog; MSW overrides for state transitions; add/extend e2e if the module is in the critical list; run `axe`.
11. Performance: confirm chunk size with `npm run analyze`; lazy-load map/chart/scanner; virtualise long lists.
12. Visual check against the prototype screen side by side (same seed data) and record deviations in the PR description; update Appendix A row if structure differs.

### C. Permission key registry used by the web app

All keys follow doc 00 §5.2 `<module>:<action>`. This list is the web's expectation of the seed in doc 02 §6; the generated `PermissionKey` union must contain every key below or `typecheck` fails.

| Module | Keys |
| :--- | :--- |
| dashboards | `dashboards:read` |
| briefings | `briefings:read`, `briefings:write` |
| notices | `notices:read`, `notices:write`, `notices:publish`, `notices:broadcast` |
| note-sheets | `note-sheets:read`, `note-sheets:create`, `note-sheets:sign`, `note-sheets:withdraw` |
| parcels | `parcels:read`, `parcels:create`, `parcels:scan`, `parcels:deliver`, `parcels:return` |
| assets | `assets:read`, `assets:create`, `assets:maintain`, `assets:custody`, `assets:transfer`, `assets:requisition`, `assets:financials`, `assets:write-off`, `assets:policy` |
| compliance | `compliance:read`, `compliance:write`, `compliance:renew`, `compliance:letters` |
| incidents | `incidents:report`, `incidents:read`, `incidents:investigate`, `incidents:capa`, `incidents:close`, `incidents:statutory` |
| visitors | `visitors:read`, `visitors:create`, `visitors:approve`, `visitors:gate`, `visitors:watchlist` |
| fleet | `fleet:request`, `fleet:read`, `fleet:endorse`, `fleet:dispatch`, `fleet:manage`, `fleet:gate`, `fleet:drive`, `fleet:fuel`, `fleet:tolls` |
| attendance | `attendance:read`, `attendance:punch-web`, `attendance:regularise`, `attendance:approve`, `attendance:roster` |
| leave | `leave:read`, `leave:request`, `leave:approve` |
| claims | `claims:read`, `claims:create`, `claims:approve`, `claims:settle`, `claims:policy` |
| bus | `bus:read`, `bus:apply`, `bus:manage`, `bus:broadcast` |
| chat | `chat:read`, `chat:write`, `chat:directive`, `chat:manage` |
| employees | `employees:read`, `employees:create`, `employees:update`, `employees:offboard`, `employees:clear-item` |
| workflow | `workflow:approve`, `workflow:delegate`, `workflow:reassign`, `workflow:read-all` |
| admin | `admin:read`, `admin:users`, `admin:roles`, `admin:master-data`, `admin:workflows`, `admin:policies`, `admin:settings`, `admin:audit` |

Scope (`SELF/TEAM/DEPARTMENT/SITE/COMPANY`) is attached to each grant server-side; the web reads `me.permissions` as `{ key, scope }[]` and uses `scope` only to decide whether to render "mine / all" switches and team-level tabs.

### D. Notification `type` → deep-link route

| Notification type | `data.route` | Module |
| :--- | :--- | :--- |
| `APPROVAL_PENDING`, `APPROVAL_REMINDER`, `APPROVAL_ESCALATED` | `/approvals/{instanceId}` | MOD-17 |
| `APPROVAL_DECIDED` (to initiator) | owner record route, e.g. `/note-sheets/{id}`, `/claims/{id}`, `/fleet/requisitions/{id}`, `/leave/{id}` | MOD-03/11/09/10 |
| `NOTE_SHEET_SIGN_REQUESTED`, `NOTE_SHEET_RETURNED`, `NOTE_SHEET_APPROVED` | `/note-sheets/{id}` | MOD-03 |
| `NOTICE_PUBLISHED`, `NOTICE_ACK_REQUIRED` | `/notices/{id}` | MOD-01 |
| `BRIEFING_PUBLISHED` | `/briefings?open={id}` | MOD-02 |
| `PARCEL_DISPATCHED`, `PARCEL_AT_GATE`, `PARCEL_OTP`, `PARCEL_DELIVERED`, `PARCEL_EXCEPTION`, `PARCEL_DWELL` | `/parcels/{id}` | MOD-04 |
| `CUSTODY_ASSIGNED`, `WORK_ORDER_DUE`, `CALIBRATION_DUE`, `WARRANTY_EXPIRING` | `/assets/{id}`, `/assets/work-orders/{id}` | MOD-05 |
| `LICENCE_DUE`, `RENEWAL_STAGE_CHANGED` | `/compliance/licences/{id}` | MOD-06 |
| `INCIDENT_REPORTED`, `INCIDENT_CRITICAL`, `CAPA_ASSIGNED`, `CAPA_DUE`, `STATUTORY_DUE` | `/incidents/{id}` | MOD-07 |
| `VISIT_APPROVAL`, `VISIT_ARRIVED`, `VISIT_OVERDUE`, `MUSTER_STARTED` | `/visitors/{id}`, `/visitors/muster` | MOD-08 |
| `REQUISITION_ASSIGNED`, `TRIP_GATE_OUT`, `TRIP_COMPLETED`, `TRIP_SOS`, `TOLL_CLAIM`, `VEHICLE_DOC_EXPIRING` | `/fleet/requisitions/{id}`, `/fleet/my-trips`, `/fleet/desk?channel=SOS`, `/fleet/vehicles/{id}` | MOD-09 |
| `LEAVE_DECIDED`, `PUNCH_REJECTED`, `REGULARISATION_DECIDED` | `/leave/{id}`, `/attendance`, `/attendance/regularisations` | MOD-10 |
| `CLAIM_RETURNED`, `CLAIM_APPROVED`, `CLAIM_SETTLED` | `/claims/{id}` | MOD-11/12/13 |
| `SEAT_OFFER`, `SEAT_OFFER_EXPIRING`, `BUS_DELAY` | `/bus/my-seat`, `/bus/routes/{routeId}` | MOD-14 |
| `CHAT_MESSAGE`, `CHAT_MENTION`, `DIRECTIVE_ISSUED` | `/chat/{channelId}?m={messageId}` | MOD-15 |
| `CLEARANCE_ITEM_PENDING`, `CLEARANCE_COMPLETED` | `/workforce/{employeeId}/exit-clearance` | MOD-16 |
| `SESSION_NEW_DEVICE`, `PASSWORD_CHANGED` | `/profile?tab=sessions` | profile |

### E. Inconsistencies found while writing this document

| # | Where | Observation | Resolution in this doc |
| :-- | :--- | :--- | :--- |
| 1 | Doc 00 §9 index lists `03_API_SPECIFICATION.md`, `06_…` | Docs 03 and 06 do not exist yet in `docs/platform/`; only 00 and 02 are present | Endpoint names here follow doc 00 §5.1 conventions and schema entity names; doc 03 must adopt or supersede them (§ preamble) |
| 2 | Prototype fonts vs brief | Prototype loads **Hind Siliguri** for Bengali (`index.html`, `--font-bengali`); the production brief specifies **Noto Sans Bengali** | Noto Sans Bengali is primary, Hind Siliguri fallback (§7.1, §11) |
| 3 | Doc 00 §7 vs doc 02 | MOD-10 lists two server modules (`attendance`, `leave`) but one web dir `attendance`; schema has `LeaveRequest` etc. | One feature folder `attendance` with `/leave/*` routes; permissions split `attendance:*` / `leave:*` |
| 4 | Doc 02 `NoteSheetStatus` vs doc 00 §5.6 `WorkflowStatus` | Note-sheets have their own enum (`IN_REVIEW`, no `SUBMITTED`) while the engine uses `SUBMITTED → IN_REVIEW` | UI shows `NoteSheet.status` on the record and `WorkflowInstance.status` only in the approvals detail; doc 03/06 should confirm the mapping on submit |
| 5 | Doc 02 `ExitClearanceItem` has 7 keys; prototype has 4 clearance items | Production checklist is 7 items (`IT_ACCESS … HR_EXIT_INTERVIEW`) | Followed the schema |
| 6 | Doc 02 `Parcel.otpHash` bcrypt of a **6-digit** OTP; prototype used 4-digit with a master code `1234` and revealed the PIN in a toast | Security regression if reproduced | 6-digit input, never shown, no master code (§9 MOD-04) |
| 7 | Prototype `VisitStatus.overdue` never set; `Claim.settled` unreachable; intermediate note-sheet sign approved the whole file; approvals history always "Approved"; delegation never applied | Report §15 defects | All treated as bugs and specified correctly (MOD-03/08/11/17) |
| 8 | Doc 00 ADR-14 names tokens `--brand-crimson`, `--brand-slate-900`, `--brand-gold`, `--brand-canvas` | Tailwind v4 `@theme` requires `--color-*` namespace for utilities | Mapped to `--color-crimson`, `--color-navy-900`, `--color-gold`, `--color-canvas` (§7.1); values unchanged |
| 9 | Prototype `Sidebar` derives allowed views from a static per-role tree; doc 00 ADR-07 says permissions are data | Navigation here is permission-driven with role label overrides (§8.1); seed must grant permissions so the seven personas see the same items as report §7.2 | Flagged for doc 02 §6 seed authors |
| 10 | Doc 02 `Platform` enum has `WEB`; `AttendancePunch.platform` nullable | Web punch is optional per site (`attendance:punch-web`, `VITE_FEATURE_WEB_PUNCH`) | Doc 06/07 should state whether web punch is allowed at all |
| 11 | Prototype dark mode exists and is toggleable; brief says dark mode not required | Tokens prepared, toggle feature-flagged off (§7.1) | — |
| 12 | Prototype title says "OneOps v2.5" and "17 modules"; doc 00 registry has IDs to MOD-18 (MOD-11/12/13 merged) | Cosmetic | Version string from `VITE_APP_VERSION` |

---

*End of document 04.*
