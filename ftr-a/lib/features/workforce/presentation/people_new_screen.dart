import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/features/workforce/data/workforce_repository.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _designationPresets = <(String, String)>[
  ('Assistant Engineer (Operations)', 'সহকারী প্রকৌশলী (অপারেশনস)'),
  ('Senior Executive (HR & Admin)', 'সিনিয়র এক্সিকিউটিভ (এইচআর ও প্রশাসন)'),
  ('Safety & Compliance Officer (HSE)', 'সেফটি ও কমপ্লায়েন্স অফিসার (এইচএসই)'),
  ('Accounts Officer (Finance)', 'হিসাব রক্ষণ কর্মকর্তা (অর্থ)'),
  ('Plant Shift Supervisor', 'প্ল্যান্ট শিফট সুপারভাইজার'),
];

class PeopleNewScreen extends ConsumerStatefulWidget {
  const PeopleNewScreen({super.key});

  @override
  ConsumerState<PeopleNewScreen> createState() => _PeopleNewScreenState();
}

class _PeopleNewScreenState extends ConsumerState<PeopleNewScreen> {
  final _name = TextEditingController();
  final _nameBn = TextEditingController();
  final _title = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _nid = TextEditingController();
  String _dept = 'dept_hr';
  String _site = 'site_hq';
  String? _mgrUser;
  String? _mgrName;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _nameBn.dispose();
    _title.dispose();
    _phone.dispose();
    _email.dispose();
    _nid.dispose();
    super.dispose();
  }

  bool get _isReady =>
      _name.text.trim().length >= 2 &&
      _title.text.trim().length >= 2 &&
      _phone.text.trim().length >= 8;

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_name.text.trim().length < 2) {
      AppToast.show(context, l10n.emErrName, tone: StatusTone.warning);
      return;
    }
    if (_title.text.trim().length < 2) {
      AppToast.show(context, l10n.emErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_phone.text.trim().length < 8) {
      AppToast.show(context, l10n.emErrPhone, tone: StatusTone.warning);
      return;
    }
    final nid = _nid.text.replaceAll(RegExp(r'\D'), '');
    if (nid.isNotEmpty &&
        nid.length != 10 &&
        nid.length != 13 &&
        nid.length != 17) {
      AppToast.show(context, l10n.emErrNid, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(workforceRepositoryProvider).create({
        'fullName': _name.text.trim(),
        'fullNameBn': _nameBn.text.trim(),
        'title': _title.text.trim(),
        'phone': _phone.text.trim(),
        'email': _email.text.trim(),
        if (nid.isNotEmpty) 'nationalId': nid,
        'departmentId': _dept,
        'siteId': _site,
        if (_mgrUser != null) 'lineManagerUserId': _mgrUser,
      });
      ref.invalidate(staffListProvider);
      if (!mounted) return;
      context.go(AppRoutes.peopleDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
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

    const depts = [
      ('dept_hr', 'HR & Administration', 'এইচআর ও প্রশাসন'),
      ('dept_fin', 'Finance & Accounts', 'অর্থ ও হিসাব'),
      ('dept_plant', 'Plant Operations', 'প্ল্যান্ট অপারেশনস'),
      ('dept_hse', 'HSE & Compliance', 'এইচএসই ও কমপ্লায়েন্স'),
      ('dept_sales', 'Sales & Distribution', 'বিক্রয় ও বিতরণ'),
      ('dept_trans', 'Transport & Fleet', 'পরিবহন ও ফ্লিট'),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.emNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.emNew,
        primaryIcon: Icons.person_add_alt_1_outlined,
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
            badgeLabel: bangla ? 'এইচআর অনবোর্ডিং' : 'HR ONBOARDING',
            badgeIcon: Icons.badge_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.person_outline,
            title: bangla
                ? 'কর্মকর্তা / কর্মচারীর পরিচয় ও পদবি'
                : 'Employee Identity & Designation',
            subtitle: l10n.emNewIntro,
            children: [
              AppTextField(
                label: l10n.emFieldName,
                controller: _name,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: Space.md),
              AppTextField(label: l10n.emFieldNameBn, controller: _nameBn),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _designationPresets,
                controller: _title,
                onPicked: () => setState(() {}),
                labelEn: 'Standard BOGCL Designation (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড পদবি নির্বাচন (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.emFieldTitle,
                controller: _title,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.contact_phone_outlined,
            title: bangla
                ? 'যোগাযোগের তথ্য ও জাতীয় পরিচয়পত্র'
                : 'Official Contact & National ID',
            subtitle: bangla
                ? 'দাপ্তরিক মোবাইল নম্বর, ইমেইল এবং এনআইডি নম্বর প্রদান করুন'
                : 'Provide mobile phone, corporate email, and 10/13/17-digit NID',
            children: [
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.emFieldPhone,
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: AppTextField(
                      label: l10n.emFieldEmail,
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.emFieldNid,
                controller: _nid,
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.account_tree_outlined,
            title: bangla
                ? 'বিভাগ, কর্মস্থল ও রিপোর্টিং কর্মকর্তা'
                : 'Department, Duty Site & Reporting Line',
            subtitle: bangla
                ? 'বিভাগ, কর্মস্থল এবং লাইন ম্যানেজার নির্ধারণ করুন'
                : 'Assign department, primary duty station, and line manager',
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.emFieldDept,
                      icon: Icons.apartment_outlined,
                      value: _dept,
                      items: [
                        for (final d in depts)
                          DropdownMenuItem(
                            value: d.$1,
                            child: Text(bangla ? d.$3 : d.$2),
                          ),
                      ],
                      onChanged: (v) => setState(() => _dept = v ?? _dept),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.emFieldSite,
                      icon: Icons.location_on_outlined,
                      value: _site,
                      items: [
                        DropdownMenuItem(
                          value: 'site_hq',
                          child: Text(
                            bangla ? 'প্রধান কার্যালয়' : 'Head office',
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'site_plant',
                          child: Text(
                            bangla
                                ? 'কেরানীগঞ্জ প্ল্যান্ট'
                                : 'Keraniganj plant',
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() => _site = v ?? _site),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              InkWell(
                borderRadius: BorderRadius.circular(Radii.md),
                onTap: () async {
                  final p = await showPersonPicker(
                    context,
                    title: l10n.emFieldManager,
                  );
                  if (p == null) return;
                  setState(() {
                    _mgrUser = p.person.userId;
                    _mgrName = p.person.display(bangla: bangla);
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
                      Icon(
                        Icons.supervisor_account_outlined,
                        color: cs.primary,
                      ),
                      const SizedBox(width: Space.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.emFieldManager,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _mgrName ?? l10n.emFieldManagerHint,
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
                ? 'কর্মী প্রোফাইল ও অ্যাক্সেস সক্রিয়করণ'
                : 'Employee Provisioning & Access Workflow',
            steps: [
              (
                Icons.badge_outlined,
                bangla ? 'এইচআর এন্ট্রি' : 'HR Master File',
                bangla ? 'আইডি জেনারেশন' : 'ID Assigned',
              ),
              (
                Icons.fingerprint,
                bangla ? 'হাজিরা ও ছুটি' : 'Attendance & Leave',
                bangla ? 'কোটা চালু' : 'Quota Seeded',
              ),
              (
                Icons.verified_user_outlined,
                bangla ? 'লাইন ম্যানেজার' : 'Line Manager',
                bangla ? 'অনুমোদন চেইন' : 'Routing Active',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
