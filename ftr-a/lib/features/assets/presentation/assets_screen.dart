import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_ui.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AssetsScreen extends ConsumerStatefulWidget {
  const AssetsScreen({super.key});

  @override
  ConsumerState<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends ConsumerState<AssetsScreen> {
  String _view = 'mine';
  String _query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('assets:read', GrantScope.site) == true ||
        s?.can('assets:commission') == true ||
        s?.can('assets:maintain') == true) {
      _view = 'attention';
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
    final canAdd =
        session?.can('assets:register') == true ||
        session?.can('assets:commission') == true;
    final wide = session?.can('assets:read', GrantScope.site) == true;
    final rows = ref.watch(assetsProvider(view: _view, query: _query));

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleAssets)),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.assetNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.asNew),
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
                  l10n.asIntro,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  decoration: InputDecoration(
                    hintText: l10n.asSearchHint,
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      tooltip: l10n.asScanTag,
                      icon: const Icon(Icons.qr_code_scanner),
                      onPressed: () async {
                        final tag = await showModalBottomSheet<String>(
                          context: context,
                          showDragHandle: true,
                          builder: (ctx) {
                            final c = TextEditingController();
                            return Padding(
                              padding: const EdgeInsets.all(Space.lg),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(l10n.asScanTag),
                                  TextField(
                                    controller: c,
                                    decoration: InputDecoration(
                                      hintText: l10n.asSearchHint,
                                    ),
                                    autofocus: true,
                                    onSubmitted: Navigator.of(ctx).pop,
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                        if (tag != null && tag.trim().isNotEmpty && mounted) {
                          setState(() => _query = tag.trim());
                        }
                      },
                    ),
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
                      chip('mine', l10n.asTabMine),
                      if (wide) chip('attention', l10n.asTabAttention),
                      chip('custody-pending', l10n.asTabSign),
                      if (wide) chip('maintenance', l10n.asTabRepair),
                      if (wide) chip('calibration', l10n.asTabCal),
                      if (wide) chip('eol', l10n.asTabRetire),
                      if (wide) chip('stock', l10n.asTabStock),
                      chip('vehicles', l10n.asTabCars),
                      if (wide) chip('all', l10n.asTabAll),
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
                  ErrorState(onRetry: () => ref.invalidate(assetsProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.asEmpty
                        : l10n.asEmptyFiltered,
                  );
                }
                final need = list.where(assetNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(assetsProvider);
                    await ref.read(
                      assetsProvider(view: _view, query: _query).future,
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
                              ? l10n.asSummaryNone
                              : l10n.asSummaryNeed(need),
                        ),
                      ),
                      for (final e in list)
                        ListRow(
                          leading: Icon(
                            e.lotoActive
                                ? Icons.lock_outline
                                : Icons.precision_manufacturing_outlined,
                          ),
                          title: e.title(bangla: bangla),
                          subtitle: [
                            [
                              e.siteLabel(bangla: bangla),
                              if (e.custody?.holder != null)
                                e.custody!.holder!.display(bangla: bangla),
                              assetTaka(e.financials.nbv, bangla: bangla),
                            ].join(' · '),
                            assetNextLine(l10n, e, bangla: bangla),
                          ].join('\n'),
                          trailing: StatusPill(
                            label: assetStageLabel(l10n, e.stage),
                            tone: assetStageTone(e.stage),
                          ),
                          onTap: () => unawaited(
                            context.push(AppRoutes.assetDetail(e.id)),
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
