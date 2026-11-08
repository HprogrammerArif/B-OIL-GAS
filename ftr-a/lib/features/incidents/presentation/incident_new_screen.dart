import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/attendance/data/location_service.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _incidentTemplates = <(String, String)>[
  (
    'Minor pressure fluctuation observed on Filling Carousel Valve #08 during cylinder batch charging; line isolated immediately for seal check.',
    'সিলিন্ডার চার্জিং চলাকালীন ফিলিং ক্যারোসেল ভালভ #০৮-এ সামান্য চাপের তারতম্য পরিলক্ষিত হয়েছে; সিল পরীক্ষার জন্য তাৎক্ষণিকভাবে লাইনটি বিচ্ছিন্ন করা হয়েছে।',
  ),
  (
    'Forklift reversing alarm intermittent in Empty Cylinder Stacking Bay; operator instructed to halt vehicle for electrical maintenance.',
    'খালি সিলিন্ডার স্ট্যাকিং বে-তে ফর্কলিফটের রিভার্সিং অ্যালার্ম অনিয়মিতভাবে কাজ করছে; বৈদ্যুতিক মেরামতের জন্য যানটি থামাতে নির্দেশ দেওয়া হয়েছে।',
  ),
  (
    'Static earthing clamp cable insulation wear detected at Bulk LPG Road Tanker Decanting Bay #02 prior to unloading.',
    'আনলোডিংয়ের পূর্বে বাল্ক এলপিজি রোড ট্যাংকার ডিক্যান্টিং বে #০২-এ স্ট্যাটিক আর্থিং ক্ল্যাম্প ক্যাবলের ইনসুলেশন ক্ষয় শনাক্ত করা হয়েছে।',
  ),
];

class IncidentNewScreen extends ConsumerStatefulWidget {
  const IncidentNewScreen({super.key});

  @override
  ConsumerState<IncidentNewScreen> createState() => _IncidentNewScreenState();
}

