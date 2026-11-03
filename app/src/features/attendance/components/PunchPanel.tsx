import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card, Icon, Text } from "@/components/ui";
import { Spacing, toneColors } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { openLocationSettings } from "@/lib/location/punch-location";
import type { PunchType } from "@/types/domain/attendance";
import { distanceLabel, RESULT_ICON, RESULT_TONE } from "../presentation";
import type { PunchPhase } from "../usePunchFlow";

interface Props {
  phase: PunchPhase;
  nextType: PunchType | null;
  online: boolean;
  onStart: (type: PunchType) => void;
  onConfirmOutside: () => void;
  onReset: () => void;
  onRegularise: () => void;
}

/** Punch button plus the state card for every step of the capture → verdict sequence (doc 05 §8.2). */
export function PunchPanel({ phase, nextType, online, onStart, onConfirmOutside, onReset, onRegularise }: Props) {
  const { t } = useTranslation(["attendance", "common"]);
  const theme = useTheme();
  const fmt = useFormat();
  const localized = useLocalized();
  const units = { m: t("units.m"), km: t("units.km") };

  switch (phase.kind) {
    case "idle":
      return nextType ? (
        <View style={styles.gap}>
          <Button
            title={t(nextType === "IN" ? "punch.in" : "punch.out")}
            icon={nextType === "IN" ? "log-in-outline" : "log-out-outline"}
            variant={nextType === "IN" ? "success" : "primary"}
            disabled={!online}
            onPress={() => onStart(nextType)}
            testID="punch-button"
          />
          {!online ? <Text variant="caption" color="warning" align="center">{t("punch.offline")}</Text> : null}
        </View>
      ) : (
        <Card tone="success" style={styles.row}>
          <Icon name="checkmark-circle" size={22} color="success" />
          <Text variant="bodyStrong" style={styles.flex}>{t("punch.complete")}</Text>
        </Card>
      );

    case "locating":
    case "submitting":
      return (
        <Card style={styles.row} testID="punch-busy">
          <ActivityIndicator color={theme.accent} />
          <View style={styles.flex}>
            <Text variant="bodyStrong">{t(phase.kind === "locating" ? "punch.locating" : "punch.submitting")}</Text>
            {phase.kind === "locating" && phase.accuracyM !== null ? (
              <Text variant="caption" color="textSecondary">{t("punch.accuracy", { m: fmt.number(phase.accuracyM) })}</Text>
            ) : null}
          </View>
          {phase.kind === "locating" ? <Button title={t("punch.cancel")} variant="ghost" size="sm" fullWidth={false} onPress={onReset} /> : null}
        </Card>
      );

    case "weak":
      return (
        <Notice tone="warning" icon="cellular-outline" title={t("punch.weak.title")} body={t("punch.weak.body", { m: fmt.number(phase.accuracyM) })}>
          <Button title={t("punch.retry")} icon="refresh" onPress={onReset} testID="punch-retry" />
        </Notice>
      );

    case "error":
      return (
        <Notice tone="warning" icon="location-outline" title={t(`punch.error.${phase.code}`.concat(".title") as "punch.error.TIMEOUT.title")} body={t(`punch.error.${phase.code}`.concat(".body") as "punch.error.TIMEOUT.body")}>
          {phase.code === "TIMEOUT" ? null : <Button title={t("punch.openSettings")} icon="settings-outline" variant="secondary" onPress={() => void openLocationSettings()} />}
          <Button title={t("punch.retry")} icon="refresh" onPress={onReset} testID="punch-retry" />
        </Notice>
      );

    case "outside":
      return (
        <Notice
          tone="warning"
          icon="navigate-outline"
          title={t("punch.outside.title")}
          body={t("punch.outside.body", {
            distance: distanceLabel(phase.nearest.distanceM, fmt.number, units),
            site: localized(phase.nearest.fence.name, phase.nearest.fence.nameBn),
          })}
        >
          <Button title={t("punch.outside.confirm")} icon="walk-outline" onPress={onConfirmOutside} testID="punch-field-duty" />
          <Button title={t("punch.cancel")} variant="ghost" onPress={onReset} />
        </Notice>
      );

    case "failed":
      return (
        <Notice tone="danger" icon="alert-circle-outline" title={t("punch.failed")} body="">
          <Button title={t("punch.retry")} icon="refresh" onPress={onReset} />
        </Notice>
      );

    case "result": {
      const { response } = phase;
      const tone = RESULT_TONE[response.result];
      const c = toneColors(theme, tone);
      return (
        <Card tone={tone} style={styles.gap} testID="punch-result">
          <View style={styles.row}>
            <Icon name={RESULT_ICON[response.result]} size={26} tint={c.fg} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{t(`punch.result.${response.result}`)}</Text>
              {response.geofence ? (
                <Text variant="caption" color="textSecondary">
                  {response.result === "ACCEPTED"
                    ? t("punch.inside", { site: localized(response.geofence.name, response.geofence.nameBn) })
                    : t("punch.away", { distance: distanceLabel(response.geofence.distanceM, fmt.number, units), site: localized(response.geofence.name, response.geofence.nameBn) })}
                </Text>
              ) : null}
              {response.duplicate ? <Text variant="caption" color="textSecondary">{t("punch.duplicate")}</Text> : null}
            </View>
          </View>
          {response.canRegularise ? <Button title={t("punch.regularise")} variant="secondary" icon="create-outline" onPress={onRegularise} /> : null}
          <Button title={t("common:actions.done")} variant="ghost" onPress={onReset} testID="punch-done" />
        </Card>
      );
    }
  }
}

function Notice({ tone, icon, title, body, children }: { tone: "warning" | "danger"; icon: Parameters<typeof Icon>[0]["name"]; title: string; body: string; children: React.ReactNode }) {
  const theme = useTheme();
  const c = toneColors(theme, tone);
  return (
    <Card tone={tone} style={styles.gap}>
      <View style={styles.row}>
        <Icon name={icon} size={24} tint={c.fg} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">{title}</Text>
          {body ? <Text variant="bodySmall" color="textSecondary">{body}</Text> : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  flex: { flex: 1 },
});
