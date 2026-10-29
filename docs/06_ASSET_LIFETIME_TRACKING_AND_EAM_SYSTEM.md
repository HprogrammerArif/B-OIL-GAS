# BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
## "BOGCL OneOps" — Enterprise Asset Lifetime Tracking & Reliability Management System (EAM / ITAM / FI-AA)
**Document Ref:** BOGCL-EAM-2026-V1  
**Author:** Principal Enterprise Asset & Reliability Architect  
**Standards Alignment:** ISO 55001:2024 · ISO 14224 (Oil & Gas) · IAS 16 / BAS 16 · API 510/570/653 · ASME Sec VIII · ITIL v4 ITAM  
**Classification:** Master Functional, Financial & Technical Specification  

---

## 1. Executive Summary & Industry Benchmark

In capital-intensive downstream petroleum refining, bitumen processing, marine terminal storage, and multi-site corporate operations, **physical assets represent over 78% of balance-sheet capital**. Traditional spreadsheets or disconnected inventory tables fail because they only record *what was bought*—ignoring **custody chain, runtime degradation, statutory calibration compliance, total cost of ownership (TCO), depreciation accounting, offboarding recovery, and auditable end-of-life disposal**.

The **BOGCL Asset Lifetime Tracking System (ALTS)** is engineered as an integrated **Enterprise Asset Management (EAM) + IT & Corporate Asset Management (ITAM) + Fixed Asset Accounting (SAP S/4HANA FI-AA)** engine within **BOGCL OneOps**. It governs every physical and capital asset from **Cradle (CAPEX Requisition) to Grave (Condemnation, Disposal & 10-Year Statutory Archive)**.

### 1.1 International & Bangladesh Statutory Standards Followed

| Domain | Governing Standard / Authority | Implementation in BOGCL OneOps |
| :--- | :--- | :--- |
| **Asset Management System** | **ISO 55000 / ISO 55001 / ISO 55002** | Risk-based criticality grading (`Class A/B/C`), lifecycle value realization, immutable audit trail, and alignment between engineering reliability and CFO financial ledgers. |
| **Oil & Gas Equipment Taxonomy** | **ISO 14224** (*Petroleum & Natural Gas Reliability Data*) | Standardized 6-tier functional hierarchy (`Enterprise → Site → Unit → System → Equipment Tag → BOM Component`), standardized failure modes, `MTBF`, `MTTR`, and runtime tracking. |
| **Fixed Asset Accounting** | **IAS 16 / BAS 16 & IAS 36** (*Property, Plant & Equipment*) | Capitalization vs. OPEX distinction, Straight-Line (`SLM`), Written-Down Value (`WDV`), and Units-of-Production (`UoP`) depreciation engines, Net Book Value (`NBV`), salvage value, and disposal gain/loss accounting. |
| **Refinery Mechanical Integrity** | **API 510 / API 570 / API 653 & ASME Sec VIII Div 1** | Mandatory hydro-testing, ultrasonic NDT thickness verification, Pressure Safety Valve (`PSV`) pop-testing, and ATEX Zone-0/Zone-1 hazardous area certification tracking. |
| **Bangladesh Statutory Compliance** | **BSTI · Dept. of Explosives (DoE) · DIFE · BRTA** | `T-90 / T-60 / T-30 / T-15 / T-0` automated calibration and fitness escalation cascade preventing regulatory shutdowns or uncertified tank/meter operation. |
| **Corporate & Workforce ITAM** | **ISO/IEC 19770-1 & ITIL v4 Asset Management** | Employee custodian assignment, cryptographic handover acknowledgement, inter-site transit gate passes, NIST 800-88 data sanitization before disposal, and HR 4-Way Exit Clearance interlock. |

---

## 2. ISO 14224 Six-Level Functional Hierarchy & Asset Taxonomy

Every asset in BOGCL OneOps resides at an exact coordinate in the **ISO 14224 Functional Location Hierarchy**, ensuring maintenance costs and downtime roll up accurately to plant units and SAP cost centers:

