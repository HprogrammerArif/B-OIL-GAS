import 'package:bogcl_oneops/mock/engines/claim_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_photo.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _line(
  String id,
  String category,
  int daysAgo,
  String description,
  num amount, {
  bool declaration = false,
  int? nights,
  double? km,
  String? from,
  String? to,
  bool receipt = false,
}) => {
  'id': id,
  'category': category,
  'date': WorkCalendar.addDays(WorkCalendar.today(), -daysAgo),
  'description': description,
  'amount': amount,
  'system': false,
  'isDeclaration': declaration,
  'nights': ?nights,
  'distanceKm': ?km,
  'fromPlace': ?from,
  'toPlace': ?to,
  if (receipt) 'receiptFileId': 'rcpt_seed_$id',
};

Json _claim({
  required String id,
  required String no,
  required String type,
  required String emp,
  required String purpose,
  required String status,
  required List<Json> lines,
  required int createdDaysAgo,
  int? startAgo,
  int? endAgo,
  String? depart,
  String? ret,
  int? departAgo,
  int? returnAgo,
  String? destination,
  String? place,
  String? mode,
  String? comment,
  String? voucher,
  int? paidDaysAgo,
}) {
  final today = WorkCalendar.today();
  final created = WorkCalendar.atTime(
    WorkCalendar.addDays(today, -createdDaysAgo),
    '11:00',
  ).toIso8601String();
  return {
    'id': id,
    'claimNo': no,
    'type': type,
    'employeeId': empId(emp),
    'purpose': purpose,
    'status': status,
    'lines': lines,
    'flags': <Json>[],
    'totalAmount': 0,
    'policyAmount': 0,
    'netSettlement': null,
    'advanceId': null,
    'workflowInstanceId': null,
    'voucherNo': voucher,
    'paidAt': paidDaysAgo == null
        ? null
        : WorkCalendar.atTime(
            WorkCalendar.addDays(today, -paidDaysAgo),
            '15:00',
          ).toIso8601String(),
    'submittedAt': status == 'DRAFT' ? null : created,
    'resubmits': 0,
    'reviewComment': comment,
    'createdAt': created,
    'updatedAt': created,
    if (type == 'CONVEYANCE') ...{
      'periodStart': WorkCalendar.addDays(today, -(startAgo ?? 0)),
      'periodEnd': WorkCalendar.addDays(today, -(endAgo ?? startAgo ?? 0)),
    } else ...{
      'departAt': WorkCalendar.atTime(
        WorkCalendar.addDays(today, -(departAgo ?? 0)),
        depart ?? '06:00',
      ).toIso8601String(),
      'returnAt': WorkCalendar.atTime(
        WorkCalendar.addDays(today, -(returnAgo ?? 0)),
        ret ?? '18:00',
      ).toIso8601String(),
      'destination': destination ?? 'OTHER',
      'destinationName': place,
      'travelMode': mode,
    },
  };
}

/// A plant officer who can file a claim, without joining the demo menu.
void _ensureClaimant(MockStore store, String code) {
  final emp = store.get(Col.employees, empId(code))!;
  final uid = userIdFor(code);
  emp['userId'] = uid;
  store.put(Col.employees, emp);
  if (store.get(Col.users, uid) != null) return;
  store.put(Col.users, {
    'id': uid,
    'email': emp['email'],
    'phone': normalisePhone(emp.str('phone')),
    'employeeId': emp['id'],
    'roles': ['EMPLOYEE'],
    'passwordDigest': demoPasswordSha256,
    'preferredLang': 'EN',
    'mfaEnabled': false,
    'lastLoginAt': null,
    'failedAttempts': 0,
    'lockedUntil': null,
    'isActive': true,
  });
}

