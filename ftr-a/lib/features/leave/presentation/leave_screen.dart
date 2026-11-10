import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { mine, awaiting, team }

enum _Filter { all, waiting, approved }

/// Leave home: balances, role-gated lists, request FAB.
class LeaveScreen extends ConsumerWidget {
  const LeaveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final canRequest =
        ref.watch(sessionControllerProvider).value?.can('leave:request') ??
        false;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.leaveTitle),
        actions: const [AppBarActions()],
      ),
      floatingActionButton: canRequest
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.leaveNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.leaveApply),
            )
          : null,
      body: const MyLeaveView(showHeaderAction: false),
    );
  }
}

/// Reusable view embedded into both LeaveScreen and the unified AttendanceScreen.
class MyLeaveView extends ConsumerStatefulWidget {
  const MyLeaveView({this.showHeaderAction = true, super.key});

  final bool showHeaderAction;

  @override
  ConsumerState<MyLeaveView> createState() => _MyLeaveViewState();
}

class _MyLeaveViewState extends ConsumerState<MyLeaveView> {
  _Tab _tab = _Tab.mine;
  _Filter _filter = _Filter.all;

  Future<void> _refresh() async {
    ref
      ..invalidate(leaveBalancesProvider)
      ..invalidate(leaveRequestsProvider)
      ..invalidate(myLeaveRequestsProvider);
    await ref.read(leaveRequestsProvider('mine').future);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final session = ref.watch(sessionControllerProvider).value;
    final canRequest = session?.can('leave:request') ?? false;
    final beyondSelf = session?.can('leave:read', GrantScope.team) ?? false;
    final canApprove = session?.can('leave:approve') ?? false;
    final teamAsync = (beyondSelf || canApprove)
        ? ref.watch(leaveRequestsProvider('team'))
        : null;
    final teamItems = teamAsync?.value ?? const <LeaveRequestItem>[];
    final awaiting = [
      for (final r in teamItems)
        if (r.awaitingYou) r,
    ];

    final tabs = <(_Tab, String)>[
      if (canRequest) (_Tab.mine, l10n.leaveTabMine),
      if (beyondSelf || canApprove)
        (_Tab.awaiting, l10n.leaveTabAwaiting(awaiting.length)),
      if (beyondSelf) (_Tab.team, l10n.leaveTabTeam),
    ];
    final effective = tabs.any((t) => t.$1 == _tab)
        ? _tab
        : (tabs.isEmpty ? _Tab.mine : tabs.first.$1);

    final balances = ref.watch(leaveBalancesProvider);
    final showBalances = effective == _Tab.mine && canRequest;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
                    selected: effective == t.$1,
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
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: switch (effective) {
              _Tab.mine => _RequestList(
                scope: 'mine',
                filter: _filter,
                onFilter: (f) => setState(() => _filter = f),
                showOwner: false,
                balances: showBalances ? balances : null,
                showApply: widget.showHeaderAction && canRequest,
              ),
              _Tab.awaiting => _RequestList(
                scope: 'team',
                onlyAwaiting: true,
                showOwner: true,
                emptyTitle: l10n.leaveAwaitEmptyTitle,
                emptyMessage: l10n.leaveAwaitEmptyMessage,
              ),
              _Tab.team => _RequestList(
                scope: 'team',
                hideAwaiting: true,
                showOwner: true,
                emptyTitle: l10n.leaveScopeEmptyTitle,
                emptyMessage: l10n.leaveScopeEmptyMessage,
              ),
            },
          ),
        ),
      ],
    );
  }
}

class _RequestList extends ConsumerWidget {
  const _RequestList({
    required this.scope,
    required this.showOwner,
    this.filter,
    this.onFilter,
    this.onlyAwaiting = false,
    this.hideAwaiting = false,
    this.balances,
    this.showApply = false,
    this.emptyTitle,
    this.emptyMessage,
  });

