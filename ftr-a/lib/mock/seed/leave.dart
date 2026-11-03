import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/leave_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _type(
  String code,
  String name,
  String nameBn,
  int quota, {
  bool requiresDoc = false,
  bool halfDay = false,
  bool checksBalance = true,
}) => {
  'id': 'lt_${code.toLowerCase()}',
  'code': code,
  'name': name,
  'nameBn': nameBn,
  'annualQuota': quota,
  'requiresDoc': requiresDoc,
  'halfDayAllowed': halfDay,
  'checksBalance': checksBalance,
};

final List<Json> _types = [
  _type('CL', 'Casual leave', 'নৈমিত্তিক ছুটি', 10, halfDay: true),
  _type('SL', 'Sick leave', 'অসুস্থতাজনিত ছুটি', 14, halfDay: true),
  _type('EL', 'Earned leave', 'অর্জিত ছুটি', 20),
  _type('ML', 'Maternity leave', 'মাতৃত্বকালীন ছুটি', 112, requiresDoc: true),
  _type('PL', 'Paternity leave', 'পিতৃত্বকালীন ছুটি', 7),
  _type('LWP', 'Leave without pay', 'বিনা বেতনে ছুটি', 0, checksBalance: false),
];

/// Days taken earlier this year, before the app went live: [CL, SL, EL].
const Map<String, List<int>> _priorUsed = {
  'EMP-0012': [4, 1, 6],
  'EMP-0028': [3, 2, 5],
  'EMP-0045': [5, 0, 4],
  'EMP-0062': [2, 3, 7],
  'EMP-1042': [4, 2, 2],
  'EMP-0821': [3, 1, 0],
  'EMP-1088': [4, 0, 3],
  'EMP-1104': [2, 1, 2],
  'EMP-0914': [6, 2, 5],
  'EMP-0733': [3, 0, 4],
};

typedef _Seed = ({
  String ref,
  String emp,
  String type,
  int startOffset,
  int days,
  String reason,
  int createdDaysAgo,
  String? status,
  String? reviewer,
  String? comment,
});

const List<_Seed> _seeds = [
  (
    ref: 'LV-2026-0071',
    emp: 'EMP-1042',
    type: 'el',
    startOffset: -32,
    days: 3,
    reason: 'Family wedding in Sylhet — travel and ceremonies.',
    createdDaysAgo: 40,
    status: 'APPROVED',
    reviewer: 'EMP-0062',
    comment: 'Enjoy the wedding. Hand over dealer follow-ups to Rakib.',
  ),
  (
    ref: 'LV-2026-0077',
    emp: 'EMP-0821',
    type: 'cl',
    startOffset: -18,
    days: 2,
    reason: 'Village visit for a family land registration in Mymensingh.',
    createdDaysAgo: 22,
    status: 'APPROVED',
    reviewer: 'EMP-0045',
    comment: 'Approved. Relief driver Jamal covers your route.',
  ),
  (
    ref: 'LV-2026-0080',
    emp: 'EMP-1042',
    type: 'cl',
    startOffset: -9,
    days: 1,
    reason: 'Personal errand at the passport office.',
    createdDaysAgo: 12,
    status: 'REJECTED',
    reviewer: 'EMP-0062',
    comment: 'Quarter-end dealer reconciliation that day — please pick another date.',
  ),
  (
    ref: 'LV-2026-0089',
    emp: 'EMP-1042',
    type: 'cl',
    startOffset: 3,
    days: 2,
    reason: 'Family medical checkup in Dhaka.',
    createdDaysAgo: 0,
    status: null,
    reviewer: null,
    comment: null,
  ),
  (
    ref: 'LV-2026-0090',
    emp: 'EMP-0045',
    type: 'el',
    startOffset: 10,
    days: 6,
    reason: 'Annual family trip to Cox’s Bazar, booked months ago.',
    createdDaysAgo: 0,
    status: null,
    reviewer: null,
    comment: null,
  ),
];

