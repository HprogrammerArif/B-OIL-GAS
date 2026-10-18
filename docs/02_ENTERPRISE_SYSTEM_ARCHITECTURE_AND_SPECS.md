# BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
## "BOGCL OneOps" — Enterprise System Architecture & Functional Specifications
**Document Ref:** BOGCL-ARCH-2026-V1  
**Author:** Enterprise Solutions Architect  
**Classification:** Confidential Technical Specification  

---

## 1. Architectural Philosophy: The Modular Monolith

Enterprise systems often fail when built either as fragmented single-purpose apps or as over-engineered microservices requiring massive DevOps overhead. BOGCL OneOps is designed as an **Engine-Driven Modular Monolith**:

```
+------------------------------------------------------------------------------------+
|                        PRESENTATION LAYER (Omnichannel)                            |
|  • Web Portal (Next.js / TypeScript / Tailwind-free Custom Theme / React Query)    |
|  • Mobile Suite (React Native / Expo / Native Geofencing / Push Notification)     |
|  • Gatekeeper & Kiosk Terminal (Lightweight Web / Tablet Scan UI)                  |
+------------------------------------------------------------------------------------+
                                       │ HTTPS / WSS
                                       ▼
+------------------------------------------------------------------------------------+
|                         API GATEWAY & SECURITY PERIMETER                           |
|  • JWT / Session Auth   • Rate Limiting   • RBAC Guard   • Input Sanitization (Zod)|
+------------------------------------------------------------------------------------+
                                       │
+------------------------------------------------------------------------------------+
|                               CORE SYSTEM ENGINES                                  |
| 1. Dynamic Workflow Engine (State Machine, multi-tier approvals, SLA escalation)   |
| 2. Due-Date & Expiry Scheduler (BullMQ / Redis cron: 90-60-30-7 day cascades)       |
| 3. Notification Dispatcher (In-app, Push via FCM, Bangladesh SMS Gateway API)     |
| 4. Document Security & Digital Note-Sheet Engine (PDF-Lib, SHA-256 Hashing)        |
| 5. Geospatial Verification Engine (Haversine formula, anti-mock GPS detection)     |
| 6. Audit & Custody Logger (Immutable append-only chronological event ledger)       |
+------------------------------------------------------------------------------------+
                                       │
+------------------------------------------------------------------------------------+
|                            16 FUNCTIONAL BUSINESS MODULES                          |
| [01] Notice Board               [02] Chairman Message       [03] Document E-Sign   |
| [04] Parcel Chain-of-Custody    [05] Asset & Calibration    [06] License Renewal   |
| [07] HSE Incident Reporting     [08] Guest Protocol Passes  [09] Fleet & Trips     |
| [10] Geofenced Attendance       [11] TA & DA Engine         [12] Conveyance Claims |
| [13] Tour & Expense Settlement  [14] Bus Seat FIFO Queue    [15] Chairman Suite    |
| [16] System Master & RBAC                                                          |
+------------------------------------------------------------------------------------+
                                       │
+------------------------------------------------------------------------------------+
|                                PERSISTENCE LAYER                                   |
| • PostgreSQL 16 (Relational business records, JSONB workflow templates)           |
| • Redis 7 (BullMQ worker queues, session cache, real-time presence)                |
| • S3 / MinIO Object Storage (Encrypted PDFs, receipts, incident media, QR stamps)  |
+------------------------------------------------------------------------------------+
```

---

## 2. Shared Core Engines (The Secret to Delivering 16 Modules Rapidly)

### 2.1 The Dynamic Workflow & Approval Engine
Instead of writing separate approval logic for travel, conveyance, vehicle requests, leave, and documents, a single state-machine engine handles all approval flows.
- **Workflow Definition Model:**
  ```json
  {
    "workflow_type": "LICENSE_RENEWAL",
    "trigger_threshold_bdt": 100000,
    "stages": [
      { "stage": 1, "role": "COMPLIANCE_OFFICER", "action": "SUBMIT_DOCS", "sla_hours": 48 },
      { "stage": 2, "role": "HOD_LEGAL", "action": "APPROVE_FUND", "sla_hours": 24 },
      { "stage": 3, "role": "HEAD_OF_FINANCE", "action": "DISBURSE_FEES", "sla_hours": 48 },
      { "stage": 4, "role": "PLANT_GENERAL_MANAGER", "action": "INSPECTION_SIGN_OFF", "sla_hours": 72 },
      { "stage": 5, "role": "MANAGING_DIRECTOR", "action": "FINAL_ENDORSEMENT", "condition": "cost > 250000" }
    ]
  }
  ```
