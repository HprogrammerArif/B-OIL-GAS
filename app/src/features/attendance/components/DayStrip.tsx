import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { MinTouchTarget, Radius, Spacing, toneColors } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { parseDateKey } from "@/lib/calendar";
import type { AttendanceDay } from "@/types/domain/attendance";
import { DAY_TONE } from "../presentation";

interface Props {
  days: AttendanceDay[];
  statusLabel: (d: AttendanceDay) => string;
  onPress?: (d: AttendanceDay) => void;
}

/** Oldest → newest row of compact day tiles tinted by status. */
export const DayStrip = memo(function DayStrip({ days, statusLabel, onPress }: Props) {
  const theme = useTheme();
  const fmt = useFormat();
  return (
    <View style={styles.row} accessibilityRole="list">
      {[...days].reverse().map((d) => {
        const c = toneColors(theme, d.status ? DAY_TONE[d.status] : "neutral");
        const date = parseDateKey(d.date);
        return (
          <Pressable
            key={d.date}
            onPress={onPress ? () => onPress(d) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${fmt.date(date, "EEEE d MMMM")}, ${statusLabel(d)}`}
            style={[styles.tile, { backgroundColor: c.bg }]}
          >
            <Text variant="caption" color="textSecondary">{fmt.date(date, "EEEEE")}</Text>
            <Text variant="bodyStrong" tint={c.fg}>{fmt.number(date.getDate())}</Text>
            <View style={[styles.dot, { backgroundColor: c.fg }]} />
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.xs },
  tile: { flex: 1, minHeight: MinTouchTarget + 14, borderRadius: Radius.md, alignItems: "center", justifyContent: "center", gap: 2, paddingVertical: Spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
