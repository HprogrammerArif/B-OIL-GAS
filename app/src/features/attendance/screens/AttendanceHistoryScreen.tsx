import { memo, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, Divider, IconButton, ListRow, QueryState, Screen, Sheet, StatCard, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { dateKey, monthKey, monthRange, parseDateKey, shiftMonth } from "@/lib/calendar";
import { routes } from "@/lib/routes";
import type { AttendanceDay } from "@/types/domain/attendance";
import { useGetAttendanceRangeQuery } from "../api";
import { DAY_TONE, workedLabel } from "../presentation";

/** Month-by-month personal history with a summary strip and per-day punch detail. */
export function AttendanceHistoryScreen() {
  const { t } = useTranslation(["attendance", "common"]);
  const fmt = useFormat();
  const today = dateKey();
  const [month, setMonth] = useState(monthKey(today));
  const [picked, setPicked] = useState<AttendanceDay | null>(null);
  const range = useMemo(() => {
    const r = monthRange(month);
    return { from: r.from, to: r.to > today ? today : r.to };
  }, [month, today]);
  const query = useGetAttendanceRangeQuery(range);
  const pull = usePullToRefresh(query.refetch);
  const s = query.data?.summary;
  const minutes = (m: number) => (m > 0 ? workedLabel(m, t as never, fmt.number) : "—");

  return (
    <Screen
      title={t("history.title")}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      headerRight={
        <View style={styles.nav}>
          <IconButton icon="chevron-back" accessibilityLabel={t("common:actions.previous")} onPress={() => setMonth(shiftMonth(month, -1))} />
          <IconButton icon="chevron-forward" accessibilityLabel={t("common:actions.next")} disabled={month >= monthKey(today)} onPress={() => setMonth(shiftMonth(month, 1))} />
        </View>
      }
    >
      <Text variant="h2">{fmt.date(parseDateKey(`${month}-01`), "MMMM yyyy")}</Text>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        hasData={!!query.data}
        isEmpty={query.data?.days.length === 0}
        onRetry={() => void query.refetch()}
        empty={{ icon: "calendar-outline", title: t("history.empty") }}
      >
        {s ? (
          <View style={styles.gap}>
            <View style={styles.grid}>
              <View style={styles.cell}><StatCard label={t("history.summary.present")} value={fmt.number(s.present)} tone="success" icon="checkmark-circle-outline" /></View>
              <View style={styles.cell}><StatCard label={t("history.summary.late")} value={fmt.number(s.late)} tone="warning" icon="time-outline" /></View>
              <View style={styles.cell}><StatCard label={t("history.summary.absent")} value={fmt.number(s.absent)} tone="danger" icon="close-circle-outline" /></View>
              <View style={styles.cell}><StatCard label={t("history.summary.leave")} value={fmt.number(s.leave)} tone="info" icon="airplane-outline" /></View>
              <View style={styles.cell}><StatCard label={t("history.summary.worked")} value={minutes(s.workedMinutes)} icon="hourglass-outline" /></View>
              <View style={styles.cell}><StatCard label={t("history.summary.overtime")} value={minutes(s.overtimeMinutes)} icon="flash-outline" tone="purple" /></View>
            </View>
            <Card padded={false}>
              {(query.data?.days ?? []).map((d, i) => (
                <View key={d.date}>
                  {i > 0 ? <Divider /> : null}
                  <DayRow day={d} onPress={() => setPicked(d)} />
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </QueryState>
      <DaySheet day={picked} onClose={() => setPicked(null)} />
    </Screen>
  );
}

const DayRow = memo(function DayRow({ day, onPress }: { day: AttendanceDay; onPress: () => void }) {
  const { t } = useTranslation("attendance");
  const fmt = useFormat();
  const status = day.status;
  return (
    <ListRow
      title={fmt.date(parseDateKey(day.date), "EEE, d MMM")}
      subtitle={day.firstInAt ? `${fmt.time(day.firstInAt)} – ${day.lastOutAt ? fmt.time(day.lastOutAt) : "—"}` : undefined}
      trailing={<Badge label={t(`status.${status ?? "NONE"}`)} tone={status ? DAY_TONE[status] : "neutral"} dot />}
      chevron
      onPress={onPress}
    />
  );
});

function DaySheet({ day, onClose }: { day: AttendanceDay | null; onClose: () => void }) {
  const { t } = useTranslation(["attendance", "common"]);
  const fmt = useFormat();
  const router = useRouter();
  if (!day) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const fixable = !!day.status && ["ABSENT", "LATE", "HALF_DAY", "EARLY_LEAVE"].includes(day.status) || day.flags.missingOut;
  const type = day.flags.missingOut ? "MISSED_PUNCH" : day.status === "LATE" ? "LATE_JUSTIFICATION" : "MISSED_PUNCH";
  return (
    <Sheet visible onClose={onClose} title={fmt.date(parseDateKey(day.date), "EEEE, d MMMM")} subtitle={t(`status.${day.status ?? "NONE"}`)}>
      <View style={styles.gap}>
        {day.punches.length === 0 ? <Text variant="body" color="textSecondary">{t("today.none")}</Text> : null}
        {day.punches.map((p) => (
          <ListRow
            key={p.id}
            icon={p.type === "IN" ? "log-in-outline" : "log-out-outline"}
            iconTone={p.result === "ACCEPTED" ? "success" : "danger"}
            title={`${t(p.type === "IN" ? "today.in" : "today.out")} · ${fmt.time(p.punchedAt)}`}
            subtitle={t(`punch.result.${p.result}`)}
          />
        ))}
        {fixable ? (
          <Button
            title={t("history.fix")}
            variant="secondary"
            icon="create-outline"
            onPress={() => {
              onClose();
              router.push(routes.regulariseFor(day.date, type));
            }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  cell: { width: "48%", flexGrow: 1 },
  nav: { flexDirection: "row" },
});
