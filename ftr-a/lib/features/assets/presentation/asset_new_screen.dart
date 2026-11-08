import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _assetNamePresets = <(String, String)>[
  (
    'Kosan Crisplant Rotary LPG Cylinder Filling Carousel (24-Point)',
    'কোসান ক্রিসপ্ল্যান্ট রোটারি এলপিজি সিলিন্ডার ফিলিং ক্যারোসেল (২৪-পয়েন্ট)',
  ),
  (
    'Corken Industrial LPG Bypass & Transfer Pump Assembly',
    'করকেন ইন্ডাস্ট্রিয়াল এলপিজি বাইপাস ও ট্রান্সফার পাম্প অ্যাসেম্বলি',
  ),
  (
    'Honeywell Fixed Combustible Gas & Flame Detector Array',
    'হানিওয়েল ফিক্সড কমবাস্টিবল গ্যাস ও ফ্লেম ডিটেক্টর অ্যারে',
  ),
  (
    'Cummins 500 kVA Prime Diesel Standby Generator Set',
    'কামিন্স ৫০০ কেভিএ প্রাইম ডিজেল স্ট্যান্ডবাই জেনারেটর সেট',
  ),
];

class AssetNewScreen extends ConsumerStatefulWidget {
  const AssetNewScreen({super.key});

  @override
  ConsumerState<AssetNewScreen> createState() => _AssetNewScreenState();
}

