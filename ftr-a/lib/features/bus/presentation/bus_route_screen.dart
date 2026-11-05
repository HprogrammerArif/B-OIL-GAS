import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/bus/data/bus_repository.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_providers.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// One route: stops and timings, join the waitlist, and (Transport) the seat
/// map, queue with priority override, and broadcast.
class BusRouteScreen extends ConsumerStatefulWidget {
  const BusRouteScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<BusRouteScreen> createState() => _BusRouteScreenState();
}

class _BusRouteScreenState extends ConsumerState<BusRouteScreen> {
  bool _busy = false;

  void _refresh() {
    ref
      ..invalidate(busRouteDetailProvider(widget.id))
      ..invalidate(busRoutesProvider)
      ..invalidate(mySeatProvider);
  }

  Future<void> _run(Future<Object?> Function() action, String done) async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await action();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      _refresh();
      if (!mounted) return;
      AppToast.show(context, switch (e.rule) {
        'ALREADY_HAS_SEAT' => l10n.busErrHasSeat,
        'ALREADY_WAITING' => l10n.busErrAlreadyWaiting,
        _ => l10n.busErrFailed,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _join(BusRoute r) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busJoinConfirm(r.displayName(bangla: context.isBangla)),
      message: l10n.busJoinMessage,
      confirmLabel: l10n.busJoin,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).join(r.id),
      l10n.busJoined,
    );
  }

  Future<void> _endSeat(SeatCell s) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busEndConfirm(digits(s.seatNo, bangla: context.isBangla)),
      message: l10n.busEndMessage,
      destructive: true,
      confirmLabel: l10n.busEnd,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).endAllocation(s.allocationId!),
      l10n.busEnded,
    );
  }

  Future<void> _priority(QueueItem q) async {
    final r = await showModalBottomSheet<({int priority, String? reason})>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _PrioritySheet(item: q),
    );
    if (r == null || !mounted) return;
    await _run(
      () => ref
          .read(busRepositoryProvider)
          .setPriority(q.id, priority: r.priority, reason: r.reason),
      context.l10n.busPrioritySaved,
    );
  }

  Future<void> _broadcast(BusRoute route) async {
    final msg = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _BroadcastSheet(),
    );
    if (msg == null || !mounted) return;
    await _run(
      () => ref
          .read(busRepositoryProvider)
          .broadcast(message: msg, routeId: route.id),
      context.l10n.busBroadcastSent,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final detail = ref.watch(busRouteDetailProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.busRouteTitle)),
      body: detail.when(
        loading: () => const SkeletonList(itemCount: 4),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(busRouteDetailProvider(widget.id)),
        ),
        data: (r) => RefreshIndicator(
          onRefresh: () async {
            _refresh();
            await ref.read(busRouteDetailProvider(widget.id).future);
          },
          child: _Body(
            route: r,
            busy: _busy,
            onJoin: () => unawaited(_join(r)),
            onEnd: (s) => unawaited(_endSeat(s)),
            onPriority: (q) => unawaited(_priority(q)),
            onBroadcast: () => unawaited(_broadcast(r)),
          ),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({
    required this.route,
    required this.busy,
    required this.onJoin,
    required this.onEnd,
    required this.onPriority,
    required this.onBroadcast,
  });

  final BusRoute route;
  final bool busy;
  final VoidCallback onJoin;
  final ValueChanged<SeatCell> onEnd;
  final ValueChanged<QueueItem> onPriority;
  final VoidCallback onBroadcast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final r = route;
    final canSeat = session?.can('bus:seat-self') ?? false;
    final canAllocate = session?.can('bus:allocate') ?? false;
    final canBroadcast = session?.can('bus:broadcast') ?? false;
    final admin = r.admin;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: Space.xxxl),
      children: [
        Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${r.code} · ${r.displayName(bangla: bangla)}',
                          style: theme.textTheme.titleLarge,
                        ),
                      ),
                      if (r.myStatus != null)
                        StatusPill(
                          label: routeStatusLabel(l10n, r.myStatus!),
                          tone: routeStatusTone(r.myStatus!),
                        ),
                    ],
                  ),
                  Text(
                    l10n.busRouteMeta(
                      r.busNo,
                      digits(r.distanceKm.toStringAsFixed(0), bangla: bangla),
                    ),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.md),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (r.occupancyPct / 100).clamp(0, 1).toDouble(),
                      minHeight: 8,
                      color: r.isFull ? context.bogcl.danger : null,
                    ),
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    r.isFull
                        ? l10n.busFull(digits(r.waitlistLength, bangla: bangla))
                        : l10n.busFreeSeats(
                            digits(r.free, bangla: bangla),
                            digits(r.capacity, bangla: bangla),
                          ),
                  ),
                  if (canSeat && r.myStatus == null) ...[
                    const SizedBox(height: Space.md),
                    PrimaryButton(
                      label: l10n.busJoin,
                      loading: busy,
                      onPressed: onJoin,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        SectionHeader(title: l10n.busStops),
        for (final s in r.stops)
          ListRow(
            title: s.displayName(bangla: bangla),
            subtitle: l10n.busStopTimes(
              clock(s.morning, bangla: bangla),
              clock(s.evening, bangla: bangla),
            ),
            leading: const Icon(Icons.place_outlined, size: 20),
          ),
        if (admin != null) ...[
          _ConductorCard(routeId: r.id, canSwap: canSeat),
          SectionHeader(title: l10n.busSeatMap),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Wrap(
              spacing: Space.sm,
              runSpacing: Space.sm,
              children: [
                for (final s in admin.seats)
                  _SeatChip(
                    cell: s,
                    onTap: canAllocate && s.allocationId != null
                        ? () => onEnd(s)
                        : null,
                  ),
              ],
            ),
          ),
          const _Legend(),
          SectionHeader(title: l10n.busQueue(admin.queue.length)),
          if (admin.queue.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.lg),
              child: Text(l10n.busQueueEmpty),
            ),
          for (final (i, q) in admin.queue.indexed)
            ListRow(
              title: q.displayName(bangla: bangla),
              subtitle: [
                ?q.empCode,
                if (q.priority > 0)
                  l10n.busPriorityLevel(digits(q.priority, bangla: bangla)),
                if (q.offered && q.expiresAt != null)
                  remaining(l10n, q.expiresAt!, bangla: bangla),
              ].join(' · '),
              leading: CircleAvatar(
                radius: 14,
                child: Text(
                  q.offered ? '★' : digits(i + 1, bangla: bangla),
                  style: theme.textTheme.labelSmall,
                ),
              ),
              trailing: q.offered
                  ? StatusPill(
                      label: l10n.busOfferedBadge,
                      tone: StatusTone.info,
                    )
                  : const Icon(Icons.tune, size: 20),
              onTap: q.offered ? null : () => onPriority(q),
            ),
          if (canBroadcast)
            Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: PrimaryButton.secondary(
                label: l10n.busBroadcast,
                icon: Icons.campaign_outlined,
                onPressed: busy ? null : onBroadcast,
              ),
            ),
        ],
      ],
    );
  }
}

