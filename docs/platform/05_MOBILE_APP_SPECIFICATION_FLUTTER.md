# 05 — Mobile App Specification (Flutter, pitch prototype)

**Document:** 05-F of the Production Platform Specification Suite (replaces doc 05 for the active build)
**Status:** v1.0 — 3 November 2026
**Supersedes:** `05_MOBILE_APP_SPECIFICATION.md` (Expo / React Native). That document stays as the source of the per-module screen specifications (§9), role-based home (§10), tokens (§11), offline (§5) and geolocation (§8); this document defines how they are realised in Flutter.
**Code:** `ftr-a/` — Android first, iOS-ready.

---

## 1. Purpose and scope

BOGCL OneOps Mobile is a **pitch application**. It has **no backend**: every API call is answered by an in-app mock server over a seeded, persisted local database. The bar is that a stakeholder using it on a phone cannot tell it from a production app: real validation, real business rules (`BR-xx-nn`, doc 06), real device features (GPS + geofence, camera, QR scan, biometrics, local notifications, PDF/SHA-256), offline behaviour, realtime-feeling updates, polished motion and bilingual (EN/BN) text.

Out of scope: any server, web app, admin console, real push (FCM), real SMS/email. Everything that would come from them is simulated on the device (OTP codes displayed in a simulated SMS notification, push via an event simulator, chat replies from a scripted engine).

Personas (unchanged, doc 00 §5.3): Chairman EMP-0001, Plant GM + HSE EMP-0012, HR admin EMP-0028, Transport admin + Gate + Mailroom EMP-0045, HOD + Finance EMP-0062, Employee EMP-1042 (Tanvir, grade O4), Driver EMP-0821.

Module scope per persona: doc 05 §1.2–1.3 (module matrix) and doc 00 §7. Modules: MOD-01 Notices, 02 Chairman Suite, 03 Note-Sheets, 04 Parcels, 05 Assets, 06 Compliance, 07 HSE Incidents, 08 Visitors, 09 Fleet, 10 Attendance & Leave, 11/12/13 Claims, 14 Bus, 15 Chat, 16 Workforce, 17 Approvals. MOD-18 Administration is excluded. Screens: doc 05 §9 (routes there map to go_router paths here).

## 2. Technology decisions (Flutter ADRs)

| # | Area | Decision | Replaces (RN) |
| :-- | :-- | :-- | :-- |
| F-01 | Framework | Flutter stable (3.47), Dart 3.13, Material 3, Impeller | Expo SDK 56 |
| F-02 | State | Riverpod 3 with `riverpod_generator` (`@riverpod`); `AsyncNotifier` for data, `Notifier` for UI state | Redux Toolkit + RTK Query |
| F-03 | Routing | `go_router` (typed routes, `StatefulShellRoute` for tabs, redirect guards for auth/role, deep links) | Expo Router |
| F-04 | Networking | `dio` + interceptors: auth/session, `Idempotency-Key`, error mapping to doc 03 codes, simulated latency; the **mock adapter** is the only transport | `fetchBaseQuery` + in-app mock |
| F-05 | Models | `freezed` + `json_serializable`; money as decimal string / `Money` value object; no `double` for money | TS types + zod |
| F-06 | Local DB | `drift` (SQLite): mock database tables, offline queue, cache | AsyncStorage + redux-persist |
| F-07 | Secrets | `flutter_secure_storage` (Keystore/Keychain) for session tokens and DB key; `local_auth` for biometric re-unlock | expo-secure-store |
| F-08 | Device | `geolocator` (+ mock-location flag), `mobile_scanner`, `image_picker`, `file_picker`, `permission_handler`, `url_launcher`, `audioplayers`, `flutter_local_notifications`, `connectivity_plus`, `package_info_plus` | expo-* |
| F-09 | Maps | `flutter_map` + `latlong2` (OSM tiles; offline-safe placeholder when no network) | react-native-maps |
| F-10 | Documents | `pdf` + `printing` (render note-sheet / trip pass / claim voucher on device), `crypto` for real SHA-256, `qr_flutter` for QR | server-side PDF |
| F-11 | Charts / motion | `fl_chart`, `flutter_animate`, `shimmer` | reanimated |
| F-12 | i18n | `flutter_localizations` + `gen_l10n` ARB (`app_en.arb`, `app_bn.arb`, class `AppL10n`), `intl`, `Asia/Dhaka` | i18next |
| F-13 | Fonts | Inter (Latin) + Noto Sans Bengali, bundled in `assets/fonts` (no runtime fetch) | expo-font |
| F-14 | Lint | `very_good_analysis` + strict-casts/inference/raw-types | ESLint |
| F-15 | Tests | `flutter_test`, `mocktail`, golden tests, `integration_test`; written during development, **run only at the end** | Jest + Maestro |
| F-16 | Release | Gradle signing, flavors (`dev`, `staging`, `prod`), `flutter build apk/appbundle` run by the user | EAS |

