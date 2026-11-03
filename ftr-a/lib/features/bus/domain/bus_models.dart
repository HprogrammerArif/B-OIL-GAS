import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);
DateTime? _instant(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

@immutable
class BusStop {
  const BusStop({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.morning,
    required this.evening,
  });

  factory BusStop.fromJson(Map<String, Object?> j) => BusStop(
    id: j['id']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    morning: (j['morning'] as String?) ?? '',
    evening: (j['evening'] as String?) ?? '',
  );

  final String id;
  final String name;
  final String nameBn;

  /// `HH:mm` pick-up time in the morning run.
  final String morning;
  final String evening;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

/// The caller's relationship to a route.
enum RouteMyStatus { seat, waiting, offered }

@immutable
class BusRoute {
  const BusRoute({
    required this.id,
    required this.code,
    required this.name,
    required this.nameBn,
    required this.distanceKm,
    required this.capacity,
    required this.occupied,
    required this.vacated,
    required this.free,
    required this.occupancyPct,
    required this.waitlistLength,
    required this.busNo,
    required this.stops,
    this.myStatus,
    this.admin,
  });

  factory BusRoute.fromJson(Map<String, Object?> j) => BusRoute(
    id: j['id']! as String,
    code: j['code']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    distanceKm: (j['distanceKm']! as num).toDouble(),
    capacity: (j['capacity']! as num).toInt(),
    occupied: (j['occupied']! as num).toInt(),
    vacated: (j['vacated']! as num).toInt(),
    free: (j['free']! as num).toInt(),
    occupancyPct: (j['occupancyPct']! as num).toDouble(),
    waitlistLength: (j['waitlistLength']! as num).toInt(),
    busNo: (j['busNo'] as String?) ?? '',
    stops: [for (final s in j['stops']! as List) BusStop.fromJson(_map(s))],
    myStatus: switch (j['myStatus']) {
      'SEAT' => RouteMyStatus.seat,
      'WAITING' => RouteMyStatus.waiting,
      'OFFERED' => RouteMyStatus.offered,
      _ => null,
    },
    admin: j['admin'] == null
        ? null
        : BusAdminDetail.fromJson(_map(j['admin'])),
  );

  final String id;
  final String code;
  final String name;
  final String nameBn;
  final double distanceKm;
  final int capacity;
  final int occupied;
  final int vacated;
  final int free;
  final double occupancyPct;
  final int waitlistLength;
  final String busNo;
  final List<BusStop> stops;
  final RouteMyStatus? myStatus;

  /// Present only for users with `bus:manage`.
  final BusAdminDetail? admin;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
  bool get isFull => free == 0;
}

@immutable
class RouteRef {
  const RouteRef({
    required this.id,
    required this.code,
    required this.name,
    required this.nameBn,
    this.busNo,
    this.stops = const [],
  });

  factory RouteRef.fromJson(Map<String, Object?> j) => RouteRef(
    id: j['id']! as String,
    code: j['code']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    busNo: j['busNo'] as String?,
    stops: [
      for (final s in (j['stops'] as List?) ?? const [])
        BusStop.fromJson(_map(s)),
    ],
  );

  final String id;
  final String code;
  final String name;
  final String nameBn;
  final String? busNo;
  final List<BusStop> stops;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class SeatAllocation {
  const SeatAllocation({
    required this.id,
    required this.route,
    required this.seatNo,
    required this.status,
    this.stop,
    this.startsOn,
    this.vacatedFrom,
    this.vacatedTo,
    this.vacateReason,
  });

  factory SeatAllocation.fromJson(Map<String, Object?> j) => SeatAllocation(
    id: j['id']! as String,
    route: RouteRef.fromJson(_map(j['route'])),
    seatNo: (j['seatNo']! as num).toInt(),
    status: j['status']! as String,
    stop: j['stop'] == null ? null : BusStop.fromJson(_map(j['stop'])),
    startsOn: j['startsOn'] as String?,
    vacatedFrom: j['vacatedFrom'] as String?,
    vacatedTo: j['vacatedTo'] as String?,
    vacateReason: j['vacateReason'] as String?,
  );

  final String id;
  final RouteRef route;
  final int seatNo;

  /// `ACTIVE` or `VACATED`.
  final String status;
  final BusStop? stop;
  final String? startsOn;
  final String? vacatedFrom;
  final String? vacatedTo;
  final String? vacateReason;

  bool get vacated => status == 'VACATED';
}

@immutable
class WaitEntry {
  const WaitEntry({
    required this.id,
    required this.route,
    required this.status,
    required this.position,
    required this.estimatedWaitDays,
    required this.priority,
    this.offerSeatNo,
    this.expiresAt,
  });

  factory WaitEntry.fromJson(Map<String, Object?> j) => WaitEntry(
    id: j['id']! as String,
    route: RouteRef.fromJson(_map(j['route'])),
    status: j['status']! as String,
    position: (j['position']! as num).toInt(),
    estimatedWaitDays: (j['estimatedWaitDays']! as num).toInt(),
    priority: (j['priority'] as num?)?.toInt() ?? 0,
    offerSeatNo: (j['offerSeatNo'] as num?)?.toInt(),
    expiresAt: _instant(j['expiresAt']),
  );

  final String id;
  final RouteRef route;

  /// `WAITING` or `OFFERED`.
  final String status;
  final int position;
  final int estimatedWaitDays;
  final int priority;
  final int? offerSeatNo;
  final DateTime? expiresAt;

  bool get offered => status == 'OFFERED';
}

@immutable
class MySeat {
  const MySeat({this.allocation, this.waitlist});

  factory MySeat.fromJson(Map<String, Object?> j) => MySeat(
    allocation: j['allocation'] == null
        ? null
        : SeatAllocation.fromJson(_map(j['allocation'])),
    waitlist: j['waitlist'] == null
        ? null
        : WaitEntry.fromJson(_map(j['waitlist'])),
  );

  final SeatAllocation? allocation;
  final WaitEntry? waitlist;

  bool get isEmpty => allocation == null && waitlist == null;
}

@immutable
class SeatCell {
  const SeatCell({
    required this.seatNo,
    required this.status,
    this.allocationId,
    this.occupantName,
    this.occupantNameBn,
    this.occupantCode,
  });

  factory SeatCell.fromJson(Map<String, Object?> j) {
    final o = j['occupant'] == null ? null : _map(j['occupant']);
    return SeatCell(
      seatNo: (j['seatNo']! as num).toInt(),
      status: j['status']! as String,
      allocationId: j['allocationId'] as String?,
      occupantName: o?['name'] as String?,
      occupantNameBn: o?['nameBn'] as String?,
      occupantCode: o?['empCode'] as String?,
    );
  }

  final int seatNo;

  /// `ACTIVE`, `VACATED`, `OFFERED` or `EMPTY`.
  final String status;
  final String? allocationId;
  final String? occupantName;
  final String? occupantNameBn;
  final String? occupantCode;

  String occupant({required bool bangla}) =>
      (bangla ? occupantNameBn : occupantName) ?? '';
}

@immutable
class QueueItem {
  const QueueItem({
    required this.id,
    required this.status,
    required this.priority,
    required this.name,
    required this.nameBn,
    required this.appliedAt,
    this.empCode,
    this.priorityReason,
    this.offerSeatNo,
    this.expiresAt,
  });

  factory QueueItem.fromJson(Map<String, Object?> j) {
    final e = _map(j['employee']);
    return QueueItem(
      id: j['id']! as String,
      status: j['status']! as String,
      priority: (j['priority'] as num?)?.toInt() ?? 0,
      name: e['name']! as String,
      nameBn: e['nameBn']! as String,
      appliedAt: DateTime.parse(j['appliedAt']! as String).toUtc(),
      empCode: e['empCode'] as String?,
      priorityReason: j['priorityReason'] as String?,
      offerSeatNo: (j['offerSeatNo'] as num?)?.toInt(),
      expiresAt: _instant(j['expiresAt']),
    );
  }

  final String id;
  final String status;
  final int priority;
  final String name;
  final String nameBn;
  final DateTime appliedAt;
  final String? empCode;
  final String? priorityReason;
  final int? offerSeatNo;
  final DateTime? expiresAt;

  bool get offered => status == 'OFFERED';
  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class BusAdminDetail {
  const BusAdminDetail({required this.seats, required this.queue});

  factory BusAdminDetail.fromJson(Map<String, Object?> j) => BusAdminDetail(
    seats: [for (final s in j['seats']! as List) SeatCell.fromJson(_map(s))],
    queue: [for (final q in j['queue']! as List) QueueItem.fromJson(_map(q))],
  );

  final List<SeatCell> seats;
  final List<QueueItem> queue;
}
