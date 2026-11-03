import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, Divider, ListRow, QueryState, Screen, SectionHeader, Sheet, Skeleton, Text, TextField } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { TrailTimeline } from "@/features/approvals/components/TrailTimeline";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useFormat } from "@/hooks/useLanguage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { ClaimDetail } from "@/types/domain/claims";
import { useGetClaimQuery, useWithdrawClaimMutation } from "../api";
import { FlagList } from "../components/FlagList";
import { CLAIM_TONE } from "../presentation";

/** One claim: totals, expense lines, policy notes and the approval trail; owners can withdraw or fix a returned claim. */
export function ClaimDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["claims", "common", "errors"]);
  const router = useRouter();
  const query = useGetClaimQuery(id ?? "", { skip: !id });
  const pull = usePullToRefresh(query.refetch);
  const [withdrawing, setWithdrawing] = useState(false);
  const claim = query.data;
  const returned = claim?.status === "RETURNED" && claim.viewer.isOwner;

  return (
    <Screen
      title={claim?.claimNo ?? t("detail.title")}
      subtitle={claim ? t(`status.${claim.status}`) : undefined}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={
        claim?.viewer.canWithdraw ? (
          <>
            {returned ? <Button title={t("detail.fix")} icon="create-outline" onPress={() => router.push(routes.resubmitClaim(claim.id))} testID="claim-fix" /> : null}
            <Button title={t("detail.withdraw")} variant={returned ? "ghost" : "destructive"} icon="close-circle-outline" onPress={() => setWithdrawing(true)} testID="claim-withdraw" />
          </>
        ) : undefined
      }
    >
      <QueryState isLoading={query.isLoading} error={query.error} hasData={!!claim} onRetry={() => void query.refetch()} skeleton={<Skeleton height={260} />}>
        {claim ? <Body claim={claim} /> : null}
      </QueryState>
      {claim ? <WithdrawSheet claim={claim} visible={withdrawing} onClose={() => setWithdrawing(false)} /> : null}
    </Screen>
  );
}

function Body({ claim }: { claim: ClaimDetail }) {
  const { t } = useTranslation("claims");
  const fmt = useFormat();
  const router = useRouter();
  const range = claim.periodStart === claim.periodEnd ? fmt.date(claim.periodStart) : `${fmt.date(claim.periodStart, "d MMM")} – ${fmt.date(claim.periodEnd)}`;
  const lastReturn = claim.status === "RETURNED" ? [...(claim.workflow?.steps ?? [])].reverse().find((s) => s.decision === "RETURNED") : undefined;

  return (
    <View style={styles.gap}>
      <Card accent={CLAIM_TONE[claim.status]} style={styles.gap}>
        <View style={styles.row}>
          <Badge label={t(`status.${claim.status}`)} tone={CLAIM_TONE[claim.status]} dot />
          <Badge label={t(`type.${claim.type}`)} tone="neutral" />
        </View>
        <Text variant="display">{fmt.money(claim.totalAmount)}</Text>
        {Number(claim.policyAmount) !== Number(claim.totalAmount) ? (
          <Text variant="caption" color="textSecondary">{`${t("detail.policy")}: ${fmt.money(claim.policyAmount)}`}</Text>
        ) : null}
        <Text variant="body" color="textSecondary">{range}</Text>
        {claim.destination ? <Text variant="bodySmall" color="textSecondary">{claim.destination}</Text> : null}
        {claim.travelMode ? <Text variant="caption" color="textTertiary">{`${t("detail.travelMode")}: ${t(`mode.${claim.travelMode}`)}`}</Text> : null}
        {claim.voucherNo ? <Text variant="mono" color="textTertiary">{t("detail.voucher", { no: claim.voucherNo })}</Text> : null}
        <Text variant="caption" color="textTertiary">{t("detail.submitted", { time: fmt.dateTime(claim.createdAt) })}</Text>
      </Card>

      {lastReturn?.comment ? (
        <Card tone="info" style={styles.gap}>
          <Text variant="bodyStrong">{lastReturn.name}</Text>
          <Text variant="body">{lastReturn.comment}</Text>
        </Card>
      ) : null}

      <View style={styles.gap}>
        <SectionHeader title={t("detail.purpose")} />
        <Card><Text variant="body">{claim.purpose}</Text></Card>
      </View>

      <View style={styles.gap}>
        <SectionHeader title={`${t("detail.expenses")} · ${t("lines", { count: claim.lines.length })}`} />
        <Card padded={false}>
          {claim.lines.map((l, i) => (
            <View key={l.id}>
              {i > 0 ? <Divider inset={16} /> : null}
              <ListRow
                title={`${t(`category.${l.category}`)} · ${fmt.money(l.amount)}`}
                subtitle={[l.description, l.fromPlace && l.toPlace ? `${l.fromPlace} → ${l.toPlace}` : null].filter(Boolean).join(" · ")}
                meta={fmt.date(l.date, "d MMM")}
                trailing={l.receiptFileId ? <Badge label={t("line.attached")} tone="success" icon="receipt-outline" /> : undefined}
                chevron={false}
              />
            </View>
          ))}
        </Card>
      </View>

      {claim.policyFlags.length ? (
        <View style={styles.gap}>
          <SectionHeader title={t("detail.flags")} />
          <Card><FlagList flags={claim.policyFlags} /></Card>
        </View>
      ) : null}

      {claim.workflow ? (
        <View style={styles.gap}>
          <SectionHeader title={t("detail.approval")} />
          <Card><TrailTimeline steps={claim.workflow.steps} /></Card>
          {claim.workflow.viewer.canAct ? (
            <Button title={t("detail.openApproval")} variant="secondary" icon="open-outline" onPress={() => router.push(routes.approval(claim.workflow?.id ?? ""))} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function WithdrawSheet({ claim, visible, onClose }: { claim: ClaimDetail; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation(["claims", "common", "errors"]);
  const online = useIsOnline();
  const [reason, setReason] = useState("");
  const [withdraw, { isLoading }] = useWithdrawClaimMutation();

  const confirm = async () => {
    try {
      await withdraw({ id: claim.id, reason: reason.trim() || undefined }).unwrap();
      toast.success(t("detail.withdrawn"), claim.claimNo);
      setReason("");
      onClose();
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t("detail.withdrawTitle")}
      subtitle={t("detail.withdrawBody")}
      dismissable={!isLoading}
      footer={
        <>
          <Button title={t("detail.withdraw")} variant="destructive" loading={isLoading} disabled={!online} onPress={() => void confirm()} testID="claim-withdraw-confirm" />
          <Button title={t("detail.keep")} variant="ghost" onPress={onClose} />
        </>
      }
    >
      <TextField label={t("detail.withdrawReason")} value={reason} onChangeText={setReason} multiline numberOfLines={3} maxLength={500} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
});
