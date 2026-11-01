# 🚀 React Native Expo Starter

A production-grade **Expo SDK 56** starter template following modern best practices. Clone this
for every new project — auth, forms, a design system, and tooling are pre-wired so you can start
on real screens on day one.

---

## ✨ Tech Stack

| Layer          | Technology                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Framework      | [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) + React 19 + React Native 0.85                    |
| Navigation     | [Expo Router v4](https://docs.expo.dev/router/introduction/) (file-based, typed routes)                  |
| Styling        | `StyleSheet` + a token-based design system (`src/constants/theme.ts`) — light/dark aware                 |
| Components     | Shared UI kit in `src/components/ui/` — Screen, Button, TextField, Card, Badge, EmptyState, FormField    |
| Forms          | [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) validation                     |
| State          | [Redux Toolkit](https://redux-toolkit.js.org/) + [Redux Persist](https://github.com/rt2zz/redux-persist) |
| Storage        | `expo-secure-store` (encrypted persist adapter)                                                          |
| Data Fetching  | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) (in `baseApi`)                              |
| Payments       | [RevenueCat](https://www.revenuecat.com/) (`react-native-purchases`)                                     |
| Notifications  | `expo-notifications`                                                                                     |
| Error Tracking | [Sentry](https://sentry.io/) (opt-in via env var)                                                        |
| Linting/Format | ESLint (flat config) + Prettier + Husky/lint-staged pre-commit hook                                      |
| Testing        | Jest + `jest-expo` + `@testing-library/react-native`                                                     |
| Build & Deploy | [EAS Build + EAS Update](https://expo.dev/eas)                                                           |

---

## 📂 Project Structure

Everything lives under `src/` — there's no code split across the repo root.

```
├── .agents/                  # AI agent rules and skills (kept in sync with the real codebase)
│
├── src/
│   ├── app/                  # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx       # Root layout — all providers wired here
│   │   ├── (auth)/           # Unauthenticated route group
│   │   │   ├── welcome.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   └── (app)/            # Authenticated route group (auth guard)
│   │       ├── (tabs)/       # Home / Explore / Notifications / Profile
│   │       └── edit-profile.tsx  # Reference form screen — copy this pattern for new forms
│   │
│   ├── components/
│   │   ├── ui/                # Shared component library — use these, don't hand-roll new ones
│   │   ├── providers/         # ReduxProvider (store + PersistGate)
│   │   ├── ErrorBoundary.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── ScreenHeader.tsx
│   │   └── TabBarIcon.tsx
│   │
│   ├── constants/
│   │   ├── index.ts           # Barrel export + app constants
│   │   └── theme.ts           # Colors, spacing, radius, typography tokens — the design system
│   │
│   ├── hooks/                 # use-theme, useNetworkStatus, useNotifications, useRevenueCat, ...
│   │
│   ├── lib/
│   │   ├── sentry.ts          # Sentry init (opt-in, no-op if DSN not set)
│   │   ├── revenuecat.ts      # RevenueCat configure + login/logout helpers
│   │   ├── logger.ts          # __DEV__-gated logging
│   │   └── validation/        # zod schemas (auth.ts, profile.ts) — one per form domain
│   │
│   ├── redux/
│   │   ├── api/baseApi.ts     # RTK Query base API — inject endpoints here
│   │   ├── features/          # Redux slices + RTK Query endpoints (auth, child, expenses, ...)
│   │   ├── store.ts           # configureStore + redux-persist
│   │   ├── hooks.ts           # useAppDispatch, useAppSelector (typed)
│   │   └── storage.ts         # SecureStore adapter for persist
│   │
│   ├── services/               # Non-Redux service wrappers (RevenueCat purchase/restore)
│   └── types/                  # Shared TypeScript types
│
├── assets/                    # Images, fonts, icons
├── .env.example               # Copy to .env.local and fill in values
└── eas.json                   # EAS build profiles (dev, preview, production)
```

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> my-new-app
cd my-new-app

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your values in .env.local — EXPO_PUBLIC_API_URL is required, the app
# throws a clear error on startup if it's missing.

# 4. Start the dev server
npm start
```

> **Note:** If you add native modules, you need a dev build — not Expo Go:
>
> ```bash
> npx expo run:android   # or run:ios
> ```

---

## 🔐 Environment Variables

Copy `.env.example` → `.env.local` and fill in:

| Variable                             | Required    | Description                                                      |
| ------------------------------------ | ----------- | ---------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`                | ✅ Required | Your backend base URL — the app fails fast on startup without it |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | For IAP     | RevenueCat Android API key                                       |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY`     | For IAP     | RevenueCat iOS API key                                           |
| `EXPO_PUBLIC_SENTRY_DSN`             | Optional    | Leave blank to disable Sentry                                    |
| `EXPO_PUBLIC_PROJECT_ID`             | For push    | Your Expo project ID                                             |
| `SENTRY_AUTH_TOKEN`                  | Build only  | For Sentry source maps upload                                    |

---

## 🛠 Scripts

| Script           | Command                      | Description                      |
| ---------------- | ---------------------------- | -------------------------------- |
| Start dev server | `npm start`                  | Launch Metro bundler             |
| Run on Android   | `npm run android`            |                                  |
| Run on iOS       | `npm run ios`                |                                  |
| Lint             | `npm run lint`               | ESLint                           |
| Format           | `npm run format`             | Prettier — writes changes        |
| Type check       | `npm run typecheck`          | `tsc --noEmit`                   |
| Test             | `npm test`                   | Jest                             |
| Health check     | `npm run doctor`             | Check for Expo issues            |
| Fix versions     | `npm run fix`                | Auto-fix version mismatches      |
| Clear cache      | `npm run clean`              | Restart Metro with cleared cache |
| Rebuild native   | `npm run rebuild`            | `expo prebuild --clean`          |
| Preview build    | `npm run build:android`      | EAS preview APK                  |
| Production build | `npm run build:android:prod` | EAS production bundle            |
| OTA update       | `npm run update`             | Push JS update to production     |

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier) on staged files automatically.

---

## 🔑 Auth Flow

1. User opens app → `(app)/_layout.tsx` checks Redux for a real token (`selectCurrentToken`)
2. No token → redirected to `/(auth)/login`
3. Login/Register screens use `react-hook-form` + `zod`, call the real `useLoginMutation` /
   `useRegisterMutation` RTK Query hooks, and `dispatch(setCredentials(...))` on success
4. Logout → `dispatch(logout())` → `router.replace("/(auth)/login")`
5. "Remember me" persists only the email (via SecureStore) — never the password

Add new protected screens inside `src/app/(app)/` — they're automatically guarded. The response
shape your backend actually returns may differ from the app's internal auth state shape — adjust
the single adapter in `src/redux/features/auth/mapAuthResponse.ts` to match your API contract.

---

## 🎨 Design System & Components

All colors, spacing, radius, and typography live in `src/constants/theme.ts`. Screens read colors
via `useTheme()` (`src/hooks/use-theme.ts`) so light/dark mode works automatically — never hardcode
a hex color in a screen.

Reusable building blocks live in `src/components/ui/`:

- `Screen` — safe-area + scroll + keyboard-avoiding wrapper, use on every route
- `Button` — primary/secondary/outline/ghost/destructive variants, loading state
- `TextField` — label/error/helper text, built-in password show/hide toggle
- `Card`, `Badge`, `EmptyState` — layout/status primitives
- `FormField` — react-hook-form `Controller` wired to `TextField`, used with a zod resolver

## 📝 Adding a New Form

See `src/app/(app)/edit-profile.tsx` for the full reference pattern. In short:

```ts
// src/lib/validation/myForm.ts
import { z } from "zod";
export const myFormSchema = z.object({ name: z.string().min(1, "Required") });
export type MyFormValues = z.infer<typeof myFormSchema>;
```

```tsx
const { control, handleSubmit } = useForm<MyFormValues>({
  resolver: zodResolver(myFormSchema),
  defaultValues: { name: "" },
});

<FormField control={control} name="name" label="Name" />
<Button title="Save" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />
```

---

## 📡 Adding a New API Endpoint

```ts
// src/redux/features/posts/posts.api.ts
import { baseApi } from "@/redux/api/baseApi";

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => "/api/posts/",
      providesTags: ["Posts"],
    }),
  }),
});

