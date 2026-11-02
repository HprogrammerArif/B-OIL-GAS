import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { IconButton, QueryState, Screen, SearchBar, Segmented } from "@/components/ui";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePermissions } from "@/hooks/usePermission";
import { useTheme } from "@/hooks/use-theme";
import { routes } from "@/lib/routes";
import type { NoticeListItem, NoticeQuery } from "@/types/domain/notice";
import { useGetNoticesQuery } from "../api";
import { NoticeRow } from "../components/NoticeRow";
import { NOTICE_FILTERS, type NoticeFilter } from "../presentation";

function toQuery(filter: NoticeFilter, q: string): NoticeQuery {
  const search = q.length >= 2 ? q : undefined;
  if (filter === "ALL") return { q: search };
  if (filter === "UNREAD") return { unread: true, q: search };
  if (filter === "ACK") return { requiresAck: true, q: search };
  return { category: filter, q: search };
}

/** Notice board (doc 05 §9.2): pinned first, filters, search; publishers get compose and broadcast actions. */
export function NoticesScreen() {
  const theme = useTheme();
  const { t } = useTranslation(["notices", "common"]);
  const perms = usePermissions();
  const [filter, setFilter] = useState<NoticeFilter>("ALL");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const args = toQuery(filter, q);
  const notices = useGetNoticesQuery(args);
  const pull = usePullToRefresh(notices.refetch);
  const open = useCallback((n: NoticeListItem) => router.push(routes.notice(n.id)), []);
  const filtered = filter !== "ALL" || !!args.q;

  const headerRight = (
    <>
      {perms.can("notices:broadcast") ? (
        <IconButton icon="megaphone-outline" color="executive" accessibilityLabel={t("actions.broadcast")} onPress={() => router.push(routes.broadcast)} />
      ) : null}
      {perms.can("notices:publish") ? (
        <IconButton icon="add-circle-outline" color="accent" accessibilityLabel={t("actions.compose")} onPress={() => router.push(routes.composeNotice)} />
      ) : null}
    </>
  );

  return (
    <Screen title={t("title")} headerRight={headerRight} scroll={false} padded={false}>
      <FlashList
        data={notices.data?.items ?? []}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NoticeRow notice={item} onPress={open} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <OfflineBanner />
            <SearchBar value={search} onChangeText={setSearch} placeholder={t("searchPlaceholder")} testID="notices-search" />
            <Segmented<NoticeFilter>
              scrollable
              options={NOTICE_FILTERS.map((f) => ({ value: f, label: t(`filters.${f}`) }))}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <QueryState
            isLoading={notices.isLoading}
            error={notices.error}
            hasData={!!notices.data}
            isEmpty
            onRetry={() => void notices.refetch()}
            empty={{
              icon: "megaphone-outline",
              title: filtered ? t("empty.filtered") : t("empty.title"),
              message: filtered ? undefined : t("empty.message"),
            }}
          >
            {null}
          </QueryState>
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  header: { gap: Spacing.md, paddingBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.huge },
  sep: { height: Spacing.md },
});
