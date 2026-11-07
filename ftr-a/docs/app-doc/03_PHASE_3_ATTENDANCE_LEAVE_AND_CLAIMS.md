# 03 — Phase 3: Employee Daily Work (Attendance, Geofence Mini-Map, Leave & Claims)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Fragmented Attendance & Leave (`lib/features/attendance/` vs `lib/features/leave/`)**:
   - In the web prototype (`client/src/views/AttendanceView.tsx`), **Daily Attendance & Leave** is a single, unified workspace where employees see their shift punch console alongside their leave balances and requests, and supervisors see team attendance alongside team leave requests.
   - In `ftr-a/`, Attendance (`attendance_screen.dart`) and Leave (`leave_screen.dart`) are split into two disconnected modules, and Leave is buried inside `MoreScreen`.
2. **Missing Visual Geofence Mini-Map (`GeofenceMiniMap`)**:
   - When an employee punches in (or is about to punch in), `attendance_screen.dart` only prints text (`"Outside geofence"` or `"Inside geofence"`). It lacks the visual **Geofence Mini-Map Schematic** showing **where the employee is right now** relative to **Head Office, Baridhara (300 m radius)** and **Keraniganj Refinery Plant (500 m radius)**.
3. **Incomplete Expense Claims Workflow (`lib/features/claims/presentation/claims_screen.dart`)**:
   - Missing the **Grade 1–10 Allowance Entitlement Policy** reference sheet (`client/src/views/ClaimsView.tsx`), the 3-step distinction between **HOD Verify & Forward** -> **Finance Approve (generates SAP Voucher `#SAP-2026-xxxx`)** -> **Finance Mark Paid (Settle)**, and the **Claimant 1-Tap Fix & Resubmit** flow when a claim is returned with a query.

---

## 2. MOD-10: Unified Daily Attendance & Leave Specification

*Reference: `client/src/views/AttendanceView.tsx`*

### 2.1 Top-Level Structure & Verdict Banner
- **Plain-Language Verdict Banner** at top of screen:
  - *Before punch-in*: `"You have not punched in yet today. Shift: General (09:00 AM – 06:00 PM)."`
  - *After punch-in inside gate*: `"You punched in at 08:54 AM at Head Office, Baridhara (110 m from gate). Punch out when your shift ends."`
  - *After punch-in outside geofence*: `"You punched in at 10:56 AM (4.2 km from Head Office). Outside-geofence check-in is pending supervisor confirmation."`
- **Role-Aware Top Segmented Tabs**:
  - For all employees:
    - **Tab 1: `My Shift & Punch`** (Shift console + Geofence Mini-Map + Attendance History & Regularisation)
    - **Tab 2: `My Leave`** (3 Leave Balance Cards + Request Leave CTA + My Leave Applications)
  - Additional tab visible for `hod`, `hr_admin`, `plant_gm`, `chairman`:
    - **Tab 3: `Team Roster & Leave`** (4 Team KPIs + Filterable Live Staff Roster + Pending Team Regularisations & Leave Approvals)

---

### 2.2 The Geofence Mini-Map Visualization (`GeofenceMiniMap` Widget)

Inside the **My Shift Card** (directly above the `Punch In` / `Punch Out` button and inside the outside-geofence notice banner), render a clean, self-contained **140px-tall CustomPaint / Stack Schematic Map (`GeofenceMiniMap`)**:

```
┌─────────────────────────────────────────────────────────────────────┐
│ [● LIVE LOCATION VS SITE GEOFENCE]         [4.2 km from HQ · 300m] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│    ┌ ─ ─ ─ ─ ─ ─ ┐                                                  │
│    ┆  [🏢 HQ]    ┆  - - - - - - 4.2 km away - - - - - >  (📍 You)   │
│    ┆ Baridhara   ┆                                     Outside Zone │
│    └ ─300m zone─ ┘                                     Gulshan-2    │
│                                                  [🏭 Plant · 14km]  │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│ ● You (4.2 km out)   ◯ Allowed perimeter (300 m)  [Demo: Toggle 📍] │
└─────────────────────────────────────────────────────────────────────┘
```

