import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_pass.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_trip_chat.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

class FleetDetailScreen extends ConsumerStatefulWidget {
  const FleetDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<FleetDetailScreen> createState() => _FleetDetailScreenState();
}

class _FleetDetailScreenState extends ConsumerState<FleetDetailScreen> {
  bool _busy = false;

  FleetRepository get _repo => ref.read(fleetRepositoryProvider);

  void _refresh() => ref
    ..invalidate(fleetDetailProvider)
    ..invalidate(fleetRequisitionsProvider)
    ..invalidate(fleetSosProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'OUTSIDE_WINDOW' => l10n.flErrWindow,
      'VEHICLE_NOT_FREE' => l10n.flErrVehicle,
      'DRIVER_NOT_FREE' => l10n.flErrDriver,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : l10n.flErrFailed,
    };
  }

  Future<void> _run(Future<void> Function() call, String done) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<Map<String, Object?>?> _sheet({
    required String title,
    required String field,
    required String label,
    String? numberLabel,
    String? numberKey,
    String? hint,
  }) async {
    final text = TextEditingController();
    final num = TextEditingController();
    final body = await showModalBottomSheet<Map<String, Object?>>(
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
            if (hint != null) ...[const SizedBox(height: Space.xs), Text(hint)],
            const SizedBox(height: Space.md),
            AppTextField(label: label, controller: text, maxLines: 3),
            if (numberKey != null) ...[
              const SizedBox(height: Space.md),
              AppTextField(
                label: numberLabel ?? '',
                controller: num,
                keyboardType: TextInputType.number,
              ),
            ],
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: title,
              onPressed: () {
                final out = <String, Object?>{field: text.text.trim()};
                if (numberKey != null) {
                  out[numberKey] =
                      int.tryParse(num.text.trim()) ??
                      double.tryParse(num.text.trim());
                }
                Navigator.pop(ctx, out);
              },
            ),
          ],
        ),
      ),
    );
    text.dispose();
    num.dispose();
    return body;
  }

  Future<void> _assign(VehicleRequisition r) async {
    final l10n = context.l10n;
    late final FleetAssignable pack;
    try {
      pack = await _repo.assignable(r.id);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
      return;
    }
    if (!mounted) return;
    if (pack.vehicles.isEmpty || pack.drivers.isEmpty) {
      AppToast.show(context, l10n.flErrNoneFree, tone: StatusTone.warning);
      return;
    }
    var vid = pack.vehicles.first.id;
    var did = pack.drivers.first.id;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.flSheetAssign,
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.flSheetAssignHelp),
              const SizedBox(height: Space.md),
              Wrap(
                spacing: Space.sm,
                children: [
                  for (final v in pack.vehicles)
                    ChoiceChip(
                      label: Text(v.display),
                      selected: vid == v.id,
                      onSelected: (_) => set(() => vid = v.id),
                    ),
                ],
              ),
              const SizedBox(height: Space.md),
              Wrap(
                spacing: Space.sm,
                children: [
                  for (final d in pack.drivers)
                    ChoiceChip(
                      label: Text(d.person?.name ?? d.id),
                      selected: did == d.id,
                      onSelected: (_) => set(() => did = d.id),
                    ),
                ],
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: l10n.flActAssign,
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );
    if (ok != true) return;
    await _run(
      () => _repo.act(r.id, 'assign', {'vehicleId': vid, 'driverId': did}),
      l10n.flDoneAssign,
    );
  }

  Future<void> _km(
    VehicleRequisition r,
    String verb,
    String title,
    String done,
  ) async {
    final body = await _sheet(
      title: title,
      field: 'note',
      label: context.l10n.flFieldNoteOpt,
      numberKey: verb == 'complete' ? 'endKm' : 'odometerKm',
      numberLabel: context.l10n.flFieldOdo,
    );
    if (body == null || r.trip == null) return;
    await _run(() => _repo.tripAct(r.trip!.id, verb, body), done);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final session = ref.watch(sessionControllerProvider).value;
    final async = ref.watch(fleetDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleFleet)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(fleetDetailProvider(widget.id)),
        ),
        data: (r) {
          final m = r.me;
          final who = r.requester?.display(bangla: bangla) ?? '';
          return ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      r.destination,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  StatusPill(
                    label: fleetStatusLabel(l10n, r.status),
                    tone: fleetStatusTone(r.status),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text('${r.reqNo} · ${fleetTripType(l10n, r.tripType)}'),
              const SizedBox(height: Space.md),
              Text(l10n.flWhat),
              Text(r.purpose, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: Space.sm),
              Text(l10n.flWho(who, DateFmt.dateTime(r.createdAt, lang))),
              const SizedBox(height: Space.sm),
              Text(fleetNextLine(l10n, r, bangla: bangla)),
              const SizedBox(height: Space.md),
              Text(
                l10n.flMeta(
                  DateFmt.dateTime(r.departAt, lang),
                  '${r.passengerCount}',
                  r.capacityClass,
                  fleetTaka(r.estimatedCost ?? 0, bangla: bangla),
                ),
              ),
              if (r.vehicle != null) ...[
                const SizedBox(height: Space.sm),
                Text(
                  l10n.flAssigned(
                    r.vehicle!.plateNo,
                    r.driver?.person?.display(bangla: bangla) ?? '',
                  ),
                ),
              ],
              if (r.trip != null) ...[
                const SizedBox(height: Space.sm),
                Text(l10n.flPassNo(r.trip!.passNo)),
                Text(
                  '${l10n.flOdoStart}: ${r.trip!.startKm ?? '—'}  ·  ${l10n.flOdoEnd}: ${r.trip!.endKm ?? '—'}',
                ),
              ],
              const SizedBox(height: Space.lg),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  PrimaryButton.secondary(
                    expand: false,
                    label: l10n.flChat,
                    onPressed: () => unawaited(showTripChat(context, r.id)),
                  ),
                  if (r.driver?.person?.phone != null)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.flCallDriver,
                      onPressed: () => unawaited(
                        launchUrl(Uri.parse('tel:${r.driver!.person!.phone}')),
                      ),
                    ),
                  if (m.canAssign)
                    PrimaryButton(
                      expand: false,
                      label: l10n.flActAssign,
                      onPressed: _busy ? null : () => unawaited(_assign(r)),
                    ),
                  if (m.canGateOut)
                    PrimaryButton(
                      expand: false,
                      label: l10n.flActGateOut,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _km(
                                r,
                                'gate-out',
                                l10n.flActGateOut,
                                l10n.flDoneGateOut,
                              ),
                            ),
                    ),
                  if (m.canCheckpoint)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.flActCheckpoint,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _sheet(
                                title: l10n.flActCheckpoint,
                                field: 'note',
                                label: l10n.flFieldNote,
                              );
                              if (b == null || r.trip == null) return;
                              await _run(
                                () =>
                                    _repo.tripAct(r.trip!.id, 'checkpoint', b),
                                l10n.flDoneCheckpoint,
                              );
                            },
                    ),
                  if (m.canComplete)
                    PrimaryButton(
                      expand: false,
                      label: l10n.flActComplete,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _km(
                                r,
                                'complete',
                                l10n.flActComplete,
                                l10n.flDoneComplete,
                              ),
                            ),
                    ),
                  if (m.canSos)
                    PrimaryButton.danger(
                      expand: false,
                      label: l10n.flActSos,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _sheet(
                                title: l10n.flActSos,
                                field: 'note',
                                label: l10n.flFieldSos,
                                hint: l10n.flSosHelp,
                              );
                              if (b == null || r.trip == null) return;
                              await _run(
                                () => _repo.tripAct(r.trip!.id, 'sos', b),
                                l10n.flDoneSos,
                              );
                            },
                    ),
                  if (m.canToll)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.flActToll,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _sheet(
                                title: l10n.flActToll,
                                field: 'plaza',
                                label: l10n.flFieldPlaza,
                                numberKey: 'amount',
                                numberLabel: l10n.flFieldAmount,
                              );
                              if (b == null || r.trip == null) return;
                              await _run(
                                () => _repo.tripAct(r.trip!.id, 'tolls', b),
                                l10n.flDoneToll,
                              );
                            },
                    ),
                  if (m.canRate)
                    PrimaryButton(
                      expand: false,
                      label: l10n.flActRate,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _sheet(
                                title: l10n.flActRate,
                                field: 'feedback',
                                label: l10n.flFieldFeedback,
                                numberKey: 'rating',
                                numberLabel: l10n.flFieldRating,
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(r.id, 'rate', b),
                                l10n.flDoneRate,
                              );
                            },
                    ),
                  if (m.canCancel)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.flActCancel,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _sheet(
                                title: l10n.flActCancel,
                                field: 'reason',
                                label: l10n.flFieldReason,
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(r.id, 'cancel', b),
                                l10n.flDoneCancel,
                              );
                            },
                    ),
                  if (r.trip != null)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.flActPass,
                      onPressed: () => unawaited(printTripPass(r)),
                    ),
                ],
              ),
              if (r.tolls.isNotEmpty) ...[
                const SizedBox(height: Space.xl),
                Text(
                  l10n.flTolls,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                for (final t in r.tolls)
                  ListRow(
                    title: t.plaza,
                    subtitle:
                        '${fleetTaka(t.amount, bangla: bangla)} · ${t.status}',
                    trailing:
                        (session?.can('fleet:tolls-approve') == true &&
                            t.status == 'PENDING')
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.decideToll(t.id, 'approve'),
                                      l10n.flDoneTollOk,
                                    ),
                                  ),
                            child: Text(l10n.flActTollOk),
                          )
                        : (session?.can('fleet:tolls-pay') == true &&
                              t.status == 'APPROVED')
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.decideToll(t.id, 'pay'),
                                      l10n.flDoneTollPay,
                                    ),
                                  ),
                            child: Text(l10n.flActTollPay),
                          )
                        : null,
                  ),
              ],
              if (r.trip != null && r.trip!.events.isNotEmpty) ...[
                const SizedBox(height: Space.xl),
                Text(
                  l10n.flTimeline,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                for (final e in r.trip!.events)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.flag_outlined),
                    title: Text(e.type),
                    subtitle: Text(
                      [
                        if (e.note != null) e.note!,
                        DateFmt.dateTime(e.createdAt, lang),
                        if (e.actor != null) e.actor!.display(bangla: bangla),
                      ].join(' · '),
                    ),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}
