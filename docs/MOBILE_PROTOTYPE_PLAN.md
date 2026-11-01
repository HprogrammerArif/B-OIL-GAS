# Mobile App Prototype Plan — BOGCL OneOps Mobile

**Status:** M0 in progress (1 Nov 2026).
**Codebase:** `app/` (Expo SDK 56). The prototype *is* the production mobile app at an early stage: same architecture, same contracts, data served by an in-app mock server until `server/` exists.
**Specs:** `docs/platform/05` (mobile), `03` (API contract), `02` (schema), `06` (business rules). Behaviour reference: the web prototype in `client/` (`docs/PROTOTYPE_ENHANCEMENT_PLAN.md`).

## 1. Decisions (1 Nov 2026)

| # | Decision | Consequence |
| :-- | :--- | :--- |
| D1 | Build in `app/`, not a separate folder | Starter cleanup per doc 05 §2 happens now; no later port |
| D2 | Every web-prototype feature, redesigned for phone | Doc 05 §1.3/§1.4 and Appendix B are widened: desk tools (asset register, permit Kanban, bus supervisor, onboarding/exit, notice publish, note-sheet initiation, dispatch) ship on mobile behind the same permissions |
| D3 | Demo runs as a development build (`expo-dev-client`, local `expo run:android` or EAS `development` profile) | Any SDK-compatible native module may be used |
| D4 | Backend-ready by construction: screens only call RTK Query endpoints shaped exactly like doc 03 | `EXPO_PUBLIC_API_MODE=mock` routes requests to `src/mock` (in-app server over seed data persisted in AsyncStorage); `live` uses `fetchBaseQuery` against `EXPO_PUBLIC_API_URL`. Switching is configuration, not code |

## 2. Architecture

```
route (src/app/**)  →  feature screen (src/features/<module>/screens)
                         │ RTK Query hooks (features/<module>/api.ts, injectEndpoints, doc 03 paths)
                         ▼
                 baseApi (src/redux/api/baseApi.ts)
                         │ baseQuery = API_MODE === 'live' ? baseQueryWithReauth(fetch) : mockBaseQuery
                         ▼
        live: server/ (Express, doc 01)          mock: src/mock/server.ts
                                                   router(method, path) → handler(ctx)
                                                   ctx = { user, permissions, body, query, params }
                                                   db = seed tables (src/mock/seed/*) persisted to AsyncStorage
                                                   rules = doc 06 business rules (state machines, scope)
```

- **Contract fidelity:** mock responses use doc 03 envelopes (`{ data, meta }`, `{ error: { code, message, details } }`), enum values from doc 02 (`SCREAMING_SNAKE`), money as decimal strings, ISO timestamps, `Idempotency-Key` honoured on POST.
- **Identity:** the client never maps role → permission. It reads `GET /me` and `GET /me/permissions` (keys from doc 03 Appendix A, e.g. `claims:approve@DEPARTMENT`) and gates UI with `usePermission(key)`. The mock server owns the persona → role → permission matrix.
- **Types:** `src/types/api.ts` (envelope, error) and `src/types/domain.ts` (hand-written mirrors of doc 03 shapes). When `server/` publishes OpenAPI, `npm run api:types` generates `src/types/generated/openapi.d.ts` and `domain.ts` re-exports from it.
- **Offline:** doc 05 §5 queue for punch, incident report, parcel scans, visitor check-in/out, trip events, toll claims, custody acknowledgement.
- **Security:** refresh token in SecureStore only; access token in memory; biometric re-unlock; screenshot prevention on note-sheets and chat; no PII in logs.
- **Presenter tools (hidden):** long-press the brand mark for 2 s → persona switch, scenarios, reset demo data, theme, language. Mock mode only.

## 3. Personas (mock server seed)

| Persona | Emp ID | Roles (doc 00 §5.3) | Home variant (doc 05 §10) |
| :-- | :-- | :-- | :-- |
| Ahmed Akbar Sobhan | EMP-0001 | `CHAIRMAN` | Approver (executive) |
| Engr. Md. Harunur Rashid | EMP-0012 | `PLANT_GM`, `HSE_OFFICER` | Approver (plant) |
| Sayeda Afroza Sultana | EMP-0028 | `HR_ADMIN` | Approver (HR) |
| Md. Kamruzzaman | EMP-0045 | `TRANSPORT_ADMIN`, `SECURITY_GATE`, `MAILROOM` | Approver (transport) with gate/parcel cards |
| Farida Begum | EMP-0062 | `HOD`, `FINANCE` | Approver (department) |
| Tanvir Ahmed | EMP-1042 | `EMPLOYEE` | Employee |
| Md. Rafiqul Islam | EMP-0821 | `DRIVER` | Driver |

## 4. Phases

| Phase | Content | Exit criteria |
| :-- | :--- | :--- |
| **M0 Foundation** | Starter cleanup (doc 05 §2), identity/config, deps, BOGCL theme + Inter/Noto Sans Bengali, i18next EN/BN, API layer with mock/live switch, mock server core (router, envelope, auth, `/me`, permissions, idempotency, latency), auth flow (login, biometric lock, logout), app shell (4 tabs, persona home, More grid from `navigation[]`, profile/settings, offline banner, outbox), presenter panel, dev build | Log in as each persona on an Android dev build; home and More grid differ per role; theme + language switch; typecheck/lint/tests green |
| **M1 Field P0** | Approvals inbox/decide; Notices (read/ack, publish for publishers); Attendance punch (geofence) & Leave; Fleet (requester create/track, driver console + SOS + toll, dispatch assign/pooling); Parcels (scan, PIN verify, desk); Visitors (host register, gate check-in/out, muster); Incidents (report with photo/GPS, triage, CAPA) | All P0 flows end-to-end per persona against the mock server |
| **M2 Office** | Note-sheets (read, sign with drawn/typed/stamp, initiate), Claims (TA/DA, conveyance, tour; receipt camera; HOD/finance decisions), Bus (seat, waitlist, offers, supervisor deck, conductor scan), Chat (channels, DMs, directives), Assets (scan, custody, register, work orders, disposal), Dashboards per role + voice briefing | Parity with web prototype for these modules |
| **M3 Desk & management** | Compliance (list, dossier, Kanban stages, DO letters), Workforce (directory, onboarding, exit clearance), notifications centre, search, presenter scenarios (docs/05 acts) | Every web feature reachable on phone for the right persona |
| **M4 Quality** | Both themes, BN, accessibility (TalkBack), performance (cold start, FlashList), Jest + MSW tests, Maestro flows (login, punch, approve, parcel scan), screenshots, doc 05 updates | Release-candidate dev build |

## 5. Conventions

- Routes thin; features own screens/components/api/schemas (doc 05 §3).
- All text through i18next (`src/locales/{en,bn}/*.json`); enum labels in `enums` namespace keyed by doc 02 values.
- Forms: react-hook-form + zod; server `VALIDATION_ERROR` details mapped to fields.
- Lists: FlashList; images: expo-image; icons: `@expo/vector-icons/Ionicons` only.
- Colours only from `useTheme()`; no hex in components.
- Every screen handles loading (skeleton), empty, error, offline.
