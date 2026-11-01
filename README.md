# BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
## "BOGCL OneOps" — Enterprise Digital Transformation Project Suite
### Complete Pitch, Architecture, Ledger, Playbook & Prototype Master Package

---

## 📌 Executive Overview

This repository and document suite contains the complete enterprise documentation and pitch deliverables for **Bashundhara Oil and Gas Company Limited (BOGCL)**, part of **Bashundhara Group**.

While BOGCL leadership originally asked for a prototype based on a high-level discussion, this strategic package has been developed to **pitch and win the entire multi-million enterprise digital operating system contract**.

---

## 🏗️ Repository Layout

| Path | Contents |
| :--- | :--- |
| `client/` | **Frozen interactive prototype** (React + Vite, 7 personas, 17 modules, no backend). Reference only — not modified. |
| `server/` | Production API — Express 5 · TypeScript · Prisma 6 · PostgreSQL 16 · Redis · BullMQ · Socket.IO (to be built from `docs/platform/01`) |
| `frontend/` | Production web app — React 19 · React Router 7 · Redux Toolkit + RTK Query · Tailwind v4 (to be built from `docs/platform/04`) |
| `app/` | Production mobile app — Expo SDK 56 · Expo Router · RTK Query (starter present; adapt per `docs/platform/05`) |
| `infra/` | docker-compose, Dockerfiles, CI/CD (per `docs/platform/08`) |
| `docs/platform/` | **Production specification suite 00–10** (below) |
| `.cursor/rules`, `.cursor/skills`, `AGENTS.md` | AI-agent guidance: always-on and path-scoped rules, task skills, entry point |

## 🧭 Production Platform Specification Suite (`docs/platform/`)

| Doc | Title | Scope |
| :-- | :--- | :--- |
| [00](docs/platform/00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md) | Platform Overview & Architecture | system context, repo layout, ADR-01..25, shared conventions, engines, module registry MOD-01..18, environments |
| [01](docs/platform/01_BACKEND_SPECIFICATION.md) | Backend Specification | process topology, folder layout, request lifecycle, core components, engines, jobs, integrations, testing, dependencies |
| [02](docs/platform/02_DATABASE_SCHEMA.md) | Database Schema | complete Prisma schema (108 tables, validated), views, indexes, data protection, seed, migration policy |
| [03](docs/platform/03_API_SPECIFICATION.md) | API Specification | `/api/v1` conventions, auth, platform endpoints, per-module endpoints, realtime events, permission keys |
| [04](docs/platform/04_WEB_FRONTEND_SPECIFICATION.md) | Web Frontend Specification | stack, structure, routing, RTK Query model, design system, per-module pages, performance, a11y, testing |
| [05](docs/platform/05_MOBILE_APP_SPECIFICATION.md) | Mobile App Specification | starter adaptation, offline queue, auth, push, geolocation, per-module screens, EAS release |
| [06](docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md) | Module Functional Specifications | state machines, `BR-xx-nn` business rules, workflows, notifications, KPIs, acceptance criteria for MOD-01..18 |
| [07](docs/platform/07_SECURITY_COMPLIANCE_AND_NFR.md) | Security, Compliance & NFRs | threat model, IAM, data protection, app security, e-sign integrity, NFR targets |
| [08](docs/platform/08_DEVOPS_ENVIRONMENTS_AND_CICD.md) | DevOps, Environments & CI/CD | local stack, env catalog, containers, pipelines, deployment, observability, backups |
| [09](docs/platform/09_DELIVERY_ROADMAP_AND_WORKPLAN.md) | Delivery Roadmap & Work Plan | phases, sprints, backlog seed, risks, quality gates, traceability |
| [10](docs/platform/10_CODING_STANDARDS_AND_CONVENTIONS.md) | Coding Standards & Conventions | TypeScript, server/web/mobile conventions, git workflow, tooling, doc standards |

## 📂 Pitch & Planning Documentation Suite

