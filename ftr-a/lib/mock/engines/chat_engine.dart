import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Inner-circle chat (doc 06 MOD-15). No E2E claim in copy (BR-15-05/17).
abstract final class ChatEngine {
  static const emojis = {'👍', '✅', '⚠️', '🙏'};

  static Json? channel(MockStore store, String id) =>
      store.get(Col.chatChannels, id);

  static bool isMember(Json ch, String userId) =>
      ch.objList('members').any((m) => m['userId'] == userId);

  static bool isAdmin(Json ch, String userId) => ch
      .objList('members')
      .any((m) => m['userId'] == userId && m['isAdmin'] == true);

  static Json requireMember(MockStore store, AuthContext a, String id) {
    final ch = channel(store, id);
    if (ch == null) throw notFound('Conversation');
    if (!isMember(ch, a.user.str('id'))) throw forbidden();
    return ch;
  }

  static int unread(MockStore store, Json ch, String userId) {
    final rec = store.get(Col.chatReceipts, 'cr_${ch['id']}_$userId');
    final last = rec?.strOrNull('lastMessageId');
    var n = 0;
    var passed = last == null;
    final msgs =
        store
            .all(Col.chatMessages)
            .where((m) => m['channelId'] == ch['id'] && m['deletedAt'] == null)
            .toList()
          ..sort((x, y) => x.str('createdAt').compareTo(y.str('createdAt')));
    for (final m in msgs) {
      if (!passed) {
        if (m['id'] == last) passed = true;
        continue;
      }
      if (m['senderUserId'] == userId) continue;
      n++;
    }
    return n;
  }

  static Json? lastMessage(MockStore store, String channelId) {
    Json? best;
    for (final m in store.all(Col.chatMessages)) {
      if (m['channelId'] != channelId || m['deletedAt'] != null) continue;
      if (best == null ||
          m.str('createdAt').compareTo(best.str('createdAt')) > 0) {
        best = m;
      }
    }
    return best;
  }

  static Json channelWire(MockStore store, AuthContext a, Json ch) {
    final last = lastMessage(store, ch.str('id'));
    return {
      'id': ch['id'],
      'key': ch['key'],
      'name': ch['name'],
      'nameBn': ch['nameBn'],
      'isLocked': ch['isLocked'] == true,
      'isDirect': ch['isDirect'] == true,
      'unreadCount': unread(store, ch, a.user.str('id')),
      'lastMessage': last == null
          ? null
          : {
              'id': last['id'],
              'body': last['body'],
              'createdAt': last['createdAt'],
              'sender': WorkflowEngine.personRef(
                store,
                last.strOrNull('senderUserId'),
              ),
            },
      'members': [
        for (final m in ch.objList('members'))
          {
            ...?WorkflowEngine.personRef(store, m.str('userId')),
            'isAdmin': m['isAdmin'] == true,
            'presence': m['userId'] == a.user['id']
                ? 'ONLINE'
                : (m['presence'] ?? 'AWAY'),
          },
      ],
    };
  }

  static Json messageWire(MockStore store, Json m) {
    if (m['deletedAt'] != null) {
      return {
        'id': m['id'],
        'deletedAt': m['deletedAt'],
        'channelId': m['channelId'],
      };
    }
    final dir = m.strOrNull('directiveId');
    return {
      'id': m['id'],
      'channelId': m['channelId'],
      'type': m['type'],
      'body': m['body'],
      'createdAt': m['createdAt'],
      'editedAt': m['editedAt'],
      'pinned': m['pinned'] == true,
      'isUrgent': m['isUrgent'] == true,
      'sender': WorkflowEngine.personRef(store, m.strOrNull('senderUserId')),
      'reactions': m['reactions'] ?? const <Json>[],
      'directive': dir == null ? null : store.get(Col.chatDirectives, dir),
    };
  }

  static List<Json> mine(MockStore store, AuthContext a) {
    final me = a.user.str('id');
    return [
      for (final ch in store.all(Col.chatChannels))
        if (isMember(ch, me)) channelWire(store, a, ch),
    ]..sort((x, y) {
      final ax = (x['lastMessage'] as Json?)?['createdAt'] as String? ?? '';
      final ay = (y['lastMessage'] as Json?)?['createdAt'] as String? ?? '';
      return ay.compareTo(ax);
    });
  }

  static List<Json> messages(MockStore store, Json ch) {
    final list =
        store
            .all(Col.chatMessages)
            .where((m) => m['channelId'] == ch['id'])
            .toList()
          ..sort((x, y) => x.str('createdAt').compareTo(y.str('createdAt')));
    return [for (final m in list) messageWire(store, m)];
  }

