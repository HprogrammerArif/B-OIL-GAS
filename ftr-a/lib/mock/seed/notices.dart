import 'package:bogcl_oneops/mock/engines/notice_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

typedef _Seed = ({
  String ref,
  String title,
  String titleBn,
  String body,
  String bodyBn,
  String category,
  String priority,
  bool ack,
  bool pinned,
  String author,
  int daysAgo,
  String audience,
});

const List<_Seed> _seeds = [
  (
    ref: 'NOT-2026-0018',
    title: 'Plant safety: mandatory PPE on the loading bay',
    titleBn: 'প্ল্যান্ট নিরাপত্তা: লোডিং বে-তে পিপিই বাধ্যতামূলক',
    body:
        'Effective immediately, helmets, safety shoes and high-visibility '
        'vests are mandatory for everyone entering the loading bay, '
        'including visitors and drivers.\n\nSecurity will refuse entry '
        'without PPE. Spare kits are available at Gate 2. Please confirm '
        'that you have read and understood this notice.',
    bodyBn:
        'অবিলম্বে কার্যকর: লোডিং বে-তে প্রবেশকারী সকলের জন্য, দর্শনার্থী ও '
        'চালকসহ, হেলমেট, সেফটি জুতা ও হাই-ভিজিবিলিটি ভেস্ট বাধ্যতামূলক।\n\n'
        'পিপিই ছাড়া নিরাপত্তা কর্মীরা প্রবেশ করতে দেবেন না। গেট ২-এ অতিরিক্ত '
        'কিট রয়েছে। অনুগ্রহ করে নোটিশটি পড়েছেন ও বুঝেছেন তা নিশ্চিত করুন।',
    category: 'SAFETY',
    priority: 'CRITICAL',
    ack: true,
    pinned: true,
    author: 'EMP-0012',
    daysAgo: 1,
    audience: 'ALL',
  ),
  (
    ref: 'NOT-2026-0017',
    title: 'Message from the Chairman: record Q3 dispatch',
    titleBn: 'চেয়ারম্যানের বার্তা: তৃতীয় প্রান্তিকে রেকর্ড ডিসপ্যাচ',
    body:
        'Thank you all. Together we dispatched our highest ever quarterly '
        'volume while keeping our safety record intact. The plant, '
        'transport and sales teams carried this result.\n\nLet us finish '
        'the year with the same discipline.',
    bodyBn:
        'সবাইকে ধন্যবাদ। নিরাপত্তা রেকর্ড অক্ষুণ্ণ রেখে আমরা এযাবৎকালের সর্বোচ্চ '
        'ত্রৈমাসিক ডিসপ্যাচ সম্পন্ন করেছি। প্ল্যান্ট, পরিবহন ও বিক্রয় দলের '
        'অবদানেই এটি সম্ভব হয়েছে।\n\nএকই শৃঙ্খলা নিয়ে বছরটি শেষ করি।',
    category: 'EXECUTIVE',
    priority: 'HIGH',
    ack: false,
    pinned: true,
    author: 'EMP-0001',
    daysAgo: 3,
    audience: 'ALL',
  ),
  (
    ref: 'NOT-2026-0016',
    title: 'Winter office hours from 1 December',
    titleBn: '১ ডিসেম্বর থেকে শীতকালীন অফিস সময়',
    body:
        'From 1 December, head office hours are 09:00 to 17:30 on working '
        'days. Plant shifts are unchanged. Staff buses follow the revised '
        'timetable published by Transport.',
    bodyBn:
        '১ ডিসেম্বর থেকে প্রধান কার্যালয়ের কর্মদিবসের সময় সকাল ৯:০০ থেকে '
        'বিকেল ৫:৩০। প্ল্যান্টের শিফট অপরিবর্তিত। স্টাফ বাস পরিবহন বিভাগের '
        'সংশোধিত সময়সূচি অনুসরণ করবে।',
    category: 'ADMIN',
    priority: 'NORMAL',
    ack: false,
    pinned: false,
    author: 'EMP-0028',
    daysAgo: 6,
    audience: 'ALL',
  ),
  (
    ref: 'NOT-2026-0015',
    title: 'Quarter-end reconciliation: submit claims by 25 Nov',
    titleBn: 'প্রান্তিক সমন্বয়: ২৫ নভেম্বরের মধ্যে দাবি জমা দিন',
    body:
        'Finance will close the quarter on 30 November. All TA/DA, '
        'conveyance and tour claims must be submitted by 25 November with '
        'receipts attached to be paid in this cycle.',
    bodyBn:
        'অর্থ বিভাগ ৩০ নভেম্বর প্রান্তিক সমাপ্ত করবে। এই চক্রে পরিশোধ পেতে '
        'সকল টিএ/ডিএ, যাতায়াত ও ভ্রমণ দাবি রসিদসহ ২৫ নভেম্বরের মধ্যে জমা দিন।',
    category: 'GENERAL',
    priority: 'HIGH',
    ack: true,
    pinned: false,
    author: 'EMP-0062',
    daysAgo: 9,
    audience: 'ALL',
  ),
  (
    ref: 'NOT-2026-0014',
    title: 'Sales review: dealer targets for December',
    titleBn: 'বিক্রয় পর্যালোচনা: ডিসেম্বরের ডিলার লক্ষ্যমাত্রা',
    body:
        'Sales team: December dealer targets are shared in the review '
        'meeting on Sunday 10:30 at Head Office, 4th floor. Bring your '
        'territory pipeline.',
    bodyBn:
        'বিক্রয় দল: ডিসেম্বরের ডিলার লক্ষ্যমাত্রা রবিবার সকাল ১০:৩০-এ প্রধান '
        'কার্যালয়ের ৪র্থ তলায় পর্যালোচনা সভায় জানানো হবে। আপনার এলাকার '
        'পাইপলাইন সঙ্গে আনুন।',
    category: 'OPERATIONS',
    priority: 'NORMAL',
    ack: false,
    pinned: false,
    author: 'EMP-0062',
    daysAgo: 12,
    audience: 'dept_sales',
  ),
  (
    ref: 'NOT-2026-0012',
    title: 'Fire drill at Keraniganj Plant on Thursday',
    titleBn: 'বৃহস্পতিবার কেরানীগঞ্জ প্ল্যান্টে ফায়ার ড্রিল',
    body:
        'A plant-wide fire drill is planned on Thursday at 11:00. Follow '
        'your floor warden to the assembly point at Gate 1. Drivers on '
        'the road need not return.',
    bodyBn:
        'বৃহস্পতিবার সকাল ১১:০০-এ সমগ্র প্ল্যান্টে ফায়ার ড্রিল হবে। ফ্লোর '
        'ওয়ার্ডেনকে অনুসরণ করে গেট ১-এর সমাবেশস্থলে যান। সড়কে থাকা চালকদের '
        'ফিরতে হবে না।',
    category: 'SAFETY',
    priority: 'HIGH',
    ack: true,
    pinned: false,
    author: 'EMP-0012',
    daysAgo: 15,
    audience: 'site_plant',
  ),
];

