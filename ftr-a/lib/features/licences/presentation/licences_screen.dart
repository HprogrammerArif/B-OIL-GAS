import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canAdd = session?.can('compliance:create') ?? false;
    final rows = ref.watch(licencesProvider(view: _view, query: _query));

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleCompliance)),
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
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.cpIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.cpSearchHint,
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
                      chip('mine', l10n.cpTabMine),
                      chip('critical', l10n.cpTabCritical),
                      chip('warning', l10n.cpTabWarning),
                      chip('renewing', l10n.cpTabRenew),
                      chip('expired', l10n.cpTabExpired),
                      chip('all', l10n.cpTabAll),
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
                  ErrorState(onRetry: () => ref.invalidate(licencesProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.cpEmpty
                        : l10n.cpEmptyFiltered,
                  );
                }
                final need = list.where(licenceNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(licencesProvider);
                    await ref.read(
                      licencesProvider(view: _view, query: _query).future,
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
                              ? l10n.cpSummaryNone
                              : l10n.cpSummaryNeed(need),
                        ),
                      ),
                      for (final e in list)
                        ListRow(
                          leading: const Icon(Icons.gavel_outlined),
                          title: e.heading(bangla: bangla),
                          subtitle: [
                            [
                              e.bodyCode,
                              e.siteLabel(bangla: bangla),
                              if (e.daysToExpiry < 0)
                                l10n.cpUrgExpired
                              else
                                l10n.cpDays(e.daysToExpiry),
                            ].join(' · '),
                            licenceNextLine(l10n, e, bangla: bangla),
                          ].join('\n'),
                          trailing: StatusPill(
                            label: licenceUrgencyLabel(l10n, e.urgency),
                            tone: licenceUrgencyTone(e.urgency),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.licenceDetail(e.id)),
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
