import 'package:bogcl_oneops/mock/engines/bus_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

typedef _Stop = (String name, String nameBn, String morning, String evening);

Json _route(
  String code,
  String name,
  String nameBn,
  double km,
  int capacity,
  String busNo,
  List<_Stop> stops,
) => {
  'id': 'rt_${code.toLowerCase()}',
  'code': code,
  'name': name,
  'nameBn': nameBn,
  'distanceKm': km,
  'capacity': capacity,
  'busNo': busNo,
  'stops': [
    for (final (i, s) in stops.indexed)
      {
        'id': 'st_${code.toLowerCase()}_${i + 1}',
        'name': s.$1,
        'nameBn': s.$2,
        'morning': s.$3,
        'evening': s.$4,
      },
  ],
};

final List<Json> _routes = [
  _route(
    'R1',
    'Mirpur-10 → Plant',
    'মিরপুর-১০ → প্ল্যান্ট',
    22.8,
    52,
    'Dhaka Metro-Ba 14-2201',
    [
      ('Mirpur-10 Circle', 'মিরপুর-১০ গোলচত্বর', '06:30', '19:10'),
      ('Mirpur-1', 'মিরপুর-১', '06:42', '18:58'),
      ('Gabtoli', 'গাবতলী', '07:05', '18:35'),
      ('Keraniganj Plant Gate', 'কেরানীগঞ্জ প্ল্যান্ট গেট', '07:45', '18:00'),
    ],
  ),
  _route(
    'R2',
    'Uttara → Plant',
    'উত্তরা → প্ল্যান্ট',
    28.4,
    52,
    'Dhaka Metro-Ba 14-2305',
    [
      ('Uttara Sector-7', 'উত্তরা সেক্টর-৭', '06:15', '19:25'),
      ('Airport', 'বিমানবন্দর', '06:35', '19:05'),
      ('Farmgate', 'ফার্মগেট', '07:00', '18:40'),
      ('Keraniganj Plant Gate', 'কেরানীগঞ্জ প্ল্যান্ট গেট', '07:50', '18:00'),
    ],
  ),
  _route(
    'R4',
    'Dhanmondi → Plant',
    'ধানমন্ডি → প্ল্যান্ট',
    16.5,
    52,
    'Dhaka Metro-Ba 14-1987',
    [
      ('Dhanmondi-27', 'ধানমন্ডি-২৭', '06:50', '18:55'),
      ('Science Lab', 'সায়েন্স ল্যাব', '07:02', '18:45'),
      ('Keraniganj Plant Gate', 'কেরানীগঞ্জ প্ল্যান্ট গেট', '07:40', '18:00'),
    ],
  ),
  _route(
    'R7',
    'Bashundhara HQ → Plant',
    'বসুন্ধরা সদর দপ্তর → প্ল্যান্ট',
    25.2,
    52,
    'Dhaka Metro-Ba 14-2410',
    [
      ('Bashundhara HQ', 'বসুন্ধরা সদর দপ্তর', '06:20', '19:20'),
      ('Kuril', 'কুড়িল', '06:35', '19:05'),
      ('Moghbazar', 'মগবাজার', '06:55', '18:45'),
      ('Keraniganj Plant Gate', 'কেরানীগঞ্জ প্ল্যান্ট গেট', '07:55', '18:00'),
    ],
  ),
];

int _n = 0;

Json _alloc(
  String routeCode,
  int seat, {
  String? emp,
  String status = 'ACTIVE',
  int stopIndex = 1,
  String? vacatedFrom,
  String? vacatedTo,
  String? reason,
}) => {
  'id': 'ba_seed_${++_n}',
  'routeId': 'rt_${routeCode.toLowerCase()}',
  'seatNo': seat,
  'employeeId': emp == null ? null : empId(emp),
  'label': emp == null ? 'Staff' : null,
  'kind': 'PERMANENT',
  'stopId': 'st_${routeCode.toLowerCase()}_$stopIndex',
  'startsOn': '2026-01-05',
  'status': status,
  'vacatedFrom': vacatedFrom,
  'vacatedTo': vacatedTo,
  'vacateReason': reason,
};

