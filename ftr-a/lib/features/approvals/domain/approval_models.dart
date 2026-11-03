import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);
DateTime? _instant(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

/// How close a step is to its deadline.
enum SlaState { ok, warn, danger, overdue }

SlaState _sla(Object? v) {
  final state = v is Map ? v['state'] : null;
  return switch (state) {
    'warn' => SlaState.warn,
    'danger' => SlaState.danger,
    'overdue' => SlaState.overdue,
    _ => SlaState.ok,
  };
}

/// What kind of request this is (inbox filter chips).
enum ApprovalCategory {
  leave('LEAVE'),
  claims('CLAIMS'),
  procurement('PROCUREMENT'),
  fleet('FLEET'),
  other('OTHER');

  ApprovalCategory(this.wire);

  final String wire;

  static ApprovalCategory parse(String? wire) =>
      values.firstWhere((c) => c.wire == wire, orElse: () => other);
}

@immutable
class Person {
  const Person({
    required this.userId,
    required this.name,
    required this.nameBn,
    this.title,
  });

  factory Person.fromJson(Map<String, Object?> j) => Person(
    userId: j['userId']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
    title: j['title'] as String?,
  );

  final String userId;
  final String name;
  final String nameBn;
  final String? title;

  String display({required bool bangla}) => bangla ? nameBn : name;
}

/// What the requester wrote, in both languages.
@immutable
class RequestSummary {
  const RequestSummary({
    required this.refNo,
    required this.title,
    required this.titleBn,
    this.details,
    this.detailsBn,
    this.amount,
    this.urgency = 'NORMAL',
  });

  factory RequestSummary.fromJson(Map<String, Object?> j) => RequestSummary(
    refNo: (j['refNo'] as String?) ?? '',
    title: (j['title'] as String?) ?? '',
    titleBn: (j['titleBn'] as String?) ?? (j['title'] as String?) ?? '',
    details: j['details'] as String?,
    detailsBn: j['detailsBn'] as String?,
    amount: (j['amount'] as num?)?.toDouble(),
    urgency: (j['urgency'] as String?) ?? 'NORMAL',
  );

  final String refNo;
  final String title;
  final String titleBn;
  final String? details;
  final String? detailsBn;
  final double? amount;
  final String urgency;

  bool get urgent => urgency == 'HIGH' || urgency == 'CRITICAL';

  String displayTitle({required bool bangla}) => bangla ? titleBn : title;

  String? displayDetails({required bool bangla}) =>
      bangla ? (detailsBn ?? details) : details;
}

/// One request waiting for my decision.
@immutable
class InboxItem {
  const InboxItem({
    required this.instanceId,
    required this.objectType,
    required this.objectId,
    required this.category,
    required this.summary,
    required this.stepName,
    required this.requiresSignature,
    required this.submittedAt,
    required this.sla,
    required this.initiator,
    required this.viaDelegation,
    this.dueAt,
  });

  factory InboxItem.fromJson(Map<String, Object?> j) => InboxItem(
    instanceId: j['instanceId']! as String,
    objectType: j['objectType']! as String,
    objectId: j['objectId']! as String,
    category: ApprovalCategory.parse(j['category'] as String?),
    summary: RequestSummary.fromJson(_map(j['summary'])),
    stepName: j['stepName']! as String,
    requiresSignature: j['requiresSignature'] == true,
    submittedAt: DateTime.parse(j['submittedAt']! as String).toUtc(),
    sla: _sla(j['sla']),
    initiator: Person.fromJson(_map(j['initiator'])),
    viaDelegation: j['viaDelegation'] == true,
    dueAt: _instant(j['dueAt']),
  );

  final String instanceId;
  final String objectType;
  final String objectId;
  final ApprovalCategory category;
  final RequestSummary summary;
  final String stepName;
  final bool requiresSignature;
  final DateTime submittedAt;
  final DateTime? dueAt;
  final SlaState sla;
  final Person initiator;
  final bool viaDelegation;

  /// Safe for one-tap approval from the list.
  bool get batchable => !requiresSignature && (summary.amount ?? 0) <= 500000;
}

@immutable
class InboxSummary {
  const InboxSummary({
    required this.pending,
    required this.breached,
    required this.breachingSoon,
  });

  factory InboxSummary.fromJson(Map<String, Object?> j) => InboxSummary(
    pending: (j['pending']! as num).toInt(),
    breached: (j['breached']! as num).toInt(),
    breachingSoon: (j['breachingIn12h']! as num).toInt(),
  );

  final int pending;
  final int breached;
  final int breachingSoon;
}

/// A decision I made, or a request I started.
@immutable
class HistoryItem {
  const HistoryItem({
    required this.instanceId,
    required this.objectType,
    required this.summary,
    required this.instanceStatus,
    required this.at,
    this.decision,
    this.comment,
  });

  factory HistoryItem.fromJson(Map<String, Object?> j) => HistoryItem(
    instanceId: j['instanceId']! as String,
    objectType: j['objectType']! as String,
    summary: RequestSummary.fromJson(_map(j['summary'])),
    instanceStatus: j['instanceStatus']! as String,
    at: DateTime.parse(j['at']! as String).toUtc(),
    decision: j['decision'] as String?,
    comment: j['comment'] as String?,
  );

  final String instanceId;
  final String objectType;
  final RequestSummary summary;
  final String instanceStatus;
  final DateTime at;

  /// `APPROVED`, `REJECTED`, `RETURNED`, or null for a request I started.
  final String? decision;
  final String? comment;
}

@immutable
class ActionEntry {
  const ActionEntry({
    required this.type,
    required this.actor,
    required this.createdAt,
    this.comment,
  });

  factory ActionEntry.fromJson(Map<String, Object?> j) => ActionEntry(
    type: j['type']! as String,
    actor: Person.fromJson(_map(j['actor'])),
    createdAt: DateTime.parse(j['createdAt']! as String).toUtc(),
    comment: j['comment'] as String?,
  );

  final String type;
  final Person actor;
  final DateTime createdAt;
  final String? comment;
}

/// One workflow request with its discussion.
@immutable
class ApprovalDetail {
  const ApprovalDetail({
    required this.id,
    required this.objectType,
    required this.objectId,
    required this.status,
    required this.summary,
    required this.initiator,
    required this.submittedAt,
    required this.actions,
  });

  factory ApprovalDetail.fromJson(Map<String, Object?> j) => ApprovalDetail(
    id: j['id']! as String,
    objectType: j['objectType']! as String,
    objectId: j['objectId']! as String,
    status: j['status']! as String,
    summary: RequestSummary.fromJson(_map(j['summary'])),
    initiator: Person.fromJson(_map(j['initiator'])),
    submittedAt: DateTime.parse(j['submittedAt']! as String).toUtc(),
    actions: [
      for (final a in (j['actions'] as List?) ?? const [])
        ActionEntry.fromJson(_map(a)),
    ],
  );

  final String id;
  final String objectType;
  final String objectId;

  /// `IN_REVIEW`, `APPROVED`, `REJECTED`, `RETURNED`, `WITHDRAWN`.
  final String status;
  final RequestSummary summary;
  final Person initiator;
  final DateTime submittedAt;
  final List<ActionEntry> actions;

  bool get open => status == 'IN_REVIEW';
}
