import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/attendance/data/attendance_repository.dart';
import 'package:bogcl_oneops/features/attendance/data/location_service.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_providers.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Phase { idle, locating, sending }

String _monthKey(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}';

/// Attendance home: punch card, month summary, daily record and the caller's
/// regularisation requests.
class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  late String _month = _monthKey(Dhaka.today());
  _Phase _phase = _Phase.idle;

  String get _thisMonth => _monthKey(Dhaka.today());

  void _shiftMonth(int delta) {
    final p = _month.split('-').map(int.parse).toList();
    setState(() => _month = _monthKey(DateTime.utc(p[0], p[1] + delta)));
  }

  Future<void> _refresh() async {
    ref
      ..invalidate(todayAttendanceProvider)
      ..invalidate(attendanceMonthProvider(_month))
      ..invalidate(myRegularisationsProvider);
    await ref.read(todayAttendanceProvider.future);
  }

  Future<void> _punch(TodayAttendance today) async {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final type = today.nextPunchType;
    setState(() => _phase = _Phase.locating);
    try {
      final LocationFix fix;
      try {
        fix = await ref.read(locationServiceProvider).capture();
      } on LocationException catch (e) {
        if (mounted) await _locationProblem(e.failure);
        return;
      }
      if (!mounted) return;
      setState(() => _phase = _Phase.sending);
      final result = await ref
          .read(attendanceRepositoryProvider)
          .punch(
            type: type,
            fix: fix,
            label: type == 'IN' ? l10n.attPunchIn : l10n.attPunchOut,
          );
      await _refresh();
      if (!mounted) return;
      switch (result) {
        case Queued():
          AppToast.show(context, l10n.attPunchQueued);
        case Sent(:final data):
          await _showOutcome(
            type: type,
            outcome: PunchOutcome.fromJson(Envelope.object(data)),
            lang: lang,
          );
      }
    } on ApiException catch (_) {
      if (mounted) {
        AppToast.show(context, l10n.attPunchFailed, tone: StatusTone.danger);
      }
    } finally {
      if (mounted) setState(() => _phase = _Phase.idle);
    }
  }

  Future<void> _locationProblem(LocationFailure failure) async {
    final l10n = context.l10n;
    final message = switch (failure) {
      LocationFailure.serviceOff => l10n.attLocServiceOff,
      LocationFailure.denied => l10n.attLocDenied,
      LocationFailure.deniedForever => l10n.attLocDeniedForever,
      LocationFailure.unavailable => l10n.attLocUnavailable,
    };
    final openSettings =
        failure == LocationFailure.deniedForever ||
        failure == LocationFailure.serviceOff;
    final go = await showConfirmSheet(
      context,
      title: l10n.attLocTitle,
      message: message,
      confirmLabel: openSettings ? l10n.attOpenSettings : l10n.attTryAgain,
    );
    if (!go || !mounted) return;
    if (openSettings) {
      await ref.read(locationServiceProvider).openSettings();
    }
  }

  Future<void> _showOutcome({
    required String type,
    required PunchOutcome outcome,
    required String lang,
  }) async {
    final regularise = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (_) => _OutcomeSheet(type: type, outcome: outcome, lang: lang),
    );
    if (regularise ?? false) {
      if (!mounted) return;
      unawaited(
        context.push(
          '${AppRoutes.attendanceRegularise}'
          '?date=${Dhaka.today().toIso8601String().substring(0, 10)}'
          '&type=${type == 'IN' ? 'MISSED_PUNCH' : 'FIELD_DUTY'}',
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final today = ref.watch(todayAttendanceProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.attTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            unawaited(context.push(AppRoutes.attendanceRegularise)),
        icon: const Icon(Icons.edit_calendar_outlined),
        label: Text(l10n.attRegularise),
      ),
      body: today.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
        data: (t) => RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              _TodayCard(
                today: t,
                phase: _phase,
                onPunch: () => unawaited(_punch(t)),
              ),
              _MonthSection(
                month: _month,
                canGoNext: _month.compareTo(_thisMonth) < 0,
                onPrev: () => _shiftMonth(-1),
                onNext: () => _shiftMonth(1),
              ),
              const _RegularisationList(),
            ],
          ),
        ),
      ),
    );
  }
}

