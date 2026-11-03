import 'package:bogcl_oneops/mock/engines/attendance_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Fence centres from the web prototype; radii per BR-10-01.
const List<Json> geofences = [
  {
    'id': 'gf_hq',
    'siteId': 'site_hq',
    'name': 'Head Office, Baridhara',
    'nameBn': 'প্রধান কার্যালয়, বারিধারা',
    'centerLat': 23.8103,
    'centerLng': 90.4125,
    'radiusMeters': 300,
    'isActive': true,
  },
  {
    'id': 'gf_plant',
    'siteId': 'site_plant',
    'name': 'Keraniganj Plant',
    'nameBn': 'কেরানীগঞ্জ প্ল্যান্ট',
    'centerLat': 23.7005,
    'centerLng': 90.3499,
    'radiusMeters': 500,
    'isActive': true,
  },
  {
    'id': 'gf_ctg',
    'siteId': 'site_ctg',
    'name': 'Chattogram Terminal',
    'nameBn': 'চট্টগ্রাম টার্মিনাল',
    'centerLat': 22.307,
    'centerLng': 91.8,
    'radiusMeters': 400,
    'isActive': true,
  },
];

Json _shift(
  String id,
  String code,
  String name,
  String nameBn,
  String start,
  String end,
  int grace,
) => {
  'id': id,
  'code': code,
  'name': name,
  'nameBn': nameBn,
  'startTime': start,
  'endTime': end,
  'graceMinutes': grace,
};

final List<Json> _shifts = [
  _shift('shf_gen', 'GEN', 'General', 'সাধারণ', '09:00', '17:00', 15),
  _shift(
    'shf_hq',
    'HQ',
    'Head office',
    'প্রধান কার্যালয়',
    '09:00',
    '18:00',
    15,
  ),
  _shift(
    'shf_plant',
    'PLANT',
    'Plant general',
    'প্ল্যান্ট সাধারণ',
    '08:30',
    '17:30',
    15,
  ),
  _shift(
    'shf_trans',
    'TRANS',
    'Transport morning',
    'পরিবহন সকাল',
    '08:00',
    '17:00',
    15,
  ),
  _shift('shf_drv', 'DRV', 'Driver morning', 'চালক সকাল', '07:00', '16:00', 15),
  _shift('shf_a', 'A', 'Shift A', 'শিফট এ', '07:00', '15:00', 10),
  _shift(
    'shf_exec',
    'EXEC',
    'Executive hours',
    'নির্বাহী সময়',
    '09:00',
    '17:00',
    60,
  ),
];

const Map<String, String> _assignments = {
  'EMP-0001': 'shf_exec',
  'EMP-0012': 'shf_plant',
  'EMP-0028': 'shf_hq',
  'EMP-0045': 'shf_trans',
  'EMP-0062': 'shf_hq',
  'EMP-1042': 'shf_hq',
  'EMP-0821': 'shf_drv',
  'EMP-1088': 'shf_plant',
  'EMP-1104': 'shf_hq',
  'EMP-0914': 'shf_a',
  'EMP-0733': 'shf_hq',
};

/// Staff with regular overtime (drivers, transport, gate, plant GM).
const Set<String> _longDays = {'EMP-0045', 'EMP-0821', 'EMP-0914', 'EMP-0012'};

/// Today's first IN (`HH:mm`) and metres from the fence centre. EMP-1042 and
/// EMP-0821 start blank so a demo can punch.
const Map<String, (String, int)> _todayIn = {
  'EMP-0001': ('09:05', 15),
  'EMP-0012': ('08:18', 30),
  'EMP-0028': ('08:50', 22),
  'EMP-0045': ('07:52', 48),
  'EMP-0062': ('08:55', 18),
  'EMP-1104': ('09:21', 120),
  'EMP-0914': ('06:54', 12),
};

/// Deterministic 0–1 noise so reseeds produce the same history.
double _noise(String seed) {
  var h = 2166136261;
  for (final c in seed.codeUnits) {
    h ^= c;
    h = (h * 16777619) & 0xFFFFFFFF;
  }
  return (h % 10000) / 10000;
}