class _SeatChip extends StatelessWidget {
  const _SeatChip({required this.cell, this.onTap});

  final SeatCell cell;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.bogcl;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final color = switch (cell.status) {
      'ACTIVE' => colors.success,
      'VACATED' => colors.warning,
      'OFFERED' => colors.info,
      _ => theme.colorScheme.outline,
    };
    return Semantics(
      button: onTap != null,
      label: '${cell.seatNo} ${cell.occupant(bangla: bangla)}',
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color.withValues(alpha: cell.status == 'EMPTY' ? 0.05 : 0.2),
            border: Border.all(color: color),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            digits(cell.seatNo, bangla: bangla),
            style: theme.textTheme.labelMedium,
          ),
        ),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final colors = context.bogcl;
    Widget dot(Color c, String t) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.circle, size: 10, color: c),
        const SizedBox(width: 4),
        Text(t, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
      child: Wrap(
        spacing: Space.md,
        children: [
          dot(colors.success, l10n.busLegendTaken),
          dot(colors.warning, l10n.busLegendReleased),
          dot(colors.info, l10n.busLegendOffered),
          dot(Theme.of(context).colorScheme.outline, l10n.busLegendFree),
        ],
      ),
    );
  }
}

class _PrioritySheet extends StatefulWidget {
  const _PrioritySheet({required this.item});

