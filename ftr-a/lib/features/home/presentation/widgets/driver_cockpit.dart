import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

class DriverCockpit extends ConsumerStatefulWidget {
  const DriverCockpit({required this.dashboard, super.key});

  final Dashboard dashboard;

  @override
  ConsumerState<DriverCockpit> createState() => _DriverCockpitState();
}

class _DriverCockpitState extends ConsumerState<DriverCockpit> {
  int _tabIndex = 0;
  bool _tripStarted = false;
  bool _tripCompleted = false;
  int _startOdometer = 48210;
  int _endOdometer = 48234;

  FleetRepository get _fleet => ref.read(fleetRepositoryProvider);

  Future<VehicleRequisition?> _assignedTrip() async {
    final rows = await _fleet.list(view: 'driving');
    for (final row in rows) {
      if (row.trip != null) return row;
    }
    return rows.isEmpty ? null : rows.first;
  }

  void _fail(String message) {
    if (!mounted) return;
    AppToast.show(context, message, tone: StatusTone.danger);
  }

  Future<void> _sendSos(String note) async {
    try {
      final trip = await _assignedTrip();
      await _fleet.sendSos({
        'note': note,
        if (trip?.trip != null) 'tripId': trip!.trip!.id,
        if (trip != null) 'requisitionId': trip.id,
      });
      if (!mounted) return;
      AppToast.show(
        context,
        'SOS sent to the transport desk.',
        tone: StatusTone.danger,
      );
    } on ApiException catch (e) {
      _fail(e.message);
    }
  }

  Future<void> _notifyAtGate() async {
    try {
      final trip = await _assignedTrip();
      if (trip == null) {
        _fail('No trip is assigned to you.');
        return;
      }
      await _fleet.sendTripChat(trip.id, 'Car is waiting at the gate.');
      if (!mounted) return;
      AppToast.show(context, 'Passenger notified that the car is at the gate.');
    } on ApiException catch (e) {
      _fail(e.message);
    }
  }

  Future<void> _callPassenger() async {
    try {
      final trip = await _assignedTrip();
      final phone = trip?.requester?.phone;
      if (phone == null || phone.isEmpty) {
        _fail('This passenger has no phone number.');
        return;
      }
      final opened = await launchUrl(Uri.parse('tel:$phone'));
      if (!mounted || opened) return;
      _fail('This phone could not start the call.');
    } on ApiException catch (e) {
      _fail(e.message);
    }
  }

  Future<void> _logToll() async {
    final plaza = TextEditingController();
    final amount = TextEditingController(text: '100');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log a toll'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: plaza,
              decoration: const InputDecoration(labelText: 'Plaza'),
            ),
            TextField(
              controller: amount,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (৳)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    final plazaText = plaza.text.trim();
    final amountValue = double.tryParse(amount.text.trim());
    plaza.dispose();
    amount.dispose();
    if (ok != true || !mounted) return;
    try {
      final trip = await _assignedTrip();
      final tripId = trip?.trip?.id;
      if (tripId == null) {
        _fail('No trip is assigned to you.');
        return;
      }
      await _fleet.tripAct(tripId, 'tolls', {
        'plaza': plazaText,
        'amount': amountValue,
      });
      if (!mounted) return;
      AppToast.show(context, 'Toll saved on this trip.');
    } on ApiException catch (e) {
      _fail(e.message);
    }
  }

