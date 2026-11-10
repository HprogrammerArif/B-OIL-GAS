import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
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

/// One claim: summary, lines, policy flags, approval route and actions.
class ClaimDetailScreen extends ConsumerStatefulWidget {
  const ClaimDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ClaimDetailScreen> createState() => _ClaimDetailScreenState();
}

class _ClaimDetailScreenState extends ConsumerState<ClaimDetailScreen> {
  bool _busy = false;

  void _refreshAll() {
    ref
      ..invalidate(claimDetailProvider(widget.id))
      ..invalidate(claimsProvider)
      ..invalidate(advancesProvider)
      ..invalidate(claimPolicyProvider)
      ..invalidate(approvalInboxProvider)
      ..invalidate(approvalDetailProvider);
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
      final l10n = context.l10n;
      AppToast.show(
        context,
        apiMessage && e.message.isNotEmpty
            ? e.message
            : e.code == ApiErrorCode.policyViolation ||
                  e.code == ApiErrorCode.validationError
            ? l10n.claimErrBlocked
            : failed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit(Claim c) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.claimSubmitConfirmTitle,
      message: l10n.claimSubmitConfirmMessage,
      confirmLabel: l10n.claimSubmit,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(claimRepositoryProvider).submit(c.id),
      l10n.claimSubmitted,
      failed: l10n.claimErrFailed,
    );
  }

