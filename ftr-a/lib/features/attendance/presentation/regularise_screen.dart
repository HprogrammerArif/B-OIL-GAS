import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/attendance/data/attendance_repository.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_providers.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_ui.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _windowDays = 7;
const _fieldAheadDays = 30;
const _reasonMin = 10;
const _reasonMax = 500;

/// Attendance regularisation form (BR-10-04): missed punch, field duty, late
/// justification or remote work with enterprise dropdown selectors.
class RegulariseScreen extends ConsumerStatefulWidget {
  const RegulariseScreen({this.initialDate, this.initialType, super.key});

  final String? initialDate;
  final String? initialType;

  @override
  ConsumerState<RegulariseScreen> createState() => _RegulariseScreenState();
}

class _RegulariseScreenState extends ConsumerState<RegulariseScreen> {
  final _reason = TextEditingController();
  late RegularisationType _type = RegularisationType.parse(
    widget.initialType ?? 'MISSED_PUNCH',
  );
  late DateTime _date = _initialDate();
  TimeOfDay? _in = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay? _out = const TimeOfDay(hour: 18, minute: 0);
  String _shiftPreset = 'FULL_GENERAL';
  String? _selectedReasonTemplate;
  bool _submitting = false;
  bool _touched = false;
  String? _serverError;

  DateTime _today() {
    final t = Dhaka.today();
    return DateTime.utc(t.year, t.month, t.day);
  }

  DateTime _initialDate() {
    final raw = widget.initialDate;
    if (raw != null && RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(raw)) {
      final p = raw.split('-').map(int.parse).toList();
      return DateTime.utc(p[0], p[1], p[2]);
    }
    return _today();
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  bool get _fieldDuty => _type == RegularisationType.fieldDuty;
  bool get _takesTimes => _type != RegularisationType.lateJustification;

  DateTime get _first => _today().subtract(const Duration(days: _windowDays));
  DateTime get _last => _fieldDuty
      ? _today().add(const Duration(days: _fieldAheadDays))
      : _today();

  DateTime _clampDate(DateTime d) =>
      d.isBefore(_first) ? _first : (d.isAfter(_last) ? _last : d);

  /// A Dhaka wall-clock time on [_date] as a UTC instant.
  DateTime _instant(TimeOfDay t) => DateTime.utc(
    _date.year,
    _date.month,
    _date.day,
    t.hour,
    t.minute,
  ).subtract(Dhaka.offset);

  String? _problem(AppL10n l10n) {
    final inT = _in;
    final outT = _out;
    if (_type == RegularisationType.missedPunch &&
        inT == null &&
        outT == null) {
      return _touched ? l10n.attRegErrMissedTime : '';
    }
    if (inT != null && outT != null) {
      if (_instant(outT).isBefore(_instant(inT)) ||
          _instant(outT) == _instant(inT)) {
        return l10n.attRegErrTimes;
      }
    }
    if (_reason.text.trim().length < _reasonMin) {
      return _touched ? l10n.attRegReasonMin(_reasonMin) : '';
    }
    return null;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _clampDate(_date),
      firstDate: _first,
      lastDate: _last,
    );
    if (picked == null) return;
    setState(() {
      _date = DateTime.utc(picked.year, picked.month, picked.day);
      _serverError = null;
    });
  }

  Future<void> _pickTime({required bool isIn}) async {
    final current = isIn ? _in : _out;
    final picked = await showTimePicker(
      context: context,
      initialTime: current ?? TimeOfDay(hour: isIn ? 9 : 18, minute: 0),
    );
    if (picked == null) return;
    setState(() {
      if (isIn) {
        _in = picked;
      } else {
        _out = picked;
      }
      _shiftPreset = 'CUSTOM';
      _serverError = null;
    });
  }

  void _applyShiftPreset(String preset) {
    Haptics.tap();
    setState(() {
      _shiftPreset = preset;
      _serverError = null;
      switch (preset) {
        case 'FULL_GENERAL':
          _in = const TimeOfDay(hour: 9, minute: 0);
          _out = const TimeOfDay(hour: 18, minute: 0);
        case 'MORNING_IN':
          _in = const TimeOfDay(hour: 9, minute: 0);
          _out = null;
        case 'EVENING_OUT':
          _in = null;
          _out = const TimeOfDay(hour: 18, minute: 0);
        case 'PLANT_A':
          _in = const TimeOfDay(hour: 6, minute: 0);
          _out = const TimeOfDay(hour: 14, minute: 0);
        case 'PLANT_B':
          _in = const TimeOfDay(hour: 14, minute: 0);
          _out = const TimeOfDay(hour: 22, minute: 0);
        case 'CUSTOM':
          break;
      }
    });
  }

