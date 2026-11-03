import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
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
/// justification or remote work. [initialDate] is `YYYY-MM-DD`; [initialType]
/// is the wire name.
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
  TimeOfDay? _in;
  TimeOfDay? _out;
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
      return l10n.attRegErrMissedTime;
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
      initialTime: current ?? const TimeOfDay(hour: 9, minute: 0),
    );
    if (picked == null) return;
    setState(() {
      if (isIn) {
        _in = picked;
      } else {
        _out = picked;
      }
      _serverError = null;
    });
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
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final problem = _problem(l10n);
    final shown =
        _serverError ?? ((problem?.isNotEmpty ?? false) ? problem : null);
    String fmtTime(TimeOfDay t) => DateFmt.time(_instant(t), lang);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.attRegTitle)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.attRegType, style: theme.textTheme.labelLarge),
          const SizedBox(height: Space.sm),
          Wrap(
            spacing: Space.sm,
            runSpacing: Space.sm,
            children: [
              for (final t in RegularisationType.values)
                ChoiceChip(
                  label: Text(regTypeLabel(l10n, t)),
                  selected: _type == t,
                  onSelected: (_) => setState(() {
                    _type = t;
                    _date = _clampDate(_date);
                    _serverError = null;
                  }),
                ),
            ],
          ),
          const SizedBox(height: Space.xl),
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
          Padding(
            padding: const EdgeInsets.only(top: Space.xs),
            child: Text(
              _fieldDuty
                  ? l10n.attRegHintField(_fieldAheadDays)
                  : l10n.attRegHintWindow(_windowDays),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          if (_takesTimes) ...[
            const SizedBox(height: Space.lg),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    label: l10n.attRegIn,
                    value: _in == null ? null : fmtTime(_in!),
                    icon: Icons.access_time,
                    onTap: () => unawaited(_pickTime(isIn: true)),
                  ),
                ),
                const SizedBox(width: Space.md),
                Expanded(
                  child: _Field(
                    label: l10n.attRegOut,
                    value: _out == null ? null : fmtTime(_out!),
                    icon: Icons.access_time,
                    onTap: () => unawaited(_pickTime(isIn: false)),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: Space.xl),
          AppTextField(
            label: l10n.attRegReason,
            hint: l10n.attRegReasonHint,
            controller: _reason,
            maxLines: 4,
            maxLength: _reasonMax,
            required: true,
            onChanged: (_) => setState(() => _touched = true),
          ),
          if (shown != null)
            Padding(
              padding: const EdgeInsets.only(top: Space.lg),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: context.bogcl.danger),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Text(
                      shown,
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
            label: l10n.attRegSubmit,
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
            style: Theme.of(context).textTheme.bodyMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}
