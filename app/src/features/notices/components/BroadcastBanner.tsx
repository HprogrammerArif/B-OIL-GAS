import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Icon, IconButton, Text } from "@/components/ui";
import { Radius, Spacing } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useLocalized } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useAckNoticeMutation, useDismissBroadcastMutation, useGetActiveBroadcastQuery } from "../api";

/** Active chairman broadcast on Home (doc 05 §9.2): acknowledge when required, otherwise dismissable. */
export function BroadcastBanner() {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "errors"]);
  const localized = useLocalized();
  const perms = usePermissions();
  const online = useIsOnline();
  const { data: broadcast } = useGetActiveBroadcastQuery(undefined, { skip: !perms.can("notices:read") });
  const [ack, { isLoading: acking }] = useAckNoticeMutation();
  const [dismiss] = useDismissBroadcastMutation();

  if (!broadcast) return null;
  const mustAck = broadcast.requiresAck && !broadcast.ackedAt;
  const title = localized(broadcast.title, broadcast.titleBn);

  const acknowledge = async () => {
    try {
      await ack(broadcast.noticeId).unwrap();
      toast.success(t("detail.ackDone"));
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  return (
    <View style={[styles.banner, { backgroundColor: theme.accent, borderColor: theme.executiveSolid }]} testID="broadcast-banner">
      <Pressable
        onPress={() => router.push(routes.notice(broadcast.noticeId))}
        accessibilityRole="button"
        accessibilityLabel={`${t("banner.label")}: ${title}`}
        style={styles.content}
      >
        <View style={styles.row}>
          <Icon name="megaphone" size={16} tint={theme.executiveSolid} />
          <Text variant="overline" uppercase tint={theme.executiveSolid} style={styles.flex}>{t("banner.label")}</Text>
        </View>
        <Text variant="bodyStrong" color="onAccent" numberOfLines={2}>{title}</Text>
        <Text variant="bodySmall" color="onAccent" numberOfLines={3}>{localized(broadcast.body, broadcast.bodyBn)}</Text>
        <Text variant="caption" color="onAccent">{localized(broadcast.author.name, broadcast.author.nameBn)}</Text>
      </Pressable>
      {mustAck ? (
        <Button title={t("banner.acknowledge")} variant="executive" size="sm" icon="checkmark-done" loading={acking} disabled={!online}
          onPress={() => void acknowledge()} testID="broadcast-ack" />
      ) : (
        <View style={styles.close}>
          <IconButton icon="close" color="onAccent" accessibilityLabel={t("banner.dismiss")} onPress={() => void dismiss(broadcast.id)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: Radius.lg, borderWidth: 2, padding: Spacing.lg, gap: Spacing.md, marginTop: Spacing.lg },
  content: { gap: Spacing.xs, paddingRight: Spacing.xxxl },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  close: { position: "absolute", top: Spacing.xs, right: Spacing.xs },
  flex: { flex: 1 },
});