```
Level 1: Enterprise        ── Bashundhara Oil & Gas Company Limited (BOGCL)
  └── Level 2: Facility    ── [KER] Keraniganj Bitumen Refinery | [HQ] Baridhara Corporate HQ | [CTG] Chattogram Marine Terminal
        └── Level 3: Unit  ── Unit-1 Crude Feed | Column Farm C-102 | Sulfur Recovery (SRU) | QC Lab | IT Data Suite | Jetty Gantry
              └── Level 4: System      ── High-Pressure Pumping | Atmospheric Distillation | Fire & Gas Detection | End-User Computing
                    └── Level 5: Asset ── Unique Tag (e.g., BOGCL-KER-PMP-102) + SAP FI-AA Master ID (e.g., AA-4100-00102)
                          └── Level 6: Maintainable BOM / Spares ── Mechanical Seal Kit, Impeller, H2S Cartridge, NVMe Array
```

### 2.1 Enterprise Asset Classifications & Depreciation Defaults

| Category Code | Classification | Typical BOGCL Examples | Default Useful Life | Default Salvage % | Primary SAP GL / Cost Center | Primary Custodian Role |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| `plant` | **Refinery Plant & Process Machinery** | Multiphase Crude Pumps, Bitumen Distillation Towers, Thermal Boilers, 1200kVA Generators | 10 – 20 Yrs | 8% – 10% | `GL-4102-KER` (Plant CAPEX) | **Plant General Manager** (`plant_gm`) |
| `vehicle` | **Heavy Fleet & Executive Vehicles** | Scania 30,000L Heated Bitumen Tankers, Executive SUVs, Staff Transit Coaches, Forklifts | 7 – 10 Yrs | 12% – 15% | `GL-4205-FLT` (Fleet CAPEX) | **Transport & Admin Supervisor** (`transport_admin`) |
| `it` | **SCADA, DCS & Corporate IT Hardware** | HPE SCADA Master Servers, ThinkPad Laptops, ATEX Zone-1 Tablets, Core Firewalls | 4 – 5 Yrs | 5% | `GL-4301-ICT` (Digital Systems) | **HR & Corporate Services / IT** (`hr_admin` / `plant_gm`) |
| `safety` | **HSE, Fire & Gas Detection Systems** | Honeywell H2S/LEL Arrays, PSV Relief Valves, Foam Monitors, Breathing Apparatus (SCBA) | 5 – 8 Yrs | 0% – 5% | `GL-4109-HSE` (Safety Systems) | **Plant GM / HSE Lead** (`plant_gm`) |
| `lab` | **QC Metrology & Bitumen Lab Apparatus** | Automatic Digital Penetrometer, Dynamic Viscometer, Cleveland Open-Cup Flash Tester | 6 – 8 Yrs | 5% | `GL-4115-QCL` (Quality Lab) | **Plant GM / Chief Chemist** (`plant_gm`) |
| `corporate` | **Corporate Facility & Admin Assets** | VRF Precision HVAC, Biometric Turnstiles, Conference AV Systems, Executive Ergonomics | 7 – 10 Yrs | 5% – 8% | `GL-4401-ADM` (Corporate Admin) | **GM, HR & Corporate Services** (`hr_admin`) |

### 2.2 Risk & Reliability Criticality Matrix (ABC Grading)
- **Class A — Safety & Production Critical (`critical_a`):** Failure causes immediate refinery shutdown, environmental release, HSE hazard, or statutory breach. Mandatory redundant spares in store, `T-30` executive escalation, zero overdue calibration tolerance.
- **Class B — Operational Essential (`essential_b`):** Failure degrades throughput or logistics efficiency (e.g., individual bitumen tanker, QC lab instrument) but buffered by parallel capacity.
- **Class C — General Corporate & Support (`general_c`):** Standard employee workstations, office equipment, and non-critical peripherals.

---

## 3. The 8-Stage Cradle-to-Grave Asset Lifecycle State Machine

Every asset moves strictly through an auditable **8-Stage Lifecycle State Machine**. No asset can skip financial capitalization or be deleted from the database; retirement transitions the record into a permanent, read-only statutory archive.

