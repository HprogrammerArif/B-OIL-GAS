import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:flutter/foundation.dart';

@immutable
class VisitZone {
  const VisitZone({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.level,
    required this.escortRequired,
    this.siteId,
  });

  factory VisitZone.fromJson(Map<String, Object?> j) => VisitZone(
    id: (j['id'] ?? j['zoneId'])! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    level: j['level']! as String,
    escortRequired: j['escortRequired'] == true || j['level'] == 'RED',
    siteId: j['siteId'] as String?,
  );

  final String id;
  final String name;
  final String nameBn;
  final String level;
  final bool escortRequired;
  final String? siteId;

  String label({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class VisitGuest {
  const VisitGuest({
    required this.id,
    required this.fullName,
    this.organisation,
    this.phoneMasked,
    this.idProofType,
    this.idProofLast4,
  });

  factory VisitGuest.fromJson(Map<String, Object?> j) => VisitGuest(
    id: (j['id'] as String?) ?? '',
    fullName: j['fullName']! as String,
    organisation: j['organisation'] as String?,
    phoneMasked: j['phoneMasked'] as String?,
    idProofType: j['idProofType'] as String?,
    idProofLast4: j['idProofLast4'] as String?,
  );

  final String id;
  final String fullName;
  final String? organisation;
  final String? phoneMasked;
  final String? idProofType;
  final String? idProofLast4;
}

@immutable
class VisitFinding {
  const VisitFinding({
    required this.area,
    required this.finding,
    required this.status,
    required this.at,
    this.by,
  });

  factory VisitFinding.fromJson(Map<String, Object?> j) => VisitFinding(
    area: j['area']! as String,
    finding: j['finding']! as String,
    status: j['status']! as String,
    at: DateTime.parse(j['at']! as String),
    by: j['by'] == null
        ? null
        : Person.fromJson(Map<String, Object?>.from(j['by']! as Map)),
  );

  final String area;
  final String finding;
  final String status;
  final DateTime at;
  final Person? by;
}

@immutable
class VisitAccess {
  const VisitAccess({
    required this.isHost,
    required this.isEscort,
    required this.canApprove,
    required this.canDeny,
    required this.canCancel,
    required this.canCheckIn,
    required this.canCheckOut,
    required this.canPpe,
    required this.canExtend,
    required this.canClearWatchlist,
    required this.canFinding,
    required this.canEscort,
    required this.canMusterSafe,
    required this.photoRequired,
  });

  factory VisitAccess.fromJson(Map<String, Object?> j) {
    bool b(String k) => j[k] == true;
    return VisitAccess(
      isHost: b('isHost'),
      isEscort: b('isEscort'),
      canApprove: b('canApprove'),
      canDeny: b('canDeny'),
      canCancel: b('canCancel'),
      canCheckIn: b('canCheckIn'),
      canCheckOut: b('canCheckOut'),
      canPpe: b('canPpe'),
      canExtend: b('canExtend'),
      canClearWatchlist: b('canClearWatchlist'),
      canFinding: b('canFinding'),
      canEscort: b('canEscort'),
      canMusterSafe: b('canMusterSafe'),
      photoRequired: b('photoRequired'),
    );
  }

  final bool isHost;
  final bool isEscort;
  final bool canApprove;
  final bool canDeny;
  final bool canCancel;
  final bool canCheckIn;
  final bool canCheckOut;
  final bool canPpe;
  final bool canExtend;
  final bool canClearWatchlist;
  final bool canFinding;
  final bool canEscort;
  final bool canMusterSafe;
  final bool photoRequired;
}

@immutable
class Visit {
  const Visit({
    required this.id,
    required this.visitNo,
    required this.status,
    required this.category,
    required this.purpose,
    required this.expectedAt,
    required this.expectedEndAt,
    required this.guest,
    required this.host,
    required this.site,
    required this.zones,
    required this.ppeRequired,
    required this.ppeCleared,
    required this.escortRequired,
    required this.watchlistHit,
    required this.me,
    required this.createdAt,
    this.vipTier,
    this.escort,
    this.vehiclePlate,
    this.parkingSlot,
    this.badgeNo,
    this.checkedInAt,
    this.checkedOutAt,
    this.photoFileId,
    this.qrToken,
    this.findings = const [],
    this.notes,
    this.musterSafeAt,
    this.extensions = 0,
  });

  factory Visit.fromJson(Map<String, Object?> j) => Visit(
    id: j['id']! as String,
    visitNo: j['visitNo']! as String,
    status: j['status']! as String,
    category: j['category']! as String,
    vipTier: j['vipTier'] as String?,
    purpose: j['purpose']! as String,
    expectedAt: DateTime.parse(j['expectedAt']! as String),
    expectedEndAt: DateTime.parse(j['expectedEndAt']! as String),
    guest: VisitGuest.fromJson(Map<String, Object?>.from(j['visitor']! as Map)),
    host: Person.fromJson(Map<String, Object?>.from(j['host']! as Map)),
    escort: j['escort'] == null
        ? null
        : Person.fromJson(Map<String, Object?>.from(j['escort']! as Map)),
    site: SiteRef.fromJson(Map<String, Object?>.from(j['site']! as Map)),
    vehiclePlate: j['vehiclePlate'] as String?,
    parkingSlot: j['parkingSlot'] as String?,
    badgeNo: j['badgeNo'] as String?,
    checkedInAt: j['checkedInAt'] == null
        ? null
        : DateTime.parse(j['checkedInAt']! as String),
    checkedOutAt: j['checkedOutAt'] == null
        ? null
        : DateTime.parse(j['checkedOutAt']! as String),
    photoFileId: j['photoFileId'] as String?,
    qrToken: j['qrToken'] as String?,
    ppeRequired: j['ppeRequired'] == true,
    ppeCleared: j['ppeCleared'] == true,
    escortRequired: j['escortRequired'] == true,
    watchlistHit: j['watchlistHit'] == true,
    zones: [
      for (final z in (j['zones'] as List<Object?>? ?? const []))
        VisitZone.fromJson(Map<String, Object?>.from(z! as Map)),
    ],
    findings: [
      for (final f in (j['findings'] as List<Object?>? ?? const []))
        VisitFinding.fromJson(Map<String, Object?>.from(f! as Map)),
    ],
    notes: j['notes'] as String?,
    musterSafeAt: j['musterSafeAt'] == null
        ? null
        : DateTime.parse(j['musterSafeAt']! as String),
    extensions: (j['extensions'] as num?)?.toInt() ?? 0,
    createdAt: DateTime.parse(j['createdAt']! as String),
    me: VisitAccess.fromJson(Map<String, Object?>.from(j['me']! as Map)),
  );

  final String id;
  final String visitNo;
  final String status;
  final String category;
  final String? vipTier;
  final String purpose;
  final DateTime expectedAt;
  final DateTime expectedEndAt;
  final VisitGuest guest;
  final Person host;
  final Person? escort;
  final SiteRef site;
  final String? vehiclePlate;
  final String? parkingSlot;
  final String? badgeNo;
  final DateTime? checkedInAt;
  final DateTime? checkedOutAt;
  final String? photoFileId;
  final String? qrToken;
  final bool ppeRequired;
  final bool ppeCleared;
  final bool escortRequired;
  final bool watchlistHit;
  final List<VisitZone> zones;
  final List<VisitFinding> findings;
  final String? notes;
  final DateTime? musterSafeAt;
  final int extensions;
  final DateTime createdAt;
  final VisitAccess me;
}

@immutable
class VisitMuster {
  const VisitMuster({
    required this.active,
    required this.inside,
    required this.safe,
    required this.visits,
    this.startedAt,
  });

  factory VisitMuster.fromJson(Map<String, Object?> j) => VisitMuster(
    active: j['active'] == true,
    inside: (j['inside'] as num?)?.toInt() ?? 0,
    safe: (j['safe'] as num?)?.toInt() ?? 0,
    startedAt: j['startedAt'] == null
        ? null
        : DateTime.parse(j['startedAt']! as String),
    visits: [
      for (final e in (j['visits'] as List<Object?>? ?? const []))
        Map<String, Object?>.from(e! as Map),
    ],
  );

  final bool active;
  final int inside;
  final int safe;
  final DateTime? startedAt;
  final List<Map<String, Object?>> visits;
}
