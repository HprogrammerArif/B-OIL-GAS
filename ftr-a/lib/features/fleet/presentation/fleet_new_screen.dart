import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class FleetNewScreen extends ConsumerStatefulWidget {
  const FleetNewScreen({super.key});

  @override
  ConsumerState<FleetNewScreen> createState() => _FleetNewScreenState();
}

class _FleetNewScreenState extends ConsumerState<FleetNewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _from = TextEditingController(
    text: 'Bashundhara Corporate HQ, Baridhara',
  );
  final _to = TextEditingController();
  final _purpose = TextEditingController();
  final _costCenter = TextEditingController();
  final _passengers = TextEditingController(text: '1');
  final _passengerNames = TextEditingController();

  String _capacity = 'sedan_4';
  String _tripType = 'round_trip';
  bool _loading = false;

  @override
  void dispose() {
    _from.dispose();
    _to.dispose();
    _purpose.dispose();
    _costCenter.dispose();
    _passengers.dispose();
    _passengerNames.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final now = DateTime.now();
      final date =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      await ref.read(fleetRepositoryProvider).createRequisition({
        'from': _from.text.trim(),
        'to': _to.text.trim(),
        'purpose': _purpose.text.trim(),
        'costCenter': _costCenter.text.trim(),
        'tripType': _tripType,
        'requiredCapacity': _capacity,
        'passengersCount': int.tryParse(_passengers.text) ?? 1,
        'passengerNames': _passengerNames.text.trim(),
        'departureTime': '${date}T12:00:00+06:00',
        'intermediateStops': <Object?>[],
      });
      if (mounted) {
        ref.invalidate(fleetRequisitionsProvider());
        showAppToast(
          context,
          context.l10n.fleetRequestSent,
          tone: ToastTone.success,
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) showAppToast(context, e.toString(), tone: ToastTone.error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.fleetNewRequest)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Space.lg),
          children: [
            AppTextField(
              controller: _from,
              label: l10n.fleetFrom,
              required: true,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? l10n.fieldRequired : null,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _to,
              label: l10n.fleetTo,
              required: true,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? l10n.fieldRequired : null,
            ),
            const SizedBox(height: Space.md),
            DropdownButtonFormField<String>(
              value: _capacity,
              decoration: InputDecoration(labelText: l10n.fleetVehicleType),
              items: [
                DropdownMenuItem(value: 'sedan_4', child: Text(l10n.fleetTypeSedan)),
                DropdownMenuItem(value: 'microbus_7', child: Text(l10n.fleetTypeMicrobus)),
                DropdownMenuItem(value: 'pickup_4x4', child: Text(l10n.fleetTypePickup)),
              ],
              onChanged: (v) => setState(() => _capacity = v ?? _capacity),
            ),
            const SizedBox(height: Space.md),
            DropdownButtonFormField<String>(
              value: _tripType,
              decoration: InputDecoration(labelText: l10n.fleetTripType),
              items: [
                DropdownMenuItem(
                  value: 'round_trip',
                  child: Text(l10n.fleetTripRound),
                ),
                DropdownMenuItem(
                  value: 'one_way',
                  child: Text(l10n.fleetTripOneWay),
                ),
              ],
              onChanged: (v) => setState(() => _tripType = v ?? _tripType),
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _passengers,
              label: l10n.fleetPassengersCount,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _passengerNames,
              label: l10n.fleetPassengerNames,
              maxLines: 2,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _purpose,
              label: l10n.fleetPurpose,
              maxLines: 2,
              required: true,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? l10n.fieldRequired : null,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _costCenter,
              label: l10n.fleetCostCenter,
            ),
            const SizedBox(height: Space.xl),
            PrimaryButton(
              onPressed: _submit,
              loading: _loading,
              label: l10n.fleetSubmitRequest,
            ),
          ],
        ),
      ),
    );
  }
}
