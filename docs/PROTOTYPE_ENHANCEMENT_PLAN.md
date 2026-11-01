# Prototype Enhancement Plan — "Make it feel like production"

**Scope:** `client/` (the interactive prototype) only. Goal: a presentation-ready prototype that behaves like a real, role-separated, production operations system — without becoming the production codebase (that remains `server/`, `frontend/`, `app/` per `docs/platform/`).
**Status:** Proposed 1 Nov 2026 — awaiting sequencing decisions (§6).

---

## 1. Diagnosis — why it doesn't feel real (code-verified)

| # | Symptom | Root cause (measured) | Effect in a demo |
| :-- | :--- | :--- | :--- |
| D1 | Dark mode is broken on most screens (unreadable panels, white buttons, light cards on dark canvas) | **4,744** inline `style={{}}` blocks and **3,234** hard-coded hex colours in `.tsx`; `dark.css` (787 lines) can only override class-based styles | Any theme toggle during a demo exposes defects |
| D2 | Every role sees almost everything; actions aren't role-appropriate | Access control is sidebar-only (`ROLE_NAV`); **105** scattered `role === '…'` / name-string checks; 7 views (Notesheet, Compliance, Claims, Approvals, Workforce, Inner Circle, Bus) have **no** gating; identity matched by `'Tanvir'`, `DRV-01`, `EMP-1042` | A driver can approve a CAPEX file; an employee can offboard staff — breaks credibility instantly |
| D3 | Numbers disagree across screens | `BusView`, `InnerCircleChat`, `AttendanceView` ignore their stores; dead duplicate seed arrays in Compliance/Parcel/Guest; parcel logic duplicated with different percentages | Badge says 5, screen shows 3 |
| D4 | Actions don't "stick" or propagate correctly | No persistence (refresh = reset); approvals history labels rejections "Approved"; intermediate note-sheet sign approves the whole file; `settled`/`overdue` unreachable; fuel voucher confirm is a no-op | Reviewer refreshes → everything vanishes |
| D5 | Too much, and the wrong, information | Dashboards stacked with KPI banners, ROI dossiers, "SCADA LIVE", "AI Smart Pooling", "SHA-256 seal", "System Synced"/SAP panels for every role; marketing copy in operational screens | Reads as a pitch deck, not a tool people use daily |
| D6 | Visible demo scaffolding | "Choose a role to preview the system", "Switch Role (Preview)" in the profile menu, OTP revealed in error toast, master code `1234`, lock PIN `1234`, fake 1.15 s "telemetry" sign-in, canned chat replies | Audience is reminded it's a mock |
| D7 | Inconsistent visual language | Each 2–3k-line view hand-rolls its own buttons, pills, tables, modals via inline styles; spacing/typography drift between modules | Feels stitched together |
| D8 | Dates/data inconsistencies | Hard-coded dates conflict with `SYSTEM_TODAY`; mixed ref-number formats; English-only strings in places | Sharp reviewers notice |
| D9 | No URL / back button; 2 MB single bundle | `useState<AppView>` navigation, no code-splitting | Refresh loses place; slow first load |

## 2. Definition of "feels like production"

1. **One identity model.** A signed-in *user* object (not a role string) with permissions and data scope; every action and every list is filtered through it. Labels, nav, dashboards, and buttons derive from permissions — no name matching.
2. **One design system.** Semantic tokens (`--surface-1/2/3`, `--text-1/2/3`, `--border`, `--accent`, status colours) and a small set of shared primitives (Button, Card, Badge/StatusPill, DataTable, Modal, Drawer, Tabs, EmptyState, Skeleton, FormField, Toast). Both themes derive from tokens — no hex in TSX.
3. **One source of truth per domain** (the stores), persisted, with consistent reference numbers and dates relative to a single clock.
4. **Operational, not promotional.** Each persona lands on "my work today"; dashboards show what that person acts on; pitch material (ROI dossier, programme KPIs) lives in a Chairman-only Executive view.
5. **Real where cheap, honest where not.** Real SHA-256 (Web Crypto), real OTP flow (generated, never revealed), real geofence math with browser geolocation, real localStorage persistence, working routing. Things that cannot be real (SAP, SMS) are shown as *queued/integration* states, not "Up to Date" badges.
6. **Invisible demo controls.** Persona switching, data reset, and scenario presets exist only behind a hidden shortcut (`Ctrl+Shift+D`), never in the product UI.

