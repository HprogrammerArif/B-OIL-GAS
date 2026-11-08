import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _advancePresets = <(String, String)>[
  (
    'Multi-day technical inspection and safety valve calibration tour at Chattogram LPG Terminal.',
    'চট্টগ্রাম এলপিজি টার্মিনালে বহু-দিনের কারিগরি পরিদর্শন ও সেফটি ভালভ ক্যালিব্রেশন সফর।',
  ),
  (
    'Outstation plant commissioning and vendor site acceptance testing (SAT) tour.',
    'আউটস্টেশন প্ল্যান্ট কমিশনিং এবং ভেন্ডর সাইট অ্যাকসেপ্টেন্স টেস্টিং (SAT) সফর।',
  ),
  (
    'Regional distributor network expansion and LPG cylinder audit across northern districts.',
    'উত্তরাঞ্চলীয় জেলাসমূহে আঞ্চলিক ডিস্ট্রিবিউটর নেটওয়ার্ক সম্প্রসারণ ও এলপিজি সিলিন্ডার অডিট সফর।',
  ),
];

/// Request a tour advance (BR-11-05): amount, purpose and tour dates.
class AdvanceRequestScreen extends ConsumerStatefulWidget {
  const AdvanceRequestScreen({super.key});

  @override
  ConsumerState<AdvanceRequestScreen> createState() =>
      _AdvanceRequestScreenState();
}

