import { memo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, ListRow, ProgressBar, QueryState, Screen, SectionHeader, Segmented, Text } from "@/components/ui";
import { Spacing, toneColors } from "@/constants/theme";
import { REQUEST_TONE } from "@/features/attendance/presentation";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTheme } from "@/hooks/use-theme";
import { routes } from "@/lib/routes";
import type { LeaveBalance, LeaveRequestItem } from "@/types/domain/leave";
import { useGetLeaveBalancesQuery, useGetLeaveRequestsQuery } from "../api";
import { LEAVE_TONE } from "../presentation";

type Scope = "mine" | "team";

/** Leave home: balances, the caller's requests, and (for managers) the team's. */
export function LeaveScreen() {
  const { t } = useTranslation(["leave", "common"]);
  const router = useRouter();
  const perms = usePermissions();
  const canTeam = perms.can("leave:read", "TEAM");
  const [scope, setScope] = useState<Scope>("mine");
  const year = new Date().getFullYear();
  const balances = useGetLeaveBalancesQuery({ year });
  const requests = useGetLeaveRequestsQuery({ scope });
  const pull = usePullToRefresh(balances.refetch, requests.refetch);
  const items = requests.data?.items ?? [];

  return (
    <Screen
      title={t("title")}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={perms.can("leave:request") ? <Button title={t("apply")} icon="add" onPress={() => router.push(routes.newLeave)} testID="leave-apply" /> : undefined}
    >
      {scope === "mine" && balances.data ? (
        <View style={styles.gap}>
          <SectionHeader title={t("balances", { year })} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.balances}>
            {balances.data.filter((b) => b.leaveType.checksBalance).map((b) => <BalanceCard key={b.leaveType.id} balance={b} />)}
          </ScrollView>
        </View>
      ) : null}
      {canTeam ? (
        <Segmented value={scope} onChange={setScope} options={[{ value: "mine", label: t("tabs.mine") }, { value: "team", label: t("tabs.team") }]} />
      ) : null}
      <QueryState
        isLoading={requests.isLoading}
        error={requests.error}
        hasData={!!requests.data}
        isEmpty={items.length === 0}
        onRetry={() => void requests.refetch()}
        empty={{ icon: "airplane-outline", title: t(`empty.${scope}`) }}
      >
        <Card padded={false}>{items.map((l) => <RequestRow key={l.id} item={l} showPerson={scope === "team"} onPress={() => router.push(routes.leaveRequest(l.id))} />)}</Card>
      </QueryState>
    </Screen>
  );
}

const BalanceCard = memo(function BalanceCard({ balance }: { balance: LeaveBalance }) {
  const { t } = useTranslation("leave");
  const theme = useTheme();
  const fmt = useFormat();
  const localized = useLocalized();
  const tone = LEAVE_TONE[balance.leaveType.code];
  const c = toneColors(theme, tone);
  return (
    <Card style={styles.balance} accessibilityLabel={`${localized(balance.leaveType.name, balance.leaveType.nameBn)}, ${t("left", { n: fmt.number(balance.available, 1) })}`}>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>{localized(balance.leaveType.name, balance.leaveType.nameBn)}</Text>
      <Text variant="display" tint={c.fg}>{fmt.number(balance.available, balance.available % 1 ? 1 : 0)}</Text>
      <ProgressBar value={balance.entitled ? balance.used / balance.entitled : 0} tone={tone} />
      <Text variant="caption" color="textTertiary">{t("usedOf", { used: fmt.number(balance.used, balance.used % 1 ? 1 : 0), total: fmt.number(balance.entitled) })}</Text>
      {balance.pending > 0 ? <Text variant="caption" color="warning">{t("pending", { n: fmt.number(balance.pending, balance.pending % 1 ? 1 : 0) })}</Text> : null}
    </Card>
  );
});

export const RequestRow = memo(function RequestRow({ item, showPerson, onPress }: { item: LeaveRequestItem; showPerson?: boolean; onPress: () => void }) {
  const { t } = useTranslation("leave");
  const fmt = useFormat();
  const localized = useLocalized();
  const range = item.startDate === item.endDate ? fmt.date(item.startDate, "d MMM") : `${fmt.date(item.startDate, "d MMM")} – ${fmt.date(item.endDate, "d MMM")}`;
  const name = localized(item.leaveType.name, item.leaveType.nameBn);
  return (
    <ListRow
      leading={showPerson ? <Avatar initials={item.employee.initials} color={item.employee.avatarColor} size={36} /> : undefined}
      icon={showPerson ? undefined : "airplane-outline"}
      iconTone={LEAVE_TONE[item.leaveType.code]}
      title={showPerson ? localized(item.employee.name, item.employee.nameBn) : `${name} · ${t("days", { count: item.days })}`}
      subtitle={showPerson ? `${name} · ${range}` : range}
      meta={item.refNo}
      trailing={<Badge label={t(`status.${item.status}`)} tone={REQUEST_TONE[item.status]} dot />}
      chevron
      onPress={onPress}
      testID={`leave-${item.refNo}`}
    />
  );
});

const styles = StyleSheet.create({
  gap: { gap: Spacing.sm },
  balances: { gap: Spacing.sm, paddingRight: Spacing.lg },
  balance: { width: 150, gap: Spacing.xs },
});
