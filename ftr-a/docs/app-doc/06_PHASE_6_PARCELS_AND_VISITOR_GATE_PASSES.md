# 06 — Phase 6: Site Operations (Mailroom Parcels + RTO Flow & Visitor Gate Passes)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Incomplete Office Mail & Parcels (`lib/features/parcels/presentation/parcels_screen.dart` & `parcel_detail_screen.dart`)**:
   - Lacks the **`My Parcels` (Personal) vs `Mailroom Desk` (Master)** scope switch (`client/src/views/ParcelView.tsx`).
   - Lacks the **3-Stage Reverse Return (RTO) Workflow** (`1. Return Initiated` -> `2. Reverse Transit` -> `3. Returned to Original Sender` verified via `returnOtp`).
   - Lacks **Tamper / Discrepancy Reporting & Security Quarantine** (`tamper_broken`, `damaged_contents`, `wrong_documents`, `recipient_refused`).
   - Lacks **3-Attempt OTP Lock (`OTP_MAX_ATTEMPTS = 3`) & Mailroom Desk PIN Reissue**, SHA-256 custody chain hashes, and the **Corridor Pouch Manifest** sheet for drivers.
2. **Incomplete Visitor Gate Passes (`lib/features/visitors/presentation/visitors_screen.dart` & `visitor_detail_screen.dart`)**:
   - Lacks the **`My Invited Guests` (Host) vs `Security Gate Console` (All)** mode toggle (`client/src/views/GuestView.tsx`).
   - Lacks the **5-Item Refinery PPE & H2S Safety Clearance Checklist** (`Hard Hat`, `Safety Goggles`, `Steel-Toe Shoes`, `Hi-Vis Vest`, `H2S Safety Briefing` + 1-tap `Approve All PPE & H2S`) gating entry into Keraniganj Refinery.
   - Lacks **Permitted Plant Zones** (`Green Admin`, `Yellow Tank Farm`, `Red Distillation/Jetty` with mandatory HSE escort badge), **VIP Protocol & Govt Regulator Inspection Findings Logger**, **ALPR Vehicle Plate & Gate Barrier Simulator**, **Emergency Evacuation Muster Roll**, and **Multi-Channel Pass Dispatch (`WhatsApp` / `SMS` / `Email`)**.

---

## 2. MOD-04: Office Mail & Inter-Site Parcels Specification

*Reference: `client/src/views/ParcelView.tsx`*

### 2.1 Top Verdict Banner, Scope Switch & Corridor Filters
- **Plain-Language Verdict Banner**:
  - *"3 confidential pouches are in transit between Baridhara HQ and Keraniganj Plant · 1 parcel has arrived at your desk awaiting 4-digit PIN handover."*
- **Scope Toggle**:
  - `My Parcels (Sent & Received)` <-> `Mailroom Master Desk (All Corridor Mail)` *(default for `hr_admin`, `transport_admin`, `driver`, `chairman`)*.
- **Filter Chips**:
  - **Status**: `All`, `In Transit`, `Ready for Handover (OTP)`, `Delivered`, `Returning (RTO)`, `Quarantined (Tamper)`.
  - **Corridor Direction**: `All`, `HQ Baridhara -> Keraniganj Plant`, `Keraniganj Plant -> HQ Baridhara`, `External Regulatory / Bank`.

---

### 2.2 5-Stage Forward Chain of Custody & OTP Verification
Every parcel detail sheet displays a clear **5-Stage Stepper** with timestamp, handler name, and cryptographic custody hash (`SHA256: 7c3a...`):

```
[1. Despatch Logged] -> [2. Driver Pouch Handover] -> [3. Corridor Checkpoint] -> [4. Destination Gate Inward] -> [5. Recipient OTP Verified]
```

1. **Stage 1 -> 4 Advancement**:
   - Mailroom officer or assigned corridor driver (`EMP-0821 Md. Rafiqul Islam`) taps the primary CTA (`Accept into Driver Pouch`, `Log Postogola Corridor Checkpoint`, `Receive at Destination Gate`).
