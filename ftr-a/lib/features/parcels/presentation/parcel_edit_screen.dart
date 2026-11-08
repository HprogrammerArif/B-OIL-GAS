import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _handlings = ['FRAGILE', 'COLD_CHAIN', 'HAZMAT', 'KEEP_UPRIGHT'];

const _parcelTemplates = <(String, String)>[
  (
    'Sealed tender evaluation dossier and bank guarantee original documents for Finance & Procurement Division.',
    'অর্থ ও ক্রয় বিভাগের জন্য সিলকৃত দরপত্র মূল্যায়ন নথি এবং ব্যাংক গ্যারান্টির মূল কপি।',
  ),
  (
    'Calibrated pressure gauge assembly and safety valve spares dispatched to Keraniganj LPG Filling Plant.',
    'কেরানীগঞ্জ এলপিজি ফিলিং প্ল্যান্টে প্রেরিত ক্যালিব্রেটেড প্রেসার গেজ অ্যাসেম্বলি এবং সেফটি ভালভ স্পেয়ারস।',
  ),
  (
    'Signed statutory compliance certificates and Department of Explosives licence renewal files.',
    'স্বাক্ষরিত বিধিবদ্ধ কমপ্লায়েন্স সার্টিফিকেট এবং বিস্ফোরক পরিদপ্তরের লাইসেন্স নবায়ন ফাইল।',
  ),
  (
    'IT hardware kit (configured corporate tablet and security token) for site operations officer.',
    'সাইট অপারেশন কর্মকর্তার জন্য আইটি হার্ডওয়্যার কিট (কনফিগার করা কর্পোরেট ট্যাবলেট ও সিকিউরিটি টোকেন)।',
  ),
];

/// Send a parcel (or fix one that has not been handed over yet).
class ParcelEditScreen extends ConsumerWidget {
  const ParcelEditScreen({this.id, super.key});

  final String? id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = this.id;
    if (id == null) return const _Form();
    return ref
        .watch(parcelDetailProvider(id))
        .when(
          loading: () => Scaffold(appBar: AppBar(), body: const SkeletonList()),
          error: (_, _) => Scaffold(
            appBar: AppBar(),
            body: ErrorState(
              onRetry: () => ref.invalidate(parcelDetailProvider(id)),
            ),
          ),
          data: (p) => _Form(parcel: p),
        );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({this.parcel});

  final Parcel? parcel;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  late final _description = TextEditingController(
    text: widget.parcel?.description,
  );
  late final _value = TextEditingController(
    text: widget.parcel?.declaredValue?.round().toString(),
  );
  late final _weight = TextEditingController(
    text: widget.parcel?.weightKg?.toString(),
  );
  late final _waybill = TextEditingController(text: widget.parcel?.waybillNo);
  late String _category = widget.parcel?.category ?? 'GENERAL';
  late String _urgency = widget.parcel?.urgency ?? 'NORMAL';
  late bool _confidential = widget.parcel?.isConfidential ?? false;
  late final Set<String> _handling = {...?widget.parcel?.specialHandling};
  late Person? _recipient = widget.parcel?.recipient;
  late String? _recipientWhere = widget.parcel?.dest.label(
    bangla: context.isBangla,
  );
  Map<String, String> _errors = {};
  bool _saving = false;

  @override
  void dispose() {
    _description.dispose();
    _value.dispose();
    _weight.dispose();
    _waybill.dispose();
    super.dispose();
  }

  bool get _forcedConfidential =>
      const {'CONFIDENTIAL', 'LEGAL_DOCS', 'TENDER_BID'}.contains(_category);

  bool get _isReady =>
      _recipient != null && _description.text.trim().length >= 5;

