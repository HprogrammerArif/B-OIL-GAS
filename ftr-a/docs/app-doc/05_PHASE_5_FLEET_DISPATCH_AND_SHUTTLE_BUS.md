# 05 — Phase 5: Transport & Commute (Fleet Dispatch, Smart Pooling & 52-Seat Shuttle Bus)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Broken / Stubbed Fleet Module (`lib/features/fleet/presentation/fleet_screen.dart`)**:
   - `_fleetForm` (lines 480–530) only asks for 2 text fields (`Destination` and `Purpose`) and lacks origin, intermediate stops, travel date/time, passenger count, cost center, and live BDT cost estimation.
   - `_poolCards` (lines 254–267) renders Smart Carpooling suggestions as a **non-clickable `ListTile`** with no button to actually merge/execute the pool!
   - Completely missing from `fleet_screen.dart`:
     - **Drivers Roster & Breathalyzer Check** tab (`client/src/views/FleetView.tsx`).
     - **Vehicles Health, Telematics & Fuel Voucher Issuance** tab.
     - **Gate Entry/Exit Manifest & Tri-Party Fleet Chat** tab.
     - **Digital Trip Challan Pass** preview and **Passenger 1–5 Star Rating & Feedback** modal upon trip completion.
2. **Incomplete Shuttle Bus Module (`lib/features/bus/presentation/bus_screen.dart`)**:
   - Lacks the **Staff vs Transport Supervisor perspective switch** and **Inbound (To Office/Plant) vs Outbound (Return Home) direction toggle**.
   - Lacks the **10-Bus Fleet Overview Grid** (`BusFleetOverviewGrid` in `BusView.tsx`).
   - Lacks the full **Interactive 52-Seat 2×2 Coach Map** with seat categories (`General`, `Female Reserved`, `Executive`, `Senior`), passenger search highlight, **Direct Shift-Pass Seat Booking**, **Seat Swap Request**, **1-Tap Voluntary Seat Vacate & Reclaim**, **Supervisor 1-Tap FIFO Waitlist Promotion**, **Conductor QR Boarding Scanner**, and **Route & Stops Builder**.

---

## 2. MOD-09: Fleet, Pool Cars & Driver Console Specification

*Reference: `client/src/views/FleetView.tsx`*

### 2.1 Top Verdict Banner & Role-Adapted Sub-Tabs
- **Plain-Language Verdict Banner**:
  - For `transport_admin`: *"3 approved car requisitions need vehicle & driver dispatch · 1 smart pooling opportunity saves BDT 1,850 on the Keraniganj corridor."*
  - For `employee`: *"Your trip REQ-2026-089 to Keraniganj Refinery is assigned to Toyota Corolla Cross (Dhaka Metro-Ga-18-4421) · Driver: Md. Rafiqul Islam."*
- **4 Clean Mobile Sub-Tabs**:
  1. `Requisitions & Trips` *(All personas)*
  2. `Drivers & Breathalyzer` *(`transport_admin`, `hr_admin`, `plant_gm`, `chairman`, `driver`)*
  3. `Vehicles & Fuel` *(`transport_admin`, `plant_gm`, `hod`, `chairman`, `driver`)*
  4. `Gate Log & Chat` *(All personas — scoped to their trips or full fleet)*

---

### 2.2 Sub-Tab 1: Requisitions, Multi-Stop Itinerary & Interactive Smart Pooling

1. **`+ Book Company Car` (`NewRequisitionSheet`)**:
   - **Origin**: Preset chips (`Head Office, Baridhara`, `Keraniganj Refinery Plant`, `Hazrat Shahjalal Airport`, `Motijheel Commercial Area`).
   - **Multi-Stop Intermediate Waypoints**: `+ Add Stop` button allowing up to 3 intermediate stops along the route.
   - **Final Destination**, **Date & Departure Time**, **Trip Type** (`One-Way` / `Round-Trip` / `Full-Day Disposal`), **Passenger Count (1–7)**, **Preferred Vehicle Class** (`Sedan`, `SUV / Prado`, `Microbus / Hiace`, `Double-Cabin Pickup`), **Cost Center** (`CC-4100 Sales`, `CC-2200 Refinery Ops`, `CC-1100 Executive`), and **Purpose** (1-tap presets).
   - **Live Cost & Distance Estimator Card**: Displays estimated corridor distance (`24 km`) and internal fuel/allocation charge (`~BDT 1,450`).
