import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MinTouchTarget, Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: IconName;
  iconTone?: Tone;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  numberOfLines?: number;
  accessibilityHint?: string;
  testID?: string;
}

export const ListRow = memo(function ListRow({
  title,
  subtitle,
  meta,
  icon,
  iconTone = "neutral",
  leading,
  trailing,
  onPress,
  chevron = !!onPress,
  destructive = false,
  numberOfLines = 1,
  accessibilityHint,
  testID,
}: ListRowProps) {
  const theme = useTheme();
  const tc = toneColors(theme, destructive ? "danger" : iconTone);
  const content = (
    <>
      {leading ??
        (icon ? (
          <View style={[styles.iconWrap, { backgroundColor: tc.bg }]}>
            <Icon name={icon} size={18} tint={tc.fg} />
          </View>
        ) : null)}
      <View style={styles.body}>
        <Text variant="bodyStrong" color={destructive ? "danger" : "text"} numberOfLines={numberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" color="textTertiary" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron-forward" size={18} color="textTertiary" /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, meta].filter(Boolean).join(", ")}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceSecondary }]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: MinTouchTarget + 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
});