- **What It Visualizes**:
  1. **Primary Site & Geofence Zone**:
     - Shows the employee's target site (`Head Office, Baridhara` with `300 m` radius ring, or `Keraniganj Refinery` with `500 m` radius ring) as a dashed circular perimeter with a building/refinery icon at the center.
  2. **Secondary Site Reference Pill**:
     - Corner reference badge showing the other BOGCL site (`Keraniganj Plant · 14.8 km` or `Baridhara HQ · 14.8 km`) so the spatial relationship between HQ and Plant is always clear.
  3. **Employee's Live Position Pin (`You`)**:
     - **When Inside Geofence (`<= 300 m` HQ or `<= 500 m` Plant)**: Emerald pulsing pin sits **inside** the dashed geofence circle (`"110 m from gate · Inside allowed zone"`).
     - **When Outside Geofence (`e.g., 4.2 km from gate`)**: Violet/Amber pulsing pin sits **outside** to the right, connected to the site gate by an animated/dashed vector line with a mid-line distance pill (`"4.2 km away"`).
  4. **Pitch Demo Location Toggle**:
     - Includes a subtle 1-tap demo chip (`Simulate: Inside Gate (110m)` <-> `Simulate: Outside Gate (4.2km)` and `Site: HQ Baridhara` <-> `Site: Keraniganj Plant`) so the presenter can demonstrate both normal check-in and outside-geofence exception handling live during the pitch!

---

### 2.3 Shift Punch, Outside-Geofence Confirmation & Regularisation

1. **Shift Selector Pill**:
   - Allows switching shift before punch-in: `General (09:00–18:00)`, `Shift A Morning (06:00–14:00)`, `Shift B Evening (14:00–22:00)`, `Shift C Night (22:00–06:00)`.
2. **Punch In / Punch Out Action**:
   - If inside geofence: 1-tap immediate punch-in with timestamp and GPS distance (`110 m`).
   - If outside geofence (`>300 m` HQ or `>500 m` Plant): Opens a compact **Outside-Geofence Reason Sheet** with 1-tap presets:
     - *"Client / Dealer visit at Motijheel commercial area"*
     - *"RHD Ministry meeting at Sarak Bhaban, Tejgaon"*
     - *"Direct transit to Keraniganj Bitumen Jetty"*
     - *"Traffic delay on Buriganga Bridge corridor"*
   - Marks today's punch with `outsideGeofence: true` and routes it to the supervisor's Team Attendance queue for 1-tap confirmation.
3. **Request Attendance Regularisation Sheet**:
   - For missed punch or late entry: select Date, Actual In/Out Time, Preset Reason, and submit to HOD/HR.

---

### 2.4 My Leave & Team Attendance/Leave

1. **My Leave Sub-Tab**:
   - **3 Entitlement Balance Cards** with progress bars:
     - `Casual Leave`: e.g. `10 days left` (`0 of 10 used`)
     - `Sick Leave`: e.g. `14 days left` (`0 of 14 used`)
     - `Earned Leave`: e.g. `20 days left` (`0 of 20 used`)
   - **`+ Request Leave` Bottom Sheet**:
     - Leave Type (`Casual`, `Sick`, `Earned`, `Maternity/Paternity`, `Compensatory`), Start & End Date picker (auto-calculates calendar/working days and checks against remaining balance), **Handover / Reliever Employee Selector** (dropdown of department colleagues), 1-tap Reason presets, and Submit.
     - Automatically creates a linked item in `MOD-17 Approvals Center` for the employee's HOD.
2. **Team Roster & Leave Sub-Tab (HOD / HR / Plant GM / Chairman)**:
   - **4 Team KPI Tiles**: `Present On Site`, `Late Arrivals`, `Outside Geofence (Needs Confirm)`, `On Leave / Absent`.
   - **Filterable Team Roster**: Filter pills (`All`, `On Duty`, `Outside Geofence`, `Late`, `Absent`). Rows with `outsideGeofence == true` or `regularisationPending == true` have an inline 1-tap `Confirm Check-In` / `Approve Regularisation` button.
   - **Team Leave Queue**: Pending leave requests with handover colleague name and inline `Approve` / `Return` buttons.

---

## 3. MOD-11/12/13: Expense & Travel Claims Specification

*Reference: `client/src/views/ClaimsView.tsx`*

### 3.1 Verdict Banner & Filter Bar
- **One-Sentence Verdict Banner**:
  - For Approvers (`hod`, `chairman`, `hr_admin`): *"3 claims (BDT 48,500) are waiting for your verification or SAP voucher approval."*
  - For Employees: *"You have 2 open expense claims (BDT 14,500) in progress and BDT 32,000 settled this quarter."*
- **Segmented Filter Tabs**:
  1. `Awaiting Me` *(visible to HOD/Finance/Approvers — badge count)*
  2. `My Claims` / `All Claims`
  3. `Open / In Progress`
  4. `Approved & Paid`
  5. `Allowance Policy (Grades 1–10)`

