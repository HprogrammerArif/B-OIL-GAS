import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, Chip, Divider, EmptyState, FormField, Icon, QueryState, Screen, SectionHeader, Segmented, Text, Toggle } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/redux/hooks";
import type { Priority } from "@/types/domain/common";
import type { ComposeOptions, NoticeCategory } from "@/types/domain/notice";
import { useGetComposeOptionsQuery, usePublishNoticeMutation } from "../api";
import { audienceKey, CATEGORY_META, parseAudienceKey, PRIORITIES, PRIORITY_TONE } from "../presentation";
import { noticeSchema, type NoticeForm } from "../schemas";
import { NOTICE_TEMPLATES, type NoticeTemplate } from "../templates";

type Tab = "write" | "preview";

/** Publish a notice from the phone: templates, bilingual text, scoped audience and a live preview. */
export function ComposeNoticeScreen() {
  const { t } = useTranslation("notices");
  const perms = usePermissions();
  const allowed = perms.can("notices:publish");
  const options = useGetComposeOptionsQuery(undefined, { skip: !allowed });

  if (!allowed) {
    return (
      <Screen title={t("compose.title")}>
        <EmptyState icon="lock-closed-outline" tone="warning" title={t("compose.noRights")} />
      </Screen>
    );
  }
  if (!options.data) {
    return (
      <Screen title={t("compose.title")}>
        <QueryState isLoading={options.isLoading} error={options.error} hasData={false} onRetry={() => void options.refetch()}>
          {null}
        </QueryState>
      </Screen>
    );
  }
  return <ComposeForm options={options.data} />;
}