2. **Interactive Smart Pooling Banner (`SmartPoolCard`)**:
   - Whenever two open requisitions travel in the same corridor window (e.g., `Baridhara HQ -> Keraniganj Plant` between `09:00–10:00 AM` with combined passengers `<= 4`), display a high-visibility Emerald/Blue banner:
     - Shows both Requisition Refs, Requesters, Departure Times, Combined Passengers (`3 seats`), and Estimated Fuel Saving (`Saves BDT 1,850 · 1 fewer vehicle on Buriganga corridor`).
     - **`Merge & Pool Onto Single Vehicle` CTA Button** -> Opens vehicle/driver selector and assigns both requisitions to the same shared vehicle and driver in 1 tap!
3. **End-to-End Requisition Action Chain**:
   - `PENDING_HOD` -> HOD taps `Approve Requisition` (or `Return`).
   - `APPROVED_PENDING_DISPATCH` -> Transport Admin taps `Assign Vehicle & Driver` -> Opens modal listing only `AVAILABLE` vehicles and breathalyzer-cleared `AVAILABLE` drivers.
   - `ASSIGNED` -> Driver (or Transport Admin) taps `Start Trip (Log Opening Odometer)`.
   - `IN_PROGRESS` -> Shows live route progress, `View Digital Trip Challan Pass` (printable/QR gate pass for refinery security), and `Complete Trip (Log Closing Odometer)`.
   - `COMPLETED` -> Passenger sees **`Rate Trip & Driver (1–5 ★)`** button -> Opens rating sheet with star selector and quick feedback tags (`Punctual`, `Safe Driving`, `Clean Vehicle`, `Polite`).

---

### 2.3 Sub-Tab 2: Drivers Roster & Daily Breathalyzer Clearance
- Lists all company drivers (`Md. Rafiqul Islam`, `Abdul Karim`, `Monir Hossain`, `Shahidul Alam`, etc.) with:
  - Avatar, Name, Employee ID, Mobile (1-tap call), BRTA Licence No. & Expiry, Cumulative Safety Rating (`4.9 ★`), Shift Hours Today (`5.5 / 8.0 hrs`), and Live Status (`AVAILABLE`, `ON_TRIP`, `OFF_DUTY`).
  - **Daily Breathalyzer & Fitness Badge**:
    - Shows `PASSED (0.00% BAC · 08:15 AM)` or `PENDING CHECK`.
    - Transport Admin can tap **`Log Breathalyzer Check`** to record today's zero-alcohol fitness clearance before dispatch.

---

### 2.4 Sub-Tab 3: Vehicle Telematics, Maintenance & Fuel Vouchers
- **Fleet Health Cards**:
  - Vehicle Plate (`Dhaka Metro-Ga-18-4421`), Model (`Toyota Corolla Cross Hybrid`), Site Depot (`HQ Baridhara` / `Keraniganj Plant`), Live Status (`AVAILABLE`, `IN_TRANSIT`, `MAINTENANCE`), Fuel Tank Level progress bar (`78%`), Current Odometer (`48,210 km`), and Next Service Countdown (`1,420 km remaining`).
  - Quick actions on each vehicle: `Toggle Maintenance / Available` and **`+ Issue Fuel Voucher`**.
- **Fuel Voucher Issuance & Log (`FuelVoucherSheet`)**:
  - Select Vehicle, Driver, Authorised Filling Station (`Bashundhara Trust Filling Station, Tejgaon` / `Keraniganj Padma Fuel Depot`), Fuel Type (`Octane 95` / `Diesel`), Quantity (`Liters`), Rate (`BDT/L`), Auto-calculated Total (`BDT`), and Current Odometer reading.
  - Appends to the **Issued Fuel Vouchers List** below the vehicle cards with voucher code `FV-2026-xxxx`.

