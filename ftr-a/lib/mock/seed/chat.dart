import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _mem(String code, {bool admin = false, String presence = 'AWAY'}) => {
  'userId': userIdFor(code),
  'isAdmin': admin,
  'presence': presence,
};

void seedChat(MockStore store) {
  store
    ..put(Col.chatChannels, {
      'id': 'ch_exec',
      'key': 'executive-leadership',
      'name': 'Leadership',
      'nameBn': 'নেতৃত্ব',
      'isLocked': true,
      'isDirect': false,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0012', presence: 'ONLINE'),
        _mem('EMP-0028', presence: 'ONLINE'),
        _mem('EMP-0062', presence: 'IN_MEETING'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'ch_ops',
      'key': 'factory-operations',
      'name': 'Plant operations',
      'nameBn': 'প্ল্যান্ট অপারেশন',
      'isLocked': false,
      'isDirect': false,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0012', admin: true, presence: 'ONLINE'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'ch_fin',
      'key': 'finance-and-purchases',
      'name': 'Finance and purchases',
      'nameBn': 'অর্থ ও ক্রয়',
      'isLocked': false,
      'isDirect': false,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0062', admin: true, presence: 'ONLINE'),
        _mem('EMP-0028', presence: 'ONLINE'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'ch_lic',
      'key': 'permits-and-compliance',
      'name': 'Permits',
      'nameBn': 'অনুমতি',
      'isLocked': true,
      'isDirect': false,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0012', presence: 'ONLINE'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'dm_usr_0001_usr_0012',
      'key': 'dm_usr_0001_usr_0012',
      'name': 'Direct',
      'nameBn': 'সরাসরি',
      'isLocked': false,
      'isDirect': true,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0012', admin: true, presence: 'ONLINE'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'dm_usr_0001_usr_0062',
      'key': 'dm_usr_0001_usr_0062',
      'name': 'Direct',
      'nameBn': 'সরাসরি',
      'isLocked': false,
      'isDirect': true,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0062', admin: true, presence: 'ONLINE'),
      ],
    })
    ..put(Col.chatChannels, {
      'id': 'dm_usr_0001_usr_0028',
      'key': 'dm_usr_0001_usr_0028',
      'name': 'Direct',
      'nameBn': 'সরাসরি',
      'isLocked': false,
      'isDirect': true,
      'members': [
        _mem('EMP-0001', admin: true, presence: 'ONLINE'),
        _mem('EMP-0028', admin: true, presence: 'IN_MEETING'),
      ],
    });

  void msg(
    String id,
    String ch,
    String from,
    String body, {
    String at = '2026-11-03T08:10:00.000Z',
    bool pin = false,
    String? dir,
  }) {
    store.put(Col.chatMessages, {
      'id': id,
      'channelId': ch,
      'senderUserId': userIdFor(from),
      'type': dir == null ? 'TEXT' : 'DIRECTIVE',
      'body': body,
      'createdAt': at,
      'editedAt': null,
      'deletedAt': null,
      'pinned': pin,
      'isUrgent': dir != null,
      'clientMsgId': id,
      'reactions': <Json>[],
      'directiveId': dir,
    });
  }

  store.put(Col.chatDirectives, {
    'id': 'dir_1',
    'refNo': 'BOGCL-DIR-2026-0001',
    'channelId': 'ch_exec',
    'title': 'Close the two permits that run out this month',
    'body': 'Plant GM and Finance: the explosives magazine and boiler files must be on my desk before the 20th. Acknowledge when you have the next step.',
    'issuerUserId': userIdFor('EMP-0001'),
    'issuedAt': '2026-11-02T07:00:00.000Z',
    'dueAt': '2026-11-20',
    'priority': 'HIGH',
    'requireAckFrom': [
      userIdFor('EMP-0012'),
      userIdFor('EMP-0028'),
      userIdFor('EMP-0062'),
    ],
    'acknowledgements': [
      {'userId': userIdFor('EMP-0028'), 'at': '2026-11-02T09:15:00.000Z'},
    ],
    'executedAt': null,
  });

  msg(
    'cm_1',
    'ch_exec',
    'EMP-0001',
    'Morning. Two permits run out this month. I have issued a directive — acknowledge it today.',
    at: '2026-11-02T07:05:00.000Z',
  );
  msg(
    'cm_2',
    'ch_exec',
    'EMP-0001',
    'Close the two permits that run out this month',
    at: '2026-11-02T07:06:00.000Z',
    pin: true,
    dir: 'dir_1',
  );
  msg(
    'cm_3',
    'ch_exec',
    'EMP-0028',
    'Acknowledged. HR will keep the exit file for Nazmul on the same track so desks do not clash.',
    at: '2026-11-02T09:16:00.000Z',
  );
  msg(
    'cm_4',
    'ch_ops',
    'EMP-0012',
    'Night shift handover is clean. Boiler inspector is booked for Thursday.',
    at: '2026-11-03T05:40:00.000Z',
  );
  msg(
    'cm_5',
    'ch_fin',
    'EMP-0062',
    'Licence fee for the explosives magazine is in my queue. I will clear it this morning.',
    at: '2026-11-03T06:20:00.000Z',
  );
  msg(
    'cm_6',
    'dm_usr_0001_usr_0012',
    'EMP-0012',
    'Sir, Batch B-88 Bitumen 60/70 passed BDS 1238 lab certification at Keraniganj Refinery. Ready for commercial dispatch.',
    at: '2026-11-03T07:15:00.000Z',
  );
  msg(
    'cm_7',
    'dm_usr_0001_usr_0062',
    'EMP-0062',
    'Chairman Sir, the Tk 32.0L Bitumen Storage Tank TK-109 Note-Sheet is verified by Finance and placed in your E-Sign queue.',
    at: '2026-11-03T07:45:00.000Z',
  );
  msg(
    'cm_8',
    'dm_usr_0001_usr_0028',
    'EMP-0028',
    'Morning attendance across Baridhara HQ and Keraniganj Plant is 96.4% on time today.',
    at: '2026-11-03T08:05:00.000Z',
  );

  store.put(Col.briefings, {
    'id': 'vb_1',
    'refNo': 'VB-2026-0001',
    'title': 'Week of 3 November — permits and plant',
    'titleBn': '৩ নভেম্বরের সপ্তাহ — অনুমতি ও প্ল্যান্ট',
    'transcript': 'Two permits run out this month. Plant GM owns the file; Finance clears the fee. No lost-time injury since mid-September. Keep the exit for Nazmul moving so we do not hold a badge after the 20th.',
    'transcriptBn': 'এই মাসে দুটি অনুমতি শেষ হচ্ছে। প্ল্যান্ট জিএম ফাইল দেখবেন; অর্থ ফি মিটাবেন। সেপ্টেম্বর মাঝামাঝি থেকে কাজ হারানো আঘাত নেই। নাজমুলের প্রস্থান এগিয়ে রাখুন যাতে ২০ তারিখের পর ব্যাজ না থাকে।',
    'authorUserId': userIdFor('EMP-0001'),
    'publishedAt': '2026-11-03T06:00:00.000Z',
    'priority': 'HIGH',
  });
}
