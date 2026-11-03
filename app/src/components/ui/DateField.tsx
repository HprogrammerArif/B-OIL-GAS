import { memo, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { addDays, dateKey, monthKey, parseDateKey, shiftMonth } from "@/lib/calendar";
import { haptic } from "@/lib/haptics";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD` or empty. */
  value: string;
  onChange: (key: string) => void;
  min?: string;
  max?: string;
  error?: string;
  /** Days that are valid but non-working (weekend, holiday) are dimmed. */
  isOffDay?: (key: string) => boolean;
  testID?: string;
}

/** Calendar-sheet date picker (no native picker dependency); values are local date keys. */
export const DateField = memo(function DateField({ label, value, onChange, min, max, error, isOffDay, testID }: DateFieldProps) {
  const theme = useTheme();
  const fmt = useFormat();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthKey(value || dateKey()));
  const borderColor = error ? theme.danger : theme.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="caption" color="textSecondary" style={styles.label}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => {
          setMonth(monthKey(value || dateKey()));
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? fmt.date(parseDateKey(value)) : t("states.notSet")}`}
        style={[styles.field, { backgroundColor: theme.surface, borderColor }]}
      >
        <Icon name="calendar-outline" size={18} color="textSecondary" />
        <Text variant="body" color={value ? "text" : "textTertiary"} style={styles.flex}>
          {value ? fmt.date(parseDateKey(value), "EEE, d MMM yyyy") : t("actions.select")}
        </Text>
        <Icon name="chevron-down" size={16} color="textTertiary" />
      </Pressable>
      {error ? <Text variant="caption" color="danger" style={styles.error}>{error}</Text> : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <MonthGrid
          month={month}
          onMonth={setMonth}
          value={value}
          min={min}
          max={max}
          isOffDay={isOffDay}
          onPick={(k) => {
            haptic.tap();
            onChange(k);
            setOpen(false);
          }}
        />
      </Sheet>
    </View>
  );
});

interface GridProps {
  month: string;
  onMonth: (m: string) => void;
  value: string;
  min?: string;
  max?: string;
  isOffDay?: (key: string) => boolean;
  onPick: (key: string) => void;
}

function MonthGrid({ month, onMonth, value, min, max, isOffDay, onPick }: GridProps) {
  const theme = useTheme();
  const fmt = useFormat();
  const { t } = useTranslation();
  const today = dateKey();
  const cells = useMemo(() => {
    const first = `${month}-01`;
    const lead = parseDateKey(first).getDay();
    const out: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = first; d.startsWith(month); d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);
  const headers = useMemo(() => Array.from({ length: 7 }, (_, i) => fmt.date(parseDateKey(addDays("2026-11-01", i)), "EEEEE")), [fmt]);
  const canPrev = !min || shiftMonth(month, 0) > monthKey(min);
  const canNext = !max || shiftMonth(month, 0) < monthKey(max);

  return (
    <View style={styles.grid}>
      <View style={styles.monthRow}>
        <IconButton icon="chevron-back" accessibilityLabel={t("actions.previous")} onPress={() => onMonth(shiftMonth(month, -1))} disabled={!canPrev} />
        <Text variant="h3" style={styles.flex} align="center">{fmt.date(parseDateKey(`${month}-01`), "MMMM yyyy")}</Text>
        <IconButton icon="chevron-forward" accessibilityLabel={t("actions.next")} onPress={() => onMonth(shiftMonth(month, 1))} disabled={!canNext} />
      </View>
      <View style={styles.week}>
        {headers.map((h, i) => (
          <Text key={i} variant="caption" color="textTertiary" align="center" style={styles.cell}>{h}</Text>
        ))}
      </View>
      <View style={styles.days}>
        {cells.map((k, i) => {
          if (!k) return <View key={`b${i}`} style={styles.cell} />;
          const disabled = (!!min && k < min) || (!!max && k > max);
          const selected = k === value;
          const off = isOffDay?.(k) ?? false;
          return (
            <Pressable
              key={k}
              disabled={disabled}
              onPress={() => onPick(k)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={fmt.date(parseDateKey(k), "EEEE, d MMMM")}
              style={styles.cell}
            >
              <View style={[styles.day, selected && { backgroundColor: theme.accent }, !selected && k === today && { borderColor: theme.accent, borderWidth: 1 }]}>
                <Text variant="bodySmall" weight={selected ? "bold" : "regular"} color={selected ? "onAccent" : disabled ? "textTertiary" : off ? "textSecondary" : "text"} style={off && !selected ? styles.dim : undefined}>
                  {fmt.number(Number(k.slice(8)))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: { fontWeight: "600" },
  field: { minHeight: MinTouchTarget + 4, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  flex: { flex: 1 },
  error: { marginTop: Spacing.xxs },
  grid: { gap: Spacing.sm, paddingBottom: Spacing.md },
  monthRow: { flexDirection: "row", alignItems: "center" },
  week: { flexDirection: "row" },
  days: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", height: MinTouchTarget },
  day: { width: 38, height: 38, borderRadius: Radius.full, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.55 },
});
