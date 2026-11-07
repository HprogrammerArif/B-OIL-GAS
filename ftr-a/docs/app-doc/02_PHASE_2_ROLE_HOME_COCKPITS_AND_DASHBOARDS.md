# 02 — Phase 2: Role Home Cockpits & Executive Modals (All 7 Personas)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Over-Simplified `HomeScreen` (`lib/features/home/presentation/home_screen.dart`)**:
   - Currently, `HomeScreen` renders a single sentence, 3 plain list rows (`_topItems`), and 3 static shortcut tiles (`_shortcuts`).
2. **Dead `DashboardScreen` (`lib/features/dashboards/presentation/dashboard_screen.dart`)**:
   - Contains KPI cards and role rows from `dashboard_engine.dart`, but `/home/dashboards` in `router.dart` redirects to `/home`, so `DashboardScreen` is never shown.
3. **Missing Role-Specific Interactive Workflows from Web (`client/src/views/DashboardView.tsx` & `views/dashboard/*`)**:
   - **Chairman (`EMP-0001`)**: Missing the `Send Voice Briefing` recorder/player bar (`VoiceBriefingBar`), Inner-Circle live presence roster, and inline Notice broadcast composer.
   - **Plant GM (`EMP-0012`)**: Missing the `Release Bitumen Batch` header CTA & BDS 1238:2020 laboratory verification modal (`BOGCL-BIT-2026-B88`), Refinery Output vs Target chart, and interactive LOTO (Lock-Out / Tag-Out) permit lock/restore controls.
   - **HR Admin (`EMP-0028`)**: Missing the inline 7-Desk Exit Clearance progress list and HQ vs Keraniganj Plant headcount breakdown.
   - **Transport Admin (`EMP-0045`)**: Missing the inline Pending Vehicle Requisition dispatch queue and Live Dhaka–Keraniganj Corridor trip tracker.
   - **HOD Finance (`EMP-0062`)**: Missing the Department Quarterly Budget Ceiling utilization card (`BDT 4.50 Cr` ceiling, used vs remaining) and inline multi-select batch approve queue.
   - **Employee (`EMP-1042`)**: Missing the `Digital Gate Pass` QR Employee Identity modal, status-aware 5 daily action tiles, active car trip tracker card, and cross-module activity feed.
   - **Driver (`EMP-0821`)**: Missing the Pre-Trip Vehicle & Licence Readiness strip, Active Mission Console (start/complete trip with odometer entry, notify passenger arrival in chat, call passenger), Toll Slips logger, and `Emergency SOS` button.

---

## 2. Unified Mobile Cockpit Layout on `/home`

Every persona's `HomeScreen` follows a consistent, low-cognitive-load 4-block vertical structure:

1. **Block A — Clean Greeting AppBar & Primary Role CTA**:
   - Top `AppBar` shows only the time-of-day greeting (`Good morning/afternoon/evening, <Name>`), designation subtitle, and notification bell.
   - **No search bar and no context pills** (`Site`, `Department`, `EMP-xxxx`) are rendered below the greeting for any user.
   - **Role-Specific Action Button** (where applicable: `Voice Briefing` for Chairman, `Release Bitumen Batch` for Plant GM, `Digital Gate Pass` for Employee, `Emergency SOS` for Driver).
2. **Block B — "Needs Your Attention" Banner (`NeedsYouCard`)**:
   - A single high-contrast card showing the #1 urgent item for this persona right now, with a 1-tap `Review` / `Act Now` button.
3. **Block C — 2×2 Interactive KPI Grid**:
   - 4 clean metric tiles (Value, Label, Plain-Language Context Subtitle). Tapping any KPI tile either switches the active sub-tab below or navigates directly to the filtered module.
4. **Block D — Role Sub-Tabs (Segmented Pill Bar)**:
   - 2 to 4 simple sub-tabs tailored to the persona's daily workflow (avoiding endless vertical scrolling).

---

## 3. Detailed Specification for Each of the 7 Role Cockpits

### 3.1 Chairman & MD Cockpit (`chairman` — `EMP-0001`)
*Reference: `client/src/views/dashboard/ChairmanDashboard.tsx` & `DashboardView.tsx`*

