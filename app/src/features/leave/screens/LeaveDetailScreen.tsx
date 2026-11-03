import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, Divider, QueryState, Screen, SectionHeader, Sheet, Skeleton, Text, TextField } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { REQUEST_TONE } from "@/features/attendance/presentation";
import { TrailTimeline } from "@/features/approvals/components/TrailTimeline";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { LeaveRequestDetail } from "@/types/domain/leave";
import { useCancelLeaveRequestMutation, useGetLeaveRequestQuery } from "../api";

/** One leave request with its approval trail; the owner can cancel while it can still be undone. */
export function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["leave", "common", "errors"]);
  const query = useGetLeaveRequestQuery(id ?? "", { skip: !id });
  const pull = usePullToRefresh(query.refetch);
  const [cancelling, setCancelling] = useState(false);
  const leave = query.data;

  return (
    <Screen
      title={leave?.refNo ?? t("detail.title")}
      subtitle={leave ? t(`status.${leave.status}`) : undefined}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={leave?.viewer.canCancel ? <Button title={t("detail.cancel")} variant="destructive" icon="close-circle-outline" onPress={() => setCancelling(true)} testID="leave-cancel" /> : undefined}
    >
      <QueryState isLoading={query.isLoading} error={query.error} hasData={!!leave} onRetry={() => void query.refetch()} skeleton={<Skeleton height={260} />}>
        {leave ? <Body leave={leave} /> : null}
      </QueryState>
      {leave ? <CancelSheet leave={leave} visible={cancelling} onClose={() => setCancelling(false)} /> : null}
    </Screen>
  );
}

function Body({ leave }: { leave: LeaveRequestDetail }) {
  const { t } = useTranslation("leave");
  const fmt = useFormat();
  const localized = useLocalized();
  const router = useRouter();
  const range = leave.startDate === leave.endDate ? fmt.date(leave.startDate, "EEE, d MMM yyyy") : `${fmt.date(leave.startDate, "d MMM")} – ${fmt.date(leave.endDate, "d MMM yyyy")}`;
  return (
    <View style={styles.gap}>
      <Card accent={REQUEST_TONE[leave.status]} style={styles.gap}>
        <View style={styles.row}>
          <Badge label={t(`status.${leave.status}`)} tone={REQUEST_TONE[leave.status]} dot />
          {leave.isInformed ? <Badge label={t("detail.informed")} tone="success" icon="checkmark" /> : null}
        </View>
        <Text variant="h2">{`${localized(leave.leaveType.name, leave.leaveType.nameBn)} · ${t("days", { count: leave.days })}`}</Text>
        <Text variant="body" color="textSecondary">{range}</Text>
        {leave.halfDay ? <Text variant="caption" color="textSecondary">{t(`halfDay.${leave.halfDay}`)}</Text> : null}
        <Divider />
        <View style={styles.row}>
          <Avatar initials={leave.employee.initials} color={leave.employee.avatarColor} size={36} />
          <View style={styles.flex}>
            <Text variant="bodyStrong" numberOfLines={1}>{localized(leave.employee.name, leave.employee.nameBn)}</Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>{localized(leave.employee.designation, leave.employee.designationBn)}</Text>
          </View>
        </View>
        <Text variant="caption" color="textTertiary">{t("detail.submitted", { time: fmt.dateTime(leave.createdAt) })}</Text>
      </Card>

      <View style={styles.gap}>
        <SectionHeader title={t("detail.reason")} />
        <Card><Text variant="body">{leave.reason}</Text></Card>
        {leave.cancelReason ? <Text variant="bodySmall" color="textSecondary">{t("detail.cancelledReason", { reason: leave.cancelReason })}</Text> : null}
      </View>

      {leave.workflow ? (
        <View style={styles.gap}>
          <SectionHeader title={t("detail.approval")} />
          <Card><TrailTimeline steps={leave.workflow.steps} /></Card>
          {leave.workflow.viewer.canAct ? <Button title={t("detail.openApproval")} variant="secondary" icon="open-outline" onPress={() => router.push(routes.approval(leave.workflow?.id ?? ""))} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function CancelSheet({ leave, visible, onClose }: { leave: LeaveRequestDetail; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation(["leave", "common", "errors"]);
  const online = useIsOnline();
  const [reason, setReason] = useState("");
  const [cancel, { isLoading }] = useCancelLeaveRequestMutation();

  const confirm = async () => {
    try {
      await cancel({ id: leave.id, reason: reason.trim() || undefined }).unwrap();
      toast.success(t("detail.cancelled"), leave.refNo);
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
      title={t("detail.cancelTitle")}
      subtitle={t("detail.cancelBody")}
      dismissable={!isLoading}
      footer={
        <>
          <Button title={t("detail.cancel")} variant="destructive" loading={isLoading} disabled={!online} onPress={() => void confirm()} testID="leave-cancel-confirm" />
          <Button title={t("detail.keep")} variant="ghost" onPress={onClose} />
        </>
      }
    >
      <TextField label={t("detail.cancelReason")} value={reason} onChangeText={setReason} multiline numberOfLines={3} maxLength={500} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  flex: { flex: 1 },
});
