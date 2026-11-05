import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

DateTime? _t(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

@immutable
class AssetMe {
  const AssetMe({
    required this.isCustodian,
    required this.canAck,
    required this.canAssign,
    required this.canRelease,
    required this.canFlag,
    required this.canCommission,
    required this.canTransfer,
    required this.canReceive,
    required this.canLoto,
    required this.canCertify,
    required this.canDecommission,
    required this.canChecklist,
    required this.canWriteOff,
    required this.canDispose,
  });

  factory AssetMe.fromJson(Map<String, Object?> j) => AssetMe(
    isCustodian: j['isCustodian'] == true,
    canAck: j['canAck'] == true,
    canAssign: j['canAssign'] == true,
    canRelease: j['canRelease'] == true,
    canFlag: j['canFlag'] == true,
    canCommission: j['canCommission'] == true,
    canTransfer: j['canTransfer'] == true,
    canReceive: j['canReceive'] == true,
    canLoto: j['canLoto'] == true,
    canCertify: j['canCertify'] == true,
    canDecommission: j['canDecommission'] == true,
    canChecklist: j['canChecklist'] == true,
    canWriteOff: j['canWriteOff'] == true,
    canDispose: j['canDispose'] == true,
  );

  final bool isCustodian;
  final bool canAck;
  final bool canAssign;
  final bool canRelease;
  final bool canFlag;
  final bool canCommission;
  final bool canTransfer;
  final bool canReceive;
  final bool canLoto;
  final bool canCertify;
  final bool canDecommission;
  final bool canChecklist;
  final bool canWriteOff;
  final bool canDispose;
}

@immutable
class AssetFinancials {
  const AssetFinancials({
    required this.gross,
    required this.nbv,
    required this.repairRatio,
    required this.remainingLifeYears,
    required this.isEolCandidate,
    required this.accumulatedDepreciation,
    required this.annualDepreciation,
  });

  factory AssetFinancials.fromJson(Map<String, Object?> j) => AssetFinancials(
    gross: (j['gross'] as num?)?.toDouble() ?? 0,
    nbv: (j['nbv'] as num?)?.toDouble() ?? 0,
    repairRatio: (j['repairRatio'] as num?)?.toDouble() ?? 0,
    remainingLifeYears: (j['remainingLifeYears'] as num?)?.toDouble() ?? 0,
    isEolCandidate: j['isEolCandidate'] == true,
    accumulatedDepreciation:
        (j['accumulatedDepreciation'] as num?)?.toDouble() ?? 0,
    annualDepreciation: (j['annualDepreciation'] as num?)?.toDouble() ?? 0,
  );

  final double gross;
  final double nbv;
  final double repairRatio;
  final double remainingLifeYears;
  final bool isEolCandidate;
  final double accumulatedDepreciation;
  final double annualDepreciation;
}

@immutable
class AssetCustody {
  const AssetCustody({
    required this.id,
    required this.acknowledged,
    required this.ackOverdue,
    this.holder,
  });

  factory AssetCustody.fromJson(Map<String, Object?> j) => AssetCustody(
    id: j['id']! as String,
    acknowledged: j['acknowledgedAt'] != null,
    ackOverdue: j['ackOverdue'] == true,
    holder: _person(j['holder']),
  );

  final String id;
  final bool acknowledged;
  final bool ackOverdue;
  final Person? holder;
}

@immutable
class AssetWorkOrder {
  const AssetWorkOrder({
    required this.id,
    required this.woNo,
    required this.type,
    required this.status,
    required this.title,
    required this.canStart,
    required this.canComplete,
    this.assignee,
  });

  factory AssetWorkOrder.fromJson(Map<String, Object?> j) {
    final me = j['me'] is Map ? _map(j['me']) : <String, Object?>{};
    return AssetWorkOrder(
      id: j['id']! as String,
      woNo: j['woNo'] as String? ?? '',
      type: j['type'] as String? ?? 'CM',
      status: j['status'] as String? ?? 'SCHEDULED',
      title: j['title'] as String? ?? '',
      canStart: me['canStart'] == true,
      canComplete: me['canComplete'] == true,
      assignee: _person(j['assignee']),
    );
  }

  final String id;
  final String woNo;
  final String type;
  final String status;
  final String title;
  final bool canStart;
  final bool canComplete;
  final Person? assignee;
}

@immutable
class AssetDisposal {
  const AssetDisposal({
    required this.reason,
    required this.technicalSurveySigned,
    required this.decontaminationCertified,
    required this.sparesHarvested,
    required this.financeVetted,
    required this.writeOffApproved,
    this.voucherNo,
  });

  factory AssetDisposal.fromJson(Map<String, Object?> j) => AssetDisposal(
    reason: j['reason'] as String? ?? '',
    technicalSurveySigned: j['technicalSurveySigned'] == true,
    decontaminationCertified: j['decontaminationCertified'] == true,
    sparesHarvested: j['sparesHarvested'] == true,
    financeVetted: j['financeVetted'] == true,
    writeOffApproved: j['writeOffApproved'] == true,
    voucherNo: j['voucherNo'] as String?,
  );

  final String reason;
  final bool technicalSurveySigned;
  final bool decontaminationCertified;
  final bool sparesHarvested;
  final bool financeVetted;
  final bool writeOffApproved;
  final String? voucherNo;

  bool get checklistDone =>
      technicalSurveySigned &&
      decontaminationCertified &&
      sparesHarvested &&
      financeVetted;
}

@immutable
class AssetCategory {
  const AssetCategory({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.assetClass,
  });

  factory AssetCategory.fromJson(Map<String, Object?> j) => AssetCategory(
    id: j['id']! as String,
    name: j['name'] as String? ?? '',
    nameBn: j['nameBn'] as String? ?? '',
    assetClass: j['assetClass'] as String? ?? '',
  );

  final String id;
  final String name;
  final String nameBn;
  final String assetClass;

  String display({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class Equipment {
  const Equipment({
    required this.id,
    required this.tag,
    required this.name,
    required this.nameBn,
    required this.stage,
    required this.assetClass,
    required this.criticality,
    required this.healthScore,
    required this.financials,
    required this.nextAction,
    required this.lotoActive,
    required this.calibrationExpired,
    required this.workOrders,
    required this.me,
    required this.createdAt,
    this.siteName,
    this.siteNameBn,
    this.location,
    this.category,
    this.custody,
    this.transferId,
    this.disposal,
    this.nextCalibrationAt,
    this.lotoPermitNo,
    this.depreciationMethod,
    this.usefulLifeYears,
    this.serialNo,
    this.oem,
  });

  factory Equipment.fromJson(Map<String, Object?> j) {
    final site = j['site'] is Map ? _map(j['site']) : null;
    final cat = j['category'] is Map ? _map(j['category']) : null;
    final tr = j['transfer'] is Map ? _map(j['transfer']) : null;
    return Equipment(
      id: j['id']! as String,
      tag: j['tag'] as String? ?? '',
      name: j['name'] as String? ?? '',
      nameBn: j['nameBn'] as String? ?? j['name'] as String? ?? '',
      stage: j['stage'] as String? ?? 'IN_STOCK',
      assetClass: j['assetClass'] as String? ?? '',
      criticality: j['criticality'] as String? ?? 'GENERAL_C',
      healthScore: (j['healthScore'] as num?)?.toInt() ?? 0,
      financials: AssetFinancials.fromJson(
        j['financials'] is Map ? _map(j['financials']) : {},
      ),
      nextAction: j['nextAction'] as String? ?? 'NONE',
      lotoActive: j['lotoActive'] == true,
      calibrationExpired: j['calibrationExpired'] == true,
      workOrders: [
        for (final e in (j['openWorkOrders'] as List? ?? const []))
          if (e is Map) AssetWorkOrder.fromJson(Map<String, Object?>.from(e)),
      ],
      me: AssetMe.fromJson(j['me'] is Map ? _map(j['me']) : {}),
      createdAt: _t(j['createdAt']) ?? DateTime.now().toUtc(),
      siteName: site?['name'] as String?,
      siteNameBn: site?['nameBn'] as String?,
      location: j['location'] as String?,
      category: cat == null ? null : AssetCategory.fromJson(cat),
      custody: j['currentCustody'] is Map
          ? AssetCustody.fromJson(_map(j['currentCustody']))
          : null,
      transferId: tr?['id'] as String?,
      disposal: j['disposal'] is Map
          ? AssetDisposal.fromJson(_map(j['disposal']))
          : null,
      nextCalibrationAt: _t(j['nextCalibrationAt']),
      lotoPermitNo: j['lotoPermitNo'] as String?,
      depreciationMethod: j['depreciationMethod'] as String?,
      usefulLifeYears: (j['usefulLifeYears'] as num?)?.toInt(),
      serialNo: j['serialNo'] as String?,
      oem: j['oem'] as String?,
    );
  }

  final String id;
  final String tag;
  final String name;
  final String nameBn;
  final String stage;
  final String assetClass;
  final String criticality;
  final int healthScore;
  final AssetFinancials financials;
  final String nextAction;
  final bool lotoActive;
  final bool calibrationExpired;
  final List<AssetWorkOrder> workOrders;
  final AssetMe me;
  final DateTime createdAt;
  final String? siteName;
  final String? siteNameBn;
  final String? location;
  final AssetCategory? category;
  final AssetCustody? custody;
  final String? transferId;
  final AssetDisposal? disposal;
  final DateTime? nextCalibrationAt;
  final String? lotoPermitNo;
  final String? depreciationMethod;
  final int? usefulLifeYears;
  final String? serialNo;
  final String? oem;

  String title({required bool bangla}) => bangla ? nameBn : name;

  String siteLabel({required bool bangla}) =>
      bangla ? (siteNameBn ?? siteName ?? '') : (siteName ?? '');
}