/// Shifts, fences, 31 days of punches and one pending regularisation.
void seedAttendance(MockStore store) {
  for (final g in geofences) {
    store.put(Col.geofences, {...g});
  }
  for (final s in _shifts) {
    store.put(Col.shifts, s);
  }
  final today = WorkCalendar.today();
  final now = DateTime.now().toUtc();
  var seq = 0;

  void punch(
    Json emp,
    String date,
    String type,
    DateTime at,
    int distance,
    int accuracy,
  ) {
    final siteId = emp.obj('site').str('id');
    final fence = geofences.firstWhere((g) => g['siteId'] == siteId);
    store.put(Col.punches, {
      'id': 'pch_seed_${++seq}',
      'employeeId': emp['id'],
      'date': date,
      'type': type,
      'punchedAt': at.toIso8601String(),
      'receivedAt': at.toIso8601String(),
      'lat': (fence['centerLat']! as num) + distance / 111320,
      'lng': fence['centerLng'],
      'accuracyM': accuracy,
      'geofenceId': fence['id'],
      'siteId': siteId,
      'distanceM': distance,
      'isMockLocation': false,
      'deviceId': 'seed-device',
      'platform': 'ANDROID',
      'result': 'ACCEPTED',
      'fieldDuty': false,
      'regularisationId': null,
    });
  }

  bool onLeave(String employeeId, String date) => store
      .all(Col.leaveRequests)
      .any(
        (l) =>
            l['employeeId'] == employeeId &&
            l['status'] == 'APPROVED' &&
            l.str('startDate').compareTo(date) <= 0 &&
            date.compareTo(l.str('endDate')) <= 0,
      );

  for (final emp in store.all(Col.employees)) {
    if (emp['status'] == 'OFFBOARDED') continue;
    final code = emp.str('empCode');
    final shiftId = _assignments[code] ?? 'shf_gen';
    emp['shiftId'] = shiftId;
    store.put(Col.employees, emp);
    final shift = _shifts.firstWhere((s) => s['id'] == shiftId);

    for (var offset = -31; offset <= -1; offset++) {
      final date = WorkCalendar.addDays(today, offset);
      if (!WorkCalendar.isBusinessDay(date) || onLeave(emp.str('id'), date)) {
        continue;
      }
      final key = '$code|$date';
      if (_noise('$key|absent') < 0.03) continue;
      final lateRoll = _noise('$key|late');
      final inShift = lateRoll < 0.1
          ? 16 + (lateRoll * 240).round()
          : -25 + (_noise('$key|in') * 33).round();
      final inAt = WorkCalendar.atTime(
        date,
        shift.str('startTime'),
      ).add(Duration(minutes: inShift));
      final distance = (10 + _noise('$key|d') * 180).round();
      final accuracy = (6 + _noise('$key|a') * 18).round();
      punch(emp, date, 'IN', inAt, distance, accuracy);
      if (_noise('$key|missing') < 0.04) continue;
      final outRoll = _noise('$key|out');
      final outShift = outRoll < 0.08
          ? -45
          : _longDays.contains(code)
          ? 40 + (outRoll * 110).round()
          : -5 + (outRoll * 55).round();
      final outAt = WorkCalendar.atTime(
        date,
        shift.str('endTime'),
      ).add(Duration(minutes: outShift));
      punch(emp, date, 'OUT', outAt, (distance * 0.8).round(), accuracy);
    }

    final todayIn = _todayIn[code];
    if (todayIn != null &&
        WorkCalendar.isBusinessDay(today) &&
        !onLeave(emp.str('id'), today)) {
      final target = WorkCalendar.atTime(today, todayIn.$1);
      final cap = now.subtract(const Duration(minutes: 2));
      final at = target.isBefore(cap) ? target : cap;
      if (at.isAfter(WorkCalendar.atTime(today, '05:30'))) {
        punch(emp, today, 'IN', at, todayIn.$2, 8);
      }
    }
  }

  _seedRegularisation(store, today);
}

/// EMP-1042 forgot to punch out on the last business day: pending request
/// routed to the line manager through the real workflow.
void _seedRegularisation(MockStore store, String today) {
  var day = WorkCalendar.addDays(today, -1);
  while (!WorkCalendar.isBusinessDay(day)) {
    day = WorkCalendar.addDays(day, -1);
  }
  final emp = store.get(Col.employees, empId('EMP-1042'));
  final user = store.get(Col.users, userIdFor('EMP-1042'));
  if (emp == null || user == null) return;
  final id = emp.str('id');
  for (final p in AttendanceEngine.punchesOn(store, id, day)) {
    if (p['type'] == 'OUT') store.remove(Col.punches, p.str('id'));
  }
  // Make sure the day has an IN to correct.
  if (AttendanceEngine.punchesOn(store, id, day).isEmpty) return;
  AttendanceEngine.createRegularisation(
    store,
    user: user,
    employee: emp,
    date: day,
    type: 'MISSED_PUNCH',
    reason:
        'Left the office straight for a dealer meeting and forgot to punch out; '
        'the gate register has my exit at 17:40.',
    requestedOut: WorkCalendar.atTime(day, '17:40').toIso8601String(),
  );
}
