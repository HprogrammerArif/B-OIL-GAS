import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
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
  ({String id, String name})? _receipt;
  bool _uploading = false;

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
      if (e.receiptFileId != null) {
        _receipt = (id: e.receiptFileId!, name: '');
      }
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

  Future<void> _attach() async {
    final l10n = context.l10n;
    final picked = await pickAttachment(context, allowFiles: false);
    if (picked == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      final uploads = ref.read(uploadServiceProvider);
      final meta = await uploads.upload(picked, purpose: 'CLAIM_RECEIPT');
      await uploads.awaitClean(meta.id);
      if (!mounted) return;
      setState(() {
        _receipt = (id: meta.id, name: picked.name);
        _declaration = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, switch (e.code) {
        ApiErrorCode.offline ||
        ApiErrorCode.timeout => l10n.uploadNeedsConnection,
        ApiErrorCode.forbidden => l10n.uploadBlocked,
        _ => l10n.uploadRejected,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _uploading = false);
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
        isDeclaration: _declaration && _receipt == null,
        nights: _category == 'HOTEL' ? int.parse(_nights.text.trim()) : null,
        distanceKm: mileage ? double.parse(_km.text.trim()) : null,
        fromPlace: mileage ? _from.text.trim() : null,
        toPlace: mileage ? _to.text.trim() : null,
        receiptFileId: _receipt?.id,
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
                EnterpriseModalHeader(
                  title: widget.existing == null
                      ? l10n.claimLineAdd
                      : l10n.claimLineEdit,
                  subtitle: bangla
                      ? 'খরচের খাত, তারিখ ও ভাউচার সংযুক্ত করুন'
                      : 'Specify expense category, date, amount, and voucher',
                  icon: Icons.receipt_long_outlined,
                ),
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
                EnterpriseTemplateDropdown(
                  presets: _lineDescPresets,
                  controller: _desc,
                  onPicked: () => setState(() {}),
                  labelEn: 'Standard Expense Note (Quick Fill)',
                  labelBn: 'স্ট্যান্ডার্ড খরচের বিবরণ (দ্রুত পূরণ)',
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
                  if (_receipt != null)
                    InputChip(
                      avatar: const Icon(Icons.receipt_long_outlined, size: 18),
                      label: Text(
                        _receipt!.name.isEmpty
                            ? l10n.claimReceiptAttached
                            : _receipt!.name,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onDeleted: () => setState(() => _receipt = null),
                    )
                  else
                    PrimaryButton.secondary(
                      label: l10n.claimReceiptAdd,
                      icon: Icons.attach_file,
                      loading: _uploading,
                      onPressed: _attach,
                    ),
                  if (_canDeclare && _receipt == null)
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
                  onPressed: _uploading ? null : _save,
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
