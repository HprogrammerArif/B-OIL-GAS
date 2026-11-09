import 'package:flutter/foundation.dart';

enum DayStatus {
  present,
  late,
  earlyLeave,
  halfDay,
  absent,
  notIn,
  onLeave,
  holiday,
  weekend,
  fieldDuty;

  static DayStatus? parse(String? wire) => switch (wire) {
    'PRESENT' => present,
    'LATE' => late,
    'EARLY_LEAVE' => earlyLeave,
    'HALF_DAY' => halfDay,
    'ABSENT' => absent,
    'NOT_IN' => notIn,
    'ON_LEAVE' => onLeave,
    'HOLIDAY' => holiday,
    'WEEKEND' => weekend,
    'FIELD_DUTY' => fieldDuty,
    _ => null,
  };
}

enum PunchResult {
  accepted,
  pendingRegularisation,
  rejectedOutsideFence,
  rejectedAccuracy,
  rejectedMock;

  static PunchResult parse(String wire) => switch (wire) {
    'ACCEPTED' => accepted,
    'PENDING_REGULARISATION' => pendingRegularisation,
    'REJECTED_ACCURACY' => rejectedAccuracy,
    'REJECTED_MOCK' => rejectedMock,
    _ => rejectedOutsideFence,
  };

  bool get rejected =>
      this == rejectedOutsideFence ||
      this == rejectedAccuracy ||
      this == rejectedMock;
}

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);
Map<String, Object?>? _mapOrNull(Object? v) =>
    v == null ? null : Map<String, Object?>.from(v as Map);
