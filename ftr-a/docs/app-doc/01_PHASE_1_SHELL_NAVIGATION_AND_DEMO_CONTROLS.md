# 01 — Phase 1: App Shell, Navigation & 1-Tap Pitch Demo Controls

## 1. Current State & What Is Broken in `ftr-a/`

1. **Hidden Persona Switcher (`lib/features/more/presentation/more_screen.dart:47`)**:
   - Currently, switching between the 7 personas requires navigating to the `More` tab, scrolling to the bottom, and tapping the version string **7 times in a row** (`_versionTapCount >= 7`). During a live client pitch to BOGCL management, this is slow and error-prone.
2. **Orphaned Dashboard Route (`lib/app/router.dart:228-230`)**:
   - `/home/dashboards` immediately redirects to `/home`, leaving `lib/features/dashboards/presentation/dashboard_screen.dart` completely unreachable.
3. **Cramped / Flat `MoreScreen` (`lib/features/more/presentation/more_screen.dart`)**:
   - Modules are listed without clear operational grouping, badge counters, or role-based explanation of why each module is visible.
4. **Incomplete Cross-Module State Sync in `MockDatabase`**:
   - In `client/src/views/ApprovalsView.tsx`, approving or returning an item in the Approvals Center immediately updates the corresponding Note-Sheet (`MOD-03`), Expense Claim (`MOD-11`), Leave Request (`MOD-10`), or Vehicle Requisition (`MOD-09`). In `ftr-a/`, several engines mutate only their own collection without synchronizing the linked source record or updating notification/pending counters.

---

## 2. Phase 1 Deliverables & Exact Specifications

### 2.1 Clean Enterprise Sign-In Role Selection (No Signed-In Pitch Leftovers)

- **Where**: Exclusively on `LoginScreen` (`lib/features/auth/presentation/login_screen.dart`).
- **Visual Design (Clean Production App)**:
  - No `RolePill`, pitch persona switcher, or search icon appears in `AppBarActions` or `MoreScreen` while signed in; the top `AppBar` displays only the notification bell and unread badge.
  - On `MoreScreen`, the top card is a clean **Employee Identity Card** showing the employee's avatar, full name, employee code, designation, department, and site.
  - Users switch roles by signing out (`Sign Out` on `MoreScreen`). The login page is a staff form (email or employee ID, password, remember me). Demo roles sit in a pill strip under that form and can be removed without changing the form.

---

### 2.2 Role-Tailored Bottom Navigation Bar (5 Tabs Max)

Keep the bottom navigation bar in `lib/app/modules.dart` (`primaryModulesForRole`) limited to **4 primary daily tabs + `More`** so labels never truncate on small phones:

| Persona (`Role`) | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`chairman`** | `Home` (Executive Cockpit) | `Approvals` (with pending badge) | `Note-Sheets` | `Inner Circle` (Chat & Directives) | `More` (All Modules) |
| **`plant_gm`** | `Home` (Refinery Cockpit) | `Approvals` (with pending badge) | `Incidents` (HSE & CAPA) | `Assets` (EAM & Work Orders) | `More` (All Modules) |
| **`hr_admin`** | `Home` (HR Cockpit) | `Attendance` (Shift & Leave) | `People` (Onboard & Exit) | `Approvals` (with pending badge) | `More` (All Modules) |
| **`transport_admin`** | `Home` (Dispatch Cockpit) | `Fleet` (Cars, Drivers, Fuel) | `Shuttle Bus` (10-Bus & 52-Seat) | `Parcels` (Corridor Mail) | `More` (All Modules) |
| **`hod`** | `Home` (Finance & Budget) | `Approvals` (with pending badge) | `Note-Sheets` | `Claims` (Verify & SAP Voucher) | `More` (All Modules) |
| **`employee`** | `Home` (My Workspace) | `Attendance` (Punch & Leave) | `Fleet` (Book Car) | `Claims` (My Expenses) | `More` (All Modules) |
| **`driver`** | `Home` (Mission & Toll Console) | `Fleet` (My Trips & Pass) | `Parcels` (Pouch Handover) | `Attendance` (My Shift) | `More` (All Modules) |

---

### 2.3 Categorized `MoreScreen` Hub (Zero Hidden Modules)

Replace the flat list in `lib/features/more/presentation/more_screen.dart` with **5 clear B2B Operational Sections** matching the web sidebar (`client/src/components/layout/Sidebar.tsx`), filtered by `visibleModulesForRole(role)`:

