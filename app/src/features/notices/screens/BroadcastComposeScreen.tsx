import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button, Card, Divider, EmptyState, FormField, Icon, Screen, Text, Toggle } from "@/components/ui";
import { Radius, Spacing } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useFormat } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useCreateBroadcastMutation } from "../api";
import { broadcastSchema, type BroadcastForm } from "../schemas";
import { BROADCAST_DEFAULT } from "../templates";

/** Chairman's company-wide announcement (BR-01-08): banner on every home screen plus a pinned notice. */
export function BroadcastComposeScreen() {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "common", "errors"]);
  const fmt = useFormat();
  const perms = usePermissions();
  const online = useIsOnline();
  const [send, { isLoading }] = useCreateBroadcastMutation();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const { control, handleSubmit, setValue } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { title: BROADCAST_DEFAULT.title, titleBn: "", body: BROADCAST_DEFAULT.body, bodyBn: "", requiresAck: true, sendSms: true },
  });
  const [requiresAck, sendSms] = useWatch({ control, name: ["requiresAck", "sendSms"] });

  if (!perms.can("notices:broadcast")) {
    return (
      <Screen title={t("broadcastCompose.title")}>
        <EmptyState icon="lock-closed-outline" tone="warning" title={t("compose.noRights")} />
      </Screen>
    );
  }

  const submit = handleSubmit(async (values) => {
    try {
      const { notice } = await send({
        idempotencyKey,
        body: {
          title: values.title,
          titleBn: values.titleBn || undefined,
          body: values.body,
          bodyBn: values.bodyBn || undefined,
          requiresAck: values.requiresAck,
          sendSms: values.sendSms,
        },
      }).unwrap();
      toast.success(t("broadcastCompose.sent", { count: fmt.number(notice.recipientCount) }), notice.refNo);
      router.replace(routes.notice(notice.id));
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  });

  const footer = (
    <>
      {!online ? <Text variant="caption" color="warning" align="center">{t("compose.offline")}</Text> : null}
      <Button title={t("broadcastCompose.send")} variant="executive" icon="megaphone-outline" loading={isLoading} disabled={!online}
        onPress={() => void submit()} testID="broadcast-send" />
    </>
  );

  const toggles = [
    { key: "requiresAck" as const, label: t("broadcastCompose.requiresAck"), value: requiresAck },
    { key: "sendSms" as const, label: t("broadcastCompose.sendSms"), value: sendSms },
  ];

  return (
    <Screen title={t("broadcastCompose.title")} footer={footer}>
      <View style={styles.body}>
        <View style={[styles.intro, { backgroundColor: theme.executiveMuted, borderColor: theme.executiveSolid }]}>
          <Icon name="megaphone" size={20} color="executive" />
          <Text variant="bodySmall" style={styles.flex}>{t("broadcastCompose.intro")}</Text>
        </View>
        <FormField control={control} name="title" label={t("broadcastCompose.titleLabel")} maxLength={200} testID="broadcast-title" />
        <FormField control={control} name="titleBn" label={t("broadcastCompose.titleBn")} maxLength={200} />
        <FormField control={control} name="body" label={t("broadcastCompose.bodyLabel")} multiline maxLength={5000} testID="broadcast-body" />
        <FormField control={control} name="bodyBn" label={t("broadcastCompose.bodyBn")} multiline maxLength={5000} />
        <Card padded={false}>
          {toggles.map((row, i) => (
            <View key={row.key}>
              {i > 0 ? <Divider inset={Spacing.lg} /> : null}
              <View style={styles.toggleRow}>
                <Text variant="body" style={styles.flex}>{row.label}</Text>
                <Toggle value={row.value} accessibilityLabel={row.label} onChange={(v) => setValue(row.key, v)} />
              </View>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: Spacing.md },
  intro: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 56 },
});
