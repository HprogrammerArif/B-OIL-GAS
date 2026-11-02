import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "executive" | "success";
export type ButtonSize = "md" | "sm";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Button = memo(function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = loading || disabled;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string; pressed: string }> = {
    primary: { bg: theme.accent, fg: theme.onAccent, border: theme.accent, pressed: theme.accentPressed },
    secondary: { bg: theme.surfaceSecondary, fg: theme.text, border: theme.surfaceSecondary, pressed: theme.border },
    outline: { bg: "transparent", fg: theme.accent, border: theme.accent, pressed: theme.accentMuted },
    ghost: { bg: "transparent", fg: theme.accent, border: "transparent", pressed: theme.accentMuted },
    destructive: { bg: theme.danger, fg: theme.onAccent, border: theme.danger, pressed: theme.danger },
    executive: { bg: theme.executiveSolid, fg: theme.textInverse, border: theme.executiveSolid, pressed: theme.executive },
    success: { bg: theme.success, fg: theme.onAccent, border: theme.success, pressed: theme.success },
  };
  const p = palette[variant];

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={size === "sm" ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        size === "sm" ? styles.sm : styles.md,
        {
          backgroundColor: pressed ? p.pressed : p.bg,
          borderColor: p.border,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled ? 0.5 : pressed && (variant === "destructive" || variant === "success") ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} tint={p.fg} /> : null}
          <Text variant={size === "sm" ? "bodySmall" : "bodyStrong"} weight="bold" tint={p.fg} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={size === "sm" ? 16 : 18} tint={p.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  md: { minHeight: 50, paddingHorizontal: Spacing.xl },
  sm: { minHeight: MinTouchTarget - 8, paddingHorizontal: Spacing.md, borderRadius: Radius.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
});
