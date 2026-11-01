# BOGCL OneOps — Comprehensive Current-State Report

**Project:** BOGCL OneOps — Enterprise Operations Portal for Bashundhara Oil & Gas Company Limited (BOGCL)
**Document type:** Code-verified state-of-the-project report (what exists, how it works, why it exists, what is missing)
**Snapshot date:** 1 November 2026
**Repository:** `https://github.com/HprogrammerArif/B-OIL-GAS.git`, branch `master`, 51 commits (18–30 Oct 2026), 1 contributor
**Verification method:** Every claim in this document was checked against the source in `client/src/` (file reads, symbol greps, `npm run build`). Where the older planning documents in `docs/` disagree with the code, this report follows the code and flags the difference.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background: Who the Client Is and What They Asked For](#2-background-who-the-client-is-and-what-they-asked-for)
3. [Why This Platform: The Business and Design Rationale](#3-why-this-platform-the-business-and-design-rationale)
4. [Project Timeline and Repository Facts](#4-project-timeline-and-repository-facts)
5. [Technology Stack: Declared vs. Actually Used](#5-technology-stack-declared-vs-actually-used)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Roles, Personas and Access Model](#7-roles-personas-and-access-model)
8. [Application Shell and Cross-Cutting Features](#8-application-shell-and-cross-cutting-features)
9. [Module-by-Module Detail (17 modules)](#9-module-by-module-detail)
10. [Cross-Module Integration: The Approval Hub](#10-cross-module-integration-the-approval-hub)
11. [Design System, Theming, Localisation and Responsiveness](#11-design-system-theming-localisation-and-responsiveness)
12. [Data Model Inventory](#12-data-model-inventory)
13. [What Is Simulated, Mocked or Cosmetic](#13-what-is-simulated-mocked-or-cosmetic)
14. [What Is Not Built](#14-what-is-not-built)
15. [Known Defects and Inconsistencies](#15-known-defects-and-inconsistencies)
16. [Documentation Inventory](#16-documentation-inventory)
17. [Readiness Assessment](#17-readiness-assessment)
18. [Recommended Next Steps](#18-recommended-next-steps)
- [Appendix A: Complete Source File Inventory](#appendix-a-complete-source-file-inventory)
- [Appendix B: Store API Reference](#appendix-b-store-api-reference)
- [Appendix C: Glossary of Domain Terms](#appendix-c-glossary-of-domain-terms)

---

## 1. Executive Summary

**What BOGCL OneOps is.** A single internal web portal (with a planned mobile companion) for Bashundhara Oil & Gas that digitises 16 operational domains the client listed in their first briefing: notices, Chairman messaging, paperless approvals/e-sign, parcel tracking, asset lifecycle, licence compliance, HSE incidents, visitor management, vehicle dispatch, geofenced attendance, TA/DA, conveyance, tour expenses, staff bus seats, a Chairman command dashboard with inner-circle chat, and role-based administration.

**What has actually been built (as of this snapshot).** A **frontend-only, high-fidelity interactive prototype**:

| Dimension | Verified value |
| :--- | :--- |
| Source volume | **67,047 lines** across 93 files (69 `.tsx`, 13 `.ts`, 11 `.css`) in `client/src/` |
| Screens | 1 login page, 15 routed views, 7 role-specific dashboards |
| Dialogs | ~45 modals/drawers (fleet 10, asset 9, bus 14, dashboard 3, approvals 2, shell 6, others) |
| Roles | 7 switchable personas with role-tailored navigation (7–14 menu items each) |
| Languages | Full English / বাংলা (Bengali) UI via an inline `t(en, bn, lang)` helper |
| Themes | Light and dark (`data-theme` attribute, `styles/dark.css`) |
| Build health | `npm run build` passes: 0 TypeScript errors, bundle 1,996 kB JS / 240 kB CSS, ~1 s Vite build |
| Backend | **None.** `server/` is an empty directory. No API, database, auth, or persistence. |
| Tests / CI | None. |

**Status in one sentence:** the product is a demo-grade, click-through prototype that convincingly shows every one of the 16 requested domains end-to-end in the browser, with realistic Bangladeshi oil-and-gas seed data, but all state lives in browser memory and resets on refresh; nothing is wired to a server, and several "security" affordances (SHA-256 seals, OTPs, geofencing, biometrics) are visual simulations.

**Why it was built this way.** The client originally asked for "a prototype" after a short, high-level discussion. The strategy documented in `docs/01` and `docs/04` is to use an unusually complete, branded prototype to win the full multi-phase enterprise contract, then build the real backend in phases. The prototype is therefore optimised for demonstration breadth and visual credibility, not for production correctness.

---

## 2. Background: Who the Client Is and What They Asked For

### 2.1 The client

**Bashundhara Oil and Gas Company Limited (BOGCL)** is a concern of **Bashundhara Group**, one of Bangladesh's largest conglomerates. The prototype models three sites, which appear throughout the seed data:

- **Head Office, Baridhara (Dhaka)** — `HQ_BARIDHARA`; address used on letterheads: Plot-3, Block-G, Umme Kulsum Road, Baridhara R/A, Dhaka-1229
- **Keraniganj Plant** — `PLANT_KERANIGANJ`; modelled as a bitumen refinery with distillation columns (C-102), storage tanks (TK-101…), boilers, a 5,000 MT/day output target
- **Chattogram (Patenga) Terminal / Depot** — `TERMINAL_CTG`

The modelled headcount is 743 present of 788 employees (HQ 420 / Keraniganj 218 / Chattogram 105).

### 2.2 The original brief (`initial-discussion-doc.txt`)

The client's own words were a high-level 16-point list, explicitly noting "they just gave us small overview, we did not able to hear in depth details from them." The 16 requested items were:

| # | Client's request | Client's own clarifying note |
| :---: | :--- | :--- |
| 1 | Notice Board | "for everyone… should notify everyone" |
| 2 | Chairman's Message | "visible and sent to everyone" |
| 3 | Paper / Document Approval Automation | "something like DocuSign… e-sign also" |
| 4 | Parcel Tracker | "does he send that parcel… did they receive… where right now the parcel is" |
| 5 | Asset Lifetime Tracking / Lifecycle | "expiring, notification alert, low stock, renew date, maintenance time" |
| 6–7 | Business Licence Management (Trade Licence, BSTI) | "Fund Approval → Apply → visit date → audit → licence get" |
| 8 | Incident Management | "so many incidents can happen in a big company" |
| 9 | Guest Management | "normal visitor, govt guest, VIP guest" |
| 10 | Fleet / Vehicle Management | "employee asks admin for a vehicle; admin assigns driver and vehicle" |
| 11 | Attendance with Geo-fencing | — |
| 12 | TA & DA Management | — |
| 13 | Conveyance Management | — |
| 14 | Tour and Expense Management | — |
| 15 | Bus Seat Reservation | "20 seats, 30 people… who applied first gets the seat when someone leaves" |
| 16 | Chairman Dashboard + inner-circle messaging + leave status of selected people | "Informed, non informed, sick, meeting" |

Two constraints were stated: internal use only; must be role-based.

### 2.3 The advisory response (`suggession-from-claude.txt`)

A 13-section architecture and delivery guide was produced in response. Its key recommendations shaped everything that followed:

- Build a **shared foundation first** (identity, workflow/approval engine, notifications, documents, audit) because "almost every module is the same pattern: someone requests, someone approves, something is tracked, people are notified, everything is logged."
- Deliver in **phases** (Discovery → Foundation → Approvals & Movement → People & Money → Assets & Compliance → Advanced).
- Use a **modular monolith** on Next.js / NestJS / PostgreSQL / Redis / S3-compatible storage, React Native for mobile.
- **RBAC with scope** (role + data scope: self / team / department / location / company), permissions as data, delegation with date ranges.
- Study **Odoo** and Bangladesh's government **e-Nothi** system as references for the "file moves from desk to desk" approval culture.
- Treat TA/DA, Conveyance and Tour as **one Travel & Expense domain** sharing a claim engine.
- Run a proper **discovery** with signed scope per phase, and protect commercially (no fixed price for 16 modules before discovery).

### 2.4 The strategic pivot (`docs/01`, `docs/04`)

Rather than deliver a thin prototype, the team chose to produce a **comprehensive, branded, interactive prototype of all 16 domains** plus an eight-document pitch suite, so that the demo itself argues for the full contract. This is the single most important fact for understanding the current codebase: breadth and visual polish were prioritised over backend depth.

---

## 3. Why This Platform: The Business and Design Rationale

### 3.1 Why a custom build rather than SAP / Odoo / ServiceNow / DocuSign

From `docs/03` §2 and `docs/04` Objection 1:

1. **Fit to local process.** Pre-configured for Bangladeshi regulators (BSTI, Department of Explosives, Department of Environment, Fire Service & Civil Defence, BIWTA, BRTA, Chief Inspector of Boilers, Energy & Mineral Resources Division/BPC), local transport modes (CNG, rickshaw, ride-share, company bus), the note-sheet (e-Nothi) approval culture, and Bengali as a first-class language.
2. **No per-seat SaaS cost** for ~800 to several thousand users across a group.
3. **Data sovereignty.** All employee, HSE, Chairman and VIP data stays on-premise (Bashundhara data centre) or in a Bangladeshi Tier-III cloud.
4. **One login, one app** for staff whose roles span many functions (the client's explicit ask: "everything in a single app and website").

### 3.2 Why these specific design choices

| Choice | Reason (from docs + code) |
| :--- | :--- |
| Bilingual EN/BN everywhere | Executives work in English; gatekeepers, drivers, depot staff need Bangla. Implemented as paired strings on every label. |
| Role-tailored navigation | Prevents a driver from seeing finance menus; mirrors "RBAC with scope." Implemented as 7 static nav trees in `Sidebar.tsx`. |
| Digital Note-Sheet rather than generic e-sign | Matches how Bangladeshi conglomerates and government liaison actually approve: numbered paragraphs, sequential signatories, seals. |
| 5-stage Kanban for licences | Directly encodes the client's "Fund → Apply → Visit → Audit → Licence" flow. |
| 5×5 risk matrix, 5-Whys, CAPA for incidents | Petroleum handling is hazardous; OSHA/ISO 45001 vocabulary gives credibility with HSE staff. |
| FIFO waitlist with seat map for buses | The client's one concretely described rule (20 seats, 30 people, first-come priority on vacancy). |
| Chairman "gold" styling (`#D4AF37`) | Executive/VIP distinction is a stated cultural requirement; also used for VIP guests and directives. |
| Bashundhara crimson `#A51C30` / slate `#0B132B` | Brand inheritance so the demo looks like an in-house product, not a vendor template. |
| Centralised Approvals Center | Realises the "shared workflow engine" idea on the client: every module's pending items mirror into one inbox. |

### 3.3 The commercial logic

`docs/01` §5 proposes a 5-phase, ~42-week roadmap after the prototype, with an MSA + per-phase SOWs and a change-control framework tied to the traceability ledger (`docs/03`). The ROI table claims, for example, approval cycles compressed from 7 days to <4 hours and 18–25% reduction in vehicle operating costs. These are pitch assertions, not measured outcomes.

---

## 4. Project Timeline and Repository Facts

### 4.1 Git history

- **First commit:** 18 Oct 2026 — "add core application layout, command palette, official document modal, and workflow views"
- **Last commit:** 30 Oct 2026 — "add GuestView component with visitor management and VIP tracking data"
- **51 commits over 13 consecutive days**; busiest days 22 Oct and 27 Oct (8 commits each)
- **Single author:** `HprogrammerArif`
- **Uncommitted at snapshot:** `README.md` (modified: adds a link to the ledger), `docs/PROJECT_MASTER_STATUS_AND_FEATURE_LEDGER.md` (untracked)
- Commit messages are all `feat:` prefixed; no `fix:`, `test:`, or `refactor:` commits, consistent with a greenfield prototype sprint.

### 4.2 Build order inferred from commits

Fleet & chat components and the Chairman dashboard came first (18–22 Oct), followed by claims, notesheets, approvals and bus (22–27 Oct), then compliance, ROI dossier, asset/EAM, Plant GM dashboard and finally Guest (28–30 Oct).

### 4.3 Repository layout

```
B-OIL-GAS/
├── client/                       Vite + React + TypeScript SPA (the entire product)
│   ├── src/
│   │   ├── App.tsx               Root: auth gate, role/view/lang/theme state, view switch
│   │   ├── types.ts              AppRole, AppView, Lang, ROLE_META, t()
│   │   ├── main.tsx              createRoot + stale service-worker cleanup
│   │   ├── components/           45 shared + domain components (asset, bus, claims, dashboard, fleet, notesheet, workforce)
│   │   ├── views/                15 views + dashboard/ (7 role dashboards + notice modals + data)
│   │   ├── store/                9 observable stores (hand-rolled, see §6.3)
│   │   └── styles/               9 CSS files (design system)
│   ├── dist/                     Last production build (committed artefact)
│   ├── public/                   favicon.svg, icons.svg
│   ├── package.json, vite.config.ts, tsconfig*.json, .oxlintrc.json
├── server/                       EMPTY
├── docs/                         9 planning/pitch documents (see §16)
├── README.md                     Suite index + 16-module list
├── initial-discussion-doc.txt    Client brief
└── suggession-from-claude.txt/.docx   Advisory architecture guide
```

---

## 5. Technology Stack: Declared vs. Actually Used

This is the most important correction to the existing planning documents.

| Package (`client/package.json`) | Version | Declared purpose | **Actual use in code** |
| :--- | :--- | :--- | :--- |
| `react`, `react-dom` | ^19.2.8 | UI | Used. Function components, hooks, `StrictMode`. |
| `typescript` | ~6.0.2 | Types | Used. `tsc -b` runs before every build; 0 errors. `noUnusedLocals` is **off**. |
| `vite` + `@vitejs/plugin-react` | ^8.3.0 / ^6.1.1 | Build | Used. Single-chunk output; Vite warns about >500 kB chunk. |
| `lucide-react` | ^1.58.0 | Icons | Used extensively (hundreds of icons). |
| `zustand` | ^5.0.16 | State | **Not imported anywhere.** All 9 stores are hand-written classes (see §6.3). The existing ledger's "9 Zustand stores" is inaccurate. |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Styling | **Not wired in.** No plugin in `vite.config.ts`, no `@import "tailwindcss"`. Styling is 12,359 lines of hand-written CSS with custom properties. |
| `oxlint` | ^1.81.0 | Lint | Configured (`react/rules-of-hooks: error`, `react/only-export-components: warn`). |

**Browser APIs actually used:** `window.speechSynthesis` (voice briefing playback), `window.print()` (passes, manifests, notices, dossier), `navigator.serviceWorker.getRegistrations()` (cleanup only), Canvas 2D (signature pad), `data:` URL downloads (CSV exports).

**Browser APIs NOT used (despite UI claims):** `navigator.geolocation`, `crypto.subtle` / Web Crypto, `localStorage` / `sessionStorage` / IndexedDB, `fetch` / XHR, `WebSocket`, Notifications API, camera / `getUserMedia`.

**Fonts:** Inter (body), Outfit (display), Hind Siliguri (Bengali) via Google Fonts `<link>` in `index.html`.

**Target:** ES2023, `moduleResolution: bundler`, `jsx: react-jsx`.

---

## 6. Frontend Architecture

### 6.1 Application flow

```
main.tsx ──► <App/>
              │
              ├─ isLoggedIn=false ──► <LoginPage/>  (persona picker, fake 1.15 s TelemetryLoader) ──► onLogin(role)
              │
              └─ isLoggedIn=true
                   ├─ <Sidebar role/>            role-specific nav tree + live badges
                   ├─ <Topbar/>                  breadcrumb, clock, search, sync, notifications, theme, lang, profile
                   ├─ announcement banner        when noticeStore.activeBroadcast is set
                   ├─ <main> view switch         15 views keyed on `view` state (no router)
                   ├─ <MobileBottomNav/>         ≤ 4 tabs + More
                   ├─ <CommandPalette/>          Ctrl/Cmd+K
                   ├─ <BroadcastModal/>          chairman announce
                   └─ <ToastManager/>
```

- **No router.** Navigation is a `useState<AppView>` in `App.tsx`; the URL never changes. Deep-linking and browser back are therefore not supported.
- **Role is UI state.** `role` is a `useState<AppRole>` set at login and changeable at any time from the Topbar or Command Palette ("Switch Role (Preview)"). There is no session, token, or server check.
- **Theme** is applied by setting `data-theme="light|dark"` on `<html>`; **language** by toggling a `lang-bn` class and passing `lang` as a prop to every component.

### 6.2 View registry (`types.ts` → `App.tsx`)

| `AppView` | Component | Module(s) |
| :--- | :--- | :--- |
| `dashboard` | `DashboardView` → 7 sub-dashboards | MOD-01, MOD-02, MOD-15 |
| `inner_circle` | `InnerCircleChat` | MOD-15 |
| `workforce` | `WorkforceView` | MOD-16 |
| `notesheet` | `NotesheetView` | MOD-03 |
| `compliance` | `ComplianceView` | MOD-06 |
| `fleet`, `vehicle_request` | `FleetView` | MOD-09 |
| `bus` | `BusView` | MOD-14 |
| `parcel` | `ParcelView` | MOD-04 |
| `attendance` | `AttendanceView` | MOD-10 |
| `incident` | `IncidentView` | MOD-07 |
| `approvals` | `ApprovalsView` | MOD-17 |
| `claims` | `ClaimsView` | MOD-11/12/13 |
| `asset` | `AssetView` | MOD-05 |
| `guest` | `GuestView` | MOD-08 |

### 6.3 State management pattern (the real one)

Every store in `client/src/store/` follows the same hand-rolled observable pattern:

```ts
class XStore {
  private items = [...SEED];
  private listeners = new Set<() => void>();
  subscribe(l) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private notify() { this.listeners.forEach(l => l()); }
  getItems() { return this.items; }
  mutate(...) { this.items = ...; this.notify(); }
}
export const xStore = new XStore();           // module-level singleton
export function useXStore() {                 // React hook
  const [items, setItems] = useState(xStore.getItems());
  useEffect(() => xStore.subscribe(() => setItems([...xStore.getItems()])), []);
  return { items, mutate: xStore.mutate.bind(xStore), ... };
}
```

`assetStore.ts` and `voiceBriefingStore.ts` use module-level variables plus a `subscribe` function instead of a class, but the semantics are identical. Properties:

- **In-memory only.** A page refresh restores seed data.
- **Cross-store calls are direct imports** (e.g. `approvalStore` imports and calls `notesheetStore`, `fleetStore`, `operationsStore`, `assetStore`), which is how cross-module synchronisation works (§10).
- **Not every view uses its store.** `BusView`, `InnerCircleChat` and `AttendanceView` keep their own local `useState` copies of seed data; only `Sidebar` badge counters read `busStore` and the chat/attendance parts of `operationsStore`. See §15.

### 6.4 The nine stores

| Store | Lines | Owns |
| :--- | ---: | :--- |
| `operationsStore.ts` | 2,288 | Licences, incidents + CAPA, parcels, visitors, attendance roster, leave requests, chat channels/members/messages, user profile prefs & device sessions |
| `assetStore.ts` | 2,449 | Assets, lifecycle events, custody, spares, work orders, requisitions, transfers, disposal dossiers, depreciation engine, role config |
| `fleetStore.ts` | 1,271 | Drivers, vehicles, requisitions, trip chat, notifications, toll slips, fuel vouchers |
| `approvalStore.ts` | 901 | Expense claims, unified approval items (pending + decided), cross-module decision propagation |
| `notesheetStore.ts` | 565 | Note-sheet files, paragraphs, signatory routes, quotes, budgets |
| `employeeStore.ts` | 463 | Employee directory, exit clearance |
| `busStore.ts` | 220 | Buses, routes, seats, waitlist, delay broadcast (consumed only by Sidebar) |
| `noticeStore.ts` | 140 | Notices, active company-wide broadcast |
| `voiceBriefingStore.ts` | 85 | Active Chairman voice briefing, play state |

---

## 7. Roles, Personas and Access Model

### 7.1 The seven personas (`types.ts` → `ROLE_META`)

| Role key | Name (EN / BN) | Title | Emp ID | Dept | Site | Avatar colour |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `chairman` | Ahmed Akbar Sobhan / আহমেদ আকবর সোবহান | Chairman & Managing Director | EMP-0001 | Chairman's Office | HQ Baridhara | `#A51C30` |
| `plant_gm` | Engr. Md. Harunur Rashid | Plant General Manager | EMP-0012 | Plant Operations | Keraniganj | `#0369A1` |
| `hr_admin` | Sayeda Afroza Sultana | GM, HR & Administration | EMP-0028 | Human Resources | HQ Baridhara | `#BE185D` |
| `transport_admin` | Md. Kamruzzaman | Transport & Admin Supervisor | EMP-0045 | Transport & Logistics | Keraniganj | `#059669` |
| `hod` | Farida Begum | Head of Finance & Approver | EMP-0062 | Finance & Accounts | HQ Baridhara | `#7C3AED` |
| `employee` | Tanvir Ahmed | Senior Sales Officer (Grade 8) | EMP-1042 | Sales & Distribution | HQ Baridhara | `#D97706` |
| `driver` | Md. Rafiqul Islam | Senior Company Driver (DRV-01) | EMP-0821 | Transport & Logistics | HQ Baridhara | `#059669` |

Login: any persona, email or Emp ID auto-selects the role; password field pre-filled `bogcl2026` but **not validated**; an SSO button does the same fake login.

### 7.2 Navigation matrix (`Sidebar.tsx` → `ROLE_NAV`)

| View | Chairman | Plant GM | HR Admin | Transport | HOD | Employee | Driver |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| dashboard | ● | ● | ● | ● | ● | ● | ● |
| inner_circle | ● | ● | ● | | ● | | |
| approvals | ● | ● | ● | | ● | | |
| notesheet | ● | ● | ● | ● | ● | ● | |
| asset | ● | ● | ● | ● | ● | ● | ● |
| compliance | ● | ● | ● | | ● | | |
| guest | ● | ● | ● | ● | ● | ● | |
| incident | ● | ● | ● | ● | ● | ● | ● |
| attendance | ● | ● | ● | ● | ● | ● | ● |
| workforce | ● | | ● | | ● | | |
| parcel | | ● | ● | ● | ● | ● | ● |
| fleet | | | ● | ● | ● | ● | ● |
| bus | | | ● | ● | | ● | |
| claims | | | ● | ● | ● | ● | ● |
| **Total items** | **10** | **10** | **14** | **10** | **13** | **10** | **7** |

Menu labels are role-contextual (e.g. `asset` is "Assets & Equipment" for the Chairman, "Machinery & Assets" for Plant GM, "Vehicle Asset Records" for Transport, "My Assigned Equipment" for employee/driver).

### 7.3 How access control actually works

- **Navigation-level gating only.** `getAllowedViewsForRole()` derives the allowed set from the nav tree; `CommandPalette` and `NotificationCenter` respect it. There is no guard inside `App.tsx`'s view switch, so if a view were reached by other means it would render.
- **Inside views, gating is inconsistent:**
  - Strong: `AssetView` uses `getAssetRoleConfig(role)` with 12 capability flags (`canRegisterAsset`, `canApproveRequisition`, `canAuthorizeWriteOff`, `canEditDepreciationPolicy`, `isSelfServiceOnly`, …).
  - Moderate: `FleetView` has admin/employee/driver tab sets; `IncidentView` shows "Verify & Close" only to plant_gm/chairman/transport_admin; `ParcelView` and `GuestView` lock employees to "my" scope.
  - None: `NotesheetView`, `ComplianceView`, `ClaimsView`, `ApprovalsView`, `WorkforceView`, `InnerCircleChat`, `BusView` render identical actions for every role (any role can approve any claim or offboard any employee).
- **Identity matching is by hard-coded name/ID** (e.g. `requesterName.includes('Tanvir')`, `assignedDriverId === 'DRV-01'`).
- **Data scopes** (self / dept / plant / company) from the architecture docs are not implemented as a general mechanism.

### 7.4 Live navigation badges (`useLiveNavBadges`)

Eleven badge rules compute counts from the stores per role, e.g. approvals pending (danger), note-sheets not approved (warn), unread chat (info), permits ≤90 days (warn), open incidents (danger, hidden for employee/driver), visitors inside, driver's active trips, pending trips (admin/HOD/HR), bus waitlist, staff count, pending claims, asset actions (custody confirm / maintenance due / retire review / store stock).

---

## 8. Application Shell and Cross-Cutting Features

| Component | Lines | What it does (verified) |
| :--- | ---: | :--- |
| `LoginPage` | 281 | Persona pill grid (7), email/Emp-ID autocomplete to role, password (not checked), remember-me, "Forgot password" toast (Ext. 4401), SSO button, bilingual, footer with sites. Submits via `TelemetryLoader`. |
| `TelemetryLoader` | 84 | Fake sign-in progress: 4 steps at 250/550/850 ms, completes at 1,150 ms. |
| `Sidebar` | 468 | 7 nav trees, collapse/expand, mobile drawer with backdrop, live badges, role badge with pulsing gold dot. |
| `Topbar` | 471 | Breadcrumb from `PAGE_META` (15 views), live clock (1 s), search trigger (Ctrl+K), "System Synced" → `SapGatewayModal`, `NotificationCenter`, theme toggle, EN/বাং toggle, chairman-only "Announce" → `BroadcastModal`, profile menu (Switch Role grid, My Employee Profile, Password & Login Security, Handover / Out of Office, Active Devices, Lock Screen, Sign Out). |
| `CommandPalette` | 362 | Ctrl/Cmd+K, Esc; categories: Pages (role-filtered), Live Records (note-sheets, assets, fleet, licences, employees — scoped per role), Quick Settings (theme), Switch Role; arrow-key navigation. |
| `NotificationCenter` | 312 | Role-built feed (broadcast, driver trip/fitness, employee custody/visitor/claims, management approvals/permit/fleet), filters All / Approvals / Safety & Permits / Transport, mark-all-read (also marks fleet notifications), click-to-navigate if allowed. |
| `UserProfileModal` | 557 | Tabs: Employee Info, Password & Security (2-step "active", stamp valid till Dec 2027, change-password toast), Leave Handover (delegation to one of 5 officers with date and scope, persisted in `operationsStore.profilePrefs`), Devices & Sign-In Log (2 sessions, revoke). |
| `LockScreenModal` | 213 | Full-screen lock; demo PIN **1234**; "Quick Fingerprint Unlock" instantly unlocks; "Sign In as Another User" logs out. |
| `SapGatewayModal` | 108 | Static status for 3 systems (Finance books, Plant & Store inventory, HR attendance & payroll) all "Up to Date"; "Run Connection Check" toast. |
| `BroadcastModal` | 97 | Chairman announcement: title/body, "Ask staff to Acknowledge", "Also send SMS"; calls `noticeStore.addBroadcast` → pinned notice + top banner; toast "sent to all 788 employees". |
| Announcement banner (`App.tsx`) | — | Crimson gradient bar with gold border; Acknowledge (→ `acknowledgeNotice`) and dismiss. |
| `MobileBottomNav` | 117 | 4 role-specific tabs + More; same live badges. |
| `DetailDrawer` | 246 | Generic right drawer for an approval: metrics, trail timeline, Approve Now / Return for Correction wired to `approvalStore`. |
| `OfficialDocumentModal` | 219 | Printable letterhead document (notesheet / trip pass / gate pass) with QR placeholder and "★ BOGCL APPROVED ★" stamp; Download PDF is a toast. |
| `RejectionExplanationModal` | 412 | Reusable "return with instructions" dialog; preset reasons per category (claim 4, notesheet 4, requisition 3, asset 3, general 2); used by Notesheet, Claims, Approvals, Asset. |
| `AuthorizeDirectiveModal` | 470 | Reusable approval dialog with 4 directive presets, required note, signer stamp preview, notify checkbox. |
| `ToastManager` | 30 | Global `showToast(msg, type)`; types default/success/gold/info/warn/danger; 4.5 s. |
| `Pagination`, `AnimatedCounter`, `Sparkline`, `RefineryOutputChart` | 78/55/63/204 | Utilities; chart has 7-day production data and 4 tank cards, "SCADA LIVE" badge, 700 ms fake refresh. |

---

## 9. Module-by-Module Detail

Module IDs follow the existing ledger (MOD-01…MOD-17). For each module: what the client asked, what exists, how it works, the exact business rules in code, seed data, what is simulated, and gaps.

---

### MOD-01 — Enterprise Notice Board & Company Broadcast

**Client ask:** #1 Notice Board ("notify everyone").
**Files:** `views/dashboard/NoticeDetailModal.tsx` (702), `PublishNoticeModal.tsx` (1,032), `components/BroadcastModal.tsx` (97), `store/noticeStore.ts` (140), banner in `App.tsx`; surfaced in `ChairmanDashboard` "Company Notices" tab and the Topbar "Announce" button.

**What exists**
- Notice list with filters (all / pinned / safety / hr / operational), search, 4-per-page pagination; each notice has EN+BN title/body, tag, category, priority, author, target audience, reference number (`BOGCL/NOTICE/2026-###`), `requiresAck`, `acknowledgedCount / totalRecipients`.
- `NoticeDetailModal`: letterhead view, `window.print()`, "Mark as Acknowledged".
- `PublishNoticeModal`: 4 templates (Chairman's Directive, Safety & LOTO Protocol, Plant Maintenance Window, HR Policy & Holiday Notice); 7 tags; priority critical/high/normal; audience selector with counts 1,240 / 218 / 520 / 142 / 32; pinned / requiresAck / sendSms default on; form/preview tabs; reference `BOGCL/DIR/2026/Q4-###`.
- `BroadcastModal` (Chairman only): creates a company-wide broadcast that becomes both a pinned notice and a live top banner with Acknowledge/dismiss.

**Business rules:** acknowledging increments `acknowledgedCount` and sets `read`; broadcasts record `totalRecipients = 788`, `acknowledgedCount = 1`.
**Seed:** 3 notices (NOT-2026-087/088/089).
**Simulated:** SMS/push ("Pushed to 1,240 employees via App & SMS" is a toast). No read-receipt per user; the count is a single integer.
**Backend needed:** notices CRUD, audience resolution, per-user receipts, push/SMS dispatch.

---

### MOD-02 — Chairman Executive Command Suite & Voice Briefing

**Client ask:** #2 Chairman's Message, #16 Chairman Dashboard.
**Files:** `views/dashboard/ChairmanDashboard.tsx` (611), `components/dashboard/SendVoiceBriefingModal.tsx` (663), `ExecutiveROIDossierModal.tsx` (543), `store/voiceBriefingStore.ts` (85), `DashboardView.tsx` chairman branch.

**What exists**
- Tabs: Executive Overview, Priority Approvals (3), Leadership Team (8), Company Notices.
- ROI banner: ৳4,82,50,000 savings / 284 accident-free days / ৳18.2 Cr revenue (animated counters) + "Executive ROI Dossier".
- "Chairman's 3-Point Decision Briefing" ribbon; **Voice Briefing player** that uses the real Web Speech API (`speechSynthesis`, rate 1.0, pitch 0.95) to read the EN or BN transcript, with a CSS-animated equaliser.
- `SendVoiceBriefingModal`: 3 transcript presets (Factory Run 42 s, HSE 35 s, Finance 28 s), fake recorder timer (caps 60 s), priority, audience checkboxes; publish → `voiceBriefingStore.publishBriefing` (`VB-2026-####`).
- `ExecutiveROIDossierModal`: 4 savings pillars (Fleet Telematics ৳2.15 Cr, Predictive SCADA ৳1.485 Cr, Vendor Sourcing ৳76.5 L, Tax Pre-Audit & BEFTN ৳42.5 L), GL ledger, Share to Board (toast), print.
- Priority Approvals list with expandable trails → `AuthorizeDirectiveModal` → removes item, toast "Forwarded to SAP S/4HANA".
- Inner Circle roster (8 people) with status filter and pagination; statuses include "On Approved Leave", "Sick", "⚠️ Uninformed Absent", "In Meeting" — this is the client's "Informed / non-informed / sick / meeting" requirement.

**Simulated:** audio recording (no microphone), SAP forwarding, board sharing. KPI numbers are constants in `dashboardData.tsx` (`ROLE_STATS`).

---

### MOD-03 — Paperless E-Sign & Digital Note-Sheets (e-Nothi)

**Client ask:** #3 Document approval automation "like DocuSign… e-sign".
**Files:** `views/NotesheetView.tsx` (979), `components/notesheet/InitiateNotesheetModal.tsx` (857), `components/OfficialDocumentModal.tsx` (219), `store/notesheetStore.ts` (565).

**Screens:** tabs "Note Sheet", "Vendor Quotations", "Signatures & History"; file chip bar; buttons "+ New Note-Sheet", "Print Document", "Approval Certificate" (when approved).

**Workflow / state machine**
- `NoteFile.status`: `pending_approval | pending_chairman | in_review | approved`.
- `SignatoryStep.status`: `signed | pending | upcoming`; current step = first `pending`.
- Create → `pending_approval`. Intermediate signatory "Sign & Forward" appends a note. Final signatory "Final Sanction & Approve" → `approveFile` marks all route steps `signed`, syncs `approvalStore.syncSourceDecision(... 'approved')`, opens a **Certificate of Final Approval**. "Return / Query" → `RejectionExplanationModal` → `returnFileForRevision` → `in_review` and syncs a rejection.
- Signature capture: HTML canvas (340×100) free-hand drawing or "1-Click Digital Stamp" that renders the signer's name with a bezier flourish.

**Initiate modal:** 5 available officers; 4 routing presets (`plant_internal`, `dept_finance`, `hr_policy`, `capex_boardroom` = Plant GM → Finance → Chairman); urgency 3 levels; auto file number `BOGCL/PROC/KER-2026/####`; SAP PR reference `SAP-PR-2026-#####`; budget head defaults (GL-2026-OPEX ৳1 Cr allocated / ৳65 L available). Submitting also creates an approval item in the Approvals Center (`addNotesheetApproval`, SLA 18 h, urgency critical if > ৳5,00,000).

**Seed:** 4 files — generator maintenance ৳48.5 L (urgent, pending Chairman, 3 vendor quotes: Energypac / Rahimafrooz / Bengal Diesel), stationery ৳85 K, software renewal ৳18.5 L (approved), salary increment policy (approved).

**Simulated / cosmetic:** "SHA-256 seal" is `Math.random().toString(16)` (`VERIFIED-SIGN-…`, `APPROVED-…`, `RETURNED-…`); no PDF generation (print uses browser print of HTML); no OTP at signing; QR is a placeholder box.
**Defect:** intermediate "Sign & Forward" sets the whole file to `approved` without advancing `signatoryRoute` (only the final step does), so a two-step route shows "APPROVED" after the first signature.

---

### MOD-04 — Chain-of-Custody Parcel Tracker

**Client ask:** #4 Parcel Tracker ("did they receive it, where is it now").
**Files:** `views/ParcelView.tsx` (2,276); `ParcelItem` type and seed in `operationsStore.ts`.

**Screens:** KPI cards; pills All / Inward / Outward / In-Transit / Returns; cockpit sub-tabs "Live Transit Corridor" (Dhaka HQ → Keraniganj, 22.4 km, 5 nodes), "Step-by-Step History", "Package Specs & Custody"; mobile toggle Feed / Tracker.

**Workflow**
- Forward stages: 1 Despatch Logged → 2 Driver Handover → 3 Transit Checkpoint → 4 Plant Gate Inward → 5 Recipient Verified. Status: `dispatched | in_transit | at_gate | delivered | returned | quarantined`; tamper: `secure | inspected | flagged`.
- Return (RTO) flow: `Return Initiated → Reverse Transit → Returned to Sender` with its own return OTP; reasons `tamper_broken | damaged_contents | wrong_documents | recipient_refused | recipient_unavailable`.
- Each handoff appends a `CustodyLogEntry` with actor, role, time, note and a "securityHash".

**Actions:** Register consignment (tracking `BOGCL-WB-2026-####`, seal `TAMPER-SEAL #BG-#####`, random 4-digit OTP); Scanner handshake (advance stage); OTP verification (recipient PIN **or master `1234`**; error toast shows the correct PIN as a hint); Flag Broken Seal → quarantine/RTO; Audit Trail; Waybill Manifest; copy tracking link; call/chat courier (toasts).
**Role:** employee locked to "My Consignments"; others toggle "Master Corporate Manifest".
**Seed:** 6 parcels (e.g. P-TA-01 at gate OTP 7482 with driver Rafiqul in Prado GHA-13-8821; P-TA-05 ৳14.5 Cr contract in transit; P-TA-04 returned/flagged; P-EXEC-01 to Chairman).
**Simulated:** QR/barcode scanning (button), hashes, OTP SMS, ANPR/RFID checkpoints.
**Defect:** view contains a dead duplicate `INITIAL_PARCELS` array; stage logic is duplicated between view (`confirmScannerHandshake`) and store (`advanceParcelStage`) with different percentages.

---

### MOD-05 — Asset Lifetime Tracking & EAM (ISO 55001 / IAS 16)

**Client ask:** #5 Asset lifecycle ("expiry, alerts, low stock, renew, maintenance").
**Files:** `views/AssetView.tsx` (2,765), `components/asset/AssetModals.tsx` (1,649, 9 modals), `AssetLifecycleStepper.tsx` (179), `store/assetStore.ts` (2,449), `styles/asset.css` (1,408). Specification in `docs/06_ASSET_LIFETIME_TRACKING_AND_EAM_SYSTEM.md`.

This is the deepest module in the codebase.

**Screens:** tabs Machinery Register / Repairs & Servicing / Valuation & Depreciation (if permitted) / Requests & Transfers / Retired & Scrap (hidden for self-service); inspector sub-tabs Specs & Actions / Activity Log / Custody History / Spare Parts; 4 clickable KPI cards (total NBV, availability %, servicing due ≤30 d, retired/scrap); cockpit or table view; filters by category, facility, stage, search; "Smart next-action" banner that tells the user the single most relevant action for the selected asset.

**Taxonomy:** categories `plant | vehicle | it | safety | lab | corporate`; 3 facilities; criticality `critical_a | essential_b | general_c`; regulators BSTI / DoE / ASME-API-510 / BRTA / ISO-17025 / Corporate IT.

**Lifecycle:** `in_stock → operational → (in_transfer | maintenance | calibration_due) → decommissioned → disposed`; 14 event types (REQUISITION_APPROVED … DISPOSED_ARCHIVED), each hashed with FNV-1a (`LOG-xxxxxxxx`); 8-step stepper "1. Requisition … 8. Scrapped".

**Financial engine (`calculateAssetFinancials`, `buildDepreciationSchedule`):**
- Gross = purchase + capex additions; salvage capped at 50% of gross.
- **SLM:** annual = (gross − salvage) / life.
- **WDV:** rate = clamp(1 − (salvage/gross)^(1/life), 12%, 35%).
- **UOP:** accumulated = base × min(1, runtimeHours / ratedHours); rated hours default life × 4,000.
- NBV floors at salvage, 0 when disposed. TCO = gross + opex − salvage/proceeds. Repair ratio = opex/gross. End-of-life candidate if repair ratio ≥ 50%, or ≤0.5 y remaining with health < 55, or decommissioned.
- CSV export `BOGCL_Enterprise_Asset_Lifetime_FI_AA_Ledger.csv`.

**Maintenance:** work orders `PM | CM | CBM | CAL`, priority, status `scheduled → in_progress → completed`; LOTO permit field; completion issues `CERT-{type}-2026-###`; capex completion adds to cost basis, +2 y life, +15 health; opex adds to opex, +7 health; warranty-covered CM costs 0; flagging a deficiency drops health −10 (floor 25) and auto-creates a CM work order (৳25,000 or 0 under warranty).

**Custody & HR interlock:** custodian sign-off (`acknowledgeCustody`), transfers with gate pass (`GP-####`), `reclaimEmployeeAssets` called by HR off-boarding (§MOD-16).

**Procurement:** requisition stages `pending_hod → pending_executive → approved_procuring → commissioned | rejected`; commissioning mints a tag `BOGCL-{KER|CTG|HQ}-{CAT}-{n}` and picks WDV for vehicles / SLM otherwise. Requisitions mirror into the Approvals Center.

**Disposal:** 4 reasons, 4 methods, 4-item checklist (technical survey, decontamination/data wipe, spares harvested, CFO vetted) that must all be ticked before `finalizeDisposalAndArchive` computes gain/loss = proceeds − NBV and issues `VCH-RET-2026-####`.

**Role config (`getAssetRoleConfig`):** chairman full; plant_gm no write-off/dep-policy; hod no WOs/calibration but can set policy and write off; hr_admin WOs only; transport_admin defaults to vehicles; employee/driver self-service only (scoped to own custody).

**Seed:** 12 assets (1,200 kVA Cummins generator ৳2.4 Cr; Prado ৳1.65 Cr WDV; bitumen tanker UOP; MacBook/iPhone for Tanvir; Boiler #1 calibration due; fire pump; bitumen lab tester; server; Dell in stock; forklift decommissioned; photocopier disposed), 3 work orders, 3 requisitions, 1 transfer.
**Simulated:** QR/RFID/NFC scanner modal, SAP FI-AA capitalisation, operating-hour accrual.

---

### MOD-06 — Regulatory Licence & Compliance Pipeline

**Client ask:** #6–7 Business licences, BSTI renewal lifecycle.
**Files:** `views/ComplianceView.tsx` (1,337); `LicenseCard` + seed in `operationsStore.ts`.

**Screens:** header "Compliance Vault & Regulatory Safety Cockpit" with Audit Readiness 94.2% and "Sync Ministry Status"; 4 KPIs (next expiry, "Shutdown Exposure ৳2.65 Cr/day", filings monitored, CEMS compliance); agency chips (Explosives/Fire, Environment, BSTI, Energy Division quota, Metrology/Boilers); urgency filter; **5-column Kanban**: 1. Internal Review → 2. Application Filed → 3. Field Inspection → 4. Ministry Vetting → 5. Renewed & Active; static tank-integrity (API 653) and CEMS emission tables.

**Rules:** urgency critical ≤30 d, warning 31–90 d, active >90 d, EXPIRED ≤0; "Dispatch DO Letter" available ≤30 d; moving a card to stage 5 with <60 days auto-renews it (365 days, inspection date = today, checklist all passed).
**Actions:** Dossier modal (metrics, penalty exposure, inspector, stepper, toggleable checklist, document vault), DO Letter modal (3 channels incl. e-Nothi encrypted dispatch, memo `BOGCL/CMD-DO/{TAG}-2026/089`), Sync modal (fake 1.2 s latency to e-Nothi, NSW/ASYCUDA, DoE CEMS, BPC), Back/Next stage per card.
**Seed:** 6 licences — BPC import quota (7 d, stage 4, ৳15 L fee, ৳2.4 Cr/day exposure), Explosives tank licence (18 d), Boiler certificate (22 d), DoE Environmental Clearance (34 d), FSCD fire licence (84 d), BSTI bitumen certification (142 d, renewed).
**Simulated:** ministry sync, document download, letter dispatch. **Dead code:** unused local `INITIAL_LICENSES`; `urgentEscalate` never wired. No role gating.

---

### MOD-07 — HSE Incident Management & CAPA

**Client ask:** #8 Incident Management.
**Files:** `views/IncidentView.tsx` (2,108); `IncidentItem`, `CapaActionItem` + seed in `operationsStore.ts`.

**Screens:** header "Factory Safety & Incident Management System" (OSHA & ISO 45001 badge); KPIs (284 safe days, 1,428,500 safe man-hours, TRIR 0.14, CAPA completion %, statutory count); **clickable 5×5 risk matrix**; filter pills by type (spills, near-misses, first-aid, pressure, electrical, govt-reportable), 11 plant zones, severity 1–5, workflow stage.

**Taxonomy:** 11 incident types (near_miss, hazard_observation, first_aid, medical_treatment, lost_time, spill_leak, pressure_piping, fire_thermal, electrical_arc, equipment_damage, environmental); workflow `reported → triaged → under_investigation → capa_execution → closed`; CAPA `immediate_containment | corrective | preventive` with priority and `pending | in_progress | completed`.

**Rules:** riskScore = severity × likelihood; category extreme ≥15, high ≥10, medium ≥5, else low; **statutoryReportable = severity ≥ 3** → Department of Explosives, 24 h notice; CAPA completion closes the incident only when all CAPAs are complete; closure requires Safety Officer + Plant GM sign-off (`closeIncidentWithSignOff`), visible only to plant_gm / chairman / transport_admin.
**Actions:** 3-step report wizard (injured persons picked from the live employee directory), 1-minute Quick Hazard Spotter, RCA modal (5-Whys + Ishikawa 6M), add CAPA (6 owners), Form B-12 statutory dossier (print), closure sign-off, "Emergency Siren & Drill" (toast: "All 8 refinery valves isolated").
**Seed:** 6 incidents (TK-102 spill in CAPA execution; PT-204 over-pressure 26.5 bar closed & statutory with receipt #EXP/2026/881; near-miss ladder closed; etc.).
**Simulated:** photo attachment toggle, SCADA valve isolation, SMS to Chairman/Fire Dept. No anonymous-reporting toggle despite docs.

---

### MOD-08 — Guest & VIP Protocol Passes

**Client ask:** #9 Guest Management (normal / govt / VIP).
**Files:** `views/GuestView.tsx` (2,615); `VisitorRecord` + seed in `operationsStore.ts`.

**Screens:** pills All / Inside / VIP-Govt / Expected / My Guests; facility filter; cockpit tabs Visit Details / VIP Protocol & Hospitality / Inspection & Findings / Safety Gear & Briefing / Vehicle Barrier / Permitted Zones; header buttons Pre-Register Guest, Fast Gate Scan, Evacuation Roll-Call (n), Boom Barrier Live.

**Model:** category `vip | govt | vendor | client | regular`; VIP tier `VVIP - Level 1 | VIP - Level 2 | Official Delegation`; status `pre_registered → checked_in → checked_out` (`overdue` exists but is never set); PPE checklist (hard hat, goggles, shoes, hi-vis, H₂S briefing) pre-enabled for refinery visits; permitted zones with green/yellow/red level and escort flag; inspection findings `passed | observation | critical`; evacuation `isEvacuatedSafe`.
**Rules:** badge on check-in VIP-02 / GOVT-05 / `BDG-###`; PPE compliance rate = refinery visitors with hard hat and shoes.
**Actions:** register (pass link `https://oneops.bogcl.com/gate-pass/{id}`; dispatch via WhatsApp/SMS/Email toasts), fast scan (1 s delay then check-in), barrier simulation (opens, auto-closes 4 s), evacuation muster toggles + "Mark All Safe" + siren SMS toast, add inspection finding.
**Seed:** 6 visitors (Dept of Explosives inspector checked in; Axens VVIP expected; RHD engineer; client; Energypac vendor; BSTI officer checked out).
**Simulated:** ALPR plate match, barrier, SMS. **Dead code:** duplicate `INITIAL_VISITORS` (Siemens etc.). Employee scope defaults to "my guests".

---

### MOD-09 — Fleet & Pool Vehicle Dispatch

**Client ask:** #10 Fleet / Vehicle Management.
**Files:** `views/FleetView.tsx` (2,204), `components/fleet/*` (10 files, 6,218 lines), `store/fleetStore.ts` (1,271), `styles/fleet-chat.css` (1,185). A self-critical audit exists in `docs/06_CRITICAL_AUDIT_AND_ROAST_FLEET_SYSTEM.md`.

**Tabs by role**
- Admin (transport_admin, plant_gm, chairman): Requisitions Dispatch Queue · Driver Pool & Sobriety Audit · Tankers & GPS Telematics HUD · Fuel Station & QR Vouchers · Security Gate Roster & Odometers · Dispatch Communications Desk.
- Employee: My Official Duty Travel Requisitions · Dispatch Communications Desk.
- Driver: My Assigned Missions & Duty Terminal (`DriverConsole`) · Dispatch Communications Desk.

**Workflow:** requisition `pending → assigned → in_transit → completed | rejected`; HOD endorsement `pending | approved | rejected`; trip type round/one-way; capacity class `sedan_4 | microbus_7 | pickup_4x4 | tanker_heavy`. Assignment issues `PASS-2026-####`, sets driver `on_trip`, vehicle `in_transit`; Gate Out records start odometer; Complete Trip records end odometer, rating 1–5, returns vehicle/driver to available, +1 trip, +2.0 duty hours. New requisitions mirror into Approvals Center (`addRequisitionApproval`, SLA 12 h).

**Driver/vehicle master:** 8 drivers (status `available | on_trip | off_duty | rest_required | sick_leave | on_leave`; licence class incl. HAZMAT; breathalyzer `0.00% BAC (PASSED) | PENDING | FAILED`; duty hours), 8 vehicles (Prado, 2× HiAce, Corolla, L200, Tata & Scania bitumen tankers with cargo temperature, maintenance states).

**Business rules in code:** `NewRequisitionModal` estimates distance/time/fuel from 5 mission presets (e.g. Keraniganj 38.4 km / 75 min / 4.8 L; Chittagong 248 km), stop multiplier 1 + stops × 0.15, +20 min per stop, round trip ×2, >4 pax → microbus, max 7 pax, **estimatedCost = 1,400 + stops × 350 + (round trip ? 950 : 0)**. Fuel voucher adds liters/(tanker 250 : 75) % to the tank. Toll approval adds the amount to trip cost and posts a system chat message.
**"AI Smart Pooling":** merges two hard-coded requisitions (REQ-441 + REQ-443) into one vehicle — no route-overlap computation.
**Communications:** `FleetChatCenter` (3-column desk; Trips / Hotlines channels; toll claim drawer; voice-note recorder; location pin) and `TripChatModal` with **scripted auto-replies** triggered by keywords (where / gate / toll / AC / delay). `DriverCallModal` simulates a VoIP call (ringing 1.4 s → connected 3.8 s).
**Driver console:** large-target mobile terminal — status (On Duty / En Route / Rest Break), "Arrived at Pickup", "Start Journey" (odometer ±5 km buttons), "Complete Journey", toll logging (5 Dhaka plazas with fixed tariffs ৳80–৳800), Emergency SOS, 3-way chat, call passenger.
**Other modals:** Assign Vehicle, Register Vehicle (BRTA/HAZMAT flags), Enroll Driver (licence `DK-BRTA-2022-####`), Reject (4 preset reasons), Trip Completion, Trip Challan Pass (printable, barcode `*BOGCL-TRIP-{pass}*`), Gate Manifest (printable), Notifications drawer.
**Seed:** 5 requisitions, 15 chat messages, 4 notifications, 2 toll slips.
**Simulated:** GPS/telematics numbers (static speeds, "ETA 18 mins"), breathalyzer, VoIP, SMS. **Not wired:** fuel voucher confirm shows a toast but never calls `issueFuelVoucher`. Trip pass date hard-coded "22 Oct 2026".

---

### MOD-10 — Geo-Fenced Mobile Attendance & Leave

**Client ask:** #11 Attendance with geofencing; #16 leave status.
**Files:** `views/AttendanceView.tsx` (447); attendance roster + leave requests in `operationsStore.ts`.

**What exists:** punch console (shift 09:00–18:00, "Punch In with Face Biometric" → 2 s fake match "99.4%" → confirm sets the real current time; punch out toast), KPIs (743/788 present, "Keraniganj Plant 500 m radius · 42 m from centre", "REAL GPS (VERIFIED) · Fake GPS blocked · Cell tower verified", ৳38,400 night-shift OT), static radar card, "Recalibrate GPS Fix" (±4.2 m → ±2.8 m), roster table (5 seeded rows + the current persona).

**Reality check:** there is **no geolocation call, no haversine function, and no radius comparison** anywhere in the codebase; the only "Haversine" is a label on the dashboard. The view does not read the store; `punchAttendance` and `addLeaveRequest` in `operationsStore` are never called from any UI. Leave requests exist only as 2 seed rows and are approved/rejected via the Approvals Center (`updateLeaveStatus`), which then marks the roster row "On Approved Leave".
**Not present:** leave application form, missed-punch regularisation, shift rosters, monthly muster export (all described in docs).

---

### MOD-11 / 12 / 13 — Travel & Expense Claims (TA/DA, Conveyance, Tour Advance)

**Client ask:** #12 TA & DA, #13 Conveyance, #14 Tour & Expense.
**Files:** `views/ClaimsView.tsx` (592), `components/claims/SubmitClaimModal.tsx` (761), `ClaimItem` + logic in `store/approvalStore.ts`.

Implemented as one claims engine with three types, exactly as the advisory recommended.

**Screens:** pills All Claims / Outstation Travel (TA/DA) / Local Travel & Taxi / Event & Dealer Meets / Allowance Policy Rates (grade table); KPIs (pending, approved, "Monthly Conveyance Limit ৳8,000 / Grade 8", "Settlement 24–48 h"); detail panel with line items and vouchers; **real CSV export** (`BOGCL_Expense_Claims_YYYY-MM-DD.csv`).

**Workflow:** `pending_hod → pending_finance → approved` (voucher `VCH-2026-#####`) or `rejected` → "Resubmit Corrected Claim" → back to `pending_hod` with a new approval item. `settled` exists in the type but is never reached. Approving from the Approvals Center jumps straight to `approved`.

**Policy constants in code**
- `GRADE_POLICY` (5 bands): Grade 1-2 actuals/৳5,000 Dhaka, ৳6,000 district, 5-star, executive car/air; Grade 3-4 ৳3,500/৳4,500, hotel ৳8,000; Grade 5-6 ৳2,500/৳3,200, ৳5,500; Grade 7-8 ৳1,500/৳2,000, ৳3,000, AC bus/1st-class train; Grade 9-10 ৳800/৳1,200, ৳1,800.
- Auto-DA: **৳1,500/day × (days between departure and return + 1)**; display mentions ৳2,000/day outside Dhaka. Personal vehicle mileage ৳18/km. Monthly conveyance ceiling ৳8,000. Cost centre `CC-BOGCL-2026`.
- Tour settlement: netSettlement = total − advance; positive "Payable to Staff", negative "Refund to Treasury".
- Approval mirror urgency: amount > ৳50,000 → critical; SLA 24 h.

**Submit modal:** 3 type cards, 4 purpose presets (Chittagong dealer inspection, Keraniganj turnaround meeting, local client visits, inter-plant cricket tournament with ৳50,000 advance), default line items (DA ৳6,000, Hotel Peninsula CTG ৳7,200 with Mushak-6.3 VAT, Shohoz AC bus ৳1,650), 9 categories, voucher chips (fake upload).
**Seed:** 4 claims (tour ৳40,500 vs ৳45,000 advance approved; sports event ৳3,62,400 pending; TA/DA ৳14,850; conveyance ৳5,420).
**Gap:** no role gating (any role can approve); the 50%/100% half-day DA rule in the docs is not implemented (flat per-day).

---

### MOD-14 — Employee Commuter Bus & FIFO Seat Waitlist

**Client ask:** #15 Bus seat reservation with first-applied priority.
**Files:** `views/BusView.tsx` (3,352 — the largest file), `components/bus/*` (7 files, 3,153 lines), `store/busStore.ts` (220).

**Screens:** perspective Staff / Supervisor (supervisor default for transport_admin); direction Morning Inbound / Evening Return; supervisor sub-tabs "10-Bus Fleet & Road Corridors" and "Interactive 52-Seat Coach & FIFO Desk"; cockpit tabs Seat Dossier / FIFO Waitlist / Route Corridors / Fleet & Crew / Shift Roster; interactive 52-seat coach layout (4 columns, 13 rows); seat filters and search.

**Model:** 10 buses (Hino, Scania, Hyundai, Ashok Leyland, Volvo, Isuzu, Mitsubishi Fuso, Mercedes Tourismo; AC classes), 10 routes with inbound/outbound stop lists, timings, km and speed (e.g. Route-1 Mirpur-10 → Farmgate → Shahbagh → Babubazar → Plant, 22.8 km); seats `occupied | vacated | empty` with category `executive | lady_priority | senior_staff | regular` and booking type `permanent | shift_pass | guest`; waitlist entries with rank and priority `Shift | Emergency | Overtime`.

**FIFO rule as coded (`handleSupervisorAutoFIFO`):** promotes min(vacated seats, waitlist length) applicants **in waitlist order** into vacated seats, marks them `isStandbyPromoted`, pickup "07:22 AM (Standby)", and re-ranks the remaining queue. Staff can release a seat (reason), reclaim it, join the waitlist (rank = length + 1), cancel, swap seats, or make a direct guest booking. The **48-hour claim window** from the docs is not implemented (promotion is immediate).
**Supervisor tools:** Register Bus, Route Builder (add/remove stops, min 2), Reserve/Vacate seat for a chosen employee, Reassign bus to route, Delay Broadcast (SMS toast), Gate Manifest (print), Conductor Scanner (boarding headcount), Timetable, Transit Rules.
**Architecture note:** `BusView` **does not use `busStore`**; it keeps local state seeded from `busData.ts`. `busStore` (with different overrides, e.g. seats for the 7 personas) is read only by the Sidebar badge. The two datasets diverge.
**Simulated:** GPS beacons, QR boarding pass, SMS.

---

### MOD-15 — Inner-Circle Leadership Communications

**Client ask:** #16 in-app messaging for the Chairman's selected group.
**Files:** `views/InnerCircleChat.tsx` (1,020), `styles/chat.css` (1,744); chat types/seed also in `operationsStore.ts` (used only by Sidebar badges).

**What exists:** 3-pane secure-chat UI — left hub ("SOVEREIGN ENCLAVE", AES-256 tag, tabs All / Channels / Direct, sections War Room Channels and Executive Hotlines), centre conversation with date divider, pinned directive, reactions, voice memos, document cards, directive acknowledgement; right drawer "Intelligence & Vault" (member dossier with status/location, pinned directives, shared encrypted vault files); call modal ("SECURE ENCRYPTED LINE #04").
**Channels:** #executive-leadership (7 members), #factory-operations, #finance-and-purchases, #permits-and-compliance (locked). **Members:** 6 with presence `online | away | in-meeting | offline` and location text (e.g. "Control Room Unit-1", "At BSTI Tejgaon Directorate", "On Approved Medical Leave").
**Composer:** directive mode (issues `BOGCL-DIR-2026-####`), urgent flag, 4 quick directive presets (Valve Overhaul Mandate, Fast-Track L/C, Emergency Board Summons, Live Telemetry Requisition), fake voice recorder.
**Reality:** purely local component state; no WebSocket; "encryption" is labelling; messages render as outgoing only when sender is chairman; date divider hard-coded "Today, 17 October 2026"; view data differs from the store's chat seed.

---

### MOD-16 — Workforce Directory & Exit Clearance

**Client ask:** implied by role-based system and asset custody; not in the original 16.
**Files:** `views/WorkforceView.tsx` (399), `components/workforce/OnboardEmployeeModal.tsx` (228), `OffboardClearanceDrawer.tsx` (410), `store/employeeStore.ts` (463).

**What exists:** tabs Active Staff / Former Staff; KPIs (active, plant team, HQ team, former); search by name/ID/SAP PERNR/designation/phone; dept and site filters; table and mobile cards; "Add New Employee" (14 fields incl. NID, blood group, emergency contact, system role) → `addEmployee` (`EMP-11xx`); off-boarding drawer with 4 clearance items (IT access, RFID gate badge, bus seat & fuel cards, finance settlement), **"Reclaim assets" calls `assetStore.reclaimEmployeeAssets`** and auto-ticks IT; finalisation blocked until all 4 are cleared; reactivate former employee.
**Seed:** 12 employees (the 7 personas + 5 others incl. 2 offboarded), each with EN/BN names.
**Gap:** no role gating at all (`role` prop unused); Chairman row shows "Executive Office" instead of actions.

---

### MOD-17 — Centralised Approvals Center & Delegation

**Client ask:** derived from "approval automation" and the advisory's shared workflow engine.
**Files:** `views/ApprovalsView.tsx` (508), `components/AuthorizeDirectiveModal.tsx` (470), `RejectionExplanationModal.tsx` (412), `store/approvalStore.ts` (901), `components/DetailDrawer.tsx` (246).

**Screens:** tabs "Actionable Pending Requests (n)" / "Approval History & Archive (n)"; category chips (Procurement & Spares, Travel & Expense Claims, Vehicle Requisitions, Staff Leave); search; KPIs (pending, total value in lakh, completed); table with select-all and **Batch Approve (n)**; expandable "Review History" trail per item; SLA badge (<12 h danger, <24 h warn).

**Model:** `ApprovalItem{category finance|procurement|fleet|leave|hr, urgency, slaHoursLeft, sapDocRef, sourceType claim|requisition|notesheet|leave|asset_req|generic, sourceId, approvalTrail[], decisionStatus}`.
**Inbound mirrors** (deduplicated by `sourceId`): `addClaim`, `addRequisitionApproval` (SLA 12), `addNotesheetApproval` (SLA 18, critical > ৳5 L), `addLeaveApproval` (SLA 24), `addAssetRequisitionApproval` (high ≥ ৳10 L).
**Outbound propagation on decision:** claim → approved + voucher / rejected; notesheet → `approveFile` / `returnFileForRevision`; requisition → `fleetStore.endorseHOD` / `rejectRequisition`; leave → `updateLeaveStatus`; asset_req → `advanceAssetRequisitionById` / `rejectAssetRequisitionById`. `syncSourceDecision` handles the reverse direction when a module decides locally.
**Delegation:** configured in `UserProfileModal` → Leave Handover (delegate, until-date, scope) and stored in `operationsStore.profilePrefs`; it is **not** used to re-route items.
**Seed:** 10 pending items (generator note-sheet ৳48.5 L SLA 6 h; forklift ৳42 L; sports claim; projector; stationery; TA/DA; conveyance; 2 pool-car requisitions; 5-day sick leave) + 1 decided.
**Defects:** history tab renders every item as "✓ Approved" regardless of `decisionStatus`; approver attribution defaults to chairman (approve) / hod (reject) regardless of the active persona; `signatureHash` and `notifySms` emitted by the modal are ignored by the view.

---

## 10. Cross-Module Integration: The Approval Hub

The prototype's strongest architectural idea is that `approvalStore` acts as the client-side stand-in for the planned workflow engine:

```
 NotesheetView ──addNotesheetApproval──►┐                      ┌──► notesheetStore.approveFile / returnFileForRevision
 ClaimsView    ──addClaim──────────────►│                      ├──► claim.status = approved (+VCH) / rejected
 FleetView     ──addRequisitionApproval─►│   approvalStore     ├──► fleetStore.endorseHOD / rejectRequisition
 (leave seed)  ──addLeaveApproval───────►│ pending → decided   ├──► operationsStore.updateLeaveStatus → roster "On Leave"
 AssetView     ──addAssetRequisitionApproval►│                 └──► assetStore.advance/rejectRequisitionById
                                         │
   ApprovalsView · ChairmanDashboard · DetailDrawer · HodDashboard  ── approve / reject / batch ──┘
   NotesheetView final sign ── syncSourceDecision ──► moves mirrored item to decided
```

Other cross-store links: `OffboardClearanceDrawer` → `assetStore.reclaimEmployeeAssets`; `IncidentView` reads `employeeStore.activeEmployees`; `Sidebar`/`MobileBottomNav`/`CommandPalette`/`NotificationCenter` read all stores for badges and search; `DriverDashboard` and `TransportAdminDashboard` mutate `fleetStore`; `BroadcastModal` → `noticeStore` → banner in `App.tsx`.

---

## 11. Design System, Theming, Localisation and Responsiveness

**Tokens (`styles/variables.css`):** crimson `#A51C30` (dark `#7F1424`, light `#C8102E`), slate scale `#060D1F`…`#F1F5F9`, canvas `#F8FAFC`, gold `#D4AF37` (dark `#AA820A`, light `#F0DFA0`), status success `#059669` / warning `#D97706` / danger `#DC2626` / info `#0284C7` / purple `#7C3AED`; radii 4–20 px; 5 shadow levels plus crimson and gold glows; sidebar 272 px, topbar 68 px; transitions 140/220 ms.

**CSS files (12,359 lines, imported in order by `index.css`):** `variables.css` 184 → `layout.css` 489 → `components.css` 3,862 → `dark.css` 787 → `modules.css` 1,364 → `chat.css` 1,744 → `fleet-chat.css` 1,185 → `responsive.css` 1,336 → `asset.css` 1,408. Many views also use large inline `style={{}}` objects.

**Dark mode:** `[data-theme="dark"]` overrides in `dark.css`; toggled from Topbar or Command Palette; not persisted.

**Localisation:** every user-facing string is written twice inline — `t('English', 'বাংলা', lang)` — and persona/employee records carry `nameBn`, `labelBn`, `deptBn`. There is no i18n framework, no message catalogue, and no number/date localisation (৳ amounts use en-IN grouping). The `lang-bn` class switches the Bengali font.

**Responsiveness:** `responsive.css` supplies breakpoints; sidebar becomes a drawer; `MobileBottomNav` appears; several views (Parcel, Guest, Claims) have explicit mobile list/detail toggles; `DriverConsole` is designed with 48 px+ touch targets. `index.html` sets `user-scalable=no` and iOS web-app meta tags.

**Accessibility:** minimal — a few `aria-label`s; no focus management in modals beyond Escape handlers.

---

## 12. Data Model Inventory

Entities defined as TypeScript interfaces (all client-side; this is the de-facto draft schema for the future database):

| Domain | Entities (interfaces) |
| :--- | :--- |
| Identity | `RoleMetaItem`, `Employee`, `ExitClearance`, `UserProfilePreferences`, `UserDeviceSession` |
| Notices | `NoticeItem`, `BroadcastPayload`, `VoiceBriefingItem` |
| Note-sheets | `NoteFile`, `NoteItem`, `SignatoryStep`, `VendorQuoteItem`, `BudgetSummaryInfo`, `DocumentData` |
| Parcels | `ParcelItem`, `CustodyLogEntry`, `ReturnDetails` |
| Assets | `AssetRecord`, `AssetLifecycleEvent`, `CustodyRecord`, `AssetSpareItem`, `AssetDisposalDossier`, `AssetWorkOrder`, `AssetRequisition`, `AssetTransfer`, `AssetFinancialMetrics`, `YearlyDepreciationRow`, `AssetRoleConfig` |
| Compliance | `LicenseCard` (+ checklist, documents), `DocVaultItem`, `AuditItem` |
| HSE | `IncidentItem`, `InvolvedPerson`, `CapaActionItem`, `FishboneFactors` |
| Guests | `VisitorRecord`, `PermittedZone`, `InspectionFindingItem` |
| Fleet | `Driver`, `Vehicle`, `VehicleRequisition`, `TripChatMessage`, `FleetNotification`, `DriverTollSlip` |
| Attendance | `ShiftWorker`, `LeaveRequestItem` |
| Claims/Approvals | `ClaimItem`, `ClaimSubmissionData`, `ApprovalItem`, `DepartmentApprovalStep` |
| Bus | `BusVehicle`, `RouteInfo`, `RouteStop`, `Seat`, `WaitlistEntry` |
| Chat | `ChatMember`, `ChatChannel`, `ChatMessage` |
| Dashboard | `ROLE_STATS`, `PENDING_APPROVALS`, `INNER_CIRCLE`, `DCS_ALARMS`, `INITIAL_LOTO_PERMITS`, `SHIFT_HANDOVER`, `INITIAL_HOD_QUEUE`, `MY_RECENT_ACTIVITY` (constants) |

Identifier conventions already established in seed data: `EMP-####`, `DRV-##`, `V-##`, `REQ-2026-###`, `PASS-2026-####`, `TOL-2026-####`, `FUEL-2026-###`, `AST-###`, `BOGCL-{SITE}-{CAT}-{n}` asset tags, `WO-2026-####`, `ARQ-2026-###`, `TRF-2026-###`, `GP-####`, `BOGCL/{DEPT}/2026/####` file numbers, `APR-…`, `VCH-2026-#####`, `TADA-/CNV-/TOUR-2026-####`, `LV-2026-###`, `INC-2026-###`, `CAPA-###`, `VIS-2026-####`, `PKG-2026-####`, `BOGCL-WB-2026-####`, `NOT-2026-###`, `BOGCL-DIR-2026-####`, `VB-2026-####`, `LOTO-###` / `HOT-###` / `CONF-###`.

---

## 13. What Is Simulated, Mocked or Cosmetic

| Claimed capability (UI text) | Actual implementation |
| :--- | :--- |
| SHA-256 tamper-evident seals (note-sheets, parcels, logs) | `Math.random()` strings prefixed `sha256:` / `VERIFIED-SIGN-`; asset event hashes use a real FNV-1a of the event text (non-cryptographic) |
| OTP delivery/verification (parcels) | Random 4-digit stored on the record; error toast reveals it; master code `1234` accepted |
| Geofence / Haversine / anti-spoof GPS | Labels only; no geolocation API call, no distance math |
| Face biometric punch-in | 2 s `setTimeout` then "99.4% match" |
| Fingerprint unlock, 4-digit lock PIN | Instant unlock; PIN `1234` |
| GPS telematics, speeds, ETAs, cargo temperature | Static numbers in seed/HUD; no map library |
| VoIP driver call, tele-conference | Timed state machine, no audio |
| Chat counterpart replies | Keyword-triggered canned replies via `setTimeout` |
| Voice memo recording | `setInterval` timer; playback uses `speechSynthesis` on the transcript (this part is real) |
| SMS / WhatsApp / push / email dispatch | Toasts |
| SAP S/4HANA / FI-AA / PM sync, ministry e-Nothi / NSW / CEMS sync | Toasts and static "Up to Date" panels |
| QR / barcode / RFID / NFC scanning | Buttons or a text-filter "scanner" modal |
| PDF generation | `window.print()` of HTML; "Download PDF" is a toast |
| AI Smart Pooling | Hard-coded merge of two requisitions |
| Breathalyzer / BRTA licence validation | Static strings |
| Login / SSO / 2-step verification | No credential check; any password works |
| Persistence | None; refresh resets everything |

---

## 14. What Is Not Built

1. **Backend / API.** `server/` is empty. No Node/NestJS, no REST or GraphQL, no OpenAPI.
2. **Database.** No PostgreSQL schema, migrations, or ORM. The ~28-table design exists only as prose in `docs/02` and `docs/06`.
3. **Authentication & authorisation.** No login verification, sessions, JWT, SSO/LDAP, MFA; no server-side permission checks; no data-scope model.
4. **Workflow engine.** No configurable templates, SLA timers, escalation, or delegation routing (the UI stores a delegation preference but never applies it).
5. **Notification service.** No in-app inbox persistence, push (FCM), SMS gateway, or email.
6. **File/document service.** No upload, storage (S3/MinIO), virus scan, versioning, or signed URLs; attachments are name strings.
7. **Audit log.** No append-only ledger; "audit trails" are arrays on in-memory records.
8. **Due-date engine / scheduler.** No cron/BullMQ; `daysLeft` are static integers.
9. **Mobile app.** No React Native project; the responsive web UI and `DriverConsole` are the mobile story so far.
10. **Real integrations.** SAP, SMS (SSL Wireless/Banglalink), GPS trackers, biometric devices, Active Directory, maps — all absent.
11. **Testing.** No unit, component, or end-to-end tests; no test runner installed.
12. **CI/CD, Docker, environments.** None.
13. **Routing & code-splitting.** No URL routing; single ~2 MB JS chunk.
14. **Admin & master data module (MOD-16 in the pitch docs).** No screens for roles/permissions, departments, locations, grades, policy tables, geofences, or system settings.
15. **Reporting/analytics.** Dashboards show fixed KPIs; no report builder or exports beyond two CSVs.

---

## 15. Known Defects and Inconsistencies

Found during verification; none block the demo but all matter for anyone extending the code.

**Architecture / data flow**
1. `BusView.tsx` ignores `busStore.ts`; `InnerCircleChat.tsx` ignores the chat data in `operationsStore.ts`; `AttendanceView.tsx` ignores attendance/leave logic in `operationsStore.ts`. Sidebar badges therefore reflect different data than the screens.
2. `ComplianceView`, `ParcelView`, `GuestView` each carry dead duplicate seed arrays (`INITIAL_LICENSES`, `INITIAL_PARCELS`, `INITIAL_VISITORS`) that differ from the store seeds actually rendered.
3. Parcel stage-advance logic is duplicated in view and store with different progress percentages.
4. `zustand` and `tailwindcss` are dependencies that are never used.

**Behavioural**
5. Note-sheet intermediate "Sign & Forward" sets the file to `approved` without advancing the signatory route.
6. Approvals history labels rejected items as "✓ Approved"; approver attribution ignores the active persona.
7. Claim state `settled` and visitor state `overdue` are unreachable.
8. Fleet fuel-voucher confirmation never calls `issueFuelVoucher`; Plant GM batch release and HR dashboard clearance card are static.
9. Identity checks are string matches on "Tanvir" / `DRV-01` / `EMP-1042`.
10. No role gating in Notesheet, Compliance, Claims, Approvals, Workforce, Inner Circle, Bus.

**Cosmetic / data**
11. Hard-coded dates conflict with `SYSTEM_TODAY = '29 Oct 2026'`: fleet trip pass "22 Oct 2026", chat divider "17 October 2026", incident sign-off "30 Oct 2026".
12. Vite warns the main chunk exceeds 500 kB (1,996 kB).
13. `tsconfig` disables `noUnusedLocals`/`noUnusedParameters`, so dead code compiles silently.

---

## 16. Documentation Inventory

| File | Size | Purpose | Reliability vs. code |
| :--- | ---: | :--- | :--- |
| `README.md` | 5 KB | Suite index, brand tokens, 16-module list | Index links use `file:///e:/…` paths for docs 01–06 (stale drive letter) |
| `initial-discussion-doc.txt` | 4 KB | Verbatim client brief | Primary source |
| `suggession-from-claude.txt` / `.docx` | 31 KB | Advisory architecture & delivery guide | Recommendations, not state |
| `docs/01_EXECUTIVE_PITCH_AND_PROJECT_DOSSIER.md` | 12 KB | Boardroom pitch, ROI, 5-phase roadmap, hosting | Aspirational |
| `docs/02_ENTERPRISE_SYSTEM_ARCHITECTURE_AND_SPECS.md` | 22 KB | Target architecture (modular monolith, engines), 16 module specs | Target state, not built |
| `docs/03_REQUIREMENTS_TRACEABILITY_LEDGER_AND_MATRIX.md` | 11 KB | 16-row RTM with triggers, rules, approvals, phase | Good requirement baseline |
| `docs/04_CLIENT_CONVERSATION_AND_DISCOVERY_PLAYBOOK.md` | 10 KB | 30-min pitch script, 6 department questionnaires, objections | Sales enablement |
| `docs/05_PROTOTYPE_BLUEPRINT_AND_DEMO_SCRIPT.md` | 9 KB | Design tokens, 6-act demo script | Matches implemented styling |
| `docs/06_ASSET_LIFETIME_TRACKING_AND_EAM_SYSTEM.md` | 27 KB | ISO 55001/14224, IAS 16, PostgreSQL DDL blueprint for assets | Closest spec-to-code match |
| `docs/06_CRITICAL_AUDIT_AND_ROAST_FLEET_SYSTEM.md` | 17 KB | Honest audit of the fleet module + remediation roadmap | Accurate; some items marked remediated |
| `docs/executive_presentation_dossier.md` | 27 KB | Persona credentials, 14-module analysis, minute-by-minute script, Q&A | Says 14 modules (pre-Asset/Guest) |
| `docs/PROJECT_MASTER_STATUS_AND_FEATURE_LEDGER.md` | 28 KB | MOD-01…17 registry, API wish-list, changelog | **Inaccurate on stack** (claims Zustand stores, Tailwind, Web Crypto SHA-256, haversine) — superseded by this report on those points |

---

## 17. Readiness Assessment

| Question | Answer |
| :--- | :--- |
| Can it be demoed to the client today? | **Yes.** Build is clean, every one of the 16 domains has a polished, bilingual, role-aware screen with realistic data, and the 6-act script in `docs/05` is fully supported. |
| Can it be piloted with real users? | **No.** No persistence, no authentication, no server. Any data entered is lost on refresh and visible to nobody else. |
| Is the UI code production-grade? | **Partially.** Strong: TypeScript types, consistent store pattern, reusable approval/rejection dialogs, design tokens. Weak: 2,000–3,400-line view files, heavy inline styles, duplicated seed data, string-matched identity, no tests, no routing. |
| Does it reflect the target architecture? | The client-side approval hub, role config in assets, and type definitions are a reasonable scaffold for the real API contracts. The planned backend engines (workflow, due-date, notifications, audit, documents) have no code yet. |
| Main risks | (1) Client may believe the simulated security features are real; (2) view files are large enough that backend wiring will require refactoring; (3) effort to go from prototype to Phase 1 production is essentially a new build of the server side plus substantial frontend refactoring. |

---

## 18. Recommended Next Steps

These follow the advisory and `docs/01` roadmap; they are recommendations, not work already done.

1. **Demo & discovery.** Run the 6-act demo; use `docs/04` questionnaires to convert each module's assumptions (approval chains, policy rates, licence list, routes) into signed requirements.
2. **Be explicit about simulations.** In the demo and SOW, label SHA-256, OTP, geofence, biometrics, SAP sync as "to be implemented in Phase N" to avoid expectation debt.
3. **Phase 1 foundation (server).** Stand up `server/` (NestJS + PostgreSQL + Redis + MinIO per `docs/02`), implement identity/RBAC-with-scope, a generic workflow engine, notifications, audit log, and master data. Derive the first schema from the interfaces in §12.
4. **Frontend hardening in parallel.** Add a router (URL per view), split each >1,500-line view into feature folders, replace inline seed arrays with API hooks, delete the unused `zustand`/`tailwindcss` dependencies or adopt them deliberately, remove dead seed arrays, fix the defects in §15, enable `noUnusedLocals`, add code-splitting.
5. **Make the stores the API boundary.** The nine stores already expose a clean method surface (Appendix B); replace their in-memory bodies with API calls while keeping hook signatures, so views change minimally.
6. **Real geofence & e-sign early.** These two are the most-questioned features in client Q&A (`docs/04` objections 2 and 4); build thin real versions (browser geolocation + server haversine; PDF + real SHA-256 + certificate page) in Phase 2.
7. **Testing & CI.** Add Vitest + React Testing Library for store logic (depreciation, FIFO, claim settlement) and Playwright for the demo script; GitHub Actions for build/lint/test.
8. **Mobile.** Decide between PWA (current responsive UI) and React Native (per the advisory) once attendance/incident/parcel offline needs are confirmed.

---

## Appendix A: Complete Source File Inventory

All paths relative to `client/src/`. Line counts measured at snapshot.

### Root (650 lines)
| File | Lines | Role |
| :--- | ---: | :--- |
| `App.tsx` | 278 | Root orchestrator, view switch, banner |
| `types.ts` | 181 | Roles, views, personas, `t()` |
| `App.css` | 158 | Legacy Vite styles |
| `main.tsx` | 19 | Entry |
| `index.css` | 14 | CSS import order |

### Views (26,429 lines)
| File | Lines | Module |
| :--- | ---: | :--- |
| `views/BusView.tsx` | 3,352 | MOD-14 |
| `views/AssetView.tsx` | 2,765 | MOD-05 |
| `views/GuestView.tsx` | 2,615 | MOD-08 |
| `views/ParcelView.tsx` | 2,276 | MOD-04 |
| `views/FleetView.tsx` | 2,204 | MOD-09 |
| `views/IncidentView.tsx` | 2,108 | MOD-07 |
| `views/ComplianceView.tsx` | 1,337 | MOD-06 |
| `views/InnerCircleChat.tsx` | 1,020 | MOD-15 |
| `views/NotesheetView.tsx` | 979 | MOD-03 |
| `views/DashboardView.tsx` | 826 | Dashboards shell |
| `views/ClaimsView.tsx` | 592 | MOD-11/12/13 |
| `views/ApprovalsView.tsx` | 508 | MOD-17 |
| `views/AttendanceView.tsx` | 447 | MOD-10 |
| `views/WorkforceView.tsx` | 399 | MOD-16 |
| `views/LoginPage.tsx` | 281 | Auth (mock) |
| `views/dashboard/PublishNoticeModal.tsx` | 1,032 | MOD-01 |
| `views/dashboard/PlantGmDashboard.tsx` | 824 | Plant GM |
| `views/dashboard/NoticeDetailModal.tsx` | 702 | MOD-01 |
| `views/dashboard/ChairmanDashboard.tsx` | 611 | MOD-02 |
| `views/dashboard/DriverDashboard.tsx` | 472 | Driver |
| `views/dashboard/dashboardData.tsx` | 395 | Constants |
| `views/dashboard/HodDashboard.tsx` | 157 | HOD |
| `views/dashboard/TransportAdminDashboard.tsx` | 147 | Transport |
| `views/dashboard/EmployeeDashboard.tsx` | 138 | Employee |
| `views/dashboard/types.ts` | 123 | Notice types |
| `views/dashboard/HrAdminDashboard.tsx` | 119 | HR |

### Components (19,227 lines)
| File | Lines |
| :--- | ---: |
| `components/asset/AssetModals.tsx` | 1,649 |
| `components/fleet/FleetChatCenter.tsx` | 1,456 |
| `components/fleet/NewRequisitionModal.tsx` | 1,211 |
| `components/notesheet/InitiateNotesheetModal.tsx` | 857 |
| `components/claims/SubmitClaimModal.tsx` | 761 |
| `components/fleet/TripChatModal.tsx` | 753 |
| `components/bus/RouteBuilderModal.tsx` | 693 |
| `components/fleet/DriverConsole.tsx` | 668 |
| `components/dashboard/SendVoiceBriefingModal.tsx` | 663 |
| `components/fleet/AssignVehicleModal.tsx` | 631 |
| `components/bus/busData.ts` | 618 |
| `components/bus/SupervisorSeatModal.tsx` | 575 |
| `components/UserProfileModal.tsx` | 557 |
| `components/dashboard/ExecutiveROIDossierModal.tsx` | 543 |
| `components/Topbar.tsx` | 471 |
| `components/AuthorizeDirectiveModal.tsx` | 470 |
| `components/Sidebar.tsx` | 468 |
| `components/bus/BusFleetOverviewGrid.tsx` | 459 |
| `components/bus/RegisterBusModal.tsx` | 441 |
| `components/fleet/EnrollDriverModal.tsx` | 430 |
| `components/RejectionExplanationModal.tsx` | 412 |
| `components/workforce/OffboardClearanceDrawer.tsx` | 410 |
| `components/fleet/RegisterVehicleModal.tsx` | 385 |
| `components/CommandPalette.tsx` | 362 |
| `components/fleet/DriverCallModal.tsx` | 343 |
| `components/NotificationCenter.tsx` | 312 |
| `components/bus/ReassignBusRouteModal.tsx` | 287 |
| `components/fleet/FleetNotificationsDrawer.tsx` | 285 |
| `components/DetailDrawer.tsx` | 246 |
| `components/workforce/OnboardEmployeeModal.tsx` | 228 |
| `components/OfficialDocumentModal.tsx` | 219 |
| `components/LockScreenModal.tsx` | 213 |
| `components/RefineryOutputChart.tsx` | 204 |
| `components/asset/AssetLifecycleStepper.tsx` | 179 |
| `components/MobileBottomNav.tsx` | 117 |
| `components/SapGatewayModal.tsx` | 108 |
| `components/BroadcastModal.tsx` | 97 |
| `components/TelemetryLoader.tsx` | 84 |
| `components/bus/busTypes.ts` | 80 |
| `components/Pagination.tsx` | 78 |
| `components/Sparkline.tsx` | 63 |
| `components/fleet/FleetTabs.tsx` | 56 |
| `components/AnimatedCounter.tsx` | 55 |
| `components/ToastManager.tsx` | 30 |

### Stores (8,382 lines) — see §6.4. Styles (12,359 lines) — see §11.

---

## Appendix B: Store API Reference

Public methods exposed by each `useXStore()` hook (verified signatures, simplified).

**`useNoticeStore`** — `notices`, `activeBroadcast`, `addNotice(notice)`, `addBroadcast({title, body, requireAck, sendSms, author?, authorRole?})`, `dismissActiveBroadcast()`, `acknowledgeNotice(id)`, `togglePin(id)`.

**`useVoiceBriefingStore`** — `activeBriefing`, `isPlaying`, `setIsPlaying(bool)`, `publishBriefing(item)`, `clearBriefing()`.

**`useNotesheetStore`** — `files`, `getFileByIdOrNo(idOrNo)`, `addFile(file)`, `appendNote(fileId, note, nextStatus?)`, `approveFile({fileIdOrNo, actorName, actorRoleTitle, actorDept, actorRole, remark?, stampCode?})`, `returnFileForRevision({fileIdOrNo, actor…, reasonCategory, observation, improvementsRequired})`.

**`useApprovalStore`** — `claims`, `approvalItems`, `decidedItems`, `addClaim(data)`, `addRequisitionApproval(reqId, requester, dept, from, to, purpose)`, `addNotesheetApproval(fileNo, title, initiator, dept, amount)`, `addLeaveApproval(leaveId, name, designation, dept, type, days, reason)`, `addAssetRequisitionApproval(reqId, reqNumber, title, requester, dept, costBdt, justification)`, `syncSourceDecision(sourceId, decision, actorName, note)`, `approveApprovalItem(id, directive, authorizerRole?)`, `rejectApprovalItem(id, reason, observation, improvements, reviewerName, reviewerRole?)`, `rejectClaim(id, …)`, `resubmitClaim(id, notes?)`, `batchApproveItems(ids, role?)`, `updateClaimStatus(id, status, sapVoucher?, actorName?)`.

**`useFleetStore`** — `drivers`, `vehicles`, `requisitions`, `driverTollSlips`, `getChatMessages(reqId?)`, `getNotifications(role?)`, `addRequisition(req)`, `assignRequisition(reqId, plate, driverId)`, `startTrip(reqId, startKm, gateOutTime)`, `completeTrip(reqId, endKm, gateInTime, rating?, feedback?)`, `rejectRequisition(reqId, reason)`, `endorseHOD(reqId, status, reason?)`, `poolRequisitions(primary, secondary, plate, driverId)`, `issueFuelVoucher(plate, liters, station)`, `submitDriverTollClaim(reqId, driver, plaza, amount)`, `addVehicle(v)`, `addDriver(d)`, `retireVehicle(plate)`, `updateVehicleStatus(plate, status, details?)`, `updateDriverStatus(id, status, reason?, until?)`, `sendChatMessage(...)`, `approveTollExpense(messageId, reqId, approvedBy?)`, `addNotification(n)`, `markNotificationRead(id)`, `markAllNotificationsRead(role?)`, `addTollExpense(reqId, name, amount, receiptNo)`, `recordBreathalyzer(driverId, result)`.

**`useAssetStore`** — `assets`, `workOrders`, `requisitions`, `transfers`, `registerAsset(input)`, `acknowledgeCustody(id, …)`, `initiateTransfer(…)`, `completeTransfer(…)`, `reclaimEmployeeAssets(empId, name, actor)`, `createWorkOrder(…)`, `completeWorkOrder(…)`, `certifyAssetDirect(…)`, `flagAssetDeficiency(…)`, `consumeSparePart(…)`, `restockSparePart(…)`, `changeDepreciationMethod(…)`, `submitRequisition(…)`, `advanceRequisition(…)`, `rejectRequisition(…)`, `initiateDecommissioning(…)`, `toggleDisposalChecklistItem(…)`, `finalizeDisposalAndArchive(…)`; helpers `getAssetRoleConfig(role)`, `calculateAssetFinancials(asset)`, `buildDepreciationSchedule(asset)`, `advanceAssetRequisitionById`, `rejectAssetRequisitionById`.

**`useOperationsStore`** — `licenses`, `incidents`, `parcels`, `visitors`, `attendanceRoster`, `leaveRequests`, `chatChannels`, `chatMembers`, `chatMessages`, `profilePrefs`; `setLicenses`, `setIncidents`, `addIncident`, `updateIncident`, `advanceIncidentStatus`, `addCapaItem`, `toggleCapaStatus`, `closeIncidentWithSignOff`, `setParcels`, `advanceParcelStage`, `setVisitors`, `punchAttendance(role, 'in'|'out', site?)`, `addLeaveRequest`, `updateLeaveStatus`, `markConversationRead`, `setChatMessages`, `updateProfilePrefs`, `revokeSession`.

**`useEmployeeStore`** — `employees`, `activeEmployees`, `offboardedEmployees`, `addEmployee`, `updateEmployee`, `initiateOffboarding`, `updateClearanceItem`, `finalizeOffboarding`, `reactivateEmployee`; helpers `getEmployeesSnapshot()`, `resolveManagerName(ref)`.

**`useBusStore`** — `buses`, `routes`, `routeSeats`, `waitlist`, `delayBroadcast`; `setBuses`, `setRoutes`, `setRouteSeats`, `setSeatsForRoute`, `setWaitlist`, `setDelayBroadcast`.

---

## Appendix C: Glossary of Domain Terms

| Term | Meaning in this project |
| :--- | :--- |
| **BOGCL** | Bashundhara Oil and Gas Company Limited, the client |
| **OneOps** | Product name of the portal |
| **e-Nothi** | Bangladesh government electronic file/note-sheet system; the cultural model for MOD-03 |
| **Note-sheet** | Internal memo with numbered paragraphs that moves up a signatory chain |
| **BSTI** | Bangladesh Standards and Testing Institution (product certification, metrology) |
| **DoE** | Department of Explosives (petroleum/LPG storage licences) — also used for Department of Environment in some texts |
| **FSCD** | Fire Service & Civil Defence |
| **BIWTA / BRTA** | Inland Water Transport Authority / Road Transport Authority (vehicle fitness, licences) |
| **BPC / EMRD** | Bangladesh Petroleum Corporation / Energy & Mineral Resources Division (import quotas) |
| **CEMS** | Continuous Emission Monitoring System |
| **LOTO** | Lock-Out / Tag-Out safety isolation permit (OSHA 1910.147) |
| **CAPA** | Corrective and Preventive Action |
| **TRIR / LTI** | Total Recordable Incident Rate / Lost-Time Injury |
| **5-Whys / Ishikawa 6M** | Root-cause analysis methods |
| **ISO 55001 / 14224** | Asset management / reliability data standards |
| **IAS 16** | Accounting standard for property, plant and equipment (depreciation) |
| **SLM / WDV / UOP** | Straight-line / Written-down value / Units-of-production depreciation |
| **NBV / TCO / MTBF / MTTR** | Net book value / Total cost of ownership / Mean time between failures / Mean time to repair |
| **SAP FI-AA / PM / S/4HANA** | SAP asset accounting, plant maintenance, ERP — referenced as future integration |
| **TA / DA** | Travel Allowance / Daily Allowance |
| **Conveyance** | Local travel reimbursement (rickshaw, CNG auto, ride-share) |
| **Mushak-6.3** | Bangladesh VAT invoice form |
| **BEFTN** | Bangladesh Electronic Funds Transfer Network |
| **L/C** | Letter of Credit |
| **Chalan** | Treasury payment slip |
| **DO Letter** | Demi-official letter to a ministry |
| **ANPR / ALPR** | Automatic number-plate recognition |
| **RTO** | Return to origin (parcel) |
| **FIFO waitlist** | First-in, first-out queue for bus seats |
| **HOD** | Head of Department |
| **PERNR** | SAP personnel number |
| **৳ / Lakh / Crore** | Bangladeshi Taka; 1 lakh = 100,000; 1 crore = 10,000,000 |

---

*End of report.*
