# 04 — Phase 4: Governance Core (Approvals Center, Note-Sheets & Statutory Compliance)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Approvals Center (`lib/features/approvals/presentation/approvals_screen.dart`)**:
   - Lacks the top urgency verdict banner (with total BDT value & `<12h` SLA due-soon toggle), search bar, category count chips, 4-way sorting (`SLA Urgency`, `Amount`, `Date`, `Requester`), structured Return/Rejection modal (`reasonCategory` + `observations` + `improvementsRequired`), prev/next navigation in the detail sheet, and complete two-way synchronization with linked Note-Sheets, Claims, Leave, and Fleet Requisitions.
2. **Note-Sheets & E-Sign (`lib/features/note_sheets/presentation/note_sheet_detail_screen.dart`)**:
   - Lacks the visual **`RouteStepper`** (showing signed officers with timestamps, current pending desk, and next officers in chain), the structured **`BudgetCheck`** card (GL code, annual budget, available balance, proposal amount, PO ref), the **`PriceComparison`** vendor quote table with lowest/recommended vendor savings calculation, the **Cryptographic Completion Certificate (`CertificateModal`)**, and the printable **Official Memorandum (`OfficialDocumentModal`)**.
3. **Licences & Statutory Compliance (`lib/features/licences/presentation/licences_screen.dart` & `licence_detail_screen.dart`)**:
   - Currently increments stage blindly without the web prototype's **5-Stage Renewal Pipeline Gating** (`1. Application Prep` requires 100% Audit Checklist completion -> `2. Fee & Treasury Challan` requires HOD Finance fee approval -> `3. Inspector Visit` requires logging inspection findings -> `4. Ministry Approval` -> `5. Certificate Issued`), lacks the **Daily Shutdown Risk (BDT)** & SRO Law reference card, and lacks the **DO Letter Generator & Dispatch (`e-Nothi` / `Courier` -> auto-creates a tracked Parcel in `MOD-04`)**.

---

## 2. MOD-17: Unified Approvals Center Specification

*Reference: `client/src/views/ApprovalsView.tsx`*

### 2.1 Top Verdict Banner & Due-Soon SLA Toggle
- **Plain-Language Verdict Card**:
  - Displays: `"5 items waiting for your decision · Total value: BDT 48,25,000 · 2 due within 12h"`
  - Interactive **`Due <12h (2)`** filter chip right inside the banner to immediately isolate urgent SLA items.
- **Primary Mode Tabs**:
  - `Pending Queue (N)` vs `Decision History (M)` (with sub-filter inside History: `All`, `Approved`, `Returned / Rejected`).

### 2.2 Search, Category Filter & Sort Bar
1. **Search Field**: Instant filter across `title`, `requesterName`, `refCode`, `sapDocNumber`, and `amount`.
2. **Category Chips with Live Counts**:
   - `All (N)`, `Note-Sheets (n1)`, `Expense Claims (n2)`, `Purchase / Requisitions (n3)`, `Leave & HR (n4)`.
3. **Sort Selector Dropdown/Sheet**:
   - `SLA Urgency (Soonest first)` · `Value (Highest BDT first)` · `Date Submitted (Newest)` · `Requester Name (A–Z)`.
4. **Multi-Select Batch Approval**:
   - Long-press or tap checkbox on pending cards -> Sticky bottom bar appears: `Select All` · `Approve Selected (K)` with 1-tap batch confirmation.

### 2.3 Approval Detail Sheet & Structured Return/Rejection Modal
- Tapping any approval card opens a rich **Approval Detail Bottom Sheet** featuring:
  - **Header Navigation**: `< Prev` and `Next >` buttons to step through the pending queue without closing the sheet!
  - **4-Question Summary**: What is being requested, Requester & Site, BDT Amount & Cost Center / GL Code, SLA countdown badge, and link to open the full source file (e.g., `Open Full Note-Sheet`).
  - **Sign-Off Actions**:
    - **Primary CTA**: `Approve & E-Sign` (with optional 1-tap remark chips: *"Approved as proposed"*, *"Cleared within quarterly budget"*, *"Subject to standard QC inspection"*).
    - **Secondary CTA**: `Return / Reject with Query` -> Opens the **Structured Rejection Explanation Sheet**:
      - **Mandatory Reason Category Chips**:
        - `Budget / Cost Center Issue`
        - `Missing Supporting Quotation / Challan`
        - `Technical Specification Clarification`
        - `Policy / Entitlement Exceeded`
        - `Defer to Next Quarter`
      - **Observation / Query Note** (with 1-tap preset chips).
      - **Required Improvements Before Resubmission** (checklist/text).
      - Confirming immediately updates both `db.approvals` and the source record (`db.noteSheets`, `db.claims`, `db.leaves`, or `db.fleetRequisitions`).

---

## 3. MOD-03: Note-Sheets & E-Sign Specification

*Reference: `client/src/views/NotesheetView.tsx`*