---

### 2.5 Sub-Tab 4: Security Gate Manifest & Tri-Party Fleet Chat
- **Gate Manifest**: Chronological log of vehicles passing `Baridhara HQ Gate` and `Keraniganj Refinery Gate #1` with plate number, driver, passengers, odometer, and gate officer verification timestamp.
- **Tri-Party Fleet Chat**: Scoped message thread linking `Passenger <-> Transport Admin <-> Assigned Driver` with 1-tap quick messages (*"I am waiting at Baridhara main lobby"*, *"Stuck at Postogola Bridge traffic, 10 mins away"*, *"Car is parked at Gate 2"*).

---

## 3. MOD-14: Staff Shuttle Bus Specification (10-Bus Fleet & 52-Seat Deck)

*Reference: `client/src/views/BusView.tsx`*

### 3.1 Top Controls: Role Mode, Commute Direction & 10-Bus Fleet Grid
1. **Perspective & Direction Bar**:
   - **Mode Switch** (for `transport_admin` / `hr_admin` / `chairman`): `Staff Rider View` <-> `Supervisor Command View`.
   - **Commute Direction Toggle**: `Inbound (Morning -> HQ / Plant)` <-> `Outbound (Evening -> Home)`.
2. **10-Bus Fleet Overview Grid (`BusFleetOverviewGrid`)**:
   - Compact horizontal/grid selector showing all **10 BOGCL Staff Shuttle Buses** (`Bus #01 Uttara–HQ–Plant`, `Bus #02 Mirpur–HQ–Plant`, `Bus #03 Dhanmondi–Plant`, `Bus #04 Mohammadpur`, `Bus #05 Banani/Gulshan`, `Bus #06 Jatrabari/Signboard`, `Bus #07 Narayanganj`, `Bus #08 Savar/Gabtoli`, `Bus #09 Bashundhara R/A`, `Bus #10 Keraniganj Local`):
     - Shows Bus Code, Route Name, Occupancy (`48/52 seats`), Vacated Today (`2 free`), Waitlist (`1 waiting`), and Live Status (`On Time`, `En Route`, `Delayed 10m`).
     - Tapping any bus selects it as the active bus below.

---

### 3.2 Interactive 52-Seat Coach Map (`52-Seat 2×2 Layout`)
Render a clean, tactile **13-Row × 4-Column (A, B | Aisle | C, D) 52-Seat Coach Deck**:

```
┌───────────────────────────────────────────────────────────┐
│ [🛞 DRIVER: Md. Kamal]          [🚪 FRONT ENTRY / QR SCAN] │
├───────────────────────────────────────────────────────────┤
│ Row 1:  [1A ★Exec] [1B ★Exec]   ║   [1C ♀Lady] [1D ♀Lady] │
│ Row 2:  [2A ♀Lady] [2B ♀Lady]   ║   [2C ●Occupied] [2D]   │
│ Row 3:  [3A ●Occ ] [3B ◎Vacated]║   [3C ●Occ ] [3D ●Occ ] │
│ Row 4:  [4A ★YOU ] [4B ●Occ ]   ║   [4C ○Free] [4D ●Occ ] │
│ ...     (Rows 1 to 13 — 52 Seats Total)                   │
└───────────────────────────────────────────────────────────┘
```

- **Color & Badge Legend**:
  - **Blue Ring (`★ YOU`)**: Current user's assigned or booked seat (e.g., `Seat 4A — Tanvir Ahmed`).
  - **Slate/Solid (`● Occupied`)**: Assigned to a permanent pass holder riding today.
  - **Amber Dashed (`◎ Vacated Today`)**: Permanent holder voluntarily vacated their seat for today — **available for 1-day Shift-Pass booking or Waitlist promotion!**
  - **Emerald Outline (`○ Empty / Open`)**: Unassigned seat available for booking.
  - **Category Corner Tags**: `♀ Female Reserved`, `★ Executive`, `✚ Senior/Medical`, `General`.
