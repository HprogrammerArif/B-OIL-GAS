import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/sync_state.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Sync queue: actions taken offline waiting to be sent (doc 05-F §5).
class OutboxScreen extends ConsumerWidget {
  const OutboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final items = ref.watch(outboxItemsProvider);
    final offline = ref.watch(isOfflineProvider);
    final hasPending = items.value?.any((i) => i.status != 'FAILED') ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.outboxTitle),
        actions: [
          if (hasPending)
            IconButton(
              tooltip: l10n.outboxSyncNow,
              icon: const Icon(Icons.sync),
              onPressed: offline
                  ? null
                  : () => unawaited(ref.read(outboxServiceProvider).replay()),
            ),
        ],
      ),
      body: items.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(outboxItemsProvider)),
        data: (list) => list.isEmpty
            ? EmptyState(
                icon: Icons.cloud_done_outlined,
                title: l10n.outboxEmptyTitle,
                message: l10n.outboxEmptyMessage,
              )
            : ListView.separated(
                padding: const EdgeInsets.all(Space.lg),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: Space.md),
                itemBuilder: (context, i) => _OutboxRow(item: list[i]),
              ),
      ),
    );
  }
}

class _OutboxRow extends ConsumerWidget {
  const _OutboxRow({required this.item});

  final OutboxData item;

  (String, StatusTone, IconData) _status(AppL10n l10n) => switch (item.status) {
    'FAILED' => (l10n.outboxStatusFailed, StatusTone.danger, Icons.error),
    'SYNCING' => (l10n.outboxStatusSyncing, StatusTone.info, Icons.sync),
    _ => (l10n.outboxStatusPending, StatusTone.warning, Icons.schedule),
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final (label, tone, icon) = _status(l10n);
    final created = DateTime.fromMillisecondsSinceEpoch(
      item.createdAtMs,
      isUtc: true,
    );
    final when = DateFmt.dateTime(created, lang);
    final attempts = item.attempts == 0
        ? ''
        : ' • ${l10n.outboxAttempts(item.attempts)}';
    return ListRow(
      title: item.label.isEmpty ? item.endpoint : item.label,
      subtitle: '$when$attempts',
      pendingSync: item.status != 'FAILED',
      trailing: StatusPill(label: label, tone: tone, icon: icon),
      onTap: () => _showActions(context, ref),
    );
  }

  Future<void> _showActions(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final service = ref.read(outboxServiceProvider);
    final failed = item.status == 'FAILED';
    return showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
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
              Text(
                item.label.isEmpty ? item.endpoint : item.label,
                style: Theme.of(ctx).textTheme.titleMedium,
              ),
              const SizedBox(height: Space.sm),
              Text(
                failed ? l10n.outboxFailedReason : l10n.outboxWillRetry,
                style: Theme.of(ctx).textTheme.bodyMedium,
              ),
              const SizedBox(height: Space.xxl),
              if (failed) ...[
                PrimaryButton(
                  label: l10n.outboxRetry,
                  icon: Icons.refresh,
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    unawaited(service.retry(item.id));
                  },
                ),
                const SizedBox(height: Space.sm),
              ],
              PrimaryButton.danger(
                label: l10n.outboxDiscard,
                icon: Icons.delete_outline,
                onPressed: () async {
                  Navigator.of(ctx).pop();
                  final ok = await showConfirmSheet(
                    context,
                    title: l10n.outboxDiscardTitle,
                    message: l10n.outboxDiscardMessage,
                    confirmLabel: l10n.outboxDiscard,
                    destructive: true,
                  );
                  if (ok) await service.discard(item.id);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
