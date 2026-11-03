# Feature status — BOGCL OneOps (Flutter, `ftr-a`)

Legend: Done = complete in EN+BN, light+dark, all states · WIP · Todo

## Phases

| Phase | Scope | Status |
| :-- | :-- | :-- |
| 0 | Setup, rules, skills, docs, Flutter project | Done (device run guide pending SDK tooling) |
| 1 | Foundation: theme, kit, core, mock server, auth, i18n, role home, offline base | Todo |
| 2 | Engines: workflow, notifications, files/media, audit | Todo |
| 3 | Employee: attendance/leave, notices, claims, bus | Todo |
| 4 | Approvals center, note-sheets and e-sign | Todo |
| 5 | Operations: parcels, visitors, fleet/driver, SOS | Todo |
| 6 | HSE, assets, compliance, workforce | Todo |
| 7 | Dashboards, chat, simulated realtime, demo menu, polish | Todo |
| 8 | Performance, a11y, security, tests (once), completeness audit, release | Todo |

## Modules

| Module | Phase | Status | Notes |
| :-- | :-: | :-- | :-- |
| MOD-17 Approvals | 4 | Todo | Port logic from `app/src/mock/engine/workflow.ts` |
| MOD-10 Attendance & Leave | 3 | Todo | Port from RN |
| MOD-01 Notices | 3 | Todo | Port from RN |
| MOD-11/12/13 Claims | 3 | Todo | Port from RN (`app/src/mock/engine/claims.ts`) |
| MOD-14 Bus | 3 | Todo | New |
| MOD-03 Note-Sheets | 4 | Todo | New; on-device PDF + SHA-256 |
| MOD-04 Parcels | 5 | Todo | New |
| MOD-08 Visitors | 5 | Todo | New |
| MOD-09 Fleet | 5 | Todo | New |
| MOD-07 Incidents | 6 | Todo | New |
| MOD-05 Assets | 6 | Todo | New |
| MOD-06 Compliance / MOD-16 Workforce | 6 | Todo | New |
| MOD-02 Dashboards | 7 | Todo | New |
| MOD-15 Chat | 7 | Todo | New |

## Environment

- Flutter 3.47.9 at `C:\src\flutter` (user PATH). Android SDK at `%LOCALAPPDATA%\Android\Sdk`.
- Open item: Android `cmdline-tools` + licences (`flutter doctor`) — needed for the first device build.

## BN translation review queue

(Empty until Phase 1.)
