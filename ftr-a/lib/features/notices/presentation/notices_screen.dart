import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
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
              Space.md,
              Space.md,
              Space.md,
              Space.sm,
            ),
            child: Row(
              children: [
                for (final f in filters) ...[
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
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
                        itemBuilder: (_, i) => _NoticeRow(notice: items[i]),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoticeRow extends StatelessWidget {
  const _NoticeRow({required this.notice});

  final Notice notice;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final bangla = context.isBangla;
    final next = notice.awaitingAck
        ? l10n.noticeNeedsAck
        : notice.unread
        ? l10n.noticeUnread
        : null;
    final meta =
        '${noticeCategoryLabel(l10n, notice.category)} · '
        '${DateFmt.date(notice.publishedAt, lang)}';
    final Widget? trailing;
    if (notice.awaitingAck) {
      trailing = StatusPill(
        label: l10n.noticeNeedsAck,
        tone: StatusTone.warning,
      );
    } else if (notice.priority != NoticePriority.normal) {
      trailing = StatusPill(
        label: noticePriorityLabel(l10n, notice.priority),
        tone: noticePriorityTone(notice.priority),
      );
    } else if (notice.isPinned) {
      trailing = Icon(
        Icons.push_pin,
        size: 16,
        color: theme.colorScheme.onSurfaceVariant,
      );
    } else {
      trailing = null;
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.sm,
        Space.lg,
        Space.sm,
      ),
      child: ListRow(
        leading: Icon(
          noticeCategoryIcon(notice.category),
          color: notice.priority == NoticePriority.critical
              ? context.bogcl.danger
              : theme.colorScheme.primary,
        ),
        title: notice.displayTitle(bangla: bangla),
        subtitle: next == null ? meta : '$meta\n$next',
        trailing: trailing,
        onTap: () => unawaited(context.push(AppRoutes.noticeDetail(notice.id))),
      ),
    );
  }
}
