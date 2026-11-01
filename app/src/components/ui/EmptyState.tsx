import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
  compact?: boolean;
}

export const EmptyState = memo(function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();
  const c = toneColors(theme, tone);
  return (
    <View style={[styles.wrap, compact && styles.compact]} accessibilityRole="summary">
      <View style={[styles.icon, { backgroundColor: c.bg }]}>
        <Icon name={icon} size={compact ? 22 : 28} tint={c.fg} />
      </View>
      <Text variant={compact ? "bodyStrong" : "h3"} align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="bodySmall" color="textSecondary" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.huge, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  compact: { paddingVertical: Spacing.xl },
  icon: { width: 56, height: 56, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs },
  message: { maxWidth: 320 },
  action: { alignSelf: "center", marginTop: Spacing.sm },
});