function ComposeForm({ options }: { options: ComposeOptions }) {
  const { t } = useTranslation(["notices", "common", "errors"]);
  const fmt = useFormat();
  const localized = useLocalized();
  const online = useIsOnline();
  const [tab, setTab] = useState<Tab>("write");
  const [publish, { isLoading }] = usePublishNoticeMutation();
  // Stable per screen so a retry after a dropped response replays instead of creating a second notice.
  const [keys] = useState(() => ({ create: newIdempotencyKey(), publish: newIdempotencyKey() }));
  const pinsFull = options.pinnedCount >= options.maxPinned;
  const templates = NOTICE_TEMPLATES.filter((tpl) => options.categories.includes(tpl.category));

  const { control, handleSubmit, setValue, reset, getValues } = useForm<NoticeForm>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "", titleBn: "", body: "", bodyBn: "", referenceNo: "",
      category: options.categories[0] ?? "OPERATIONS",
      priority: "NORMAL",
      audienceKey: options.audiences[0] ? audienceKey(options.audiences[0]) : "",
      isPinned: false, requiresAck: false, sendSms: false,
    },
  });
  const form = useWatch({ control });
  const audience = options.audiences.find((a) => audienceKey(a) === form.audienceKey);

  const applyTemplate = (tpl: NoticeTemplate) => {
    const preferred = options.audiences.find((a) => audienceKey(a) === audienceKey(tpl.audience)) ?? options.audiences[0];
    reset({
      ...getValues(),
      title: tpl.title, titleBn: tpl.titleBn, body: tpl.body, bodyBn: tpl.bodyBn,
      category: tpl.category, priority: tpl.priority,
      audienceKey: preferred ? audienceKey(preferred) : "",
      isPinned: tpl.isPinned && !pinsFull, requiresAck: tpl.requiresAck,
    });
  };

  const submit = handleSubmit(async (values) => {
    try {
      const notice = await publish({
        keys,
        body: {
          title: values.title,
          titleBn: values.titleBn || undefined,
          body: values.body,
          bodyBn: values.bodyBn || undefined,
          category: values.category,
          priority: values.priority,
          isPinned: values.isPinned,
          requiresAck: values.requiresAck,
          referenceNo: values.referenceNo || undefined,
          audiences: [parseAudienceKey(values.audienceKey)],
          channels: values.sendSms ? ["IN_APP", "PUSH", "SMS"] : ["IN_APP", "PUSH"],
        },
      }).unwrap();
      toast.success(t("compose.published"), t("compose.publishedRef", { ref: notice.refNo, count: fmt.number(notice.recipientCount) }));
      router.replace(routes.notice(notice.id));
    } catch (err) {
      const apiError = toApiError(err);
      const pinLimit = apiError.details.some((d) => d.rule === "PIN_LIMIT");
      toast.error(pinLimit ? t("detail.pinLimit") : t(errorMessageKey(apiError) as "errors:generic"));
    }
  });

  const footer = (
    <>
      {!online ? <Text variant="caption" color="warning" align="center">{t("compose.offline")}</Text> : null}
      <Button
        title={t("compose.publish", { count: fmt.number(audience?.recipientCount ?? 0) })}
        icon="paper-plane-outline"
        loading={isLoading}
        disabled={!online}
        onPress={() => void submit()}
        testID="notice-publish"
      />
    </>
  );

  return (
    <Screen title={t("compose.title")} footer={footer}>
      <View style={styles.body}>
        <Segmented<Tab>
          options={[{ value: "write", label: t("compose.write") }, { value: "preview", label: t("compose.preview") }]}
          value={tab}
          onChange={setTab}
        />
        {tab === "preview" ? (
          <Preview values={form} audienceLabel={audience ? localized(audience.label, audience.labelBn) : ""} />
        ) : (
          <>
            {templates.length ? (
              <>
                <SectionHeader title={t("compose.templates")} />
                <View style={styles.chips}>
                  {templates.map((tpl) => (
                    <Chip key={tpl.key} label={t(`compose.templateNames.${tpl.key}`)} icon={tpl.icon} onPress={() => applyTemplate(tpl)} testID={`template-${tpl.key}`} />
                  ))}
                </View>
              </>
            ) : null}

            <SectionHeader title={t("compose.category")} />
            <Segmented<NoticeCategory>
              scrollable
              options={options.categories.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
              value={form.category ?? options.categories[0] ?? "OPERATIONS"}
              onChange={(c) => setValue("category", c)}
            />

            <SectionHeader title={t("compose.priority")} />
            <Segmented<Priority>
              options={PRIORITIES.map((p) => ({ value: p, label: t(`common:priority.${p}`) }))}
              value={form.priority ?? "NORMAL"}
              onChange={(p) => setValue("priority", p)}
            />

            <SectionHeader title={t("compose.audience")} />
            <View style={styles.chips}>
              {options.audiences.map((a) => {
                const key = audienceKey(a);
                return (
                  <Chip key={key} label={`${localized(a.label, a.labelBn)} · ${fmt.number(a.recipientCount)}`} icon="people-outline"
                    selected={form.audienceKey === key} onPress={() => setValue("audienceKey", key, { shouldValidate: true })} />
                );
              })}
            </View>

            <View style={styles.fields}>
              <FormField control={control} name="title" label={t("compose.titleEn")} maxLength={200} testID="notice-title" />
              <FormField control={control} name="titleBn" label={t("compose.titleBn")} maxLength={200} />
              <FormField control={control} name="body" label={t("compose.bodyEn")} multiline maxLength={20000} testID="notice-body" />
              <FormField control={control} name="bodyBn" label={t("compose.bodyBn")} multiline maxLength={20000} />
              <FormField control={control} name="referenceNo" label={t("compose.referenceNo")} maxLength={60} autoCapitalize="characters" />
            </View>

            <SectionHeader title={t("compose.options")} />
            <DeliveryOptions control={control} setValue={setValue} options={options} />
            {form.priority === "CRITICAL" && form.requiresAck ? (
              <Text variant="caption" color="danger">{t("compose.criticalHint")}</Text>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function DeliveryOptions({ control, setValue, options }: { control: Control<NoticeForm>; setValue: UseFormSetValue<NoticeForm>; options: ComposeOptions }) {
  const { t } = useTranslation("notices");
  const [isPinned, requiresAck, sendSms] = useWatch({ control, name: ["isPinned", "requiresAck", "sendSms"] });
  const pinsFull = options.pinnedCount >= options.maxPinned;
  const rows: { key: "isPinned" | "requiresAck" | "sendSms"; label: string; hint?: string; value: boolean; disabled?: boolean }[] = [
    {
      key: "isPinned", label: t("compose.pin"), value: isPinned, disabled: pinsFull && !isPinned,
      hint: pinsFull ? t("compose.pinFull", { max: options.maxPinned }) : t("compose.pinHint", { count: options.pinnedCount, max: options.maxPinned }),
    },
    { key: "requiresAck", label: t("compose.requiresAck"), value: requiresAck },
    { key: "sendSms", label: t("compose.sendSms"), value: sendSms },
  ];
  return (
    <Card padded={false}>
      {rows.map((row, i) => (
        <View key={row.key}>
          {i > 0 ? <Divider inset={Spacing.lg} /> : null}
          <View style={styles.toggleRow}>
            <View style={styles.flex}>
              <Text variant="body">{row.label}</Text>
              {row.hint ? <Text variant="caption" color="textTertiary">{row.hint}</Text> : null}
            </View>
            <Toggle value={row.value} disabled={row.disabled} accessibilityLabel={row.label} onChange={(v) => setValue(row.key, v)} />
          </View>
        </View>
      ))}
    </Card>
  );
}

function Preview({ values, audienceLabel }: { values: Partial<NoticeForm>; audienceLabel: string }) {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "common"]);
  const localized = useLocalized();
  const fmt = useFormat();
  const me = useAppSelector((s) => s.auth.user);
  const category = values.category ?? "OPERATIONS";
  const cat = CATEGORY_META[category];
  const catColors = toneColors(theme, cat.tone);
  const priority = values.priority ?? "NORMAL";
  const title = localized(values.title, values.titleBn);
  const body = localized(values.body, values.bodyBn);

  if (!title || !body) return <EmptyState icon="eye-outline" title={t("compose.previewEmpty")} />;
  return (
    <Card accent={values.isPinned ? "executive" : priority === "NORMAL" ? undefined : PRIORITY_TONE[priority]} style={styles.preview}>
      <View style={styles.row}>
        <View style={[styles.catIcon, { backgroundColor: catColors.bg }]}>
          <Icon name={cat.icon} size={16} tint={catColors.fg} />
        </View>
        <Text variant="caption" weight="bold" tint={catColors.fg} style={styles.flex}>{t(`categories.${category}`)}</Text>
        {priority !== "NORMAL" ? <Badge label={t(`common:priority.${priority}`)} tone={PRIORITY_TONE[priority]} /> : null}
        {values.isPinned ? <Icon name="pin" size={14} color="executive" /> : null}
      </View>
      <Text variant="h3">{title}</Text>
      {values.referenceNo ? <Text variant="mono" color="textSecondary">{values.referenceNo}</Text> : null}
      <Text variant="body">{body}</Text>
      <Divider />
      <View style={styles.row}>
        {me ? <Avatar initials={me.initials} color={me.avatarColor} size={28} /> : null}
        <Text variant="caption" color="textSecondary" style={styles.flex} numberOfLines={2}>
          {`${me ? localized(me.fullName, me.fullNameBn) : ""} · ${fmt.dayTime(new Date().toISOString())}`}
        </Text>
      </View>
      <View style={styles.chips}>
        <Badge label={audienceLabel} tone="neutral" icon="people-outline" />
        {values.requiresAck ? <Badge label={t("needsAck")} tone="accent" icon="hand-left-outline" /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: Spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  fields: { gap: Spacing.md, marginTop: Spacing.lg },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 56 },
  preview: { gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catIcon: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
});
