import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, Divider, Icon, QueryState, Screen, SectionHeader, Sheet, Skeleton, Text } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { toast } from "@/lib/toast";
import type { WorkflowAction, WorkflowInstance } from "@/types/domain/workflow";
import { useActOnApprovalMutation, useGetApprovalQuery } from "../api";
import { DecisionSheet } from "../components/DecisionSheet";
import { TrailTimeline } from "../components/TrailTimeline";
import { CATEGORY_META, STATUS_TONE, URGENCY_TONE } from "../presentation";

type Decision = "APPROVE" | "REJECT" | "RETURN";

/** Full approval record (doc 05 §9.1 detail); every action is gated by the server-computed `viewer` flags. */
export function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["approvals", "common"]);
  const query = useGetApprovalQuery(id ?? "", { skip: !id });
  const inst = query.data;
  const pull = usePullToRefresh(query.refetch);
  const online = useIsOnline();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const footer = inst && inst.status === "IN_REVIEW" && (inst.viewer.canAct || inst.viewer.canWithdraw) ? (
    <>
      {!online ? (
        <Text variant="caption" color="warning" align="center">
          {t("detail.offline")}
        </Text>
      ) : null}
      {inst.viewer.canAct ? (
        <View style={styles.actions}>
          <Button title={t("decision.reject")} variant="outline" size="sm" icon="close" disabled={!online} onPress={() => setDecision("REJECT")} style={styles.flex} testID="approval-reject" />
          <Button title={t("decision.return")} variant="secondary" size="sm" icon="arrow-undo" disabled={!online} onPress={() => setDecision("RETURN")} style={styles.flex} testID="approval-return" />
          <Button title={t("decision.approve")} variant="success" size="sm" icon="checkmark" disabled={!online} onPress={() => setDecision("APPROVE")} style={styles.grow} testID="approval-approve" />
        </View>
      ) : (
        <Button title={t("decision.withdraw")} variant="outline" icon="arrow-undo-circle-outline" disabled={!online} onPress={() => setWithdrawing(true)} />
      )}
    </>
  ) : undefined;

  return (
    <Screen
      title={inst?.summary.refNo ?? t("title")}
      subtitle={inst ? t(`objectTypes.${inst.objectType}`) : undefined}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={footer}
      secure={inst?.objectType === "NoteSheet"}
    >
      <QueryState isLoading={query.isLoading} error={query.error} hasData={!!inst} onRetry={() => void query.refetch()} skeleton={<DetailSkeleton />}>
        {inst ? <DetailBody inst={inst} /> : null}
      </QueryState>
      {inst ? (
        <>
          <DecisionSheet instance={inst} decision={decision} onClose={() => setDecision(null)} />
          <WithdrawSheet inst={inst} visible={withdrawing} onClose={() => setWithdrawing(false)} />
        </>
      ) : null}
    </Screen>
  );
}