- **Supported State Actions:** `SUBMIT`, `APPROVE`, `REJECT`, `SEND_BACK_FOR_REVISION`, `DELEGATE`, `ESCALATE_ON_TIMEOUT`.
- **Automatic Delegation:** When a manager marks their status as "On Leave", pending approvals automatically re-route to their designated officer without bottlenecking company operations.

### 2.2 The Unified Due-Date & Compliance Engine
A centralized scheduler powered by Redis & BullMQ runs hourly scans against `due_records`:
- **Scanned Domains:**
  1. Business Licenses (BSTI, Department of Explosives, Fire, Environment).
  2. Vehicle Fitness, Tax Tokens, Route Permits & Driver Commercial Licenses.
  3. Refinery Equipment Hydro-Testing & Pressure Vessel Calibration certificates.
  4. Vendor Contracts & Insurance Policies.
- **Alert Cadence:** Configurable per asset/license: `T-90 days` (Planning), `T-60 days` (Budget Approval), `T-30 days` (Application Submitted), `T-15 days` (Urgent Escalation), `T-0 days` (Overdue Breach Alert to Director).

### 2.3 The Notification Dispatcher
- **Channels:** Native In-App Inbox, Push Notification (Firebase Cloud Messaging), SMS (Local Bangladesh Gateways like Teletalk, Grameenphone, or SSL Wireless), Corporate Email (SMTP / Exchange).
- **Bangla Localization:** Every template includes English and Bengali text interpolating dynamic tokens:
  - *EN:* `Vehicle # DHA-METRO-CHA-11-2045 has been assigned for your trip to Keraniganj Plant at 10:30 AM.`
  - *BN:* `কেরানীগঞ্জ প্ল্যান্টের জন্য আপনার ট্রিপে গাড়ি নং ঢাকা মেট্রো-চ-১১-২০৪৫ এবং চালক মো: রফিক নির্ধারিত হয়েছে (সময়: সকাল ১০:৩০)।`

---

## 3. Comprehensive Specifications for the 16 Functional Modules

---

### Module 01: Enterprise Notice Board
* **Objective:** Ensure vital corporate directives, safety alerts, and administrative circulars reach all employees with verifiable read receipts.
* **Target Audience:** All BOGCL Employees (Head Office, Refinery Plant, Riverine Depots, Sales Centers).
* **Key Capabilities:**
  * Rich-text editor with PDF attachments and priority flags (`NORMAL`, `URGENT`, `CRITICAL SAFETY`).
  * Audience targeting: By Company, Division, Department, Location (e.g., Keraniganj Plant only), or Grade.
  * Mandatory Acknowledgement: "Critical Safety" notices require a "Tap to Acknowledge" button before dismissing.
  * Read Audit Report: HR and Admin can see real-time statistics: `% Read`, `% Unread`, with names and timestamps.
  * Pinned Carousel on the employee dashboard and mobile home screen.

---

### Module 02: Chairman’s Direct Broadcast
* **Objective:** High-visibility channel for the Chairman & Board to communicate vision, milestone celebrations, festival greetings, and emergency directives directly to the entire workforce.
* **Key Capabilities:**
  * Multi-format support: Executive Video Addresses, Audio memos, Formal PDF Letters with digital gold embossed seal, or Rich Text.
  * Prominent VIP Presentation: Displayed in the Executive Hero Banner with Bashundhara Gold styling. Full-screen modal on next app login.
  * Publishing Authority: Restricted strictly to the Chairman and Executive Assistant (with preview verification).
  * Historical Archive: "Words of Leadership" archive organized by year and theme.

---

### Module 03: Paperless Document Approval & E-Signature (DocuSign + Digital Note-Sheet)
* **Objective:** Replace physical inter-office file movements with an audit-trailed, tamper-evident digital approval workflow that respects Bangladeshi corporate culture.
* **The "Digital Note-Sheet" Concept:**
  * Mirroring Bangladesh’s government e-Nothi and corporate practice: Every document attaches a running **Note-Sheet**.
  * Each reviewing officer appends their numbered paragraph (e.g., *Paragraph 4: "Proposed expenditure verified against FY26 Q4 fuel budget; recommended for approval"*), along with their signature stamp, timestamp, and designation.