  void _openSosSheet(BuildContext context) {
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) => _DriverSosSheet(onSend: _sendSos),
      ),
    );
  }

  void _openStartOdometerModal(BuildContext context) {
    final controller = TextEditingController(text: '$_startOdometer');
    unawaited(
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Start Trip: Opening Odometer'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Verify current dashboard kilometer reading:',
                style: TextStyle(fontSize: 12),
              ),
              const SizedBox(height: Space.sm),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Opening Odometer (km)',
                  border: OutlineInputBorder(),
                  suffixText: 'km',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Haptics.tap();
                setState(() {
                  _startOdometer =
                      int.tryParse(controller.text) ?? _startOdometer;
                  _tripStarted = true;
                });
                Navigator.of(ctx).pop();
                AppToast.show(
                  context,
                  'Trip started. Navigation & GPS corridor tracking active.',
                  tone: StatusTone.success,
                );
              },
              child: const Text('Confirm & Start'),
            ),
          ],
        ),
      ),
    );
  }

  void _openCompleteOdometerModal(BuildContext context) {
    final controller = TextEditingController(text: '$_endOdometer');
    unawaited(
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Complete Trip: Closing Odometer'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Opening Odometer was: $_startOdometer km',
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
              const SizedBox(height: Space.sm),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Closing Odometer (km)',
                  border: OutlineInputBorder(),
                  suffixText: 'km',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Haptics.tap();
                final end = int.tryParse(controller.text) ?? _endOdometer;
                final diff = end - _startOdometer;
                setState(() {
                  _endOdometer = end;
                  _tripCompleted = true;
                });
                Navigator.of(ctx).pop();
                AppToast.show(
                  context,
                  'Trip completed ($diff km logged). Passenger rating prompt triggered.',
                  tone: StatusTone.success,
                );
              },
              child: const Text('Complete Trip'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final tabs = [
      if (bangla) 'সক্রিয় মিশন' else 'Active Mission',
      if (bangla) 'টোল স্লিপ' else 'Toll Slips',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header CTA: Emergency SOS Button
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.xs,
          ),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: Space.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Corner.lg),
              ),
            ),
            icon: const Icon(Icons.emergency, size: 22),
            label: Text(
              bangla
                  ? 'জরুরি এসওএস / ব্রেকডাউন সতর্কতা'
                  : 'EMERGENCY SOS / ROAD BREAKDOWN',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            onPressed: () {
              Haptics.heavy();
              _openSosSheet(context);
            },
          ),
        ),

        // Pre-Trip Vehicle Readiness Card
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.sm,
          ),
          child: Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(
                color: scheme.outlineVariant.withValues(alpha: 0.6),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.directions_car, color: Colors.blue),
                    const SizedBox(width: Space.xs),
                    const Expanded(
                      child: Text(
                        'Toyota Corolla Cross',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'READY FOR DUTY',
                        style: TextStyle(
                          color: Colors.green,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Dhaka Metro-Ga-18-4421 · Assigned Driver: Md. Rafiqul Islam',
                  style: TextStyle(fontSize: 11.5, color: Colors.black54),
                ),
                const SizedBox(height: Space.sm),
                const Wrap(
                  spacing: Space.md,
                  runSpacing: 4,
                  children: [
                    Text(
                      'Fuel: 78% Full',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Next Service: 1,420 km',
                      style: TextStyle(fontSize: 11, color: Colors.black54),
                    ),
                    Text(
                      'Breathalyzer: PASSED (0.00%)',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.teal,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Sub-Tab Switcher
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.xs,
            Space.lg,
            Space.xs,
          ),
          child: Row(
            children: [
              for (var i = 0; i < tabs.length; i++) ...[
                ChoiceChip(
                  label: Text(tabs[i]),
                  selected: _tabIndex == i,
                  onSelected: (_) {
                    Haptics.tap();
                    setState(() => _tabIndex = i);
                  },
                ),
                const SizedBox(width: Space.xs),
              ],
            ],
          ),
        ),

        // Sub-Tab Content
        if (_tabIndex == 0)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.sm,
            ),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(
                  color: scheme.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'REQ-2026-089',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _tripCompleted
                              ? Colors.teal.shade50
                              : (_tripStarted
                                    ? Colors.blue.shade50
                                    : Colors.amber.shade50),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _tripCompleted
                              ? 'COMPLETED'
                              : (_tripStarted ? 'IN PROGRESS' : 'ASSIGNED'),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _tripCompleted
                                ? Colors.teal
                                : (_tripStarted
                                      ? Colors.blue
                                      : Colors.amber.shade900),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Passenger: Tanvir Ahmed (Senior Sales Officer)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const Text(
                    'Route: Head Office Baridhara -> Keraniganj Bitumen Jetty',
                    style: TextStyle(fontSize: 11.5, color: Colors.black54),
                  ),
                  const SizedBox(height: Space.md),
                  if (!_tripStarted) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(
                              Icons.chat_bubble_outline,
                              size: 16,
                            ),
                            label: Text(
                              bangla ? 'যাত্রীকে বার্তা দিন' : 'Notify at Gate',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () {
                              Haptics.tap();
                              unawaited(_notifyAtGate());
                            },
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.play_arrow, size: 16),
                            label: Text(
                              bangla
                                  ? 'যাত্রা শুরু করুন'
                                  : 'Start Trip (Odometer)',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () => _openStartOdometerModal(context),
                          ),
                        ),
                      ],
                    ),
                  ] else if (!_tripCompleted) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.call, size: 16),
                            label: Text(
                              bangla ? 'কল করুন' : 'Call Passenger',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () {
                              Haptics.tap();
                              unawaited(_callPassenger());
                            },
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.teal,
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.done_all, size: 16),
                            label: Text(
                              bangla
                                  ? 'যাত্রা সমাপ্ত'
                                  : 'Complete Trip (Odometer)',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () =>
                                _openCompleteOdometerModal(context),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(Space.sm),
                      decoration: BoxDecoration(
                        color: Colors.teal.shade50,
                        borderRadius: BorderRadius.circular(Corner.md),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            color: Colors.teal,
                            size: 20,
                          ),
                          SizedBox(width: Space.xs),
                          Text(
                            'Mission completed: 24 km logged. Ready for next trip.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.teal,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.sm,
            ),
            child: Column(
              children: [
                _tollRow(
                  'Buriganga Postogola Bridge Plaza',
                  'BDT 100.00',
                  '09:42 AM · Slip #BG-4821',
                ),
                _tollRow(
                  'Mayor Hanif Flyover',
                  'BDT 85.00',
                  '10:15 AM · Slip #HF-9102',
                ),
                const SizedBox(height: Space.sm),
                OutlinedButton.icon(
                  onPressed: () {
                    Haptics.tap();
                    unawaited(_logToll());
                  },
                  icon: const Icon(Icons.add_a_photo, size: 18),
                  label: Text(
                    bangla
                        ? '+ নতুন টোল স্লিপ যোগ করুন'
                        : '+ Log Bridge / Flyover Toll Slip',
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _tollRow(String name, String amount, String meta) {
    return Container(
      margin: const EdgeInsets.only(bottom: Space.xs),
      padding: const EdgeInsets.all(Space.sm),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(Corner.md),
        border: Border.all(color: Colors.black12),
      ),
      child: Row(
        children: [
          const Icon(Icons.receipt, color: Colors.blueGrey, size: 18),
          const SizedBox(width: Space.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                Text(
                  meta,
                  style: const TextStyle(fontSize: 10, color: Colors.black54),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.purple,
            ),
          ),
        ],
      ),
    );
  }
}

class _DriverSosSheet extends StatelessWidget {
  const _DriverSosSheet({required this.onSend});

  final Future<void> Function(String note) onSend;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.65,
      maxChildSize: 0.85,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  borderRadius: BorderRadius.circular(Corner.md),
                ),
                child: Icon(
                  Icons.emergency,
                  color: Colors.red.shade900,
                  size: 24,
                ),
              ),
              const SizedBox(width: Space.md),
              const Expanded(
                child: Text(
                  'DRIVER EMERGENCY SOS BROADCAST',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: Colors.red,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          const Text(
            'Select urgent assistance type to alert Transport Supervisor & Plant Security instantly:',
            style: TextStyle(fontSize: 12),
          ),
          const SizedBox(height: Space.md),

          _sosOption(
            context,
            icon: Icons.car_crash,
            title: bangla
                ? 'যানবাহন বিকল / দুর্ঘটনা'
                : 'Vehicle Breakdown / Accident on Corridor',
            subtitle: 'Postogola Bridge / Buriganga corridor towing support',
          ),
          _sosOption(
            context,
            icon: Icons.medical_services,
            title: bangla
                ? 'জরুরি চিকিৎসা সহায়তা'
                : 'Medical / Passenger Emergency',
            subtitle: 'Dispatch plant ambulance & nearest clinic assistance',
          ),
          _sosOption(
            context,
            icon: Icons.security,
            title: bangla
                ? 'প্ল্যান্ট গেট নিরাপত্তা সহায়তা'
                : 'Security / Gate Passage Clearance',
            subtitle: 'Alert Gate #1 security team immediately',
          ),
        ],
      ),
    );
  }

  Widget _sosOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.sm),
      child: ListTile(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Corner.lg),
          side: BorderSide(color: Colors.red.shade200),
        ),
        tileColor: Colors.red.shade50,
        leading: Icon(icon, color: Colors.red.shade900),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: Colors.red.shade900,
          ),
        ),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11)),
        onTap: () {
          Haptics.heavy();
          Navigator.of(context).pop();
          unawaited(onSend(title));
        },
      ),
    );
  }
}