Json _wait(
  String routeCode,
  String emp,
  int appliedDaysAgo, {
  String status = 'WAITING',
  int? seat,
  int offeredHoursAgo = 0,
  int priority = 0,
  String? priorityReason,
}) {
  final now = DateTime.now().toUtc();
  final offeredAt = now.subtract(Duration(hours: offeredHoursAgo));
  return {
    'id': 'bw_seed_${++_n}',
    'routeId': 'rt_${routeCode.toLowerCase()}',
    'employeeId': empId(emp),
    'appliedAt': now.subtract(Duration(days: appliedDaysAgo)).toIso8601String(),
    'priority': priority,
    'priorityReason': priorityReason,
    'status': status,
    'offerSeatNo': seat,
    'offeredAt': status == 'OFFERED' ? offeredAt.toIso8601String() : null,
    'expiresAt': status == 'OFFERED'
        ? offeredAt
              .add(const Duration(hours: BusPolicy.offerWindowHours))
              .toIso8601String()
        : null,
  };
}

/// Routes, filled seats and a few waitlist situations: Employee waits at
/// position 3 on a full route, Driver holds an open offer, Finance HOD owns a
/// seat, and one route has free seats.
void seedBus(MockStore store) {
  _n = 0;
  for (final r in _routes) {
    store.put(Col.busRoutes, r);
  }
  final today = WorkCalendar.today();
  final next = WorkCalendar.addDays(today, 3);

  void fill(String code, Iterable<int> seats) {
    for (final s in seats) {
      store.put(Col.busAllocations, _alloc(code, s, stopIndex: 1 + s % 3));
    }
  }

  // R1: full, two seats temporarily released, a queue of three.
  fill('R1', [
    for (var i = 1; i <= 52; i++)
      if (i != 9 && i != 10) i,
  ]);
  store
    ..put(
      Col.busAllocations,
      _alloc(
        'R1',
        9,
        status: 'VACATED',
        vacatedFrom: today,
        vacatedTo: next,
        reason: 'Leave',
      ),
    )
    ..put(
      Col.busAllocations,
      _alloc(
        'R1',
        10,
        status: 'VACATED',
        vacatedFrom: today,
        vacatedTo: next,
        reason: 'Training',
      ),
    )
    ..put(Col.busWaitlist, _wait('R1', 'EMP-1088', 26))
    ..put(Col.busWaitlist, _wait('R1', 'EMP-1104', 19))
    ..put(Col.busWaitlist, _wait('R1', 'EMP-1042', 8))
    ..put(Col.busWaitlist, _wait('R1', 'EMP-1088', 3))
    ..put(Col.busWaitlist, _wait('R1', 'EMP-0733', 2));

  // R2: one seat reserved by an open offer to the Driver.
  fill('R2', [
    for (var i = 1; i <= 52; i++)
      if (i != 17) i,
  ]);
  store.put(
    Col.busWaitlist,
    _wait(
      'R2',
      'EMP-0821',
      12,
      status: 'OFFERED',
      seat: 17,
      offeredHoursAgo: 6,
    ),
  );

  // R4: full, with an admin-prioritised waiter.
  fill('R4', [for (var i = 1; i <= 52; i++) i]);
  store.put(
    Col.busWaitlist,
    _wait(
      'R4',
      'EMP-0914',
      10,
      priority: 3,
      priorityReason: 'Medical: lives far from other routes',
    ),
  );

  // R7: HOD Finance's seat plus free seats.
  fill('R7', [
    for (var i = 1; i <= 41; i++)
      if (i != 3) i,
  ]);
  store.put(Col.busAllocations, _alloc('R7', 3, emp: 'EMP-0062', stopIndex: 3));
}
