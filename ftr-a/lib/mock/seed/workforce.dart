import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _item(
  String key,
  String owner,
  String label,
  String labelBn, {
  String status = 'PENDING',
  String? by,
  String? at,
  String? note,
}) => {
  'key': key,
  'ownerRole': owner,
  'label': label,
  'labelBn': labelBn,
  'status': status,
  'note': note,
  'waiveReason': null,
  'clearedByName': by,
  'clearedAt': at,
};

/// Open exit on Nazmul (plant HSE, no login) plus closed files for Shakil
/// and Khadija (already OFFBOARDED in org seed).
void seedWorkforce(MockStore store) {
  final nazmul = store.get(Col.employees, empId('EMP-1104'));
  if (nazmul != null) {
    nazmul['status'] = 'OFFBOARDING';
    store
      ..put(Col.employees, nazmul)
      ..put(Col.exitClearances, {
        'id': 'ex_nazmul',
        'employeeId': nazmul['id'],
        'status': 'OPEN',
        'reason':
            'Moving to a group HSE role at another Bashundhara company. '
            'Handover of plant safety files is under way.',
        'lastWorkingDay': '2026-11-20',
        'voucherNo': null,
        'initiatedByUserId': userIdFor('EMP-0028'),
        'initiatedByName': 'Sayeda Afroza Sultana',
        'initiatedAt': '2026-10-28T09:00:00.000Z',
        'completedAt': null,
        'items': [
          _item(
            'IT_ACCESS',
            'SUPER_ADMIN',
            'IT access and accounts',
            'আইটি অ্যাকসেস ও অ্যাকাউন্ট',
          ),
          _item(
            'RFID_BADGE',
            'SECURITY_GATE',
            'Gate badge and RFID',
            'গেট ব্যাজ ও আরএফআইডি',
          ),
          _item(
            'ASSETS_RETURNED',
            'PLANT_GM',
            'Company equipment',
            'কোম্পানির যন্ত্রপাতি',
          ),
          _item(
            'VEHICLE_FUEL_CARD',
            'TRANSPORT_ADMIN',
            'Fuel card and open trips',
            'জ্বালানি কার্ড ও খোলা যাত্রা',
          ),
          _item(
            'BUS_SEAT',
            'TRANSPORT_ADMIN',
            'Staff-bus seat',
            'স্টাফ বাসের আসন',
          ),
          _item(
            'FINANCE_SETTLEMENT',
            'FINANCE',
            'Pay, claims and advances',
            'বেতন, দাবি ও অগ্রিম',
          ),
          _item(
            'HR_EXIT_INTERVIEW',
            'HR_ADMIN',
            'Exit interview',
            'প্রস্থান সাক্ষাৎকার',
          ),
        ],
      });
  }

  _openExit(
    store,
    code: 'EMP-1088',
    id: 'ex_tariqul',
    reason:
        'Taking a maintenance role at the Mongla terminal. '
        'Workshop tools and the radio are still with him.',
    last: '2026-11-28',
  );
  _openExit(
    store,
    code: 'EMP-0914',
    id: 'ex_mizanur',
    reason:
        'Retiring at the end of the month. Gate keys and the night '
        'roster need a named replacement.',
    last: '2026-11-30',
  );

  _closed(
    store,
    id: 'ex_shakil',
    emp: empId('EMP-0782'),
    reason: 'Joined a private consulting firm. Full handover and clearance completed.',
    last: '2026-09-15',
    by: 'Sayeda Afroza Sultana',
    at: '2026-09-15T10:30:00.000Z',
    note: 'Final salary settled (Voucher FS-2026-089).',
    voucher: 'FS-2026-089',
  );
  _closed(
    store,
    id: 'ex_khadija',
    emp: empId('EMP-0640'),
    reason: 'Moved abroad for higher education.',
    last: '2026-08-30',
    by: 'Engr. Md. Harunur Rashid',
    at: '2026-08-30T11:00:00.000Z',
    note: 'Lab locker keys and gate pass returned.',
    voucher: 'FS-2026-074',
  );
}

