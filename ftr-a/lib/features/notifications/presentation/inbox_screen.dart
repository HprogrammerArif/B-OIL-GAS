import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/notifications/domain/notification_models.dart';
import 'package:bogcl_oneops/features/notifications/presentation/inbox_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

String _categoryLabel(AppL10n l10n, NotificationCategory c) => switch (c) {
  NotificationCategory.all => l10n.inboxFilterAll,
  NotificationCategory.approvals => l10n.inboxFilterApprovals,
  NotificationCategory.safety => l10n.inboxFilterSafety,
  NotificationCategory.transport => l10n.inboxFilterTransport,
};

IconData _kindIcon(NotificationKind k) => switch (k) {
  NotificationKind.approval => Icons.fact_check_outlined,
  NotificationKind.safety => Icons.health_and_safety_outlined,
  NotificationKind.transport => Icons.local_shipping_outlined,
  NotificationKind.other => Icons.notifications_none,
};

/// Actionable Notification Centre: summary banner, filter chips, swipe-to-read, and inline actions.
class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.extentAfter < 300) unawaited(_loadMore());
  }

  Future<void> _loadMore() async {
    try {
      await ref.read(inboxControllerProvider.notifier).loadMore();
    } on ApiException {
      if (mounted) {
        AppToast.show(
          context,
          context.l10n.inboxLoadMoreFailed,
          tone: StatusTone.warning,
        );
      }
    }
  }

  Future<void> _markAllRead() async {
    final l10n = context.l10n;
    Haptics.tap();
    try {
      await ref
          .read(inboxControllerProvider.notifier)
          .markAllRead(label: l10n.inboxReadAllLabel);
      if (mounted) {
        AppToast.show(
          context,
          l10n.inboxMarkedAllRead,
          tone: StatusTone.success,
        );
      }
    } on ApiException {
      if (mounted) {
        AppToast.show(
          context,
          l10n.commonErrorMessage,
          tone: StatusTone.danger,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inbox = ref.watch(inboxControllerProvider);
    final controller = ref.read(inboxControllerProvider.notifier);
    final state = inbox.value;
    final unread = ref.watch(unreadSummaryControllerProvider).value?.total ?? 0;
    final ackPendingCount = state?.items.where((i) => i.needsAck).length ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.inboxTitle),
        actions: [
          IconButton(
            tooltip: l10n.inboxMarkAllRead,
            icon: const Icon(Icons.done_all),
            onPressed: unread > 0 ? () => unawaited(_markAllRead()) : null,
          ),
        ],
      ),
      body: Column(
        children: [
          // Plain-Language Verdict & Gesture Hint Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.xs, Space.lg, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: ackPendingCount > 0
                    ? scheme.errorContainer.withValues(alpha: 0.25)
                    : scheme.primaryContainer.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(Corner.md),
                border: Border.all(
                  color: ackPendingCount > 0
                      ? scheme.error.withValues(alpha: 0.35)
                      : scheme.primary.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    ackPendingCount > 0
                        ? Icons.notification_important_outlined
                        : Icons.notifications_active_outlined,
                    size: 20,
                    color: ackPendingCount > 0 ? scheme.error : scheme.primary,
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          unread == 0 && ackPendingCount == 0
                              ? (bangla
                                    ? 'সকল বিজ্ঞপ্তি পড়া হয়েছে · কোনো জরুরি স্বীকৃতি বাকি নেই'
                                    : 'All caught up · No unread alerts or pending acknowledgments')
                              : (bangla
                                    ? '$unreadটি অপঠিত বিজ্ঞপ্তি · $ackPendingCountটিতে জরুরি স্বীকৃতি প্রয়োজন'
                                    : '$unread unread alerts · $ackPendingCount require your acknowledgment'),
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          bangla
                              ? 'টিপস: বামে সোয়াইপ করে পঠিত হিসেবে চিহ্নিত করুন অথবা কার্ডের বাটনে সরাসরি কাজ সম্পন্ন করুন।'
                              : 'Tip: Swipe left on any unread card to mark read, or use inline action buttons below.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          _FilterBar(
            category: state?.category ?? NotificationCategory.all,
            unreadOnly: state?.unreadOnly ?? false,
            onCategory: (c) => unawaited(controller.setFilter(category: c)),
            onUnreadOnly: (v) => unawaited(controller.setFilter(unreadOnly: v)),
          ),
          Expanded(
            child: inbox.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => unawaited(controller.refresh())),
              data: (s) => RefreshIndicator(
                onRefresh: controller.refresh,
                child: s.items.isEmpty
                    ? _EmptyList(unreadOnly: s.unreadOnly)
                    : ListView.separated(
                        controller: _scroll,
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(
                          Space.lg,
                          Space.sm,
                          Space.lg,
                          Space.xxl,
                        ),
                        itemCount: s.items.length + (s.loadingMore ? 1 : 0),
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: Space.sm),
                        itemBuilder: (context, i) => i == s.items.length
                            ? const Padding(
                                padding: EdgeInsets.all(Space.lg),
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              )
                            : _NotificationTile(item: s.items[i]),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyList extends StatelessWidget {
  const _EmptyList({required this.unreadOnly});

  final bool unreadOnly;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return LayoutBuilder(
      builder: (context, box) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: box.maxHeight,
          child: EmptyState(
            icon: Icons.notifications_none,
            title: unreadOnly
                ? l10n.inboxEmptyUnreadTitle
                : l10n.inboxEmptyTitle,
            message: l10n.inboxEmptyMessage,
          ),
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.category,
    required this.unreadOnly,
    required this.onCategory,
    required this.onUnreadOnly,
  });

  final NotificationCategory category;
  final bool unreadOnly;
  final ValueChanged<NotificationCategory> onCategory;
  final ValueChanged<bool> onUnreadOnly;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Row(
        children: [
          for (final c in NotificationCategory.values) ...[
            ChoiceChip(
              label: Text(_categoryLabel(l10n, c)),
              selected: category == c,
              onSelected: (_) => onCategory(c),
            ),
            const SizedBox(width: Space.sm),
          ],
          FilterChip(
            label: Text(l10n.inboxFilterUnread),
            selected: unreadOnly,
            onSelected: onUnreadOnly,
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.item});

  final AppNotification item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lang = Localizations.localeOf(context).languageCode;
    final critical = item.priority == NotificationPriority.critical;
    final accent = critical ? context.bogcl.danger : scheme.primary;
    final when = relativeTime(l10n, item.createdAt, lang);

    final cardContent = Semantics(
      label:
          '${item.isRead ? '' : '${l10n.inboxUnreadSemantics}, '}'
          '${item.title}, $when',
      button: true,
      excludeSemantics: true,
      child: Material(
        color: item.isRead
            ? scheme.surface
            : scheme.primary.withValues(alpha: 0.05),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Corner.lg),
          side: BorderSide(
            color: item.needsAck ? context.bogcl.danger : scheme.outlineVariant,
            width: item.needsAck ? 1.4 : 1.0,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(Corner.lg),
          onTap: () {
            if (item.route != null && !item.needsAck) {
              unawaited(
                ref
                    .read(inboxControllerProvider.notifier)
                    .markRead(item.id, label: l10n.inboxReadLabel)
                    .catchError((Object _) {}),
              );
              unawaited(context.push(item.route!));
              return;
            }
            unawaited(_openDetail(context, ref));
          },
          child: Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: accent.withValues(alpha: 0.12),
                      child: Icon(
                        _kindIcon(item.kind),
                        color: accent,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: Space.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: item.isRead
                                  ? FontWeight.w500
                                  : FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: Space.xs),
                          Text(
                            item.body,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: Space.sm),
                          Wrap(
                            spacing: Space.sm,
                            runSpacing: Space.xs,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(when, style: theme.textTheme.labelSmall),
                              if (item.needsAck)
                                StatusPill(
                                  label: l10n.inboxAckRequired,
                                  tone: StatusTone.danger,
                                  icon: Icons.priority_high,
                                )
                              else if (item.priority ==
                                  NotificationPriority.high)
                                StatusPill(
                                  label: l10n.inboxPriorityHigh,
                                  tone: StatusTone.warning,
                                ),
                              if (item.ackRequired && item.ackedAt != null)
                                StatusPill(
                                  label: l10n.inboxAcknowledged,
                                  tone: StatusTone.success,
                                  icon: Icons.check,
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (!item.isRead)
                      Padding(
                        padding: const EdgeInsets.only(left: Space.sm, top: 6),
                        child: Icon(Icons.circle, size: 10, color: accent),
                      ),
                  ],
                ),
                if (item.needsAck || item.route != null) ...[
                  const SizedBox(height: Space.sm),
                  const Divider(height: 1),
                  const SizedBox(height: Space.xs),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (item.needsAck)
                        FilledButton.tonalIcon(
                          style: FilledButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            backgroundColor: context.bogcl.danger.withValues(
                              alpha: 0.14,
                            ),
                            foregroundColor: context.bogcl.danger,
                          ),
                          onPressed: () async {
                            Haptics.success();
                            try {
                              await ref
                                  .read(inboxControllerProvider.notifier)
                                  .acknowledge(
                                    item.id,
                                    label: l10n.inboxAckLabel,
                                  );
                              if (context.mounted) {
                                AppToast.show(
                                  context,
                                  l10n.inboxAcknowledged,
                                  tone: StatusTone.success,
                                );
                              }
                            } on ApiException {
                              if (context.mounted) {
                                AppToast.show(
                                  context,
                                  l10n.commonErrorMessage,
                                  tone: StatusTone.danger,
                                );
                              }
                            }
                          },
                          icon: const Icon(
                            Icons.check_circle_outline,
                            size: 16,
                          ),
                          label: Text(
                            l10n.inboxAcknowledge,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      if (item.route != null) ...[
                        const SizedBox(width: Space.xs),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () {
                            Haptics.tap();
                            unawaited(
                              ref
                                  .read(inboxControllerProvider.notifier)
                                  .markRead(item.id, label: l10n.inboxReadLabel)
                                  .catchError((Object _) {}),
                            );
                            unawaited(context.push(item.route!));
                          },
                          icon: const Icon(Icons.open_in_new, size: 15),
                          label: Text(
                            bangla ? 'ফাইল দেখুন' : l10n.inboxOpen,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );

    if (item.isRead) return cardContent;

    return Dismissible(
      key: ValueKey('inbox_swipe_${item.id}'),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        Haptics.tap();
        unawaited(
          ref
              .read(inboxControllerProvider.notifier)
              .markRead(item.id, label: l10n.inboxReadLabel)
              .catchError((Object _) {}),
        );
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: Space.xl),
        decoration: BoxDecoration(
          color: BrandColors.success.withValues(alpha: 0.16),
          borderRadius: BorderRadius.circular(Corner.lg),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.mark_email_read_outlined,
              color: BrandColors.success,
            ),
            const SizedBox(width: Space.xs),
            Text(
              bangla ? 'পঠিত চিহ্নিত করুন' : 'Mark Read',
              style: const TextStyle(
                color: BrandColors.success,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
      child: cardContent,
    );
  }

  Future<void> _openDetail(BuildContext context, WidgetRef ref) async {
    final l10n = context.l10n;
    final controller = ref.read(inboxControllerProvider.notifier);
    unawaited(
      controller
          .markRead(item.id, label: l10n.inboxReadLabel)
          .catchError((Object _) {}),
    );
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => _DetailSheet(id: item.id, fallback: item),
    );
  }
}

class _DetailSheet extends ConsumerWidget {
  const _DetailSheet({required this.id, required this.fallback});

  final String id;
  final AppNotification fallback;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final item =
        ref
            .watch(inboxControllerProvider)
            .value
            ?.items
            .where((n) => n.id == id)
            .firstOrNull ??
        fallback;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          Space.xxl,
          Space.sm,
          Space.xxl,
          Space.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: Space.sm,
              children: [
                if (item.priority == NotificationPriority.critical)
                  StatusPill(
                    label: l10n.inboxPriorityCritical,
                    tone: StatusTone.danger,
                    icon: Icons.priority_high,
                  ),
                if (item.ackRequired && item.ackedAt != null)
                  StatusPill(
                    label: l10n.inboxAcknowledged,
                    tone: StatusTone.success,
                    icon: Icons.check,
                  ),
              ],
            ),
            if (item.priority == NotificationPriority.critical ||
                (item.ackRequired && item.ackedAt != null))
              const SizedBox(height: Space.md),
            Text(item.title, style: theme.textTheme.titleLarge),
            const SizedBox(height: Space.xs),
            Text(
              relativeTime(l10n, item.createdAt, lang),
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: Space.lg),
            Text(item.body, style: theme.textTheme.bodyLarge),
            const SizedBox(height: Space.xxl),
            if (item.needsAck)
              PrimaryButton(
                label: l10n.inboxAcknowledge,
                icon: Icons.check_circle_outline,
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  try {
                    await ref
                        .read(inboxControllerProvider.notifier)
                        .acknowledge(item.id, label: l10n.inboxAckLabel);
                  } on ApiException {
                    messenger.showSnackBar(
                      SnackBar(content: Text(l10n.commonErrorMessage)),
                    );
                  }
                },
              )
            else if (item.route != null) ...[
              PrimaryButton(
                label: l10n.inboxOpen,
                icon: Icons.open_in_new,
                onPressed: () {
                  final router = GoRouter.of(context);
                  Navigator.of(context).pop();
                  unawaited(router.push(item.route!));
                },
              ),
              const SizedBox(height: Space.sm),
              PrimaryButton.secondary(
                label: l10n.commonClose,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ] else
              PrimaryButton.secondary(
                label: l10n.commonClose,
                onPressed: () => Navigator.of(context).pop(),
              ),
          ],
        ),
      ),
    );
  }
}
