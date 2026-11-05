import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/workflow/data/workflow_trail.dart';
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

/// One request: what it is, who sent it, why, the route, and my decision.
class ApprovalDetailScreen extends ConsumerStatefulWidget {
  const ApprovalDetailScreen({required this.instanceId, super.key});

  final String instanceId;

  @override
  ConsumerState<ApprovalDetailScreen> createState() =>
      _ApprovalDetailScreenState();
}

class _ApprovalDetailScreenState extends ConsumerState<ApprovalDetailScreen> {
  bool _busy = false;

  void _refreshAll() {
    ref
      ..invalidate(approvalDetailProvider(widget.instanceId))
      ..invalidate(workflowTrailProvider(widget.instanceId))
      ..invalidate(approvalInboxProvider)
      ..invalidate(approvalSummaryProvider)
      ..invalidate(approvalHistoryProvider)
      ..invalidate(claimsProvider)
      ..invalidate(advancesProvider)
      ..invalidate(myLeaveRequestsProvider);
  }

  Future<void> _run(Future<void> Function() action, String done) async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await action();
      _refreshAll();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      _refreshAll();
      if (!mounted) return;
      AppToast.show(context, switch (e.rule) {
        'SELF_APPROVAL' => l10n.approvalErrSelf,
        'DELEGATION_AMOUNT_EXCEEDED' => l10n.approvalErrLimit,
        _ =>
          e.code == ApiErrorCode.invalidStateTransition
              ? l10n.approvalErrClosed
              : l10n.approvalErrFailed,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _approve(InboxItem item) async {
    final l10n = context.l10n;
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _DecisionSheet(
        title: l10n.approvalApproveTitle,
        confirmLabel: l10n.approvalActApprove,
        hint: l10n.approvalNoteOptional,
        minChars: 0,
      ),
    );
    if (note == null || !mounted) return;
    await _run(
      () => ref
          .read(approvalRepositoryProvider)
          .approve(item.instanceId, comment: note.isEmpty ? null : note),
      l10n.approvalDoneApproved,
    );
  }

  Future<void> _negative(InboxItem item, {required bool reject}) async {
    final l10n = context.l10n;
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _DecisionSheet(
        title: reject ? l10n.approvalRejectTitle : l10n.approvalReturnTitle,
        message: reject
            ? l10n.approvalRejectExplain
            : l10n.approvalReturnMessage,
        confirmLabel: reject ? l10n.approvalActReject : l10n.approvalActReturn,
        hint: l10n.approvalReasonHint,
        minChars: 10,
        destructive: reject,
      ),
    );
    if (note == null || !mounted) return;
    final repo = ref.read(approvalRepositoryProvider);
    await _run(
      () => reject
          ? repo.reject(item.instanceId, comment: note)
          : repo.returnForChanges(item.instanceId, comment: note),
      reject ? l10n.approvalDoneRejected : l10n.approvalDoneReturned,
    );
  }

