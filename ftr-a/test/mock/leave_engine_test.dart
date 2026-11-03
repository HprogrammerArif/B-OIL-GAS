import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/mock/engines/leave_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/leave.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/workflow.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

Future<MockStore> _store() async {
  LeaveEngine.registerHooks();
  final store = MockStore(
    AppDatabase(NativeDatabase.memory()),
    seeders: [seedOrg, seedWorkflowTemplates, seedLeave],
  );
  await store.init();
  return store;
}

AuthContext _auth(MockStore store, String code) {
  final emp = store.get(Col.employees, empId(code))!;
  final user = store.get(Col.users, userIdFor(code))!;
  return AuthContext(
    user: user,
    employee: emp,
    session: const {},
    grants: const [],
  );
}

String _nextBusinessDay(int n) => WorkCalendar.nthBusinessDay(
  WorkCalendar.addDays(WorkCalendar.today(), 20),
  n,
);

void main() {
  test('weekends and holidays are not counted', () {
    // Fri 2026-12-18 and Sat 2026-12-19 are the weekend; Sun-Mon count.
    expect(WorkCalendar.businessDays('2026-12-17', '2026-12-21'), [
      '2026-12-17',
      '2026-12-20',
      '2026-12-21',
    ]);
    // Victory Day 16 Dec is a holiday.
    expect(WorkCalendar.isBusinessDay('2026-12-16'), isFalse);
  });

  test('casual leave over three days is refused', () async {
    final store = await _store();
    final start = _nextBusinessDay(1);
    expect(
      () => LeaveEngine.create(store, _auth(store, 'EMP-1042'), {
        'leaveTypeId': 'lt_cl',
        'startDate': start,
        'endDate': WorkCalendar.addDays(start, 6),
        'halfDay': null,
        'reason': 'A long break please',
      }),
      throwsA(isA<HttpError>()),
    );
  });

  test('a filed request is pending and counted against the balance', () async {
    final store = await _store();
    final auth = _auth(store, 'EMP-1042');
    final year = LeaveEngine.yearOf(WorkCalendar.today());
    double available() =>
        (LeaveEngine.balances(store, auth.employeeId, year).firstWhere(
                  (b) => b.obj('leaveType')['code'] == 'EL',
                )['available']!
                as num)
            .toDouble();
    final before = available();
    final start = _nextBusinessDay(1);
    final leave = LeaveEngine.create(store, auth, {
      'leaveTypeId': 'lt_el',
      'startDate': start,
      'endDate': start,
      'halfDay': null,
      'reason': 'Family function',
    });
    expect(leave['status'], 'PENDING');
    expect(leave['workflowInstanceId'], isNotNull);
    expect(available(), before - 1);

    LeaveEngine.cancel(store, auth, leave, null);
    expect(leave['status'], 'CANCELLED');
    expect(available(), before);
  });

  test('overlapping requests conflict', () async {
    final store = await _store();
    final auth = _auth(store, 'EMP-1042');
    final start = _nextBusinessDay(1);
    final body = {
      'leaveTypeId': 'lt_el',
      'startDate': start,
      'endDate': start,
      'halfDay': null,
      'reason': 'Family function',
    };
    LeaveEngine.create(store, auth, body);
    expect(
      () => LeaveEngine.create(store, auth, body),
      throwsA(isA<HttpError>()),
    );
  });
}
