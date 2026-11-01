import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const BANNER_HEIGHT = 44;
const BACK_ONLINE_MS = 2200;

/**
 * OfflineBanner — slides in from top when offline, shows "Back online" briefly before hiding.
 * Place this inside InnerLayout in _layout.tsx so it overlays all screens.
 */
export default function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [showingOnline, setShowingOnline] = useState(false);
  // Lazy useState (not useRef().current) so the stable Animated.Value isn't read during render.
  const [translateY] = useState(() => new Animated.Value(-BANNER_HEIGHT - 40));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const slideIn = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const slideOut = (onDone?: () => void) => {
    Animated.timing(translateY, {
      toValue: -BANNER_HEIGHT - 40,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onDone?.());
  };

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (!isConnected) {
      // Driven by a real external signal (network status), not derivable during render —
      // also kicks off the slide-in animation, so it belongs in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowingOnline(false);
      setVisible(true);
      slideIn();
    } else if (visible) {
      setShowingOnline(true);
      hideTimer.current = setTimeout(() => {
        slideOut(() => setVisible(false));
      }, BACK_ONLINE_MS);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: insets.top > 0 ? insets.top : 10,
          height: BANNER_HEIGHT + (insets.top > 0 ? insets.top : 10),
          backgroundColor: showingOnline ? "#16a34a" : "#dc2626",
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>{showingOnline ? "✓" : "⚠"}</Text>
        <Text style={styles.text}>{showingOnline ? "Back online" : "No internet connection"}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  icon: { color: "#fff", fontSize: 14, fontWeight: "700" },
  text: { color: "#fff", fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
});
