import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Card, Icon, Text } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import type { InboxItem } from "@/types/domain/workflow";
import { CATEGORY_META, slaTone, URGENCY_TONE } from "../presentation";

interface InboxRowProps {
  item: InboxItem;
  onPress: (item: InboxItem) => void;
  onLongPress?: (item: InboxItem) => void;
  selecting?: boolean;
  selected?: boolean;
}

export const InboxRow = memo(function InboxRow({ item, onPress, onLongPress, selecting = false, selected = false }: InboxRowProps) {
  const theme = useTheme();
  const { t } = useTranslation("approvals");
  const fmt = useFormat();
  const localized = useLocalized();
  const { summary, step } = item;
  const cat = CATEGORY_META[summary.category];
  const catColors = toneColors(theme, cat.tone);
  const left = step.slaHoursLeft;
  const slaLabel = left <= 0 ? t("sla.overdueBy", { time: fmt.duration(left) }) : t("sla.dueIn", { time: fmt.duration(left) });
  const title = localized(summary.title, summary.titleBn);
  const requester = localized(summary.requester.name, summary.requester.nameBn);
  const amount = summary.amount ? fmt.money(summary.amount) : localized(summary.quantityLabel, summary.quantityLabelBn);

  return (
    <Card
      accent={URGENCY_TONE[summary.urgency] === "neutral" ? undefined : URGENCY_TONE[summary.urgency]}
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      accessibilityLabel={`${title}, ${requester}, ${amount}, ${slaLabel}`}
      style={[styles.card, selected && { borderColor: theme.accent, backgroundColor: theme.accentMuted }]}
      testID={`inbox-row-${item.instanceId}`}
    >
      <View style={styles.top}>
        {selecting ? (
          <View
            style={[styles.check, { borderColor: selected ? theme.accent : theme.borderStrong, backgroundColor: selected ? theme.accent : "transparent" }]}
          >
            {selected ? <Icon name="checkmark" size={14} color="onAccent" /> : null}
          </View>
        ) : (
          <View style={[styles.catIcon, { backgroundColor: catColors.bg }]}>
            <Icon name={cat.icon} size={16} tint={catColors.fg} />
          </View>
        )}
        <Text variant="mono" color="textSecondary" numberOfLines={1} style={styles.ref}>
          {summary.refNo}
        </Text>
        <Badge label={slaLabel} tone={slaTone(left)} icon="time-outline" />
      </View>

      <Text variant="bodyStrong" numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.meta}>
        <Avatar initials={summary.requester.initials} color={summary.requester.avatarColor} size={22} />
        <Text variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
          {requester} · {localized(summary.requester.department, summary.requester.departmentBn)}
        </Text>
      </View>

      <View style={[styles.bottom, { borderTopColor: theme.border }]}>
        <Text variant="h3" numberOfLines={1} style={styles.flex}>
          {amount}
        </Text>
        {item.readOnly ? <Badge label={t("readOnly")} tone="neutral" icon="eye-outline" /> : null}
        {step.requiresSignature ? <Icon name="finger-print" size={18} color="executive" /> : null}
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {localized(step.name, step.nameBn)}
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catIcon: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ref: { flex: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  bottom: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});
