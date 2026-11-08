import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
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

/// Leave application form with enterprise dropdown selectors for Leave Type,
/// Duration / Session Preset, and Standard Reason Templates.
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
  String _durationPreset = '1_DAY';
  String? _selectedReasonTemplate;
  ({String id, String name})? _attachment;
  bool _uploading = false;
  bool _submitting = false;
  bool _touched = false;
  bool _initializedDefaults = false;
  String? _serverError;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  DateTime get _today => _day(Dhaka.today());

  DateTime _nextBusinessDay(LeavePolicyInfo policy, DateTime from) {
    var d = from;
    for (var i = 0; i < 14 && !policy.isBusinessDay(d); i++) {
      d = d.add(const Duration(days: 1));
    }
    return d;
  }

  DateTime _addBusinessDays(LeavePolicyInfo policy, DateTime start, int count) {
    var d = start;
    var remaining = count - 1;
    var guard = 0;
    while (remaining > 0 && guard < 30) {
      d = d.add(const Duration(days: 1));
      if (policy.isBusinessDay(d)) {
        remaining--;
      }
      guard++;
    }
    return d;
  }

  void _ensureDefaults(List<LeaveType> types, LeavePolicyInfo policy) {
    if (_initializedDefaults || types.isEmpty) return;
    _initializedDefaults = true;
    final defaultType =
        types.where((t) => t.code == 'CL').firstOrNull ?? types.first;
    final defaultStart = _nextBusinessDay(policy, _today);
    _type = defaultType;
    _start = defaultStart;
    _end = defaultStart;
    _durationPreset = '1_DAY';
  }

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
    initial = _nextBusinessDay(policy, initial);

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
      _durationPreset = 'CUSTOM';
    });
  }

  void _selectType(LeaveType t, LeavePolicyInfo policy) {
    Haptics.tap();
    setState(() {
      _type = t;
      _selectedReasonTemplate = null;
      _serverError = null;
      if (!t.halfDayAllowed && _half != null) {
        _half = null;
        _durationPreset = '1_DAY';
      }
      if (!t.requiresDoc) _attachment = null;
      final back = policy.backdateTypes.contains(t.code)
          ? policy.backdateDays
          : 0;
      final first = _today.subtract(Duration(days: back));
      if (_start == null || _start!.isBefore(first)) {
        final next = _nextBusinessDay(policy, _today);
        _start = next;
        _end = next;
      }
    });
  }

  void _applyDurationDropdown(LeavePolicyInfo policy, String preset) {
    Haptics.tap();
    final baseStart = _start ?? _nextBusinessDay(policy, _today);
    setState(() {
      _durationPreset = preset;
      _serverError = null;
      _start = baseStart;
      switch (preset) {
        case 'HALF_FIRST':
          _end = baseStart;
          _half = HalfDay.first;
        case 'HALF_SECOND':
          _end = baseStart;
          _half = HalfDay.second;
        case '1_DAY':
          _half = null;
          _end = baseStart;
        case '2_DAYS':
          _half = null;
          _end = _addBusinessDays(policy, baseStart, 2);
        case '3_DAYS':
          _half = null;
          _end = _addBusinessDays(policy, baseStart, 3);
        case '5_DAYS':
          _half = null;
          _end = _addBusinessDays(policy, baseStart, 5);
        case 'CUSTOM':
          _half = null;
      }
    });
  }

  List<String> _quickReasons(LeaveType? type, bool bangla) {
    final code = type?.code ?? 'CL';
    return switch (code) {
      'SL' => [
        if (bangla)
          'জ্বর ও মৌসুমি ভাইরাল সংক্রমণের কারণে চিকিৎসকের পরামর্শ অনুযায়ী বিশ্রাম প্রয়োজন।'
        else
          'Suffering from seasonal viral fever; medical rest advised by physician.',
        if (bangla)
          'হাসপাতালে ডায়াগনস্টিক পরীক্ষা ও বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট।'
        else
          'Scheduled diagnostic check-up and specialist medical consultation.',
      ],
      'EL' => [
        if (bangla)
          'পরিবারের সাথে পূর্বনির্ধারিত বার্ষিক ভ্রমণ ও ব্যক্তিগত বিশ্রামের জন্য ছুটি।'
        else
          'Planned annual family vacation and personal rest.',
        if (bangla)
          'পারিবারিক অনুষ্ঠান উপলক্ষে ঢাকার বাইরে অবস্থানের জন্য অর্জিত ছুটি।'
        else
          'Out-of-station travel for scheduled family ceremony.',
      ],
      'ML' || 'PL' => [
        if (bangla)
          'নবজাতক সন্তানের যত্ন ও মাতৃত্ব/পিতৃত্বকালীন পারিবারিক দায়িত্ব পালন।'
        else
          'Parental care and hospital attendance for newborn child.',
      ],
      _ => [
        if (bangla)
          'জরুরি পারিবারিক ও ব্যক্তিগত কাজের জন্য এক দিনের নৈমিত্তিক ছুটি প্রয়োজন।'
        else
          'Attending to urgent personal and family commitments at home.',
        if (bangla)
          'ব্যাংকিং ও দাপ্তরিক ব্যক্তিগত কাজে উপস্থিত থাকার জন্য ছুটি।'
        else
          'Personal administrative and banking errands requiring in-person presence.',
        if (bangla)
          'পরিবারের সদস্যের চিকিৎসা সহায়তার জন্য সাথে থাকা প্রয়োজন।'
        else
          'Accompanying a family member for a scheduled medical appointment.',
      ],
    };
  }

  IconData _typeIcon(String code) {
    return switch (code) {
      'CL' => Icons.wb_sunny_outlined,
      'SL' => Icons.medical_services_outlined,
      'EL' => Icons.flight_takeoff_rounded,
      'ML' || 'PL' => Icons.child_care_outlined,
      _ => Icons.event_busy_outlined,
    };
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
      _ensureDefaults(types.requireValue, policy.requireValue);
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
    final scheme = theme.colorScheme;
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

    final selectedBalance = type == null
        ? null
        : balances.where((x) => x.type.id == type.id).firstOrNull;
    final remainingAfter = selectedBalance == null
        ? null
        : (selectedBalance.available - days).clamp(0.0, 365.0);

    final quickReasons = _quickReasons(type, bangla);
    final effectiveReasonDropdown =
        quickReasons.contains(_selectedReasonTemplate)
        ? _selectedReasonTemplate
        : null;

    final durationOptions = <(String, String)>[
      if (type != null && type.halfDayAllowed) ...[
        (
          'HALF_FIRST',
          bangla
              ? 'অর্ধদিবস — প্রথমার্ধ (সকাল)'
              : 'Half Day — First Half (Morning)',
        ),
        (
          'HALF_SECOND',
          bangla
              ? 'অর্ধদিবস — দ্বিতীয়ার্ধ (বিকাল)'
              : 'Half Day — Second Half (Afternoon)',
        ),
      ],
      (
        '1_DAY',
        bangla ? '১ কার্যদিবস (পূর্ণ দিন)' : '1 Working Day (Full Day)',
      ),
      ('2_DAYS', bangla ? '২ কার্যদিবস' : '2 Working Days'),
      ('3_DAYS', bangla ? '৩ কার্যদিবস' : '3 Working Days'),
      if (type?.code != 'CL')
        (
          '5_DAYS',
          bangla ? '৫ কার্যদিবস (১ সপ্তাহ)' : '5 Working Days (1 Week)',
        ),
      (
        'CUSTOM',
        bangla
            ? 'কাস্টম তারিখের পরিসর (নিচে নির্বাচন করুন)'
            : 'Custom Date Range (Select below)',
      ),
    ];

    final effectiveDurationPreset =
        durationOptions.any((o) => o.$1 == _durationPreset)
        ? _durationPreset
        : '1_DAY';

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.md,
        Space.lg,
        Space.xxxl,
      ),
      children: [
        // Section 1: Leave Type Dropdown & Quota Summary Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      _typeIcon(type?.code ?? 'CL'),
                      size: 18,
                      color: scheme.onSurface,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        l10n.leaveFormType,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (selectedBalance != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: scheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(Corner.sm),
                        ),
                        child: Text(
                          l10n.leaveAvailable(
                            daysText(l10n, selectedBalance.available, lang),
                          ),
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurface,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: Space.md),
                InputDecorator(
                  decoration: InputDecoration(
                    labelText: l10n.leaveFormType,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: 4,
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<LeaveType>(
                      value: type,
                      isExpanded: true,
                      onChanged: (next) {
                        if (next != null) _selectType(next, policy);
                      },
                      items: [
                        for (final t in types)
                          DropdownMenuItem<LeaveType>(
                            value: t,
                            child: Builder(
                              builder: (context) {
                                final bal = balances
                                    .where((x) => x.type.id == t.id)
                                    .firstOrNull;
                                final balLabel = !t.checksBalance || bal == null
                                    ? (bangla ? 'বিনা বেতনে' : 'Unpaid')
                                    : l10n.leaveAvailable(
                                        daysText(l10n, bal.available, lang),
                                      );
                                return Row(
                                  children: [
                                    Icon(
                                      _typeIcon(t.code),
                                      size: 18,
                                      color: scheme.onSurfaceVariant,
                                    ),
                                    const SizedBox(width: Space.sm),
                                    Expanded(
                                      child: Text(
                                        t.displayName(bangla: bangla),
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.w600,
                                            ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: Space.xs),
                                    Text(
                                      balLabel,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            color: scheme.onSurfaceVariant,
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                if (selectedBalance != null) ...[
                  const SizedBox(height: Space.xs),
                  Text(
                    l10n.leaveBalanceDetail(
                      daysText(l10n, selectedBalance.used, lang),
                      daysText(l10n, selectedBalance.entitled, lang),
                    ),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.md),

        // Section 2: Leave Dates, Duration Dropdown & Live Balance Impact Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.date_range_outlined,
                      size: 18,
                      color: scheme.onSurface,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'ছুটির মেয়াদ ও তারিখ'
                            : 'Leave Duration & Schedule',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (days > 0)
                      StatusPill(
                        label: daysText(l10n, days, lang),
                        tone: StatusTone.info,
                      ),
                  ],
                ),
                const SizedBox(height: Space.md),

                // Duration / Session Dropdown
                InputDecorator(
                  decoration: InputDecoration(
                    labelText: bangla
                        ? 'ছুটির মেয়াদ ও সেশন নির্বাচন'
                        : 'Duration / Session Preset',
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: 4,
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: effectiveDurationPreset,
                      isExpanded: true,
                      onChanged: (val) {
                        if (val != null) _applyDurationDropdown(policy, val);
                      },
                      items: [
                        for (final opt in durationOptions)
                          DropdownMenuItem<String>(
                            value: opt.$1,
                            child: Text(
                              opt.$2,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: Space.md),

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
                    const SizedBox(width: Space.sm),
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

                // Live Balance Impact & Approval Routing Strip
                if (days > 0) ...[
                  const SizedBox(height: Space.md),
                  Container(
                    padding: const EdgeInsets.all(Space.sm + 2),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(Corner.md),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.account_balance_wallet_outlined,
                              size: 15,
                              color: scheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                l10n.leaveFormCounts(
                                  daysText(l10n, days, lang),
                                ),
                                style: theme.textTheme.labelLarge?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            if (remainingAfter != null)
                              Text(
                                bangla
                                    ? 'অবশিষ্ট থাকবে: ${daysText(l10n, remainingAfter, lang)}'
                                    : 'Remaining: ${daysText(l10n, remainingAfter, lang)}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          hrReview
                              ? l10n.leaveFormHrReview
                              : (bangla
                                    ? 'অনুমোদন রুট: লাইন ম্যানেজার / বিভাগীয় প্রধান'
                                    : 'Approval route: Line Manager / Head of Department'),
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11.5,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                        if (backdated) ...[
                          const SizedBox(height: 4),
                          Text(
                            l10n.leaveFormUninformed,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: 11.5,
                              color: context.bogcl.warning,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.md),

        // Section 3: Reason Dropdown, Text Input & Supporting Document Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.edit_note_rounded,
                      size: 18,
                      color: scheme.onSurface,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'ছুটির কারণ ও সহায়ক নথি'
                            : 'Leave Reason & Handover Note',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.md),
                InputDecorator(
                  decoration: InputDecoration(
                    labelText: bangla
                        ? 'সাধারণ কারণ নির্বাচন করুন (ঐচ্ছিক)'
                        : 'Select Standard Reason Template (Optional)',
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: 4,
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String?>(
                      value: effectiveReasonDropdown,
                      isExpanded: true,
                      hint: Text(
                        bangla
                            ? 'তালিকা থেকে কারণ নির্বাচন করুন বা নিচে লিখুন…'
                            : 'Choose a standard reason or type below…',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onChanged: (template) {
                        Haptics.tap();
                        setState(() {
                          _selectedReasonTemplate = template;
                          if (template != null) {
                            _reason.text = template;
                            _touched = true;
                            _serverError = null;
                          }
                        });
                      },
                      items: [
                        for (final template in quickReasons)
                          DropdownMenuItem<String?>(
                            value: template,
                            child: Text(
                              template,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: Space.md),
                AppTextField(
                  label: l10n.leaveFormReason,
                  hint: l10n.leaveFormReasonHint,
                  controller: _reason,
                  maxLines: 3,
                  maxLength: policy.reasonMax,
                  required: true,
                  onChanged: (_) => setState(() => _touched = true),
                ),
                if (type != null && type.requiresDoc) ...[
                  const SizedBox(height: Space.md),
                  Text(
                    l10n.leaveFormAttachment,
                    style: theme.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: Space.xs),
                  if (_attachment != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Space.sm,
                        vertical: Space.xs,
                      ),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(Corner.md),
                        border: Border.all(color: scheme.outlineVariant),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.attach_file, size: 18),
                          const SizedBox(width: Space.xs),
                          Expanded(
                            child: Text(
                              _attachment!.name,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () => setState(() => _attachment = null),
                            child: Text(l10n.leaveFormRemove),
                          ),
                        ],
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
              ],
            ),
          ),
        ),

        if (_serverError != null || (problem != null && problem.isNotEmpty))
          Padding(
            padding: const EdgeInsets.only(top: Space.md),
            child: Container(
              padding: const EdgeInsets.all(Space.sm),
              decoration: BoxDecoration(
                color: context.bogcl.danger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(Corner.md),
                border: Border.all(
                  color: context.bogcl.danger.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 18,
                    color: context.bogcl.danger,
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Text(
                      _serverError ?? problem!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: context.bogcl.danger,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        const SizedBox(height: Space.lg),
        PrimaryButton(
          label: l10n.leaveFormSubmit,
          icon: Icons.send_rounded,
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
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}
