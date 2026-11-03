---
name: flutter-port-rn-module
description: Port a module from the legacy React Native app (app/) or web prototype (client/) to the Flutter app, reusing business rules and seed data. Use when a module already exists in app/ or client/.
---

# Port a Module to Flutter

1. Locate sources: `app/src/mock/engine/<m>.ts`, `app/src/mock/handlers/<m>.ts`, `app/src/mock/seed/<m>.ts`, `app/src/features/<m>`, `app/src/locales/{en,bn}/<m>.json`, and the prototype view in `client/src`.
2. Translate, do not copy-paste: TS types -> freezed models; zod -> validators; RTK Query endpoints -> repository methods; i18next JSON -> ARB keys (flatten `module.section.key` to `moduleSectionKey`); Redux slices -> Riverpod notifiers.
3. Keep rule parity: same BR ids, caps, grade bands, flags, state machines, seed IDs and persona mappings so the demo story is unchanged.
4. Improve UX where the RN version was weak (native feel, animation, skeletons) but never drop a feature.
5. Then follow `flutter-add-feature` for the rest of the checklist and update `ftr-a/docs/FEATURE_STATUS.md`.
