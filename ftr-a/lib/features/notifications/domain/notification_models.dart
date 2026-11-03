import 'package:flutter/foundation.dart';

/// Priority levels (doc 02 `Priority`).
enum NotificationPriority {
  low,
  normal,
  high,
  critical;

  static NotificationPriority parse(String wire) => switch (wire) {
    'LOW' => low,
    'HIGH' => high,
    'CRITICAL' => critical,
    _ => normal,
  };
}

/// Doc 03 §4.2 filter chips.
enum NotificationCategory {
  all('ALL'),
  approvals('APPROVALS'),
  safety('SAFETY'),
  transport('TRANSPORT');

  NotificationCategory(this.wire);

  final String wire;
}

/// Coarse grouping used for icons; derived from the `type` prefix.
enum NotificationKind { approval, safety, transport, other }

@immutable
class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.priority,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.ackRequired,
    this.module,
    this.route,
    this.readAt,
    this.ackedAt,
  });

  factory AppNotification.fromJson(Map<String, Object?> json) {
    final data = json['data'];
    final map = data is Map
        ? Map<String, Object?>.from(data)
        : <String, Object?>{};
    return AppNotification(
      id: json['id']! as String,
      type: json['type']! as String,
      priority: NotificationPriority.parse(json['priority']! as String),
      title: json['title']! as String,
      body: json['body']! as String,
      createdAt: DateTime.parse(json['createdAt']! as String).toUtc(),
      ackRequired: json['ackRequired'] == true,
      module: map['module'] as String?,
      route: map['route'] as String?,
      readAt: _date(json['readAt']),
      ackedAt: _date(json['ackedAt']),
    );
  }

  static DateTime? _date(Object? v) =>
      v is String ? DateTime.parse(v).toUtc() : null;

  final String id;
  final String type;
  final NotificationPriority priority;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool ackRequired;
  final String? module;

  /// Deep link supplied by the owning module, when it exists.
  final String? route;
  final DateTime? readAt;
  final DateTime? ackedAt;

  bool get isRead => readAt != null;

  bool get needsAck => ackRequired && ackedAt == null;

  NotificationKind get kind {
    if (type.startsWith('APPROVAL_') ||
        type.startsWith('NOTE_SHEET_') ||
        type.startsWith('DELEGATION_') ||
        type == 'LEAVE_REQUESTED' ||
        type == 'CLAIM_SUBMITTED') {
      return NotificationKind.approval;
    }
    if (type.startsWith('INCIDENT_') ||
        type.startsWith('CAPA_') ||
        type == 'FLEET_SOS') {
      return NotificationKind.safety;
    }
    if (type.startsWith('FLEET_') ||
        type.startsWith('BUS_') ||
        type.startsWith('PARCEL_') ||
        type.startsWith('VISIT_')) {
      return NotificationKind.transport;
    }
    return NotificationKind.other;
  }

  AppNotification copyWith({DateTime? readAt, DateTime? ackedAt}) =>
      AppNotification(
        id: id,
        type: type,
        priority: priority,
        title: title,
        body: body,
        createdAt: createdAt,
        ackRequired: ackRequired,
        module: module,
        route: route,
        readAt: readAt ?? this.readAt,
        ackedAt: ackedAt ?? this.ackedAt,
      );
}

/// `GET /notifications/unread-count`.
@immutable
class UnreadSummary {
  const UnreadSummary({this.total = 0, this.critical = 0, this.pendingAck = 0});

  factory UnreadSummary.fromJson(Map<String, Object?> json) => UnreadSummary(
    total: (json['total'] as num?)?.toInt() ?? 0,
    critical: (json['critical'] as num?)?.toInt() ?? 0,
    pendingAck: (json['pendingAck'] as num?)?.toInt() ?? 0,
  );

  final int total;
  final int critical;
  final int pendingAck;
}