  Future<void> _cancel(Claim c) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.claimCancelConfirm,
      destructive: true,
      confirmLabel: l10n.claimCancel,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(claimRepositoryProvider).cancel(c.id),
      l10n.claimCancelled,
      failed: l10n.claimErrFailed,
    );
  }

  Future<void> _verify(Claim c) async {
    final l10n = context.l10n;
    final id = c.workflowInstanceId;
    if (!c.awaitingYou || id == null) return;
    await _run(
      () => ref.read(approvalRepositoryProvider).approve(id),
      l10n.claimVerified,
      failed: l10n.claimErrFailed,
      apiMessage: true,
    );
  }

  Future<void> _returnClaim(Claim c) async {
    final id = c.workflowInstanceId;
    if (!c.awaitingYou || id == null) return;
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
      l10n.claimReturnedToast,
      failed: l10n.claimErrFailed,
      apiMessage: true,
    );
  }

  Future<void> _pay(Claim c) async {
    final l10n = context.l10n;
    final net = c.netSettlement ?? c.totalAmount;
    final ok = await showConfirmSheet(
      context,
      title: l10n.claimPayConfirm(bdt(net, bangla: context.isBangla)),
      message: l10n.claimPayMessage,
      confirmLabel: l10n.claimPay,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(claimRepositoryProvider).pay(c.id),
      l10n.claimPaid,
      failed: l10n.claimErrFailed,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final detail = ref.watch(claimDetailProvider(widget.id));
    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(title: Text(l10n.claimDetailTitle)),
        body: detail.when(
          loading: () => const SkeletonList(itemCount: 4),
          error: (_, _) => ErrorState(
            onRetry: () => ref.invalidate(claimDetailProvider(widget.id)),
          ),
          data: (c) => _Body(
            claim: c,
            busy: _busy,
            onSubmit: () => unawaited(_submit(c)),
            onCancel: () => unawaited(_cancel(c)),
            onPay: () => unawaited(_pay(c)),
            onVerify: () => unawaited(_verify(c)),
            onReturn: () => unawaited(_returnClaim(c)),
          ),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({
    required this.claim,
    required this.busy,
    required this.onSubmit,
    required this.onCancel,
    required this.onPay,
    required this.onVerify,
    required this.onReturn,
  });

  final Claim claim;
  final bool busy;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;
  final VoidCallback onPay;
  final VoidCallback onVerify;
  final VoidCallback onReturn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final session = ref.watch(sessionControllerProvider).value;
    final isOwner = session?.profile.employee.id == claim.employeeId;
    final canPay =
        (session?.can('claims:settle') ?? false) &&
        !isOwner &&
        claim.status == ClaimStatus.approved;
    final c = claim;
    final period = c.periodStart == null
        ? null
        : DateFmt.range(c.periodStart!, c.periodEnd ?? c.periodStart!, lang);
    final receipts = [
      for (final l in c.lines)
        if (l.receiptFileId != null) l.receiptFileId!,
    ];
    final next = claimNextLine(
      l10n,
      c,
      bangla: bangla,
      awaitingYou: c.awaitingYou,
    );
    final showBar =
        (isOwner && (c.status.editable || c.status.pending)) ||
        c.awaitingYou ||
        canPay;

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
                                c.purpose,
                                style: theme.textTheme.titleLarge,
                              ),
                            ),
                            StatusPill(
                              label: claimStatusLabel(l10n, c.status),
                              tone: claimStatusTone(c.status),
                            ),
                          ],
                        ),
                        const SizedBox(height: Space.xs),
                        Text(
                          '${claimTypeLabel(l10n, c.type)} · '
                          '${bdt(c.totalAmount, bangla: bangla)}',
                          style: theme.textTheme.titleMedium,
                        ),
                        if (!isOwner) ...[
                          const SizedBox(height: Space.xs),
                          Text(c.displayEmployee(bangla: bangla)),
                        ],
                        if (period != null) ...[
                          const SizedBox(height: Space.xs),
                          Text(period),
                        ],
                        if (c.destinationName != null) ...[
                          const SizedBox(height: Space.xs),
                          Text(c.destinationName!),
                        ],
                        const SizedBox(height: Space.md),
                        Text(next, style: theme.textTheme.bodyMedium),
                        if (c.advance != null) ...[
                          const Divider(height: Space.xl),
                          _Fact(
                            l10n.claimAdvanceAdjusted,
                            '− ${bdt(c.advance!.amount, bangla: bangla)}',
                          ),
                          _Fact(
                            (c.netSettlement ?? 0) >= 0
                                ? l10n.claimNetPayable
                                : l10n.claimNetRefund,
                            bdt((c.netSettlement ?? 0).abs(), bangla: bangla),
                            strong: true,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              if (receipts.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    0,
                    Space.lg,
                    Space.md,
                  ),
                  child: EvidenceStrip(fileIds: receipts),
                ),
              if (c.flags.isNotEmpty) _Flags(flags: c.flags),
              if (c.reviewComment != null &&
                  (c.status == ClaimStatus.rejected ||
                      c.status == ClaimStatus.returned))
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Space.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.claimReviewerComment,
                            style: theme.textTheme.titleSmall,
                          ),
                          const SizedBox(height: Space.xs),
                          Text('“${c.reviewComment}”'),
                        ],
                      ),
                    ),
                  ),
                ),
              SectionHeader(title: l10n.claimLines(c.lines.length)),
              for (final l in c.lines)
                ListRow(
                  title:
                      '${claimCategoryLabel(l10n, l.category)} · '
                      '${bdt(l.amount, bangla: bangla)}',
                  subtitle: [
                    DateFmt.range(l.date, l.date, lang),
                    if (l.description.isNotEmpty) l.description,
                    if (l.fromPlace != null && l.toPlace != null)
                      '${l.fromPlace} → ${l.toPlace}',
                    if (l.distanceKm != null)
                      l10n.claimKm(l.distanceKm!.toStringAsFixed(0)),
                  ].join('\n'),
                  trailing: l.system
                      ? StatusPill(
                          label: l10n.claimLineAuto,
                          tone: StatusTone.info,
                        )
                      : l.isDeclaration
                      ? StatusPill(label: l10n.claimLineDeclared)
                      : null,
                ),
              if (c.workflowInstanceId != null) ...[
                SectionHeader(title: l10n.claimRoute),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: Space.xl),
                  child: ApprovalTimeline(
                    instanceId: c.workflowInstanceId!,
                    submittedAt: c.createdAt,
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
                    child: Column(
                      children: [
                        _Fact(l10n.claimNumber, c.claimNo),
                        if (c.voucherNo != null)
                          _Fact(l10n.claimVoucher, c.voucherNo!),
                        if (c.travelMode != null)
                          _Fact(
                            l10n.claimFieldMode,
                            travelModeLabel(l10n, c.travelMode!),
                          ),
                      ],
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
                  if (isOwner && c.status.editable) ...[
                    PrimaryButton(
                      label: l10n.claimSubmit,
                      loading: busy,
                      onPressed: c.hardFlags > 0 ? null : onSubmit,
                    ),
                    const SizedBox(height: Space.sm),
                    Row(
                      children: [
                        Expanded(
                          child: PrimaryButton.secondary(
                            label: l10n.claimEdit,
                            onPressed: busy
                                ? null
                                : () => unawaited(
                                    context.push(AppRoutes.claimEdit(c.id)),
                                  ),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: PrimaryButton.danger(
                            label: l10n.claimCancel,
                            onPressed: busy ? null : onCancel,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (isOwner && c.status.pending)
                    PrimaryButton.danger(
                      label: l10n.claimWithdraw,
                      onPressed: busy ? null : onCancel,
                    ),
                  if (c.awaitingYou) ...[
                    PrimaryButton(
                      label: l10n.claimVerify,
                      loading: busy,
                      onPressed: onVerify,
                    ),
                    const SizedBox(height: Space.sm),
                    PrimaryButton.secondary(
                      label: l10n.claimReturn,
                      onPressed: busy ? null : onReturn,
                    ),
                  ],
                  if (canPay)
                    PrimaryButton(
                      label: l10n.claimPay,
                      loading: busy,
                      onPressed: onPay,
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _Flags extends StatelessWidget {
  const _Flags({required this.flags});

  final List<ClaimFlag> flags;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final colors = context.bogcl;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final f in flags)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: Space.xs),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        f.hard ? Icons.block : Icons.warning_amber_rounded,
                        size: 18,
                        color: f.hard ? colors.danger : colors.warning,
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Text(claimFlagLabel(l10n, f, bangla: bangla)),
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
      l10n.claimReturnPreset1,
      l10n.claimReturnPreset2,
      l10n.claimReturnPreset3,
      l10n.claimReturnPreset4,
    ];
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.claimReturnTitle, style: theme.textTheme.titleLarge),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.claimReturnHint,
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
              PrimaryButton(label: l10n.claimReturn, onPressed: _confirm),
            ],
          ),
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value, {this.strong = false});

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Space.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
            child: Text(
              value,
              style: strong
                  ? theme.textTheme.titleMedium
                  : theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
