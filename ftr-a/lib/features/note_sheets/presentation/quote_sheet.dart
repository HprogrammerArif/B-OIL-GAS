import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const _vendorPresets = <(String, String)>[
  (
    'Meghna Industrial Engineering Ltd.',
    'মেঘনা ইন্ডাস্ট্রিয়াল ইঞ্জিনিয়ারিং লিমিটেড',
  ),
  ('Bengal Gas & Valve Automation Co.', 'বেঙ্গল গ্যাস ও ভালভ অটোমেশন কোং'),
  (
    'Karnaphuli Technical Spares & Services',
    'কর্ণফুলী টেকনিক্যাল স্পেয়ারস অ্যান্ড সার্ভিসেস',
  ),
  (
    'Delta Safety & Fire Systems BD',
    'ডেল্টা সেফটি অ্যান্ড ফায়ার সিস্টেমস বিডি',
  ),
];

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
    text: widget.existing?.deliveryDays.toString() ?? '7',
  );
  late final _warranty = TextEditingController(
    text: widget.existing?.warrantyMonths.toString() ?? '12',
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
    final bangla = context.isBangla;
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              EnterpriseModalHeader(
                title: widget.existing == null
                    ? l10n.nsQuoteAdd
                    : l10n.nsQuotesTitle,
                subtitle: bangla
                    ? 'তুলনামূলক বিবরণীর (CS) জন্য সরবরাহকারীর দরপত্র যুক্ত করুন'
                    : 'Enter vendor quotation for Comparative Statement (CS) evaluation',
                icon: Icons.request_quote_outlined,
              ),
              EnterpriseTemplateDropdown(
                presets: _vendorPresets,
                controller: _vendor,
                onPicked: () => setState(() {}),
                labelEn: 'Enlisted BOGCL Supplier (Quick Pick)',
                labelBn: 'তালিকাভুক্ত সরবরাহকারী নির্বাচন (দ্রুত পূরণ)',
              ),
              const SizedBox(height: Space.sm),
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
              PrimaryButton(
                label: l10n.commonSave,
                icon: Icons.check_circle_outline,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
