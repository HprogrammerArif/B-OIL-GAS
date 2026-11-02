import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  padded?: boolean;
  /** Coloured left rail for status emphasis. */
  accent?: Tone;
  /** Tinted background, e.g. alert cards. */
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Card = memo(function Card({
  children,
  onPress,
  onLongPress,
  padded = true,
  accent,
  tone,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: CardProps) {
  const theme = useTheme();
  const tint = tone ? toneColors(theme, tone) : null;
  const rail = accent ? toneColors(theme, accent).fg : null;
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: tint ? tint.bg : theme.surface,
      borderColor: tint ? tint.bg : theme.border,
      shadowColor: theme.shadow,
    },
    padded && styles.padded,
    rail ? { borderLeftWidth: 4, borderLeftColor: rail } : null,
    style,
  ];

  if (!onPress && !onLongPress) {
    return (
      <View style={base} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  padded: { padding: Spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
