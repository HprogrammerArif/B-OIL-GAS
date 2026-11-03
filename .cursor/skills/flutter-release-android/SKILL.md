---
name: flutter-release-android
description: Prepare the Flutter app for a pitch/distribution build (versioning, signing, icons, splash, flavors) and give the user build commands. Use at release time (Phase 8) or when the user asks for an APK.
---

# Android Release Prep

The agent never builds or installs (rule `no-emulator-or-device-runs`). It prepares config and gives commands.

```
- [ ] Version in pubspec.yaml (name+build), applicationId bd.com.bogcl.bogcl_oneops
- [ ] App icon + adaptive icon + splash generated from assets
- [ ] Upload keystore created by the USER (path/passwords in android/key.properties, git-ignored, never in repo)
- [ ] android/app/build.gradle reads key.properties; R8 minify + shrink on; permissions minimal
- [ ] flutter analyze clean; (tests only if user asked)
- [ ] Give commands: flutter build apk --release --split-per-abi | flutter build appbundle
- [ ] Handoff summary per .cursor/rules/handoff-summary.mdc
```
