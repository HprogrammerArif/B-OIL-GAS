# Run the BOGCL app on your Android phone

You run these commands yourself; the agent never launches the app.

## One-time phone setup
1. Settings > About phone > tap **Build number** 7 times (Developer options on).
2. Settings > Developer options > turn on **USB debugging**.
3. Connect by USB, unlock the phone, accept **Allow USB debugging** (tick "Always allow").

## One-time PC setup (already done by the agent unless noted)
- Flutter SDK: `C:\src\flutter\bin` is on your PATH (open a NEW terminal after the first install).
- Android cmdline-tools and licences, run once if `flutter doctor` complains:
  ```
  flutter doctor --android-licenses
  ```
  Answer `y` to each.
- `JAVA_HOME` must point to your JDK 17 folder (same as before).

## Every time
```
cd C:\project\B-OIL-GAS\ftr-a
flutter pub get
flutter devices          # copy your phone's id
flutter run -d <device-id>
```
While running: `r` hot reload, `R` hot restart, `q` quit.

## After editing annotated code or translations
```
dart run build_runner build --delete-conflicting-outputs
flutter gen-l10n
```

## Troubleshooting
| Symptom | Fix |
| :-- | :-- |
| `flutter` not recognised | Open a new terminal; or `$env:Path += ";C:\src\flutter\bin"` |
| Phone not listed | Check USB cable/mode (File transfer), re-accept the debugging prompt, `adb kill-server` |
| `unauthorized` | Revoke USB debugging authorisations in Developer options, replug, accept again |
| Licence errors | `flutter doctor --android-licenses` |
| First build slow | Normal (Gradle downloads); later builds are fast |
