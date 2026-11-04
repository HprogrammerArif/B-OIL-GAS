import 'package:flutter/foundation.dart';

@immutable
class PermittedZone {
  const PermittedZone({
    required this.zoneId,
    required this.name,
    required this.nameBn,
    required this.level,
    required this.escortRequired,
  });

  factory PermittedZone.fromJson(Map<String, Object?> j) => PermittedZone(
    zoneId: j['zoneId']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    level: j['level']! as String,
    escortRequired: j['escortRequired'] as bool? ?? false,
  );

  final String zoneId;
  final String name;
  final String nameBn;
  final String level; // green | yellow | red
  final bool escortRequired;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class PpeClearance {
  const PpeClearance({
    required this.hardHat,
    required this.safetyGoggles,
    required this.safetyShoes,
    required this.hiVisVest,
    required this.h2sBriefing,
  });

  factory PpeClearance.fromJson(Map<String, Object?> j) => PpeClearance(
    hardHat: j['hardHat'] as bool? ?? false,
    safetyGoggles: j['safetyGoggles'] as bool? ?? false,
    safetyShoes: j['safetyShoes'] as bool? ?? false,
    hiVisVest: j['hiVisVest'] as bool? ?? false,
    h2sBriefing: j['h2sBriefing'] as bool? ?? false,
  );

  final bool hardHat;
  final bool safetyGoggles;
  final bool safetyShoes;
  final bool hiVisVest;
  final bool h2sBriefing;

  bool get allCleared =>
      hardHat && safetyGoggles && safetyShoes && hiVisVest && h2sBriefing;
}

enum VisitorStatus {
  preRegistered,
  checkedIn,
  checkedOut,
  overdue,
  cancelled;

  static VisitorStatus parse(String wire) => switch (wire) {
    'PRE_REGISTERED' => preRegistered,
    'CHECKED_IN' => checkedIn,
    'CHECKED_OUT' => checkedOut,
    'OVERDUE' => overdue,
    'CANCELLED' => cancelled,
    _ => preRegistered,
  };
}

enum VisitorCategory {
  vip,
  govt,
  vendor,
  client,
  regular;

  static VisitorCategory parse(String wire) => switch (wire) {
    'VIP' => vip,
    'GOVT' => govt,
    'VENDOR' => vendor,
    'CLIENT' => client,
    _ => regular,
  };

  String get wire => name.toUpperCase();
}

@immutable
class Visitor {
  const Visitor({
    required this.id,
    required this.refNo,
    required this.status,
    required this.name,
    required this.organization,
    required this.designation,
    required this.category,
    required this.hostEmployeeId,
    required this.hostName,
    required this.hostDept,
    required this.siteId,
    required this.purpose,
    required this.expectedDate,
    required this.expectedTime,
    required this.permittedZones,
    required this.vipProtocol,
    required this.safetyBriefingCompleted,
    required this.ndaSigned,
    required this.ppeCleared,
    required this.createdAt,
    required this.updatedAt,
    required this.createdBy,
    this.checkInTime,
    this.checkOutTime,
    this.durationMinutes,
    this.vehiclePlate,
    this.phone,
    this.email,
    this.idProofType,
    this.idProofNumber,
    this.badgeNo,
  });

  factory Visitor.fromJson(Map<String, Object?> j) => Visitor(
    id: j['id']! as String,
    refNo: j['refNo']! as String,
    status: VisitorStatus.parse(j['status']! as String),
    name: j['name']! as String,
    organization: (j['organization'] as String?) ?? '',
    designation: (j['designation'] as String?) ?? '',
    category: VisitorCategory.parse(j['category']! as String),
    hostEmployeeId: j['hostEmployeeId']! as String,
    hostName: (j['hostName'] as String?) ?? '',
    hostDept: (j['hostDept'] as String?) ?? '',
    siteId: j['siteId']! as String,
    purpose: j['purpose']! as String,
    expectedDate: j['expectedDate']! as String,
    expectedTime: j['expectedTime']! as String,
    checkInTime: j['checkInTime'] != null
        ? DateTime.parse(j['checkInTime']! as String)
        : null,
    checkOutTime: j['checkOutTime'] != null
        ? DateTime.parse(j['checkOutTime']! as String)
        : null,
    durationMinutes: j['durationMinutes'] as int?,
    vehiclePlate: j['vehiclePlate'] as String?,
    phone: j['phone'] as String?,
    email: j['email'] as String?,
    idProofType: j['idProofType'] as String?,
    idProofNumber: j['idProofNumber'] as String?,
    badgeNo: j['badgeNo'] as String?,
    permittedZones: (j['permittedZones'] as List?)
            ?.map((e) => PermittedZone.fromJson(
                  Map<String, Object?>.from(e as Map),
                ))
            .toList() ??
        [],
    vipProtocol: j['vipProtocol'] as bool? ?? false,
    safetyBriefingCompleted: j['safetyBriefingCompleted'] as bool? ?? false,
    ndaSigned: j['ndaSigned'] as bool? ?? false,
    ppeCleared: PpeClearance.fromJson(
      j['ppeCleared'] is Map
          ? Map<String, Object?>.from(j['ppeCleared']! as Map)
          : {},
    ),
    createdAt: DateTime.parse(j['createdAt']! as String),
    updatedAt: DateTime.parse(j['updatedAt']! as String),
    createdBy: j['createdBy']! as String,
  );

  final String id;
  final String refNo;
  final VisitorStatus status;
  final String name;
  final String organization;
  final String designation;
  final VisitorCategory category;
  final String hostEmployeeId;
  final String hostName;
  final String hostDept;
  final String siteId;
  final String purpose;
  final String expectedDate;
  final String expectedTime;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final int? durationMinutes;
  final String? vehiclePlate;
  final String? phone;
  final String? email;
  final String? idProofType;
  final String? idProofNumber;
  final String? badgeNo;
  final List<PermittedZone> permittedZones;
  final bool vipProtocol;
  final bool safetyBriefingCompleted;
  final bool ndaSigned;
  final PpeClearance ppeCleared;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String createdBy;
}
