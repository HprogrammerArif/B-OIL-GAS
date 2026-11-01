---
name: add-mobile-screen
description: Add a feature or screen to the Expo app in app/ (Expo Router route, RTK Query endpoints, offline-aware mutations, permissions UX, i18n, tests). Use when building a mobile screen or flow such as attendance punch, approvals, parcel scan, driver console, or incident report.
disable-model-invocation: true
---

# Add a Mobile Screen / Feature

## Inputs to confirm first
1. Screen spec in `docs/platform/05_MOBILE_APP_SPECIFICATION.md` (navigation, hooks, offline behaviour, native capabilities).
2. Endpoints in `docs/platform/03_API_SPECIFICATION.md`; regenerate types with `npm run api:types`.
3. Existing starter conventions: `app/.agents/AGENTS.md`, `app/.agents/skills/rtk-query/SKILL.md`, `app/.agents/skills/expo-router-auth/SKILL.md`.

## Checklist
```
- [ ] Route file under src/app/(app)/<module>/<screen>.tsx (or (tabs)/) — typed routes, Stack.Screen options with i18n title
- [ ] src/features/<module>/api.ts — injectEndpoints; same tag names as frontend
- [ ] Screen wrapped in <Screen>; loading / empty / error / offline states
- [ ] Mutations that must work offline: dispatch via enqueueMutation({ endpoint, args, idempotencyKey })
- [ ] Native capability (location/camera/biometrics): request permission with rationale screen; handle denied → settings link
- [ ] Zod form schema + react-hook-form; server error mapping
- [ ] i18n keys in src/i18n/locales/{en,bn}/<module>.json
- [ ] Deep link registered in src/lib/notifications/routes.ts if a notification opens this screen
- [ ] Haptics on success/failure; accessibilityLabel on icon buttons; FlashList for lists
- [ ] Tests: jest-expo component test with MSW; Maestro flow if it is a critical path
- [ ] npm run lint && npm run typecheck && npm test
```

## Patterns

```ts
// features/attendance/api.ts
punchAttendance: b.mutation<PunchResult, PunchBody>({
  query: (body) => ({ url: '/attendance/punch', method: 'POST', body }),
  invalidatesTags: [{ type: 'Attendance', id: 'TODAY' }],
}),
```

```ts
// screens/PunchScreen.tsx (flow from spec §8)
const fix = await getAccurateFix({ maxAccuracyM: 50, timeoutMs: 15000 }); // expo-location
if (fix.isMock) return showError(t('punch.mockLocation'));
await enqueueMutation({ endpoint: 'punchAttendance',
  args: { type, lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracy, isMock: fix.isMock, deviceId, punchedAt: new Date().toISOString() },
  idempotencyKey: uuid() });
```

Native additions need a one-line justification in the PR and a new EAS build.
