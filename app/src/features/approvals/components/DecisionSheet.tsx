import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button, Card, Chip, FormField, Icon, Sheet, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { errorMessageKey, errorReason, toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { toast } from "@/lib/toast";
import type { ActionRequest, ActionResult, WorkflowInstance } from "@/types/domain/workflow";
import { useActOnApprovalMutation, useRequestSignatureOtpMutation } from "../api";
import { PRESETS, presetGroupFor } from "../presentation";
import { decisionSchema, type DecisionForm } from "../schemas";

export type Decision = DecisionForm["decision"];

interface DecisionSheetProps {
  instance: WorkflowInstance;
  decision: Decision | null;
  onClose: () => void;
  onDone?: (result: ActionResult) => void;
}

const TITLE_KEY = { APPROVE: "decision.approveTitle", RETURN: "decision.returnTitle", REJECT: "decision.rejectTitle" } as const;
const SUCCESS_KEY = { APPROVE: "decision.approved", RETURN: "decision.returned", REJECT: "decision.rejected" } as const;

/** Approve / return / reject with comment, reason presets and signature OTP (doc 05 §9.1). */
export function DecisionSheet({ instance, decision, onClose, onDone }: DecisionSheetProps) {
  const { t } = useTranslation(["approvals", "common", "errors"]);
  const [act, { isLoading }] = useActOnApprovalMutation();
  const [requestOtp, { data: otpData, isLoading: otpLoading, isSuccess: otpSent, reset: resetOtp }] = useRequestSignatureOtpMutation();
  const demoCode = otpData?.demoCode ?? null;
  const step = instance.steps.find((s) => s.status === "ACTIVE");
  const needsOtp = decision === "APPROVE" && !!step?.requiresSignature;
  const group = presetGroupFor(instance.objectType);
  // One key per opening so a retried submit after a dropped response is not applied twice.
  const idempotencyKey = useMemo(() => (decision ? newIdempotencyKey() : ""), [decision]);

  const { control, handleSubmit, reset, setValue, setError, getValues } = useForm<DecisionForm>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { decision: "APPROVE", comment: "", improvements: "", reasonCategory: "", otp: "", needsOtp: false },
  });
  const reasonCategory = useWatch({ control, name: "reasonCategory" });

  useEffect(() => {
    if (decision) {
      reset({ decision, comment: "", improvements: "", reasonCategory: "", otp: "", needsOtp });
      resetOtp();
    }
  }, [decision, needsOtp, reset, resetOtp]);

  const pickPreset = (key: string) => {
    const label = t(`presets.${group}.${key}.label` as "presets.general.papers.label");
    const advice = t(`presets.${group}.${key}.advice` as "presets.general.papers.advice");
    const deselect = getValues("reasonCategory") === label;
    setValue("reasonCategory", deselect ? "" : label);
    if (!deselect) {
      if (!getValues("comment")) setValue("comment", label, { shouldValidate: true });
      if (!getValues("improvements")) setValue("improvements", advice);
    }
  };

  const sendOtp = async () => {
    try {
      await requestOtp(instance.id).unwrap();
      toast.info(t("decision.otpSent"));
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  const submit = handleSubmit(async (form) => {
    const body: ActionRequest =
      form.decision === "APPROVE"
        ? {
            type: "APPROVE",
            comment: form.comment || undefined,
            signature: needsOtp ? { method: "TYPED", otpCode: form.otp } : undefined,
          }
        : {
            type: form.decision,
            comment: form.comment,
            details: { reasonCategory: form.reasonCategory || undefined, improvementsRequired: form.improvements || undefined },
          };
    try {
      const result = await act({ id: instance.id, body, idempotencyKey }).unwrap();
      toast.success(
        result.reference ? t("decision.approvedRef", { ref: result.reference }) : t(SUCCESS_KEY[form.decision]),
        instance.summary.refNo,
      );
      onDone?.(result);
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      const reason = errorReason(apiError);
      if (reason === "OTP_INVALID" || reason === "OTP_LOCKED") {
        setError("otp", { message: t("decision.otpInvalid") });
        return;
      }
      if (apiError.code === "INVALID_STATE_TRANSITION") {
        const by = apiError.details.find((d) => typeof d.decidedBy === "string")?.decidedBy;
        toast.error(typeof by === "string" ? t("decision.alreadyDecided", { name: by }) : t("decision.alreadyDecidedAnon"));
        onClose();
        return;
      }
      if (apiError.details.some((d) => d.rule === "SELF_APPROVAL")) {
        toast.error(t("decision.selfApproval"));
        return;
      }
      toast.error(t(errorMessageKey(apiError) as "errors:generic"));
    }
  });

  if (!decision) return null;
  const isApprove = decision === "APPROVE";

  return (
    <Sheet
      visible
      onClose={onClose}
      dismissable={!isLoading}
      title={t(TITLE_KEY[decision])}
      subtitle={instance.summary.refNo}
      footer={
        <Button
          title={needsOtp ? t("decision.confirmApprove") : t(`decision.${decision === "APPROVE" ? "approve" : decision === "RETURN" ? "return" : "reject"}`)}
          variant={isApprove ? (needsOtp ? "executive" : "success") : decision === "REJECT" ? "destructive" : "primary"}
          icon={isApprove ? (needsOtp ? "finger-print" : "checkmark") : decision === "REJECT" ? "close" : "arrow-undo"}
          onPress={() => void submit()}
          loading={isLoading}
          fullWidth
          testID="decision-submit"
        />
      }
    >
      {!isApprove ? (
        <View style={styles.group}>
          <Text variant="caption" color="textSecondary">{t("decision.reasonPreset")}</Text>
          <View style={styles.chips}>
            {PRESETS[group].map((key) => {
              const label = t(`presets.${group}.${key}.label` as "presets.general.papers.label");
              return <Chip key={key} label={label} selected={reasonCategory === label} onPress={() => pickPreset(key)} />;
            })}
          </View>
        </View>
      ) : null}

      <FormField
        control={control}
        name="comment"
        label={isApprove ? t("decision.commentOptional") : t("decision.commentRequired")}
        helperText={isApprove ? undefined : t("decision.commentHint")}
        multiline
        maxLength={1000}
        testID="decision-comment"
      />

      {decision === "RETURN" ? (
        <FormField control={control} name="improvements" label={t("decision.improvements")} multiline maxLength={1000} />
      ) : null}

      {needsOtp ? (
        <Card tone="executive" style={styles.group}>
          <View style={styles.signRow}>
            <Icon name="finger-print" size={20} color="executive" />
            <Text variant="bodySmall" style={styles.flex}>{t("decision.signNotice")}</Text>
          </View>
          <Button
            title={otpSent ? t("decision.otpResend") : t("decision.otpSend")}
            variant="outline"
            size="sm"
            icon="chatbox-ellipses-outline"
            onPress={() => void sendOtp()}
            loading={otpLoading}
          />
          {demoCode ? (
            <Text variant="mono" color="executive" testID="otp-demo-code">{t("decision.otpDemo", { code: demoCode })}</Text>
          ) : null}
          <FormField
            control={control}
            name="otp"
            label={t("decision.otp")}
            helperText={t("decision.otpHint")}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            testID="decision-otp"
          />
        </Card>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  signRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  flex: { flex: 1 },
});
