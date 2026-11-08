import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _visitorTemplates = <(String, String)>[
  (
    'Official vendor coordination meeting regarding LPG cylinder valve supply and technical inspection.',
    'এলপিজি সিলিন্ডার ভালভ সরবরাহ ও কারিগরি পরিদর্শন সংক্রান্ত দাপ্তরিক ভেন্ডর সমন্বয় সভা।',
  ),
  (
    'Statutory safety inspection and compliance walkthrough with Department of Explosives / BERC officials.',
    'বিস্ফোরক পরিদপ্তর / বিইআরসি কর্মকর্তাদের সাথে বিধিবদ্ধ নিরাপত্তা পরিদর্শন ও কমপ্লায়েন্স ওয়াকথ্রু।',
  ),
  (
    'Scheduled plant engineering maintenance and calibration work at Keraniganj Filling Plant.',
    'কেরানীগঞ্জ ফিলিং প্ল্যান্টে নির্ধারিত ইঞ্জিনিয়ারিং রক্ষণাবেক্ষণ ও ক্যালিব্রেশন কাজ।',
  ),
  (
    'Executive courtesy call and corporate audit review at Head Office, Baridhara.',
    'বারিধারা প্রধান কার্যালয়ে নির্বাহীদের সৌজন্য সাক্ষাৎ এবং কর্পোরেট অডিট পর্যালোচনা।',
  ),
];

class VisitorRegisterScreen extends ConsumerStatefulWidget {
  const VisitorRegisterScreen({super.key});

  @override
  ConsumerState<VisitorRegisterScreen> createState() =>
      _VisitorRegisterScreenState();
}