- **Search Passenger on Bus**: Search input above the deck highlights the matching employee's seat number immediately.

---

### 3.3 Staff Self-Service Seat Workflows
Tapping any seat on the 52-seat deck opens a context-aware bottom sheet:

1. **Tapping Your Own Seat (`Seat 4A`)**:
   - **`Vacate My Seat for Today` (1-Tap)**: Marks your seat `VACATED_TODAY` so a colleague on the waitlist can ride today (and if already vacated, shows **`Reclaim My Seat`** provided it hasn't been reassigned yet).
   - **`Request Seat Swap`**: Select another seat on the bus to request a mutual seat swap.
   - **`View Digital Boarding Pass (QR)`**: Displays your shuttle boarding QR pass.
2. **Tapping an `Empty` or `Vacated Today` Seat**:
   - Opens **`Direct Seat Booking Sheet`**:
     - Choose Booking Type:
       - `Single Shift Pass (Today Only)` — Instant confirmation on vacated/open seat!
       - `Permanent Monthly Seat Allocation` — Submits allocation request to Transport Admin.
       - `Guest / Trainee Day Pass` — Books seat for an accompanied trainee/visitor.
     - Select Boarding Stop from the route's stop timeline (e.g., `07:25 AM — Housebuilding, Uttara`).
3. **When Bus is Full (`52/52`)**:
   - Prominent **`+ Join FIFO Standby Waitlist`** button -> Adds user to the route's priority queue with position badge (`#1 in queue`).

---

### 3.4 Transport Supervisor Command Workflows
When `Supervisor Command View` is active (or user is `transport_admin` / `hr_admin`):
1. **1-Tap FIFO Waitlist Promotion**:
   - In the **Waitlist Queue Card**, next to the #1 waiting staff member, tap **`Assign to Vacated Seat (3B)`** -> Automatically assigns the vacated/empty seat to the waiting employee and sends them a boarding alert!
2. **Conductor QR Boarding Scanner & Progress Bar**:
   - Shows live boarding count (`38 of 48 boarded · 79%`).
   - Tapping **`Scan / Mark Passenger Boarded`** simulates QR boarding verification and increments the live boarded counter.
3. **Traffic / Delay Broadcast Banner**:
   - `Broadcast Route Alert` sheet (1-tap presets: *"Bus #01 delayed 12 mins at Mohakhali Flyover"*, *"Alternate pickup at Gate 2 today"*).
4. **Reassign Bus Vehicle & Route Builder Modals**:
   - **`Reassign Bus / Driver`**: Swap physical bus registration plate or driver on the active route.
   - **`+ Create / Edit Shuttle Route` (`RouteBuilderSheet`)**: Edit Route Code, Name, Bus Capacity (`52`), Departure Time, and ordered list of Pickup Stops with scheduled times.

---

## 4. Files to Modify in Phase 5 (During Execution)

- `ftr-a/lib/features/fleet/presentation/fleet_screen.dart` — Replace stubs with 4 role-aware tabs (`Requisitions`, `Drivers & Breathalyzer`, `Vehicles & Fuel`, `Gate & Chat`), multi-stop requisition builder, clickable Smart Pooling merger, Fuel Voucher sheet, Digital Trip Pass, and Passenger 1–5 Star Rating sheet.
- `ftr-a/lib/features/bus/presentation/bus_screen.dart` — Add Staff/Supervisor & Inbound/Outbound toggles, 10-Bus Fleet Grid, interactive 52-seat 2×2 coach map, Vacate/Reclaim, Seat Swap, Direct Shift-Pass booking, FIFO Waitlist promotion, Conductor QR Boarding sheet, and Route Builder.
- `ftr-a/lib/mock/engines/fleet_engine.dart` & `bus_engine.dart` — Support multi-stop itineraries, smart pool execution, breathalyzer logs, fuel vouchers, trip ratings, 10-bus fleet state, 52-seat map mutations, vacate/reclaim, seat swap, and waitlist promotion.