/// Published notices with per-recipient receipts. Personas have a mix of read
/// and unread items so every state shows in the app.
void seedNotices(MockStore store) {
  final nowMs = store.nowMs();
  const dayMs = 24 * 60 * 60 * 1000;
  final unread = <String, Set<String>>{
    'EMP-1042': {'NOT-2026-0018', 'NOT-2026-0017', 'NOT-2026-0014'},
    'EMP-0821': {'NOT-2026-0018', 'NOT-2026-0016'},
    'EMP-0045': {'NOT-2026-0018'},
    'EMP-0062': {'NOT-2026-0016'},
  };
  for (final s in _seeds) {
    final id = 'not_${s.ref.substring(s.ref.length - 4)}';
    final at = DateTime.fromMillisecondsSinceEpoch(
      nowMs - s.daysAgo * dayMs,
      isUtc: true,
    );
    final audience = s.audience == 'ALL'
        ? {'type': 'ALL', 'ids': <String>[]}
        : {
            'type': s.audience.startsWith('dept') ? 'DEPARTMENT' : 'SITE',
            'ids': [s.audience],
          };
    store.put(Col.notices, {
      'id': id,
      'refNo': s.ref,
      'title': s.title,
      'titleBn': s.titleBn,
      'body': s.body,
      'bodyBn': s.bodyBn,
      'category': s.category,
      'priority': s.priority,
      'requiresAck': s.ack,
      'isPinned': s.pinned,
      'status': 'PUBLISHED',
      'audience': audience,
      'authorEmployeeId': empId(s.author),
      'publishedAt': at.toIso8601String(),
      'expiresAt': at.add(const Duration(days: 90)).toIso8601String(),
    });
    var i = 0;
    for (final e in NoticeEngine.resolveAudience(store, audience)) {
      final code = e.str('empCode');
      final isUnread = unread[code]?.contains(s.ref) ?? false;
      final read = !isUnread && (code == 'EMP-0001' || (i++ % 3 != 0));
      final acked = read && s.ack && (code == 'EMP-0001' || i % 2 == 0);
      store.put(Col.noticeReceipts, {
        'id': NoticeEngine.receiptId(id, e.str('id')),
        'noticeId': id,
        'employeeId': e['id'],
        'readAt': read
            ? at.add(const Duration(hours: 3)).toIso8601String()
            : null,
        'ackedAt': acked
            ? at.add(const Duration(hours: 5)).toIso8601String()
            : null,
      });
    }
  }
}
