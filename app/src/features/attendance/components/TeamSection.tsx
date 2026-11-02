import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, ListRow, QueryState, SearchBar, SectionHeader, Segmented, StatCard, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { routes } from "@/lib/routes";
import type { RosterFilter, RosterRow } from "@/types/domain/attendance";
import { useGetAttendanceKpisQuery, useGetRosterQuery } from "../api";
import { DAY_TONE } from "../presentation";

const FILTERS: RosterFilter[] = ["ALL", "IN", "LATE", "NOT_IN", "ON_LEAVE", "REVIEW"];

/** Manager view: KPI tiles, filterable roster and the count waiting on the caller (doc 05 §8.3). */
export function TeamSection() {
  const { t } = useTranslation(["attendance", "common"]);
  const router = useRouter();
  const fmt = useFormat();
  const [filter, setFilter] = useState<RosterFilter>("ALL");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 250);
  const kpis = useGetAttendanceKpisQuery();
  const roster = useGetRosterQuery({ status: filter, q: q || undefined });
  const k = kpis.data;
  const waiting = (k?.pendingRegularisations ?? 0) + (k?.pendingLeave ?? 0);

  return (
    <View style={styles.gap}>
      <SectionHeader title={t("team.title")} />
      {k ? (
        <View style={styles.grid}>
          <View style={styles.cell}><StatCard label={t("team.kpi.present")} value={fmt.number(k.present)} hint={`/ ${fmt.number(k.headcount)}`} icon="log-in-outline" tone="success" onPress={() => setFilter("IN")} /></View>
          <View style={styles.cell}><StatCard label={t("team.kpi.late")} value={fmt.number(k.late)} icon="time-outline" tone="warning" onPress={() => setFilter("LATE")} /></View>
          <View style={styles.cell}><StatCard label={t("team.kpi.notIn")} value={fmt.number(k.notIn)} icon="help-circle-outline" tone="danger" onPress={() => setFilter("NOT_IN")} /></View>
          <View style={styles.cell}><StatCard label={t("team.kpi.onLeave")} value={fmt.number(k.onLeave)} icon="airplane-outline" tone="info" onPress={() => setFilter("ON_LEAVE")} /></View>
        </View>
      ) : null}
      {waiting > 0 ? (
        <Card tone="warning" style={styles.waiting}>
          <Text variant="bodyStrong" style={styles.flex}>{t("team.awaiting", { count: waiting })}</Text>
          <Button title={t("team.openInbox")} size="sm" variant="secondary" fullWidth={false} onPress={() => router.push(routes.inbox)} />
        </Card>
      ) : null}
      <SearchBar value={search} onChangeText={setSearch} placeholder={t("team.searchPlaceholder")} />
      <Segmented scrollable value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: t(`team.filters.${f}`) }))} />
      <QueryState
        isLoading={roster.isLoading}
        error={roster.error}
        hasData={!!roster.data}
        isEmpty={roster.data?.length === 0}
        onRetry={() => void roster.refetch()}
        empty={{ icon: "people-outline", title: t("team.empty") }}
      >
        <Card padded={false}>
          {(roster.data ?? []).map((row) => <RosterItem key={row.employee.id} row={row} />)}
        </Card>
      </QueryState>
    </View>
  );
}

const RosterItem = memo(function RosterItem({ row }: { row: RosterRow }) {
  const { t } = useTranslation("attendance");
  const fmt = useFormat();
  const localized = useLocalized();
  const { day } = row;
  const name = localized(row.employee.name, row.employee.nameBn);
  const status = day.status ?? null;
  return (
    <ListRow
      leading={<Avatar initials={row.employee.initials} color={row.employee.avatarColor} size={36} />}
      title={row.isSelf ? `${name} · ${t("team.self")}` : name}
      subtitle={localized(row.employee.designation, row.employee.designationBn)}
      meta={day.firstInAt ? t("team.inAt", { time: fmt.time(day.firstInAt) }) : undefined}
      trailing={<Badge label={t(`status.${status ?? "NONE"}`)} tone={status ? DAY_TONE[status] : "neutral"} dot />}
    />
  );
});

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  cell: { width: "48%", flexGrow: 1 },
  waiting: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  flex: { flex: 1 },
});
