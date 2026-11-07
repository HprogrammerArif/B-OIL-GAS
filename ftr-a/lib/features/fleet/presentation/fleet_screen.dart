import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_pass.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_trip_chat.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

enum _FleetTab { requisitions, drivers, vehicles, gateLog }

class FleetScreen extends ConsumerStatefulWidget {
  const FleetScreen({super.key});

  @override
  ConsumerState<FleetScreen> createState() => _FleetScreenState();
}

class _FleetScreenState extends ConsumerState<FleetScreen> {
  _FleetTab _tab = _FleetTab.requisitions;
  String _view = 'mine';
  String _query = '';
  Timer? _debounce;
  bool _busy = false;

  // Local demo state for drivers breathalyzer logs
  final Map<String, ({bool passed, double bac, String time})>
  _breathalyzerLogs = {
    'd_rafiq': (passed: true, bac: 0.00, time: '08:15 AM'),
    'd_karim': (passed: true, bac: 0.00, time: '08:30 AM'),
    'd_monir': (passed: true, bac: 0.00, time: '07:45 AM'),
  };

  // Local demo state for fuel vouchers issued
  final List<Map<String, Object?>> _fuelVouchers = [
    {
      'code': 'FV-2026-0812',
      'plate': 'Dhaka Metro-Ga-18-4421',
      'driver': 'Md. Rafiqul Islam',
      'station': 'Bashundhara Trust Filling Station, Tejgaon',
      'fuelType': 'Octane 95',
      'liters': 45.0,
      'rate': 125.0,
      'total': 5625.0,
      'odometer': 48210,
      'time': 'Today, 09:15 AM',
    },
    {
      'code': 'FV-2026-0809',
      'plate': 'Dhaka Metro-Cha-11-2098',
      'driver': 'Abdul Karim',
      'station': 'Keraniganj Padma Depot',
      'fuelType': 'Diesel',
      'liters': 60.0,
      'rate': 105.0,
      'total': 6300.0,
      'odometer': 72150,
      'time': 'Yesterday, 04:30 PM',
    },
  ];

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('fleet:drive') == true && s?.can('fleet:request') != true) {
      _view = 'driving';
    } else if (s?.can('fleet:dispatch') == true) {
      _view = 'dispatch';
    } else if (s?.can('fleet:endorse') == true &&
        s?.can('fleet:request') != true) {
      _view = 'to-endorse';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  FleetRepository get _repo => ref.read(fleetRepositoryProvider);

  void _refresh() {
    ref
      ..invalidate(fleetRequisitionsProvider)
      ..invalidate(fleetSosProvider);
  }

  Future<void> _makePhoneCall(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        AppToast.show(
          context,
          context.isBangla ? 'কল করা যাচ্ছে না: $phone' : 'Calling $phone...',
        );
      }
    }
  }

  Future<void> _mergeAndPool(
    VehicleRequisition r1,
    VehicleRequisition r2,
  ) async {
    final bangla = context.isBangla;
    final assignable = await _repo.assignable(r1.id);
    if (!mounted) return;

    final vehicles = assignable.vehicles;
    final drivers = assignable.drivers;

    if (vehicles.isEmpty || drivers.isEmpty) {
      AppToast.show(
        context,
        bangla
            ? 'পুলের জন্য কোনো মুক্ত গাড়ি বা চালক পাওয়া যায়নি'
            : 'No available vehicle or driver found for pooling',
        tone: StatusTone.warning,
      );
      return;
    }

    var selectedVid = vehicles.first.id;
    var selectedDid = drivers.first.id;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
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
              Row(
                children: [
                  const Icon(Icons.merge_type_rounded, color: Colors.teal),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      bangla
                          ? 'স্মার্ট কারপুলিং সংযুক্তি ও বরাদ্দ'
                          : 'Merge & Execute Smart Carpool',
                      style: Theme.of(ctx).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'উভয় আবেদন একই রুটে ও কাছাকাছি সময়ে যাত্রা করছে। একটি গাড়িতে সংযুক্তি করলে ১,৮৫০ টাকা সাশ্রয় হবে।'
                    : 'Both requisitions travel along the same corridor. Merging onto a single car saves BDT 1,850 in fuel.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const Divider(height: 20),
              Text(
                '${r1.reqNo} (${r1.requester?.name ?? ''}) + ${r2.reqNo} (${r2.requester?.name ?? ''})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Text(
                'Route: ${r1.origin} → ${r1.destination}',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: Space.md),
              DropdownButtonFormField<String>(
                initialValue: selectedVid,
                decoration: InputDecoration(
                  labelText: bangla ? 'বরাদ্দকৃত গাড়ি' : 'Select Vehicle',
                ),
                items: [
                  for (final v in vehicles)
                    DropdownMenuItem(value: v.id, child: Text(v.display)),
                ],
                onChanged: (v) {
                  if (v != null) setSheetState(() => selectedVid = v);
                },
              ),
              const SizedBox(height: Space.sm),
              DropdownButtonFormField<String>(
                initialValue: selectedDid,
                decoration: InputDecoration(
                  labelText: bangla ? 'বরাদ্দকৃত চালক' : 'Select Driver',
                ),
                items: [
                  for (final d in drivers)
                    DropdownMenuItem(
                      value: d.id,
                      child: Text(d.person?.name ?? d.id),
                    ),
                ],
                onChanged: (d) {
                  if (d != null) setSheetState(() => selectedDid = d);
                },
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: bangla
                    ? 'কারপুল কার্যকর করুন (সাশ্রয় ৳১,৮৫০)'
                    : 'Confirm Pool & Assign (Saves BDT 1,850)',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _busy = true);
      try {
        await _repo.act(r1.id, 'assign', {
          'vehicleId': selectedVid,
          'driverId': selectedDid,
        });
        await _repo.act(r2.id, 'assign', {
          'vehicleId': selectedVid,
          'driverId': selectedDid,
        });
        _refresh();
        if (!mounted) return;
        AppToast.show(
          context,
          bangla
              ? 'উভয় আবেদন সফলভাবে একই গাড়িতে কারপুল করা হয়েছে!'
              : 'Both requisitions successfully pooled onto single vehicle!',
          tone: StatusTone.success,
        );
      } on ApiException catch (e) {
        if (!mounted) return;
        AppToast.show(context, e.message, tone: StatusTone.danger);
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    }
  }

  Future<void> _openRatingModal(VehicleRequisition r) async {
    final bangla = context.isBangla;
    var rating = 5;
    final feedbackCtrl = TextEditingController();
    final tags = bangla
        ? ['সময়ানুবর্তিতা', 'নিরাপদ ড্রাইভিং', 'গাড়ি পরিষ্কার', 'ভদ্র আচরণ']
        : ['Punctual', 'Safe Driving', 'Clean Vehicle', 'Polite Conduct'];
    final selectedTags = <String>{};

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
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
              Text(
                bangla
                    ? 'ট্রিপ ও চালকের রেটিং প্রদান'
                    : 'Rate Trip & Driver Experience',
                style: Theme.of(ctx).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'আপনার কেরানীগঞ্জ ট্রিপের সার্বিক অভিজ্ঞতা মূল্যায়ন করুন।'
                    : 'Rate the driving safety, vehicle comfort and punctuality for this trip.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (var s = 1; s <= 5; s++)
                      IconButton(
                        iconSize: 36,
                        icon: Icon(
                          s <= rating
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: Colors.amber.shade700,
                        ),
                        onPressed: () {
                          Haptics.tap();
                          setModalState(() => rating = s);
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: Space.xs),
              Center(
                child: Text(
                  '$rating of 5 Stars',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(height: Space.sm),
              Wrap(
                spacing: Space.xs,
                children: [
                  for (final t in tags)
                    FilterChip(
                      label: Text(t, style: const TextStyle(fontSize: 11)),
                      selected: selectedTags.contains(t),
                      onSelected: (sel) {
                        setModalState(() {
                          if (sel) {
                            selectedTags.add(t);
                          } else {
                            selectedTags.remove(t);
                          }
                        });
                      },
                    ),
                ],
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: bangla
                    ? 'অতিরিক্ত মন্তব্য (ঐচ্ছিক)'
                    : 'Additional Feedback (Optional)',
                controller: feedbackCtrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla ? 'রেটিং জমা দিন' : 'Submit Trip Rating',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      final feedback = [
        ...selectedTags,
        if (feedbackCtrl.text.trim().isNotEmpty) feedbackCtrl.text.trim(),
      ].join(' · ');
      try {
        await _repo.act(r.id, 'rate', {'rating': rating, 'feedback': feedback});
        _refresh();
        if (!mounted) return;
        AppToast.show(
          context,
          bangla
              ? 'মূল্যায়নের জন্য ধন্যবাদ!'
              : 'Thank you for rating your trip!',
          tone: StatusTone.success,
        );
      } on ApiException catch (e) {
        if (!mounted) return;
        AppToast.show(context, e.message, tone: StatusTone.danger);
      }
    }
  }

  Future<void> _logBreathalyzerModal(String driverId, String driverName) async {
    final bangla = context.isBangla;
    var bac = 0.00;
    var passed = true;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(
            bangla
                ? 'দৈনিক ব্রেথালাইজার ও ফিটনেস টেস্ট'
                : 'Log Daily Breathalyzer Clearance',
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Driver: $driverName',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'যাত্রী ও রিফাইনারি নিরাপত্তার স্বার্থে ট্রিপ শুরুর পূর্বে শূন্য-অ্যালকোহল নিশ্চিতকরণ বাধ্যতামূলক।'
                    : 'Zero alcohol (0.00% BAC) clearance is mandatory before operating fleet vehicles.',
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: Space.md),
              Container(
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(
                  color: passed ? Colors.green.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: passed ? Colors.green.shade300 : Colors.red.shade300,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'BAC Reading: ${bac.toStringAsFixed(2)}%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: passed
                            ? Colors.green.shade900
                            : Colors.red.shade900,
                      ),
                    ),
                    Icon(
                      passed ? Icons.check_circle : Icons.cancel,
                      color: passed
                          ? Colors.green.shade800
                          : Colors.red.shade800,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Space.sm),
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('0.00% (Passed)'),
                    selected: passed,
                    onSelected: (_) => setDialogState(() {
                      bac = 0.00;
                      passed = true;
                    }),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: const Text('> 0.02% (Failed)'),
                    selected: !passed,
                    onSelected: (_) => setDialogState(() {
                      bac = 0.05;
                      passed = false;
                    }),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(context.l10n.commonCancel),
            ),
            PrimaryButton(
              expand: false,
              label: bangla ? 'টেস্ট নিশ্চিত করুন' : 'Confirm Test',
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );

    if (ok == true && mounted) {
      setState(() {
        _breathalyzerLogs[driverId] = (
          passed: passed,
          bac: bac,
          time: DateFmt.dateTime(DateTime.now(), bangla ? 'bn' : 'en'),
        );
      });
      AppToast.show(
        context,
        bangla
            ? 'ব্রেথালাইজার ফলাফল সফলভাবে নথিভুক্ত হয়েছে'
            : 'Breathalyzer test recorded: ${passed ? "PASSED (0.00% BAC)" : "FAILED"}',
        tone: passed ? StatusTone.success : StatusTone.danger,
      );
    }
  }

  Future<void> _issueFuelVoucherModal() async {
    final bangla = context.isBangla;
    final plateCtrl = TextEditingController(text: 'Dhaka Metro-Ga-18-4421');
    final driverCtrl = TextEditingController(text: 'Md. Rafiqul Islam');
    final stationCtrl = TextEditingController(
      text: 'Bashundhara Trust Filling Station, Tejgaon',
    );
    final litersCtrl = TextEditingController(text: '50.0');
    final rateCtrl = TextEditingController(text: '125.0');
    final odoCtrl = TextEditingController(text: '48400');
    var fuelType = 'Octane 95';

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final l = double.tryParse(litersCtrl.text.trim()) ?? 0;
          final r = double.tryParse(rateCtrl.text.trim()) ?? 0;
          final total = l * r;

          return Padding(
            padding: EdgeInsets.fromLTRB(
              Space.lg,
              0,
              Space.lg,
              MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.local_gas_station_outlined,
                        color: Colors.indigo,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          bangla
                              ? 'জ্বালানি ভাউচার ইস্যুকরণ'
                              : 'Issue Official Fleet Fuel Voucher',
                          style: Theme.of(ctx).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    bangla
                        ? 'অনুমোদিত ফিলিং স্টেশন থেকে যানবাহনের জন্য জ্বালানি অধিযাচন পত্র।'
                        : 'Official procurement fuel voucher valid at company authorized fuel stations.',
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                  const Divider(height: 20),
                  AppTextField(
                    label: bangla ? 'যানবাহন নম্বর' : 'Vehicle Plate No',
                    controller: plateCtrl,
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: bangla ? 'চালকের নাম' : 'Driver Name',
                    controller: driverCtrl,
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: bangla
                        ? 'অনুমোদিত ফিলিং স্টেশন'
                        : 'Authorized Filling Station',
                    controller: stationCtrl,
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    children: [
                      ChoiceChip(
                        label: const Text('Octane 95'),
                        selected: fuelType == 'Octane 95',
                        onSelected: (_) => setModalState(() {
                          fuelType = 'Octane 95';
                          rateCtrl.text = '125.0';
                        }),
                      ),
                      const SizedBox(width: Space.xs),
                      ChoiceChip(
                        label: const Text('Diesel'),
                        selected: fuelType == 'Diesel',
                        onSelected: (_) => setModalState(() {
                          fuelType = 'Diesel';
                          rateCtrl.text = '105.0';
                        }),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          label: bangla
                              ? 'পরিমাণ (লিটার)'
                              : 'Quantity (Liters)',
                          controller: litersCtrl,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setModalState(() {}),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: AppTextField(
                          label: bangla ? 'দর (টাকা/লিটার)' : 'Rate (BDT/L)',
                          controller: rateCtrl,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setModalState(() {}),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: bangla
                        ? 'বর্তমান ওডোমিটার (কিমি)'
                        : 'Current Odometer (km)',
                    controller: odoCtrl,
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: Space.md),
                  Container(
                    padding: const EdgeInsets.all(Space.md),
                    decoration: BoxDecoration(
                      color: Colors.indigo.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.indigo.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          bangla ? 'মোট প্রদেয় মূল্য:' : 'Total Fuel Cost:',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.indigo.shade900,
                          ),
                        ),
                        Text(
                          Money.fromPaisa((total * 100).round())
                              .format(bengali: bangla),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Colors.indigo.shade900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: Space.lg),
                  PrimaryButton(
                    label: bangla
                        ? 'ভাউচার ইস্যু ও অনুমোদন'
                        : 'Issue & Sign Fuel Voucher',
                    onPressed: () => Navigator.pop(ctx, true),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );

    if (confirmed == true && mounted) {
      final code = 'FV-2026-08${13 + _fuelVouchers.length}';
      final l = double.tryParse(litersCtrl.text.trim()) ?? 50.0;
      final r = double.tryParse(rateCtrl.text.trim()) ?? 125.0;
      final odo = int.tryParse(odoCtrl.text.trim()) ?? 48400;

      setState(() {
        _fuelVouchers.insert(0, {
          'code': code,
          'plate': plateCtrl.text.trim(),
          'driver': driverCtrl.text.trim(),
          'station': stationCtrl.text.trim(),
          'fuelType': fuelType,
          'liters': l,
          'rate': r,
          'total': l * r,
          'odometer': odo,
          'time': 'Just now',
        });
      });

      AppToast.show(
        context,
        bangla
            ? 'জ্বালানি ভাউচার $code সফলভাবে ইস্যু করা হয়েছে'
            : 'Fuel voucher $code issued successfully!',
        tone: StatusTone.success,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('fleet:request') ?? false;
    final canDrive = session?.can('fleet:drive') ?? false;
    final canDispatch = session?.can('fleet:dispatch') ?? false;
    final canEndorse = session?.can('fleet:endorse') ?? false;
    final canSos =
        canDrive ||
        canDispatch ||
        (session?.can('fleet:gate') ?? false) ||
        (session?.can('fleet:read', GrantScope.site) ?? false);
    final rows = ref.watch(
      fleetRequisitionsProvider(view: _view, query: _query),
    );
    final scheme = Theme.of(context).colorScheme;

    // Verdict message computation
    final String verdictMessage;
    if (canDispatch) {
      verdictMessage = bangla
          ? '৩টি অনুমোদিত গাড়ির আবেদন বরাদ্দ অপেক্ষমাণ · কেরানীগঞ্জ করিডোরে ১টি স্মার্ট পুলিংয়ে ১,৮৫০ টাকা সাশ্রয় সম্ভব'
          : '3 approved car requisitions need vehicle & driver dispatch · 1 smart pooling opportunity saves BDT 1,850 on the Keraniganj corridor';
    } else if (canDrive) {
      verdictMessage = bangla
          ? '১টি সক্রিয় ট্রিপ নির্ধারিত · বারিধারা → কেরানীগঞ্জ রিফাইনারি রিটার্ন রুট · প্রারম্ভিক ওডো: ৪৮,২১০ কিমি'
          : '1 active trip dispatched · Baridhara HQ → Keraniganj Refinery return route · Opening Odo: 48,210 km';
    } else {
      verdictMessage = bangla
          ? 'আপনার REQ-2026-089 ট্রিপে টয়োটা করোলা ক্রস (ঢাকা মেট্রো-গ-১৮-৪৪২১) বরাদ্দকৃত · চালক: মোঃ রফিকুল ইসলাম'
          : 'Your trip REQ-2026-089 is assigned to Toyota Corolla Cross (Dhaka Metro-Ga-18-4421) · Driver: Md. Rafiqul Islam';
    }

    Widget subTabChip(_FleetTab tab, String label, IconData icon) => Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        avatar: Icon(icon, size: 16),
        label: Text(label),
        selected: _tab == tab,
        onSelected: (_) => setState(() => _tab = tab),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleFleet),
        actions: [
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
          ),
          if (canDispatch)
            IconButton(
              tooltip: l10n.flRegisterCar,
              onPressed: () => unawaited(_fleetForm(context, ref, car: true)),
              icon: const Icon(Icons.directions_car_outlined),
            ),
          if (canDispatch)
            IconButton(
              tooltip: l10n.flEnrolDriver,
              onPressed: () => unawaited(_fleetForm(context, ref, car: false)),
              icon: const Icon(Icons.person_add_alt_1_outlined),
            ),
          if (canSos)
            IconButton(
              tooltip: l10n.flSos,
              onPressed: () => unawaited(context.push(AppRoutes.fleetSos)),
              icon: const Icon(Icons.sos_outlined, color: Colors.red),
            ),
        ],
      ),
      floatingActionButton: canCreate && _tab == _FleetTab.requisitions
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.fleetNew)),
              icon: const Icon(Icons.add_road_outlined),
              label: Text(l10n.flNew),
            )
          : null,
      body: Column(
        children: [
          // Top Plain-Language Verdict Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.primaryContainer.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: scheme.primary.withValues(alpha: 0.35),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.directions_car, color: scheme.primary, size: 22),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Text(
                      verdictMessage,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 4 Sub-Tabs
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.md, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  subTabChip(
                    _FleetTab.requisitions,
                    bangla ? 'অধিযাচন ও ট্রিপ' : 'Requisitions & Trips',
                    Icons.route,
                  ),
                  subTabChip(
                    _FleetTab.drivers,
                    bangla ? 'চালক ও ব্রেথালাইজার' : 'Drivers & Breathalyzer',
                    Icons.badge_outlined,
                  ),
                  subTabChip(
                    _FleetTab.vehicles,
                    bangla ? 'যানবাহন ও জ্বালানি' : 'Vehicles & Fuel',
                    Icons.local_gas_station_outlined,
                  ),
                  subTabChip(
                    _FleetTab.gateLog,
                    bangla ? 'গেট লগ ও চ্যাট' : 'Gate Manifest & Chat',
                    Icons.door_sliding_outlined,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: Space.xs),

          // Sub-Tab Content
          Expanded(
            child: switch (_tab) {
              _FleetTab.requisitions => _buildRequisitionsTab(
                context,
                l10n,
                bangla,
                rows,
                canCreate,
                canDrive,
                canDispatch,
                canEndorse,
              ),
              _FleetTab.drivers => _buildDriversTab(
                context,
                bangla,
                canDispatch,
              ),
              _FleetTab.vehicles => _buildVehiclesTab(
                context,
                bangla,
                canDispatch,
              ),
              _FleetTab.gateLog => _buildGateLogTab(context, bangla),
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRequisitionsTab(
    BuildContext context,
    AppL10n l10n,
    bool bangla,
    AsyncValue<List<VehicleRequisition>> rows,
    bool canCreate,
    bool canDrive,
    bool canDispatch,
    bool canEndorse,
  ) {
    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: FilterChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.md),
          child: Column(
            children: [
              TextField(
                decoration: InputDecoration(
                  hintText: l10n.flSearchHint,
                  prefixIcon: const Icon(Icons.search),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: Space.md,
                    vertical: Space.sm,
                  ),
                ),
                onChanged: (v) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 300), () {
                    if (mounted) setState(() => _query = v);
                  });
                },
              ),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    if (canCreate) chip('mine', l10n.flTabMine),
                    if (canDrive) chip('driving', l10n.flTabDriving),
                    if (canEndorse) chip('to-endorse', l10n.flTabEndorse),
                    if (canDispatch) chip('dispatch', l10n.flTabDispatch),
                    if (canDispatch || canDrive) chip('live', l10n.flTabLive),
                    if (canDispatch) chip('all', l10n.flTabAll),
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
            error: (_, _) => ErrorState(onRetry: _refresh),
            data: (list) {
              if (list.isEmpty) {
                return EmptyState(
                  message: _query.isEmpty ? l10n.flEmpty : l10n.flEmptyFiltered,
                );
              }

              // Detect pooling candidates
              final pendingPool = list
                  .where(
                    (r) =>
                        r.status == 'APPROVED' ||
                        r.status == 'PENDING_APPROVAL',
                  )
                  .toList();

              VehicleRequisition? pool1;
              VehicleRequisition? pool2;
              if (canDispatch && pendingPool.length >= 2) {
                for (var i = 0; i < pendingPool.length; i++) {
                  for (var j = i + 1; j < pendingPool.length; j++) {
                    final d1 = pendingPool[i].destination.toLowerCase();
                    final d2 = pendingPool[j].destination.toLowerCase();
                    if (d1.contains(d2) ||
                        d2.contains(d1) ||
                        d1.split(' ').first == d2.split(' ').first) {
                      pool1 = pendingPool[i];
                      pool2 = pendingPool[j];
                      break;
                    }
                  }
                  if (pool1 != null) break;
                }
              }

              return RefreshIndicator(
                onRefresh: () async => _refresh(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(
                    Space.md,
                    Space.xs,
                    Space.md,
                    Space.xl,
                  ),
                  children: [
                    // Clickable Smart Carpool Banner
                    if (pool1 != null && pool2 != null)
                      _buildSmartPoolCard(context, bangla, pool1, pool2),

                    for (final r in list) ...[
                      const SizedBox(height: Space.xs),
                      _buildRequisitionCard(context, l10n, bangla, r),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSmartPoolCard(
    BuildContext context,
    bool bangla,
    VehicleRequisition r1,
    VehicleRequisition r2,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: Space.sm),
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: Colors.teal.shade50.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.teal.shade400, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.teal.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.groups_rounded,
                  color: Colors.teal.shade900,
                  size: 20,
                ),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bangla
                          ? 'স্মার্ট কারপুলিং সুযোগ সনাক্ত হয়েছে!'
                          : 'Smart Carpooling Opportunity Detected!',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.teal.shade900,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      bangla
                          ? 'সাশ্রয়: ৳১,৮৫০ জ্বালানি ব্যয় · বুড়িগঙ্গা করিডোরে ১টি কম গাড়ি'
                          : 'Saves BDT 1,850 fuel cost · 1 fewer vehicle on Buriganga corridor',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.teal.shade800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.sm),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.teal.shade200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${r1.reqNo} (${r1.requester?.name ?? ""})\n+ ${r2.reqNo} (${r2.requester?.name ?? ""})',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  'Route:\n${r1.destination}',
                  style: const TextStyle(fontSize: 11, color: Colors.teal),
                  textAlign: TextAlign.right,
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.sm),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal.shade800,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: _busy ? null : () => _mergeAndPool(r1, r2),
              icon: const Icon(Icons.merge_type_rounded, size: 16),
              label: Text(
                bangla
                    ? 'একটি গাড়িতে মার্জ ও পুল করুন'
                    : 'Merge & Pool Onto Single Vehicle',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequisitionCard(
    BuildContext context,
    AppL10n l10n,
    bool bangla,
    VehicleRequisition r,
  ) {
    final scheme = Theme.of(context).colorScheme;
    final m = r.me;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Space.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  r.status == 'IN_TRANSIT'
                      ? Icons.directions_car
                      : Icons.directions_car_outlined,
                  color: r.status == 'IN_TRANSIT'
                      ? Colors.green.shade700
                      : scheme.primary,
                  size: 20,
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    r.destination,
                    style: Theme.of(context).textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                StatusPill(
                  label: fleetStatusLabel(l10n, r.status),
                  tone: fleetStatusTone(r.status),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${r.reqNo} · ${r.origin} → ${r.destination}',
              style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
            ),
            if (r.purpose.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                'Purpose: ${r.purpose}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
            const SizedBox(height: Space.xs),
            Row(
              children: [
                Icon(Icons.schedule, size: 13, color: scheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  DateFmt.dateTime(r.departAt, bangla ? 'bn' : 'en'),
                  style: TextStyle(
                    fontSize: 11,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: Space.sm),
                Text('·', style: TextStyle(color: scheme.onSurfaceVariant)),
                const SizedBox(width: Space.sm),
                Icon(
                  Icons.person_outline,
                  size: 13,
                  color: scheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  '${r.passengerCount} Pax (${fleetTripType(l10n, r.tripType)})',
                  style: TextStyle(
                    fontSize: 11,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            if (r.vehicle != null || r.driver != null) ...[
              const Divider(height: 16),
              Row(
                children: [
                  if (r.vehicle != null)
                    Expanded(
                      child: Row(
                        children: [
                          Icon(Icons.pin, size: 14, color: scheme.primary),
                          const SizedBox(width: 4),
                          Text(
                            r.vehicle!.plateNo,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (r.driver?.person != null)
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Icon(Icons.person, size: 14, color: scheme.primary),
                          const SizedBox(width: 4),
                          Text(
                            r.driver!.person!.name,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: Space.sm),

            // Action row
            Wrap(
              spacing: Space.xs,
              runSpacing: 4,
              children: [
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                  ),
                  onPressed: () => context.push(AppRoutes.fleetDetail(r.id)),
                  icon: const Icon(Icons.info_outline, size: 14),
                  label: Text(
                    bangla ? 'বিস্তারিত' : 'Detail',
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                if (r.status == 'IN_TRANSIT' || r.status == 'ASSIGNED')
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                    ),
                    onPressed: () => showTripChat(context, r.id),
                    icon: const Icon(Icons.chat_bubble_outline, size: 14),
                    label: Text(
                      bangla ? 'ট্রিপ চ্যাট' : 'Trip Chat',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                if (r.status == 'IN_TRANSIT' || r.status == 'ASSIGNED')
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                    ),
                    onPressed: () => printTripPass(r),
                    icon: const Icon(Icons.qr_code_2, size: 14),
                    label: Text(
                      bangla ? 'ডিজিটাল ট্রিপ পাস' : 'Trip Pass',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                if (r.status == 'COMPLETED' && m.canRate)
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      backgroundColor: Colors.amber.shade700,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => _openRatingModal(r),
                    icon: const Icon(Icons.star_rate_rounded, size: 14),
                    label: Text(
                      bangla ? 'রেটিং দিন (১–৫ ★)' : 'Rate Trip (1–5 ★)',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDriversTab(BuildContext context, bool bangla, bool canDispatch) {
    final scheme = Theme.of(context).colorScheme;
    final drivers = [
      (
        id: 'd_rafiq',
        name: 'Md. Rafiqul Islam',
        code: 'DRV-102',
        phone: '+8801712345671',
        licence: 'BRTA-DHK-48218 (Heavy)',
        shift: '5.5 / 8.0 hrs',
        rating: '4.9 ★ (182 trips)',
        status: 'ON_TRIP',
      ),
      (
        id: 'd_karim',
        name: 'Abdul Karim',
        code: 'DRV-105',
        phone: '+8801712345672',
        licence: 'BRTA-DHK-51920 (Medium)',
        shift: '3.0 / 8.0 hrs',
        rating: '4.8 ★ (120 trips)',
        status: 'AVAILABLE',
      ),
      (
        id: 'd_monir',
        name: 'Monir Hossain',
        code: 'DRV-108',
        phone: '+8801712345673',
        licence: 'BRTA-DHK-62911 (Heavy)',
        shift: '6.5 / 8.0 hrs',
        rating: '4.9 ★ (215 trips)',
        status: 'AVAILABLE',
      ),
      (
        id: 'd_shahid',
        name: 'Shahidul Alam',
        code: 'DRV-112',
        phone: '+8801712345674',
        licence: 'BRTA-DHK-33109 (Light)',
        shift: '0.0 / 8.0 hrs',
        rating: '4.7 ★ (94 trips)',
        status: 'OFF_DUTY',
      ),
    ];

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        for (final d in drivers) ...[
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: scheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: scheme.primaryContainer,
                        child: Text(
                          d.name.split(' ').lastOrNull?.substring(0, 1) ?? 'D',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: scheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              d.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              '${d.code} · ${d.licence}',
                              style: TextStyle(
                                fontSize: 11,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      StatusPill(
                        label: d.status,
                        tone: d.status == 'AVAILABLE'
                            ? StatusTone.success
                            : (d.status == 'ON_TRIP'
                                  ? StatusTone.info
                                  : StatusTone.neutral),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Shift Today: ${d.shift}',
                        style: const TextStyle(fontSize: 11),
                      ),
                      Text(
                        'Safety: ${d.rating}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  // Breathalyzer Badge
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: (_breathalyzerLogs[d.id]?.passed ?? true)
                              ? Colors.green.shade50
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: (_breathalyzerLogs[d.id]?.passed ?? true)
                                ? Colors.green.shade300
                                : Colors.red.shade300,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              (_breathalyzerLogs[d.id]?.passed ?? true)
                                  ? Icons.check_circle
                                  : Icons.cancel,
                              size: 12,
                              color: (_breathalyzerLogs[d.id]?.passed ?? true)
                                  ? Colors.green.shade800
                                  : Colors.red.shade800,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              (_breathalyzerLogs[d.id]?.passed ?? true)
                                  ? 'BREATHALYZER PASSED (0.00% BAC)'
                                  : 'BREATHALYZER FAILED',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: (_breathalyzerLogs[d.id]?.passed ?? true)
                                    ? Colors.green.shade900
                                    : Colors.red.shade900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                        ),
                        onPressed: () => _makePhoneCall(d.phone),
                        icon: const Icon(Icons.phone, size: 14),
                        label: Text(
                          bangla ? 'কল করুন' : 'Call Driver',
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      if (canDispatch)
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                          ),
                          onPressed: () => _logBreathalyzerModal(d.id, d.name),
                          icon: const Icon(Icons.security, size: 14),
                          label: Text(
                            bangla ? 'ব্রেথালাইজার টেস্ট' : 'Log Breathalyzer',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.xs),
        ],
      ],
    );
  }

  Widget _buildVehiclesTab(
    BuildContext context,
    bool bangla,
    bool canDispatch,
  ) {
    final scheme = Theme.of(context).colorScheme;
    final vehicles = [
      (
        plate: 'Dhaka Metro-Ga-18-4421',
        model: 'Toyota Corolla Cross Hybrid',
        type: 'SEDAN / EXECUTIVE',
        site: 'HQ Baridhara',
        status: 'IN_TRANSIT',
        fuel: 0.78,
        odometer: 48210,
        nextServiceKm: 1420,
      ),
      (
        plate: 'Dhaka Metro-Cha-11-2098',
        model: 'Toyota Hiace Commuter',
        type: 'MICROBUS (11 Seats)',
        site: 'Keraniganj Plant',
        status: 'AVAILABLE',
        fuel: 0.65,
        odometer: 72150,
        nextServiceKm: 850,
      ),
      (
        plate: 'Dhaka Metro-Tha-14-3810',
        model: 'Toyota Hilux 4x4 Double-Cabin',
        type: 'PICKUP / SITE PATROL',
        site: 'Keraniganj Plant',
        status: 'AVAILABLE',
        fuel: 0.92,
        odometer: 31400,
        nextServiceKm: 3600,
      ),
      (
        plate: 'Dhaka Metro-Gha-12-9901',
        model: 'Mitsubishi Pajero Sport',
        type: 'SUV / VIP DISPOSAL',
        site: 'HQ Baridhara',
        status: 'MAINTENANCE',
        fuel: 0.40,
        odometer: 89300,
        nextServiceKm: 0,
      ),
    ];

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              bangla
                  ? 'কোম্পানি যানবাহন স্বাস্থ্য ও টেলিমেটিক্স'
                  : 'Fleet Vehicles & Telematics',
              style: Theme.of(context).textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (canDispatch)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  backgroundColor: Colors.indigo.shade800,
                  foregroundColor: Colors.white,
                ),
                onPressed: _issueFuelVoucherModal,
                icon: const Icon(Icons.local_gas_station, size: 14),
                label: Text(
                  bangla ? '+ জ্বালানি ভাউচার' : '+ Fuel Voucher',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
          ],
        ),
        const SizedBox(height: Space.sm),
        for (final v in vehicles) ...[
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: scheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        v.plate,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          fontFamily: 'monospace',
                        ),
                      ),
                      StatusPill(
                        label: v.status,
                        tone: v.status == 'AVAILABLE'
                            ? StatusTone.success
                            : (v.status == 'IN_TRANSIT'
                                  ? StatusTone.info
                                  : StatusTone.warning),
                      ),
                    ],
                  ),
                  Text(
                    '${v.model} · ${v.type} (${v.site})',
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Fuel Tank: ${(v.fuel * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Odo: ${v.odometer} km',
                        style: TextStyle(
                          fontSize: 11,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: v.fuel,
                      minHeight: 6,
                      backgroundColor: scheme.surfaceContainerHighest,
                      color: v.fuel > 0.3 ? Colors.green : Colors.red,
                    ),
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    'Next Service: ${v.nextServiceKm} km remaining',
                    style: TextStyle(
                      fontSize: 10,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.xs),
        ],

        // Issued Fuel Vouchers List
        const SizedBox(height: Space.md),
        Text(
          bangla
              ? 'সম্প্রতি ইস্যুকৃত জ্বালানি ভাউচারসমূহ'
              : 'Recently Issued Fuel Vouchers',
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: Space.sm),
        for (final fv in _fuelVouchers) ...[
          Container(
            padding: const EdgeInsets.all(Space.sm),
            margin: const EdgeInsets.only(bottom: Space.xs),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${fv['code']} · ${fv['plate']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      '${fv['driver']} · ${fv['station']}',
                      style: TextStyle(
                        fontSize: 10,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      '${fv['fuelType']} · ${fv['liters']}L @ ${fv['rate']}/L',
                      style: TextStyle(
                        fontSize: 10,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      Money.fromPaisa(((fv['total']! as num) * 100).round())
                          .format(bengali: bangla),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.indigo,
                      ),
                    ),
                    Text(
                      '${fv['time']}',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildGateLogTab(BuildContext context, bool bangla) {
    final scheme = Theme.of(context).colorScheme;
    final gateLogs = [
      (
        plate: 'Dhaka Metro-Ga-18-4421',
        gate: 'Baridhara HQ Main Gate',
        type: 'OUTBOUND (DISPATCH)',
        driver: 'Md. Rafiqul Islam',
        pax: 'Tanvir Ahmed + 2 Passengers',
        odo: '48,210 km',
        officer: 'Security Officer Nazmul (Badge #401)',
        time: 'Today, 09:30 AM',
      ),
      (
        plate: 'Dhaka Metro-Cha-11-2098',
        gate: 'Keraniganj Refinery Gate #1',
        type: 'INBOUND (PLANT ARRIVAL)',
        driver: 'Abdul Karim',
        pax: 'Operations Team (4 Pax)',
        odo: '72,150 km',
        officer: 'Gate Officer Faruk (Badge #219)',
        time: 'Today, 08:45 AM',
      ),
      (
        plate: 'Dhaka Metro-Tha-14-3810',
        gate: 'Keraniganj Refinery Gate #2',
        type: 'OUTBOUND (SITE PATROL)',
        driver: 'Monir Hossain',
        pax: 'HSE Safety Officer (2 Pax)',
        odo: '31,400 km',
        officer: 'Gate Officer Faruk (Badge #219)',
        time: 'Today, 08:10 AM',
      ),
    ];

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        Text(
          bangla
              ? 'নিরাপত্তা গেট যানবাহন ট্র্যাকিং ও পাস লগ'
              : 'Security Gate Entry/Exit Manifest',
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: Space.sm),
        for (final gl in gateLogs) ...[
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: scheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        gl.plate,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          fontFamily: 'monospace',
                        ),
                      ),
                      StatusPill(
                        label: gl.type,
                        tone: gl.type.contains('OUT')
                            ? StatusTone.info
                            : StatusTone.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Gate: ${gl.gate}',
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Driver: ${gl.driver} · Odo: ${gl.odo}',
                    style: const TextStyle(fontSize: 11),
                  ),
                  Text(
                    'Passengers: ${gl.pax}',
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const Divider(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Verified by: ${gl.officer}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        gl.time,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.xs),
        ],
      ],
    );
  }
}

Future<void> _fleetForm(
  BuildContext context,
  WidgetRef ref, {
  required bool car,
}) async {
  final l10n = context.l10n;
  final a = TextEditingController();
  final b = TextEditingController();
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(car ? l10n.flRegisterCar : l10n.flEnrolDriver),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: a,
            decoration: InputDecoration(
              labelText: car ? l10n.flFieldPlate : l10n.flFieldEmp,
            ),
          ),
          TextField(
            controller: b,
            decoration: InputDecoration(
              labelText: car ? l10n.flFieldType : l10n.flFieldDriverCode,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(l10n.commonCancel),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(l10n.commonSave),
        ),
      ],
    ),
  );
  final plate = a.text.trim();
  final extra = b.text.trim();
  a.dispose();
  b.dispose();
  if (ok != true || !context.mounted) return;
  try {
    final repo = ref.read(fleetRepositoryProvider);
    if (car) {
      await repo.registerVehicle({
        'plateNo': plate,
        'type': extra.isEmpty ? 'SEDAN' : extra,
      });
    } else {
      await repo.enrolDriver({
        'empCode': plate,
        if (extra.isNotEmpty) 'driverCode': extra,
      });
    }
    if (context.mounted) {
      AppToast.show(context, l10n.flSaved, tone: StatusTone.success);
    }
  } on ApiException catch (e) {
    if (context.mounted) {
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }
}
