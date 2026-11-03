---
name: flutter-add-screen
description: Add or change a single screen in ftr-a/ using the shared design kit, Riverpod, go_router and l10n, with all UI states and accessibility. Use for one screen, a bottom sheet, or a form within an existing feature.
---

# Add a Flutter Screen

```
- [ ] Place in lib/features/<module>/presentation/screens/<name>_screen.dart (ConsumerWidget)
- [ ] Register a typed go_router route in lib/app/router.dart; add guard if permission-gated
- [ ] Use shared widgets (lib/shared/widgets) and theme tokens; no hardcoded colors/text
- [ ] State from @riverpod controllers; watch with select() where possible
- [ ] States: loading (skeleton), empty (illustration + CTA), error (retry), offline banner, success feedback
- [ ] Forms: validation with inline messages, keyboard actions, disabled-while-submitting, double-tap guard
- [ ] Permissions (location/camera): rationale first; denied -> settings link
- [ ] Strings in app_en.arb + app_bn.arb; check long Bangla text does not overflow
- [ ] Semantics labels, 48dp targets, text scale 1.3 safe, dark mode
- [ ] Hero/implicit animations 150-300 ms; haptic on success/failure
- [ ] dart format; flutter analyze; update FEATURE_STATUS.md
```