- **Header CTA**: `Send Voice Briefing` button -> Toggles the **Executive Voice Briefing Bar** at the top of the screen:
  - Play/Pause existing recorded briefing (`0:42` duration, waveform progress bar, transcript preview: *"Prioritize Keraniganj Vacuum Distillation Unit valve overhaul and clear pending BSTI renewal challans before Thursday"*).
  - `Record New Briefing` toggle with live simulated recording timer (`00:01...`) and `Broadcast to Inner Circle` action.
- **2×2 KPI Grid**:
  1. `Awaiting My E-Sign` (count + total BDT value) -> selects `Approvals` sub-tab.
  2. `Refinery Output` (`1,420 MT/day` · `94.6% of target`) -> opens Plant summary sheet.
  3. `Statutory Compliance` (`96% Valid` · `2 renewals in progress`) -> opens `MOD-06 Licences`.
  4. `Active Workforce` (`412 On Site` · `HQ + Keraniganj`) -> opens `MOD-16 People`.
- **Sub-Tabs**:
  - **Tab 1: `Overview`** — Top high-value Note-Sheets awaiting Chairman signature (with 1-tap `Quick Sign` or `Open File`) + Refinery vs Commercial health summary card.
  - **Tab 2: `Files to Sign`** — Inline queue of all Chairman-level approvals (`MOD-17` / `MOD-03`) with 1-tap `Approve` or `Return with Query`.
  - **Tab 3: `Inner Circle`** — Live presence cards of the 6 key executives (`Engr. Harunur Rashid - On Site at Plant`, `Sayeda Afroza - Online at HQ`, `Farida Begum - In Finance Review`, etc.) with 1-tap `Send Directive` or `Open Chat`.
  - **Tab 4: `Notices`** — Recent official notices (`MOD-01`) + 1-tap `Broadcast Chairman Notice` bottom sheet (Title, Category, Priority, Target Audience: `All Sites` / `HQ Only` / `Plant Only`).

---

### 3.2 Plant GM Cockpit (`plant_gm` — `EMP-0012`)
*Reference: `client/src/views/dashboard/PlantGmDashboard.tsx` & `DashboardView.tsx`*

- **Header CTA**: `Release Bitumen Batch` (`BOGCL-BIT-2026-B88`) -> Opens the **Bitumen Batch Release Verification Sheet**:
  - Displays Batch ID (`BOGCL-BIT-2026-B88`), Grade (`Penetration Grade 60/70`), Quantity (`450 MT`), Destination (`RHD Highway Project Depot`), and **BDS 1238:2020 Lab Test Table**:
    - Penetration at 25°C (`64 dmm` — Spec `60–70` · `PASS`)
    - Softening Point (`49.5 °C` — Spec `46–54` · `PASS`)
    - Ductility at 25°C (`>100 cm` — Spec `Min 100` · `PASS`)
    - Flash Point (`268 °C` — Spec `Min 230` · `PASS`)
  - Interactive checkbox: *"I confirm QC Certificate #QC-2026-884 meets BDS 1238:2020 standards"* + `Authorize Commercial Dispatch` button -> Marks batch `RELEASED` and logs audit timestamp.
- **2×2 KPI Grid**:
  1. `Bitumen Output` (`1,420 MT` · `Grade 60/70 & 80/100`)
  2. `Days Since LTI` (`418 Days` · `Zero lost-time injuries`)
  3. `Active LOTO Permits` (live count of locked equipment units)
  4. `Open Work Orders` (count of critical/open EAM maintenance orders)
- **Sub-Tabs**:
  - **Tab 1: `Refinery Output`** — Visual bar/progress comparison across Plant Units (`Crude Distillation Unit - 96%`, `Vacuum Distillation Unit - 91%`, `Bitumen Blowing Unit - 98%`, `Polymer Modified Bitumen - 88%`) + Batch Release status card.
  - **Tab 2: `Safety & LOTO Permits`** — List of active Lock-Out / Tag-Out isolation permits at Keraniganj (`LOTO-2026-01: VDU Charge Pump P-204A`, `LOTO-2026-02: Bitumen Storage Tank TK-108 Heater`, `LOTO-2026-03: Nitrogen Purge Line B`) with 1-tap `Verify Isolation & Lock` / `Restore to Service` toggle and audit log.

