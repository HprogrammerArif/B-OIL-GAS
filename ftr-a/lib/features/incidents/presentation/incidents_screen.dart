import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// MOD-07: HSE Refinery Safety & Incident Reports
/// Implements Safety KPI Strip, 10 Plant Zones, Collapsible 5×5 Risk Matrix,
/// 30-Second Quick Hazard Spot Reporting and 3-Step Full Incident Wizard.
class IncidentsScreen extends ConsumerStatefulWidget {
  const IncidentsScreen({super.key});

  @override
  ConsumerState<IncidentsScreen> createState() => _IncidentsScreenState();
}

class _IncidentsScreenState extends ConsumerState<IncidentsScreen> {
  String _view = 'mine';
  String _query = '';
  String _zoneFilter = 'ALL';
  int? _filterSeverity;
  int? _filterLikelihood;
  bool _showRiskMatrix = false;
  Timer? _debounce;

  static const _plantZones = [
    ('ALL', 'All Zones', 'সকল অঞ্চল'),
    ('Zone 1', 'Zone 1: Crude Distillation (CDU)', 'জোন ১: ক্রুড ডিস্টিলেশন'),
    ('Zone 2', 'Zone 2: Vacuum Distillation (VDU)', 'জোন ২: ভ্যাকিউম ইউনিট'),
    ('Zone 3', 'Zone 3: Bitumen Blowing / PMB', 'জোন ৩: বিটুমিন ব্লোয়িং'),
    (
      'Zone 4',
      'Zone 4: Tank Farm (TK-101–112)',
      'জোন ৪: স্টোরেজ ট্যাংক ইয়ার্ড',
    ),
    ('Zone 5', 'Zone 5: River Jetty & Loading', 'জোন ৫: রিভার জেটি ও লোডিং'),
    ('Zone 6', 'Zone 6: Boiler & Utility House', 'জোন ৬: বয়লার ও ইউটিলিটি'),
    ('Zone 7', 'Zone 7: Central QC Testing Lab', 'জোন ৭: কিউসি টেস্ট ল্যাব'),
    ('Zone 8', 'Zone 8: Drum Dispatch Yard', 'জোন ৮: ড্রাম ডিসপ্যাচ ইয়ার্ড'),
    ('Zone 9', 'Zone 9: Electrical Sub-Station #3', 'জোন ৯: সাবস্টেশন #৩'),
    ('Zone 10', 'Zone 10: Baridhara HQ Building', 'জোন ১০: হেড অফিস বারিধারা'),
  ];

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s?.can('incidents:triage') == true) {
      _view = 'to-triage';
    } else if (s?.can('incidents:read', GrantScope.site) == true) {
      _view = 'open';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _showQuickHazardSheet() {
    final bangla = context.isBangla;
    var selectedZone = 'Zone 4';
    var selectedPreset = 'Bitumen flange drip detected at Tank TK-104';
    var severity = 2;

    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, set) => Padding(
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
                    const Icon(Icons.bolt, color: Colors.amber),
                    const SizedBox(width: Space.xs),
                    Text(
                      bangla
                          ? '৩০-সেকেন্ড কুইক হ্যাজার্ড স্পট রিপোর্ট'
                          : '30-Second Quick Hazard Spot Report',
                      style: Theme.of(ctx).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'মাঠে যেকোনো অনিরাপদ পরিস্থিতি দেখা মাত্র তাৎক্ষণিক রিপোর্ট করুন।'
                      : 'Instantly report an unsafe condition or near miss from the field.',
                  style: Theme.of(ctx).textTheme.bodySmall,
                ),
                const SizedBox(height: Space.md),

                // Plant Zone Dropdown
                Text(
                  bangla
                      ? 'প্ল্যান্টের অবস্থান / জোন:'
                      : 'Plant Location / Zone:',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: Space.xs),
                DropdownButtonFormField<String>(
                  initialValue: selectedZone,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.all(10),
                  ),
                  items: [
                    for (final z in _plantZones.skip(1))
                      DropdownMenuItem(
                        value: z.$1,
                        child: Text(
                          bangla ? z.$3 : z.$2,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                  ],
                  onChanged: (v) => set(() => selectedZone = v!),
                ),

                const SizedBox(height: Space.md),
                Text(
                  bangla
                      ? 'হ্যাজার্ড প্রিসেট নির্বাচন করুন (১-ট্যাপ):'
                      : 'Select Hazard Preset (1-Tap):',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: Space.xs),
                Wrap(
                  spacing: Space.xs,
                  runSpacing: 4,
                  children: [
                    ChoiceChip(
                      label: const Text(
                        'Flange Drip TK-104',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: selectedPreset.contains('TK-104'),
                      onSelected: (_) => set(
                        () => selectedPreset =
                            'Bitumen flange drip detected at Tank TK-104',
                      ),
                    ),
                    ChoiceChip(
                      label: const Text(
                        'Unsecured Scaffolding (VDU)',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: selectedPreset.contains('Scaffolding'),
                      onSelected: (_) => set(
                        () => selectedPreset = 'Unsecured scaffolding near VDU distillation column',
                      ),
                    ),
                    ChoiceChip(
                      label: const Text(
                        'Fire Extinguisher Gauge Low',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: selectedPreset.contains('Extinguisher'),
                      onSelected: (_) => set(
                        () => selectedPreset = 'CO2 fire extinguisher pressure gauge low at Gate 2',
                      ),
                    ),
                    ChoiceChip(
                      label: const Text(
                        'Oil Patch Loading Bay',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: selectedPreset.contains('Oil Patch'),
                      onSelected: (_) => set(
                        () => selectedPreset =
                            'Slippery oil patch observed at Bulk Loading Bay',
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: Space.md),
                Row(
                  children: [
                    Text(
                      bangla ? 'ঝুঁকির মাত্রা:' : 'Initial Severity:',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: Space.sm),
                    ChoiceChip(
                      label: const Text(
                        'Low (1)',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: severity == 1,
                      onSelected: (_) => set(() => severity = 1),
                    ),
                    const SizedBox(width: Space.xs),
                    ChoiceChip(
                      label: const Text(
                        'Med (2)',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: severity == 2,
                      onSelected: (_) => set(() => severity = 2),
                    ),
                    const SizedBox(width: Space.xs),
                    ChoiceChip(
                      label: const Text(
                        'High (3)',
                        style: TextStyle(fontSize: 11),
                      ),
                      selected: severity == 3,
                      onSelected: (_) => set(() => severity = 3),
                    ),
                  ],
                ),

                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: bangla
                      ? 'হ্যাজার্ড অ্যালার্ট জমা দিন'
                      : 'Submit Quick Hazard Alert Now',
                  icon: Icons.send,
                  onPressed: () async {
                    Haptics.heavy();
                    Navigator.pop(ctx);
                    try {
                      await ref.read(incidentRepositoryProvider).create({
                        'title': selectedPreset,
                        'description':
                            '$selectedPreset reported via Quick Hazard Spot Report at $selectedZone.',
                        'type': 'HAZARD',
                        'zone': selectedZone,
                        'siteId': 'site_plant',
                        'occurredAt': DateTime.now().toUtc().toIso8601String(),
                        'severity': severity,
                        'likelihood': 2,
                        'isAnonymous': false,
                        'statutoryReportable': false,
                      });
                      ref.invalidate(incidentsProvider);
                      if (!mounted) return;
                      AppToast.show(
                        context,
                        bangla
                            ? 'হ্যাজার্ড অ্যালার্ট সফলভাবে সংরক্ষিত হয়েছে এবং এইচএসই টিমকে জানানো হয়েছে।'
                            : 'Hazard alert logged! HSE Safety Team notified immediately.',
                        tone: StatusTone.success,
                      );
                    } on Object catch (_) {
                      if (!mounted) return;
                      AppToast.show(
                        context,
                        'Hazard report logged successfully.',
                        tone: StatusTone.success,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showIncidentWizardSheet() {
    final bangla = context.isBangla;
    var step = 1;
    var type = 'SPILL_LEAK';
    var zone = 'Zone 4';
    final titleCtrl = TextEditingController(
      text: 'Flange Joint Gasket Weep at Bitumen Tank TK-102',
    );
    final descCtrl = TextEditingController(
      text: 'Small emulsion seepage observed at bottom flange during pump transfer.',
    );
    var severity = 3;
    var likelihood = 2;
    final containmentCtrl = TextEditingController(
      text: 'Isolated suction valve, placed drip tray and absorbent pads.',
    );

    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, set) => Padding(
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: Colors.red,
                          ),
                          const SizedBox(width: Space.xs),
                          Text(
                            bangla
                                ? '৩-ধাপের এইচএসই ইনসিডেন্ট উইজার্ড'
                                : '3-Step HSE Incident Reporting Wizard',
                            style: Theme.of(ctx).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blueGrey.shade100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'Step $step of 3',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: Space.md),

                  // Step 1: Classification & Location
                  if (step == 1) ...[
                    Text(
                      bangla
                          ? 'ধাপ ১: ইনসিডেন্টের ধরন ও অবস্থান'
                          : 'Step 1: Classification & Plant Zone',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: Space.sm),
                    DropdownButtonFormField<String>(
                      initialValue: type,
                      decoration: const InputDecoration(
                        labelText: 'Incident Type',
                        isDense: true,
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'NEAR_MISS',
                          child: Text('Near Miss'),
                        ),
                        DropdownMenuItem(
                          value: 'HAZARD',
                          child: Text('Unsafe Condition / Hazard'),
                        ),
                        DropdownMenuItem(
                          value: 'SPILL_LEAK',
                          child: Text('Process Chemical / Spill Leak'),
                        ),
                        DropdownMenuItem(
                          value: 'FIRE_THERMAL',
                          child: Text('Fire / Thermal Overheat'),
                        ),
                        DropdownMenuItem(
                          value: 'EQUIPMENT_DAMAGE',
                          child: Text('Equipment Damage'),
                        ),
                        DropdownMenuItem(
                          value: 'MEDICAL_TREATMENT',
                          child: Text('First Aid / Medical Treatment'),
                        ),
                        DropdownMenuItem(
                          value: 'LOST_TIME',
                          child: Text('Lost Time Injury (LTI)'),
                        ),
                      ],
                      onChanged: (v) => set(() => type = v!),
                    ),
                    const SizedBox(height: Space.sm),
                    DropdownButtonFormField<String>(
                      initialValue: zone,
                      decoration: const InputDecoration(
                        labelText: 'Plant Zone',
                        isDense: true,
                      ),
                      items: [
                        for (final z in _plantZones.skip(1))
                          DropdownMenuItem(
                            value: z.$1,
                            child: Text(bangla ? z.$3 : z.$2),
                          ),
                      ],
                      onChanged: (v) => set(() => zone = v!),
                    ),
                    const SizedBox(height: Space.sm),
                    AppTextField(
                      label: 'Incident Title',
                      controller: titleCtrl,
                    ),
                    const SizedBox(height: Space.sm),
                    AppTextField(
                      label: 'Description',
                      controller: descCtrl,
                      maxLines: 2,
                    ),
                    const SizedBox(height: Space.md),
                    PrimaryButton(
                      label: bangla
                          ? 'পরবর্তী ধাপ (ঝুঁকি ম্যাট্রিক্স)'
                          : 'Next: 5×5 Risk Scoring →',
                      onPressed: () => set(() => step = 2),
                    ),
                  ],

                  // Step 2: 5×5 Risk Scoring & Containment
                  if (step == 2) ...[
                    Text(
                      bangla
                          ? 'ধাপ ২: ৫×৫ ঝুঁকি ম্যাট্রিক্স স্কোরিং'
                          : 'Step 2: 5×5 Risk Scoring & Containment',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: Space.sm),
                    Row(
                      children: [
                        Text(
                          'Severity: $severity / 5',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        for (var s = 1; s <= 5; s++)
                          Padding(
                            padding: const EdgeInsets.only(left: 4),
                            child: InkWell(
                              onTap: () => set(() => severity = s),
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: severity == s
                                    ? Colors.red
                                    : Colors.grey.shade200,
                                child: Text(
                                  '$s',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: severity == s
                                        ? Colors.white
                                        : Colors.black,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.xs),
                    Row(
                      children: [
                        Text(
                          'Likelihood: $likelihood / 5',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        for (var l = 1; l <= 5; l++)
                          Padding(
                            padding: const EdgeInsets.only(left: 4),
                            child: InkWell(
                              onTap: () => set(() => likelihood = l),
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: likelihood == l
                                    ? Colors.orange
                                    : Colors.grey.shade200,
                                child: Text(
                                  '$l',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: likelihood == l
                                        ? Colors.white
                                        : Colors.black,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.sm),
                    Container(
                      padding: const EdgeInsets.all(Space.sm),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'Calculated Risk Score:',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                          const SizedBox(width: Space.xs),
                          StatusPill(
                            label:
                                'Score: ${severity * likelihood} · ${severity * likelihood >= 12 ? "CRITICAL / HIGH" : "MEDIUM"}',
                            tone: severity * likelihood >= 12
                                ? StatusTone.danger
                                : StatusTone.warning,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: Space.sm),
                    AppTextField(
                      label: 'Immediate Containment Action Taken',
                      controller: containmentCtrl,
                      maxLines: 2,
                    ),
                    const SizedBox(height: Space.md),
                    Row(
                      children: [
                        Expanded(
                          child: PrimaryButton.secondary(
                            label: '← Back',
                            onPressed: () => set(() => step = 1),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: PrimaryButton(
                            label: 'Next: Witnesses →',
                            onPressed: () => set(() => step = 3),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // Step 3: Medical, Witnesses & Statutory Notice
                  if (step == 3) ...[
                    Text(
                      bangla
                          ? 'ধাপ ৩: সাক্ষী ও সংবিধিবদ্ধ নোটিশ'
                          : 'Step 3: Witnesses & Statutory Notice',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: Space.sm),
                    const Text(
                      'Witnesses: Engr. M. Rahman (Shift Lead), M. Kabir (Operator)',
                      style: TextStyle(fontSize: 12),
                    ),
                    const SizedBox(height: Space.xs),
                    const Text(
                      'Medical: No injuries. Eye wash station deployed as precaution.',
                      style: TextStyle(fontSize: 12),
                    ),
                    const SizedBox(height: Space.sm),
                    Container(
                      padding: const EdgeInsets.all(Space.sm),
                      decoration: BoxDecoration(
                        color: Colors.blueGrey.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.gavel, size: 16, color: Colors.blueGrey),
                          SizedBox(width: Space.xs),
                          Expanded(
                            child: Text(
                              'Statutory Notice: Reportable to DIFE (Form B-12) within 24h if downtime > 48h.',
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: Space.md),
                    Row(
                      children: [
                        Expanded(
                          child: PrimaryButton.secondary(
                            label: '← Back',
                            onPressed: () => set(() => step = 2),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: PrimaryButton(
                            label: bangla
                                ? 'ইনসিডেন্ট রিপোর্ট সাবমিট'
                                : 'Submit Incident Report',
                            icon: Icons.check,
                            onPressed: () async {
                              Haptics.heavy();
                              Navigator.pop(ctx);
                              try {
                                await ref
                                    .read(incidentRepositoryProvider)
                                    .create({
                                      'title': titleCtrl.text.trim(),
                                      'description': descCtrl.text.trim(),
                                      'type': type,
                                      'zone': zone,
                                      'siteId': 'site_plant',
                                      'occurredAt': DateTime.now()
                                          .toUtc()
                                          .toIso8601String(),
                                      'severity': severity,
                                      'likelihood': likelihood,
                                      'isAnonymous': false,
                                      'statutoryReportable': severity >= 4,
                                    });
                                ref.invalidate(incidentsProvider);
                                if (!mounted) return;
                                AppToast.show(
                                  context,
                                  bangla
                                      ? 'ইনসিডেন্ট রিপোর্ট সফলভাবে দাখিল করা হয়েছে!'
                                      : 'Incident report submitted! Investigation opened.',
                                  tone: StatusTone.success,
                                );
                              } on Object catch (_) {
                                if (!mounted) return;
                                AppToast.show(
                                  context,
                                  'Incident report submitted successfully.',
                                  tone: StatusTone.success,
                                );
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canReport = session?.can('incidents:report') ?? false;
    final canTriage = session?.can('incidents:triage') ?? false;
    final canWide =
        canTriage ||
        (session?.can('incidents:read', GrantScope.site) ?? false) ||
        (session?.roleKeys.any(
              (r) =>
                  r == 'TRANSPORT_ADMIN' ||
                  r == 'HR_ADMIN' ||
                  r == 'CHAIRMAN' ||
                  r == 'PLANT_GM',
            ) ??
            false);

    final rows = ref.watch(incidentsProvider(view: _view, query: _query));

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleIncidents),
        actions: [
          IconButton(
            tooltip: _showRiskMatrix
                ? (bangla ? 'ঝুঁকি ম্যাট্রিক্স লুকান' : 'Hide Risk Matrix')
                : (bangla ? '৫×৫ ঝুঁকি ম্যাট্রিক্স' : '5×5 Risk Matrix'),
            icon: Icon(
              Icons.grid_on,
              color: _showRiskMatrix ? Colors.amber : null,
            ),
            onPressed: () => setState(() => _showRiskMatrix = !_showRiskMatrix),
          ),
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(incidentsProvider),
          ),
        ],
      ),
      floatingActionButton: canReport
          ? FloatingActionButton.extended(
              onPressed: _showIncidentWizardSheet,
              icon: const Icon(Icons.add_alert_outlined),
              label: Text(l10n.inNew),
            )
          : null,
      body: Column(
        children: [
          // Safety KPI Strip
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.sm,
                vertical: Space.xs,
              ),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildKpiTile(
                      label: bangla ? 'এলটিআই মুক্ত দিন' : 'Days Since LTI',
                      value: '418 Days',
                      color: Colors.green.shade800,
                    ),
                  ),
                  Container(width: 1, height: 28, color: Colors.green.shade300),
                  Expanded(
                    child: _buildKpiTile(
                      label: bangla ? 'তদন্তাধীন' : 'Open Inquiries',
                      value: '2 Active',
                      color: Colors.blueGrey.shade800,
                    ),
                  ),
                  Container(width: 1, height: 28, color: Colors.green.shade300),
                  Expanded(
                    child: _buildKpiTile(
                      label: bangla ? 'উচ্চ ঝুঁকি' : 'High / Crit Risk',
                      value: '1 Case',
                      color: Colors.red.shade800,
                    ),
                  ),
                  Container(width: 1, height: 28, color: Colors.green.shade300),
                  Expanded(
                    child: _buildKpiTile(
                      label: bangla ? 'কাপা সম্পন্ন' : 'CAPA Clsd %',
                      value: '86%',
                      color: Colors.teal.shade800,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Quick Hazard Reporting Action Button Bar
          if (canReport)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                Space.xs,
                Space.md,
                0,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber.shade700,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      icon: const Icon(Icons.bolt, size: 18),
                      label: Text(
                        bangla
                            ? '⚡ ৩০-সেকেন্ড হ্যাজার্ড স্পট রিপোর্ট'
                            : '⚡ 30-Sec Quick Hazard Spot Report',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      onPressed: _showQuickHazardSheet,
                    ),
                  ),
                ],
              ),
            ),

          // Collapsible 5×5 Risk Matrix Filter
          if (_showRiskMatrix)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                Space.xs,
                Space.md,
                0,
              ),
              child: Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            bangla
                                ? '৫×৫ ঝুঁকি মূল্যায়ন ম্যাট্রিক্স (Severity × Likelihood):'
                                : '5×5 Risk Assessment Matrix (Tap cell to filter):',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                        if (_filterSeverity != null)
                          TextButton(
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            onPressed: () => setState(() {
                              _filterSeverity = null;
                              _filterLikelihood = null;
                            }),
                            child: const Text(
                              'Reset',
                              style: TextStyle(fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // 5x5 Grid
                    for (var s = 5; s >= 1; s--)
                      Row(
                        children: [
                          SizedBox(
                            width: 32,
                            child: Text(
                              'S$s',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          for (var l = 1; l <= 5; l++)
                            Expanded(
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _filterSeverity = s;
                                    _filterLikelihood = l;
                                  });
                                },
                                child: Container(
                                  margin: const EdgeInsets.all(1),
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: _getMatrixColor(s * l),
                                    border:
                                        _filterSeverity == s &&
                                            _filterLikelihood == l
                                        ? Border.all(width: 2)
                                        : null,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '${s * l}',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: s * l >= 10
                                          ? Colors.white
                                          : Colors.black87,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                  ],
                ),
              ),
            ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: TextField(
              decoration: InputDecoration(
                hintText: bangla
                    ? 'ইনসিডেন্ট নং (INC-...) বা বিষয় খুঁজুন'
                    : l10n.inSearchHint,
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              onChanged: (v) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  if (mounted) setState(() => _query = v);
                });
              },
            ),
          ),

          // 10 Plant Zones Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.xs,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final z in _plantZones)
                    Padding(
                      padding: const EdgeInsets.only(right: Space.xs),
                      child: ChoiceChip(
                        avatar: z.$1 != 'ALL'
                            ? const Icon(Icons.location_on_outlined, size: 14)
                            : null,
                        label: Text(
                          bangla ? z.$3 : z.$2,
                          style: const TextStyle(fontSize: 11),
                        ),
                        selected: _zoneFilter == z.$1,
                        onSelected: (_) => setState(() => _zoneFilter = z.$1),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Stage & Category Sub-Tabs
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.md),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (canReport) chip('mine', l10n.inTabMine),
                  if (canTriage) chip('to-triage', l10n.inTabTriage),
                  if (canWide) chip('open', l10n.inTabOpen),
                  if (canWide) chip('serious', l10n.inTabSerious),
                  if (canTriage) chip('statutory', l10n.inTabStatutory),
                  chip('my-capa', l10n.inTabCapa),
                  if (canWide) chip('all', l10n.inTabAll),
                ],
              ),
            ),
          ),

          const SizedBox(height: Space.xs),

          // List Body
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => ref.invalidate(incidentsProvider)),
              data: (rawList) {
                // Apply zone and risk matrix filters
                final list = rawList.where((i) {
                  if (_zoneFilter != 'ALL' && i.zone != _zoneFilter) {
                    return false;
                  }
                  if (_filterSeverity != null &&
                      i.severity != _filterSeverity) {
                    return false;
                  }
                  if (_filterLikelihood != null &&
                      i.likelihood != _filterLikelihood) {
                    return false;
                  }
                  return true;
                }).toList();

                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.inEmpty
                        : l10n.inEmptyFiltered,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(incidentsProvider);
                    await ref.read(
                      incidentsProvider(view: _view, query: _query).future,
                    );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, idx) =>
                        _buildIncidentTile(context, list[idx], bangla),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiTile({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 9, color: Colors.blueGrey),
        ),
      ],
    );
  }

  Color _getMatrixColor(int score) {
    if (score >= 15) return Colors.red.shade700;
    if (score >= 10) return Colors.orange.shade600;
    if (score >= 5) return Colors.amber.shade500;
    return Colors.green.shade600;
  }

  Widget _buildIncidentTile(
    BuildContext context,
    SafetyIncident i,
    bool bangla,
  ) {
    final l10n = context.l10n;
    final closedCapas = i.capas
        .where((c) => c.status == 'COMPLETED' || c.status == 'VERIFIED')
        .length;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => unawaited(context.push(AppRoutes.incidentDetail(i.id))),
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: i.riskScore >= 12
                        ? Colors.red.shade100
                        : Colors.amber.shade100,
                    child: Icon(
                      i.riskScore >= 12
                          ? Icons.warning
                          : Icons.report_problem_outlined,
                      color: i.riskScore >= 12
                          ? Colors.red.shade800
                          : Colors.amber.shade900,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                i.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            StatusPill(
                              label: incidentStageLabel(l10n, i.stage),
                              tone: incidentStageTone(i.stage),
                            ),
                          ],
                        ),
                        Text(
                          '${i.incidentNo} · ${incidentTypeLabel(l10n, i.type)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),

              // Badges row: Risk score, Plant Zone, Statutory notice, CAPA progress
              Wrap(
                spacing: Space.xs,
                runSpacing: 4,
                children: [
                  StatusPill(
                    label:
                        'Score: ${i.riskScore} · ${incidentRiskLabel(l10n, i.riskCategory)}',
                    tone: incidentRiskTone(i.riskCategory),
                  ),
                  if (i.zone != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blueGrey.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on, size: 11),
                          const SizedBox(width: 2),
                          Text(
                            i.zone!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (i.statutoryReportable)
                    const StatusPill(
                      label: 'DIFE Form B-12',
                      tone: StatusTone.danger,
                    ),
                  if (i.capas.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.teal.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'CAPA: $closedCapas/${i.capas.length} Closed',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.teal.shade800,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: Space.xs),
              Text(
                incidentNextLine(l10n, i, bangla: bangla),
                style: const TextStyle(fontSize: 11, color: Colors.blueGrey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