  final String scope;
  final bool showOwner;
  final _Filter? filter;
  final ValueChanged<_Filter>? onFilter;
  final bool onlyAwaiting;
  final bool hideAwaiting;
  final AsyncValue<List<LeaveBalance>>? balances;
  final bool showApply;
  final String? emptyTitle;
  final String? emptyMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final list = ref.watch(leaveRequestsProvider(scope));
    return list.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(leaveRequestsProvider)),
      data: (items) {
        var shown = items;
        if (onlyAwaiting) {
          shown = [
            for (final r in items)
              if (r.awaitingYou) r,
          ];
        } else if (hideAwaiting) {
          shown = [
            for (final r in items)
              if (!r.awaitingYou) r,
          ];
        }
        shown = switch (filter) {
          null || _Filter.all => shown,
          _Filter.waiting => [
            for (final r in shown)
              if (r.status == LeaveStatus.pending ||
                  r.status == LeaveStatus.returned)
                r,
          ],
          _Filter.approved => [
            for (final r in shown)
              if (r.status == LeaveStatus.approved) r,
          ],
        };
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            if (showApply)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  Space.lg,
                  Space.md,
                  Space.lg,
                  Space.xs,
                ),
                child: FilledButton.tonalIcon(
                  icon: const Icon(Icons.add, size: 20),
                  label: Text(l10n.leaveApply),
                  onPressed: () => unawaited(context.push(AppRoutes.leaveNew)),
                ),
              ),
            if (balances != null) ...[
              SectionHeader(title: l10n.leaveBalancesTitle),
              balances!.when(
                loading: () => const SizedBox(
                  height: 120,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (_, _) => ErrorState(
                  onRetry: () => ref.invalidate(leaveBalancesProvider),
                ),
                data: (b) => BalanceStrip(balances: b),
              ),
            ],
            if (onFilter != null) ...[
              const SizedBox(height: Space.sm),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                child: Row(
                  children: [
                    ChoiceChip(
                      label: Text(l10n.leaveFilterAll),
                      selected: filter == _Filter.all,
                      onSelected: (_) => onFilter!(_Filter.all),
                    ),
                    const SizedBox(width: Space.xs),
                    ChoiceChip(
                      label: Text(l10n.leaveFilterWaiting),
                      selected: filter == _Filter.waiting,
                      onSelected: (_) => onFilter!(_Filter.waiting),
                    ),
                    const SizedBox(width: Space.xs),
                    ChoiceChip(
                      label: Text(l10n.leaveStatusApproved),
                      selected: filter == _Filter.approved,
                      onSelected: (_) => onFilter!(_Filter.approved),
                    ),
                  ],
                ),
              ),
            ],
            if (shown.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: Space.xxxl),
                child: EmptyState(
                  icon: Icons.beach_access_outlined,
                  title: emptyTitle ?? l10n.leaveEmptyTitle,
                  message: emptyMessage ?? l10n.leaveEmptyMessage,
                ),
              )
            else
              for (final r in shown)
                LeaveRequestRow(item: r, showOwner: showOwner),
          ],
        );
      },
    );
  }
}

class BalanceStrip extends StatelessWidget {
  const BalanceStrip({required this.balances, super.key});

  final List<LeaveBalance> balances;

  @override
  Widget build(BuildContext context) {
    const shown = {'CL', 'SL', 'EL'};
    final items = balances.where((b) => shown.contains(b.type.code)).toList();
    return SizedBox(
      height: 132,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: Space.lg),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: Space.md),
        itemBuilder: (_, i) => BalanceCard(balance: items[i]),
      ),
    );
  }
}

class BalanceCard extends StatelessWidget {
  const BalanceCard({required this.balance, super.key});

  final LeaveBalance balance;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final low = balance.available <= 2;
    final muted = theme.colorScheme.onSurfaceVariant;
    return Semantics(
      container: true,
      label:
          '${balance.type.displayName(bangla: context.isBangla)}, '
          '${l10n.leaveAvailable(daysText(l10n, balance.available, lang))}',
      child: SizedBox(
        width: 168,
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  balance.type.displayName(bangla: context.isBangla),
                  style: theme.textTheme.labelLarge,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: Space.xs),
                Text(
                  l10n.leaveAvailable(daysText(l10n, balance.available, lang)),
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: low ? context.bogcl.danger : null,
                  ),
                ),
                const Spacer(),
                Text(
                  l10n.leaveBalanceDetail(
                    daysText(l10n, balance.used, lang),
                    daysText(l10n, balance.entitled, lang),
                  ),
                  style: theme.textTheme.bodySmall?.copyWith(color: muted),
                ),
                if (balance.pending > 0)
                  Text(
                    l10n.leaveBalancePending(
                      daysText(l10n, balance.pending, lang),
                    ),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: context.bogcl.warning,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LeaveRequestRow extends StatelessWidget {
  const LeaveRequestRow({
    required this.item,
    this.showOwner = false,
    super.key,
  });

  final LeaveRequestItem item;
  final bool showOwner;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final bits = [
      DateFmt.range(item.startDate, item.endDate, lang),
      if (showOwner) item.employee.displayName(bangla: bangla),
    ];
    return ListRow(
      title:
          '${item.type.displayName(bangla: bangla)} · '
          '${daysText(l10n, item.days, lang)}',
      subtitle:
          '${bits.join(' · ')}\n${leaveNextLine(l10n, item, bangla: bangla)}',
      trailing: StatusPill(
        label: leaveStatusLabel(l10n, item.status),
        tone: leaveStatusTone(item.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.leaveDetail(item.id))),
    );
  }
}
