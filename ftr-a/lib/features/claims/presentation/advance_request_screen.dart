import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;

    Widget picker(String label, DateTime? v, {required bool start}) => InkWell(
      onTap: () => unawaited(_pick(start: start)),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today_outlined),
          errorText: _showErrors && v == null ? l10n.claimErrDates : null,
        ),
        child: Text(
          v == null ? '—' : DateFmt.range(dateKey(v), dateKey(v), lang),
        ),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.advNewTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Space.lg),
          children: [
            Text(
              l10n.advIntro,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: Space.lg),
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
              validator: (v) {
                final n = double.tryParse((v ?? '').trim());
                return n == null || n <= 0 || n > 500000
                    ? l10n.advErrAmount
                    : null;
              },
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.claimFieldPurpose,
              controller: _purpose,
              required: true,
              maxLength: 200,
              validator: (v) =>
                  (v ?? '').trim().length < 3 ? l10n.claimErrPurpose : null,
            ),
            const SizedBox(height: Space.md),
            picker(l10n.advFieldTourStart, _start, start: true),
            const SizedBox(height: Space.md),
            picker(l10n.advFieldTourEnd, _end, start: false),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: Space.md),
                child: Text(
                  _error!,
                  style: TextStyle(color: context.bogcl.danger),
                ),
              ),
            const SizedBox(height: Space.xl),
            PrimaryButton(
              label: l10n.advSubmit,
              loading: _saving,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
