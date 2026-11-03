import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

DateTime _day(DateTime d) => DateTime.utc(d.year, d.month, d.day);

/// Leave application form with live day count and rule feedback.
class LeaveApplyScreen extends ConsumerStatefulWidget {
  const LeaveApplyScreen({super.key});

  @override
  ConsumerState<LeaveApplyScreen> createState() => _LeaveApplyScreenState();
}

class _LeaveApplyScreenState extends ConsumerState<LeaveApplyScreen> {
  final _reason = TextEditingController();
  LeaveType? _type;
  DateTime? _start;
  DateTime? _end;
  HalfDay? _half;
  ({String id, String name})? _attachment;
  bool _uploading = false;
  bool _submitting = false;
  bool _touched = false;
  String? _serverError;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  DateTime get _today => _day(Dhaka.today());

  double _days(LeavePolicyInfo policy) {
    final s = _start;
    final e = _end;
    if (s == null || e == null) return 0;
    if (_half != null) return 0.5;
    return policy.businessDays(s, e).toDouble();
  }

  /// First blocking problem, or null when the form can be submitted.
  String? _problem(
    AppL10n l10n,
    LeavePolicyInfo policy,
    List<LeaveBalance> balances,
    String lang,
  ) {
    final type = _type;
    if (type == null || _start == null || _end == null) return '';
    final days = _days(policy);
    if (days == 0) return l10n.leaveFormNoWorkingDays;
    if (type.code == 'CL' && days > policy.maxConsecutiveCl) {
      return l10n.leaveFormClLimit(policy.maxConsecutiveCl);
    }
    if (type.checksBalance) {
      final b = balances.where((x) => x.type.id == type.id).firstOrNull;
      if (b != null && days > b.available) {
        return l10n.leaveFormBalanceShort(daysText(l10n, b.available, lang));
      }
    }
    if (_reason.text.trim().length < policy.reasonMin) {
      return _touched ? l10n.leaveFormReasonMin(policy.reasonMin) : '';
    }
    if (type.requiresDoc &&
        days > policy.docRequiredAboveDays &&
        _attachment == null) {
      return l10n.leaveFormAttachRequired;
    }
    return null;
  }

  Future<void> _pickDate({required bool start}) async {
    final policy = ref.read(leavePolicyProvider).value;
    final type = _type;
    if (policy == null || type == null) return;
    final back = policy.backdateTypes.contains(type.code)
        ? policy.backdateDays
        : 0;
    final first = _today.subtract(Duration(days: back));
    var initial = (start ? _start : _end) ?? _start ?? _today;
    if (initial.isBefore(first)) initial = first;
    for (var i = 0; i < 14 && !policy.isBusinessDay(initial); i++) {
      initial = initial.add(const Duration(days: 1));
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: start ? first : (_start ?? first),
      lastDate: _today.add(const Duration(days: 365)),
      selectableDayPredicate: policy.isBusinessDay,
    );
    if (picked == null) return;
    final d = _day(picked);
    setState(() {
      _serverError = null;
      if (start) {
        _start = d;
        if (_end == null || _end!.isBefore(d)) _end = d;
      } else {
        _end = d;
      }
      if (_start != _end) _half = null;
    });
  }

  void _selectType(LeaveType t, LeavePolicyInfo policy) {
    setState(() {
      _type = t;
      _serverError = null;
      if (!t.halfDayAllowed) _half = null;
      if (!t.requiresDoc) _attachment = null;
      final back = policy.backdateTypes.contains(t.code)
          ? policy.backdateDays
          : 0;
      final first = _today.subtract(Duration(days: back));
      if (_start != null && _start!.isBefore(first)) {
        _start = null;
        _end = null;
      }
    });
  }

