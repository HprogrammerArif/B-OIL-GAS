import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/attendance_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

double _num(Json body, String key, {double? min, double? max}) {
  final v = body[key];
  if (v is! num || v.isNaN) throw validationError(key, '$key is required');
  final d = v.toDouble();
  if ((min != null && d < min) || (max != null && d > max)) {
    throw validationError(key, '$key is out of range');
  }
  return d;
}

String _str(Json body, String key, {int max = 100}) {
  final v = body[key];
  if (v is! String || v.isEmpty || v.length > max) {
    throw validationError(key, '$key is invalid');
  }
  return v;
}

/// Parses an ISO timestamp or throws a validation error.
DateTime _instant(String key, Object? raw) {
  final parsed = raw is String ? DateTime.tryParse(raw) : null;
  if (parsed == null) throw validationError(key, '$key must be a timestamp');
  return parsed.toUtc();
}

Json _punchResponse(
  HandlerContext ctx,
  Json record,
  Json emp, {
  required bool duplicate,
  Json? fence,
}) {
  final rejected = (record['result']! as String).startsWith('REJECTED');
  return {
    'id': record['id'],
    'result': record['result'],
    'geofence': fence != null && record['distanceM'] != null
        ? {
            'id': fence['id'],
            'name': fence['name'],
            'nameBn': fence['nameBn'],
            'distanceM': record['distanceM'],
          }
        : null,
    'day': AttendanceEngine.computeDay(ctx.store, emp, record.str('date')),
    'canRegularise': !duplicate && rejected,
    'regularisationId': record['regularisationId'],
    'duplicate': duplicate,
  };
}

