import { deviceLanguage, setLanguage } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from "@expo-google-fonts/noto-sans-bengali";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { PresenterProvider } from "@/features/presenter/PresenterProvider";
import { signOut } from "@/features/auth/session";
import { useColorSchemeName, useTheme } from "@/hooks/use-theme";
import { identifySentryUser, initSentry } from "@/lib/sentry";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { locked } from "@/redux/slices/auth.slice";

void SplashScreen.preventAutoHideAsync();
initSentry();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ReduxProvider>
          <ErrorBoundary>
            <AppShell ready={fontsLoaded || !!fontError} />
          </ErrorBoundary>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Runs once Redux has rehydrated (inside PersistGate). */
function AppShell({ ready }: { ready: boolean }) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const scheme = useColorSchemeName();
  const language = useAppSelector((s) => s.ui.language);
  const auth = useAppSelector((s) => s.auth);
  const booted = useRef(false);
  const signedIn = auth.status === "signedIn";

  useEffect(() => {
    setLanguage(language ?? deviceLanguage());
  }, [language]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (auth.status !== "signedIn") return;
    if (!auth.keepSignedIn) void signOut(dispatch);
    else if (auth.biometricEnabled) dispatch(locked());
  }, [auth.status, auth.keepSignedIn, auth.biometricEnabled, dispatch]);

  useEffect(() => {
    identifySentryUser(auth.user?.id ?? null);
  }, [auth.user?.id]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <PresenterProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background }, animation: "slide_from_right" }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
      <Toast topOffset={56} />
    </PresenterProvider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
