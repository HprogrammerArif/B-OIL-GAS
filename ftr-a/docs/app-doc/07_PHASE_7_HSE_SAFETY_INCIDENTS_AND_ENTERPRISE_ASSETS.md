# 07 — Phase 7: Refinery Safety & Enterprise Assets (HSE Incidents + CAPA & 360° EAM)

## 1. Current State & What Is Broken in `ftr-a/`

1. **Incomplete HSE Safety & Incidents (`lib/features/incidents/presentation/incidents_screen.dart` & `incident_detail_screen.dart`)**:
   - Lacks the **Safety KPI Strip** (`Days Since Last LTI`, `Open Investigations`, `High/Critical Risks`, `CAPA Completion %`) from `client/src/views/IncidentView.tsx`.
   - Lacks the **10 Keraniganj Refinery Plant Zones** filter and the interactive **5×5 Risk Assessment Matrix** (`Severity 1–5 × Likelihood 1–5`).
   - Lacks the **1-Tap Quick Hazard Observation Sheet** (30-second spot report) and the **3-Step Incident Reporting Wizard**.
   - Lacks the structured **Root Cause Analysis (RCA) Workspace** (**`5-Whys Chain`** + **`6M Fishbone / Ishikawa`** categorizer: `People`, `Machine`, `Method`, `Material`, `Measurement`, `Environment`).
   - Lacks the **CAPA Completion Closure Guard** (blocking final HSE sign-off until 100% of CAPA items are marked completed) and the **Statutory Dossier (`Form B-12` / DoE / Dept. of Explosives)** preview.
2. **Incomplete Enterprise Asset Management (`lib/features/assets/presentation/assets_screen.dart` & `asset_detail_screen.dart`)**:
   - Currently renders a flat list of assets with chips, missing the web prototype's **5-Tab EAM Architecture** (`Register`, `Maintenance & Calibration Work Orders`, `Financials & Depreciation`, `Custody Transfers`, `Decommissioning & Disposal` in `client/src/views/AssetView.tsx`).
   - Lacks the **8-Stage Asset Lifecycle Stepper** (`Requisition -> Approved -> Procured -> Commissioned -> Operational -> Maintenance/Calibration -> Decommission Pending -> Disposed`).
   - Lacks **Spare Parts BOM (`Consume 1 Unit` / `Restock +5`)**, **Straight-Line vs Declining-Balance (DDB) Depreciation Calculator**, **Direct Calibration Certification (`+1 Year`) / Deficiency Flagging**, **Multi-Item Disposal Checklist**, and **QR Asset Passport Modal**.

---

## 2. MOD-07: HSE Safety & Incident Reports Specification

*Reference: `client/src/views/IncidentView.tsx`*

### 2.1 Safety KPI Strip, Plant Zone Filter & 5×5 Risk Matrix
- **Top 4 Safety KPI Tiles**:
  1. `Days Since LTI`: **`418 Days`** (`Zero Lost-Time Injuries at Keraniganj`)
  2. `Open Investigations`: Live count of active incidents
  3. `Critical / High Risk`: Count of incidents with Risk Score `>= 12`
  4. `CAPA Completion Rate`: e.g. **`86%`** (`12 of 14 actions closed`)
- **Refinery Plant Zone & Status Filter Bar**:
  - **Status**: `All`, `Reported`, `Investigating (RCA)`, `CAPA in Progress`, `Closed`.
  - **10 Keraniganj Plant Zones**:
    - `All Zones`, `Zone 1: Crude Distillation Unit (CDU)`, `Zone 2: Vacuum Distillation Unit (VDU)`, `Zone 3: Bitumen Blowing & PMB Unit`, `Zone 4: Tank Farm (TK-101 to TK-112)`, `Zone 5: River Jetty & Marine Loading`, `Zone 6: Boiler & Utility House`, `Zone 7: QC Lab & Bitumen Testing`, `Zone 8: Drum Filling & Dispatch Yard`, `Zone 9: Electrical Sub-Station`, `Zone 10: Baridhara HQ Building`.