List<RouteDef> attendanceRoutes() => [
  RouteDef('GET', '/geofences', (ctx) async {
    ctx.requireAuth();
    return ok([
      for (final g in AttendanceEngine.activeFences(ctx.store))
        AttendanceEngine.geofenceWire(g),
    ]);
  }),
  RouteDef('GET', '/attendance/me/today', (ctx) async {
    final emp = ctx.requireAuth().employee;
    final lat = double.tryParse(ctx.query['lat'] ?? '');
    final lng = double.tryParse(ctx.query['lng'] ?? '');
    final day = AttendanceEngine.computeDay(
      ctx.store,
      emp,
      WorkCalendar.today(),
    );
    return ok({
      'date': day['date'],
      'shift': AttendanceEngine.shiftWire(
        AttendanceEngine.shiftFor(ctx.store, emp),
      ),
      'day': day,
      'nextPunchType': AttendanceEngine.nextPunchType(day),
      'nearestGeofence': lat == null || lng == null
          ? null
          : AttendanceEngine.nearestWire(ctx.store, lat, lng),
      'overtimeMinutesMtd': AttendanceEngine.overtimeMtd(ctx.store, emp),
    });
  }, permission: ['attendance:punch']),
  RouteDef('GET', '/attendance/me', (ctx) async {
    final emp = ctx.requireAuth().employee;
    final from = ctx.query['from'];
    final to = ctx.query['to'];
    if (from == null || !WorkCalendar.isValidKey(from)) {
      throw validationError('from', 'Invalid date');
    }
    if (to == null || !WorkCalendar.isValidKey(to) || to.compareTo(from) < 0) {
      throw validationError('to', 'Invalid range');
    }
    final today = WorkCalendar.today();
    final days = <Json>[];
    for (
      var d = to.compareTo(today) > 0 ? today : to;
      d.compareTo(from) >= 0 && days.length < 62;
      d = WorkCalendar.addDays(d, -1)
    ) {
      days.add(AttendanceEngine.computeDay(ctx.store, emp, d));
    }
    return ok({
      'from': from,
      'to': to,
      'days': days,
      'summary': AttendanceEngine.summarise(days),
    });
  }, permission: ['attendance:punch']),
  RouteDef('POST', '/attendance/punch', (ctx) async {
    final auth = ctx.requireAuth();
    final emp = auth.employee;
    final body = ctx.bodyObject();
    final type = body['type'];
    if (type != 'IN' && type != 'OUT') {
      throw validationError('type', 'type must be IN or OUT');
    }
    final claimed = _instant('punchedAt', body['punchedAt']);
    final lat = _num(body, 'lat', min: -90, max: 90);
    final lng = _num(body, 'lng', min: -180, max: 180);
    final accRaw = body['accuracyM'];
    final accuracy = accRaw is num ? accRaw.toDouble() : null;
    if (accRaw != null && (accRaw is! num || accRaw < 0)) {
      throw validationError('accuracyM', 'accuracyM is invalid');
    }
    final isMock = body['isMockLocation'] == true;
    final platform = body['platform'];
    if (platform != 'ANDROID' && platform != 'IOS') {
      throw validationError('platform', 'platform is invalid');
    }
    final deviceId = _str(body, 'deviceId');
    final note = body['note'] is String ? (body['note']! as String).trim() : '';
    if (note.length > 500) throw validationError('note', 'note is too long');

    final now = Dhaka.clock().toUtc();
    // Offline replays are accepted up to 24 h; future or older timestamps
    // fall back to server time (BR-10-03).
    final skew = claimed.difference(now);
    final age = now.difference(claimed);
    final at =
        skew <= const Duration(minutes: AttendancePolicy.clockSkewMin) &&
            age <= const Duration(hours: AttendancePolicy.offlineReplayHours)
        ? claimed
        : now;
    final date = WorkCalendar.dateOf(at);

    final prior = ctx.store
        .all(Col.punches)
        .where(
          (p) =>
              p['employeeId'] == emp['id'] &&
              p['type'] == type &&
              p['result'] == 'ACCEPTED' &&
              DateTime.parse(p.str('punchedAt')).difference(at).abs() <
                  const Duration(minutes: AttendancePolicy.duplicateWindowMin),
        )
        .firstOrNull;
    if (prior != null) {
      final fenceId = prior.strOrNull('geofenceId');
      return ok(
        _punchResponse(
          ctx,
          prior,
          emp,
          duplicate: true,
          fence: fenceId == null ? null : ctx.store.get(Col.geofences, fenceId),
        ),
        status: 201,
      );
    }

    final verdict = AttendanceEngine.evaluate(
      ctx.store,
      employeeId: emp.str('id'),
      date: date,
      lat: lat,
      lng: lng,
      accuracyM: accuracy,
      isMock: isMock,
      fieldDutyRequested: body['fieldDutyRequested'] == true,
    );
    final record = <String, Object?>{
      'id':
          'pch_${ctx.store.nowMs()}_${ctx.store.collection(Col.punches).length}',
      'employeeId': emp['id'],
      'date': date,
      'type': type,
      'punchedAt': at.toIso8601String(),
      'receivedAt': ctx.store.nowIso(),
      'lat': lat,
      'lng': lng,
      'accuracyM': accuracy,
      'geofenceId': verdict.fence?['id'],
      'siteId': verdict.fence?['siteId'],
      'distanceM': verdict.distanceM,
      'isMockLocation': isMock,
      'deviceId': deviceId,
      'platform': platform,
      'result': verdict.result,
      'fieldDuty': verdict.fieldDuty,
      'regularisationId': null,
    };
    ctx.store.put(Col.punches, record);

    if (verdict.result == 'PENDING_REGULARISATION') {
      final existing = ctx.store
          .all(Col.regularisations)
          .where(
            (r) =>
                r['employeeId'] == emp['id'] &&
                r['date'] == date &&
                r['type'] == 'FIELD_DUTY' &&
                r['status'] == 'PENDING',
          )
          .firstOrNull;
      final reg =
          existing ??
          AttendanceEngine.createRegularisation(
            ctx.store,
            user: auth.user,
            employee: emp,
            date: date,
            type: 'FIELD_DUTY',
            reason: note.length >= AttendancePolicy.reasonMin
                ? note
                : 'Punched outside the site fence '
                      '(${(verdict.distanceM ?? 0).round()} m away) on field duty.',
          );
      record['regularisationId'] = reg['id'];
      if (reg['status'] == 'APPROVED') {
        record
          ..['result'] = 'ACCEPTED'
          ..['fieldDuty'] = true;
      }
      ctx.store.put(Col.punches, record);
    }

    if ((record['result']! as String).startsWith('REJECTED')) {
      NotificationEngine.notify(
        ctx.store,
        userId: auth.user.str('id'),
        type: 'ATTENDANCE_PUNCH_REJECTED',
        priority: 'HIGH',
        title: const Bi('Punch not accepted', 'পাঞ্চ গৃহীত হয়নি'),
        body: const Bi(
          'Your punch was rejected. You can request regularisation.',
          'আপনার পাঞ্চ বাতিল হয়েছে। নিয়মিতকরণের আবেদন করতে পারেন।',
        ),
        data: {'module': 'attendance', 'route': '/home/attendance'},
      );
    }
    await ctx.store.commit();
    return ok(
      _punchResponse(ctx, record, emp, duplicate: false, fence: verdict.fence),
      status: 201,
    );
  }, permission: ['attendance:punch']),
  RouteDef('POST', '/attendance/regularisations', (ctx) async {
    final auth = ctx.requireAuth();
    final emp = auth.employee;
    final body = ctx.bodyObject();
    final date = body['date'];
    if (date is! String || !WorkCalendar.isValidKey(date)) {
      throw validationError('date', 'Enter a valid date');
    }
    final type = body['type'];
    if (type is! String || !AttendancePolicy.regTypes.contains(type)) {
      throw validationError('type', 'Choose a request type');
    }
    final reasonRaw = body['reason'];
    final reason = reasonRaw is String ? reasonRaw.trim() : '';
    if (reason.length < AttendancePolicy.reasonMin) {
      throw validationError(
        'reason',
        'Reason must be at least ${AttendancePolicy.reasonMin} characters',
      );
    }
    if (reason.length > AttendancePolicy.reasonMax) {
      throw validationError('reason', 'Reason is too long');
    }
    final inRaw = body['requestedIn'];
    final outRaw = body['requestedOut'];
    final reqIn = inRaw == null ? null : _instant('requestedIn', inRaw);
    final reqOut = outRaw == null ? null : _instant('requestedOut', outRaw);
    if (reqIn != null && reqOut != null && !reqOut.isAfter(reqIn)) {
      throw validationError('requestedOut', 'Out time must be after in time');
    }
    if (type == 'MISSED_PUNCH' && reqIn == null && reqOut == null) {
      throw validationError('requestedIn', 'Enter the missed time');
    }
    final today = WorkCalendar.today();
    final oldest = WorkCalendar.addDays(
      today,
      -AttendancePolicy.regularisationWindowDays,
    );
    if (type == 'FIELD_DUTY') {
      final newest = WorkCalendar.addDays(
        today,
        AttendancePolicy.fieldDutyAheadDays,
      );
      if (date.compareTo(newest) > 0 || date.compareTo(oldest) < 0) {
        throw validationError('date', 'Date is outside the allowed window');
      }
    } else if (date.compareTo(today) > 0 || date.compareTo(oldest) < 0) {
      throw validationError(
        'date',
        'Choose a date within the last '
            '${AttendancePolicy.regularisationWindowDays} days',
      );
    }
    final dup = ctx.store
        .all(Col.regularisations)
        .where(
          (r) =>
              r['employeeId'] == emp['id'] &&
              r['date'] == date &&
              r['type'] == type &&
              r['status'] == 'PENDING',
        )
        .firstOrNull;
    if (dup != null) {
      throw HttpError(
        ApiErrorCode.conflict,
        'A request for this day is already pending',
        details: [
          {'rule': 'DUPLICATE', 'refNo': dup['refNo']},
        ],
      );
    }
    final reg = AttendanceEngine.createRegularisation(
      ctx.store,
      user: auth.user,
      employee: emp,
      date: date,
      type: type,
      reason: reason,
      requestedIn: reqIn?.toIso8601String(),
      requestedOut: reqOut?.toIso8601String(),
    );
    await ctx.store.commit();
    return ok(AttendanceEngine.regWire(ctx.store, reg), status: 201);
  }, permission: ['attendance:punch']),
  RouteDef('GET', '/attendance/regularisations', (ctx) async {
    final a = ctx.requireAuth();
    final items = ctx.store
        .all(Col.regularisations)
        .where((r) => r['employeeId'] == a.employeeId)
        .toList();
    return ok([
      for (final r in sortBy(items, '-createdAt', '-createdAt'))
        AttendanceEngine.regWire(ctx.store, r),
    ]);
  }, permission: ['attendance:punch']),
];
