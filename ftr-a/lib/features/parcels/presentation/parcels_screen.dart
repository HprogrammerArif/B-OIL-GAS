import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ParcelsScreen extends ConsumerStatefulWidget {
  const ParcelsScreen({super.key});

  @override
  ConsumerState<ParcelsScreen> createState() => _ParcelsScreenState();
}

class _ParcelsScreenState extends ConsumerState<ParcelsScreen> {
  String _view = 'mine';
  String _query = '';
  bool _stuckOnly = false;
  String _statusFilter = 'ALL';
  String _directionFilter = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s != null &&
        (s.hasRole('MAILROOM') ||
            s.hasRole('TRANSPORT_ADMIN') ||
            s.hasRole('CHAIRMAN'))) {
      _view = 'all';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  bool get _filtersActive =>
      _stuckOnly || _statusFilter != 'ALL' || _directionFilter != 'ALL';

  int _viewCount(String view) =>
      ref.watch(parcelsProvider(view, query: _query)).value?.length ?? 0;

  Future<void> _refresh() async {
    ref.invalidate(parcelsProvider);
    await ref.read(
      parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly).future,
    );
  }

  Future<void> _open(String text) async {
    final l10n = context.l10n;
    final no = text.trim().toUpperCase();
    if (!RegExp(r'^PKG-\d{4}-\d{4}$').hasMatch(no)) return;
    try {
      final p = await ref.read(parcelRepositoryProvider).byTracking(no);
      if (!mounted) return;
      unawaited(context.push(AppRoutes.parcelDetail(p.id)));
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.pcNotFound, tone: StatusTone.warning);
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
                      l10n.pcFilter,
                      style: Theme.of(ctx).textTheme.titleMedium,
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.pcFilterStatus,
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      children: [
                        chip(
                          selected: _statusFilter == 'ALL',
                          label: l10n.pcFilterAllStatuses,
                          onTap: () => _statusFilter = 'ALL',
                        ),
                        chip(
                          selected: _statusFilter == 'IN_TRANSIT',
                          label: l10n.pcStatusInTransit,
                          onTap: () => _statusFilter = 'IN_TRANSIT',
                        ),
                        chip(
                          selected: _statusFilter == 'READY_OTP',
                          label: l10n.pcStatusOut,
                          onTap: () => _statusFilter = 'READY_OTP',
                        ),
                        chip(
                          selected: _statusFilter == 'DELIVERED',
                          label: l10n.pcStatusDelivered,
                          onTap: () => _statusFilter = 'DELIVERED',
                        ),
                        chip(
                          selected: _statusFilter == 'RETURNING',
                          label: l10n.pcStatusReturning,
                          onTap: () => _statusFilter = 'RETURNING',
                        ),
                        chip(
                          selected: _statusFilter == 'QUARANTINED',
                          label: l10n.pcStatusHeld,
                          onTap: () => _statusFilter = 'QUARANTINED',
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.md),
                    Wrap(
                      children: [
                        chip(
                          selected: _directionFilter == 'HQ_TO_PLANT',
                          label: l10n.pcDirHqPlant,
                          onTap: () => _directionFilter =
                              _directionFilter == 'HQ_TO_PLANT'
                              ? 'ALL'
                              : 'HQ_TO_PLANT',
                        ),
                        chip(
                          selected: _directionFilter == 'PLANT_TO_HQ',
                          label: l10n.pcDirPlantHq,
                          onTap: () => _directionFilter =
                              _directionFilter == 'PLANT_TO_HQ'
                              ? 'ALL'
                              : 'PLANT_TO_HQ',
                        ),
                        chip(
                          selected: _directionFilter == 'EXTERNAL',
                          label: l10n.pcDirExternal,
                          onTap: () =>
                              _directionFilter = _directionFilter == 'EXTERNAL'
                              ? 'ALL'
                              : 'EXTERNAL',
                        ),
                        chip(
                          selected: _stuckOnly,
                          label: l10n.pcStuckOnly,
                          onTap: () => _stuckOnly = !_stuckOnly,
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

  bool _matchesFilters(Parcel p) {
    if (_statusFilter == 'IN_TRANSIT' &&
        p.status != 'IN_TRANSIT' &&
        p.status != 'DISPATCHED' &&
        p.status != 'AT_GATE') {
      return false;
    }
    if (_statusFilter == 'READY_OTP' && p.status != 'OUT_FOR_DELIVERY') {
      return false;
    }
    if (_statusFilter == 'DELIVERED' && p.status != 'DELIVERED') {
      return false;
    }
    if (_statusFilter == 'RETURNING' && !p.status.startsWith('RETURN')) {
      return false;
    }
    if (_statusFilter == 'QUARANTINED' &&
        p.status != 'QUARANTINED' &&
        p.tamperStatus != 'FLAGGED') {
      return false;
    }
    if (_directionFilter == 'HQ_TO_PLANT' &&
        (p.origin.id != 'site_hq' || p.dest.id != 'site_plant')) {
      return false;
    }
    if (_directionFilter == 'PLANT_TO_HQ' &&
        (p.origin.id != 'site_plant' || p.dest.id != 'site_hq')) {
      return false;
    }
    if (_directionFilter == 'EXTERNAL' && p.intraSite) {
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('parcels:create') ?? false;
    final canWide =
        (session?.can('parcels:manage') ?? false) ||
        (session?.can('parcels:read', GrantScope.site) ?? false);
    final rows = ref.watch(
      parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly),
    );

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
        title: Text(l10n.moduleParcels),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => unawaited(_refresh()),
          ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.parcelNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.pcSend),
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
                  onChanged: (v) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), () {
                      if (mounted) setState(() => _query = v.trim());
                    });
                  },
                  onSubmitted: (v) => unawaited(_open(v)),
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: l10n.pcSearchHint,
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                    suffixIcon: IconButton(
                      tooltip: l10n.pcFilter,
                      onPressed: () => unawaited(_openFilters()),
                      icon: Badge(
                        isLabelVisible: _filtersActive,
                        child: const Icon(Icons.tune),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: Space.xs),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      viewChip('mine', l10n.pcTabMine),
                      viewChip('incoming', l10n.pcTabIncoming),
                      viewChip('sent', l10n.pcTabSent),
                      viewChip('carrying', l10n.pcTabCarrying),
                      if (canWide) viewChip('site', l10n.pcTabSite),
                      if (canWide) viewChip('all', l10n.pcTabAll),
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
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (rawList) {
                final list = rawList.where(_matchesFilters).toList();
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: _query.isNotEmpty || _filtersActive
                        ? l10n.pcEmptyFiltered
                        : l10n.pcEmpty,
                  );
                }
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) =>
                        _Row(parcel: list[i], bangla: bangla),
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
  const _Row({required this.parcel, required this.bangla});

  final Parcel parcel;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final p = parcel;
    final title = p.hidden || p.description == null
        ? l10n.pcConfidentialTitle
        : p.description!;
    final meta =
        '${p.origin.label(bangla: bangla)} → ${p.dest.label(bangla: bangla)}';
    return ListRow(
      leading: Icon(
        p.isConfidential ? Icons.lock_outline : Icons.inventory_2_outlined,
      ),
      title: title,
      subtitle: '$meta\n${parcelNextLine(l10n, p, bangla: bangla)}',
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          StatusPill(
            label: parcelStatusLabel(l10n, p.status),
            tone: parcelStatusTone(p.status),
          ),
          if (p.stuck)
            Padding(
              padding: const EdgeInsets.only(top: Space.xs),
              child: StatusPill(
                label: l10n.pcStuckPill(p.dwellHours),
                tone: StatusTone.danger,
              ),
            ),
        ],
      ),
      onTap: () => unawaited(context.push(AppRoutes.parcelDetail(p.id))),
    );
  }
}
