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
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
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

const _fleetTemplates = <(String, String)>[
  (
    'Official engineering inspection and LPG bottling line audit at Keraniganj Filling Plant.',
    'কেরানীগঞ্জ ফিলিং প্ল্যান্টে দাপ্তরিক ইঞ্জিনিয়ারিং পরিদর্শন ও এলপিজি বোতলজাতকরণ লাইন অডিট।',
  ),
  (
    'Regulatory coordination meeting at Petrobangla / BERC Head Office with technical dossier.',
    'কারিগরি ডসিয়ারসহ পেট্রোবাংলা / বিইআরসি প্রধান কার্যালয়ে রেগুলেটরি সমন্বয় সভা।',
  ),
  (
    'Urgent transport of calibrated safety valves and HSE team to plant storage facility.',
    'প্ল্যান্ট স্টোরেজ ফ্যাসিলিটিতে ক্যালিব্রেটেড সেফটি ভালভ ও এইচএসই টিমের জরুরি পরিবহন।',
  ),
  (
    'Executive site visit and terminal logistics review at Chattogram LPG Terminal.',
    'চট্টগ্রাম এলপিজি টার্মিনালে নির্বাহীদের সাইট পরিদর্শন ও লজিস্টিকস পর্যালোচনা।',
  ),
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

  bool get _isReady => _purpose.text.trim().length >= 5;

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
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final est = _est;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.flNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.flCreate,
        primaryIcon: Icons.directions_car_outlined,
        loading: _saving,
        isReady: _isReady,
        onPrimaryPressed: _saving ? null : () => unawaited(_submit()),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.md,
          Space.lg,
          Space.xxl,
        ),
        children: [
          EnterpriseApplicantStrip(
            badgeLabel: bangla ? 'যানবাহন রিকুইজিশন' : 'VEHICLE REQUISITION',
            badgeIcon: Icons.directions_car_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.route_outlined,
            title: bangla
                ? 'গন্তব্য ও যাত্রার সময়সূচি'
                : 'Destination & Departure Schedule',
            subtitle: l10n.flFormIntro,
            children: [
              EnterpriseDropdownField<String>(
                label: l10n.flFieldDest,
                icon: Icons.place_outlined,
                value: _dest,
                items: [
                  for (final d in _destinations)
                    DropdownMenuItem(value: d, child: Text(d)),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _dest = v);
                  unawaited(_refreshEst());
                },
              ),
              const SizedBox(height: Space.md),
              EnterpriseDateTile(
                label: l10n.flFieldWhen,
                valueText: DateFmt.dateTime(_depart, lang),
                icon: Icons.schedule_outlined,
                onTap: () => unawaited(_pickWhen()),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.airline_seat_recline_normal_outlined,
            title: bangla
                ? 'যাত্রার ধরন ও যাত্রী সংখ্যা'
                : 'Trip Type & Passenger Capacity',
            subtitle: bangla
                ? 'যাত্রার ধরন এবং মোট যাত্রীর সংখ্যা নির্বাচন করুন'
                : 'Select trip mode and passenger count for vehicle class matching',
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.flFieldType,
                      icon: Icons.sync_alt_outlined,
                      value: _type,
                      items: [
                        DropdownMenuItem(
                          value: 'ONE_WAY',
                          child: Text(l10n.flTypeOne),
                        ),
                        DropdownMenuItem(
                          value: 'ROUND_TRIP',
                          child: Text(l10n.flTypeRound),
                        ),
                      ],
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() => _type = v);
                        unawaited(_refreshEst());
                      },
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<int>(
                      label: l10n.flFieldPax,
                      icon: Icons.groups_outlined,
                      value: _pax,
                      items: [
                        for (var n = 1; n <= 7; n++)
                          DropdownMenuItem(
                            value: n,
                            child: Text(
                              bangla ? '$n জন যাত্রী' : '$n Passenger(s)',
                            ),
                          ),
                      ],
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() => _pax = v);
                        unawaited(_refreshEst());
                      },
                    ),
                  ),
                ],
              ),
              if (est != null) ...[
                const SizedBox(height: Space.md),
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(
                      color: cs.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.local_gas_station_outlined, color: cs.primary),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Text(
                          l10n.flEstimate(
                            est.km.toStringAsFixed(0),
                            est.minutes,
                            fleetTaka(est.cost, bangla: bangla),
                            est.capacityClass,
                          ),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.assignment_outlined,
            title: bangla
                ? 'দাপ্তরিক সফরের উদ্দেশ্য'
                : 'Official Trip Purpose & Justification',
            subtitle: bangla
                ? 'স্ট্যান্ডার্ড টেমপ্লেট বাছাই করুন অথবা সফরের উদ্দেশ্য লিখুন'
                : 'Pick a standard BOGCL trip template or enter custom details',
            children: [
              EnterpriseTemplateDropdown(
                presets: _fleetTemplates,
                controller: _purpose,
                onPicked: () => setState(() {}),
                labelEn: 'Standard Fleet Trip Purpose (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড সফরের উদ্দেশ্য (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.flFieldPurpose,
                controller: _purpose,
                maxLines: 3,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseWorkflowCard(
            title: bangla
                ? 'যানবাহন বরাদ্দ ও গেট পাস প্রক্রিয়া'
                : 'Fleet Approval & Dispatch Workflow',
            steps: [
              (
                Icons.person_outline,
                bangla ? 'রিকুইজিশন দাখিল' : 'Requester',
                bangla ? 'আবেদন জমা' : 'Trip Filed',
              ),
              (
                Icons.supervisor_account_outlined,
                bangla ? 'বিভাগীয় অনুমোদন' : 'HOD Approval',
                bangla ? 'দাপ্তরিক যাচাই' : 'Line Clearance',
              ),
              (
                Icons.directions_car_filled_outlined,
                bangla ? 'ট্রান্সপোর্ট পুল' : 'Transport Pool',
                bangla ? 'গাড়ি ও চালক বরাদ্দ' : 'Vehicle & Driver',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