  Future<void> _delegate(InboxItem item) async {
    final l10n = context.l10n;
    final to = await showModalBottomSheet<Person>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _DelegateSheet(),
    );
    if (to == null || !mounted) return;
    await _run(
      () => ref
          .read(approvalRepositoryProvider)
          .delegate(item.instanceId, toUserId: to.userId),
      l10n.approvalDoneDelegated(to.display(bangla: context.isBangla)),
    );
  }

  Future<void> _comment() async {
    final l10n = context.l10n;
    final text = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _DecisionSheet(
        title: l10n.approvalActComment,
        confirmLabel: l10n.approvalSend,
        hint: l10n.approvalCommentHint,
        minChars: 1,
      ),
    );
    if (text == null || !mounted) return;
    await _run(
      () => ref
          .read(approvalRepositoryProvider)
          .comment(widget.instanceId, text: text),
      l10n.approvalDoneComment,
    );
  }

  Future<void> _withdraw() async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.approvalWithdrawConfirm,
      message: l10n.approvalWithdrawMessage,
      destructive: true,
      confirmLabel: l10n.approvalActWithdraw,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(approvalRepositoryProvider).withdraw(widget.instanceId),
      l10n.approvalDoneWithdrawn,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final detail = ref.watch(approvalDetailProvider(widget.instanceId));
    final inbox = ref.watch(approvalInboxProvider).value;
    final mine = inbox
        ?.where((i) => i.instanceId == widget.instanceId)
        .firstOrNull;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.approvalDetailTitle)),
      body: detail.when(
        loading: () => const SkeletonList(itemCount: 4),
        error: (_, _) => ErrorState(
          onRetry: () =>
              ref.invalidate(approvalDetailProvider(widget.instanceId)),
        ),
        data: (d) => Column(
          children: [
            Expanded(
              child: _Body(detail: d, mine: mine),
            ),
            _ActionBar(
              detail: d,
              mine: mine,
              busy: _busy,
              onApprove: mine == null ? null : () => unawaited(_approve(mine)),
              onReject: mine == null
                  ? null
                  : () => unawaited(_negative(mine, reject: true)),
              onReturn: mine == null
                  ? null
                  : () => unawaited(_negative(mine, reject: false)),
              onDelegate: mine == null
                  ? null
                  : () => unawaited(_delegate(mine)),
              onComment: () => unawaited(_comment()),
              onWithdraw: () => unawaited(_withdraw()),
            ),
          ],
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.detail, required this.mine});

  final ApprovalDetail detail;
  final InboxItem? mine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final d = detail;
    final s = d.summary;
    final trail = ref.watch(workflowTrailProvider(d.id)).value;
    final waitingNames = trail?.steps
        .where((x) => x.state == TrailState.active)
        .expand((x) => x.approvers)
        .map((p) => p.displayName(bangla: bangla))
        .toSet()
        .join(', ');

    final next = mine != null
        ? l10n.approvalNextYou(mine!.stepName)
        : d.open
        ? (waitingNames == null || waitingNames.isEmpty
              ? l10n.approvalNextInReview
              : l10n.approvalNextWaiting(waitingNames))
        : l10n.approvalNextClosed(requestStatusLabel(l10n, d.status));

    final link = switch (d.objectType) {
      'Claim' => AppRoutes.claimDetail(d.objectId),
      'LeaveRequest' => AppRoutes.leaveDetail(d.objectId),
      'NoteSheet' => AppRoutes.noteSheetDetail(d.objectId),
      _ => null,
    };
    final comments = [
      for (final a in d.actions)
        if (a.comment != null && a.comment!.isNotEmpty) a,
    ];

    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxl),
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
                          s.displayTitle(bangla: bangla),
                          style: theme.textTheme.titleLarge,
                        ),
                      ),
                      StatusPill(
                        label: requestStatusLabel(l10n, d.status),
                        tone: requestStatusTone(d.status),
                      ),
                    ],
                  ),
                  if (s.refNo.isNotEmpty)
                    Text(
                      s.refNo,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  if (s.amount != null) ...[
                    const SizedBox(height: Space.md),
                    Text(
                      taka(s.amount!, bangla: bangla),
                      style: theme.textTheme.headlineSmall,
                    ),
                  ],
                  const SizedBox(height: Space.md),
                  Text(
                    l10n.approvalFrom(
                      d.initiator.display(bangla: bangla),
                      relativeTime(l10n, d.submittedAt, lang),
                    ),
                    style: theme.textTheme.bodyMedium,
                  ),
                  if (d.rejectionExplanation != null &&
                      d.rejectionExplanation!.isNotEmpty) ...[
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.approvalRejectionSeen,
                      style: theme.textTheme.labelLarge,
                    ),
                    Text(d.rejectionExplanation!),
                  ],
                  if (s.displayDetails(bangla: bangla) != null) ...[
                    const SizedBox(height: Space.sm),
                    Text(
                      '“${s.displayDetails(bangla: bangla)}”',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                  const Divider(height: Space.xl),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        mine != null ? Icons.flag_outlined : Icons.info_outline,
                        size: 18,
                        color: mine != null
                            ? context.bogcl.warning
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(child: Text(next)),
                    ],
                  ),
                  if (link != null)
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: TextButton.icon(
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: Text(l10n.approvalViewRequest),
                        onPressed: () => unawaited(context.push(link)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        SectionHeader(title: l10n.approvalRoute),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.xl),
          child: ApprovalTimeline(instanceId: d.id, submittedAt: d.submittedAt),
        ),
        if (comments.isNotEmpty) ...[
          SectionHeader(title: l10n.approvalDiscussion),
          for (final a in comments)
            ListRow(
              title: a.actor.display(bangla: bangla),
              subtitle:
                  '${actionLabel(l10n, a.type)} · '
                  '${relativeTime(l10n, a.createdAt, lang)}\n“${a.comment}”',
              leading: const Icon(Icons.chat_bubble_outline, size: 20),
            ),
        ],
      ],
    );
  }
}

class _ActionBar extends ConsumerWidget {
  const _ActionBar({
    required this.detail,
    required this.mine,
    required this.busy,
    required this.onApprove,
    required this.onReject,
    required this.onReturn,
    required this.onDelegate,
    required this.onComment,
    required this.onWithdraw,
  });

