import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/workflow/presentation/approval_timeline.dart';
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
      ..invalidate(claimPolicyProvider);
  }

  Future<void> _run(
    Future<Object?> Function() action,
    String done, {
    required String failed,
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
        e.code == ApiErrorCode.policyViolation ||
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
  });

  final Claim claim;
  final bool busy;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;
  final VoidCallback onPay;

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
                          children: [
                            Icon(claimTypeIcon(c.type)),
                            const SizedBox(width: Space.sm),
                            Expanded(
                              child: Text(
                                claimTypeLabel(l10n, c.type),
                                style: theme.textTheme.titleLarge,
                              ),
                            ),
                            StatusPill(
                              label: claimStatusLabel(l10n, c.status),
                              tone: claimStatusTone(c.status),
                            ),
                          ],
                        ),
                        Text(
                          c.claimNo,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: Space.md),
                        if (!isOwner)
                          _Fact(
                            l10n.claimFieldEmployee,
                            c.displayEmployee(bangla: bangla),
                          ),
                        _Fact(l10n.claimFieldPurpose, c.purpose),
                        if (period != null)
                          _Fact(l10n.claimFieldPeriod, period),
                        if (c.destinationName != null)
                          _Fact(l10n.claimFieldDestination, c.destinationName!),
                        if (c.travelMode != null)
                          _Fact(
                            l10n.claimFieldMode,
                            travelModeLabel(l10n, c.travelMode!),
                          ),
                        const Divider(height: Space.xl),
                        _Fact(
                          l10n.claimTotal,
                          bdt(c.totalAmount, bangla: bangla),
                          strong: true,
                        ),
                        if (c.advance != null) ...[
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
                        if (c.voucherNo != null)
                          _Fact(l10n.claimVoucher, c.voucherNo!),
                      ],
                    ),
                  ),
                ),
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
                  leading: Icon(
                    l.system
                        ? Icons.auto_awesome
                        : l.receiptFileId != null
                        ? Icons.receipt_long_outlined
                        : l.isDeclaration
                        ? Icons.edit_note
                        : Icons.notes_outlined,
                    size: 20,
                  ),
                  trailing: l.system
                      ? StatusPill(
                          label: l10n.claimLineAuto,
                          tone: StatusTone.info,
                        )
                      : l.isDeclaration
                      ? StatusPill(label: l10n.claimLineDeclared)
                      : null,
                  onTap: l.receiptFileId == null
                      ? null
                      : () => unawaited(
                          showFileImage(context, ref, l.receiptFileId!),
                        ),
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
            ],
          ),
        ),
        if ((isOwner && (c.status.editable || c.status.pending)) || canPay)
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
