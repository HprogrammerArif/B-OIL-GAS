import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _licenceTitlePresets = <(String, String)>[
  (
    'Department of Explosives — LPG Storage & Bottling Licence (Sphere #1 & #2)',
    'বিস্ফোরক পরিদপ্তর — এলপিজি স্টোরেজ ও বোতলজাতকরণ লাইসেন্স (স্ফিয়ার #১ ও #২)',
  ),
  (
    'Fire Service & Civil Defence — Industrial Fire Safety Certificate',
    'ফায়ার সার্ভিস ও সিভিল ডিফেন্স — ইন্ডাস্ট্রিয়াল ফায়ার সেফটি সার্টিফিকেট',
  ),
  (
    'Department of Environment — Environmental Clearance Certificate (Red Category)',
    'পরিবেশ অধিদপ্তর — পরিবেশগত ছাড়পত্র (লাল শ্রেণি)',
  ),
  (
    'BERC — LPG Downstream Storage, Bottling & Distribution Licence',
    'বিইআরসি — এলপিজি ডাউনস্ট্রিম স্টোরেজ, বোতলজাতকরণ ও বিতরণ লাইসেন্স',
  ),
];

class LicenceNewScreen extends ConsumerStatefulWidget {
  const LicenceNewScreen({super.key});

  @override
  ConsumerState<LicenceNewScreen> createState() => _LicenceNewScreenState();
}

