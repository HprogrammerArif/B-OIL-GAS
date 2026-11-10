import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _lineDescPresets = <(String, String)>[
  (
    'CNG / Ride-share fare from Baridhara HQ to Keraniganj Filling Plant gate.',
    'বারিধারা প্রধান কার্যালয় হতে কেরানীগঞ্জ ফিলিং প্ল্যান্ট পর্যন্ত সিএনজি / রাইড-শেয়ার ভাড়া।',
  ),
  (
    'Intercity highway toll, ferry crossing & official parking receipt.',
    'আন্তঃজেলা মহাসড়ক টোল, ফেরি পারাপার এবং দাপ্তরিক পার্কিং রসিদ।',
  ),
  (
    'Hotel accommodation during outstation technical inspection duty.',
    'আউটস্টেশন কারিগরি পরিদর্শন ডিউটি চলাকালীন হোটেল আবাসন ব্যয়।',
  ),
];

/// Bottom sheet that adds or edits one expense line. Returns the line, or
/// null when dismissed.
Future<ClaimLine?> showClaimLineSheet(
  BuildContext context, {
  required ClaimType type,
  required ClaimPolicyInfo policy,
  required DateTime firstDate,
  required DateTime lastDate,
  ClaimLine? existing,
}) {
  return showModalBottomSheet<ClaimLine>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _LineSheet(
      type: type,
      policy: policy,
      firstDate: firstDate,
      lastDate: lastDate,
      existing: existing,
    ),
  );
}

class _LineSheet extends ConsumerStatefulWidget {
  const _LineSheet({
    required this.type,
    required this.policy,
    required this.firstDate,
    required this.lastDate,
    this.existing,
  });

  final ClaimType type;
  final ClaimPolicyInfo policy;
  final DateTime firstDate;
  final DateTime lastDate;
  final ClaimLine? existing;

  @override
  ConsumerState<_LineSheet> createState() => _LineSheetState();
}

class _LineSheetState extends ConsumerState<_LineSheet> {
  final _form = GlobalKey<FormState>();
  final _desc = TextEditingController();
  final _amount = TextEditingController();
  final _nights = TextEditingController();
  final _km = TextEditingController();
  final _from = TextEditingController();
  final _to = TextEditingController();
  late String _category;
  late DateTime _date;
  bool _declaration = false;
  String? _receiptId;

