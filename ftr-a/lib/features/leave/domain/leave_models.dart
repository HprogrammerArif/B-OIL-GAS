import 'package:flutter/foundation.dart';

enum LeaveStatus {
  pending('PENDING'),
  returned('RETURNED'),
  approved('APPROVED'),
  rejected('REJECTED'),
  cancelled('CANCELLED');

  LeaveStatus(this.wire);

  final String wire;

  static LeaveStatus parse(String wire) =>
      values.firstWhere((s) => s.wire == wire, orElse: () => pending);
}

enum HalfDay {
  first('FIRST'),
  second('SECOND');

  HalfDay(this.wire);

  final String wire;

  static HalfDay? parse(String? wire) {
    for (final h in values) {
      if (h.wire == wire) return h;
    }
    return null;
  }
}

@immutable
class LeaveType {
  const LeaveType({
    required this.id,
    required this.code,
    required this.name,
    required this.nameBn,
    required this.requiresDoc,
    required this.halfDayAllowed,
    required this.checksBalance,
  });

  factory LeaveType.fromJson(Map<String, Object?> json) => LeaveType(
    id: json['id']! as String,
    code: json['code']! as String,
    name: json['name']! as String,
    nameBn: json['nameBn']! as String,
    requiresDoc: json['requiresDoc'] == true,
    halfDayAllowed: json['halfDayAllowed'] == true,
    checksBalance: json['checksBalance'] != false,
  );

  final String id;
  final String code;
  final String name;
  final String nameBn;
  final bool requiresDoc;
  final bool halfDayAllowed;
  final bool checksBalance;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class LeaveBalance {
  const LeaveBalance({
    required this.type,
    required this.entitled,
    required this.used,
    required this.pending,
    required this.available,
  });

  factory LeaveBalance.fromJson(Map<String, Object?> json) => LeaveBalance(
    type: LeaveType.fromJson(
      Map<String, Object?>.from(json['leaveType']! as Map),
    ),
    entitled: (json['entitled']! as num).toDouble(),
    used: (json['used']! as num).toDouble(),
    pending: (json['pending']! as num).toDouble(),
    available: (json['available']! as num).toDouble(),
  );

  final LeaveType type;
  final double entitled;
  final double used;
  final double pending;
  final double available;
}

@immutable
class PersonRef {
  const PersonRef({required this.id, required this.name, required this.nameBn});

  factory PersonRef.fromJson(Map<String, Object?> json) => PersonRef(
    id: json['id']! as String,
    name: json['fullName']! as String,
    nameBn: json['fullNameBn']! as String,
  );

  final String id;
  final String name;
  final String nameBn;

  String displayName({required bool bangla}) =>
      bangla && nameBn.isNotEmpty ? nameBn : name;
}

@immutable
class LeaveRequestItem {
  const LeaveRequestItem({
    required this.id,
    required this.refNo,
    required this.employee,
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.halfDay,
    required this.days,
    required this.reason,
    required this.status,
    required this.isInformed,
    required this.createdAt,
    this.reviewedBy,
    this.reviewedAt,
    this.reviewComment,
    this.workflowInstanceId,
    this.cancelReason,
    this.attachmentFileId,
    this.isOwner = true,
    this.canCancel = false,
    this.awaitingYou = false,
    this.waitingFor,
    this.waitingForBn,
  });

  factory LeaveRequestItem.fromJson(Map<String, Object?> json) {
    Map<String, Object?>? obj(String key) =>
        json[key] is Map ? Map<String, Object?>.from(json[key]! as Map) : null;
    final type = obj('leaveType')!;
    final viewer = obj('viewer');
    final reviewer = obj('reviewedBy');
    final reviewedAt = json['reviewedAt'] as String?;
    return LeaveRequestItem(
      id: json['id']! as String,
      refNo: json['refNo']! as String,
      employee: PersonRef.fromJson(obj('employee')!),
      type: LeaveType.fromJson({
        ...type,
        'requiresDoc': false,
        'halfDayAllowed': false,
      }),
      startDate: json['startDate']! as String,
      endDate: json['endDate']! as String,
      halfDay: HalfDay.parse(json['halfDay'] as String?),
      days: (json['days']! as num).toDouble(),
      reason: json['reason']! as String,
      status: LeaveStatus.parse(json['status']! as String),
      isInformed: json['isInformed'] == true,
      createdAt: DateTime.parse(json['createdAt']! as String).toUtc(),
      reviewedBy: reviewer == null ? null : PersonRef.fromJson(reviewer),
      reviewedAt: reviewedAt == null
          ? null
          : DateTime.parse(reviewedAt).toUtc(),
      reviewComment: json['reviewComment'] as String?,
      workflowInstanceId: json['workflowInstanceId'] as String?,
      cancelReason: json['cancelReason'] as String?,
      attachmentFileId: json['attachmentFileId'] as String?,
      isOwner: viewer?['isOwner'] != false,
      canCancel: viewer?['canCancel'] == true,
      awaitingYou: json['awaitingYou'] == true,
      waitingFor: json['waitingFor'] as String?,
      waitingForBn: json['waitingForBn'] as String?,
    );
  }

