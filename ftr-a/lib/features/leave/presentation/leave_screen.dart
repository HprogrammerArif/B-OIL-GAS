import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Leave home: balances, filter and the caller's requests.
class LeaveScreen extends ConsumerStatefulWidget {
  const LeaveScreen({super.key});

  @override
  ConsumerState<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends ConsumerState<LeaveScreen> {
  LeaveStatus? _filter;

  Future<void> _refresh() async {
    ref
      ..invalidate(leaveBalancesProvider)
      ..invalidate(myLeaveRequestsProvider);
    await ref.read(myLeaveRequestsProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final requests = ref.watch(myLeaveRequestsProvider);
    final balances = ref.watch(leaveBalancesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.leaveTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => unawaited(context.push(AppRoutes.leaveNew)),
        icon: const Icon(Icons.add),
        label: Text(l10n.leaveApply),
      ),
      body: requests.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
        data: (all) {
          final items = _filter == null
              ? all
              : all.where((r) => r.status == _filter).toList();
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 96),
              children: [
                SectionHeader(title: l10n.leaveBalancesTitle),
                balances.when(
                  loading: () => const SizedBox(
                    height: 120,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (_, _) => ErrorState(
                    onRetry: () => ref.invalidate(leaveBalancesProvider),
                  ),
                  data: (b) => _BalanceStrip(balances: b),
                ),
                SectionHeader(title: l10n.leaveRequestsTitle),
                _FilterBar(
                  selected: _filter,
                  onSelected: (s) => setState(() => _filter = s),
                ),
                if (items.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: Space.xxxl),
                    child: EmptyState(
                      icon: Icons.beach_access_outlined,
                      title: l10n.leaveEmptyTitle,
                      message: l10n.leaveEmptyMessage,
                    ),
                  )
                else
                  for (final r in items)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Space.lg,
                        vertical: Space.xs,
                      ),
                      child: _RequestRow(item: r),
                    ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BalanceStrip extends StatelessWidget {
  const _BalanceStrip({required this.balances});

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
        itemBuilder: (_, i) => _BalanceCard(balance: items[i]),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.balance});

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

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.selected, required this.onSelected});

  final LeaveStatus? selected;
  final ValueChanged<LeaveStatus?> onSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: Row(
        children: [
          ChoiceChip(
            label: Text(l10n.leaveFilterAll),
            selected: selected == null,
            onSelected: (_) => onSelected(null),
          ),
          for (final s in LeaveStatus.values) ...[
            const SizedBox(width: Space.sm),
            ChoiceChip(
              label: Text(leaveStatusLabel(l10n, s)),
              selected: selected == s,
              onSelected: (_) => onSelected(s),
            ),
          ],
        ],
      ),
    );
  }
}

class _RequestRow extends StatelessWidget {
  const _RequestRow({required this.item});

  final LeaveRequestItem item;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    return ListRow(
      title:
          '${item.type.displayName(bangla: context.isBangla)} · '
          '${daysText(l10n, item.days, lang)}',
      subtitle:
          '${DateFmt.range(item.startDate, item.endDate, lang)}\n${item.refNo}',
      trailing: StatusPill(
        label: leaveStatusLabel(l10n, item.status),
        tone: leaveStatusTone(item.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.leaveDetail(item.id))),
    );
  }
}
