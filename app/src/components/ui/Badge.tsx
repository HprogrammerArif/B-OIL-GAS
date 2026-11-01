import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";

export type BadgeVariant = "accent" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

/** Badge — small status pill, e.g. unread counts, plan tiers, item state. */
export function Badge({ label, variant = "accent" }: BadgeProps) {
  const theme = useTheme();

  const colors: Record<BadgeVariant, { bg: string; fg: string }> = {
    accent: { bg: theme.accentMuted, fg: theme.accent },
    success: { bg: theme.successMuted, fg: theme.success },
    warning: { bg: theme.warningMuted, fg: theme.warning },
    danger: { bg: theme.dangerMuted, fg: theme.danger },
    neutral: { bg: theme.surfaceSecondary, fg: theme.textSecondary },
  };

  const { bg, fg } = colors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "700" },
});