DateTime? _instant(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

@immutable
class SiteInfo {
  const SiteInfo({required this.name, required this.nameBn});

  factory SiteInfo.fromJson(Map<String, Object?> j) =>
      SiteInfo(name: j['name']! as String, nameBn: j['nameBn']! as String);

  final String name;
  final String nameBn;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class Shift {
  const Shift({
    required this.name,
    required this.nameBn,
    required this.startTime,
    required this.endTime,
    required this.graceMinutes,
  });

  factory Shift.fromJson(Map<String, Object?> j) => Shift(
    name: j['name']! as String,
    nameBn: j['nameBn']! as String,
    startTime: j['startTime']! as String,
    endTime: j['endTime']! as String,
    graceMinutes: (j['graceMinutes']! as num).toInt(),
  );

  final String name;
  final String nameBn;

  /// `HH:mm`, Dhaka wall clock.
  final String startTime;
  final String endTime;
  final int graceMinutes;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class Punch {
  const Punch({
    required this.id,
    required this.type,
    required this.punchedAt,
    required this.result,
    this.site,
    this.distanceM,
    this.accuracyM,
  });

  factory Punch.fromJson(Map<String, Object?> j) => Punch(
    id: j['id']! as String,
    type: j['type']! as String,
    punchedAt: DateTime.parse(j['punchedAt']! as String).toUtc(),
    result: PunchResult.parse(j['result']! as String),
    site: _mapOrNull(j['site']) == null
        ? null
        : SiteInfo.fromJson(_map(j['site'])),
    distanceM: (j['distanceM'] as num?)?.toDouble(),
    accuracyM: (j['accuracyM'] as num?)?.toDouble(),
  );

  final String id;
  final String type;
  final DateTime punchedAt;
  final PunchResult result;
  final SiteInfo? site;
  final double? distanceM;
  final double? accuracyM;

  bool get isIn => type == 'IN';
}

@immutable
class AttendanceDay {
  const AttendanceDay({
    required this.date,
    required this.status,
    required this.lateMinutes,
    required this.workedMinutes,
    required this.overtimeMinutes,
    required this.missingOut,
    required this.pendingReview,
    required this.punches,
    this.firstInAt,
    this.lastOutAt,
    this.site,
    this.holidayName,
    this.holidayNameBn,
    this.leaveRefNo,
  });

  factory AttendanceDay.fromJson(Map<String, Object?> j) {
    final flags = _mapOrNull(j['flags']) ?? const <String, Object?>{};
    final holiday = _mapOrNull(j['holiday']);
    final leave = _mapOrNull(j['leave']);
    final site = _mapOrNull(j['site']);
    return AttendanceDay(
      date: j['date']! as String,
      status: DayStatus.parse(j['status'] as String?),
      firstInAt: _instant(j['firstInAt']),
      lastOutAt: _instant(j['lastOutAt']),
      lateMinutes: (j['lateMinutes']! as num).toInt(),
      workedMinutes: (j['workedMinutes']! as num).toInt(),
      overtimeMinutes: (j['overtimeMinutes']! as num).toInt(),
      missingOut: flags['missingOut'] == true,
      pendingReview: flags['pendingReview'] == true,
      site: site == null ? null : SiteInfo.fromJson(site),
      holidayName: holiday?['name'] as String?,
      holidayNameBn: holiday?['nameBn'] as String?,
      leaveRefNo: leave?['refNo'] as String?,
      punches: [for (final p in j['punches']! as List) Punch.fromJson(_map(p))],
    );
  }

  /// `YYYY-MM-DD` Dhaka date.
  final String date;
  final DayStatus? status;
  final DateTime? firstInAt;
  final DateTime? lastOutAt;
  final int lateMinutes;
  final int workedMinutes;
  final int overtimeMinutes;
  final bool missingOut;
  final bool pendingReview;
  final SiteInfo? site;
  final String? holidayName;
  final String? holidayNameBn;
  final String? leaveRefNo;
  final List<Punch> punches;
}

@immutable
class NearestGeofence {
  const NearestGeofence({
    required this.name,
    required this.nameBn,
    required this.distanceM,
    required this.inside,
  });

  factory NearestGeofence.fromJson(Map<String, Object?> j) => NearestGeofence(
    name: j['name']! as String,
    nameBn: j['nameBn']! as String,
    distanceM: (j['distanceM']! as num).toInt(),
    inside: j['inside'] == true,
  );

  final String name;
  final String nameBn;
  final int distanceM;
  final bool inside;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class TodayAttendance {
  const TodayAttendance({
    required this.shift,
    required this.day,
    required this.nextPunchType,
    required this.overtimeMinutesMtd,
    this.nearest,
  });

  factory TodayAttendance.fromJson(Map<String, Object?> j) => TodayAttendance(
    shift: Shift.fromJson(_map(j['shift'])),
    day: AttendanceDay.fromJson(_map(j['day'])),
    nextPunchType: j['nextPunchType']! as String,
    overtimeMinutesMtd: (j['overtimeMinutesMtd']! as num).toInt(),
    nearest: _mapOrNull(j['nearestGeofence']) == null
        ? null
        : NearestGeofence.fromJson(_map(j['nearestGeofence'])),
  );

  final Shift shift;
  final AttendanceDay day;
  final String nextPunchType;
  final int overtimeMinutesMtd;
  final NearestGeofence? nearest;

  bool get nextIsIn => nextPunchType == 'IN';
}

@immutable
class AttendanceSummary {
  const AttendanceSummary({
    required this.present,
    required this.late,
    required this.absent,
    required this.leave,
    required this.fieldDuty,
    required this.workedMinutes,
    required this.overtimeMinutes,
  });

  factory AttendanceSummary.fromJson(Map<String, Object?> j) =>
      AttendanceSummary(
        present: (j['present']! as num).toInt(),
        late: (j['late']! as num).toInt(),
        absent: (j['absent']! as num).toInt(),
        leave: (j['leave']! as num).toInt(),
        fieldDuty: (j['fieldDuty']! as num).toInt(),
        workedMinutes: (j['workedMinutes']! as num).toInt(),
        overtimeMinutes: (j['overtimeMinutes']! as num).toInt(),
      );

  final int present;
  final int late;
  final int absent;
  final int leave;
  final int fieldDuty;
  final int workedMinutes;
  final int overtimeMinutes;
}

@immutable
class AttendanceRange {
  const AttendanceRange({required this.days, required this.summary});

  factory AttendanceRange.fromJson(Map<String, Object?> j) => AttendanceRange(
    days: [for (final d in j['days']! as List) AttendanceDay.fromJson(_map(d))],
    summary: AttendanceSummary.fromJson(_map(j['summary'])),
  );

  /// Newest first.
  final List<AttendanceDay> days;
  final AttendanceSummary summary;
}

@immutable
class PunchOutcome {
  const PunchOutcome({
    required this.result,
    required this.duplicate,
    required this.canRegularise,
    this.geofenceName,
    this.geofenceNameBn,
    this.distanceM,
  });

  factory PunchOutcome.fromJson(Map<String, Object?> j) {
    final fence = _mapOrNull(j['geofence']);
    return PunchOutcome(
      result: PunchResult.parse(j['result']! as String),
      duplicate: j['duplicate'] == true,
      canRegularise: j['canRegularise'] == true,
      geofenceName: fence?['name'] as String?,
      geofenceNameBn: fence?['nameBn'] as String?,
      distanceM: (fence?['distanceM'] as num?)?.toDouble(),
    );
  }

  final PunchResult result;
  final bool duplicate;
  final bool canRegularise;
  final String? geofenceName;
  final String? geofenceNameBn;
  final double? distanceM;
}

enum RegularisationType {
  missedPunch('MISSED_PUNCH'),
  fieldDuty('FIELD_DUTY'),
  lateJustification('LATE_JUSTIFICATION'),
  remoteWork('REMOTE_WORK');

  RegularisationType(this.wire);

  final String wire;

  static RegularisationType parse(String wire) =>
      values.firstWhere((t) => t.wire == wire, orElse: () => missedPunch);
}

enum RegularisationStatus {
  pending,
  approved,
  rejected,
  cancelled;

  static RegularisationStatus parse(String wire) => switch (wire) {
    'APPROVED' => approved,
    'REJECTED' => rejected,
    'CANCELLED' => cancelled,
    _ => pending,
  };
}

@immutable
class Regularisation {
  const Regularisation({
    required this.id,
    required this.refNo,
    required this.date,
    required this.type,
    required this.reason,
    required this.status,
    required this.createdAt,
    this.requestedIn,
    this.requestedOut,
    this.workflowInstanceId,
  });

  factory Regularisation.fromJson(Map<String, Object?> j) => Regularisation(
    id: j['id']! as String,
    refNo: j['refNo']! as String,
    date: j['date']! as String,
    type: RegularisationType.parse(j['type']! as String),
    reason: j['reason']! as String,
    status: RegularisationStatus.parse(j['status']! as String),
    createdAt: DateTime.parse(j['createdAt']! as String).toUtc(),
    requestedIn: _instant(j['requestedIn']),
    requestedOut: _instant(j['requestedOut']),
    workflowInstanceId: j['workflowInstanceId'] as String?,
  );

  final String id;
  final String refNo;
  final String date;
  final RegularisationType type;
  final String reason;
  final RegularisationStatus status;
  final DateTime createdAt;
  final DateTime? requestedIn;
  final DateTime? requestedOut;
  final String? workflowInstanceId;
}

@immutable
class TeamRosterRow {
  const TeamRosterRow({
    required this.employeeId,
    required this.empCode,
    required this.name,
    required this.nameBn,
    required this.status,
    required this.needsReview,
    this.designation = '',
    this.designationBn = '',
    this.department = '',
    this.departmentBn = '',
    this.siteName = '',
    this.siteNameBn = '',
    this.firstInAt,
    this.lateMinutes = 0,
    this.distanceM,
    this.workflowInstanceId,
  });

  factory TeamRosterRow.fromJson(Map<String, Object?> j) => TeamRosterRow(
    employeeId: j['employeeId'] as String? ?? '',
    empCode: j['empCode'] as String? ?? '',
    name: j['name'] as String? ?? '',
    nameBn: j['nameBn'] as String? ?? '',
    status: j['status'] as String? ?? '',
    needsReview: j['needsReview'] == true,
    designation: j['designation'] as String? ?? '',
    designationBn: j['designationBn'] as String? ?? '',
    department: j['department'] as String? ?? '',
    departmentBn: j['departmentBn'] as String? ?? '',
    siteName: j['siteName'] as String? ?? '',
    siteNameBn: j['siteNameBn'] as String? ?? '',
    firstInAt: j['firstInAt'] as String?,
    lateMinutes: (j['lateMinutes'] as num?)?.toInt() ?? 0,
    distanceM: (j['distanceM'] as num?)?.toInt(),
    workflowInstanceId: j['workflowInstanceId'] as String?,
  );

  final String employeeId;
  final String empCode;
  final String name;
  final String nameBn;
  final String status;
  final bool needsReview;
  final String designation;
  final String designationBn;
  final String department;
  final String departmentBn;
  final String siteName;
  final String siteNameBn;
  final String? firstInAt;
  final int lateMinutes;
  final int? distanceM;
  final String? workflowInstanceId;

  DayStatus? get dayStatus => DayStatus.parse(status.isEmpty ? null : status);
}

@immutable
class TeamRoster {
  const TeamRoster({
    required this.date,
    required this.present,
    required this.late,
    required this.notIn,
    required this.onLeave,
    required this.absent,
    required this.toReview,
    required this.headcount,
    required this.roster,
  });

  factory TeamRoster.fromJson(Map<String, Object?> j) {
    final k = j['kpis'] is Map
        ? Map<String, Object?>.from(j['kpis']! as Map)
        : const <String, Object?>{};
    return TeamRoster(
      date: j['date'] as String? ?? '',
      present: (k['present'] as num?)?.toInt() ?? 0,
      late: (k['late'] as num?)?.toInt() ?? 0,
      notIn: (k['notIn'] as num?)?.toInt() ?? 0,
      onLeave: (k['onLeave'] as num?)?.toInt() ?? 0,
      absent: (k['absent'] as num?)?.toInt() ?? 0,
      toReview: (k['toReview'] as num?)?.toInt() ?? 0,
      headcount: (k['headcount'] as num?)?.toInt() ?? 0,
      roster: [
        for (final e in j['roster'] as List? ?? const [])
          if (e is Map) TeamRosterRow.fromJson(Map<String, Object?>.from(e)),
      ],
    );
  }

  final String date;
  final int present;
  final int late;
  final int notIn;
  final int onLeave;
  final int absent;
  final int toReview;
  final int headcount;
  final List<TeamRosterRow> roster;
}

/// A device position fix used for a punch.
@immutable
class LocationFix {
  const LocationFix({
    required this.lat,
    required this.lng,
    required this.accuracyM,
    required this.isMock,
  });

  final double lat;
  final double lng;
  final double accuracyM;
  final bool isMock;
}
