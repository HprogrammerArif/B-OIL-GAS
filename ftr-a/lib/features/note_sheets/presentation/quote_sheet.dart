import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Add or change one supplier quotation.
Future<Quote?> showQuoteSheet(BuildContext context, {Quote? existing}) =>
    showModalBottomSheet<Quote>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _QuoteSheet(existing: existing),
    );

class _QuoteSheet extends StatefulWidget {
  const _QuoteSheet({this.existing});

  final Quote? existing;

  @override
  State<_QuoteSheet> createState() => _QuoteSheetState();
}

class _QuoteSheetState extends State<_QuoteSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _vendor = TextEditingController(text: widget.existing?.vendorName);
  late final _price = TextEditingController(
    text: widget.existing == null
        ? ''
        : widget.existing!.amount.toStringAsFixed(0),
  );
  late final _days = TextEditingController(
    text: widget.existing?.deliveryDays.toString() ?? '',
  );
  late final _warranty = TextEditingController(
    text: widget.existing?.warrantyMonths.toString() ?? '',
  );

  @override
  void dispose() {
    _vendor.dispose();
    _price.dispose();
    _days.dispose();
    _warranty.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      Quote(
        vendorName: _vendor.text.trim(),
        amount: double.parse(_price.text.trim()),
        deliveryDays: int.tryParse(_days.text.trim()) ?? 0,
        warrantyMonths: int.tryParse(_warranty.text.trim()) ?? 0,
        isRecommended: widget.existing?.isRecommended ?? false,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final digits = [FilteringTextInputFormatter.digitsOnly];
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: l10n.nsQuoteVendor,
                controller: _vendor,
                required: true,
                maxLength: 120,
                validator: (v) =>
                    (v ?? '').trim().length < 2 ? l10n.nsErrVendor : null,
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.nsQuotePrice,
                controller: _price,
                required: true,
                keyboardType: TextInputType.number,
                inputFormatters: digits,
                validator: (v) {
                  final n = double.tryParse((v ?? '').trim());
                  return n == null || n <= 0 ? l10n.nsErrPrice : null;
                },
              ),
              const SizedBox(height: Space.md),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: l10n.nsQuoteDelivery,
                      controller: _days,
                      keyboardType: TextInputType.number,
                      inputFormatters: digits,
                    ),
                  ),
                  const SizedBox(width: Space.md),
                  Expanded(
                    child: AppTextField(
                      label: l10n.nsQuoteWarranty,
                      controller: _warranty,
                      keyboardType: TextInputType.number,
                      inputFormatters: digits,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(label: l10n.commonSave, onPressed: _save),
            ],
          ),
        ),
      ),
    );
  }
}