## 3. Workstreams

### WS-A Design system & theming (unblocks dark mode)
- `styles/tokens.css`: semantic tokens for light and dark (`[data-theme]`), derived from the brand palette (`#A51C30`, `#0B132B`, `#D4AF37`, `#F8FAFC`).
- Primitives in `components/ui/` (Button, IconButton, Card, StatCard, Badge, StatusPill, Tabs, DataTable, Modal, Drawer, EmptyState, Skeleton, FormField/Input/Select, Toast, PageHeader, FilterBar).
- Codemod: map the 3,234 hex literals to tokens (scripted for the ~40 recurring values; manual for the tail); convert recurring inline-style patterns to classes/primitives.
- Theme persisted; respects `prefers-color-scheme` on first visit.
- Screen-by-screen checklist in both themes (15 views × 7 roles where they differ).

### WS-B Identity, permissions & scope
- `auth/permissions.ts`: role → `module:action` permissions with scope (`self | team | department | site | company`), aligned with `docs/platform/06` so the prototype previews the real model.
- `auth/session.ts`: `currentUser` (id, name, role(s), department, site, grade, reports) replacing name-string checks; `useCan(permission)`, `useScope()`.
- Store selectors accept the user and apply scope (`myClaims`, `departmentClaims`, `allClaims`).
- Every view: tabs, columns, buttons, bulk actions gated by `useCan`; approvers only see what they can decide; employees see only their own records.
- Login: real-looking credential flow (email/Emp-ID + password `bogcl2026` validated; wrong password → generic error); persona chips moved to the hidden demo menu; remove "preview" wording and the fake telemetry loader (replace with a short, plain progress state).
- Topbar: remove Switch Role; profile menu shows real profile/security/handover/devices only.

### WS-C Data coherence & persistence
- Wire `BusView`, `InnerCircleChat`, `AttendanceView` to their stores; delete dead seed arrays and duplicate logic.
- `lib/clock.ts`: one `today()`; all seed dates expressed relative to it (no hard-coded "22 Oct 2026").
- Reference numbers via one `nextRef(prefix)` matching the production formats (`BOGCL/PROC/2026/0894`, `PKG-2026-9041`, …).
- Persistence layer: every store serialises to `localStorage` under a versioned key; "Reset demo data" in the hidden demo menu; seed version bump invalidates old data.
- Fix behavioural defects: signatory route advancement, approvals history attribution/outcome, reachable `settled`/`overdue`, fuel voucher issue, parcel single-source stage logic.
- Realistic seed: names, BDT amounts, departments, plausible volumes (e.g. 788 staff → attendance numbers that add up), bilingual fields complete.

### WS-D Role-based information architecture (the "clear separation" ask)
For each persona define *daily jobs*, then prune everything else:

| Persona | Lands on | Primary modules | Removed/hidden from their UI |
| :-- | :--- | :--- | :--- |
| Chairman | Executive Overview (approvals needing signature, leadership roster, critical alerts, briefing) | Approvals, Note-sheets (sign), Inner Circle, Notices (announce), Compliance (risk), Incidents (critical), Directory | Operational tabs (fleet dispatch, bus seats, parcels), ROI dossier moved to its own Executive Insights page |
| Plant GM | Plant operations today (shift, production, LOTO, incidents, permits, assets due) | Incidents/CAPA, Assets, Compliance, Approvals (plant), Fleet (plant requests), Attendance (plant) | HR admin tools, bus admin, claims finance |
| HR Admin | People operations (attendance exceptions, leave, onboarding/exit, notices, bus) | Workforce, Attendance & Leave, Notices, Bus, Claims (HR policy), Visitors (HQ) | Plant KPIs, fleet dispatch, note-sheet initiation beyond HR |
| Transport Admin | Dispatch board (pending requisitions, live trips, driver status, vehicle docs, fuel/toll) | Fleet, Bus, Vehicle assets, Parcels (logistics), Visitors (vehicle gate) | Finance approvals, HR, compliance detail |
| HOD (Finance) | Approval inbox + budget view | Approvals, Claims (finance), Note-sheets (finance step), Compliance fees, Asset financials | Dispatch, bus, HR admin |
| Employee | My day (punch, leave balance, my claims, my requests, notices, bus seat) | Attendance, Claims, Vehicle request, Parcels (mine), Visitors (mine), Note-sheets (initiate), Bus (my seat) | All admin/approval views, company KPIs |
| Driver | Today's trip console (large touch targets) | Trip console, fuel/toll, my attendance, notices | Everything else |

