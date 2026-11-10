import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class VisitorsScreen extends ConsumerStatefulWidget {
  const VisitorsScreen({super.key});

  @override
  ConsumerState<VisitorsScreen> createState() => _VisitorsScreenState();
}

class _VisitorsScreenState extends ConsumerState<VisitorsScreen> {
  String _view = 'mine';
  String _query = '';
  String _categoryFilter = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s != null && (s.hasRole('SECURITY_GATE') || s.hasRole('CHAIRMAN'))) {
      _view = 'all';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  bool get _filtersActive => _categoryFilter != 'ALL';

  int _viewCount(String view) =>
      ref.watch(visitsProvider(view: view, query: _query)).value?.length ?? 0;

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
                      l10n.visFilter,
                      style: Theme.of(ctx).textTheme.titleMedium,
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.visFilterCategories,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        chip(
                          selected: _categoryFilter == 'ALL',
                          label: l10n.visFilterAllCategories,
                          onTap: () => _categoryFilter = 'ALL',
                        ),
                        for (final c in visitCategories)
                          chip(
                            selected: _categoryFilter == c,
                            label: visitCategoryLabel(l10n, c),
                            onTap: () => _categoryFilter = c,
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
    final canCreate = session?.can('visitors:create') ?? false;
    final canGate = session?.can('visitors:gate') ?? false;
    final canApprove = session?.can('visitors:approve') ?? false;
    final canSite =
        (session?.can('visitors:read', GrantScope.site) ?? false) ||
        (session?.roleKeys.any(
              (r) =>
                  r == 'TRANSPORT_ADMIN' ||
                  r == 'HR_ADMIN' ||
                  r == 'CHAIRMAN' ||
                  r == 'PLANT_GM' ||
                  r == 'SECURITY_GATE',
            ) ??
            false);
    final rows = ref.watch(visitsProvider(view: _view, query: _query));

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
        title: Text(l10n.moduleVisitors),
        actions: [
          if (canGate || canSite)
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
            padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.md, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.visSearchHint,
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                    suffixIcon: IconButton(
                      tooltip: l10n.visFilter,
                      onPressed: () => unawaited(_openFilters()),
                      icon: Badge(
                        isLabelVisible: _filtersActive,
                        child: const Icon(Icons.tune),
                      ),
                    ),
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
                const SizedBox(height: Space.xs),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      viewChip('mine', l10n.visTabMine),
                      if (canGate || canSite) ...[
                        viewChip('inside', l10n.visTabInside),
                        viewChip('expected', l10n.visTabExpected),
                        viewChip('overdue', l10n.visTabOverdue),
                      ],
                      if (canApprove)
                        viewChip('to-approve', l10n.visTabApprove),
                      if (canSite) viewChip('all', l10n.visTabAll),
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
                  ErrorState(onRetry: () => ref.invalidate(visitsProvider)),
              data: (rawList) {
                final list = _categoryFilter == 'ALL'
                    ? rawList
                    : rawList
                          .where((v) => v.category == _categoryFilter)
                          .toList();
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty && !_filtersActive
                        ? l10n.visEmpty
                        : l10n.visEmptyFiltered,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(visitsProvider);
                    await ref.read(
                      visitsProvider(view: _view, query: _query).future,
                    );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) => _Row(visit: list[i], bangla: bangla),
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
  const _Row({required this.visit, required this.bangla});

  final Visit visit;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final v = visit;
    final org = v.guest.organisation;
    final meta = [
      if (org != null && org.isNotEmpty) org,
      v.site.label(bangla: bangla),
    ].join(' · ');
    return ListRow(
      title: v.guest.fullName,
      subtitle: '$meta\n${visitNextLine(l10n, v, bangla: bangla)}',
      trailing: StatusPill(
        label: visitStatusLabel(l10n, v.status),
        tone: visitStatusTone(v.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.visitDetail(v.id))),
    );
  }
}
