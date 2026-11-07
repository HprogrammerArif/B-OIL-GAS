# 08 — Phase 8: Workforce Offboarding, Inner-Circle Directives & Pitch Polish

## 1. Current State & What Is Broken in `ftr-a/`

1. **Incomplete Workforce Directory & Offboarding (`lib/features/workforce/presentation/people_screen.dart` & `person_detail_screen.dart`)**:
   - Lacks the **`Active Staff` vs `Former Staff (Exit Archive)`** tab split (`client/src/views/WorkforceView.tsx`).
   - Lacks the **Workforce KPI Strip** (`Total Active`, `Keraniganj Plant`, `Baridhara HQ`, `Exit Clearances / Former`).
   - Lacks the **`+ Onboard New Employee` Modal** (which auto-generates `EMP-xxxx` and 8-digit SAP `PERNR`, assigns Grade 1–10, Site, Department, and Reporting HOD).
   - Lacks the interactive **7-Department Offboarding & Exit Clearance Sheet (`OffboardClearanceDrawer`)** with per-desk sign-off (`IT`, `Admin`, `Fleet`, `Finance`, `Department HOD`, `Security`, `HR Final Settlement`), unreturned company asset check, and final archive action.
2. **Incomplete Inner-Circle Leadership Chat (`lib/features/chat/presentation/chat_screen.dart`)**:
   - Lacks the **Channels (`#ch_executive`, `#ch_plant_ops`, `#ch_supply_chain`, `#ch_safety_command`) + Direct Messages** drawer/selector with live presence status (`Online`, `In Meeting`, `On Site at Plant`, `Away`) from `client/src/views/InnerCircleChat.tsx`.
   - Lacks **Executive Directive Mode (`canIssueDirective`)** with the 4 one-tap BOGCL directive templates (`Valve Overhaul`, `Fast-Track Crude L/C`, `Emergency Review Meeting`, `Stock Position Report`), `URGENT` priority badge, and interactive **`Acknowledge Directive`** button with audit timestamp.
   - Lacks **Voice Message Recording & Waveform Playback (`VoiceMessage`)**, Document attachment cards, **Emoji Reactions (`👍 ✅ ⚡ 👁️ 🚨 🙏`)**, **Pinned Message Banner**, In-channel search, and the simulated **Voice / Video Call Screen (`CallModal`)**.

---

## 2. MOD-16: Workforce Directory & Exit Clearance Specification

*Reference: `client/src/views/WorkforceView.tsx`*

### 2.1 Top Verdict Banner, KPI Strip & Directory Filters
- **Plain-Language Verdict Banner**:
  - *"412 active staff across Baridhara HQ & Keraniganj Refinery · 2 exiting employees are undergoing 7-department clearance."*
- **4 Workforce KPI Tiles**:
  1. `Active Staff` (count)
  2. `Keraniganj Refinery` (plant headcount)
  3. `Baridhara Head Office` (HQ headcount)
  4. `In Exit Clearance / Former` (count)
- **Primary Tabs & Filters**:
  - **Tabs**: `Active Directory` · `Exit Clearances in Progress` · `Former Staff Archive`.
  - **Filters**: Site (`All Sites`, `Head Office, Baridhara`, `Keraniganj Refinery`), Department (`All`, `Refinery Operations`, `Finance & Accounts`, `HR & Admin`, `Sales & Marketing`, `Supply Chain`, `Transport & Fleet`, `HSE & Quality`), and Search (`Name`, `EMP-ID`, `SAP PERNR`, `Designation`).

---

### 2.2 Onboard New Employee Sheet (`OnboardEmployeeSheet`)
- Visible to `hr_admin` / `chairman`:
  - **Auto-Generated Identifiers**: Shows live preview of next **Employee ID (`EMP-1088`)** and **SAP PERNR (`00108826`)**.
  - **Fields**: Full Name, Designation, Pay Grade (`Grade 1` to `Grade 10`), Department, Primary Site (`Baridhara HQ` / `Keraniganj Plant`), Reporting HOD dropdown, Official Mobile & Email, Blood Group, and Shift (`General` / `Shift A/B/C`).
  - Submitting immediately adds the employee to the active directory and initializes their default leave entitlements (`10 Casual · 14 Sick · 20 Earned`) and shuttle eligibility.

---

### 2.3 7-Department Exit Clearance Drawer (`OffboardClearanceSheet`)
When an employee initiates resignation/retirement (or HR taps `Initiate Offboarding` / `Manage Clearance`), tapping their card opens the **7-Desk Exit Clearance Checklist**:

