import { memo, useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

export const Skeleton = memo(function Skeleton({ width = "100%", height = 14, radius = Radius.sm }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceSecondary }, animated]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
});

/** Placeholder list matching ListRow / Card density. */
export const SkeletonList = memo(function SkeletonList({ rows = 5, card = false }: { rows?: number; card?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.list} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[styles.row, card && { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}
        >
          <Skeleton width={40} height={40} radius={Radius.sm} />
          <View style={styles.lines}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  lines: { flex: 1, gap: Spacing.sm },
});
