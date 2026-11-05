import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Broadcast banner, LOTO permits and shift handovers for the Home dashboard.
void seedHomeOps(MockStore store) {
  store
    ..put(Col.broadcasts, {
      'id': 'bc_1',
      'title': 'Friday plant shutdown window',
      'titleBn': 'শুক্রবার প্ল্যান্ট বন্ধ',
      'body':
          'Keraniganj unit 2 stops 06:00–10:00 Friday for the annual safety '
          'drill. Staff buses run on the usual timetable.',
      'bodyBn':
          'কেরানীগঞ্জ ইউনিট ২ শুক্রবার সকাল ৬–১০টা বার্ষিক নিরাপত্তা মহড়ার '
          'জন্য বন্ধ থাকবে। স্টাফ বাস স্বাভাবিক সময়ে চলবে।',
      'authorUserId': userIdFor('EMP-0001'),
      'publishedAt': '2026-11-03T08:00:00.000Z',
      'pinned': true,
    })
    ..put(Col.workPermits, {
      'id': 'wp_1',
      'machine': 'Boiler feed pump A',
      'machineBn': 'বয়লার ফিড পাম্প ক',
      'kind': 'LOTO',
      'status': 'LOCKED',
      'siteId': 'site_plant',
      'holderUserId': userIdFor('EMP-0012'),
      'note': 'Bearing replacement. Restore only after the lock-box is empty.',
      'noteBn': 'বেয়ারিং বদল। লক-বক্স খালি হলেই চালু করুন।',
      'lockedAt': '2026-11-04T02:10:00.000Z',
    })
    ..put(Col.workPermits, {
      'id': 'wp_2',
      'machine': 'Loading gantry 3',
      'machineBn': 'লোডিং গ্যান্ট্রি ৩',
      'kind': 'HOT_WORK',
      'status': 'ACTIVE',
      'siteId': 'site_plant',
      'holderUserId': userIdFor('EMP-1104'),
      'note': 'Welding on the drip tray. Fire watch is on site.',
      'noteBn': 'ড্রিপ ট্রেতে ওয়েল্ডিং। ফায়ার ওয়াচ উপস্থিত।',
      'lockedAt': '2026-11-04T04:00:00.000Z',
    })
    ..put(Col.workPermits, {
      'id': 'wp_3',
      'machine': 'Tank farm valve V-12',
      'machineBn': 'ট্যাংক ফার্ম ভালভ ভি-১২',
      'kind': 'LOTO',
      'status': 'RESTORED',
      'siteId': 'site_plant',
      'holderUserId': userIdFor('EMP-0012'),
      'note': 'Restored after yesterday’s isolation.',
      'noteBn': 'গতকালের আইসোলেশনের পর চালু।',
      'lockedAt': '2026-11-03T18:00:00.000Z',
      'restoredAt': '2026-11-04T01:20:00.000Z',
    })
    ..put(Col.shiftHandovers, {
      'id': 'ho_1',
      'outgoingUserId': userIdFor('EMP-0012'),
      'incomingUserId': userIdFor('EMP-1104'),
      'siteId': 'site_plant',
      'shiftLabel': 'Night to morning',
      'shiftLabelBn': 'রাত থেকে সকাল',
      'notes':
          'Unit 2 on reduced load. Pump A still locked. Night watch logged '
          'one near-miss at the gantry — already in Incidents.',
      'notesBn':
          'ইউনিট ২ কম লোডে। পাম্প ক এখনও লক। রাতের পাহারায় গ্যান্ট্রিতে '
          'একটি নিয়ার-মিস — দুর্ঘটনায় নথিভুক্ত।',
      'status': 'WAITING_SIGNATURE',
      'createdAt': '2026-11-04T05:50:00.000Z',
      'signedAt': null,
    })
    ..put(Col.workPermits, {
      'id': 'wp_4',
      'machine': 'Bitumen pump B',
      'machineBn': 'বিটুমিন পাম্প খ',
      'kind': 'LOTO',
      'status': 'LOCKED',
      'siteId': 'site_plant',
      'holderUserId': userIdFor('EMP-0012'),
      'note': 'Seal leak. Restore only after the new seal is torqued.',
      'noteBn': 'সিল লিক। নতুন সিল টাইট হলেই চালু করুন।',
      'lockedAt': '2026-11-04T06:40:00.000Z',
    })
    ..put(Col.workPermits, {
      'id': 'wp_5',
      'machine': 'Filling line 2',
      'machineBn': 'ফিলিং লাইন ২',
      'kind': 'LOTO',
      'status': 'LOCKED',
      'siteId': 'site_plant',
      'holderUserId': userIdFor('EMP-0012'),
      'note': 'Guard missing on the drum filler. Fit the guard before start.',
      'noteBn': 'ড্রাম ফিলারে গার্ড নেই। চালুর আগে গার্ড লাগান।',
      'lockedAt': '2026-11-04T08:15:00.000Z',
    });
}
