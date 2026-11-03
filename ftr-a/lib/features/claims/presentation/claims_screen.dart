import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { claims, advances, payable }

/// Claims home: my claims, my advances, and (Finance) what is ready to pay.
class ClaimsScreen extends ConsumerStatefulWidget {
  const ClaimsScreen({super.key});

  @override
  ConsumerState<ClaimsScreen> createState() => _ClaimsScreenState();
}

class _ClaimsScreenState extends ConsumerState<ClaimsScreen> {
  _Tab _tab = _Tab.claims;

  Future<void> _refresh() async {
    ref
      ..invalidate(claimsProvider)
      ..invalidate(advancesProvider)
      ..invalidate(claimPolicyProvider);
    await ref.read(claimsProvider('mine').future);
  }

  Future<void> _newClaim() async {
    final l10n = context.l10n;
    final type = await showModalBottomSheet<ClaimType>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SectionHeader(title: l10n.claimNewTitle),
              for (final t in ClaimType.values)
                Padding(
                  padding: const EdgeInsets.only(bottom: Space.sm),
                  child: ListRow(
                    title: claimTypeLabel(l10n, t),
                    subtitle: switch (t) {
                      ClaimType.tada => l10n.claimTypeTadaHint,
                      ClaimType.conveyance => l10n.claimTypeConveyanceHint,
                      ClaimType.tourEvent => l10n.claimTypeTourHint,
                    },
                    leading: Icon(claimTypeIcon(t)),
                    onTap: () => Navigator.of(ctx).pop(t),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
    if (type == null || !mounted) return;
    unawaited(context.push('${AppRoutes.claimNew}?type=${type.wire}'));
  }

  Future<void> _settle(Future<Object?> Function() action, String done) async {
    final l10n = context.l10n;
    try {
      await action();
      ref
        ..invalidate(claimsProvider)
        ..invalidate(advancesProvider);
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (_) {
      if (!mounted) return;
      AppToast.show(context, l10n.claimErrFailed, tone: StatusTone.danger);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final session = ref.watch(sessionControllerProvider).value;
    final canSettle = session?.can('claims:settle') ?? false;
    final canAdvance = session?.can('claims:advance') ?? false;
    final tabs = <(_Tab, String)>[
      (_Tab.claims, l10n.claimTabClaims),
      if (canAdvance) (_Tab.advances, l10n.claimTabAdvances),
      if (canSettle) (_Tab.payable, l10n.claimTabPayable),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.claimsTitle)),
      floatingActionButton: switch (_tab) {
        _Tab.claims => FloatingActionButton.extended(
          onPressed: () => unawaited(_newClaim()),
          icon: const Icon(Icons.add),
          label: Text(l10n.claimNew),
        ),
        _Tab.advances => FloatingActionButton.extended(
          onPressed: () => unawaited(context.push(AppRoutes.advanceNew)),
          icon: const Icon(Icons.add),
          label: Text(l10n.advNew),
        ),
        _Tab.payable => null,
      },
      body: Column(
        children: [
          if (tabs.length > 1)
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
                  for (final t in tabs) ...[
                    ChoiceChip(
                      label: Text(t.$2),
                      selected: _tab == t.$1,
                      onSelected: (_) => setState(() => _tab = t.$1),
                    ),
                    const SizedBox(width: Space.sm),
                  ],
                ],
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: switch (_tab) {
                _Tab.claims => const _ClaimList(scope: 'mine', showPolicy: true),
                _Tab.advances => _AdvanceList(
                  scope: 'mine',
                  onAction: _settle,
                ),
                _Tab.payable => _Payables(onAction: _settle),
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ClaimList extends ConsumerWidget {
  const _ClaimList({required this.scope, this.showPolicy = false});

  final String scope;
  final bool showPolicy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final list = ref.watch(claimsProvider(scope));
    return list.when(
      loading: () => const SkeletonList(),
      error: (_, _) => ErrorState(onRetry: () => ref.invalidate(claimsProvider)),
      data: (items) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 96),
        children: [
          if (showPolicy) const _PolicyCard(),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: Space.xxxl),
              child: EmptyState(
                icon: Icons.receipt_long_outlined,
                title: l10n.claimEmptyTitle,
                message: l10n.claimEmptyMessage,
              ),
            )
          else
            for (final c in items)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.xs,
                ),
                child: ClaimRow(claim: c, showOwner: scope != 'mine'),
              ),
        ],
      ),
    );
  }
}

class ClaimRow extends StatelessWidget {
  const ClaimRow({required this.claim, this.showOwner = false, super.key});

  final Claim claim;
  final bool showOwner;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final period = claim.periodStart == null
        ? null
        : DateFmt.range(claim.periodStart!, claim.periodEnd ?? claim.periodStart!, lang);
    return ListRow(
      title:
          '${claimTypeLabel(l10n, claim.type)} · '
          '${bdt(claim.totalAmount, bangla: bangla)}',
      subtitle: [
        if (showOwner) claim.displayEmployee(bangla: bangla),
        claim.purpose,
        ?period,
        claim.claimNo,
      ].join('\n'),
      leading: Icon(claimTypeIcon(claim.type)),
      trailing: StatusPill(
        label: claimStatusLabel(l10n, claim.status),
        tone: claimStatusTone(claim.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.claimDetail(claim.id))),
    );
  }
}

