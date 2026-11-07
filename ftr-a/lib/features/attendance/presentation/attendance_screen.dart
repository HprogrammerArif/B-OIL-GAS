import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/attendance/data/attendance_repository.dart';
import 'package:bogcl_oneops/features/attendance/data/location_service.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_providers.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_ui.dart';
import 'package:bogcl_oneops/features/attendance/presentation/widgets/geofence_mini_map.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_screen.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
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

/// Unified Daily Attendance & Leave Screen (MOD-10):
/// Tab 1: My Shift & Punch (Console + GeofenceMiniMap + Outside Geofence Alert)
/// Tab 2: My Leave (Balances + Leave Requests + 1-Tap Apply)
/// Tab 3: Team Roster & Leave (Filterable Roster + 1-Tap Outside Check-In Confirmation)
class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  int _selectedTab = 0;
  late String _month = _monthKey(Dhaka.today());
  _Phase _phase = _Phase.idle;
  bool _supervisorConfirmedLocally = false;

  String get _thisMonth => _monthKey(Dhaka.today());

  void _shiftMonth(int delta) {
    final p = _month.split('-').map(int.parse).toList();
    setState(() => _month = _monthKey(DateTime.utc(p[0], p[1] + delta)));
  }

  Future<void> _refresh() async {
    ref
      ..invalidate(todayAttendanceProvider)
      ..invalidate(attendanceMonthProvider(_month))
      ..invalidate(myRegularisationsProvider)
      ..invalidate(teamAttendanceProvider);
    await ref.read(todayAttendanceProvider.future);
  }

  Future<void> _punch(TodayAttendance today) async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final type = today.nextPunchType;
    final mockLoc = ref.read(mockConfigControllerProvider).location;
    final isSimulatedOutside = mockLoc == DemoLocation.outside;

    // If outside geofence, prompt for reason before recording
    String? outsideReason;
    if (isSimulatedOutside && type == 'IN') {
      outsideReason = await _promptOutsideReason(context, bangla);
      if (outsideReason == null) return; // User cancelled
    }

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

  Future<String?> _promptOutsideReason(BuildContext context, bool bangla) {
    final presets = [
      if (bangla)
        'মতিঝিল বাণিজ্যিক এলাকায় গ্রাহক / ডিলার পরিদর্শন'
      else
        'Client / Dealer visit at Motijheel commercial area',
      if (bangla)
        'তেজগাঁও সড়ক ভবনে আরএইচডি মন্ত্রণালয়ের মিটিং'
      else
        'RHD Ministry meeting at Sarak Bhaban, Tejgaon',
      if (bangla)
        'কেরানীগঞ্জ বিটুমিন জেটিতে সরাসরি ট্রানজিট'
      else
        'Direct transit to Keraniganj Bitumen Jetty',
      if (bangla)
        'বুড়িগঙ্গা সেতু করিডোরে ট্রাফিক জ্যামের বিলম্ব'
      else
        'Traffic delay on Buriganga Bridge corridor',
    ];

    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_city, color: Colors.deepOrange),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'জিওফেন্সের বাইরে চেক-ইন কারণ'
                        : 'Outside Geofence Reason',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'আপনি সাইট গেট থেকে বাইরে আছেন (৪.২ কিমি)। সুপারভাইজার অনুমোদনের জন্য কারণ নির্বাচন করুন:'
                    : 'You are currently outside the site perimeter (4.2 km). Select a visit preset for supervisor approval:',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: Space.md),
              for (final p in presets) ...[
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                  title: Text(p, style: const TextStyle(fontSize: 13)),
                  leading: const Icon(Icons.check_circle_outline, size: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Corner.md),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  onTap: () => Navigator.of(ctx).pop(p),
                ),
                const SizedBox(height: Space.xs),
              ],
            ],
          ),
        ),
      ),
    );
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
    final bangla = context.isBangla;
    final today = ref.watch(todayAttendanceProvider);
    final session = ref.watch(sessionControllerProvider).value;
    final isSupervisor =
        session?.roleKeys.any(
          (r) => const {'HOD', 'HR_ADMIN', 'PLANT_GM', 'CHAIRMAN'}.contains(r),
        ) ??
        false;

    final tabs = [
      if (bangla) 'আমার শিফট ও হাজিরা' else 'My Shift & Punch',
      if (bangla) 'আমার ছুটি' else 'My Leave',
      if (isSupervisor)
        if (bangla) 'টিম হাজিরা ও ছুটি' else 'Team Roster & Leave',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          bangla ? 'দৈনিক উপস্থিতি ও ছুটি' : 'Daily Attendance & Leave',
        ),
        actions: const [AppBarActions()],
      ),
      floatingActionButton: _selectedTab == 0
          ? FloatingActionButton.extended(
              onPressed: () =>
                  unawaited(context.push(AppRoutes.attendanceRegularise)),
              icon: const Icon(Icons.edit_calendar_outlined),
              label: Text(l10n.attRegularise),
            )
          : null,
      body: today.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
        data: (t) {
          final isPunchedIn = t.day.firstInAt != null;
          final mockLoc = ref.watch(mockConfigControllerProvider).location;
          final isOutside =
              mockLoc == DemoLocation.outside || t.day.pendingReview;

          // Verdict Banner
          final String verdictText;
          final Color verdictColor;
          final IconData verdictIcon;

          if (!isPunchedIn) {
            verdictText = bangla
                ? 'আজ আপনি এখনও উপস্থিতি দেননি। শিফট: সাধারণ (সকাল ০৯:০০ - সন্ধ্যা ০৬:০০)।'
                : 'You have not punched in yet today. Shift: General (09:00 AM – 06:00 PM).';
            verdictColor = Colors.blueGrey;
            verdictIcon = Icons.info_outline;
          } else if (isOutside && !_supervisorConfirmedLocally) {
            verdictText = bangla
                ? 'আপনি সকাল ১০:৫৬ এ চেক-ইন করেছেন (বারিধারা সদর দপ্তর থেকে ৪.২ কিমি দূরে)। সুপারভাইজারের অনুমোদনের অপেক্ষায় রয়েছে।'
                : 'You punched in at 10:56 AM (4.2 km from Head Office). Outside-geofence check-in is pending supervisor confirmation.';
            verdictColor = const Color(0xFF6B21A8);
            verdictIcon = Icons.shield_outlined;
          } else {
            verdictText = bangla
                ? 'আপনি সকাল ০৮:৫৪ এ বারিধারা প্রধান কার্যালয়ে চেক-ইন করেছেন (গেট থেকে ১১০ মি)। শিফট শেষে পাঞ্চ-আউট করুন।'
                : 'You punched in at 08:54 AM at Head Office, Baridhara (110 m from gate). Punch out when your shift ends.';
            verdictColor = Colors.teal;
            verdictIcon = Icons.check_circle_outline;
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Plain-Language Verdict Banner
              Container(
                margin: const EdgeInsets.fromLTRB(
                  Space.lg,
                  Space.sm,
                  Space.lg,
                  0,
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: Space.sm,
                ),
                decoration: BoxDecoration(
                  color: verdictColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(Corner.md),
                  border: Border.all(
                    color: verdictColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(verdictIcon, size: 18, color: verdictColor),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        verdictText,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: verdictColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Segmented Sub-Tabs
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  Space.lg,
                  Space.sm,
                  Space.lg,
                  Space.xs,
                ),
                child: Row(
                  children: [
                    for (var i = 0; i < tabs.length; i++) ...[
                      ChoiceChip(
                        label: Text(tabs[i]),
                        selected: _selectedTab == i,
                        onSelected: (_) {
                          Haptics.tap();
                          setState(() => _selectedTab = i);
                        },
                      ),
                      const SizedBox(width: Space.xs),
                    ],
                  ],
                ),
              ),

              // Tab Content Switcher
              Expanded(
                child: switch (_selectedTab) {
                  1 => const MyLeaveView(),
                  2 => _TeamRosterTab(
                    onConfirmOutside: () {
                      setState(() => _supervisorConfirmedLocally = true);
                    },
                  ),
                  _ => RefreshIndicator(
                    onRefresh: _refresh,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.only(bottom: 96),
                      children: [
                        _TodayCard(
                          today: t,
                          phase: _phase,
                          isOutsideSimulated: isOutside,
                          supervisorConfirmedLocally:
                              _supervisorConfirmedLocally,
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
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TodayCard extends StatelessWidget {
  const _TodayCard({
    required this.today,
    required this.phase,
    required this.isOutsideSimulated,
    required this.supervisorConfirmedLocally,
    required this.onPunch,
  });

  final TodayAttendance today;
  final _Phase phase;
  final bool isOutsideSimulated;
  final bool supervisorConfirmedLocally;
  final VoidCallback onPunch;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final lang = Localizations.localeOf(context).languageCode;
    final day = today.day;
    final muted = theme.colorScheme.onSurfaceVariant;
    final onLeave = day.status == DayStatus.onLeave;
    final busy = phase != _Phase.idle;
    final nextIn = today.nextIsIn;
    final worked = day.workedMinutes;

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
                  today.shift.displayName(bangla: bangla),
                  today.shift.startTime,
                  today.shift.endTime,
                ),
                style: theme.textTheme.bodySmall?.copyWith(color: muted),
              ),
              const SizedBox(height: Space.md),

              // Time metrics (In / Out / Worked)
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
              const SizedBox(height: Space.md),

              // Geofence Mini-Map Schematic Visualization
              GeofenceMiniMap(
                isInside: !isOutsideSimulated,
                distanceM: isOutsideSimulated ? 4200 : 110,
              ),
              const SizedBox(height: Space.sm),

              // Outside Geofence Warning Notice (Matches user screenshot)
              if (isOutsideSimulated && !supervisorConfirmedLocally)
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBF4FD),
                    borderRadius: BorderRadius.circular(Corner.md),
                    border: Border.all(color: const Color(0xFFE9D5FF)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        color: Color(0xFF7E22CE),
                        size: 18,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          bangla
                              ? 'আজকের চেক-ইন সাইট জিওফেন্সের বাইরে ছিল এবং আপনার সুপারভাইজার কর্তৃক নিশ্চিত করা হবে।'
                              : "Today's check-in was outside the site geofence and will be confirmed by your supervisor.",
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B21A8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else if (supervisorConfirmedLocally)
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(Corner.md),
                    border: Border.all(color: Colors.teal.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: Colors.teal,
                        size: 18,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          bangla
                              ? 'সুপারভাইজার কর্তৃক বাইরের অবস্থান অনুমোদন করা হয়েছে।'
                              : 'Supervisor confirmed outside-geofence check-in.',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.teal,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: Space.md),

              // Punch Button
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

              const SizedBox(height: Space.xs),
              Center(
                child: Text(
                  bangla
                      ? 'প্রধান কার্যালয়ের ৩০০ মি বা প্ল্যান্ট গেটের ৫০০ মিটারের মধ্যে পাঞ্চ গ্রহণযোগ্য।'
                      : 'Punch-in is accepted within 300 m of Head Office or 500 m of the plant gate.',
                  style: TextStyle(
                    fontSize: 11,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TeamRosterTab extends ConsumerStatefulWidget {
  const _TeamRosterTab({required this.onConfirmOutside});

  final VoidCallback onConfirmOutside;

  @override
  ConsumerState<_TeamRosterTab> createState() => _TeamRosterTabState();
}

class _TeamRosterTabState extends ConsumerState<_TeamRosterTab> {
  String _filter = 'ALL';
  final Set<String> _locallyConfirmed = {};

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final async = ref.watch(teamAttendanceProvider);
    final team = async.asData?.value;

    if (team == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final roster = team.roster;
    final filtered = roster.where((r) {
      if (_filter == 'ON_DUTY') {
        return r.status == 'PRESENT' || r.status == 'LATE';
      }
      if (_filter == 'OUTSIDE') {
        return r.needsReview;
      }
      if (_filter == 'LATE') {
        return r.status == 'LATE';
      }
      if (_filter == 'LEAVE') {
        return r.status == 'ON_LEAVE' || r.status == 'ABSENT';
      }
      return true;
    }).toList();

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(teamAttendanceProvider),
      child: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          // 4 Team KPIs
          Row(
            children: [
              _kpiCell(
                title: bangla ? 'উপস্থিত' : 'On Site',
                val: '${team.present}',
                color: Colors.green,
                theme: theme,
              ),
              const SizedBox(width: Space.xs),
              _kpiCell(
                title: bangla ? 'দেরিতে' : 'Late',
                val: '${team.late}',
                color: Colors.orange,
                theme: theme,
              ),
              const SizedBox(width: Space.xs),
              _kpiCell(
                title: bangla ? 'অনুমোদন প্রয়োজন' : 'Outside GPS',
                val: '${team.toReview}',
                color: const Color(0xFF7E22CE),
                theme: theme,
              ),
              const SizedBox(width: Space.xs),
              _kpiCell(
                title: bangla ? 'ছুটিতে' : 'On Leave',
                val: '${team.onLeave}',
                color: Colors.blueGrey,
                theme: theme,
              ),
            ],
          ),
          const SizedBox(height: Space.md),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip(
                  'ALL',
                  bangla ? 'সকল (${roster.length})' : 'All (${roster.length})',
                ),
                const SizedBox(width: Space.xs),
                _filterChip('ON_DUTY', bangla ? 'কর্মরত' : 'On Duty'),
                const SizedBox(width: Space.xs),
                _filterChip('OUTSIDE', bangla ? 'বাইরে চেক-ইন' : 'Outside GPS'),
                const SizedBox(width: Space.xs),
                _filterChip('LATE', bangla ? 'দেরিতে' : 'Late'),
                const SizedBox(width: Space.xs),
                _filterChip('LEAVE', bangla ? 'ছুটি / অনুপস্থিত' : 'On Leave'),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // Staff Roster
          if (filtered.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: Space.xxxl),
              child: EmptyState(
                icon: Icons.people_outline,
                title: bangla
                    ? 'কোন কর্মী পাওয়া যায়নি'
                    : 'No staff in this view',
                message: '',
              ),
            )
          else
            for (final r in filtered) ...[
              Container(
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(
                  color: scheme.surface,
                  borderRadius: BorderRadius.circular(Corner.lg),
                  border: Border.all(
                    color:
                        r.needsReview &&
                            !_locallyConfirmed.contains(r.employeeId)
                        ? const Color(0xFFC084FC)
                        : scheme.outlineVariant.withValues(alpha: 0.6),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.teal.shade700,
                          child: Text(
                            r.name.isNotEmpty ? r.name[0] : 'E',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                bangla ? r.nameBn : r.name,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                '${r.empCode} · ${r.status}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (r.needsReview &&
                            !_locallyConfirmed.contains(r.employeeId))
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8FF),
                              borderRadius: BorderRadius.circular(Corner.sm),
                            ),
                            child: const Text(
                              'OUTSIDE GEOFENCE',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF7E22CE),
                              ),
                            ),
                          )
                        else
                          StatusPill(
                            label: r.status,
                            tone: r.status == 'PRESENT'
                                ? StatusTone.success
                                : (r.status == 'LATE'
                                      ? StatusTone.warning
                                      : StatusTone.info),
                          ),
                      ],
                    ),
                    if (r.needsReview &&
                        !_locallyConfirmed.contains(r.employeeId)) ...[
                      const SizedBox(height: Space.xs),
                      Text(
                        bangla
                            ? 'কর্মী ৪.২ কিমি দূর থেকে চেক-ইন করেছেন (কারণ: ক্লায়েন্ট ভিজিট)।'
                            : 'Employee checked in 4.2 km from gate (Reason: Client visit).',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF6B21A8),
                        ),
                      ),
                      const SizedBox(height: Space.xs),
                      Align(
                        alignment: Alignment.centerRight,
                        child: FilledButton.tonalIcon(
                          style: FilledButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                          icon: const Icon(Icons.check, size: 16),
                          label: Text(
                            bangla ? 'চেক-ইন অনুমোদন করুন' : 'Confirm Check-In',
                          ),
                          onPressed: () {
                            Haptics.tap();
                            setState(() => _locallyConfirmed.add(r.employeeId));
                            widget.onConfirmOutside();
                            AppToast.show(
                              context,
                              bangla
                                  ? 'চেক-ইন নিশ্চিত করা হয়েছে'
                                  : 'Outside check-in confirmed successfully',
                              tone: StatusTone.success,
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: Space.sm),
            ],
        ],
      ),
    );
  }

  Widget _kpiCell({
    required String title,
    required String val,
    required Color color,
    required ThemeData theme,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: Space.sm,
          horizontal: Space.xs,
        ),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(Corner.md),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(
              val,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 10,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String key, String label) {
    final selected = _filter == key;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) {
        Haptics.tap();
        setState(() => _filter = key);
      },
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