```
  [STAGE 1: REQUISITIONED] ──► CAPEX / Staff Asset Request, Technical Spec & Multi-Tier Budget Vetting
             │
             ▼
  [STAGE 2: PROCURED & RECEIVING] ──► Purchase Order (PO), OEM Delivery, FAT / SAT Inspection & GRN
             │
             ▼
  [STAGE 3: IN_STOCK / TAGGED] ──► SAP FI-AA Capitalization, Laser Metal QR / RFID Tagging, Store Pool
             │
             ▼
  [STAGE 4: OPERATIONAL] ◄───────────┬──────────► [STAGE 5: IN_TRANSFER]
   (Active Custody, Telemetry,       │            (Inter-Site Gate Pass & Custodian Handover Sign-Off)
    Depreciation Clock Running)      │
             │                       │
             ▼                       │ (Certified & Returned to Service)
  [STAGE 6: MAINTENANCE / CALIBRATION_DUE]
   (PM, CM Breakdown, Statutory BSTI/ASME Calibration, NDT, Spare Consumption, Warranty Claims)
             │
             ▼ (Economic Life Exhausted / Irreparable / Obsolete)
  [STAGE 7: DECOMMISSIONED] ──► Condemnation Survey, LOTO Isolation, Decontamination / NIST Data Wipe, CFO/Chairman Sanction
             │
             ▼
  [STAGE 8: DISPOSED & ARCHIVED] ──► Auction / Scrap / Trade-In Proceeds, Gain/Loss GL Voucher, 10-Yr Immutable Archive
```

### Detailed Stage Specifications & Control Gates

#### Stage 1: Planning & CAPEX Requisition (`requisitioned`)
- **Trigger:** Department engineer, supervisor, or employee submits an Asset Requisition specifying business justification, technical specifications, criticality, site, and estimated cost.
- **Approval Routing:**
  - Corporate / Staff IT Equipment (`<= ৳2,50,000`): `Employee → Reporting HOD → GM HR & Corporate Services`.
  - Operational Plant / Fleet CAPEX (`৳2,50,001 – ৳10,00,000`): `Initiator → Plant GM / Transport Head → CFO / Head of Finance`.
  - Strategic Capital Machinery (`> ৳10,00,000`): `Initiator → Plant GM → CFO Budget Audit → Chairman & Managing Director Final Sanction`.

#### Stage 2: Procurement, Delivery & Acceptance Testing (`procured_receiving`)
- **Control Gate:** Upon Purchase Order (`PO`) fulfillment, engineering/IT executes **Factory Acceptance Test (FAT)** and **Site Acceptance Test (SAT)**.
- **Artifacts Captured:** Vendor Invoice, OEM Country of Origin Certificate, ATEX/ASME Compliance Dossier, Warranty Start/End Dates, and Annual Maintenance Contract (`AMC`) SLA terms.

#### Stage 3: Tagging, Capitalization & Central Store Pool (`in_stock`)
- **Identification:** System generates a unique human-readable tag (`BOGCL-{SITE}-{TYPE}-{SEQ}`) and binds a **SAP S/4HANA FI-AA Asset Master ID** (`AA-XXXX-XXXXX`).
- **Physical Labeling:**
  - *Refinery & Fleet:* Laser-etched anodized stainless steel QR + RFID nameplate bolted/riveted to chassis.
  - *Corporate & IT:* Tamper-evident destructible silver asset barcode & NFC tag.
- **Store Pool State:** Assets awaiting individual assignment reside in `in_stock` under Store Custodian responsibility.

#### Stage 4: Custody Assignment, Commissioning & Active Operation (`operational`)
- **Depreciation Activation:** Per IAS 16.55, depreciation begins when the asset is available for use in its intended location and condition.
- **Digital Custody Handover:** When assigned to an employee or plant engineer, the custodian executes a **Digital Custody Acceptance Sign-Off**, binding accountability to their SAP `PERNR` employee record.
- **Live Health & Runtime Telemetry:** Tracks operating hours (or vehicle km), health score (`0–100%`), `MTBF`, `MTTR`, and Remaining Useful Life (`RUL`).

#### Stage 5: Inter-Site & Inter-Custodian Chain-of-Custody Transfer (`in_transfer`)
- **Governance Rule:** Assets cannot silently change location or custodian.
- **3-Step Handshake:**
  1. **Origin Release:** Current custodian or admin initiates transfer specifying destination site, receiving custodian, reason, and generates a **Material Transit Gate Pass**.
  2. **In-Transit Tracking:** Security gate logs physical exit/entry.
  3. **Destination Acceptance:** Receiving custodian inspects condition and digitally signs acceptance, closing the transfer and updating Cost Center allocation.

