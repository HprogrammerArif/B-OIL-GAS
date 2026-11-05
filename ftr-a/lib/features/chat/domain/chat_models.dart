import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

DateTime? _t(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

@immutable
class ChatChannel {
  const ChatChannel({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.unreadCount,
    required this.isLocked,
    required this.isDirect,
    this.lastPreview,
    this.lastAt,
  });

  factory ChatChannel.fromJson(Map<String, Object?> j) {
    final last = j['lastMessage'] is Map ? _map(j['lastMessage']) : null;
    return ChatChannel(
      id: j['id']! as String,
      name: j['name'] as String? ?? '',
      nameBn: j['nameBn'] as String? ?? '',
      unreadCount: (j['unreadCount'] as num?)?.toInt() ?? 0,
      isLocked: j['isLocked'] == true,
      isDirect: j['isDirect'] == true,
      lastPreview: last?['body'] as String?,
      lastAt: _t(last?['createdAt']),
    );
  }

  final String id;
  final String name;
  final String nameBn;
  final int unreadCount;
  final bool isLocked;
  final bool isDirect;
  final String? lastPreview;
  final DateTime? lastAt;

  String heading({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class ChatDirective {
  const ChatDirective({
    required this.id,
    required this.title,
    required this.body,
    required this.acks,
    required this.needed,
    this.executedAt,
  });

  factory ChatDirective.fromJson(Map<String, Object?> j) => ChatDirective(
    id: j['id']! as String,
    title: j['title'] as String? ?? '',
    body: j['body'] as String? ?? '',
    acks: (j['acknowledgements'] as List? ?? const []).length,
    needed: (j['requireAckFrom'] as List? ?? const []).length,
    executedAt: _t(j['executedAt']),
  );

  final String id;
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
    this.deleted = false,
    this.directive,
    this.reactions = const [],
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
    return ChatMessage(
      id: j['id']! as String,
      type: j['type'] as String? ?? 'TEXT',
      body: j['body'] as String?,
      createdAt: _t(j['createdAt']),
      sender: _person(j['sender']),
      mine: (j['sender'] is Map ? _map(j['sender'])['userId'] : null) == me,
      directive: j['directive'] is Map
          ? ChatDirective.fromJson(_map(j['directive']))
          : null,
      reactions: [
        for (final e in j['reactions'] as List? ?? const [])
          if (e is Map) '${e['emoji']}',
      ],
    );
  }

  final String id;
  final String type;
  final bool mine;
  final bool deleted;
  final String? body;
  final DateTime? createdAt;
  final Person? sender;
  final ChatDirective? directive;
  final List<String> reactions;
}