### 3.1 Note-Sheet List Screen (`note_sheets_screen.dart`)
- **Top Verdict Banner**: `"2 note-sheets are waiting at your desk for digital signature · 1 returned file needs revision."`
- **Filter Tabs**: `Awaiting My Signature`, `All Active Files`, `Approved & Archived`, `Returned for Query`, plus Category filter (`All`, `CAPEX`, `OPEX`, `Procurement`, `HR Policy`, `Emergency Plant`).
- **`+ Draft New Note-Sheet` Sheet**:
  - Title, Category, Initiation Site (`HQ Baridhara` / `Keraniganj Plant`), Subject Summary, Amount BDT, GL Account Code, Cost Center, Preset Signatory Chain (`Standard Finance Chain`, `Plant Technical -> GM -> Chairman`, `HR -> GM -> MD`), and optional Vendor Quotes.

### 3.2 Note-Sheet Detail Dossier (`note_sheet_detail_screen.dart`)
Organize the detail screen into a crystal-clear vertical dossier with 5 distinct cards:

1. **Card 1 — Plain-Language File Verdict (`FileSummary`)**:
   - Shows Reference (`NS-2026-0042`), Priority (`URGENT` / `HIGH` / `NORMAL`), Current Status (`AWAITING_CHAIRMAN_SIGN`), and plain sentence: *"Initiated by Engr. Harunur Rashid (Keraniganj Plant). Verified by HOD Finance. Currently awaiting Chairman & MD final digital signature."*
2. **Card 2 — Visual Signatory Route Stepper (`RouteStepper`)**:
   - Horizontal/vertical connected stepper showing every officer in the routing chain:
     - **Signed Steps** (Green check, Officer Name & Designation, Timestamp, SHA-256 signature badge `SIG-8F92...`, and remark).
     - **Current Desk** (Pulsing Amber/Blue ring: `"Waiting at: Ahmed Akbar Sobhan (Chairman & MD)"`).
     - **Upcoming Steps** (Muted circle with designation).
3. **Card 3 — Budget Verification Card (`BudgetCheck`)**:
   - Displays:
     - `GL Account`: e.g. `400210 — Refinery Plant Capital Spares`
     - `Annual Allocation`: `BDT 2,50,00,000`
     - `Available Balance Before Proposal`: `BDT 94,00,000`
     - `This Proposal Amount`: `BDT 18,50,000`
     - `Balance After Approval`: `BDT 75,50,000` + Emerald badge: **`WITHIN APPROVED BUDGET`** (or Amber warning if over ceiling).
4. **Card 4 — Comparative Vendor Price Table (`PriceComparison`)** *(when quotes exist)*:
   - Mobile-friendly stacked cards comparing the 3 vendor quotations (`Vendor A`, `Vendor B`, `Vendor C`):
     - Vendor Name, Quoted Price (BDT), Delivery Lead Time (`14 days`), Technical Compliance (`Compliant`), and a green **`RECOMMENDED · LOWEST EVALUATED BID (Saves BDT 2,15,000 vs avg)`** badge on the winning vendor.
5. **Card 5 — Numbered Note Paragraphs & SHA-256 Audit Chain (`Discussion`)**:
   - Chronological paragraphs (`Para 1.0`, `Para 2.0`, `Para 3.0`) with author, role, timestamp, and cryptographic paragraph hash (`SHA256: 4a9e...81b2`).
   - Button to `+ Add Note Paragraph / Observation`.

### 3.3 E-Sign Panel, Cryptographic Certificate & Official Memo Modals
- **Sticky Bottom Sign-Off Bar** (when current user is the active signatory or has override authority):
  - 1-tap Remark Presets (`"Approved as proposed"`, `"Sanctioned under emergency plant maintenance"`, `"Concurred with Finance recommendation"`).
  - `E-Sign & Forward / Approve` button -> Prompts 4-digit OTP/PIN verification (`1234` pre-filled hint for demo) -> Stamps SHA-256 signature and advances the chain.
  - `Return to Initiator with Query` button -> Opens structured Return sheet.
- **Two Preview Modals on Approved/Active Files**:
  1. **`View E-Sign Certificate` (`CertificateModal`)**: Displays the cryptographic verification block with Document Hash, Signatory Public Key fingerprints, and tamper-evident seal.
  2. **`Official Memorandum Preview` (`OfficialDocumentModal`)**: Displays the formal BOGCL letterhead memorandum layout ready for PDF print/share.

---

## 4. MOD-06: Licences & Statutory Compliance Specification

*Reference: `client/src/views/ComplianceView.tsx`*

### 4.1 KPI Strip, Agency Filter & Pipeline Stage Filter
- **Top Verdict Banner**: `"2 statutory permits require renewal action · Daily plant shutdown exposure if expired: BDT 1.25 Cr/day."`
- **Agency Filter Pills**:
  - `All Agencies`, `BSTI (Standards)`, `DoE (Environment)`, `Dept. of Explosives & Fire`, `Energy & Mineral Resources Div`.
- **5-Stage Renewal Pipeline Filter Bar**:
  - `Stage 1: App Prep` -> `Stage 2: Fee & Challan` -> `Stage 3: Inspector Visit` -> `Stage 4: Ministry Approval` -> `Stage 5: Certificate Issued`.

