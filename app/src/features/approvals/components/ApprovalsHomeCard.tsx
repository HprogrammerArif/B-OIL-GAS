import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { EmptyState, SectionHeader, Skeleton, StatCard } from "@/components/ui";
import { Radius, Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { routes } from "@/lib/routes";
import type { InboxItem } from "@/types/domain/workflow";
import { useGetInboxQuery, useGetInboxSummaryQuery } from "../api";
import { InboxRow } from "./InboxRow";

/** Home card for approver/executive variants: pending totals and the three most urgent items. */
export function ApprovalsHomeCard() {
  const { t } = useTranslation(["approvals", "common"]);
  const fmt = useFormat();
  const summary = useGetInboxSummaryQuery();
  const inbox = useGetInboxQuery({ view: "mine" });
  const top = (inbox.data?.items ?? []).slice(0, 3);
  const open = useCallback((item: InboxItem) => router.push(routes.approval(item.instanceId)), []);
  const s = summary.data;

  return (
    <View>
      <SectionHeader title={t("summary.pending")} count={s?.pending} actionLabel={t("common:actions.viewAll")} onAction={() => router.push(routes.inbox)} />
      {s ? (
        <View style={styles.stats}>
          <StatCard label={t("summary.dueSoon")} value={fmt.number(s.breachingIn12h)} icon="time-outline" tone="warning"
            hint={s.breached ? t("summary.overdue", { count: s.breached }) : undefined} onPress={() => router.push(routes.inbox)} />
          <StatCard label={t("summary.value")} value={fmt.money(s.totalAmount, true)} icon="cash-outline" tone="executive" onPress={() => router.push(routes.inbox)} />
        </View>
      ) : (
        <Skeleton height={104} radius={Radius.lg} />
      )}
      <View style={styles.list}>
        {inbox.isLoading ? <Skeleton height={140} radius={Radius.lg} /> : null}
        {inbox.data && !top.length ? <EmptyState icon="checkmark-done-circle-outline" title={t("empty.title")} /> : null}
        {top.map((item) => (
          <InboxRow key={item.instanceId} item={item} onPress={open} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: Spacing.md },
  list: { gap: Spacing.md, marginTop: Spacing.md },
});
