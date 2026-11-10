import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/features/workflow/presentation/approval_timeline.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// One leave request: next step, attachment, route, Verify / Return / Edit.
class LeaveDetailScreen extends ConsumerStatefulWidget {
  const LeaveDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<LeaveDetailScreen> createState() => _LeaveDetailScreenState();
}

class _LeaveDetailScreenState extends ConsumerState<LeaveDetailScreen> {
  bool _busy = false;

  void _refreshAll() {
    ref
      ..invalidate(leaveDetailProvider(widget.id))
      ..invalidate(myLeaveRequestsProvider)
      ..invalidate(leaveRequestsProvider)
      ..invalidate(leaveBalancesProvider)
      ..invalidate(approvalInboxProvider)
      ..invalidate(approvalDetailProvider);
  }

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
    setState(() => _busy = true);
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
      _refreshAll();
      if (!mounted) return;
      AppToast.show(
        context,
        result is Queued ? l10n.leaveCancelQueued : l10n.leaveCancelled,
        tone: result is Queued ? StatusTone.info : StatusTone.success,
      );
    } on ApiException {
      if (!mounted) return;
      _refreshAll();
      AppToast.show(context, l10n.leaveCancelFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _run(
    Future<Object?> Function() action,
    String done, {
    required String failed,
    bool apiMessage = false,
  }) async {
    setState(() => _busy = true);
    try {
      await action();
      _refreshAll();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      _refreshAll();
      if (!mounted) return;
      AppToast.show(
        context,
        apiMessage && e.message.isNotEmpty ? e.message : failed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify(LeaveRequestItem item) async {
    final l10n = context.l10n;
    final id = item.workflowInstanceId;
    if (!item.awaitingYou || id == null) return;
    await _run(
      () => ref.read(approvalRepositoryProvider).approve(id),
      l10n.leaveVerified,
      failed: l10n.leaveErrFailed,
      apiMessage: true,
    );
  }

  Future<void> _returnItem(LeaveRequestItem item) async {
    final id = item.workflowInstanceId;
    if (!item.awaitingYou || id == null) return;
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _ReturnSheet(),
    );
    if (note == null || !mounted) return;
    final l10n = context.l10n;
    await _run(
      () => ref
          .read(approvalRepositoryProvider)
          .returnForChanges(id, comment: note),
      l10n.leaveReturnedToast,
      failed: l10n.leaveErrFailed,
      apiMessage: true,
    );
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
          busy: _busy,
          onCancel: () => unawaited(_cancel(item)),
          onVerify: () => unawaited(_verify(item)),
          onReturn: () => unawaited(_returnItem(item)),
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.item,
    required this.busy,
    required this.onCancel,
    required this.onVerify,
    required this.onReturn,
  });

  final LeaveRequestItem item;
  final bool busy;
  final VoidCallback onCancel;
  final VoidCallback onVerify;
  final VoidCallback onReturn;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final r = item;
    final duration = daysText(l10n, r.days, lang);
    final next = leaveNextLine(l10n, r, bangla: bangla);
    final showBar =
        r.canCancel || r.awaitingYou || r.status == LeaveStatus.returned;
    final ownerReturned = r.isOwner && r.status == LeaveStatus.returned;

    return Column(
      children: [
        Expanded(
          child: ListView(
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                r.type.displayName(bangla: bangla),
                                style: theme.textTheme.titleLarge,
                              ),
                            ),
                            StatusPill(
                              label: leaveStatusLabel(l10n, r.status),
                              tone: leaveStatusTone(r.status),
                            ),
                          ],
                        ),
                        const SizedBox(height: Space.xs),
                        Text(
                          [
                            DateFmt.range(r.startDate, r.endDate, lang),
                            if (r.halfDay == null)
                              duration
                            else
                              '$duration · ${halfDayLabel(l10n, r.halfDay!)}',
                          ].join(' · '),
                          style: theme.textTheme.titleMedium,
                        ),
                        if (!r.isOwner) ...[
                          const SizedBox(height: Space.xs),
                          Text(r.employee.displayName(bangla: bangla)),
                        ],
                        const SizedBox(height: Space.md),
                        Text(r.reason),
                        const SizedBox(height: Space.md),
                        Text(next, style: theme.textTheme.bodyMedium),
                        if (!r.isInformed) ...[
                          const SizedBox(height: Space.sm),
                          Text(
                            l10n.leaveFormUninformed,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: context.bogcl.warning,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              if (r.attachmentFileId != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    0,
                    Space.lg,
                    Space.md,
                  ),
                  child: EvidenceStrip(fileIds: [r.attachmentFileId!]),
                ),
              if (r.reviewComment != null &&
                  (r.status == LeaveStatus.rejected ||
                      r.status == LeaveStatus.returned))
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Space.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r.reviewedBy == null
                                ? l10n.leaveDetailComment
                                : l10n.leaveDetailReviewedBy(
                                    r.reviewedBy!.displayName(bangla: bangla),
                                  ),
                            style: theme.textTheme.titleSmall,
                          ),
                          const SizedBox(height: Space.xs),
                          Text('“${r.reviewComment}”'),
                        ],
                      ),
                    ),
                  ),
                ),
              if (r.workflowInstanceId != null) ...[
                SectionHeader(title: l10n.leaveDetailRoute),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: Space.xl),
                  child: ApprovalTimeline(
                    instanceId: r.workflowInstanceId!,
                    submittedAt: r.createdAt,
                  ),
                ),
              ],
              ExpansionTile(
                title: Text(l10n.nsDetails),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      Space.lg,
                      0,
                      Space.lg,
                      Space.md,
                    ),
                    child: Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(r.refNo),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (showBar)
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (ownerReturned) ...[
                    PrimaryButton(
                      label: l10n.leaveEditTitle,
                      onPressed: busy
                          ? null
                          : () => unawaited(
                              context.push(AppRoutes.leaveEdit(r.id)),
                            ),
                    ),
                    const SizedBox(height: Space.sm),
                  ],
                  if (r.awaitingYou) ...[
                    PrimaryButton(
                      label: l10n.leaveVerify,
                      loading: busy,
                      onPressed: onVerify,
                    ),
                    const SizedBox(height: Space.sm),
                    PrimaryButton.secondary(
                      label: l10n.leaveReturn,
                      onPressed: busy ? null : onReturn,
                    ),
                    if (r.canCancel) const SizedBox(height: Space.sm),
                  ],
                  if (r.canCancel)
                    PrimaryButton.danger(
                      label: l10n.leaveCancel,
                      loading: busy,
                      onPressed: busy ? null : onCancel,
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _ReturnSheet extends StatefulWidget {
  const _ReturnSheet();

  @override
  State<_ReturnSheet> createState() => _ReturnSheetState();
}

class _ReturnSheetState extends State<_ReturnSheet> {
  final _text = TextEditingController();
  bool _showError = false;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  void _confirm() {
    final value = _text.text.trim();
    if (value.length < 20) {
      setState(() => _showError = true);
      return;
    }
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final presets = [
      l10n.leaveReturnPreset1,
      l10n.leaveReturnPreset2,
      l10n.leaveReturnPreset3,
      l10n.leaveReturnPreset4,
    ];
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.leaveReturnTitle, style: theme.textTheme.titleLarge),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.leaveReturnHint,
                controller: _text,
                maxLines: 4,
                maxLength: 1000,
                required: true,
                errorText: _showError && _text.text.trim().length < 20
                    ? l10n.approvalErrMinChars(20)
                    : null,
                onChanged: (_) => setState(() => _showError = false),
              ),
              const SizedBox(height: Space.sm),
              Wrap(
                spacing: Space.xs,
                runSpacing: Space.xs,
                children: [
                  for (final p in presets)
                    FilterChip(
                      visualDensity: VisualDensity.compact,
                      label: Text(
                        p,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      selected: _text.text.trim() == p,
                      onSelected: (_) => setState(() {
                        _text.text = p;
                        _showError = false;
                      }),
                    ),
                ],
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(label: l10n.leaveReturn, onPressed: _confirm),
            ],
          ),
        ),
      ),
    );
  }
}