### 4.2 Permit Detail & Interactive 5-Stage Gated Workflow
Every licence card / detail sheet displays:
1. **Statutory Risk Banner**:
   - Shows Permit No., Issuing Authority, Expiry Date (with days remaining countdown), **SRO / Law Reference** (e.g., *Bangladesh Petroleum Act 2016, Sec 14 / Explosive Rules 2004*), **Statutory Penalty**, and **Daily Refinery Shutdown Risk (`BDT 85,00,000 / day`)**.
2. **Interactive 5-Stage Renewal Stepper with Business Rule Gates**:
   - **Gate 1 (`Stage 1: Application Prep` -> `Stage 2: Fee & Treasury Challan`)**:
     - Displays the **Mandatory Pre-Submission Audit Checklist** (e.g., *Updated Plant Layout Plan*, *Fire Hydrant Pressure Test Log*, *Effluent Treatment Plant (ETP) Lab Report*, *Previous Year Original Licence*).
     - Each checklist item can be toggled `Completed / Pending` by the user.
     - **Rule**: Cannot advance to Stage 2 until **100% of checklist items are checked** (includes a 1-tap `Complete All Checklist Items` helper for quick pitch demos).
   - **Gate 2 (`Stage 2: Fee & Treasury Challan` -> `3. Inspector Visit`)**:
     - Displays Treasury Challan Fee amount (`BDT 1,50,000`), Bank Code (`Sonali Bank Treasury Challan 1-4241-0000-2031`), and **HOD Finance Fee Approval Status**.
     - If not yet approved, `hod` / `chairman` (or demo override) sees `Approve Statutory Challan Fee (BDT 1,50,000)` button.
     - **Rule**: Advancing to Stage 3 requires Finance Fee Approval to be marked `APPROVED`.
   - **Gate 3 (`Stage 3: Inspector Visit` -> `Stage 4: Ministry Approval`)**:
     - Tapping `Log Inspector Visit & Advance` opens the **Inspector Findings Sheet**:
       - Inspector Name & Designation, Visit Date, Inspection Outcome (`Satisfactory — Recommended for Renewal` or `Conditional — Minor Rectification`), and Observation Notes (with 1-tap presets).
   - **Gate 4 (`Stage 4: Ministry Approval` -> `Stage 5: Certificate Issued`)**:
     - Tapping `Confirm New Certificate Issued` opens the **Certificate Issuance Sheet**:
       - New Certificate Reference No., New Expiry Date (`+1 Year` / `+3 Years`), and adds the certificate to the **Document Vault**.
   - **Stage Revert (`Revert to Previous Stage`)**:
     - Button allowing compliance officer to step back 1 stage with a mandatory reason if the regulator requests corrections.

### 4.3 Official DO Letter Generator & Courier -> Parcel (`MOD-04`) Integration
- Inside any permit detail sheet, tapping **`Generate & Dispatch DO Letter`** opens the **Official Demi-Official (DO) Letter Sheet**:
  - Auto-drafts a formal BOGCL DO Letter addressed to the Director General of the regulatory agency (`BSTI` / `DoE` / `Explosives`) referencing the Licence Number, SRO Law, and Treasury Challan.
  - **Select Dispatch Channel**:
    1. **`e-Nothi (Digital Govt Portal)`** — Logs instant digital submission reference (`ENOTHI-2026-xxxx`).
    2. **`Official Courier / Dispatch Rider` (Cross-Module Integration!)** — Automatically creates a new **`CONFIDENTIAL` Tracked Parcel in `MOD-04` (`Parcels`)** from `Head Office / Plant` to the Regulatory Agency, links the Parcel Tracking ID (`PCL-2026-xxxx`) onto the licence record, and offers a 1-tap `Track in Parcels` button!
    3. **`Hand Delivery by Liaison Officer`** — Logs liaison officer custody.

---

## 5. Files to Modify in Phase 4 (During Execution)

- `ftr-a/lib/features/approvals/presentation/approvals_screen.dart` — Add Urgency Verdict banner, `<12h` toggle, search bar, category chips with counts, 4-way sort, batch approve, prev/next detail sheet, and structured Return/Reject modal.
- `ftr-a/lib/features/note_sheets/presentation/note_sheets_screen.dart` & `note_sheet_detail_screen.dart` — Add `FileSummary`, visual `RouteStepper`, `BudgetCheck` card, `PriceComparison` vendor table, SHA-256 `Discussion` paragraphs, `CertificateModal`, and `OfficialDocumentModal`.
- `ftr-a/lib/features/licences/presentation/licences_screen.dart` & `licence_detail_screen.dart` — Add 5-stage gated pipeline, interactive Audit Checklist gate, Finance Fee Approval gate, Inspector Findings sheet, Certificate confirmation, Stage Revert, Statutory Risk card, and DO Letter Generator with `MOD-04` Parcel creation.
- `ftr-a/lib/mock/engines/approvals_engine.dart`, `note_sheets_engine.dart`, `licences_engine.dart`, `parcels_engine.dart` — Support all stage gates, structured return reasons, vendor comparison data, and DO-letter-to-parcel creation.

