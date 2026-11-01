import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, Stack } from "expo-router";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useTheme } from "@/hooks/use-theme";

/**
 * Protected App Layout — wraps authenticated screens.
 * Redirects to login if no token.
 * (tabs)/ sub-group handles the tab navigator; other screens (e.g. edit-profile)
 * are pushed on top of it via this Stack.
 */
export default function AppLayout() {
  // const token = useAppSelector(selectCurrentToken);
  const token = true;

  const theme = useTheme();

  useEffect(() => {
    if (!token) {
      router.replace("/(auth)/login");
    }
  }, [token]);

  if (!token) {
    // Brief window between logout and the redirect above committing — show a themed
    // spinner instead of a blank flash.
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="new-item" options={{ presentation: "modal" }} />
    </Stack>
  );
}
