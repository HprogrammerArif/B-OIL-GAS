# AGENTS.md — BOGCL OneOps

Entry point for AI agents and new engineers. Read this, then the documents it points to, before changing code.

## What this repository is

The active deliverable is a **Flutter pitch app** (`ftr-a/`). It has **no backend**: all data is a seeded, persisted mock layer. It must still look, feel and behave like a real production application (visuals, flows, validation, offline, notifications, realtime), because it is used to pitch the product.

| Path | What | Status |
| :-- | :-- | :-- |
| `ftr-a/` | **Flutter app** (Android first, iOS-ready): Riverpod, go_router, Dio + in-app mock server, drift, EN/BN l10n | **Active — build here** |
| `app/` | Legacy React Native (Expo) app with mock server and several finished modules | Read-only reference for business logic, seed data, copy |
| `client/` | Interactive React web prototype (7 personas, 17 modules) | Read-only reference |
| `server/`, `frontend/`, `infra/` | Production backend / web / infra placeholders | **Not being built** |
| `docs/` | Pitch/planning docs, prototype report, `docs/platform/00–10` specification suite | Living; mobile spec adapted in `05_MOBILE_APP_SPECIFICATION_FLUTTER.md` |

## Read in this order

1. `ftr-a/docs/FEATURE_STATUS.md` — what is built, what is next, per module and persona.
2. `docs/platform/05_MOBILE_APP_SPECIFICATION_FLUTTER.md` — architecture, screens per module, design system.
3. `docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` — business rules (`BR-xx-nn`).
4. `docs/platform/03_API_SPECIFICATION.md` and `02_DATABASE_SCHEMA.md` — shapes the mock mirrors.
5. `docs/platform/00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (module registry, roles, scopes, conventions) and `10_CODING_STANDARDS_AND_CONVENTIONS.md`.

Prototype behaviour and known defects: `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`.

## Rules and skills

- Rules in `.cursor/rules/`: always on — `project`, `clarity-minimum-data`, `security`, `no-tests-during-development`, `no-emulator-or-device-runs`; by path — `flutter` (`ftr-a/**`), `testing`; legacy — `mobile`, `backend`, `frontend`, `database-prisma`, `api-conventions`, `prototype-reference`; on request — `handoff-summary`.
- Skills in `.cursor/skills/`: `flutter-add-feature`, `flutter-add-screen`, `flutter-mock-endpoint`, `flutter-port-rn-module`, `flutter-i18n-keys`, `flutter-release-android`, `update-platform-docs`. Legacy: `port-prototype-module`, `add-mobile-screen`, `add-web-feature`, `add-backend-module`, `prisma-migration`.

## Non-negotiables

- No emulators, builds or app launches from the agent; the user runs `flutter run -d <device>` on their phone. No tests during development; tests run once at the end when asked.
- No secrets in the repo; never overwrite `.env*`/`key.properties`/keystores. No real network backends.
- No dead links, stubs or "coming soon" in `ftr-a`: if an entry point exists, the screen works for the personas that can see it.
- New dependencies need a stated reason; never swap an existing library without approval.
- Behaviour changes update the matching spec in `docs/platform/` in the same change.
- All user-facing text is bilingual (EN/BN) via ARB keys.
- Minimum data, maximum understanding: every screen says what it is, where it came from, why, and what happens next, in plain words (`.cursor/rules/clarity-minimum-data.mdc`).

## Commands (run from `ftr-a/`)

```
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # freezed/riverpod/drift codegen
flutter gen-l10n                                           # after editing .arb files
dart format lib && flutter analyze                         # agent-allowed checks
flutter run -d <device-id>                                 # USER runs this on the phone
```

Flutter SDK: `C:\src\flutter` (on user PATH). See `ftr-a/docs/RUN_ON_DEVICE.md`.

## Handoff

When finishing a session, produce the summary defined in `.cursor/rules/handoff-summary.mdc`.