### 3.2 Grade 1–10 Allowance Entitlement Policy View
- Selecting the `Allowance Policy` tab (or tapping `Check Grade Policy` inside the New Claim sheet) displays BOGCL's official B2B entitlement matrix:
  - **Grade 1–2 (Executive / GM)**: Daily Allowance (DA) `BDT 3,500/day` · Hotel Ceiling `BDT 12,000/night` · Transport `Company Car / Actual Air` · Mobile Ceiling `Actual`
  - **Grade 3–4 (DGM / AGM / HOD)**: DA `BDT 2,500/day` · Hotel `BDT 8,500/night` · Transport `First Class / AC Pool Car` · Mobile `BDT 4,000/mo`
  - **Grade 5–6 (Senior Manager / Manager)**: DA `BDT 1,800/day` · Hotel `BDT 5,500/night` · Transport `AC Bus / Train / Pool` · Mobile `BDT 2,500/mo`
  - **Grade 7–8 (Senior Officer / Officer — e.g. Tanvir Ahmed)**: DA `BDT 1,200/day` · Hotel `BDT 3,500/night` · Transport `CNG / Shuttle / Bus` · Mobile `BDT 1,500/mo`
  - **Grade 9–10 (Driver / Support / Technician)**: DA `BDT 800/day` · Overtime Meal `BDT 350/shift` · Uniform/PPE `Company Issued`

### 3.3 3-Stage Claim Lifecycle & SAP Voucher Settlement
Every claim card displays a crisp **3-Step Progress Strip** and role-appropriate action buttons:

```
[1. Submitted] ───> [2. HOD Verified] ───> [3. Finance Approved (SAP Voucher)] ───> [4. Settled / Paid]
```

1. **Submit New Claim Sheet**:
   - Category (`Local Conveyance`, `Domestic Tour DA/Hotel`, `Refinery Site Visit`, `Medical Reimbursement`, `Mobile / Internet`, `Client Entertainment`), Amount BDT, Date, Cost Center (`CC-4100 Sales`, `CC-2200 Keraniganj Plant`, `CC-1100 Admin`), Receipt attachment tag, and **Live Policy Ceiling Check** (warns if amount exceeds the employee's Grade cap).
2. **Stage 1 -> 2 (`SUBMITTED` -> `VERIFIED`)**:
   - Departmental HOD taps `Verify & Forward to Finance` (or `Return with Query`).
3. **Stage 2 -> 3 (`VERIFIED` -> `APPROVED`)**:
   - Finance Approver (`hod` Farida Begum / `chairman`) taps `Approve & Generate SAP Voucher` -> Auto-generates `SAP-FI-2026-xxxx` voucher code on the card.
4. **Stage 3 -> 4 (`APPROVED` -> `SETTLED`)**:
   - Finance taps `Mark Paid (Bank EFT Disbursed)` -> Records payment timestamp and bank disbursement ref.
5. **Return with Query & Claimant 1-Tap `Fix & Resubmit`**:
   - Approver can return a claim with a structured category (`Missing Original Vat Challan`, `Exceeds Grade Entitlement Cap`, `Wrong Cost Center`, `Requires HOD Tour Authorization`) + observation note.
   - When a claim is in `RETURNED` status, the claimant sees a highlighted amber box with the exact query and a **`Fix & Resubmit Claim`** button that opens the pre-filled editor to adjust the amount/attachment and resubmit.

---

## 4. Files to Modify in Phase 3 (During Execution)

- `ftr-a/lib/features/attendance/presentation/attendance_screen.dart` — Unify Attendance & Leave tabs, embed `GeofenceMiniMap`, add outside-geofence reason sheet & team roster filters.
- `ftr-a/lib/features/attendance/presentation/widgets/geofence_mini_map.dart` *(new widget)* — Custom schematic visualization of employee location vs HQ Baridhara (300m) / Keraniganj Plant (500m) with demo toggle.
- `ftr-a/lib/features/leave/presentation/leave_screen.dart` — Expose reusable `MyLeaveTab` and `TeamLeaveTab` widgets used inside the unified Attendance & Leave screen (and keep `/more/leave` routing cleanly to the Leave tab).
- `ftr-a/lib/features/claims/presentation/claims_screen.dart` — Add Verdict banner, Grade 1–10 Allowance Policy tab/sheet, 3-stage HOD Verify -> Finance SAP Voucher -> Mark Paid flow, structured Return modal, and Claimant Fix & Resubmit sheet.
- `ftr-a/lib/mock/engines/attendance_engine.dart`, `leave_engine.dart`, `claims_engine.dart` — Support geofence distance/coordinates, handover employee ID, 3-stage claim transitions, SAP voucher generation, and claim resubmission.