  Future<void> _pickRecipient() async {
    final pick = await showPersonPicker(
      context,
      title: context.l10n.pcFieldRecipient,
    );
    if (pick == null || !mounted) return;
    setState(() {
      _recipient = pick.person;
      _recipientWhere = pick.where(bangla: context.isBangla);
      _errors.remove('recipient');
    });
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    final errors = <String, String>{};
    if (_description.text.trim().length < 5) {
      errors['description'] = l10n.pcErrDescription;
    }
    if (_recipient == null) errors['recipient'] = l10n.pcErrRecipient;
    final value = _value.text.trim().isEmpty
        ? null
        : double.tryParse(_value.text.trim());
    if (_value.text.trim().isNotEmpty && value == null) {
      errors['value'] = l10n.pcErrNumber;
    }
    final weight = _weight.text.trim().isEmpty
        ? null
        : double.tryParse(_weight.text.trim());
    if (_weight.text.trim().isNotEmpty && (weight == null || weight <= 0)) {
      errors['weight'] = l10n.pcErrNumber;
    }
    if (_waybill.text.trim().isNotEmpty && _waybill.text.trim().length < 3) {
      errors['waybill'] = l10n.pcErrWaybill;
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
      final saved = await ref
          .read(parcelRepositoryProvider)
          .save(
            id: widget.parcel?.id,
            body: {
              'category': _category,
              'description': _description.text.trim(),
              'urgency': _urgency,
              'recipientUserId': _recipient!.userId,
              'declaredValue': value,
              'weightKg': weight,
              'waybillNo': _waybill.text.trim().isEmpty
                  ? null
                  : _waybill.text.trim(),
              'specialHandling': _handling.toList(),
              'isConfidential': _confidential || _forcedConfidential,
            },
          );
      ref
        ..invalidate(parcelsProvider)
        ..invalidate(parcelDetailProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        widget.parcel == null ? l10n.pcDoneCreate : l10n.pcDoneEdit,
        tone: StatusTone.success,
      );
      if (widget.parcel == null) {
        context.pushReplacement(AppRoutes.parcelDetail(saved.id));
      } else {
        context.pop();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      final fields = e.fieldErrors;
      if (fields.isNotEmpty) {
        setState(() => _errors = fields);
      } else {
        AppToast.show(
          context,
          e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
              ? l10n.claimErrOffline
              : l10n.pcErrFailed,
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
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final editing = widget.parcel != null;
    final recipient = _recipient;

    return Scaffold(
      appBar: AppBar(title: Text(editing ? l10n.pcEditTitle : l10n.pcSend)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: editing ? l10n.pcSaveChanges : l10n.pcCreate,
        primaryIcon: Icons.local_shipping_outlined,
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
            badgeLabel: editing
                ? (bangla ? 'পার্সেল সম্পাদনা' : 'EDIT PARCEL')
                : (bangla ? 'নতুন ডেসপ্যাচ' : 'NEW DISPATCH'),
            badgeIcon: Icons.inventory_2_outlined,
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 1,
            icon: Icons.person_pin_circle_outlined,
            title: bangla
                ? 'প্রাপক ও গন্তব্য নির্ধারণ'
                : 'Recipient & Destination Routing',
            subtitle: l10n.pcFormIntro,
            children: [
              InkWell(
                borderRadius: BorderRadius.circular(Radii.md),
                onTap: () => unawaited(_pickRecipient()),
                child: Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(
                      color: _errors['recipient'] != null
                          ? context.bogcl.danger
                          : cs.primary.withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: cs.primary.withValues(alpha: 0.12),
                        child: Icon(
                          Icons.person_outline,
                          color: cs.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: Space.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.pcFieldRecipient,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              recipient == null
                                  ? l10n.pcPickRecipient
                                  : recipient.display(bangla: bangla),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (recipient != null)
                              Text(
                                [
                                  ?recipient.title,
                                  ?_recipientWhere,
                                ].join(' · '),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                              )
                            else if (_errors['recipient'] != null)
                              Text(
                                _errors['recipient']!,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: context.bogcl.danger,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Icon(Icons.search, color: cs.primary),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 2,
            icon: Icons.category_outlined,
            title: bangla
                ? 'পার্সেলের বিবরণ ও জরুরিতা'
                : 'Parcel Classification & Contents',
            subtitle: bangla
                ? 'ক্যাটাগরি, জরুরিতা এবং বিষয়বস্তুর বিবরণ দিন'
                : 'Select category, urgency tier, and itemised description',
            children: [
              Row(
                children: [
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.pcFieldCategory,
                      icon: Icons.folder_special_outlined,
                      value: _category,
                      items: [
                        for (final c in parcelCategories)
                          DropdownMenuItem(
                            value: c,
                            child: Text(parcelCategoryLabel(l10n, c)),
                          ),
                      ],
                      onChanged: (v) =>
                          setState(() => _category = v ?? _category),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: EnterpriseDropdownField<String>(
                      label: l10n.pcFieldUrgency,
                      icon: Icons.bolt_outlined,
                      value: _urgency,
                      items: [
                        DropdownMenuItem(
                          value: 'NORMAL',
                          child: Text(l10n.pcUrgNormal),
                        ),
                        DropdownMenuItem(
                          value: 'HIGH',
                          child: Text(l10n.nsUrgHigh),
                        ),
                        DropdownMenuItem(
                          value: 'CRITICAL',
                          child: Text(l10n.nsUrgCritical),
                        ),
                      ],
                      onChanged: (v) =>
                          setState(() => _urgency = v ?? _urgency),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseTemplateDropdown(
                presets: _parcelTemplates,
                controller: _description,
                onPicked: () => setState(() => _errors.remove('description')),
                labelEn: 'Standard Parcel Description (Quick Fill)',
                labelBn: 'স্ট্যান্ডার্ড পার্সেল বিবরণ (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.pcFieldDescription,
                controller: _description,
                maxLines: 3,
                maxLength: 500,
                onChanged: (_) => setState(() {}),
                errorText: _errors['description'],
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseSectionCard(
            stepNumber: 3,
            icon: Icons.shield_outlined,
            title: bangla
                ? 'মূল্যমান, ওজন ও বিশেষ হ্যান্ডলিং'
                : 'Valuation, Waybill & Special Handling',
            subtitle: bangla
                ? 'প্রযোজ্য ক্ষেত্রে ঘোষিত মূল্য, ওজন ও নিরাপত্তা নির্দেশনা যোগ করুন'
                : 'Optional declared value, weight, courier waybill, and handling tags',
            children: [
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.pcFieldValue,
                      helper: l10n.pcValueHelp,
                      controller: _value,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      errorText: _errors['value'] ?? _errors['declaredValue'],
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: AppTextField(
                      label: l10n.pcFieldWeight,
                      controller: _weight,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      errorText: _errors['weight'] ?? _errors['weightKg'],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.pcFieldWaybill,
                controller: _waybill,
                maxLength: 40,
                errorText: _errors['waybill'] ?? _errors['waybillNo'],
              ),
              const SizedBox(height: Space.md),
              Text(l10n.pcFieldHandling, style: theme.textTheme.labelLarge),
              const SizedBox(height: Space.xs),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.xs,
                children: [
                  for (final h in _handlings)
                    FilterChip(
                      label: Text(parcelHandlingLabel(l10n, h)),
                      selected: _handling.contains(h),
                      onSelected: (on) => setState(
                        () => on ? _handling.add(h) : _handling.remove(h),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: Space.xs),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.pcFieldConfidential),
                subtitle: Text(
                  _forcedConfidential
                      ? l10n.pcConfidentialAuto
                      : l10n.pcConfidentialHelp,
                ),
                value: _confidential || _forcedConfidential,
                onChanged: _forcedConfidential
                    ? null
                    : (v) => setState(() => _confidential = v),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          EnterpriseWorkflowCard(
            title: bangla
                ? 'পার্সেল ট্র্যাকিং ও হস্তান্তর চেইন'
                : 'Parcel Chain of Custody & OTP Handover',
            steps: [
              (
                Icons.qr_code_2,
                bangla ? 'ডেসপ্যাচ নিবন্ধন' : 'Dispatch Logged',
                bangla ? 'বারকোড তৈরি' : 'Barcode Issued',
              ),
              (
                Icons.local_shipping_outlined,
                bangla ? 'গেট / রানার ট্রানজিট' : 'Gate & Runner',
                bangla ? 'চেইন অব কাস্টডি' : 'Custody Scan',
              ),
              (
                Icons.verified_user_outlined,
                bangla ? 'প্রাপকের ওটিপি' : 'Recipient OTP',
                bangla ? 'নিরাপদ হস্তান্তর' : 'Verified Delivery',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
