# Flutter engine & plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Drift SQLite3 native bindings
-keep class org.sqlite.** { *; }
-keep class com.github.simolus3.sqlite3_flutter_libs.** { *; }

# Flutter Secure Storage & Tink Keystore
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-keep class com.google.crypto.tink.** { *; }

# Local Auth & BiometricPrompt
-keep class io.flutter.plugins.localauth.** { *; }
-keep class androidx.biometric.** { *; }

# Geolocator & GPS
-keep class com.baseflow.geolocator.** { *; }

# Mobile Scanner & ML Kit
-keep class dev.steenbakker.mobile_scanner.** { *; }
-keep class com.google.mlkit.vision.barcode.** { *; }

# Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# Desugar java.time on older Android
-dontwarn java.time.**

