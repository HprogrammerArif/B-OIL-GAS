import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { claims, awaitingMe, scope, advances, payable }

enum _ClaimFilter { all, awaiting, others }

/// Claims home: my claims, waiting-for-you, team/plant, advances, payables.
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
      ..invalidate(claimPolicyProvider)
      ..invalidate(approvalInboxProvider);
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
    final canCreate = session?.can('claims:create') ?? false;
    final beyondSelf = session?.can('claims:read', GrantScope.team) ?? false;
    final readGrant = session?.grant('claims:read');
    final readScope = readGrant == null
        ? GrantScope.self
        : Session.scopeOf(readGrant);
    final canSettle = session?.can('claims:settle') ?? false;
    final canAdvance = session?.can('claims:advance') ?? false;
    final teamAsync = beyondSelf ? ref.watch(claimsProvider('team')) : null;
    final teamItems = teamAsync?.value ?? const <Claim>[];
    final awaiting = [
      for (final c in teamItems)
        if (c.awaitingYou) c,
    ];
    final scopeLabel = switch (readScope) {
      GrantScope.site => l10n.claimTabPlant,
      GrantScope.company => l10n.claimTabAll,
      _ => l10n.claimTabTeam,
    };

    final tabs = <(_Tab, String)>[
      if (canCreate) (_Tab.claims, l10n.claimTabClaims),
      if (beyondSelf) (_Tab.awaitingMe, l10n.claimTabAwaiting(awaiting.length)),
      if (beyondSelf) (_Tab.scope, scopeLabel),
      if (canAdvance) (_Tab.advances, l10n.claimTabAdvances),
      if (canSettle) (_Tab.payable, l10n.claimTabPayable),
    ];

    final effectiveTab = tabs.any((t) => t.$1 == _tab) ? _tab : tabs.first.$1;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.claimsTitle),
        actions: const [AppBarActions()],
      ),
      floatingActionButton: switch (effectiveTab) {
        _Tab.claims when canCreate => FloatingActionButton.extended(
          onPressed: () => unawaited(_newClaim()),
          icon: const Icon(Icons.add),
          label: Text(l10n.claimNew),
        ),
        _Tab.advances when canAdvance => FloatingActionButton.extended(
          onPressed: () => unawaited(context.push(AppRoutes.advanceNew)),
          icon: const Icon(Icons.add),
          label: Text(l10n.advNew),
        ),
        _ => null,
      },
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Sub-Tabs
          if (tabs.length > 1)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                Space.sm,
                Space.lg,
                Space.xs,
              ),
              child: Row(
                children: [
                  for (final t in tabs) ...[
                    ChoiceChip(
                      label: Text(t.$2),
                      selected: effectiveTab == t.$1,
                      onSelected: (_) {
                        Haptics.tap();
                        setState(() => _tab = t.$1);
                      },
                    ),
                    const SizedBox(width: Space.xs),
                  ],
                ],
              ),
            ),

          // Tab Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: switch (effectiveTab) {
                _Tab.claims => const _ClaimList(scope: 'mine'),
                _Tab.awaitingMe => _ClaimList(
                  scope: 'team',
                  filter: _ClaimFilter.awaiting,
                  showOwner: true,
                  emptyTitle: l10n.claimAwaitEmptyTitle,
                  emptyMessage: l10n.claimAwaitEmptyMessage,
                ),
                _Tab.scope => _ClaimList(
                  scope: 'team',
                  filter: _ClaimFilter.others,
                  showOwner: true,
                  emptyTitle: l10n.claimScopeEmptyTitle,
                  emptyMessage: l10n.claimScopeEmptyMessage,
                ),
                _Tab.advances => _AdvanceList(scope: 'mine', onAction: _settle),
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
  const _ClaimList({
    required this.scope,
    this.filter = _ClaimFilter.all,
    this.showOwner = false,
    this.emptyTitle,
    this.emptyMessage,
  });

  final String scope;
  final _ClaimFilter filter;
  final bool showOwner;
  final String? emptyTitle;
  final String? emptyMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final list = ref.watch(claimsProvider(scope));
    return list.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(claimsProvider)),
      data: (items) {
        final shown = switch (filter) {
          _ClaimFilter.all => items,
          _ClaimFilter.awaiting => items.where((c) => c.awaitingYou).toList(),
          _ClaimFilter.others => items.where((c) => !c.awaitingYou).toList(),
        };
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            if (shown.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: Space.xxxl),
                child: EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: emptyTitle ?? l10n.claimEmptyTitle,
                  message: emptyMessage ?? l10n.claimEmptyMessage,
                ),
              )
            else
              for (final c in shown)
                _ClaimRow(claim: c, showOwner: showOwner || scope != 'mine'),
          ],
        );
      },
    );
  }
}

