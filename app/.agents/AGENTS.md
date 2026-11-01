# Project Agent Rules — React Native Expo Starter

## Stack

- **Expo SDK 56** · React 19 · React Native 0.85
- **Expo Router v4** (file-based, typed routes, `src/app/` root)
- **StyleSheet + theme tokens** (`src/constants/theme.ts` — no CSS-in-JS library; NativeWind/Tailwind were removed)
- **Redux Toolkit** + **Redux Persist** + **SecureStore** adapter
- **RTK Query** via `src/redux/api/baseApi.ts`
- **react-hook-form** + **zod** for all forms (`@hookform/resolvers/zod`)
- **RevenueCat** (`react-native-purchases`) for IAP
- **Sentry** (`@sentry/react-native`) — optional, toggle via `EXPO_PUBLIC_SENTRY_DSN` env var
- **expo-notifications** for push notifications
- **ESLint + Prettier + Husky/lint-staged**, **Jest + jest-expo + @testing-library/react-native**

---

## Package Installation — CRITICAL

**ALWAYS use `npx expo install <package>` — NEVER `npm install` or `yarn add`.**

`npx expo install` resolves the correct version for the current SDK.
Use `npm install` only for pure JS/dev-only packages (e.g., `eslint` plugins, `zod`, `react-hook-form`).

```bash
# ✅ Correct
npx expo install expo-camera react-native-mmkv

# ❌ Wrong
npm install expo-camera
yarn add react-native-mmkv
```

After adding any native module, rebuild the dev client:

```bash
npx expo prebuild --clean
npx expo run:android   # or run:ios
```

---

## File Structure

Everything lives under `src/` — there is no code outside it besides config files.

```
reactnativestarter/
├── src/
│   ├── app/                 # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx      # Root layout — providers, SDK init
│   │   ├── (auth)/          # Unauthenticated screens (welcome, login, register, forgot-password)
│   │   └── (app)/           # Authenticated screens
│   │       ├── (tabs)/      # Tab navigator (home, explore, notifications, profile)
│   │       └── edit-profile.tsx  # Pushed/modal screen — reference form implementation
│   ├── components/
│   │   ├── ui/               # Shared component library — Screen, Button, TextField, Card,
│   │   │                     # Badge, EmptyState, FormField. Use these, don't hand-roll new ones.
│   │   ├── providers/        # React context providers (ReduxProvider)
│   │   ├── ErrorBoundary.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── ScreenHeader.tsx
│   │   └── TabBarIcon.tsx
│   ├── constants/
│   │   ├── index.ts          # Barrel export + app constants
│   │   └── theme.ts          # Colors, spacing, radius, typography tokens — the design system
│   ├── hooks/                 # All hooks (use-theme, useNetworkStatus, useNotifications, useRevenueCat, ...)
│   ├── lib/                   # SDK/init helpers (sentry.ts, revenuecat.ts, logger.ts) + validation/ (zod schemas)
│   ├── redux/                 # Redux store, slices, RTK Query APIs
│   │   ├── api/baseApi.ts     # RTK Query base API — inject endpoints here, never call createApi() again
│   │   ├── features/          # Redux slices (auth, child, expenseService, etc.)
│   │   ├── store.ts           # configureStore with persist
│   │   ├── hooks.ts           # useAppDispatch, useAppSelector
│   │   └── storage.ts         # SecureStore adapter for redux-persist
│   ├── services/               # Non-Redux service wrappers (RevenueCat purchase/restore)
│   └── types/                  # Shared TypeScript types
├── assets/                     # Images, fonts, icons
```

---

## Routing Conventions

- All routes live in `src/app/`
- `(auth)/` group = unauthenticated (no token required)
- `(app)/` group = authenticated (token required — redirect to login if missing), wrapped in a `Stack`
  so screens like `edit-profile.tsx` can be pushed on top of the `(tabs)` navigator
- Use `useAppSelector(selectCurrentToken)` to check auth state in layouts
- Use `router.replace('/(auth)/login')` for auth redirects (not `push`)

---

## Redux / RTK Query

- Use `useAppDispatch` and `useAppSelector` (typed wrappers) — never raw `useDispatch`/`useSelector`
- Add feature APIs by injecting into `baseApi` with `baseApi.injectEndpoints()`
- Always define tag types in `baseApi.ts` `tagTypes` array before using them
- Selectors live at the bottom of each slice file, prefixed with `select`

```ts
// ✅ Correct
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
const user = useAppSelector(selectCurrentUser);

// ❌ Wrong
import { useSelector } from "react-redux";
const user = useSelector((state: any) => state.auth.user);
```

---

## Styling — StyleSheet + theme tokens

NativeWind/Tailwind were removed — the codebase is ~95% `StyleSheet.create` and that's now the
single convention. Do not reintroduce a CSS-in-JS or utility-class library.

- Pull colors from `useTheme()` (`src/hooks/use-theme.ts`), never hardcode hex values
- Pull spacing/radius/typography from `Spacing` / `Radius` / `Typography` in `src/constants/theme.ts`
- Reuse `src/components/ui/*` (Screen, Button, TextField, Card, Badge, EmptyState) instead of
  building one-off buttons/inputs per screen
- Platform-specific styles: use `.web.tsx` / `.native.tsx` file extensions

---

## Forms

Every form uses **react-hook-form + zod**, not raw `useState` per field:

1. Define a schema in `src/lib/validation/<domain>.ts` (see `auth.ts`, `profile.ts`)
2. `useForm({ resolver: zodResolver(schema) })`
3. Render fields with `<FormField control={control} name="..." label="..." />` from `@/components/ui`
4. See `src/app/(app)/edit-profile.tsx` for the full reference pattern (form + RTK Query mutation + Toast feedback)

---

## Sentry (Optional)

Sentry is **opt-in**. It is a no-op when `EXPO_PUBLIC_SENTRY_DSN` is not set in `.env.local`.

- Init: `src/lib/sentry.ts` — call `initSentry()` once in `_layout.tsx`
- Never remove the Sentry init call — just leave `EXPO_PUBLIC_SENTRY_DSN` blank to disable

---

## Logging

Use `logger` from `@/lib/logger` instead of bare `console.log`/`console.warn`. `logger.log`/`warn`
are stripped in production builds automatically; `logger.error` is always kept.

---

## Environment Variables

All env vars must use the `EXPO_PUBLIC_` prefix to be accessible in the JS bundle.
Private server-side vars (like `SENTRY_AUTH_TOKEN`) are build-time only and do NOT use that prefix.

`EXPO_PUBLIC_API_URL` is required — the app throws on startup if it's missing (no silent fallback
to a placeholder URL). Required vars — see `.env.example` for the full template.

---

## Tooling

- `npm run lint` / `npm run format` / `npm run typecheck` / `npm test` before considering work done
- Husky runs `lint-staged` (ESLint + Prettier) on every commit — don't bypass with `--no-verify`
- Tests live next to the code they test (`*.test.ts` / `*.test.tsx`), using Jest + `@testing-library/react-native`.
  `render()` from `@testing-library/react-native` is **async** under React 19 — always `await render(...)`.

---

## EAS Build Profiles

| Profile       | Purpose          | Command                                      |
| ------------- | ---------------- | -------------------------------------------- |
| `development` | Dev client build | `eas build -p android --profile development` |
| `preview`     | APK for testers  | `eas build -p android --profile preview`     |
| `production`  | Store submission | `eas build -p android --profile production`  |

OTA updates: `eas update --branch production --message "..."` for JS-only changes.

---

## Docs

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