1. **Governance & Finance**
   - `MOD-17` Approvals Center *(shows live pending count badge)*
   - `MOD-03` Note-Sheets & E-Sign *(shows awaiting-my-signature badge)*
   - `MOD-06` Licences & Statutory Compliance *(shows expiring/renewal-stage badge)*
   - `MOD-11` Expense & Travel Claims *(shows awaiting-action badge)*
2. **My Daily Work & HR**
   - `MOD-10` Attendance & Leave *(unified Shift Punch + Geofence Map + Leave)*
   - `MOD-16` Workforce Directory & Exit Clearance *(HR/HOD/GM/Chairman)*
   - `MOD-01` Official Notices & Circulars
3. **Transport & Commute**
   - `MOD-09` Fleet, Pool Cars & Driver Console
   - `MOD-14` Staff Shuttle Bus (52-Seat Deck & 10-Bus Fleet)
4. **Site Operations & Security**
   - `MOD-04` Office Mail & Inter-Site Parcels
   - `MOD-08` Visitor Gate Passes & Plant Access
5. **Refinery Safety, Assets & Executive Comms**
   - `MOD-07` HSE Safety & Incident Reports
   - `MOD-05` Enterprise Assets (EAM & Calibration)
   - `MOD-15` Inner-Circle Leadership Chat & Directives

> [!IMPORTANT]
> **Unified Attendance & Leave Route**: In `lib/app/modules.dart` and `lib/app/router.dart`, tapping either `/more/leave` or `/attendance` opens the unified **Attendance & Leave Workspace** (with `My Shift & Leave` and `Team Roster & Leave` tabs), ensuring `Leave` is never buried or disconnected from `Attendance`.

---

### 2.4 Unified Cross-Engine Synchronization (`lib/mock/mock_database.dart`)

To match the web prototype's reactive stores (`useNotesheetStore`, `useApprovalStore`, `useFleetStore`, `useParcelStore`), implement a central helper in `MockDatabase` / engines so that:

1. **Approvals <-> Source Module Sync (`approvals_engine.dart`)**:
   - When an approval item (`APR-xxxx`) is **Approved** or **Returned/Rejected**:
     - If `category == 'NOTESHEET'`, update the matching `noteSheets` item status (`APPROVED` or `RETURNED`), append the sign-off/return entry to `workflowSteps`, and record `returnReasonCategory` + `improvementsRequired`.
     - If `category == 'CLAIM'`, update the matching `claims` item (`VERIFIED` or `APPROVED` or `RETURNED`) and generate the SAP voucher number (`SAP-2026-xxxx`) on Finance approval.
     - If `category == 'LEAVE'`, update the matching `leaves` item (`APPROVED` or `REJECTED`) and decrement the employee's leave balance on approval.
     - If `category == 'REQUISITION'`, update the matching `fleetRequisitions` item (`APPROVED_PENDING_DISPATCH` or `REJECTED`).
2. **Compliance DO Letter -> Parcel Auto-Creation (`licences_engine.dart` -> `parcels_engine.dart`)**:
   - When a user dispatches a Statutory DO Letter via **Courier** in `MOD-06` (`Licences`), automatically create a new high-priority `CONFIDENTIAL` parcel in `db.parcels` (`MOD-04`) addressed to the regulatory agency (`BSTI` / `DoE` / `Department of Explosives` / `Energy Division`) and return the tracking ID (`PCL-2026-xxxx`).
3. **Workforce Offboarding <-> Asset Custody Check (`workforce_engine.dart` <-> `assets_engine.dart`)**:
   - When opening an employee's 7-Department Exit Clearance drawer in `MOD-16`, query `db.assets` for any assets still assigned to that employee's ID and display them as an explicit clearance requirement on the `IT & Systems` / `Admin & Facilities` desks.

---

## 3. Files to Modify in Phase 1 (During Execution)

- `ftr-a/lib/app/shell_scaffold.dart` — Add top bar Role Pill & 1-tap `showPersonaSwitcherSheet`, live pending badges on bottom nav items.
- `ftr-a/lib/features/more/presentation/more_screen.dart` — Replace flat list with 5 categorized B2B sections + top Persona Switcher card + Demo Controls strip.
- `ftr-a/lib/app/modules.dart` & `ftr-a/lib/app/router.dart` — Align bottom nav tabs per persona, unify `/home/dashboards` into `/home`, and link `/more/leave` directly into the unified Attendance & Leave screen.
- `ftr-a/lib/mock/engines/approvals_engine.dart`, `note_sheets_engine.dart`, `claims_engine.dart`, `leave_engine.dart`, `fleet_engine.dart`, `licences_engine.dart` — Wire bidirectional state synchronization.

