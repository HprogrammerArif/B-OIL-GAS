import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

const int _minute = 60 * 1000;
const int _hour = 60 * _minute;
const int _day = 24 * _hour;

/// Seeds an inbox per persona. Relative to "now" so the feed always looks live.
/// `route` values are filled by the modules that own the objects.
void seedNotifications(MockStore store) {
  final now = store.nowMs();

  void add(
    String code, {
    required String type,
    required Bi title,
    required Bi body,
    required int agoMs,
    String priority = 'NORMAL',
    String? module,
    bool read = false,
    bool ackRequired = false,
  }) {
    NotificationEngine.notify(
      store,
      userId: userIdFor(code),
      type: type,
      title: title,
      body: body,
      priority: priority,
      ackRequired: ackRequired,
      read: read,
      createdAtMs: now - agoMs,
      data: module == null ? null : {'module': module},
    );
  }

  // Employee
  add(
    'EMP-1042',
    type: 'NOTICE_ACK_REQUIRED',
    priority: 'CRITICAL',
    ackRequired: true,
    module: 'notices',
    agoMs: 20 * _minute,
    title: const Bi(
      'Safety stand-down: acknowledge required',
      'নিরাপত্তা স্ট্যান্ড-ডাউন: স্বীকৃতি প্রয়োজন',
    ),
    body: const Bi(
      'All Keraniganj staff must acknowledge the revised hot-work permit '
          'procedure before the next shift.',
      'পরবর্তী শিফটের আগে কেরানীগঞ্জের সব কর্মীকে সংশোধিত হট-ওয়ার্ক পারমিট '
          'পদ্ধতি স্বীকার করতে হবে।',
    ),
  );
  add(
    'EMP-1042',
    type: 'LEAVE_DECIDED',
    priority: 'HIGH',
    module: 'leave',
    agoMs: 3 * _hour,
    title: const Bi('Leave approved', 'ছুটি অনুমোদিত'),
    body: const Bi(
      'Your casual leave for 12-13 Nov was approved by your line manager.',
      'আপনার ১২-১৩ নভেম্বরের নৈমিত্তিক ছুটি লাইন ম্যানেজার অনুমোদন করেছেন।',
    ),
  );
  add(
    'EMP-1042',
    type: 'BUS_OFFER',
    module: 'bus',
    agoMs: 5 * _hour,
    title: const Bi('Seat available on route R-04', 'রুট R-04 এ আসন খালি'),
    body: const Bi(
      'A seat opened on the 6:45 AM Mirpur to Plant bus tomorrow. Confirm '
          'within 30 minutes.',
      'আগামীকালের সকাল ৬:৪৫ মিরপুর থেকে প্ল্যান্ট বাসে একটি আসন খালি হয়েছে। '
          '৩০ মিনিটের মধ্যে নিশ্চিত করুন।',
    ),
  );
  add(
    'EMP-1042',
    type: 'CLAIM_DECIDED',
    module: 'claims',
    agoMs: 1 * _day + 2 * _hour,
    read: true,
    title: const Bi('Claim approved', 'ক্লেইম অনুমোদিত'),
    body: const Bi(
      'Conveyance claim CLM-2026-0412 (৳1,850) was approved and is queued '
          'for payment.',
      'যাতায়াত ক্লেইম CLM-2026-0412 (৳১,৮৫০) অনুমোদিত হয়েছে এবং পেমেন্টের '
          'অপেক্ষায় আছে।',
    ),
  );
  add(
    'EMP-1042',
    type: 'NOTICE_PUBLISHED',
    module: 'notices',
    agoMs: 2 * _day,
    read: true,
    title: const Bi(
      'Notice: Eid holiday schedule',
      'বিজ্ঞপ্তি: ঈদের ছুটির সূচি',
    ),
    body: const Bi(
      'The Eid-ul-Adha holiday schedule for all sites has been published.',
      'সব সাইটের জন্য ঈদুল আযহার ছুটির সূচি প্রকাশিত হয়েছে।',
    ),
  );
  add(
    'EMP-1042',
    type: 'ATT_REGULARISATION',
    module: 'attendance',
    agoMs: 3 * _day,
    read: true,
    title: const Bi('Attendance regularised', 'উপস্থিতি নিয়মিতকরণ সম্পন্ন'),
    body: const Bi(
      'Your missed punch for 29 Oct was regularised by HR.',
      '২৯ অক্টোবরের মিসড পাঞ্চ এইচআর নিয়মিত করেছে।',
    ),
  );
  add(
    'EMP-1042',
    type: 'BROADCAST',
    module: 'notices',
    agoMs: 5 * _day,
    read: true,
    title: const Bi('Welcome to OneOps', 'ওয়ানঅপসে স্বাগতম'),
    body: const Bi(
      'Attendance, leave, claims and bus booking are now in one app.',
      'উপস্থিতি, ছুটি, ক্লেইম ও বাস বুকিং এখন এক অ্যাপে।',
    ),
  );

  // Chairman
  add(
    'EMP-0001',
    type: 'APPROVAL_PENDING',
    priority: 'HIGH',
    module: 'note-sheets',
    agoMs: 40 * _minute,
    title: const Bi(
      'Approval needed: BOGCL/PROC/2026/0894',
      'অনুমোদন প্রয়োজন: BOGCL/PROC/2026/0894',
    ),
    body: const Bi(
      'Generator overhaul ৳48,50,000 awaits your signature.',
      'জেনারেটর ওভারহলিং ৳৪৮,৫০,০০০ আপনার স্বাক্ষরের অপেক্ষায়।',
    ),
  );
  add(
    'EMP-0001',
    type: 'INCIDENT_CRITICAL',
    priority: 'CRITICAL',
    ackRequired: true,
    module: 'incidents',
    agoMs: 4 * _hour,
    title: const Bi(
      'Critical incident at Keraniganj Plant',
      'কেরানীগঞ্জ প্ল্যান্টে জরুরি ঘটনা',
    ),
    body: const Bi(
      'A high-risk gas leak near Tank 3 was reported and is being contained.',
      'ট্যাংক ৩ এর কাছে উচ্চ ঝুঁকির গ্যাস লিক রিপোর্ট হয়েছে এবং নিয়ন্ত্রণ করা '
          'হচ্ছে।',
    ),
  );
  add(
    'EMP-0001',
    type: 'APPROVAL_DECIDED',
    module: 'note-sheets',
    agoMs: 1 * _day,
    read: true,
    title: const Bi('Note sheet approved', 'নোট শিট অনুমোদিত'),
    body: const Bi(
      'BOGCL/ADM/2026/0771 completed all signatures.',
      'BOGCL/ADM/2026/0771 এর সব স্বাক্ষর সম্পন্ন হয়েছে।',
    ),
  );

  // Plant GM
  add(
    'EMP-0012',
    type: 'INCIDENT_REPORTED',
    priority: 'HIGH',
    module: 'incidents',
    agoMs: 4 * _hour + 5 * _minute,
    title: const Bi('New incident reported', 'নতুন ঘটনা রিপোর্ট করা হয়েছে'),
    body: const Bi(
      'Gas leak near Tank 3 reported by the shift supervisor.',
      'শিফট সুপারভাইজার ট্যাংক ৩ এর কাছে গ্যাস লিক রিপোর্ট করেছেন।',
    ),
  );
  add(
    'EMP-0012',
    type: 'APPROVAL_PENDING',
    priority: 'HIGH',
    module: 'workflow',
    agoMs: 2 * _hour,
    title: const Bi('Leave approval pending', 'ছুটির অনুমোদন অপেক্ষমাণ'),
    body: const Bi(
      '3 leave requests from your team need a decision.',
      'আপনার দলের ৩টি ছুটির আবেদনে সিদ্ধান্ত প্রয়োজন।',
    ),
  );
  add(
    'EMP-0012',
    type: 'FLEET_DOC_DUE',
    module: 'fleet',
    agoMs: 2 * _day,
    read: true,
    title: const Bi('Vehicle document due', 'যানবাহনের নথির মেয়াদ শেষ হচ্ছে'),
    body: const Bi(
      'Fitness certificate for DM-GA-11-4521 expires in 9 days.',
      'DM-GA-11-4521 এর ফিটনেস সার্টিফিকেট ৯ দিনে শেষ হবে।',
    ),
  );

  // HR admin
  add(
    'EMP-0028',
    type: 'ATT_REGULARISATION',
    priority: 'HIGH',
    module: 'attendance',
    agoMs: 90 * _minute,
    title: const Bi('5 regularisation requests', '৫টি নিয়মিতকরণ আবেদন'),
    body: const Bi(
      'Employees have submitted missed-punch regularisations for review.',
      'কর্মীরা পর্যালোচনার জন্য মিসড-পাঞ্চ নিয়মিতকরণ আবেদন জমা দিয়েছেন।',
    ),
  );
  add(
    'EMP-0028',
    type: 'CLEARANCE_ITEM_PENDING',
    module: 'clearance',
    agoMs: 1 * _day,
    read: true,
    title: const Bi('Exit clearance pending', 'এক্সিট ক্লিয়ারেন্স অপেক্ষমাণ'),
    body: const Bi(
      'HR items for one departing employee are awaiting your action.',
      'একজন বিদায়ী কর্মীর এইচআর আইটেম আপনার পদক্ষেপের অপেক্ষায়।',
    ),
  );

  // Transport admin
  add(
    'EMP-0045',
    type: 'FLEET_REQ_ENDORSE',
    priority: 'HIGH',
    module: 'fleet',
    agoMs: 30 * _minute,
    title: const Bi(
      'Vehicle request to assign',
      'যানবাহনের অনুরোধ বরাদ্দ করুন',
    ),
    body: const Bi(
      'An approved requisition for tomorrow 8:00 AM needs a vehicle and driver.',
      'আগামীকাল সকাল ৮:০০ এর অনুমোদিত অনুরোধে গাড়ি ও চালক বরাদ্দ প্রয়োজন।',
    ),
  );
  add(
    'EMP-0045',
    type: 'PARCEL_AT_GATE',
    module: 'parcels',
    agoMs: 6 * _hour,
    title: const Bi('Parcel at gate', 'পার্সেল গেটে পৌঁছেছে'),
    body: const Bi(
      'A courier parcel is waiting at the main gate for mailroom handover.',
      'মেইলরুমে হস্তান্তরের জন্য একটি কুরিয়ার পার্সেল প্রধান গেটে অপেক্ষা করছে।',
    ),
  );

  // HOD Finance
  add(
    'EMP-0062',
    type: 'CLAIM_SUBMITTED',
    priority: 'HIGH',
    module: 'claims',
    agoMs: 1 * _hour,
    title: const Bi('Claims awaiting approval', 'অনুমোদনের অপেক্ষায় ক্লেইম'),
    body: const Bi(
      '4 claims from your department need review.',
      'আপনার বিভাগের ৪টি ক্লেইম পর্যালোচনা প্রয়োজন।',
    ),
  );
  add(
    'EMP-0062',
    type: 'NOTE_SHEET_SIGN_REQUIRED',
    module: 'note-sheets',
    agoMs: 1 * _day,
    read: true,
    title: const Bi('Signature required', 'স্বাক্ষর প্রয়োজন'),
    body: const Bi(
      'Note sheet BOGCL/FIN/2026/0310 is waiting for your signature.',
      'নোট শিট BOGCL/FIN/2026/0310 আপনার স্বাক্ষরের অপেক্ষায়।',
    ),
  );

  // Driver
  add(
    'EMP-0821',
    type: 'FLEET_ASSIGNED',
    priority: 'HIGH',
    module: 'fleet',
    agoMs: 45 * _minute,
    title: const Bi('New trip assigned', 'নতুন ট্রিপ বরাদ্দ হয়েছে'),
    body: const Bi(
      'Trip to Chattogram Terminal departs tomorrow at 6:00 AM.',
      'চট্টগ্রাম টার্মিনালের ট্রিপ আগামীকাল সকাল ৬:০০ টায় ছাড়বে।',
    ),
  );
  add(
    'EMP-0821',
    type: 'SYSTEM',
    agoMs: 2 * _day,
    read: true,
    title: const Bi('Welcome to OneOps', 'ওয়ানঅপসে স্বাগতম'),
    body: const Bi(
      'Your trips and duty hours will appear here.',
      'আপনার ট্রিপ ও ডিউটির সময় এখানে দেখা যাবে।',
    ),
  );

  add(
    'EMP-0001',
    type: 'NOTE_SHEET_TO_SIGN',
    priority: 'HIGH',
    module: 'note-sheets',
    agoMs: 40 * _minute,
    title: const Bi(
      'Four files are waiting for you',
      'চারটি ফাইল আপনার অপেক্ষায়',
    ),
    body: const Bi(
      'Tank, fire main, laboratory and generator files need your signature.',
      'ট্যাংক, ফায়ার মেইন, ল্যাবরেটরি ও জেনারেটরের ফাইলে আপনার স্বাক্ষর লাগবে।',
    ),
  );
  add(
    'EMP-0012',
    type: 'PERMIT_LOCKED',
    priority: 'HIGH',
    module: 'home',
    agoMs: 90 * _minute,
    title: const Bi('Three machines are locked out', 'তিনটি মেশিন লক-আউট'),
    body: const Bi(
      'Pump A, pump B and filling line 2 are still locked.',
      'পাম্প ক, পাম্প খ এবং ফিলিং লাইন ২ এখনও লক।',
    ),
  );
  add(
    'EMP-0028',
    type: 'EXIT_OPENED',
    module: 'people',
    agoMs: 3 * _hour,
    title: const Bi('Two more people are leaving', 'আরও দুজন যাচ্ছেন'),
    body: const Bi(
      'Tariqul Islam and Mizanur Rahman have open exit files.',
      'তরিকুল ইসলাম ও মিজানুর রহমানের প্রস্থান ফাইল খোলা।',
    ),
  );
  add(
    'EMP-0045',
    type: 'FLEET_REQ_ENDORSE',
    module: 'fleet',
    agoMs: 2 * _hour,
    title: const Bi('More cars need a driver', 'আরও গাড়িতে চালক লাগবে'),
    body: const Bi(
      'Mongla and Narayanganj are approved and still unassigned.',
      'মোংলা ও নারায়ণগঞ্জ অনুমোদিত, এখনও চালক হয়নি।',
    ),
  );
  add(
    'EMP-0062',
    type: 'NOTE_SHEET_TO_SIGN',
    priority: 'HIGH',
    module: 'note-sheets',
    agoMs: 25 * _minute,
    title: const Bi('New files from Sales', 'বিক্রয় থেকে নতুন ফাইল'),
    body: const Bi(
      'Stationery, uniforms and printers are waiting for your decision.',
      'স্টেশনারি, ইউনিফর্ম ও প্রিন্টার আপনার সিদ্ধান্তের অপেক্ষায়।',
    ),
  );
  add(
    'EMP-1042',
    type: 'LEAVE_SUBMITTED',
    module: 'leave',
    agoMs: 15 * _minute,
    title: const Bi('Sick leave is with Finance', 'অসুস্থতার ছুটি অর্থ বিভাগে'),
    body: const Bi(
      'Farida Begum still has your one-day sick leave.',
      'আপনার এক দিনের অসুস্থতার ছুটি এখনও ফরিদা বেগমের কাছে।',
    ),
  );
  add(
    'EMP-0821',
    type: 'LEAVE_SUBMITTED',
    module: 'leave',
    agoMs: 50 * _minute,
    title: const Bi('Casual leave sent', 'নৈমিত্তিক ছুটি পাঠানো হয়েছে'),
    body: const Bi(
      'Transport has your Savar leave for the school interview.',
      'স্কুলের সাক্ষাৎকারের সাভার ছুটি পরিবহনের কাছে।',
    ),
  );
}
