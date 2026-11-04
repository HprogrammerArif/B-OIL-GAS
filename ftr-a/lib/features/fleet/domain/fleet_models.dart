import 'package:flutter/foundation.dart';

enum VehicleStatus {
  available,
  inTransit,
  maintenance,
  decommissioned;

  static VehicleStatus parse(String wire) => switch (wire) {
    'in_transit' => inTransit,
    'maintenance' => maintenance,
    'decommissioned' => decommissioned,
    _ => available,
  };
}

enum DriverStatus {
  available,
  onTrip,
  sickLeave,
  onLeave,
  restRequired;

  static DriverStatus parse(String wire) => switch (wire) {
    'on_trip' => onTrip,
    'sick_leave' => sickLeave,
    'on_leave' => onLeave,
    'rest_required' => restRequired,
    _ => available,
  };
}

enum RequisitionStatus {
  pending,
  assigned,
  inTransit,
  completed,
  rejected,
  cancelled;

  static RequisitionStatus parse(String wire) => switch (wire) {
    'assigned' => assigned,
    'in_transit' => inTransit,
    'completed' => completed,
    'rejected' => rejected,
    'cancelled' => cancelled,
    _ => pending,
  };
}

@immutable
class FleetVehicle {
  const FleetVehicle({
    required this.id,
    required this.plate,
    required this.type,
    required this.make,
    required this.model,
    required this.year,
    required this.color,
    required this.status,
    required this.odometer,
    required this.siteId,
    this.lastFueled,
    this.isExecutive = false,
  });

  factory FleetVehicle.fromJson(Map<String, Object?> j) => FleetVehicle(
    id: j['id']! as String,
    plate: j['plate']! as String,
    type: j['type']! as String,
    make: (j['make'] as String?) ?? '',
    model: (j['model'] as String?) ?? '',
    year: (j['year'] as num?)?.toInt() ?? 2020,
    color: (j['color'] as String?) ?? '',
    status: VehicleStatus.parse(j['status']! as String),
    odometer: (j['odometer'] as num?)?.toInt() ?? 0,
    siteId: j['siteId']! as String,
    lastFueled: j['lastFueled'] != null
        ? DateTime.parse(j['lastFueled']! as String)
        : null,
    isExecutive: j['isExecutive'] as bool? ?? false,
  );

  final String id;
  final String plate;
  final String type;
  final String make;
  final String model;
  final int year;
  final String color;
  final VehicleStatus status;
  final int odometer;
  final String siteId;
  final DateTime? lastFueled;
  final bool isExecutive;

  String get displayName => '$make $model ($plate)';
}

@immutable
class FleetDriver {
  const FleetDriver({
    required this.id,
    required this.employeeId,
    required this.name,
    required this.licenseNo,
    required this.licenseExpiry,
    required this.status,
    required this.phone,
    required this.rating,
    required this.tripsCompleted,
    required this.siteId,
  });

  factory FleetDriver.fromJson(Map<String, Object?> j) => FleetDriver(
    id: j['id']! as String,
    employeeId: j['employeeId']! as String,
    name: j['name']! as String,
    licenseNo: (j['licenseNo'] as String?) ?? '',
    licenseExpiry: (j['licenseExpiry'] as String?) ?? '',
    status: DriverStatus.parse(j['status']! as String),
    phone: (j['phone'] as String?) ?? '',
    rating: (j['rating'] as num?)?.toDouble() ?? 0.0,
    tripsCompleted: (j['tripsCompleted'] as num?)?.toInt() ?? 0,
    siteId: j['siteId']! as String,
  );

  final String id;
  final String employeeId;
  final String name;
  final String licenseNo;
  final String licenseExpiry;
  final DriverStatus status;
  final String phone;
  final double rating;
  final int tripsCompleted;
  final String siteId;
}

@immutable
class FleetRequisition {
  const FleetRequisition({
    required this.id,
    required this.refNo,
    required this.status,
    required this.requesterEmployeeId,
    required this.requesterName,
    required this.dept,
    required this.from,
    required this.to,
    required this.tripType,
    required this.departureTime,
    required this.requiredCapacity,
    required this.passengersCount,
    required this.passengerNames,
    required this.purpose,
    required this.costCenter,
    required this.createdAt,
    required this.updatedAt,
    this.returnTime,
    this.assignedVehicleId,
    this.assignedVehiclePlate,
    this.assignedDriverId,
    this.assignedDriverName,
    this.assignedAt,
    this.tripStartedAt,
    this.tripCompletedAt,
    this.endOdometer,
    this.tripRating,
    this.tripFeedback,
    this.rejectReason,
    this.intermediateStops = const [],
  });

  factory FleetRequisition.fromJson(Map<String, Object?> j) =>
      FleetRequisition(
        id: j['id']! as String,
        refNo: j['refNo']! as String,
        status: RequisitionStatus.parse(j['status']! as String),
        requesterEmployeeId: j['requesterEmployeeId']! as String,
        requesterName: (j['requesterName'] as String?) ?? '',
        dept: (j['dept'] as String?) ?? '',
        from: j['from']! as String,
        to: j['to']! as String,
        tripType: (j['tripType'] as String?) ?? 'round_trip',
        departureTime: j['departureTime']! as String,
        returnTime: j['returnTime'] as String?,
        requiredCapacity: (j['requiredCapacity'] as String?) ?? 'sedan_4',
        passengersCount: (j['passengersCount'] as num?)?.toInt() ?? 1,
        passengerNames: (j['passengerNames'] as String?) ?? '',
        purpose: (j['purpose'] as String?) ?? '',
        costCenter: (j['costCenter'] as String?) ?? '',
        assignedVehicleId: j['assignedVehicleId'] as String?,
        assignedVehiclePlate: j['assignedVehiclePlate'] as String?,
        assignedDriverId: j['assignedDriverId'] as String?,
        assignedDriverName: j['assignedDriverName'] as String?,
        assignedAt: j['assignedAt'] != null
            ? DateTime.parse(j['assignedAt']! as String)
            : null,
        tripStartedAt: j['tripStartedAt'] != null
            ? DateTime.parse(j['tripStartedAt']! as String)
            : null,
        tripCompletedAt: j['tripCompletedAt'] != null
            ? DateTime.parse(j['tripCompletedAt']! as String)
            : null,
        endOdometer: (j['endOdometer'] as num?)?.toInt(),
        tripRating: (j['tripRating'] as num?)?.toInt(),
        tripFeedback: j['tripFeedback'] as String?,
        rejectReason: j['rejectReason'] as String?,
        intermediateStops:
            (j['intermediateStops'] as List?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        createdAt: DateTime.parse(j['createdAt']! as String),
        updatedAt: DateTime.parse(j['updatedAt']! as String),
      );

  final String id;
  final String refNo;
  final RequisitionStatus status;
  final String requesterEmployeeId;
  final String requesterName;
  final String dept;
  final String from;
  final String to;
  final String tripType;
  final String departureTime;
  final String? returnTime;
  final String requiredCapacity;
  final int passengersCount;
  final String passengerNames;
  final String purpose;
  final String costCenter;
  final String? assignedVehicleId;
  final String? assignedVehiclePlate;
  final String? assignedDriverId;
  final String? assignedDriverName;
  final DateTime? assignedAt;
  final DateTime? tripStartedAt;
  final DateTime? tripCompletedAt;
  final int? endOdometer;
  final int? tripRating;
  final String? tripFeedback;
  final String? rejectReason;
  final List<String> intermediateStops;
  final DateTime createdAt;
  final DateTime updatedAt;
}