## 3. Architecture

```
lib/
  main.dart                 bootstrap (ProviderScope, mock DB init, notifications init)
  app/                      app.dart, router.dart, flavors, shell (tabs), l10n extension
  core/
    network/                dio_client, interceptors, api_error, envelope, idempotency
    storage/                secure_store, app_database (drift)
    theme/                  tokens, color schemes (light/dark), typography, component themes
    utils/                  logger (PII redaction), money, dates (Asia/Dhaka), haptics, permissions, hash
  shared/widgets/           design kit (see §6)
  mock/
    server.dart             route registry, auth, scope, envelope, latency, failure injection
    engines/                workflow, claims, leave, attendance, notices, parcels, fleet, ...
    seed/                   versioned seed (7 personas, sites, grades, policies, history)
    simulator/              event simulator (notifications, chat, trip movement, SLA ticks)
  features/<module>/
    domain/                 freezed models, enums, value objects
    data/                   repository (Dio) + DTO mapping
    presentation/           controllers (@riverpod), screens, widgets
  l10n/                     app_en.arb, app_bn.arb, gen/
```

Rules: widgets never touch Dio or the database; features talk through repositories; features do not import each other's `presentation`; mock engines reuse the business logic ported from `app/src/mock/engine/*` with identical rule ids, caps, grade bands and seed IDs.

Data flow: `Screen → Controller (Riverpod) → Repository → Dio → MockAdapter → mock/server → engines → drift DB`. Responses use the doc 03 envelope (`{data, meta}` / `{error:{code,message,details}}`) so repositories are written exactly as they would be against a real API.

## 4. State management

- Server-like data: `@riverpod` `AsyncNotifier`/`FutureProvider` per query, `keepAlive` only for session, profile, permissions, lookups. Invalidate by provider after mutations (same tag taxonomy as RTK Query: `Attendance`, `Leave`, `Claims`, `Approvals`, `Notices`, ...). Optimistic updates for notice read, notification mark-read, chat send, seat offer accept.
- UI state: `Notifier`s (selected persona tab, filters, wizard drafts). Drafts (claim, incident, leave) persist in drift.
- Errors: repositories throw `ApiException(code, message, details)`; controllers expose `AsyncValue.error`; screens render `ErrorState` with retry; `INVALID_STATE_TRANSITION` / `CONFLICT` trigger refetch + message.
- Session: `SessionController` (secure storage) exposes the current user, roles, permissions with scopes; `usePermission`-equivalent `ref.watch(canProvider('claims:approve'))`; `RoleGate` widget.

## 5. Offline-first and mock realism

- Connectivity banner via `connectivity_plus` plus a **demo menu toggle** "Simulate offline" so the behaviour can be shown in a pitch.
- Persisted mutation queue (drift table `outbox`): `{id, endpoint, payload, idempotencyKey, status, attempts, createdAt}`. Offline-capable: attendance punch, incident report, parcel scan, visitor check-in/out, trip events, asset acknowledge. On reconnect: replay in order, exponential backoff, server replays by `Idempotency-Key`, per-item status in an **Outbox** screen; queued items show a dashed "pending sync" state.
- Online-only with clear messaging: OTP signing, OTP delivery verify, claim submit validation dry-run (can queue draft).
- Mock server realism: latency 150–600 ms (configurable), optional failure injection from the demo menu (timeouts, 500, 409), rate limits on OTP (3 attempts then lock), deterministic seeded IDs and reference numbers (`LV-2026-0042`), realistic dates relative to "today".

## 6. Design system