---

### 3.3 HR & Admin GM Cockpit (`hr_admin` — `EMP-0028`)
*Reference: `client/src/views/dashboard/HrAdminDashboard.tsx`*

- **2×2 KPI Grid**:
  1. `Present Today` (count + attendance % across HQ & Plant) -> opens `MOD-10 Attendance`.
  2. `Pending Leave / Reg.` (count awaiting HR/HOD action) -> opens `MOD-10 Leave`.
  3. `Active Exit Clearances` (count of offboarding employees in progress).
  4. `Open Visitor Passes` (guests currently on site across HQ & Plant).
- **Sub-Tabs**:
  - **Tab 1: `Exit Clearances`** — Cards for employees currently in offboarding showing their **7-Department Clearance Progress Bar** (e.g., `5 of 7 desks cleared`) + 1-tap `Open Clearance Checklist` (links directly to the `MOD-16` 7-desk clearance drawer).
  - **Tab 2: `Sites & Headcount`** — Side-by-side breakdown of **Head Office (Baridhara)** vs **Keraniganj Refinery Plant** showing Total Staff, On Duty Today, On Leave, Outside Geofence Punch-ins, and 1-tap `Onboard New Employee` button.

---

### 3.4 Transport & Logistics Supervisor Cockpit (`transport_admin` — `EMP-0045`)
*Reference: `client/src/views/dashboard/TransportAdminDashboard.tsx`*

- **2×2 KPI Grid**:
  1. `Pending Car Requests` (count awaiting vehicle/driver assignment).
  2. `Available Pool Cars` (available vs total fleet).
  3. `Drivers On Duty` (breathalyzer-cleared drivers ready for dispatch).
  4. `Shuttle Occupancy` (`88% Avg` across 10 staff shuttle buses).
- **Sub-Tabs**:
  - **Tab 1: `Dispatch Queue`** — Pending approved vehicle requisitions with 1-tap `Assign Vehicle & Driver` button (opens assignment sheet right from Home) and **Smart Pooling Alert** when two trips share the Dhaka–Keraniganj corridor within 30 minutes.
  - **Tab 2: `Live Corridor Trips`** — Real-time cards of vehicles currently in transit between Baridhara HQ and Keraniganj Refinery showing Driver, Passenger, Vehicle Plate, Route Progress Bar (`65%`), and 1-tap `Contact Driver`.

---

### 3.5 HOD Finance & Approver Cockpit (`hod` — `EMP-0062`)
*Reference: `client/src/views/dashboard/HodDashboard.tsx`*

- **Department Quarterly Budget Ceiling Card (`DEPT_BUDGET`)**:
  - Prominent visual card showing:
    - Fiscal Quarter: `Q4 FY 2025–26 · Finance & Commercial`
    - Total Allocation: `BDT 4,50,00,000` (`4.50 Cr`)
    - Committed / Spent: `BDT 3,12,50,000` (`69.4%`)
    - Pending in Queue: dynamically calculated sum of pending approvals (`BDT xx,xx,xxx`)
    - Remaining Available Ceiling: `BDT 1,37,50,000` with segmented color progress bar (`Spent` + `Pending Queue` + `Available`).
- **Inline Multi-Select Approval Queue**:
  - Filterable by `All`, `Note-Sheets`, `Expense Claims`, `Statutory Fees`, `Team Leave`.
  - Checkboxes on each row + sticky `Approve Selected (N)` bar for instant batch sign-off, or tap any item for full detail / structured return query.

---

### 3.6 Employee Daily Workspace (`employee` — `EMP-1042`)
*Reference: `client/src/views/dashboard/EmployeeDashboard.tsx`*

- **Header CTA**: `Digital Gate Pass` -> Opens the **Employee Digital Identity & Turnstile QR Sheet**:
  - Employee photo/avatar, Name (`Tanvir Ahmed`), ID (`EMP-1042`), SAP PERNR (`00104288`), Designation (`Senior Sales Officer`), Blood Group (`O+`), Authorized Sites (`Baridhara HQ — Full Access`, `Keraniganj Admin Block — Green Zone`), high-contrast scannable QR code, and live validity timestamp.
