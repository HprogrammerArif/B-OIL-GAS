import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Badge, Icon, Text, type IconName } from "@/components/ui";
import { Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import type { WorkflowStep } from "@/types/domain/workflow";
import { DECISION_TONE } from "../presentation";

function stepVisual(step: WorkflowStep): { icon: IconName; tone: Tone } {
  if (step.status === "COMPLETED" && step.decision) {
    const icon: IconName = step.decision === "APPROVED" ? "checkmark" : step.decision === "RETURNED" ? "arrow-undo" : "close";
    return { icon, tone: DECISION_TONE[step.decision] };
  }
  if (step.status === "ACTIVE") return { icon: "hourglass-outline", tone: "info" };
  if (step.status === "SKIPPED") return { icon: "remove", tone: "neutral" };
  return { icon: "ellipse-outline", tone: "neutral" };
}

/** Vertical step list: who decided what, when, with their note and signature digest. */
export const TrailTimeline = memo(function TrailTimeline({ steps }: { steps: WorkflowStep[] }) {
  const theme = useTheme();
  const { t } = useTranslation("approvals");
  const fmt = useFormat();
  const localized = useLocalized();

  return (
    <View accessibilityRole="list">
      {steps.map((step, i) => {
        const v = stepVisual(step);
        const c = toneColors(theme, v.tone);
        const last = i === steps.length - 1;
        const who = step.decidedBy
          ? localized(step.decidedBy.name, step.decidedBy.nameBn)
          : localized(step.approverLabel, step.approverLabelBn);
        return (
          <View key={step.id} style={styles.row} accessible accessibilityLabel={`${localized(step.name, step.nameBn)}, ${who}`}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: c.bg, borderColor: c.fg }]}>
                <Icon name={v.icon} size={14} tint={c.fg} />
              </View>
              {!last ? <View style={[styles.line, { backgroundColor: theme.border }]} /> : null}
            </View>
            <View style={[styles.body, !last && styles.bodyGap]}>
              <View style={styles.head}>
                <Text variant="bodyStrong" style={styles.flex} numberOfLines={1}>
                  {localized(step.name, step.nameBn)}
                </Text>
                {step.requiresSignature ? <Icon name="finger-print" size={16} color="executive" /> : null}
              </View>
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {who}
              </Text>
              {step.status === "ACTIVE" ? (
                <Badge label={t("detail.active")} tone="info" dot />
              ) : step.status === "SKIPPED" ? (
                <Text variant="caption" color="textTertiary">{t("detail.skipped")}</Text>
              ) : step.status === "WAITING" ? (
                <Text variant="caption" color="textTertiary">{t("detail.waiting")}</Text>
              ) : null}
              {step.decidedAt ? (
                <Text variant="caption" color="textTertiary">{fmt.dateTime(step.decidedAt)}</Text>
              ) : null}
              {step.comment ? (
                <View style={[styles.quote, { borderLeftColor: c.fg, backgroundColor: theme.surfaceSecondary }]}>
                  <Text variant="bodySmall">{step.comment}</Text>
                </View>
              ) : null}
              {step.signatureHash ? (
                <Text variant="mono" color="executive" numberOfLines={1}>
                  {t("detail.signedHash", { hash: step.signatureHash.slice(0, 16) })}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.md },
  rail: { alignItems: "center", width: 28 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, marginVertical: 2 },
  body: { flex: 1, gap: 2 },
  bodyGap: { paddingBottom: Spacing.lg },
  head: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  quote: { marginTop: Spacing.xs, padding: Spacing.sm, borderLeftWidth: 3, borderRadius: 6 },
  flex: { flex: 1 },
});
