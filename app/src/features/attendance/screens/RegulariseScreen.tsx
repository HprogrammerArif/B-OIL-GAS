import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, DateField, FormField, ListRow, QueryState, Screen, SectionHeader, Segmented, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { addDays, dateKey } from "@/lib/calendar";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { toast } from "@/lib/toast";
import type { Regularisation } from "@/types/domain/attendance";
import { useCreateRegularisationMutation, useGetRegularisationsQuery } from "../api";
import { REGULARISATION_TYPES, REQUEST_TONE } from "../presentation";
import { regularisationSchema, toRegularisationRequest, type RegularisationForm } from "../schemas";

/** Request a correction for the last 7 days (or field duty up to 30 days ahead) and track the outcome. */
export function RegulariseScreen() {
  const { t } = useTranslation(["attendance", "common", "errors"]);
  const { date: dateParam, type: typeParam } = useLocalSearchParams<{ date?: string; type?: string }>();
  const online = useIsOnline();
  const mine = useGetRegularisationsQuery({ scope: "mine" });
  const pull = usePullToRefresh(mine.refetch);
  const [create, { isLoading }] = useCreateRegularisationMutation();
  const today = dateKey();

  const defaults = useMemo<RegularisationForm>(
    () => ({
      type: REGULARISATION_TYPES.find((x) => x === typeParam) ?? "MISSED_PUNCH",
      date: dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today,
      requestedIn: "",
      requestedOut: "",
      reason: "",
    }),
    [dateParam, typeParam, today],
  );
  const form = useForm<RegularisationForm>({ resolver: zodResolver(regularisationSchema), defaultValues: defaults, mode: "onTouched" });
  const type = useWatch({ control: form.control, name: "type" });

  const submit = form.handleSubmit(async (values) => {
    try {
      await create({ body: toRegularisationRequest(values), idempotencyKey: newIdempotencyKey() }).unwrap();
      toast.success(t("regularise.sent"));
      form.reset({ ...defaults, date: values.date, reason: "" });
    } catch (err) {
      const e = toApiError(err);
      const message = e.details.find((d) => typeof d.message === "string")?.message;
      toast.error(typeof message === "string" ? message : t(errorMessageKey(e) as "errors:generic"));
    }
  });

  const futureOk = type === "FIELD_DUTY";
  return (
    <Screen
      title={t("regularise.title")}
      onRefresh={pull.onRefresh}
      refreshing={pull.refreshing}
      footer={<Button title={t("regularise.submit")} icon="send" loading={isLoading} disabled={!online} onPress={() => void submit()} testID="regularise-submit" />}
    >
      <View style={styles.gap}>
        <Text variant="h3">{t("regularise.new")}</Text>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Segmented scrollable value={field.value} onChange={field.onChange} options={REGULARISATION_TYPES.map((v) => ({ value: v, label: t(`regularise.types.${v}`) }))} />
          )}
        />
        <Controller
          control={form.control}
          name="date"
          render={({ field, fieldState }) => (
            <DateField
              label={t("regularise.date")}
              value={field.value}
              onChange={field.onChange}
              min={addDays(today, -7)}
              max={futureOk ? addDays(today, 30) : today}
              error={fieldState.error ? t(fieldState.error.message as "errors:required") : undefined}
              testID="regularise-date"
            />
          )}
        />
        <Text variant="caption" color="textTertiary">{futureOk ? t("regularise.fieldDutyWindow") : t("regularise.window")}</Text>
        {type === "MISSED_PUNCH" ? (
          <View style={styles.times}>
            <View style={styles.flex}><FormField control={form.control} name="requestedIn" label={t("regularise.requestedIn")} placeholder="09:00" keyboardType="numbers-and-punctuation" maxLength={5} /></View>
            <View style={styles.flex}><FormField control={form.control} name="requestedOut" label={t("regularise.requestedOut")} placeholder="17:30" keyboardType="numbers-and-punctuation" maxLength={5} /></View>
          </View>
        ) : null}
        <FormField control={form.control} name="reason" label={t("regularise.reason")} helperText={t("regularise.reasonHelp")} multiline numberOfLines={4} maxLength={500} testID="regularise-reason" />
      </View>

      <SectionHeader title={t("regularise.mine")} />
      <QueryState
        isLoading={mine.isLoading}
        error={mine.error}
        hasData={!!mine.data}
        isEmpty={mine.data?.length === 0}
        onRetry={() => void mine.refetch()}
        empty={{ icon: "document-text-outline", title: t("regularise.empty") }}
      >
        <Card padded={false}>{(mine.data ?? []).map((r) => <RequestRow key={r.id} item={r} />)}</Card>
      </QueryState>
    </Screen>
  );
}

function RequestRow({ item }: { item: Regularisation }) {
  const { t } = useTranslation(["attendance", "leave"]);
  const fmt = useFormat();
  return (
    <ListRow
      title={`${t(`regularise.types.${item.type}`)} · ${fmt.date(item.date, "d MMM")}`}
      subtitle={item.reason}
      meta={item.refNo}
      trailing={<Badge label={t(`leave:status.${item.status}`)} tone={REQUEST_TONE[item.status]} dot />}
    />
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  times: { flexDirection: "row", gap: Spacing.md },
  flex: { flex: 1 },
});
