import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

/**
 * Button — the single canonical button for the app. Replaces the old
 * GradientButton / CustomButton split so every screen shares one visual language.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = isLoading || disabled;

  const backgroundColor =
    variant === "primary"
      ? theme.accent
      : variant === "secondary"
        ? theme.surfaceSecondary
        : variant === "destructive"
          ? theme.danger
          : "transparent";

  const textColor =
    variant === "primary" || variant === "destructive"
      ? theme.onAccent
      : variant === "secondary"
        ? theme.text
        : theme.accent;

  const borderColor = variant === "outline" ? theme.accent : "transparent";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        styles.btn,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          width: fullWidth ? "100%" : undefined,
          opacity: isDisabled ? 0.55 : 1,
        },
      ]}
    >
      {leftIcon && !isLoading && <View style={styles.iconWrap}>{leftIcon}</View>}
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: { marginRight: Spacing.sm },
  text: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