  final ApprovalDetail detail;
  final InboxItem? mine;
  final bool busy;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onReturn;
  final VoidCallback? onDelegate;
  final VoidCallback onComment;
  final VoidCallback onWithdraw;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final session = ref.watch(sessionControllerProvider).value;
    final isInitiator = session?.profile.id == detail.initiator.userId;
    if (!detail.open) return const SizedBox.shrink();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (mine != null) ...[
              if (mine!.requiresSignature)
                Padding(
                  padding: const EdgeInsets.only(bottom: Space.sm),
                  child: Text(
                    l10n.approvalNeedsSignature,
                    style: TextStyle(color: context.bogcl.warning),
                  ),
                ),
              if (mine!.requiresSignature)
                PrimaryButton(
                  label: l10n.nsSignAction,
                  icon: Icons.draw_outlined,
                  onPressed: detail.objectType == 'NoteSheet'
                      ? () => unawaited(
                          context.push(
                            AppRoutes.noteSheetDetail(detail.objectId),
                          ),
                        )
                      : null,
                )
              else
                PrimaryButton(
                  label: l10n.approvalActApprove,
                  icon: Icons.check,
                  loading: busy,
                  onPressed: onApprove,
                ),
              const SizedBox(height: Space.sm),
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: l10n.approvalActReturn,
                      onPressed: busy ? null : onReturn,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: PrimaryButton.danger(
                      label: l10n.approvalActReject,
                      onPressed: busy ? null : onReject,
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    onPressed: busy ? null : onDelegate,
                    icon: const Icon(Icons.forward_to_inbox_outlined, size: 18),
                    label: Text(l10n.approvalActDelegate),
                  ),
                  TextButton.icon(
                    onPressed: busy ? null : onComment,
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: Text(l10n.approvalActComment),
                  ),
                ],
              ),
            ] else if (isInitiator)
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: l10n.approvalActComment,
                      onPressed: busy ? null : onComment,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: PrimaryButton.danger(
                      label: l10n.approvalActWithdraw,
                      onPressed: busy ? null : onWithdraw,
                    ),
                  ),
                ],
              )
            else
              PrimaryButton.secondary(
                label: l10n.approvalActComment,
                onPressed: busy ? null : onComment,
              ),
          ],
        ),
      ),
    );
  }
}

/// Comment sheet for approve / reject / return / comment.
class _DecisionSheet extends StatefulWidget {
  const _DecisionSheet({
    required this.title,
    required this.confirmLabel,
    required this.hint,
    required this.minChars,
    this.message,
    this.destructive = false,
  });

  final String title;
  final String? message;
  final String confirmLabel;
  final String hint;
  final int minChars;
  final bool destructive;

  @override
  State<_DecisionSheet> createState() => _DecisionSheetState();
}

class _DecisionSheetState extends State<_DecisionSheet> {
  final _text = TextEditingController();
  bool _showError = false;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  void _confirm() {
    final value = _text.text.trim();
    if (value.length < widget.minChars) {
      setState(() => _showError = true);
      return;
    }
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.title, style: theme.textTheme.titleLarge),
              if (widget.message != null) ...[
                const SizedBox(height: Space.xs),
                Text(widget.message!),
              ],
              const SizedBox(height: Space.md),
              AppTextField(
                label: widget.hint,
                controller: _text,
                maxLines: 3,
                maxLength: 1000,
                required: widget.minChars > 0,
                errorText:
                    _showError && _text.text.trim().length < widget.minChars
                    ? l10n.approvalErrMinChars(widget.minChars)
                    : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: Space.lg),
              if (widget.destructive)
                PrimaryButton.danger(
                  label: widget.confirmLabel,
                  onPressed: _confirm,
                )
              else
                PrimaryButton(label: widget.confirmLabel, onPressed: _confirm),
            ],
          ),
        ),
      ),
    );
  }
}

class _DelegateSheet extends ConsumerWidget {
  const _DelegateSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final people = ref.watch(approvalDelegatesProvider);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.approvalDelegateTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: Space.xs),
            Text(l10n.approvalDelegateMessage),
            const SizedBox(height: Space.md),
            people.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(Space.xl),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, _) => ErrorState(
                onRetry: () => ref.invalidate(approvalDelegatesProvider),
              ),
              data: (list) => Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final p in list)
                      ListRow(
                        title: p.display(bangla: bangla),
                        subtitle: p.title,
                        leading: const Icon(Icons.person_outline),
                        onTap: () => Navigator.of(context).pop(p),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
