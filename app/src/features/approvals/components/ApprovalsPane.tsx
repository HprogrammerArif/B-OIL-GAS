import { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, QueryState, SearchBar, Segmented, Sheet, StatCard, Text } from "@/components/ui";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useFormat } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { useTheme } from "@/hooks/use-theme";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { haptic } from "@/lib/haptics";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { InboxItem, InboxQuery } from "@/types/domain/workflow";
import { useBatchApproveMutation, useGetInboxQuery, useGetInboxSummaryQuery } from "../api";
import { CATEGORY_FILTERS, type CategoryFilter } from "../presentation";
import { InboxRow } from "./InboxRow";

type SlaFilter = "any" | NonNullable<InboxQuery["sla"]>;
type InboxView = NonNullable<InboxQuery["view"]>;

/** Approvals segment of the Inbox tab (doc 05 §9.1); batch approval is opt-in via long-press. */
export function ApprovalsPane() {
  const theme = useTheme();
  const { t } = useTranslation(["approvals", "common", "errors"]);
  const fmt = useFormat();
  const perms = usePermissions();
  const online = useIsOnline();
  const [view, setView] = useState<InboxView>("mine");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [sla, setSla] = useState<SlaFilter>("any");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const args: InboxQuery = {
    view,
    category: category === "ALL" ? undefined : category,
    sla: sla === "any" ? undefined : sla,
    q: q.length >= 2 ? q : undefined,
  };
  const inbox = useGetInboxQuery(args);
  const summary = useGetInboxSummaryQuery();
  const [batchApprove, batch] = useBatchApproveMutation();
  const pull = usePullToRefresh(inbox.refetch, summary.refetch);

  const items = useMemo(() => inbox.data?.items ?? [], [inbox.data]);
  const selecting = selected.size > 0;
  const selectedItems = items.filter((i) => selected.has(i.instanceId));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + (i.summary.amount ? Number(i.summary.amount) : 0), 0);

  const toggle = useCallback((item: InboxItem) => {
    if (item.readOnly || item.step.requiresSignature) return;
    haptic.tap();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.instanceId)) next.delete(item.instanceId);
      else next.add(item.instanceId);
      return next;
    });
  }, []);

  const open = useCallback(
    (item: InboxItem) => {
      if (selecting) toggle(item);
      else router.push(routes.approval(item.instanceId));
    },
    [selecting, toggle],
  );

  const runBatch = async () => {
    try {
      const { results } = await batchApprove({ instanceIds: [...selected] }).unwrap();
      const ok = results.filter((r) => r.ok).length;
      const failed = results.length - ok;
      if (failed) toast.info(t("batch.partial", { ok, failed }));
      else toast.success(t("batch.done", { ok }));
      setSelected(new Set());
      setConfirming(false);
    } catch (err) {
      toast.error(t(errorMessageKey(toApiError(err)) as "errors:generic"));
    }
  };

  const s = summary.data;
  const header = (
    <View style={styles.header}>
      {s ? (
        <View style={styles.stats}>
          <StatCard label={t("summary.pending")} value={fmt.number(s.pending)} icon="file-tray-full-outline" tone="accent"
            hint={s.breached ? t("summary.overdue", { count: s.breached }) : undefined} />
          <StatCard label={t("summary.value")} value={fmt.money(s.totalAmount, true)} icon="cash-outline" tone="executive"
            hint={s.breachingIn12h ? `${t("summary.dueSoon")}: ${fmt.number(s.breachingIn12h)}` : undefined} />
        </View>
      ) : null}
      {perms.can("workflow:view-all") ? (
        <Segmented<InboxView>
          options={[{ value: "mine", label: t("views.mine") }, { value: "all", label: t("views.all") }]}
          value={view}
          onChange={(v) => {
            setSelected(new Set());
            setView(v);
          }}
        />
      ) : null}
      <SearchBar value={search} onChangeText={setSearch} placeholder={t("searchPlaceholder")} testID="inbox-search" />
      <Segmented<CategoryFilter>
        scrollable
        options={CATEGORY_FILTERS.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
        value={category}
        onChange={setCategory}
      />
      <Segmented<SlaFilter>
        scrollable
        options={(["any", "breached", "12h", "24h"] as const).map((v) => ({ value: v, label: t(`sla.${v}`) }))}
        value={sla}
        onChange={setSla}
      />
      {items.length > 1 && !selecting && view === "mine" ? (
        <Text variant="caption" color="textTertiary">{t("batch.hint")}</Text>
      ) : null}
    </View>
  );

  const filtered = !!(args.category || args.sla || args.q);

  return (
    <View style={styles.flex}>
      <FlashList
        data={inbox.data ? items : []}
        keyExtractor={(i) => i.instanceId}
        renderItem={({ item }) => (
          <InboxRow
            item={item}
            onPress={open}
            onLongPress={online && view === "mine" ? toggle : undefined}
            selecting={selecting}
            selected={selected.has(item.instanceId)}
          />
        )}
        extraData={selected}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <QueryState
            isLoading={inbox.isLoading}
            error={inbox.error}
            hasData={!!inbox.data}
            isEmpty
            onRetry={() => void inbox.refetch()}
            empty={{
              icon: "checkmark-done-circle-outline",
              title: filtered ? t("empty.filtered") : t("empty.title"),
              message: filtered ? undefined : t("empty.message"),
            }}
          >
            {null}
          </QueryState>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      />

      {selecting ? (
        <View style={[styles.batchBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={t("common:actions.cancel")} variant="ghost" onPress={() => setSelected(new Set())} />
          <Button
            title={t("batch.approve", { count: selected.size })}
            variant="success"
            icon="checkmark-done"
            onPress={() => setConfirming(true)}
            style={styles.flex}
            disabled={!online}
          />
        </View>
      ) : null}

      <Sheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        dismissable={!batch.isLoading}
        title={t("batch.title", { count: selected.size })}
        subtitle={t("batch.message", { amount: fmt.money(selectedTotal) })}
        footer={
          <Button title={t("batch.approve", { count: selected.size })} variant="success" icon="checkmark-done" fullWidth
            loading={batch.isLoading} onPress={() => void runBatch()} />
        }
      >
        {selectedItems.map((i) => (
          <Text key={i.instanceId} variant="bodySmall" numberOfLines={1}>
            {`${i.summary.refNo} · ${i.summary.amount ? fmt.money(i.summary.amount) : "—"}`}
          </Text>
        ))}
      </Sheet>
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.md, paddingBottom: Spacing.md },
  stats: { flexDirection: "row", gap: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.huge },
  sep: { height: Spacing.md },
  batchBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
});