  List<String> _quickReasons(bool bangla) {
    return switch (_type) {
      RegularisationType.missedPunch => [
        if (bangla)
          'সকালে গেট দিয়ে প্রবেশের সময় ফোনের জিপিএস / বায়োমেট্রিক পাঞ্চ বাদ পড়েছিল।'
        else
          'Morning gate check-in missed due to terminal / GPS sync delay.',
        if (bangla)
          'শিফট শেষে শাটল বাসে ওঠার তাড়ায় পাঞ্চ-আউট করতে ভুলে গিয়েছিলাম।'
        else
          'Forgot to record evening punch-out before boarding staff shuttle.',
        if (bangla)
          'জরুরি অপারেশনাল মিটিংয়ে সরাসরি যোগ দেওয়ায় পাঞ্চ রেকর্ড করা হয়নি।'
        else
          'Entered urgent operational briefing directly upon arrival at site.',
      ],
      RegularisationType.fieldDuty => [
        if (bangla)
          'তেজগাঁও সড়ক ভবনে আরএইচডি ও মন্ত্রণালয়ের কর্মকর্তাদের সাথে দাপ্তরিক সভা।'
        else
          'Official coordination meeting with RHD officials at Sarak Bhaban, Tejgaon.',
        if (bangla)
          'কেরানীগঞ্জ বিটুমিন রিফাইনারি প্ল্যান্ট ও জেটিতে ট্যাংক পরিদর্শন।'
        else
          'On-site tank gauging and jetty inspection at Keraniganj Bitumen Plant.',
        if (bangla)
          'মতিঝিল বাণিজ্যিক এলাকায় ডিলার ও কর্পোরেট ক্লায়েন্ট পরিদর্শন।'
        else
          'Corporate dealer & distributor visit at Motijheel commercial area.',
      ],
      RegularisationType.lateJustification => [
        if (bangla)
          'বুড়িগঙ্গা সেতু ও পোস্তগোলা করিডোরে তীব্র যানজটের কারণে পৌঁছাতে বিলম্ব হয়েছে।'
        else
          'Delayed by heavy traffic congestion on Buriganga Bridge corridor.',
        if (bangla)
          'সড়ক ডাইভারশনের কারণে স্টাফ শাটল বাস নির্ধারিত সময়ের পরে পৌঁছেছে।'
        else
          'Staff shuttle bus delayed en route due to road diversion and rain.',
      ],
      RegularisationType.remoteWork => [
        if (bangla)
          'বিভাগীয় প্রধানের অনুমোদনক্রমে বাসা থেকে ইআরপি ও অডিট প্রতিবেদন প্রস্তুতকরণ।'
        else
          'Authorized remote work preparing departmental ERP & audit reports.',
        if (bangla)
          'দাপ্তরিক নির্দেশনায় অফ-সাইট থেকে ভেন্ডর ও কন্ট্রাক্ট ডকুমেন্ট পর্যালোচনা।'
        else
          'Off-site review of vendor procurement & compliance documentation.',
      ],
    };
  }

