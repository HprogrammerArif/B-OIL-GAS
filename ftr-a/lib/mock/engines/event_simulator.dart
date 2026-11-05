import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Demo-only clock: one incoming leadership message + inbox ping.
abstract final class EventSimulator {
  static Json play(MockStore store, {String? notifyUserId}) {
    final ch = store.get(Col.chatChannels, 'ch_exec');
    if (ch == null) {
      throw notFound('Leadership channel');
    }
    final n = store.all(Col.chatMessages).length + 1;
    final msg = <String, Object?>{
      'id': 'cm_$n',
      'channelId': 'ch_exec',
      'senderUserId': userIdFor('EMP-0028'),
      'type': 'TEXT',
      'body': 'Board pack is ready. Please look at the two licence files that run out this month.',
      'createdAt': store.nowIso(),
      'editedAt': null,
      'deletedAt': null,
      'pinned': false,
      'isUrgent': false,
      'clientMsgId': 'sim_$n',
      'reactions': <Json>[],
      'directiveId': null,
    };
    store.put(Col.chatMessages, msg);
    final target = notifyUserId ?? userIdFor('EMP-0001');
    NotificationEngine.notify(
      store,
      userId: target,
      type: 'CHAT_MESSAGE',
      title: const Bi('Leadership', 'নেতৃত্ব'),
      body: Bi(msg.str('body'), msg.str('body')),
      data: const {'module': 'chat', 'route': '/home/chat/ch_exec'},
    );
    return msg;
  }
}