#### Stage 6: Maintenance, Statutory Calibration & Overhaul (`maintenance` / `calibration_due`)
- **Work Order Types:**
  1. `PM` — Scheduled Preventive Maintenance (time-based or runtime-hour triggered).
  2. `CbM` — Condition-Based / Predictive Maintenance (triggered by SCADA vibration, thermal, or lube-oil anomalies).
  3. `CM` — Corrective / Breakdown Repair (unplanned fault ticket reported by custodian or operator).
  4. `CAL` — Statutory Calibration & NDT Inspection (BSTI flowmeter sealing, DoE pressure vessel hydro-test, ASME safety valve pop-test, BRTA heavy tanker fitness).
- **Warranty & AMC Protection:** Before approving vendor repair spend, the system checks `warrantyExpiry`. If active, the work order is flagged **`COVERED UNDER OEM WARRANTY (৳0 Cost)`** to prevent duplicate billing.
- **CAPEX Overhaul vs. OPEX Repair Accounting (IAS 16 Rule):**
  - Routine servicing, lubricants, filters, and calibration fees are posted to **Cumulative Maintenance OPEX** (increasing TCO without changing Book Value).
  - Major life-extending overhauls (e.g., distillation column re-traying or generator rotor rebuild) flagged as **Capitalized Value-Add Overhaul** increase the asset's Gross Capitalized Cost and recalculate depreciation over extended useful life.

#### Stage 7: End-of-Life (EoL) Assessment & Decommissioning (`decommissioned`)
- **Automated EoL Triggers:**
  - `Repair-to-Replacement Ratio >= 50%` (Lemon / Uneconomical Asset Rule).
  - `Remaining Useful Life (RUL) <= 0` with degraded health score (`< 40%`).
  - Catastrophic failure, safety recall, or regulatory obsolescence.
- **Mandatory 4-Point Pre-Disposal Safety & Governance Checklist:**
  1. **Technical Condemnation Survey:** Certified by Plant Engineering / IT Diagnostics that repair is uneconomical.
  2. **Hazardous Decontamination / Data Sanitization:** Chemical gas-free certificate for refinery equipment (`DoE / HSE`), or **NIST SP 800-88 cryptographic storage wipe** for SCADA servers/laptops.
  3. **Spares Cannibalization Audit:** Reusable sub-assemblies harvested into BOM spare inventory.
  4. **Executive Financial Write-Off Sanction:** Audited by Finance HOD (`CFO`) and sanctioned by `Chairman & MD`.

#### Stage 8: Final Disposal, Salvage Realization & Immutable Archive (`disposed`)
- **Execution Channels:** Public Tender / Auction, Authorized OEM Trade-In, Certified E-Waste / Scrap Metal Recycling, or Insurance Write-Off.
- **SAP FI-AA Retirement Accounting:**
  - Stops depreciation immediately.
  - Calculates **Net Gain / Loss on Disposal** = `Actual Disposal Proceeds - Net Book Value at Retirement`.
  - Generates SAP Retirement Journal Voucher (`SAP-AA-RET-YYYY-XXXX`).
- **10-Year Statutory Retention:** Record transitions to `disposed` archive. All historical maintenance certificates, calibration logs, and custody signatures remain permanently queryable for tax, customs, and DIFE/DoE safety audits.

---

## 4. Financial Valuation, IAS 16 Depreciation & TCO Engine

### 4.1 Supported Depreciation Formulas

1. **Straight-Line Method (`SLM`)** — *Standard for Refinery Columns, Buildings, Corporate & IT Assets:*
   $$\text{Annual Depreciation} = \frac{\text{Capitalized Cost} - \text{Salvage Value}}{\text{Useful Life (Years)}}$$

2. **Written-Down Value / Declining Balance (`WDV`)** — *Standard for Heavy Vehicles & High-Wear Rotating Equipment (e.g., 20% – 25% WDV rate):*
   $$\text{Depreciation}_t = \text{Opening NBV}_t \times r_{\text{WDV}}, \quad \text{floored at Salvage Value}$$

