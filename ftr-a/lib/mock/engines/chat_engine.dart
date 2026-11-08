import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Inner-circle chat (doc 06 MOD-15). No E2E claim in copy (BR-15-05/17).
abstract final class ChatEngine {
  static const emojis = {'👍', '✅', '⚡', '👁️', '🚨', '🙏', '⚠️'};

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

  /// Resolves rich employee metadata for a userId.
  static Json? _employeeInfo(MockStore store, String? userId) {
    if (userId == null) return null;
    final u = store.get(Col.users, userId);
    if (u == null) return null;
    final emp = store.get(Col.employees, u.str('employeeId'));
    if (emp == null) return null;
    final desig = emp.objOrNull('designation');
    final site = emp.objOrNull('site');
    final dept = emp.objOrNull('department');
    return {
      'userId': userId,
      'employeeId': emp['id'],
      'empCode': emp['empCode'],
      'fullName': emp['fullName'],
      'fullNameBn': emp['fullNameBn'] ?? emp['fullName'],
      'title': desig?['title'] ?? '',
      'titleBn': desig?['titleBn'] ?? desig?['title'] ?? '',
      'site': site?['name'] ?? 'BOGCL',
      'siteBn': site?['nameBn'] ?? site?['name'] ?? 'BOGCL',
      'department': dept?['name'] ?? '',
      'departmentBn': dept?['nameBn'] ?? dept?['name'] ?? '',
    };
  }

