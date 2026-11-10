import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class IncidentsScreen extends ConsumerStatefulWidget {
  const IncidentsScreen({super.key});

  @override
  ConsumerState<IncidentsScreen> createState() => _IncidentsScreenState();
}

class _IncidentsScreenState extends ConsumerState<IncidentsScreen> {
  String _view = 'mine';
  String _query = '';
  String _zoneFilter = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('incidents:triage') == true) {
      _view = 'to-triage';
    } else if (s?.can('incidents:read', GrantScope.site) == true) {
      _view = 'open';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  bool get _filtersActive => _zoneFilter != 'ALL' || _view == 'statutory';

  int _viewCount(String view) =>
      ref.watch(incidentsProvider(view: view, query: _query)).value?.length ??
      0;

  Future<void> _openFilters() async {
    final l10n = context.l10n;
    Haptics.tap();
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
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
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  Space.lg,
                  0,
                  Space.lg,
                  Space.lg + MediaQuery.viewInsetsOf(ctx).bottom,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.inFilter,
                      style: Theme.of(ctx).textTheme.titleMedium,
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.inFilterViews,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        chip(
                          selected: _view == 'statutory',
                          label: l10n.inTabStatutory,
                          onTap: () => _view = 'statutory',
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.inFilterZones,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        chip(
                          selected: _zoneFilter == 'ALL',
                          label: l10n.inFilterAllZones,
                          onTap: () => _zoneFilter = 'ALL',
                        ),
                        for (final z in incidentPlantZones)
                          chip(
                            selected: _zoneFilter == z,
                            label: incidentZoneLabel(l10n, z),
                            onTap: () => _zoneFilter = z,
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
    final canReport = session?.can('incidents:report') ?? false;
    final canTriage = session?.can('incidents:triage') ?? false;
    final canWide =
        canTriage ||
        (session?.can('incidents:read', GrantScope.site) ?? false) ||
        (session?.roleKeys.any(
              (r) =>
                  r == 'TRANSPORT_ADMIN' ||
                  r == 'HR_ADMIN' ||
                  r == 'CHAIRMAN' ||
                  r == 'PLANT_GM',
            ) ??
            false);

    final rows = ref.watch(incidentsProvider(view: _view, query: _query));

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
      appBar: AppBar(title: Text(l10n.moduleIncidents)),
      floatingActionButton: canReport
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.incidentNew)),
              icon: const Icon(Icons.add_alert_outlined),
              label: Text(l10n.inNew),
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
                    hintText: l10n.inSearchHint,
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                    suffixIcon: IconButton(
                      tooltip: l10n.inFilter,
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
                      if (canTriage) ...[
                        viewChip('to-triage', l10n.inTabTriage),
                        viewChip('open', l10n.inTabOpen),
                        viewChip('my-capa', l10n.inTabCapa),
                      ] else if (canWide) ...[
                        viewChip('open', l10n.inTabOpen),
                        viewChip('serious', l10n.inTabSerious),
                        viewChip('all', l10n.inTabAll),
                      ] else ...[
                        if (canReport) viewChip('mine', l10n.inTabMine),
                        viewChip('my-capa', l10n.inTabCapa),
                      ],
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
                  ErrorState(onRetry: () => ref.invalidate(incidentsProvider)),
              data: (rawList) {
                final list = _zoneFilter == 'ALL'
                    ? rawList
                    : rawList.where((i) => i.zone == _zoneFilter).toList();
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty && !_filtersActive
                        ? l10n.inEmpty
                        : l10n.inEmptyFiltered,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(incidentsProvider);
                    await ref.read(
                      incidentsProvider(view: _view, query: _query).future,
                    );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) =>
                        _Row(incident: list[i], bangla: bangla),
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

class _Row extends StatelessWidget {
  const _Row({required this.incident, required this.bangla});

  final SafetyIncident incident;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final i = incident;
    final place = [
      incidentTypeLabel(l10n, i.type),
      if (i.zone != null) incidentZoneLabel(l10n, i.zone),
      if (i.siteLabel(bangla: bangla).isNotEmpty) i.siteLabel(bangla: bangla),
    ].join(' · ');
    return ListRow(
      title: i.title,
      subtitle: '$place\n${incidentNextLine(l10n, i, bangla: bangla)}',
      trailing: StatusPill(
        label: incidentStageLabel(l10n, i.stage),
        tone: incidentStageTone(i.stage),
      ),
      onTap: () => unawaited(context.push(AppRoutes.incidentDetail(i.id))),
    );
  }
}
