# 05 — Mobile App Specification (Expo)

**Document:** 05 of the Production Platform Specification Suite
**Status:** Baseline v1.0 — 1 November 2026
**Audience:** Mobile engineers, backend engineers (contract owners), QA, DevOps
**Depends on:** `00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` (ADR-06, ADR-11, ADR-15–19, §5, §6.3, §6.7, §7), `02_DATABASE_SCHEMA.md` (entities/enums), `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md` (prototype behaviours)
**Codebase:** `app/` — adapted from the existing Expo starter (`reactnativestarter`). The starter is the base; this document says what to keep, delete, rename and add.

> Where this document names an API path, the path follows doc 00 §5.1 conventions and the doc 02 entity names. Paths are provisional until `03_API_SPECIFICATION.md` is published; **hook names, request/response shapes and behaviours in this document are binding on both server and mobile**. If 03 changes a path, only the `url` inside the feature `api.ts` changes.

---

## 1. Purpose and Scope

### 1.1 What the mobile app is

BOGCL OneOps Mobile is the **field companion** to the web portal. It is not a second copy of the web application. It exists for the moments when the user is not at a desk: punching attendance at a plant gate, scanning a parcel at a checkpoint, checking in a visitor at the boom barrier, driving a dispatched trip, photographing a spill, accepting a bus seat offer before it expires, and — for executives — approving or signing while travelling.

### 1.2 Primary users

| Persona (prototype) | System roles (doc 00 §5.3) | Mobile purpose |
| :--- | :--- | :--- |
| Employee (Tanvir Ahmed) | `EMPLOYEE` | Geo punch, leave, claims with receipt camera, bus seat/waitlist, notices, my parcels, my visitors, vehicle requisition, incident quick-report |
| Driver (Md. Rafiqul Islam) | `DRIVER` | Today's trip console (gate-out → checkpoints → gate-in), live tracking while `ON_TRIP`, SOS, toll claim with receipt photo, fuel voucher QR redeem, dispatch chat |
| Security / gate / reception | `SECURITY_GATE`, `RECEPTION` | Visitor QR scan, check-in/out, PPE clearance, muster roll-call, parcel gate-in scan |
| Mailroom / courier | `MAILROOM` | Parcel handover/checkpoint scans, OTP delivery verification, tamper flag |
| HSE officer | `HSE_OFFICER` | Incident triage on site, CAPA completion with evidence photo, critical-incident acknowledgement |
| Approvers on the go | `CHAIRMAN`, `DIRECTOR`, `PLANT_GM`, `HOD`, `LINE_MANAGER`, `FINANCE`, `HR_ADMIN`, `TRANSPORT_ADMIN` | Unified approvals inbox, note-sheet sign with OTP, quick approve/reject/return, executive read-only dashboard, inner-circle chat |

### 1.3 Mobile scope matrix

Derived from doc 00 §7 "Mobile" column plus the prototype's mobile-relevant flows (`DriverConsole`, `MobileBottomNav`, mobile list/detail toggles in Parcel/Guest/Claims).

| Module | Doc 00 mobile column | Mobile scope (this spec) | Priority |
| :--- | :--- | :--- | :---: |
| MOD-17 Approvals Center | ✔ | Inbox, detail, approve/reject/return, delegation view (read) | P0 |
| MOD-10 Attendance & Leave | ✔ (punch) | Geo punch IN/OUT, today status, history, regularisation request, leave apply/cancel/balances | P0 |
| MOD-01 Notices | ✔ | List, detail (EN/BN), acknowledge, pinned broadcast banner, critical ack modal | P0 |
| MOD-09 Fleet & Dispatch | ✔ (driver, request) | Driver trip console, tracking, SOS, toll claim, fuel QR; employee requisition create/track; fleet chat | P0 |
| MOD-04 Parcels | ✔ (scan, OTP) | Scan QR/barcode at each custody step (offline-queued), OTP delivery verify, tamper flag, my parcels | P0 |
| MOD-08 Visitors | ✔ (gate) | Gate scan QR → check-in, PPE clearance, check-out, today's expected list, muster roll-call; host: register guest, my guests | P0 |
| MOD-07 HSE Incidents | ✔ (report) | Quick report with photo + GPS (offline draft), my reports, HSE officer triage/CAPA completion | P0 |
| MOD-03 Note-Sheets | ✔ (approve/sign) | My pending signatures, read paragraphs/quotes, sign with OTP (drawn/typed/stamp), return with query; PDF view | P1 |
| MOD-11/12/13 Claims | ✔ (submit) | Create TA/DA, Conveyance, Tour claim; receipt camera per line; policy hints; status tracking | P1 |
| MOD-14 Bus | ✔ (my seat) | My seat & route, stops/timetable, join/leave waitlist, 48 h offer accept/decline, release seat | P1 |
| MOD-15 Chat | ✔ | Channels and DMs the user is a member of, text/voice-note/attachment, directive ack, presence | P1 |
| MOD-05 Assets | ✔ (scan, custody ack) | Scan asset QR → detail, my custody list, custody acknowledgement, flag defect with photo | P2 |
| MOD-02 Chairman Suite | ✔ (read) | Role dashboard cards (KPIs), voice briefing playback, listen receipt | P2 |
| MOD-06 Compliance | read | Licence list with days-to-expiry, dossier read-only | P3 |
| MOD-16 Workforce | read | Employee directory search (for pickers), own profile | P3 |
| MOD-18 Administration | — | **Not on mobile** | — |

Explicitly **not** on mobile in v1: note-sheet initiation, asset register/work orders/disposal, licence renewal Kanban editing, visitor approval workflows, bus supervisor tools, workforce onboarding/exit clearance, delegation configuration, reporting exports, admin.

### 1.4 Non-goals

