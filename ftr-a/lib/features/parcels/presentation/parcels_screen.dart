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
  String _view = 'incoming';
  String _query = '';
  bool _stuckOnly = false;
  String _statusFilter = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s != null && s.hasRole('MAILROOM')) {
      _view = 'site';
    } else if (s != null && s.hasRole('DRIVER')) {
      _view = 'carrying';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  bool get _filtersActive => _stuckOnly || _statusFilter != 'ALL';

  Future<void> _refresh() async {
    ref.invalidate(parcelsProvider);
    if (_view == 'waiting') return;
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
                    Wrap(
                      children: [
                        chip(
                          selected: _statusFilter == 'ALL' && !_stuckOnly,
                          label: l10n.pcFilterAllStatuses,
                          onTap: () {
                            _statusFilter = 'ALL';
                            _stuckOnly = false;
                          },
                        ),
                        chip(
                          selected: _statusFilter == 'IN_TRANSIT',
                          label: l10n.pcStatusInTransit,
                          onTap: () => _statusFilter = 'IN_TRANSIT',
                        ),
                        chip(
                          selected: _statusFilter == 'RETURNS',
                          label: l10n.pcStatusReturning,
                          onTap: () => _statusFilter = 'RETURNS',
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
    if (_stuckOnly && !p.stuck) return false;
    if (_statusFilter == 'IN_TRANSIT' &&
        p.status != 'IN_TRANSIT' &&
        p.status != 'DISPATCHED' &&
        p.status != 'AT_GATE' &&
        p.status != 'OUT_FOR_DELIVERY') {
      return false;
    }
    if (_statusFilter == 'RETURNS' && !p.status.startsWith('RETURN')) {
      return false;
    }
    return true;
  }

  List<Parcel> _waitingOf(Iterable<List<Parcel>?> sources) {
    final seen = <String>{};
    final out = <Parcel>[];
    for (final src in sources) {
      if (src == null) continue;
      for (final p in src) {
        if (p.me.waitingOnMe && seen.add(p.id)) out.add(p);
      }
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('parcels:create') ?? false;
    final canRead = session?.can('parcels:read') ?? false;
    final canWide =
        (session?.can('parcels:manage') ?? false) ||
        (session?.can('parcels:read', GrantScope.site) ?? false);
    final isDriver = session?.hasRole('DRIVER') ?? false;
    final isMailroom = session?.hasRole('MAILROOM') ?? false;

    final incoming = ref.watch(parcelsProvider('incoming', query: _query));
    final sent = ref.watch(parcelsProvider('sent', query: _query));
    final carrying = ref.watch(parcelsProvider('carrying', query: _query));
    final site = canWide
        ? ref.watch(parcelsProvider('site', query: _query))
        : null;
    final all = canWide
        ? ref.watch(parcelsProvider('all', query: _query))
        : null;
    final waiting = _waitingOf([
      incoming.value,
      carrying.value,
      if (canWide) site?.value,
    ]);
    final showCarrying =
        isDriver || isMailroom || (carrying.value?.isNotEmpty ?? false);

    final rows = _view == 'waiting'
        ? null
        : ref.watch(
            parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly),
          );

    Widget viewChip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        visualDensity: VisualDensity.compact,
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _view == view,
        onSelected: (_) {
          Haptics.tap();
          setState(() => _view = view);
        },
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleParcels)),
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
                      if (canRead || canCreate) ...[
                        viewChip(
                          'incoming',
                          '${l10n.pcTabIncoming} (${incoming.value?.length ?? 0})',
                        ),
                        viewChip(
                          'sent',
                          '${l10n.pcTabSent} (${sent.value?.length ?? 0})',
                        ),
                      ],
                      viewChip('waiting', l10n.pcTabWaiting(waiting.length)),
                      if (showCarrying)
                        viewChip(
                          'carrying',
                          '${l10n.pcTabCarrying} (${carrying.value?.length ?? 0})',
                        ),
                      if (canWide) ...[
                        viewChip(
                          'site',
                          '${l10n.pcTabSite} (${site?.value?.length ?? 0})',
                        ),
                        viewChip(
                          'all',
                          '${l10n.pcTabAll} (${all?.value?.length ?? 0})',
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xs),
          Expanded(
            child: _list(
              bangla: bangla,
              waiting: waiting,
              waitingLoading:
                  incoming.isLoading ||
                  carrying.isLoading ||
                  (site?.isLoading ?? false),
              rows: rows,
            ),
          ),
        ],
      ),
    );
  }

  Widget _list({
    required bool bangla,
    required List<Parcel> waiting,
    required bool waitingLoading,
    required AsyncValue<List<Parcel>>? rows,
  }) {
    final l10n = context.l10n;
    if (_view == 'waiting') {
      if (waitingLoading && waiting.isEmpty) return const SkeletonList();
      final list = waiting.where(_matchesFilters).toList();
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
          itemBuilder: (_, i) => _Row(parcel: list[i], bangla: bangla),
        ),
      );
    }
    return rows!.when(
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
            itemBuilder: (_, i) => _Row(parcel: list[i], bangla: bangla),
          ),
        );
      },
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
    final who = p.me.isRecipient
        ? p.sender.display(bangla: bangla)
        : p.recipient.display(bangla: bangla);
    final meta =
        '${p.origin.label(bangla: bangla)} → ${p.dest.label(bangla: bangla)} · $who';
    return ListRow(
      leading: Icon(
        p.isConfidential ? Icons.lock_outline : Icons.inventory_2_outlined,
      ),
      title: title,
      subtitle: '$meta\n${parcelNextLine(l10n, p, bangla: bangla)}',
      trailing: StatusPill(
        label: parcelStatusLabel(l10n, p.status),
        tone: parcelStatusTone(p.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.parcelDetail(p.id))),
    );
  }
}