| Desk # | Clearing Department | What Is Verified | Action |
| :-: | :--- | :--- | :--- |
| 1 | **Department HOD** | Handover of active files, client accounts & technical duties | `[✓] Clear Desk` |
| 2 | **IT & ERP Systems** | Laptop/Phone return, SAP user revocation & email archival | `[✓] Clear Desk` |
| 3 | **Admin & Facilities** | ID card, drawer keys & workstation handover | `[✓] Clear Desk` |
| 4 | **Transport & Fleet** | Pool car clearance & Staff Shuttle Bus seat release | `[✓] Clear Desk` |
| 5 | **HSE & Plant Security** | PPE return, Gate Pass deactivation & biometric removal | `[✓] Clear Desk` |
| 6 | **Finance & Accounts** | Travel advance / IOU adjustment & salary loan clearance | `[✓] Clear Desk` |
| 7 | **HR Final Settlement** | Provident Fund, Gratuity & Experience Certificate issuance | `[✓] Clear Desk` |

- **Cross-Module Asset Custody Check (`MOD-05` Integration)**:
  - Queries `db.assets` for any equipment still held by this employee. If unreturned assets exist (e.g., `AST-HQ-014 Dell Latitude Laptop`), displays an amber warning card with a 1-tap **`Return Asset to Store & Clear IT Desk`** helper!
- **Final Archive Gate**:
  - Once **all 7 desks are marked `CLEARED`** (includes a 1-tap `Clear All Remaining Desks` button for fast demo flow), the **`Finalize Settlement & Move to Former Archive`** button activates, transitioning the employee to `FORMER` status with an official clearance certificate timestamp.

---

## 3. MOD-15: Inner-Circle Leadership Chat & Executive Directives

*Reference: `client/src/views/InnerCircleChat.tsx`*

### 3.1 Channel & Direct Message Selector
- **Top Channel Switcher Pill / Sheet**:
  - **4 Official Command Channels**:
    1. `#ch_executive` — **Executive Board & GM Command** *(Chairman, Plant GM, HR GM, Finance HOD)*
    2. `#ch_plant_ops` — **Keraniganj Refinery & Bitumen Ops** *(Plant GM, HSE, Maintenance, QC Lab)*
    3. `#ch_supply_chain` — **Crude L/C, Commercial & Dispatch** *(Finance, Sales, Transport)*
    4. `#ch_safety_command` — **HSE Emergency & Gate Security** *(Plant GM, Security, Transport)*
  - **Direct Messages (1-to-1 with Live Presence Dot)**:
    - Shows each executive with live status badge: `● Online at HQ`, `● On Site at Keraniganj`, `◐ In Finance Review`, `○ Away`.
- **Header Actions**:
  - **In-Channel Search** (filters messages with keyword highlight), **Pinned Messages Banner** (tap to jump to pinned directive), and **Simulated Voice / Video Call Button** -> Opens `CallModal` showing encrypted BOGCL executive call screen with mute/speaker/end controls.

---

### 3.2 Executive Directive Composer (`canIssueDirective`)
For `chairman`, `plant_gm`, `hr_admin`, and `hod`, the message composer includes a toggle switch: **`Standard Message` <-> `⚡ Issue Executive Directive`**.

When **`⚡ Executive Directive`** mode is active:
1. **4 One-Tap BOGCL Directive Templates**:
   - **Preset 1 (`Valve Overhaul`)**: *"DIRECTIVE: Complete Keraniganj VDU isolation valve overhaul within 6 hours and submit LOTO clearance certificate before evening shift."*
   - **Preset 2 (`Fast-Track Crude L/C`)**: *"DIRECTIVE: Fast-track Treasury verification and L/C margin endorsement for 15,000 MT Bitumen feedstock shipment today."*
   - **Preset 3 (`Emergency Review Meeting`)**: *"DIRECTIVE: All GMs and Department Heads join emergency operational review at 04:00 PM with updated KPI sheets."*
   - **Preset 4 (`Stock Position Report`)**: *"DIRECTIVE: Submit verified Bitumen 60/70 & 80/100 tank-farm stock position and RHD dispatch schedule within 2 hours."*
2. **Priority & Target**:
   - Toggle **`URGENT / RED ALERT`** badge + assign target officer (`Engr. Harunur Rashid`, `Farida Begum`, `Sayeda Afroza`, `Md. Kamruzzaman`).
3. **Interactive Directive Card in Chat Stream**:
   - Renders with a distinct gold/crimson executive border, Directive Reference ID (`DIR-2026-042`), Issuer designation, and an interactive **`Acknowledge & Confirm Execution`** button.
   - Tapping `Acknowledge` stamps the officer's name and timestamp (`"Acknowledged by Engr. Md. Harunur Rashid at 11:04 AM"`) onto the card!

---

### 3.3 Voice Notes, Attachments, Reactions & Pins
1. **Voice Note Recorder & Waveform Player (`VoiceMessage`)**:
   - Tap mic icon in composer -> simulates recording (`00:05...`) and sends a **Voice Note Card** with Play/Pause button, animated bar waveform, duration (`0:18`), and voice transcript subtitle.
