import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Leave rules (doc 06 §11, `Setting leave.*`).
abstract final class LeavePolicy {
  static const int maxConsecutiveCl = 3;
  static const int hrReviewAboveDays = 5;
  static const Set<String> hrReviewTypes = {'ML', 'LWP'};
  static const int backdateDays = 3;
  static const Set<String> backdateTypes = {'SL', 'LWP'};
  static const int docRequiredAboveDays = 2;
  static const int reasonMin = 5;
  static const int reasonMax = 500;
  static const List<String> typeOrder = ['CL', 'SL', 'EL', 'ML', 'PL', 'LWP'];

  static Json toWire() => {
    'weekendDays': WorkCalendar.weekendDays.toList(),
    'holidays': [
      for (final h in WorkCalendar.holidays)
        {'date': h.date, 'name': h.name, 'nameBn': h.nameBn},
    ],
    'maxConsecutiveCl': maxConsecutiveCl,
    'hrReviewAboveDays': hrReviewAboveDays,
    'backdateDays': backdateDays,
    'backdateTypes': backdateTypes.toList(),
    'docRequiredAboveDays': docRequiredAboveDays,
    'reasonMin': reasonMin,
    'reasonMax': reasonMax,
  };
}

/// Leave engine: balances, validation, filing and the workflow callbacks.
abstract final class LeaveEngine {
  static const String objectType = 'LeaveRequest';
  static const String templateKey = 'LEAVE_REQUEST';

  /// Connects workflow decisions to leave state. Call once at start-up.
  static void registerHooks() =>
      WorkflowHooks.register(objectType, _onWorkflowEvent);

  static int yearOf(String dateKey) => int.parse(dateKey.substring(0, 4));

  static Json typeWire(Json t) => {
    'id': t['id'],
    'code': t['code'],
    'name': t['name'],
    'nameBn': t['nameBn'],
    'annualQuota': t['annualQuota'],
    'requiresDoc': t['requiresDoc'],
    'halfDayAllowed': t['halfDayAllowed'],
    'checksBalance': t['checksBalance'],
  };

  static List<Json> types(MockStore store) {
    int rank(Json t) => LeavePolicy.typeOrder.indexOf(t.str('code'));
    return store.all(Col.leaveTypes)
      ..sort((a, b) => rank(a).compareTo(rank(b)));
  }

  static String balanceId(String employeeId, String typeId, int year) =>
      '${employeeId}_${typeId}_$year';

  /// `available = entitled - used - pending` (pending = days still in review).
  static List<Json> balances(MockStore store, String employeeId, int year) {
    final out = <Json>[];
    for (final type in types(store)) {
      final b = store.get(
        Col.leaveBalances,
        balanceId(employeeId, type.str('id'), year),
      );
      if (b == null) continue;
      final pending = store
          .all(Col.leaveRequests)
          .where(
            (l) =>
                l['employeeId'] == employeeId &&
                l['leaveTypeId'] == type['id'] &&
                l['status'] == 'PENDING' &&
                yearOf(l.str('startDate')) == year,
          )
          .fold<double>(0, (sum, l) => sum + (l['days']! as num));
      final entitled = (b['entitled']! as num).toDouble();
      final used = (b['used']! as num).toDouble();
      out.add({
        'leaveType': typeWire(type),
        'year': year,
        'entitled': entitled,
        'used': used,
        'pending': pending,
        'available': (entitled - used - pending).clamp(0, double.infinity),
      });
    }
    return out;
  }

  static double countDays(String start, String end, String? halfDay) {
    if (halfDay != null) return 0.5;
    return WorkCalendar.businessDays(start, end).length.toDouble();
  }

  static Json _personRef(MockStore store, String employeeId) {
    final e = store.get(Col.employees, employeeId);
    return {
      'id': employeeId,
      'fullName': e?['fullName'] ?? '',
      'fullNameBn': e?['fullNameBn'] ?? '',
    };
  }

  static ({bool awaitingYou, String? name, String? nameBn}) _queue(
    MockStore store,
    Json l,
    String? viewerUserId,
  ) {
    const none = (awaitingYou: false, name: null, nameBn: null);
    final instId = l.strOrNull('workflowInstanceId');
    if (instId == null || l['status'] != 'PENDING') return none;
    Json? active;
    for (final s in store.all(Col.workflowSteps)) {
      if (s['instanceId'] == instId && s['status'] == 'ACTIVE') {
        active = s;
        break;
      }
    }
    if (active == null) return none;
    final ids = {
      ...active.strList('approverUserIds'),
      ?active.strOrNull('delegatedToId'),
    };
    String? name;
    String? nameBn;
    for (final id in ids) {
      final user = store.get(Col.users, id);
      final empId = user?.strOrNull('employeeId');
      final emp = empId == null ? null : store.get(Col.employees, empId);
      name = emp?['fullName'] as String?;
      nameBn = emp?['fullNameBn'] as String?;
      if (name != null && name.isNotEmpty) break;
    }
    return (
      awaitingYou: viewerUserId != null && ids.contains(viewerUserId),
      name: name,
      nameBn: nameBn,
    );
  }

