import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/notices/data/notice_repository.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// One notice. Opening it marks it read; notices that need acknowledgement
/// show a confirm button until the reader acknowledges.
class NoticeDetailScreen extends ConsumerStatefulWidget {
  const NoticeDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<NoticeDetailScreen> createState() => _NoticeDetailScreenState();
}

class _NoticeDetailScreenState extends ConsumerState<NoticeDetailScreen> {
  bool _acking = false;
  bool _refreshedLists = false;

  Future<void> _ack() async {
    final l10n = context.l10n;
    setState(() => _acking = true);
    try {
      await ref.read(noticeRepositoryProvider).acknowledge(widget.id);
      ref
        ..invalidate(noticeDetailProvider(widget.id))
        ..invalidate(noticesProvider)
        ..invalidate(noticeCountsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.noticeAcked, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.code == ApiErrorCode.conflict) {
        ref.invalidate(noticeDetailProvider(widget.id));
      } else {
        AppToast.show(context, l10n.noticeAckFailed, tone: StatusTone.danger);
      }
    } finally {
      if (mounted) setState(() => _acking = false);
    }
  }

  void _syncLists() {
    if (_refreshedLists) return;
    _refreshedLists = true;
    unawaited(
      Future.microtask(() {
        ref
          ..invalidate(noticesProvider)
          ..invalidate(noticeCountsProvider);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final detail = ref.watch(noticeDetailProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.noticeDetailTitle)),
      body: detail.when(
        loading: () => const SkeletonList(),
        error: (e, _) => e is ApiException && e.code == ApiErrorCode.notFound
            ? EmptyState(
                icon: Icons.search_off,
                title: l10n.noticeNotFound,
                message: l10n.noticeNotFoundMessage,
              )
            : ErrorState(
                onRetry: () => ref.invalidate(noticeDetailProvider(widget.id)),
              ),
        data: (n) {
          _syncLists();
          return _Body(
            notice: n,
            acking: _acking,
            onAck: () => unawaited(_ack()),
          );
        },
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({
    required this.notice,
    required this.acking,
    required this.onAck,
  });

  final Notice notice;
  final bool acking;
  final VoidCallback onAck;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final bangla = context.isBangla;
    final stats = notice.stats;
    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.xs,
          children: [
            StatusPill(label: noticeCategoryLabel(l10n, notice.category)),
            if (notice.priority != NoticePriority.normal)
              StatusPill(
                label: noticePriorityLabel(l10n, notice.priority),
                tone: noticePriorityTone(notice.priority),
              ),
            if (notice.isPinned)
              StatusPill(label: l10n.noticePinned, icon: Icons.push_pin),
          ],
        ),
        const SizedBox(height: Space.md),
        Text(
          notice.displayTitle(bangla: bangla),
          style: theme.textTheme.headlineSmall,
        ),
        const SizedBox(height: Space.sm),
        Text(
          '${notice.author.displayName(bangla: bangla)} · '
          '${notice.author.displayTitle(bangla: bangla)}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Text(
          '${notice.refNo} · ${DateFmt.dateTime(notice.publishedAt, lang)}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        if (notice.displayAudience(bangla: bangla) != null)
          Text(
            l10n.noticeAudience(notice.displayAudience(bangla: bangla)!),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        const Divider(height: Space.xxl),
        SelectableText(
          notice.displayBody(bangla: bangla),
          style: theme.textTheme.bodyLarge?.copyWith(height: 1.5),
        ),
        const SizedBox(height: Space.xl),
        if (notice.requiresAck)
          if (notice.ackedAt != null)
            Row(
              children: [
                Icon(Icons.check_circle, color: context.bogcl.success),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Text(
                    l10n.noticeAckedOn(DateFmt.dateTime(notice.ackedAt!, lang)),
                  ),
                ),
              ],
            )
          else
            PrimaryButton(
              label: l10n.noticeAckAction,
              icon: Icons.task_alt,
              loading: acking,
              onPressed: onAck,
            ),
        if (stats != null) ...[
          SectionHeader(title: l10n.noticeReach),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _StatBar(
                    label: l10n.noticeReadStat(
                      stats.readCount,
                      stats.recipientCount,
                    ),
                    value: stats.recipientCount == 0
                        ? 0
                        : stats.readCount / stats.recipientCount,
                  ),
                  if (notice.requiresAck) ...[
                    const SizedBox(height: Space.md),
                    _StatBar(
                      label: l10n.noticeAckStat(
                        stats.ackCount,
                        stats.recipientCount,
                      ),
                      value: stats.recipientCount == 0
                          ? 0
                          : stats.ackCount / stats.recipientCount,
                    ),
                  ],
                  const SizedBox(height: Space.sm),
                  TextButton(
                    onPressed: () => unawaited(
                      showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        showDragHandle: true,
                        builder: (_) => _ReceiptsSheet(id: notice.id),
                      ),
                    ),
                    child: Text(l10n.noticeViewReceipts),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatBar extends StatelessWidget {
  const _StatBar({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: Space.xs),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(value: value, minHeight: 8),
          ),
        ],
      ),
    );
  }
}

class _ReceiptsSheet extends ConsumerWidget {
  const _ReceiptsSheet({required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final data = ref.watch(noticeReceiptsProvider(id));
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (context, scroll) => data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(noticeReceiptsProvider(id)),
        ),
        data: (r) => ListView(
          controller: scroll,
          children: [
            SectionHeader(title: l10n.noticeViewReceipts),
            for (final row in r.items)
              ListRow(
                title: row.displayName(bangla: context.isBangla),
                subtitle: row.department,
                trailing: StatusPill(
                  label: row.ackedAt != null
                      ? l10n.noticeReceiptAcked
                      : row.readAt != null
                      ? l10n.noticeReceiptRead(DateFmt.date(row.readAt!, lang))
                      : l10n.noticeReceiptUnread,
                  tone: row.ackedAt != null
                      ? StatusTone.success
                      : row.readAt != null
                      ? StatusTone.info
                      : StatusTone.neutral,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
