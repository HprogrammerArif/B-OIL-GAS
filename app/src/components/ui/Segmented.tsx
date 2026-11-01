import { memo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";
import { Text } from "./Text";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Scrollable chip row instead of equal-width segments (for 4+ options). */
  scrollable?: boolean;
}

function SegmentedInner<T extends string>({ options, value, onChange, scrollable }: SegmentedProps<T>) {
  const theme = useTheme();
  const items = options.map((o) => {
    const active = o.value === value;
    return (
      <Pressable
        key={o.value}
        onPress={() => {
          if (!active) {
            haptic.tap();
            onChange(o.value);
          }
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={o.count !== undefined ? `${o.label}, ${o.count}` : o.label}
        style={[
          scrollable ? styles.chip : styles.segment,
          {
            backgroundColor: active ? (scrollable ? theme.surfaceInverse : theme.surface) : scrollable ? theme.surfaceSecondary : "transparent",
            borderColor: active && scrollable ? theme.surfaceInverse : theme.border,
          },
          active && !scrollable && styles.activeShadow,
        ]}
      >
        <Text
          variant="bodySmall"
          weight={active ? "bold" : "medium"}
          color={active ? (scrollable ? "textInverse" : "text") : "textSecondary"}
          numberOfLines={1}
        >
          {o.count !== undefined ? `${o.label} ${o.count}` : o.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow} accessibilityRole="tablist">
        {items}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceSecondary }]} accessibilityRole="tablist">
      {items}
    </View>
  );
}

export const Segmented = memo(SegmentedInner) as typeof SegmentedInner;

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: 3, borderRadius: Radius.md, gap: 3 },
  segment: {
    flex: 1,
    minHeight: MinTouchTarget - 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    borderWidth: 0,
    paddingHorizontal: Spacing.sm,
  },
  activeShadow: { shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  scrollRow: { gap: Spacing.sm, paddingVertical: 2 },
  chip: {
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
