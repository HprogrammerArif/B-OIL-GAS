import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

DateTime? _t(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

@immutable
class LicenceMe {
  const LicenceMe({
    required this.isOwner,
    required this.canRenew,
    required this.canChecklist,
    required this.canFund,
    required this.canAdvance,
    required this.canBack,
    required this.canLetter,
  });

  factory LicenceMe.fromJson(Map<String, Object?> j) => LicenceMe(
    isOwner: j['isOwner'] == true,
    canRenew: j['canRenew'] == true,
    canChecklist: j['canChecklist'] == true,
    canFund: j['canFund'] == true,
    canAdvance: j['canAdvance'] == true,
    canBack: j['canBack'] == true,
    canLetter: j['canLetter'] == true,
  );

  final bool isOwner;
  final bool canRenew;
  final bool canChecklist;
  final bool canFund;
  final bool canAdvance;
  final bool canBack;
  final bool canLetter;
}

@immutable
class LicenceCheckItem {
  const LicenceCheckItem({
    required this.id,
    required this.label,
    required this.labelBn,
    required this.status,
    this.note,
  });

  factory LicenceCheckItem.fromJson(Map<String, Object?> j) => LicenceCheckItem(
    id: j['id']! as String,
    label: j['label'] as String? ?? '',
    labelBn: j['labelBn'] as String? ?? '',
    status: j['status'] as String? ?? 'PENDING',
    note: j['note'] as String?,
  );

  final String id;
  final String label;
  final String labelBn;
  final String status;
  final String? note;

  String display({required bool bangla}) => bangla ? labelBn : label;
}

@immutable
class LicenceRenewal {
  const LicenceRenewal({
    required this.id,
    required this.cycleNo,
    required this.stage,
    required this.fundApproved,
    required this.feeAmount,
    required this.checklist,
    required this.readinessPct,
    this.inspectorName,
    this.auditFindings,
    this.certificateNo,
  });

  factory LicenceRenewal.fromJson(Map<String, Object?> j) => LicenceRenewal(
    id: j['id']! as String,
    cycleNo: (j['cycleNo'] as num?)?.toInt() ?? 1,
    stage: j['stage'] as String? ?? 'INTERNAL_REVIEW',
    fundApproved: j['fundApproved'] == true,
    feeAmount: (j['feeAmount'] as num?)?.toDouble() ?? 0,
    readinessPct: (j['readinessPct'] as num?)?.toDouble() ?? 0,
    inspectorName: j['inspectorName'] as String?,
    auditFindings: j['auditFindings'] as String?,
    certificateNo: j['certificateNo'] as String?,
    checklist: [
      for (final e in (j['checklist'] as List? ?? const []))
        if (e is Map) LicenceCheckItem.fromJson(Map<String, Object?>.from(e)),
    ],
  );

  final String id;
  final int cycleNo;
  final String stage;
  final bool fundApproved;
  final double feeAmount;
  final double readinessPct;
  final String? inspectorName;
  final String? auditFindings;
  final String? certificateNo;
  final List<LicenceCheckItem> checklist;
}

@immutable
class LicenceType {
  const LicenceType({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.bodyCode,
  });

  factory LicenceType.fromJson(Map<String, Object?> j) => LicenceType(
    id: j['id']! as String,
    name: j['name'] as String? ?? '',
    nameBn: j['nameBn'] as String? ?? '',
    bodyCode: j['bodyCode'] as String? ?? '',
  );

  final String id;
  final String name;
  final String nameBn;
  final String bodyCode;

  String display({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class Licence {
  const Licence({
    required this.id,
    required this.ref,
    required this.title,
    required this.titleBn,
    required this.licenceNo,
    required this.status,
    required this.bodyCode,
    required this.daysToExpiry,
    required this.urgency,
    required this.feeAmount,
    required this.me,
    required this.createdAt,
    this.siteName,
    this.siteNameBn,
    this.owner,
    this.expiresAt,
    this.typeName,
    this.typeNameBn,
    this.renewal,
    this.letterCount = 0,
  });

  factory Licence.fromJson(Map<String, Object?> j) {
    final site = j['site'] is Map ? _map(j['site']) : null;
    final typ = j['type'] is Map ? _map(j['type']) : null;
    final letters = j['letters'] as List? ?? const [];
    return Licence(
      id: j['id']! as String,
      ref: j['ref'] as String? ?? '',
      title: j['title'] as String? ?? '',
      titleBn: j['titleBn'] as String? ?? j['title'] as String? ?? '',
      licenceNo: j['licenceNo'] as String? ?? '',
      status: j['status'] as String? ?? 'ACTIVE',
      bodyCode: j['bodyCode'] as String? ?? '',
      daysToExpiry: (j['daysToExpiry'] as num?)?.toInt() ?? 0,
      urgency: j['urgency'] as String? ?? 'OK',
      feeAmount: (j['feeAmount'] as num?)?.toDouble() ?? 0,
      me: LicenceMe.fromJson(j['me'] is Map ? _map(j['me']) : {}),
      createdAt: _t(j['createdAt']) ?? DateTime.now().toUtc(),
      siteName: site?['name'] as String?,
      siteNameBn: site?['nameBn'] as String?,
      owner: _person(j['owner']),
      expiresAt: _t(j['expiresAt']),
      typeName: typ?['name'] as String?,
      typeNameBn: typ?['nameBn'] as String?,
      renewal: j['renewal'] is Map
          ? LicenceRenewal.fromJson(_map(j['renewal']))
          : null,
      letterCount: letters.length,
    );
  }

  final String id;
  final String ref;
  final String title;
  final String titleBn;
  final String licenceNo;
  final String status;
  final String bodyCode;
  final int daysToExpiry;
  final String urgency;
  final double feeAmount;
  final LicenceMe me;
  final DateTime createdAt;
  final String? siteName;
  final String? siteNameBn;
  final Person? owner;
  final DateTime? expiresAt;
  final String? typeName;
  final String? typeNameBn;
  final LicenceRenewal? renewal;
  final int letterCount;

  String heading({required bool bangla}) => bangla ? titleBn : title;

  String siteLabel({required bool bangla}) =>
      bangla ? (siteNameBn ?? siteName ?? '') : (siteName ?? '');
}
