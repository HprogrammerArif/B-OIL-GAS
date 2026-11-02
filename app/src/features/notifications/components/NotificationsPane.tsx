import { memo, useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Icon, type IconName, QueryState, Segmented, Text } from "@/components/ui";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { fromServerRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { AppNotification, NotificationCategory, NotificationQuery } from "@/types/domain/notification";
import {
  useAckNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../api";

type Filter = "ALL" | "unread" | NotificationCategory;
const FILTERS: Filter[] = ["ALL", "unread", "APPROVALS", "SAFETY", "TRANSPORT", "PEOPLE", "GENERAL"];

const CATEGORY_ICON: Record<NotificationCategory, { icon: IconName; tone: Tone }> = {
  APPROVALS: { icon: "checkmark-done-outline", tone: "accent" },
  SAFETY: { icon: "warning-outline", tone: "danger" },
  TRANSPORT: { icon: "car-outline", tone: "info" },
  PEOPLE: { icon: "people-outline", tone: "purple" },
  GENERAL: { icon: "megaphone-outline", tone: "neutral" },
};

function toQuery(filter: Filter): NotificationQuery {
  if (filter === "ALL") return {};
  if (filter === "unread") return { unread: true };
  return { category: filter };
}

/** Notifications segment of the Inbox tab (doc 05 §9.2). Critical items stay unread until acknowledged. */
export function NotificationsPane() {
  const theme = useTheme();
  const { t } = useTranslation(["notifications", "errors"]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const list = useGetNotificationsQuery(toQuery(filter));
  const pull = usePullToRefresh(list.refetch);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();
  const [ack] = useAckNotificationMutation();
  const items = list.data?.items ?? [];
  const hasUnread = items.some((n) => !n.readAt && !n.ackRequired);

  const fail = useCallback((err: unknown) => toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic")), [t]);

  const open = useCallback(
    (n: AppNotification) => {
      if (!n.readAt && !n.ackRequired) markRead(n.id).unwrap().catch(fail);
      router.push(fromServerRoute(n.data.route));
    },
    [markRead, fail],
  );

  const acknowledge = useCallback((n: AppNotification) => ack(n.id).unwrap().catch(fail), [ack, fail]);

  const header = (
    <View style={styles.header}>
      <Segmented<Filter> scrollable options={FILTERS.map((f) => ({ value: f, label: t(`filters.${f}`) }))} value={filter} onChange={setFilter} />
      {hasUnread ? (
        <Button
          title={t("markAllRead")}
          variant="ghost"
          size="sm"
          icon="checkmark-done"
          fullWidth={false}
          loading={markAllState.isLoading}
          onPress={() => markAll().unwrap().catch(fail)}
          style={styles.markAll}
        />
      ) : null}
    </View>
  );

  return (
    <FlashList
      data={items}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => <NotificationRow item={item} onPress={open} onAck={acknowledge} />}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <QueryState
          isLoading={list.isLoading}
          error={list.error}
          hasData={!!list.data}
          isEmpty
          onRetry={() => void list.refetch()}
          empty={{
            icon: "notifications-off-outline",
            title: filter === "unread" ? t("allRead") : t("empty.title"),
            message: filter === "ALL" ? t("empty.message") : undefined,
          }}
        >
          {null}
        </QueryState>
      }
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={pull.refreshing}
          onRefresh={pull.onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    />
  );
}

interface RowProps {
  item: AppNotification;
  onPress: (n: AppNotification) => void;
  onAck: (n: AppNotification) => void;
}

const NotificationRow = memo(function NotificationRow({ item, onPress, onAck }: RowProps) {
  const theme = useTheme();
  const { t } = useTranslation("notifications");
  const fmt = useFormat();
  const localized = useLocalized();
  const critical = item.priority === "CRITICAL";
  const meta = critical ? { icon: "alert-circle" as IconName, tone: "danger" as Tone } : CATEGORY_ICON[item.category];
  const c = toneColors(theme, meta.tone);
  const unread = !item.readAt;
  const title = localized(item.title, item.titleBn);
  const body = localized(item.body, item.bodyBn);
  const pendingAck = item.ackRequired && !item.ackedAt;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? `${t("filters.unread")}, ` : ""}${title}. ${body}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unread ? theme.surface : theme.background,
          borderColor: critical && pendingAck ? theme.danger : theme.border,
        },
        pressed && styles.pressed,
      ]}
      testID={`notification-${item.id}`}
    >
      <View style={[styles.icon, { backgroundColor: c.bg }]}>
        <Icon name={meta.icon} size={18} tint={c.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant={unread ? "bodyStrong" : "body"} numberOfLines={2} style={styles.flex}>
            {title}
          </Text>
          {unread ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
        </View>
        <Text variant="bodySmall" color="textSecondary" numberOfLines={3}>
          {body}
        </Text>
        <View style={styles.footer}>
          <Text variant="caption" color="textTertiary" style={styles.flex}>
            {fmt.ago(item.createdAt)}
          </Text>
          {pendingAck ? (
            <Button title={t("acknowledge")} variant="destructive" size="sm" fullWidth={false} icon="checkmark" onPress={() => onAck(item)} />
          ) : item.ackedAt ? (
            <Badge label={t("acknowledged")} tone="success" icon="checkmark-circle" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, paddingBottom: Spacing.md },
  markAll: { alignSelf: "flex-end" },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.huge },
  sep: { height: Spacing.sm },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.85 },
  icon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  footer: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, minHeight: 28 },
  flex: { flex: 1 },
});
