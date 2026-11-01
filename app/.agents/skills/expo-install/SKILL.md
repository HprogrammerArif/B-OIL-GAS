---
name: expo-install
description: Knows how to install packages in an Expo project using the correct expo install command and when to rebuild the dev client after native modules are added.
---

# Expo Package Installation Skill

## Rule: Always use `npx expo install`

When adding any package to an Expo project, ALWAYS use:

```bash
npx expo install <package-name>
```

**NEVER use:**

- `npm install <package-name>`
- `yarn add <package-name>`
- `pnpm add <package-name>`

## Why?

`npx expo install` resolves the exact version compatible with the current Expo SDK before installing. Using `npm install` directly can install incompatible versions that cause subtle runtime crashes.

## After Installing Native Modules

If the package contains native code (anything with an `expo-` prefix or that uses `expo.plugins` in its README), you MUST rebuild the dev client:

```bash
npx expo prebuild --clean
npx expo run:android   # or run:ios
```

Pure JS packages (lodash, zod, date-fns, etc.) do NOT require a rebuild.

## Checking for Version Mismatches

```bash
npx expo install --check   # shows mismatched package versions
npx expo install --fix     # auto-fixes mismatched package versions
```

Run these any time you see version mismatch warnings in the Metro bundler output.