- **Collapsible Interactive 5×5 Risk Matrix Filter (`Severity 1–5 × Likelihood 1–5`)**:
  - Tapping `5×5 Risk Matrix` expands a compact color-coded grid (`Low 1–4 Green`, `Medium 5–9 Amber`, `High 10–15 Orange`, `Critical 16–25 Red`) showing how many incidents fall into each cell; tapping any cell filters the list!

---

### 2.2 Dual Reporting Flows: 1-Tap Quick Hazard vs 3-Step Full Incident Wizard

1. **`⚡ Quick Hazard Spot Report` Button (30-Second Flow)**:
   - Designed for field engineers/drivers to log an unsafe condition in seconds:
     - Select **Plant Zone**, **1-Tap Hazard Preset** (*"Minor bitumen flange drip at Tank TK-104"*, *"Unsecured scaffolding near VDU column"*, *"Fire extinguisher pressure gauge low at Gate 2"*, *"Slippery oil patch at Drum Loading Bay"*), **Severity (`Low` / `Medium` / `High`)**, and tap **`Submit Hazard Alert`**.
2. **`+ Report HSE Incident` (3-Step Guided Bottom Sheet)**:
   - **Step 1 — Classification & Location**:
     - Incident Type (`Near Miss`, `Unsafe Condition`, `Process / Spill Leak`, `Fire / Thermal`, `Equipment Damage`, `First Aid Injury`, `Medical Treatment`, `Lost Time Injury`, `Environmental / ETP`, `Vehicle / Corridor`), Plant Zone, Shift (`Shift A / B / C / General`), and Date/Time.
   - **Step 2 — 5×5 Risk Scoring & Immediate Containment**:
     - Interactive sliders/buttons for **Severity (`1 Insignificant` to `5 Catastrophic`)** and **Likelihood (`1 Rare` to `5 Almost Certain`)** -> Live badge calculates **`Risk Score: 15 (HIGH)`**.
     - Immediate Containment Action taken on the spot (with 1-tap presets).
   - **Step 3 — Medical, Witnesses & Evidence**:
     - Injury/Treatment details (if applicable), Witness names, Statutory Reportable toggle (`Reportable under Factory Act / Explosives Dept`), and Evidence Photo/PDF tags.

---

### 2.3 Incident Detail: 5-Whys, 6M Fishbone RCA, CAPA Tracker & Closure Guard
Organize `incident_detail_screen.dart` into **4 clean sub-tabs**:

1. **Tab 1: `Overview & Containment`**:
   - Plain-language summary, 5×5 Risk Score badge, Plant Zone, Reporter, Immediate Containment log, Witness list, and Evidence attachments.
2. **Tab 2: `Root Cause Analysis (5-Whys & 6M Fishbone)`**:
   - **Interactive `5-Whys` Chain**:
     - `Why 1` -> `Why 2` -> `Why 3` -> `Why 4` -> `Why 5 (Root Cause)` with `+ Add / Edit Why Step` (includes realistic BOGCL refinery presets).
   - **Interactive `6M Fishbone (Ishikawa)` Categorizer**:
     - 6 structured cards for **`Manpower / People`**, **`Machine / Equipment`**, **`Method / Procedure`**, **`Material / Feedstock`**, **`Measurement / Gauge`**, and **`Milieu / Environment`** — tap any category to add contributing factors.
3. **Tab 3: `CAPA Action Tracker` (With Closure Guard)**:
   - Lists all **Immediate Containment**, **Corrective**, and **Preventive** actions with Action Owner, Due Date, and interactive **`[✓] Mark Completed`** toggle.
   - **`+ Add CAPA Action` Sheet**: Action Type, Description (with presets), Responsible Officer, Target Date.
   - **Mandatory Closure Guard**:
     - The **`Final HSE Sign-Off & Close Incident`** button is gated until **100% of CAPA items are marked `COMPLETED`** (shows clear progress bar: `2 of 3 CAPA actions completed — complete remaining 1 to close incident`).
