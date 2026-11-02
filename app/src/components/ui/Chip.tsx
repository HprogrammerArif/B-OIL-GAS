import { memo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  testID?: string;
}

/** Toggleable pill for presets and multi-select filters (single-select rows use Segmented). */
export const Chip = memo(function Chip({ label, selected = false, onPress, icon, testID }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentMuted : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon || selected ? <Icon name={selected ? "checkmark" : (icon ?? "checkmark")} size={14} color={selected ? "accent" : "textSecondary"} /> : null}
      <Text variant="caption" weight="semibold" color={selected ? "accent" : "textSecondary"} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: "100%",
  },
});