class _ClaimRow extends StatelessWidget {
  const _ClaimRow({required this.claim, this.showOwner = false});

  final Claim claim;
  final bool showOwner;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final c = claim;
    final title = c.purpose.trim().isEmpty ? c.claimNo : c.purpose;
    final bits = [
      bdt(c.totalAmount, bangla: bangla),
      if (showOwner) c.displayEmployee(bangla: bangla),
    ];
    final next = claimNextLine(
      l10n,
      c,
      bangla: bangla,
      awaitingYou: c.awaitingYou,
    );
    return ListRow(
      title: title,
      subtitle: '${bits.join(' · ')}\n$next',
      trailing: StatusPill(
        label: claimStatusLabel(l10n, c.status),
        tone: claimStatusTone(c.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.claimDetail(c.id))),
    );
  }
}

class _AdvanceList extends ConsumerWidget {
  const _AdvanceList({required this.scope, required this.onAction});

  final String scope;
  final Future<void> Function(Future<Object?> Function(), String)? onAction;

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
                    child: AdvanceCard(
                      advance: a,
                      scope: scope,
                      onAction: onAction,
                    ),
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
  final Future<void> Function(Future<Object?> Function(), String)? onAction;

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
            if (scope == 'payable' && onAction != null)
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
                        onAction!(
                          () => repo.disburseAdvance(advance.id),
                          l10n.advDisbursed,
                        ),
                      );
                    }
                  },
                ),
              ),
            if (cancellable && onAction != null)
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
                        onAction!(
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

  final Future<void> Function(Future<Object?> Function(), String)? onAction;

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
        if (c.isNotEmpty) ...[
          SectionHeader(title: l10n.payClaims),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.sm),
              child: TextButton.icon(
                onPressed: () => unawaited(_bankFile(context, c)),
                icon: const Icon(Icons.account_balance_outlined),
                label: Text(l10n.claimBankFile),
              ),
            ),
          ),
        ],
        for (final x in c) _ClaimRow(claim: x, showOwner: true),
        if (a.isNotEmpty) SectionHeader(title: l10n.payAdvances),
        for (final x in a)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: AdvanceCard(
              advance: x,
              scope: 'payable',
              onAction: onAction,
            ),
          ),
      ],
    );
  }
}

Future<void> _bankFile(BuildContext context, List<Claim> claims) async {
  final l10n = context.l10n;
  final bangla = context.isBangla;
  if (claims.isEmpty) {
    AppToast.show(context, l10n.claimBankEmpty);
    return;
  }
  final lines = [
    for (final x in claims)
      '${x.claimNo} · ${x.displayEmployee(bangla: bangla)} · ${bdt(x.netSettlement ?? x.policyAmount, bangla: bangla)}',
  ];
  final copied = await showModalBottomSheet<bool>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.sm,
        Space.lg,
        Space.xl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.claimBankReady, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          for (final line in lines)
            Padding(
              padding: const EdgeInsets.only(bottom: Space.xs),
              child: Text(line),
            ),
          const SizedBox(height: Space.lg),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.claimBankFile),
          ),
        ],
      ),
    ),
  );
  if (copied != true || !context.mounted) return;
  await Clipboard.setData(ClipboardData(text: lines.join('\n')));
  if (context.mounted) {
    AppToast.show(context, l10n.claimBankCopied, tone: StatusTone.success);
  }
}