4. **Tab 4: `Statutory Report Dossier (Form B-12)`**:
   - Formatted regulatory preview for **Department of Inspection for Factories and Establishments (DIFE Form B-12) / Department of Explosives / DoE**, with 1-tap `Mark Statutory Notice Dispatched`.

---

## 3. MOD-05: Enterprise Asset Management (EAM) Specification

*Reference: `client/src/views/AssetView.tsx`*

### 3.1 Top Verdict Banner & 4 Mobile Module Tabs
- **Plain-Language Verdict Banner**:
  - *"18 critical refinery & IT assets tracked (Net Book Value: BDT 14.8 Cr) · 2 BSTI calibration renewals and 1 custody confirmation need action."*
- **4 Clean Mobile Sub-Tabs**:
  1. `Asset Register` (All assets + 8-stage lifecycle + QR Passport)
  2. `Work Orders & Calibration` (Maintenance tickets + 1-tap BSTI Calibration certification)
  3. `Financials & Depreciation` (Straight-Line vs Declining-Balance calculator)
  4. `Custody & Decommissioning` (Custody transfers + Disposal Checklist)

---

### 3.2 Sub-Tab 1: Asset Register & 360° Asset Dossier
1. **Filters & Search**:
   - Search by Asset Tag (`AST-KER-001`), SAP Asset Code (`SAP-ANLN1-100042`), Serial No., or Custodian.
   - Filter by Site (`All`, `Keraniganj Plant`, `Baridhara HQ`), Category (`Refinery Process Unit`, `Lab & Testing`, `Heavy Vehicle / Tanker`, `Power & Utility`, `IT & Server`), and Criticality (`Critical A`, `Essential B`, `General C`).
2. **8-Stage Asset Lifecycle Stepper**:
   - Every asset displays its current position on the 8-stage EAM pipeline:
     `1. Requisition` -> `2. Approved` -> `3. Procured` -> `4. Commissioned` -> `5. Operational` -> `6. Under Maintenance` -> `7. Decommission Pending` -> `8. Disposed`
   - Includes a context-aware button to advance requisitioned/procured assets through commissioning.
3. **360° Asset Detail Dossier Sheet (4 Inner Sections)**:
   - **Section A (`Overview & QR Passport`)**: Technical specs, Warranty expiry, Health score (`94%`), and **`View QR Asset Passport`** modal (printable equipment plate with QR code, SAP ID, and emergency shutdown note).
   - **Section B (`Custody & Digital Acceptance`)**: Current custodian name (`Tanvir Ahmed` or `Engr. Harunur Rashid`). If `custodyAccepted == false`, displays a highlighted banner with 1-tap **`Confirm Custody Receipt`** or **`Flag Discrepancy / Damage`**.
   - **Section C (`Spare Parts Bill of Materials — BOM`)**: Lists linked critical spares (e.g., *Mechanical Seal Kit 45mm*, *PT100 RTD Temperature Probe*, *High-Temp Viton Gasket*) showing `In Stock` vs `Min Reorder Level` and inline **`-1 Consume`** and **`+5 Restock`** buttons!
   - **Section D (`Audit & Maintenance Timeline`)**: Complete chronological log of commissioning, calibrations, work orders, and transfers.

---

### 3.3 Sub-Tab 2: Maintenance Work Orders & BSTI Calibration
1. **Work Orders Queue**:
   - Filter by `All`, `Open`, `In Progress`, `Parts Pending`, `Completed`, and Type (`Preventive PM`, `Breakdown Repair`, `Statutory Calibration`).
   - **1-Tap Status Progression**: `Start Work Order` -> `Mark Parts Pending` -> `Complete & Restore Asset to Operational` (automatically sets the parent asset back to `OPERATIONAL` and updates health score).
   - **`+ Create Work Order` Sheet**: Select Asset, Type (`Preventive`, `Corrective`, `BSTI/ISO Calibration`), Priority, Assigned Engineer, Estimated Cost (BDT), and Description.
