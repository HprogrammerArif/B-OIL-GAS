import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

@immutable
class StaffMe {
  const StaffMe({
    required this.isSelf,
    required this.isHr,
    required this.canPatch,
    required this.canOffboard,
    required this.canFinalize,
    required this.canCancel,
    required this.canReclaim,
    required this.canReactivate,
    required this.canWaive,
    required this.clearableKeys,
    required this.nextEn,
    required this.nextBn,
  });

  factory StaffMe.fromJson(Map<String, Object?> j) => StaffMe(
    isSelf: j['isSelf'] == true,
    isHr: j['isHr'] == true,
    canPatch: j['canPatch'] == true,
    canOffboard: j['canOffboard'] == true,
    canFinalize: j['canFinalize'] == true,
    canCancel: j['canCancel'] == true,
    canReclaim: j['canReclaim'] == true,
    canReactivate: j['canReactivate'] == true,
    canWaive: j['canWaive'] == true,
    clearableKeys: [
      for (final e in j['clearableKeys'] as List? ?? const []) e! as String,
    ],
    nextEn: j['nextEn'] as String? ?? '',
    nextBn: j['nextBn'] as String? ?? '',
  );

  final bool isSelf;
  final bool isHr;
  final bool canPatch;
  final bool canOffboard;
  final bool canFinalize;
  final bool canCancel;
  final bool canReclaim;
  final bool canReactivate;
  final bool canWaive;
  final List<String> clearableKeys;
  final String nextEn;
  final String nextBn;

  String next({required bool bangla}) => bangla ? nextBn : nextEn;
}

@immutable
class ExitItem {
  const ExitItem({
    required this.key,
    required this.ownerRole,
    required this.label,
    required this.labelBn,
    required this.status,
    this.note,
    this.waiveReason,
    this.clearedByName,
  });

  factory ExitItem.fromJson(Map<String, Object?> j) => ExitItem(
    key: j['key']! as String,
    ownerRole: j['ownerRole'] as String? ?? '',
    label: j['label'] as String? ?? '',
    labelBn: j['labelBn'] as String? ?? '',
    status: j['status'] as String? ?? 'PENDING',
    note: j['note'] as String?,
    waiveReason: j['waiveReason'] as String?,
    clearedByName: j['clearedByName'] as String?,
  );

  final String key;
  final String ownerRole;
  final String label;
  final String labelBn;
  final String status;
  final String? note;
  final String? waiveReason;
  final String? clearedByName;

  String heading({required bool bangla}) => bangla ? labelBn : label;

  bool get pending => status == 'PENDING';
}

@immutable
class ExitFile {
  const ExitFile({
    required this.id,
    required this.status,
    required this.reason,
    required this.lastWorkingDay,
    required this.items,
    this.voucherNo,
    this.initiatedByName,
  });

  factory ExitFile.fromJson(Map<String, Object?> j) => ExitFile(
    id: j['id']! as String,
    status: j['status'] as String? ?? 'OPEN',
    reason: j['reason'] as String? ?? '',
    lastWorkingDay: j['lastWorkingDay'] as String? ?? '',
    voucherNo: j['voucherNo'] as String?,
    initiatedByName: j['initiatedByName'] as String?,
    items: [
      for (final e in j['items'] as List? ?? const [])
        if (e is Map) ExitItem.fromJson(Map<String, Object?>.from(e)),
    ],
  );

  final String id;
  final String status;
  final String reason;
  final String lastWorkingDay;
  final String? voucherNo;
  final String? initiatedByName;
  final List<ExitItem> items;

  int get pendingCount => items.where((i) => i.pending).length;
}

@immutable
class StaffAutoChecks {
  const StaffAutoChecks({
    required this.openAssets,
    required this.busSeat,
    required this.unsettledClaims,
    required this.openAdvances,
    required this.openTrips,
  });