/// Leave types, this year's balances and a few requests. Pending requests go
/// through the real workflow engine so approvers see them in their inbox.
void seedLeave(MockStore store) {
  final today = WorkCalendar.today();
  final year = LeaveEngine.yearOf(today);
  for (final t in _types) {
    store.put(Col.leaveTypes, t);
  }

  final approvedDays = <String, double>{};
  final employeesByCode = {
    for (final e in store.all(Col.employees)) e.str('empCode'): e,
  };

  // Decided history first, so balances can include it.
  for (final s in _seeds) {
    final emp = employeesByCode[s.emp];
    if (emp == null) continue;
    final start = WorkCalendar.nthBusinessDay(
      WorkCalendar.addDays(today, s.startOffset),
      1,
    );
    final end = WorkCalendar.nthBusinessDay(start, s.days);
    final typeId = 'lt_${s.type}';
    final created = Dhaka.toWire(
      Dhaka.clock().subtract(Duration(days: s.createdDaysAgo)),
    );
    final id = 'lv_${s.ref.split('-').last}';
    final reviewer = s.reviewer == null ? null : employeesByCode[s.reviewer];
    final leave = <String, Object?>{
      'id': id,
      'refNo': s.ref,
      'employeeId': emp['id'],
      'leaveTypeId': typeId,
      'startDate': start,
      'endDate': end,
      'halfDay': null,
      'days': s.days.toDouble(),
      'reason': s.reason,
      'status': s.status ?? 'PENDING',
      'isInformed': true,
      'reviewedById': reviewer?['id'],
      'reviewedAt': s.status == null
          ? null
          : Dhaka.toWire(
              Dhaka.clock().subtract(Duration(days: s.createdDaysAgo - 1)),
            ),
      'reviewComment': s.comment,
      'cancelReason': null,
      'attachmentFileId': null,
      'createdAt': created,
      'updatedAt': created,
      'workflowInstanceId': null,
    };
    store.put(Col.leaveRequests, leave);
    if (s.status == 'APPROVED') {
      final key = '${emp['id']}_$typeId';
      approvedDays[key] = (approvedDays[key] ?? 0) + s.days;
    }
  }

  for (final e in store.all(Col.employees)) {
    if (e['status'] == 'OFFBOARDED') continue;
    final prior = _priorUsed[e.str('empCode')] ?? const [0, 0, 0];
    for (final (i, code) in ['cl', 'sl', 'el'].indexed) {
      final typeId = 'lt_$code';
      final quota =
          (_types.firstWhere((t) => t['id'] == typeId)['annualQuota']! as num)
              .toDouble();
      final used = prior[i] + (approvedDays['${e['id']}_$typeId'] ?? 0);
      store.put(Col.leaveBalances, {
        'id': LeaveEngine.balanceId(e.str('id'), typeId, year),
        'employeeId': e['id'],
        'leaveTypeId': typeId,
        'year': year,
        'entitled': quota,
        'used': used.toDouble(),
      });
    }
    for (final code in ['ml', 'pl', 'lwp']) {
      final typeId = 'lt_$code';
      final quota =
          (_types.firstWhere((t) => t['id'] == typeId)['annualQuota']! as num)
              .toDouble();
      store.put(Col.leaveBalances, {
        'id': LeaveEngine.balanceId(e.str('id'), typeId, year),
        'employeeId': e['id'],
        'leaveTypeId': typeId,
        'year': year,
        'entitled': quota,
        'used': 0.0,
      });
    }
  }

  // File the pending ones now that templates, users and balances exist.
  for (final s in _seeds.where((s) => s.status == null)) {
    final emp = employeesByCode[s.emp];
    final userId = emp?.strOrNull('userId');
    final user = userId == null ? null : store.get(Col.users, userId);
    final leave = store.get(Col.leaveRequests, 'lv_${s.ref.split('-').last}');
    final type = store.get(Col.leaveTypes, 'lt_${s.type}');
    if (user == null || leave == null || type == null) continue;
    LeaveEngine.submitWorkflow(store, user, leave, type);
  }
}
