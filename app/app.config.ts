import type { ExpoConfig } from "expo/config";

const IS_PROD = process.env.APP_VARIANT === "production";

const config: ExpoConfig = {
  name: IS_PROD ? "BOGCL OneOps" : "OneOps (Dev)",
  slug: "bogcl-oneops",
  owner: process.env.EXPO_OWNER,
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "bogcl-oneops",
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "appVersion" },
  ios: {
    bundleIdentifier: IS_PROD ? "com.bogcl.oneops" : "com.bogcl.oneops.dev",
    supportsTablet: true,
    infoPlist: {
      NSFaceIDUsageDescription: "Unlock OneOps with Face ID.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: IS_PROD ? "com.bogcl.oneops" : "com.bogcl.oneops.dev",
    adaptiveIcon: {
      backgroundColor: "#A51C30",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Background location arrives with driver trip tracking (doc 05 §8); never request it before then.
    blockedPermissions: ["android.permission.ACCESS_BACKGROUND_LOCATION", "android.permission.SYSTEM_ALERT_WINDOW"],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B132B",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
        dark: { backgroundColor: "#0B132B" },
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      { icon: "./assets/images/icon.png", color: "#A51C30", defaultChannel: "default" },
    ],
    "@sentry/react-native",
    "expo-image",
    "expo-web-browser",
    "expo-sharing",
    "expo-localization",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "OneOps uses your location to verify attendance punches and trip check-ins at company sites.",
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "OneOps uses the camera to scan parcel, asset and visitor QR codes and to attach photos.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      { photosPermission: "OneOps lets you attach photos to incidents, claims and defect reports." },
    ],
    ["expo-local-authentication", { faceIDPermission: "Unlock OneOps with Face ID." }],
    ["expo-audio", { microphonePermission: "OneOps records voice briefings and voice notes." }],
    ["expo-build-properties", { android: { minSdkVersion: 29 } }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    eas: process.env.EXPO_PUBLIC_PROJECT_ID ? { projectId: process.env.EXPO_PUBLIC_PROJECT_ID } : undefined,
  },
};

export default config;
