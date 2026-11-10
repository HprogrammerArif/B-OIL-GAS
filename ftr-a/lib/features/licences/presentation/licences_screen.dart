import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
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

  static const _stageCodes = <String>[
    'INTERNAL_REVIEW',
    'APPLICATION_FILED',
    'FIELD_INSPECTION',
    'MINISTRY_VETTING',
    'RENEWED',
  ];

  bool get _filtersActive =>
      _selectedAgency != 'ALL' || _selectedStage != 'ALL';

  int _viewCount(String view) =>
      ref.watch(licencesProvider(view: view, query: _query)).value?.length ?? 0;

  Future<void> _openFilters() async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    Haptics.tap();
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheet) {
            Widget chip({
              required bool selected,
              required String label,
              required VoidCallback onTap,
            }) => Padding(
              padding: const EdgeInsets.only(right: Space.xs, bottom: Space.xs),
              child: FilterChip(
                visualDensity: VisualDensity.compact,
                label: Text(label, style: const TextStyle(fontSize: 12)),
                selected: selected,
                onSelected: (_) {
                  Haptics.tap();
                  onTap();
                  setSheet(() {});
                  setState(() {});
                },
              ),
            );

            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Space.lg,
                  0,
                  Space.lg,
                  Space.lg,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.cpFilter,
                      style: Theme.of(ctx).textTheme.titleMedium,
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.cpFilterAgencies,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        for (final a in _agencies)
                          chip(
                            selected: _selectedAgency == a.$1,
                            label: bangla ? a.$3 : a.$2,
                            onTap: () => _selectedAgency = a.$1,
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.cpFilterStages,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        chip(
                          selected: _selectedStage == 'ALL',
                          label: l10n.cpFilterAllStages,
                          onTap: () => _selectedStage = 'ALL',
                        ),
                        for (final s in _stageCodes)
                          chip(
                            selected: _selectedStage == s,
                            label: licenceStageLabel(l10n, s),
                            onTap: () => _selectedStage = s,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

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

    Widget viewChip(String view, String label) {
      final count = _viewCount(view);
      return Padding(
        padding: const EdgeInsets.only(right: Space.sm),
        child: ChoiceChip(
          visualDensity: VisualDensity.compact,
          label: Text('$label ($count)', style: const TextStyle(fontSize: 12)),
          selected: _view == view,
          onSelected: (_) {
            Haptics.tap();
            setState(() => _view = view);
          },
        ),
      );
    }

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
                    hintText: l10n.cpSearchHint,
                    prefixIcon: const Icon(Icons.search),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                    suffixIcon: IconButton(
                      tooltip: l10n.cpFilter,
                      onPressed: () => unawaited(_openFilters()),
                      icon: Badge(
                        isLabelVisible: _filtersActive,
                        child: const Icon(Icons.tune),
                      ),
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
                final filtered = list.where((e) {
                  if (_selectedAgency != 'ALL' &&
                      e.bodyCode.toUpperCase() != _selectedAgency) {
                    return false;
                  }
                  if (_selectedStage != 'ALL') {
                    final currentStage =
                        e.renewal?.stage ??
                        (e.status == 'ACTIVE' ? 'RENEWED' : 'INTERNAL_REVIEW');
                    if (currentStage != _selectedStage) return false;
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty && !_filtersActive
                        ? l10n.cpEmpty
                        : l10n.cpEmptyFiltered,
                  );
                }

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
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: Space.sm),
                    itemBuilder: (context, index) {
                      final e = filtered[index];
                      return _PermitCard(
                        licence: e,
                        bangla: bangla,
                        view: _view,
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
    required this.view,
    required this.onTap,
  });

  final Licence licence;
  final bool bangla;
  final String view;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final overdue = licence.urgency == 'EXPIRED' || licence.daysToExpiry < 0;
    final showPill =
        overdue || (licence.urgency == 'CRITICAL' && view != 'critical');
    final meta = [
      licence.bodyCode,
      licence.siteLabel(bangla: bangla),
      if (licence.daysToExpiry < 0)
        l10n.cpUrgExpired
      else
        l10n.cpDays(licence.daysToExpiry),
    ].join(' · ');

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: overdue
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
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      licence.heading(bangla: bangla),
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (showPill)
                    StatusPill(
                      label: licenceUrgencyLabel(l10n, licence.urgency),
                      tone: licenceUrgencyTone(licence.urgency),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                meta,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: licence.daysToExpiry <= 30
                      ? scheme.error
                      : scheme.onSurfaceVariant,
                  fontWeight: licence.daysToExpiry <= 30
                      ? FontWeight.w600
                      : FontWeight.normal,
                ),
              ),
              const SizedBox(height: Space.xs),
              Text(
                licenceNextLine(l10n, licence, bangla: bangla),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