  factory StaffAutoChecks.fromJson(Map<String, Object?> j) => StaffAutoChecks(
    openAssets: [
      for (final e in j['openAssets'] as List? ?? const []) e.toString(),
    ],
    busSeat: j['busSeat'] == true,
    unsettledClaims: (j['unsettledClaims'] as num?)?.toInt() ?? 0,
    openAdvances: (j['openAdvances'] as num?)?.toInt() ?? 0,
    openTrips: (j['openTrips'] as num?)?.toInt() ?? 0,
  );

  final List<String> openAssets;
  final bool busSeat;
  final int unsettledClaims;
  final int openAdvances;
  final int openTrips;
}

@immutable
class StaffMember {
  const StaffMember({
    required this.id,
    required this.empCode,
    required this.fullName,
    required this.fullNameBn,
    required this.status,
    required this.title,
    required this.titleBn,
    required this.dept,
    required this.deptBn,
    required this.site,
    required this.siteBn,
    required this.nextEn,
    required this.nextBn,
    this.phone,
    this.email,
    this.managerName,
    this.joinDate,
    this.gradeName,
    this.nationalId,
    this.emergencyContact,
    this.bloodGroup,
    this.reports = const [],
    this.me,
    this.exit,
    this.checks,
  });

  factory StaffMember.fromJson(Map<String, Object?> j) {
    final dsg = j['designation'] is Map ? _map(j['designation']) : null;
    final dept = j['department'] is Map ? _map(j['department']) : null;
    final site = j['site'] is Map ? _map(j['site']) : null;
    final mgr = j['lineManager'] is Map ? _map(j['lineManager']) : null;
    return StaffMember(
      id: j['id']! as String,
      empCode: j['empCode'] as String? ?? '',
      fullName: j['fullName'] as String? ?? '',
      fullNameBn: j['fullNameBn'] as String? ?? j['fullName'] as String? ?? '',
      status: j['status'] as String? ?? 'ACTIVE',
      title: dsg?['title'] as String? ?? '',
      titleBn: dsg?['titleBn'] as String? ?? '',
      dept: dept?['name'] as String? ?? '',
      deptBn: dept?['nameBn'] as String? ?? '',
      site: site?['name'] as String? ?? '',
      siteBn: site?['nameBn'] as String? ?? '',
      nextEn: j['nextEn'] as String? ?? '',
      nextBn: j['nextBn'] as String? ?? '',
      phone: j['phone'] as String?,
      email: j['email'] as String?,
      managerName: mgr?['fullName'] as String?,
      joinDate: j['joinDate'] as String?,
      gradeName: j['grade'] is Map ? _map(j['grade'])['name'] as String? : null,
      nationalId: j['nationalId'] as String?,
      emergencyContact: j['emergencyContact'] as String?,
      bloodGroup: j['bloodGroup'] as String?,
      reports: [
        for (final e in j['reports'] as List? ?? const [])
          if (e is Map) (e['fullName'] as String?) ?? '',
      ],
      me: j['me'] is Map ? StaffMe.fromJson(_map(j['me'])) : null,
      exit: j['exitClearance'] is Map
          ? ExitFile.fromJson(_map(j['exitClearance']))
          : null,
      checks: j['autoChecks'] is Map
          ? StaffAutoChecks.fromJson(_map(j['autoChecks']))
          : null,
    );
  }

  final String id;
  final String empCode;
  final String fullName;
  final String fullNameBn;
  final String status;
  final String title;
  final String titleBn;
  final String dept;
  final String deptBn;
  final String site;
  final String siteBn;
  final String nextEn;
  final String nextBn;
  final String? phone;
  final String? email;
  final String? managerName;
  final String? joinDate;
  final String? gradeName;
  final String? nationalId;
  final String? emergencyContact;
  final String? bloodGroup;
  final List<String> reports;
  final StaffMe? me;
  final ExitFile? exit;
  final StaffAutoChecks? checks;

  String heading({required bool bangla}) => bangla ? fullNameBn : fullName;

  String job({required bool bangla}) => bangla ? titleBn : title;

  String where({required bool bangla}) =>
      bangla ? '$deptBn · $siteBn' : '$dept · $site';

  String next({required bool bangla}) =>
      me?.next(bangla: bangla) ?? (bangla ? nextBn : nextEn);
}
