import 'dart:convert';
import 'dart:math' as math;

import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Settings behind doc 06 MOD-09 (BR-09-01 … BR-09-16).
abstract final class FleetPolicy {
  static const classes = {'SEDAN': 4, 'MICROBUS': 7, 'PICKUP': 4, 'TANKER': 2};
  static const tripTypes = {'ONE_WAY', 'ROUND_TRIP'};
  static const priorities = {'NORMAL', 'HIGH', 'CRITICAL'};
  static const minLeadMinutes = 60;
  static const gateWindowMinutes = 120;
  static const maxDutyHours = 10;
  static const maxPassengers = 7;
  static const baseFare = 1400.0;
  static const perStopFare = 350.0;
  static const roundTripSurcharge = 950.0;
  static const costPerKm = {
    'SEDAN': 18.0,
    'MICROBUS': 22.0,
    'PICKUP': 24.0,
    'TANKER': 55.0,
    'EXECUTIVE': 32.0,
  };
  static const presets = <String, (double km, int minutes)>{
    'Keraniganj Plant': (38.4, 75),
    'কেরানীগঞ্জ প্ল্যান্ট': (38.4, 75),
    'Chattogram Terminal': (248, 330),
    'চট্টগ্রাম টার্মিনাল': (248, 330),
    'Head Office, Baridhara': (8, 25),
    'প্রধান কার্যালয়, বারিধারা': (8, 25),
  };
  static const tolls = {
    'Babubazar': 150.0,
    'Mayor Hanif Flyover': 260.0,
    'Dhaka Elevated Expressway': 80.0,
    'Padma Bridge': 800.0,
    'Kanchpur': 120.0,
  };
  static const objectType = 'VehicleRequisition';
  static const terminalReq = {'COMPLETED', 'REJECTED', 'CANCELLED'};
}

/// Vehicle requisitions, trips, SOS, tolls and fuel (doc 03 §15).
abstract final class FleetEngine {
  static final _rand = math.Random.secure();
  static String? seedClock;
  static bool _hooks = false;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static String _me(AuthContext a) => a.user.str('id');

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static void registerHooks() {
    if (_hooks) return;
    _hooks = true;
    WorkflowHooks.register(FleetPolicy.objectType, _onWorkflow);
  }

  static void _onWorkflow(MockStore store, Json inst, WorkflowEvent event) {
    final r = store.get(Col.fleetRequisitions, inst.str('objectId'));
    if (r == null || r['status'] != 'PENDING_APPROVAL') return;
    switch (event) {
      case WorkflowEvent.approved:
        r
          ..['status'] = 'APPROVED'
          ..['updatedAt'] = store.nowIso();
        store.put(Col.fleetRequisitions, r);
        _notify(
          store,
          r.str('requesterUserId'),
          r,
          'FLEET_REQ_APPROVED',
          const Bi(
            'Your vehicle request is approved',
            'আপনার গাড়ির আবেদন অনুমোদিত',
          ),
          const Bi(
            'Transport will assign a car and a driver.',
            'পরিবহন একটি গাড়ি ও চালক দেবে।',
          ),
        );
        NotificationEngine.notifyRole(
          store,
          role: 'TRANSPORT_ADMIN',
          type: 'FLEET_REQ_APPROVED',
          title: const Bi(
            'Vehicle request ready to assign',
            'গাড়ির আবেদন বরাদ্দের জন্য প্রস্তুত',
          ),
          body: Bi('${r['purpose']}', '${r['purpose']}'),
          data: _data(r),
        );
      case WorkflowEvent.rejected:
        r
          ..['status'] = 'REJECTED'
          ..['updatedAt'] = store.nowIso();
        store.put(Col.fleetRequisitions, r);
        _notify(
          store,
          r.str('requesterUserId'),
          r,
          'FLEET_REQ_REJECTED',
          const Bi(
            'Your vehicle request was not approved',
            'আপনার গাড়ির আবেদন অনুমোদিত হয়নি',
          ),
          const Bi(
            'Open the request to read the reason.',
            'কারণ দেখতে আবেদন খুলুন।',
          ),
        );
      case WorkflowEvent.withdrawn:
        r
          ..['status'] = 'CANCELLED'
          ..['updatedAt'] = store.nowIso();
        store.put(Col.fleetRequisitions, r);
      case WorkflowEvent.submitted:
      case WorkflowEvent.stepApproved:
      case WorkflowEvent.returned:
        break;
    }
  }

  static Json _data(Json r) => {
    'module': 'fleet',
    'route': '/home/fleet/${r['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json r,
    String type,
    Bi title,
    Bi body, {
    String priority = 'NORMAL',
  }) => NotificationEngine.notify(
    store,
    userId: userId,
    type: type,
    title: title,
    body: body,
    priority: priority,
    data: _data(r),
  );

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _next(
    MockStore store,
    String col,
    String field,
    String prefix,
  ) {
    final year = _year(store);
    var max = 0;
    for (final r in store.all(col)) {
      final n = r.strOrNull(field);
      if (n != null && n.startsWith('$prefix-$year-')) {
        final i = int.tryParse(n.substring(prefix.length + year.length + 2));
        if (i != null && i > max) max = i;
      }
    }
    return '$prefix-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static String? _text(Json b, String key, int min, int max) {
    final v = b[key];
    if (v == null) return null;
    if (v is! String || v.trim().length < min || v.length > max) {
      throw validationError(key, 'Invalid $key');
    }
    return v.trim();
  }