class _TodayCard extends StatelessWidget {
  const _TodayCard({
    required this.today,
    required this.phase,
    required this.onPunch,
  });

  final TodayAttendance today;
  final _Phase phase;
  final VoidCallback onPunch;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final day = today.day;
    final muted = theme.colorScheme.onSurfaceVariant;
    final onLeave = day.status == DayStatus.onLeave;
    final busy = phase != _Phase.idle;
    final nextIn = today.nextIsIn;
    final worked = day.workedMinutes;

    String? note;
    if (onLeave) {
      note = l10n.attOnLeaveToday;
    } else if (day.holidayName != null) {
      note = context.isBangla
          ? (day.holidayNameBn ?? day.holidayName)
          : day.holidayName;
    }

    return Padding(
      padding: const EdgeInsets.all(Space.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      DateFmt.key(day.date, lang, pattern: 'EEEE, dd MMM yyyy'),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  if (day.status != null)
                    StatusPill(
                      label: dayStatusLabel(l10n, day.status),
                      tone: dayStatusTone(day.status),
                    ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                l10n.attShiftLine(
                  today.shift.displayName(bangla: context.isBangla),
                  today.shift.startTime,
                  today.shift.endTime,
                ),
                style: theme.textTheme.bodySmall?.copyWith(color: muted),
              ),
              const SizedBox(height: Space.lg),
              Row(
                children: [
                  Expanded(
                    child: _TimeBlock(
                      label: l10n.attIn,
                      value: day.firstInAt == null
                          ? '—'
                          : DateFmt.time(day.firstInAt!, lang),
                    ),
                  ),
                  Expanded(
                    child: _TimeBlock(
                      label: l10n.attOut,
                      value: day.lastOutAt == null
                          ? '—'
                          : DateFmt.time(day.lastOutAt!, lang),
                    ),
                  ),
                  Expanded(
                    child: _TimeBlock(
                      label: l10n.attWorked,
                      value: worked == 0
                          ? '—'
                          : durationText(l10n, worked, lang),
                    ),
                  ),
                ],
              ),
              if (day.lateMinutes > 0)
                _Flag(
                  icon: Icons.schedule,
                  text: l10n.attLateBy(day.lateMinutes),
                  color: context.bogcl.warning,
                ),
              if (day.pendingReview)
                _Flag(
                  icon: Icons.hourglass_top,
                  text: l10n.attPendingReview,
                  color: context.bogcl.warning,
                ),
              if (note != null)
                _Flag(icon: Icons.info_outline, text: note, color: muted),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: switch (phase) {
                  _Phase.locating => l10n.attLocating,
                  _Phase.sending => l10n.attRecording,
                  _Phase.idle => nextIn ? l10n.attPunchIn : l10n.attPunchOut,
                },
                icon: nextIn ? Icons.login : Icons.logout,
                loading: busy,
                onPressed: onLeave || busy ? null : onPunch,
              ),
              if (today.overtimeMinutesMtd > 0)
                Padding(
                  padding: const EdgeInsets.only(top: Space.md),
                  child: Text(
                    l10n.attOvertimeMtd(
                      durationText(l10n, today.overtimeMinutesMtd, lang),
                    ),
                    style: theme.textTheme.bodySmall?.copyWith(color: muted),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeBlock extends StatelessWidget {
  const _TimeBlock({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      container: true,
      label: '$label $value',
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 2),
            Text(value, style: theme.textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}

class _Flag extends StatelessWidget {
  const _Flag({required this.icon, required this.text, required this.color});

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: Space.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: Space.sm),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthSection extends ConsumerWidget {
  const _MonthSection({
    required this.month,
    required this.canGoNext,
    required this.onPrev,
    required this.onNext,
  });

  final String month;
  final bool canGoNext;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final range = ref.watch(attendanceMonthProvider(month));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: l10n.attDaysTitle,
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                tooltip: l10n.attPrevMonth,
                icon: const Icon(Icons.chevron_left),
                onPressed: onPrev,
              ),
              Text(DateFmt.key('$month-01', lang, pattern: 'MMM yyyy')),
              IconButton(
                tooltip: l10n.attNextMonth,
                icon: const Icon(Icons.chevron_right),
                onPressed: canGoNext ? onNext : null,
              ),
            ],
          ),
        ),
        range.when(
          loading: () => const SizedBox(
            height: 160,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => ErrorState(
            onRetry: () => ref.invalidate(attendanceMonthProvider(month)),
          ),
          data: (r) {
            final days = r.days.where((d) => d.status != null).toList();
            return Column(
              children: [
                _SummaryRow(summary: r.summary),
                if (days.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: Space.xl),
                    child: EmptyState(
                      icon: Icons.event_busy_outlined,
                      title: l10n.attEmptyTitle,
                      message: l10n.attEmptyMessage,
                    ),
                  )
                else
                  for (final d in days)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Space.lg,
                        vertical: Space.xs,
                      ),
                      child: _DayRow(day: d),
                    ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.summary});

  final AttendanceSummary summary;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final bogcl = context.bogcl;
    Widget cell(String label, int value, Color? color) => Expanded(
      child: Semantics(
        container: true,
        label: '$label $value',
        child: ExcludeSemantics(
          child: Column(
            children: [
              Text(
                lang == 'bn' ? toBengaliDigits('$value') : '$value',
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(color: color),
              ),
              Text(label, style: Theme.of(context).textTheme.labelSmall),
            ],
          ),
        ),
      ),
    );
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Space.md),
          child: Row(
            children: [
              cell(l10n.attSumPresent, summary.present, bogcl.success),
              cell(l10n.attSumLate, summary.late, bogcl.warning),
              cell(l10n.attSumAbsent, summary.absent, bogcl.danger),
              cell(l10n.attSumLeave, summary.leave, bogcl.info),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayRow extends StatelessWidget {
  const _DayRow({required this.day});

  final AttendanceDay day;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final inAt = day.firstInAt;
    final outAt = day.lastOutAt;
    final times = inAt == null
        ? (context.isBangla ? day.holidayNameBn : day.holidayName)
        : '${DateFmt.time(inAt, lang)} – '
              '${outAt == null ? (day.missingOut ? l10n.attMissingOut : '…') : DateFmt.time(outAt, lang)}';
    return ListRow(
      title: DateFmt.key(day.date, lang, pattern: 'EEE, dd MMM'),
      subtitle: times,
      trailing: StatusPill(
        label: dayStatusLabel(l10n, day.status),
        tone: day.missingOut ? StatusTone.warning : dayStatusTone(day.status),
      ),
      onTap: () => unawaited(
        showModalBottomSheet<void>(
          context: context,
          showDragHandle: true,
          isScrollControlled: true,
          builder: (_) => _DaySheet(day: day),
        ),
      ),
    );
  }
}

class _DaySheet extends StatelessWidget {
  const _DaySheet({required this.day});

  final AttendanceDay day;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    DateFmt.key(day.date, lang, pattern: 'EEEE, dd MMM yyyy'),
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                StatusPill(
                  label: dayStatusLabel(l10n, day.status),
                  tone: dayStatusTone(day.status),
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            if (day.workedMinutes > 0)
              Text(
                '${l10n.attWorked}: ${durationText(l10n, day.workedMinutes, lang)}'
                '${day.overtimeMinutes > 0 ? ' · ${l10n.attOvertimeMtd(durationText(l10n, day.overtimeMinutes, lang))}' : ''}',
                style: theme.textTheme.bodyMedium,
              ),
            if (day.lateMinutes > 0)
              Text(
                l10n.attLateBy(day.lateMinutes),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: context.bogcl.warning,
                ),
              ),
            if (day.leaveRefNo != null)
              Text(day.leaveRefNo!, style: theme.textTheme.bodySmall),
            SectionHeader(title: l10n.attDayPunches),
            if (day.punches.isEmpty)
              Text(l10n.attNoPunches, style: theme.textTheme.bodyMedium)
            else
              for (final p in day.punches)
                ListRow(
                  title:
                      '${p.isIn ? l10n.attIn : l10n.attOut} · '
                      '${DateFmt.time(p.punchedAt, lang)}',
                  subtitle: p.site?.displayName(bangla: context.isBangla),
                  trailing: StatusPill(
                    label: switch (p.result) {
                      PunchResult.accepted => l10n.attPunchAccepted,
                      PunchResult.pendingRegularisation => l10n.attPunchPending,
                      _ => l10n.attPunchRejected,
                    },
                    tone: switch (p.result) {
                      PunchResult.accepted => StatusTone.success,
                      PunchResult.pendingRegularisation => StatusTone.warning,
                      _ => StatusTone.danger,
                    },
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _RegularisationList extends ConsumerWidget {
  const _RegularisationList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final regs = ref.watch(myRegularisationsProvider);
    final items = regs.value;
    if (items == null || items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: l10n.attRegsTitle),
        for (final r in items)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.xs,
            ),
            child: ListRow(
              title: '${regTypeLabel(l10n, r.type)} · ${r.refNo}',
              subtitle: DateFmt.key(r.date, lang),
              trailing: StatusPill(
                label: regStatusLabel(l10n, r.status),
                tone: regStatusTone(r.status),
              ),
            ),
          ),
      ],
    );
  }
}

class _OutcomeSheet extends StatelessWidget {
  const _OutcomeSheet({
    required this.type,
    required this.outcome,
    required this.lang,
  });

  final String type;
  final PunchOutcome outcome;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bogcl = context.bogcl;
    final site = outcome.geofenceName == null
        ? null
        : (context.isBangla ? outcome.geofenceNameBn : outcome.geofenceName);
    final distance = (outcome.distanceM ?? 0).round();

    final (IconData icon, Color color, String title, String message) = _content(
      l10n,
      bogcl,
      site,
      distance,
    );

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Space.xxl,
          Space.sm,
          Space.xxl,
          Space.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: color),
            const SizedBox(height: Space.md),
            Text(
              title,
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.sm),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.xl),
            if (outcome.canRegularise) ...[
              PrimaryButton(
                label: l10n.attRegularise,
                icon: Icons.edit_calendar_outlined,
                onPressed: () => Navigator.of(context).pop(true),
              ),
              const SizedBox(height: Space.sm),
              PrimaryButton.secondary(
                label: l10n.attClose,
                onPressed: () => Navigator.of(context).pop(false),
              ),
            ] else
              PrimaryButton(
                label: l10n.attClose,
                onPressed: () => Navigator.of(context).pop(false),
              ),
          ],
        ),
      ),
    );
  }

  (IconData, Color, String, String) _content(
    AppL10n l10n,
    BogclColors bogcl,
    String? site,
    int distance,
  ) {
    final isIn = type == 'IN';
    return switch (outcome.result) {
      PunchResult.accepted => (
        Icons.check_circle,
        bogcl.success,
        outcome.duplicate
            ? l10n.attResultDuplicate
            : (isIn ? l10n.attResultInTitle : l10n.attResultOutTitle),
        site == null ? l10n.attResultOk : l10n.attResultAtSite(site),
      ),
      PunchResult.pendingRegularisation => (
        Icons.hourglass_top,
        bogcl.warning,
        l10n.attResultPendingTitle,
        l10n.attResultPendingMessage,
      ),
      PunchResult.rejectedOutsideFence => (
        Icons.location_off,
        bogcl.danger,
        l10n.attResultOutsideTitle,
        l10n.attResultOutsideMessage(distance, site ?? ''),
      ),
      PunchResult.rejectedAccuracy => (
        Icons.gps_not_fixed,
        bogcl.danger,
        l10n.attResultAccuracyTitle,
        l10n.attResultAccuracyMessage,
      ),
      PunchResult.rejectedMock => (
        Icons.gpp_bad_outlined,
        bogcl.danger,
        l10n.attResultMockTitle,
        l10n.attResultMockMessage,
      ),
    };
  }
}
