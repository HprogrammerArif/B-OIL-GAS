import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/note_sheets/data/note_sheet_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_providers.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/signature_sheet.dart';
import 'package:bogcl_oneops/features/workflow/data/workflow_trail.dart';
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

enum _SortMode { sla, amount, date, requester }

/// Approvals Center (MOD-17):
/// Search, category live counts, 4-way sorting, multi-select batch approval,
/// and structured return/reject modal.
class ApprovalsScreen extends ConsumerStatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  ConsumerState<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends ConsumerState<ApprovalsScreen> {
  _Tab _tab = _Tab.pending;
  ApprovalCategory? _category;
  String _search = '';
  _SortMode _sort = _SortMode.sla;
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
    Haptics.tap();
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
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final selecting = _selected.isNotEmpty;
    final inbox = ref.watch(approvalInboxProvider).value ?? const [];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          selecting
              ? l10n.approvalSelected(_selected.length)
              : (bangla ? 'অনুমোদন কেন্দ্র' : 'Approvals Center'),
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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Primary Mode Tabs (Pending vs History) ───────────────────
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ChoiceChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                            bangla
                                ? 'অপেক্ষমাণ (${inbox.length})'
                                : 'Pending (${inbox.length})',
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _tab == _Tab.pending,
                          onSelected: (_) =>
                              setState(() => _tab = _Tab.pending),
                        ),
                        const SizedBox(width: Space.sm),
                        ChoiceChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                            bangla ? 'ইতিহাস' : 'History',
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _tab == _Tab.history,
                          onSelected: (_) => setState(() {
                            _tab = _Tab.history;
                            _selected.clear();
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: Space.xs),
                // Sort menu (pending tab only)
                if (_tab == _Tab.pending)
                  PopupMenuButton<_SortMode>(
                    icon: const Icon(Icons.sort, size: 20),
                    tooltip: bangla ? 'সাজান' : 'Sort',
                    initialValue: _sort,
                    onSelected: (mode) {
                      Haptics.tap();
                      setState(() => _sort = mode);
                    },
                    itemBuilder: (ctx) => [
                      PopupMenuItem(
                        value: _SortMode.sla,
                        child: Text(
                          bangla
                              ? 'জরুরি এসএলএ (আগে)'
                              : 'SLA Urgency (Soonest)',
                        ),
                      ),
                      PopupMenuItem(
                        value: _SortMode.amount,
                        child: Text(
                          bangla
                              ? 'টাকার পরিমাণ (সর্বোচ্চ)'
                              : 'Value (Highest BDT)',
                        ),
                      ),
                      PopupMenuItem(
                        value: _SortMode.date,
                        child: Text(
                          bangla
                              ? 'জমার তারিখ (নতুন)'
                              : 'Date Submitted (Newest)',
                        ),
                      ),
                      PopupMenuItem(
                        value: _SortMode.requester,
                        child: Text(
                          bangla ? 'আবেদনকারী (A–Z)' : 'Requester (A–Z)',
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),

          // ── Search Field ─────────────────────────────────────────────
          if (_tab == _Tab.pending)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.lg,
                vertical: 2,
              ),
              child: SizedBox(
                height: 40,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: bangla
                        ? 'শিরোনাম, আবেদনকারী বা রেফারেন্স খুঁজুন...'
                        : 'Search title, requester, or reference...',
                    hintStyle: const TextStyle(fontSize: 12),
                    prefixIcon: const Icon(Icons.search, size: 18),
                    contentPadding: EdgeInsets.zero,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(Corner.md),
                      borderSide: BorderSide(color: scheme.outlineVariant),
                    ),
                  ),
                  onChanged: (v) =>
                      setState(() => _search = v.trim().toLowerCase()),
                ),
              ),
            ),

          // ── Tab Content ───────────────────────────────────────────────
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: _tab == _Tab.pending
                  ? _PendingList(
                      category: _category,
                      search: _search,
                      sort: _sort,
                      onCategory: (c) => setState(() => _category = c),
                      selected: _selected,
                      onToggle: _toggle,
                      onSelectAll: (items) {
                        Haptics.tap();
                        setState(() {
                          if (_selected.length == items.length) {
                            _selected.clear();
                          } else {
                            _selected.addAll(items.map((i) => i.instanceId));
                          }
                        });
                      },
                    )
                  : const _HistoryList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING LIST
