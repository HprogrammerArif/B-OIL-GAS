import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

@immutable
class FleetMe {
  const FleetMe({
    required this.isRequester,
    required this.isDriver,
    required this.canSubmit,
    required this.canCancel,
    required this.canAssign,
    required this.canGateOut,
    required this.canCheckpoint,
    required this.canGateIn,
    required this.canComplete,
    required this.canSos,
    required this.canToll,
    required this.canRate,
  });

  factory FleetMe.fromJson(Map<String, Object?> j) => FleetMe(
    isRequester: j['isRequester'] == true,
    isDriver: j['isDriver'] == true,
    canSubmit: j['canSubmit'] == true,
    canCancel: j['canCancel'] == true,
    canAssign: j['canAssign'] == true,
    canGateOut: j['canGateOut'] == true,
    canCheckpoint: j['canCheckpoint'] == true,
    canGateIn: j['canGateIn'] == true,
    canComplete: j['canComplete'] == true,
    canSos: j['canSos'] == true,
    canToll: j['canToll'] == true,
    canRate: j['canRate'] == true,
  );

  final bool isRequester;
  final bool isDriver;
  final bool canSubmit;
  final bool canCancel;
  final bool canAssign;
  final bool canGateOut;
  final bool canCheckpoint;
  final bool canGateIn;
  final bool canComplete;
  final bool canSos;
  final bool canToll;
  final bool canRate;
}

@immutable
class FleetVehicle {
  const FleetVehicle({
    required this.id,
    required this.plateNo,
    required this.type,
    required this.capacity,
    required this.status,
    this.odometerKm,
    this.siteId,
    this.isHazmat = false,
    this.label,
  });

  factory FleetVehicle.fromJson(Map<String, Object?> j) => FleetVehicle(
    id: j['id']! as String,
    plateNo: (j['plateNo'] as String?) ?? '',
    type: (j['type'] as String?) ?? '',
    capacity: (j['capacity'] as num?)?.toInt() ?? 0,
    status: (j['status'] as String?) ?? 'AVAILABLE',
    odometerKm: (j['odometerKm'] as num?)?.toInt(),
    siteId: j['siteId'] as String?,
    isHazmat: j['isHazmat'] == true,
    label: j['label'] as String?,
  );

  final String id;
  final String plateNo;
  final String type;
  final int capacity;
  final String status;
  final int? odometerKm;
  final String? siteId;
  final bool isHazmat;
  final String? label;

  String get display => label ?? '$plateNo · $type';
}

@immutable
class FleetDriver {
  const FleetDriver({
    required this.id,
    required this.status,
    required this.licenceClass,
    this.userId,
    this.driverCode,
    this.person,
    this.dutyHoursToday,
  });

  factory FleetDriver.fromJson(Map<String, Object?> j) {
    final personRaw = j['person'] ?? (j['userId'] == null ? null : j);
    return FleetDriver(
      id: j['id']! as String,
      userId: j['userId'] as String?,
      driverCode: j['driverCode'] as String?,
      status: (j['status'] as String?) ?? 'AVAILABLE',
      licenceClass: (j['licenceClass'] as String?) ?? 'LIGHT',
      person: _person(personRaw),
      dutyHoursToday: (j['dutyHoursToday'] as num?)?.toDouble(),
    );
  }

  final String id;
  final String? userId;
  final String? driverCode;
  final String status;
  final String licenceClass;
  final Person? person;
  final double? dutyHoursToday;
}

@immutable
class TripEvent {
  const TripEvent({
    required this.seqNo,
    required this.type,
    required this.createdAt,
    this.actor,
    this.note,
    this.odometerKm,
  });

  factory TripEvent.fromJson(Map<String, Object?> j) => TripEvent(
    seqNo: (j['seqNo'] as num?)?.toInt() ?? 0,
    type: j['type']! as String,
    actor: _person(j['actor']),
    note: j['note'] as String?,
    odometerKm: (j['odometerKm'] as num?)?.toInt(),
    createdAt: DateTime.parse(j['createdAt']! as String),
  );

  final int seqNo;
  final String type;
  final Person? actor;
  final String? note;
  final int? odometerKm;
  final DateTime createdAt;
}

@immutable
class FleetTrip {
  const FleetTrip({
    required this.id,
    required this.passNo,
    required this.status,
    required this.events,
    this.startKm,
    this.endKm,
    this.gateOutAt,
    this.gateInAt,
    this.totalCost,
    this.rating,
  });

  factory FleetTrip.fromJson(Map<String, Object?> j) => FleetTrip(
    id: j['id']! as String,
    passNo: (j['passNo'] as String?) ?? '',
    status: (j['status'] as String?) ?? 'OPEN',
    startKm: (j['startKm'] as num?)?.toInt(),
    endKm: (j['endKm'] as num?)?.toInt(),
    gateOutAt: j['gateOutAt'] == null
        ? null
        : DateTime.parse(j['gateOutAt']! as String),
    gateInAt: j['gateInAt'] == null
        ? null
        : DateTime.parse(j['gateInAt']! as String),
    totalCost: (j['totalCost'] as num?)?.toDouble(),
    rating: (j['rating'] as num?)?.toInt(),
    events: [
      for (final e in (j['events'] as List?) ?? const [])
        TripEvent.fromJson(_map(e)),
    ],
  );

  final String id;
  final String passNo;
  final String status;
  final int? startKm;
  final int? endKm;
  final DateTime? gateOutAt;
  final DateTime? gateInAt;
  final double? totalCost;
  final int? rating;
  final List<TripEvent> events;
}