export const { useGetPostsQuery } = postsApi;
```

Then add `"Posts"` to `tagTypes` in `src/redux/api/baseApi.ts`.

---

## 🧪 Testing

```bash
npm test
```

Tests live next to the code they test (`*.test.ts` / `*.test.tsx`). See existing examples:

- `src/lib/validation/auth.test.ts` — zod schema tests
- `src/redux/features/auth/authSlice.test.ts` — reducer tests
- `src/components/ui/Button.test.tsx` — component test with `@testing-library/react-native`

**Note:** `render()` from `@testing-library/react-native` is async under React 19 — always
`await render(...)` in tests.

---

## 🏗 EAS Builds

```bash
# Development client (for native testing)
eas build -p android --profile development

# Preview APK (for testers)
npm run build:android

# Production (store submission)
npm run build:android:prod

# OTA update (JS changes only)
npm run update
```

---

## 🔇 Sentry (Optional)

Sentry is **disabled by default**. To enable:

1. Create a project at [sentry.io](https://sentry.io)
2. Add your DSN to `.env.local`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
   ```
3. That's it — no code changes needed.

---

## 📦 Installing New Packages

```bash
# ✅ Always use this for Expo/React Native packages
npx expo install <package-name>

# ✅ Fine for pure JS/dev-only packages (zod, eslint plugins, etc.)
npm install <package-name>
```

---

## ⚠️ Known Advisory

`expo-doctor` flags a Hermes V1 memory regression present in this Expo SDK 56 patch line (fixed in
SDK 57 / RN 0.86.2+). Upgrading major SDK versions is a deliberate, separate decision — not
something this starter does automatically. Run `npx expo-doctor` for the latest guidance before
shipping to production.
