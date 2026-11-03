# Feature status — BOGCL OneOps (Flutter, `ftr-a`)

Legend: Done = complete in EN+BN, light+dark, all states · WIP · Todo

## Phases

| Phase | Scope | Status |
| :-- | :-- | :-- |
| 0 | Setup, rules, skills, docs, Flutter project | Done (first device build verified on Pixel 4a) |
| 1 | Foundation: theme, kit, core, mock server, auth, i18n, role home, offline base | Done (1f: real connectivity banner + demo offline toggle, persisted outbox with ordered replay, backoff and Sync queue screen, biometric re-unlock after 2 min in background with Settings toggle; still to add with first needing modules: notification/location permissions, FLAG_SECURE) — 1a done (theme, fonts, app shell, locale/theme-mode prefs); 1b done (core kit: buttons, text field, status pill, empty/error/skeleton/offline, list row, avatar, toast, confirm sheet; remaining kit widgets ship with the features that need them); 1c done (Dio client + interceptors, ApiException/envelope, secure store, drift DB with mock records/outbox/meta, PII-redacting logger, Money, Dhaka dates, SHA-256); 1d done (mock server: router, auth/permission/scope, idempotency, latency + failure injection, Dio mock adapter, persisted store; seed: 3 sites, 8 departments, 12 people, RBAC grants/navigation; endpoints: `/auth/*`, `/me*`; module seeds/engines register in Phase 2+); 1e done (login with EN/BN switch and generic errors, session controller with secure-storage tokens + single-flight refresh, auth-guarded go_router, Home/More shell, role-based home header, profile/language/theme/sign-out, hidden demo menu: persona switch, offline/slow/failure simulation, reset data); next 1f offline base (connectivity banner, outbox replay, biometric re-unlock after 2 min) |
| 2 | Engines: workflow, notifications, files/media, audit | WIP — 2a done (notification engine `NotificationEngine.notify/notifyRole` with EN/BN templates, `/notifications`, `/unread-count`, read, read-all, ack; seeded inboxes for all 7 personas; Inbox tab with category/unread filters, paging, pull-to-refresh, offline-queued read/ack, unread badge polled every 20 s, critical ack sheet). Not yet: `/notifications/preferences` routes (use `/me/preferences`), deep-link open (modules add `data.route`), realtime push (Phase 7). 2b done (append-only SHA-256 hash-chained `AuditEngine` with `verify`, PII-free before/after; audited: login ok/failed, logout, profile/preferences update, notification ack; `GET /audit-logs` (`admin:audit-read`, no persona holds it) and `GET /me/activity` with cursor paging; More → My activity screen; CSV export deferred to files engine). Next: 2c workflow, 2d files/media |
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
- Android toolchain verified. Build needs NDK 28.2.13676358 (install with `sdkmanager.bat "ndk/28.2.13676358"`, slash form) and `compileSdk = 37` + core library desugaring (already in `android/app/build.gradle.kts`).

## BN translation review queue

Review in `app_bn.arb`: all `common*` keys (1b), the Bangla `appName`, and the 1e keys: `login*`, `home*`, `profile*`, `more*`, `settings*`, `theme*`, `signOut*`, `enumRole*` and `demo*`, and the 1f keys: `lock*`, `settingsBiometric*`, `moreOutbox`, `outbox*`, and the 2a keys: `navInbox`, `inbox*`, `time*Ago`, `commonClose`, and the 2b keys: `moreActivity`, `activity*`.
