import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);
DateTime? _instant(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

enum ClaimType {
  tada('TADA'),
  conveyance('CONVEYANCE'),
  tourEvent('TOUR_EVENT');

  ClaimType(this.wire);

  final String wire;

  static ClaimType parse(String wire) =>
      values.firstWhere((t) => t.wire == wire, orElse: () => tada);
}

enum ClaimStatus {
  draft('DRAFT'),
  pendingManager('PENDING_MANAGER'),
  pendingFinance('PENDING_FINANCE'),
  approved('APPROVED'),
  settled('SETTLED'),
  returned('RETURNED'),
  rejected('REJECTED'),
  cancelled('CANCELLED');

  ClaimStatus(this.wire);

  final String wire;

  static ClaimStatus parse(String wire) =>
      values.firstWhere((s) => s.wire == wire, orElse: () => draft);

  bool get editable => this == draft || this == returned;
  bool get pending => this == pendingManager || this == pendingFinance;
}

enum AdvanceStatus {
  pendingManager('PENDING_MANAGER'),
  pendingFinance('PENDING_FINANCE'),
  approved('APPROVED'),
  disbursed('DISBURSED'),
  settled('SETTLED'),
  rejected('REJECTED'),
  cancelled('CANCELLED');

  AdvanceStatus(this.wire);

  final String wire;

  static AdvanceStatus parse(String wire) =>
      values.firstWhere((s) => s.wire == wire, orElse: () => pendingManager);
}

@immutable
class ClaimLine {
  const ClaimLine({
    required this.id,
    required this.category,
    required this.date,
    required this.description,
    required this.amount,
    required this.system,
    required this.isDeclaration,
    this.nights,
    this.distanceKm,
    this.fromPlace,
    this.toPlace,
    this.receiptFileId,
  });

  factory ClaimLine.fromJson(Map<String, Object?> j) => ClaimLine(
    id: j['id']! as String,
    category: j['category']! as String,
    date: j['date']! as String,
    description: (j['description'] as String?) ?? '',
    amount: (j['amount']! as num).toDouble(),
    system: j['system'] == true,
    isDeclaration: j['isDeclaration'] == true,
    nights: (j['nights'] as num?)?.toInt(),
    distanceKm: (j['distanceKm'] as num?)?.toDouble(),
    fromPlace: j['fromPlace'] as String?,
    toPlace: j['toPlace'] as String?,
    receiptFileId: j['receiptFileId'] as String?,
  );

  final String id;
  final String category;

  /// `YYYY-MM-DD`.
  final String date;
  final String description;
  final double amount;
  final bool system;
  final bool isDeclaration;
  final int? nights;
  final double? distanceKm;
  final String? fromPlace;
  final String? toPlace;
  final String? receiptFileId;

  Map<String, Object?> toJson() => {
    'id': id,
    'category': category,
    'date': date,
    'description': description,
    'amount': amount,
    'isDeclaration': isDeclaration,
    'nights': ?nights,
    'distanceKm': ?distanceKm,
    'fromPlace': ?fromPlace,
    'toPlace': ?toPlace,
    'receiptFileId': ?receiptFileId,
  };
}

@immutable
class ClaimFlag {
  const ClaimFlag({
    required this.code,
    required this.hard,
    this.lineId,
    this.amount,
  });

  factory ClaimFlag.fromJson(Map<String, Object?> j) => ClaimFlag(
    code: j['code']! as String,
    hard: j['severity'] == 'HARD',
    lineId: j['lineId'] as String?,
    amount: (j['amount'] as num?)?.toDouble(),
  );

  final String code;
  final bool hard;
  final String? lineId;
  final double? amount;
}

@immutable
class Advance {
  const Advance({
    required this.id,
    required this.advanceNo,
    required this.amount,
    required this.purpose,
    required this.tourStart,
    required this.tourEnd,
    required this.status,
    required this.createdAt,
    required this.employeeName,
    required this.employeeNameBn,
    this.claimId,
    this.disbursedAt,
    this.workflowInstanceId,
  });

  factory Advance.fromJson(Map<String, Object?> j) {
    final e = _map(j['employee']);
    return Advance(
      id: j['id']! as String,
      advanceNo: j['advanceNo']! as String,
      amount: (j['amount']! as num).toDouble(),
      purpose: j['purpose']! as String,
      tourStart: j['tourStart']! as String,
      tourEnd: j['tourEnd']! as String,
      status: AdvanceStatus.parse(j['status']! as String),
      createdAt: DateTime.parse(j['createdAt']! as String).toUtc(),
      employeeName: e['fullName']! as String,
      employeeNameBn: e['fullNameBn']! as String,
      claimId: j['claimId'] as String?,
      disbursedAt: _instant(j['disbursedAt']),
      workflowInstanceId: j['workflowInstanceId'] as String?,
    );
  }

  final String id;
  final String advanceNo;
  final double amount;
  final String purpose;
  final String tourStart;
  final String tourEnd;
  final AdvanceStatus status;
  final DateTime createdAt;
  final String employeeName;
  final String employeeNameBn;
  final String? claimId;
  final DateTime? disbursedAt;
  final String? workflowInstanceId;

  String displayEmployee({required bool bangla}) =>
      bangla ? employeeNameBn : employeeName;

  /// Disbursed and not yet linked to a claim.
  bool get open => status == AdvanceStatus.disbursed && claimId == null;
}

@immutable
class Claim {
  const Claim({
    required this.id,
    required this.claimNo,
    required this.type,
    required this.purpose,
    required this.status,
    required this.employeeId,
    required this.employeeName,
    required this.employeeNameBn,
    required this.totalAmount,
    required this.policyAmount,
    required this.hardFlags,
    required this.softFlags,
    required this.createdAt,
    this.periodStart,
    this.periodEnd,
    this.netSettlement,
    this.voucherNo,
    this.paidAt,
    this.destination,
    this.destinationName,
    this.travelMode,
    this.departAt,
    this.returnAt,
    this.lines = const [],
    this.flags = const [],
    this.advance,
    this.reviewComment,
    this.workflowInstanceId,
  });

  factory Claim.fromJson(Map<String, Object?> j) {
    final e = _map(j['employee']);
    return Claim(
      id: j['id']! as String,
      claimNo: j['claimNo']! as String,
      type: ClaimType.parse(j['type']! as String),
      purpose: (j['purpose'] as String?) ?? '',
      status: ClaimStatus.parse(j['status']! as String),
      employeeId: e['id']! as String,
      employeeName: e['fullName']! as String,
      employeeNameBn: e['fullNameBn']! as String,
      totalAmount: (j['totalAmount']! as num).toDouble(),
      policyAmount: (j['policyAmount']! as num).toDouble(),
      hardFlags: (j['hardFlags']! as num).toInt(),
      softFlags: (j['softFlags']! as num).toInt(),
      createdAt: DateTime.parse(j['createdAt']! as String).toUtc(),
      periodStart: j['periodStart'] as String?,
      periodEnd: j['periodEnd'] as String?,
      netSettlement: (j['netSettlement'] as num?)?.toDouble(),
      voucherNo: j['voucherNo'] as String?,
      paidAt: _instant(j['paidAt']),
      destination: j['destination'] as String?,
      destinationName: j['destinationName'] as String?,
      travelMode: j['travelMode'] as String?,
      departAt: _instant(j['departAt']),
      returnAt: _instant(j['returnAt']),
      lines: [
        for (final l in (j['lines'] as List?) ?? const [])
          ClaimLine.fromJson(_map(l)),
      ],
      flags: [
        for (final f in (j['flags'] as List?) ?? const [])
          ClaimFlag.fromJson(_map(f)),
      ],
      advance: j['advance'] == null
          ? null
          : Advance.fromJson(_map(j['advance'])),
      reviewComment: j['reviewComment'] as String?,
      workflowInstanceId: j['workflowInstanceId'] as String?,
    );
  }

  final String id;
  final String claimNo;
  final ClaimType type;
  final String purpose;
  final ClaimStatus status;
  final String employeeId;
  final String employeeName;
  final String employeeNameBn;
  final double totalAmount;
  final double policyAmount;
  final int hardFlags;
  final int softFlags;
  final DateTime createdAt;
  final String? periodStart;
  final String? periodEnd;
  final double? netSettlement;
  final String? voucherNo;
  final DateTime? paidAt;
  final String? destination;
  final String? destinationName;
  final String? travelMode;
  final DateTime? departAt;
  final DateTime? returnAt;
  final List<ClaimLine> lines;
  final List<ClaimFlag> flags;
  final Advance? advance;
  final String? reviewComment;
  final String? workflowInstanceId;

  String displayEmployee({required bool bangla}) =>
      bangla ? employeeNameBn : employeeName;
}

@immutable
class ClaimPolicyInfo {
  const ClaimPolicyInfo({
    required this.band,
    required this.daDhaka,
    required this.daDistrict,
    required this.hotelCapPerNight,
    required this.conveyanceMonthlyCap,
    required this.conveyanceUsedThisMonth,
    required this.mileageRatePerKm,
    required this.receiptRequiredAbove,
    required this.declarationMaxAmount,
    required this.declarationCategories,
    required this.allowedTravelModes,
    required this.categories,
  });

  factory ClaimPolicyInfo.fromJson(Map<String, Object?> j) => ClaimPolicyInfo(
    band: j['band']! as String,
    daDhaka: (j['daDhaka']! as num).toDouble(),
    daDistrict: (j['daDistrict']! as num).toDouble(),
    hotelCapPerNight: (j['hotelCapPerNight'] as num?)?.toDouble(),
    conveyanceMonthlyCap: (j['conveyanceMonthlyCap']! as num).toDouble(),
    conveyanceUsedThisMonth: (j['conveyanceUsedThisMonth']! as num).toDouble(),
    mileageRatePerKm: (j['mileageRatePerKm']! as num).toDouble(),
    receiptRequiredAbove: (j['receiptRequiredAbove']! as num).toDouble(),
    declarationMaxAmount: (j['declarationMaxAmount']! as num).toDouble(),
    declarationCategories: [
      for (final c in j['declarationCategories']! as List) c! as String,
    ],
    allowedTravelModes: [
      for (final c in j['allowedTravelModes']! as List) c! as String,
    ],
    categories: {
      for (final e in _map(j['categories']).entries)
        e.key: [for (final c in e.value! as List) c! as String],
    },
  );

  final String band;
  final double daDhaka;
  final double daDistrict;
  final double? hotelCapPerNight;
  final double conveyanceMonthlyCap;
  final double conveyanceUsedThisMonth;
  final double mileageRatePerKm;
  final double receiptRequiredAbove;
  final double declarationMaxAmount;
  final List<String> declarationCategories;
  final List<String> allowedTravelModes;
  final Map<String, List<String>> categories;
}
