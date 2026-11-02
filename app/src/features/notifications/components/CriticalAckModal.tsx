import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Icon, Text } from "@/components/ui";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { haptic } from "@/lib/haptics";
import { fromServerRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useAckNotificationMutation, useGetNotificationsQuery, useGetUnreadCountQuery } from "../api";

/**
 * Blocking alert for CRITICAL notifications with `ackRequired` (doc 05 §7.4). It has no close
 * affordance: the only way out is Acknowledge, which the server mirrors onto the source record.
 */
export function CriticalAckModal() {
  const theme = useTheme();
  const { t } = useTranslation(["notifications", "common", "errors"]);
  const localized = useLocalized();
  const fmt = useFormat();
  const online = useIsOnline();
  const count = useGetUnreadCountQuery();
  const pendingCritical = (count.data?.critical ?? 0) > 0;
  const list = useGetNotificationsQuery({ unread: true }, { skip: !pendingCritical });
  const [ack, { isLoading }] = useAckNotificationMutation();
  const [opening, setOpening] = useState(false);

  const pending = pendingCritical ? (list.data?.items ?? []).filter((n) => n.ackRequired && !n.ackedAt) : [];
  const current = pending[0];
  if (!current) return null;

  const acknowledge = async (open: boolean) => {
    setOpening(open);
    try {
      await ack(current.id).unwrap();
      haptic.success();
      toast.success(t("critical.done"));
      if (open && current.data.route) router.push(fromServerRoute(current.data.route));
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.danger }]} accessibilityViewIsModal testID="critical-ack-modal">
          <View style={[styles.icon, { backgroundColor: theme.dangerMuted }]}>
            <Icon name="alert-circle" size={32} color="danger" />
          </View>
          <Text variant="overline" color="danger" uppercase align="center">{t("criticalTitle")}</Text>
          <Text variant="h2" align="center" accessibilityRole="header">{localized(current.title, current.titleBn)}</Text>
          <Text variant="body" color="textSecondary" align="center">{localized(current.body, current.bodyBn)}</Text>
          <Text variant="caption" color="textTertiary" align="center">{t("critical.message")}</Text>
          {!online ? <Text variant="caption" color="warning" align="center">{t("common:states.offline")}</Text> : null}
          <View style={styles.actions}>
            <Button title={t("acknowledge")} variant="destructive" icon="checkmark-done" loading={isLoading && !opening}
              disabled={!online || isLoading} onPress={() => void acknowledge(false)} testID="critical-ack" />
            {current.data.route ? (
              <Button title={t("critical.ackOpen")} variant="outline" icon="open-outline" loading={isLoading && opening}
                disabled={!online || isLoading}
                onPress={() => void acknowledge(true)} />
            ) : null}
          </View>
          {pending.length > 1 ? (
            <Text variant="caption" color="textTertiary" align="center">{t("critical.more", { n: fmt.number(pending.length - 1) })}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: Spacing.xl },
  card: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: "stretch",
  },
  icon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