2. **Document & Dossier Attachment**:
   - `+ Attach` sheet lets user attach a file or link an existing `Note-Sheet (NS-2026-0042)`, `Bitumen QC Report`, or `HSE Incident` directly into the chat stream.
3. **Message Long-Press / Tap Actions**:
   - **6 Quick Emoji Reactions**: `👍` `✅` `⚡` `👁️` `🚨` `🙏` (toggles count pill below message).
   - **Pin / Unpin Message**: Pins the message to the top banner of the channel.

---

## 4. MOD-01: Official Notices, EN/BN Localization & 10-Minute Pitch Script

### 4.1 MOD-01 Official Notices (`lib/features/notices/presentation/notices_screen.dart`)
- Ensure every notice card supports:
  - Category filter (`All`, `Chairman Secretariat`, `HR & Holiday`, `Refinery HSE Alert`, `Finance Circular`).
  - **`Acknowledge Receipt ("Read & Understood")`** button with live acknowledgment counter (`384 / 412 staff acknowledged`).
  - **`+ Publish Official Notice`** sheet for `chairman`, `hr_admin`, `plant_gm`.

### 4.2 Bilingual EN/BN Completeness (`lib/l10n/app_en.arb` & `app_bn.arb`)
- Every new label, tab, button, and status pill added across Phases 1–8 must have matching English and natural Bangladeshi corporate/industrial Bangla keys in `app_en.arb` and `app_bn.arb`, toggled instantly from the Persona Switcher sheet or Top Bar.

### 4.3 The 10-Minute Live Pitch Walkthrough Script (For Client Presentation)
Once Phases 1–8 are implemented, the presenter can demonstrate the entire BOGCL B2B operation on a single phone in **10 minutes**:

1. **Minute 0–2 (`Chairman — EMP-0001`)**:
   - Open Executive Cockpit -> Play/Record **Voice Briefing** -> Open **Note-Sheet `NS-2026-0042`**, inspect `RouteStepper`, `BudgetCheck`, and `PriceComparison` table -> **OTP E-Sign** and show **Cryptographic Certificate** -> Jump to **Inner-Circle Chat** and issue a **1-Tap Executive Directive**.
2. **Minute 2–4 (`Plant GM — EMP-0012`)**:
   - Tap Role Pill -> Switch to **Plant GM** -> Acknowledge Chairman's Directive -> Tap **`Release Bitumen Batch (BOGCL-BIT-2026-B88)`** and verify BDS 1238:2020 lab parameters -> Toggle a **LOTO Safety Permit** -> Open **HSE Incidents**, show the **5×5 Risk Matrix**, **5-Whys / 6M Fishbone RCA**, complete the final **CAPA item**, and sign off closure -> Open **EAM Assets**, consume a spare part from BOM, and toggle **Straight-Line vs DDB Depreciation**.
3. **Minute 4–6 (`HOD Finance — EMP-0062` & `Compliance — MOD-06`)**:
   - Switch to **HOD Finance** -> Show **Quarterly Budget Ceiling (`BDT 4.50 Cr`)** -> Batch-approve pending items -> Approve **Expense Claim** to generate **`SAP-FI-2026-xxxx` Voucher** -> Open **Licences (`MOD-06`)**, approve the **Treasury Challan Fee**, advance the permit, and dispatch a **DO Letter via Courier** (which auto-creates a tracked Parcel in `MOD-04`!).
4. **Minute 6–8 (`Employee — EMP-1042`)**:
   - Switch to **Senior Sales Officer (Tanvir Ahmed)** -> Show **Digital Gate Pass QR** -> Open **Attendance & Leave**, demonstrate the **Geofence Mini-Map (`Inside 110m` vs `Outside 4.2km`)** and punch in -> Open **Staff Shuttle Bus (`MOD-14`)**, view the **52-Seat Map**, and **Vacate Seat 4A** for today -> Book a **Multi-Stop Pool Car** in `MOD-09` and invite a **Visitor (`MOD-08`)** with WhatsApp QR pass share.
5. **Minute 8–10 (`Transport Admin — EMP-0045`, `Driver — EMP-0821` & `HR Admin — EMP-0028`)**:
   - Switch to **Transport Admin** -> Execute **1-Tap Smart Carpooling Merger** -> Promote a waitlisted rider into Tanvir's vacated shuttle seat -> Switch to **Driver (`Md. Rafiqul Islam`)** -> Start trip with **Opening Odometer**, log a **Buriganga Bridge Toll Slip**, and hand over a **Corridor Parcel with 4-digit OTP** -> Switch to **HR Admin** -> Complete a **7-Department Exit Clearance** and toggle **English <-> বাংলা** live!

