import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
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
  late final List<String> _photos = [...?widget.parcel?.photoFileIds];
  Map<String, String> _errors = {};
  bool _saving = false;
  int? _draftIndex;

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
              'photoFileIds': _photos,
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
    final err = _errors.values.firstOrNull;

    return Scaffold(
      appBar: AppBar(title: Text(editing ? l10n.pcEditTitle : l10n.pcSend)),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                Space.md,
                Space.lg,
                Space.xxl,
              ),
              children: [
                _Card(
                  title: l10n.pcFormWhat,
                  children: [
                    AppTextField(
                      label: l10n.pcFieldDescription,
                      controller: _description,
                      maxLines: 3,
                      maxLength: 500,
                      required: true,
                      textInputAction: TextInputAction.newline,
                      keyboardType: TextInputType.multiline,
                      onChanged: (_) => setState(() {
                        _draftIndex = null;
                        _errors.remove('description');
                      }),
                      errorText: _errors['description'],
                    ),
                    const SizedBox(height: Space.md),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      children: [
                        for (var i = 0; i < _parcelTemplates.length; i++)
                          FilterChip(
                            visualDensity: VisualDensity.compact,
                            label: Text(switch (i) {
                              0 => l10n.pcDraftTender,
                              1 => l10n.pcDraftSpares,
                              2 => l10n.pcDraftLicence,
                              _ => l10n.pcDraftIt,
                            }),
                            selected: _draftIndex == i,
                            onSelected: (_) {
                              final preset = _parcelTemplates[i];
                              setState(() {
                                _draftIndex = i;
                                _description.text = bangla
                                    ? preset.$2
                                    : preset.$1;
                                _errors.remove('description');
                              });
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.pcFieldCategory,
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      children: [
                        for (final c in parcelCategories)
                          FilterChip(
                            visualDensity: VisualDensity.compact,
                            label: Text(parcelCategoryLabel(l10n, c)),
                            selected: _category == c,
                            onSelected: (_) => setState(() => _category = c),
                          ),
                      ],
                    ),
                  ],
                ),
                _Card(
                  title: l10n.pcFormWho,
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
                                : cs.outlineVariant,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.person_outline,
                              color: cs.onSurfaceVariant,
                            ),
                            const SizedBox(width: Space.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    recipient == null
                                        ? l10n.pcPickRecipient
                                        : recipient.display(bangla: bangla),
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (recipient != null)
                                    Text(
                                      [?recipient.title, ?_recipientWhere]
                                          .join(' · '),
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            color: cs.onSurfaceVariant,
                                          ),
                                    )
                                  else if (_errors['recipient'] != null)
                                    Text(
                                      _errors['recipient']!,
                                      style: theme.textTheme.labelSmall
                                          ?.copyWith(
                                            color: context.bogcl.danger,
                                          ),
                                    ),
                                ],
                              ),
                            ),
                            Icon(Icons.search, color: cs.onSurfaceVariant),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                _Card(
                  title: l10n.pcFormPhotos,
                  children: [
                    EvidenceStrip(
                      fileIds: _photos,
                      canAdd: true,
                      max: 6,
                      onAdded: (id) async {
                        if (!mounted) return;
                        setState(() => _photos.add(id));
                      },
                    ),
                  ],
                ),
                ExpansionTile(
                  title: Text(l10n.pcFormMore),
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: const EdgeInsets.only(bottom: Space.md),
                  children: [
                    Text(l10n.pcFieldUrgency, style: theme.textTheme.titleSmall),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      children: [
                        ChoiceChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(l10n.pcUrgNormal),
                          selected: _urgency == 'NORMAL',
                          onSelected: (_) =>
                              setState(() => _urgency = 'NORMAL'),
                        ),
                        ChoiceChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(l10n.nsUrgHigh),
                          selected: _urgency == 'HIGH',
                          onSelected: (_) => setState(() => _urgency = 'HIGH'),
                        ),
                        ChoiceChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(l10n.nsUrgCritical),
                          selected: _urgency == 'CRITICAL',
                          onSelected: (_) =>
                              setState(() => _urgency = 'CRITICAL'),
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.lg),
                    AppTextField(
                      label: l10n.pcFieldValue,
                      helper: l10n.pcValueHelp,
                      controller: _value,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      errorText: _errors['value'] ?? _errors['declaredValue'],
                    ),
                    const SizedBox(height: Space.md),
                    AppTextField(
                      label: l10n.pcFieldWeight,
                      controller: _weight,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                      errorText: _errors['weight'] ?? _errors['weightKg'],
                    ),
                    const SizedBox(height: Space.md),
                    AppTextField(
                      label: l10n.pcFieldWaybill,
                      controller: _waybill,
                      maxLength: 40,
                      errorText: _errors['waybill'] ?? _errors['waybillNo'],
                    ),
                    const SizedBox(height: Space.lg),
                    Text(
                      l10n.pcFieldHandling,
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      children: [
                        for (final h in _handlings)
                          FilterChip(
                            visualDensity: VisualDensity.compact,
                            label: Text(parcelHandlingLabel(l10n, h)),
                            selected: _handling.contains(h),
                            onSelected: (on) => setState(
                              () => on
                                  ? _handling.add(h)
                                  : _handling.remove(h),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.sm),
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
                if (err != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Space.md),
                    child: Text(
                      err,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: context.bogcl.danger,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: PrimaryButton(
                label: editing ? l10n.pcSaveChanges : l10n.pcCreate,
                loading: _saving,
                onPressed: _saving ? null : () => unawaited(_save()),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.lg),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall),
              const SizedBox(height: Space.md),
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}