class _VisitorRegisterScreenState extends ConsumerState<VisitorRegisterScreen> {
  final _name = TextEditingController();
  final _org = TextEditingController();
  final _phone = TextEditingController();
  final _purpose = TextEditingController();
  final _idNo = TextEditingController();
  final _plate = TextEditingController();
  String _category = 'REGULAR';
  String _siteId = 'site_hq';
  String _idType = 'NID';
  late DateTime _when = DateTime.now().add(const Duration(hours: 2));
  final Set<String> _zones = {};
  Map<String, String> _errors = {};
  bool _saving = false;

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
    _name.dispose();
    _org.dispose();
    _phone.dispose();
    _purpose.dispose();
    _idNo.dispose();
    _plate.dispose();
    super.dispose();
  }

  bool get _idNeeded => const {'VIP', 'GOVT', 'CONTRACTOR'}.contains(_category);

  bool get _isReady =>
      _name.text.trim().length >= 2 &&
      _phone.text.trim().length >= 8 &&
      _purpose.text.trim().length >= 5 &&
      (!_idNeeded || _idNo.text.trim().length >= 4);

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 14)),
      initialDate: _when,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_when),
    );
    if (t == null || !mounted) return;
    setState(() {
      _when = DateTime(d.year, d.month, d.day, t.hour, t.minute);
    });
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    final errors = <String, String>{};
    if (_name.text.trim().length < 2) errors['fullName'] = l10n.visErrName;
    if (_phone.text.trim().length < 8) errors['phone'] = l10n.visErrPhone;
    if (_purpose.text.trim().length < 5) errors['purpose'] = l10n.visErrPurpose;
    if (_idNeeded && _idNo.text.trim().length < 4) {
      errors['idProofNo'] = l10n.visErrId;
    }
    if (errors.isNotEmpty) {
      setState(() => _errors = errors);
      return;
    }
    setState(() {
      _errors = {};
      _saving = true;
    });
    try {
      final saved = await ref.read(visitorRepositoryProvider).create({
        'fullName': _name.text.trim(),
        'organisation': _org.text.trim().isEmpty ? null : _org.text.trim(),
        'phone': _phone.text.trim(),
        'category': _category,
        if (_category == 'VIP') 'vipTier': 'VIP',
        'purpose': _purpose.text.trim(),
        'expectedAt': _when.toUtc().toIso8601String(),
        'siteId': _siteId,
        'zones': [
          for (final z in _zones) {'id': z},
        ],
        if (_idNeeded) 'idProofType': _idType,
        if (_idNeeded) 'idProofNo': _idNo.text.trim(),
        if (_plate.text.trim().isNotEmpty) 'vehiclePlate': _plate.text.trim(),
      });
      ref.invalidate(visitsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.visDoneCreate, tone: StatusTone.success);
      context.pushReplacement(AppRoutes.visitDetail(saved.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.fieldErrors.isNotEmpty) {
        setState(() => _errors = e.fieldErrors);
      } else {
        AppToast.show(
          context,
          e.rule == 'VISITOR_BLACKLISTED'
              ? l10n.visErrBlacklist
              : l10n.visErrFailed,
          tone: StatusTone.danger,
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final zones = ref.watch(visitZonesProvider(_siteId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.visNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.visCreate,
        primaryIcon: Icons.badge_outlined,
        loading: _saving,
        isReady: _isReady,
        errorMessage: _errors.values.firstOrNull,
        onPrimaryPressed: () => unawaited(_save()),
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
            badgeLabel: bangla ? 'হোস্ট কর্মকর্তা' : 'HOST OFFICER',
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.person_outline,
            title: bangla
                ? 'অতিথির পরিচয় ও শ্রেণি'
                : 'Visitor Identity & Category',
            subtitle: l10n.visFormIntro,
            children: [
              EnterpriseDropdownField<String>(
                label: l10n.visFieldCategory,
                icon: Icons.category_outlined,
                value: _category,
                items: [
                  for (final c in visitCategories)
                    DropdownMenuItem(
                      value: c,
                      child: Text(visitCategoryLabel(l10n, c)),
                    ),
                ],
                onChanged: (v) => setState(() => _category = v ?? _category),
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.visFieldName,
                controller: _name,
                onChanged: (_) => setState(() => _errors.remove('fullName')),
                errorText: _errors['fullName'],
              ),
              const SizedBox(height: Space.md),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.visFieldOrg,
                      controller: _org,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: AppTextField(
                      label: l10n.visFieldPhone,
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      onChanged: (_) => setState(() => _errors.remove('phone')),
                      errorText: _errors['phone'],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.location_city_outlined,
            title: bangla
                ? 'পরিদর্শনের সময়সূচি, স্থাপনা ও উদ্দেশ্য'
                : 'Visit Schedule, Facility & Purpose',
            subtitle: bangla
                ? 'প্রত্যাশিত আগমনের সময়, স্থাপনা এবং অনুমোদিত জোন নির্বাচন করুন'
                : 'Select expected arrival time, facility site, and permitted zones',
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.visFieldSite,
                      icon: Icons.domain_outlined,
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
                        _zones.clear();
                      }),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseDateTile(
                label: l10n.visFieldWhen,
                valueText: DateFmt.dateTime(_when, lang),
                icon: Icons.event_available_outlined,
                onTap: () => unawaited(_pickWhen()),
              ),
              const SizedBox(height: Space.md),
              Text(l10n.visFieldZones, style: theme.textTheme.labelLarge),
              const SizedBox(height: Space.xs),
              zones.when(
                loading: () => const LinearProgressIndicator(),
                error: (_, _) => Text(l10n.commonErrorMessage),
                data: (list) => Wrap(
                  spacing: Space.sm,
                  runSpacing: Space.xs,
                  children: [
                    for (final z in list)
                      FilterChip(
                        label: Text(z.label(bangla: bangla)),
                        selected: _zones.contains(z.id),
                        onSelected: (on) => setState(
                          () => on ? _zones.add(z.id) : _zones.remove(z.id),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _visitorTemplates,
                controller: _purpose,
                onPicked: () => setState(() => _errors.remove('purpose')),
                labelEn: 'Standard Visit Purpose (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড পরিদর্শনের উদ্দেশ্য (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.visFieldPurpose,
                controller: _purpose,
                maxLines: 3,
                onChanged: (_) => setState(() => _errors.remove('purpose')),
                errorText: _errors['purpose'],
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.security_outlined,
            title: bangla
                ? 'নিরাপত্তা পরিচয়পত্র ও যানবাহন'
                : 'Security Clearance & Vehicle Access',
            subtitle: _idNeeded
                ? (bangla
                      ? 'এই শ্রেণির অতিথির জন্য সরকারি পরিচয়পত্র আবশ্যক'
                      : 'Mandatory government/official ID verification for this visitor category')
                : (bangla
                      ? 'গেট পাসের জন্য যানবাহনের নম্বর প্লেট (ঐচ্ছিক)'
                      : 'Optional vehicle registration plate for gate pass clearance'),
            children: [
              if (_idNeeded) ...[
                EnterpriseDropdownField<String>(
                  label: l10n.visFieldIdType,
                  icon: Icons.credit_card_outlined,
                  value: _idType,
                  items: [
                    DropdownMenuItem(value: 'NID', child: Text(l10n.visIdNid)),
                    DropdownMenuItem(
                      value: 'PASSPORT',
                      child: Text(l10n.visIdPass),
                    ),
                    DropdownMenuItem(
                      value: 'GOVT_BADGE',
                      child: Text(l10n.visIdGovt),
                    ),
                    DropdownMenuItem(
                      value: 'COMPANY_ID',
                      child: Text(l10n.visIdCo),
                    ),
                  ],
                  onChanged: (v) => setState(() => _idType = v ?? _idType),
                ),
                const SizedBox(height: Space.md),
                AppTextField(
                  label: l10n.visFieldIdNo,
                  controller: _idNo,
                  onChanged: (_) => setState(() => _errors.remove('idProofNo')),
                  errorText: _errors['idProofNo'],
                ),
                const SizedBox(height: Space.md),
              ],
              AppTextField(label: l10n.visFieldPlate, controller: _plate),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseWorkflowCard(
            title: bangla
                ? 'গেট নিরাপত্তা ও ব্যাজ ইস্যু প্রক্রিয়া'
                : 'Gate Security & Visitor Pass Workflow',
            steps: [
              (
                Icons.person_add_alt_1_outlined,
                bangla ? 'হোস্ট প্রি-রেজিস্টার' : 'Host Pre-Invite',
                bangla ? 'পাস সংরক্ষিত' : 'Pass Reserved',
              ),
              (
                Icons.shield_outlined,
                bangla ? 'প্রধান ফটক যাচাই' : 'Main Gate Check',
                bangla ? 'আইডি ও ব্রিফিং' : 'ID & HSE Brief',
              ),
              (
                Icons.qr_code_scanner_outlined,
                bangla ? 'ব্যাজ ও প্রবেশ' : 'Badge Issued',
                bangla ? 'হোস্ট নোটিফাইড' : 'Host Alerted',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
