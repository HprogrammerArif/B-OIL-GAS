import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

DateTime? _t(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

@immutable
class ChatMember {
  const ChatMember({
    required this.userId,
    required this.name,
    required this.nameBn,
    required this.title,
    required this.titleBn,
    required this.site,
    required this.siteBn,
    required this.empCode,
    required this.isAdmin,
    required this.presence,
  });

  factory ChatMember.fromJson(Map<String, Object?> j) => ChatMember(
    userId: j['userId'] as String? ?? '',
    name: j['fullName'] as String? ?? j['name'] as String? ?? 'Member',
    nameBn:
        j['fullNameBn'] as String? ??
        j['fullName'] as String? ??
        j['name'] as String? ??
        'সদস্য',
    title: j['title'] as String? ?? '',
    titleBn: j['titleBn'] as String? ?? j['title'] as String? ?? '',
    site: j['site'] as String? ?? 'BOGCL',
    siteBn: j['siteBn'] as String? ?? j['site'] as String? ?? 'BOGCL',
    empCode: j['empCode'] as String? ?? '',
    isAdmin: j['isAdmin'] == true,
    presence: j['presence'] as String? ?? 'ONLINE',
  );

  final String userId;
  final String name;
  final String nameBn;
  final String title;
  final String titleBn;
  final String site;
  final String siteBn;
  final String empCode;
  final bool isAdmin;
  final String presence;

  String displayName({required bool bangla}) => bangla ? nameBn : name;
  String displayTitle({required bool bangla}) => bangla ? titleBn : title;
  String displaySite({required bool bangla}) => bangla ? siteBn : site;
}

@immutable
class ChatChannel {
  const ChatChannel({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.unreadCount,
    required this.isLocked,
    required this.isDirect,
    this.key = '',
    this.subtitle = '',
    this.subtitleBn = '',
    this.presence = 'ONLINE',
    this.lastPreview,
    this.lastSender,
    this.lastAt,
    this.members = const [],
  });

  factory ChatChannel.fromJson(Map<String, Object?> j) {
    final last = j['lastMessage'] is Map ? _map(j['lastMessage']) : null;
    final senderMap = last?['sender'] is Map ? _map(last?['sender']) : null;
    return ChatChannel(
      id: j['id']! as String,
      key: j['key'] as String? ?? '',
      name: j['name'] as String? ?? '',
      nameBn: j['nameBn'] as String? ?? '',
      subtitle: j['subtitle'] as String? ?? '',
      subtitleBn: j['subtitleBn'] as String? ?? '',
      presence: j['presence'] as String? ?? 'ONLINE',
      unreadCount: (j['unreadCount'] as num?)?.toInt() ?? 0,
      isLocked: j['isLocked'] == true,
      isDirect: j['isDirect'] == true,
      lastPreview: last?['body'] as String?,
      lastSender: senderMap?['fullName'] as String?,
      lastAt: _t(last?['createdAt']),
      members: [
        for (final m in j['members'] as List? ?? const [])
          if (m is Map) ChatMember.fromJson(Map<String, Object?>.from(m)),
      ],
    );
  }

  final String id;
  final String key;
  final String name;
  final String nameBn;
  final String subtitle;
  final String subtitleBn;
  final String presence;
  final int unreadCount;
  final bool isLocked;
  final bool isDirect;
  final String? lastPreview;
  final String? lastSender;
  final DateTime? lastAt;
  final List<ChatMember> members;

  String heading({required bool bangla}) =>
      (bangla && nameBn.isNotEmpty) ? nameBn : name;

  String subheading({required bool bangla}) =>
      (bangla && subtitleBn.isNotEmpty) ? subtitleBn : subtitle;
}

@immutable
class ChatDirective {
  const ChatDirective({
    required this.id,
    required this.title,
    required this.body,
    required this.acks,
    required this.needed,
    this.refNo = '',
    this.priority = 'HIGH',
    this.executedAt,
  });

  factory ChatDirective.fromJson(Map<String, Object?> j) => ChatDirective(
    id: j['id']! as String,
    refNo: j['refNo'] as String? ?? 'BOGCL-DIR-2026',
    priority: j['priority'] as String? ?? 'HIGH',
    title: j['title'] as String? ?? '',
    body: j['body'] as String? ?? '',
    acks: (j['acknowledgements'] as List? ?? const []).length,
    needed: (j['requireAckFrom'] as List? ?? const []).length,
    executedAt: _t(j['executedAt']),
  );

  final String id;
  final String refNo;
  final String priority;
  final String title;
  final String body;
  final int acks;
  final int needed;
  final DateTime? executedAt;
}

@immutable
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.type,
    required this.mine,
    this.body,
    this.createdAt,
    this.sender,
    this.senderSite,
    this.deleted = false,
    this.pinned = false,
    this.isUrgent = false,
    this.directive,
    this.reactions = const [],
    this.reactionCounts = const {},
    this.fileId,
    this.fileName,
    this.mime,
  });

  factory ChatMessage.fromJson(Map<String, Object?> j, {required String me}) {
    if (j['deletedAt'] != null) {
      return ChatMessage(
        id: j['id']! as String,
        type: 'DELETED',
        mine: false,
        deleted: true,
      );
    }
    final rawReactions = [
      for (final e in j['reactions'] as List? ?? const [])
        if (e is Map && e['emoji'] != null) '${e['emoji']}',
    ];
    final counts = <String, int>{};
    for (final emoji in rawReactions) {
      counts[emoji] = (counts[emoji] ?? 0) + 1;
    }
    final senderMap = j['sender'] is Map ? _map(j['sender']) : null;
    final file = j['file'] is Map ? _map(j['file']) : null;

    return ChatMessage(
      id: j['id']! as String,
      type: j['type'] as String? ?? 'TEXT',
      body: j['body'] as String?,
      createdAt: _t(j['createdAt']),
      sender: _person(j['sender']),
      senderSite: senderMap?['site'] as String?,
      mine: senderMap?['userId'] == me,
      pinned: j['pinned'] == true,
      isUrgent: j['isUrgent'] == true,
      directive: j['directive'] is Map
          ? ChatDirective.fromJson(_map(j['directive']))
          : null,
      reactions: rawReactions,
      reactionCounts: counts,
      fileId: file?['id'] as String?,
      fileName: file?['fileName'] as String?,
      mime: file?['mime'] as String?,
    );
  }

  final String id;
  final String type;
  final bool mine;
  final bool deleted;
  final bool pinned;
  final bool isUrgent;
  final String? body;
  final DateTime? createdAt;
  final Person? sender;
  final String? senderSite;
  final ChatDirective? directive;
  final List<String> reactions;
  final Map<String, int> reactionCounts;
  final String? fileId;
  final String? fileName;
  final String? mime;
}
