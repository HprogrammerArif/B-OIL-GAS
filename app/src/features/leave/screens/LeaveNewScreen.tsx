import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, Card, Chip, DateField, FormField, QueryState, Screen, Segmented, Text, Toggle } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useIsOnline } from "@/hooks/useIsOnline";
import { addDays, businessDaysInRange, dateKey, holidayOf, isWeekend } from "@/lib/calendar";
import { errorReason, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { HalfDay } from "@/types/domain/leave";
import { useCreateLeaveRequestMutation, useGetLeaveBalancesQuery, useGetLeavePolicyQuery, useGetLeaveTypesQuery } from "../api";
import { HR_REVIEW_CODES } from "../presentation";

const schema = z.object({
  leaveTypeId: z.string().min(1, "errors:required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors:required"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors:required"),
  half: z.boolean(),
  halfDay: z.enum(["FIRST", "SECOND"]),
  reason: z.string().trim().min(5, "errors:min5").max(500),
});
type Form = z.infer<typeof schema>;

/** Apply for leave: live day count and balance, policy hints, and server rules mapped to messages. */
export function LeaveNewScreen() {
  const { t } = useTranslation(["leave", "common", "errors"]);
  const router = useRouter();
  const fmt = useFormat();
  const localized = useLocalized();
  const online = useIsOnline();
  const year = new Date().getFullYear();
  const types = useGetLeaveTypesQuery();
  const policy = useGetLeavePolicyQuery();
  const balances = useGetLeaveBalancesQuery({ year });
  const [create, { isLoading }] = useCreateLeaveRequestMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const today = dateKey();

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { leaveTypeId: "", startDate: today, endDate: today, half: false, halfDay: "FIRST", reason: "" },
    mode: "onTouched",
  });
  const [typeId, start, end, half, halfDay] = useWatch({ control: form.control, name: ["leaveTypeId", "startDate", "endDate", "half", "halfDay"] });
  const type = types.data?.find((x) => x.id === typeId);
  const single = start === end;

  useEffect(() => {
    if (!type && types.data?.[0]) form.setValue("leaveTypeId", types.data[0].id);
  }, [type, types.data, form]);
  useEffect(() => {
    if (end < start) form.setValue("endDate", start);
  }, [start, end, form]);
  useEffect(() => {
    if (half && (!single || !type?.halfDayAllowed)) form.setValue("half", false);
  }, [half, single, type?.halfDayAllowed, form]);

  const days = useMemo(() => {
    if (!policy.data || !start || !end) return 0;
    const n = businessDaysInRange(start, end, policy.data).length;
    return half && n === 1 ? 0.5 : n;
  }, [policy.data, start, end, half]);
  const available = balances.data?.find((b) => b.leaveType.id === typeId)?.available;
  const needsHr = !!type && (HR_REVIEW_CODES.includes(type.code) || days > (policy.data?.hrReviewAboveDays ?? Number.POSITIVE_INFINITY));
  const offDay = (k: string) => !!policy.data && (isWeekend(k, policy.data) || !!holidayOf(k, policy.data));
  const backdate = type && policy.data?.backdateTypes.includes(type.code) ? policy.data.backdateDays : 0;
  const min = addDays(today, -backdate);

  const submit = form.handleSubmit(async (v) => {
    setFormError(null);
    try {
      const created = await create({
        idempotencyKey: newIdempotencyKey(),
        body: { leaveTypeId: v.leaveTypeId, startDate: v.startDate, endDate: v.endDate, halfDay: v.half ? (v.halfDay as HalfDay) : null, reason: v.reason.trim() },
      }).unwrap();
      toast.success(t("new.submitted"), created.refNo);
      router.replace(routes.leaveRequest(created.id));
    } catch (err) {
      const e = toApiError(err);
      const rule = e.details.find((d) => typeof d.rule === "string")?.rule;
      setFormError(typeof rule === "string" ? t(`rules.${rule}` as "rules.OVERLAP", { defaultValue: e.message }) : errorReason(e) ?? e.message);
    }
  });

  return (
    <Screen
      title={t("new.title")}
      footer={
        <>
          {!online ? <Text variant="caption" color="warning" align="center">{t("new.offline")}</Text> : null}
          <Button title={t("new.submit")} icon="send" loading={isLoading} disabled={!online || days === 0} onPress={() => void submit()} testID="leave-submit" />
        </>
      }
    >
      <QueryState isLoading={types.isLoading} error={types.error} hasData={!!types.data} onRetry={() => void types.refetch()}>
        <View style={styles.gap}>
          <View style={styles.gap}>
            <Text variant="caption" color="textSecondary">{t("new.type")}</Text>
            <View style={styles.chips}>
              {(types.data ?? []).map((x) => (
                <Chip key={x.id} label={localized(x.name, x.nameBn)} selected={x.id === typeId} onPress={() => form.setValue("leaveTypeId", x.id)} testID={`leave-type-${x.code}`} />
              ))}
            </View>
          </View>
          <View style={styles.dates}>
            <View style={styles.flex}>
              <Controller control={form.control} name="startDate" render={({ field }) => (
                <DateField label={t("new.from")} value={field.value} onChange={field.onChange} min={min} isOffDay={offDay} testID="leave-start" />
              )} />
            </View>
            <View style={styles.flex}>
              <Controller control={form.control} name="endDate" render={({ field }) => (
                <DateField label={t("new.to")} value={field.value} onChange={field.onChange} min={start} isOffDay={offDay} testID="leave-end" />
              )} />
            </View>
          </View>
          {type?.halfDayAllowed && single ? (
            <Card style={styles.gap}>
              <View style={styles.between}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{t("new.half")}</Text>
                  <Text variant="caption" color="textSecondary">{t("new.halfHelp")}</Text>
                </View>
                <Toggle value={half} onChange={(v) => form.setValue("half", v)} accessibilityLabel={t("new.half")} />
              </View>
              {half ? (
                <Segmented value={halfDay} onChange={(v) => form.setValue("halfDay", v)} options={[{ value: "FIRST", label: t("halfDay.FIRST") }, { value: "SECOND", label: t("halfDay.SECOND") }]} />
              ) : null}
            </Card>
          ) : null}
          <Card tone={days === 0 ? "warning" : undefined} style={styles.gap}>
            <Text variant="bodyStrong">
              {t("new.summary", {
                days: t("days", { count: days, n: fmt.number(days, days % 1 ? 1 : 0) }),
                available: available === undefined ? "—" : fmt.number(available, available % 1 ? 1 : 0),
              })}
            </Text>
            {needsHr ? <Text variant="caption" color="info">{t("new.willNeedHr")}</Text> : null}
          </Card>
          <FormField control={form.control} name="reason" label={t("new.reason")} helperText={t("new.reasonHelp")} multiline numberOfLines={4} maxLength={500} testID="leave-reason" />
          {formError ? <Text variant="bodySmall" color="danger" testID="leave-error">{formError}</Text> : null}
        </View>
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  dates: { flexDirection: "row", gap: Spacing.md },
  between: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  flex: { flex: 1 },
});