void _openExit(
  MockStore store, {
  required String code,
  required String id,
  required String reason,
  required String last,
}) {
  final person = store.get(Col.employees, empId(code));
  if (person == null) return;
  person['status'] = 'OFFBOARDING';
  store
    ..put(Col.employees, person)
    ..put(Col.exitClearances, {
      'id': id,
      'employeeId': person['id'],
      'status': 'OPEN',
      'reason': reason,
      'lastWorkingDay': last,
      'voucherNo': null,
      'initiatedByUserId': userIdFor('EMP-0028'),
      'initiatedByName': 'Sayeda Afroza Sultana',
      'initiatedAt': '2026-11-02T09:30:00.000Z',
      'completedAt': null,
      'items': [
        _item(
          'IT_ACCESS',
          'SUPER_ADMIN',
          'IT access and accounts',
          'আইটি অ্যাকসেস ও অ্যাকাউন্ট',
        ),
        _item(
          'RFID_BADGE',
          'SECURITY_GATE',
          'Gate badge and RFID',
          'গেট ব্যাজ ও আরএফআইডি',
        ),
        _item(
          'ASSETS_RETURNED',
          'PLANT_GM',
          'Company equipment',
          'কোম্পানির যন্ত্রপাতি',
        ),
        _item(
          'VEHICLE_FUEL_CARD',
          'TRANSPORT_ADMIN',
          'Fuel card and open trips',
          'জ্বালানি কার্ড ও খোলা যাত্রা',
        ),
        _item(
          'BUS_SEAT',
          'TRANSPORT_ADMIN',
          'Staff-bus seat',
          'স্টাফ বাসের আসন',
        ),
        _item(
          'FINANCE_SETTLEMENT',
          'FINANCE',
          'Pay, claims and advances',
          'বেতন, দাবি ও অগ্রিম',
        ),
        _item(
          'HR_EXIT_INTERVIEW',
          'HR_ADMIN',
          'Exit interview',
          'প্রস্থান সাক্ষাৎকার',
        ),
      ],
    });
}

void _closed(
  MockStore store, {
  required String id,
  required String emp,
  required String reason,
  required String last,
  required String by,
  required String at,
  required String note,
  required String voucher,
}) {
  Json done(String key, String owner, String label, String labelBn) => _item(
    key,
    owner,
    label,
    labelBn,
    status: 'CLEARED',
    by: by,
    at: at,
    note: note,
  );
  store.put(Col.exitClearances, {
    'id': id,
    'employeeId': emp,
    'status': 'APPROVED',
    'reason': reason,
    'lastWorkingDay': last,
    'voucherNo': voucher,
    'initiatedByUserId': userIdFor('EMP-0028'),
    'initiatedByName': 'Sayeda Afroza Sultana',
    'initiatedAt': at,
    'completedAt': at,
    'items': [
      done(
        'IT_ACCESS',
        'SUPER_ADMIN',
        'IT access and accounts',
        'আইটি অ্যাকসেস ও অ্যাকাউন্ট',
      ),
      done(
        'RFID_BADGE',
        'SECURITY_GATE',
        'Gate badge and RFID',
        'গেট ব্যাজ ও আরএফআইডি',
      ),
      done(
        'ASSETS_RETURNED',
        'PLANT_GM',
        'Company equipment',
        'কোম্পানির যন্ত্রপাতি',
      ),
      done(
        'VEHICLE_FUEL_CARD',
        'TRANSPORT_ADMIN',
        'Fuel card and open trips',
        'জ্বালানি কার্ড ও খোলা যাত্রা',
      ),
      done('BUS_SEAT', 'TRANSPORT_ADMIN', 'Staff-bus seat', 'স্টাফ বাসের আসন'),
      done(
        'FINANCE_SETTLEMENT',
        'FINANCE',
        'Pay, claims and advances',
        'বেতন, দাবি ও অগ্রিম',
      ),
      done(
        'HR_EXIT_INTERVIEW',
        'HR_ADMIN',
        'Exit interview',
        'প্রস্থান সাক্ষাৎকার',
      ),
    ],
  });
}