  static Json channelWire(MockStore store, AuthContext a, Json ch) {
    final callerId = a.user.str('id');
    final last = lastMessage(store, ch.str('id'));
    final isDirect = ch['isDirect'] == true;
    final rawMembers = ch.objList('members');

    var displayName = ch.str('name');
    var displayNameBn = ch.strOrNull('nameBn') ?? displayName;
    var subtitle = '${rawMembers.length} Members · #${ch['key']}';
    var subtitleBn = '${rawMembers.length} জন সদস্য · #${ch['key']}';
    var directPresence = 'ONLINE';

    if (isDirect) {
      final otherMem = rawMembers
          .where((m) => m['userId'] != callerId)
          .firstOrNull;
      final otherUid =
          otherMem?.strOrNull('userId') ??
          rawMembers.firstOrNull?.strOrNull('userId');
      final info = _employeeInfo(store, otherUid);
      if (info != null) {
        displayName = info.str('fullName');
        displayNameBn = info.str('fullNameBn');
        final tEn = info.str('title');
        final sEn = info.str('site');
        final tBn = info.str('titleBn');
        final sBn = info.str('siteBn');
        subtitle = tEn.isNotEmpty ? '$tEn · $sEn' : sEn;
        subtitleBn = tBn.isNotEmpty ? '$tBn · $sBn' : sBn;
      }
      directPresence = otherMem?.strOrNull('presence') ?? 'ONLINE';
    }

    return {
      'id': ch['id'],
      'key': ch['key'],
      'name': displayName,
      'nameBn': displayNameBn,
      'subtitle': subtitle,
      'subtitleBn': subtitleBn,
      'presence': directPresence,
      'isLocked': ch['isLocked'] == true,
      'isDirect': isDirect,
      'unreadCount': unread(store, ch, callerId),
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
        for (final m in rawMembers)
          () {
            final uid = m.str('userId');
            final info = _employeeInfo(store, uid);
            return {
              ...?WorkflowEngine.personRef(store, uid),
              'title': info?['title'] ?? '',
              'titleBn': info?['titleBn'] ?? '',
              'site': info?['site'] ?? 'BOGCL',
              'siteBn': info?['siteBn'] ?? 'BOGCL',
              'empCode': info?['empCode'] ?? '',
              'isAdmin': m['isAdmin'] == true,
              'presence': uid == callerId
                  ? 'ONLINE'
                  : (m['presence'] ?? 'ONLINE'),
            };
          }(),
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
    final senderId = m.strOrNull('senderUserId');
    final info = _employeeInfo(store, senderId);
    final baseSender = WorkflowEngine.personRef(store, senderId);
    return {
      'id': m['id'],
      'channelId': m['channelId'],
      'type': m['type'],
      'body': m['body'],
      'createdAt': m['createdAt'],
      'editedAt': m['editedAt'],
      'pinned': m['pinned'] == true,
      'isUrgent': m['isUrgent'] == true,
      'sender': baseSender == null
          ? null
          : {
              ...baseSender,
              'title': info?['title'] ?? baseSender['title'] ?? '',
              'site': info?['site'] ?? '',
            },
      'reactions': m['reactions'] ?? const <Json>[],
      'directive': dir == null ? null : store.get(Col.chatDirectives, dir),
    };
  }

  /// Ensures default 1:1 Direct Message conversations exist even on databases
  /// that were seeded before DM channels were added.
  static void _ensureDefaultDirects(MockStore store, String callerId) {
    final hasAnyDirect = store
        .all(Col.chatChannels)
        .any((c) => c['isDirect'] == true && isMember(c, callerId));
    if (hasAnyDirect) return;

    final targets = [
      (
        code: 'EMP-0012',
        msg: 'Sir, Batch B-88 Bitumen 60/70 passed BDS 1238 lab certification at Keraniganj Refinery. Ready for commercial dispatch.',
        at: '2026-11-03T07:15:00.000Z',
      ),
      (
        code: 'EMP-0062',
        msg: 'Chairman Sir, the Tk 32.0L Bitumen Storage Tank TK-109 Note-Sheet is verified by Finance and placed in your E-Sign queue.',
        at: '2026-11-03T07:45:00.000Z',
      ),
      (
        code: 'EMP-0028',
        msg: 'Morning attendance across Baridhara HQ and Keraniganj Plant is 96.4% on time today.',
        at: '2026-11-03T08:05:00.000Z',
      ),
    ];

    for (final t in targets) {
      final otherId = userIdFor(t.code);
      if (otherId == callerId) continue;
      final pair = [callerId, otherId]..sort();
      final key = 'dm_${pair.join('_')}';
      if (store.get(Col.chatChannels, key) == null) {
        store.put(Col.chatChannels, {
          'id': key,
          'key': key,
          'name': 'Direct',
          'nameBn': 'সরাসরি',
          'isLocked': false,
          'isDirect': true,
          'members': [
            {'userId': pair[0], 'isAdmin': true, 'presence': 'ONLINE'},
            {'userId': pair[1], 'isAdmin': true, 'presence': 'ONLINE'},
          ],
        });
        final msgId = 'cm_seed_$key';
        if (store.get(Col.chatMessages, msgId) == null) {
          store.put(Col.chatMessages, {
            'id': msgId,
            'channelId': key,
            'senderUserId': otherId,
            'type': 'TEXT',
            'body': t.msg,
            'createdAt': t.at,
            'editedAt': null,
            'deletedAt': null,
            'pinned': false,
            'isUrgent': false,
            'clientMsgId': msgId,
            'reactions': <Json>[],
            'directiveId': null,
          });
        }
      }
    }
  }

  static List<Json> mine(MockStore store, AuthContext a) {
    final me = a.user.str('id');
    _ensureDefaultDirects(store, me);
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
        {'userId': pair[0], 'isAdmin': true, 'presence': 'ONLINE'},
        {'userId': pair[1], 'isAdmin': true, 'presence': 'ONLINE'},
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
      members.add({'userId': uid, 'isAdmin': true, 'presence': 'ONLINE'});
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

  /// Smart context-aware colleague reply across Direct Messages & Command Channels.
  static void maybeAutoReply(MockStore store, Json ch, Json justSent) {
    final senderId = justSent.str('senderUserId');
    final isDirect = ch['isDirect'] == true;
    final key = ch.strOrNull('key') ?? '';

    String? responderId;
    var replyBody =
        'Noted, Sir. Our team is executing this now and will update the status shortly.';

    if (isDirect) {
      final other = ch
          .objList('members')
          .where((m) => m['userId'] != senderId)
          .firstOrNull;
      responderId = other?.strOrNull('userId');
      if (responderId == userIdFor('EMP-0012')) {
        replyBody = 'Acknowledged, Sir. Keraniganj Refinery control room has logged your instruction and will submit the compliance report before shift handover.';
      } else if (responderId == userIdFor('EMP-0062')) {
        replyBody = 'Noted, Sir. Finance & Treasury have prioritized this file and verified the budget allocation.';
      } else if (responderId == userIdFor('EMP-0028')) {
        replyBody = 'Received, Sir. HR & Administration will coordinate across Baridhara HQ and the refinery plants immediately.';
      }
    } else if (key == 'factory-operations' || key == 'permits-and-compliance') {
      responderId = userIdFor('EMP-0012');
      replyBody = 'Noted. Keraniganj Plant Operations will close the loop on the current shift and report back with QC verification.';
    } else if (key == 'finance-and-purchases') {
      responderId = userIdFor('EMP-0062');
      replyBody = 'Acknowledged by Finance. Voucher and budget check are cleared on our end.';
    } else if (key == 'executive-leadership') {
      responderId = userIdFor('EMP-0012');
      replyBody = 'Acknowledged, Chairman Sir. Refinery and HQ unit heads are aligned and executing on priority.';
    }

    if (responderId == null || responderId == senderId) return;

    final n = store.all(Col.chatMessages).length + 1;
    store.put(Col.chatMessages, {
      'id': 'cm_$n',
      'channelId': ch['id'],
      'senderUserId': responderId,
      'type': 'TEXT',
      'body': replyBody,
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
