import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/bus/data/bus_repository.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_providers.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_ui.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Tab { mySeat, routes }

/// Staff bus: my seat / waitlist / offer, and the route list.
class BusScreen extends ConsumerStatefulWidget {
  const BusScreen({super.key});

  @override
  ConsumerState<BusScreen> createState() => _BusScreenState();
}

class _BusScreenState extends ConsumerState<BusScreen> {
  _Tab _tab = _Tab.mySeat;

  Future<void> _refresh() async {
    ref
      ..invalidate(busRoutesProvider)
      ..invalidate(mySeatProvider)
      ..invalidate(busRouteDetailProvider);
    await ref.read(mySeatProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canSeat =
        ref.watch(sessionControllerProvider).value?.can('bus:seat-self') ??
        false;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.busTitle)),
      body: Column(
        children: [
          if (canSeat)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                Space.md,
                Space.lg,
                Space.sm,
              ),
              child: Row(
                children: [
                  ChoiceChip(
                    label: Text(l10n.busTabMySeat),
                    selected: _tab == _Tab.mySeat,
                    onSelected: (_) => setState(() => _tab = _Tab.mySeat),
                  ),
                  const SizedBox(width: Space.sm),
                  ChoiceChip(
                    label: Text(l10n.busTabRoutes),
                    selected: _tab == _Tab.routes,
                    onSelected: (_) => setState(() => _tab = _Tab.routes),
                  ),
                ],
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: canSeat && _tab == _Tab.mySeat
                  ? _MySeatTab(
                      onBrowse: () => setState(() => _tab = _Tab.routes),
                    )
                  : const _RoutesTab(),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- Routes

class _RoutesTab extends ConsumerWidget {
  const _RoutesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final canManage =
        ref.watch(sessionControllerProvider).value?.can('bus:manage') ?? false;
    final routes = ref.watch(busRoutesProvider);
    return routes.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(busRoutesProvider)),
      data: (items) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.sm,
          Space.lg,
          Space.xxxl,
        ),
        children: [
          if (canManage) ...[
            Wrap(
              spacing: Space.sm,
              children: [
                TextButton(
                  onPressed: () => unawaited(_registerBus(context, ref)),
                  child: Text(l10n.busRegister),
                ),
                TextButton(
                  onPressed: items.isEmpty
                      ? null
                      : () => unawaited(_reassignBus(context, ref, items)),
                  child: Text(l10n.busReassign),
                ),
                TextButton(
                  onPressed: items.isEmpty
                      ? null
                      : () => unawaited(_seatMap(context, ref, items.first.id)),
                  child: Text(l10n.busSeatMap),
                ),
              ],
            ),
            const SizedBox(height: Space.sm),
          ],
          for (final r in items)
            Card(
              child: InkWell(
                borderRadius: BorderRadius.circular(Corner.md),
                onTap: () => unawaited(context.push(AppRoutes.busRoute(r.id))),
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
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          if (r.myStatus != null)
                            StatusPill(
                              label: routeStatusLabel(l10n, r.myStatus!),
                              tone: routeStatusTone(r.myStatus!),
                            ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        l10n.busRouteMeta(
                          r.busNo,
                          digits(
                            r.distanceKm.toStringAsFixed(0),
                            bangla: bangla,
                          ),
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
                            ? l10n.busFull(
                                digits(r.waitlistLength, bangla: bangla),
                              )
                            : l10n.busFreeSeats(
                                digits(r.free, bangla: bangla),
                                digits(r.capacity, bangla: bangla),
                              ),
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// --------------------------------------------------------------- My seat

class _MySeatTab extends ConsumerStatefulWidget {
  const _MySeatTab({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  ConsumerState<_MySeatTab> createState() => _MySeatTabState();
}

class _MySeatTabState extends ConsumerState<_MySeatTab> {
  bool _busy = false;

  Future<void> _run(Future<MySeat> Function() action, String done) async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await action();
      ref
        ..invalidate(mySeatProvider)
        ..invalidate(busRoutesProvider)
        ..invalidate(busRouteDetailProvider);
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      ref
        ..invalidate(mySeatProvider)
        ..invalidate(busRoutesProvider);
      if (!mounted) return;
      AppToast.show(context, switch (e.rule) {
        'OFFER_EXPIRED' => l10n.busErrOfferExpired,
        _ => l10n.busErrFailed,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _accept(WaitEntry w) async {
    final stop = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (_) => _StopSheet(stops: w.route.stops),
    );
    if (stop == null || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).accept(w.id, stopId: stop),
      context.l10n.busAccepted,
    );
  }

  Future<void> _decline(WaitEntry w) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busDeclineConfirm,
      message: l10n.busDeclineMessage,
      confirmLabel: l10n.busDecline,
      destructive: true,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).decline(w.id),
      l10n.busDeclined,
    );
  }

  Future<void> _leaveQueue(WaitEntry w) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busLeaveConfirm,
      destructive: true,
      confirmLabel: l10n.busLeave,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).cancelWait(w.id),
      l10n.busLeft,
    );
  }

  Future<void> _release(SeatAllocation a) async {
    final r =
        await showModalBottomSheet<({String from, String to, String reason})>(
          context: context,
          isScrollControlled: true,
          showDragHandle: true,
          builder: (_) => const _ReleaseSheet(),
        );
    if (r == null || !mounted) return;
    await _run(
      () => ref
          .read(busRepositoryProvider)
          .release(a.id, from: r.from, to: r.to, reason: r.reason),
      context.l10n.busReleased,
    );
  }

  Future<void> _reclaim(SeatAllocation a) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busReclaimConfirm,
      message: l10n.busReclaimMessage,
      confirmLabel: l10n.busReclaim,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).reclaim(a.id),
      l10n.busReclaimed,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final seat = ref.watch(mySeatProvider);
    return seat.when(
      loading: () => const SkeletonList(itemCount: 3),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(mySeatProvider)),
      data: (s) {
        if (s.isEmpty) {
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              const SizedBox(height: Space.xxxl),
              EmptyState(
                icon: Icons.directions_bus_outlined,
                title: l10n.busEmptyTitle,
                message: l10n.busEmptyMessage,
                actionLabel: l10n.busBrowse,
                onAction: widget.onBrowse,
              ),
            ],
          );
        }
        final a = s.allocation;
        final w = s.waitlist;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.sm,
            Space.lg,
            Space.xxxl,
          ),
          children: [
            if (w != null && w.offered)
              Card(
                color: context.bogcl.info.withValues(alpha: 0.12),
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.celebration_outlined,
                            color: context.bogcl.info,
                          ),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: Text(
                              l10n.busOfferTitle(
                                digits(w.offerSeatNo ?? 0, bangla: bangla),
                              ),
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(w.route.displayName(bangla: bangla)),
                      if (w.expiresAt != null)
                        Text(
                          remaining(l10n, w.expiresAt!, bangla: bangla),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.bogcl.warning,
                          ),
                        ),
                      const SizedBox(height: Space.md),
                      Row(
                        children: [
                          Expanded(
                            child: PrimaryButton(
                              label: l10n.busAccept,
                              loading: _busy,
                              onPressed: () => unawaited(_accept(w)),
                            ),
                          ),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: PrimaryButton.secondary(
                              label: l10n.busDecline,
                              onPressed: _busy
                                  ? null
                                  : () => unawaited(_decline(w)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            if (a != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.event_seat_outlined),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: Text(
                              l10n.busSeatNo(digits(a.seatNo, bangla: bangla)),
                              style: theme.textTheme.titleLarge,
                            ),
                          ),
                          StatusPill(
                            label: a.vacated
                                ? l10n.busReleasedBadge
                                : l10n.busMySeatBadge,
                            tone: a.vacated
                                ? StatusTone.warning
                                : StatusTone.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        '${a.route.code} · ${a.route.displayName(bangla: bangla)}',
                        style: theme.textTheme.titleSmall,
                      ),
                      if (a.route.busNo != null) Text(a.route.busNo!),
                      if (a.stop != null) ...[
                        const SizedBox(height: Space.sm),
                        Text(
                          l10n.busStopLine(
                            a.stop!.displayName(bangla: bangla),
                            clock(a.stop!.morning, bangla: bangla),
                            clock(a.stop!.evening, bangla: bangla),
                          ),
                        ),
                      ],
                      if (a.vacated &&
                          a.vacatedFrom != null &&
                          a.vacatedTo != null) ...[
                        const SizedBox(height: Space.sm),
                        Text(
                          l10n.busReleasedRange(
                            DateFmt.range(a.vacatedFrom!, a.vacatedTo!, lang),
                          ),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.bogcl.warning,
                          ),
                        ),
                      ],
                      const SizedBox(height: Space.md),
                      if (a.vacated)
                        PrimaryButton(
                          label: l10n.busReclaim,
                          loading: _busy,
                          onPressed: () => unawaited(_reclaim(a)),
                        )
                      else
                        PrimaryButton.secondary(
                          label: l10n.busRelease,
                          onPressed: _busy
                              ? null
                              : () => unawaited(_release(a)),
                        ),
                    ],
                  ),
                ),
              ),
            if (w != null && !w.offered)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.busWaitlistTitle,
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        '${w.route.code} · ${w.route.displayName(bangla: bangla)}',
                      ),
                      const SizedBox(height: Space.md),
                      Text(
                        l10n.busPosition(digits(w.position, bangla: bangla)),
                        style: theme.textTheme.headlineSmall,
                      ),
                      Text(
                        l10n.busEstimate(
                          digits(w.estimatedWaitDays, bangla: bangla),
                        ),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: Space.md),
                      PrimaryButton.secondary(
                        label: l10n.busLeave,
                        onPressed: _busy
                            ? null
                            : () => unawaited(_leaveQueue(w)),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _StopSheet extends StatefulWidget {
  const _StopSheet({required this.stops});

  final List<BusStop> stops;

  @override
  State<_StopSheet> createState() => _StopSheetState();
}

class _StopSheetState extends State<_StopSheet> {
  String? _stop;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.busChooseStop,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: Space.sm),
            Flexible(
              child: SingleChildScrollView(
                child: RadioGroup<String>(
                  groupValue: _stop,
                  onChanged: (v) => setState(() => _stop = v),
                  child: Column(
                    children: [
                      for (final s in widget.stops)
                        RadioListTile<String>(
                          value: s.id,
                          title: Text(s.displayName(bangla: bangla)),
                          subtitle: Text(
                            '${clock(s.morning, bangla: bangla)} · '
                            '${clock(s.evening, bangla: bangla)}',
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.busConfirmSeat,
              onPressed: _stop == null
                  ? null
                  : () => Navigator.of(context).pop(_stop),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReleaseSheet extends StatefulWidget {
  const _ReleaseSheet();

  @override
  State<_ReleaseSheet> createState() => _ReleaseSheetState();
}

class _ReleaseSheetState extends State<_ReleaseSheet> {
  final _reason = TextEditingController();
  DateTime? _from;
  DateTime? _to;
  bool _showErrors = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _pick({required bool from}) async {
    final today = Dhaka.today();
    final d = await showDatePicker(
      context: context,
      initialDate: (from ? _from : _to) ?? _from ?? today,
      firstDate: from ? today : (_from ?? today),
      lastDate: (from ? today : (_from ?? today)).add(const Duration(days: 60)),
    );
    if (d == null) return;
    setState(() {
      if (from) {
        _from = d;
        if (_to == null || _to!.isBefore(d)) _to = d;
      } else {
        _to = d;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final reasonOk = _reason.text.trim().length >= 3;

    Widget picker(String label, DateTime? v, {required bool from}) => InkWell(
      onTap: () => unawaited(_pick(from: from)),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today_outlined),
          errorText: _showErrors && v == null ? l10n.claimErrDates : null,
        ),
        child: Text(
          v == null ? '—' : DateFmt.range(dateKey(v), dateKey(v), lang),
        ),
      ),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.busReleaseTitle,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.xs),
              Text(l10n.busReleaseHint),
              const SizedBox(height: Space.lg),
              picker(l10n.busReleaseFrom, _from, from: true),
              const SizedBox(height: Space.md),
              picker(l10n.busReleaseTo, _to, from: false),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.busReleaseReason,
                controller: _reason,
                required: true,
                maxLength: 200,
                errorText: _showErrors && !reasonOk
                    ? l10n.claimErrPurpose
                    : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: l10n.busRelease,
                onPressed: () {
                  setState(() => _showErrors = true);
                  if (_from == null || _to == null || !reasonOk) return;
                  Navigator.of(context).pop((
                    from: dateKey(_from!),
                    to: dateKey(_to!),
                    reason: _reason.text.trim(),
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

Future<Map<String, String>?> _ask(
  BuildContext context, {
  required String title,
  required List<(String, String)> fields,
}) async {
  final cs = {for (final f in fields) f.$1: TextEditingController()};
  final body = await showModalBottomSheet<Map<String, String>>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          for (final f in fields) ...[
            AppTextField(label: f.$2, controller: cs[f.$1]),
            const SizedBox(height: Space.sm),
          ],
          PrimaryButton(
            label: title,
            onPressed: () => Navigator.pop(ctx, {
              for (final e in cs.entries) e.key: e.value.text.trim(),
            }),
          ),
        ],
      ),
    ),
  );
  for (final c in cs.values) {
    c.dispose();
  }
  return body;
}

Future<void> _registerBus(BuildContext context, WidgetRef ref) async {
  final l10n = context.l10n;
  final body = await _ask(
    context,
    title: l10n.busRegister,
    fields: [
      ('code', l10n.busFieldCode),
      ('name', l10n.busFieldName),
      ('busNo', l10n.busFieldPlate),
    ],
  );
  if (body == null || !context.mounted) return;
  try {
    await ref.read(busRepositoryProvider).registerBus(body);
    ref.invalidate(busRoutesProvider);
    if (context.mounted) {
      AppToast.show(context, l10n.busSaved, tone: StatusTone.success);
    }
  } on ApiException catch (e) {
    if (context.mounted) {
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }
}

Future<void> _reassignBus(
  BuildContext context,
  WidgetRef ref,
  List<BusRoute> routes,
) async {
  final l10n = context.l10n;
  final body = await _ask(
    context,
    title: l10n.busReassign,
    fields: [('busNo', l10n.busFieldPlate)],
  );
  if (body == null || !context.mounted) return;
  try {
    await ref
        .read(busRepositoryProvider)
        .reassignBus(routes.first.id, body['busNo'] ?? '');
    ref.invalidate(busRoutesProvider);
    if (context.mounted) {
      AppToast.show(context, l10n.busSaved, tone: StatusTone.success);
    }
  } on ApiException catch (e) {
    if (context.mounted) {
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }
}

Future<void> _seatMap(
  BuildContext context,
  WidgetRef ref,
  String routeId,
) async {
  final l10n = context.l10n;
  try {
    final map = await ref.read(busRepositoryProvider).seatMap(routeId);
    if (!context.mounted) return;
    final seats = map['seats'];
    final taken = <Map<String, Object?>>[];
    var empty = 0;
    if (seats is List) {
      for (final s in seats) {
        if (s is! Map) continue;
        final row = Map<String, Object?>.from(s);
        if (row['status'] == 'EMPTY') {
          empty++;
        } else {
          taken.add(row);
        }
      }
    }
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.busSeatMap, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.sm),
          Text(l10n.busSeatsFree(empty)),
          for (final s in taken.take(12))
            ListTile(
              title: Text('${s['seatNo']}'),
              subtitle: Text(
                '${(s['occupant'] as Map?)?['name'] ?? s['status']}',
              ),
            ),
        ],
      ),
    );
  } on ApiException catch (e) {
    if (context.mounted) {
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }
}
