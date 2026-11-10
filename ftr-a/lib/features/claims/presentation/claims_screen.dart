import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
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

enum _Tab { claims, awaitingMe, scope, advances, payable, policy }

enum _ClaimFilter { all, awaiting, others }

/// Claims home: my claims, approver queue, advances, payables, and Grade 1-10 policy matrix.
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
    final bangla = context.isBangla;
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
      (
        _Tab.policy,
        bangla ? 'ভাতা নীতি (গ্রেড ১–১০)' : 'Allowance Policy (G1–10)',
      ),
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
                  isApproverView: true,
                  emptyTitle: l10n.claimAwaitEmptyTitle,
                  emptyMessage: l10n.claimAwaitEmptyMessage,
                  onAction: _settle,
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
                _Tab.policy => const _GradePolicyTable(),
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
    this.isApproverView = false,
    this.emptyTitle,
    this.emptyMessage,
    this.onAction,
  });

  final String scope;
  final _ClaimFilter filter;
  final bool showOwner;
  final bool isApproverView;
  final String? emptyTitle;
  final String? emptyMessage;
  final Future<void> Function(Future<Object?> Function(), String)? onAction;

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
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Space.lg,
                    vertical: Space.xs,
                  ),
                  child: ClaimCard(
                    claim: c,
                    showOwner: showOwner || scope != 'mine',
                    isApproverView: isApproverView,
                    onAction: onAction,
                  ),
                ),
          ],
        );
      },
    );
  }
}

/// Rich Claim Card featuring the 4-Stage Lifecycle Strip, Return Query Box & Resubmit CTA
class ClaimCard extends ConsumerStatefulWidget {
  const ClaimCard({
    required this.claim,
    this.showOwner = false,
    this.isApproverView = false,
    this.onAction,
    super.key,
  });

  final Claim claim;
  final bool showOwner;
  final bool isApproverView;
  final Future<void> Function(Future<Object?> Function(), String)? onAction;

  @override
  ConsumerState<ClaimCard> createState() => _ClaimCardState();
}

class _ClaimCardState extends ConsumerState<ClaimCard> {
  String? _localVoucher;
  bool _verifiedLocally = false;
  bool _paidLocally = false;