@immutable
class FleetToll {
  const FleetToll({
    required this.id,
    required this.plaza,
    required this.amount,
    required this.status,
    this.tollNo,
  });

  factory FleetToll.fromJson(Map<String, Object?> j) => FleetToll(
    id: j['id']! as String,
    tollNo: j['tollNo'] as String?,
    plaza: (j['plaza'] as String?) ?? '',
    amount: (j['amount'] as num?)?.toDouble() ?? 0,
    status: (j['status'] as String?) ?? 'PENDING',
  );

  final String id;
  final String? tollNo;
  final String plaza;
  final double amount;
  final String status;
}

@immutable
class FleetEstimate {
  const FleetEstimate({
    required this.km,
    required this.minutes,
    required this.cost,
    required this.capacityClass,
  });

  factory FleetEstimate.fromJson(Map<String, Object?> j) => FleetEstimate(
    km: (j['estimatedKm'] as num?)?.toDouble() ?? 0,
    minutes: (j['estimatedMinutes'] as num?)?.toInt() ?? 0,
    cost: (j['estimatedCost'] as num?)?.toDouble() ?? 0,
    capacityClass: (j['suggestedCapacityClass'] as String?) ?? 'SEDAN',
  );

  final double km;
  final int minutes;
  final double cost;
  final String capacityClass;
}

@immutable
class FleetAssignable {
  const FleetAssignable({required this.vehicles, required this.drivers});

  factory FleetAssignable.fromJson(Map<String, Object?> j) => FleetAssignable(
    vehicles: [
      for (final e in (j['vehicles'] as List?) ?? const [])
        FleetVehicle.fromJson(_map(e)),
    ],
    drivers: [
      for (final e in (j['drivers'] as List?) ?? const [])
        FleetDriver.fromJson(_map(e)),
    ],
  );

  final List<FleetVehicle> vehicles;
  final List<FleetDriver> drivers;
}

@immutable
class FleetSos {
  const FleetSos({
    required this.id,
    required this.note,
    required this.status,
    required this.createdAt,
    this.tripId,
    this.requisitionId,
  });

  factory FleetSos.fromJson(Map<String, Object?> j) => FleetSos(
    id: j['id']! as String,
    tripId: j['tripId'] as String?,
    requisitionId: j['requisitionId'] as String?,
    note: (j['note'] as String?) ?? '',
    status: (j['status'] as String?) ?? 'OPEN',
    createdAt: DateTime.parse(j['createdAt']! as String),
  );

  final String id;
  final String? tripId;
  final String? requisitionId;
  final String note;
  final String status;
  final DateTime createdAt;
}

@immutable
class VehicleRequisition {
  const VehicleRequisition({
    required this.id,
    required this.reqNo,
    required this.status,
    required this.purpose,
    required this.origin,
    required this.destination,
    required this.tripType,
    required this.priority,
    required this.passengerCount,
    required this.capacityClass,
    required this.departAt,
    required this.me,
    required this.tolls,
    required this.createdAt,
    this.estimatedKm,
    this.estimatedMinutes,
    this.estimatedCost,
    this.requester,
    this.vehicle,
    this.driver,
    this.trip,
  });

  factory VehicleRequisition.fromJson(Map<String, Object?> j) =>
      VehicleRequisition(
        id: j['id']! as String,
        reqNo: (j['reqNo'] as String?) ?? '',
        status: j['status']! as String,
        purpose: (j['purpose'] as String?) ?? '',
        origin: (j['origin'] as String?) ?? '',
        destination: (j['destination'] as String?) ?? '',
        tripType: (j['tripType'] as String?) ?? 'ONE_WAY',
        priority: (j['priority'] as String?) ?? 'NORMAL',
        passengerCount: (j['passengerCount'] as num?)?.toInt() ?? 1,
        capacityClass: (j['capacityClass'] as String?) ?? 'SEDAN',
        departAt: DateTime.parse(j['departAt']! as String),
        estimatedKm: (j['estimatedKm'] as num?)?.toDouble(),
        estimatedMinutes: (j['estimatedMinutes'] as num?)?.toInt(),
        estimatedCost: (j['estimatedCost'] as num?)?.toDouble(),
        requester: _person(j['requester']),
        vehicle: j['vehicle'] == null
            ? null
            : FleetVehicle.fromJson(_map(j['vehicle'])),
        driver: j['driver'] == null
            ? null
            : FleetDriver.fromJson(_map(j['driver'])),
        trip: j['trip'] == null ? null : FleetTrip.fromJson(_map(j['trip'])),
        tolls: [
          for (final e in (j['tolls'] as List?) ?? const [])
            FleetToll.fromJson(_map(e)),
        ],
        createdAt: DateTime.parse(j['createdAt']! as String),
        me: FleetMe.fromJson(_map(j['me'] ?? const <String, Object?>{})),
      );

  final String id;
  final String reqNo;
  final String status;
  final String purpose;
  final String origin;
  final String destination;
  final String tripType;
  final String priority;
  final int passengerCount;
  final String capacityClass;
  final DateTime departAt;
  final double? estimatedKm;
  final int? estimatedMinutes;
  final double? estimatedCost;
  final Person? requester;
  final FleetVehicle? vehicle;
  final FleetDriver? driver;
  final FleetTrip? trip;
  final List<FleetToll> tolls;
  final DateTime createdAt;
  final FleetMe me;
}