  static Json send(MockStore store, AuthContext a, Json ch, Json body) {
    if (ch['isLocked'] == true && !isAdmin(ch, a.user.str('id'))) {
      throw policyViolation('LOCKED', 'Only an admin can write here.');
    }
    final text = (body['body'] as String? ?? '').trim();
    if (text.isEmpty) throw validationError('body', 'Write a message');
    if (text.length > 4000) throw validationError('body', 'Too long');
    final client = body['clientMsgId'] as String?;
    if (client != null) {
      for (final m in store.all(Col.chatMessages)) {
        if (m['clientMsgId'] == client) return m;
      }
    }
    final n = store.all(Col.chatMessages).length + 1;
    final rec = <String, Object?>{
      'id': 'cm_$n',
      'channelId': ch['id'],
      'senderUserId': a.user['id'],
      'type': text.startsWith('VOICE:') ? 'VOICE' : 'TEXT',
      'body': text,
      'createdAt': store.nowIso(),
      'editedAt': null,
      'deletedAt': null,
      'pinned': false,
      'isUrgent': body['isUrgent'] == true,
      'clientMsgId': client,
      'reactions': <Json>[],
      'directiveId': null,
    };
    store.put(Col.chatMessages, rec);
    markRead(store, a, ch, rec.str('id'));
    for (final m in ch.objList('members')) {
      final uid = m.str('userId');
      if (uid == a.user['id']) continue;
      NotificationEngine.notify(
        store,
        userId: uid,
        type: rec['isUrgent'] == true ? 'CHAT_URGENT' : 'CHAT_MESSAGE',
        title: Bi(ch.str('name'), ch.strOrNull('nameBn') ?? ch.str('name')),
        body: Bi(text, text),
        priority: rec['isUrgent'] == true ? 'HIGH' : 'NORMAL',
        data: {'module': 'chat', 'route': '/home/chat/${ch['id']}'},
      );
    }
    return rec;
  }

  static void markRead(MockStore store, AuthContext a, Json ch, String lastId) {
    store.put(Col.chatReceipts, {
      'id': 'cr_${ch['id']}_${a.user['id']}',
      'channelId': ch['id'],
      'userId': a.user['id'],
      'lastMessageId': lastId,
      'at': store.nowIso(),
    });
  }

  static Json react(MockStore store, AuthContext a, Json msg, String emoji) {
    if (!emojis.contains(emoji)) {
      throw validationError('emoji', 'Pick a supported reaction');
    }
    final ch = channel(store, msg.str('channelId'));
    if (ch == null || !isMember(ch, a.user.str('id'))) throw forbidden();
    final list = [
      for (final r in (msg['reactions'] as List? ?? const []))
        if (r is Map) Map<String, Object?>.from(r),
    ];
    final mine = list.indexWhere(
      (r) => r['userId'] == a.user['id'] && r['emoji'] == emoji,
    );
    if (mine >= 0) {
      list.removeAt(mine);
    } else {
      list.add({'emoji': emoji, 'userId': a.user['id']});
    }
    msg['reactions'] = list;
    store.put(Col.chatMessages, msg);
    return msg;
  }

  static Json issueDirective(
    MockStore store,
    AuthContext a,
    Json ch,
    Json body,
  ) {
    final title = (body['title'] as String? ?? '').trim();
    final text = (body['body'] as String? ?? '').trim();
    if (title.length < 3) throw validationError('title', 'Give a short title');
    if (text.length < 10) {
      throw validationError('body', 'Write the instruction');
    }
    final n = store.all(Col.chatDirectives).length + 1;
    final members = [for (final m in ch.objList('members')) m.str('userId')];
    final rec = <String, Object?>{
      'id': 'dir_$n',
      'refNo': 'BOGCL-DIR-2026-${n.toString().padLeft(4, '0')}',
      'channelId': ch['id'],
      'title': title,
      'body': text,
      'issuerUserId': a.user['id'],
      'issuedAt': store.nowIso(),
      'dueAt': body['dueAt'],
      'priority': body['priority'] ?? 'HIGH',
      'requireAckFrom': members.where((id) => id != a.user['id']).toList(),
      'acknowledgements': <Json>[],
      'executedAt': null,
    };
    final msgN = store.all(Col.chatMessages).length + 1;
    final msg = <String, Object?>{
      'id': 'cm_$msgN',
      'channelId': ch['id'],
      'senderUserId': a.user['id'],
      'type': 'DIRECTIVE',
      'body': title,
      'createdAt': store.nowIso(),
      'editedAt': null,
      'deletedAt': null,
      'pinned': true,
      'isUrgent': true,
      'clientMsgId': null,
      'reactions': <Json>[],
      'directiveId': rec['id'],
    };
    store
      ..put(Col.chatDirectives, rec)
      ..put(Col.chatMessages, msg);
    AuditEngine.log(
      store,
      action: 'DIRECTIVE_ISSUED',
      entityType: 'Directive',
      actorUserId: a.user.str('id'),
      entityId: rec.str('id'),
    );
    for (final uid in rec.strList('requireAckFrom')) {
      NotificationEngine.notify(
        store,
        userId: uid,
        type: 'DIRECTIVE_ISSUED',
        title: Bi('Directive: $title', 'নির্দেশ: $title'),
        body: Bi(text, text),
        priority: 'CRITICAL',
        ackRequired: true,
        data: {'module': 'chat', 'route': '/home/chat/${ch['id']}'},
      );
    }
    return rec;
  }