/// Claims for the employee persona, plus three plant claims.
/// Khadija and Nazmul report to the Plant GM, so their open step is his.
/// Mizanur reports to the transport supervisor, so his stays on the plant list.
void seedClaims(MockStore store) {
  for (final code in ['EMP-0640', 'EMP-1104', 'EMP-0914']) {
    _ensureClaimant(store, code);
  }
  final claims = <Json>[
    _claim(
      id: 'clm_0031',
      no: 'CNV-2026-0031',
      type: 'CONVEYANCE',
      emp: 'EMP-1042',
      purpose: 'Dealer visits in Dhaka, previous month',
      status: 'SETTLED',
      startAgo: 38,
      endAgo: 35,
      createdDaysAgo: 30,
      voucher: 'VCH-2026-00112',
      paidDaysAgo: 18,
      lines: [
        _line(
          'a1',
          'CNG',
          38,
          'Baridhara to Motijheel dealer',
          420,
          declaration: true,
        ),
        _line(
          'a2',
          'RICKSHAW',
          37,
          'Local visit, Mirpur',
          180,
          declaration: true,
        ),
        _line('a3', 'RIDE_SHARE', 35, 'Airport to office', 1250, receipt: true),
      ],
    ),
    _claim(
      id: 'clm_0044',
      no: 'TADA-2026-0044',
      type: 'TADA',
      emp: 'EMP-1042',
      purpose: 'Dealer meet and stock audit, Chattogram',
      status: 'APPROVED',
      createdDaysAgo: 8,
      departAgo: 12,
      returnAgo: 10,
      depart: '06:00',
      ret: '14:00',
      destination: 'OTHER',
      place: 'Chattogram',
      mode: 'AC_TRAIN',
      lines: [
        _line(
          'b1',
          'TICKET',
          12,
          'AC train, Dhaka to Chattogram',
          1650,
          receipt: true,
        ),
        _line('b2', 'TICKET', 10, 'AC train, return', 1650, receipt: true),
        _line(
          'b3',
          'HOTEL',
          12,
          'Hotel, 2 nights',
          9800,
          nights: 2,
          receipt: true,
        ),
        _line(
          'b4',
          'MEALS',
          11,
          'Working lunch with dealers',
          850,
          declaration: true,
        ),
      ],
    ),
    _claim(
      id: 'clm_0034',
      no: 'CNV-2026-0034',
      type: 'CONVEYANCE',
      emp: 'EMP-1042',
      purpose: 'Customer visits, this month',
      status: 'PENDING_MANAGER',
      startAgo: 6,
      endAgo: 2,
      createdDaysAgo: 1,
      lines: [
        _line(
          'c1',
          'CNG',
          6,
          'Office to Tejgaon depot',
          360,
          declaration: true,
        ),
        _line(
          'c2',
          'MILEAGE',
          4,
          'Bike, depot round trip',
          0,
          km: 42.5,
          from: 'Baridhara',
          to: 'Narayanganj depot',
        ),
        _line(
          'c3',
          'RIDE_SHARE',
          2,
          'Client meeting, Gulshan',
          780,
          receipt: true,
        ),
      ],
    ),
    _claim(
      id: 'clm_0036',
      no: 'CNV-2026-0036',
      type: 'CONVEYANCE',
      emp: 'EMP-1042',
      purpose: 'Draft: Narayanganj visits',
      status: 'DRAFT',
      startAgo: 1,
      createdDaysAgo: 0,
      lines: [_line('d1', 'CNG', 1, 'Depot visit', 300, declaration: true)],
    ),
    _claim(
      id: 'clm_0029',
      no: 'TADA-2026-0029',
      type: 'TADA',
      emp: 'EMP-1042',
      purpose: 'Sylhet dealer visit',
      status: 'REJECTED',
      createdDaysAgo: 50,
      departAgo: 56,
      returnAgo: 55,
      depart: '07:00',
      ret: '20:00',
      destination: 'OTHER',
      place: 'Sylhet',
      mode: 'AC_BUS',
      comment: 'Visit was not on the approved tour plan. Please resubmit with the plan attached.',
      lines: [_line('e1', 'TICKET', 56, 'AC bus', 1200, receipt: true)],
    ),
    _claim(
      id: 'clm_0064',
      no: 'CNV-2026-0064',
      type: 'CONVEYANCE',
      emp: 'EMP-0640',
      purpose: 'Quality lab sample run to the jetty',
      status: 'PENDING_MANAGER',
      startAgo: 3,
      endAgo: 2,
      createdDaysAgo: 2,
      lines: [
        _line('k1', 'CNG', 3, 'Lab to jetty, morning', 1800, declaration: true),
        _line('k2', 'CNG', 2, 'Jetty back to the lab', 650, declaration: true),
      ],
    ),
    _claim(
      id: 'clm_0110',
      no: 'CNV-2026-0110',
      type: 'CONVEYANCE',
      emp: 'EMP-1104',
      purpose: 'Tank-farm safety inspection',
      status: 'PENDING_MANAGER',
      startAgo: 2,
      endAgo: 1,
      createdDaysAgo: 1,
      lines: [
        _line(
          'n1',
          'CNG',
          2,
          'Plant gate to tank farm',
          1400,
          declaration: true,
        ),
        _line(
          'n2',
          'CNG',
          1,
          'Return to the safety office',
          800,
          declaration: true,
        ),
      ],
    ),
    _claim(
      id: 'clm_0091',
      no: 'CNV-2026-0091',
      type: 'CONVEYANCE',
      emp: 'EMP-0914',
      purpose: 'Evening gate-duty travel',
      status: 'PENDING_MANAGER',
      startAgo: 4,
      endAgo: 4,
      createdDaysAgo: 3,
      lines: [
        _line('m1', 'CNG', 4, 'Home to the main gate', 480, declaration: true),
      ],
    ),
  ];
  for (final c in claims) {
    ClaimEngine.recompute(store, c);
    store.put(Col.claims, c);
    final emp = store.get(Col.employees, c.str('employeeId'));
    final uid = emp?.strOrNull('userId') ?? '';
    for (final raw in (c['lines'] as List?) ?? const []) {
      if (raw is! Map) continue;
      final rid = raw['receiptFileId'];
      if (rid is! String) continue;
      store.put(
        Col.files,
        seedPhotoFile(
          id: rid,
          uploaderUserId: uid,
          createdAt: c.str('createdAt'),
          fileName: 'receipt.png',
          purpose: 'CLAIM_RECEIPT',
        ),
      );
      FileEngine.attach(store, rid, ownerType: 'Claim', ownerId: c.str('id'));
    }
  }

  for (final id in ['clm_0034', 'clm_0064', 'clm_0110', 'clm_0091']) {
    final pending = store.get(Col.claims, id)!;
    final owner = store.get(Col.employees, pending.str('employeeId'))!;
    ClaimEngine.fileWorkflow(
      store,
      store.get(Col.users, owner.str('userId'))!,
      pending,
    );
  }

  final today = WorkCalendar.today();
  String at(int daysAgo) => WorkCalendar.atTime(
    WorkCalendar.addDays(today, -daysAgo),
    '10:00',
  ).toIso8601String();
  store.put(Col.advances, {
    'id': 'adv_0007',
    'advanceNo': 'ADV-2026-0007',
    'employeeId': empId('EMP-1042'),
    'amount': 30000,
    'purpose': 'Rajshahi dealer conference',
    'tourStart': WorkCalendar.addDays(today, -9),
    'tourEnd': WorkCalendar.addDays(today, -6),
    'status': 'DISBURSED',
    'claimId': null,
    'workflowInstanceId': null,
    'disbursedAt': at(11),
    'settledAt': null,
    'createdAt': at(14),
    'updatedAt': at(11),
  });
}
