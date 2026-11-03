import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

enum NoticeCategory {
  general('GENERAL'),
  policy('POLICY'),
  safety('SAFETY'),
  operations('OPERATIONS'),
  admin('ADMIN'),
  hr('HR'),
  executive('EXECUTIVE');

  const NoticeCategory(this.wire);

  final String wire;

  static NoticeCategory parse(String wire) =>
      values.firstWhere((c) => c.wire == wire, orElse: () => general);
}

enum NoticePriority {
  normal('NORMAL'),
  high('HIGH'),
  critical('CRITICAL');

  const NoticePriority(this.wire);

  final String wire;

  static NoticePriority parse(String wire) =>
      values.firstWhere((p) => p.wire == wire, orElse: () => normal);
}

@immutable
class NoticeAuthor {
  const NoticeAuthor({
    required this.name,
    required this.nameBn,
    required this.title,
    required this.titleBn,
  });

  factory NoticeAuthor.fromJson(Map<String, Object?> j) => NoticeAuthor(
    name: j['name']! as String,
    nameBn: j['nameBn']! as String,
    title: j['title']! as String,
    titleBn: j['titleBn']! as String,
  );

  final String name;
  final String nameBn;
  final String title;
  final String titleBn;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
  String displayTitle({required bool bangla}) => bangla ? titleBn : title;
}

@immutable
class NoticeStats {
  const NoticeStats({
    required this.recipientCount,
    required this.readCount,
    required this.ackCount,
  });

  factory NoticeStats.fromJson(Map<String, Object?> j) => NoticeStats(
    recipientCount: (j['recipientCount']! as num).toInt(),
    readCount: (j['readCount']! as num).toInt(),
    ackCount: (j['ackCount']! as num).toInt(),
  );

  final int recipientCount;
  final int readCount;
  final int ackCount;
}

@immutable
class Notice {
  const Notice({
    required this.id,
    required this.refNo,
    required this.title,
    required this.titleBn,
    required this.excerpt,
    required this.category,
    required this.priority,
    required this.requiresAck,
    required this.isPinned,
    required this.publishedAt,
    required this.author,
    this.readAt,
    this.ackedAt,
    this.body,
    this.bodyBn,
    this.audience,
    this.audienceBn,
    this.stats,
  });

  factory Notice.fromJson(Map<String, Object?> j) {
    final audience = j['audience'] == null ? null : _map(j['audience']);
    return Notice(
      id: j['id']! as String,
      refNo: j['refNo']! as String,
      title: j['title']! as String,
      titleBn: j['titleBn']! as String,
      excerpt: j['excerpt']! as String,
      category: NoticeCategory.parse(j['category']! as String),
      priority: NoticePriority.parse(j['priority']! as String),
      requiresAck: j['requiresAck'] == true,
      isPinned: j['isPinned'] == true,
      publishedAt: DateTime.parse(j['publishedAt']! as String).toUtc(),
      author: NoticeAuthor.fromJson(_map(j['author'])),
      readAt: j['readAt'] == null
          ? null
          : DateTime.parse(j['readAt']! as String).toUtc(),
      ackedAt: j['ackedAt'] == null
          ? null
          : DateTime.parse(j['ackedAt']! as String).toUtc(),
      body: j['body'] as String?,
      bodyBn: j['bodyBn'] as String?,
      audience: audience?['en'] as String?,
      audienceBn: audience?['bn'] as String?,
      stats: j['stats'] == null ? null : NoticeStats.fromJson(_map(j['stats'])),
    );
  }

  final String id;
  final String refNo;
  final String title;
  final String titleBn;
  final String excerpt;
  final NoticeCategory category;
  final NoticePriority priority;
  final bool requiresAck;
  final bool isPinned;
  final DateTime publishedAt;
  final NoticeAuthor author;
  final DateTime? readAt;
  final DateTime? ackedAt;
  final String? body;
  final String? bodyBn;
  final String? audience;
  final String? audienceBn;
  final NoticeStats? stats;

  bool get unread => readAt == null;
  bool get awaitingAck => requiresAck && ackedAt == null;

  String displayTitle({required bool bangla}) => bangla ? titleBn : title;
  String displayBody({required bool bangla}) =>
      (bangla ? bodyBn : body) ?? body ?? excerpt;
  String? displayAudience({required bool bangla}) =>
      bangla ? audienceBn : audience;
}

@immutable
class NamedRef {
  const NamedRef({required this.id, required this.name, required this.nameBn});

  factory NamedRef.fromJson(Map<String, Object?> j) => NamedRef(
    id: j['id']! as String,
    name: j['name']! as String,
    nameBn: j['nameBn']! as String,
  );

  final String id;
  final String name;
  final String nameBn;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class NoticeOptions {
  const NoticeOptions({
    required this.canPublish,
    required this.scope,
    required this.categories,
    required this.departments,
    required this.sites,
    required this.ownDepartmentId,
    required this.ownSiteId,
  });

  factory NoticeOptions.fromJson(Map<String, Object?> j) => NoticeOptions(
    canPublish: j['canPublish'] == true,
    scope: j['scope'] as String?,
    categories: [
      for (final c in j['categories']! as List)
        NoticeCategory.parse(c! as String),
    ],
    departments: [
      for (final d in j['departments']! as List) NamedRef.fromJson(_map(d)),
    ],
    sites: [for (final s in j['sites']! as List) NamedRef.fromJson(_map(s))],
    ownDepartmentId: j['ownDepartmentId']! as String,
    ownSiteId: j['ownSiteId']! as String,
  );

  final bool canPublish;
  final String? scope;
  final List<NoticeCategory> categories;
  final List<NamedRef> departments;
  final List<NamedRef> sites;
  final String ownDepartmentId;
  final String ownSiteId;

  bool get company => scope == 'COMPANY';
}

@immutable
class ReceiptRow {
  const ReceiptRow({
    required this.name,
    required this.nameBn,
    this.department,
    this.readAt,
    this.ackedAt,
  });

  factory ReceiptRow.fromJson(Map<String, Object?> j) => ReceiptRow(
    name: j['name']! as String,
    nameBn: j['nameBn']! as String,
    department: j['department'] as String?,
    readAt: j['readAt'] == null
        ? null
        : DateTime.parse(j['readAt']! as String).toUtc(),
    ackedAt: j['ackedAt'] == null
        ? null
        : DateTime.parse(j['ackedAt']! as String).toUtc(),
  );

  final String name;
  final String nameBn;
  final String? department;
  final DateTime? readAt;
  final DateTime? ackedAt;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class NoticeReceipts {
  const NoticeReceipts({required this.stats, required this.items});

  factory NoticeReceipts.fromJson(Map<String, Object?> j) => NoticeReceipts(
    stats: NoticeStats.fromJson(_map(j['stats'])),
    items: [
      for (final r in j['items']! as List) ReceiptRow.fromJson(_map(r)),
    ],
  );

  final NoticeStats stats;
  final List<ReceiptRow> items;
}
