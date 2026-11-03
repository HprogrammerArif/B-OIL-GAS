---
name: flutter-add-feature
description: Add a complete module/feature to the Flutter app in ftr-a/ (mock endpoints and engine, data/domain/presentation layers, Riverpod, go_router routes, EN+BN strings, all states). Use when building or porting a BOGCL module such as leave, claims, parcels, visitors, fleet or incidents.
---

# Add a Flutter Feature (end to end)

## Read first
1. `ftr-a/docs/FEATURE_STATUS.md` (what exists) and `.cursor/rules/flutter.mdc`.
2. Module rules in `docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` (`BR-<MOD>-<NN>`) and screens in `docs/platform/05_MOBILE_APP_SPECIFICATION_FLUTTER.md` §9.
3. Endpoint shapes in `docs/platform/03_API_SPECIFICATION.md` (the mock mirrors them).
4. If a React Native version exists, port its logic from `app/src/mock/engine/<module>.ts` and `app/src/features/<module>`; do not edit those files.

## Checklist
```
- [ ] domain/: freezed models + enums + value objects (money as decimal string)
- [ ] mock/engines/<module>.dart: business rules (BR ids in comments), workflow hooks, reference numbers
- [ ] mock/seed/<module>.dart: realistic seed across the 7 personas (versioned; bump MOCK_DB_VERSION)
- [ ] mock handlers registered; doc 03 envelope, error codes, pagination
- [ ] data/: repository over Dio; offline-capable mutations use the queue + idempotency key
- [ ] presentation/: @riverpod controllers; screens with loading, empty, error, offline, success states
- [ ] routes in app/router.dart with permission guard; deep link if a notification opens it
- [ ] ARB keys in app_en.arb and app_bn.arb; flutter gen-l10n
- [ ] Role visibility: only show entry points the persona's permissions allow; no dead links
- [ ] Haptics, Semantics, 48dp targets, dark mode checked
- [ ] dart run build_runner build --delete-conflicting-outputs; dart format; flutter analyze
- [ ] Update ftr-a/docs/FEATURE_STATUS.md and doc 06/05 if behaviour changed
- [ ] Write test files (do NOT run them; see no-tests-during-development)
```

## Finish
Give the user the exact `flutter run -d <device>` command and a per-persona checklist. Never launch the app yourself.