  @override
  void didUpdateWidget(ClaimCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.claim.status != widget.claim.status ||
        oldWidget.claim.voucherNo != widget.claim.voucherNo) {
      _localVoucher = null;
      _verifiedLocally = false;
      _paidLocally = false;
    }
  }

  Future<void> _payClaim(BuildContext context, Claim c, bool bangla) async {
    try {
      final paid = await ref.read(claimRepositoryProvider).pay(c.id);
      ref.invalidate(claimsProvider);
      if (!mounted) return;
      setState(() {
        _localVoucher = paid.voucherNo;
        _paidLocally = true;
      });
      if (!context.mounted) return;
      AppToast.show(
        context,
        bangla
            ? 'পরিশোধ হয়েছে। ভাউচার ${paid.voucherNo ?? ''}'
            : 'Paid. Voucher ${paid.voucherNo ?? ''}',
        tone: StatusTone.success,
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }

  void _promptReturnQuery(BuildContext context) {
    final bangla = context.isBangla;
    final presets = [
      if (bangla)
        'মূল ভ্যাট চালান / ভাউচার রসিদ সংযুক্ত নেই'
      else
        'Missing Original VAT Challan / Cash Receipt',
      if (bangla)
        'গ্রেড অনুযায়ী দৈনিক ভাতা / হোটেলের নির্ধারিত সিলিং অতিক্রম করেছে'
      else
        'Exceeds Grade DA / Hotel Entitlement Cap',
      if (bangla)
        'ভুল কস্ট সেন্টার নির্বাচন করা হয়েছে (প্রয়োজন CC-2200)'
      else
        'Wrong Cost Center Selected (Requires CC-2200)',
      if (bangla)
        'বিভাগীয় প্রধানের সফর অনুমোদন পত্র প্রয়োজন'
      else
        'Requires HOD Tour Prior Authorization Letter',
    ];

    unawaited(
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (ctx) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  bangla ? 'আপত্তি সহ ফেরত পাঠান' : 'Return Claim with Query',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'দাখিলকারীর কাছে কী সংশোধন প্রয়োজন তা নির্বাচন করুন:'
                      : 'Select the correction required from the claimant:',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                for (final p in presets) ...[
                  ListTile(
                    title: Text(p, style: const TextStyle(fontSize: 12.5)),
                    leading: const Icon(Icons.help_outline, size: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Corner.md),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    onTap: () async {
                      Navigator.of(ctx).pop();
                      final instanceId = widget.claim.workflowInstanceId;
                      if (instanceId == null || instanceId.isEmpty) {
                        AppToast.show(
                          context,
                          bangla
                              ? 'এই দাবির কোনো অনুমোদন খোলা নেই।'
                              : 'This claim has no open approval to return.',
                          tone: StatusTone.warning,
                        );
                        return;
                      }
                      try {
                        await ref
                            .read(approvalRepositoryProvider)
                            .returnForChanges(instanceId, comment: p);
                        ref.invalidate(claimsProvider);
                        if (!context.mounted) return;
                        AppToast.show(
                          context,
                          bangla
                              ? 'দাবিটি এই আপত্তিসহ ফেরত গেছে।'
                              : 'Claim returned with that query.',
                          tone: StatusTone.warning,
                        );
                      } on ApiException catch (e) {
                        if (!context.mounted) return;
                        AppToast.show(
                          context,
                          e.message,
                          tone: StatusTone.danger,
                        );
                      }
                    },
                  ),
                  const SizedBox(height: Space.xs),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lang = Localizations.localeOf(context).languageCode;
    final c = widget.claim;

    final period = c.periodStart == null
        ? null
        : DateFmt.range(c.periodStart!, c.periodEnd ?? c.periodStart!, lang);

    final isReturned = c.status == ClaimStatus.returned;
    final hasVoucher = c.voucherNo != null || _localVoucher != null;
    final voucherCode = _localVoucher ?? c.voucherNo ?? 'SAP-FI-2026-884';

    // Determine current progress step (1 to 4)
    final int step;
    if (_paidLocally || c.status == ClaimStatus.settled) {
      step = 4;
    } else if (hasVoucher || c.status == ClaimStatus.approved) {
      step = 3;
    } else if (_verifiedLocally || c.status == ClaimStatus.pendingFinance) {
      step = 2;
    } else {
      step = 1;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Space.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Type, Amount & Status Pill
            Row(
              children: [
                Icon(claimTypeIcon(c.type), size: 20, color: scheme.primary),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    '${claimTypeLabel(l10n, c.type)} · ${bdt(c.totalAmount, bangla: bangla)}',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                StatusPill(
                  label: claimStatusLabel(l10n, c.status),
                  tone: claimStatusTone(c.status),
                ),
              ],
            ),
            const SizedBox(height: 4),

            // Purpose & Subtitle
            Text(
              c.purpose,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              [
                if (widget.showOwner) c.displayEmployee(bangla: bangla),
                if (!c.awaitingYou && c.waitingForName(bangla: bangla) != null)
                  l10n.claimWaitingFor(c.waitingForName(bangla: bangla)!),
                ?period,
                c.claimNo,
              ].join(' · '),
              style: theme.textTheme.bodySmall?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: Space.sm),

            // 4-Stage Progress Strip
            _lifecycleStrip(context, step, bangla),
            const SizedBox(height: Space.sm),

            // SAP Voucher Tag
            if (hasVoucher) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(Corner.sm),
                  border: Border.all(color: Colors.blue.shade300),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.receipt, size: 14, color: Colors.blue),
                    const SizedBox(width: 4),
                    Text(
                      'SAP FI Voucher: #$voucherCode',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Space.xs),
            ],

            // Returned Query Banner & Resubmit CTA
            if (isReturned) ...[
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(Corner.md),
                  border: Border.all(color: Colors.amber.shade400),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.warning_amber_rounded,
                          size: 16,
                          color: Colors.amber,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'QUERY FROM ACCOUNTS / HOD',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.brown,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      c.reviewComment ??
                          (bangla
                              ? 'মূল ভ্যাট চালান ও হোটেলের বিল সংযুক্ত করুন। গ্রেড ৭ অনুযায়ী দৈনিক ভাতা সংশোধন করুন।'
                              : 'Please attach original VAT challan & Hotel bill. Correct DA according to Grade 7 cap.'),
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: Space.xs),
                    Align(
                      alignment: Alignment.centerRight,
                      child: FilledButton.tonalIcon(
                        style: FilledButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                        icon: const Icon(Icons.edit_note, size: 16),
                        label: Text(
                          bangla
                              ? '১-ট্যাপে সংশোধন ও পুনঃদাখিল'
                              : 'Fix & Resubmit Claim',
                        ),
                        onPressed: () {
                          Haptics.tap();
                          unawaited(
                            context.push(
                              '${AppRoutes.claimNew}?type=${c.type.wire}',
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Space.xs),
            ],

            // Approver / Executive Quick Action Strip
            if (widget.isApproverView &&
                ref
                        .watch(sessionControllerProvider)
                        .value
                        ?.profile
                        .employee
                        .id !=
                    c.employeeId) ...[
              const Divider(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      foregroundColor: Colors.red.shade800,
                    ),
                    onPressed: () {
                      Haptics.tap();
                      _promptReturnQuery(context);
                    },
                    child: Text(bangla ? 'ফেরত পাঠান' : 'Return Query'),
                  ),
                  const SizedBox(width: Space.xs),
                  if (step == 1)
                    FilledButton(
                      style: FilledButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () async {
                        Haptics.tap();
                        final id = c.workflowInstanceId;
                        if (id == null || id.isEmpty) {
                          AppToast.show(
                            context,
                            bangla
                                ? 'এই দাবির কোনো অনুমোদন খোলা নেই।'
                                : 'This claim has no open approval.',
                            tone: StatusTone.warning,
                          );
                          return;
                        }
                        try {
                          await ref
                              .read(approvalRepositoryProvider)
                              .approve(id);
                          ref
                            ..invalidate(approvalInboxProvider)
                            ..invalidate(claimsProvider);
                          if (!context.mounted) return;
                          setState(() => _verifiedLocally = true);
                          AppToast.show(
                            context,
                            bangla
                                ? 'দাবি যাচাই করে অর্থ বিভাগে পাঠানো হয়েছে'
                                : 'Verified and sent to finance.',
                            tone: StatusTone.success,
                          );
                        } on ApiException catch (e) {
                          if (!context.mounted) return;
                          AppToast.show(
                            context,
                            e.message,
                            tone: StatusTone.danger,
                          );
                        }
                      },
                      child: Text(
                        bangla ? 'যাচাই ও ফরওয়ার্ড' : 'Verify & Forward',
                      ),
                    )
                  else if (step == 2)
                    FilledButton.tonal(
                      style: FilledButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        Haptics.tap();
                        unawaited(_payClaim(context, c, bangla));
                      },
                      child: Text(
                        bangla
                            ? 'স্যাপ ভাউচার অনুমোদন'
                            : 'Approve & SAP Voucher',
                      ),
                    )
                  else if (step == 3)
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.teal,
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        Haptics.tap();
                        unawaited(_payClaim(context, c, bangla));
                      },
                      child: Text(
                        bangla ? 'পরিশোধ সম্পন্ন' : 'Mark Paid (EFT)',
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _lifecycleStrip(BuildContext context, int currentStep, bool bangla) {
    final steps = [
      if (bangla) 'দাখিল' else 'Submitted',
      if (bangla) 'যাচাইকৃত' else 'Verified',
      if (bangla) 'স্যাপ ভাউচার' else 'SAP Voucher',
      if (bangla) 'পরিশোধিত' else 'Paid',
    ];

    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 4,
                  decoration: BoxDecoration(
                    color: i < currentStep ? Colors.teal : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  steps[i],
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: i < currentStep
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: i < currentStep
                        ? Colors.teal.shade900
                        : Colors.black45,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                ),
              ],
            ),
          ),
          if (i < steps.length - 1) const SizedBox(width: 3),
        ],
      ],
    );
  }
}