* **E-Signature Mechanisms:**
  1. Drawn signature on touchscreens.
  2. Verified cryptographic signature stamp with Employee ID & Designation.
  3. 2FA OTP verification via SMS before applying high-value sign-offs.
* **Security & Tamper Evidence:**
  * Finalized document embeds a **Tamper-Evident Completion Certificate Page** listing: Document Unique Hash (SHA-256), IP addresses, geolocation coordinates, and timestamps of all signatories.
  * Downloadable as a sealed PDF with visual verification QR code.

---

### Module 04: Chain-of-Custody Parcel & Document Tracker
* **Objective:** Complete transparency over the physical transit of confidential files, refinery lab samples, spare parts, and inter-office letters.
* **Chain of Custody Lifecycle:**
  1. **Creation:** Sender inputs recipient, delivery location, urgency, and confidentiality level. Generates printable **QR Tracking Label**.
  2. **Dispatch Handoff:** Sender hands parcel to Dispatch/Reception. Reception scans QR code (Status: `DISPATCHED_FROM_ORIGIN`).
  3. **Transit Handoff:** Assigned pool driver or courier takes custody by scanning QR (Status: `IN_TRANSIT`).
  4. **Destination Receiving:** Destination mail room / plant gate scans QR (Status: `ARRIVED_AT_DESTINATION`).
  5. **Final Recipient Delivery:** Recipient scans QR or confirms with 4-digit SMS OTP (Status: `DELIVERED_CONFIRMED`).
* **Dispute & Exception Handling:**
  * "Report Missing / Delayed" button with automatic escalation to Admin if parcel is stuck in transit for >24 hours.

---

### Module 05: Industrial Asset Lifecycle & Calibration Management
* **Objective:** Track high-value capital equipment, refinery instrumentation, IT hardware, and vehicles from procurement to disposal, preventing unscheduled downtime.
* **Asset Master Fields:** Asset Tag (QR/Barcode), Serial No, OEM, Model, Department, Physical Location (Head Office, Plant Unit-2, Storage Tank Farm), Warranty Expiry, Maintenance Schedule, Custodian.
* **Oil & Gas Calibration & Safety Rules:**
  * Tracks statutory pressure vessels, safety relief valves, flow meters, LPG pumps, and fire suppression systems.
  * Auto-generates **Calibration Work Orders** 30 days prior to certificate expiry.
  * Equipment maintenance history log with parts replaced and service invoices.
  * Low-stock inventory alerts for critical consumable spares (filters, gaskets, lubricants).

---

### Module 06: Regulatory License & Statutory Compliance Lifecycle
* **Objective:** Eliminate the risk of plant shutdown or legal penalties caused by expired statutory licenses in Bangladesh.
* **Target Licenses:**
  1. Department of Explosives (DoE) Storage & Refining Licenses.
  2. Bangladesh Standards and Testing Institution (BSTI) Quality Certifications.
  3. Department of Environment (DoE) Environmental Clearance Certificate (ECC).
  4. Fire Service & Civil Defence Safety Clearance.
  5. City Corporation / Union Parishad Trade Licenses.
  6. BIWTA River Jetty & Mooring Permissions.
* **The 5-Step Renewal Pipeline:**
  ```
  [Stage 1: Alert & Fund Approval] (Auto-triggered at T-90 days)
          │  ── Compliance officer estimates renewal fees, gets Finance Director sign-off
          ▼
  [Stage 2: Application & Dossier Submission]
          │  ── Form submission to regulatory authority portal/office; submission receipt uploaded
          ▼
  [Stage 3: Inspection & Audit Scheduling]
          │  ── Authority inspector visit date logged; internal readiness checklist completed
          ▼
  [Stage 4: Post-Audit Compliance & Fee Payment]
          │  ── Chalan / Treasury deposit slip uploaded; compliance remarks addressed
          ▼
  [Stage 5: License Issuance & System Auto-Renewal]
          │  ── Digital copy of renewed license archived; new expiry date calculated
  ```

---

### Module 07: HSE (Health, Safety & Environment) Incident Management
* **Objective:** Foster a world-class safety culture in compliance with OSHA and Bangladesh Department of Inspection for Factories and Establishments (DIFE) standards.
* **Incident Classification:**
  * Severity Levels: `L1: Near Miss`, `L2: Minor First-Aid`, `L3: Medical Treatment / Equipment Damage`, `L4: Lost Time Injury (LTI)`, `L5: Critical / Emergency`.
  * Categories: Fire/Smoke, Chemical Spill/Gas Leak, Equipment Rupture, Vehicle Collision, Slip/Trip/Fall, Security Breach.