class _AdvanceRequestScreenState extends ConsumerState<AdvanceRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _purpose = TextEditingController();
  DateTime? _start;
  DateTime? _end;
  bool _saving = false;
  bool _showErrors = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _purpose.dispose();
    super.dispose();
  }

  bool get _isReady {
    final n = double.tryParse(_amount.text.trim());
    return n != null &&
        n > 0 &&
        n <= 500000 &&
        _purpose.text.trim().length >= 3 &&
        _start != null &&
        _end != null;
  }

  Future<void> _pick({required bool start}) async {
    final today = Dhaka.today();
    final d = await showDatePicker(
      context: context,
      initialDate: (start ? _start : _end) ?? _start ?? today,
      firstDate: start ? today : (_start ?? today),
      lastDate: today.add(const Duration(days: 365)),
    );
    if (d == null) return;
    setState(() {
      if (start) {
        _start = d;
        if (_end == null || _end!.isBefore(d)) _end = d;
      } else {
        _end = d;
      }
    });
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    setState(() {
      _showErrors = true;
      _error = null;
    });
    if (!_formKey.currentState!.validate() || _start == null || _end == null) {
      return;
    }
    setState(() => _saving = true);
    try {
      await ref
          .read(claimRepositoryProvider)
          .requestAdvance(
            amount: double.parse(_amount.text.trim()),
            purpose: _purpose.text.trim(),
            tourStart: dateKey(_start!),
            tourEnd: dateKey(_end!),
          );
      ref.invalidate(advancesProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.advSubmitted, tone: StatusTone.success);
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = switch (e.rule) {
          'ADVANCE_OVERDUE' => l10n.advErrOverdue,
          _ =>
            e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
                ? l10n.claimErrOffline
                : l10n.advErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.advNewTitle)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.advSubmit,
        primaryIcon: Icons.request_quote_outlined,
        loading: _saving,
        isReady: _isReady,
        errorMessage: _error,
        onPrimaryPressed: _saving ? null : () => unawaited(_submit()),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.md,
            Space.lg,
            Space.xxl,
          ),
          children: [
            EnterpriseApplicantStrip(
              badgeLabel: bangla ? 'ট্যুর অগ্রিম' : 'TOUR ADVANCE',
              badgeIcon: Icons.account_balance_wallet_outlined,
            ),
            const SizedBox(height: Space.md),
            EnterpriseSectionCard(
              stepNumber: 1,
              icon: Icons.payments_outlined,
              title: bangla
                  ? 'অগ্রিম টাকার পরিমাণ ও সফরের তারিখ'
                  : 'Advance Amount & Tour Schedule',
              subtitle: l10n.advIntro,
              children: [
                AppTextField(
                  label: l10n.advFieldAmount,
                  controller: _amount,
                  required: true,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp('[0-9.]')),
                  ],
                  onChanged: (_) => setState(() {}),
                  validator: (v) {
                    final n = double.tryParse((v ?? '').trim());
                    return n == null || n <= 0 || n > 500000
                        ? l10n.advErrAmount
                        : null;
                  },
                ),
                const SizedBox(height: Space.md),
                Row(
                  children: [
                    Expanded(
                      child: EnterpriseDateTile(
                        label: l10n.advFieldTourStart,
                        valueText: _start == null
                            ? '—'
                            : DateFmt.range(
                                dateKey(_start!),
                                dateKey(_start!),
                                lang,
                              ),
                        errorText: _showErrors && _start == null
                            ? l10n.claimErrDates
                            : null,
                        onTap: () => unawaited(_pick(start: true)),
                      ),
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: EnterpriseDateTile(
                        label: l10n.advFieldTourEnd,
                        valueText: _end == null
                            ? '—'
                            : DateFmt.range(
                                dateKey(_end!),
                                dateKey(_end!),
                                lang,
                              ),
                        errorText: _showErrors && _end == null
                            ? l10n.claimErrDates
                            : null,
                        onTap: () => unawaited(_pick(start: false)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            EnterpriseSectionCard(
              stepNumber: 2,
              icon: Icons.assignment_outlined,
              title: bangla
                  ? 'দাপ্তরিক সফরের উদ্দেশ্য'
                  : 'Official Tour Purpose & Justification',
              subtitle: bangla
                  ? 'সফরের সংক্ষিপ্ত বিবরণ ও প্রয়োজনীয়তা উল্লেখ করুন'
                  : 'Select a standard BOGCL tour template or write custom justification',
              children: [
                EnterpriseTemplateDropdown(
                  presets: _advancePresets,
                  controller: _purpose,
                  onPicked: () => setState(() {}),
                  labelEn: 'Standard Tour Advance Purpose (Quick Fill)',
                  labelBn: 'স্ট্যান্ডার্ড সফরের উদ্দেশ্য (দ্রুত পূরণ)',
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.claimFieldPurpose,
                  controller: _purpose,
                  required: true,
                  maxLines: 3,
                  maxLength: 200,
                  onChanged: (_) => setState(() {}),
                  validator: (v) =>
                      (v ?? '').trim().length < 3 ? l10n.claimErrPurpose : null,
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            EnterpriseWorkflowCard(
              title: bangla
                  ? 'ট্যুর অগ্রিম অনুমোদন ও সমন্বয় চেইন'
                  : 'Tour Advance Sanction & Settlement Chain',
              steps: [
                (
                  Icons.person_outline,
                  bangla ? 'আবেদনকারী' : 'Applicant',
                  bangla ? 'অগ্রিম আবেদন' : 'Request Filed',
                ),
                (
                  Icons.supervisor_account_outlined,
                  bangla ? 'বিভাগীয় প্রধান' : 'Line Manager',
                  bangla ? 'সফর অনুমোদন' : 'Tour Approved',
                ),
                (
                  Icons.account_balance_outlined,
                  bangla ? 'অর্থ বিভাগ' : 'Finance Desk',
                  bangla ? 'অগ্রিম প্রদান' : 'Disbursement',
                ),
              ],
              slaNote: bangla
                  ? 'সফর শেষ হওয়ার ১৫ দিনের মধ্যে চূড়ান্ত টিএ/ডিএ বিলের সাথে অগ্রিম সমন্বয় করতে হবে (BR-11-05)।'
                  : 'Advance must be settled against final Tour/TA-DA claim within 15 days of return (BR-11-05).',
            ),
          ],
        ),
      ),
    );
  }
}
