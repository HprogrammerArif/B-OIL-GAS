import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Cars I asked for, trips I drive, or work waiting on me.
class FleetScreen extends ConsumerStatefulWidget {
  const FleetScreen({super.key});

  @override
  ConsumerState<FleetScreen> createState() => _FleetScreenState();
}

class _FleetScreenState extends ConsumerState<FleetScreen> {
  String _view = 'mine';
  String _query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('fleet:drive') == true && s?.can('fleet:request') != true) {
      _view = 'driving';
    } else if (s?.can('fleet:dispatch') == true) {
      _view = 'dispatch';
    } else if (s?.can('fleet:endorse') == true &&
        s?.can('fleet:request') != true) {
      _view = 'to-endorse';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('fleet:request') ?? false;
    final canDrive = session?.can('fleet:drive') ?? false;
    final canDispatch = session?.can('fleet:dispatch') ?? false;
    final canEndorse = session?.can('fleet:endorse') ?? false;
    final canSos =
        canDrive ||
        canDispatch ||
        (session?.can('fleet:gate') ?? false) ||
        (session?.can('fleet:read', GrantScope.site) ?? false);
    final rows = ref.watch(
      fleetRequisitionsProvider(view: _view, query: _query),
    );

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleFleet),
        actions: [
          if (canSos)
            IconButton(
              tooltip: l10n.flSos,
              onPressed: () => unawaited(context.push(AppRoutes.fleetSos)),
              icon: const Icon(Icons.sos_outlined),
            ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.fleetNew)),
              icon: const Icon(Icons.add_road_outlined),
              label: Text(l10n.flNew),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.flIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.flSearchHint,
                    prefixIcon: const Icon(Icons.search),
                  ),
                  onChanged: (v) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), () {
                      if (mounted) setState(() => _query = v);
                    });
                  },
                ),
                const SizedBox(height: Space.sm),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (canCreate) chip('mine', l10n.flTabMine),
                      if (canDrive) chip('driving', l10n.flTabDriving),
                      if (canEndorse) chip('to-endorse', l10n.flTabEndorse),
                      if (canDispatch) chip('dispatch', l10n.flTabDispatch),
                      if (canDispatch || canDrive) chip('live', l10n.flTabLive),
                      if (canDispatch) chip('all', l10n.flTabAll),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) => ErrorState(
                onRetry: () => ref.invalidate(fleetRequisitionsProvider),
              ),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.flEmpty
                        : l10n.flEmptyFiltered,
                  );
                }
                final need = list.where(fleetNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(fleetRequisitionsProvider);
                    await ref.read(
                      fleetRequisitionsProvider(
                        view: _view,
                        query: _query,
                      ).future,
                    );
                  },
                  child: ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(
                          Space.lg,
                          Space.md,
                          Space.lg,
                          Space.xs,
                        ),
                        child: Text(
                          need == 0
                              ? l10n.flVerdictNone
                              : l10n.flVerdictNeed(need),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      if (canDispatch) ..._poolCards(context, l10n, list),
                      for (final r in list)
                        ListRow(
                          leading: Icon(
                            r.status == 'IN_TRANSIT'
                                ? Icons.directions_car
                                : Icons.directions_car_outlined,
                          ),
                          title: r.destination,
                          subtitle: [
                            '${r.reqNo} · ${r.purpose}',
                            fleetNextLine(l10n, r, bangla: bangla),
                          ].join('\n'),
                          trailing: StatusPill(
                            label: fleetStatusLabel(l10n, r.status),
                            tone: fleetStatusTone(r.status),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.fleetDetail(r.id)),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _poolCards(
    BuildContext context,
    AppL10n l10n,
    List<VehicleRequisition> list,
  ) {
    final pending = [
      for (final r in list)
        if (r.status == 'APPROVED' || r.status == 'PENDING_APPROVAL') r,
    ];
    for (var i = 0; i < pending.length; i++) {
      for (var j = i + 1; j < pending.length; j++) {
        final a = pending[i].destination.toLowerCase();
        final b = pending[j].destination.toLowerCase();
        if (a.isEmpty || b.isEmpty) continue;
        if (a.contains(b) ||
            b.contains(a) ||
            a.split(' ').first == b.split(' ').first) {
          return [
            Card(
              margin: const EdgeInsets.fromLTRB(
                Space.lg,
                Space.sm,
                Space.lg,
                0,
              ),
              child: ListTile(
                leading: const Icon(Icons.groups_outlined),
                title: Text(l10n.flPoolTitle),
                subtitle: Text(
                  l10n.flPoolBody(pending[i].reqNo, pending[j].reqNo),
                ),
              ),
            ),
          ];
        }
      }
    }
    return const [];
  }
}