  static Json requestWire(MockStore store, Json l, {String? viewerUserId}) {
    final type = store.get(Col.leaveTypes, l.str('leaveTypeId'));
    final reviewer = l.strOrNull('reviewedById');
    final queue = _queue(store, l, viewerUserId);
    return {
      'id': l['id'],
      'refNo': l['refNo'],
      'employee': _personRef(store, l.str('employeeId')),
      'leaveType': {
        'id': l['leaveTypeId'],
        'code': type?['code'] ?? 'CL',
        'name': type?['name'] ?? '',
        'nameBn': type?['nameBn'] ?? '',
      },
      'startDate': l['startDate'],
      'endDate': l['endDate'],
      'halfDay': l['halfDay'],
      'days': l['days'],
      'reason': l['reason'],
      'status': l['status'],
      'isInformed': l['isInformed'],
      'createdAt': l['createdAt'],
      'reviewedBy': reviewer == null ? null : _personRef(store, reviewer),
      'reviewedAt': l['reviewedAt'],
      'reviewComment': l['reviewComment'],
      'workflowInstanceId': l['workflowInstanceId'],
      'attachmentFileId': l['attachmentFileId'],
      'awaitingYou': queue.awaitingYou,
      'waitingFor': queue.name,
      'waitingForBn': queue.nameBn,
    };
  }

  /// PENDING/RETURNED can be withdrawn; APPROVED only before the start date.
  static bool canCancel(Json l, String employeeId, {String? today}) {
    if (l['employeeId'] != employeeId) return false;
    final status = l.str('status');
    if (status == 'PENDING' || status == 'RETURNED') return true;
    return status == 'APPROVED' &&
        l.str('startDate').compareTo(today ?? WorkCalendar.today()) > 0;
  }

  static Json detailWire(
    MockStore store,
    Json l, {
    required String viewerEmployeeId,
    String? viewerUserId,
  }) => {
    ...requestWire(store, l, viewerUserId: viewerUserId),
    'cancelReason': l['cancelReason'],
    'attachmentFileId': l['attachmentFileId'],
    'viewer': {
      'isOwner': l['employeeId'] == viewerEmployeeId,
      'canCancel': canCancel(l, viewerEmployeeId),
    },
  };

  /// Informed when filed before the start date, or sick leave filed before
  /// 11:00 (shift start + 2 h) on the day (BR-10-11).
  static bool isInformed(String code, String startDate) {
    final today = WorkCalendar.today();
    if (startDate.compareTo(today) > 0) return true;
    if (startDate.compareTo(today) < 0) return false;
    return code == 'SL' && Dhaka.now().hour < 11;
  }

  static String nextRef(MockStore store, int year) {
    var max = 0;
    for (final l in store.all(Col.leaveRequests)) {
      final ref = l.str('refNo');
      if (ref.startsWith('LV-$year-')) {
        final n = int.tryParse(ref.substring(ref.lastIndexOf('-') + 1)) ?? 0;
        if (n > max) max = n;
      }
    }
    return 'LV-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static String _bnDigits(String s) => s.replaceAllMapped(
    RegExp('[0-9]'),
    (m) => '০১২৩৪৫৬৭৮৯'[int.parse(m[0]!)],
  );

  static String daysLabel(num days, {required bool bn}) {
    if (days == 0.5) return bn ? 'অর্ধ দিন' : 'Half day';
    final n = days == days.roundToDouble() ? days.toInt() : days;
    return bn ? '${_bnDigits('$n')} দিন' : (n == 1 ? '1 day' : '$n days');
  }