2. **Direct Calibration Certification Controls**:
   - For laboratory and Custody-Transfer metering assets (e.g., *Keraniganj Weighbridge WB-01*, *Bitumen Penetrometer LAB-04*, *Mass Flow Meter MFM-02*), provides 1-tap **`Certify Calibration (+1 Year Validity)`** and **`Flag Calibration Out-of-Tolerance`** buttons.

---

### 3.4 Sub-Tab 3: Financials & Depreciation Calculator
- **Interactive Depreciation Method Switcher**:
  - Toggle between **`Straight-Line (SL)`** and **`Double Declining Balance (DDB)`** right at the top of the tab!
- **Portfolio & Per-Asset Financial Cards**:
  - Dynamically calculates and displays for every asset:
    - `Original Acquisition Cost (BDT)`
    - `Salvage / Residual Value (BDT)` & `Useful Life (Years)`
    - `Accumulated Depreciation to Date (BDT)`
    - **`Current Net Book Value — NBV (BDT)`**
    - `Monthly Depreciation Charge (BDT/mo)`
    - **Economic End-of-Life (EoL) Watch Badge** when NBV approaches salvage threshold or cumulative maintenance cost exceeds 40% of acquisition cost.

---

### 3.5 Sub-Tab 4: Custody Transfers & Decommissioning Disposal Checklist
1. **Custody Transfers**:
   - Initiate transfer from Current Custodian -> New Custodian & Site (`Pending HOD Approval` -> `Pending Recipient Acceptance` -> `Completed`).
2. **Decommissioning & Multi-Item Disposal Checklist**:
   - `+ Initiate Decommissioning` sheet: Select Asset, Reason (`End of Useful Life`, `Irreparable Breakdown`, `Process Upgrade`), Disposal Method (`Scrap Auction`, `OEM Trade-In`, `Hazardous E-Waste Disposal`), and Estimated Scrap Recovery Value (BDT).
   - **Interactive 5-Step Disposal Checklist** on pending decommission records:
     1. `[✓] Technical Condemnation Certificate signed by Plant Engineer`
     2. `[✓] Hazardous Material / Bitumen Purge & Decontamination Completed`
     3. `[✓] Data / Proprietary Tag Wipe Verified`
     4. `[✓] Finance SAP Asset Retirement (`ABAVN`) Booked`
     5. `[✓] Gate Pass for Scrap / Buyer Removal Issued`
   - Once checklist items are checked, `chairman` / `hod` / `plant_gm` taps **`Authorize Final Asset Disposal`** -> Transitions asset to `DISPOSED`.

---

## 4. Files to Modify in Phase 7 (During Execution)

- `ftr-a/lib/features/incidents/presentation/incidents_screen.dart` & `incident_detail_screen.dart` — Add Safety KPI strip, 10 Plant Zones filter, interactive 5×5 Risk Matrix, 1-tap Quick Hazard sheet, 3-step Incident Wizard, 5-Whys + 6M Fishbone RCA workspace, CAPA tracker with 100% completion closure guard, and Statutory Form B-12 preview.
- `ftr-a/lib/features/assets/presentation/assets_screen.dart` & `asset_detail_screen.dart` — Organize into 4 tabs (`Register`, `Work Orders & Calibration`, `Financials & Depreciation`, `Custody & Decommissioning`), add 8-stage lifecycle stepper, Spare Parts BOM `-1 Consume` / `+5 Restock`, SL vs DDB depreciation toggle, Disposal Checklist, and QR Asset Passport sheet.
- `ftr-a/lib/mock/engines/incidents_engine.dart` & `assets_engine.dart` — Support 5×5 risk matrix fields, 5-Whys array, 6M Fishbone map, CAPA closure guard, Spare Parts BOM mutations, work order progression, calibration certification, and disposal checklist completion.