Tokens (doc 05 §11.1): crimson `#A51C30`, crimson dark `#7F1424`, slate 900 `#0B132B`, slate 950 `#060D1F`, canvas `#F8FAFC`, gold `#D4AF37`, success `#059669`, warning `#D97706`, danger `#DC2626`, info `#0284C7`. Light and dark `ColorScheme`s built from them; `ThemeExtension<BogclColors>` carries semantic colors (executive gold, status muted backgrounds). Spacing 4/8/12/16/20/24/32; radius 8/12/16/20; elevation via tonal surfaces, soft shadows for cards. Typography: Inter + Noto Sans Bengali, line height ×1.45 for Bengali, scale from doc 05 §11.2, supports 130 % text scale without clipping.

Shared widgets (`shared/widgets`): `AppScaffold`, `AppBarX`, `PrimaryButton/SecondaryButton/DangerButton` (loading + haptic), `AppTextField` (validation, mask), `OtpPad`, `StatusPill`, `ListRow`, `SectionHeader`, `SegmentedTabs`, `BottomSheetX` (confirm / decision / picker), `EmptyState`, `ErrorState`, `SkeletonList`, `OfflineBanner`, `BroadcastBanner`, `CriticalAckDialog`, `QrScannerView`, `PhotoPicker` (compress ≤ 1600 px), `MapPreview`, `PunchButton`/`SosButton` (press-and-hold), `Timeline`, `HashChip`, `Money` text, `Avatar`, `RoleGate`, `CountdownChip`, `ChartCard`, `Toast` (`success|info|warning|error|executive`).

Motion: page transitions Material shared-axis, 150–300 ms; list item staggered entrance on first load only; skeleton shimmer; success checkmark animation on submit; respects reduce-motion. Haptics: success/error on decisions, punch, scan; heavy impact when SOS arms.

UX standards: bottom navigation (Home, Attendance, Approvals, More — Approvals hidden without `workflow:inbox`) plus a search icon and notification bell (unread badge) on every root app bar. Tapping the bell opens the notification centre as a full-screen route (`/inbox`), not a tab. Home is a slim role landing (greeting, one broadcast, one primary card, at most three “needs you” rows, three role shortcuts). Modules live in More. FAB-free; pull-to-refresh; swipe actions only where undoable; confirmations via bottom sheets; no blocking spinners after first paint; edge-to-edge, safe areas, predictive back; dark mode; Bangla font verified on every screen.

## 7. Security and privacy (prototype-appropriate)

Tokens and DB key in secure storage; biometric re-unlock after 2 min in background; screen privacy (`FLAG_SECURE`) on note-sheets, chat and claims receipts; PII redacted in logs; mock-location detection on punch; root/jailbreak advisory banner (non-blocking in prototype); no analytics or crash SDKs; no secrets in repo; keystore and `key.properties` git-ignored.

## 8. Notifications and realtime (simulated)

`flutter_local_notifications` channels (`approvals`, `critical`, `notices`, `fleet`, `general`) with payload `{type, route, id}` routed through go_router deep links. The **event simulator** (`mock/simulator`) schedules persona-relevant events (new approval, notice published, seat offer with 48 h expiry, pass expiring, SLA warning, chat reply, directive) at realistic intervals and on demand from the demo menu; unread badges update in real time via Riverpod streams. Chat: scripted typing and replies, presence dots. Driver trips: moving marker along a pre-defined polyline when `ON_TRIP`.

## 9. Per-module screens and business rules

Screens, routes, hooks and states are specified in doc 05 §9 (9.1 Approvals, 9.2 Notices, 9.3 Note-Sheets, 9.4 Parcels, 9.5 Visitors, 9.6 Fleet, 9.7 Incidents, 9.8 Attendance & Leave, 9.9 Claims, 9.10 Bus, 9.11 Chat, 9.12 Assets, 9.13 Dashboards, 9.14 Compliance/Workforce); business rules in doc 06. Flutter-specific deltas and additions for the pitch build:

