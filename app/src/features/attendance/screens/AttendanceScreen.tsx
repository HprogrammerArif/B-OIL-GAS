import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Card, Chip, Divider, ListRow, QueryState, Screen, SectionHeader, Skeleton, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { usePermissions } from "@/hooks/usePermission";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { addDays, dateKey } from "@/lib/calendar";
import { routes } from "@/lib/routes";
import type { AttendanceDay, DayStatus, TodayAttendance } from "@/types/domain/attendance";
import { useGetAttendanceRangeQuery, useGetGeofencesQuery, useGetTodayAttendanceQuery } from "../api";
import { DayStrip } from "../components/DayStrip";
import { PunchPanel } from "../components/PunchPanel";
import { TeamSection } from "../components/TeamSection";
import { DAY_TONE, workedLabel } from "../presentation";
import { usePunchFlow } from "../usePunchFlow";

const NON_WORKING: DayStatus[] = ["ON_LEAVE", "HOLIDAY", "WEEKEND"];

/** Attendance tab: today's card, the geofenced punch, the last week, and the team roster for managers. */
export function AttendanceScreen() {
  const { t } = useTranslation(["attendance", "common"]);
  const router = useRouter();
  const perms = usePermissions();
  const online = useIsOnline();
  const today = useGetTodayAttendanceQuery();
  const week = useGetAttendanceRangeQuery(useMemo(() => ({ from: addDays(dateKey(), -6), to: dateKey() }), []));
  const pull = usePullToRefresh(today.refetch, week.refetch);
  const [demoSpot, setDemoSpot] = useState("REAL");
  const flow = usePunchFlow(demoSpot);
  const data = today.data;
  const canPunch = perms.can("attendance:punch");

  return (
    <Screen title={t("title")} back={false} onRefresh={pull.onRefresh} refreshing={pull.refreshing}>
      <QueryState isLoading={today.isLoading} error={today.error} hasData={!!data} onRetry={() => void today.refetch()} skeleton={<Skeleton height={220} />}>
        {data ? (
          <View style={styles.gap}>
            <TodayCard data={data} />
            {canPunch ? (
              <PunchPanel
                phase={flow.phase}
                nextType={NON_WORKING.includes(data.day.status ?? "PRESENT") ? null : data.nextPunchType}
                online={online}
                onStart={(type) => void flow.start(type)}
                onConfirmOutside={flow.confirmOutside}
                onReset={flow.reset}
                onRegularise={() => router.push(routes.regularise)}
              />
            ) : null}
            {canPunch && __DEV__ ? <DemoSpotPicker value={demoSpot} onChange={setDemoSpot} /> : null}
          </View>
        ) : null}
      </QueryState>

      {week.data ? (
        <View style={styles.gap}>
          <SectionHeader title={t("week.title")} actionLabel={t("links.history")} onAction={() => router.push(routes.attendanceHistory)} />
          <DayStrip days={week.data.days.slice(0, 7)} statusLabel={(d: AttendanceDay) => t(`status.${d.status ?? "NONE"}`)} onPress={() => router.push(routes.attendanceHistory)} />
        </View>
      ) : null}

      <Card padded={false}>
        <ListRow icon="swap-horizontal-outline" title={t("links.regularise")} chevron onPress={() => router.push(routes.regularise)} />
        <Divider />
        <ListRow icon="airplane-outline" iconTone="info" title={t("links.leave")} chevron onPress={() => router.push(routes.leave)} testID="open-leave" />
      </Card>

      {perms.can("attendance:read", "TEAM") ? <TeamSection /> : null}
    </Screen>
  );
}

function TodayCard({ data }: { data: TodayAttendance }) {
  const { t } = useTranslation(["attendance", "common"]);
  const fmt = useFormat();
  const localized = useLocalized();
  const { day, shift } = data;
  const tone = day.status ? DAY_TONE[day.status] : "neutral";
  return (
    <Card accent={tone} style={styles.gap}>
      <View style={styles.between}>
        <View style={styles.flex}>
          <Text variant="overline" color="textSecondary" uppercase>{fmt.date(data.date, "EEEE, d MMM")}</Text>
          <Text variant="caption" color="textSecondary">
            {t("shift", { name: localized(shift.name, shift.nameBn), start: shift.startTime, end: shift.endTime })}
          </Text>
        </View>
        <Badge label={t(`status.${day.status ?? "NONE"}`)} tone={tone} dot />
      </View>
      {day.firstInAt ? (
        <View style={styles.stats}>
          <Stat label={t("today.in")} value={fmt.time(day.firstInAt)} />
          <Stat label={t("today.out")} value={day.lastOutAt ? fmt.time(day.lastOutAt) : "—"} />
          <Stat label={t("today.worked")} value={day.workedMinutes > 0 ? workedLabel(day.workedMinutes, t as never, fmt.number) : "—"} />
        </View>
      ) : (
        <Text variant="body" color="textSecondary">{day.holiday ? localized(day.holiday.name, day.holiday.nameBn) : t("today.none")}</Text>
      )}
      {day.lateMinutes > 0 ? <Text variant="caption" color="warning">{t("today.lateBy", { time: workedLabel(day.lateMinutes, t as never, fmt.number) })}</Text> : null}
      {day.flags.pendingReview ? <Text variant="caption" color="info">{t("today.review")}</Text> : null}
      {data.overtimeMinutesMtd > 0 ? (
        <Text variant="caption" color="textSecondary">{`${t("today.overtime")}: ${workedLabel(data.overtimeMinutesMtd, t as never, fmt.number)}`}</Text>
      ) : null}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" color="textTertiary">{label}</Text>
      <Text variant="h3">{value}</Text>
    </View>
  );
}

/** Dev/presenter aid: stand at a site from a desk. Hidden in release builds. */
function DemoSpotPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation("attendance");
  const localized = useLocalized();
  const fences = useGetGeofencesQuery();
  return (
    <View style={styles.demo}>
      <Text variant="caption" color="textTertiary">{t("demo.title")}</Text>
      <View style={styles.chips}>
        <Chip label={t("demo.real")} selected={value === "REAL"} onPress={() => onChange("REAL")} />
        {(fences.data ?? []).map((f) => (
          <Chip key={f.id} label={localized(f.name, f.nameBn)} selected={value === f.id} onPress={() => onChange(f.id)} testID={`demo-${f.id}`} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  between: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.md },
  flex: { flex: 1 },
  stats: { flexDirection: "row", gap: Spacing.lg },
  stat: { gap: 2 },
  demo: { gap: Spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
});
