import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canReport = session?.can('incidents:report') ?? false;
    final canTriage = session?.can('incidents:triage') ?? false;
    final canWide =
        canTriage || (session?.can('incidents:read', GrantScope.site) ?? false);
    final rows = ref.watch(incidentsProvider(view: _view, query: _query));

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

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
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.inIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.inSearchHint,
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
                      chip('mine', l10n.inTabMine),
                      if (canTriage) chip('to-triage', l10n.inTabTriage),
                      chip('open', l10n.inTabOpen),
                      chip('serious', l10n.inTabSerious),
                      if (canTriage) chip('statutory', l10n.inTabStatutory),
                      chip('my-capa', l10n.inTabCapa),
                      if (canWide) chip('all', l10n.inTabAll),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => ref.invalidate(incidentsProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.inEmpty
                        : l10n.inEmptyFiltered,
                  );
                }
                final need = list.where(incidentNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(incidentsProvider);
                    await ref.read(
                      incidentsProvider(view: _view, query: _query).future,
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
                              ? l10n.inVerdictNone
                              : l10n.inVerdictNeed(need),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      for (final i in list)
                        ListRow(
                          leading: Icon(
                            i.riskCategory == 'EXTREME' ||
                                    i.riskCategory == 'HIGH'
                                ? Icons.warning_amber_outlined
                                : Icons.health_and_safety_outlined,
                          ),
                          title: i.title,
                          subtitle: [
                            '${i.incidentNo} · ${incidentTypeLabel(l10n, i.type)}',
                            incidentNextLine(l10n, i, bangla: bangla),
                          ].join('\n'),
                          trailing: StatusPill(
                            label: incidentStageLabel(l10n, i.stage),
                            tone: incidentStageTone(i.stage),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.incidentDetail(i.id)),
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
}