// ─────────────────────────────────────────────────────────────────────────────

class _PendingList extends ConsumerWidget {
  const _PendingList({
    required this.category,
    required this.search,
    required this.sort,
    required this.onCategory,
    required this.selected,
    required this.onToggle,
    required this.onSelectAll,
  });

  final ApprovalCategory? category;
  final String search;
  final _SortMode sort;
  final ValueChanged<ApprovalCategory?> onCategory;
  final Set<String> selected;
  final ValueChanged<InboxItem> onToggle;
  final ValueChanged<List<InboxItem>> onSelectAll;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final inbox = ref.watch(approvalInboxProvider);

    return inbox.when(
      loading: () => const SkeletonList(),
      error: (err, stack) {
        debugPrint('ApprovalInbox error: $err\n$stack');
        return ErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(approvalInboxProvider),
        );
      },
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

        // Filter
        final items = all.where((i) {
          if (category != null && i.category != category) return false;
          if (search.isNotEmpty) {
            final t = i.summary.displayTitle(bangla: bangla).toLowerCase();
            final req = i.initiator.display(bangla: bangla).toLowerCase();
            final refCode = i.summary.refNo.toLowerCase();
            if (!t.contains(search) &&
                !req.contains(search) &&
                !refCode.contains(search)) {
              return false;
            }
          }
          return true;
        }).toList();

        // Sort
        switch (sort) {
          case _SortMode.sla:
            items.sort((a, b) => b.sla.index.compareTo(a.sla.index));
          case _SortMode.amount:
            items.sort(
              (a, b) =>
                  (b.summary.amount ?? 0).compareTo(a.summary.amount ?? 0),
            );
          case _SortMode.date:
            items.sort((a, b) => b.submittedAt.compareTo(a.submittedAt));
          case _SortMode.requester:
            items.sort((a, b) => a.initiator.name.compareTo(b.initiator.name));
        }

        final categories = {for (final i in all) i.category}.toList()
          ..sort((a, b) => a.index.compareTo(b.index));

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: Space.xxxl),
          children: [
            // ── Category Filter Chips with Live Badge Counts ──────────
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: Space.lg,
                vertical: Space.xs,
              ),
              child: Row(
                children: [
                  FilterChip(
                    label: Text(
                      bangla ? 'সকল (${all.length})' : 'All (${all.length})',
                      style: const TextStyle(fontSize: 12),
                    ),
                    selected: category == null,
                    onSelected: (_) {
                      Haptics.tap();
                      onCategory(null);
                    },
                  ),
                  for (final c in categories) ...[
                    const SizedBox(width: Space.xs),
                    FilterChip(
                      label: Text(
                        '${categoryLabel(l10n, c)} (${all.where((x) => x.category == c).length})',
                        style: const TextStyle(fontSize: 12),
                      ),
                      selected: category == c,
                      onSelected: (_) {
                        Haptics.tap();
                        onCategory(c);
                      },
                    ),
                  ],
                ],
              ),
            ),

            // ── Select-all header when in multi-select mode ───────────
            if (selected.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.xs,
                ),
                child: Row(
                  children: [
                    Text(
                      bangla
                          ? '${selected.length}টি নির্বাচিত'
                          : '${selected.length} selected',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => onSelectAll(items),
                      child: Text(
                        selected.length == items.length
                            ? (bangla ? 'বাছাই বাতিল' : 'Deselect All')
                            : (bangla
                                  ? 'সব নির্বাচন'
                                  : 'Select All (${items.length})'),
                      ),
                    ),
                  ],
                ),
              ),

            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: Space.xxl),
                child: EmptyState(
                  icon: Icons.search_off,
                  title: bangla
                      ? 'কোনো অনুরোধ পাওয়া যায়নি'
                      : 'No requests found',
                  message: bangla
                      ? 'ফিল্টার বা অনুসন্ধান পরিবর্তন করে চেষ্টা করুন।'
                      : 'Try clearing the search or category filter.',
                ),
              ),

            for (var idx = 0; idx < items.length; idx++)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.xs,
                ),
                child: _InboxCard(
                  item: items[idx],
                  index: idx,
                  allItems: items,
                  selected: selected.contains(items[idx].instanceId),
                  selecting: selected.isNotEmpty,
                  onToggle: () => onToggle(items[idx]),
                ),
              ),
          ],
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INBOX CARD  — tags-first, full-width title, footer line
// ─────────────────────────────────────────────────────────────────────────────

