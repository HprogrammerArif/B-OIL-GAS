import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class PeopleScreen extends ConsumerStatefulWidget {
  const PeopleScreen({super.key});

  @override
  ConsumerState<PeopleScreen> createState() => _PeopleScreenState();
}

class _PeopleScreenState extends ConsumerState<PeopleScreen> {
  String _view = 'all';
  String _query = '';
  Timer? _debounce;

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
    final canAdd = session?.can('employees:create') ?? false;
    final rows = ref.watch(staffListProvider(view: _view, query: _query));

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleEmployees)),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.peopleNew)),
              icon: const Icon(Icons.person_add_alt_1_outlined),
              label: Text(l10n.emNew),
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
                  l10n.emIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.emSearchHint,
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
                      chip('all', l10n.emTabAll),
                      chip('team', l10n.emTabTeam),
                      chip('leaving', l10n.emTabLeaving),
                      chip('former', l10n.emTabFormer),
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
                  ErrorState(onRetry: () => ref.invalidate(staffListProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.emEmpty
                        : l10n.emEmptyFiltered,
                  );
                }
                final need = list.where(staffNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(staffListProvider);
                    await ref.read(
                      staffListProvider(view: _view, query: _query).future,
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
                              ? l10n.emSummaryNone
                              : l10n.emSummaryNeed(need),
                        ),
                      ),
                      for (final e in list)
                        ListRow(
                          leading: CircleAvatar(
                            child: Text(
                              e.fullName.isEmpty
                                  ? '?'
                                  : e.fullName.substring(0, 1),
                            ),
                          ),
                          title: e.heading(bangla: bangla),
                          subtitle: [
                            e.job(bangla: bangla),
                            e.where(bangla: bangla),
                            e.next(bangla: bangla),
                          ].where((s) => s.isNotEmpty).join('\n'),
                          trailing: StatusPill(
                            label: staffStatusLabel(l10n, e.status),
                            tone: staffStatusTone(e.status),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.peopleDetail(e.id)),
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