* **Workflow:**
  1. **Instant Mobile Reporting:** Quick photo/video capture with GPS coordinates. Anonymous reporting toggle available.
  2. **Emergency Triage:** Level 4 & 5 incidents trigger instant SMS/call alerts to Plant Safety Director and Chairman's Office.
  3. **RCA (Root Cause Analysis):** 5-Why methodology or Fishbone diagram module for HSE investigators.
  4. **CAPA (Corrective and Preventive Actions):** Assign actionable tasks with target dates to engineers. Incident cannot be closed until CAPA verification is signed off.

---

### Module 08: Guest & Protocol Visitor Management
* **Objective:** Provide frictionless, dignified, and secure reception for guests across Bashundhara Corporate HQ and BOGCL Refinery Plants.
* **3-Tier Protocol Handling:**
  * **Class A: VIP Guests (Dignitaries, Foreign Partners, Board Guests):**
    * Chairman/MD office pre-authorization. Reserved VIP parking, dedicated reception escort, executive lounge access, and refreshments notification to hospitality staff.
  * **Class B: Government Officials (Ministry, BSTI, Customs, Tax, Fire Service):**
    * Protocol officer automatically assigned. Regulatory liaison alert triggered. Meeting room pre-booked with presentation amenities.
  * **Class C: General Business Visitors / Contractors:**
    * Host employee pre-registers or visitor registers at security kiosk via phone number. Instant digital QR badge generated. Host receives "Guest Arrived at Reception" mobile alert.
* **Emergency Muster Integration:** In case of plant fire alarm, system prints/displays exact list of external visitors currently inside premises.

---

### Module 09: Fleet & Transport Management System
* **Objective:** Modernize company vehicle allocations, reduce unauthorized travel, control fuel costs, and optimize vehicle maintenance.
* **Workflows:**
  1. **Requisition:** Employee submits travel requisition (Date/Time, Origin, Destination, Purpose, Number of Passengers, Luggage).
  2. **Approval:** Line Manager approves business justification.
  3. **Dispatch & Pooling:** Transport Admin assigns available vehicle and driver. System intelligently highlights other employees traveling to the same route for passenger pooling.
  4. **Trip Lifecycle:** Driver mobile app records trip start (odometer photo), real-time GPS route, trip end (closing odometer).
  5. **Fuel & Maintenance:** Driver submits fuel chalan/receipt with meter reading; system calculates km/liter efficiency and flags fuel anomalies.

---

### Module 10: Geo-Fenced Mobile Attendance & Shift Management
* **Objective:** Accurately record employee attendance across diverse locations (HQ, refineries, river depots, field sales) without costly hardware dependency.
* **Geofence Parameters:**
  * Polygonal or circular geofences defined per work location (e.g., 100m radius around Bashundhara HQ; 500m radius around Keraniganj Refinery).
* **Anti-Spoofing & Integrity Verification:**
  * Detection and rejection of Fake GPS / Mock Location apps.
  * Server-side Haversine mathematical distance calculation.
  * Optional Office BSSID (Wi-Fi Mac Address) verification for indoor punch accuracy.
* **Operational Exceptions:**
  * Field Duty (OD - On Duty) Mode: Allows off-site punch with manager pre-approval and mandatory selfie/location capture.
  * Missed Punch Regularization: Employee requests correction within 48 hours with manager approval.

---

### Module 11: TA & DA (Travel Allowance & Daily Allowance) Policy Engine
* **Objective:** Automate travel claim calculations based on established BOGCL corporate policy grades, eliminating disputes and manual finance audits.
* **Policy Rate Matrix:**
  * Allowance rates structured by **Employee Grade** (Executive, Assistant Manager, GM, Director) and **Destination Tier** (Dhaka Metropolitan, Divisional Cities, District/Plant Sites, International).
  * Auto-computes DA based on departure and return timestamps (e.g., >8 hours = 50% DA; >12 hours = 100% DA).
  * Travel fare calculations (AC train, air travel, CNG, bus) validated against grade entitlement ceiling.
* **Approval & Settlement:** Line Manager verifies journey -> Internal Audit validates against policy -> Accounts disburses via bank transfer/payroll integration.

