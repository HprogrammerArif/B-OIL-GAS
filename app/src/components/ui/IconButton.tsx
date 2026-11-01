import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MinTouchTarget, Radius } from "@/constants/theme";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: keyof ThemeColors;
  filled?: boolean;
  badge?: number;
  size?: number;
  disabled?: boolean;
  onLongPress?: () => void;
  delayLongPress?: number;
}

export const IconButton = memo(function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = "text",
  filled = false,
  badge,
  size = 22,
  disabled,
  onLongPress,
  delayLongPress,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: filled ? theme.surfaceSecondary : pressed ? theme.surfaceSecondary : "transparent" },
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={size} color={color} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.surface }]}>
          <Text variant="caption" weight="bold" color="onAccent" style={styles.badgeText}>
            {badge > 99 ? "99+" : String(badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  badge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
