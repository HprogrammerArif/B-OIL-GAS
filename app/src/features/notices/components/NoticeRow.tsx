import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Badge, Card, Icon, Text } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import type { NoticeListItem } from "@/types/domain/notice";
import { CATEGORY_META, PRIORITY_TONE } from "../presentation";

interface NoticeRowProps {
  notice: NoticeListItem;
  onPress: (notice: NoticeListItem) => void;
  /** Compact rows (home card) drop the excerpt. */
  compact?: boolean;
}

export const NoticeRow = memo(function NoticeRow({ notice, onPress, compact = false }: NoticeRowProps) {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "common"]);
  const fmt = useFormat();
  const localized = useLocalized();
  const cat = CATEGORY_META[notice.category];
  const catColors = toneColors(theme, cat.tone);
  const unread = !!notice.receipt && !notice.receipt.readAt;
  const needsAck = notice.requiresAck && !!notice.receipt && !notice.receipt.ackedAt;
  const title = localized(notice.title, notice.titleBn);
  const urgent = notice.priority === "CRITICAL" || notice.priority === "HIGH";

  return (
    <Card
      onPress={() => onPress(notice)}
      accent={notice.isPinned ? "executive" : urgent ? PRIORITY_TONE[notice.priority] : undefined}
      accessibilityLabel={[title, notice.isPinned ? t("pinned") : null, unread ? t("filters.UNREAD") : null, needsAck ? t("needsAck") : null]
        .filter(Boolean)
        .join(", ")}
      style={styles.card}
      testID={`notice-row-${notice.id}`}
    >
      <View style={styles.top}>
        <View style={[styles.catIcon, { backgroundColor: catColors.bg }]}>
          <Icon name={cat.icon} size={16} tint={catColors.fg} />
        </View>
        <Text variant="caption" weight="bold" tint={catColors.fg} numberOfLines={1} style={styles.flex}>
          {t(`categories.${notice.category}`)}
        </Text>
        {notice.isPinned ? <Icon name="pin" size={14} color="executive" /> : null}
        {unread ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
      </View>

      <Text variant={unread ? "bodyStrong" : "body"} numberOfLines={2}>
        {title}
      </Text>
      {!compact ? (
        <Text variant="bodySmall" color="textSecondary" numberOfLines={2}>
          {localized(notice.excerpt, notice.excerptBn)}
        </Text>
      ) : null}

      {urgent || notice.isBroadcast || notice.requiresAck ? (
        <View style={styles.badges}>
          {urgent ? (
            <Badge label={t(`common:priority.${notice.priority}`)} tone={PRIORITY_TONE[notice.priority]} />
          ) : null}
          {notice.isBroadcast ? <Badge label={t("broadcast")} tone="executive" icon="megaphone-outline" /> : null}
          {needsAck ? <Badge label={t("needsAck")} tone="accent" icon="hand-left-outline" /> : null}
          {notice.requiresAck && notice.receipt?.ackedAt ? <Badge label={t("acked")} tone="success" icon="checkmark" /> : null}
        </View>
      ) : null}
      <Text variant="caption" color="textTertiary" numberOfLines={1}>
        {`${localized(notice.author.name, notice.author.nameBn)} · ${notice.publishAt ? fmt.dayTime(notice.publishAt) : ""}`}
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catIcon: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  dot: { width: 9, height: 9, borderRadius: 5 },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.sm },
  flex: { flex: 1 },
});