  final String id;
  final String refNo;
  final PersonRef employee;
  final LeaveType type;
  final String startDate;
  final String endDate;
  final HalfDay? halfDay;
  final double days;
  final String reason;
  final LeaveStatus status;
  final bool isInformed;
  final DateTime createdAt;
  final PersonRef? reviewedBy;
  final DateTime? reviewedAt;
  final String? reviewComment;
  final String? workflowInstanceId;
  final String? cancelReason;
  final String? attachmentFileId;
  final bool isOwner;
  final bool canCancel;
  final bool awaitingYou;
  final String? waitingFor;
  final String? waitingForBn;

  bool get singleDay => startDate == endDate;

  String? waitingForName({required bool bangla}) =>
      bangla ? (waitingForBn ?? waitingFor) : waitingFor;
}

@immutable
class Holiday {
  const Holiday({required this.date, required this.name, required this.nameBn});

  final String date;
  final String name;
  final String nameBn;
}

/// Server-owned leave rules the form needs for instant feedback.
@immutable
class LeavePolicyInfo {
  const LeavePolicyInfo({
    required this.weekendDays,
    required this.holidays,
    required this.maxConsecutiveCl,
    required this.hrReviewAboveDays,
    required this.backdateDays,
    required this.backdateTypes,
    required this.docRequiredAboveDays,
    required this.reasonMin,
    required this.reasonMax,
  });

  factory LeavePolicyInfo.fromJson(Map<String, Object?> json) =>
      LeavePolicyInfo(
        weekendDays: {
          for (final d in json['weekendDays']! as List) (d! as num).toInt(),
        },
        holidays: [
          for (final h in json['holidays']! as List)
            _holiday(Map<String, Object?>.from(h! as Map)),
        ],
        maxConsecutiveCl: (json['maxConsecutiveCl']! as num).toInt(),
        hrReviewAboveDays: (json['hrReviewAboveDays']! as num).toInt(),
        backdateDays: (json['backdateDays']! as num).toInt(),
        backdateTypes: {
          for (final c in json['backdateTypes']! as List) c! as String,
        },
        docRequiredAboveDays: (json['docRequiredAboveDays']! as num).toInt(),
        reasonMin: (json['reasonMin']! as num).toInt(),
        reasonMax: (json['reasonMax']! as num).toInt(),
      );

  static Holiday _holiday(Map<String, Object?> h) => Holiday(
    date: h['date']! as String,
    name: h['name']! as String,
    nameBn: h['nameBn']! as String,
  );

  /// `DateTime.weekday` values that are weekends (Friday 5, Saturday 6).
  final Set<int> weekendDays;
  final List<Holiday> holidays;
  final int maxConsecutiveCl;
  final int hrReviewAboveDays;
  final int backdateDays;
  final Set<String> backdateTypes;
  final int docRequiredAboveDays;
  final int reasonMin;
  final int reasonMax;

  Holiday? holidayOn(DateTime day) {
    final key = dateKey(day);
    for (final h in holidays) {
      if (h.date == key) return h;
    }
    return null;
  }

  bool isBusinessDay(DateTime day) =>
      !weekendDays.contains(day.weekday) && holidayOn(day) == null;

  /// Working days in the inclusive range (weekends and holidays excluded).
  int businessDays(DateTime start, DateTime end) {
    var n = 0;
    for (
      var d = DateTime.utc(start.year, start.month, start.day);
      !d.isAfter(DateTime.utc(end.year, end.month, end.day));
      d = d.add(const Duration(days: 1))
    ) {
      if (isBusinessDay(d)) n++;
    }
    return n;
  }
}

String dateKey(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';