class _LicenceNewScreenState extends ConsumerState<LicenceNewScreen> {
  final _title = TextEditingController();
  final _no = TextEditingController();
  final _fee = TextEditingController();
  String _typeId = 'lt_expl';
  String _siteId = 'site_plant';
  DateTime _expires = DateTime.now().add(const Duration(days: 180));
  String? _ownerId;
  String? _ownerName;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    final site = s?.profile.employee.site.id;
    if (site != null) _siteId = site;
    _ownerId = s?.profile.id;
    _ownerName = s?.profile.employee.fullName;
  }

  @override
  void dispose() {
    _title.dispose();
    _no.dispose();
    _fee.dispose();
    super.dispose();
  }

  bool get _isReady =>
      _title.text.trim().length >= 3 && _no.text.trim().length >= 2;

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_title.text.trim().length < 3) {
      AppToast.show(context, l10n.cpErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_no.text.trim().length < 2) {
      AppToast.show(context, l10n.cpErrNo, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(licenceRepositoryProvider).create({
        'title': _title.text.trim(),
        'licenceNo': _no.text.trim(),
        'typeId': _typeId,
        'siteId': _siteId,
        'ownerUserId': _ownerId,
        'expiresAt': _expires.toIso8601String(),
        'feeAmount': double.tryParse(_fee.text.replaceAll(',', '')) ?? 0,
      });
      ref.invalidate(licencesProvider);
      if (!mounted) return;
      context.go(AppRoutes.licenceDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.cpErrFailed,
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
    final types = ref.watch(licenceTypesProvider).asData?.value ?? [];
    if (types.isNotEmpty && !types.any((t) => t.id == _typeId)) {
      _typeId = types.first.id;
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.cpNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.cpNew,
        primaryIcon: Icons.verified_user_outlined,
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
            badgeLabel: bangla ? 'কমপ্লায়েন্স নিবন্ধন' : 'STATUTORY PERMIT',
            badgeIcon: Icons.gavel_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.policy_outlined,
            title: bangla
                ? 'লাইসেন্সের ধরন ও স্থাপনা'
                : 'Permit Classification & Facility Site',
            subtitle: l10n.cpNewIntro,
            children: [
              Row(
                children: [
                  if (types.isNotEmpty)
                    Expanded(
                      child: EnterpriseDropdownField<String>(
                        label: l10n.cpFieldKind,
                        icon: Icons.workspace_premium_outlined,
                        value: _typeId,
                        items: [
                          for (final t in types)
                            DropdownMenuItem(
                              value: t.id,
                              child: Text(t.display(bangla: bangla)),
                            ),
                        ],
                        onChanged: (v) =>
                            setState(() => _typeId = v ?? _typeId),
                      ),
                    ),
                  if (types.isNotEmpty) const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.cpFieldSite,
                      icon: Icons.factory_outlined,
                      value: _siteId,
                      items: [
                        DropdownMenuItem(
                          value: 'site_hq',
                          child: Text(l10n.cpSiteHq),
                        ),
                        DropdownMenuItem(
                          value: 'site_plant',
                          child: Text(l10n.cpSitePlant),
                        ),
                      ],
                      onChanged: (v) => setState(() => _siteId = v ?? _siteId),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _licenceTitlePresets,
                controller: _title,
                onPicked: () => setState(() {}),
                labelEn: 'Standard Statutory Permit Title (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড লাইসেন্স শিরোনাম (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.cpFieldTitle,
                controller: _title,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.pin_outlined,
            title: bangla
                ? 'লাইসেন্স নম্বর, মেয়াদ ও নবায়ন ফি'
                : 'Licence Number, Expiry & Statutory Fee',
            subtitle: bangla
                ? 'সনদ নম্বর, মেয়াদের তারিখ এবং সরকারি নবায়ন ফি উল্লেখ করুন'
                : 'Enter official certificate number, expiry date, and government fee',
            children: [
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.cpFieldNo,
                      controller: _no,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: AppTextField(
                      label: l10n.cpFieldFee,
                      controller: _fee,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseDateTile(
                label: l10n.cpFieldExpiry,
                valueText: DateFmt.date(_expires, lang),
                icon: Icons.event_repeat_outlined,
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now().subtract(
                      const Duration(days: 30),
                    ),
                    lastDate: DateTime.now().add(const Duration(days: 2000)),
                    initialDate: _expires,
                  );
                  if (d != null) setState(() => _expires = d);
                },
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.admin_panel_settings_outlined,
            title: bangla
                ? 'দায়িত্বপ্রাপ্ত কর্মকর্তা (কাস্টডিয়ান)'
                : 'Designated Compliance Custodian',
            subtitle: bangla
                ? 'মেয়াদ উত্তীর্ণের পূর্বে স্বয়ংক্রিয় সতর্কবার্তা এই কর্মকর্তার নিকট যাবে'
                : 'Receives automated 90/60/30-day statutory renewal alerts',
            children: [
              InkWell(
                borderRadius: BorderRadius.circular(Radii.md),
                onTap: () async {
                  final pick = await showPersonPicker(
                    context,
                    title: l10n.cpFieldOwner,
                  );
                  if (pick == null) return;
                  setState(() {
                    _ownerId = pick.person.userId;
                    _ownerName = pick.person.display(bangla: bangla);
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(color: cs.outlineVariant),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.person_pin_outlined, color: cs.primary),
                      const SizedBox(width: Space.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.cpFieldOwner,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _ownerName ?? l10n.cpFieldOwnerMe,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: cs.primary),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseWorkflowCard(
            title: bangla
                ? 'কমপ্লায়েন্স ট্র্যাকিং ও নবায়ন সতর্কতা'
                : 'Statutory Compliance & Renewal Escalation',
            steps: [
              (
                Icons.verified_outlined,
                bangla ? 'রেজিস্টার এন্ট্রি' : 'Vault Logged',
                bangla ? 'সনদ সংযুক্ত' : 'Permit Active',
              ),
              (
                Icons.notifications_active_outlined,
                bangla ? '৯০/৬০/৩০ দিন' : '90/60/30d Alert',
                bangla ? 'স্বয়ংক্রিয় রিমাইন্ডার' : 'Custodian Ping',
              ),
              (
                Icons.autorenew_outlined,
                bangla ? 'নবায়ন ও ফি' : 'Renewal Cycle',
                bangla ? 'চেয়ারম্যান ড্যাশবোর্ড' : 'Board Visibility',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
