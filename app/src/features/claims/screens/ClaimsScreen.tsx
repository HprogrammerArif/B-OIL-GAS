import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, ListRow, ProgressBar, QueryState, Screen, SectionHeader, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { routes } from "@/lib/routes";
import type { ClaimItem } from "@/types/domain/claims";
import { useGetClaimPolicyQuery, useGetClaimsQuery } from "../api";
import { CLAIM_TONE, CLAIM_TYPE_ICON } from "../presentation";

/** Claims home: this month's conveyance cap and the caller's own claims. */
export function ClaimsScreen() {
  const { t } = useTranslation(["claims", "common"]);
  const router = useRouter();
  const fmt = useFormat();
  const perms = usePermissions();
  const claims = useGetClaimsQuery({});
  const policy = useGetClaimPolicyQuery();
  const pull = usePullToRefresh(claims.refetch, policy.refetch);
  const items = claims.data?.items ?? [];
  const p = policy.data;
  const used = Number(p?.conveyanceUsedMonth ?? 0);
  const cap = Number(p?.conveyanceMonthlyCap ?? 0);

  return (
    <Screen
      title={t("title")}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={perms.can("claims:create") ? <Button title={t("newClaim")} icon="add" onPress={() => router.push(routes.newClaim)} testID="claim-new" /> : undefined}
    >
      {p && cap > 0 ? (
        <Card style={styles.gap}>
          <Text variant="caption" color="textSecondary">{t("month", { month: fmt.date(new Date(), "MMMM") })}</Text>
          <Text variant="bodyStrong">{t("capUsed", { used: fmt.money(used), cap: fmt.money(cap) })}</Text>
          <ProgressBar value={Math.min(used / cap, 1)} tone={used / cap > 0.85 ? "warning" : "accent"} />
          <Text variant="caption" color="textTertiary">{t("new.band", { band: p.band })}</Text>
        </Card>
      ) : null}
      <SectionHeader title={t("title")} />
      <QueryState
        isLoading={claims.isLoading}
        error={claims.error}
        hasData={!!claims.data}
        isEmpty={items.length === 0}
        onRetry={() => void claims.refetch()}
        empty={{ icon: "receipt-outline", title: t("empty") }}
      >
        <Card padded={false}>{items.map((c) => <ClaimRow key={c.id} item={c} onPress={() => router.push(routes.claim(c.id))} />)}</Card>
      </QueryState>
    </Screen>
  );
}

export const ClaimRow = memo(function ClaimRow({ item, onPress }: { item: ClaimItem; onPress: () => void }) {
  const { t } = useTranslation("claims");
  const fmt = useFormat();
  const range = item.periodStart === item.periodEnd ? fmt.date(item.periodStart, "d MMM") : `${fmt.date(item.periodStart, "d MMM")} – ${fmt.date(item.periodEnd, "d MMM")}`;
  return (
    <ListRow
      icon={CLAIM_TYPE_ICON[item.type]}
      iconTone="warning"
      title={`${t(`type.${item.type}`)} · ${fmt.money(item.totalAmount)}`}
      subtitle={`${item.purpose} · ${range}`}
      meta={item.claimNo}
      trailing={<View><Badge label={t(`status.${item.status}`)} tone={CLAIM_TONE[item.status]} dot /></View>}
      chevron
      onPress={onPress}
      testID={`claim-${item.claimNo}`}
    />
  );
});

const styles = StyleSheet.create({ gap: { gap: Spacing.sm } });
