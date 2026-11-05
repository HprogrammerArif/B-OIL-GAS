import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _destinations = [
  'Keraniganj Plant',
  'Chattogram Terminal',
  'Head Office, Baridhara',
];

class FleetNewScreen extends ConsumerStatefulWidget {
  const FleetNewScreen({super.key});

  @override
  ConsumerState<FleetNewScreen> createState() => _FleetNewScreenState();
}

class _FleetNewScreenState extends ConsumerState<FleetNewScreen> {
  final _purpose = TextEditingController();
  String _dest = _destinations.first;
  String _type = 'ONE_WAY';
  int _pax = 2;
  late DateTime _depart = DateTime.now().add(const Duration(hours: 2));
  FleetEstimate? _est;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    unawaited(_refreshEst());
  }

  @override
  void dispose() {
    _purpose.dispose();
    super.dispose();
  }

  Future<void> _refreshEst() async {
    try {
      final e = await ref
          .read(fleetRepositoryProvider)
          .estimate(destination: _dest, tripType: _type, passengers: _pax);
      if (mounted) setState(() => _est = e);
    } on ApiException {
      // Estimate is a hint only.
    }
  }

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      initialDate: _depart,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_depart),
    );
    if (t == null || !mounted) return;
    setState(
      () => _depart = DateTime(d.year, d.month, d.day, t.hour, t.minute),
    );
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_purpose.text.trim().length < 5) {
      AppToast.show(context, l10n.flErrPurpose, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final r = await ref.read(fleetRepositoryProvider).create({
        'purpose': _purpose.text.trim(),
        'destination': _dest,
        'origin': 'Head Office, Baridhara',
        'departAt': Dhaka.toWire(_depart),
        'passengerCount': _pax,
        'tripType': _type,
        'priority': 'NORMAL',
        'submit': true,
      });
      ref.invalidate(fleetRequisitionsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.flDoneCreate, tone: StatusTone.success);
      context.go(AppRoutes.fleetDetail(r.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors['departAt'] != null ? l10n.flErrLead : l10n.flErrFailed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final est = _est;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.flNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.flFormIntro),
          const SizedBox(height: Space.lg),
          AppTextField(
            label: l10n.flFieldPurpose,
            controller: _purpose,
            maxLines: 3,
          ),
          const SizedBox(height: Space.md),
          Text(l10n.flFieldDest, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: Space.xs),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final d in _destinations)
                ChoiceChip(
                  label: Text(d),
                  selected: _dest == d,
                  onSelected: (_) {
                    setState(() => _dest = d);
                    unawaited(_refreshEst());
                  },
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.flFieldType, style: Theme.of(context).textTheme.labelLarge),
          Wrap(
            spacing: Space.sm,
            children: [
              ChoiceChip(
                label: Text(l10n.flTypeOne),
                selected: _type == 'ONE_WAY',
                onSelected: (_) {
                  setState(() => _type = 'ONE_WAY');
                  unawaited(_refreshEst());
                },
              ),
              ChoiceChip(
                label: Text(l10n.flTypeRound),
                selected: _type == 'ROUND_TRIP',
                onSelected: (_) {
                  setState(() => _type = 'ROUND_TRIP');
                  unawaited(_refreshEst());
                },
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.flFieldPax, style: Theme.of(context).textTheme.labelLarge),
          Slider(
            value: _pax.toDouble(),
            min: 1,
            max: 7,
            divisions: 6,
            label: '$_pax',
            onChanged: (v) {
              setState(() => _pax = v.round());
              unawaited(_refreshEst());
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.flFieldWhen),
            subtitle: Text(DateFmt.dateTime(_depart, lang)),
            trailing: const Icon(Icons.schedule),
            onTap: _pickWhen,
          ),
          if (est != null) ...[
            const SizedBox(height: Space.md),
            Text(
              l10n.flEstimate(
                est.km.toStringAsFixed(0),
                est.minutes,
                fleetTaka(est.cost, bangla: bangla),
                est.capacityClass,
              ),
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ],
          const SizedBox(height: Space.xl),
          PrimaryButton(
            label: l10n.flCreate,
            onPressed: _saving ? null : _submit,
          ),
        ],
      ),
    );
  }
}
