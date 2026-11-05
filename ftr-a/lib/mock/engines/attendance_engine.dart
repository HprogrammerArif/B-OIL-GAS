import 'dart:math' as math;

import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// `Setting attendance.*` (doc 06 BR-10-01…07).
abstract final class AttendancePolicy {
  static const int maxAccuracyM = 50;
  static const int duplicateWindowMin = 5;
  static const int clockSkewMin = 10;
  static const int offlineReplayHours = 24;
  static const int regularisationWindowDays = 7;
  static const int fieldDutyAheadDays = 30;
  static const int earlyLeaveMin = 30;
  static const int overtimeBufferMin = 30;
  static const int reasonMin = 10;
  static const int reasonMax = 500;
  static const Set<String> regTypes = {
    'MISSED_PUNCH',
    'FIELD_DUTY',
    'LATE_JUSTIFICATION',
    'REMOTE_WORK',
  };
}

const Set<String> _effective = {'ACCEPTED', 'PENDING_REGULARISATION'};
const Set<String> _worked = {
  'PRESENT',
  'LATE',
  'EARLY_LEAVE',
  'HALF_DAY',
  'FIELD_DUTY',
};

double _round2(double n) => (n * 100).round() / 100;

/// Great-circle distance in metres (doc 06 §11.5).
double haversineM(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371000.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLng = rad(lng2 - lng1);
  final a =
      math.pow(math.sin(dLat / 2), 2) +
      math.cos(rad(lat1)) *
          math.cos(rad(lat2)) *
          math.pow(math.sin(dLng / 2), 2);
  return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

/// Attendance rules: geofence verdict, day computation and regularisation.
abstract final class AttendanceEngine {
  static const String regObjectType = 'Regularisation';

  static void registerHooks() =>
      WorkflowHooks.register(regObjectType, _onWorkflowEvent);

  // ---- Lookups ----

  static Json shiftFor(MockStore store, Json employee) {
    final id = employee.strOrNull('shiftId');
    return (id == null ? null : store.get(Col.shifts, id)) ??
        store.all(Col.shifts).first;
  }

  static Json shiftWire(Json s) => {
    'id': s['id'],
    'code': s['code'],
    'name': s['name'],
    'nameBn': s['nameBn'],
    'startTime': s['startTime'],
    'endTime': s['endTime'],
    'graceMinutes': s['graceMinutes'],
  };

  static Json? siteRef(String? siteId) {
    if (siteId == null) return null;
    for (final s in sites) {
      if (s['id'] == siteId) {
        return {
          'id': s['id'],
          'code': s['code'],
          'name': s['name'],
          'nameBn': s['nameBn'],
        };
      }
    }
    return null;
  }

  static List<Json> activeFences(MockStore store) =>
      store.all(Col.geofences).where((g) => g['isActive'] == true).toList();

  static Json geofenceWire(Json g) => {
    'id': g['id'],
    'site': siteRef(g.str('siteId')),
    'name': g['name'],
    'nameBn': g['nameBn'],
    'centerLat': g['centerLat'],
    'centerLng': g['centerLng'],
    'radiusMeters': g['radiusMeters'],
  };

  /// Nearest active fence: `{fence, distanceM, inside}` or null.
  static ({Json fence, double distanceM, bool inside})? nearest(
    MockStore store,
    double lat,
    double lng,
  ) {
    ({Json fence, double distanceM, bool inside})? best;
    for (final f in activeFences(store)) {
      final d = haversineM(
        lat,
        lng,
        (f['centerLat']! as num).toDouble(),
        (f['centerLng']! as num).toDouble(),
      );
      if (best == null || d < best.distanceM) {
        best = (
          fence: f,
          distanceM: d,
          inside: d <= (f['radiusMeters']! as num).toDouble(),
        );
      }
    }
    return best;
  }

  static Json? nearestWire(MockStore store, double lat, double lng) {
    final n = nearest(store, lat, lng);
    if (n == null) return null;
    return {
      'id': n.fence['id'],
      'site': siteRef(n.fence.str('siteId')),
      'name': n.fence['name'],
      'nameBn': n.fence['nameBn'],
      'distanceM': n.distanceM.round(),
      'inside': n.inside,
    };
  }

  // ---- Punch verdict (BR-10-01/02) ----

  static bool _hasApprovedFieldDuty(
    MockStore store,
    String employeeId,
    String date,
  ) => store
      .all(Col.regularisations)
      .any(
        (r) =>
            r['employeeId'] == employeeId &&
            r['date'] == date &&
            r['type'] == 'FIELD_DUTY' &&
            r['status'] == 'APPROVED',
      );

  /// Rejection order: mock, accuracy, fence. An approved FIELD_DUTY covers an
  /// outside punch.
  static ({String result, Json? fence, double? distanceM, bool fieldDuty})
  evaluate(
    MockStore store, {
    required String employeeId,
    required String date,
    required double lat,
    required double lng,
    required double? accuracyM,
    required bool isMock,
    required bool fieldDutyRequested,
  }) {
    final near = nearest(store, lat, lng);
    final fence = near?.fence;
    final dist = near == null ? null : _round2(near.distanceM);
    if (isMock) {
      return (
        result: 'REJECTED_MOCK',
        fence: fence,
        distanceM: dist,
        fieldDuty: false,
      );
    }
    if (accuracyM == null || accuracyM > AttendancePolicy.maxAccuracyM) {
      return (
        result: 'REJECTED_ACCURACY',
        fence: fence,
        distanceM: dist,
        fieldDuty: false,
      );
    }
    if (near != null && near.inside) {
      return (
        result: 'ACCEPTED',
        fence: fence,
        distanceM: dist,
        fieldDuty: false,
      );
    }
    if (_hasApprovedFieldDuty(store, employeeId, date)) {
      return (
        result: 'ACCEPTED',
        fence: fence,
        distanceM: dist,
        fieldDuty: true,
      );
    }
    if (fieldDutyRequested) {
      return (
        result: 'PENDING_REGULARISATION',
        fence: fence,
        distanceM: dist,
        fieldDuty: false,
      );
    }
    return (
      result: 'REJECTED_OUTSIDE_FENCE',
      fence: fence,
      distanceM: dist,
      fieldDuty: false,
    );
  }

  // ---- Day computation (BR-10-05/06) ----

  static Json punchWire(Json p) => {
    'id': p['id'],
    'type': p['type'],
    'punchedAt': p['punchedAt'],
    'result': p['result'],
    'site': siteRef(p.strOrNull('siteId')),
    'distanceM': p['distanceM'],
    'accuracyM': p['accuracyM'],
  };

  static Json? _leaveCovering(MockStore store, String employeeId, String date) {
    final covering = store
        .all(Col.leaveRequests)
        .where(
          (l) =>
              l['employeeId'] == employeeId &&
              (l['status'] == 'APPROVED' || l['status'] == 'PENDING') &&
              l.str('startDate').compareTo(date) <= 0 &&
              date.compareTo(l.str('endDate')) <= 0,
        )
        .toList();
    return covering.where((l) => l['status'] == 'APPROVED').firstOrNull ??
        covering.firstOrNull;
  }

  static String? _min(Iterable<String> v) =>
      v.isEmpty ? null : v.reduce((a, b) => a.compareTo(b) < 0 ? a : b);
  static String? _max(Iterable<String> v) =>
      v.isEmpty ? null : v.reduce((a, b) => a.compareTo(b) > 0 ? a : b);

  static List<Json> punchesOn(MockStore store, String employeeId, String date) {
    final list =
        store
            .all(Col.punches)
            .where((p) => p['employeeId'] == employeeId && p['date'] == date)
            .toList()
          ..sort((a, b) => a.str('punchedAt').compareTo(b.str('punchedAt')));
    return list;
  }

  static Json computeDay(MockStore store, Json emp, String date) {
    final now = Dhaka.clock().toUtc();
    final today = WorkCalendar.today();
    final empId = emp.str('id');
    final shift = shiftFor(store, emp);
    final punches = punchesOn(store, empId, date);
    final effective = punches
        .where((p) => _effective.contains(p['result']))
        .toList();
    final regs = store
        .all(Col.regularisations)
        .where((r) => r['employeeId'] == empId && r['date'] == date)
        .toList();
    final approved = regs.where((r) => r['status'] == 'APPROVED').toList();
    final businessDay = WorkCalendar.isBusinessDay(date);
    final leave = businessDay ? _leaveCovering(store, empId, date) : null;
    final holiday = WorkCalendar.holidayOf(date);

    final firstIn = _min([
      for (final p in effective)
        if (p['type'] == 'IN') p.str('punchedAt'),
      for (final r in approved)
        if (r['requestedIn'] != null) r.str('requestedIn'),
    ]);
    final lastOut = _max([
      for (final p in effective)
        if (p['type'] == 'OUT') p.str('punchedAt'),
      for (final r in approved)
        if (r['requestedOut'] != null) r.str('requestedOut'),
    ]);
    final lastEffective = effective.lastOrNull;
    final leaveType = leave == null
        ? null
        : store.get(Col.leaveTypes, leave.str('leaveTypeId'));

    final day = <String, Object?>{
      'date': date,
      'status': null,
      'firstInAt': firstIn,
      'lastOutAt': lastOut,
      'lateMinutes': 0,
      'workedMinutes': 0,
      'overtimeMinutes': 0,
      'site': siteRef(
        lastEffective?.strOrNull('siteId') ??
            (firstIn != null ? emp.obj('site').str('id') : null),
      ),
      'holiday': holiday == null
          ? null
          : {'name': holiday.name, 'nameBn': holiday.nameBn},
      'flags': {
        'missingOut': false,
        'earlyLeave': false,
        'pendingReview':
            punches.any((p) => p['result'] == 'PENDING_REGULARISATION') ||
            regs.any((r) => r['status'] == 'PENDING'),
      },
      'leave': leave == null
          ? null
          : {
              'id': leave['id'],
              'refNo': leave['refNo'],
              'typeCode': leaveType?['code'] ?? '',
              'status': leave['status'],
            },
      'punches': [for (final p in punches) punchWire(p)],
    };
    final flags = day.obj('flags');

    if (leave != null && leave['status'] == 'APPROVED') {
      day['status'] = 'ON_LEAVE';
      return day;
    }
    if (firstIn == null) {
      if (holiday != null) {
        day['status'] = 'HOLIDAY';
      } else if (WorkCalendar.isWeekend(date)) {
        day['status'] = 'WEEKEND';
      } else if (approved.any((r) => r['type'] == 'FIELD_DUTY')) {
        day['status'] = 'FIELD_DUTY';
      } else if (date.compareTo(today) < 0) {
        day['status'] = 'ABSENT';
      }
      return day;
    }

    final start = WorkCalendar.atTime(date, shift.str('startTime'));
    final end = WorkCalendar.atTime(date, shift.str('endTime'));
    final shiftMinutes = end.difference(start).inMinutes;
    final inAt = DateTime.parse(firstIn);
    final outAt = lastOut == null ? null : DateTime.parse(lastOut);
    final isToday = date == today;
    final until = outAt ?? (isToday ? now : end);
    final worked = math.max(0, (until.difference(inAt).inSeconds / 60).round());
    day['workedMinutes'] = worked;
    flags['missingOut'] = outAt == null && !isToday;

    final graceEnd = start.add(
      Duration(minutes: (shift['graceMinutes']! as num).toInt()),
    );
    final late = inAt.isAfter(graceEnd);
    final excused = approved.any((r) => r['type'] == 'LATE_JUSTIFICATION');
    final lateMin = late && !excused
        ? (inAt.difference(start).inSeconds / 60).round()
        : 0;
    day['lateMinutes'] = lateMin;
    flags['earlyLeave'] =
        outAt != null &&
        outAt.isBefore(
          end.subtract(const Duration(minutes: AttendancePolicy.earlyLeaveMin)),
        );
    if (outAt != null) {
      day['overtimeMinutes'] = math.max(
        0,
        worked - shiftMinutes - AttendancePolicy.overtimeBufferMin,
      );
    }

    final fieldDuty =
        approved.any((r) => r['type'] == 'FIELD_DUTY') ||
        effective.any((p) => p['fieldDuty'] == true);
    var status = 'PRESENT';
    if (fieldDuty) {
      status = 'FIELD_DUTY';
    } else if (outAt != null && worked < shiftMinutes / 2) {
      status = 'HALF_DAY';
    } else if (lateMin > 0) {
      status = 'LATE';
    } else if (flags['earlyLeave'] == true) {
      status = 'EARLY_LEAVE';
    }
    day
      ..['status'] = status
      ..['flags'] = flags;
    return day;
  }

  static String nextPunchType(Json day) {
    final punches = day.objList('punches');
    final last = punches.reversed
        .where((p) => _effective.contains(p['result']))
        .firstOrNull;
    return last?['type'] == 'IN' ? 'OUT' : 'IN';
  }

  static Json summarise(List<Json> days) {
    var present = 0;
    var late = 0;
    var absent = 0;
    var leave = 0;
    var fieldDuty = 0;
    var worked = 0;
    var overtime = 0;
    for (final d in days) {
      final s = d.strOrNull('status');
      if (_worked.contains(s)) present++;
      if (s == 'LATE') late++;
      if (s == 'ABSENT') absent++;
      if (s == 'ON_LEAVE') leave++;
      if (s == 'FIELD_DUTY') fieldDuty++;
      worked += d.intVal('workedMinutes');
      overtime += d.intVal('overtimeMinutes');
    }
    return {
      'present': present,
      'late': late,
      'absent': absent,
      'leave': leave,
      'fieldDuty': fieldDuty,
      'workedMinutes': worked,
      'overtimeMinutes': overtime,
    };
  }

  /// Month-to-date overtime; only dates with punches can earn it.
  static int overtimeMtd(MockStore store, Json emp) {
    final month = WorkCalendar.today().substring(0, 7);
    final empId = emp.str('id');
    final dates = {
      for (final p in store.all(Col.punches))
        if (p['employeeId'] == empId && p.str('date').startsWith(month))
          p.str('date'),
    };
    return dates.fold<int>(
      0,
      (sum, d) => sum + computeDay(store, emp, d).intVal('overtimeMinutes'),
    );
  }

  // ---- Regularisations (doc 06 §11.3) ----

  static const Map<String, (String, String)> regLabel = {
    'MISSED_PUNCH': ('Missed punch', 'পাঞ্চ বাদ পড়েছে'),
    'FIELD_DUTY': ('Field duty', 'মাঠ পর্যায়ের দায়িত্ব'),
    'LATE_JUSTIFICATION': ('Late arrival note', 'দেরিতে আসার ব্যাখ্যা'),
    'REMOTE_WORK': ('Remote work', 'দূর থেকে কাজ'),
  };

  static Json regWire(MockStore store, Json r) {
    final e = store.get(Col.employees, r.str('employeeId'));
    return {
      'id': r['id'],
      'refNo': r['refNo'],
      'employee': {
        'id': r['employeeId'],
        'fullName': e?['fullName'] ?? '',
        'fullNameBn': e?['fullNameBn'] ?? '',
      },
      'date': r['date'],
      'type': r['type'],
      'requestedIn': r['requestedIn'],
      'requestedOut': r['requestedOut'],
      'reason': r['reason'],
      'status': r['status'],
      'createdAt': r['createdAt'],
      'workflowInstanceId': r['workflowInstanceId'],
    };
  }

  static String _nextRegRef(MockStore store, String year) {
    var max = 0;
    for (final r in store.all(Col.regularisations)) {
      final ref = r.str('refNo');
      if (ref.startsWith('REG-$year-')) {
        final n = int.tryParse(ref.substring(ref.lastIndexOf('-') + 1)) ?? 0;
        if (n > max) max = n;
      }
    }
    return 'REG-$year-${(max + 1).toString().padLeft(3, '0')}';
  }

  /// Files a regularisation and its `ATTENDANCE_REGULARISATION` workflow.
  /// Auto-approves when the requester has no line manager.
  static Json createRegularisation(
    MockStore store, {
    required Json user,
    required Json employee,
    required String date,
    required String type,
    required String reason,
    String? requestedIn,
    String? requestedOut,
  }) {
    final now = store.nowIso();
    final id =
        'reg_${store.collection(Col.regularisations).length + 1}_${store.nowMs()}';
    final reg = <String, Object?>{
      'id': id,
      'refNo': _nextRegRef(store, date.substring(0, 4)),
      'employeeId': employee['id'],
      'date': date,
      'type': type,
      'requestedIn': requestedIn,
      'requestedOut': requestedOut,
      'reason': reason,
      'status': 'PENDING',
      'createdAt': now,
      'workflowInstanceId': null,
    };
    store.put(Col.regularisations, reg);
    if (employee['lineManager'] == null) {
      reg['status'] = 'APPROVED';
      _settlePunches(store, reg);
      return reg;
    }
    final (label, labelBn) = regLabel[type]!;
    final isHr = user.strList('roles').contains('HR_ADMIN');
    final daysBack = WorkCalendar.daysBetween(date, WorkCalendar.today());
    final inst = WorkflowEngine.submit(
      store,
      templateKey: 'ATTENDANCE_REGULARISATION',
      objectType: regObjectType,
      objectId: id,
      initiatorUserId: user.str('id'),
      summary: {
        'refNo': reg['refNo'],
        'title': '$label — $date',
        'titleBn': '$labelBn — $date',
        'details': reason,
        'detailsBn': reason,
        'amount': null,
        'daysBack': isHr ? 0 : daysBack,
        'urgency': 'NORMAL',
        'category': 'HR',
      },
    );
    reg['workflowInstanceId'] = inst['id'];
    store.put(Col.regularisations, reg);
    return reg;
  }

  /// Linked field-duty punches become effective on approval and revert to an
  /// outside-fence rejection otherwise.
  static void _settlePunches(MockStore store, Json reg) {
    for (final p in store.all(Col.punches)) {
      if (p['regularisationId'] != reg['id'] ||
          p['result'] != 'PENDING_REGULARISATION') {
        continue;
      }
      if (reg['status'] == 'APPROVED') {
        p
          ..['result'] = 'ACCEPTED'
          ..['fieldDuty'] = reg['type'] == 'FIELD_DUTY';
      } else {
        p['result'] = 'REJECTED_OUTSIDE_FENCE';
      }
      store.put(Col.punches, p);
    }
    store.put(Col.regularisations, reg);
  }

  static void _onWorkflowEvent(
    MockStore store,
    Json instance,
    WorkflowEvent event,
  ) {
    final reg = store.get(Col.regularisations, instance.str('objectId'));
    if (reg == null || reg['status'] != 'PENDING') return;
    final next = switch (event) {
      WorkflowEvent.approved => 'APPROVED',
      WorkflowEvent.rejected => 'REJECTED',
      WorkflowEvent.withdrawn => 'CANCELLED',
      _ => null,
    };
    if (next == null) return;
    reg['status'] = next;
    _settlePunches(store, reg);
    AuditEngine.log(
      store,
      action: 'REGULARISATION_$next',
      entityType: 'Regularisation',
      entityId: reg.str('id'),
      after: {'refNo': reg['refNo']},
    );
  }

  static Json team(HandlerContext ctx, String date) {
    final store = ctx.store;
    final rows = <Json>[];
    for (final e in store.all(Col.employees)) {
      if (e['status'] == 'OFFBOARDED') continue;
      if (!ctx.inScope(
        'attendance:read',
        ownerEmployeeId: e.str('id'),
        departmentId: e.obj('department').str('id'),
        siteId: e.obj('site').str('id'),
        teamManagerId: e.objOrNull('lineManager')?.strOrNull('id'),
      )) {
        continue;
      }
      final day = computeDay(store, e, date);
      final pending = store
          .all(Col.regularisations)
          .where(
            (r) =>
                r['employeeId'] == e['id'] &&
                r['date'] == date &&
                r['status'] == 'PENDING',
          )
          .firstOrNull;
      rows.add({
        'employeeId': e['id'],
        'empCode': e['empCode'],
        'name': e['fullName'],
        'nameBn': e['fullNameBn'] ?? e['fullName'],
        'status': day['status'],
        'firstInAt': day['firstInAt'],
        'lateMinutes': day['lateMinutes'],
        'needsReview': day.obj('flags')['pendingReview'] == true,
        'regularisationId': pending?['id'],
        'workflowInstanceId': pending?['workflowInstanceId'],
      });
    }
    var present = 0;
    var late = 0;
    var onLeave = 0;
    var review = 0;
    for (final r in rows) {
      final st = r['status'];
      if (st == 'LATE') late++;
      if (st == 'ON_LEAVE') onLeave++;
      if (const {
        'PRESENT',
        'LATE',
        'EARLY_LEAVE',
        'HALF_DAY',
        'FIELD_DUTY',
      }.contains(st)) {
        present++;
      }
      if (r['needsReview'] == true) review++;
    }
    return {
      'date': date,
      'kpis': {
        'present': present,
        'late': late,
        'onLeave': onLeave,
        'toReview': review,
        'headcount': rows.length,
      },
      'roster': rows,
    };
  }
}
