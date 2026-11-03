---
name: flutter-i18n-keys
description: Add or change user-facing strings in the Flutter app with English and Bangla ARB keys, plurals and placeholders. Use whenever a screen needs new text.
---

# Flutter i18n (EN + BN)

- Files: `ftr-a/lib/l10n/app_en.arb` (template) and `app_bn.arb`. Generated class `AppL10n` in `lib/l10n/gen` via `flutter gen-l10n`.
- Key naming: `<module><Screen><Element>` in lowerCamelCase, e.g. `leaveApplyReasonLabel`. Shared: `commonSave`, `commonRetry`.
- Each key has an `@key` description when it has placeholders; use ICU plurals: `"{count, plural, =0{No items} =1{1 item} other{{count} items}}"`.
- Every key exists in both files with natural Bangla (not transliteration); BN machine drafts are marked in `FEATURE_STATUS.md` as needs-review.
- Use `AppL10n.of(context)` (or the `context.l10n` extension). Never concatenate translated fragments; use placeholders.
- Dates and numbers: `intl` formatters in `Asia/Dhaka`; Bengali digits for `bn`.
- After editing run `flutter gen-l10n`, then `flutter analyze`.
