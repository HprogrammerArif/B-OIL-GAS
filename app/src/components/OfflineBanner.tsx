import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Icon } from "./ui/Icon";
import { Text } from "./ui/Text";

const BACK_ONLINE_MS = 2200;

/** Inline strip under the header: offline notice, then a brief "back online". */
export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"hidden" | "offline" | "online">("hidden");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!isConnected) {
      // Network status is an external signal; syncing it into local display state is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("offline");
    } else {
      setMode((m) => (m === "offline" ? "online" : m));
      timer.current = setTimeout(() => setMode("hidden"), BACK_ONLINE_MS);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isConnected]);

  if (mode === "hidden") return null;
  const offline = mode === "offline";
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)}>
      <View
        style={[styles.strip, { backgroundColor: offline ? theme.warningMuted : theme.successMuted }]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Icon name={offline ? "cloud-offline-outline" : "cloud-done-outline"} size={16} color={offline ? "warning" : "success"} />
        <Text variant="caption" color={offline ? "warning" : "success"} style={styles.text}>
          {offline ? t("states.offline") : t("states.backOnline")}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  text: { flex: 1 },
});