- **5 Status-Aware Daily Action Tiles**:
  1. **My Attendance** — Shows live status (`Punched in 08:54 AM · HQ Baridhara` or `Not punched in yet`) -> opens `MOD-10`.
  2. **Book Company Car** — Shows active trip (`Dhaka Metro-Ga-18-4421 assigned` or `Request pool car`) -> opens `MOD-09`.
  3. **Staff Shuttle Bus** — Shows assigned seat (`Bus #03 · Route R-01 Uttara · Seat 4A`) -> opens `MOD-14`.
  4. **My Expense Claims** — Shows open claim status (`2 open · BDT 14,500`) -> opens `MOD-11`.
  5. **My Leave Balance** — Shows remaining days (`10 Casual · 14 Sick · 20 Earned`) -> opens `MOD-10 Leave`.
- **Active Trip & Recent Activity Feed**:
  - If the employee has an active/upcoming car requisition or parcel arriving today, displays a live status card above their recent cross-module activity timeline.

---

### 3.7 Company Driver Console (`driver` — `EMP-0821`)
*Reference: `client/src/views/dashboard/DriverDashboard.tsx`*

- **Header CTA**: `Emergency SOS` button (red pill) -> Opens **Driver Emergency & Breakdown Alert Sheet** (1-tap `Report Breakdown on Corridor`, `Medical / Accident SOS`, `Security Gate Assistance` -> broadcasts urgent alert to Transport Admin & Security).
- **Pre-Trip Vehicle & Licence Readiness Card**:
  - Assigned Vehicle: `Toyota Corolla Cross · Dhaka Metro-Ga-18-4421`
  - Fuel Level: `78%` (visual bar) · Next Service: `1,420 km left`
  - BRTA Licence: `DL-0821-DHAKA · Valid` · Breathalyzer Today: `PASSED (0.00% BAC)` · Rating: `4.9 ★`
- **Sub-Tabs**:
  - **Tab 1: `Active Mission`** — Shows current assigned trip (`REQ-2026-089 · Tanvir Ahmed · HQ Baridhara -> Keraniganj Refinery -> Motijheel`):
    - **Step 1 (`ASSIGNED`)**: `Notify Passenger: Car at Gate` button (sends chat alert) + `Start Trip (Enter Start Odometer)` button -> opens odometer modal (pre-filled with current vehicle km `48,210 km`).
    - **Step 2 (`IN_PROGRESS`)**: Live route stops checklist + `Call Passenger` button + `Complete Trip (Enter Closing Odometer)` button -> validates `closingKm > startKm`, calculates trip distance (`24 km`), and completes mission.
  - **Tab 2: `Toll & Parking Slips`** — List of today's bridge/flyover toll slips (`Buriganga Postogola Bridge — BDT 100`, `Mayor Hanif Flyover — BDT 85`) + `Log New Toll Slip` bottom sheet (Bridge/Plaza preset chips, Amount BDT, Trip Ref, Receipt Photo tag).

---

## 4. Files to Modify in Phase 2 (During Execution)

- `ftr-a/lib/features/home/presentation/home_screen.dart` & `home_role_panel.dart` — Transform into the 7-Role Cockpit with sub-tabs and role header CTAs.
- `ftr-a/lib/features/home/presentation/widgets/` (new clean sub-widgets per role group):
  - `chairman_cockpit.dart` (including `VoiceBriefingBar` & `BroadcastNoticeSheet`)
  - `plant_gm_cockpit.dart` (including `BitumenBatchReleaseSheet` & `LotoPermitList`)
  - `hr_transport_hod_cockpit.dart` (including `HodBudgetCeilingCard`, `HrExitClearancePreview`, `TransportCorridorPreview`)
  - `employee_cockpit.dart` (including `DigitalGatePassSheet`)
  - `driver_cockpit.dart` (including `DriverMissionCard`, `OdometerEntrySheet`, `TollSlipSheet`, `DriverSosSheet`)
- `ftr-a/lib/mock/engines/dashboard_engine.dart` — Supply full state and mutation endpoints for bitumen batch release, LOTO toggle, voice briefing state, driver odometer start/complete, and toll slip creation.