3. **Units-of-Production (`UoP`)** — *Used for Runtime-Bound Pumps, Generators & Compressors:*
   $$\text{Depreciation} = (\text{Capitalized Cost} - \text{Salvage Value}) \times \frac{\text{Actual Runtime Hours}}{\text{Total Rated Lifetime Hours}}$$

### 4.2 Total Cost of Ownership (TCO) & Economic Replacement Index

$$\text{TCO} = \text{Initial CAPEX} + \text{Capitalized Overhauls} + \sum \text{Maintenance OPEX} + \sum \text{Calibration Fees} - \text{Estimated Salvage Value}$$

$$\text{Economic Repair Ratio (\%)} = \frac{\sum \text{Cumulative Maintenance OPEX}}{\text{Initial CAPEX}} \times 100$$

- **Green (`< 30%`):** Economically healthy asset.
- **Amber (`30% – 49%`):** Aging asset; monitor PM frequency and spare consumption.
- **Crimson (`>= 50%`):** **Economic End-of-Life Alert** — System recommends CAPEX replacement evaluation rather than further expensive repairs.

---

## 5. Workforce Custody & HR 4-Way Exit Clearance Interlock

A major source of corporate asset leakage in large conglomerates occurs when employees resign, transfer departments, or retire while still holding company laptops, mobile phones, fuel cards, testing instruments, or safety equipment.

BOGCL OneOps enforces a **Zero-Leakage HR-to-Asset Interlock**:
1. Every employee-assigned asset is bound to the employee's identity (`custodian` / `custodianId`).
2. When HR initiates separation in **Workforce Master → 4-Way Exit Clearance (`OffboardClearanceDrawer`)**, the drawer queries the live **Asset Lifetime Store** in real time.
3. All active assets held by that employee are listed directly inside the clearance dossier with their Asset Tag, Serial Number, and Book Value.
4. HR or IT/Admin can execute a **1-Click "Reclaim & Return to Central Store Pool"**, which:
   - Transitions each reclaimed asset from `operational` to `in_stock` (Central Store Pool),
   - Closes the employee's custody record with timestamped return verification, and
   - Appends a permanent `CUSTODY_RETURNED_ON_EXIT` event to the asset's Lifetime Ledger.

---

## 6. Role-Based Access Control (RBAC) & Governance Placement

To uphold strict internal controls (**Segregation of Duties — SoD**) and keep the system clean and uncluttered, the Asset Lifetime Tracking System is exposed **only to the roles that have legitimate governance, operational, financial, or custodial responsibilities**, with tailored capabilities per role:

