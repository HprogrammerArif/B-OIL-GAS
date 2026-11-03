import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Notices inbox: pinned first, filter by unread / needs acknowledgement,
/// and "mine" for publishers.
class NoticesScreen extends ConsumerStatefulWidget {
  const NoticesScreen({super.key});

  @override
  ConsumerState<NoticesScreen> createState() => _NoticesScreenState();
}

class _NoticesScreenState extends ConsumerState<NoticesScreen> {
  String _filter = 'all';

  Future<void> _refresh() async {
    ref
      ..invalidate(noticesProvider(_filter))
      ..invalidate(noticeCountsProvider);
    await ref.read(noticesProvider(_filter).future);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canPublish =
        ref.watch(sessionControllerProvider).value?.can('notices:create') ??
        false;
    final counts = ref.watch(noticeCountsProvider).value;
    final list = ref.watch(noticesProvider(_filter));
    final filters = <(String, String)>[
      ('all', l10n.noticeFilterAll),
      (
        'unread',
        counts == null || counts['unread'] == 0
            ? l10n.noticeFilterUnread
            : l10n.noticeFilterUnreadCount(counts['unread']!),
      ),
      (
        'ack',
        counts == null || counts['awaitingAck'] == 0
            ? l10n.noticeFilterAck
            : l10n.noticeFilterAckCount(counts['awaitingAck']!),
      ),
      if (canPublish) ('mine', l10n.noticeFilterMine),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.noticesTitle)),
      floatingActionButton: canPublish
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.noticeNew)),
              icon: const Icon(Icons.edit_outlined),
              label: Text(l10n.noticeCompose),
            )
          : null,
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.sm,
            ),
            child: Row(
              children: [
                for (final f in filters) ...[
                  ChoiceChip(
                    label: Text(f.$2),
                    selected: _filter == f.$1,
                    onSelected: (_) => setState(() => _filter = f.$1),
                  ),
                  const SizedBox(width: Space.sm),
                ],
              ],
            ),
          ),
          Expanded(
            child: list.when(
              loading: () => const SkeletonList(),
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (items) => RefreshIndicator(
                onRefresh: _refresh,
                child: items.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          const SizedBox(height: Space.xxxl),
                          EmptyState(
                            icon: Icons.campaign_outlined,
                            title: l10n.noticeEmptyTitle,
                            message: l10n.noticeEmptyMessage,
                          ),
                        ],
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(bottom: 96),
                        itemCount: items.length,
                        itemBuilder: (_, i) => Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: Space.lg,
                            vertical: Space.xs,
                          ),
                          child: _NoticeCard(notice: items[i]),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.notice});

  final Notice notice;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final bangla = context.isBangla;
    final unread = notice.unread;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.md),
        onTap: () => unawaited(context.push(AppRoutes.noticeDetail(notice.id))),
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                noticeCategoryIcon(notice.category),
                color: notice.priority == NoticePriority.critical
                    ? context.bogcl.danger
                    : theme.colorScheme.primary,
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (unread)
                          Padding(
                            padding: const EdgeInsets.only(right: Space.sm),
                            child: Semantics(
                              label: l10n.noticeUnread,
                              child: Icon(
                                Icons.circle,
                                size: 10,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ),
                        Expanded(
                          child: Text(
                            notice.displayTitle(bangla: bangla),
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: unread
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (notice.isPinned)
                          Padding(
                            padding: const EdgeInsets.only(left: Space.xs),
                            child: Icon(
                              Icons.push_pin,
                              size: 16,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      notice.excerpt,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: Space.sm),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        StatusPill(
                          label: noticeCategoryLabel(l10n, notice.category),
                        ),
                        if (notice.priority != NoticePriority.normal)
                          StatusPill(
                            label: noticePriorityLabel(l10n, notice.priority),
                            tone: noticePriorityTone(notice.priority),
                          ),
                        if (notice.awaitingAck)
                          StatusPill(
                            label: l10n.noticeNeedsAck,
                            tone: StatusTone.warning,
                            icon: Icons.task_alt,
                          ),
                        Text(
                          DateFmt.date(notice.publishedAt, lang),
                          style: theme.textTheme.labelSmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