- Dashboards rebuilt as task-oriented ("needs your action", "today", "watch") instead of KPI walls.
- Module views: role-specific tab sets and column sets defined in one config per module, not inline conditionals.
- Remove or re-label unverifiable claims: "SCADA LIVE" → "Shift report (manual)"; "AI Smart Pooling" → "Pooling suggestion"; SAP "Up to Date" → integration status *Not connected / Queued* in an admin-only panel; "SHA-256 seal" backed by a real hash.

### WS-E Interaction realism
- Real SHA-256 (`crypto.subtle`) for note-sheet paragraphs, parcel events, signatures; verification code + QR that actually encodes it.
- Parcel OTP: generated, shown only on the *recipient's* device view (simulated via persona), 5 attempts, no master code.
- Attendance: real `navigator.geolocation` + haversine against site geofences; graceful fallback with explicit "location unavailable" state (no fake face-match).
- Loading skeletons on view entry, optimistic state transitions with undo toasts where safe, confirmation dialogs for destructive/financial actions, inline validation on forms.
- Notification centre driven by store events (approve something → notification appears for the right persona).
- Routing: hash-based routes (`#/approvals/APR-2026-0894`) with back/forward and deep links from notifications; lazy-load views (fixes 2 MB bundle).

### WS-F Polish & quality
- Dark/light audit per screen; contrast ≥ 4.5:1 for text; focus rings; modal focus trap; `aria-label`s on icon buttons.
- Responsive pass for the mobile personas (employee, driver).
- Bengali completeness audit (`t()` pairs), number formatting (৳ with en-BD grouping), dates in Asia/Dhaka.
- Lint hygiene: enable `noUnusedLocals/Parameters`, remove unused deps (`zustand`, `tailwindcss`) or adopt them deliberately.

### WS-G Demo tooling (hidden)
- `Ctrl+Shift+D` demo panel: switch persona, reset data, load scenario (e.g. "CAPEX file awaiting Chairman", "Parcel at gate", "Incident reported 10 min ago"), toggle "presentation mode" (larger type, no clock).
- Demo script per persona aligned to the 6 acts in `docs/05_PROTOTYPE_BLUEPRINT_AND_DEMO_SCRIPT.md`.

## 4. Sequencing

| Phase | Content | Why first | Effort (focused agent-days) |
| :-- | :--- | :--- | :-- |
| **P1 Foundations** | WS-A tokens + primitives + codemod; WS-B identity/permissions/scope + login; WS-C persistence, clock, refs, store wiring; WS-E routing | Everything else depends on these; dark mode and role separation flip from "broken" to "works" globally | 5–7 |
| **P2 Module passes** | Per module (17): apply primitives, role config (WS-D), fix defects (WS-C), realism (WS-E), both-theme check (WS-F). Order: Approvals → Dashboards (7) → Note-sheets → Attendance/Leave → Claims → Fleet/Driver → Parcels → Visitors → Incidents → Compliance → Assets → Bus → Workforce → Chat → Notices | Highest-visibility screens first | 8–12 |
| **P3 Demo readiness** | WS-G, responsive/BN/a11y audit, performance, final walkthrough per persona, screenshots for the deck | Last mile | 2–3 |

Total ≈ 15–22 focused days. P1 alone already removes the two biggest credibility problems (dark mode, role bleed).

## 5. Guardrails

- Prototype stays self-contained: no backend calls, no production libraries beyond what's needed for routing/hash and Web Crypto; data remains in-browser.
- The production specification suite (`docs/platform/`) is the reference for permissions, states and reference formats so the prototype previews the real system rather than diverging from it.
- Changes are incremental and demoable at every step; `npm run build` must pass after each module pass.
- Quantitative targets at the end of P2: `0` hex literals in `.tsx`, `< 300` inline style blocks (layout-only), `0` name-string identity checks, dark-mode checklist 100 %.

## 6. Decisions (taken)

1. **Audience** — Chairman/board; P2 favours executive screens.
2. **Dark mode** — both themes kept, driven by `tokens.css`.
3. **Login** — password-validated login; persona switcher hidden behind `Ctrl+Shift+D`.
4. **Routing** — hash routing with lazy views, no new dependency.
5. **Feature trimming** — per WS-D column; revisit per module in P2.

