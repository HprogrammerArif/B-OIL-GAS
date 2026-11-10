import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

@immutable
class IncidentMe {
  const IncidentMe({
    required this.isReporter,
    required this.isInvestigator,
    required this.canTriage,
    required this.canInvestigate,
    required this.canRca,
    required this.canAddCapa,
    required this.canReview,
    required this.canCloseSafety,
    required this.canCloseManager,
    required this.canStatutory,
  });

  factory IncidentMe.fromJson(Map<String, Object?> j) => IncidentMe(
    isReporter: j['isReporter'] == true,
    isInvestigator: j['isInvestigator'] == true,
    canTriage: j['canTriage'] == true,
    canInvestigate: j['canInvestigate'] == true,
    canRca: j['canRca'] == true,
    canAddCapa: j['canAddCapa'] == true,
    canReview: j['canReview'] == true,
    canCloseSafety: j['canCloseSafety'] == true,
    canCloseManager: j['canCloseManager'] == true,
    canStatutory: j['canStatutory'] == true,
  );

  final bool isReporter;
  final bool isInvestigator;
  final bool canTriage;
  final bool canInvestigate;
  final bool canRca;
  final bool canAddCapa;
  final bool canReview;
  final bool canCloseSafety;
  final bool canCloseManager;
  final bool canStatutory;
}

@immutable
class CapaMe {
  const CapaMe({
    required this.canStart,
    required this.canComplete,
    required this.canVerify,
  });

  factory CapaMe.fromJson(Map<String, Object?> j) => CapaMe(
    canStart: j['canStart'] == true,
    canComplete: j['canComplete'] == true,
    canVerify: j['canVerify'] == true,
  );

  final bool canStart;
  final bool canComplete;
  final bool canVerify;
}

@immutable
class IncidentCapa {
  const IncidentCapa({
    required this.id,
    required this.capaNo,
    required this.type,
    required this.description,
    required this.status,
    required this.dueAt,
    required this.me,
    this.owner,
    this.evidence,
  });

  factory IncidentCapa.fromJson(Map<String, Object?> j) => IncidentCapa(
    id: j['id']! as String,
    capaNo: (j['capaNo'] as String?) ?? '',
    type: (j['type'] as String?) ?? 'CORRECTIVE',
    description: (j['description'] as String?) ?? '',
    status: (j['status'] as String?) ?? 'PENDING',
    dueAt: DateTime.parse(j['dueAt']! as String),
    owner: _person(j['owner']),
    evidence: j['evidence'] as String?,
    me: CapaMe.fromJson(_map(j['me'] ?? const <String, Object?>{})),
  );

  final String id;
  final String capaNo;
  final String type;
  final String description;
  final String status;
  final DateTime dueAt;
  final Person? owner;
  final String? evidence;
  final CapaMe me;
}

@immutable
class IncidentRca {
  const IncidentRca({
    required this.why1,
    required this.why2,
    required this.why3,
    required this.rootCause,
    this.why4,
    this.why5,
  });

  factory IncidentRca.fromJson(Map<String, Object?> j) => IncidentRca(
    why1: (j['why1'] as String?) ?? '',
    why2: (j['why2'] as String?) ?? '',
    why3: (j['why3'] as String?) ?? '',
    why4: j['why4'] as String?,
    why5: j['why5'] as String?,
    rootCause: (j['rootCause'] as String?) ?? '',
  );

  final String why1;
  final String why2;
  final String why3;
  final String? why4;
  final String? why5;
  final String rootCause;
}

@immutable
class IncidentZone {
  const IncidentZone({
    required this.id,
    required this.siteId,
    required this.name,
    required this.nameBn,
  });

  factory IncidentZone.fromJson(Map<String, Object?> j) => IncidentZone(
    id: j['id']! as String,
    siteId: (j['siteId'] as String?) ?? '',
    name: (j['name'] as String?) ?? '',
    nameBn: (j['nameBn'] as String?) ?? j['name'] as String? ?? '',
  );

  final String id;
  final String siteId;
  final String name;
  final String nameBn;

  String label({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class SafetyIncident {
  const SafetyIncident({
    required this.id,
    required this.incidentNo,
    required this.stage,
    required this.type,
    required this.title,
    required this.description,
    required this.siteId,
    required this.occurredAt,
    required this.severity,
    required this.likelihood,
    required this.riskScore,
    required this.riskCategory,
    required this.statutoryReportable,
    required this.capas,
    required this.createdAt,
    required this.me,
    this.photoFileIds = const [],
    this.zone,
    this.siteName,
    this.siteNameBn,
    this.reporter,
    this.investigator,
    this.rca,
    this.statutoryBodyCode,
    this.statutoryDueAt,
    this.statutoryReceiptNo,
    this.isAnonymous = false,
  });

  factory SafetyIncident.fromJson(Map<String, Object?> j) {
    final site = j['site'] is Map ? _map(j['site']) : null;
    return SafetyIncident(
      id: j['id']! as String,
      incidentNo: (j['incidentNo'] as String?) ?? '',
      stage: j['stage']! as String,
      type: (j['type'] as String?) ?? '',
      title: (j['title'] as String?) ?? '',
      description: (j['description'] as String?) ?? '',
      siteId: (j['siteId'] as String?) ?? '',
      siteName: site?['name'] as String?,
      siteNameBn: site?['nameBn'] as String?,
      zone: j['zone'] as String?,
      occurredAt: DateTime.parse(j['occurredAt']! as String),
      severity: (j['severity'] as num?)?.toInt() ?? 1,
      likelihood: (j['likelihood'] as num?)?.toInt() ?? 1,
      riskScore: (j['riskScore'] as num?)?.toInt() ?? 0,
      riskCategory: (j['riskCategory'] as String?) ?? 'LOW',
      isAnonymous: j['isAnonymous'] == true,
      reporter: _person(j['reporter']),
      investigator: _person(j['investigator']),
      rca: j['rca'] == null ? null : IncidentRca.fromJson(_map(j['rca'])),
      statutoryReportable: j['statutoryReportable'] == true,
      statutoryBodyCode: j['statutoryBodyCode'] as String?,
      statutoryDueAt: j['statutoryDueAt'] == null
          ? null
          : DateTime.parse(j['statutoryDueAt']! as String),
      statutoryReceiptNo: j['statutoryReceiptNo'] as String?,
      capas: [
        for (final e in (j['capas'] as List?) ?? const [])
          IncidentCapa.fromJson(_map(e)),
      ],
      createdAt: DateTime.parse(j['createdAt']! as String),
      me: IncidentMe.fromJson(_map(j['me'] ?? const <String, Object?>{})),
      photoFileIds: [
        for (final e in (j['photoFileIds'] as List?) ?? const [])
          if (e is String) e,
      ],
    );
  }

  final String id;
  final String incidentNo;
  final String stage;
  final String type;
  final String title;
  final String description;
  final String siteId;
  final String? siteName;
  final String? siteNameBn;
  final String? zone;
  final DateTime occurredAt;
  final int severity;
  final int likelihood;
  final int riskScore;
  final String riskCategory;
  final bool isAnonymous;
  final Person? reporter;
  final Person? investigator;
  final IncidentRca? rca;
  final bool statutoryReportable;
  final String? statutoryBodyCode;
  final DateTime? statutoryDueAt;
  final String? statutoryReceiptNo;
  final List<IncidentCapa> capas;
  final DateTime createdAt;
  final IncidentMe me;
  final List<String> photoFileIds;

  String siteLabel({required bool bangla}) =>
      bangla ? (siteNameBn ?? siteName ?? '') : (siteName ?? '');
}