| Area | Delta |
| :-- | :-- |
| Hooks naming | RTK hooks become repository methods + controllers, e.g. `useGetInboxQuery` → `approvalsRepository.inbox()` + `inboxControllerProvider` |
| Note-sheet signature | `DRAWN` signatures are supported (Flutter `CustomPainter` pad), plus `TYPED` and `STAMP`; OTP shown via simulated SMS notification; real SHA-256 over paragraphs; PDF generated on device with verification QR |
| Chat voice notes | Record/playback supported (`record` + `audioplayers` when MOD-15/02 ships; justified then) |
| Dashboards | Animated KPI cards and charts (`fl_chart`), voice briefing playback, ROI view |
| Batch approve | Available only as multi-select with confirm sheet (pitch value), single approve remains primary |
| Admin / web-only items | Still excluded, but every visible entry point must work; items not on mobile are simply not shown |
| Role home | Doc 05 §10 card *intent* as a slim Flutter subset: one primary card per variant (Employee punch jump, Driver trip, Gate/Mail scan, HSE incidents, Approver/Chairman oldest decision + optional Announce). Full module grid and KPI galleries stay off Home. Persona switcher in the demo menu |
| Demo menu | Hidden (7 taps on version or long-press logo): switch persona instantly, reset data, simulate offline, trigger events, toggle slow network/failures, change "today" anchor |

Added/changed features to carry from the React Native build: claims with grade bands, hotel/conveyance caps, receipts, resubmit ≤ 3 (BR-11); leave balances and regularisation; notices compose + broadcast + acknowledgement; approvals history with correct decision badges; route registry rule "show only what is built".

## 10. Internationalisation

ARB keys per module prefix (`leaveApply...`, `claimsLine...`); plural/select via ICU; enum labels as `enum<Type><Value>` keys; `lib/l10n/gen` is generated. Language switch in Profile and on the login screen, persisted, applied instantly. Dates `dd MMM yyyy` / `hh:mm a` in `Asia/Dhaka`; money `৳48,50,000` (lakh grouping), Bengali numerals when locale is `bn`. EN and BN keys must exist together; BN drafts are tracked in `FEATURE_STATUS.md` for review.

## 11. Performance targets

Cold start to interactive home < 2 s on a mid-range Android (release/profile build); 60 fps lists (`ListView.builder`/slivers, `const` widgets, `select` on providers); no work in `build`; images cached and downscaled; heavy parsing/PDF/hash in `Isolate.run`; drift queries paginated; app size ≤ 45 MB (split-per-abi); R8/ProGuard on; Impeller default. Verified in Phase 8 with DevTools profile on a real phone.

## 12. Accessibility

Touch targets ≥ 48 dp (driver console ≥ 56 dp); `Semantics` labels on icon buttons; contrast AA in both themes; color is never the only signal; layouts survive 130 % text scale and Bangla line height; TalkBack checked on the P0 flows; reduce-motion respected.

## 13. Build, run and release

User runs everything on their device (see `ftr-a/docs/RUN_ON_DEVICE.md`): `flutter run -d <device-id>` from `ftr-a`. Agent-allowed commands: `flutter pub get`, `dart run build_runner build --delete-conflicting-outputs`, `flutter gen-l10n`, `dart format`, `flutter analyze`. Flavors `dev`/`staging`/`prod` differ by app name/ID suffix and demo-menu availability (`prod` pitch build keeps the demo menu). Release: version in `pubspec.yaml`, user-created keystore, `flutter build apk --release --split-per-abi`.

## 14. Delivery phases

0 Setup & docs · 1 Foundation · 2 Engines · 3 Employee modules · 4 Approvals & documents · 5 Operations · 6 Safety, assets, compliance, workforce · 7 Executive, chat, realtime, demo polish · 8 Hardening, tests (once), completeness audit, release. Status is tracked in `ftr-a/docs/FEATURE_STATUS.md`; a phase is done only when every screen reachable by its personas works end to end, in EN and BN, in light and dark.

## 15. Mapping from the React Native build

| RN (`app/`) | Flutter (`ftr-a/`) |
| :-- | :-- |
| `src/mock/*` (handlers, engine, seed, db) | `lib/mock/*` (server, engines, seed, drift tables) |
| `src/features/<m>/api.ts` | `features/<m>/data/<m>_repository.dart` |
| `src/features/<m>/screens` | `features/<m>/presentation/screens` |
| `src/locales/{en,bn}/<m>.json` | `lib/l10n/app_{en,bn}.arb` |
| `src/lib/routes.ts` (`isRouteBuilt`) | `app/router.dart` route table + module registry |
| `constants/theme.ts` | `core/theme/*` |
| `MOCK_DB_VERSION` | `kMockDbVersion` in `mock/seed` |