  Future<void> _attach() async {
    final l10n = context.l10n;
    final picked = await pickAttachment(context);
    if (picked == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      final uploads = ref.read(uploadServiceProvider);
      final purpose = picked.mime.startsWith('image/') ? 'PHOTO' : 'DOCUMENT';
      final meta = await uploads.upload(picked, purpose: purpose);
      await uploads.awaitClean(meta.id);
      if (!mounted) return;
      setState(() => _attachment = (id: meta.id, name: picked.name));
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

  Future<void> _submit(LeavePolicyInfo policy) async {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final type = _type!;
    final start = dateKey(_start!);
    final end = dateKey(_end!);
    setState(() {
      _submitting = true;
      _serverError = null;
    });
    try {
      final result = await ref
          .read(leaveRepositoryProvider)
          .apply(
            leaveTypeId: type.id,
            startDate: start,
            endDate: end,
            halfDay: _half,
            reason: _reason.text.trim(),
            attachmentFileId: _attachment?.id,
            label: l10n.leaveQueueLabel(
              type.displayName(bangla: context.isBangla),
              DateFmt.range(start, end, lang),
            ),
          );
      ref
        ..invalidate(myLeaveRequestsProvider)
        ..invalidate(leaveBalancesProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        result is Queued ? l10n.leaveQueued : l10n.leaveSubmitted,
        tone: result is Queued ? StatusTone.info : StatusTone.success,
      );
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _serverError = switch (e.rule) {
          'INSUFFICIENT_BALANCE' => l10n.leaveErrInsufficient,
          'MAX_CONSECUTIVE_CL' => l10n.leaveFormClLimit(
            policy.maxConsecutiveCl,
          ),
          'OVERLAP' => l10n.leaveErrOverlap,
          _ =>
            e.code == ApiErrorCode.conflict
                ? l10n.leaveErrOverlap
                : l10n.leaveErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final types = ref.watch(leaveTypesProvider);
    final policy = ref.watch(leavePolicyProvider);
    final balances = ref.watch(leaveBalancesProvider);

    Widget body;
    if (types.hasError || policy.hasError || balances.hasError) {
      body = ErrorState(
        onRetry: () => ref
          ..invalidate(leaveTypesProvider)
          ..invalidate(leavePolicyProvider)
          ..invalidate(leaveBalancesProvider),
      );
    } else if (!types.hasValue || !policy.hasValue || !balances.hasValue) {
      body = const SkeletonList();
    } else {
      body = _form(
        context,
        l10n,
        lang,
        types.requireValue,
        policy.requireValue,
        balances.requireValue,
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(l10n.leaveApply)),
      body: body,
    );
  }

  Widget _form(
    BuildContext context,
    AppL10n l10n,
    String lang,
    List<LeaveType> types,
    LeavePolicyInfo policy,
    List<LeaveBalance> balances,
  ) {
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final type = _type;
    final days = _days(policy);
    final problem = _problem(l10n, policy, balances, lang);
    final hrReview =
        type != null &&
        days > 0 &&
        (days > policy.hrReviewAboveDays ||
            const {'ML', 'LWP'}.contains(type.code));
    final backdated = _start != null && _start!.isBefore(_today);

    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        Text(l10n.leaveFormType, style: theme.textTheme.labelLarge),
        const SizedBox(height: Space.sm),
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.sm,
          children: [
            for (final t in types)
              ChoiceChip(
                label: Text(_chipLabel(l10n, t, balances, lang, bangla)),
                selected: type?.id == t.id,
                onSelected: (_) => _selectType(t, policy),
              ),
          ],
        ),
        const SizedBox(height: Space.xl),
        Row(
          children: [
            Expanded(
              child: _DateField(
                label: l10n.leaveFormFrom,
                value: _start == null ? null : _fmt(_start!, lang),
                onTap: type == null
                    ? null
                    : () => unawaited(_pickDate(start: true)),
              ),
            ),
            const SizedBox(width: Space.md),
            Expanded(
              child: _DateField(
                label: l10n.leaveFormTo,
                value: _end == null ? null : _fmt(_end!, lang),
                onTap: type == null || _start == null
                    ? null
                    : () => unawaited(_pickDate(start: false)),
              ),
            ),
          ],
        ),
        if (type != null &&
            type.halfDayAllowed &&
            _start == _end &&
            _start != null)
          Padding(
            padding: const EdgeInsets.only(top: Space.sm),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l10n.leaveFormHalfDay),
                  value: _half != null,
                  onChanged: (v) =>
                      setState(() => _half = v ? HalfDay.first : null),
                ),
                if (_half != null)
                  SegmentedButton<HalfDay>(
                    segments: [
                      for (final h in HalfDay.values)
                        ButtonSegment(
                          value: h,
                          label: Text(halfDayLabel(l10n, h)),
                        ),
                    ],
                    selected: {_half!},
                    onSelectionChanged: (s) => setState(() => _half = s.first),
                  ),
              ],
            ),
          ),
        if (days > 0)
          Padding(
            padding: const EdgeInsets.only(top: Space.md),
            child: Text(
              l10n.leaveFormCounts(daysText(l10n, days, lang)),
              style: theme.textTheme.titleSmall,
            ),
          ),
        if (hrReview)
          _Hint(icon: Icons.info_outline, text: l10n.leaveFormHrReview),
        if (backdated)
          _Hint(icon: Icons.warning_amber, text: l10n.leaveFormUninformed),
        const SizedBox(height: Space.xl),
        AppTextField(
          label: l10n.leaveFormReason,
          hint: l10n.leaveFormReasonHint,
          controller: _reason,
          maxLines: 4,
          maxLength: policy.reasonMax,
          required: true,
          onChanged: (_) => setState(() => _touched = true),
        ),
        if (type != null && type.requiresDoc) ...[
          const SizedBox(height: Space.md),
          Text(l10n.leaveFormAttachment, style: theme.textTheme.labelLarge),
          const SizedBox(height: Space.sm),
          if (_attachment != null)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.attach_file),
              title: Text(_attachment!.name, overflow: TextOverflow.ellipsis),
              trailing: TextButton(
                onPressed: () => setState(() => _attachment = null),
                child: Text(l10n.leaveFormRemove),
              ),
            )
          else
            PrimaryButton.secondary(
              label: l10n.leaveFormAttach,
              icon: Icons.attach_file,
              loading: _uploading,
              onPressed: _uploading ? null : () => unawaited(_attach()),
            ),
        ],
        if (_serverError != null || (problem != null && problem.isNotEmpty))
          Padding(
            padding: const EdgeInsets.only(top: Space.lg),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: context.bogcl.danger),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Text(
                    _serverError ?? problem!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: context.bogcl.danger,
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: Space.xl),
        PrimaryButton(
          label: l10n.leaveFormSubmit,
          loading: _submitting,
          onPressed: problem == null && !_submitting && !_uploading
              ? () => unawaited(_submit(policy))
              : null,
        ),
      ],
    );
  }

  String _fmt(DateTime d, String lang) =>
      DateFmt.key(dateKey(d), lang, pattern: 'EEE, dd MMM yyyy');

  String _chipLabel(
    AppL10n l10n,
    LeaveType t,
    List<LeaveBalance> balances,
    String lang,
    bool bangla,
  ) {
    final name = t.displayName(bangla: bangla);
    if (!t.checksBalance) return name;
    final b = balances.where((x) => x.type.id == t.id).firstOrNull;
    if (b == null) return name;
    return '$name · ${l10n.leaveAvailable(daysText(l10n, b.available, lang))}';
  }
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value, this.onTap});

  final String label;
  final String? value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: '$label ${value ?? ''}',
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.md),
        onTap: onTap,
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
            enabled: onTap != null,
          ),
          child: Text(
            value ?? '—',
            style: theme.textTheme.bodyMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: Space.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: Space.sm),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
