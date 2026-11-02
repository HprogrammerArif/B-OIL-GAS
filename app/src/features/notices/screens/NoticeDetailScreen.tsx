import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, Divider, Icon, ProgressBar, QueryState, Screen, SectionHeader, Sheet, Skeleton, Text } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useFormat, useLanguage, useLocalized } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import type { Notice } from "@/types/domain/notice";
import { useAckNoticeMutation, useArchiveNoticeMutation, useGetNoticeQuery, useSetNoticePinnedMutation } from "../api";
import { ReceiptsSheet } from "../components/ReceiptsSheet";
import { CATEGORY_META, PRIORITY_TONE } from "../presentation";

/** Notice detail (doc 05 §9.2); acknowledge, pin, archive and receipts follow the server's `viewer` flags. */
export function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(["notices", "common", "errors"]);
  const query = useGetNoticeQuery(id ?? "", { skip: !id });
  const notice = query.data;
  const pull = usePullToRefresh(query.refetch);
  const online = useIsOnline();
  const [ack, { isLoading: acking }] = useAckNoticeMutation();

  const acknowledge = async () => {
    if (!notice) return;
    try {
      await ack(notice.id).unwrap();
      toast.success(t("detail.ackDone"), notice.refNo);
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  const footer = notice?.viewer.canAck ? (
    <>
      <Text variant="caption" color={online ? "textSecondary" : "warning"} align="center">
        {online ? t("detail.ackPrompt") : t("detail.offline")}
      </Text>
      <Button title={t("detail.acknowledge")} icon="checkmark-done" variant="success" loading={acking} disabled={!online}
        onPress={() => void acknowledge()} testID="notice-ack" />
    </>
  ) : undefined;

  return (
    <Screen
      title={notice?.refNo ?? t("title")}
      subtitle={notice ? t(`categories.${notice.category}`) : undefined}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={footer}
    >
      <QueryState isLoading={query.isLoading} error={query.error} hasData={!!notice} onRetry={() => void query.refetch()} skeleton={<DetailSkeleton />}>
        {notice ? <DetailBody notice={notice} /> : null}
      </QueryState>
    </Screen>
  );
}

function DetailBody({ notice }: { notice: Notice }) {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "common"]);
  const fmt = useFormat();
  const lang = useLanguage();
  const localized = useLocalized();
  const cat = CATEGORY_META[notice.category];
  const catColors = toneColors(theme, cat.tone);
  const urgent = notice.priority === "CRITICAL" || notice.priority === "HIGH";

  return (
    <View style={styles.body}>
      {notice.status === "ARCHIVED" ? (
        <View style={[styles.note, { backgroundColor: theme.surfaceSecondary }]}>
          <Icon name="archive-outline" size={18} color="textSecondary" />
          <Text variant="bodySmall" style={styles.flex}>{t("detail.archived")}</Text>
        </View>
      ) : null}

      <Card accent={notice.isPinned ? "executive" : urgent ? PRIORITY_TONE[notice.priority] : undefined} style={styles.summary}>
        <View style={styles.row}>
          <View style={[styles.catIcon, { backgroundColor: catColors.bg }]}>
            <Icon name={cat.icon} size={18} tint={catColors.fg} />
          </View>
          {urgent ? <Badge label={t(`common:priority.${notice.priority}`)} tone={PRIORITY_TONE[notice.priority]} /> : null}
          {notice.isPinned ? <Badge label={t("pinned")} tone="executive" icon="pin" /> : null}
          {notice.isBroadcast ? <Badge label={t("broadcast")} tone="executive" icon="megaphone-outline" /> : null}
        </View>
        <Text variant="h2">{localized(notice.title, notice.titleBn)}</Text>
        {notice.referenceNo ? (
          <Text variant="mono" color="textSecondary">{`${t("detail.reference")}: ${notice.referenceNo}`}</Text>
        ) : null}
        <Divider />
        <View style={styles.row}>
          <Avatar initials={notice.author.initials} color={notice.author.avatarColor} size={36} />
          <View style={styles.flex}>
            <Text variant="caption" color="textTertiary">{t("detail.publishedBy")}</Text>
            <Text variant="bodyStrong" numberOfLines={1}>{localized(notice.author.name, notice.author.nameBn)}</Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {localized(notice.author.designation, notice.author.designationBn)}
            </Text>
          </View>
        </View>
        {notice.publishAt ? (
          <Text variant="caption" color="textTertiary">{t("detail.published", { time: fmt.dateTime(notice.publishAt) })}</Text>
        ) : null}
      </Card>

      <Card style={styles.text}>
        {lang === "bn" && !notice.bodyBn ? (
          <Text variant="caption" color="textTertiary">{t("detail.noBangla")}</Text>
        ) : null}
        <Text variant="body" selectable>{localized(notice.body, notice.bodyBn)}</Text>
      </Card>

      {notice.requiresAck && notice.receipt?.ackedAt ? (
        <View style={[styles.note, { backgroundColor: theme.successMuted }]}>
          <Icon name="checkmark-circle" size={18} color="success" />
          <Text variant="bodySmall" style={styles.flex}>{t("detail.ackedOn", { time: fmt.dayTime(notice.receipt.ackedAt) })}</Text>
        </View>
      ) : null}

      <SectionHeader title={t("detail.audience")} />
      <View style={styles.chips}>
        {notice.audiences.map((a) => (
          <Badge key={`${a.type}:${a.refId ?? ""}`} label={`${localized(a.label, a.labelBn)} · ${fmt.number(a.recipientCount)}`} tone="neutral" icon="people-outline" />
        ))}
      </View>
      {notice.expiresAt ? (
        <Text variant="caption" color="textTertiary">{t("detail.expires", { time: fmt.date(notice.expiresAt) })}</Text>
      ) : null}

      {notice.viewer.canViewReceipts ? <ReceiptsCard notice={notice} /> : null}
      {notice.viewer.canPin || notice.viewer.canArchive ? <ManageActions notice={notice} /> : null}
    </View>
  );
}