  static (double km, int minutes, double cost, String cls) estimate({
    required String destination,
    required String tripType,
    required int passengers,
    int stops = 0,
  }) {
    final cls = passengers > 4 ? 'MICROBUS' : 'SEDAN';
    if (passengers > 7) {
      throw validationError(
        'passengerCount',
        'More than 7 people needs two requests',
      );
    }
    final preset = FleetPolicy.presets[destination] ?? (40.0, 80);
    final factor = 1 + stops * 0.15;
    final mult = tripType == 'ROUND_TRIP' ? 2.0 : 1.0;
    final km = preset.$1 * factor * mult;
    final minutes = (preset.$2 * factor * mult).round() + stops * 20;
    final cost =
        FleetPolicy.baseFare +
        stops * FleetPolicy.perStopFare +
        (tripType == 'ROUND_TRIP' ? FleetPolicy.roundTripSurcharge : 0);
    return (km, minutes, cost, cls);
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    final purpose = _text(body, 'purpose', 5, 400);
    final dest = _text(body, 'destination', 2, 120);
    final origin =
        _text(body, 'origin', 2, 120) ??
        (auth.employee.obj('site')['name'] as String? ??
            'Head Office, Baridhara');
    if (purpose == null) {
      throw validationError('purpose', 'Say why you need a car');
    }
    if (dest == null) {
      throw validationError('destination', 'Where are you going');
    }
    final tripType = body['tripType'] ?? 'ONE_WAY';
    if (!FleetPolicy.tripTypes.contains(tripType)) {
      throw validationError('tripType', 'Unknown trip type');
    }
    final priority = body['priority'] ?? 'NORMAL';
    if (!FleetPolicy.priorities.contains(priority)) {
      throw validationError('priority', 'Unknown priority');
    }
    final pax = (body['passengerCount'] as num?)?.toInt() ?? 1;
    if (pax < 1 || pax > FleetPolicy.maxPassengers) {
      throw validationError('passengerCount', 'Between 1 and 7 people');
    }
    final departRaw = body['departAt'];
    if (departRaw is! String) {
      throw validationError('departAt', 'Choose when you leave');
    }
    final depart = DateTime.parse(departRaw);
    final now = DateTime.parse(_stamp(store));
    if (priority != 'CRITICAL' &&
        depart.isBefore(
          now.add(const Duration(minutes: FleetPolicy.minLeadMinutes)),
        )) {
      throw validationError(
        'departAt',
        'Ask at least one hour ahead, unless it is critical',
      );
    }
    final stops = body['stops'] is List ? (body['stops']! as List).length : 0;
    final est = estimate(
      destination: dest,
      tripType: tripType as String,
      passengers: pax,
      stops: stops,
    );
    final nowIso = _stamp(store);
    final r = <String, Object?>{
      'id':
          'req_${store.collection(Col.fleetRequisitions).length + 1}_${store.nowMs()}',
      'reqNo': _next(store, Col.fleetRequisitions, 'reqNo', 'REQ'),
      'status': 'DRAFT',
      'requesterUserId': _me(auth),
      'origin': origin,
      'destination': dest,
      'tripType': tripType,
      'priority': priority,
      'purpose': purpose,
      'passengerCount': pax,
      'capacityClass': est.$4,
      'departAt': depart.toUtc().toIso8601String(),
      'returnAt': body['returnAt'],
      'stops': body['stops'] ?? <Object?>[],
      'estimatedKm': est.$1,
      'estimatedMinutes': est.$2,
      'estimatedCost': est.$3,
      'tripId': null,
      'workflowInstanceId': null,
      'createdAt': nowIso,
      'updatedAt': nowIso,
    };
    store.put(Col.fleetRequisitions, r);
    return r;
  }

  static void submit(MockStore store, AuthContext auth, Json r) {
    if (r['requesterUserId'] != _me(auth)) throw forbidden();
    if (r['status'] != 'DRAFT' && r['status'] != 'REJECTED') {
      throw invalidTransition('This request is already in progress.');
    }
    final inst = WorkflowEngine.submit(
      store,
      templateKey: 'VEHICLE_REQUISITION',
      objectType: FleetPolicy.objectType,
      objectId: r.str('id'),
      initiatorUserId: _me(auth),
      summary: {
        'refNo': r['reqNo'],
        'title': 'Vehicle — ${r['destination']}',
        'titleBn': 'গাড়ি — ${r['destination']}',
        'details': r['purpose'],
        'detailsBn': r['purpose'],
        'urgency': r['priority'] == 'CRITICAL' ? 'HIGH' : 'NORMAL',
        'category': 'FLEET',
        'departmentId': auth.employee.obj('department')['id'],
      },
    );
    r
      ..['status'] = 'PENDING_APPROVAL'
      ..['workflowInstanceId'] = inst['id']
      ..['updatedAt'] = _stamp(store);
    store.put(Col.fleetRequisitions, r);
  }