class _PolicyCard extends ConsumerWidget {
  const _PolicyCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final policy = ref.watch(claimPolicyProvider).value;
    if (policy == null) return const SizedBox.shrink();
    final used = policy.conveyanceUsedThisMonth;
    final cap = policy.conveyanceMonthlyCap;
    final ratio = cap == 0 ? 0.0 : (used / cap).clamp(0, 1).toDouble();
    return Padding(
      padding: const EdgeInsets.all(Space.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.claimPolicyTitle(policy.band), style: theme.textTheme.titleSmall),
              const SizedBox(height: Space.sm),
              Text(
                l10n.claimPolicyConveyance(
                  bdt(used, bangla: bangla),
                  bdt(cap, bangla: bangla),
                ),
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: Space.xs),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: ratio,
                  minHeight: 8,
                  color: ratio >= 0.8 ? context.bogcl.warning : null,
                ),
              ),
              const SizedBox(height: Space.sm),
              Text(
                l10n.claimPolicyDa(
                  bdt(policy.daDhaka, bangla: bangla),
                  bdt(policy.daDistrict, bangla: bangla),
                ),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (policy.hotelCapPerNight != null)
                Text(
                  l10n.claimPolicyHotel(
                    bdt(policy.hotelCapPerNight!, bangla: bangla),
                  ),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdvanceList extends ConsumerWidget {
  const _AdvanceList({required this.scope, required this.onAction});

  final String scope;
  final Future<void> Function(Future<Object?> Function(), String) onAction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final list = ref.watch(advancesProvider(scope));
    return list.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(advancesProvider)),
      data: (items) => items.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: Space.xxxl),
                EmptyState(
                  icon: Icons.payments_outlined,
                  title: l10n.advEmptyTitle,
                  message: l10n.advEmptyMessage,
                ),
              ],
            )
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 96, top: Space.sm),
              children: [
                for (final a in items)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Space.lg,
                      vertical: Space.xs,
                    ),
                    child: AdvanceCard(advance: a, scope: scope, onAction: onAction),
                  ),
              ],
            ),
    );
  }
}

class AdvanceCard extends ConsumerWidget {
  const AdvanceCard({
    required this.advance,
    required this.scope,
    required this.onAction,
    super.key,
  });

  final Advance advance;
  final String scope;
  final Future<void> Function(Future<Object?> Function(), String) onAction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final repo = ref.read(claimRepositoryProvider);
    final cancellable =
        scope == 'mine' &&
        (advance.status == AdvanceStatus.pendingManager ||
            advance.status == AdvanceStatus.pendingFinance ||
            advance.status == AdvanceStatus.approved);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Space.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    bdt(advance.amount, bangla: bangla),
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                StatusPill(
                  label: advanceStatusLabel(l10n, advance.status),
                  tone: advanceStatusTone(advance.status),
                ),
              ],
            ),
            const SizedBox(height: Space.xs),
            Text(advance.purpose),
            Text(
              '${DateFmt.range(advance.tourStart, advance.tourEnd, lang)} · ${advance.advanceNo}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (scope != 'mine')
              Text(
                advance.displayEmployee(bangla: bangla),
                style: theme.textTheme.bodySmall,
              ),
            if (advance.open)
              Padding(
                padding: const EdgeInsets.only(top: Space.sm),
                child: Text(
                  l10n.advSettleHint,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: context.bogcl.warning,
                  ),
                ),
              ),
            if (scope == 'payable')
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton.icon(
                  icon: const Icon(Icons.payments_outlined),
                  label: Text(l10n.advDisburse),
                  onPressed: () async {
                    final ok = await showConfirmSheet(
                      context,
                      title: l10n.advDisburseConfirm(
                        bdt(advance.amount, bangla: bangla),
                      ),
                      confirmLabel: l10n.advDisburse,
                    );
                    if (ok) {
                      unawaited(
                        onAction(
                          () => repo.disburseAdvance(advance.id),
                          l10n.advDisbursed,
                        ),
                      );
                    }
                  },
                ),
              ),
            if (cancellable)
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton(
                  onPressed: () async {
                    final ok = await showConfirmSheet(
                      context,
                      title: l10n.advCancelConfirm,
                      destructive: true,
                      confirmLabel: l10n.advCancel,
                    );
                    if (ok) {
                      unawaited(
                        onAction(
                          () => repo.cancelAdvance(advance.id),
                          l10n.advCancelled,
                        ),
                      );
                    }
                  },
                  child: Text(l10n.advCancel),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Payables extends ConsumerWidget {
  const _Payables({required this.onAction});

  final Future<void> Function(Future<Object?> Function(), String) onAction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final claims = ref.watch(claimsProvider('payable'));
    final advances = ref.watch(advancesProvider('payable'));
    if (claims.isLoading || advances.isLoading) return const SkeletonList();
    if (claims.hasError || advances.hasError) {
      return ErrorState(
        onRetry: () => ref
          ..invalidate(claimsProvider)
          ..invalidate(advancesProvider),
      );
    }
    final c = claims.requireValue;
    final a = advances.requireValue;
    if (c.isEmpty && a.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: Space.xxxl),
          EmptyState(
            icon: Icons.task_alt,
            title: l10n.payEmptyTitle,
            message: l10n.payEmptyMessage,
          ),
        ],
      );
    }
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 96),
      children: [
        if (c.isNotEmpty) SectionHeader(title: l10n.payClaims),
        for (final x in c)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: ClaimRow(claim: x, showOwner: true),
          ),
        if (a.isNotEmpty) SectionHeader(title: l10n.payAdvances),
        for (final x in a)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: AdvanceCard(advance: x, scope: 'payable', onAction: onAction),
          ),
      ],
    );
  }
}