| Document | Purpose | Key Contents |
| :--- | :--- | :--- |
| **[00. Comprehensive Current-State Report](docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md)** | **Code-verified snapshot of what is built** | **Background & rationale, actual vs. declared stack, 17 module deep-dives with business rules and seed data, simulated features, gaps, defects, readiness and next steps.** |
| **[Master Status & Feature Ledger](file:///c:/project/B-OIL-GAS/docs/PROJECT_MASTER_STATUS_AND_FEATURE_LEDGER.md)** | **Living SSOT & Feature Registry** | **Complete module inventory, implementation status, persona matrix, change protocol, and mutation history.** |
| **[01. Executive Pitch & Project Dossier](file:///e:/B-OIL-GAS/docs/01_EXECUTIVE_PITCH_AND_PROJECT_DOSSIER.md)** | Strategic Boardroom Proposal | Executive vision, strategic alignment with Bashundhara Group, financial ROI, commercial contract protection, data residency & hosting strategy. |
| **[02. Enterprise Architecture & Specs](file:///e:/B-OIL-GAS/docs/02_ENTERPRISE_SYSTEM_ARCHITECTURE_AND_SPECS.md)** | Full Technical & Functional Blueprint | In-depth engineering design of all 16 modules, dynamic workflow engine, compliance scheduler, note-sheet e-signing, HSE incident CAPA, geofencing. |
| **[03. Traceability Ledger & Matrix](file:///e:/B-OIL-GAS/docs/03_REQUIREMENTS_TRACEABILITY_LEDGER_AND_MATRIX.md)** | Comprehensive Requirements Ledger | Module-by-module matrix covering triggers, business rules, multi-tier approvals, outputs, prototype scope, phase delivery, and risk assessment. |
| **[04. Client Playbook & Discovery Guide](file:///e:/B-OIL-GAS/docs/04_CLIENT_CONVERSATION_AND_DISCOVERY_PLAYBOOK.md)** | Meeting & Interview Playbook | 30-minute boardroom presentation script, stakeholder questionnaires (Chairman, HR, Legal, HSE, Fleet, Finance), tough objection handling. |
| **[05. Prototype Blueprint & Demo Script](file:///e:/B-OIL-GAS/docs/05_PROTOTYPE_BLUEPRINT_AND_DEMO_SCRIPT.md)** | Design System & Demonstration Guide | Bashundhara brand styling tokens (`#A51C30` Crimson, `#D4AF37` Gold), 6 live demonstration acts, psychological closing tactics to seal the deal. |
| **[06. Asset Lifetime Tracking & EAM System](file:///e:/B-OIL-GAS/docs/06_ASSET_LIFETIME_TRACKING_AND_EAM_SYSTEM.md)** | Cradle-to-Grave Asset Lifecycle Blueprint | ISO 55001 / ISO 14224 taxonomy, 8-stage lifecycle state machine, IAS 16 depreciation & TCO engine, statutory calibration, HR custody interlock & RBAC matrix. |

---

## 🎨 Visual Identity & Brand Styling (Bashundhara Group Reference)

- **Primary Brand Red:** `#A51C30` / `#C8102E` (Bashundhara Heritage Crimson)
- **Corporate Slate:** `#0B132B` / `#0F172A` (Industrial Deep Slate)
- **Executive Accent:** `#D4AF37` (Champagne Gold for Chairman / Board VIP components)
- **Clean Background Canvas:** `#F8FAFC` (Modern off-white for data density and clarity)

---

## 🚀 The 16 Core Integrated Business Modules

1. **Enterprise Notice Board** (Bilingual, audience-targeted, mandatory safety read receipts)
2. **Chairman’s Direct Broadcast** (Video/audio/text addresses with gold seal styling)
3. **Paperless Document E-Sign & Note-Sheets** (Digital note-sheet running commentary, cryptographic SHA-256 seal)
4. **Chain-of-Custody Parcel Tracker** (QR-based scan checkpoints, handoff audit trail, recipient OTP confirmation)
5. **Asset Lifecycle & Calibration Engine** (Operating hours tracking, BSTI/hydro-testing 90-day alert cascade)
6. **Regulatory License & Compliance Pipeline** (5-stage visual workflow: Fund -> Application -> Inspection -> Audit -> Renewal)
7. **HSE Incident Management & CAPA** (OSHA-compliant severity triage, 5-Why root cause analysis, preventive action enforcement)
8. **Guest & VIP Protocol Passes** (3 tiers: VIP, Govt Official, General with automated parking & lounge coordination)
9. **Fleet & Pool Vehicle Dispatch** (Requisition, line approval, ride-pooling suggestions, driver trip logs, fuel reconciliation)
10. **Geo-Fenced Mobile Attendance** (Strict anti-spoofing, Haversine validation, field-duty mode, missed punch workflow)
11. **TA & DA Policy Engine** (Grade-based per-diem computation, duration logic, destination tier rates)
12. **Conveyance Reimbursement Claims** (Local travel fare claims, rickshaw/CNG declarations, one-click batch submission)
13. **Tour & Expense Advance Settlement** (Official tour itinerary, budget advance, post-tour reconciliation)
14. **Employee Bus Seat FIFO Waitlist** (Fixed route capacity, automated trickle-down queue on vacancy, 48-hr claim window)
15. **Chairman Executive Command Suite** (Enterprise health KPIs, inner-circle presence board, secure leadership communications)
16. **System Administration, RBAC & Master Data** (Fine-grained permissions, organizational scopes, audit logs)