function DetailBody({ inst }: { inst: WorkflowInstance }) {
  const theme = useTheme();
  const { t } = useTranslation("approvals");
  const fmt = useFormat();
  const localized = useLocalized();
  const { summary } = inst;
  const cat = CATEGORY_META[summary.category];
  const catColors = toneColors(theme, cat.tone);
  const active = inst.steps.find((s) => s.status === "ACTIVE");
  const showNotYours = inst.status === "IN_REVIEW" && !inst.viewer.canAct && !inst.viewer.isInitiator && active;
  const actions = [...inst.actions].reverse();

  return (
    <View style={styles.body}>
      <Card accent={URGENCY_TONE[summary.urgency] === "neutral" ? undefined : URGENCY_TONE[summary.urgency]} style={styles.summary}>
        <View style={styles.row}>
          <View style={[styles.catIcon, { backgroundColor: catColors.bg }]}>
            <Icon name={cat.icon} size={18} tint={catColors.fg} />
          </View>
          <Badge label={t(`status.${inst.status}`)} tone={STATUS_TONE[inst.status]} />
          {summary.urgency !== "NORMAL" ? <Badge label={t(`urgency.${summary.urgency}`)} tone={URGENCY_TONE[summary.urgency]} /> : null}
        </View>
        <Text variant="h2">{localized(summary.title, summary.titleBn)}</Text>
        <Text variant="display" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {summary.amount ? fmt.money(summary.amount) : localized(summary.quantityLabel, summary.quantityLabelBn)}
        </Text>
        <Divider />
        <View style={styles.row}>
          <Avatar initials={summary.requester.initials} color={summary.requester.avatarColor} size={36} />
          <View style={styles.flex}>
            <Text variant="caption" color="textTertiary">{t("requester")}</Text>
            <Text variant="bodyStrong" numberOfLines={1}>{localized(summary.requester.name, summary.requester.nameBn)}</Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {`${localized(summary.requester.designation, summary.requester.designationBn)} · ${localized(summary.requester.department, summary.requester.departmentBn)}`}
            </Text>
          </View>
        </View>
        <Text variant="caption" color="textTertiary">{t("submitted", { time: fmt.dateTime(inst.submittedAt) })}</Text>
      </Card>

      {showNotYours && active ? (
        <View style={[styles.notice, { backgroundColor: theme.infoMuted }]}>
          <Icon name="information-circle-outline" size={18} color="info" />
          <Text variant="bodySmall" style={styles.flex}>
            {t("detail.notYours", { name: active.approver ? localized(active.approver.name, active.approver.nameBn) : localized(active.approverLabel, active.approverLabelBn) })}
          </Text>
        </View>
      ) : null}

      <SectionHeader title={t("detail.details")} />
      <Card>
        <Text variant="body">{localized(summary.details, summary.detailsBn)}</Text>
      </Card>

      <SectionHeader title={t("detail.trail")} />
      <Card>
        <TrailTimeline steps={inst.steps} />
      </Card>

      {actions.length ? (
        <>
          <SectionHeader title={t("detail.activity")} count={actions.length} />
          <Card padded={false}>
            {actions.map((a, i) => (
              <View key={a.id}>
                {i > 0 ? <Divider inset={Spacing.lg} /> : null}
                <ActivityRow action={a} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </View>
  );
}

function ActivityRow({ action }: { action: WorkflowAction }) {
  const { t } = useTranslation("approvals");
  const fmt = useFormat();
  const localized = useLocalized();
  const actor = action.actor ? localized(action.actor.name, action.actor.nameBn) : "—";
  return (
    <View style={styles.activity}>
      <View style={styles.row}>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
          {t(`actionTypes.${action.type}`)}
        </Text>
        <Text variant="caption" color="textTertiary">{fmt.dayTime(action.at)}</Text>
      </View>
      <Text variant="caption" color="textSecondary">{actor}</Text>
      {action.comment ? <Text variant="bodySmall">{`“${action.comment}”`}</Text> : null}
      {action.details?.reasonCategory ? (
        <Text variant="caption" color="textSecondary">{`${t("detail.reason")}: ${action.details.reasonCategory}`}</Text>
      ) : null}
      {action.details?.improvementsRequired ? (
        <Text variant="caption" color="textSecondary">{`${t("detail.improvements")}: ${action.details.improvementsRequired}`}</Text>
      ) : null}
    </View>
  );
}

function WithdrawSheet({ inst, visible, onClose }: { inst: WorkflowInstance; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation(["approvals", "errors"]);
  const [act, { isLoading }] = useActOnApprovalMutation();
  const withdraw = async () => {
    try {
      await act({ id: inst.id, body: { type: "WITHDRAW" }, idempotencyKey: newIdempotencyKey() }).unwrap();
      toast.success(t("decision.withdrawn"));
      onClose();
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissable={!isLoading}
      title={t("decision.withdrawTitle")}
      subtitle={t("decision.withdrawMessage")}
      footer={<Button title={t("decision.withdraw")} variant="destructive" loading={isLoading} onPress={() => void withdraw()} />}
    >
      <Text variant="mono" color="textSecondary">{inst.summary.refNo}</Text>
    </Sheet>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.body}>
      <Skeleton height={220} radius={Radius.lg} />
      <Skeleton height={90} radius={Radius.lg} />
      <Skeleton height={260} radius={Radius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flex: 1.4 },
  body: { gap: Spacing.md },
  summary: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  notice: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  activity: { padding: Spacing.lg, gap: Spacing.xs },
  actions: { flexDirection: "row", gap: Spacing.sm },
});
