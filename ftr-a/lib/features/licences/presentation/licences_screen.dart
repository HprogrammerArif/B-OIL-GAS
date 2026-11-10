import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_ui.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LicencesScreen extends ConsumerStatefulWidget {
  const LicencesScreen({super.key});

  @override
  ConsumerState<LicencesScreen> createState() => _LicencesScreenState();
}

class _LicencesScreenState extends ConsumerState<LicencesScreen> {
  String _view = 'mine';
  String _query = '';
  String _selectedAgency = 'ALL';
  String _selectedStage = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('compliance:manage') == true ||
        s?.can('compliance:read', GrantScope.site) == true) {
      _view = 'critical';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  static const _agencies = <(String code, String label, String labelBn)>[
    ('ALL', 'All Agencies', 'সকল সংস্থা'),
    ('BSTI', 'BSTI (Standards)', 'বিএসটিআই (মান নিয়ন্ত্রণ)'),
    ('DOENV', 'DoE (Environment)', 'পরিবেশ অধিদপ্তর'),
    ('DOEXP', 'Explosives (DOEXP)', 'বিস্ফোরক অধিদপ্তর'),
    ('FSCD', 'Fire Service (FSCD)', 'ফায়ার সার্ভিস'),
    ('EMRD', 'Energy & Mineral', 'জ্বালানি বিভাগ'),
    ('BOILER', 'Boilers & Pressure', 'প্রধান বয়লার পরিদর্শক'),
  ];

  static const _stages = <(String code, String label, String labelBn)>[
    ('ALL', 'All Stages', 'সকল ধাপ'),
    ('INTERNAL_REVIEW', '1. App Prep', '১. আবেদন প্রস্তুতি'),
    ('APPLICATION_FILED', '2. Fee & Challan', '২. ফি ও চালান'),
    ('FIELD_INSPECTION', '3. Inspection', '৩. মাঠ পরিদর্শন'),
    ('MINISTRY_VETTING', '4. Ministry Vetting', '৪. মন্ত্রণালয় যাচাই'),
    ('RENEWED', '5. Renewed & Active', '৫. নবায়িত ও সক্রিয়'),
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canAdd = session?.can('compliance:create') ?? false;
    final canWide =
        (session?.can('compliance:manage') ?? false) ||
        (session?.can('compliance:read', GrantScope.site) ?? false);
    final rows = ref.watch(licencesProvider(view: _view, query: _query));
    final scheme = Theme.of(context).colorScheme;

    Widget viewChip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    Widget agencyChip(String code, String label, String labelBn) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: FilterChip(
        label: Text(bangla ? labelBn : label),
        selected: _selectedAgency == code,
        onSelected: (_) => setState(() => _selectedAgency = code),
      ),
    );

    Widget stageChip(String code, String label, String labelBn) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: FilterChip(
        label: Text(bangla ? labelBn : label),
        selected: _selectedStage == code,
        onSelected: (_) => setState(() => _selectedStage = code),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleCompliance),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            onPressed: () {
              ref.invalidate(licencesProvider);
            },
          ),
        ],
      ),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.licenceNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.cpNew),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.md, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: bangla
                        ? 'লাইসেন্স নং, সংস্থা বা শিরোনাম অনুসন্ধান করুন...'
                        : 'Search permit no, agency or title...',
                    prefixIcon: const Icon(Icons.search),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                  ),
                  onChanged: (v) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), () {
                      if (mounted) setState(() => _query = v);
                    });
                  },
                ),
                const SizedBox(height: Space.xs),
                // Urgency View Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (canWide) viewChip('critical', l10n.cpTabCritical),
                      viewChip('mine', l10n.cpTabMine),
                      if (canWide) viewChip('warning', l10n.cpTabWarning),
                      if (canWide) viewChip('renewing', l10n.cpTabRenew),
                      if (canWide) viewChip('expired', l10n.cpTabExpired),
                      if (canWide) viewChip('all', l10n.cpTabAll),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                // Agency Filter Pills
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final a in _agencies) agencyChip(a.$1, a.$2, a.$3),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                // 5-Stage Pipeline Filter Bar
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final s in _stages) stageChip(s.$1, s.$2, s.$3),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: Space.xs),

          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => ref.invalidate(licencesProvider)),
              data: (list) {
                // Apply memory filter for agency and pipeline stage
                final filtered = list.where((e) {
                  if (_selectedAgency != 'ALL') {
                    if (e.bodyCode.toUpperCase() != _selectedAgency) {
                      return false;
                    }
                  }
                  if (_selectedStage != 'ALL') {
                    final currentStage =
                        e.renewal?.stage ??
                        (e.status == 'ACTIVE' ? 'RENEWED' : 'INTERNAL_REVIEW');
                    if (currentStage != _selectedStage) {
                      return false;
                    }
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? (bangla
                              ? 'নির্বাচিত ফিল্টারে কোনো লাইসেন্স পাওয়া যায়নি'
                              : 'No permits found under selected filters')
                        : l10n.cpEmptyFiltered,
                  );
                }

                final need = filtered.where(licenceNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(licencesProvider);
                    await ref.read(
                      licencesProvider(view: _view, query: _query).future,
                    );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(
                      Space.md,
                      Space.xs,
                      Space.md,
                      Space.xl,
                    ),
                    itemCount: filtered.length + 1,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: Space.sm),
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                            vertical: Space.xs,
                          ),
                          child: Text(
                            need == 0
                                ? l10n.cpSummaryNone
                                : l10n.cpSummaryNeed(need),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: scheme.onSurfaceVariant),
                          ),
                        );
                      }

                      final e = filtered[index - 1];
                      return _PermitCard(
                        licence: e,
                        bangla: bangla,
                        onTap: () => unawaited(
                          context.push(AppRoutes.licenceDetail(e.id)),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PermitCard extends StatelessWidget {
  const _PermitCard({
    required this.licence,
    required this.bangla,
    required this.onTap,
  });

  final Licence licence;
  final bool bangla;
  final VoidCallback onTap;

  Color _agencyColor(String code) {
    return switch (code.toUpperCase()) {
      'DOEXP' => Colors.deepOrange,
      'FSCD' => Colors.red.shade700,
      'DOENV' => Colors.teal,
      'BSTI' => Colors.blue.shade700,
      'EMRD' => Colors.indigo,
      'BOILER' => Colors.brown,
      _ => Colors.blueGrey,
    };
  }

  String _stageLabel(String? stage, bool bangla) {
    return switch (stage) {
      'INTERNAL_REVIEW' =>
        bangla ? 'ধাপ ১: অডিট চেকলিস্ট' : 'Stage 1: App Prep',
      'APPLICATION_FILED' =>
        bangla ? 'ধাপ ২: সরকারি ফি চালান' : 'Stage 2: Fee & Challan',
      'FIELD_INSPECTION' =>
        bangla ? 'ধাপ ৩: পরিদর্শন সম্পন্ন' : 'Stage 3: Field Inspection',
      'MINISTRY_VETTING' =>
        bangla ? 'ধাপ ৪: মন্ত্রণালয়ে যাচাই' : 'Stage 4: Ministry Vetting',
      'RENEWED' =>
        bangla ? 'ধাপ ৫: নবায়িত ও সক্রিয়' : 'Stage 5: Renewed & Active',
      _ => bangla ? 'নবায়ন পেন্ডিং' : 'Renewal Pending',
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final agencyCol = _agencyColor(licence.bodyCode);
    final stageStr = _stageLabel(licence.renewal?.stage, bangla);
    final riskTk = licence.shutdownRiskPerDay > 0
        ? licence.shutdownRiskPerDay
        : licence.exposurePerDay;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: licence.urgency == 'CRITICAL' || licence.urgency == 'EXPIRED'
              ? scheme.error.withValues(alpha: 0.5)
              : scheme.outlineVariant,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Agency & Expiry Status Bar
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: agencyCol.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: agencyCol.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Text(
                      licence.bodyCode,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: agencyCol,
                      ),
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      licence.licenceNo,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                        color: scheme.onSurfaceVariant,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  StatusPill(
                    label: licenceUrgencyLabel(l10n, licence.urgency),
                    tone: licenceUrgencyTone(licence.urgency),
                  ),
                ],
              ),

              const SizedBox(height: Space.xs),

              // Permit Title
              Text(
                licence.heading(bangla: bangla),
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 2),

              // Location and Days Counter
              Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    licence.siteLabel(bangla: bangla),
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(width: Space.sm),
                  Text('·', style: TextStyle(color: scheme.onSurfaceVariant)),
                  const SizedBox(width: Space.sm),
                  Icon(
                    Icons.timer_outlined,
                    size: 14,
                    color: scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    licence.daysToExpiry < 0
                        ? l10n.cpUrgExpired
                        : l10n.cpDays(licence.daysToExpiry),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: licence.daysToExpiry <= 30
                          ? scheme.error
                          : scheme.onSurfaceVariant,
                      fontWeight: licence.daysToExpiry <= 30
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: Space.sm),

              // Pipeline Stage & Daily Risk Pills
              Wrap(
                spacing: Space.xs,
                runSpacing: 4,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: scheme.primaryContainer.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.route, size: 12, color: scheme.primary),
                        const SizedBox(width: 4),
                        Text(
                          stageStr,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: scheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (riskTk > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: scheme.errorContainer.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            size: 12,
                            color: scheme.error,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            bangla
                                ? 'ঝুঁকি: ${Money.fromPaisa((riskTk * 100).round()).format(bengali: true)}/দিন'
                                : 'Risk: ${Money.fromPaisa((riskTk * 100).round()).format()}/day',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: scheme.error,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              const SizedBox(height: Space.xs),

              // Actionable Next Line
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.sm,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        licenceNextLine(l10n, licence, bangla: bangla),
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      ),
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