| Persona / Role | Sidebar Placement & Label | Primary Lifecycle Responsibility | Granular Capabilities Granted | Restricted / Hidden Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Chairman & MD** (`chairman`) | *Oversight & Risk* → **Asset Lifecycle & Valuation** | Executive Portfolio Oversight, CAPEX & Write-Off Final Sanction | View 100% Group Portfolio, IAS 16 Valuation & TCO Analytics, **Approve CAPEX Requisitions**, **Authorize Asset Condemnation / Write-Off & Disposal**. | Does not perform routine wrench-level spare logging (delegated to engineering). |
| **Plant General Manager** (`plant_gm`) | *Plant Operations* → **Plant Assets & Reliability** | Chief Engineering, Reliability, Calibration & Technical Survey Authority | **Register & Commission Assets**, **Create/Certify PM, CM & Statutory Calibration Work Orders**, **Consume/Restock BOM Spares**, **Initiate Transfers**, **Flag Deficiencies**, **Submit Condemnation Surveys**. | Final balance-sheet financial write-off requires CFO/Chairman sanction. |
| **Head of Dept / CFO Finance** (`hod`) | *Team & Finance* → **Fixed Assets & Depreciation** | IAS 16 Fixed Asset Controller, Depreciation Audit & Budget Sign-Off | Full **IAS 16 Financial & TCO Ledger**, switch/audit Depreciation Models (`SLM/WDV/UoP`), export FI-AA schedules, **Vetting of Asset Requisitions**, **Financial Write-Off & Disposal Gain/Loss Approval**. | Does not certify refinery ultrasonic NDT or LOTO mechanical clearances. |
| **GM, HR & Corporate Services** (`hr_admin`) | *Governance & Services* → **Corporate & Staff Asset Custody** | Corporate HQ Infrastructure & Workforce IT/Equipment Custody Owner | **Register Corporate/IT Assets**, **Assign / Transfer / Reclaim Employee Custody**, **Approve Staff Equipment Requisitions**, **Execute Offboarding Asset Recovery**. | Does not certify refinery pressure-vessel hydro-testing. |
| **Transport & Admin Supervisor** (`transport_admin`) | *Fleet Command* → **Heavy Fleet Asset Lifecycle** | Bitumen Tanker, Executive Pool Fleet & Depot Asset Custodian | View Fleet & Admin Assets, **Register Fleet Assets**, **Log Vehicle Overhaul & BRTA Fitness/Calibration**, **Initiate Depot Transfers**, **Flag Mechanical Defects**. | Cannot authorize balance-sheet write-offs or modify IAS 16 accounting policies. |
| **Employee Self-Service** (`employee`) | *Services* → **My Assigned Assets** | Personal Custodian Accountability, Handover Sign-Off & Fault Reporting | **Scoped strictly to own assigned assets & own requisitions**: **Digitally Sign Custody Receipt**, **View QR Passport**, **Report Defect / Repair Ticket**, **Submit New/Replacement Asset Requisition**. | **Cannot view** enterprise CAPEX/Depreciation ledgers, other units' refinery machinery, or disposal write-off queues. |
| **Duty Driver Terminal** (`driver`) | *Not Placed in Driver Sidebar* | *Excluded by Design (Operational Focus)* | Duty drivers use the simplified **Driver Duty Cockpit** (Assigned Trip, Breathalyzer, Highway SOS, Cargo Waybill) without enterprise ERP asset administration clutter. | All EAM administrative & financial modules hidden. |

---

## 7. Production PostgreSQL 16 Schema & SAP S/4HANA Sync Blueprint

