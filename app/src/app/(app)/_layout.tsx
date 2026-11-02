import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { LockScreen } from "@/features/lock/LockScreen";
import { useSessionBootstrap } from "@/features/auth/useSessionBootstrap";
import { CriticalAckModal } from "@/features/notifications/components/CriticalAckModal";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useRealtime } from "@/hooks/useRealtime";
import { useTheme } from "@/hooks/use-theme";
import { useAppSelector } from "@/redux/hooks";

/** Signed-in shell: session bootstrap, realtime, auto-lock, the biometric gate and critical acknowledgements. */
export default function AppLayout() {
  const theme = useTheme();
  const isLocked = useAppSelector((s) => s.auth.locked);
  useSessionBootstrap();
  useAutoLock();
  useRealtime();
  return (
    <View style={styles.flex}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {isLocked ? <LockScreen /> : <CriticalAckModal />}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