  static void cancel(MockStore store, AuthContext auth, Json r, Json body) {
    final me = _me(auth);
    if (r['requesterUserId'] != me && !_can(auth, 'fleet:dispatch')) {
      throw forbidden();
    }
    if (FleetPolicy.terminalReq.contains(r['status']) ||
        r['status'] == 'IN_TRANSIT') {
      throw invalidTransition('This trip cannot be cancelled now.');
    }
    if (r['status'] == 'ASSIGNED') {
      _release(store, r);
    }
    r
      ..['status'] = 'CANCELLED'
      ..['notes'] = _text(body, 'reason', 0, 400)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.fleetRequisitions, r);
  }

  static Json? _tripOf(MockStore store, Json r) {
    final id = r.strOrNull('tripId');
    return id == null ? null : store.get(Col.fleetTrips, id);
  }

  static void _release(MockStore store, Json r) {
    final t = _tripOf(store, r);
    if (t == null) return;
    final v = store.get(Col.fleetVehicles, t.str('vehicleId'));
    final d = store.get(Col.fleetDrivers, t.str('driverId'));
    if (v != null && v['status'] != 'IN_TRANSIT') {
      v['reservedTripId'] = null;
      store.put(Col.fleetVehicles, v);
    }
    if (d != null && d['status'] != 'ON_TRIP') {
      d['reservedTripId'] = null;
      store.put(Col.fleetDrivers, d);
    }
    t
      ..['status'] = 'CANCELLED'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.fleetTrips, t);
  }

  static List<Json> assignableVehicles(MockStore store, Json r) {
    final need = FleetPolicy.classes[r.str('capacityClass')] ?? 4;
    return [
      for (final v in store.all(Col.fleetVehicles))
        if (v['status'] == 'AVAILABLE' &&
            v['reservedTripId'] == null &&
            ((v['capacity'] as num?)?.toInt() ?? 0) >= need &&
            _docsOk(v, r['isHazmat'] == true))
          v,
    ];
  }

  static List<Json> assignableDrivers(MockStore store, Json vehicle) {
    return [
      for (final d in store.all(Col.fleetDrivers))
        if (d['status'] == 'AVAILABLE' &&
            d['reservedTripId'] == null &&
            _licenceOk(d, vehicle) &&
            ((d['dutyHoursToday'] as num?)?.toDouble() ?? 0) <
                FleetPolicy.maxDutyHours)
          d,
    ];
  }

  static bool _docsOk(Json v, bool hazmat) {
    for (final doc in v.objList('documents')) {
      final exp = DateTime.tryParse(doc.strOrNull('expiresAt') ?? '');
      if (exp == null) continue;
      final kind = doc.str('kind');
      if (kind == 'HAZMAT_PERMIT' && !hazmat) continue;
      if (exp.isBefore(DateTime.now())) return false;
    }
    return true;
  }

  static bool _licenceOk(Json d, Json v) {
    final exp = DateTime.tryParse(d.strOrNull('licenceExpiresAt') ?? '');
    if (exp == null || exp.isBefore(DateTime.now())) return false;
    final cls = d.strOrNull('licenceClass') ?? 'LIGHT';
    if (v['isHazmat'] == true) return cls == 'HEAVY_HAZMAT';
    if (v['type'] == 'TANKER') return cls == 'HEAVY_HAZMAT';
    if (v['type'] == 'PICKUP') {
      return cls == 'HEAVY' || cls == 'LIGHT' || cls == 'HEAVY_HAZMAT';
    }
    return true;
  }

  static void assign(MockStore store, AuthContext auth, Json r, Json body) {
    if (!_can(auth, 'fleet:dispatch')) throw forbidden();
    if (r['status'] != 'APPROVED' && r['status'] != 'ASSIGNED') {
      throw invalidTransition('Approve the request before assigning.');
    }
    final vid = body['vehicleId'];
    final did = body['driverId'];
    if (vid is! String || did is! String) {
      throw validationError('vehicleId', 'Choose a car and a driver');
    }
    final v = store.get(Col.fleetVehicles, vid);
    final d = store.get(Col.fleetDrivers, did);
    if (v == null || d == null) throw notFound('Vehicle or driver');
    if (!assignableVehicles(store, r).any((x) => x['id'] == vid)) {
      throw policyViolation(
        'VEHICLE_NOT_FREE',
        'That car is not free or its papers have expired.',
      );
    }
    if (!assignableDrivers(store, v).any((x) => x['id'] == did)) {
      throw policyViolation(
        'DRIVER_NOT_FREE',
        'That driver cannot take this trip.',
      );
    }
    if (v['isHazmat'] == true &&
        (d.strOrNull('lastBreathalyzerResult') != 'PASSED')) {
      throw policyViolation(
        'BREATHALYZER',
        'Hazmat trips need a passed alcohol test today.',
      );
    }
    if (r['status'] == 'ASSIGNED') _release(store, r);
    final now = _stamp(store);
    final t = <String, Object?>{
      'id':
          'trp_${store.collection(Col.fleetTrips).length + 1}_${store.nowMs()}',
      'passNo': _next(store, Col.fleetTrips, 'passNo', 'PASS'),
      'status': 'OPEN',
      'requisitionId': r['id'],
      'vehicleId': vid,
      'driverId': did,
      'driverUserId': d['userId'],
      'startKm': null,
      'endKm': null,
      'gateOutAt': null,
      'gateInAt': null,
      'events': <Json>[],
      'totalCost': 0,
      'createdAt': now,
      'updatedAt': now,
    };
    _event(
      store,
      t,
      'ASSIGNED',
      _me(auth),
      note: _text(body, 'dispatchNote', 0, 200),
    );
    v
      ..['reservedTripId'] = t['id']
      ..['updatedAt'] = now;
    d
      ..['reservedTripId'] = t['id']
      ..['updatedAt'] = now;
    r
      ..['status'] = 'ASSIGNED'
      ..['tripId'] = t['id']
      ..['updatedAt'] = now;
    store
      ..put(Col.fleetTrips, t)
      ..put(Col.fleetVehicles, v)
      ..put(Col.fleetDrivers, d)
      ..put(Col.fleetRequisitions, r);
    _notify(
      store,
      r.str('requesterUserId'),
      r,
      'FLEET_ASSIGNED',
      const Bi('A car has been assigned', 'একটি গাড়ি বরাদ্দ হয়েছে'),
      Bi(
        '${v['plateNo']} with ${_person(store, d.strOrNull('userId'), false)}',
        '${v['plateNo']}, ${_person(store, d.strOrNull('userId'), true)}',
      ),
    );
    if (d['userId'] is String) {
      _notify(
        store,
        d.str('userId'),
        r,
        'FLEET_ASSIGNED',
        const Bi('You have a trip', 'আপনার একটি ট্রিপ আছে'),
        Bi('${r['destination']}', '${r['destination']}'),
        priority: 'HIGH',
      );
    }
  }

  static String _person(MockStore store, String? userId, bool bn) {
    final p = WorkflowEngine.personRef(store, userId);
    if (p == null) return '';
    return ((bn ? p['nameBn'] : p['name']) as String?) ?? '';
  }

  static void _event(
    MockStore store,
    Json t,
    String type,
    String actor, {
    String? note,
    String? photoFileId,
    double? lat,
    double? lng,
    int? odometerKm,
  }) {
    if (photoFileId != null) {
      FileEngine.attach(
        store,
        photoFileId,
        ownerType: 'Trip',
        ownerId: t.str('id'),
      );
    }
    final list = t.objList('events')
      ..add({
        'seqNo': t.objList('events').length + 1,
        'type': type,
        'actorUserId': actor,
        'note': note,
        'photoFileId': photoFileId,
        'lat': lat,
        'lng': lng,
        'odometerKm': odometerKm,
        'createdAt': _stamp(store),
      });
    t
      ..['events'] = list
      ..['updatedAt'] = _stamp(store);
    store.put(Col.fleetTrips, t);
  }

  static Json _reqOfTrip(MockStore store, Json t) =>
      store.get(Col.fleetRequisitions, t.str('requisitionId')) ?? const {};

  static void _mustDriverOrGate(AuthContext a, Json t) {
    if (t['driverUserId'] == _me(a)) return;
    if (_can(a, 'fleet:gate') || _can(a, 'fleet:dispatch')) return;
    throw forbidden();
  }

  static void gateOut(MockStore store, AuthContext auth, Json t, Json body) {
    _mustDriverOrGate(auth, t);
    final r = _reqOfTrip(store, t);
    if (r['status'] != 'ASSIGNED') {
      throw invalidTransition('The trip has not been assigned yet.');
    }
    final v = store.get(Col.fleetVehicles, t.str('vehicleId'))!;
    final km = (body['odometerKm'] as num?)?.toInt();
    final odo = (v['odometerKm'] as num?)?.toInt() ?? 0;
    if (km == null || km < odo - 5) {
      throw validationError(
        'odometerKm',
        'Odometer cannot be below the last reading',
      );
    }
    final depart = DateTime.parse(r.str('departAt'));
    final now = DateTime.parse(_stamp(store));
    const window = Duration(minutes: FleetPolicy.gateWindowMinutes);
    if (now.isBefore(depart.subtract(window)) ||
        now.isAfter(depart.add(window))) {
      if (!_can(auth, 'fleet:dispatch')) {
        throw policyViolation(
          'OUTSIDE_WINDOW',
          'Too early or too late. Ask transport to override.',
        );
      }
    }
    t
      ..['startKm'] = km
      ..['gateOutAt'] = _stamp(store);
    _event(store, t, 'GATE_OUT', _me(auth), odometerKm: km);
    r
      ..['status'] = 'IN_TRANSIT'
      ..['updatedAt'] = _stamp(store);
    v
      ..['status'] = 'IN_TRANSIT'
      ..['odometerKm'] = km;
    final d = store.get(Col.fleetDrivers, t.str('driverId'))!;
    d['status'] = 'ON_TRIP';
    store
      ..put(Col.fleetRequisitions, r)
      ..put(Col.fleetVehicles, v)
      ..put(Col.fleetDrivers, d);
    _notify(
      store,
      r.str('requesterUserId'),
      r,
      'FLEET_TRIP_STARTED',
      const Bi('Your driver has left', 'আপনার চালক বেরিয়েছেন'),
      Bi('${v['plateNo']} is on the way.', '${v['plateNo']} পথে আছে।'),
    );
  }

  static void checkpoint(MockStore store, AuthContext auth, Json t, Json body) {
    if (t['driverUserId'] != _me(auth) && !_can(auth, 'fleet:dispatch')) {
      throw forbidden();
    }
    if (_reqOfTrip(store, t)['status'] != 'IN_TRANSIT') {
      throw invalidTransition('The trip has not started.');
    }
    _event(
      store,
      t,
      'CHECKPOINT',
      _me(auth),
      note: _text(body, 'note', 0, 200) ?? _text(body, 'location', 2, 120),
      lat: (body['lat'] as num?)?.toDouble(),
      lng: (body['lng'] as num?)?.toDouble(),
      odometerKm: (body['odometerKm'] as num?)?.toInt(),
    );
  }

  static void gateIn(MockStore store, AuthContext auth, Json t, Json body) {
    _mustDriverOrGate(auth, t);
    if (_reqOfTrip(store, t)['status'] != 'IN_TRANSIT') {
      throw invalidTransition('The trip has not started.');
    }
    final km = (body['odometerKm'] as num?)?.toInt();
    final start = (t['startKm'] as num?)?.toInt() ?? 0;
    if (km == null || km < start) {
      throw validationError(
        'odometerKm',
        'End reading must be at or above the start',
      );
    }
    t
      ..['endKm'] = km
      ..['gateInAt'] = _stamp(store);
    _event(store, t, 'GATE_IN', _me(auth), odometerKm: km);
  }

  static void complete(MockStore store, AuthContext auth, Json t, Json body) {
    if (t['driverUserId'] != _me(auth) && !_can(auth, 'fleet:dispatch')) {
      throw forbidden();
    }
    final r = _reqOfTrip(store, t);
    if (r['status'] != 'IN_TRANSIT') {
      throw invalidTransition('The trip has not started.');
    }
    final end =
        (body['endKm'] as num?)?.toInt() ?? (t['endKm'] as num?)?.toInt();
    final start = (t['startKm'] as num?)?.toInt() ?? 0;
    if (end == null || end < start) {
      throw validationError('endKm', 'Enter the finishing odometer');
    }
    if (t['gateInAt'] == null) {
      t
        ..['endKm'] = end
        ..['gateInAt'] = _stamp(store);
      _event(store, t, 'GATE_IN', _me(auth), odometerKm: end);
    }
    final km = end - start;
    final v = store.get(Col.fleetVehicles, t.str('vehicleId'))!;
    final rate = FleetPolicy.costPerKm[v.strOrNull('type')] ?? 18;
    final tolls = store
        .all(Col.fleetTolls)
        .where((x) => x['tripId'] == t['id'] && x['status'] == 'APPROVED')
        .fold<double>(
          0,
          (s, x) => s + ((x['amount'] as num?)?.toDouble() ?? 0),
        );
    t
      ..['endKm'] = end
      ..['status'] = 'CLOSED'
      ..['totalCost'] = km * rate + tolls
      ..['updatedAt'] = _stamp(store);
    _event(store, t, 'COMPLETED', _me(auth), odometerKm: end);
    r
      ..['status'] = 'COMPLETED'
      ..['updatedAt'] = _stamp(store);
    v
      ..['status'] = 'AVAILABLE'
      ..['odometerKm'] = end
      ..['reservedTripId'] = null;
    final d = store.get(Col.fleetDrivers, t.str('driverId'))!;
    final hours = t['gateOutAt'] == null || t['gateInAt'] == null
        ? 0.0
        : DateTime.parse(t.str('gateInAt'))
                  .difference(DateTime.parse(t.str('gateOutAt')))
                  .inMinutes /
              60;
    final duty = ((d['dutyHoursToday'] as num?)?.toDouble() ?? 0) + hours;
    d
      ..['status'] = duty >= FleetPolicy.maxDutyHours
          ? 'REST_REQUIRED'
          : 'AVAILABLE'
      ..['dutyHoursToday'] = duty
      ..['totalTrips'] = ((d['totalTrips'] as num?)?.toInt() ?? 0) + 1
      ..['reservedTripId'] = null;
    store
      ..put(Col.fleetRequisitions, r)
      ..put(Col.fleetVehicles, v)
      ..put(Col.fleetDrivers, d)
      ..put(Col.fleetTrips, t);
    _notify(
      store,
      r.str('requesterUserId'),
      r,
      'FLEET_TRIP_COMPLETED',
      const Bi('Your trip is finished', 'আপনার ট্রিপ শেষ হয়েছে'),
      const Bi(
        'You can rate the trip from the request.',
        'আবেদন থেকে ট্রিপ রেটিং দিতে পারেন।',
      ),
    );
  }

  static void rate(MockStore store, AuthContext auth, Json r, Json body) {
    if (r['requesterUserId'] != _me(auth)) throw forbidden();
    if (r['status'] != 'COMPLETED') {
      throw invalidTransition('Rate only after the trip ends.');
    }
    final rating = (body['rating'] as num?)?.toInt();
    if (rating == null || rating < 1 || rating > 5) {
      throw validationError('rating', 'Choose 1 to 5');
    }
    final t = _tripOf(store, r);
    if (t == null) throw notFound('Trip');
    t
      ..['rating'] = rating
      ..['feedback'] = _text(body, 'feedback', 0, 500)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.fleetTrips, t);
  }

  static void sos(MockStore store, AuthContext auth, Json t, Json body) {
    if (t['driverUserId'] != _me(auth) && !_can(auth, 'fleet:dispatch')) {
      throw forbidden();
    }
    final note = _text(body, 'note', 3, 400);
    if (note == null) throw validationError('note', 'Say what is wrong');
    final lat = (body['lat'] as num?)?.toDouble();
    final lng = (body['lng'] as num?)?.toDouble();
    _event(store, t, 'SOS', _me(auth), note: note, lat: lat, lng: lng);
    final r = _reqOfTrip(store, t);
    final rec = <String, Object?>{
      'id': 'sos_${store.collection(Col.fleetSos).length + 1}_${store.nowMs()}',
      'tripId': t['id'],
      'requisitionId': r['id'],
      'driverUserId': _me(auth),
      'note': note,
      'lat': lat,
      'lng': lng,
      'status': 'OPEN',
      'createdAt': _stamp(store),
    };
    store.put(Col.fleetSos, rec);
    void ping(String? uid) {
      if (uid == null) return;
      NotificationEngine.notify(
        store,
        userId: uid,
        type: 'FLEET_SOS',
        title: const Bi('Driver needs help', 'চালকের সাহায্য দরকার'),
        body: Bi(note, note),
        priority: 'CRITICAL',
        ackRequired: true,
        data: _data(r),
      );
    }

    ping(r.strOrNull('requesterUserId'));
    for (final u in store.all(Col.users)) {
      final roles = u.strList('roles');
      if (roles.contains('TRANSPORT_ADMIN') ||
          roles.contains('SECURITY_GATE') ||
          roles.contains('PLANT_GM')) {
        ping(u.str('id'));
      }
    }
  }

  static Json standaloneSos(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'fleet:drive') && !_can(auth, 'fleet:dispatch')) {
      throw forbidden();
    }
    final note = _text(body, 'note', 3, 400);
    if (note == null) throw validationError('note', 'Say what is wrong');
    final rec = <String, Object?>{
      'id': 'sos_${store.collection(Col.fleetSos).length + 1}_${store.nowMs()}',
      'tripId': body['tripId'],
      'requisitionId': body['requisitionId'],
      'driverUserId': _me(auth),
      'note': note,
      'lat': (body['lat'] as num?)?.toDouble(),
      'lng': (body['lng'] as num?)?.toDouble(),
      'status': 'OPEN',
      'createdAt': _stamp(store),
    };
    store.put(Col.fleetSos, rec);
    NotificationEngine.notifyRole(
      store,
      role: 'TRANSPORT_ADMIN',
      type: 'FLEET_SOS',
      title: const Bi('Driver needs help', 'চালকের সাহায্য দরকার'),
      body: Bi(note, note),
      priority: 'CRITICAL',
      ackRequired: true,
      data: {'module': 'fleet', 'route': '/home/fleet/sos'},
    );
    return rec;
  }

  static void ackSos(MockStore store, AuthContext auth, Json s) {
    if (!_can(auth, 'fleet:dispatch') && !_can(auth, 'fleet:gate')) {
      throw forbidden();
    }
    s
      ..['status'] = 'ACKED'
      ..['ackedBy'] = _me(auth)
      ..['ackedAt'] = _stamp(store);
    store.put(Col.fleetSos, s);
  }

  static void addToll(MockStore store, AuthContext auth, Json t, Json body) {
    if (t['driverUserId'] != _me(auth)) throw forbidden();
    final plaza = _text(body, 'plaza', 2, 80);
    final amount = (body['amount'] as num?)?.toDouble();
    if (plaza == null || amount == null || amount <= 0 || amount > 5000) {
      throw validationError('amount', 'Enter a plaza and an amount');
    }
    String? photo;
    if (amount > 200) {
      photo = body['photoFileId'] as String?;
      if (photo == null || store.get(Col.files, photo) == null) {
        throw validationError('photoFileId', 'A photo is needed above ৳200');
      }
      FileEngine.attach(store, photo, ownerType: 'Trip', ownerId: t.str('id'));
    }
    store.put(Col.fleetTolls, {
      'id':
          'tol_${store.collection(Col.fleetTolls).length + 1}_${store.nowMs()}',
      'tollNo': _next(store, Col.fleetTolls, 'tollNo', 'TOL'),
      'tripId': t['id'],
      'driverUserId': _me(auth),
      'plaza': plaza,
      'amount': amount,
      'photoFileId': photo,
      'status': 'PENDING',
      'createdAt': _stamp(store),
    });
    NotificationEngine.notifyRole(
      store,
      role: 'TRANSPORT_ADMIN',
      type: 'FLEET_TOLL_SUBMITTED',
      title: const Bi('Toll claim to review', 'টোল দাবি পর্যালোচনা করুন'),
      body: Bi('$plaza — ৳${amount.round()}', '$plaza — ৳${amount.round()}'),
      data: _data(_reqOfTrip(store, t)),
    );
  }

  static void decideToll(
    MockStore store,
    AuthContext auth,
    Json toll,
    String verb,
  ) {
    if (verb == 'pay') {
      if (!_can(auth, 'fleet:tolls-pay')) throw forbidden();
      if (toll['status'] != 'APPROVED') {
        throw invalidTransition('Approve the toll first.');
      }
      toll['status'] = 'PAID';
    } else {
      if (!_can(auth, 'fleet:tolls-approve')) throw forbidden();
      if (toll['status'] != 'PENDING') {
        throw invalidTransition('Already decided.');
      }
      toll['status'] = verb == 'approve' ? 'APPROVED' : 'REJECTED';
    }
    toll['updatedAt'] = _stamp(store);
    store.put(Col.fleetTolls, toll);
  }

  static Json issueFuel(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'fleet:fuel')) throw forbidden();
    final vid = body['vehicleId'];
    if (vid is! String) throw validationError('vehicleId', 'Choose a vehicle');
    final v = store.get(Col.fleetVehicles, vid);
    if (v == null) throw notFound('Vehicle');
    final liters = (body['liters'] as num?)?.toDouble();
    final tank = (v['tankLiters'] as num?)?.toDouble() ?? 75;
    if (liters == null || liters <= 0 || liters > tank) {
      throw validationError('liters', 'Litres must fit the tank');
    }
    final token = base64Url
        .encode(List<int>.generate(12, (_) => _rand.nextInt(256)))
        .replaceAll('=', '');
    final f = <String, Object?>{
      'id':
          'fuel_${store.collection(Col.fleetFuelLogs).length + 1}_${store.nowMs()}',
      'voucherNo': _next(store, Col.fleetFuelLogs, 'voucherNo', 'FUEL'),
      'vehicleId': vid,
      'tripId': body['tripId'],
      'station': _text(body, 'station', 2, 80) ?? 'Depot pump',
      'liters': liters,
      'amount': (body['amount'] as num?)?.toDouble(),
      'qrToken': token,
      'redeemedAt': null,
      'createdAt': _stamp(store),
    };
    store.put(Col.fleetFuelLogs, f);
    return f;
  }

  static void redeemFuel(MockStore store, AuthContext auth, Json f, Json body) {
    if (!_can(auth, 'fleet:fuel')) throw forbidden();
    if (f['redeemedAt'] != null) {
      throw policyViolation('FUEL_USED', 'This voucher was already used.');
    }
    if (body['qrToken'] != f['qrToken']) {
      throw policyViolation('FUEL_TOKEN', 'The code does not match.');
    }
    f['redeemedAt'] = _stamp(store);
    store.put(Col.fleetFuelLogs, f);
  }

  static bool visibleReq(MockStore store, AuthContext a, Json r) {
    final me = _me(a);
    if (r['requesterUserId'] == me) return true;
    final t = _tripOf(store, r);
    if (t != null && t['driverUserId'] == me) return true;
    if (_can(a, 'fleet:dispatch') ||
        _can(a, 'fleet:endorse') ||
        _can(a, 'fleet:gate')) {
      return true;
    }
    if (_can(a, 'fleet:read')) {
      final g = a.grants.firstWhere((x) => x['key'] == 'fleet:read');
      return g['scope'] == 'COMPANY' || g['scope'] == 'SITE';
    }
    return false;
  }

  static Json wireReq(MockStore store, AuthContext a, Json r) {
    final t = _tripOf(store, r);
    final v = t == null
        ? null
        : store.get(Col.fleetVehicles, t.str('vehicleId'));
    final d = t == null ? null : store.get(Col.fleetDrivers, t.str('driverId'));
    final me = _me(a);
    final isReq = r['requesterUserId'] == me;
    final isDrv = t != null && t['driverUserId'] == me;
    final st = r.str('status');
    return {
      'id': r['id'],
      'reqNo': r['reqNo'],
      'status': st,
      'purpose': r['purpose'],
      'origin': r['origin'],
      'destination': r['destination'],
      'tripType': r['tripType'],
      'priority': r['priority'],
      'passengerCount': r['passengerCount'],
      'capacityClass': r['capacityClass'],
      'departAt': r['departAt'],
      'returnAt': r['returnAt'],
      'estimatedKm': r['estimatedKm'],
      'estimatedMinutes': r['estimatedMinutes'],
      'estimatedCost': r['estimatedCost'],
      'requester': WorkflowEngine.personRef(store, r.str('requesterUserId')),
      'vehicle': v == null
          ? null
          : {
              'id': v['id'],
              'plateNo': v['plateNo'],
              'type': v['type'],
              'odometerKm': v['odometerKm'],
            },
      'driver': d == null
          ? null
          : {
              ...?WorkflowEngine.personRef(store, d.strOrNull('userId')),
              'id': d['id'],
              'licenceClass': d['licenceClass'],
            },
      'trip': t == null
          ? null
          : {
              'id': t['id'],
              'passNo': t['passNo'],
              'status': t['status'],
              'startKm': t['startKm'],
              'endKm': t['endKm'],
              'gateOutAt': t['gateOutAt'],
              'gateInAt': t['gateInAt'],
              'totalCost': t['totalCost'],
              'rating': t['rating'],
              'events': [
                for (final e in t.objList('events'))
                  {
                    ...e,
                    'actor': WorkflowEngine.personRef(
                      store,
                      e.strOrNull('actorUserId'),
                    ),
                  },
              ],
            },
      'tolls': [
        for (final x in store.all(Col.fleetTolls))
          if (t != null && x['tripId'] == t['id']) x,
      ],
      'createdAt': r['createdAt'],
      'me': {
        'isRequester': isReq,
        'isDriver': isDrv,
        'canSubmit': isReq && (st == 'DRAFT' || st == 'REJECTED'),
        'canCancel':
            (isReq || _can(a, 'fleet:dispatch')) &&
            !FleetPolicy.terminalReq.contains(st) &&
            st != 'IN_TRANSIT',
        'canAssign':
            (st == 'APPROVED' || st == 'ASSIGNED') && _can(a, 'fleet:dispatch'),
        'canGateOut': st == 'ASSIGNED' && (isDrv || _can(a, 'fleet:gate')),
        'canCheckpoint': st == 'IN_TRANSIT' && isDrv,
        'canGateIn': st == 'IN_TRANSIT' && (isDrv || _can(a, 'fleet:gate')),
        'canComplete':
            st == 'IN_TRANSIT' && (isDrv || _can(a, 'fleet:dispatch')),
        'canSos': (st == 'ASSIGNED' || st == 'IN_TRANSIT') && isDrv,
        'canToll': st == 'IN_TRANSIT' && isDrv,
        'canRate': st == 'COMPLETED' && isReq && t?['rating'] == null,
      },
    };
  }

  static Json registerVehicle(MockStore store, AuthContext auth, Json body) {
    final plate = (body['plateNo'] as String? ?? '').trim();
    if (plate.length < 4) {
      throw validationError('plateNo', 'Enter the plate');
    }
    final type = (body['type'] as String? ?? 'SEDAN').trim();
    final rec = <String, Object?>{
      'id': 'veh_${store.nowMs()}',
      'plateNo': plate,
      'type': type,
      'capacity': (body['capacity'] as num?)?.toInt() ?? 4,
      'status': 'AVAILABLE',
      'siteId': auth.employee.obj('site')['id'],
      'odometerKm': (body['odometerKm'] as num?)?.toInt() ?? 0,
      'isHazmat': false,
      'tankLiters': 60,
      'reservedTripId': null,
      'documents': const <Object?>[],
    };
    store.put(Col.fleetVehicles, rec);
    return vehicleWire(rec);
  }

  static Json enrolDriver(MockStore store, AuthContext auth, Json body) {
    final code = (body['empCode'] as String? ?? '').trim();
    Json? emp;
    for (final e in store.all(Col.employees)) {
      if (e.str('empCode') == code) emp = e;
    }
    if (emp == null) throw validationError('empCode', 'Unknown employee');
    final uid = emp.strOrNull('userId');
    if (uid == null) {
      throw validationError('empCode', 'That person has no login');
    }
    final rawCode = body['driverCode'];
    final driverCode = rawCode is String && rawCode.trim().isNotEmpty
        ? rawCode.trim()
        : 'DRV-${store.nowMs() % 1000}';
    final rec = <String, Object?>{
      'id': 'drv_${store.nowMs()}',
      'userId': uid,
      'employeeId': emp['id'],
      'driverCode': driverCode,
      'status': 'AVAILABLE',
      'licenceClass': (body['licenceClass'] as String?) ?? 'LIGHT',
      'licenceExpiresAt': DateTime.parse(store.nowIso())
          .add(const Duration(days: 365))
          .toIso8601String(),
      'dutyHoursToday': 0,
      'totalTrips': 0,
      'lastBreathalyzerResult': 'PASSED',
      'lastBreathalyzerAt': store.nowIso(),
      'reservedTripId': null,
    };
    store.put(Col.fleetDrivers, rec);
    return driverWire(store, rec);
  }

  static Json vehicleWire(Json v) => {
    'id': v['id'],
    'plateNo': v['plateNo'],
    'type': v['type'],
    'capacity': v['capacity'],
    'status': v['status'],
    'siteId': v['siteId'],
    'odometerKm': v['odometerKm'],
    'isHazmat': v['isHazmat'] == true,
    'tankLiters': v['tankLiters'],
    'label': '${v['plateNo']} · ${v['type']}',
  };

  static Json driverWire(MockStore store, Json d) => {
    'id': d['id'],
    'userId': d['userId'],
    'driverCode': d['driverCode'],
    'status': d['status'],
    'licenceClass': d['licenceClass'],
    'licenceExpiresAt': d['licenceExpiresAt'],
    'dutyHoursToday': d['dutyHoursToday'],
    'person': WorkflowEngine.personRef(store, d.strOrNull('userId')),
  };

  static Json? pooling(MockStore store) {
    final pending = [
      for (final r in store.all(Col.fleetRequisitions))
        if (r['status'] == 'APPROVED' || r['status'] == 'PENDING_APPROVAL') r,
    ];
    for (var i = 0; i < pending.length; i++) {
      for (var j = i + 1; j < pending.length; j++) {
        final a = pending[i];
        final b = pending[j];
        final da = (a['destination'] as String? ?? '').toLowerCase();
        final db = (b['destination'] as String? ?? '').toLowerCase();
        if (da.isEmpty || db.isEmpty) continue;
        if (da.contains(db) ||
            db.contains(da) ||
            da.split(' ').first == db.split(' ').first) {
          return {
            'aId': a['id'],
            'bId': b['id'],
            'aDest': a['destination'],
            'bDest': b['destination'],
            'aRef': a['reqNo'] ?? a['id'],
            'bRef': b['reqNo'] ?? b['id'],
          };
        }
      }
    }
    return null;
  }
}
