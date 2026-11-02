import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Solid fill instead of the muted tint. */
  solid?: boolean;
  dot?: boolean;
}

/** Status pill used for workflow states, priorities and counts. */
export const Badge = memo(function Badge({ label, tone = "neutral", icon, solid = false, dot = false }: BadgeProps) {
  const theme = useTheme();
  const c = toneColors(theme, tone);
  const fg = solid ? theme.onAccent : c.fg;
  return (
    <View style={[styles.pill, { backgroundColor: solid ? c.fg : c.bg }]} accessibilityRole="text" accessibilityLabel={label}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      {icon ? <Icon name={icon} size={12} tint={fg} /> : null}
      <Text variant="caption" weight="bold" tint={fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
