import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Guests I host, expect at the gate, or have inside.
class VisitorsScreen extends ConsumerStatefulWidget {
  const VisitorsScreen({super.key});

  @override
  ConsumerState<VisitorsScreen> createState() => _VisitorsScreenState();
}

class _VisitorsScreenState extends ConsumerState<VisitorsScreen> {
  String _view = 'mine';
  String _query = '';
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _openScan(String text) async {
    final l10n = context.l10n;
    final q = text.trim();
    if (q.length < 3) return;
    try {
      final v = await ref.read(visitorRepositoryProvider).scan(q);
      if (!mounted) return;
      unawaited(context.push(AppRoutes.visitDetail(v.id)));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.code == ApiErrorCode.forbidden
            ? l10n.visScanNeedGate
            : l10n.visNotFound,
        tone: StatusTone.warning,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('visitors:create') ?? false;
    final canGate = session?.can('visitors:gate') ?? false;
    final canApprove = session?.can('visitors:approve') ?? false;
    final canSite = session?.can('visitors:read', GrantScope.site) ?? false;
    final rows = ref.watch(visitsProvider(view: _view, query: _query));

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
        title: Text(l10n.moduleVisitors),
        actions: [
          if (canGate)
            IconButton(
              tooltip: l10n.visMuster,
              onPressed: () => unawaited(context.push(AppRoutes.visitMuster)),
              icon: const Icon(Icons.groups_outlined),
            ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.visitNew)),
              icon: const Icon(Icons.person_add_outlined),
              label: Text(l10n.visNew),
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
                  l10n.visIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.visSearchHint,
                    prefixIcon: const Icon(Icons.search),
                  ),
                  textInputAction: TextInputAction.search,
                  onChanged: (v) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), () {
                      if (mounted) setState(() => _query = v);
                    });
                  },
                  onSubmitted: (v) {
                    if (canGate) unawaited(_openScan(v));
                  },
                ),
                const SizedBox(height: Space.sm),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      chip('mine', l10n.visTabMine),
                      if (canGate || canSite)
                        chip('expected', l10n.visTabExpected),
                      if (canGate || canSite) chip('inside', l10n.visTabInside),
                      if (canGate || canSite)
                        chip('overdue', l10n.visTabOverdue),
                      if (canApprove) chip('to-approve', l10n.visTabApprove),
                      if (canSite) chip('all', l10n.visTabAll),
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
                  ErrorState(onRetry: () => ref.invalidate(visitsProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.visEmpty
                        : l10n.visEmptyFiltered,
                  );
                }
                final need = list.where(visitNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(visitsProvider);
                    await ref.read(
                      visitsProvider(view: _view, query: _query).future,
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
                              ? l10n.visVerdictNone
                              : l10n.visVerdictNeed(need),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      for (final v in list)
                        ListRow(
                          leading: Icon(
                            v.category == 'VIP' || v.category == 'GOVT'
                                ? Icons.star_outline
                                : Icons.badge_outlined,
                          ),
                          title: v.guest.fullName,
                          subtitle: [
                            '${v.visitNo} · ${v.site.label(bangla: bangla)}',
                            visitNextLine(l10n, v, bangla: bangla),
                          ].join('\n'),
                          trailing: StatusPill(
                            label: visitStatusLabel(l10n, v.status),
                            tone: visitStatusTone(v.status),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.visitDetail(v.id)),
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
