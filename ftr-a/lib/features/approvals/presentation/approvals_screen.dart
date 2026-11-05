import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { pending, history }

/// Approvals Center: requests waiting for me, and what I have decided.
class ApprovalsScreen extends ConsumerStatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  ConsumerState<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends ConsumerState<ApprovalsScreen> {
  _Tab _tab = _Tab.pending;
  ApprovalCategory? _category;
  final Set<String> _selected = {};
  bool _busy = false;

  void _refreshAll() {
    ref
      ..invalidate(approvalInboxProvider)
      ..invalidate(approvalSummaryProvider)
      ..invalidate(approvalHistoryProvider);
  }

  Future<void> _refresh() async {
    _refreshAll();
    await ref.read(approvalInboxProvider.future);
  }

  void _toggle(InboxItem item) {
    setState(() {
      if (!_selected.add(item.instanceId)) _selected.remove(item.instanceId);
    });
  }

  Future<void> _approveSelected() async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.approvalBatchConfirm(_selected.length),
      message: l10n.approvalBatchMessage,
      confirmLabel: l10n.approvalActApprove,
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    try {
      final r = await ref
          .read(approvalRepositoryProvider)
          .approveMany(_selected.toList());
      _refreshAll();
      if (!mounted) return;
      setState(_selected.clear);
      AppToast.show(
        context,
        r.failed == 0
            ? l10n.approvalBatchDone(r.approved)
            : l10n.approvalBatchPartial(r.approved, r.failed),
        tone: r.failed == 0 ? StatusTone.success : StatusTone.warning,
      );
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.approvalErrFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final selecting = _selected.isNotEmpty;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          selecting
              ? l10n.approvalSelected(_selected.length)
              : l10n.approvalsTitle,
        ),
        leading: selecting
            ? IconButton(
                icon: const Icon(Icons.close),
                tooltip: l10n.commonCancel,
                onPressed: () => setState(_selected.clear),
              )
            : null,
        actions: const [AppBarActions()],
      ),
      bottomNavigationBar: selecting
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(Space.lg),
                child: PrimaryButton(
                  label: l10n.approvalApproveSelected(_selected.length),
                  icon: Icons.done_all,
                  loading: _busy,
                  onPressed: () => unawaited(_approveSelected()),
                ),
              ),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.sm,
            ),
            child: Row(
              children: [
                ChoiceChip(
                  label: Text(l10n.approvalTabPending),
                  selected: _tab == _Tab.pending,
                  onSelected: (_) => setState(() => _tab = _Tab.pending),
                ),
                const SizedBox(width: Space.sm),
                ChoiceChip(
                  label: Text(l10n.approvalTabHistory),
                  selected: _tab == _Tab.history,
                  onSelected: (_) => setState(() {
                    _tab = _Tab.history;
                    _selected.clear();
                  }),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: _tab == _Tab.pending
                  ? _PendingList(
                      category: _category,
                      onCategory: (c) => setState(() => _category = c),
                      selected: _selected,
                      onToggle: _toggle,
                    )
                  : const _HistoryList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingList extends ConsumerWidget {
  const _PendingList({
    required this.category,
    required this.onCategory,
    required this.selected,
    required this.onToggle,
  });

  final ApprovalCategory? category;
  final ValueChanged<ApprovalCategory?> onCategory;
  final Set<String> selected;
  final ValueChanged<InboxItem> onToggle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final inbox = ref.watch(approvalInboxProvider);
    final summary = ref.watch(approvalSummaryProvider).value;
    return inbox.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(approvalInboxProvider)),
      data: (all) {
        if (all.isEmpty) {
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              const SizedBox(height: Space.xxxl),
              EmptyState(
                icon: Icons.task_alt,
                title: l10n.approvalEmptyTitle,
                message: l10n.approvalEmptyMessage,
              ),
            ],
          );
        }
        final categories = {for (final i in all) i.category}.toList()
          ..sort((a, b) => a.index.compareTo(b.index));
        final items = [
          for (final i in all)
            if (category == null || i.category == category) i,
        ];
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: Space.xxxl),
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.lg),
              child: Text(
                summary != null && summary.breached > 0
                    ? l10n.approvalVerdictOverdue(
                        summary.pending,
                        summary.breached,
                      )
                    : l10n.approvalVerdict(all.length),
                style: theme.textTheme.titleMedium,
              ),
            ),
            if (categories.length > 1)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.sm,
                ),
                child: Row(
                  children: [
                    FilterChip(
                      label: Text(l10n.approvalCatAll),
                      selected: category == null,
                      onSelected: (_) => onCategory(null),
                    ),
                    for (final c in categories) ...[
                      const SizedBox(width: Space.sm),
                      FilterChip(
                        label: Text(categoryLabel(l10n, c)),
                        selected: category == c,
                        onSelected: (_) => onCategory(c),
                      ),
                    ],
                  ],
                ),
              ),
            for (final i in items)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.xs,
                ),
                child: _InboxCard(
                  item: i,
                  selected: selected.contains(i.instanceId),
                  selecting: selected.isNotEmpty,
                  onToggle: () => onToggle(i),
                ),
              ),
            if (selected.isEmpty && items.any((i) => i.batchable))
              Padding(
                padding: const EdgeInsets.all(Space.lg),
                child: Text(
                  l10n.approvalBatchHint,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _InboxCard extends StatelessWidget {
  const _InboxCard({
    required this.item,
    required this.selected,
    required this.selecting,
    required this.onToggle,
  });

  final InboxItem item;
  final bool selected;
  final bool selecting;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final s = item.summary;
    return Card(
      color: selected ? theme.colorScheme.primaryContainer : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.md),
        onTap: selecting
            ? (item.batchable ? onToggle : null)
            : () => unawaited(
                context.push(AppRoutes.approvalDetail(item.instanceId)),
              ),
        onLongPress: item.batchable ? onToggle : null,
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (selecting)
                    Padding(
                      padding: const EdgeInsets.only(right: Space.sm),
                      child: Icon(
                        selected
                            ? Icons.check_circle
                            : item.batchable
                            ? Icons.radio_button_unchecked
                            : Icons.block,
                        size: 20,
                      ),
                    ),
                  Expanded(
                    child: Text(
                      s.displayTitle(bangla: bangla),
                      style: theme.textTheme.titleSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (s.amount != null)
                    Text(
                      taka(s.amount!, bangla: bangla),
                      style: theme.textTheme.titleSmall,
                    ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                l10n.approvalFrom(
                  item.initiator.display(bangla: bangla),
                  relativeTime(
                    l10n,
                    item.submittedAt,
                    Localizations.localeOf(context).languageCode,
                  ),
                ),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: Space.sm),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.xs,
                children: [
                  StatusPill(label: categoryLabel(l10n, item.category)),
                  if (item.sla != SlaState.ok)
                    StatusPill(
                      label: slaLabel(l10n, item.sla),
                      tone: slaTone(item.sla),
                    ),
                  if (s.urgent)
                    StatusPill(
                      label: l10n.approvalUrgent,
                      tone: StatusTone.danger,
                    ),
                  if (item.viaDelegation)
                    StatusPill(
                      label: l10n.approvalDelegatedToYou,
                      tone: StatusTone.info,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HistoryList extends ConsumerWidget {
  const _HistoryList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final history = ref.watch(approvalHistoryProvider);
    return history.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(approvalHistoryProvider)),
      data: (items) => items.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: Space.xxxl),
                EmptyState(
                  icon: Icons.history,
                  title: l10n.approvalHistoryEmptyTitle,
                  message: l10n.approvalHistoryEmptyMessage,
                ),
              ],
            )
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: Space.xxxl),
              children: [
                for (final h in items)
                  ListRow(
                    title: h.summary.displayTitle(bangla: bangla),
                    subtitle: [
                      relativeTime(l10n, h.at, lang),
                      if (h.decision == null)
                        requestStatusLabel(l10n, h.instanceStatus),
                      if (h.comment != null && h.comment!.isNotEmpty)
                        '“${h.comment}”',
                    ].join(' · '),
                    trailing: StatusPill(
                      label: decisionLabel(l10n, h.decision),
                      tone: decisionTone(h.decision),
                    ),
                    onTap: () => unawaited(
                      context.push(AppRoutes.approvalDetail(h.instanceId)),
                    ),
                  ),
              ],
            ),
    );
  }
}
