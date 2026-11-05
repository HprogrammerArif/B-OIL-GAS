import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Commuter bus rules (doc 06 §13, `Setting bus.*`).
abstract final class BusPolicy {
  static const int offerWindowHours = 48;
  static const int avgDaysPerVacancy = 14;
  static const int priorityReasonMin = 10;
  static const int maxPriority = 9;
  static const int maxReleaseDays = 60;
  static const int broadcastMax = 300;
}

/// Seats, FIFO waitlist with timed offers, release/reclaim and admin tools.
abstract final class BusEngine {
  static const _open = {'WAITING', 'OFFERED'};

  static int _now(MockStore s) => s.nowMs();

  static String _iso(int ms) =>
      DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true).toIso8601String();

  static Json? route(MockStore store, String id) =>
      store.get(Col.busRoutes, id);

  static List<Json> allocationsOf(MockStore store, String routeId) => store
      .all(Col.busAllocations)
      .where((a) => a['routeId'] == routeId && a['status'] != 'ENDED')
      .toList();

  static List<Json> queueOf(MockStore store, String routeId) {
    final waiting =
        store
            .all(Col.busWaitlist)
            .where((w) => w['routeId'] == routeId && w['status'] == 'WAITING')
            .toList()
          ..sort((a, b) {
            final p = b.intVal('priority').compareTo(a.intVal('priority'));
            if (p != 0) return p;
            final t = a.str('appliedAt').compareTo(b.str('appliedAt'));
            return t != 0 ? t : a.str('id').compareTo(b.str('id'));
          });
    return waiting;
  }

  static Json? activeAllocation(MockStore store, String employeeId) => store
      .all(Col.busAllocations)
      .where((a) => a['employeeId'] == employeeId && a['status'] != 'ENDED')
      .firstOrNull;

  static Json? openEntry(MockStore store, String employeeId) => store
      .all(Col.busWaitlist)
      .where(
        (w) => w['employeeId'] == employeeId && _open.contains(w['status']),
      )
      .firstOrNull;

  /// Seats nobody holds and no open offer reserves.
  static List<int> freeSeats(MockStore store, Json route) {
    final taken = <int>{
      for (final a in allocationsOf(store, route.str('id'))) a.intVal('seatNo'),
      for (final w in store.all(Col.busWaitlist))
        if (w['routeId'] == route['id'] && w['status'] == 'OFFERED')
          w.intVal('offerSeatNo'),
    };
    return [
      for (var n = 1; n <= route.intVal('capacity'); n++)
        if (!taken.contains(n)) n,
    ];
  }

  /// Expires lapsed offers and re-offers their seats. Called by every bus
  /// request, standing in for the server's offer-expiry job (BR-14-03).
  static void tick(MockStore store) {
    final now = _now(store);
    var changed = false;
    for (final w in store.all(Col.busWaitlist)) {
      if (w['status'] == 'OFFERED' &&
          DateTime.parse(w.str('expiresAt')).millisecondsSinceEpoch <= now) {
        w['status'] = 'EXPIRED';
        store.put(Col.busWaitlist, w);
        _notifyEmployee(
          store,
          w.str('employeeId'),
          'BUS_OFFER_EXPIRED',
          const Bi('Seat offer expired', 'আসনের প্রস্তাবের সময় শেষ'),
          const Bi(
            'You did not respond in 48 hours. The seat went to the next person.',
            '৪৮ ঘণ্টায় সাড়া না দেওয়ায় আসনটি পরের জনকে দেওয়া হয়েছে।',
          ),
        );
        changed = true;
      }
    }
    if (changed) {
      for (final r in store.all(Col.busRoutes)) {
        offerFreeSeats(store, r);
      }
    }
  }

  /// Offers every free seat to the head of the queue, lowest seat first.
  static void offerFreeSeats(MockStore store, Json route) {
    final now = _now(store);
    for (final seat in freeSeats(store, route)) {
      final head = queueOf(store, route.str('id'))
          .where((w) => activeAllocation(store, w.str('employeeId')) == null)
          .firstOrNull;
      if (head == null) return;
      head
        ..['status'] = 'OFFERED'
        ..['offerSeatNo'] = seat
        ..['offeredAt'] = _iso(now)
        ..['expiresAt'] = _iso(now + BusPolicy.offerWindowHours * 3600 * 1000);
      store.put(Col.busWaitlist, head);
      _notifyEmployee(
        store,
        head.str('employeeId'),
        'BUS_SEAT_OFFERED',
        const Bi('A bus seat is yours', 'বাসে আপনার জন্য আসন'),
        Bi(
          'Seat $seat on ${route['code']} is offered. Accept within 48 hours.',
          '${route['code']} রুটে আসন $seat প্রস্তাব করা হয়েছে। ৪৮ ঘণ্টার মধ্যে গ্রহণ করুন।',
        ),
        priority: 'HIGH',
      );
    }
  }

  static void _notifyEmployee(
    MockStore store,
    String employeeId,
    String type,
    Bi title,
    Bi body, {
    String priority = 'NORMAL',
  }) {
    final emp = store.get(Col.employees, employeeId);
    final uid = emp?.strOrNull('userId');
    if (uid == null) return;
    NotificationEngine.notify(
      store,
      userId: uid,
      type: type,
      title: title,
      body: body,
      priority: priority,
      data: {'module': 'bus', 'route': '/home/bus'},
    );
  }

  // ---- Employee actions ----

  static Json join(MockStore store, AuthContext auth, String routeId) {
    final r = route(store, routeId);
    if (r == null) throw notFound('Route');
    if (activeAllocation(store, auth.employeeId) != null) {
      throw _conflict('ALREADY_HAS_SEAT', 'You already have a bus seat');
    }
    if (openEntry(store, auth.employeeId) != null) {
      throw _conflict('ALREADY_WAITING', 'You are already on a waitlist');
    }
    final now = _now(store);
    final entry = <String, Object?>{
      'id': 'bw_${store.collection(Col.busWaitlist).length + 1}_$now',
      'routeId': routeId,
      'employeeId': auth.employeeId,
      'appliedAt': _iso(now),
      'priority': 0,
      'priorityReason': null,
      'status': 'WAITING',
      'offerSeatNo': null,
      'offeredAt': null,
      'expiresAt': null,
    };
    store.put(Col.busWaitlist, entry);
    offerFreeSeats(store, r);
    return entry;
  }

  static Json _entryOf(MockStore store, AuthContext auth, String id) {
    final w = store.get(Col.busWaitlist, id);
    if (w == null || w['employeeId'] != auth.employeeId) {
      throw notFound('Waitlist entry');
    }
    return w;
  }

  static Json accept(
    MockStore store,
    AuthContext auth,
    String id,
    String? stopId,
  ) {
    final w = _entryOf(store, auth, id);
    if (w['status'] != 'OFFERED') {
      throw invalidTransition('This offer is no longer open');
    }
    final now = _now(store);
    if (DateTime.parse(w.str('expiresAt')).millisecondsSinceEpoch <= now) {
      tick(store);
      throw invalidTransition('This offer has expired');
    }
    final r = route(store, w.str('routeId'))!;
    final stops = r.objList('stops');
    final stop = stopId == null
        ? stops.first
        : stops.where((s) => s['id'] == stopId).firstOrNull;
    if (stop == null) throw validationError('stopId', 'Choose a pickup stop');
    final alloc = <String, Object?>{
      'id': 'ba_${store.collection(Col.busAllocations).length + 1}_$now',
      'routeId': r['id'],
      'seatNo': w['offerSeatNo'],
      'employeeId': auth.employeeId,
      'label': null,
      'kind': 'PERMANENT',
      'stopId': stop['id'],
      'startsOn': WorkCalendar.nthBusinessDay(WorkCalendar.today(), 2),
      'status': 'ACTIVE',
      'vacatedFrom': null,
      'vacatedTo': null,
      'vacateReason': null,
    };
    store.put(Col.busAllocations, alloc);
    w['status'] = 'ACCEPTED';
    store.put(Col.busWaitlist, w);
    AuditEngine.log(
      store,
      action: 'BUS_SEAT_ALLOCATED',
      entityType: 'SeatAllocation',
      actorUserId: auth.user.str('id'),
      entityId: alloc.str('id'),
      after: {'route': r['code'], 'seat': alloc['seatNo']},
    );
    NotificationEngine.notifyRole(
      store,
      role: 'TRANSPORT_ADMIN',
      type: 'BUS_SEAT_ALLOCATED',
      title: const Bi('Seat allocated', 'আসন বরাদ্দ হয়েছে'),
      body: Bi(
        '${auth.employee['fullName']} took seat ${alloc['seatNo']} on ${r['code']}.',
        '${auth.employee['fullNameBn']} ${r['code']} রুটে আসন ${alloc['seatNo']} নিয়েছেন।',
      ),
      data: {'module': 'bus', 'route': '/home/bus/routes/${r['id']}'},
    );
    return alloc;
  }

  static void decline(MockStore store, AuthContext auth, String id) {
    final w = _entryOf(store, auth, id);
    if (w['status'] != 'OFFERED') {
      throw invalidTransition('This offer is no longer open');
    }
    w['status'] = 'DECLINED';
    store.put(Col.busWaitlist, w);
    offerFreeSeats(store, route(store, w.str('routeId'))!);
  }

  static void cancelWait(MockStore store, AuthContext auth, String id) {
    final w = _entryOf(store, auth, id);
    if (!_open.contains(w['status'])) {
      throw invalidTransition('This entry is already closed');
    }
    final wasOffered = w['status'] == 'OFFERED';
    w['status'] = 'CANCELLED';
    store.put(Col.busWaitlist, w);
    if (wasOffered) offerFreeSeats(store, route(store, w.str('routeId'))!);
  }

  static Json _ownAllocation(MockStore store, AuthContext auth, String id) {
    final a = store.get(Col.busAllocations, id);
    if (a == null ||
        a['employeeId'] != auth.employeeId ||
        a['status'] == 'ENDED') {
      throw notFound('Seat');
    }
    return a;
  }

  static Json release(MockStore store, AuthContext auth, String id, Json body) {
    final a = _ownAllocation(store, auth, id);
    if (a['status'] != 'ACTIVE') {
      throw invalidTransition('This seat is already released');
    }
    final from = body['from'];
    final to = body['to'];
    final today = WorkCalendar.today();
    if (from is! String ||
        !WorkCalendar.isValidKey(from) ||
        from.compareTo(today) < 0) {
      throw validationError('from', 'Choose a start date from today');
    }
    if (to is! String ||
        !WorkCalendar.isValidKey(to) ||
        to.compareTo(from) < 0) {
      throw validationError('to', 'Choose an end date');
    }
    if (WorkCalendar.daysBetween(from, to) > BusPolicy.maxReleaseDays) {
      throw validationError('to', 'A seat can be released for up to 60 days');
    }
    final reason = body['reason'];
    if (reason is! String ||
        reason.trim().length < 3 ||
        reason.trim().length > 200) {
      throw validationError('reason', 'Enter a reason');
    }
    a
      ..['status'] = 'VACATED'
      ..['vacatedFrom'] = from
      ..['vacatedTo'] = to
      ..['vacateReason'] = reason.trim();
    store.put(Col.busAllocations, a);
    NotificationEngine.notifyRole(
      store,
      role: 'TRANSPORT_ADMIN',
      type: 'BUS_SEAT_RELEASED',
      title: const Bi('Seat released', 'আসন ছাড়া হয়েছে'),
      body: Bi(
        '${auth.employee['fullName']} released seat ${a['seatNo']} ($from to $to).',
        '${auth.employee['fullNameBn']} আসন ${a['seatNo']} ছেড়েছেন ($from – $to)।',
      ),
      data: {'module': 'bus', 'route': '/home/bus/routes/${a['routeId']}'},
    );
    return a;
  }

  static Json reclaim(MockStore store, AuthContext auth, String id) {
    final a = _ownAllocation(store, auth, id);
    if (a['status'] != 'VACATED') {
      throw invalidTransition('This seat is not released');
    }
    a
      ..['status'] = 'ACTIVE'
      ..['vacatedFrom'] = null
      ..['vacatedTo'] = null
      ..['vacateReason'] = null;
    store.put(Col.busAllocations, a);
    return a;
  }

  // ---- Admin ----

  static void endAllocation(MockStore store, AuthContext auth, String id) {
    final a = store.get(Col.busAllocations, id);
    if (a == null || a['status'] == 'ENDED') throw notFound('Seat');
    a
      ..['status'] = 'ENDED'
      ..['endedAt'] = store.nowIso();
    store.put(Col.busAllocations, a);
    AuditEngine.log(
      store,
      action: 'BUS_ALLOCATION_ENDED',
      entityType: 'SeatAllocation',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {'seat': a['seatNo']},
    );
    final emp = a.strOrNull('employeeId');
    if (emp != null) {
      _notifyEmployee(
        store,
        emp,
        'BUS_SEAT_RELEASED',
        const Bi('Bus seat ended', 'বাসের আসন বাতিল'),
        const Bi(
          'Your bus seat allocation was ended by Transport.',
          'পরিবহন বিভাগ আপনার বাসের আসন বরাদ্দ বাতিল করেছে।',
        ),
      );
    }
    offerFreeSeats(store, route(store, a.str('routeId'))!);
  }

  static void setPriority(
    MockStore store,
    AuthContext auth,
    String id,
    Json body,
  ) {
    final w = store.get(Col.busWaitlist, id);
    if (w == null || w['status'] != 'WAITING') throw notFound('Waitlist entry');
    final p = body['priority'];
    if (p is! int || p < 0 || p > BusPolicy.maxPriority) {
      throw validationError('priority', 'Priority must be 0 to 9');
    }
    final reason = body['reason'];
    if (p > 0 &&
        (reason is! String ||
            reason.trim().length < BusPolicy.priorityReasonMin)) {
      throw validationError(
        'reason',
        'Give a reason of at least 10 characters',
      );
    }
    w
      ..['priority'] = p
      ..['priorityReason'] = p == 0 ? null : (reason! as String).trim();
    store.put(Col.busWaitlist, w);
    AuditEngine.log(
      store,
      action: 'WAITLIST_PRIORITY_OVERRIDE',
      entityType: 'SeatWaitlist',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {'priority': p},
    );
    _notifyEmployee(
      store,
      w.str('employeeId'),
      'BUS_WAITLIST_REORDERED',
      const Bi('Waitlist updated', 'অপেক্ষমাণ তালিকা হালনাগাদ'),
      const Bi(
        'Your place on the bus waitlist changed.',
        'বাসের অপেক্ষমাণ তালিকায় আপনার অবস্থান বদলেছে।',
      ),
    );
    offerFreeSeats(store, route(store, w.str('routeId'))!);
  }

  static int broadcast(
    MockStore store,
    AuthContext auth,
    String? routeId,
    String message,
  ) {
    final text = message.trim();
    if (text.length < 5 || text.length > BusPolicy.broadcastMax) {
      throw validationError('message', 'Message must be 5–300 characters');
    }
    Json? r;
    if (routeId != null) {
      r = route(store, routeId);
      if (r == null) throw notFound('Route');
    }
    final riders = {
      for (final a in store.all(Col.busAllocations))
        if (a['employeeId'] != null &&
            a['status'] != 'ENDED' &&
            (routeId == null || a['routeId'] == routeId))
          a.str('employeeId'),
    };
    store.put(Col.busBroadcasts, {
      'id':
          'bb_${store.collection(Col.busBroadcasts).length + 1}_${_now(store)}',
      'routeId': routeId,
      'message': text,
      'sentByEmployeeId': auth.employeeId,
      'createdAt': store.nowIso(),
      'recipients': riders.length,
    });
    for (final e in riders) {
      _notifyEmployee(
        store,
        e,
        'BUS_BROADCAST',
        Bi(
          r == null ? 'Bus notice' : 'Bus notice · ${r['code']}',
          r == null ? 'বাস বিজ্ঞপ্তি' : 'বাস বিজ্ঞপ্তি · ${r['code']}',
        ),
        Bi(text, text),
        priority: 'HIGH',
      );
    }
    AuditEngine.log(
      store,
      action: 'BUS_BROADCAST',
      entityType: 'BusBroadcast',
      actorUserId: auth.user.str('id'),
      after: {'route': r?['code'], 'recipients': riders.length},
    );
    return riders.length;
  }

  // ---- Wire ----

  static HttpError _conflict(String rule, String message) => HttpError(
    ApiErrorCode.conflict,
    message,
    details: [
      {'rule': rule},
    ],
  );

  static Json stopWire(Json s) => {
    'id': s['id'],
    'name': s['name'],
    'nameBn': s['nameBn'],
    'morning': s['morning'],
    'evening': s['evening'],
  };

  static Json routeWire(MockStore store, Json r, String employeeId) {
    final id = r.str('id');
    final allocs = allocationsOf(store, id);
    final occupied = allocs.where((a) => a['status'] == 'ACTIVE').length;
    final vacated = allocs.where((a) => a['status'] == 'VACATED').length;
    final mine = allocs.where((a) => a['employeeId'] == employeeId).firstOrNull;
    final entry = store
        .all(Col.busWaitlist)
        .where(
          (w) =>
              w['routeId'] == id &&
              w['employeeId'] == employeeId &&
              _open.contains(w['status']),
        )
        .firstOrNull;
    final cap = r.intVal('capacity');
    return {
      'id': id,
      'code': r['code'],
      'name': r['name'],
      'nameBn': r['nameBn'],
      'distanceKm': r['distanceKm'],
      'capacity': cap,
      'occupied': occupied,
      'vacated': vacated,
      'free': freeSeats(store, r).length,
      'occupancyPct': cap == 0 ? 0 : ((occupied / cap) * 1000).round() / 10,
      'waitlistLength': queueOf(store, id).length,
      'busNo': r['busNo'],
      'stops': [for (final s in r.objList('stops')) stopWire(s)],
      'myStatus': mine != null ? 'SEAT' : entry?.str('status'),
    };
  }

  static Json allocationWire(MockStore store, Json a) {
    final r = route(store, a.str('routeId'))!;
    final stop = r
        .objList('stops')
        .where((s) => s['id'] == a['stopId'])
        .firstOrNull;
    return {
      'id': a['id'],
      'route': {
        'id': r['id'],
        'code': r['code'],
        'name': r['name'],
        'nameBn': r['nameBn'],
        'busNo': r['busNo'],
      },
      'seatNo': a['seatNo'],
      'stop': stop == null ? null : stopWire(stop),
      'startsOn': a['startsOn'],
      'status': a['status'],
      'vacatedFrom': a['vacatedFrom'],
      'vacatedTo': a['vacatedTo'],
      'vacateReason': a['vacateReason'],
    };
  }

  static Json entryWire(MockStore store, Json w) {
    final r = route(store, w.str('routeId'))!;
    final queue = queueOf(store, w.str('routeId'));
    final index = queue.indexWhere((q) => q['id'] == w['id']);
    final position = index < 0 ? 0 : index + 1;
    return {
      'id': w['id'],
      'route': {
        'id': r['id'],
        'code': r['code'],
        'name': r['name'],
        'nameBn': r['nameBn'],
        'stops': [for (final s in r.objList('stops')) stopWire(s)],
      },
      'status': w['status'],
      'position': position,
      'estimatedWaitDays': position * BusPolicy.avgDaysPerVacancy,
      'priority': w['priority'],
      'appliedAt': w['appliedAt'],
      'offerSeatNo': w['offerSeatNo'],
      'offeredAt': w['offeredAt'],
      'expiresAt': w['expiresAt'],
    };
  }

  static Json mySeat(MockStore store, String employeeId) {
    final alloc = activeAllocation(store, employeeId);
    final entry = openEntry(store, employeeId);
    return {
      'allocation': alloc == null ? null : allocationWire(store, alloc),
      'waitlist': entry == null ? null : entryWire(store, entry),
    };
  }

  /// Seat map and queue for Transport admins.
  static Json adminDetail(MockStore store, Json r) {
    final id = r.str('id');
    final allocs = allocationsOf(store, id);
    final held = {for (final a in allocs) a.intVal('seatNo'): a};
    final offered = {
      for (final w in store.all(Col.busWaitlist))
        if (w['routeId'] == id && w['status'] == 'OFFERED')
          w.intVal('offerSeatNo'): w,
    };
    final seats = <Json>[];
    for (var n = 1; n <= r.intVal('capacity'); n++) {
      final a = held[n];
      final emp = a?.strOrNull('employeeId') == null
          ? null
          : store.get(Col.employees, a!.str('employeeId'));
      seats.add({
        'seatNo': n,
        'status': a != null
            ? a.str('status')
            : offered.containsKey(n)
            ? 'OFFERED'
            : 'EMPTY',
        'allocationId': a?['id'],
        'category': a == null
            ? null
            : (a['category'] as String?) ?? _seatKind(n),
        'boarded':
            a != null &&
            (a['boarded'] == true || (a['boarded'] == null && n.isEven)),
        'occupant': a == null
            ? null
            : {
                'name': emp?['fullName'] ?? a['label'] ?? 'Staff',
                'nameBn': emp?['fullNameBn'] ?? a['label'] ?? 'কর্মী',
                'empCode': emp?['empCode'],
              },
      });
    }
    final queue = <Json>[];
    for (final w in [
      ...store
          .all(Col.busWaitlist)
          .where((w) => w['routeId'] == id && w['status'] == 'OFFERED'),
      ...queueOf(store, id),
    ]) {
      final e = store.get(Col.employees, w.str('employeeId'));
      queue.add({
        'id': w['id'],
        'status': w['status'],
        'priority': w['priority'],
        'priorityReason': w['priorityReason'],
        'appliedAt': w['appliedAt'],
        'offerSeatNo': w['offerSeatNo'],
        'expiresAt': w['expiresAt'],
        'employee': {
          'name': e?['fullName'] ?? '',
          'nameBn': e?['fullNameBn'] ?? '',
          'empCode': e?['empCode'],
        },
      });
    }
    return {'seats': seats, 'queue': queue};
  }

  static Json verify(MockStore store, String routeId, String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) throw validationError('query', 'Enter an ID or seat');
    final admin = adminDetail(store, route(store, routeId)!);
    for (final s in admin.objList('seats')) {
      final emp = s.objOrNull('occupant');
      final code = (emp?['empCode'] as String? ?? '').toLowerCase();
      final seat = '${s['seatNo']}';
      if (code == q || seat == q || 's$seat' == q) {
        return {
          'ok': true,
          'seatNo': s['seatNo'],
          'name': emp?['name'] ?? '',
          'nameBn': emp?['nameBn'] ?? emp?['name'],
          'empCode': emp?['empCode'],
        };
      }
    }
    return {'ok': false};
  }

  static Json requestSwap(
    MockStore store,
    AuthContext auth,
    String routeId,
    int targetSeat,
  ) {
    final mine = activeAllocation(store, auth.employeeId);
    if (mine == null || mine['routeId'] != routeId) {
      throw policyViolation('NO_SEAT', 'You do not have a seat on this bus.');
    }
    final other = allocationsOf(store, routeId)
        .where((a) => a['seatNo'] == targetSeat && a['status'] == 'ACTIVE')
        .firstOrNull;
    if (other == null) {
      throw validationError('seatNo', 'That seat is empty');
    }
    final rec = <String, Object?>{
      'id': 'swap_${store.nowMs()}',
      'routeId': routeId,
      'fromAllocationId': mine['id'],
      'toAllocationId': other['id'],
      'fromEmployeeId': mine['employeeId'],
      'toEmployeeId': other['employeeId'],
      'status': 'PENDING',
      'createdAt': store.nowIso(),
    };
    store.put(Col.busSwaps, rec);
    return rec;
  }

  static Json acceptSwap(MockStore store, AuthContext auth, String id) {
    final rec = store.get(Col.busSwaps, id);
    if (rec == null) throw notFound('Swap');
    if (rec['toEmployeeId'] != auth.employeeId) throw forbidden();
    if (rec['status'] != 'PENDING') {
      throw invalidTransition('This swap is already decided.');
    }
    final a = store.get(Col.busAllocations, rec.str('fromAllocationId'));
    final b = store.get(Col.busAllocations, rec.str('toAllocationId'));
    if (a == null || b == null) throw notFound('Seat');
    final tmp = a['seatNo'];
    a['seatNo'] = b['seatNo'];
    b['seatNo'] = tmp;
    rec['status'] = 'ACCEPTED';
    store
      ..put(Col.busAllocations, a)
      ..put(Col.busAllocations, b)
      ..put(Col.busSwaps, rec);
    return rec;
  }

  /// Transport adds a bus and a short route in one step.
  static Json registerBus(MockStore store, AuthContext auth, Json body) {
    final plate = (body['busNo'] as String? ?? '').trim();
    if (plate.length < 4) {
      throw validationError('busNo', 'Enter the bus number');
    }
    final name = (body['name'] as String? ?? '').trim();
    if (name.length < 3) throw validationError('name', 'Name the route');
    final code = (body['code'] as String? ?? '').trim();
    if (code.isEmpty) throw validationError('code', 'Enter a route code');
    final rawBn = body['nameBn'];
    final nameBn = rawBn is String && rawBn.trim().isNotEmpty
        ? rawBn.trim()
        : name;
    final rec = <String, Object?>{
      'id': 'rt_${store.nowMs()}',
      'code': code.toUpperCase(),
      'name': name,
      'nameBn': nameBn,
      'distanceKm': (body['distanceKm'] as num?)?.toDouble() ?? 12,
      'capacity': (body['capacity'] as num?)?.toInt() ?? 40,
      'busNo': plate,
      'stops': [
        {
          'id': 'st_${store.nowMs()}',
          'name': 'Plant gate',
          'nameBn': 'প্ল্যান্ট গেট',
          'morning': '07:00',
          'evening': '18:00',
        },
      ],
    };
    store.put(Col.busRoutes, rec);
    return routeWire(store, rec, auth.employeeId);
  }

  /// Moves the named bus onto an existing route.
  static Json reassign(
    MockStore store,
    AuthContext auth,
    String id,
    Json body,
  ) {
    final r = route(store, id);
    if (r == null) throw notFound('Route');
    final plate = (body['busNo'] as String? ?? '').trim();
    if (plate.length < 4) {
      throw validationError('busNo', 'Enter the bus number');
    }
    r['busNo'] = plate;
    store.put(Col.busRoutes, r);
    return routeWire(store, r, auth.employeeId);
  }

  /// Lady, executive, senior or regular, and whether they boarded today.
  static Json setSeat(MockStore store, String routeId, int seatNo, Json body) {
    Json? alloc;
    for (final a in allocationsOf(store, routeId)) {
      if (a.intVal('seatNo') == seatNo) alloc = a;
    }
    if (alloc == null) throw notFound('Seat');
    final cat = body['category'];
    if (cat is String) {
      const allowed = {'REGULAR', 'LADY', 'EXECUTIVE', 'SENIOR'};
      if (!allowed.contains(cat)) {
        throw validationError('category', 'Unknown seat type');
      }
      alloc['category'] = cat;
    }
    if (body['boarded'] is bool) alloc['boarded'] = body['boarded'];
    store.put(Col.busAllocations, alloc);
    final r = route(store, routeId);
    if (r == null) throw notFound('Route');
    return adminDetail(store, r);
  }

  static String _seatKind(int seat) => switch (seat % 7) {
    1 => 'EXECUTIVE',
    2 => 'LADY',
    3 => 'SENIOR',
    _ => 'REGULAR',
  };
}