  /// Validates and files a request (doc 06 BR-10-10, doc 03 §16.2). Returns
  /// the stored record: PENDING with a workflow, or APPROVED when nobody sits
  /// above the requester (chairman).
  static Json create(
    MockStore store,
    AuthContext auth,
    Json body, {
    Json? existing,
  }) {
    final me = auth.employeeId;
    final typeId = body['leaveTypeId'];
    final type = typeId is String ? store.get(Col.leaveTypes, typeId) : null;
    if (type == null) {
      throw validationError('leaveTypeId', 'Choose a leave type');
    }
    final code = type.str('code');

    final start = body['startDate'];
    final end = body['endDate'];
    if (start is! String || !WorkCalendar.isValidKey(start)) {
      throw validationError('startDate', 'Enter a valid start date');
    }
    if (end is! String || !WorkCalendar.isValidKey(end)) {
      throw validationError('endDate', 'Enter a valid end date');
    }
    if (end.compareTo(start) < 0) {
      throw validationError(
        'endDate',
        'End date must be on or after the start date',
      );
    }
    final halfDay = body['halfDay'];
    if (halfDay != null && halfDay != 'FIRST' && halfDay != 'SECOND') {
      throw validationError('halfDay', 'Invalid half-day value');
    }
    final reasonRaw = body['reason'];
    final reason = reasonRaw is String ? reasonRaw.trim() : '';
    if (reason.length < LeavePolicy.reasonMin) {
      throw validationError(
        'reason',
        'Reason must be at least ${LeavePolicy.reasonMin} characters',
      );
    }
    if (reason.length > LeavePolicy.reasonMax) {
      throw validationError('reason', 'Reason is too long');
    }

    final today = WorkCalendar.today();
    if (start.compareTo(today) < 0) {
      final allowed =
          LeavePolicy.backdateTypes.contains(code) &&
          WorkCalendar.daysBetween(start, today) <= LeavePolicy.backdateDays;
      if (!allowed) {
        throw validationError(
          'startDate',
          'Only sick or unpaid leave can start up to '
              '${LeavePolicy.backdateDays} days in the past',
        );
      }
    }
    if (halfDay != null && (start != end || type['halfDayAllowed'] != true)) {
      throw validationError(
        'halfDay',
        'Half-day leave is only for a single day of casual or sick leave',
      );
    }
    final days = countDays(start, end, halfDay as String?);
    if (days == 0) {
      throw validationError(
        'startDate',
        'The selected dates are all weekends or holidays',
      );
    }
    if (code == 'CL' && days > LeavePolicy.maxConsecutiveCl) {
      throw policyViolation(
        'MAX_CONSECUTIVE_CL',
        'Casual leave is limited to ${LeavePolicy.maxConsecutiveCl} '
            'consecutive days',
      );
    }
    if (type['checksBalance'] == true) {
      final balance = balances(
        store,
        me,
        yearOf(start),
      ).where((b) => b.obj('leaveType')['id'] == type['id']).firstOrNull;
      if (balance == null) {
        throw policyViolation(
          'NOT_ELIGIBLE',
          'This leave type is not available to you',
        );
      }
      final available = (balance['available']! as num).toDouble();
      if (days > available) {
        final msg =
            'Only $available day(s) of ${type.str('name').toLowerCase()} left';
        throw HttpError(
          ApiErrorCode.policyViolation,
          msg,
          details: [
            {
              'rule': 'INSUFFICIENT_BALANCE',
              'message': msg,
              'available': available,
            },
          ],
        );
      }
    }
    final fileId = body['attachmentFileId'];
    if (type['requiresDoc'] == true &&
        days > LeavePolicy.docRequiredAboveDays &&
        fileId is! String) {
      throw validationError('attachmentFileId', 'Attach a supporting document');
    }
    final overlap = _overlap(
      store,
      employeeId: me,
      start: start,
      end: end,
      ignoreId: existing?.str('id'),
    );
    if (overlap != null) {
      throw HttpError(
        ApiErrorCode.conflict,
        'You already have leave on these dates',
        details: [
          {'rule': 'OVERLAP', 'refNo': overlap['refNo']},
        ],
      );
    }
    Json? file;
    if (fileId is String) {
      file = store.get(Col.files, fileId);
      if (file == null ||
          file['uploaderUserId'] != auth.user['id'] ||
          !const {'DOCUMENT', 'PHOTO'}.contains(file['purpose']) ||
          file['status'] != 'UPLOADED' ||
          file['scanStatus'] == 'INFECTED') {
        throw validationError('attachmentFileId', 'Attachment is not usable');
      }
    }

    final now = store.nowIso();
    if (existing != null) {
      existing
        ..['leaveTypeId'] = type['id']
        ..['startDate'] = start
        ..['endDate'] = end
        ..['halfDay'] = halfDay
        ..['days'] = days
        ..['reason'] = reason
        ..['status'] = 'PENDING'
        ..['isInformed'] = isInformed(code, start)
        ..['reviewedById'] = null
        ..['reviewedAt'] = null
        ..['reviewComment'] = null
        ..['attachmentFileId'] = fileId
        ..['updatedAt'] = now;
      store.put(Col.leaveRequests, existing);
      if (file != null) {
        FileEngine.attach(
          store,
          file.str('id'),
          ownerType: 'LeaveRequest',
          ownerId: existing.str('id'),
        );
      }
      if (auth.employee['lineManager'] == null) {
        _approve(store, existing, null, null);
      } else {
        submitWorkflow(store, auth.user, existing, type);
      }
      AuditEngine.log(
        store,
        action: 'LEAVE_RESUBMITTED',
        entityType: 'LeaveRequest',
        actorUserId: auth.user.str('id'),
        entityId: existing.str('id'),
        after: {'refNo': existing['refNo'], 'days': days, 'type': code},
      );
      return existing;
    }

    final id =
        'lv_${store.collection(Col.leaveRequests).length + 1}_${store.nowMs()}';
    final leave = <String, Object?>{
      'id': id,
      'refNo': nextRef(store, yearOf(start)),
      'employeeId': me,
      'leaveTypeId': type['id'],
      'startDate': start,
      'endDate': end,
      'halfDay': halfDay,
      'days': days,
      'reason': reason,
      'status': 'PENDING',
      'isInformed': isInformed(code, start),
      'reviewedById': null,
      'reviewedAt': null,
      'reviewComment': null,
      'cancelReason': null,
      'attachmentFileId': fileId,
      'createdAt': now,
      'updatedAt': now,
      'workflowInstanceId': null,
    };
    store.put(Col.leaveRequests, leave);
    if (file != null) {
      FileEngine.attach(
        store,
        file.str('id'),
        ownerType: 'LeaveRequest',
        ownerId: id,
      );
    }

    if (auth.employee['lineManager'] == null) {
      _approve(store, leave, null, null);
    } else {
      submitWorkflow(store, auth.user, leave, type);
    }
    AuditEngine.log(
      store,
      action: 'LEAVE_REQUESTED',
      entityType: 'LeaveRequest',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {'refNo': leave['refNo'], 'days': days, 'type': code},
    );
    return leave;
  }

