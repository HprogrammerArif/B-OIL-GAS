import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { LockScreen } from "@/features/lock/LockScreen";
import { useSessionBootstrap } from "@/features/auth/useSessionBootstrap";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useTheme } from "@/hooks/use-theme";
import { useAppSelector } from "@/redux/hooks";

/** Signed-in shell: session bootstrap, auto-lock and the biometric gate. */
export default function AppLayout() {
  const theme = useTheme();
  const isLocked = useAppSelector((s) => s.auth.locked);
  useSessionBootstrap();
  useAutoLock();
  return (
    <View style={styles.flex}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {isLocked ? <LockScreen /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
