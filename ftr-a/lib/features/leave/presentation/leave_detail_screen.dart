import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/features/workflow/presentation/approval_timeline.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// One leave request: facts, reviewer comment, approval route and cancel.
class LeaveDetailScreen extends ConsumerStatefulWidget {
  const LeaveDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<LeaveDetailScreen> createState() => _LeaveDetailScreenState();
}

class _LeaveDetailScreenState extends ConsumerState<LeaveDetailScreen> {
  bool _cancelling = false;

  Future<void> _cancel(LeaveRequestItem item) async {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final confirmed = await showConfirmSheet(
      context,
      title: l10n.leaveCancelTitle,
      message: item.status == LeaveStatus.approved
          ? l10n.leaveCancelApproved
          : l10n.leaveCancelPending,
      confirmLabel: l10n.leaveCancel,
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _cancelling = true);
    try {
      final result = await ref
          .read(leaveRepositoryProvider)
          .cancel(
            item.id,
            label: l10n.leaveQueueLabel(
              item.type.displayName(bangla: context.isBangla),
              DateFmt.range(item.startDate, item.endDate, lang),
            ),
          );
      ref
        ..invalidate(leaveDetailProvider(item.id))
        ..invalidate(myLeaveRequestsProvider)
        ..invalidate(leaveBalancesProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        result is Queued ? l10n.leaveCancelQueued : l10n.leaveCancelled,
        tone: result is Queued ? StatusTone.info : StatusTone.success,
      );
    } on ApiException {
      if (!mounted) return;
      ref.invalidate(leaveDetailProvider(item.id));
      AppToast.show(context, l10n.leaveCancelFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final detail = ref.watch(leaveDetailProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.leaveDetailTitle)),
      body: detail.when(
        loading: () => const SkeletonList(itemCount: 4),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(leaveDetailProvider(widget.id)),
        ),
        data: (item) => _Body(
          item: item,
          cancelling: _cancelling,
          onCancel: () => unawaited(_cancel(item)),
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.item,
    required this.cancelling,
    required this.onCancel,
  });

  final LeaveRequestItem item;
  final bool cancelling;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final reviewer = item.reviewedBy;
    final duration = daysText(l10n, item.days, lang);

    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxxl),
      children: [
        Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.type.displayName(bangla: bangla),
                          style: theme.textTheme.titleLarge,
                        ),
                      ),
                      StatusPill(
                        label: leaveStatusLabel(l10n, item.status),
                        tone: leaveStatusTone(item.status),
                      ),
                    ],
                  ),
                  Text(
                    item.refNo,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.lg),
                  _Fact(
                    l10n.leaveDetailPeriod,
                    DateFmt.range(item.startDate, item.endDate, lang),
                  ),
                  _Fact(
                    l10n.leaveDetailDuration,
                    item.halfDay == null
                        ? duration
                        : '$duration · ${halfDayLabel(l10n, item.halfDay!)}',
                  ),
                  _Fact(l10n.leaveDetailReason, item.reason),
                  if (!item.isInformed) _Fact('', l10n.leaveFormUninformed),
                  if (item.attachmentFileId != null) ...[
                    const SizedBox(height: Space.md),
                    EvidenceStrip(fileIds: [item.attachmentFileId!]),
                  ],
                ],
              ),
            ),
          ),
        ),
        if (reviewer != null && item.reviewComment != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(Space.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.leaveDetailReviewedBy(
                        reviewer.displayName(bangla: bangla),
                      ),
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      l10n.leaveDetailComment,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Text('“${item.reviewComment}”'),
                  ],
                ),
              ),
            ),
          ),
        if (item.workflowInstanceId != null) ...[
          SectionHeader(title: l10n.leaveDetailRoute),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.xl),
            child: ApprovalTimeline(
              instanceId: item.workflowInstanceId!,
              submittedAt: item.createdAt,
            ),
          ),
        ],
        if (item.canCancel)
          Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: PrimaryButton.danger(
              label: l10n.leaveCancel,
              loading: cancelling,
              onPressed: cancelling ? null : onCancel,
            ),
          ),
      ],
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Space.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (label.isNotEmpty)
            Expanded(
              flex: 2,
              child: Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          Expanded(
            flex: 3,
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