  static Json? _overlap(
    MockStore store, {
    required String employeeId,
    required String start,
    required String end,
    String? ignoreId,
  }) => store
      .all(Col.leaveRequests)
      .where(
        (l) =>
            l['employeeId'] == employeeId &&
            l['id'] != ignoreId &&
            (l['status'] == 'PENDING' || l['status'] == 'APPROVED') &&
            l.str('startDate').compareTo(end) <= 0 &&
            start.compareTo(l.str('endDate')) <= 0,
      )
      .firstOrNull;

  /// Owner resubmit after RETURN. Restarts the leave workflow.
  static Json update(
    MockStore store,
    AuthContext auth,
    Json existing,
    Json body,
  ) {
    if (existing['employeeId'] != auth.employeeId) {
      throw forbidden('Only the requester can update this leave');
    }
    if (existing['status'] != 'RETURNED') {
      throw invalidTransition('Only a returned request can be edited');
    }
    return create(store, auth, body, existing: existing);
  }

  /// Files the `LEAVE_REQUEST` workflow for a stored request.
  static void submitWorkflow(
    MockStore store,
    Json requesterUser,
    Json leave,
    Json type,
  ) {
    final code = type.str('code');
    final days = leave['days']! as num;
    final isHr = requesterUser.strList('roles').contains('HR_ADMIN');
    final hrReview =
        !isHr &&
        (days > LeavePolicy.hrReviewAboveDays ||
            LeavePolicy.hrReviewTypes.contains(code));
    final range = leave['startDate'] == leave['endDate']
        ? '${leave['startDate']}'
        : '${leave['startDate']} – ${leave['endDate']}';
    final urgent =
        WorkCalendar.daysBetween(
          WorkCalendar.today(),
          leave.str('startDate'),
        ) <=
        1;
    final inst = WorkflowEngine.submit(
      store,
      templateKey: templateKey,
      objectType: objectType,
      objectId: leave.str('id'),
      initiatorUserId: requesterUser.str('id'),
      summary: {
        'refNo': leave['refNo'],
        'title': '${type.str('name')} — ${daysLabel(days, bn: false)} ($range)',
        'titleBn':
            '${type.str('nameBn')} — ${daysLabel(days, bn: true)} ($range)',
        'details': leave['reason'],
        'detailsBn': leave['reason'],
        'amount': null,
        'days': days,
        'leaveCode': code,
        'hrReview': hrReview,
        'urgency': urgent ? 'HIGH' : 'NORMAL',
        'category': 'LEAVE',
      },
    );
    leave['workflowInstanceId'] = inst['id'];
    store.put(Col.leaveRequests, leave);
  }