class _InboxCard extends StatelessWidget {
  const _InboxCard({
    required this.item,
    required this.index,
    required this.allItems,
    required this.selected,
    required this.selecting,
    required this.onToggle,
  });

  final InboxItem item;
  final int index;
  final List<InboxItem> allItems;
  final bool selected;
  final bool selecting;
  final VoidCallback onToggle;

  /// Left-border SLA accent colour.
  Color _accentFor(SlaState s) => switch (s) {
    SlaState.ok => Colors.teal,
    SlaState.warn => Colors.amber.shade700,
    SlaState.danger || SlaState.overdue => Colors.red.shade700,
  };

  void _openDetailSheet(BuildContext context) {
    Haptics.tap();
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) =>
            _ApprovalDetailModal(initialIndex: index, items: allItems),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final s = item.summary;
    final accent = _accentFor(item.sla);

    return Card(
      elevation: 0,
      color: selected
          ? theme.colorScheme.primaryContainer.withValues(alpha: 0.6)
          : theme.colorScheme.surface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Corner.md + 2),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: accent),
            Expanded(
              child: InkWell(
                onTap: selecting
                    ? (item.batchable ? onToggle : null)
                    : () => _openDetailSheet(context),
                onLongPress: item.batchable ? onToggle : null,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.md,
                    Space.sm,
                    Space.md,
                    Space.md,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Row 1: Tags (Wrap prevents horizontal overflow) ────
                      Wrap(
                        spacing: Space.xs,
                        runSpacing: Space.xs,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (selecting)
                            Padding(
                              padding: const EdgeInsets.only(right: Space.xs),
                              child: Icon(
                                selected
                                    ? Icons.check_circle
                                    : (item.batchable
                                          ? Icons.radio_button_unchecked
                                          : Icons.block),
                                size: 18,
                                color: selected
                                    ? theme.colorScheme.primary
                                    : theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
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
                      const SizedBox(height: Space.xs),

                      // ── Row 2: Title ───────────────────────────────────────
                      Text(
                        s.displayTitle(bangla: bangla),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: Space.xs),

                      // ── Row 3: Requester · time + amount ───────────────────
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.initiator.display(bangla: bangla)} · ${relativeTime(l10n, item.submittedAt, bangla ? "bn" : "en")}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (s.amount != null) ...[
                            const SizedBox(width: Space.xs),
                            Text(
                              taka(s.amount!, bangla: bangla),
                              style: theme.textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.teal.shade800,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL DETAIL MODAL — functional E-Sign & Return, selectable remark chips
// ─────────────────────────────────────────────────────────────────────────────

class _ApprovalDetailModal extends ConsumerStatefulWidget {
  const _ApprovalDetailModal({required this.initialIndex, required this.items});

  final int initialIndex;
  final List<InboxItem> items;

  @override
  ConsumerState<_ApprovalDetailModal> createState() =>
      _ApprovalDetailModalState();
}

class _ApprovalDetailModalState extends ConsumerState<_ApprovalDetailModal> {
  late int _curIndex = widget.initialIndex;
  String? _selectedRemark;
  bool _acting = false;

  List<String> _remarkPresets(bool bangla) => bangla
      ? const [
          'প্রস্তাবিতভাবে অনুমোদিত',
          'ত্রৈমাসিক বাজেটের মধ্যে ক্লিয়ার্ড',
          'স্ট্যান্ডার্ড কিউসি সাপেক্ষে',
        ]
      : const [
          'Approved as proposed',
          'Cleared within quarterly budget',
          'Subject to standard QC inspection',
        ];

  List<String> _returnReasons(bool bangla) => bangla
      ? const [
          'বাজেট বা কস্ট সেন্টার সমস্যা',
          'সংশ্লিষ্ট কোটেশন / চালান অনুপস্থিত',
          'কারিগরি স্পেসিফিকেশন স্পষ্টকরণ প্রয়োজন',
          'নীতি বা অনুমোদিত সিলিং অতিক্রম',
          'পরবর্তী ত্রৈমাসিকে স্থগিত',
        ]
      : const [
          'Budget / Cost Center Issue',
          'Missing Supporting Quotation / Challan',
          'Technical Specification Clarification',
          'Policy / Entitlement Ceiling Exceeded',
          'Defer to Next Quarter',
        ];

  Future<void> _decide(
    BuildContext host,
    InboxItem item,
    _DeskIntent intent,
  ) async {
    final l10n = host.l10n;
    final bangla = host.isBangla;
    final refLabel = item.summary.refNo.isNotEmpty
        ? item.summary.refNo
        : item.summary.displayTitle(bangla: bangla);
    final navigator = Navigator.of(host);
    final draft = await showSignatureCapture(
      host,
      title: switch (intent) {
        _DeskIntent.approve => l10n.nsSignTitle,
        _DeskIntent.returnForChanges => l10n.nsReturnTitle,
        _DeskIntent.reject => l10n.nsRejectTitle,
      },
      subtitle: l10n.nsSignIntro(refLabel),
      initialComment: intent == _DeskIntent.approve ? _selectedRemark : null,
      reasonRequired: intent != _DeskIntent.approve,
      reasonPresets: intent == _DeskIntent.approve
          ? const []
          : _returnReasons(bangla),
      confirmLabel: switch (intent) {
        _DeskIntent.approve => l10n.nsSignConfirm,
        _DeskIntent.returnForChanges => l10n.nsSignReturnConfirm,
        _DeskIntent.reject => l10n.nsSignRejectConfirm,
      },
    );
    if (draft == null || !mounted || !host.mounted) return;
    setState(() => _acting = true);
    try {
      final approvals = ref.read(approvalRepositoryProvider);
      if (intent == _DeskIntent.approve && item.objectType == 'NoteSheet') {
        await ref
            .read(noteSheetRepositoryProvider)
            .sign(
              item.objectId,
              method: draft.method,
              otp: draft.otp,
              typedName: draft.typedName,
              imageFileId: draft.imageFileId,
              comment: draft.comment,
            );
      } else if (intent == _DeskIntent.approve) {
        await approvals.approve(
          item.instanceId,
          comment: draft.comment,
          signature: draft.toJson(),
        );
      } else if (intent == _DeskIntent.returnForChanges) {
        await approvals.returnForChanges(
          item.instanceId,
          comment: draft.comment ?? '',
          signature: draft.toJson(),
        );
      } else {
        await approvals.reject(
          item.instanceId,
          comment: draft.comment ?? '',
          signature: draft.toJson(),
        );
      }
      ref
        ..invalidate(approvalInboxProvider)
        ..invalidate(approvalHistoryProvider)
        ..invalidate(approvalSummaryProvider)
        ..invalidate(approvalDetailProvider)
        ..invalidate(workflowTrailProvider)
        ..invalidate(noteSheetDetailProvider)
        ..invalidate(noteSheetsProvider);
      if (!mounted) return;
      navigator.pop();
      Haptics.tap();
      final (message, tone) = switch (intent) {
        _DeskIntent.approve => (
          item.objectType == 'NoteSheet'
              ? l10n.nsSignedFinal
              : l10n.approvalDoneApproved,
          StatusTone.success,
        ),
        _DeskIntent.returnForChanges => (
          l10n.approvalDoneReturned,
          StatusTone.warning,
        ),
        _DeskIntent.reject => (l10n.approvalDoneRejected, StatusTone.danger),
      };
      AppToast.show(context, message, tone: tone);
    } on ApiException catch (e) {
      if (!mounted) return;
      final otpWrong = e.fieldErrors.keys.any((k) => k.endsWith('otp'));
      AppToast.show(
        context,
        otpWrong
            ? l10n.nsSignErrOtpWrong
            : e.message.isNotEmpty
            ? e.message
            : l10n.approvalErrFailed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final item = widget.items[_curIndex];
    final s = item.summary;
    final presets = _remarkPresets(bangla);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.88,
      maxChildSize: 0.95,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.xs,
          Space.lg,
          Space.xxxl,
        ),
        children: [
          // ── Section 1: Navigation Header ─────────────────────────────
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                visualDensity: VisualDensity.compact,
                onPressed: _curIndex > 0
                    ? () {
                        Haptics.tap();
                        setState(() {
                          _curIndex--;
                          _selectedRemark = null;
                        });
                      }
                    : null,
              ),
              Text(
                '${_curIndex + 1} ${bangla ? "এর" : "of"} ${widget.items.length}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                visualDensity: VisualDensity.compact,
                onPressed: _curIndex < widget.items.length - 1
                    ? () {
                        Haptics.tap();
                        setState(() {
                          _curIndex++;
                          _selectedRemark = null;
                        });
                      }
                    : null,
              ),
              const Spacer(),
              // SLA badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color:
                      item.sla == SlaState.danger ||
                          item.sla == SlaState.overdue
                      ? Colors.red.shade50
                      : scheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color:
                        item.sla == SlaState.danger ||
                            item.sla == SlaState.overdue
                        ? Colors.red.shade300
                        : scheme.outlineVariant,
                  ),
                ),
                child: Text(
                  item.sla == SlaState.danger || item.sla == SlaState.overdue
                      ? (bangla ? '⏰ জরুরি' : '⏰ DUE SOON')
                      : (bangla ? '✓ স্বাভাবিক' : '✓ Normal SLA'),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color:
                        item.sla == SlaState.danger ||
                            item.sla == SlaState.overdue
                        ? Colors.red.shade800
                        : Colors.teal.shade800,
                  ),
                ),
              ),
            ],
          ),

          const Divider(height: Space.md),

          // ── Section 2: Title & Details ───────────────────────────────
          Text(
            s.displayTitle(bangla: bangla),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.3,
            ),
          ),
          if ((s.displayDetails(bangla: bangla) ?? '').isNotEmpty) ...[
            const SizedBox(height: Space.xs),
            Text(
              s.displayDetails(bangla: bangla)!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: scheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          ],
          const SizedBox(height: Space.md),

          // ── Section 3: Request Dossier ───────────────────────────────
          _SectionLabel(
            icon: Icons.folder_outlined,
            label: bangla ? 'অনুরোধের বিবরণ' : 'Request Dossier',
          ),
          const SizedBox(height: Space.xs),
          Container(
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(
                color: scheme.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Column(
              children: [
                _metaRow(
                  context,
                  icon: Icons.person_outline,
                  label: bangla ? 'আবেদনকারী' : 'Requester',
                  value: item.initiator.display(bangla: bangla),
                ),
                _metaDivider(context),
                _metaRow(
                  context,
                  icon: Icons.corporate_fare,
                  label: bangla ? 'বিভাগ ও সাইট' : 'Department & Site',
                  value: 'Sales & Distribution · Head Office Baridhara',
                ),
                if (s.amount != null) ...[
                  _metaDivider(context),
                  _metaRow(
                    context,
                    icon: Icons.payments_outlined,
                    label: bangla ? 'পরিমাণ (BDT)' : 'Amount (BDT)',
                    value: taka(s.amount!, bangla: bangla),
                    valueColor: Colors.teal.shade800,
                    bold: true,
                  ),
                ],
                _metaDivider(context),
                _metaRow(
                  context,
                  icon: Icons.account_tree_outlined,
                  label: bangla ? 'কস্ট সেন্টার / জিএল' : 'Cost Center / GL',
                  value: 'CC-4100 (Sales) · GL 400210',
                ),
                _metaDivider(context),
                _metaRow(
                  context,
                  icon: Icons.category_outlined,
                  label: bangla ? 'ধরন' : 'Category',
                  value: categoryLabel(context.l10n, item.category),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xs),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.open_in_new, size: 14),
              label: Text(
                bangla ? 'সম্পূর্ণ বিবরণ দেখুন' : 'View Full Details',
                style: const TextStyle(fontSize: 11.5),
              ),
              onPressed: () {
                Navigator.of(context).pop();
                unawaited(
                  context.push(AppRoutes.approvalDetail(item.instanceId)),
                );
              },
            ),
          ),
          const SizedBox(height: Space.sm),
          _AlreadySigned(instanceId: item.instanceId),
          const SizedBox(height: Space.sm),

          // ── Digital Signature Assurance Banner ───────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.sm,
            ),
            decoration: BoxDecoration(
              color: Colors.teal.shade50.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(Corner.md),
              border: Border.all(color: Colors.teal.shade200),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.verified_user_rounded,
                  size: 18,
                  color: Colors.teal.shade800,
                ),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bangla
                            ? 'ডিজিটাল ই-স্বাক্ষর প্রস্তুত'
                            : 'Digital E-Signature Ready',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.teal.shade900,
                        ),
                      ),
                      Text(
                        bangla
                            ? 'SHA-256 অডিট ট্রেইল · সরাসরি চূড়ান্ত অনুমোদন কার্যকর হবে'
                            : 'SHA-256 Audit Trail · Legally binding executive approval',
                        style: TextStyle(
                          fontSize: 10.5,
                          color: Colors.teal.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.lg),

          // ── Section 4: Sign-Off Remark Presets ─────────────────────
          _SectionLabel(
            icon: Icons.rate_review_outlined,
            label: bangla
                ? 'অনুমোদনের মন্তব্য (ঐচ্ছিক)'
                : 'Sign-Off Remark (optional)',
          ),
          const SizedBox(height: Space.xs),
          Text(
            bangla
                ? 'একটি নির্বাচন করলে অনুমোদনের সাথে মন্তব্য যুক্ত হবে।'
                : 'Tap a preset to attach it to your approval signature.',
            style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: Space.sm),
          Wrap(
            spacing: Space.xs,
            runSpacing: Space.xs,
            children: [
              for (final p in presets)
                _RemarkChip(
                  text: p,
                  selected: _selectedRemark == p,
                  onTap: () {
                    Haptics.tap();
                    setState(
                      () => _selectedRemark = _selectedRemark == p ? null : p,
                    );
                  },
                ),
            ],
          ),
          const SizedBox(height: Space.xl),

          // ── Section 5: Action Buttons ─────────────────────────────────
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: Space.md),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Corner.md),
                    ),
                  ),
                  onPressed: _acting
                      ? null
                      : () => unawaited(
                          _decide(context, item, _DeskIntent.returnForChanges),
                        ),
                  child: Text(
                    l10n.approvalActReturn,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: scheme.error,
                    side: BorderSide(color: scheme.error),
                    padding: const EdgeInsets.symmetric(vertical: Space.md),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Corner.md),
                    ),
                  ),
                  onPressed: _acting
                      ? null
                      : () => unawaited(
                          _decide(context, item, _DeskIntent.reject),
                        ),
                  child: Text(
                    l10n.approvalActReject,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.sm),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: BrandColors.crimson,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Corner.md),
              ),
            ),
            icon: _acting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.draw_rounded, size: 18),
            label: Text(
              l10n.approvalESign,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            onPressed: _acting
                ? null
                : () => unawaited(_decide(context, item, _DeskIntent.approve)),
          ),
        ],
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  Widget _metaRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
    bool bold = false,
  }) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: Space.xs),
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: bold ? FontWeight.bold : FontWeight.w600,
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaDivider(BuildContext context) => Divider(
    height: 1,
    indent: Space.md,
    endIndent: Space.md,
    color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE WIDGETS
// ─────────────────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 14, color: scheme.onSurfaceVariant),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
            color: scheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _RemarkChip extends StatelessWidget {
  const _RemarkChip({
    required this.text,
    required this.selected,
    required this.onTap,
  });

  final String text;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? Colors.teal : Colors.teal.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? Colors.teal : Colors.teal.shade300,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selected) ...[
              const Icon(Icons.check, size: 12, color: Colors.white),
              const SizedBox(width: 4),
            ],
            Text(
              text,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.white : Colors.teal.shade900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _DeskIntent { approve, returnForChanges, reject }

class _AlreadySigned extends ConsumerWidget {
  const _AlreadySigned({required this.instanceId});

  final String instanceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final trail = ref.watch(workflowTrailProvider(instanceId));
    return trail.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: Space.sm),
        child: LinearProgressIndicator(),
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (t) {
        final signed = [
          for (final step in t.steps)
            if (step.state == TrailState.approved) step,
        ];
        if (signed.isEmpty) return const SizedBox.shrink();
        final theme = Theme.of(context);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionLabel(
              icon: Icons.verified_outlined,
              label: l10n.approvalAlreadySigned,
            ),
            const SizedBox(height: Space.sm),
            for (final step in signed)
              Padding(
                padding: const EdgeInsets.only(bottom: Space.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _signerLine(step, bangla: bangla),
                      style: theme.textTheme.titleSmall,
                    ),
                    Text(
                      step.name,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (step.comment != null && step.comment!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: Space.xs),
                        child: Text(
                          '“${step.comment}”',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }

  String _signerLine(TrailStep step, {required bool bangla}) {
    final who = step.decidedBy?.displayName(bangla: bangla) ?? '';
    final dept = step.decidedBy?.departmentName(bangla: bangla);
    if (who.isEmpty) return step.name;
    if (dept == null) return who;
    return '$who · $dept';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY LIST
// ─────────────────────────────────────────────────────────────────────────────

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
                        '"${h.comment}"',
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