---

### Module 12: Conveyance Reimbursement Management
* **Objective:** Streamline everyday local travel reimbursements for sales officers, liaison executives, and procurement teams.
* **Features:**
  * Per-trip entry: Date, Origin, Destination, Transport Mode (Rickshaw, CNG, Uber, Bus, Personal Motorbike).
  * Auto-mileage calculator for personal motorbikes (e.g., 6.00 BDT/km).
  * Digital Receipt Upload (for ride-shares, toll chalan) or "Self-Declaration of Unreceipted Local Fare" with daily cap.
  * One-Click Batch Submission: Employees submit all monthly conveyance in a single claim batch with one-click manager bulk approval.

---

### Module 13: Tour & Expense Advance Settlement
* **Objective:** End-to-end management of official business tours, advances, and final accounting settlements.
* **Lifecycle:**
  1. **Tour Application & Advance Request:** Employee outlines tour itinerary, expected hotel, daily allowance, client entertainment budget, and requests cash/bank advance.
  2. **HOD & Finance Approval:** Budget verification and advance release.
  3. **Post-Tour Settlement:** Within 7 days of tour completion, employee submits actual expense claims with bills.
  4. **Balance Reconciliation:** Automatic calculation: `Advance Received - Approved Expenses = Net Payable/Receivable`. Direct integration with finance vouchers.

---

### Module 14: Employee Bus Seat Reservation (FIFO Waitlist System)
* **Objective:** Transparent, fair, and conflict-free allocation of company-provided shuttle bus seats between Dhaka residential hubs and industrial plants.
* **The Algorithmic Problem:** A route has 20 seats; 35 employees desire transport. Who gets the seat, and what happens when an employee resigns or transfers?
* **Business Logic & Rules:**
  1. **Seat Allocation Status:** Fixed allocated seats (1 to 20).
  2. **The FIFO Waitlist:** Waitlisted employees ranked strictly by **Timestamp of Application**.
  3. **Automatic Trickle-Down Cascade:**
     * When an existing seat holder resigns, changes shift, or releases their seat, the system automatically marks the seat `OFFERED` to Waitlist Rank #1.
     * The employee receives a push notification and SMS with a **48-Hour Decision Window**.
     * If accepted: Seat allocated permanently.
     * If rejected or expired without action: Offer automatically drops to Waitlist Rank #2.
  4. **Temporary Daily Sharing:** If an allocated member is on approved leave for >3 days, their seat is opened to daily standby requests.

---

### Module 15: Chairman Executive Command Suite & Inner-Circle Comms
* **Objective:** Give the Chairman, Managing Director, and Board Members supreme, real-time visibility into enterprise health, with exclusive private communication channels.
* **Key Executive Features:**
  * **Executive Health Cards:** Live headcount present, pending high-value approvals, critical license countdowns (licenses expiring in <30 days), and active HSE incidents.
  * **"Inner Circle" Executive Roster:** Curated roster of key C-level leaders, advisors, and general managers showing real-time operational status:
    * `Present at HQ` | `At Keraniganj Plant` | `On Official Tour (Chittagong)` | `In Scheduled Meeting` | `On Approved Leave (Informed)` | `Absent (Uninformed)`.
  * **Chairman Secure Direct Comms:**
    * Encrypted 1-on-1 and leadership group messaging.
    * Priority Urgent Directives: High-priority messages require single-tap confirmation of receipt.
    * Document Quick-Endorsement: Chairman can approve critical requisitions directly from mobile with biometric (FaceID/Fingerprint) authentication.

---

### Module 16: System Administration, RBAC & Master Configuration
* **Objective:** Provide BOGCL Super Admins with complete governance to manage organization charts, roles, permissions, and master dropdowns without touching code.
* **Capabilities:**
  * Comprehensive Org Hierarchy: Company -> Business Unit -> Department -> Plant/Office Location -> Designation -> Grade.
  * Granular Permission Matrix: Over 85 individual capabilities (e.g., `doc.sign`, `fleet.dispatch`, `license.approve_fund`, `incident.close`).
  * Scoped Data Visibility: `SELF`, `SUBORDINATES`, `DEPARTMENT`, `PLANT_LOCATION`, `GROUP_WIDE`.
  * System Parameter Tuning: Office geofence coordinates, conveyance rate per km, approval SLA hours, SMS gateway credentials.