  static void _adjustUsed(MockStore store, Json l, double delta) {
    final year = yearOf(l.str('startDate'));
    final id = balanceId(l.str('employeeId'), l.str('leaveTypeId'), year);
    final b =
        store.get(Col.leaveBalances, id) ??
        <String, Object?>{
          'id': id,
          'employeeId': l['employeeId'],
          'leaveTypeId': l['leaveTypeId'],
          'year': year,
          'entitled': 0,
          'used': 0,
        };
    final next = ((b['used']! as num).toDouble() + delta).clamp(0, 1e9);
    b['used'] = (next * 10).round() / 10;
    store.put(Col.leaveBalances, b);
  }

  static void _approve(
    MockStore store,
    Json l,
    String? reviewerEmployeeId,
    String? comment,
  ) {
    final now = store.nowIso();
    l
      ..['status'] = 'APPROVED'
      ..['reviewedById'] = reviewerEmployeeId
      ..['reviewedAt'] = now
      ..['reviewComment'] = comment
      ..['updatedAt'] = now;
    store.put(Col.leaveRequests, l);
    _adjustUsed(store, l, (l['days']! as num).toDouble());
  }

  /// Requester cancel of an APPROVED leave, or of a PENDING one. A PENDING
  /// request with a workflow is withdrawn through the workflow engine.
  static void cancel(
    MockStore store,
    AuthContext auth,
    Json l,
    String? reason,
  ) {
    final instId = l.strOrNull('workflowInstanceId');
    final pending = l['status'] == 'PENDING';
    if (pending && instId != null) {
      WorkflowEngine.act(
        store,
        instanceId: instId,
        actorUserId: auth.user.str('id'),
        type: 'WITHDRAW',
        comment: reason,
      );
      l['cancelReason'] = reason;
    } else {
      final wasApproved = l['status'] == 'APPROVED';
      l
        ..['status'] = 'CANCELLED'
        ..['cancelReason'] = reason
        ..['updatedAt'] = store.nowIso();
      store.put(Col.leaveRequests, l);
      if (wasApproved) _adjustUsed(store, l, -(l['days']! as num).toDouble());
    }
    store.put(Col.leaveRequests, l);
    AuditEngine.log(
      store,
      action: 'LEAVE_CANCELLED',
      entityType: 'LeaveRequest',
      actorUserId: auth.user.str('id'),
      entityId: l.str('id'),
      after: {'refNo': l['refNo']},
    );
  }

  static void _onWorkflowEvent(
    MockStore store,
    Json instance,
    WorkflowEvent event,
  ) {
    final l = store.get(Col.leaveRequests, instance.str('objectId'));
    if (l == null || l['status'] != 'PENDING') return;
    final decided =
        WorkflowEngine.stepsOf(store, instance)
            .where((s) => s['decision'] != null && s['decidedById'] != null)
            .toList()
          ..sort(
            (a, b) => (a.strOrNull('decidedAt') ?? '').compareTo(
              b.strOrNull('decidedAt') ?? '',
            ),
          );
    final last = decided.lastOrNull;
    final reviewerUser = last?.strOrNull('decidedById');
    final reviewerEmp = reviewerUser == null
        ? null
        : store.get(Col.users, reviewerUser)?.strOrNull('employeeId');
    switch (event) {
      case WorkflowEvent.approved:
        _approve(store, l, reviewerEmp, last?.strOrNull('comment'));
      case WorkflowEvent.rejected:
        final now = store.nowIso();
        l
          ..['status'] = 'REJECTED'
          ..['reviewedById'] = reviewerEmp
          ..['reviewedAt'] = now
          ..['reviewComment'] = last?.strOrNull('comment')
          ..['updatedAt'] = now;
        store.put(Col.leaveRequests, l);
      case WorkflowEvent.withdrawn:
        l
          ..['status'] = 'CANCELLED'
          ..['updatedAt'] = store.nowIso();
        store.put(Col.leaveRequests, l);
      case WorkflowEvent.returned:
        final now = store.nowIso();
        l
          ..['status'] = 'RETURNED'
          ..['reviewedById'] = reviewerEmp
          ..['reviewedAt'] = now
          ..['reviewComment'] = last?.strOrNull('comment')
          ..['updatedAt'] = now;
        store.put(Col.leaveRequests, l);
      case WorkflowEvent.submitted || WorkflowEvent.stepApproved:
        break;
    }
  }
}