function ReceiptsCard({ notice }: { notice: Notice }) {
  const { t } = useTranslation("notices");
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const total = Math.max(notice.recipientCount, 1);
  return (
    <>
      <SectionHeader title={t("detail.receipts")} />
      <Card style={styles.summary}>
        <Text variant="bodySmall">{t("readProgress", { read: fmt.number(notice.readCount), total: fmt.number(notice.recipientCount) })}</Text>
        <ProgressBar value={notice.readCount / total} tone="info" accessibilityLabel={t("detail.receipts")} />
        {notice.requiresAck ? (
          <>
            <Text variant="bodySmall">{t("ackProgress", { acked: fmt.number(notice.ackCount), total: fmt.number(notice.recipientCount) })}</Text>
            <ProgressBar value={notice.ackCount / total} tone="success" accessibilityLabel={t("acked")} />
          </>
        ) : null}
        <Button title={t("detail.viewReceipts")} variant="outline" size="sm" icon="list-outline" onPress={() => setOpen(true)} />
      </Card>
      {open ? <ReceiptsSheet noticeId={notice.id} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ManageActions({ notice }: { notice: Notice }) {
  const { t } = useTranslation(["notices", "common", "errors"]);
  const online = useIsOnline();
  const [setPinned, pin] = useSetNoticePinnedMutation();
  const [archive, archiving] = useArchiveNoticeMutation();
  const [confirming, setConfirming] = useState(false);

  const togglePin = async () => {
    try {
      await setPinned({ id: notice.id, pinned: !notice.isPinned }).unwrap();
      toast.success(notice.isPinned ? t("detail.unpinnedDone") : t("detail.pinnedDone"));
    } catch (err) {
      const apiError = toApiError(err);
      const pinLimit = apiError.details.some((d) => d.rule === "PIN_LIMIT");
      toast.error(pinLimit ? t("detail.pinLimit") : t(errorMessageKey(apiError) as "errors:generic"));
    }
  };

  const runArchive = async () => {
    try {
      await archive(notice.id).unwrap();
      toast.success(t("detail.archivedDone"), notice.refNo);
      setConfirming(false);
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  return (
    <>
      <View style={styles.manage}>
        {notice.viewer.canPin ? (
          <Button title={notice.isPinned ? t("detail.unpin") : t("detail.pin")} icon={notice.isPinned ? "pin-outline" : "pin"} variant="secondary"
            size="sm" loading={pin.isLoading} disabled={!online} onPress={() => void togglePin()} style={styles.flex} />
        ) : null}
        {notice.viewer.canArchive ? (
          <Button title={t("detail.archive")} icon="archive-outline" variant="outline" size="sm" disabled={!online}
            onPress={() => setConfirming(true)} style={styles.flex} />
        ) : null}
      </View>
      <Sheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        dismissable={!archiving.isLoading}
        title={t("detail.archiveTitle")}
        subtitle={t("detail.archiveMessage")}
        footer={<Button title={t("detail.archive")} variant="destructive" icon="archive-outline" loading={archiving.isLoading} onPress={() => void runArchive()} />}
      >
        <Text variant="mono" color="textSecondary">{notice.refNo}</Text>
      </Sheet>
    </>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.body}>
      <Skeleton height={220} radius={Radius.lg} />
      <Skeleton height={180} radius={Radius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: Spacing.md },
  summary: { gap: Spacing.sm },
  text: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  note: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  manage: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
});