## 7. P1 status and implemented conventions

P1 foundations are in place. The concrete contracts the P2 module passes build on:

| Area | Where | Contract |
| :-- | :-- | :-- |
| Tokens | `src/styles/tokens.css` | Semantic `--surface-*`, `--text-*`, `--border-*`, `--status-{success,warning,danger,info,purple}-{text,bright,bg,border,solid,solid-dark}`; light values equal the original palette, dark values tuned. `dark.css` inverts `--brand-slate-*`, so never use slate-900/800 as a *fill* — use `--surface-inverse*` / `--surface-selected`. |
| Theme | `src/lib/theme.ts`, `index.html` | `oneops.theme.v1` in localStorage; pre-paint script applies `data-theme`; `readToken()` for canvas drawing. |
| Identity | `src/auth/permissions.ts`, `src/auth/session.ts` | `Permission = 'module:action'`, `can(role, p)`, `useCan(p)`, `useScope()`, `inScope(scope, record)`, `canAccessView(role, view)`. Session persisted under `oneops.session.v1` (localStorage when "keep me signed in", else sessionStorage). Demo password is `bogcl2026` for every persona (SHA-256 digest only in code). 5 failed attempts lock the form. |
| Routing | `src/lib/router.ts` | Hash paths: `/`, `/approvals`, `/documents`, `/messages`, `/permits`, `/fleet`, `/fleet/request`, `/shuttle`, `/parcels`, `/attendance`, `/safety`, `/claims`, `/assets`, `/visitors`, `/people`. Inaccessible routes redirect to `/`; views are `React.lazy` behind `ViewSkeleton`. |
| Persistence | `src/lib/persist.ts` | `loadPersisted(name, v)` / `savePersisted(name, v, snapshot)` (debounced 150 ms) under `oneops.store.<name>.v<N>`. Persisted: approvals, notesheets, operations, fleet, bus, notices, employees, assets. Bump `N` when seed shape changes. `voiceBriefingStore` and the active broadcast banner are session-only. |
| Clock & refs | `src/lib/clock.ts`, `src/lib/refs.ts` | `today()`, `nowStamp()`, `daysFromToday(n)`, `daysUntil(date)`; `nextRef('APR')` → `APR-2026-0901`, `nextNoteSheetRef('FIN')` → `BOGCL/FIN/2026/0041` (counters in `oneops.refs.v1`). Stores still carry `Math.random()` IDs and `'Today, Just Now'` strings — replace with these helpers during each P2 module pass. |
| Primitives | `src/components/ui/` | `Button`, `Card`, `StatusPill`, `EmptyState`, `PageHeader`, `Modal`, `FormField`, `ViewSkeleton` (styles in `styles/ui.css`). Adopt in P2 as each module is touched; do not mass-replace. |
| Store wiring | `BusView`, `InnerCircleChat`, `AttendanceView` | Now read/write `busStore` / `operationsStore`; their private seed copies were deleted. Any remaining view-local seed data is a P2 defect. |
| Presenter panel | `src/components/demo/DemoPanel.tsx` | `Ctrl+Shift+D`: switch persona / sign-in-as, theme, language, sign out, **Reset demo data** (clears every `oneops.*` key except theme and language, then reloads to the login page). |

Known P1 leftovers for P2: identity strings differ between `busData.ts` seat generator, `SupervisorSeatModal.tsx` and the employee directory (e.g. Harunur Rashid `EMP-0104` vs `EMP-0012`); ~105 `role === '…'`/name-string checks remain inside views.

## 8. P2 module-pass conventions (in progress)

