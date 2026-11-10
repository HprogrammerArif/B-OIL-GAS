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
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
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

enum _Phase { idle, locating, verifyingFence, sending }

String _monthKey(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}';

/// Unified Daily Attendance & Leave Screen (MOD-10):
/// Tab 1: My Shift & Punch
/// Tab 2: My Leave
/// Tab 3: Team roster — who is in, who is not, and what needs a look
class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen>
    with WidgetsBindingObserver {
  int _selectedTab = 0;
  late String _month = _monthKey(Dhaka.today());
  _Phase _phase = _Phase.idle;
  final bool _supervisorConfirmedLocally = false;
  bool _gpsHardwareReady = true;
  double _lastAccuracyM = 5.8;

  String get _thisMonth => _monthKey(Dhaka.today());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_refreshHardwareStatus());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refreshHardwareStatus());
    }
  }

  Future<void> _refreshHardwareStatus() async {
    final status = await ref.read(locationServiceProvider).checkStatus();
    if (!mounted) return;
    setState(() {
      _gpsHardwareReady = status.isReady;
      if (status.lastAccuracyM != null && status.lastAccuracyM! > 0) {
        _lastAccuracyM = status.lastAccuracyM!.clamp(3.8, 24.0);
      }
    });
  }

  void _shiftMonth(int delta) {
    final p = _month.split('-').map(int.parse).toList();
    setState(() => _month = _monthKey(DateTime.utc(p[0], p[1] + delta)));
  }

  Future<void> _refresh() async {
    unawaited(_refreshHardwareStatus());
    ref
      ..invalidate(todayAttendanceProvider)
      ..invalidate(attendanceMonthProvider(_month))
      ..invalidate(myRegularisationsProvider)
      ..invalidate(teamAttendanceProvider);
    await ref.read(todayAttendanceProvider.future);
  }

  Future<void> _handleEnableGpsTap() async {
    try {
      await ref.read(locationServiceProvider).ensureReady();
      await _refreshHardwareStatus();
      if (!mounted) return;
      AppToast.show(
        context,
        context.isBangla
            ? 'লোকেশন (GPS) সক্রিয় ও প্রস্তুত আছে'
            : 'Device Location (GPS) is active and ready',
        tone: StatusTone.success,
      );
    } on LocationException catch (e) {
      if (mounted) await _locationProblem(e.failure);
    }
  }

  Future<void> _punch(TodayAttendance today) async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final type = today.nextPunchType;
    final mockLoc = ref.read(mockConfigControllerProvider).location;
    final isSimulatedOutside = mockLoc == DemoLocation.outside;

    // 1. Verify real OS Location Service (GPS) and Permission first
    setState(() => _phase = _Phase.locating);
    final LocationFix fix;
    try {
      fix = await ref.read(locationServiceProvider).capture();
      if (mounted) {
        setState(() {
          _gpsHardwareReady = true;
          if (fix.accuracyM > 0) {
            _lastAccuracyM = fix.accuracyM;
          }
        });
      }
    } on LocationException catch (e) {
      if (mounted) {
        setState(() {
          _phase = _Phase.idle;
          _gpsHardwareReady = false;
        });
        await _locationProblem(e.failure);
      }
      return;
    }

    if (!mounted) return;

    // 2. If outside geofence on Field Duty, prompt for Field Duty reason
    String? outsideReason;
    if (isSimulatedOutside && type == 'IN') {
      setState(() => _phase = _Phase.idle);
      outsideReason = await _promptOutsideReason(context, bangla);
      if (outsideReason == null || !mounted) return; // User cancelled
    }

    try {
      // 3. Step 2: Verifying BOGCL site geofence perimeter
      setState(() => _phase = _Phase.verifyingFence);
      await Future<void>.delayed(const Duration(milliseconds: 450));
      if (!mounted) return;

      // 4. Step 3: Recording attendance log
      setState(() => _phase = _Phase.sending);
      final result = await ref
          .read(attendanceRepositoryProvider)
          .punch(
            type: type,
            fix: fix,
            label: type == 'IN' ? l10n.attPunchIn : l10n.attPunchOut,
            note: outsideReason,
            fieldDutyRequested: outsideReason != null,
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
            fix: fix,
            shift: today.shift,
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
                  Expanded(
                    child: Text(
                      bangla
                          ? 'জিওফেন্সের বাইরে চেক-ইন কারণ'
                          : 'Field Duty / Off-Site Check-In Reason',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'আপনি সাইট গেট থেকে বাইরে আছেন (৪.২ কিমি)। সুপারভাইজার অনুমোদনের জন্য কারণ নির্বাচন করুন:'
                    : 'Your GPS fix is outside the site perimeter (4.2 km). Select your official field duty reason:',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: Space.md),
              for (final p in presets) ...[
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: Space.sm,
                  ),
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
    final action = await showModalBottomSheet<_LocationSheetAction>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => _LocationEnableSheet(failure: failure),
    );
    if (action == null || !mounted) return;
    final svc = ref.read(locationServiceProvider);
    switch (action) {
      case _LocationSheetAction.openLocationSettings:
        await svc.openLocationSettings();
      case _LocationSheetAction.openAppSettings:
        await svc.openAppSettings();
      case _LocationSheetAction.retryNow:
        await _handleEnableGpsTap();
    }
  }

  Future<void> _showOutcome({
    required String type,
    required PunchOutcome outcome,
    required LocationFix fix,
    required Shift shift,
    required String lang,
  }) async {
    final regularise = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => _OutcomeSheet(
        type: type,
        outcome: outcome,
        fix: fix,
        shift: shift,
        lang: lang,
      ),
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
    final bangla = context.isBangla;
    final today = ref.watch(todayAttendanceProvider);
    final session = ref.watch(sessionControllerProvider).value;
    final canPunch = session?.can('attendance:punch') ?? false;
    final isSupervisor =
        (session?.can('attendance:read', GrantScope.team) ?? false) ||
        (session?.roleKeys.any(
              (r) => const {
                'HOD',
                'HR_ADMIN',
                'PLANT_GM',
                'CHAIRMAN',
                'LINE_MANAGER',
              }.contains(r),
            ) ??
            false);

    if (!canPunch && isSupervisor) {
      return Scaffold(
        appBar: AppBar(
          title: Text(context.l10n.attTitle),
          actions: const [AppBarActions()],
        ),
        body: const _TeamRosterTab(),
      );
    }

    final tabs = [
      if (bangla) 'আমার শিফট ও হাজিরা' else 'My Shift & Punch',
      if (bangla) 'আমার ছুটি' else 'My Leave',
      if (isSupervisor)
        if (bangla) 'টিম হাজিরা ও ছুটি' else 'Team Roster & Leave',
    ];

    final l10n = context.l10n;
    final canRequestLeave = session?.can('leave:request') ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          bangla ? 'দৈনিক উপস্থিতি ও ছুটি' : 'Daily Attendance & Leave',
        ),
        actions: const [AppBarActions()],
      ),
      floatingActionButton: _selectedTab == 1 && canRequestLeave
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.leaveNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.leaveApply),
            )
          : null,
      body: today.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
        data: (t) {
          final mockLoc = ref.watch(mockConfigControllerProvider).location;
          final isOutside =
              mockLoc == DemoLocation.outside || t.day.pendingReview;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Segmented Sub-Tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(
                  Space.lg,
                  Space.sm,
                  Space.lg,
                  Space.xs,
                ),
                child: Row(
                  children: [
                    for (var i = 0; i < tabs.length; i++) ...[
                      if (i > 0) const SizedBox(width: Space.xs),
                      ChoiceChip(
                        label: Text(tabs[i]),
                        selected: _selectedTab == i,
                        onSelected: (_) {
                          Haptics.tap();
                          setState(() => _selectedTab = i);
                        },
                      ),
                    ],
                  ],
                ),
              ),

              // Tab Content Switcher
              Expanded(
                child: switch (_selectedTab) {
                  1 => const MyLeaveView(),
                  2 => const _TeamRosterTab(),
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
                          gpsHardwareReady: _gpsHardwareReady,
                          accuracyM: _lastAccuracyM,
                          onRequestEnableGps: () =>
                              unawaited(_handleEnableGpsTap()),
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
    required this.gpsHardwareReady,
    required this.accuracyM,
    required this.onRequestEnableGps,
    required this.onPunch,
  });

  final TodayAttendance today;
  final _Phase phase;
  final bool isOutsideSimulated;
  final bool supervisorConfirmedLocally;
  final bool gpsHardwareReady;
  final double accuracyM;
  final VoidCallback onRequestEnableGps;
  final VoidCallback onPunch;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lang = Localizations.localeOf(context).languageCode;
    final day = today.day;
    final muted = scheme.onSurfaceVariant;
    final onLeave = day.status == DayStatus.onLeave;
    final busy = phase != _Phase.idle;
    final nextIn = today.nextIsIn;
    final worked = day.workedMinutes;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.sm,
        Space.lg,
        Space.md,
      ),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date & Status Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(Corner.md),
                    ),
                    child: Icon(
                      Icons.fingerprint_rounded,
                      size: 20,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFmt.key(
                            day.date,
                            lang,
                            pattern: 'EEEE, dd MMM yyyy',
                          ),
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          l10n.attShiftLine(
                            today.shift.displayName(bangla: bangla),
                            today.shift.startTime,
                            today.shift.endTime,
                          ),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (day.status != null)
                    StatusPill(
                      label: dayStatusLabel(l10n, day.status),
                      tone: dayStatusTone(day.status),
                    )
                  else
                    StatusPill(label: bangla ? 'শিফট প্রস্তুত' : 'Shift Ready'),
                ],
              ),
              const SizedBox(height: Space.md),

              // 3 Elevated Time Metric Tiles (Check-In / Check-Out / Worked)
              Row(
                children: [
                  Expanded(
                    child: _TimeBlock(
                      icon: Icons.login_rounded,
                      label: l10n.attIn,
                      value: day.firstInAt == null
                          ? '—'
                          : DateFmt.time(day.firstInAt!, lang),
                      isHighlighted: day.firstInAt != null,
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: _TimeBlock(
                      icon: Icons.logout_rounded,
                      label: l10n.attOut,
                      value: day.lastOutAt == null
                          ? '—'
                          : DateFmt.time(day.lastOutAt!, lang),
                      isHighlighted: day.lastOutAt != null,
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: _TimeBlock(
                      icon: Icons.schedule_rounded,
                      label: l10n.attWorked,
                      value: worked == 0
                          ? '—'
                          : durationText(l10n, worked, lang),
                      isHighlighted: worked > 0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),

              // Geofence & Live GPS Telemetry Console
              GeofenceMiniMap(
                isInside: !isOutsideSimulated,
                distanceM: isOutsideSimulated ? 4200 : 110,
                gpsHardwareReady: gpsHardwareReady,
                accuracyM: accuracyM,
                onRequestEnableGps: onRequestEnableGps,
              ),
              const SizedBox(height: Space.sm),

              // Multi-Step Live Verification Banner while punching
              if (busy) ...[
                _LiveVerificationProgress(phase: phase, bangla: bangla),
                const SizedBox(height: Space.sm),
              ],

              // Outside Geofence Warning Notice
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
                              ? 'মাঠ পর্যায়ের চেক-ইন আপনার সুপারভাইজার কর্তৃক নিশ্চিত করা হবে।'
                              : 'Field duty check-in outside the site perimeter will be routed to your supervisor for confirmation.',
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

              // Primary Punch In / Punch Out Button
              PrimaryButton(
                label: switch (phase) {
                  _Phase.locating =>
                    bangla
                        ? 'GPS লোকেশন যাচাই করা হচ্ছে…'
                        : 'Acquiring GPS Lock…',
                  _Phase.verifyingFence =>
                    bangla
                        ? 'জিওফেন্স সীমানা যাচাই করা হচ্ছে…'
                        : 'Verifying Site Geofence…',
                  _Phase.sending => l10n.attRecording,
                  _Phase.idle => nextIn ? l10n.attPunchIn : l10n.attPunchOut,
                },
                icon: nextIn ? Icons.login_rounded : Icons.logout_rounded,
                loading: busy,
                onPressed: onLeave || busy ? null : onPunch,
              ),

              const SizedBox(height: Space.xs),
              Center(
                child: Text(
                  bangla
                      ? 'প্রধান কার্যালয়ের ৩০০ মি বা প্ল্যান্ট গেটের ৫০০ মিটারের মধ্যে GPS পাঞ্চ গ্রহণযোগ্য।'
                      : 'Hardware GPS verification within 300 m of Head Office or 500 m of the Refinery gate.',
                  style: TextStyle(
                    fontSize: 11,
                    color: scheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // Inline Today's Verified Punch Log
              if (day.punches.isNotEmpty) ...[
                const SizedBox(height: Space.md),
                const Divider(height: 1),
                const SizedBox(height: Space.sm),
                Row(
                  children: [
                    Icon(
                      Icons.verified_user_outlined,
                      size: 14,
                      color: scheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      bangla
                          ? 'আজকের যাচাইকৃত পাঞ্চ লগ (${day.punches.length})'
                          : "Today's Verified Punch Log (${day.punches.length})",
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                for (final p in day.punches)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Space.sm,
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
                            p.isIn ? Icons.login_rounded : Icons.logout_rounded,
                            size: 16,
                            color: p.isIn
                                ? Colors.teal.shade700
                                : Colors.blueGrey.shade700,
                          ),
                          const SizedBox(width: Space.xs),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${p.isIn ? l10n.attIn : l10n.attOut} · ${DateFmt.time(p.punchedAt, lang)}',
                                  style: theme.textTheme.labelLarge?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  [
                                    if (p.site != null)
                                      p.site!.displayName(bangla: bangla),
                                    if (p.distanceM != null)
                                      '${p.distanceM!.round()} m',
                                    if (p.accuracyM != null)
                                      'GPS ±${p.accuracyM!.round()} m',
                                  ].join(' · '),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    fontSize: 11,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          StatusPill(
                            label: switch (p.result) {
                              PunchResult.accepted => l10n.attPunchAccepted,
                              PunchResult.pendingRegularisation =>
                                l10n.attPunchPending,
                              _ => l10n.attPunchRejected,
                            },
                            tone: switch (p.result) {
                              PunchResult.accepted => StatusTone.success,
                              PunchResult.pendingRegularisation =>
                                StatusTone.warning,
                              _ => StatusTone.danger,
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveVerificationProgress extends StatelessWidget {
  const _LiveVerificationProgress({required this.phase, required this.bangla});

  final _Phase phase;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final step = switch (phase) {
      _Phase.locating => 1,
      _Phase.verifyingFence => 2,
      _Phase.sending => 3,
      _Phase.idle => 0,
    };
    final text = switch (phase) {
      _Phase.locating =>
        bangla
            ? 'ধাপ ১/৩: ফোনের হার্ডওয়্যার জিপিএস ও স্যাটেলাইট সংযোগ যাচাই করা হচ্ছে…'
            : 'Step 1/3: Acquiring hardware GPS & satellite lock…',
      _Phase.verifyingFence =>
        bangla
            ? 'ধাপ ২/৩: বিওজিসিএল সাইট জিওফেন্স সীমানা যাচাই করা হচ্ছে…'
            : 'Step 2/3: Verifying BOGCL site geofence perimeter…',
      _Phase.sending =>
        bangla
            ? 'ধাপ ৩/৩: উপস্থিতি সময় ও লোকেশন সংরক্ষণ করা হচ্ছে…'
            : 'Step 3/3: Recording verified attendance log…',
      _Phase.idle => '',
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.md,
        vertical: Space.sm,
      ),
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
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: scheme.primary,
                ),
              ),
              const SizedBox(width: Space.xs),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(value: step / 3.0, minHeight: 3),
          ),
        ],
      ),
    );
  }
}

enum _LocationSheetAction { openLocationSettings, openAppSettings, retryNow }

class _LocationEnableSheet extends StatelessWidget {
  const _LocationEnableSheet({required this.failure});

  final LocationFailure failure;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final isServiceOff = failure == LocationFailure.serviceOff;
    final isDeniedForever = failure == LocationFailure.deniedForever;

    final title = isServiceOff
        ? (bangla
              ? 'ফোনের লোকেশন (GPS) চালু করুন'
              : 'Turn On Device Location (GPS)')
        : l10n.attLocTitle;

    final message = switch (failure) {
      LocationFailure.serviceOff =>
        bangla
            ? 'উপস্থিতি (Punch In / Out) রেকর্ড করার জন্য আপনার ফোনের জিপিএস (Location Services) চালু থাকা আবশ্যক। নিচের বাটনে ট্যাপ করে লোকেশন চালু করুন।'
            : 'BOGCL OneOps requires live hardware GPS telemetry to verify site proximity before recording shift attendance. Please turn on Device Location (GPS).',
      LocationFailure.denied => l10n.attLocDenied,
      LocationFailure.deniedForever => l10n.attLocDeniedForever,
      LocationFailure.unavailable => l10n.attLocUnavailable,
    };

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Space.xl,
          Space.xs,
          Space.xl,
          Space.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFF59E0B)),
              ),
              child: const Icon(
                Icons.location_searching_rounded,
                size: 28,
                color: Color(0xFFB45309),
              ),
            ),
            const SizedBox(height: Space.md),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.xs),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.lg),
            if (isServiceOff) ...[
              PrimaryButton(
                label: bangla
                    ? 'লোকেশন সেটিংস খুলুন (Turn On GPS)'
                    : 'Turn On Location (GPS)',
                icon: Icons.gps_fixed_rounded,
                onPressed: () =>
                    Navigator.of(context)
                        .pop(_LocationSheetAction.openLocationSettings),
              ),
              const SizedBox(height: Space.xs),
              PrimaryButton.secondary(
                label: bangla ? 'পুনরায় চেষ্টা করুন' : l10n.attTryAgain,
                onPressed: () =>
                    Navigator.of(context).pop(_LocationSheetAction.retryNow),
              ),
            ] else if (isDeniedForever) ...[
              PrimaryButton(
                label: l10n.attOpenSettings,
                icon: Icons.settings_outlined,
                onPressed: () =>
                    Navigator.of(context)
                        .pop(_LocationSheetAction.openAppSettings),
              ),
            ] else ...[
              PrimaryButton(
                label: bangla
                    ? 'লোকেশন অনুমতি দিন'
                    : 'Grant Location Permission',
                icon: Icons.my_location_rounded,
                onPressed: () =>
                    Navigator.of(context).pop(_LocationSheetAction.retryNow),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TeamRosterTab extends ConsumerStatefulWidget {
  const _TeamRosterTab();

  @override
  ConsumerState<_TeamRosterTab> createState() => _TeamRosterTabState();
}

const _inStatuses = {
  'PRESENT',
  'LATE',
  'EARLY_LEAVE',
  'HALF_DAY',
  'FIELD_DUTY',
};

class _TeamRosterTabState extends ConsumerState<_TeamRosterTab> {
  String _filter = 'ALL';

  bool _inBucket(TeamRosterRow r) =>
      !r.needsReview && _inStatuses.contains(r.status);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final bangla = lang == 'bn';
    final theme = Theme.of(context);
    final async = ref.watch(teamAttendanceProvider);

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(teamAttendanceProvider)),
      data: (team) {
        if (team == null) {
          return EmptyState(
            icon: Icons.people_outline,
            title: l10n.attTeamEmpty,
            message: l10n.attTeamNothing,
          );
        }
        final roster = [...team.roster]..sort(_rank);
        final inCount = roster.where(_inBucket).length;
        final notIn = roster
            .where((r) => !r.needsReview && r.status == 'NOT_IN')
            .length;
        final onLeave = roster
            .where((r) => !r.needsReview && r.status == 'ON_LEAVE')
            .length;
        final absent = roster
            .where((r) => !r.needsReview && r.status == 'ABSENT')
            .length;
        final review = roster.where((r) => r.needsReview).length;
        final late = roster.where((r) => r.status == 'LATE').length;
        final filtered = roster.where(_matches).toList();
        final chips = <(String, String)>[
          ('ALL', _digits(l10n.attRosterAll(roster.length), lang)),
          if (inCount > 0 || _filter == 'IN')
            ('IN', _digits(l10n.attRosterInCount(inCount), lang)),
          if (notIn > 0 || _filter == 'NOT_IN')
            ('NOT_IN', _digits(l10n.attRosterNotInCount(notIn), lang)),
          if (onLeave > 0 || _filter == 'LEAVE')
            ('LEAVE', _digits(l10n.attRosterLeaveCount(onLeave), lang)),
          if (review > 0 || _filter == 'REVIEW')
            ('REVIEW', _digits(l10n.attRosterReviewCount(review), lang)),
          if (absent > 0 || _filter == 'ABSENT')
            ('ABSENT', _digits(l10n.attRosterAbsentCount(absent), lang)),
        ];

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(teamAttendanceProvider),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.xxxl,
            ),
            children: [
              Text(
                _verdict(
                  l10n,
                  lang,
                  total: roster.length,
                  present: inCount,
                  notIn: notIn,
                  onLeave: onLeave,
                  late: late,
                  review: review,
                ),
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: Space.md),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (var i = 0; i < chips.length; i++) ...[
                      if (i > 0) const SizedBox(width: Space.xs),
                      _filterChip(chips[i].$1, chips[i].$2),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: Space.md),
              if (filtered.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Space.xxl),
                  child: EmptyState(
                    icon: Icons.people_outline,
                    title: l10n.attTeamEmpty,
                    message: l10n.attTeamNothing,
                  ),
                )
              else
                for (final r in filtered) ...[
                  _person(context, r, bangla: bangla, lang: lang, l10n: l10n),
                  const SizedBox(height: Space.sm),
                ],
            ],
          ),
        );
      },
    );
  }

  bool _matches(TeamRosterRow r) => switch (_filter) {
    'IN' => _inBucket(r),
    'NOT_IN' => !r.needsReview && r.status == 'NOT_IN',
    'LEAVE' => !r.needsReview && r.status == 'ON_LEAVE',
    'REVIEW' => r.needsReview,
    'ABSENT' => !r.needsReview && r.status == 'ABSENT',
    _ => true,
  };

  int _rank(TeamRosterRow a, TeamRosterRow b) {
    int score(TeamRosterRow r) {
      if (r.needsReview) return 0;
      if (r.status == 'LATE') return 1;
      if (r.status == 'ABSENT') return 2;
      if (r.status == 'NOT_IN') return 3;
      if (r.status == 'ON_LEAVE') return 4;
      return 5;
    }

    final byScore = score(a).compareTo(score(b));
    if (byScore != 0) return byScore;
    return a.name.compareTo(b.name);
  }

  String _verdict(
    AppL10n l10n,
    String lang, {
    required int total,
    required int present,
    required int notIn,
    required int onLeave,
    required int late,
    required int review,
  }) {
    final text = review > 0
        ? l10n.attRosterReview(present, total, review)
        : late > 0
        ? l10n.attRosterLate(present, total, late, notIn)
        : present == 0
        ? l10n.attRosterNoneIn(notIn, onLeave)
        : l10n.attRosterIn(present, total, notIn);
    return _digits(text, lang);
  }

  String _digits(String text, String lang) =>
      lang == 'bn' ? toBengaliDigits(text) : text;

  Widget _person(
    BuildContext context,
    TeamRosterRow r, {
    required bool bangla,
    required String lang,
    required AppL10n l10n,
  }) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final name = bangla ? r.nameBn : r.name;
    final job = bangla
        ? (r.designationBn.isEmpty ? r.designation : r.designationBn)
        : r.designation;
    final site = bangla
        ? (r.siteNameBn.isEmpty ? r.siteName : r.siteNameBn)
        : r.siteName;
    final initial = name.isNotEmpty ? name[0] : '?';
    final parsed = r.firstInAt == null ? null : DateTime.tryParse(r.firstInAt!);
    final inAt = parsed == null
        ? null
        : _digits(l10n.attRosterInAt(DateFmt.time(parsed, lang)), lang);
    final outside = r.needsReview && r.distanceM != null
        ? _digits(l10n.attRosterOutside(r.distanceM!), lang)
        : null;
    final approvalId = r.workflowInstanceId;
    final openable = approvalId != null && approvalId.isNotEmpty;
    final role = job.isEmpty
        ? site
        : site.isEmpty
        ? job
        : l10n.attRosterRole(job, site);

    return Material(
      color: scheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Corner.lg),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: openable
            ? () {
                Haptics.tap();
                unawaited(context.push(AppRoutes.approvalDetail(approvalId)));
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: scheme.primaryContainer,
                foregroundColor: scheme.onPrimaryContainer,
                child: Text(initial),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (role.isNotEmpty)
                      Text(
                        role,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    if (inAt != null)
                      Text(
                        inAt,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    if (outside != null) ...[
                      const SizedBox(height: Space.xs),
                      Text(outside, style: theme.textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: Space.sm),
              Flexible(
                child: StatusPill(
                  label: dayStatusLabel(l10n, r.dayStatus),
                  tone: r.needsReview
                      ? StatusTone.warning
                      : dayStatusTone(r.dayStatus),
                ),
              ),
            ],
          ),
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
  const _TimeBlock({
    required this.icon,
    required this.label,
    required this.value,
    this.isHighlighted = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Semantics(
      container: true,
      label: '$label $value',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.sm,
            vertical: Space.sm,
          ),
          decoration: BoxDecoration(
            color: isHighlighted
                ? scheme.surfaceContainerLow
                : scheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(Corner.md),
            border: Border.all(color: scheme.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 13, color: scheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      label,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
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
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SummaryRow(summary: r.summary),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    Space.sm,
                    Space.lg,
                    Space.xs,
                  ),
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        unawaited(context.push(AppRoutes.attendanceRegularise)),
                    icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                    label: Text(l10n.attRegularise),
                  ),
                ),
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
    required this.fix,
    required this.shift,
    required this.lang,
  });

  final String type;
  final PunchOutcome outcome;
  final LocationFix fix;
  final Shift shift;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final bogcl = context.bogcl;
    final site = outcome.geofenceName == null
        ? (bangla ? 'বারিধারা প্রধান কার্যালয়' : 'Head Office, Baridhara')
        : (bangla ? outcome.geofenceNameBn : outcome.geofenceName);
    final distance = (outcome.distanceM ?? 110).round();

    final (IconData icon, Color color, String title, String message) = _content(
      l10n,
      bogcl,
      site,
      distance,
    );

    final nowStr = DateFmt.time(Dhaka.clock(), lang);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Space.xl,
          Space.xs,
          Space.xl,
          Space.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 52, color: color),
            const SizedBox(height: Space.sm),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.md),

            // Digital Attendance Verification Receipt Card
            Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(color: scheme.outlineVariant),
              ),
              child: Column(
                children: [
                  _receiptRow(
                    theme,
                    bangla ? 'রেকর্ডকৃত সময়' : 'Recorded Time',
                    nowStr,
                  ),
                  const Divider(height: Space.md),
                  _receiptRow(
                    theme,
                    bangla ? 'নির্ধারিত স্থান' : 'Verified Site',
                    '$site ($distance m)',
                  ),
                  const Divider(height: Space.md),
                  _receiptRow(
                    theme,
                    bangla ? 'জিপিএস স্থানাঙ্ক' : 'GPS Telemetry',
                    '${fix.lat.toStringAsFixed(4)}° N, ${fix.lng.toStringAsFixed(4)}° E (±${fix.accuracyM.toStringAsFixed(0)}m)',
                  ),
                  const Divider(height: Space.md),
                  _receiptRow(
                    theme,
                    bangla ? 'শিফট' : 'Shift Schedule',
                    '${shift.displayName(bangla: bangla)} (${shift.startTime}–${shift.endTime})',
                  ),
                ],
              ),
            ),

            const SizedBox(height: Space.lg),
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

  Widget _receiptRow(ThemeData theme, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const SizedBox(width: Space.sm),
        Expanded(
          flex: 3,
          child: Text(
            value,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
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
        Icons.verified_rounded,
        bogcl.success,
        outcome.duplicate
            ? l10n.attResultDuplicate
            : (isIn ? l10n.attResultInTitle : l10n.attResultOutTitle),
        site == null ? l10n.attResultOk : l10n.attResultAtSite(site),
      ),
      PunchResult.pendingRegularisation => (
        Icons.hourglass_top_rounded,
        bogcl.warning,
        l10n.attResultPendingTitle,
        l10n.attResultPendingMessage,
      ),
      PunchResult.rejectedOutsideFence => (
        Icons.location_off_rounded,
        bogcl.danger,
        l10n.attResultOutsideTitle,
        l10n.attResultOutsideMessage(distance, site ?? ''),
      ),
      PunchResult.rejectedAccuracy => (
        Icons.gps_not_fixed_rounded,
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