  static Json ackDirective(MockStore store, AuthContext a, String id) {
    final rec = store.get(Col.chatDirectives, id);
    if (rec == null) throw notFound('Directive');
    final acks = rec.objList('acknowledgements');
    if (acks.any((x) => x['userId'] == a.user['id'])) return rec;
    acks.add({'userId': a.user['id'], 'at': store.nowIso()});
    rec['acknowledgements'] = acks;
    store.put(Col.chatDirectives, rec);
    return rec;
  }

  static Json executeDirective(MockStore store, AuthContext a, String id) {
    final rec = store.get(Col.chatDirectives, id);
    if (rec == null) throw notFound('Directive');
    if (rec['issuerUserId'] != a.user['id']) throw forbidden();
    rec['executedAt'] = store.nowIso();
    store.put(Col.chatDirectives, rec);
    return rec;
  }

  static Json openDirect(MockStore store, AuthContext a, String otherId) {
    if (otherId == a.user['id']) {
      throw validationError('userId', 'Pick a colleague');
    }
    final pair = [a.user.str('id'), otherId]..sort();
    final key = 'dm_${pair.join('_')}';
    for (final ch in store.all(Col.chatChannels)) {
      if (ch['key'] == key) return ch;
    }
    final rec = <String, Object?>{
      'id': key,
      'key': key,
      'name': 'Direct',
      'nameBn': 'সরাসরি',
      'isLocked': false,
      'isDirect': true,
      'members': [
        {'userId': pair[0], 'isAdmin': true, 'presence': 'AWAY'},
        {'userId': pair[1], 'isAdmin': true, 'presence': 'AWAY'},
      ],
    };
    store.put(Col.chatChannels, rec);
    return rec;
  }

  static Json ensureReqChannel(MockStore store, String requisitionId) {
    final key = 'REQ:$requisitionId';
    for (final ch in store.all(Col.chatChannels)) {
      if (ch['key'] == key) return ch;
    }
    final r = store.get(Col.fleetRequisitions, requisitionId);
    final members = <Json>[];
    void add(String? uid) {
      if (uid == null) return;
      if (members.any((m) => m['userId'] == uid)) return;
      members.add({'userId': uid, 'isAdmin': true, 'presence': 'AWAY'});
    }

    add(r?.strOrNull('requesterUserId'));
    final trip = store
        .all(Col.fleetTrips)
        .where((t) => t['requisitionId'] == requisitionId)
        .firstOrNull;
    add(trip?.strOrNull('driverUserId'));
    for (final u in store.all(Col.users)) {
      if (u.strList('roles').contains('TRANSPORT_ADMIN')) {
        add(u.str('id'));
      }
    }
    final rec = <String, Object?>{
      'id': 'ch_req_$requisitionId',
      'key': key,
      'name': 'Trip $requisitionId',
      'nameBn': 'যাত্রা $requisitionId',
      'isLocked': false,
      'isDirect': false,
      'members': members,
    };
    store.put(Col.chatChannels, rec);
    return rec;
  }

  static Json sendVoice(
    MockStore store,
    AuthContext a,
    Json ch,
    int durationSec,
  ) {
    if (durationSec < 1 || durationSec > 120) {
      throw validationError('durationSec', 'Voice notes are 1–120 seconds');
    }
    return send(store, a, ch, {
      'body': 'VOICE:$durationSec',
      'isUrgent': false,
    });
  }

  /// Scripted plant-GM reply so a send in operations feels live.
  static void maybeAutoReply(MockStore store, Json ch, Json justSent) {
    if (ch['key'] != 'factory-operations') return;
    if (justSent['senderUserId'] == userIdFor('EMP-0012')) return;
    final n = store.all(Col.chatMessages).length + 1;
    store.put(Col.chatMessages, {
      'id': 'cm_$n',
      'channelId': ch['id'],
      'senderUserId': userIdFor('EMP-0012'),
      'type': 'TEXT',
      'body':
          'Noted. Plant will close the loop on the next shift and report back.',
      'createdAt': store.nowIso(),
      'editedAt': null,
      'deletedAt': null,
      'pinned': false,
      'isUrgent': false,
      'clientMsgId': null,
      'reactions': <Json>[],
      'directiveId': null,
    });
  }
}