class _IncidentNewScreenState extends ConsumerState<IncidentNewScreen> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _type = 'NEAR_MISS';
  String _siteId = 'site_hq';
  String? _zone;
  int _sev = 2;
  int _like = 2;
  bool _anon = false;
  late DateTime _when = DateTime.now().subtract(const Duration(minutes: 30));
  bool _saving = false;
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    final site = ref
        .read(sessionControllerProvider)
        .value
        ?.profile
        .employee
        .site
        .id;
    if (site != null) _siteId = site;
  }

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  (int, String) get _risk => incidentScore(_sev, _like);

  bool get _isReady =>
      _title.text.trim().length >= 5 && _desc.text.trim().length >= 20;

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
      initialDate: _when,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_when),
    );
    if (t == null || !mounted) return;
    setState(() => _when = DateTime(d.year, d.month, d.day, t.hour, t.minute));
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_title.text.trim().length < 5) {
      AppToast.show(context, l10n.inErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_desc.text.trim().length < 20) {
      AppToast.show(context, l10n.inErrDesc, tone: StatusTone.warning);
      return;
    }
    final scored = _risk;
    if (scored.$2 == 'HIGH' || scored.$2 == 'EXTREME') {
      final ok = await showConfirmSheet(
        context,
        title: l10n.inConfirmSerious,
        message: l10n.inConfirmSeriousMsg,
        confirmLabel: l10n.inCreate,
      );
      if (!ok || !mounted) return;
    }
    setState(() => _saving = true);
    try {
      final i = await ref.read(incidentRepositoryProvider).create({
        'type': _type,
        'title': _title.text.trim(),
        'description': _desc.text.trim(),
        'siteId': _siteId,
        'zone': _zone,
        'occurredAt': Dhaka.toWire(_when),
        'severity': _sev,
        'likelihood': _like,
        'isAnonymous': _anon,
        if (_lat != null) 'lat': _lat,
        if (_lng != null) 'lng': _lng,
      });
      ref.invalidate(incidentsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.inDoneCreate, tone: StatusTone.success);
      context.go(AppRoutes.incidentDetail(i.id));
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.inErrFailed, tone: StatusTone.danger);
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
    final zones = ref.watch(incidentZonesProvider(_siteId)).asData?.value ?? [];
    final scored = _risk;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.inCreate,
        primaryIcon: Icons.health_and_safety_outlined,
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
            anonymousMode: _anon,
            badgeLabel: _anon
                ? (bangla ? 'গোপনীয় রিপোর্ট' : 'ANONYMOUS HSE')
                : (bangla ? 'এইচএসই রিপোর্ট' : 'HSE REPORT'),
            badgeIcon: Icons.health_and_safety_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.warning_amber_rounded,
            title: bangla
                ? 'ঘটনার ধরন, স্থাপনা ও সময়কাল'
                : 'Incident Classification, Facility & Time',
            subtitle: l10n.inFormIntro,
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.inFieldType,
                      icon: Icons.report_problem_outlined,
                      value: _type,
                      items: [
                        for (final t in incidentTypes)
                          DropdownMenuItem(
                            value: t,
                            child: Text(incidentTypeLabel(l10n, t)),
                          ),
                      ],
                      onChanged: (v) => setState(() => _type = v ?? _type),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.inFieldSite,
                      icon: Icons.factory_outlined,
                      value: _siteId,
                      items: [
                        DropdownMenuItem(
                          value: 'site_hq',
                          child: Text(l10n.visSiteHq),
                        ),
                        DropdownMenuItem(
                          value: 'site_plant',
                          child: Text(l10n.visSitePlant),
                        ),
                        DropdownMenuItem(
                          value: 'site_ctg',
                          child: Text(l10n.visSiteCtg),
                        ),
                      ],
                      onChanged: (v) => setState(() {
                        _siteId = v ?? _siteId;
                        _zone = null;
                      }),
                    ),
                  ),
                ],
              ),
              if (zones.isNotEmpty) ...[
                const SizedBox(height: Space.md),
                EnterpriseDropdownField<String?>(
                  label: l10n.inFieldZone,
                  icon: Icons.place_outlined,
                  value: _zone,
                  items: [
                    DropdownMenuItem<String?>(
                      child: Text(
                        bangla
                            ? 'সকল জোন / সাধারণ এলাকা'
                            : 'General / Any Zone',
                      ),
                    ),
                    for (final z in zones)
                      DropdownMenuItem(
                        value: z.name,
                        child: Text(z.label(bangla: bangla)),
                      ),
                  ],
                  onChanged: (v) => setState(() => _zone = v),
                ),
              ],
              const SizedBox(height: Space.md),
              EnterpriseDateTile(
                label: l10n.inFieldWhen,
                valueText: DateFmt.dateTime(_when, lang),
                icon: Icons.schedule_outlined,
                onTap: () => unawaited(_pickWhen()),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.description_outlined,
            title: bangla
                ? 'ঘটনার শিরোনাম ও বিস্তারিত পর্যবেক্ষণ'
                : 'Incident Summary & Detailed Observation',
            subtitle: bangla
                ? 'কমপক্ষে ২০ অক্ষরে ঘটনার বিবরণ ও তাৎক্ষণিক গৃহীত ব্যবস্থা লিখুন'
                : 'Describe what occurred and immediate containment actions taken (min 20 chars)',
            children: [
              AppTextField(
                label: l10n.inFieldTitle,
                controller: _title,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _incidentTemplates,
                controller: _desc,
                onPicked: () => setState(() {}),
                labelEn: 'Standard HSE Observation Template (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড এইচএসই পর্যবেক্ষণ (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.inFieldDesc,
                controller: _desc,
                maxLines: 4,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.grid_view_outlined,
            title: bangla
                ? '৫×৫ ঝুঁকি মূল্যায়ন ম্যাট্রিক্স ও জিপিএস'
                : '5×5 HSE Risk Matrix, GPS & Anonymity',
            subtitle: bangla ? 'তীব্রতা ও সম্ভাবনার মাত্রা নির্ধারণ করুন' : 'Assess severity × likelihood score and attach live GPS coordinates',
            trailing: StatusPill(
              label: l10n.inRiskLine(
                scored.$1,
                incidentRiskLabel(l10n, scored.$2),
              ),
              tone: incidentRiskTone(scored.$2),
            ),
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<int>(
                      label: l10n.inFieldSev(_sev),
                      icon: Icons.speed_outlined,
                      value: _sev,
                      items: [
                        for (var n = 1; n <= 5; n++)
                          DropdownMenuItem(
                            value: n,
                            child: Text(
                              bangla
                                  ? 'তীব্রতা স্তর $n / ৫'
                                  : 'Severity $n / 5',
                            ),
                          ),
                      ],
                      onChanged: (v) => setState(() => _sev = v ?? _sev),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<int>(
                      label: l10n.inFieldLike(_like),
                      icon: Icons.trending_up_outlined,
                      value: _like,
                      items: [
                        for (var n = 1; n <= 5; n++)
                          DropdownMenuItem(
                            value: n,
                            child: Text(
                              bangla
                                  ? 'সম্ভাবনা স্তর $n / ৫'
                                  : 'Likelihood $n / 5',
                            ),
                          ),
                      ],
                      onChanged: (v) => setState(() => _like = v ?? _like),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              InkWell(
                borderRadius: BorderRadius.circular(Radii.md),
                onTap: () async {
                  try {
                    final fix = await ref
                        .read(locationServiceProvider)
                        .capture();
                    if (!mounted) return;
                    setState(() {
                      _lat = fix.lat;
                      _lng = fix.lng;
                    });
                  } on Object {
                    if (!context.mounted) return;
                    AppToast.show(context, l10n.attLocUnavailable);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(
                      color: _lat != null
                          ? context.bogcl.success
                          : cs.outlineVariant,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _lat != null
                            ? Icons.gps_fixed
                            : Icons.my_location_outlined,
                        color: _lat != null
                            ? context.bogcl.success
                            : cs.primary,
                      ),
                      const SizedBox(width: Space.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.inGps,
                              style: theme.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              _lat == null
                                  ? (bangla
                                        ? 'ঘটনাস্থলের জিপিএস স্থানাঙ্ক যুক্ত করতে ট্যাপ করুন'
                                        : 'Tap to lock live GPS coordinates of incident spot')
                                  : '${l10n.inGpsOn} (${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)})',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Space.xs),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.inFieldAnon),
                subtitle: Text(l10n.inFieldAnonHelp),
                value: _anon,
                onChanged: (v) => setState(() => _anon = v),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseWorkflowCard(
            title: bangla
                ? 'এইচএসই তদন্ত ও কাপ্পা (CAPA) প্রক্রিয়া'
                : 'HSE Triage, Root-Cause & CAPA Workflow',
            steps: [
              (
                Icons.notification_important_outlined,
                bangla ? 'রিপোর্ট দাখিল' : 'Logged',
                bangla ? 'এইচএসই অ্যালার্ট' : 'HSE Alerted',
              ),
              (
                Icons.search_outlined,
                bangla ? '৫-হোয়াই তদন্ত' : '5-Why RCA',
                bangla ? 'মূল কারণ নির্ণয়' : 'Investigation',
              ),
              (
                Icons.task_alt_outlined,
                bangla ? 'কাপ্পা (CAPA)' : 'CAPA Closure',
                bangla ? 'প্রতিরোধমূলক ব্যবস্থা' : 'Verified Fix',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