```sql
-- 1. Master Capital & Corporate Asset Table (ISO 14224 + SAP FI-AA Bound)
CREATE TABLE assets (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag               VARCHAR(40) UNIQUE NOT NULL,        -- e.g., BOGCL-KER-PMP-102
    sap_asset_no            VARCHAR(30) UNIQUE NOT NULL,        -- e.g., AA-4102-00102
    name                    VARCHAR(180) NOT NULL,
    category                VARCHAR(24) NOT NULL,               -- plant, vehicle, it, safety, lab, corporate
    criticality             VARCHAR(16) NOT NULL,               -- critical_a, essential_b, general_c
    lifecycle_stage         VARCHAR(28) NOT NULL,               -- requisitioned..disposed
    facility                VARCHAR(80) NOT NULL,
    functional_location     VARCHAR(120) NOT NULL,
    gl_cost_center          VARCHAR(32) NOT NULL,
    oem_manufacturer        VARCHAR(100) NOT NULL,
    model_no                VARCHAR(100),
    serial_no               VARCHAR(100) UNIQUE NOT NULL,
    technical_specs         TEXT,
    custodian_emp_id        VARCHAR(24),                        -- FK -> employees.id (NULL when in_stock/disposed)
    custodian_acknowledged  BOOLEAN DEFAULT FALSE,
    acquisition_date        DATE NOT NULL,
    commissioning_date      DATE,
    warranty_expiry_date    DATE,
    amc_vendor              VARCHAR(120),
    purchase_cost_bdt       NUMERIC(15,2) NOT NULL,
    capitalized_additions   NUMERIC(15,2) DEFAULT 0,
    salvage_value_bdt       NUMERIC(15,2) DEFAULT 0,
    useful_life_years       NUMERIC(4,1) NOT NULL,
    depreciation_method     VARCHAR(12) DEFAULT 'SLM',          -- SLM, WDV, UOP
    cumulative_opex_bdt     NUMERIC(15,2) DEFAULT 0,
    runtime_hours           INTEGER DEFAULT 0,
    rated_lifetime_hours    INTEGER DEFAULT 50000,
    health_score            SMALLINT DEFAULT 100,
    mtbf_hours              INTEGER DEFAULT 2400,
    mttr_hours              NUMERIC(5,1) DEFAULT 4.0,
    calibration_cycle_days  INTEGER DEFAULT 180,
    next_service_date       DATE,
    disposal_dossier_json   JSONB,                              -- Populated at Stage 7 & 8
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Immutable Append-Only Asset Lifetime Event Ledger (SHA-256 Chained)
CREATE TABLE asset_lifecycle_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id),
    event_type              VARCHAR(40) NOT NULL,               -- COMMISSIONED, CUSTODY_SIGNED, TRANSFER, PM_CERTIFIED, OVERHAUL, DEFECT, CONDEMNED, DISPOSED
    stage_from              VARCHAR(28),
    stage_to                VARCHAR(28) NOT NULL,
    title                   VARCHAR(200) NOT NULL,
    notes                   TEXT,
    actor_name              VARCHAR(120) NOT NULL,
    actor_role              VARCHAR(60) NOT NULL,
    financial_impact_bdt    NUMERIC(15,2) DEFAULT 0,
    sap_voucher_ref         VARCHAR(40),
    signature_hash          CHAR(64) NOT NULL,                  -- Cryptographic tamper-evident SHA-256 digest
    occurred_at             TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chain-of-Custody & Inter-Site Transfer Ledger
CREATE TABLE asset_custody_transfers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_ref            VARCHAR(32) UNIQUE NOT NULL,        -- TRF-2026-XXXX
    asset_id                UUID NOT NULL REFERENCES assets(id),
    from_facility           VARCHAR(80) NOT NULL,
    to_facility             VARCHAR(80) NOT NULL,
    from_custodian          VARCHAR(120) NOT NULL,
    to_custodian            VARCHAR(120) NOT NULL,
    gate_pass_no            VARCHAR(40) NOT NULL,
    reason                  TEXT NOT NULL,
    status                  VARCHAR(24) NOT NULL,               -- in_transit, completed, cancelled
    initiated_by            VARCHAR(120) NOT NULL,
    initiated_at            TIMESTAMPTZ DEFAULT NOW(),
    received_at             TIMESTAMPTZ
);

-- 4. Preventive, Corrective & Statutory Calibration Work Orders
CREATE TABLE asset_work_orders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wo_number               VARCHAR(32) UNIQUE NOT NULL,        -- WO-2026-XXXX
    asset_id                UUID NOT NULL REFERENCES assets(id),
    wo_type                 VARCHAR(16) NOT NULL,               -- PM, CM, CBM, CAL
    priority                VARCHAR(16) NOT NULL,               -- critical, high, routine
    title                   VARCHAR(200) NOT NULL,
    assigned_engineer       VARCHAR(120) NOT NULL,
    loto_permit_ref         VARCHAR(40),
    regulatory_body         VARCHAR(60),                        -- BSTI, DoE, ASME, BRTA, ISO-17025
    cost_bdt                NUMERIC(15,2) DEFAULT 0,
    is_capex_overhaul       BOOLEAN DEFAULT FALSE,
    warranty_claimed        BOOLEAN DEFAULT FALSE,
    status                  VARCHAR(24) NOT NULL,               -- scheduled, in_progress, completed, rejected
    due_date                DATE NOT NULL,
    completed_at            TIMESTAMPTZ,
    certificate_ref         VARCHAR(60)
);
```

---

## 8. Key Operational & Financial KPIs Monitored

1. **Gross Capitalized Portfolio & Net Book Value (`NBV`):** Real-time balance sheet valuation across all 3 BOGCL sites.
2. **Fleet & Refinery Operational Availability (`%`):** Percentage of Class-A and Class-B assets in active `operational` readiness vs. unplanned downtime.
3. **Statutory Calibration Compliance Rate (`%`):** Zero-tolerance tracking of BSTI, Department of Explosives, ASME, and BRTA certificates due within `< 30 days`.
4. **Portfolio Health Score & Economic EoL Candidates:** Proactive identification of assets crossing the `50%` Repair-to-Replacement TCO threshold before catastrophic failure occurs.
5. **Custody Verification & Zero-Leakage Offboarding Rate (`100%`):** Percentage of assigned employee assets with cryptographic handover signatures and 100% exit clearance recovery.

