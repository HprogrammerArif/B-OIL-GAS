# Running the BOGCL OneOps mobile app on a physical Android device

Audience: developers on Windows (PowerShell). Run all commands from the `app/` folder unless noted.
You do **not** need the Android Studio emulator, only the Android SDK command-line pieces (already installed on this machine).

The app uses `expo-dev-client` plus native modules (camera, location, secure-store, notifications, Sentry), so **Expo Go is not enough**. You need a *development build* (an APK that contains the native code) installed on the phone. Metro then serves the JavaScript to it.

---

## 0. One-time PC prerequisites (check once)

| Item | Expected | Check |
| :-- | :-- | :-- |
| Node | 22+ LTS | `node -v` |
| JDK | 17 (Temurin) | `java -version` |
| Android SDK | platform-tools + a build-tools/platform installed | `adb version` |
| `ANDROID_HOME` | `C:\Users\<you>\AppData\Local\Android\Sdk` | `echo $env:ANDROID_HOME` |
| `PATH` contains | `%ANDROID_HOME%\platform-tools` | `adb version` works |
| Dependencies | installed | `npm install` |

If `ANDROID_HOME` is missing, set it permanently (then reopen the terminal):

```powershell
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

Sanity check of the project: `npm run doctor`.

---

## 1. Prepare the phone (one time)

1. **Enable Developer options**: Settings → About phone → tap **Build number** 7 times.
   (On Xiaomi/MIUI tap **MIUI version**; on Samsung it is under *Software information*.)
2. Settings → System → Developer options → turn on **USB debugging**.
   - Xiaomi/Redmi/Poco: also enable **Install via USB** and **USB debugging (Security settings)**.
   - Oppo/Realme/Vivo: also disable "Permission monitoring"/"Verify apps over USB" if install is blocked.
3. Connect the phone to the PC with a **data-capable** USB cable (charge-only cables will not work).
4. On the phone pick USB mode **File transfer / MTP** (not "charging only").
5. Accept the **"Allow USB debugging?"** prompt (tick *Always allow from this computer*).
6. Verify on the PC:

```powershell
adb devices
```

Expected: a serial number followed by `device`.

| Status shown | Meaning / fix |
| :-- | :-- |
| `unauthorized` | Unlock phone and accept the RSA prompt; or Developer options → *Revoke USB debugging authorizations*, replug. |
| `offline` | `adb kill-server; adb start-server`, replug cable. |
| (empty list) | Bad cable/port, wrong USB mode, or missing OEM USB driver (Windows normally auto-installs; Samsung/Xiaomi may need their driver). |

### Wireless alternative (Android 11+)
Phone and PC on the same Wi-Fi. Developer options → **Wireless debugging** → *Pair device with pairing code*:

```powershell
adb pair <ip>:<pairing-port>     # enter the 6-digit code
adb connect <ip>:<debug-port>    # port shown on the main Wireless debugging screen
adb devices
```

---

## 2. Build and install the app on the phone (first time, ~5–15 min)

The Android project (`android/`) is already generated. With the phone connected and listed by `adb devices`:

```powershell
cd C:\project\B-OIL-GAS\app
npm install
npx expo run:android --device
```

- `--device` lets you choose the physical device when several targets exist.
- This runs Gradle, builds the debug APK, installs it on the phone, starts Metro and opens the app.
- The first build downloads Gradle and dependencies, so it is slow. Later builds are incremental.

Variant note: without `APP_VARIANT=production` the app id is `com.bogcl.oneops.dev` and the name is "OneOps (Dev)". To build the production-id variant:

```powershell
$env:APP_VARIANT="production"; npx expo run:android --device
```

### Backend mode
The EAS profiles set `EXPO_PUBLIC_API_MODE=mock` (the app runs on built-in mock data, no server). For local runs create `app/.env.local` (never commit it; `.env*` files are not to be overwritten if they already exist) with names from `.env.example`, for example:

```
EXPO_PUBLIC_API_MODE=mock
```

To use a real API on your PC (`server/`), the phone cannot reach `localhost`. Use your PC LAN IP (`ipconfig`) or the reverse tunnel below:

```powershell
adb reverse tcp:4000 tcp:4000     # adjust to the server port; then use http://localhost:4000 in the app
```

---

## 3. Daily workflow (after the first install)

You only rebuild when **native** things change (new native package, `app.config.ts` plugins/permissions, Expo SDK upgrade). Otherwise just start Metro:

```powershell
npx expo start --dev-client
```

Open the installed **OneOps (Dev)** app on the phone; it connects to Metro. JS/TS edits hot-reload.

Connection options:

| Situation | What to do |
| :-- | :-- |
| USB connected (most reliable) | `adb reverse tcp:8081 tcp:8081`, then in the app choose the `localhost:8081` server. |
| Same Wi-Fi | Scan the QR / pick the server listed in the dev launcher. Windows Firewall must allow Node on **Private** networks. |
| Wi-Fi blocked (corporate/guest, AP isolation) | `npx expo start --dev-client --tunnel` (slower; may prompt to install `@expo/ngrok`, which is a new dependency, so get approval first) or use USB + `adb reverse`. |

Useful flags: `-c` clears the Metro cache (`npm run clean`), `--lan`, `--localhost`.

---

## 4. Build a standalone APK to hand to testers (no PC needed to run)

### Option A: local release APK (no Expo account)

```powershell
cd android
.\gradlew.bat assembleRelease
```

Output: `android\app\build\outputs\apk\release\app-release.apk`.
Install: `adb install -r android\app\build\outputs\apk\release\app-release.apk`, or copy to the phone and open it (allow "Install unknown apps" for the file manager/browser used).

The release build is signed with the debug keystore by default, which is fine for internal testing but **not** for Play Store. Production signing keys must never be committed.

### Option B: EAS cloud build (needs Expo account)

```powershell
npm i -g eas-cli
eas login
eas build -p android --profile development   # dev-client APK (like step 2, built in cloud)
eas build -p android --profile preview       # standalone internal APK, mock mode
```

Scripts already defined: `npm run build:android` (preview) and `npm run build:android:prod` (AAB for Play Store). Download the APK from the link/QR EAS prints and install on the phone. Set `EXPO_OWNER` and `EXPO_PUBLIC_PROJECT_ID` in the environment (EAS secrets), not in the repo.

---

## 5. Permissions to grant on first launch

The app asks at runtime; choose **Allow** (or *While using the app*):
- **Location** (attendance punches, trip check-ins; no background location).
- **Camera** (QR scan, photos).
- **Notifications** (Android 13+).
- **Biometrics** need a screen lock/fingerprint set up on the phone.

Battery-saver on some brands (Xiaomi, Oppo, Huawei) can kill the app or delay notifications; set the app to *No restrictions* / *Autostart* if you see that.

---

## 6. Troubleshooting

| Symptom | Fix |
| :-- | :-- |
| `adb` not recognized | Add `platform-tools` to PATH (section 0), reopen terminal. |
| `No Android connected device found` | `adb devices` must show `device`; fix cable/authorization. |
| `SDK location not found` | Set `ANDROID_HOME`, or create `android\local.properties` with `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (file is git-ignored). |
| `INSTALL_FAILED_USER_RESTRICTED` | Xiaomi/Oppo: enable *Install via USB* / disable MIUI optimization prompts. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall the old app (`adb uninstall com.bogcl.oneops.dev`) then reinstall. |
| `JAVA_HOME is set to an invalid directory` | The folder name in `JAVA_HOME` does not match the installed JDK (e.g. `...20.1-hotspot` vs `...20.101-hotspot`). Check `Get-ChildItem "C:\Program Files\Eclipse Adoptium"`, then set it (PowerShell uses `$env:JAVA_HOME`, not `$JAVA_HOME`). Terminals opened before the change keep the old value; reopen Cursor. In Git Bash: `export JAVA_HOME='C:\Program Files\Eclipse Adoptium\<jdk-folder>'`. |
| `device offline` for `emulator-5554` | A dead emulator is registered. `adb kill-server; adb start-server`, and always build with `--device`. |
| `unauthorized` in `adb devices` | Accept "Allow USB debugging" on the phone or revoke authorizations in Developer options and replug. |
| `ConfigError: expected package.json path ... C:\project\package.json` | You ran Expo outside `app/`. `cd` into `app/` first; never accept the "install expo@latest" prompt. Git Bash needs forward slashes (`cd /c/project/B-OIL-GAS/app`). |
| Launcher says `Failed to connect to <PC-IP>:8081` | Phone cannot reach Metro over Wi-Fi/LTE. Keep `npx expo start --dev-client` running, run `adb reverse tcp:8081 tcp:8081`, then connect to `http://localhost:8081` in the launcher. |
| `window is not defined` / `setValueWithKeyAsync` spam in Metro | Harmless web/SSR pre-render noise (fixed by `ssrSafeStorage`); start only Android with `--android`. |
| "This screen isn't available in this version yet" | The link targets a module not built yet; see `docs/FEATURE_STATUS.md`. |
| Gradle: Java version error | Use JDK 17: `$env:JAVA_HOME="<jdk17 path>"`. Stop stale daemons: `cd android; .\gradlew.bat --stop`. |
| Gradle out of memory / slow | Close other apps; `android\gradle.properties` already tunes memory; keep the repo path short. |
| Windows path too long during build | Enable long paths (`reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f`, admin), reboot. |
| App opens but "Unable to load script" / red screen | Metro not running or unreachable: run `npx expo start --dev-client`, `adb reverse tcp:8081 tcp:8081`, reload (shake phone → Reload). |
| Stale JS after changes | `npm run clean` (clears Metro cache). |
| Native change not reflected | Rebuild: `npx expo run:android --device`. If config/plugins changed heavily: `npm run rebuild` (`expo prebuild --clean`; **regenerates `android/`**, so commit/stash first). |
| Package version warnings | `npm run fix` (`expo install --fix`). |

Open the in-app developer menu: shake the phone, or `adb shell input keyevent 82`.
View device logs: `adb logcat *:E` or `adb logcat | Select-String ReactNativeJS`.

---

## 7. Quick reference (copy/paste)

```powershell
# every session
adb devices
cd C:\project\B-OIL-GAS\app
npx expo start --dev-client
adb reverse tcp:8081 tcp:8081

# first install / after native changes
npx expo run:android --device

# standalone APK
cd android; .\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```