  (IconData, String, String) _typeMeta(
    RegularisationType t,
    AppL10n l10n,
    bool bangla,
  ) {
    return switch (t) {
      RegularisationType.missedPunch => (
        Icons.fingerprint_rounded,
        regTypeLabel(l10n, t),
        bangla
            ? 'গেট ইন বা আউট পাঞ্চ বাদ পড়েছে'
            : 'Forgot gate check-in or out',
      ),
      RegularisationType.fieldDuty => (
        Icons.location_on_outlined,
        regTypeLabel(l10n, t),
        bangla
            ? 'মন্ত্রণালয়, জেটি বা ক্লায়েন্ট ভিজিট'
            : 'Client, RHD or plant visit',
      ),
      RegularisationType.lateJustification => (
        Icons.schedule_rounded,
        regTypeLabel(l10n, t),
        bangla
            ? 'যানজট বা যাতায়াত বিলম্বের নোট'
            : 'Traffic or transit delay note',
      ),
      RegularisationType.remoteWork => (
        Icons.laptop_mac_rounded,
        regTypeLabel(l10n, t),
        bangla ? 'অনুমোদিত অফ-সাইট দাপ্তরিক কাজ' : 'Authorized off-site duty',
      ),
    };
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final key = dateKey(_date);
    setState(() {
      _submitting = true;
      _serverError = null;
    });
    try {
      final result = await ref
          .read(attendanceRepositoryProvider)
          .regularise(
            date: key,
            type: _type,
            reason: _reason.text,
            requestedIn: _takesTimes && _in != null ? _instant(_in!) : null,
            requestedOut: _takesTimes && _out != null ? _instant(_out!) : null,
            label: l10n.attRegQueueLabel(DateFmt.key(key, lang)),
          );
      ref
        ..invalidate(myRegularisationsProvider)
        ..invalidate(todayAttendanceProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        result is Queued ? l10n.attRegQueued : l10n.attRegSubmitted,
        tone: result is Queued ? StatusTone.info : StatusTone.success,
      );
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _serverError = switch (e.code) {
          ApiErrorCode.conflict => l10n.attRegErrDuplicate,
          ApiErrorCode.validationError =>
            e.fieldErrors.containsKey('date')
                ? l10n.attRegErrWindow(_windowDays)
                : l10n.attRegErrFailed,
          _ => l10n.attRegErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lang = Localizations.localeOf(context).languageCode;
    final problem = _problem(l10n);
    final shown =
        _serverError ?? ((problem?.isNotEmpty ?? false) ? problem : null);
    String fmtTime(TimeOfDay t) => DateFmt.time(_instant(t), lang);

    final quickReasons = _quickReasons(bangla);
    const types = RegularisationType.values;
    final activeMeta = _typeMeta(_type, l10n, bangla);

    final shiftOptions = <(String, String)>[
      (
        'FULL_GENERAL',
        bangla
            ? 'সাধারণ শিফট (০৯:০০ AM – ০৬:০০ PM)'
            : 'General Shift (09:00 AM – 06:00 PM)',
      ),
      (
        'MORNING_IN',
        bangla
            ? 'শুধু সকালের চেক-ইন (০৯:০০ AM)'
            : 'Morning Check-In Only (09:00 AM)',
      ),
      (
        'EVENING_OUT',
        bangla
            ? 'শুধু সন্ধ্যার চেক-আউট (০৬:০০ PM)'
            : 'Evening Check-Out Only (06:00 PM)',
      ),
      (
        'PLANT_A',
        bangla
            ? 'রিফাইনারি শিফট A (০৬:০০ AM – ০২:০০ PM)'
            : 'Refinery Shift A (06:00 AM – 02:00 PM)',
      ),
      (
        'PLANT_B',
        bangla
            ? 'রিফাইনারি শিফট B (০২:০০ PM – ১০:০০ PM)'
            : 'Refinery Shift B (02:00 PM – 10:00 PM)',
      ),
      (
        'CUSTOM',
        bangla
            ? 'কাস্টম সময় (নিচে নির্বাচন করুন)'
            : 'Custom Time (Select below)',
      ),
    ];

    final effectiveReasonDropdown =
        quickReasons.contains(_selectedReasonTemplate)
        ? _selectedReasonTemplate
        : null;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.attRegTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.md,
          Space.lg,
          Space.xxxl,
        ),
        children: [
          // Top Guidance Banner
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.sm,
            ),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(Corner.md),
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.verified_user_outlined,
                  size: 18,
                  color: scheme.onSurfaceVariant,
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    bangla
                        ? 'হাজিরা সংশোধন বা মাঠ পর্যায়ের কাজের আবেদন আপনার লাইন ম্যানেজারের অনুমোদনের পর স্বয়ংক্রিয়ভাবে দৈনিক হাজিরায় যুক্ত হবে।'
                        : 'Attendance adjustments and field duty logs are routed to your Line Manager and update your daily timesheet upon sign-off.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // Section 1: Request Type Dropdown Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(activeMeta.$1, size: 18, color: scheme.onSurface),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          l10n.attRegType,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
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
                          _fieldDuty
                              ? (bangla ? '৩০ দিন অগ্রিম' : '30d Window')
                              : (bangla ? 'গত ৭ দিন' : 'Last 7 Days'),
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  InputDecorator(
                    decoration: InputDecoration(
                      labelText: l10n.attRegType,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: Space.md,
                        vertical: 4,
                      ),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<RegularisationType>(
                        value: _type,
                        isExpanded: true,
                        onChanged: (next) {
                          if (next == null) return;
                          Haptics.tap();
                          setState(() {
                            _type = next;
                            _date = _clampDate(_date);
                            _selectedReasonTemplate = null;
                            _serverError = null;
                          });
                        },
                        items: [
                          for (final t in types)
                            DropdownMenuItem<RegularisationType>(
                              value: t,
                              child: Builder(
                                builder: (context) {
                                  final meta = _typeMeta(t, l10n, bangla);
                                  return Row(
                                    children: [
                                      Icon(
                                        meta.$1,
                                        size: 18,
                                        color: scheme.onSurfaceVariant,
                                      ),
                                      const SizedBox(width: Space.sm),
                                      Expanded(
                                        child: Text(
                                          '${meta.$2} — ${meta.$3}',
                                          style: theme.textTheme.bodyMedium
                                              ?.copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
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
                  const SizedBox(height: Space.xs),
                  Text(
                    _fieldDuty
                        ? l10n.attRegHintField(_fieldAheadDays)
                        : l10n.attRegHintWindow(_windowDays),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),

          // Section 2: Date & Shift Time Schedule Card with Shift Dropdown
          Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.event_note_outlined,
                        size: 18,
                        color: scheme.onSurface,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          bangla
                              ? 'তারিখ ও শিফটের সময়সূচি'
                              : 'Date & Shift Schedule',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  _Field(
                    label: l10n.attRegDate,
                    value: DateFmt.key(
                      dateKey(_date),
                      lang,
                      pattern: 'EEE, dd MMM yyyy',
                    ),
                    icon: Icons.calendar_today_outlined,
                    onTap: () => unawaited(_pickDate()),
                  ),
                  if (_takesTimes) ...[
                    const SizedBox(height: Space.md),
                    // Shift Preset Dropdown
                    InputDecorator(
                      decoration: InputDecoration(
                        labelText: bangla
                            ? 'শিফট ও সময়সূচি নির্বাচন'
                            : 'Shift Schedule Preset',
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: Space.md,
                          vertical: 4,
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _shiftPreset,
                          isExpanded: true,
                          onChanged: (val) {
                            if (val != null) _applyShiftPreset(val);
                          },
                          items: [
                            for (final opt in shiftOptions)
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
                          child: _Field(
                            label: l10n.attRegIn,
                            value: _in == null ? null : fmtTime(_in!),
                            icon: Icons.login_rounded,
                            onTap: () => unawaited(_pickTime(isIn: true)),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: _Field(
                            label: l10n.attRegOut,
                            value: _out == null ? null : fmtTime(_out!),
                            icon: Icons.logout_rounded,
                            onTap: () => unawaited(_pickTime(isIn: false)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),

          // Section 3: Official Reason & Standard Reason Dropdown Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.description_outlined,
                        size: 18,
                        color: scheme.onSurface,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          bangla
                              ? 'আবেদনের কারণ ও বিবরণ'
                              : 'Official Justification & Reason',
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
                    label: l10n.attRegReason,
                    hint: l10n.attRegReasonHint,
                    controller: _reason,
                    maxLines: 3,
                    maxLength: _reasonMax,
                    required: true,
                    onChanged: (_) => setState(() => _touched = true),
                  ),
                ],
              ),
            ),
          ),

          if (shown != null)
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
                        shown,
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
            label: l10n.attRegSubmit,
            icon: Icons.send_rounded,
            loading: _submitting,
            onPressed: problem == null && !_submitting
                ? () => unawaited(_submit())
                : null,
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.value,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String? value;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$label ${value ?? ''}',
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.md),
        onTap: onTap,
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            suffixIcon: Icon(icon, size: 18),
          ),
          child: Text(
            value ?? '—',
            style: Theme.of(context).textTheme.bodyMedium
                ?.copyWith(fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}
