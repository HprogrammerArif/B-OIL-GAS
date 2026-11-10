import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
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
/// Duration / Session Preset, Acting Reliever (Handover), Station Status,
/// visual quota progress bar, approval chain preview, and pinned action bar.
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
  String _handoverReliever = 'ROSTER_DEFAULT';
  String _stationStatus = 'IN_STATION';
  String? _selectedReasonTemplate;
  ({String id, String name, String mime})? _attachment;
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

  int _calendarDays() {
    final s = _start;
    final e = _end;
    if (s == null || e == null) return 0;
    return e.difference(s).inDays + 1;
  }

  /// First blocking problem, or null when the form can be submitted.
  String? _blockingMessage(
    AppL10n l10n,
    LeavePolicyInfo policy,
    List<LeaveBalance> balances,
    String lang,
  ) {
    final type = _type;
    if (type == null || _start == null || _end == null) {
      return l10n.leaveFormNoWorkingDays;
    }
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
      return l10n.leaveFormReasonMin(policy.reasonMin);
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

  List<(String, String)> _relieverOptions(bool bangla) => [
    (
      'ROSTER_DEFAULT',
      bangla
          ? 'বিভাগীয় ডিউটি রোস্টার (স্বয়ংক্রিয় দায়িত্ব হস্তান্তর)'
          : 'Departmental Duty Roster (Standard Handover)',
    ),
    (
      'REL_HARUN',
      bangla
          ? 'প্রকৌশলী মোঃ হারুনুর রশিদ — প্ল্যান্ট জিএম (কেরানীগঞ্জ)'
          : 'Engr. Md. Harunur Rashid — Plant GM (Keraniganj)',
    ),
    (
      'REL_FARIDA',
      bangla
          ? 'ফরিদা ইয়াসমিন — অর্থ ও হিসাব বিভাগীয় প্রধান'
          : 'Farida Yasmin — Head of Finance & Accounts',
    ),
    (
      'REL_AFROZA',
      bangla
          ? 'সৈয়দা আফরোজা — মানবসম্পদ ও প্রশাসন প্রধান'
          : 'Sayeda Afroza — Head of HR & Admin',
    ),
    (
      'REL_KAMRUL',
      bangla
          ? 'মোঃ কামরুল হাসান — সিনিয়র অপারেশনস অফিসার'
          : 'Md. Kamrul Hasan — Senior Operations Officer',
    ),
  ];

  List<(String, String)> _stationOptions(bool bangla) => [
    (
      'IN_STATION',
      bangla
          ? 'কর্মস্থল এলাকায় অবস্থান (ফোন ও অ্যাপে যোগাযোগযোগ্য)'
          : 'In-Station Leave (Reachable via Phone & OneOps)',
    ),
    (
      'OUT_STATION',
      bangla
          ? 'স্টেশন ত্যাগের অনুমতিসহ ছুটি (ঢাকা / প্ল্যান্টের বাইরে)'
          : 'Out-of-Station Leave (Leaving Duty Jurisdiction)',
    ),
  ];

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
      setState(
        () => _attachment = (id: meta.id, name: picked.name, mime: picked.mime),
      );
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

  Future<void> _handleSubmitTap(
    LeavePolicyInfo policy,
    List<LeaveBalance> balances,
    String lang,
  ) async {
    final l10n = context.l10n;
    final blocking = _blockingMessage(l10n, policy, balances, lang);
    if (blocking != null) {
      Haptics.tap();
      setState(() => _touched = true);
      AppToast.show(context, blocking, tone: StatusTone.warning);
      return;
    }
    await _submit(policy);
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

    if (types.hasError || policy.hasError || balances.hasError) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.leaveApply)),
        body: ErrorState(
          onRetry: () => ref
            ..invalidate(leaveTypesProvider)
            ..invalidate(leavePolicyProvider)
            ..invalidate(leaveBalancesProvider),
        ),
      );
    }
    if (!types.hasValue || !policy.hasValue || !balances.hasValue) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.leaveApply)),
        body: const SkeletonList(),
      );
    }

    _ensureDefaults(types.requireValue, policy.requireValue);
    return _buildLoadedScaffold(
      context,
      l10n,
      lang,
      types.requireValue,
      policy.requireValue,
      balances.requireValue,
    );
  }

  Widget _buildLoadedScaffold(
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
    final session = ref.watch(sessionControllerProvider).value;
    final emp = session?.profile.employee;

    final type = _type;
    final days = _days(policy);
    final calDays = _calendarDays();
    final excludedDays = (calDays - days.ceil()).clamp(0, 365);
    final blocking = _blockingMessage(l10n, policy, balances, lang);
    final isReady = blocking == null;
    final shownError = _serverError ?? (_touched ? blocking : null);

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

    final relievers = _relieverOptions(bangla);
    final stations = _stationOptions(bangla);

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

    final empName = emp == null
        ? 'BOGCL Staff'
        : (bangla ? (emp.fullNameBn ?? emp.fullName) : emp.fullName);
    final empDept = emp == null
        ? ''
        : (bangla
              ? (emp.department.nameBn ?? emp.department.name)
              : emp.department.name);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.leaveApply)),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.sm,
            Space.lg,
            Space.md,
          ),
          decoration: BoxDecoration(
            color: scheme.surface,
            border: Border(top: BorderSide(color: scheme.outlineVariant)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(
                    isReady
                        ? Icons.check_circle_rounded
                        : Icons.info_outline_rounded,
                    size: 15,
                    color: isReady
                        ? Colors.teal.shade700
                        : scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isReady
                          ? '${type?.displayName(bangla: bangla) ?? ''} · ${daysText(l10n, days, lang)}${remainingAfter != null ? ' · ${bangla ? 'অবশিষ্ট' : 'Rem'}: ${daysText(l10n, remainingAfter, lang)}' : ''}'
                          : (bangla
                                ? 'জমা দিতে একটি সাধারণ কারণ নির্বাচন করুন বা কমপক্ষে ১০ অক্ষর লিখুন'
                                : 'Select a standard reason or enter 10+ characters to submit'),
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: isReady
                            ? scheme.onSurface
                            : scheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              PrimaryButton(
                label: l10n.leaveFormSubmit,
                icon: Icons.send_rounded,
                loading: _submitting,
                onPressed: _submitting || _uploading
                    ? null
                    : () => unawaited(_handleSubmitTap(policy, balances, lang)),
              ),
            ],
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.md,
          Space.lg,
          Space.xxl,
        ),
        children: [
          // Top Applicant Identity & Requisition Strip
          if (emp != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.md,
                vertical: Space.sm + 2,
              ),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(color: scheme.outlineVariant),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 17,
                    backgroundColor: scheme.surfaceContainerHighest,
                    child: Text(
                      emp.initials ?? emp.fullName[0],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: scheme.onSurface,
                      ),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          empName,
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${emp.empCode} · $empDept',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            color: scheme.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  StatusPill(
                    label: isReady
                        ? (bangla ? 'জমা দেওয়ার জন্য প্রস্তুত' : 'Ready')
                        : (bangla ? 'খসড়া' : 'Draft'),
                    tone: isReady ? StatusTone.success : StatusTone.neutral,
                  ),
                ],
              ),
            ),
          const SizedBox(height: Space.md),

          // Card 1: 1. Leave Category & Quota Breakdown
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
                          bangla
                              ? '১. ছুটির বিভাগ ও প্রাপ্য কোটা'
                              : '1. Leave Category & Entitlement Quota',
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
                                  final balLabel =
                                      !t.checksBalance || bal == null
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

                  // Visual Quota Utilization Strip
                  if (selectedBalance != null &&
                      selectedBalance.entitled > 0) ...[
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
                              _quotaMetric(
                                theme,
                                bangla ? 'বার্ষিক প্রাপ্য' : 'Entitled',
                                daysText(l10n, selectedBalance.entitled, lang),
                              ),
                              _quotaMetric(
                                theme,
                                bangla ? 'বর্তমান আবেদন' : 'Requesting',
                                daysText(l10n, days, lang),
                              ),
                              _quotaMetric(
                                theme,
                                bangla ? 'অনুমোদনের পর অবশিষ্ট' : 'Remaining',
                                daysText(l10n, remainingAfter ?? 0, lang),
                                highlight: true,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(3),
                            child: LinearProgressIndicator(
                              value:
                                  ((selectedBalance.used + days) /
                                          selectedBalance.entitled)
                                      .clamp(0.0, 1.0),
                              minHeight: 5,
                              backgroundColor: scheme.surfaceContainerHighest,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),

          // Card 2: 2. Schedule & Working Days Calculator
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
                              ? '২. ছুটির সময়সূচি ও কার্যদিবস হিসাব'
                              : '2. Schedule & Working Days Calculator',
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

                  // Calendar vs Working Days Breakdown
                  if (days > 0) ...[
                    const SizedBox(height: Space.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Space.sm + 2,
                        vertical: Space.xs + 2,
                      ),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(Corner.md),
                        border: Border.all(color: scheme.outlineVariant),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.event_available_outlined,
                            size: 15,
                            color: scheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              bangla
                                  ? 'মোট $calDays ক্যালেন্ডার দিন · সাপ্তাহিক ছুটি বাদ: $excludedDays দিন · কর্তনযোগ্য: ${daysText(l10n, days, lang)}'
                                  : '$calDays Calendar Day(s) · $excludedDays Weekend/Holiday Excluded · Net Deducted: ${daysText(l10n, days, lang)}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: scheme.onSurface,
                              ),
                            ),
                          ),
                        ],
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
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),

          // Card 3: 3. Duty Handover, Station Status & Reason
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
                              ? '৩. দায়িত্ব হস্তান্তর, অবস্থান ও ছুটির কারণ'
                              : '3. Duty Handover, Station & Reason',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.md),

                  // Acting Reliever / Handover Colleague Dropdown
                  InputDecorator(
                    decoration: InputDecoration(
                      labelText: bangla
                          ? 'দায়িত্বপ্রাপ্ত বিকল্প কর্মকর্তা (Handover Reliever)'
                          : 'Acting Reliever / Duty Handover To',
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: Space.md,
                        vertical: 4,
                      ),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _handoverReliever,
                        isExpanded: true,
                        onChanged: (rel) {
                          if (rel == null) return;
                          Haptics.tap();
                          setState(() => _handoverReliever = rel);
                        },
                        items: [
                          for (final rel in relievers)
                            DropdownMenuItem<String>(
                              value: rel.$1,
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.badge_outlined,
                                    size: 17,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: Space.sm),
                                  Expanded(
                                    child: Text(
                                      rel.$2,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Space.md),

                  // Station Leave Status Dropdown
                  InputDecorator(
                    decoration: InputDecoration(
                      labelText: bangla
                          ? 'ছুটিকালীন অবস্থান ও যোগাযোগ'
                          : 'Station Leave & Reachability Status',
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: Space.md,
                        vertical: 4,
                      ),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _stationStatus,
                        isExpanded: true,
                        onChanged: (st) {
                          if (st == null) return;
                          Haptics.tap();
                          setState(() => _stationStatus = st);
                        },
                        items: [
                          for (final st in stations)
                            DropdownMenuItem<String>(
                              value: st.$1,
                              child: Row(
                                children: [
                                  Icon(
                                    st.$1 == 'IN_STATION'
                                        ? Icons.phone_in_talk_outlined
                                        : Icons.luggage_outlined,
                                    size: 17,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: Space.sm),
                                  Expanded(
                                    child: Text(
                                      st.$2,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Space.md),

                  // Standard Reason Template Dropdown
                  InputDecorator(
                    decoration: InputDecoration(
                      labelText: bangla
                          ? 'সাধারণ কারণ নির্বাচন করুন (১-ট্যাপ টেমপ্লেট)'
                          : 'Standard Reason Template (1-Tap Fill)',
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
                              : 'Select a standard reason or type below…',
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_attachment!.mime.startsWith('image/'))
                            EvidenceStrip(fileIds: [_attachment!.id]),
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
                                  onPressed: () =>
                                      setState(() => _attachment = null),
                                  child: Text(l10n.leaveFormRemove),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    else
                      PrimaryButton.secondary(
                        label: l10n.leaveFormAttach,
                        icon: Icons.attach_file,
                        loading: _uploading,
                        onPressed: _uploading
                            ? null
                            : () => unawaited(_attach()),
                      ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),

          // Card 4: Visual Approval Workflow Chain Preview
          _LeaveApprovalChainCard(
            bangla: bangla,
            hrReview: hrReview,
            empName: empName,
          ),

          if (shownError != null)
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
                        shownError,
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
        ],
      ),
    );
  }

  Widget _quotaMetric(
    ThemeData theme,
    String label,
    String value, {
    bool highlight = false,
  }) {
    final scheme = theme.colorScheme;
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              color: scheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: highlight ? Colors.teal.shade700 : scheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(DateTime d, String lang) =>
      DateFmt.key(dateKey(d), lang, pattern: 'EEE, dd MMM yyyy');
}

class _LeaveApprovalChainCard extends StatelessWidget {
  const _LeaveApprovalChainCard({
    required this.bangla,
    required this.hrReview,
    required this.empName,
  });

  final bool bangla;
  final bool hrReview;
  final String empName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final steps = <(IconData, String, String)>[
      (
        Icons.person_outline_rounded,
        bangla ? 'আবেদনকারী' : 'Applicant',
        empName,
      ),
      (
        Icons.fact_check_outlined,
        bangla ? 'প্রথম অনুমোদন' : 'Line Manager',
        bangla ? 'বিভাগীয় প্রধান (HOD)' : 'Head of Dept (HOD)',
      ),
      (
        hrReview ? Icons.verified_user_outlined : Icons.sync_rounded,
        hrReview
            ? (bangla ? 'চূড়ান্ত অনুমোদন' : 'HR Review')
            : (bangla ? 'লিভ লেজার' : 'Leave Ledger'),
        hrReview
            ? (bangla ? 'মানবসম্পদ বিভাগ (HR)' : 'HR Admin Sign-Off')
            : (bangla ? 'স্বয়ংক্রিয় কোটা সমন্বয়' : 'Auto Quota Sync'),
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(Corner.lg),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.account_tree_outlined,
                size: 16,
                color: scheme.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Text(
                bangla ? 'অনুমোদন ও পরবর্তী ধাপ' : 'Approval Workflow Route',
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.sm),
          Row(
            children: [
              for (var i = 0; i < steps.length; i++) ...[
                if (i > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(Corner.md),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              steps[i].$1,
                              size: 13,
                              color: scheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                steps[i].$2,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: scheme.onSurfaceVariant,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          steps[i].$3,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
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