- No tablet-optimised layouts in v1 (phone portrait; tablets render the phone layout at `MaxContentWidth`).
- No web target from `app/` (the starter's `react-native-web` stays installed for Jest/Storybook-free component rendering but `expo start --web` is not a supported surface; the web portal is `frontend/`).
- No on-device face recognition. The prototype's "Face Biometric punch" becomes geofence verification + optional device biometric unlock (doc 00 §1 excludes biometric devices).

---

## 2. Starter Adaptation Plan

The starter is a generic consumer app (parent/child, subscriptions, expenses). The table below is the authoritative change list; Appendix A has the per-file action table.

### 2.1 Identity

| Setting | Starter value | Production value |
| :--- | :--- | :--- |
| `expo.name` | `reactnativestarter` | `BOGCL OneOps` |
| `expo.slug` | `reactnativestarter` | `bogcl-oneops` |
| `expo.scheme` | `reactnativestarter` | `bogcl-oneops` |
| `android.package` | `com.example.reactnativestarter` | `com.bogcl.oneops` |
| `ios.bundleIdentifier` | *(missing)* | `com.bogcl.oneops` |
| `expo.version` | `1.0.0` | `1.0.0` (semver, see §15.4) |
| `runtimeVersion` | *(missing)* | `{ "policy": "appVersion" }` |
| Splash background | `#208AEF` | `#0B132B` (slate-900) with white wordmark |
| Adaptive icon background | `#E6F4FE` | `#A51C30` (crimson) |
| Notification icon colour | `#2B7FFF` | `#A51C30` |
| `package.json` `name` | `reactnativestarter` | `bogcl-oneops-mobile` |
| `APP_NAME` constant | `My App` | `BOGCL OneOps` |

Convert `app.json` → `app.config.ts` so that per-environment values (API URL, Google Maps Android key, Sentry org/project, EAS project id) come from `process.env` at build time instead of being committed.

### 2.2 Remove

| Package / feature | Reason |
| :--- | :--- |
| `react-native-purchases` + `src/lib/revenuecat.ts`, `src/services/revenueCat.ts`, `src/hooks/useRevenueCat.ts`, `PREMIUM_ENTITLEMENT_ID`, RevenueCat block in `_layout.tsx` | Internal enterprise app; no IAP |
| `src/redux/features/subscription/` | IAP |
| `src/redux/features/child/` (`childSlice`, persisted `child` key) | Consumer domain |
| `src/redux/features/expenseService/`, `homeScreenService/`, `scheduleService/`, `supportService/`, `profileService/{documents,milestone}.api.ts`, co-parent/invitation endpoints in `profileApi.ts` | Consumer domain; OneOps claims ≠ starter expenses |
| `src/types/chat.type.ts` | Replaced by generated OpenAPI types |
| Routes `(auth)/welcome.tsx`, `(auth)/register.tsx`, `(app)/new-item.tsx`, `(tabs)/explore.tsx` | Enterprise users are provisioned by HR; no self-registration; tab set changes |
| `@expo/ui`, `expo-glass-effect`, `expo-symbols` | Unused in `src/` (verified by grep); iOS-only experimental UI |
| `expo-checkbox` | Only used by the deleted register screen and "remember me"; replace with a `Switch`/custom row to drop a native module |
| `reactotron-react-native` + `src/lib/ReactotronConfig.ts` | Optional dev tool; Redux DevTools via Expo dev client + Sentry breadcrumbs suffice. Keep only if the team actively uses it (then move to `devDependencies` and gate with `__DEV__`, as now) |
| `assets/fonts/Quicksand-*.ttf`, `assets/icons/*.png`, `assets/images/react-logo*`, `expo-badge*`, `tutorial-web.png`, `tabIcons/` | Starter branding |
| `app/docs/ANALYTICS/**` (Firebase analytics guides) | Not part of the platform; analytics decisions live in doc 07/08 |
| `app/note.txt`, `scripts/reset-project.js` | Personal notes / template reset script |
| `app/.env.example` **values** | See §16 — scrub to names only, rotate every key that appeared in it |

### 2.3 Keep (and adapt)

| Keep | Adaptation |
| :--- | :--- |
| Expo Router file routing, `(auth)`/`(app)` groups, typed routes | New route tree (§3.2); fix the `const token = true` bypass in `(app)/_layout.tsx`; remove the debug `<Link href="/(app)/(tabs)">home</Link>` from `login.tsx` |
| `src/redux/api/baseApi.ts` single-API + `injectEndpoints` pattern | Rewrite `baseQueryWithReauth` for `/api/v1/auth/refresh` with SecureStore refresh token (§4.2); new tag taxonomy; drop `credentials: "include"` (cookies are the web mechanism, ADR-06) |
| `authSlice` + `mapAuthResponse` adapter idea | New shape: `user`, `roles[]`, `permissions[]`, `accessToken` (not persisted), `sessionId`, `biometricEnabled` |
| `notificationService` patterns (`useNotifications`, `registerDeviceToken`, `tabIndicatorSlice`) | Rename to `features/notifications`; align body to `DeviceToken` entity (`platform: 'ANDROID' \| 'IOS'`) |
| `profileService/profileApi.ts` → `features/profile/api.ts` | `GET /auth/me`, `PATCH /auth/me/preferences`, sessions |
| UI kit `Screen`, `Button`, `TextField`, `Card`, `Badge`, `EmptyState`, `FormField` | Re-theme with BOGCL tokens; add `gold` button variant and `executive` badge variant; add `Skeleton`, `ListRow`, `SectionHeader`, `BottomSheet`, `StatusPill` |
| `ScreenHeader`, `TabBarIcon`, `ErrorBoundary`, `OfflineBanner`, `ReduxProvider` | Theme; `OfflineBanner` also shows queued-mutation count |
| `hooks/useNetworkStatus`, `useAppState`, `use-theme`, `use-color-scheme` | Unchanged |
| `lib/logger.ts`, `lib/sentry.ts` | Add `setTag('role')`, scrub PII in `beforeSend` |
| `redux/storage.ts` (SecureStore adapter) | Keep for the `auth` persist slice only; add an AsyncStorage adapter for everything else (§4.4) |
| `store.ts` `setupListeners` wiring (NetInfo + AppState) | Keep; add offline replay listener |
| `@sentry/react-native`, `jest-expo`, `@testing-library/react-native`, `husky`, `lint-staged`, `eslint-config-expo`, `prettier` | Unchanged |
| `react-hook-form`, `@hookform/resolvers`, `zod` v4 | Unchanged (ADR-15) |
| `expo-secure-store`, `expo-notifications`, `expo-device`, `expo-constants`, `expo-image`, `expo-font`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-web-browser` | Unchanged; `expo-web-browser` opens document-verification URLs |
| `@react-native-async-storage/async-storage`, `@react-native-community/netinfo` | Used for non-secret persistence and connectivity |
| `react-native-reanimated`, `react-native-gesture-handler`, `react-native-worklets`, `react-native-screens`, `react-native-safe-area-context`, `react-native-toast-message` | Unchanged |
| `experiments.typedRoutes`, `experiments.reactCompiler` | Keep both (§13.5 for compiler implications) |

### 2.4 Add

Install with `npx expo install <pkg>` (SDK-pinned) per `app/.agents/skills/expo-install`. One-line justification each (project rule: new packages need a reason).

| Package | Why |
| :--- | :--- |
| `expo-location` | Attendance geo punch (foreground fix, accuracy, `mocked` flag) and driver trip tracking (background updates while `ON_TRIP`) |
| `expo-task-manager` | Required by `expo-location` background updates; defines the trip-tracking task that batches points every 15 s |
| `expo-camera` | QR/barcode scanning (parcels, visitor passes, asset tags, fuel vouchers) via `CameraView` `barcodeScannerSettings`; photo capture for incidents/receipts |
| `expo-image-picker` | Pick existing photos/PDF receipts from gallery when the camera is not appropriate |
| `expo-image-manipulator` | Resize/compress captured photos (≤ 1600 px, q0.7) before upload — field networks are slow and MinIO storage is metered |
| `expo-local-authentication` | Biometric/passcode re-unlock after background timeout and before signing a note-sheet |
| `expo-file-system` | Store captured photos and incident drafts locally until uploaded; presigned PUT uploads with `uploadAsync` |
| `expo-sharing` | Share trip pass / gate pass / approval certificate PDFs to WhatsApp/email from the device |
| `expo-localization` | Device locale detection for the initial EN/BN choice and `Asia/Dhaka` timezone handling |
| `i18next` + `react-i18next` | ADR-16: namespaced EN/BN catalogues replacing the prototype's inline `t(en, bn)` pairs; `react-i18next` provides `useTranslation` hooks and Suspense-free loading |
| `react-native-maps` | Map preview on punch screen (you vs geofence), trip route/checkpoints, incident location, visitor site; Apple Maps on iOS (no key), Google Maps on Android (key via EAS env). Alternative if Google dependency is unacceptable on-prem: `@maplibre/maplibre-react-native` with self-hosted tiles — decide in discovery; the `MapPreview` component isolates the choice |
| `@shopify/flash-list` | Recycling lists for inbox, notices, parcels, chat (hundreds of rows, 60 fps on low-end Android) |
| `socket.io-client` | ADR-11: `/notifications`, `/chat`, `/presence` namespaces with JWT handshake |
| `expo-updates` | OTA JS updates per EAS channel (development/preview/production) with `runtimeVersion` policy |
| `expo-screen-capture` | Disable screenshots/recording on note-sheet, confidential parcel and chat vault screens (§6.7) |
| `expo-haptics` | Haptic confirmation on punch, scan success/failure, approve/reject, SOS arm |
| `expo-application` | App version/build id for `X-Client` header, Sentry release and device session name |
| `expo-crypto` | `randomUUID()` for idempotency keys and client ids; SHA-256 of files before `POST /files/{id}/complete` |
| `expo-build-properties` | Set `minSdkVersion 29`, `compileSdk`, iOS deployment target, and inject Android `networkSecurityConfig` for certificate pinning (§6.6) without ejecting |
| `date-fns` + `date-fns-tz` *(JS only, `npm i`)* | `Asia/Dhaka` display of UTC timestamps, relative times, duration maths for SLA badges; smaller than moment/luxon |
| `jail-monkey` *(optional, bare module; dev-client compatible)* | Root/jailbreak and hooking detection stronger than `expo-device.isRootedExperimentalAsync()`; enable for production builds only if Security (doc 07) requires it |
| `msw` *(dev)* | Network mocking in Jest for RTK Query endpoint tests and screen tests |
| `maestro` *(CLI, not npm)* | E2E smoke flows on real builds (§14.4) |

Not added (deliberately): `async-mutex` (refresh lock is a 10-line promise singleton), `react-native-mmkv` (AsyncStorage is already a dependency and sufficient at this write volume), `nativewind`/`tamagui` (the starter already removed CSS-in-JS; StyleSheet + tokens is the convention), `axios` (RTK Query `fetchBaseQuery`), `react-navigation` direct imports (Expo Router wraps it).

### 2.5 Migration commands (one-time)

```bash
cd app
npm uninstall react-native-purchases @expo/ui expo-glass-effect expo-symbols expo-checkbox reactotron-react-native
npx expo install expo-location expo-task-manager expo-camera expo-image-picker expo-image-manipulator \
  expo-local-authentication expo-file-system expo-sharing expo-localization react-native-maps @shopify/flash-list \
  expo-updates expo-screen-capture expo-haptics expo-application expo-crypto expo-build-properties
npm i i18next react-i18next socket.io-client date-fns date-fns-tz
npm i -D msw
npx expo install --check     # SDK alignment
npx expo prebuild --clean && npx expo run:android   # native modules changed → rebuild dev client
```

---

## 3. Architecture and Folder Structure

### 3.1 Layers

```
Expo Router route files (src/app/**)          thin: read params, render a feature screen
        │
Feature screens & components (src/features/<module>/**)
        │  RTK Query hooks (feature api.ts via baseApi.injectEndpoints)
        │  react-hook-form + zod schemas (feature schemas.ts)
        │  UI-only slices where needed (feature slice.ts)
        │
Shared UI kit (src/components/ui), shared components (QrScanner, PhotoPicker, MapPreview, SignaturePad, RoleGate)
        │
Platform libs (src/lib): env, storage, location, camera, files, offline-queue, i18n, socket, biometrics, device, logger, sentry
        │
Redux store (src/redux): baseApi, auth/ui slices, persistence, listeners
```

Rules: route files never contain business logic or fetch directly; feature code never imports another feature's screens (shared pieces move to `components/`); server data lives only in RTK Query cache (ADR-13); slices hold UI/session state.

### 3.2 Route tree (`src/app`)

```
src/app/
├── _layout.tsx                      Root: ErrorBoundary › ReduxProvider › I18nProvider › ThemeProvider › Slot + Toast + OfflineBanner
├── index.tsx                        Redirect: session? → /(app)/(tabs)/home : /(auth)/login
├── +not-found.tsx
├── (auth)/
│   ├── _layout.tsx                  Stack, no header
│   ├── login.tsx                    Email/Emp-ID + password, remember identifier, language toggle
│   ├── mfa.tsx                      TOTP code (executive roles, ADR-06)
│   └── forgot-password.tsx          Request reset link/OTP (server emails/SMS)
└── (app)/
    ├── _layout.tsx                  Auth guard + biometric lock gate + socket + push + offline replay + geofence prefetch
    ├── (tabs)/
    │   ├── _layout.tsx              4 tabs: home · inbox · attendance · more (badges)
    │   ├── home.tsx                 Persona landing (§10)
    │   ├── inbox.tsx                Segments: Approvals (if approver) · Notifications
    │   ├── attendance.tsx           Punch console + today + quick links
    │   └── more.tsx                 Module grid (role-filtered) + profile + settings
    ├── approvals/[id].tsx
    ├── notices/index.tsx · notices/[id].tsx
    ├── note-sheets/index.tsx · note-sheets/[id]/index.tsx · note-sheets/[id]/sign.tsx (modal)
    ├── parcels/index.tsx · parcels/[id].tsx · parcels/scan.tsx (modal) · parcels/[id]/verify-otp.tsx (modal)
    ├── visitors/index.tsx · visitors/scan.tsx (modal) · visitors/[id].tsx · visitors/register.tsx · visitors/muster.tsx
    ├── fleet/trips/[id].tsx · fleet/trips/[id]/toll-claim.tsx (modal) · fleet/requisitions/index.tsx · fleet/requisitions/new.tsx · fleet/requisitions/[id].tsx · fleet/chat/[channel].tsx · fleet/fuel/scan.tsx (modal)
    ├── incidents/index.tsx · incidents/report.tsx · incidents/[id].tsx · incidents/capa/[id].tsx
    ├── attendance/history.tsx · attendance/regularise.tsx (modal)
    ├── leave/index.tsx · leave/new.tsx · leave/[id].tsx
    ├── claims/index.tsx · claims/new.tsx · claims/[id].tsx · claims/[id]/line.tsx (modal)
    ├── bus/index.tsx · bus/waitlist.tsx · bus/offers/[id].tsx
    ├── chat/index.tsx · chat/[channelId].tsx
    ├── assets/index.tsx · assets/scan.tsx (modal) · assets/[id].tsx
    ├── compliance/index.tsx · compliance/[id].tsx
    ├── dashboard/index.tsx · dashboard/briefings/[id].tsx
    ├── notifications/settings.tsx
    ├── outbox.tsx                   Offline queue: pending / failed / conflicts
    ├── profile/index.tsx · profile/security.tsx · profile/devices.tsx · profile/language.tsx
    └── lock.tsx                     Biometric lock overlay (presented as fullScreenModal)
```

Typed routes (`experiments.typedRoutes`) generate `href` types; use `router.push({ pathname: '/approvals/[id]', params: { id } })`. Deep links from push use the same `pathname`s (§7.4). A `constants/routes.ts` exports builders (`routes.approval(id)`) so notification payloads and screens share one source.

### 3.3 Source tree (`src/`)

```
src/
├── app/                               (routes, above)
├── features/
│   ├── auth/            api.ts · schemas.ts · screens/{LoginScreen,MfaScreen,ForgotPasswordScreen}.tsx · map-auth-response.ts
│   ├── home/            persona-resolver.ts · screens/{EmployeeHome,DriverHome,GateHome,ApproverHome,HseHome,MailroomHome}.tsx · components/
│   ├── approvals/       api.ts · screens/ · components/{InboxRow,DecisionSheet,TrailTimeline}.tsx · schemas.ts
│   ├── notices/         api.ts · screens/ · components/{NoticeCard,BroadcastBanner,CriticalAckModal}.tsx
│   ├── note-sheets/     api.ts · screens/ · components/{ParagraphList,SignatoryRail,QuoteTable,SignSheet}.tsx · schemas.ts
│   ├── parcels/         api.ts · screens/ · components/{CustodyTimeline,ScanResultSheet,OtpPad}.tsx · schemas.ts
│   ├── visitors/        api.ts · screens/ · components/{VisitCard,PpeChecklist,ZoneBadges}.tsx · schemas.ts
│   ├── fleet/           api.ts · screens/{TripConsoleScreen,…}.tsx · components/{TripStepper,SosButton,OdometerInput,TollPlazaPicker}.tsx · trip-tracking.ts · schemas.ts
│   ├── incidents/       api.ts · screens/ · components/{RiskMatrixPicker,PhotoStrip,ZonePicker}.tsx · schemas.ts · draft.slice.ts
│   ├── attendance/      api.ts · screens/ · components/{PunchButton,GeofenceStatus,DayStrip}.tsx · punch-flow.ts
│   ├── leave/           api.ts · screens/ · schemas.ts
│   ├── claims/          api.ts · screens/ · components/{ClaimLineRow,ReceiptCapture,PolicyHint}.tsx · schemas.ts · policy.ts
│   ├── bus/             api.ts · screens/ · components/{SeatCard,OfferCountdown,StopList}.tsx
│   ├── chat/            api.ts · screens/ · components/{MessageBubble,Composer,VoiceNote,DirectiveCard}.tsx · socket-bridge.ts
│   ├── assets/          api.ts · screens/ · components/
│   ├── compliance/      api.ts · screens/
│   ├── dashboard/       api.ts · screens/ · components/{KpiCard,BriefingPlayer}.tsx
│   ├── notifications/   api.ts · screens/ · push.ts · channels.ts · deep-link.ts · badge.slice.ts
│   ├── profile/         api.ts · screens/
│   ├── files/           api.ts · upload.ts            (presign → PUT → complete)
│   └── employees/       api.ts · components/EmployeePicker.tsx
├── components/
│   ├── ui/              Screen · Button · TextField · FormField · Card · Badge · EmptyState · Skeleton · ListRow · SectionHeader · BottomSheet · StatusPill · Segmented · index.ts
│   ├── QrScanner.tsx · PhotoPicker.tsx · MapPreview.tsx · SignaturePad.tsx · RoleGate.tsx · OfflineBanner.tsx · QueueBadge.tsx
│   ├── ScreenHeader.tsx · TabBarIcon.tsx · ErrorBoundary.tsx · providers/{ReduxProvider,I18nProvider}.tsx
├── constants/           theme.ts · roles.ts · permissions.ts · routes.ts · index.ts
├── hooks/               use-theme · use-color-scheme · useNetworkStatus · useAppState · useNotifications · usePermission · useOfflineMutation · useBiometricLock · useHaptics
├── lib/
│   ├── env.ts                       zod-validated `process.env.EXPO_PUBLIC_*`
│   ├── storage/{secure.ts,async.ts,keys.ts}
│   ├── location/{haversine.ts,punch-location.ts,trip-task.ts,permissions.ts}
│   ├── camera/{barcode.ts,photo.ts}
│   ├── files/{upload.ts,sha256.ts}
│   ├── offline-queue/{types.ts,slice.ts,replay.ts,listener.ts}
│   ├── i18n/{index.ts,resources.ts,formatters.ts}
│   ├── socket/{client.ts,namespaces.ts}
│   ├── biometrics.ts · device.ts · logger.ts · sentry.ts · api-error.ts
├── redux/               store.ts · hooks.ts · api/baseApi.ts · slices/{auth.slice.ts,ui.slice.ts} · persist/{transforms.ts,config.ts}
├── types/               generated/openapi.d.ts (from server OpenAPI; never hand-edited) · api.ts (Envelope, ApiError) · domain.ts (narrow re-exports)
└── locales/             en/{common,approvals,…}.json · bn/{…}.json
```

Naming follows doc 00 §5.2: files `kebab-case.ts`, components `PascalCase.tsx`, hooks `useX.ts`, feature API `api.ts` inside the feature folder (the web uses `<feature>.api.ts`; mobile keeps the folder-scoped name to match the starter's `injectEndpoints` layout — either is acceptable, do not mix within a codebase).

---

## 4. State Management

### 4.1 Store composition

```ts
// src/redux/store.ts (shape)
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),          // SecureStore, blacklist accessToken
  ui: persistReducer(uiPersistConfig, uiReducer),                // AsyncStorage
  offlineQueue: persistReducer(queuePersistConfig, queueReducer),// AsyncStorage
  incidentDraft: persistReducer(draftPersistConfig, draftReducer),// AsyncStorage
  badges: badgesReducer,                                          // not persisted
  [baseApi.reducerPath]: persistReducer(apiPersistConfig, baseApi.reducer), // AsyncStorage, whitelist transform (§4.5)
});
```

| Slice | Contents | Persisted | Storage |
| :--- | :--- | :---: | :--- |
| `auth` | `user {id,email,empCode,fullName,fullNameBn,departmentId,siteId,gradeId,photoUrl}`, `roles: RoleKey[]`, `permissions: Record<PermissionKey, Scope>`, `sessionId`, `accessToken`, `accessTokenExpiresAt`, `biometricEnabled`, `lastActiveAt`, `mfaPending` | ✔ except `accessToken`, `accessTokenExpiresAt`, `mfaPending` | SecureStore (value < 2 KB — Android SecureStore warns above 2048 bytes; keep permissions compact: array of `"claims:approve@DEPARTMENT"` strings) |
| `ui` | `language: 'en'\|'bn'`, `colorScheme: 'system'\|'light'\|'dark'`, `bengaliNumerals: boolean`, `hasSeenPermissionPrimer`, `activeSiteId` | ✔ | AsyncStorage |
| `offlineQueue` | `items: QueuedMutation[]`, `isReplaying` | ✔ | AsyncStorage |
| `incidentDraft` | one in-progress incident form + local photo URIs | ✔ | AsyncStorage |
| `badges` | unread notifications, inbox count, outbox count, chat unread | — | — |
| `baseApi` | RTK Query cache | ✔ selected endpoints only | AsyncStorage |

Refresh token is **never** in Redux. It lives in SecureStore under `lib/storage/keys.ts → SecureKeys.refreshToken` and is read only by `baseQueryWithReauth` and `logout`.

### 4.2 `baseQueryWithReauth` (SecureStore refresh, rotation, single-flight)

```ts
// src/redux/api/baseApi.ts
import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { REHYDRATE } from "redux-persist";
import * as Application from "expo-application";
import { TAG_TYPES } from "./tags";
import { env } from "@/lib/env";
import { secure, SecureKeys } from "@/lib/storage/secure";
import { getDeviceId } from "@/lib/device";
import { sessionExpired, tokenRefreshed } from "@/redux/slices/auth.slice";
import type { RootState } from "@/redux/store";
import type { Envelope } from "@/types/api";

const PUBLIC_ENDPOINTS = new Set(["login", "verifyMfa", "forgotPassword", "refresh"]);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${env.EXPO_PUBLIC_API_URL}/api/v1`,
  timeout: 15_000,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    const state = getState() as RootState;
    headers.set("Accept", "application/json");
    headers.set("Accept-Language", state.ui.language);
    headers.set("X-Client", `oneops-mobile/${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`);
    headers.set("X-Device-Id", await getDeviceId());
    if (!PUBLIC_ENDPOINTS.has(endpoint) && state.auth.accessToken) {
      headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
    }
    return headers;
  },
});

interface RefreshResponse { accessToken: string; accessTokenExpiresAt: string; refreshToken: string; }

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s await the same promise; the rotated refresh token is stored before anyone retries. */
function refreshSession(api: BaseQueryApi): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await secure.get(SecureKeys.refreshToken);
      if (!refreshToken) return false;
      const res = await fetch(`${env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": await getDeviceId() },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;                                   // 401 → revoked/expired → logout
      const { data } = (await res.json()) as Envelope<RefreshResponse>;
      await secure.set(SecureKeys.refreshToken, data.refreshToken); // rotation (ADR-06)
      api.dispatch(tokenRefreshed({ accessToken: data.accessToken, expiresAt: data.accessTokenExpiresAt }));
      return true;
    })()
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status === 401 && !PUBLIC_ENDPOINTS.has(api.endpoint)) {
      const refreshed = await refreshSession(api);
      if (refreshed) result = await rawBaseQuery(args, api, extraOptions);
      else api.dispatch(sessionExpired());                          // (app)/_layout redirects to /(auth)/login
    }
    return result;
  };

/** Retry only idempotent reads on transport failures; mutations rely on the offline queue instead. */
const baseQueryWithRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    const isRead = api.type === "query";
    const transient = result.error?.status === "FETCH_ERROR" || result.error?.status === "TIMEOUT_ERROR";
    if (result.error && !(isRead && transient)) retry.fail(result.error);
    return result;
  },
  { maxRetries: 2 },
);

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRetry,
  refetchOnReconnect: true,
  refetchOnFocus: true,
  keepUnusedDataFor: 120,
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE && action.key === "baseApi") return action.payload?.[reducerPath];
  },
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
```

`sessionExpired` clears `auth` (except `biometricEnabled`), the queue is **kept** (it replays after re-login because items carry the user id and are discarded if a different user signs in), socket disconnects, and device token is unregistered best-effort.

Error handling: a `lib/api-error.ts` helper maps `FetchBaseQueryError` → `{ code, message, details, requestId }` from the doc 00 §5.1 envelope. Global toasts only for `INTERNAL`/5xx and `RATE_LIMITED`; `VALIDATION_ERROR` details are mapped onto form fields via `setError`; `FORBIDDEN` renders an inline "You don't have access" card; `CONFLICT`/`INVALID_STATE_TRANSITION` refetch the object and show the server message (someone else already acted).

### 4.3 Tag taxonomy (shared with `frontend/`)

Entity tags use `{ type, id }` plus `{ type, id: 'LIST' }` for collections. The same names must be used in `frontend/src/shared/api/baseApi.ts` so invalidation reasoning is identical across clients.

```ts
export const TAG_TYPES = [
  "Me", "Session", "Notification", "NotificationPreference",
  "Inbox", "Approval", "Delegation",
  "Notice", "Broadcast", "Briefing",
  "NoteSheet", "Parcel", "Visit", "Incident", "Capa",
  "Trip", "TripEvent", "TollClaim", "Requisition", "FleetChat", "FuelVoucher",
  "AttendanceToday", "AttendanceDay", "Punch", "Regularisation", "Geofence",
  "LeaveRequest", "LeaveBalance", "LeaveType",
  "Claim", "Advance", "ExpensePolicy",
  "BusSeat", "BusRoute", "Waitlist", "SeatOffer",
  "ChatChannel", "ChatMessage",
  "Asset", "Custody", "Licence", "Employee", "Dashboard",
] as const;
```

Invalidation rules of thumb: a decision mutation (`approveStep`) invalidates `Inbox LIST`, `Approval id`, and the module object tag carried in the response (`{ type: 'Claim', id }`); a punch invalidates `AttendanceToday` and `AttendanceDay LIST`; socket events call `baseApi.util.invalidateTags` or `updateQueryData` (§7.6).

### 4.4 Cache lifetimes

| Data | `keepUnusedDataFor` | Polling / refetch | Notes |
| :--- | ---: | :--- | :--- |
| `getMe`, `getGeofences`, `getLeaveTypes`, `getExpensePolicy`, `getBusRoutes` | 24 h (`86400`) | on app foreground if older than 6 h | reference data |
| `getInbox`, `getUnreadCount`, `getTodayAttendance`, `getMyTrips` | 10 min | socket-driven + `refetchOnFocus` | hot paths |
| `getNotices`, `getMyParcels`, `getMyVisits`, `getMyClaims`, `getMyLeaveRequests`, `getMySeat` | 30 min | `refetchOnReconnect` | |
| `getMessages(channel)` | 5 min | socket append | infinite query, page size 50 |
| `getTrip(id)` while `ON_TRIP` | — | `pollingInterval: 30000` in TripConsole only | fall back when socket down |
| Detail screens (`getApproval`, `getNoteSheet`, `getParcel`) | 2 min default | refetch on open | |

### 4.5 Selective persistence of the query cache (offline read)

Only the endpoints a field user needs to **read** while offline are persisted: `getNotices`, `getNotice`, `getInbox`, `getApproval`, `getMyTrips`, `getTrip`, `getTodayAttendance`, `getGeofences`, `getMe`, `getMySeat`, `getTodayVisits`. A redux-persist transform keeps only those `queries` entries and strips `mutations`, `subscriptions` and `provided` so rehydration does not resurrect dead subscriptions:

```ts
// src/redux/persist/transforms.ts
import { createTransform } from "redux-persist";
const OFFLINE_READ_ENDPOINTS = new Set(["getNotices","getNotice","getInbox","getApproval","getMyTrips","getTrip",
  "getTodayAttendance","getGeofences","getMe","getMySeat","getTodayVisits"]);

export const apiWhitelistTransform = createTransform(
  (inbound: any) => ({
    ...inbound,
    queries: Object.fromEntries(Object.entries(inbound.queries ?? {}).filter(
      ([, q]: [string, any]) => q?.status === "fulfilled" && OFFLINE_READ_ENDPOINTS.has(q.endpointName))),
    mutations: {}, provided: {}, subscriptions: {},
  }),
  (outbound) => outbound,
  { whitelist: ["baseApi"] },
);
```

Persisted cache is capped at ~1 MB; the `getNotices` persisted page is the first page only. Persisted entries show a "Last synced 14 min ago" caption via `fulfilledTimeStamp`. On logout the `baseApi` persist key is purged.

---

## 5. Offline-First

ADR-18 scope: attendance punch, incident report, parcel scans, visitor check-in/out, trip events (gate-out/checkpoint/gate-in), toll claim create. Everything else requires connectivity and says so.

### 5.1 Queue design

```ts
// src/lib/offline-queue/types.ts
export type OfflineEndpoint =
  | "punchAttendance" | "reportIncident" | "scanParcel" | "checkInVisit" | "checkOutVisit"
  | "addTripEvent" | "createTollClaim" | "acknowledgeCustody";

export interface QueuedMutation {
  id: string;                 // uuid v4 (expo-crypto) — sent as Idempotency-Key
  userId: string;             // discard on replay if a different user is signed in
  endpoint: OfflineEndpoint;
  arg: unknown;               // serialisable mutation arg (no File objects — local URIs only)
  attachments?: { field: string; localUri: string; mime: string; fileId?: string }[]; // uploaded before replay
  createdAt: string;          // ISO, device time
  attempts: number;
  status: "PENDING" | "IN_FLIGHT" | "FAILED" | "CONFLICT";
  lastError?: { status: number | string; code?: string; message?: string; requestId?: string };
}
```

Rules:

1. **Idempotency key per mutation** — generated when the user taps the action, not at replay. The same key is sent on every attempt; the server replays its stored response for 24 h (doc 00 §5.1), so duplicates are impossible across retries and app restarts. Endpoints that accept `Idempotency-Key` declare it in `api.ts` via `headers: { 'Idempotency-Key': arg.idempotencyKey }`.
2. **Device timestamps travel with the payload** (`punchedAt`, `occurredAt`, `eventAt`) so a replay 40 minutes later is recorded at the real time; server stores both device time and `receivedAt`.
3. **FIFO replay, one at a time** — order matters (`GATE_OUT` before `CHECKPOINT`; parcel `HANDOVER` before `GATE_IN`). The replay loop stops at the first transient failure and resumes on the next connectivity/foreground event with exponential backoff (5 s, 15 s, 45 s, cap 5 min).
4. **Attachments first** — before replaying an item with `attachments`, upload each via presign → PUT → complete, write back `fileId` into `arg`, persist, then send the mutation. Partial uploads are resumable because `fileId` is persisted per attachment.
5. **Classification of outcomes**

| Server response | Queue action | User sees |
| :--- | :--- | :--- |
| 2xx | remove; invalidate tags listed for the endpoint | toast "Synced: Punch IN 08:42" |
| `409 CONFLICT` / `INVALID_STATE_TRANSITION` | `CONFLICT`; stop replaying items of the same object | Outbox row with server message, actions *Discard* / *View object* |
| `422 VALIDATION_ERROR`, `403 FORBIDDEN`, `404` | `FAILED` (terminal) | Outbox row with reason; *Discard* / *Edit & retry* (re-opens the form prefilled) |
| `401` | handled by reauth; if session expired, pause queue until login | lock/login |
| `FETCH_ERROR`, `TIMEOUT`, 5xx, `429` | keep `PENDING`, `attempts++`, backoff | banner "3 actions waiting to sync" |

6. **Queue limits** — 500 items or 50 MB of attachments; beyond that new offline actions are refused with an explanation (never silently dropped). Items older than 7 days become `FAILED` with "Expired — please redo".

### 5.2 Middleware / listener

```ts
// src/lib/offline-queue/listener.ts
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import NetInfo from "@react-native-community/netinfo";
import { baseApi } from "@/redux/api/baseApi";
import { queueActions, selectNextPending } from "./slice";
import { OFFLINE_ENDPOINTS } from "./registry";   // endpoint → { initiate, invalidates, uploadFields }
import { uploadAttachments } from "@/lib/files/upload";
import { apiError } from "@/lib/api-error";
import { sessionStarted, tokenRefreshed } from "@/redux/slices/auth.slice";

export const offlineListener = createListenerMiddleware();

offlineListener.startListening({
  matcher: isAnyOf(queueActions.enqueue, queueActions.replayRequested, sessionStarted, tokenRefreshed),
  effect: async (_action, api) => {
    api.cancelActiveListeners();                              // one replay loop at a time
    const net = await NetInfo.fetch();
    if (!net.isConnected || net.isInternetReachable === false) return;
    api.dispatch(queueActions.replayStarted());
    try {
      for (;;) {
        const item = selectNextPending(api.getState());
        if (!item) break;
        const def = OFFLINE_ENDPOINTS[item.endpoint];
        api.dispatch(queueActions.markInFlight(item.id));
        try {
          const arg = await uploadAttachments(item, (patch) => api.dispatch(queueActions.patchItem(patch)));
          await api.dispatch(def.initiate(arg, { track: false })).unwrap();
          api.dispatch(queueActions.remove(item.id));
          api.dispatch(baseApi.util.invalidateTags(def.invalidates(arg)));
        } catch (e) {
          const err = apiError(e);
          if (err.transient) { api.dispatch(queueActions.markPending(item.id, err)); break; }   // stop; retry later
          if (err.status === 409) api.dispatch(queueActions.markConflict(item.id, err));
          else api.dispatch(queueActions.markFailed(item.id, err));
        }
      }
    } finally {
      api.dispatch(queueActions.replayFinished());
    }
  },
});
// store.ts: NetInfo + AppState 'active' → dispatch(queueActions.replayRequested()); also a 60 s timer while items are PENDING.
```

Component-side helper:

```ts
// src/hooks/useOfflineMutation.ts
export function useOfflineMutation<TArg extends { idempotencyKey: string }, TRes>(
  endpoint: OfflineEndpoint, useMutation: () => readonly [(arg: TArg) => { unwrap(): Promise<TRes> }, MutationState],
) {
  const [trigger, state] = useMutation();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const run = useCallback(async (arg: Omit<TArg, "idempotencyKey">, attachments?: QueuedMutation["attachments"]) => {
    const full = { ...arg, idempotencyKey: Crypto.randomUUID() } as TArg;
    const net = await NetInfo.fetch();
    if (net.isConnected && net.isInternetReachable !== false && !attachments?.length) {
      try { return { queued: false as const, data: await trigger(full).unwrap() }; }
      catch (e) { if (!apiError(e).transient) throw e; }           // real errors surface immediately
    }
    dispatch(queueActions.enqueue({ id: full.idempotencyKey, userId, endpoint, arg: full, attachments, createdAt: new Date().toISOString(), attempts: 0, status: "PENDING" }));
    return { queued: true as const };
  }, [trigger, dispatch, userId, endpoint]);
  return [run, state] as const;
}
```

Mutations with attachments always go through the queue (upload is multi-step and must be resumable) — the UI shows "Uploading…" immediately when online, so the user experience is the same.

### 5.3 UI indicators

- `OfflineBanner` (existing) extended: offline → red "No connection — actions will sync later"; online with pending items → amber "Syncing 2 of 5…"; conflicts/failures → persistent crimson chip "2 need attention" linking to `/outbox`.
- `QueueBadge` on the *More* tab and on any list row whose object has a queued item (`Punch IN · waiting to sync`).
- Each queued action renders optimistically where safe (punch shows "IN 08:42 · pending verification" in grey; parcel timeline shows a dashed node), never as confirmed.
- Outbox screen: FIFO list with status, created time, server message, *Retry now*, *Discard* (confirm), *Open*.

### 5.4 What works offline / what does not

| Works offline (queued) | Partially | Does not work offline (explicit message) |
| :--- | :--- | :--- |
| Punch IN/OUT (GPS fix captured offline; server verdict on sync; UI says "pending verification") | Note-sheet: read cached detail; **sign requires OTP → online** | Approve/reject/return (requires fresh step state; shows cached inbox read-only with "Reconnect to act") |
| Incident report draft + photos + GPS | Leave: view balances/cached list; apply → online (quota check) | Login, MFA, refresh |
| Parcel `HANDOVER`/`CHECKPOINT`/`GATE_IN` scans with photo | Claims: build lines & capture receipts locally (draft slice); submit → online | Parcel OTP verify (server validates OTP; no local secret) |
| Visitor check-in/out by QR (token validated on sync; gate sees "provisional") | Trip console: events queue; **tracking points buffer** to disk and flush | Bus offer accept/decline (48 h window, server authoritative) |
| Trip `GATE_OUT`/`CHECKPOINT`/`GATE_IN`, toll claim create with receipt | Chat: read cached last page; send → online (no offline outbox for chat in v1) | Visitor registration, requisition create, chat send, dashboard |
| Asset custody acknowledge | | Anything admin |

---

## 6. Authentication and Security

### 6.1 Login

`POST /auth/login { identifier, password, device: { deviceId, platform: 'ANDROID'|'IOS', deviceName, appVersion } }` → `{ accessToken (15 min), refreshToken (30 d, rotating), user, roles, permissions, mfaRequired? , mfaToken? }`. `identifier` accepts email or employee code (prototype: email or Emp-ID). On `mfaRequired` → `/(auth)/mfa` → `POST /auth/mfa/verify { mfaToken, code }`. zod `loginSchema`: identifier `min(3)`, password `min(8)`. Five failures → server lock (`UserCredential.lockedUntil`); mobile shows the server's remaining-time message, no client-side counter. "Remember identifier" stores only the identifier in SecureStore (starter pattern), never the password.

### 6.2 Session storage

| Item | Where | Lifetime |
| :--- | :--- | :--- |
| Access token | Redux memory only | 15 min; refreshed on 401 or proactively when `expiresAt - now < 60 s` before socket connect |
| Refresh token | `expo-secure-store` (`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`, `requireAuthentication: false`) | 30 d rolling, rotated on every refresh; server stores SHA-256 in `UserSession` |
| Device id | SecureStore (generated `randomUUID()` once; survives reinstall on iOS keychain, not on Android) | app lifetime |
| User/roles/permissions | Redux `auth` persisted in SecureStore | until logout |

### 6.3 Biometric re-unlock

- Opt-in toggle in *Profile › Security* ("Unlock with fingerprint/Face ID"), enabled only if `LocalAuthentication.hasHardwareAsync() && isEnrolledAsync()`.
- Lock triggers: app returns to foreground after `> 5 min` in background (configurable server `Setting mobile.lockTimeoutMinutes`), cold start with a valid session, and **always** before `signNoteSheet` and before viewing `CONFIDENTIAL` parcels/notes.
- `/(app)/lock` is a full-screen modal rendered by `(app)/_layout.tsx` over the current screen; `authenticateAsync({ promptMessage, disableDeviceFallback: false, cancelLabel })`; device passcode is the fallback; three cancels → "Sign in with password" (full logout).
- Biometric unlock never substitutes server auth; it gates local UI only. Push deep links wait behind the lock.

### 6.4 Refresh rotation and revocation

- Single-flight refresh (§4.2). A failed refresh (401 from `/auth/refresh`) means the session was revoked (admin, "sign out all devices", password change) → `sessionExpired` → login screen with reason text from server.
- Logout: `POST /auth/logout { refreshToken }` (server sets `UserSession.revokedAt`), `DELETE /notifications/device-tokens/{token}`, clear SecureStore keys, purge `auth` + `baseApi` persist, stop trip tracking task if running, disconnect sockets. Done in `lib/session.ts → endSession(reason)` so every path is identical.
- *Profile › Devices* lists `GET /auth/sessions` and allows `DELETE /auth/sessions/{id}` (revoke other device), mirroring the prototype's "Active Devices".

### 6.5 Root / jailbreak and tamper

- Startup check: `Device.isRootedExperimentalAsync()`; if `jail-monkey` is adopted, also `isJailBroken()`, `hookDetected()`, `isDebuggedMode()` (production only).
- Policy (doc 07 owns the final rule): rooted/jailbroken devices may **read** but attendance punch, note-sheet signing and OTP verification are refused with an explanatory screen; the server is told via `X-Device-Integrity: compromised` and records it on `AttendancePunch`/`Signature`. Play Integrity / App Attest can be added later behind the same header.

### 6.6 Transport security and certificate pinning

- HTTPS only; `usesCleartextTraffic=false`; `NSAllowsArbitraryLoads=false`. Dev builds may allow `http://10.0.2.2:4000` via a dev-only network security config.
- Pinning note: Expo managed workflow has no JS-level pinning. Implement at the OS layer with a config plugin: Android `network_security_config.xml` `<pin-set>` for `oneops.bashundhara.com` (via `expo-build-properties` `android.networkSecurityConfig`), iOS `NSPinnedDomains` in `Info.plist` (iOS 14+). Pin the **intermediate CA** public key plus one backup pin, `expiration` 12 months ahead, and keep a kill-switch (`Setting mobile.pinningEnabled`) read at login so a certificate rotation mistake does not brick the fleet. Enable from the `production` profile only after the staging rehearsal in doc 08.

### 6.7 Screen privacy

- `usePreventScreenCapture()` (expo-screen-capture) on `note-sheets/[id]`, `note-sheets/[id]/sign`, parcels with `isConfidential`, chat channels with `isLocked`, and the lock screen. Android additionally gets `FLAG_SECURE` via the same hook; iOS blurs in the app switcher through a `BlurOverlay` rendered when `AppState` is `inactive`.
- Sentry `beforeSend` strips request bodies, `Authorization`, phone numbers and NID patterns; `attachScreenshot: false`.

### 6.8 PII handling

- No NID, phone or salary displayed unless the screen needs it; employee pickers show name, designation, department only.
- Photos captured for incidents/receipts are stored under `FileSystem.documentDirectory/oneops/pending/` and deleted after the server confirms `complete`; never written to the camera roll (`expo-camera` `takePictureAsync` without `MediaLibrary`).
- Cache directory is cleared on logout; `expo-image` disk cache is per-app sandbox.
- Logs: `logger` never logs bodies in production; request ids only.

### 6.9 Mock-location detection (attendance)

- Android: `LocationObject.mocked === true` → punch refused client-side with `REJECTED_MOCK` explanation and still **sent** with `isMockLocation: true` so the server records the attempt (schema `AttendancePunch.isMockLocation`, result `REJECTED_MOCK`).
- iOS exposes no mock flag; the server applies plausibility checks (speed between consecutive punches, accuracy pattern, device integrity header). The client contributes `accuracyM`, `capturedAt` vs `punchedAt` skew, and `deviceId`.
- Developer-options heuristics are not reliable in Expo and are not attempted.

---

## 7. Push Notifications

### 7.1 Registration

`useNotifications` (starter) stays the single registration point, called in `(app)/_layout.tsx` after login:

- Permission primer screen before the OS prompt the first time (explains approvals/trips/safety), then `requestPermissionsAsync`.
- `getExpoPushTokenAsync({ projectId })` where `projectId` comes from `Constants.expoConfig.extra.eas.projectId` (set by `eas init`); env fallback `EXPO_PUBLIC_EAS_PROJECT_ID`.
- `POST /notifications/device-tokens { token, platform: 'ANDROID'|'IOS', deviceId, deviceName, appVersion }` → upsert on `DeviceToken.token` (unique). Re-sent on every cold start (token can rotate) and when `lastSeenAt` is older than 7 days.
- Logout → `DELETE /notifications/device-tokens/{token}`.

### 7.2 Android channels / iOS categories

| Channel id | Importance | Sound/vibration | Used for (`Notification.type` prefixes) |
| :--- | :--- | :--- | :--- |
| `approvals` | HIGH | default | `APPROVAL_PENDING`, `APPROVAL_REMINDER`, `APPROVAL_ESCALATED`, `NOTE_SIGN_REQUESTED` |
| `parcels` | DEFAULT | default | `PARCEL_*` |
| `trips` | HIGH | custom "dispatch" tone | `TRIP_ASSIGNED`, `TRIP_UPDATED`, `TRIP_SOS` (admins) |
| `hse` | MAX, `bypassDnd` requested | siren tone, long vibration | `INCIDENT_CRITICAL`, `INCIDENT_ASSIGNED`, `CAPA_DUE` |
| `bus` | DEFAULT | default | `SEAT_OFFER`, `SEAT_OFFER_EXPIRING`, `BUS_DELAY` |
| `chat` | HIGH | message tone | `CHAT_MESSAGE`, `DIRECTIVE_ISSUED` |
| `notices` | DEFAULT | default | `NOTICE_PUBLISHED`, `BROADCAST` |
| `general` | LOW | none | everything else |

`bypassDnd` only takes effect if the device grants DND access; CRITICAL delivery therefore also uses SMS server-side (doc 00 §6.3). iOS categories with actions: `APPROVAL` (*Open*), `SEAT_OFFER` (*Accept*, *Decline* — foreground actions that open the app to the offer screen; no destructive background actions because they require fresh auth), `TRIP_ASSIGNED` (*View*), `CRITICAL_ACK` (*Acknowledge* opens app).

### 7.3 Payload contract

Server sends via Expo Push with `data`:

```json
{ "notificationId": "uuid", "type": "APPROVAL_PENDING", "module": "claims", "objectType": "Claim", "objectId": "uuid",
  "route": "/approvals/uuid", "priority": "HIGH", "ackRequired": false, "channelId": "approvals", "badge": 7 }
```

`route` is a typed Expo Router pathname produced by the server from `constants/routes` equivalents (documented in 03). Title/body are already localised by `Accept-Language` at send time (`User.preferredLang`).

### 7.4 Deep links and handling

- Cold start / background tap: `Notifications.useLastNotificationResponse()` in `(app)/_layout.tsx`; the route is stored in `pendingDeepLink` until auth guard, PersistGate and biometric lock have passed, then `router.push(route)` and `POST /notifications/{id}/read`.
- Foreground receipt: `setNotificationHandler` shows a banner except when the user is already on `route` (compare with `usePathname()`), in which case data is refreshed silently.
- URL scheme `bogcl-oneops://` and (later) universal links `https://oneops.bashundhara.com/m/*` map to the same routes through `expo-linking` + Expo Router.
- `ackRequired: true` (CRITICAL): `CriticalAckModal` is presented over everything, cannot be dismissed without *Acknowledge* → `POST /notifications/{id}/ack`; queued if offline.

### 7.5 Badge counts

`badges` slice holds `notificationsUnread`, `inboxPending`, `chatUnread`, `outboxAttention`. App icon badge = `notificationsUnread + inboxPending` (`Notifications.setBadgeCountAsync`), updated from `GET /notifications/unread-count` on foreground and from socket events. Tab badges: *Inbox* shows `inboxPending` (or unread if not approver), *More* shows `outboxAttention`.

### 7.6 Realtime (Socket.IO)

`lib/socket/client.ts` creates one manager for `EXPO_PUBLIC_WS_URL` with `auth: { token }` refreshed via `socket.auth = { token }` on `tokenRefreshed`, `transports: ['websocket']`, reconnection backoff 1–30 s. Namespaces: `/notifications` (events `notification.created`, `inbox.changed`, `badge`), `/chat` (`message.created`, `message.read`, `channel.updated`), `/presence` (join only while chat is open). Connected while app is `active`; disconnected 30 s after background **except** when the driver is `ON_TRIP` (trip updates and SOS acks). Events update RTK Query via `updateQueryData` (append message) or `invalidateTags` (inbox) — never a parallel store.

Quiet hours, digests and channel preferences are server-side (`NotificationPreference`); the mobile *Notification settings* screen is a thin form over `GET/PATCH /notifications/preferences`.

---

## 8. Geolocation

### 8.1 Permissions and config

`app.config.ts` plugin block:

```ts
["expo-location", {
  locationAlwaysAndWhenInUsePermission: "BOGCL OneOps uses your location to verify attendance at company sites and to track company vehicles during assigned trips.",
  locationWhenInUsePermission: "BOGCL OneOps uses your location to verify attendance at company sites.",
  isAndroidBackgroundLocationEnabled: true,
  isAndroidForegroundServiceEnabled: true,
}]
```

Foreground permission is requested on first punch; **background** permission is requested only for users with role `DRIVER`, only when they start their first trip, with a primer explaining the Android "Allow all the time" step. Android 14+ foreground service type `location` is declared by the plugin. Non-drivers never see the background prompt (store review requirement).

### 8.2 Attendance punch flow

```
Tap PUNCH IN
  → ensure foreground permission (primer → OS prompt) ── denied → explain + "Open settings" + "Request regularisation"
  → services enabled? ── no → explain
  → device integrity ok? ── compromised → refuse (§6.5)
  → acquire fix: up to 20 s, keep best accuracy, stop early when ≤ 50 m
  → accuracy > 50 m → "Weak GPS (±84 m). Move outdoors and retry" (retry button; no submit)
  → mocked === true → mark isMockLocation, show warning, still submit (server records REJECTED_MOCK)
  → client pre-check: haversine to nearest active geofence of my site(s) (cached /geofences)
        inside  → green "Inside HQ Baridhara fence · 42 m from centre"
        outside → amber "You are 1.3 km from Plant Keraniganj" + option "Punch anyway (field duty)" → flag fieldDutyRequested
  → POST /attendance/punches (Idempotency-Key) via useOfflineMutation
  → server verdict PunchResult: ACCEPTED | REJECTED_OUTSIDE_FENCE | REJECTED_ACCURACY | REJECTED_MOCK | PENDING_REGULARISATION
  → haptic success/failure; today card updates; rejected → CTA "Request regularisation" (prefilled)
```

```ts
// src/lib/location/punch-location.ts
import * as Location from "expo-location";

export interface PunchLocation { lat: number; lng: number; accuracyM: number; isMock: boolean; capturedAt: string; }
export class PunchError extends Error { constructor(public code: "PERMISSION_DENIED"|"LOCATION_OFF"|"ACCURACY"|"TIMEOUT", public accuracyM?: number) { super(code); } }

const MAX_ACCURACY_M = 50;
const MAX_WAIT_MS = 20_000;

export async function capturePunchLocation(): Promise<PunchLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new PunchError("PERMISSION_DENIED");
  if (!(await Location.hasServicesEnabledAsync())) throw new PunchError("LOCATION_OFF");

  const deadline = Date.now() + MAX_WAIT_MS;
  let best: Location.LocationObject | null = null;
  while (Date.now() < deadline) {
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, mayShowUserSettingsDialog: true });
    const acc = fix.coords.accuracy ?? Number.POSITIVE_INFINITY;
    if (!best || acc < (best.coords.accuracy ?? Number.POSITIVE_INFINITY)) best = fix;
    if (acc <= MAX_ACCURACY_M) break;
  }
  const accuracyM = best?.coords.accuracy ?? Number.POSITIVE_INFINITY;
  if (!best) throw new PunchError("TIMEOUT");
  if (accuracyM > MAX_ACCURACY_M) throw new PunchError("ACCURACY", Math.round(accuracyM));
  return { lat: best.coords.latitude, lng: best.coords.longitude, accuracyM: Math.round(accuracyM * 100) / 100,
           isMock: best.mocked ?? false, capturedAt: new Date(best.timestamp).toISOString() };
}
```

```ts
// src/features/attendance/api.ts (excerpt)
export interface PunchRequest { idempotencyKey: string; type: "IN" | "OUT"; punchedAt: string; lat: number; lng: number;
  accuracyM: number; isMockLocation: boolean; deviceId: string; platform: "ANDROID" | "IOS"; fieldDutyRequested?: boolean; }
export interface PunchResponse { id: string; result: PunchResult; geofenceId: string | null; distanceM: string | null; message: string; }

punchAttendance: builder.mutation<PunchResponse, PunchRequest>({
  query: ({ idempotencyKey, ...body }) => ({ url: "/attendance/punches", method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
  invalidatesTags: ["AttendanceToday", { type: "AttendanceDay", id: "LIST" }],
}),
```

Haversine (`lib/location/haversine.ts`) is used only for the pre-check and display; the server verdict (doc 00 §6.7) is authoritative and is what the UI finally shows.

### 8.3 Driver trip tracking

- Starts when the driver records `GATE_OUT` on a trip (status `ON_TRIP`) and stops on `GATE_IN`/`COMPLETED`, on logout, or when the server says the trip is closed (socket/poll). Never runs otherwise — the *Attendance* tab shows a persistent "Tracking active for PASS-2026-9042" row while on.
- `Location.startLocationUpdatesAsync(TRIP_TASK, { accuracy: Balanced, timeInterval: 15000, distanceInterval: 25, deferredUpdatesInterval: 15000, deferredUpdatesDistance: 50, pausesUpdatesAutomatically: false, activityType: AutomotiveNavigation, showsBackgroundLocationIndicator: true, foregroundService: { notificationTitle: 'BOGCL OneOps — trip in progress', notificationBody: 'Location shared with Transport Desk', notificationColor: '#A51C30', killServiceOnDestroy: false } })`.
- Android runs a foreground service (notification required). iOS uses background location updates with deferred delivery; `expo-location` does not expose the significant-change API, so the spec relies on `UIBackgroundModes: location` plus `activityType: AutomotiveNavigation` which lets iOS pause intelligently when stationary.
- `TaskManager.defineTask(TRIP_TASK)` appends points to an on-disk buffer (`lib/location/trip-task.ts`, JSON lines in `documentDirectory`), flushes every 15 s or 20 points: `POST /fleet/trips/{id}/locations { points: [{ lat, lng, speedKph, heading, accuracyM, recordedAt }] }` with `Idempotency-Key` per batch. Offline → buffer grows (cap 5,000 points ≈ 20 h), flushed in order on reconnect. Battery: Balanced accuracy, no polling when speed 0 for > 3 min (`distanceInterval` handles it).
- Schema note: doc 02 has no time-series table for these points (`TripEvent` is for discrete events). Backend must add `TripLocation` (or a Redis stream + periodic compaction) — recorded in Appendix C.

### 8.4 SOS

- `SosButton` in the trip console: press-and-hold 2 s with progress ring and haptics; release early cancels. Confirmation sheet with 3 s auto-send countdown and *Cancel*.
- Sends `POST /fleet/trips/{id}/sos { lat, lng, accuracyM, note? }` (idempotent, queued if offline). Server: `TripEvent SOS`, `FleetChatMessage` in channel `SOS`, CRITICAL notification to `TRANSPORT_ADMIN`/plant security with `ackRequired`.
- Offline fallback on the same sheet: *Call Transport Desk* (`tel:` from `Setting fleet.sosPhone`) and *Send SMS* (`sms:` with prefilled pass no + coordinates via `Linking.openURL`) — no extra packages.
- After sending, the console shows "SOS sent 14:02 · Desk acknowledged" when the ack event arrives.

---

## 9. Per-Module Screen Specifications

Conventions for every screen: `Screen` wrapper, `ScreenHeader` with back, skeleton while `isLoading`, `EmptyState` with icon/title/description, error card with *Retry* on `isError`, pull-to-refresh on lists (`refetch`), FlashList for > 20 rows, `RoleGate permission="…"` around actions, all strings via `t()`. Mutations show inline spinner on the triggering button, haptics on result, toast on success; validation errors from the server map to fields. Role gating uses `usePermission('module:action')` which checks `auth.permissions` (server is the real gate).

### 9.1 MOD-17 Approvals Center

| Screen | Route | Purpose | Gate |
| :--- | :--- | :--- | :--- |
| Inbox | `(tabs)/inbox` (Approvals segment) | Active steps assigned to me or delegated to me; filters: module chips, SLA (overdue / < 12 h / < 24 h), search; grouped by urgency | any user with ≥1 `*:approve` permission |
| Approval detail | `approvals/[id]` | `WorkflowInstance.summary` card (title, ref no, amount, department, initiator), module-specific summary block, trail timeline (`WorkflowAction[]`), attachments, *Approve* / *Return* / *Reject* bar | step `approverUserId` or `delegatedToId` = me |
| Decision sheet | bottom sheet | Comment (required for reject/return, optional approve), preset reasons (prototype's `RejectionExplanationModal` presets per category), OTP field only if `step.requiresOtp` (note-sheets) | — |
| History | `approvals/history` (from inbox menu) | My decided items with decision badge (fixes prototype defect "everything shows ✓ Approved") | — |

Hooks: `useGetInboxQuery({ module?, sla?, q?, page })` → `GET /approvals/inbox`; `useGetApprovalQuery(id)`; `useApproveStepMutation` → `POST /approvals/{id}/approve { comment?, otp? }`; `useRejectStepMutation` → `/reject { comment }`; `useReturnStepMutation` → `/return { comment }`; `useGetApprovalHistoryQuery`; `useGetMyDelegationsQuery` (read-only banner "You are acting for Farida Begum until 12 Nov").
Schemas: `decisionSchema = z.object({ decision: z.enum(['APPROVE','REJECT','RETURN']), comment: z.string().trim().max(1000), otp: z.string().regex(/^\d{6}$/).optional() }).refine(d => d.decision === 'APPROVE' || d.comment.length >= 10, { path: ['comment'] })`.
States: empty "Nothing waiting for you"; `409 INVALID_STATE_TRANSITION` → "Already decided by {name}" + refetch; offline → read-only cached inbox with banner. No batch approve on mobile (web only; deliberate — fat-finger risk).

### 9.2 MOD-01 Notices & Broadcasts

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| Notice list | `notices/index` | Pinned first, category chips (`NoticeCategory`), unread dot, `requiresAck` badge, search |
| Notice detail | `notices/[id]` | EN/BN body (language toggle respects `ui.language`, falls back to EN when `bodyBn` null), attachments (open via presigned GET in `expo-web-browser`), *Acknowledge* when `requiresAck && !ackedAt` |
| Broadcast banner | component on Home | Active `Broadcast.showBanner` notice, crimson bar with gold border (prototype), *Acknowledge*/dismiss |
| Critical ack | modal | `priority CRITICAL` + `ackRequired` → blocking modal (§7.4), mounted once in the `(app)` layout from `features/notifications/components/CriticalAckModal` |
| Compose notice | `notices/compose` | `notices:publish` holders (HR_ADMIN, PLANT_GM, HOD, HSE_OFFICER, CHAIRMAN). Form built from `GET /notices/compose-options` (allowed categories + audiences with headcounts); templates; Write/Preview toggle; priority, pin (disabled at the pin limit), require-acknowledgement; publishes via create → publish with one idempotency key per step |
| Announcement | `notices/broadcast` | `notices:broadcast` (CHAIRMAN): prefilled company-wide announcement, require-ack and SMS toggles → `POST /broadcasts` |
| Receipts | sheet on detail | Author or `notices:manage`: read/ack progress and per-recipient list (unacknowledged first) |

Hooks: `useGetNoticesQuery({ category?, unread?, requiresAck?, q?, page })` → `GET /notices` (audience-resolved server-side); `useGetNoticeQuery(id)` → `GET /notices/{id}`, which marks read server-side (doc 03); `onQueryStarted` patches cached lists so the unread dot clears without a refetch; `useAckNoticeMutation` → `POST /notices/{id}/ack`; `useGetActiveBroadcastQuery` → `GET /broadcasts/active`; `useDismissBroadcastMutation` (optimistic); `useGetComposeOptionsQuery`; `usePublishNoticeMutation`; `useCreateBroadcastMutation`; `useSetNoticePinnedMutation`, `useArchiveNoticeMutation`, `useGetNoticeReceiptsQuery` for managers. Publish/broadcast responses seed the `getNotice` cache so the new notice opens instantly. Lists and details are persisted offline (§4.5). Scheduling, audience preview and PDF stay web-only.

### 9.3 MOD-03 Note-Sheets (approve/sign)

| Screen | Route | Purpose | Gate |
| :--- | :--- | :--- | :--- |
| My note-sheets | `note-sheets/index` | Segments *Awaiting my signature* / *Initiated by me* / *Recent*; rows show `fileNo`, title, amount, urgency, current step | `note-sheets:read` |
| Detail | `note-sheets/[id]` | Header (file no, subject, department, budget head/available), numbered paragraphs (`NoteParagraph[]` with hash chip), vendor quotes table (recommended highlighted), signatory rail (`NoteSignatory[]` UPCOMING/PENDING/SIGNED), final PDF link + verification code/QR when approved; **screen capture disabled** | signatory, initiator, or `note-sheets:read` scope |
| Sign | `note-sheets/[id]/sign` (modal) | Biometric gate → method tabs *Typed* / *Stamp* (see signature note below for *Draw*); remark; *Send OTP* → 6-digit OTP input; *Sign & Forward* or *Final Sanction & Approve* (label from `isFinal`) | `NoteSignatory.userId = me && status PENDING` |
| Return / query | sheet | Reason category presets + observation + required improvements → `RETURN` | same |

Hooks: `useGetMyNoteSheetsQuery({ segment })` → `GET /note-sheets?mine=…`; `useGetNoteSheetQuery(id)`; `useRequestSignOtpMutation` → `POST /note-sheets/{id}/sign/otp`; `useSignNoteSheetMutation` → `POST /note-sheets/{id}/sign { method: SignatureMethod, signatureSvgPath?: string, typedName?: string, otp, remark? }`; `useReturnNoteSheetMutation` → `POST /note-sheets/{id}/return { reasonCategory, observation, improvements }`; `useGetNoteSheetPdfQuery(id)` → presigned URL.
Signature note: a drawn signature pad needs a vector renderer (`react-native-svg` or Skia) to capture and preview strokes; neither is in the starter. **Decision: v1 mobile supports `TYPED` and `STAMP`; `DRAWN` is web-only.** The server renders the signature image for the PDF from the typed name/stamp code (ADR-25); OTP evidence and biometric unlock give the mobile signature equivalent assurance. Revisit with `react-native-svg` if the client requires drawn signatures on phones (Appendix C17).
Schema: `signSchema = z.object({ method: z.enum(['TYPED','STAMP']), typedName: z.string().min(3).optional(), otp: z.string().regex(/^\d{6}$/), remark: z.string().max(500).optional() })`.
States: sign disabled offline ("Signing needs a live OTP"); `409` if a prior signatory returned the file meanwhile.

### 9.4 MOD-04 Parcels

| Screen | Route | Purpose | Gate |
| :--- | :--- | :--- | :--- |
| Parcels | `parcels/index` | Segments *My consignments* (sender/recipient = me) / *Custody queue* (MAILROOM, DRIVER, SECURITY_GATE: parcels where next action is mine); status pills (`ParcelStatus`); search by tracking no | `parcels:read` |
| Scan | `parcels/scan` (modal) | `QrScanner` reads `PKG-YYYY-NNNN` QR or waybill barcode → fetch parcel → `ScanResultSheet` shows parcel, current status, allowed next event (`HANDOVER`/`CHECKPOINT`/`GATE_IN`/`OUT_FOR_DELIVERY`), optional photo + note + location → confirm | `parcels:scan` |
| Detail | `parcels/[id]` | Custody timeline (`ParcelEvent[]` with hash chips, dashed node for queued scan), specs, seal no, tamper status, *Verify OTP* (recipient or courier at delivery), *Flag tamper* (→ quarantine / return), *Call recipient* (`tel:`) | — |
| Verify OTP | `parcels/[id]/verify-otp` (modal) | 6-digit `OtpPad` (schema `otpHash` is of a 6-digit OTP; prototype's 4-digit + master `1234` is removed), 3 attempts then lock message from server | `parcels:deliver` |

Hooks: `useGetParcelsQuery({ segment, status?, q? })` → `GET /parcels`; `useLazyGetParcelByTrackingQuery` → `GET /parcels/by-tracking/{trackingNo}`; `useGetParcelQuery(id)`; `useScanParcelMutation` → `POST /parcels/{id}/scan { idempotencyKey, type: ParcelEventType, note?, photoFileId?, lat?, lng?, eventAt }` (offline-queued); `useVerifyParcelOtpMutation` → `POST /parcels/{id}/verify-otp { otp }` (online only); `useFlagParcelTamperMutation` → `POST /parcels/{id}/tamper { details, photoFileId? }`; `useInitiateParcelReturnMutation` → `POST /parcels/{id}/return { reason: ReturnReason, details? }`.
Schemas: `scanSchema` (type enum, note ≤ 300, photo optional but required for `GATE_IN` when `isConfidential`), `otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/) })`.
States: scan of unknown code → "Not a BOGCL parcel code"; scan of a parcel whose next step isn't allowed for my role → sheet explains; confidential parcels hide description for non-parties and disable capture.

### 9.5 MOD-08 Visitors (gate)

| Screen | Route | Purpose | Gate |
| :--- | :--- | :--- | :--- |
| Gate today | `visitors/index` | For `SECURITY_GATE`/`RECEPTION`: segments *Expected* / *Inside* / *Overdue* for my site; VIP/GOVT rows gold-accented; counts; search by name/phone/badge. For hosts: *My guests* | `visitors:gate` or host |
| Scan pass | `visitors/scan` (modal) | QR → `qrToken` → visit card (photo, category, host, zones, PPE needs, watchlist/blacklist warning in crimson) → *Check in* (badge no input, vehicle plate optional, PPE checklist if refinery zones) / *Check out* | `visitors:gate` |
| Visit detail | `visitors/[id]` | Status, timeline, zones (`ZoneLevel` badges, escort flag), PPE record, inspection findings (HSE adds), *Mark safe* during muster | gate/host/HSE |
| Register guest | `visitors/register` | Host pre-registers: visitor (search existing by phone or new), category, purpose, expected window, site, zones, vehicle; VIP/GOVT → goes to approval workflow | `visitors:create` |
| Muster | `visitors/muster` | Evacuation roll-call: all `CHECKED_IN` at site, tap to mark safe, bulk *All safe* with confirm | `visitors:gate`, `hse:muster` |

Hooks: `useGetTodayVisitsQuery({ siteId, segment })` → `GET /visits?site=&date=today&status=`; `useLazyGetVisitByQrQuery(token)` → `GET /visits/by-qr/{token}`; `useCheckInVisitMutation` → `POST /visits/{id}/check-in { idempotencyKey, badgeNo?, vehiclePlate?, ppe?: VisitPpe, at }` (queued; shows *provisional* until synced); `useCheckOutVisitMutation` → `POST /visits/{id}/check-out { idempotencyKey, at }`; `useGetVisitQuery`; `useCreateVisitMutation` → `POST /visits`; `useMarkMusterSafeMutation` → `POST /visits/{id}/muster-safe`; `useGetMyVisitsQuery`.
Schemas: `checkInSchema` (badgeNo required for non-VIP; `ppe` all five booleans required true when any zone is RED/YELLOW); `registerVisitSchema` (fullName ≥ 3, phone BD regex `^01[3-9]\d{8}$`, purpose ≥ 10, expectedAt ≥ now, category enum, vipTier required when category VIP).
States: blacklisted → check-in blocked, *Call security lead*; expired pass → "Pass expired — ask host to re-issue".

### 9.6 MOD-09 Fleet & Dispatch

**Driver**

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| Trip console (home) | `(tabs)/home` → `DriverHome` | Today's assigned trips; the active one expanded: passenger, pickup, destination, stops, dispatch note, `TripStepper` ASSIGNED → GATE_OUT → CHECKPOINT(s) → GATE_IN → COMPLETED; big-target buttons (≥ 56 pt, prototype `DriverConsole`): *Arrived at pickup*, *Gate out* (odometer), *Checkpoint*, *Gate in* (odometer, rating request), *Toll claim*, *Call passenger*, *Chat*, `SosButton`; tracking indicator |
| Trip detail | `fleet/trips/[id]` | Events timeline with map (`MapPreview` of stops/checkpoints), pass no, vehicle, toll claims, *Share trip pass* (PDF via `expo-sharing`) |
| Toll claim | `fleet/trips/[id]/toll-claim` (modal) | Plaza picker (`Setting fleet.tollPlazas`), amount prefilled by plaza tariff (editable), receipt photo (required), submit → `TollClaim PENDING` |
| Fuel QR | `fleet/fuel/scan` (modal) | Scan `FuelVoucher.qrToken` → shows liters/station → *Redeem* with odometer |
| Dispatch chat | `fleet/chat/[channel]` | `REQ:{id}` channel for the trip + `DESK`; `FleetMsgType` TEXT/LOCATION/TOLL_CLAIM/SYSTEM; voice notes v2 |

**Requester (employee)**

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| My requisitions | `fleet/requisitions/index` | Status (`RequisitionStatus`) chips; assigned trip summary (driver, vehicle, pass) |
| New requisition | `fleet/requisitions/new` | Purpose, trip type, origin/destination (text + optional map pin), depart/return, passengers (self + `EmployeePicker`), capacity class auto from pax (> 4 → MICROBUS_7, max 7 — prototype rule), priority, cost centre (default from department); estimate shown from server `POST /fleet/requisitions/estimate` |
| Requisition detail | `fleet/requisitions/[id]` | Trail (HOD endorsement, assignment), live trip status when `IN_TRANSIT`, rate trip after completion |

Hooks: `useGetMyTripsQuery({ date })` → `GET /fleet/trips?driver=me&date=`; `useGetTripQuery(id)` (poll 30 s when active); `useAddTripEventMutation` → `POST /fleet/trips/{id}/events { idempotencyKey, type: TripEventType, odometerKm?, lat?, lng?, note?, eventAt }` (queued); `usePostTripLocationsMutation` → `POST /fleet/trips/{id}/locations` (from task, not UI); `useSendTripSosMutation` → `POST /fleet/trips/{id}/sos`; `useCreateTollClaimMutation` → `POST /fleet/toll-claims { idempotencyKey, tripId, plaza, amount, photoFileId }` (queued with attachment); `useGetMyTollClaimsQuery`; `useRedeemFuelVoucherMutation` → `POST /fleet/fuel-vouchers/{token}/redeem { odometerKm }`; `useGetMyRequisitionsQuery`; `useCreateRequisitionMutation` → `POST /fleet/requisitions`; `useEstimateRequisitionMutation`; `useGetRequisitionQuery`; `useRateTripMutation` → `POST /fleet/trips/{id}/rating`; `useGetFleetChatQuery(channel)`, `useSendFleetChatMessageMutation`.
Schemas: `tripEventSchema` (odometer required for GATE_OUT/GATE_IN, must be ≥ previous), `tollClaimSchema` (amount `z.string().regex(/^\d+(\.\d{1,2})?$/)` as money string, plaza enum from settings, photo required), `requisitionSchema` (departAt ≥ now + 30 min, returnAt > departAt when ROUND_TRIP, passengers 1–7).
Role: driver screens gated by `DRIVER` role and `trip.driverId = my driver id` (no more `DRV-01` string matching); SOS visible only while `ON_TRIP`.

### 9.7 MOD-07 HSE Incidents

| Screen | Route | Purpose | Gate |
| :--- | :--- | :--- | :--- |
| Report | `incidents/report` | 3-step wizard (prototype) compressed for mobile: (1) type (`IncidentType` grid with icons) + "Quick hazard" shortcut; (2) what/where/when: title, description, site (default mine), zone picker, occurredAt (default now), GPS auto-captured (editable pin), photos (up to 5, camera or picker); (3) severity × likelihood `RiskMatrixPicker` 5×5 (score + `RiskCategory` live), injured/witness people (`EmployeePicker` or free text), anonymous toggle; draft autosaved to `incidentDraft` slice; *Submit* (queued with photos) | any authenticated user (`incidents:report`) |
| My reports | `incidents/index` | Segments *Mine* / *Assigned to me* (HSE_OFFICER/investigator) / *Site open* (plant roles) with stage chips (`IncidentStage`) | scope |
| Detail | `incidents/[id]` | Facts, photos, risk, stage stepper, people, statutory flag (severity ≥ 3 → "Reportable to Dept. of Explosives within 24 h", countdown from `statutoryDueAt`), CAPA list, RCA summary read-only; HSE officer actions: *Triage* (confirm risk, assign investigator) | role |
| CAPA | `incidents/capa/[id]` | Owner marks `IN_PROGRESS`/`COMPLETED` with evidence text + photo; verifier (HSE) marks `VERIFIED` | owner / HSE |

Hooks: `useReportIncidentMutation` → `POST /incidents { idempotencyKey, type, title, description, siteId, zone?, occurredAt, severity, likelihood, lat?, lng?, isAnonymous, people: [{employeeId?, name?, role: PersonRole, injuryDesc?}], photoFileIds: [] }` (queued with attachments); `useGetMyIncidentsQuery({ segment })`; `useGetIncidentQuery(id)`; `useTriageIncidentMutation` → `POST /incidents/{id}/triage`; `useGetMyCapasQuery`; `useUpdateCapaMutation` → `PATCH /incidents/capas/{id} { status, evidence, photoFileId? }`.
Schema: `incidentSchema` — title 5–120, description ≥ 20, severity/likelihood `z.number().int().min(1).max(5)`, occurredAt ≤ now, photos ≤ 5 × 8 MB (compressed to 1600 px, quality 0.7 before upload), anonymous ⇒ `people` may be empty and reporter omitted.
States: critical (`riskScore ≥ 15`) submission shows a red confirmation "This will page the HSE officer and Plant GM immediately" before send; offline submit → "Saved — will send when online" with outbox link.

### 9.8 MOD-10 Attendance & Leave

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| Attendance tab | `(tabs)/attendance` | Today card (shift from `ShiftAssignment`, first IN, last OUT, worked time, `DayStatus`), `GeofenceStatus` (nearest fence, distance, accuracy), `PunchButton` IN/OUT (state from `getTodayAttendance.nextPunchType`), `MapPreview` with fence circle, 7-day `DayStrip`, links: history, regularise, leave |
| History | `attendance/history` | Month picker, `AttendanceDay[]` list with status colours, punches per day expandable (lat/lng → map), export is web-only |
| Regularise | `attendance/regularise` (modal) | `RegularisationType` (MISSED_PUNCH / FIELD_DUTY / LATE_JUSTIFICATION / REMOTE_WORK), date, requested in/out, reason ≥ 15 chars → workflow (leave/regularise template) |
| Leave list | `leave/index` | Balances per `LeaveType` (entitled/used/remaining, year), my requests with `LeaveStatus` chips |
| Apply leave | `leave/new` | Type, start/end date pickers, days computed (server confirms excluding weekends/holidays), reason, `requiresDoc` → attach photo/PDF, informed flag; balance check inline |
| Leave detail | `leave/[id]` | Trail, *Cancel* while `PENDING` |

Hooks: `usePunchAttendanceMutation` (§8.2); `useGetTodayAttendanceQuery()` → `GET /attendance/me/today` `{ day, punches[], shift, nextPunchType, trackingTripId? }`; `useGetAttendanceHistoryQuery({ month })` → `GET /attendance/me/days?month=`; `useGetGeofencesQuery()` → `GET /geofences?active=true` (24 h cache, persisted); `useCreateRegularisationMutation` → `POST /attendance/regularisations`; `useGetMyRegularisationsQuery`; `useGetLeaveTypesQuery`; `useGetLeaveBalancesQuery({ year })` → `GET /leave/balances`; `useGetMyLeaveRequestsQuery`; `useCreateLeaveRequestMutation` → `POST /leave/requests`; `useCancelLeaveRequestMutation` → `POST /leave/requests/{id}/cancel`.
Schemas: `regularisationSchema` (date ≤ today, reason ≥ 15, `requestedIn < requestedOut`), `leaveSchema` (endDate ≥ startDate, startDate ≥ today − 2 (sick leave backdating allowed up to 2 days), reason ≥ 10, document required when `leaveType.requiresDoc`).
Prototype deltas: no face-biometric animation; "Recalibrate GPS" becomes *Retry fix*; night-shift OT figures are web dashboard only.

### 9.9 MOD-11/12/13 Claims

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| My claims | `claims/index` | Type chips (TADA / CONVEYANCE / TOUR_EVENT), status (`ClaimStatus`), totals; monthly conveyance usage bar vs `conveyanceMonthlyCap` |
| New claim | `claims/new` | Type card → header (purpose preset list from prototype, destination, period, travel mode from `allowedTravelModes`, advance link for TOUR) → lines list → review (policy flags from server dry-run) → *Save draft* / *Submit* |
| Line editor | `claims/[id]/line` (modal) | Date, category (DA, HOTEL, TRANSPORT, FUEL, MEALS, RICKSHAW, CNG, RIDE_SHARE, MILEAGE, OTHER), description, from/to + km (MILEAGE auto amount = km × `mileageRatePerKm`), amount, `ReceiptCapture` (camera/picker; required when amount > `receiptRequiredAbove` unless category allows declaration), declaration toggle |
| Claim detail | `claims/[id]` | Lines with receipt thumbnails (`expo-image`), policy flags, trail, voucher no when settled, *Resubmit* after RETURNED |

Hooks: `useGetMyClaimsQuery({ type?, status? })`; `useGetClaimQuery(id)`; `useCreateClaimMutation` → `POST /claims` (DRAFT); `useUpdateClaimMutation` → `PATCH /claims/{id}`; `useUpsertClaimLineMutation` → `PUT /claims/{id}/lines/{lineId?}`; `useDeleteClaimLineMutation`; `useValidateClaimMutation` → `POST /claims/{id}/validate` (returns `policyFlags`, `policyAmount`); `useSubmitClaimMutation` → `POST /claims/{id}/submit`; `useGetExpensePolicyQuery()` → `GET /claims/policy/me` (grade-resolved); `useGetMyAdvancesQuery`.
Schemas: `claimHeaderSchema`, `claimLineSchema` (amount money string > 0, receipt required rule as above, km > 0 for MILEAGE, date within period). Money is always a string (doc 00 §5.1) and formatted with `formatBdt` (৳, lakh/crore grouping).
Drafts: header + lines + local receipt URIs kept in a `claimDraft` slice until the first successful `createClaim` (online), after which the server is the source.

### 9.10 MOD-14 Commuter Bus

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| My seat | `bus/index` | `SeatCard` (route code/name, seat no, category, pickup stop & time, bus plate, conductor), today's `BusBroadcast` (delay) banner, `StopList` inbound/outbound with map, *Release seat* (reason) / *Join waitlist* when no seat |
| Waitlist | `bus/waitlist` | Routes with occupancy (`v_bus_route_occupancy`), my position & applied time, *Join* / *Leave* |
| Offer | `bus/offers/[id]` | `SeatOffer` with `OfferCountdown` to `expiresAt` (48 h, schema) — *Accept* / *Decline*; expired → explanation and position retained per policy |

Hooks: `useGetMySeatQuery` → `GET /bus/me/seat`; `useGetBusRoutesQuery`; `useGetRouteStopsQuery(routeId)`; `useGetMyWaitlistQuery`; `useJoinWaitlistMutation` → `POST /bus/waitlist { routeId }`; `useLeaveWaitlistMutation` → `DELETE /bus/waitlist/{id}`; `useGetMyOffersQuery`; `useAcceptSeatOfferMutation` → `POST /bus/offers/{id}/accept`; `useDeclineSeatOfferMutation` → `POST /bus/offers/{id}/decline`; `useReleaseSeatMutation` → `POST /bus/allocations/{id}/release { reason }`.
States: `409` on accept (offer expired or seat gone) → refetch + message. Push `SEAT_OFFER` deep-links here; reminder at T-6 h server-side. Supervisor tools (seat map, FIFO desk, route builder) are web-only.

### 9.11 MOD-15 Inner-Circle Chat

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| Channels | `chat/index` | Channels & DMs I belong to (`ChatMember`), unread counts, locked badge, presence dots |
| Conversation | `chat/[channelId]` | Inverted FlashList, day dividers from real timestamps, `MessageBubble` (TEXT/VOICE/DOCUMENT/DIRECTIVE/SYSTEM), reactions, reply-to, pinned directive header, `DirectiveCard` with *Acknowledge*; `Composer` text + attachment (image/PDF via files flow); urgent flag; typing indicator via `/presence`. Voice-note recording and playback need `expo-audio`, which is deferred with MOD-02 (P2) — VOICE messages render as "Voice message — open on web" until then |
| Locked channels | — | Capture disabled; no forwarding; retention notice |

Hooks: `useGetChannelsQuery`; `useGetMessagesQuery({ channelId, cursor })` (infinite, 50/page) → `GET /chat/channels/{id}/messages?before=`; `useSendMessageMutation` → `POST /chat/channels/{id}/messages { clientId, type, body?, fileId?, replyToId?, isUrgent }` (optimistic insert keyed by `clientId`, reconciled on `message.created`); `useMarkChannelReadMutation`; `useAckDirectiveMutation` → `POST /chat/directives/{id}/ack`; `useReactMutation`.
Role: membership-based; directive composing (Chairman) is web + mobile for `CHAIRMAN` only (`chat:directive`).

### 9.12 MOD-05 Assets (scan, custody)

| Screen | Route | Purpose |
| :--- | :--- | :--- |
| My equipment | `assets/index` | Assets in my custody (`AssetCustody.releasedAt null`), pending acknowledgements highlighted |
| Scan | `assets/scan` (modal) | QR (`Asset.qrPayload`) → detail |
| Asset detail | `assets/[id]` | Tag, name, stage, location, custodian, next service/calibration, last events; *Acknowledge custody* (queued), *Flag defect* (note + photo → server creates CM work order per prototype rule) |

Hooks: `useGetMyAssetsQuery`; `useLazyGetAssetByTagQuery(tag)` → `GET /assets/by-tag/{tag}`; `useGetAssetQuery`; `useAcknowledgeCustodyMutation` → `POST /assets/custodies/{id}/acknowledge { idempotencyKey }`; `useFlagAssetDefectMutation` → `POST /assets/{id}/defects { note, photoFileId? }`. Register/work orders/transfers/disposal are web-only.

### 9.13 MOD-02 Dashboards & briefings (read)

`dashboard/index` renders role KPI cards from `GET /dashboards/me` (server-computed; no client constants like the prototype's `ROLE_STATS`), pending approvals shortcut, open incidents, fleet status for transport roles. `dashboard/briefings/[id]` plays `VoiceBriefing` audio (server-stored `audioFileId`; TTS fallback is not implemented on mobile — the prototype's `speechSynthesis` is web-only) and posts `POST /briefings/{id}/listen`. Hooks: `useGetMyDashboardQuery`, `useGetBriefingsQuery`, `useMarkBriefingListenedMutation`. Audio playback requires adding `expo-audio` when MOD-02 ships (P2) — recorded in §2.4 as deferred.

### 9.14 MOD-06 Compliance and MOD-16 Workforce (read)

`compliance/index` — licence list with days-to-expiry bands (critical ≤ 30, warning ≤ 90), stage chip; `compliance/[id]` dossier read-only (`useGetLicencesQuery`, `useGetLicenceQuery`), gated by `compliance:read`. `employees` feature exposes only `EmployeePicker` (`useGetEmployeeDirectoryQuery({ q })` → `GET /employees?q=` over `v_employee_directory`) and `profile/index` (`useGetMeQuery`).

---

## 10. Role-Based Home

`features/home/persona-resolver.ts` picks one landing layout from the user's roles (first match wins; users with several roles get the most operational one and can switch via a segmented control persisted in `ui.homeVariant`):

| Order | Roles | Variant | Cards (top → bottom) |
| :-- | :--- | :--- | :--- |
| 1 | `DRIVER` | `DriverHome` | Active trip console (or "No trip assigned — status AVAILABLE/OFF_DUTY toggle"), next trips today, toll claims pending, attendance punch shortcut, dispatch chat unread |
| 2 | `SECURITY_GATE`, `RECEPTION` | `GateHome` | *Scan visitor pass* (primary, full-width), expected next 2 h, inside count, overdue, *Scan parcel (gate-in)*, muster shortcut |
| 3 | `MAILROOM` | `MailroomHome` | *Scan parcel*, custody queue, dwell-time alerts (> 24 h), deliveries awaiting OTP |
| 4 | `HSE_OFFICER` | `HseHome` | Open incidents by risk, CAPA due this week, *Report incident*, muster, critical acks outstanding |
| 5 | `CHAIRMAN`, `DIRECTOR`, `PLANT_GM`, `HOD`, `LINE_MANAGER`, `FINANCE`, `HR_ADMIN`, `TRANSPORT_ADMIN` | `ApproverHome` | Inbox summary (count, oldest SLA), top 3 pending with inline *Open*, note-sheets awaiting signature, KPI strip from `getMyDashboard`, broadcast banner, notice board card (unread / to-acknowledge counts, top 3), chat unread; `CHAIRMAN` adds gold accent header and *Announce* from the notice board header |
| 6 | `EMPLOYEE` (default) | `EmployeeHome` | Punch card (status + button), leave balance mini, my claims pending, bus seat/offer, notices unread, quick actions grid: Leave · Claim · Vehicle · Guest · Incident · Parcel |

Cards are components fed by their module hooks with `skip` when the permission is absent; the home screen never fetches on behalf of a card. All variants share header (greeting in EN/BN, site, date in `Asia/Dhaka`), broadcast banner, critical ack modal, and outbox chip.

Tab visibility: the 4 tabs are constant; *Inbox* defaults to *Notifications* segment for non-approvers; *More* grid lists only modules for which the user has at least `read` permission (module registry map in `constants/permissions.ts`).

---

## 11. UI and Design System

### 11.1 Tokens (`src/constants/theme.ts`)

Mapped from the prototype's `variables.css` (doc 00 ADR-14 tokens):

```ts
export const Brand = {
  crimson: "#A51C30", crimsonDark: "#7F1424", crimsonLight: "#C8102E",
  slate900: "#0B132B", slate950: "#060D1F", slate100: "#F1F5F9", canvas: "#F8FAFC",
  gold: "#D4AF37", goldDark: "#AA820A", goldLight: "#F0DFA0",
  success: "#059669", warning: "#D97706", danger: "#DC2626", info: "#0284C7", purple: "#7C3AED",
} as const;

export const Colors = {
  light: { background: Brand.canvas, surface: "#FFFFFF", surfaceSecondary: Brand.slate100, border: "#E2E8F0",
           text: Brand.slate900, textSecondary: "#475569", textTertiary: "#94A3B8", onAccent: "#FFFFFF",
           accent: Brand.crimson, accentMuted: "#FBE9EC", executive: Brand.gold, executiveMuted: "#FBF5E0",
           success: Brand.success, successMuted: "#ECFDF5", warning: Brand.warning, warningMuted: "#FFFBEB",
           danger: Brand.danger, dangerMuted: "#FEF2F2", info: Brand.info, infoMuted: "#EFF6FF" },
  dark:  { background: Brand.slate950, surface: Brand.slate900, surfaceSecondary: "#141C33", border: "#1F2A44",
           text: "#F8FAFC", textSecondary: "#CBD5E1", textTertiary: "#64748B", onAccent: "#FFFFFF",
           accent: Brand.crimsonLight, accentMuted: "#3A1016", executive: Brand.goldLight, executiveMuted: "#2E2710",
           success: "#34D399", successMuted: "#0B2B22", warning: "#FBBF24", warningMuted: "#332107",
           danger: "#F87171", dangerMuted: "#3A1414", info: "#38BDF8", infoMuted: "#0C2A3F" },
} as const;
```

`Spacing` and `Radius` from the starter are kept (prototype radii 4–20 px map to `sm 8 / md 12 / lg 16 / xl 20`). Status semantics: `accent` = primary action; `executive` only for Chairman/VIP/directive surfaces; `danger` for SOS, reject, tamper, critical.

### 11.2 Typography

- Latin: **Inter** (prototype body font) 400/500/600/700, bundled TTF via the `expo-font` config plugin (fonts embedded at build; no runtime flash). Display font Outfit is dropped on mobile (one family keeps the bundle small).
- Bengali: **Noto Sans Bengali** 400/500/600/700 (OFL, full conjunct coverage). The prototype used Hind Siliguri; Noto is chosen for glyph coverage and matching weights — the web should align (Appendix C).
- `Typography` scale unchanged; font family resolved by `useTypography()` → `fontFamily: lang === 'bn' ? 'NotoSansBengali-*' : 'Inter-*'`, `lineHeight` ×1.45 for Bengali (taller ascenders). `allowFontScaling` stays on; layouts must survive 130 % (test in device matrix); `maxFontSizeMultiplier={1.6}` on dense rows.

### 11.3 Components (additions to the kit)

| Component | Purpose |
| :--- | :--- |
| `Skeleton` | Shimmer placeholders for rows/cards (reanimated) |
| `ListRow` | Icon/avatar + title + subtitle + right slot + chevron; 56 pt min height |
| `SectionHeader`, `Segmented`, `StatusPill` (maps enums → colour/label via i18n), `BottomSheet` (gesture-handler + reanimated; no new library) |
| `QrScanner` | `expo-camera` `CameraView` with torch, permission state UI, debounce, vibration on read, overlay mask |
| `PhotoPicker` | Camera/gallery, resize + compression via `expo-image-manipulator` (≤ 1600 px, q0.7), thumbnails, remove |
| `MapPreview` | Wraps `react-native-maps` (fence circle, markers, polyline); single place to swap for MapLibre |
| `RoleGate` | `permission` / `roles` prop; renders children, fallback or nothing |
| `OtpPad` | 6 boxes, auto-advance, paste, SMS autofill (`textContentType="oneTimeCode"`, Android SMS Retriever not used) |
| `SosButton`, `PunchButton` | Large circular press-and-hold controls with haptics and reanimated progress |

### 11.4 Interaction

- Haptics (`expo-haptics`): `notificationAsync(Success|Error)` on punch/scan/decision outcomes; `impactAsync(Heavy)` when SOS arms; off when the OS setting disables.
- Loading: skeletons on first load; inline spinners on mutations; never full-screen spinners after first paint.
- Toasts: `react-native-toast-message` with BOGCL types `success | info | warning | error | executive`.
- Confirmations: destructive actions (reject, discard queued item, release seat, logout) use a `BottomSheet` confirm, not `Alert`.

### 11.5 Accessibility

- Touch targets ≥ 44 × 44 pt (driver console ≥ 56 pt); `hitSlop` on icon buttons.
- Every actionable element has `accessibilityRole` and a translated `accessibilityLabel`; status pills expose `accessibilityValue`.
- Colour is never the only signal (icons/text on status).
- Dynamic type to 130 % without clipping; RTL not required (EN/BN are LTR).
- Screen reader order verified with TalkBack/VoiceOver on the four P0 flows.
- Reduced motion (`AccessibilityInfo.isReduceMotionEnabled`) disables shimmer and spring animations.

---

## 12. Internationalisation (EN/BN)

- `i18next` + `react-i18next` + `expo-localization`. Namespaces per module (`common`, `auth`, `approvals`, `notices`, `attendance`, `leave`, `fleet`, `parcels`, `visitors`, `incidents`, `claims`, `bus`, `chat`, `assets`, `errors`, `enums`). Resources bundled (no network loading) under `src/locales/{en,bn}/*.json`; `fallbackLng: 'en'`; `compatibilityJSON: 'v4'`. ADR-16 mentions ICU plurals; `i18next-icu` is **not** added on mobile because Bengali and English both use simple one/other plural rules, which i18next's built-in `Intl.PluralRules` resolver handles. Keys and interpolation syntax must still match the web catalogues so EN/BN JSON files can be shared verbatim.
- Initial language: `ui.language` if set, else `Localization.getLocales()[0].languageCode === 'bn' ? 'bn' : 'en'`. Switch in *Profile › Language* (and on the login screen) → `i18n.changeLanguage`, persist `ui.language`, `PATCH /auth/me/preferences { preferredLang }` so server-generated text (push, PDFs) follows (doc 00 §5.1 `Accept-Language`).
- Enum labels (`ParcelStatus`, `IncidentType`, …) live in the `enums` namespace, keyed by the exact doc 02 enum value, so `t('enums:ParcelStatus.AT_GATE')` works for every status pill.
- Formatting (`lib/i18n/formatters.ts`): dates via `date-fns-tz` in `Asia/Dhaka` with `bn`/`enGB` locales; money via `formatBdt("4850000.00")` → `৳48,50,000` (en-IN grouping as the prototype; Bengali numerals `৪৮,৫০,০০০` only when `ui.bengaliNumerals` is on); numbers via `Intl.NumberFormat` (Hermes Intl is available on both platforms in RN 0.85).
- Server strings (notifications, error messages, notice bodies) are already localised; the app never re-translates them. Bilingual fields (`titleBn`, `bodyBn`, `nameBn`) use `pickLang(obj, 'title')` helper with EN fallback.
- Lint: a custom ESLint rule (`no-literal-jsx-text`) flags untranslated JSX strings outside `*.test.tsx`.

---

## 13. Performance

| Area | Target / practice |
| :--- | :--- |
| Startup | Cold start to interactive home < 2 s on a 2021 mid-range Android (e.g. Redmi Note 10). Hermes (default). Splash held until PersistGate rehydrate + fonts ready, then `SplashScreen.hideAsync()`. Defer Sentry native init, socket connect and push registration to after first paint (`InteractionManager.runAfterInteractions`). Persisted state kept small (§4). |
| Lists | `@shopify/flash-list` v2 everywhere a list can exceed ~20 rows; stable `keyExtractor`; row components receive primitive props; `getItemType` for mixed chat rows. |
| Images | `expo-image` with `cachePolicy="memory-disk"`, `recyclingKey={id}`, `contentFit="cover"`, blurhash placeholders from server (`FileObject` gains `blurhash` — optional). Uploads compressed to ≤ 1600 px / q0.7. |
| Re-renders | Selectors with `createSelector`; RTK Query `selectFromResult` to subscribe to slices of a response; no inline object props in rows. |
| React Compiler | The starter enables `experiments.reactCompiler`. Implications: (1) do **not** add manual `useMemo`/`useCallback`/`React.memo` by habit — the compiler memoises; profile first; (2) components and hooks must be pure and follow the Rules of React (no mutating refs during render, no reading `ref.current` in render) or the compiler skips them silently; (3) third-party components that break the rules can be excluded with the `"use no memo"` directive; (4) ESLint `react-hooks` v6 rules (already in the starter — see `react-hooks/set-state-in-effect` in `OfflineBanner`) must stay enabled so violations are caught in lint rather than at runtime; (5) verify compiled output on the trip console and chat list with the React DevTools "Memo ✨" badge during review. |
| Bundle | `npx expo export --platform android --source-maps` + `source-map-explorer` in CI; budget 4 MB Hermes bytecode for the JS bundle, APK/AAB ≤ 45 MB. Import icons as `@expo/vector-icons/Ionicons` only (one family). No moment/lodash. Route-level code splitting is automatic with Expo Router lazy routes. |
| Network | RTK Query dedupes; lists page at 20; `If-None-Match`/ETag honoured by `fetchBaseQuery` automatically when server sends them; images via presigned CDN URLs with 1 h TTL. |
| Battery | Location only during punch or `ON_TRIP`; socket disconnected in background; `pollingInterval` only on active trip. |
| Memory | Chat infinite query trims to 10 pages (`maxPages`); photos removed from disk after upload. |
| Measurement | Sentry Performance app-start/slow-frames in production at 20 % sample; `expo-dev-client` perf monitor in dev; Maestro flows record duration per step. |

---

## 14. Testing

| Layer | Tooling | Scope / examples |
| :--- | :--- | :--- |
| Unit | Jest (`jest-expo` preset, config already in `package.json`) | `haversine`, `formatBdt`, `persona-resolver`, offline queue slice reducers, `apiError` mapping, zod schemas (`incidentSchema`, `claimLineSchema`), `capturePunchLocation` with mocked `expo-location` (accuracy loop, mocked flag, timeout) |
| Component | `@testing-library/react-native` (remember `await render(...)` under React 19) | UI kit variants, `PunchButton` states, `InboxRow`, `OfferCountdown`, `CriticalAckModal` cannot be dismissed, `RoleGate` |
| API / integration | `msw` (`msw/node` in Jest) + real `store` | `baseQueryWithReauth`: 401 → refresh → retry, single-flight under 3 concurrent 401s, refresh failure → `sessionExpired`; offline replay: enqueue offline, replay FIFO, stop on FETCH_ERROR, 409 → CONFLICT; tag invalidation after `approveStep` |
| Screen | RNTL + msw + `expo-router` testing (`renderRouter`) | Login → MFA → home redirect; approval detail approve flow; parcel scan sheet for each allowed event type |
| E2E | Maestro flows in `app/.maestro/` run against `preview` builds | `login.yaml`, `punch.yaml` (mock location via `setLocation`), `approve.yaml`, `scan-parcel.yaml` (test QR image injected via camera mock build flag), `report-incident-offline.yaml` (airplane mode toggle), `driver-trip.yaml` |
| Static | `tsc --noEmit`, ESLint flat config, Prettier, `npx expo-doctor`, `npx expo install --check` | CI gate (ADR-20) |
| Accessibility | RNTL `toBeAccessible` checks on primary buttons; manual TalkBack/VoiceOver pass per release on P0 flows | |

Device matrix (minimum for release sign-off):

| OS | Devices | Notes |
| :--- | :--- | :--- |
| Android 10 (API 29) | Samsung A-series 2020 (low RAM) | background location permission flow, FLAG_SECURE |
| Android 12/13 | Xiaomi/Redmi (MIUI battery killer) | foreground service survives; tracking primer explains battery optimisation exemption |
| Android 14/15 | Pixel 7/8 | foreground service type `location`, notification permission (API 33+) |
| iOS 15.1 | iPhone 8/SE2 | min supported (RN 0.85 floor) |
| iOS 17/18 | iPhone 13/15 | Face ID, Live Activities not used |

Mocks: `expo-location`, `expo-camera`, `expo-local-authentication`, `expo-notifications`, `@react-native-community/netinfo` under `__mocks__/`; test ids follow `tid.<feature>.<element>` from `constants/test-ids.ts` so Maestro and RNTL share selectors.

Scripts: `npm run typecheck && npm run lint && npm test -- --ci` (CI), `maestro test .maestro --env APP_ID=com.bogcl.oneops` (nightly on EAS-built APK via an Android emulator job).

---

## 15. Build and Release

### 15.1 EAS profiles (`app/eas.json`, adapted)

| Profile | Purpose | Distribution | Channel | Notable settings |
| :--- | :--- | :--- | :--- | :--- |
| `development` | Dev client for engineers | internal | `development` | `developmentClient: true`, Android `apk` (debug gradle), iOS simulator; `env.EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`, `EXPO_PUBLIC_ENV=local` |
| `preview` | Pilot / UAT builds for BOGCL testers | internal | `preview` | Android `apk`, iOS ad-hoc; env → `https://staging-oneops.bashundhara.com`; Sentry enabled with `environment: staging` |
| `production` | Store / managed distribution | store | `production` | `autoIncrement: true` (already), Android `app-bundle`, iOS provisioning per §15.5; env → `https://oneops.bashundhara.com`; pinning on |

Secrets and non-public config are **EAS environment variables** (`eas env:create --scope project --name SENTRY_AUTH_TOKEN --visibility secret`), never in `eas.json`. Public runtime values (`EXPO_PUBLIC_*`) are set per environment on the EAS side as well so a build's API URL is never typed by hand.

### 15.2 Environment handling

`src/lib/env.ts` validates at startup with zod (`EXPO_PUBLIC_API_URL` url, `EXPO_PUBLIC_WS_URL` url, `EXPO_PUBLIC_ENV` enum) and throws early (keeps the starter's "no silent fallback" behaviour). `app.config.ts` reads build-time vars (`GOOGLE_MAPS_ANDROID_KEY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `EAS_PROJECT_ID`) and emits `extra.eas.projectId`, `android.config.googleMaps.apiKey`, and the Sentry plugin config.

### 15.3 OTA updates (`expo-updates`)

- `runtimeVersion: { policy: 'appVersion' }`; `updates.checkAutomatically: 'ON_LOAD'`, `fallbackToCacheTimeout: 0` (never block launch), `updates.url` from EAS.
- Policy: JS/asset-only fixes ship as `eas update --channel production --message "…"` after passing the same CI gates; any native change (new module, permission, plugin config, SDK bump) requires a new build and a `version` bump (which changes `runtimeVersion`). Updates are first published to `preview`, soak 24 h with pilots, then `production`. Rollback: `eas update:republish` of the previous group.
- In-app: `Updates.useUpdates()` shows a non-blocking "Update ready — restart" toast; critical fixes can set `extra.forceUpdate` in the update manifest to prompt immediately. Drivers `ON_TRIP` are never prompted to restart.

### 15.4 Versioning

`version` semver (`MAJOR.MINOR.PATCH`): PATCH for OTA-eligible fixes, MINOR for feature releases, MAJOR for breaking API (`/api/v2`). `versionCode`/`buildNumber` auto-incremented by EAS on `production`. Minimum supported app version is enforced server-side via `X-Client` → `426 UPGRADE_REQUIRED` → blocking "Update required" screen with store link.

### 15.5 Distribution and store listing

- **Pilot (Phase 1):** Android `preview` APKs via EAS internal distribution links + QR for ~50 pilots; iOS via TestFlight internal/external testers (up to 10,000).
- **Production:** Android via **Managed Google Play private app** under Bashundhara's enterprise organisation (no public listing), or closed testing track if MDM is not ready. iOS via **Apple Business Manager Custom Apps** (private to Bashundhara's organisation) — this is the recommended route for a company-internal app; the starter's `enterpriseProvisioning: "universal"` assumes the Apple Developer **Enterprise** Program, which requires separate eligibility — decision needed from BOGCL IT (Appendix C).
- Listing assets: name "BOGCL OneOps", short description EN/BN, screenshots of home/punch/inbox/trip console in both languages, privacy policy URL on `oneops.bashundhara.com/privacy`, data-safety form (location: attendance & fleet, precise, collected, not shared; photos; identifiers) and iOS privacy nutrition labels aligned with doc 07.
- Permissions rationale text (store review): background location only for drivers during trips; camera for scanning/photos; notifications for approvals and safety.

### 15.6 CI (summary; details in doc 08)

GitHub Actions on `app/**`: install → `typecheck` → `lint` → `test` → `expo-doctor` → (on `develop`) `eas update --channel preview --auto` for JS-only diffs, `eas build --profile preview --non-interactive` nightly; (on tag `mobile-v*`) `eas build --profile production` + `eas submit`. Sentry source maps uploaded by the Sentry Expo plugin during EAS build.

---

## 16. Environment Variables

`app/.env.example` must contain **names only** (no values, no commented-out values):

```
# Public (bundled into JS — never secrets)
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_WS_URL=
EXPO_PUBLIC_ENV=              # local | dev | staging | production
EXPO_PUBLIC_SENTRY_DSN=       # blank disables Sentry
EXPO_PUBLIC_EAS_PROJECT_ID=   # fallback; normally from app.config extra.eas.projectId
EXPO_PUBLIC_MAP_PROVIDER=     # google | apple | maplibre (MapPreview switch)

# Build-time only (EAS env / CI secrets; no EXPO_PUBLIC_ prefix)
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
GOOGLE_MAPS_ANDROID_KEY=
EAS_PROJECT_ID=
```

**Action required before the first commit on the production branch:** the current `app/.env.example` contains what appear to be real values — an API base URL, RevenueCat public keys and a commented-out Sentry auth token (and the file is tracked in git). (1) Replace the file with the template above; (2) rotate the Sentry auth token and RevenueCat keys at the providers (RevenueCat is being removed anyway, but the keys were exposed); (3) purge the file from history (`git filter-repo --path app/.env.example --invert-paths` followed by a force-push coordinated with the team) or accept the exposure explicitly in the security log; (4) add a pre-commit secret scanner (`gitleaks` in lint-staged) so it cannot recur. `.gitignore` already ignores `.env`, `.env.local`, `.env*.local`.

---

## 17. Appendices

### Appendix A — Starter file → action

| Path (under `app/`) | Action | Notes |
| :--- | :--- | :--- |
| `app.json` | **Replace** with `app.config.ts` | identity, plugins (location, camera, local-auth, updates, build-properties, font, screen-capture), runtimeVersion |
| `eas.json` | Modify | channels per profile, env per profile, remove placeholder submit ids |
| `package.json` | Modify | name, remove/add deps (§2), scripts `e2e`, `analyze` |
| `.env.example` | **Rewrite** (names only) | §16 |
| `babel.config.js`, `metro.config.js`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.husky/pre-commit`, `jest.cssMock.js` | Keep | add `gitleaks` to lint-staged |
| `AGENTS.md`, `.agents/AGENTS.md`, `.agents/skills/*` | Modify | update stack list (remove RevenueCat), new route tree, offline-queue skill |
| `CLAUDE.md` | Keep | `@AGENTS.md` include |
| `README.md` | Rewrite | project-specific |
| `note.txt`, `scripts/reset-project.js`, `docs/ANALYTICS/**` | Delete | |
| `docs/REDUX/BEST_PRACTICES.md` | Keep | still accurate |
| `assets/fonts/Quicksand-*` | Delete → add `Inter-*`, `NotoSansBengali-*` | |
| `assets/icons/*.png`, `assets/images/{react-logo*,expo-*,tutorial-web,logo-glow,tabIcons/**}` | Delete | |
| `assets/images/{icon,splash-icon,android-icon-*,favicon}.png`, `assets/expo.icon/*` | Replace | BOGCL branding |
| `src/global.css` | Keep (web font vars only) | |
| `src/app/_layout.tsx` | Modify | remove RevenueCat block; add I18nProvider, deep-link handler, Sentry user identify |
| `src/app/index.tsx` | Modify | redirect to `/(app)/(tabs)/home` or `/(auth)/login` |
| `src/app/(auth)/_layout.tsx` | Keep | |
| `src/app/(auth)/login.tsx` | Modify | identifier field, language toggle, remove register link and debug home link, replace `expo-checkbox` |
| `src/app/(auth)/forgot-password.tsx` | Modify | copy + endpoint |
| `src/app/(auth)/welcome.tsx`, `register.tsx` | Delete | |
| `src/app/(auth)/mfa.tsx` | **Add** | |
| `src/app/(app)/_layout.tsx` | Modify | real auth guard (remove `const token = true`), lock gate, socket/push/replay bootstraps, stack registrations for all module routes |
| `src/app/(app)/(tabs)/_layout.tsx` | Modify | tabs home/inbox/attendance/more with badges |
| `src/app/(app)/(tabs)/index.tsx` | Rename → `home.tsx` | persona landing |
| `src/app/(app)/(tabs)/explore.tsx` | Delete | |
| `src/app/(app)/(tabs)/notifications.tsx` | Rename → `inbox.tsx` | segments approvals/notifications, FlashList, real hooks |
| `src/app/(app)/(tabs)/profile.tsx` | Move → `(app)/profile/index.tsx`; new `(tabs)/more.tsx` | |
| `src/app/(app)/edit-profile.tsx` | Move → `(app)/profile/edit.tsx` | reference form pattern retained |
| `src/app/(app)/new-item.tsx` | Delete | |
| all other `src/app/(app)/<module>/**` | **Add** | §3.2 |
| `src/components/ui/*` | Modify | re-theme; add Skeleton, ListRow, SectionHeader, BottomSheet, StatusPill, Segmented |
| `src/components/{ErrorBoundary,OfflineBanner,ScreenHeader,TabBarIcon}.tsx` | Modify | theme tokens instead of hard-coded `#2B7FFF`; OfflineBanner queue states |
| `src/components/providers/ReduxProvider.tsx` | Modify | spinner colour via theme |
| `src/components/{QrScanner,PhotoPicker,MapPreview,RoleGate,QueueBadge,SignaturePad}.tsx` | **Add** | |
| `src/constants/theme.ts` | Modify | §11.1 |
| `src/constants/index.ts` | Modify | remove RevenueCat/support constants; `APP_NAME` |
| `src/constants/{roles,permissions,routes,test-ids}.ts` | **Add** | |
| `src/hooks/{use-color-scheme*,use-theme,useAppState,useNetworkStatus}.ts` | Keep | |
| `src/hooks/useNotifications.ts` | Modify | channels (§7.2), projectId source, token upsert |
| `src/hooks/useRevenueCat.ts` | Delete | |
| `src/hooks/{usePermission,useOfflineMutation,useBiometricLock,useHaptics,useTypography}.ts` | **Add** | |
| `src/lib/logger.ts`, `src/lib/sentry.ts` | Keep / modify (`beforeSend` scrub, role tag) | |
| `src/lib/currency.ts` | Replace → `lib/i18n/formatters.ts` (`formatBdt`) | |
| `src/lib/revenuecat.ts`, `src/services/revenueCat.ts`, `src/lib/ReactotronConfig.ts` | Delete | Reactotron optional |
| `src/lib/validation/{auth,profile}.ts` + tests | Move → `features/auth/schemas.ts`, `features/profile/schemas.ts` | login schema becomes identifier-based |
| `src/lib/validation/newItem.ts` | Delete | |
| `src/lib/{env,storage/*,location/*,camera/*,files/*,offline-queue/*,i18n/*,socket/*,biometrics,device,api-error,session}.ts` | **Add** | |
| `src/redux/api/baseApi.ts` | Rewrite | §4.2, tags §4.3 |
| `src/redux/store.ts` | Modify | split persistence, listeners (replay), `baseApi` persist + `extractRehydrationInfo` |
| `src/redux/storage.ts` | Move → `lib/storage/secure-persist.ts`; add `async-persist.ts` | |
| `src/redux/hooks.ts` | Keep | |
| `src/redux/features/auth/{authSlice,authSlice.test,authApi,mapAuthResponse}.ts` | Rewrite → `redux/slices/auth.slice.ts`, `features/auth/{api,map-auth-response}.ts` | new shape (§4.1) |
| `src/redux/features/notificationService/notification.api.ts` | Move → `features/notifications/api.ts` | align to `DeviceToken`, `/notifications/*` |
| `src/redux/features/notificationService/tabIndicatorSlice.ts` | Replace → `features/notifications/badge.slice.ts` | |
| `src/redux/features/profileService/profileApi.ts` | Rewrite → `features/profile/api.ts` | `/auth/me`, sessions |
| `src/redux/features/{child,expenseService,homeScreenService,scheduleService,subscription,supportService}/**`, `profileService/{documents,milestone}.api.ts` | Delete | |
| `src/types/chat.type.ts` | Delete → `types/generated/openapi.d.ts` (generated), `types/api.ts` | |
| `src/features/**`, `src/locales/**`, `.maestro/**` | **Add** | |

### Appendix B — Mobile ↔ Web feature parity matrix

Legend: **F** full, **P** partial (listed), **R** read-only, **—** absent.

| Module | Capability | Web | Mobile | Mobile notes |
| :--- | :--- | :---: | :---: | :--- |
| MOD-17 | Inbox, approve/reject/return, trail | F | F | includes batch approve |
| MOD-17 | Delegation setup | F | R | banner only |
| MOD-01 | Read, acknowledge, broadcast banner | F | F | |
| MOD-01 | Publish / schedule / audience | F | P | compose + publish (templates, preview, pin, require-ack), chairman announcement, receipts, pin/archive; scheduling, audience preview and PDF web-only |
| MOD-03 | Read, sign (TYPED/STAMP) with OTP, return | F | P | DRAWN signature web-only in v1 |
| MOD-03 | Initiate, quotes, budget | F | — | |
| MOD-04 | Scan events, OTP verify, tamper, return initiate | F | F | scans offline-queued |
| MOD-04 | Register consignment, manifests | F | — | |
| MOD-05 | Scan, custody ack, defect flag, my equipment | F | F | |
| MOD-05 | Register, work orders, depreciation, transfer, disposal | F | — | |
| MOD-06 | Licence list/dossier | F | R | |
| MOD-06 | Renewal pipeline, DO letters | F | — | |
| MOD-07 | Report with photo/GPS, my reports, CAPA update | F | F | offline draft |
| MOD-07 | RCA, closure sign-off, statutory dossier | F | R | |
| MOD-08 | Gate scan/check-in/out, PPE, muster, host register, my guests | F | F | VIP approval web |
| MOD-08 | Inspection findings, barrier, analytics | F | P | HSE adds findings |
| MOD-09 | Driver console, tracking, SOS, toll, fuel QR, chat | P (desk) | F | tracking mobile-only |
| MOD-09 | Requisition create/track/rate | F | F | |
| MOD-09 | Dispatch/assign, pooling, driver & vehicle masters | F | — | |
| MOD-10 | Geo punch, today, history, regularise | P (no GPS) | F | punch is mobile-first; web punch only from allowed desktop IPs (doc 06) |
| MOD-10 | Leave apply/cancel/balances | F | F | |
| MOD-10 | Rosters, muster export | F | — | |
| MOD-11/12/13 | Create/submit with receipts, track | F | F | receipt camera mobile-first |
| MOD-11/12/13 | Finance settlement, policy tables | F | R | |
| MOD-14 | My seat, waitlist, offer accept/decline, release | F | F | |
| MOD-14 | Supervisor seat map, FIFO desk, routes, buses | F | — | |
| MOD-15 | Channels, text, attachments, directive ack | F | F | voice notes v2 |
| MOD-15 | Channel admin, retention | F | — | |
| MOD-02 | Role dashboard KPIs, briefing playback | F | R | audio needs `expo-audio` (P2) |
| MOD-02 | Voice briefing publish, ROI dossier | F | — | |
| MOD-16 | Directory search (picker), my profile | F | R | |
| MOD-16 | Onboarding, exit clearance | F | — | |
| MOD-18 | Admin | F | — | |
| Cross | Notifications, preferences, devices/sessions, language, biometric lock, outbox | F (no biometric/outbox) | F | |

### Appendix C — Inconsistencies and decisions register

| # | Finding | Source | Resolution in this spec |
| :-- | :--- | :--- | :--- |
| C1 | ADR-17 says redux-persist with a SecureStore adapter; SecureStore values > 2 KB warn/fail on Android, so persisting the offline queue or API cache there is not viable | doc 00 vs Expo docs | Split: SecureStore for `auth` (compact) + refresh token; AsyncStorage for `ui`, queue, drafts, selected API cache. Recommend amending ADR-17 wording |
| C2 | Doc 00 names "Expo Router v4"; SDK 56 ships `expo-router@~56.2` (SDK-aligned versioning) | doc 00 vs `app/package.json` | Treat as the same thing; cite by SDK |
| C3 | No time-series table for driver tracking points; `TripEvent` is for discrete events | doc 02 | Backend to add `TripLocation` (partitioned) or Redis stream; mobile posts `POST /fleet/trips/{id}/locations` batches |
| C4 | Prototype parcel OTP is 4-digit with master `1234`; schema says 6-digit bcrypt | prototype vs doc 02 | 6-digit, no master code |
| C5 | Prototype bus promotion is immediate; schema has 48 h `SeatOffer` | prototype vs doc 02 | Follow schema; offer screen with countdown |
| C6 | Prototype uses Hind Siliguri for Bengali; this spec uses Noto Sans Bengali | prototype vs prompt | Noto on mobile; web should align or ADR-14 should name the Bengali font explicitly |
| C7 | Prototype "face biometric" punch; doc 00 excludes biometric devices | prototype vs doc 00 | Geofence + device biometric unlock only |
| C8 | Starter `baseApi` uses cookies (`credentials: "include"`) and a Django-style `/api/token/refresh/ { refresh }` | starter vs ADR-06 | Bearer + SecureStore refresh, `/auth/refresh { refreshToken }` with rotation |
| C9 | Starter `(app)/_layout.tsx` hard-codes `const token = true` (auth bypass) and `login.tsx` has a debug link to home | starter | Must be fixed in the first adaptation PR |
| C10 | Starter `DeviceTokenData.platform: string`; schema enum `Platform { ANDROID IOS WEB }` | starter vs doc 02 | Enum values |
| C11 | `app/.env.example` contains live-looking values, including a commented-out auth token, and is tracked | starter | §16 scrub + rotate + history purge |
| C12 | `app.json` lacks `ios.bundleIdentifier` and `runtimeVersion`; splash/icon colours are template blue | starter | §2.1 |
| C13 | `eas.json` production iOS `enterpriseProvisioning: "universal"` presumes Apple Enterprise Program | starter | Decision for BOGCL IT: Apple Business Manager Custom Apps (recommended) vs Enterprise |
| C14 | `@expo/ui`, `expo-glass-effect`, `expo-symbols` installed but unused | starter | Remove |
| C15 | Doc 00 §7 lists MOD-05 assets as mobile "scan, custody ack" and MOD-06/MOD-16 as "read"; the prompt's flow list omitted them | doc 00 | Included as P2/P3 (§1.3) so the registry stays authoritative |
| C16 | `VoiceBriefing` playback needs an audio module not in the starter | doc 00 MOD-02 | `expo-audio` deferred to P2; TTS fallback web-only |
| C17 | DRAWN signature on mobile would require `react-native-svg` (or Skia) | ADR-25 | TYPED/STAMP on mobile v1; DRAWN web-only; revisit with `react-native-svg` if client insists |
| C18 | Doc 02 `NotificationPreference` has quiet hours but no per-channel toggles; mobile settings screen only exposes what exists | doc 02 | Settings = channels[], quietStart/End, digestDaily |
| C19 | Web punch (MOD-10) — doc 00 marks mobile "✔ (punch)" but does not say whether web punch exists | doc 00 | Mobile is the punch surface; any web punch policy belongs in doc 06 |
| C20 | React Compiler + manual memoisation guidance absent from doc 10 | doc 10 (pending) | §13 guidance should be copied into doc 10 for both clients |

---

*End of document 05.*
