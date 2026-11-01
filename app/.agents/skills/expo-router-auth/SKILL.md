---
name: expo-router-auth
description: Knows the auth flow pattern in this project — (auth)/ and (app)/ route groups, how to redirect after login/logout, and how to protect screens.
---

# Expo Router Auth Pattern

## Route Groups

```
src/app/
├── _layout.tsx          ← Root layout (providers, SDK init)
├── (auth)/
│   ├── _layout.tsx      ← Unauthenticated layout
│   ├── login.tsx        ← Login screen
│   └── register.tsx     ← Register screen
└── (app)/
    ├── _layout.tsx      ← Auth guard — redirects to login if no token
    └── index.tsx        ← Main app home screen
```

## Auth Guard Pattern

The `(app)/_layout.tsx` checks for a token from Redux and redirects if missing:

```tsx
const token = useAppSelector(selectCurrentToken);
useEffect(() => {
  if (!token) router.replace("/(auth)/login");
}, [token]);
if (!token) return null;
return <Slot />;
```

## After Successful Login

```ts
// 1. Dispatch credentials to Redux
dispatch(
  setCredentials({
    user,
    role,
    token,
    refreshToken,
    isAddChild,
    isSendInvite,
    device_token,
  }),
);

// 2. Navigate to app (replace so back button doesn't go back to login)
router.replace("/(app)");
```

## After Logout

```ts
// 1. Clear Redux state
dispatch(logout());

// 2. Navigate to login
router.replace("/(auth)/login");
```

## Adding New Protected Screens

Add files inside `src/app/(app)/`:

```
src/app/(app)/
├── index.tsx      ← default home
├── profile.tsx    ← /profile
└── settings/
    └── index.tsx  ← /settings
```

They are automatically protected by the `(app)/_layout.tsx` auth guard.
