import { memo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Badge, Icon, QueryState, Screen, Segmented, Text } from "@/components/ui";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/use-theme";
import { routes } from "@/lib/routes";
import type { HistoryItem, StepDecision } from "@/types/domain/workflow";
import { useGetApprovalHistoryQuery } from "../api";
import { CATEGORY_META, STATUS_TONE } from "../presentation";

type Filter = "all" | StepDecision;

/** Items the caller decided or initiated, newest first. */
export function ApprovalHistoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation("approvals");
  const [filter, setFilter] = useState<Filter>("all");
  const history = useGetApprovalHistoryQuery(filter === "all" ? {} : { decision: filter });
  const items = history.data?.items ?? [];

  return (
    <Screen title={t("history.title")} scroll={false} padded={false}>
      <FlashList
        data={items}
        keyExtractor={(i) => i.instanceId}
        renderItem={({ item }) => <HistoryRow item={item} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <Segmented<Filter>
              scrollable
              options={(["all", "APPROVED", "RETURNED", "REJECTED"] as const).map((f) => ({ value: f, label: t(`history.${f}`) }))}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <QueryState
            isLoading={history.isLoading}
            error={history.error}
            hasData={!!history.data}
            isEmpty
            onRetry={() => void history.refetch()}
            empty={{ icon: "time-outline", title: t("history.empty") }}
          >
            {null}
          </QueryState>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={history.isFetching && !history.isLoading}
            onRefresh={() => void history.refetch()}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      />
    </Screen>
  );
}

const HistoryRow = memo(function HistoryRow({ item }: { item: HistoryItem }) {
  const theme = useTheme();
  const { t } = useTranslation("approvals");
  const fmt = useFormat();
  const localized = useLocalized();
  const cat = CATEGORY_META[item.summary.category];
  const c = toneColors(theme, cat.tone);
  const title = localized(item.summary.title, item.summary.titleBn);
  return (
    <Pressable
      onPress={() => router.push(routes.approval(item.instanceId))}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${t(`status.${item.status}`)}`}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: c.bg }]}>
        <Icon name={cat.icon} size={18} tint={c.fg} />
      </View>
      <View style={styles.flex}>
        <Text variant="mono" color="textSecondary" numberOfLines={1}>{item.summary.refNo}</Text>
        <Text variant="bodyStrong" numberOfLines={2}>{title}</Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {`${item.relation === "DECIDED" ? t("history.decided") : t("history.initiated")} · ${fmt.dayTime(item.at)}`}
        </Text>
      </View>
      <View style={styles.trailing}>
        <Badge label={t(`status.${item.status}`)} tone={STATUS_TONE[item.status]} />
        {item.summary.amount ? <Text variant="caption" color="textSecondary">{fmt.money(item.summary.amount, true)}</Text> : null}
      </View>
    </Pressable>
  );
});

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  header: { paddingBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.huge },
  sep: { height: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.85 },
  icon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  trailing: { alignItems: "flex-end", gap: Spacing.xs },
});