2. **Stage 4 -> 5 (`Recipient OTP Handover`)**:
   - Displays a 4-digit PIN entry box (with demo hint showing the parcel's `deliveryOtp`, e.g., `4829`).
   - **3-Attempt Security Lock (`OTP_MAX_ATTEMPTS = 3`)**:
     - Entering a wrong PIN increments `otpAttempts`. After 3 failed attempts, the parcel locks (`OTP_LOCKED`).
     - Mailroom Desk / Admin can tap **`Reissue New Delivery PIN`** to unlock and generate a fresh 4-digit OTP.

---

### 2.3 3-Stage Reverse Return (RTO) Workflow
If a parcel has wrong documents, an unavailable recipient, or is refused atStage 3/4:

```
[RTO Stage 1: Return Initiated] ───> [RTO Stage 2: Reverse Corridor Transit] ───> [RTO Stage 3: Returned to Original Sender (Return OTP)]
```

1. **`Initiate Return to Sender (RTO)` Sheet**:
   - Select Return Reason Category:
     - `Incomplete / Unsigned Enclosure`
     - `Wrong Recipient or Department`
     - `Recipient on Leave / Tour`
     - `Refused by Recipient`
   - Generates a dedicated 4-digit `returnOtp` (e.g., `9104`) for the original sender.
2. **Reverse Transit & Sender Verification**:
   - Advances through `Reverse Corridor Transit` back to the origin site, where the original sender verifies receipt using `returnOtp` to close the loop as `RETURNED_TO_SENDER`.

---

### 2.4 Tamper / Discrepancy Quarantine & Driver Pouch Manifest
1. **`Report Tamper / Seal Discrepancy` Modal**:
   - Available at any transit handoff: select issue (`Wax/Security Seal Broken`, `Damaged Outer Pouch`, `Document Count Mismatch`), add security note -> Places parcel into **`QUARANTINED`** status with a red alert banner and notifies Security & HR Admin.
2. **`View Corridor Pouch Manifest` Sheet**:
   - Consolidates all `IN_TRANSIT` parcels assigned to the current shuttle/pool car run into a single printable/scannable **Driver Pouch Manifest (`POUCH-DHAKA-KER-01`)** with 1-tap `Hand Over Entire Pouch at Gate`.

---

## 3. MOD-08: Visitor Gate Passes & Plant Access Specification

*Reference: `client/src/views/GuestView.tsx`*

### 3.1 Top Verdict Banner, Host/Gate Mode & Emergency Muster Bar
- **Plain-Language Verdict Banner**:
  - *"4 visitors are currently inside Keraniganj Refinery & HQ · 1 BSTI Regulator team is arriving at 11:30 AM (VIP Protocol)."*
- **Mode Switch**:
  - `My Invited Guests (Host View)` <-> `Security Gate Console (All Sites)`.
- **Emergency Evacuation Muster Roll Banner (`Muster Mode` Toggle)**:
  - A high-contrast `Emergency Muster Roll` toggle in the header. When activated during a safety drill or alarm:
    - Filters immediately to all **`CHECKED_IN` (Currently On-Site)** visitors.
    - Shows each visitor's Zone (`Red Zone — Distillation Unit`), Host Name, Escort Officer, and a 1-tap **`Mark Safe at Assembly Point #3`** button + **`Mark All Visitors Accounted For`** batch button, displaying a live `Accounted: X / Y` counter!

---

### 3.2 Invite Visitor Sheet & Multi-Channel Pass Share
1. **`+ Invite a Visitor` (`NewVisitorPassSheet`)**:
   - Visitor Name, Organization / Agency, Mobile, NID / Passport No., **Visitor Category** (`Regular Guest`, `Vendor / Contractor`, `Client / Dealer`, `Govt Regulator`, `VIP / Ministry`), Target Site (`Head Office, Baridhara` or `Keraniganj Refinery Plant`), **Permitted Plant Zone**:
     - `Green Zone — Admin & Commercial Building (No Escort Required)`
     - `Yellow Zone — Lab, Warehouse & Tank Farm Perimeter (Escort Required)`
     - `Red Zone — Crude/Vacuum Distillation & Bitumen Jetty (Mandatory HSE Escort & H2S Detector)`
   - Accompanying Vehicle Plate (for ALPR gate camera), Laptops/Tools declaration, and VIP Refreshment/Protocol notes.
2. **Share Digital Gate Pass (`PassDispatchSheet`)**:
   - Shows the scannable **BOGCL QR Gate Pass Card** + 1-tap dispatch buttons:
     - `Send via WhatsApp` · `Send via SMS` · `Send via Official Email` (records dispatch timestamp and channel badge on the pass).

---

### 3.3 5-Item Refinery PPE & H2S Safety Clearance Gate
For any visitor checking into **Keraniganj Refinery Plant** (especially Yellow/Red zones), the detail sheet displays the interactive **5-Item Mandatory Refinery Safety Checklist**:

| # | PPE / Safety Item | Spec | Interactive Toggle |
| :-: | :--- | :--- | :--- |
| 1 | **Safety Hard Hat** | ANSI Z89.1 Visitor Helmet Issued | `[✓] Issued` |
| 2 | **Safety Goggles** | Impact/Splash Eye Protection | `[✓] Issued` |
| 3 | **Steel-Toe Safety Boots** | Anti-Static Footwear Verified | `[✓] Verified` |
| 4 | **High-Visibility Flame-Retardant Vest** | Visitor Hi-Vis Jacket Issued | `[✓] Issued` |
| 5 | **H2S & Refinery Emergency Briefing** | 3-Minute Gate Safety Video & Muster Point Brief | `[✓] Completed` |

- Includes a 1-tap **`Approve All PPE & H2S Briefing`** button for fast gate check-in during live pitch demos.
- **Business Rule Gate**: Gate Check-In at Keraniganj Plant (Yellow/Red zone) requires all 5 items to be checked before the `Check In Visitor & Issue Badge` button activates!

---

### 3.4 ALPR Gate Barrier Control & Regulator Inspection Logger
1. **ALPR Camera & Gate Barrier Simulator**:
   - For visitors arriving with a vehicle (e.g., `Dhaka Metro-Gha-15-9920`), displays a simulated **ANPR Gate Camera Plate Match Badge (`99.4% Match`)** and a 1-tap **`Open Security Barrier #1 & Log Entry`** button.
2. **VIP Protocol & Govt Regulator Inspection Findings Logger**:
   - When a visitor's category is `Govt Regulator` (e.g., `BSTI`, `DoE`, `Dept. of Explosives`) or `VIP`:
     - Displays a dedicated **`Log Regulator Inspection Findings / Visit Note`** section inside the pass detail sheet (1-tap presets: *"Sampled Bitumen 60/70 from Tank TK-102 — all parameters compliant"*, *"Verified ETP outlet pH and dissolved oxygen — satisfactory"*), linking governance directly with site security.

---

## 4. Files to Modify in Phase 6 (During Execution)

- `ftr-a/lib/features/parcels/presentation/parcels_screen.dart` & `parcel_detail_screen.dart` — Add Personal/Mailroom Desk toggle, 5-stage forward stepper with SHA-256 hashes, 3-stage Reverse Return (RTO) flow with `returnOtp`, Tamper/Quarantine sheet, 3-attempt OTP lock + PIN reissue, and Driver Pouch Manifest sheet.
- `ftr-a/lib/features/visitors/presentation/visitors_screen.dart` & `visitor_detail_screen.dart` — Add Host/Security Gate toggle, Emergency Evacuation Muster Roll bar, 5-item PPE & H2S checklist gate, Green/Yellow/Red Plant Zone badges, ALPR Gate Barrier simulator, Regulator Inspection Findings logger, and WhatsApp/SMS/Email QR Pass dispatch sheet.
- `ftr-a/lib/mock/engines/parcels_engine.dart` & `visitors_engine.dart` — Persist RTO stages, `returnOtp`, tamper quarantine state, OTP attempt counters, 5-item PPE map, muster roll status, and regulator findings.