class _AssetNewScreenState extends ConsumerState<AssetNewScreen> {
  final _name = TextEditingController();
  final _cost = TextEditingController();
  final _life = TextEditingController(text: '8');
  final _location = TextEditingController();
  String _categoryId = 'cat_plant';
  String _siteId = 'site_plant';
  String _criticality = 'GENERAL_C';
  bool _commission = true;
  String? _custodianUserId;
  String? _custodianName;
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
    _cost.dispose();
    _life.dispose();
    _location.dispose();
    super.dispose();
  }

  bool get _isReady {
    final cost = double.tryParse(_cost.text.replaceAll(',', '')) ?? 0;
    final life = int.tryParse(_life.text) ?? 0;
    return _name.text.trim().length >= 3 && cost > 0 && life >= 1;
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final cost = double.tryParse(_cost.text.replaceAll(',', '')) ?? 0;
    final life = int.tryParse(_life.text) ?? 0;
    if (_name.text.trim().length < 3) {
      AppToast.show(context, l10n.asErrName, tone: StatusTone.warning);
      return;
    }
    if (cost <= 0) {
      AppToast.show(context, l10n.asErrCost, tone: StatusTone.warning);
      return;
    }
    if (life < 1) {
      AppToast.show(context, l10n.asErrLife, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(assetRepositoryProvider).create({
        'name': _name.text.trim(),
        'categoryId': _categoryId,
        'siteId': _siteId,
        'purchaseCost': cost,
        'usefulLifeYears': life,
        'criticality': _criticality,
        'location': _location.text.trim().isEmpty
            ? null
            : _location.text.trim(),
        'commissionNow': _commission,
        'custodianUserId': ?_custodianUserId,
      });
      ref.invalidate(assetsProvider);
      if (!mounted) return;
      context.go(AppRoutes.assetDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.asErrFailed,
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
    final cats = ref.watch(assetCategoriesProvider).asData?.value ?? [];
    if (cats.isNotEmpty && !cats.any((c) => c.id == _categoryId)) {
      _categoryId = cats.first.id;
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.asNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.asNew,
        primaryIcon: Icons.precision_manufacturing_outlined,
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
            badgeLabel: bangla ? 'স্থায়ী সম্পদ' : 'FIXED ASSET REGISTER',
            badgeIcon: Icons.precision_manufacturing_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.category_outlined,
            title: bangla
                ? 'সম্পদের শ্রেণিবিন্যাস ও স্থাপনা'
                : 'Asset Classification & Facility Site',
            subtitle: l10n.asNewIntro,
            children: [
              Row(
                children: [
                  if (cats.isNotEmpty)
                    Expanded(
                      child: EnterpriseDropdownField<String>(
                        label: l10n.asFieldCategory,
                        icon: Icons.layers_outlined,
                        value: _categoryId,
                        items: [
                          for (final c in cats)
                            DropdownMenuItem(
                              value: c.id,
                              child: Text(c.display(bangla: bangla)),
                            ),
                        ],
                        onChanged: (v) =>
                            setState(() => _categoryId = v ?? _categoryId),
                      ),
                    ),
                  if (cats.isNotEmpty) const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.asFieldSite,
                      icon: Icons.domain_outlined,
                      value: _siteId,
                      items: [
                        DropdownMenuItem(
                          value: 'site_hq',
                          child: Text(l10n.asSiteHq),
                        ),
                        DropdownMenuItem(
                          value: 'site_plant',
                          child: Text(l10n.asSitePlant),
                        ),
                        DropdownMenuItem(
                          value: 'site_ctg',
                          child: Text(l10n.asSiteCtg),
                        ),
                      ],
                      onChanged: (v) => setState(() => _siteId = v ?? _siteId),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _assetNamePresets,
                controller: _name,
                onPicked: () => setState(() {}),
                labelEn: 'Standard BOGCL Plant/Office Asset (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড সম্পদের নাম (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.asFieldName,
                controller: _name,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.account_balance_outlined,
            title: bangla
                ? 'ক্রয়মূল্য, আয়ুষ্কাল ও অবস্থান'
                : 'Valuation, Useful Life & Physical Location',
            subtitle: bangla
                ? 'অবচয় (Depreciation) গণনার জন্য ক্রয়মূল্য ও আয়ুষ্কাল উল্লেখ করুন'
                : 'Used for automated straight-line depreciation and ledger book value',
            children: [
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.asFieldCost,
                      controller: _cost,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: AppTextField(
                      label: l10n.asFieldLife,
                      controller: _life,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              AppTextField(label: l10n.asFieldLocation, controller: _location),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.verified_user_outlined,
            title: bangla
                ? 'গুরুত্বের স্তর, কমিশনিং ও কাস্টডিয়ান'
                : 'Criticality Class, Commissioning & Custodian',
            subtitle: bangla
                ? 'প্ল্যান্ট নিরাপত্তার গুরুত্ব এবং দায়িত্বপ্রাপ্ত কর্মকর্তা নির্ধারণ করুন'
                : 'Set operational criticality tier and assign asset custodian',
            children: [
              EnterpriseDropdownField<String>(
                label: l10n.asFieldCritical,
                icon: Icons.priority_high_outlined,
                value: _criticality,
                items: [
                  DropdownMenuItem(
                    value: 'GENERAL_C',
                    child: Text(l10n.asCritC),
                  ),
                  DropdownMenuItem(
                    value: 'ESSENTIAL_B',
                    child: Text(l10n.asCritB),
                  ),
                  DropdownMenuItem(
                    value: 'CRITICAL_A',
                    child: Text(l10n.asCritA),
                  ),
                ],
                onChanged: (v) =>
                    setState(() => _criticality = v ?? _criticality),
              ),
              const SizedBox(height: Space.sm),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.asFieldCommission),
                value: _commission,
                onChanged: (v) => setState(() => _commission = v),
              ),
              const SizedBox(height: Space.xs),
              InkWell(
                borderRadius: BorderRadius.circular(Radii.md),
                onTap: () async {
                  final pick = await showPersonPicker(
                    context,
                    title: l10n.asFieldHolder,
                  );
                  if (pick == null) return;
                  setState(() {
                    _custodianUserId = pick.person.userId;
                    _custodianName = pick.person.display(bangla: bangla);
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
                              l10n.asFieldHolder,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _custodianName ?? l10n.asFieldHolderNone,
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
                ? 'সম্পদ ট্যাগিং ও রক্ষণাবেক্ষণ চক্র'
                : 'Asset Tagging & Preventive Maintenance Lifecycle',
            steps: [
              (
                Icons.qr_code_2,
                bangla ? 'সম্পদ নিবন্ধন' : 'Asset Tagged',
                bangla ? 'কিউআর কোড' : 'QR Generated',
              ),
              (
                Icons.handyman_outlined,
                bangla ? 'পিএম শিডিউল' : 'PM Schedule',
                bangla ? 'পরিদর্শন চক্র' : 'Maintenance Cycle',
              ),
              (
                Icons.trending_down_outlined,
                bangla ? 'লেজার অবচয়' : 'Book Value',
                bangla ? 'বার্ষিক হিসাব' : 'Auto Depreciation',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
