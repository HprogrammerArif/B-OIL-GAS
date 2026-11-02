import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Divider, QueryState, Sheet, SkeletonList, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import type { NoticeReceiptRow } from "@/types/domain/notice";
import { useGetNoticeReceiptsQuery } from "../api";

/** Per-recipient read/ack list for authors and notice managers, unacknowledged first. */
export function ReceiptsSheet({ noticeId, onClose }: { noticeId: string; onClose: () => void }) {
  const { t } = useTranslation("notices");
  const fmt = useFormat();
  const query = useGetNoticeReceiptsQuery(noticeId);
  const data = query.data;
  const others = data ? Math.max(data.recipientCount - data.rows.length, 0) : 0;

  return (
    <Sheet visible onClose={onClose} title={t("receipts.title")}
      subtitle={data ? t("readProgress", { read: fmt.number(data.readCount), total: fmt.number(data.recipientCount) }) : undefined}>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        hasData={!!data}
        isEmpty={!!data && !data.rows.length}
        onRetry={() => void query.refetch()}
        skeleton={<SkeletonList rows={4} />}
        empty={{ icon: "people-outline", title: t("receipts.empty") }}
      >
        {data ? (
          <View>
            {data.rows.map((row, i) => (
              <View key={row.person.id}>
                {i > 0 ? <Divider /> : null}
                <ReceiptRow row={row} />
              </View>
            ))}
            {others ? (
              <Text variant="caption" color="textTertiary" style={styles.others}>{t("receipts.others", { n: fmt.number(others) })}</Text>
            ) : null}
          </View>
        ) : null}
      </QueryState>
    </Sheet>
  );
}

function ReceiptRow({ row }: { row: NoticeReceiptRow }) {
  const { t } = useTranslation("notices");
  const fmt = useFormat();
  const localized = useLocalized();
  const status = row.ackedAt
    ? { label: t("receipts.acked", { time: fmt.ago(row.ackedAt) }), tone: "success" as const }
    : row.readAt
      ? { label: t("receipts.read", { time: fmt.ago(row.readAt) }), tone: "info" as const }
      : { label: t("receipts.notRead"), tone: "warning" as const };
  return (
    <View style={styles.row}>
      <Avatar initials={row.person.initials} color={row.person.avatarColor} size={32} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>{localized(row.person.name, row.person.nameBn)}</Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>{localized(row.person.department, row.person.departmentBn)}</Text>
      </View>
      <Badge label={status.label} tone={status.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm },
  flex: { flex: 1 },
  others: { marginTop: Spacing.md },
});