| Module | Where | Contract |
| :-- | :-- | :-- |
| Approvals | `src/views/approvals/config.ts` | `APPROVALS_CONFIG[role]` = categories, batch rights, `accepts(item, user)` scope predicate (Chairman ≥ ৳1,00,000; HOD procurement < ৳10,00,000 and own-dept leave; Plant GM plant departments; HR leave/HR). `useMyApprovalQueue()` is the single source for the view, sidebar badge and notification centre. Decisions pass `user.role`; refs come from `nextRef('APR'/'VCH')`, stamps from `nowStamp()`. |
| Dashboards | `src/views/dashboard/config.tsx`, `useDashboardData.ts` | `DASHBOARD_CONFIG[role]` returns hero stats, cockpit tabs, KPI cards and jump cards as functions of `DashboardLiveData` (one hook over approvals, note-sheets, compliance, incidents, fleet, roster, leave, claims, notices, work orders, shuttle seats, all scoped to `useCurrentUser()`). No static counts, sparklines or pitch KPIs (ROI, SCADA, "AI pooling", "SAP synced" are gone); the Chairman briefing is computed from the highest-value pending file, the nearest permit renewal and open incidents. Chairman/HOD approval tabs, the HR exit-clearance and site tabs, the employee activity feed/leave balance/gate pass and the driver identity all read the shared stores. Dead seeds `PENDING_APPROVALS`, `INITIAL_HOD_QUEUE`, `ROLE_STATS`, `DCS_ALARMS`, `INITIAL_VEHICLE_REQUESTS`, `MY_RECENT_ACTIVITY` were deleted; `INNER_CIRCLE` now matches persona names. `DEPT_BUDGET` (৳1.2 Cr ceiling, ৳38.4 L committed) + approvals decided by the signed-in HOD drive the budget gauge. Remaining `role ===` checks in `DashboardView` only choose which overview section/sub-dashboard mounts. |
| Note-sheets | `src/store/notesheetStore.ts`, `src/views/NotesheetView.tsx`, `src/components/notesheet/InitiateNotesheetModal.tsx`, `src/lib/hash.ts`, `src/lib/refs.ts` | The signatory route is the workflow: `pendingStepOf(file)` / `isTurnOf(file, role)` decide whose turn it is, and `signStep({ fileIdOrNo, actorRole, … , hash })` signs **only the signed-in officer's own step**, promotes the next step to `pending`, sets `pending_approval` / `pending_chairman`, and marks the file `approved` only after the final step (the old `approveFile`, which signed every pending step for whoever clicked, is gone). The view derives the signer from `useCurrentUser()` (name, title, EMP id); the sign pad shows only when `useCan('notesheet:sign')` and it is the user's turn, otherwise a status card ("Awaiting X", "File approved", "Returned to initiator"). Scope: `notesheet:view_all` roles see every file; others see files they initiated, sit on the route of, or belong to their department; nothing in scope → `EmptyState`. Creation is gated by `notesheet:create`; the certificate button is enabled only for approved files. Signature codes are `SIG-` + first 16 hex of SHA-256 over `fileNo|para|empId|remark|stamp` (`lib/hash.ts`, also used by the demo login digest); dates use `today()` / `nowStamp()`; file numbers come from `nextNoteSheetRef(deptCodeOf(dept))` and purchase refs from `nextRef('PR')`, previewed with `peek*` and allocated on submit. Approvals mirror: `addNotesheetApproval(fileId, fileNo, …)` stores `sourceId = file.id`; `approvalQueuePredicate` shows a note-sheet-backed item only to the officer whose signature is due, and approving it calls `signStep` so both modules always agree. |
| Attendance & leave | `src/views/attendance/config.ts`, `src/views/AttendanceView.tsx`, `operationsStore.punchAttendance/addLeaveRequest` | No biometrics theatre: punch-in asks the browser for a position (`requestPosition`, 8 s timeout), finds the nearest site (`SITES` — Head Office 300 m, Keraniganj 500 m, haversine `distanceMeters`) and records `inside_geofence` or `late` (shift start + 10 min grace per `SHIFT_START`). Outside the fence or with no fix the user can still check in; the row is stored as `locationStatus: 'manual_review'` with the real distance and surfaces in the supervisor KPI "Check-ins to review". `punchAttendance(role, action, site, { locationStatus, distanceMeters })` persists exactly what was measured (no hard-coded 28 m). Scope via `rosterVisibleTo(user, roster)`: `attendance:all` → everyone; `attendance:team` → own site (`scope.kind === 'site'`) or own department; otherwise only your own row (no roster, KPI strip hidden). Leave: everyone sees balances (CL 10 / SL 14 / EL 20 minus approved days) and their requests; "Apply for leave" validates range/balance, calls `addLeaveRequest` (`nextRef('LV')`, `nowStamp()`) and mirrors to approvals via `addLeaveApproval`, so HR/HOD decide it in the Approvals centre (linked from the team-leave card via `onNavigate('approvals')`). All KPIs (present/late/review/leave) are computed from the visible roster; the 743/788 headcount, "REAL GPS (VERIFIED)" and overtime-৳ cards are gone. |