  late final List<String> _categories = [
    for (final c
        in widget.policy.categories[widget.type.wire] ?? const <String>[])
      if (c != 'DA') c,
  ];

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _category = e?.category ?? _categories.first;
    final initial = e == null ? widget.lastDate : DateTime.parse(e.date);
    _date = initial.isAfter(widget.lastDate)
        ? widget.lastDate
        : initial.isBefore(widget.firstDate)
        ? widget.firstDate
        : initial;
    if (e != null) {
      _desc.text = e.description;
      if (e.category == 'MILEAGE') {
        _km.text = e.distanceKm?.toStringAsFixed(0) ?? '';
        _from.text = e.fromPlace ?? '';
        _to.text = e.toPlace ?? '';
      } else {
        _amount.text = _plain(e.amount);
      }
      _nights.text = e.nights?.toString() ?? '';
      _declaration = e.isDeclaration;
      _receiptId = e.receiptFileId;
    }
  }

  @override
  void dispose() {
    _desc.dispose();
    _amount.dispose();
    _nights.dispose();
    _km.dispose();
    _from.dispose();
    _to.dispose();
    super.dispose();
  }

  String _plain(double v) =>
      v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2);

  bool get _canDeclare =>
      widget.policy.declarationCategories.contains(_category);

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: widget.firstDate,
      lastDate: widget.lastDate,
    );
    if (d != null) {
      setState(() => _date = d);
    }
  }

  void _save() {
    if (!_form.currentState!.validate()) return;
    final mileage = _category == 'MILEAGE';
    final amount = mileage ? 0.0 : double.parse(_amount.text.trim());
    final id = widget.existing?.id ?? '';
    Navigator.of(context).pop(
      ClaimLine(
        id: id,
        category: _category,
        date: dateKey(_date),
        description: _desc.text.trim(),
        amount: amount,
        system: false,
        isDeclaration: _declaration && _receiptId == null,
        nights: _category == 'HOTEL' ? int.parse(_nights.text.trim()) : null,
        distanceKm: mileage ? double.parse(_km.text.trim()) : null,
        fromPlace: mileage ? _from.text.trim() : null,
        toPlace: mileage ? _to.text.trim() : null,
        receiptFileId: _receiptId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final bangla = context.isBangla;
    final mileage = _category == 'MILEAGE';
    final hint = widget.policy.receiptRequiredAbove;
    final decimal = [FilteringTextInputFormatter.allow(RegExp('[0-9.]'))];

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.existing == null
                      ? l10n.claimLineAdd
                      : l10n.claimLineEdit,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: Space.md),
                Row(
                  children: [
                    Expanded(
                      child: EnterpriseDropdownField<String>(
                        label: l10n.claimFieldCategory,
                        icon: Icons.category_outlined,
                        value: _category,
                        items: [
                          for (final c in _categories)
                            DropdownMenuItem(
                              value: c,
                              child: Text(claimCategoryLabel(l10n, c)),
                            ),
                        ],
                        onChanged: (v) => setState(() {
                          _category = v ?? _category;
                          if (!_canDeclare) _declaration = false;
                        }),
                      ),
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: EnterpriseDateTile(
                        label: l10n.claimFieldDate,
                        valueText: DateFmt.range(
                          dateKey(_date),
                          dateKey(_date),
                          lang,
                        ),
                        onTap: () => unawaited(_pickDate()),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.md),
                if (mileage) ...[
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          label: l10n.claimFieldFrom,
                          controller: _from,
                          required: true,
                          validator: _required(l10n),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: AppTextField(
                          label: l10n.claimFieldTo,
                          controller: _to,
                          required: true,
                          validator: _required(l10n),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  AppTextField(
                    label: l10n.claimFieldDistance,
                    controller: _km,
                    required: true,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: decimal,
                    helper: l10n.claimMileageHint(
                      bdt(widget.policy.mileageRatePerKm, bangla: bangla),
                    ),
                    validator: (v) {
                      final n = double.tryParse((v ?? '').trim());
                      return n == null || n <= 0 || n > 5000
                          ? l10n.claimErrDistance
                          : null;
                    },
                  ),
                ] else ...[
                  AppTextField(
                    label: l10n.claimFieldAmount,
                    controller: _amount,
                    required: true,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: decimal,
                    validator: (v) {
                      final n = double.tryParse((v ?? '').trim());
                      return n == null || n <= 0 || n > 10000000
                          ? l10n.claimErrAmount
                          : null;
                    },
                  ),
                  if (_category == 'HOTEL') ...[
                    const SizedBox(height: Space.md),
                    AppTextField(
                      label: l10n.claimFieldNights,
                      controller: _nights,
                      required: true,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: (v) {
                        final n = int.tryParse((v ?? '').trim());
                        return n == null || n < 1 || n > 60
                            ? l10n.claimErrNights
                            : null;
                      },
                    ),
                  ],
                ],
                const SizedBox(height: Space.md),
                Wrap(
                  spacing: Space.xs,
                  runSpacing: Space.xs,
                  children: [
                    for (final p in _lineDescPresets)
                      FilterChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                          bangla ? p.$2 : p.$1,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        selected: _desc.text == (bangla ? p.$2 : p.$1),
                        onSelected: (_) => setState(() {
                          _desc.text = bangla ? p.$2 : p.$1;
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.claimFieldDescription,
                  controller: _desc,
                  maxLines: 2,
                  maxLength: 200,
                ),
                if (!mileage) ...[
                  const SizedBox(height: Space.sm),
                  Text(
                    l10n.claimReceiptHint(bdt(hint, bangla: bangla)),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  EvidenceStrip(
                    fileIds: [?_receiptId],
                    canAdd: _receiptId == null,
                    max: 1,
                    purpose: 'CLAIM_RECEIPT',
                    onAdded: (id) async {
                      setState(() {
                        _receiptId = id;
                        _declaration = false;
                      });
                    },
                  ),
                  if (_receiptId != null)
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: IconButton(
                        tooltip: l10n.claimReceiptAttached,
                        onPressed: () => setState(() => _receiptId = null),
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ),
                  if (_canDeclare && _receiptId == null)
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(l10n.claimDeclaration),
                      subtitle: Text(
                        l10n.claimDeclarationHint(
                          bdt(
                            widget.policy.declarationMaxAmount,
                            bangla: bangla,
                          ),
                        ),
                      ),
                      value: _declaration,
                      onChanged: (v) => setState(() => _declaration = v),
                    ),
                ],
                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: l10n.claimLineSave,
                  icon: Icons.check_circle_outline,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  FormFieldValidator<String> _required(AppL10n l10n) =>
      (v) => (v ?? '').trim().isEmpty ? l10n.claimErrRequired : null;
}