class _GradePolicyTable extends StatelessWidget {
  const _GradePolicyTable();

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final policies = [
      {
        'grade': 'Grade 1–2 (Executive / GM)',
        'gradeBn': 'গ্রেড ১–২ (নির্বাহী / জিএম)',
        'da': 'BDT 3,500/day',
        'hotel': 'BDT 12,000/night',
        'trans': 'Company Car / Actual Air',
        'mobile': 'Actual Reimbursement',
      },
      {
        'grade': 'Grade 3–4 (DGM / AGM / HOD)',
        'gradeBn': 'গ্রেড ৩–৪ (ডিজিএম / বিভাগীয় প্রধান)',
        'da': 'BDT 2,500/day',
        'hotel': 'BDT 8,500/night',
        'trans': 'First Class Train / Pool Car',
        'mobile': 'BDT 4,000/month',
      },
      {
        'grade': 'Grade 5–6 (Senior Manager / Manager)',
        'gradeBn': 'গ্রেড ৫–৬ (সিনিয়র ম্যানেজার / ম্যানেজার)',
        'da': 'BDT 1,800/day',
        'hotel': 'BDT 5,500/night',
        'trans': 'AC Bus / Train / Pool Car',
        'mobile': 'BDT 2,500/month',
      },
      {
        'grade': 'Grade 7–8 (Senior Officer / Officer)',
        'gradeBn': 'গ্রেড ৭–৮ (সিনিয়র অফিসার / কর্মকর্তা)',
        'da': 'BDT 1,200/day',
        'hotel': 'BDT 3,500/night',
        'trans': 'CNG / Shuttle / Bus Fare',
        'mobile': 'BDT 1,500/month',
      },
      {
        'grade': 'Grade 9–10 (Driver / Support / Tech)',
        'gradeBn': 'গ্রেড ৯–১০ (চালক / সাপোর্ট স্টাফ)',
        'da': 'BDT 800/day',
        'hotel': 'Company Dorm / BDT 1,800',
        'trans': 'Bus / Company Vehicle',
        'mobile': 'BDT 800/month',
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        Text(
          bangla
              ? 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস — গ্রেড ১–১০ ভ্রমণ ও খরচ নীতিমালা'
              : 'BOGCL Official Grade 1–10 Travel & Expense Policy Matrix',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: Space.xs),
        Text(
          bangla
              ? 'প্রতিটি দাবির অনুমোদন ও বাজেট সিলিং কর্মীর চাকরির গ্রেড অনুসারে নিয়ন্ত্রিত হয়।'
              : 'All reimbursement ceilings and cost-center caps are strictly governed by employee job grades.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: scheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: Space.xs),
        const _PolicyCard(),
        const SizedBox(height: Space.md),
        for (final p in policies) ...[
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(
                color: scheme.outlineVariant.withValues(alpha: 0.6),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.military_tech,
                      color: Colors.amber,
                      size: 20,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla ? (p['gradeBn'] ?? '') : (p['grade'] ?? ''),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                _row('Daily Allowance (DA)', p['da']!),
                _row('Hotel Cap / Night', p['hotel']!),
                _row('Permitted Transport', p['trans']!),
                _row('Mobile & Internet', p['mobile']!),
              ],
            ),
          ),
          const SizedBox(height: Space.sm),
        ],
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
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
    return ClaimCard(claim: claim, showOwner: showOwner);
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
              Text(
                l10n.claimPolicyTitle(policy.band),
                style: theme.textTheme.titleSmall,
              ),
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
        for (final x in c)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: ClaimCard(
              claim: x,
              showOwner: true,
              isApproverView: true,
              onAction: onAction,
            ),
          ),
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
