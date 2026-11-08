import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

String _formatHodBdt(num? amount, {required bool bangla}) {
  if (amount == null) return '';
  final val = amount.toDouble();
  if (val >= 10000000) {
    final cr = (val / 10000000).toStringAsFixed(2);
    return bangla ? '৳ $cr কোটি' : 'BDT $cr Cr';
  }
  if (val >= 100000) {
    final l = (val / 100000).toStringAsFixed(1);
    return bangla ? '৳ $l লক্ষ' : 'BDT $l Lakhs';
  }
  return bangla ? '৳ ${val.round()}' : 'BDT ${val.round()}';
}

class HodCockpit extends ConsumerStatefulWidget {
  const HodCockpit({required this.dashboard, super.key});

  final Dashboard dashboard;

  @override
  ConsumerState<HodCockpit> createState() => _HodCockpitState();
}

class _HodCockpitState extends ConsumerState<HodCockpit> {
  final Set<String> _selectedIds = {};

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inboxAsync = ref.watch(approvalInboxProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Department Quarterly Budget Ceiling Card
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.xs,
          ),
          child: Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  scheme.primaryContainer.withValues(alpha: 0.4),
                  scheme.surface,
                ],
              ),
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(color: scheme.primary.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.account_balance,
                      color: Colors.purple,
                      size: 20,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'বিভাগীয় ত্রৈমাসিক বাজেট সিলিং (Q4)'
                            : 'DEPT QUARTERLY BUDGET CEILING (Q4 FY26)',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: Colors.purple,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'BDT 4,50,00,000',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            bangla
                                ? 'মোট বরাদ্দ সিলিং'
                                : 'Total Approved Ceiling',
                            style: TextStyle(
                              fontSize: 11,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text(
                          'BDT 1,37,50,000',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.teal,
                          ),
                        ),
                        Text(
                          bangla
                              ? 'অবশিষ্ট বাজেট (৩০.৬%)'
                              : 'Remaining Available (30.6%)',
                          style: TextStyle(
                            fontSize: 11,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: Space.sm),
                // Segmented Progress Bar: 69.4% Spent + 30.6% Remaining
                ClipRRect(
                  borderRadius: BorderRadius.circular(Corner.sm),
                  child: SizedBox(
                    height: 10,
                    child: Row(
                      children: [
                        Expanded(
                          flex: 694,
                          child: Container(color: Colors.purple.shade400),
                        ),
                        Expanded(
                          flex: 306,
                          child: Container(color: Colors.teal.shade400),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Spent: BDT 3.12 Cr (69.4%)',
                      style: TextStyle(
                        fontSize: 10,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      'Available: BDT 1.37 Cr',
                      style: TextStyle(
                        fontSize: 10,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Inline Approval Queue with Batch Approval
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.md,
            Space.lg,
            Space.xs,
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  bangla ? 'ফাইন্যান্স অনুমোদন কিউ' : 'Finance Approval Queue',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton(
                style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () => openAppRoute(context, AppRoutes.approvals),
                child: Text(bangla ? 'সব দেখুন' : 'See All'),
              ),
            ],
          ),
        ),

        inboxAsync.when(
          skipLoadingOnReload: true,
          loading: () => const Padding(
            padding: EdgeInsets.all(Space.lg),
            child: SkeletonList(itemCount: 2),
          ),
          error: (_, _) =>
              ErrorState(onRetry: () => ref.invalidate(approvalInboxProvider)),
          data: (items) {
            if (items.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(Space.xl),
                child: Center(
                  child: Text(
                    bangla
                        ? 'কোনো ফাইল অপেক্ষমান নেই'
                        : 'No pending approval files in queue',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              );
            }

            final batchable = items.where((i) => i.batchable).toList();

            return Column(
              children: [
                if (batchable.length > 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Space.lg,
                      vertical: Space.xs,
                    ),
                    child: Row(
                      children: [
                        Checkbox(
                          value:
                              _selectedIds.length == batchable.length &&
                              batchable.isNotEmpty,
                          onChanged: (v) {
                            Haptics.tap();
                            setState(() {
                              if (v == true) {
                                _selectedIds.addAll(
                                  batchable.map((e) => e.instanceId),
                                );
                              } else {
                                _selectedIds.clear();
                              }
                            });
                          },
                        ),
                        Expanded(
                          child: Text(
                            bangla
                                ? 'একযোগে নির্বাচন (${_selectedIds.length}/${batchable.length})'
                                : 'Batch Select (${_selectedIds.length}/${batchable.length})',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        if (_selectedIds.isNotEmpty)
                          FilledButton.tonal(
                            style: FilledButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            onPressed: () async {
                              Haptics.success();
                              final count = _selectedIds.length;
                              final repo = ref.read(approvalRepositoryProvider);
                              for (final id in _selectedIds) {
                                await repo.approve(id);
                              }
                              setState(_selectedIds.clear);
                              ref
                                ..invalidate(approvalInboxProvider)
                                ..invalidate(dashboardMeProvider);
                              if (context.mounted) {
                                AppToast.show(
                                  context,
                                  bangla
                                      ? '$countটি ফাইল অনুমোদিত হয়েছে'
                                      : 'Approved $count items',
                                );
                              }
                            },
                            child: Text(
                              bangla
                                  ? 'নির্বাচিত অনুমোদন'
                                  : 'Approve (${_selectedIds.length})',
                            ),
                          ),
                      ],
                    ),
                  ),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: Space.lg,
                    vertical: Space.xs,
                  ),
                  itemCount: items.take(3).length,
                  separatorBuilder: (_, _) => const SizedBox(height: Space.sm),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isChecked = _selectedIds.contains(item.instanceId);

                    return Container(
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
                              if (item.batchable)
                                Checkbox(
                                  value: isChecked,
                                  onChanged: (v) {
                                    Haptics.tap();
                                    setState(() {
                                      if (v == true) {
                                        _selectedIds.add(item.instanceId);
                                      } else {
                                        _selectedIds.remove(item.instanceId);
                                      }
                                    });
                                  },
                                ),
                              Expanded(
                                child: Text(
                                  bangla
                                      ? item.summary.titleBn
                                      : item.summary.title,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              if (item.summary.amount != null)
                                Text(
                                  _formatHodBdt(
                                    item.summary.amount,
                                    bangla: bangla,
                                  ),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: scheme.primary,
                                  ),
                                ),
                            ],
                          ),
                          Padding(
                            padding: EdgeInsets.only(
                              left: item.batchable ? 40 : 0,
                            ),
                            child: Text(
                              bangla
                                  ? 'উত্থাপনকারী: ${item.initiator.display(bangla: true)} · ধাপ: ${item.stepName}'
                                  : 'By ${item.initiator.display(bangla: false)} · Step: ${item.stepName}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                          const SizedBox(height: Space.sm),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () => context.push(
                                  AppRoutes.approvalDetail(item.instanceId),
                                ),
                                child: Text(
                                  bangla ? 'যাচাই' : 'Verify Details',
                                ),
                              ),
                              const SizedBox(width: Space.sm),
                              FilledButton.tonal(
                                onPressed: () async {
                                  Haptics.success();
                                  await ref
                                      .read(approvalRepositoryProvider)
                                      .approve(item.instanceId);
                                  ref
                                    ..invalidate(approvalInboxProvider)
                                    ..invalidate(dashboardMeProvider);
                                  if (context.mounted) {
                                    AppToast.show(
                                      context,
                                      bangla
                                          ? 'ফাইলটি অনুমোদিত হয়েছে'
                                          : 'File approved',
                                    );
                                  }
                                },
                                child: Text(bangla ? 'অনুমোদন' : 'Approve'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}
