import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: Tone;
  onPress?: () => void;
  trend?: { direction: "up" | "down" | "flat"; label: string; good?: boolean };
}

/** KPI tile; two per row on phones. */
export const StatCard = memo(function StatCard({ label, value, hint, icon, tone = "neutral", onPress, trend }: StatCardProps) {
  const theme = useTheme();
  const c = toneColors(theme, tone);
  const trendTone = trend ? toneColors(theme, trend.direction === "flat" ? "neutral" : trend.good ? "success" : "danger") : null;
  const body = (
    <>
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.icon, { backgroundColor: c.bg }]}>
            <Icon name={icon} size={16} tint={c.fg} />
          </View>
        ) : null}
        <Text variant="caption" color="textSecondary" numberOfLines={2} style={styles.label}>
          {label}
        </Text>
      </View>
      <Text variant="h1" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      {trend && trendTone ? (
        <View style={styles.trend}>
          <Icon
            name={trend.direction === "up" ? "trending-up" : trend.direction === "down" ? "trending-down" : "remove"}
            size={14}
            tint={trendTone.fg}
          />
          <Text variant="caption" tint={trendTone.fg} numberOfLines={1}>
            {trend.label}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color="textTertiary" numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </>
  );
  const style = [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];
  if (!onPress) return <View style={style} accessible accessibilityLabel={`${label}: ${value}`}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  top: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  icon: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  label: { flex: 1 },
  trend: { flexDirection: "row", alignItems: "center", gap: 4 },
  pressed: { opacity: 0.85 },
});