  final QueueItem item;

  @override
  State<_PrioritySheet> createState() => _PrioritySheetState();
}

class _PrioritySheetState extends State<_PrioritySheet> {
  late double _p = widget.item.priority.toDouble();
  late final _reason = TextEditingController(
    text: widget.item.priorityReason ?? '',
  );
  bool _showErrors = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final level = _p.round();
    final reasonOk = level == 0 || _reason.text.trim().length >= 10;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.busPriorityTitle(widget.item.displayName(bangla: bangla)),
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.busPriorityLevel(digits(level, bangla: bangla))),
              Slider(
                value: _p,
                max: 9,
                divisions: 9,
                label: digits(level, bangla: bangla),
                onChanged: (v) => setState(() => _p = v),
              ),
              if (level > 0)
                AppTextField(
                  label: l10n.busPriorityReason,
                  controller: _reason,
                  required: true,
                  maxLines: 2,
                  maxLength: 200,
                  helper: l10n.busPriorityReasonHint,
                  errorText: _showErrors && !reasonOk
                      ? l10n.busPriorityReasonHint
                      : null,
                  onChanged: (_) => setState(() {}),
                ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: l10n.busPrioritySave,
                onPressed: () {
                  setState(() => _showErrors = true);
                  if (!reasonOk) return;
                  Navigator.of(context).pop((
                    priority: level,
                    reason: level == 0 ? null : _reason.text.trim(),
                  ));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BroadcastSheet extends StatefulWidget {
  const _BroadcastSheet();

  @override
  State<_BroadcastSheet> createState() => _BroadcastSheetState();
}

class _BroadcastSheetState extends State<_BroadcastSheet> {
  final _msg = TextEditingController();
  bool _showErrors = false;

  @override
  void dispose() {
    _msg.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final ok = _msg.text.trim().length >= 3;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.busBroadcast,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.busBroadcastMessage,
                controller: _msg,
                required: true,
                maxLines: 3,
                maxLength: 300,
                errorText: _showErrors && !ok ? l10n.claimErrPurpose : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: l10n.busBroadcastSend,
                onPressed: () {
                  setState(() => _showErrors = true);
                  if (ok) Navigator.of(context).pop(_msg.text.trim());
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConductorCard extends ConsumerStatefulWidget {
  const _ConductorCard({required this.routeId, required this.canSwap});

  final String routeId;
  final bool canSwap;

  @override
  ConsumerState<_ConductorCard> createState() => _ConductorCardState();
}

class _ConductorCardState extends ConsumerState<_ConductorCard> {
  final _q = TextEditingController();
  final _seat = TextEditingController();
  String? _result;

  @override
  void dispose() {
    _q.dispose();
    _seat.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.busConductor,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              AppTextField(label: l10n.busConductorHint, controller: _q),
              const SizedBox(height: Space.sm),
              PrimaryButton(
                label: l10n.busConductor,
                onPressed: () async {
                  final rec = await ref
                      .read(busRepositoryProvider)
                      .verify(widget.routeId, _q.text);
                  if (!mounted) return;
                  setState(() {
                    _result = rec['ok'] == true
                        ? l10n.busConductorOk(
                            '${rec['name']}',
                            '${rec['seatNo']}',
                          )
                        : l10n.busConductorMiss;
                  });
                },
              ),
              if (_result != null) Text(_result!),
              if (widget.canSwap) ...[
                const SizedBox(height: Space.md),
                AppTextField(
                  label: l10n.busSwap,
                  controller: _seat,
                  keyboardType: TextInputType.number,
                  helper: l10n.busSwapHint,
                ),
                TextButton(
                  onPressed: () async {
                    final n = int.tryParse(_seat.text.trim());
                    if (n == null) return;
                    await ref
                        .read(busRepositoryProvider)
                        .requestSwap(widget.routeId, n);
                    if (context.mounted) {
                      AppToast.show(
                        context,
                        l10n.busSwapDone,
                        tone: StatusTone.success,
                      );
                    }
                  },
                  child: Text(l10n.busSwap),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
