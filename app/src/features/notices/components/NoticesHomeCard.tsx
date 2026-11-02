import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, EmptyState, SectionHeader, Skeleton } from "@/components/ui";
import { Radius, Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { routes } from "@/lib/routes";
import type { NoticeListItem } from "@/types/domain/notice";
import { useGetNoticesQuery } from "../api";
import { NoticeRow } from "./NoticeRow";

/** Home card for every persona: unread / to-acknowledge counts and the top of the board. */
export function NoticesHomeCard() {
  const { t } = useTranslation(["notices", "common"]);
  const fmt = useFormat();
  const notices = useGetNoticesQuery({});
  const items = notices.data?.items ?? [];
  const unread = items.filter((n) => n.receipt && !n.receipt.readAt).length;
  const pendingAck = items.filter((n) => n.requiresAck && n.receipt && !n.receipt.ackedAt).length;
  const open = useCallback((n: NoticeListItem) => router.push(routes.notice(n.id)), []);

  return (
    <View>
      <SectionHeader title={t("title")} actionLabel={t("common:actions.viewAll")} onAction={() => router.push(routes.notices)} />
      {unread || pendingAck ? (
        <View style={styles.badges}>
          {unread ? <Badge label={t("homeCard.unread", { n: fmt.number(unread) })} tone="accent" dot /> : null}
          {pendingAck ? <Badge label={t("homeCard.pendingAck", { n: fmt.number(pendingAck) })} tone="warning" icon="hand-left-outline" /> : null}
        </View>
      ) : null}
      <View style={styles.list}>
        {notices.isLoading ? <Skeleton height={120} radius={Radius.lg} /> : null}
        {notices.data && !items.length ? <EmptyState icon="megaphone-outline" title={t("homeCard.empty")} /> : null}
        {items.slice(0, 3).map((n) => (
          <NoticeRow key={n.id} notice={n} onPress={open} compact />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  list: { gap: Spacing.md },
});
