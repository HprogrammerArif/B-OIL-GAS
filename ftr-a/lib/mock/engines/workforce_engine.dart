import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/asset_engine.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/bus_engine.dart';
import 'package:bogcl_oneops/mock/engines/leave_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Exit checklist (doc 06 BR-16-04). Pitch: items live on the clearance
/// record; there is no EXIT_CLEARANCE workflow.
abstract final class WorkforcePolicy {
  static const protectedRoles = {'CHAIRMAN', 'DIRECTOR'};

  static const items = <Json>[
    {
      'key': 'IT_ACCESS',
      'ownerRole': 'SUPER_ADMIN',
      'label': 'IT access and accounts',
      'labelBn': 'আইটি অ্যাকসেস ও অ্যাকাউন্ট',
    },
    {
      'key': 'RFID_BADGE',
      'ownerRole': 'SECURITY_GATE',
      'label': 'Gate badge and RFID',
      'labelBn': 'গেট ব্যাজ ও আরএফআইডি',
    },
    {
      'key': 'ASSETS_RETURNED',
      'ownerRole': 'PLANT_GM',
      'label': 'Company equipment',
      'labelBn': 'কোম্পানির যন্ত্রপাতি',
    },
    {
      'key': 'VEHICLE_FUEL_CARD',
      'ownerRole': 'TRANSPORT_ADMIN',
      'label': 'Fuel card and open trips',
      'labelBn': 'জ্বালানি কার্ড ও খোলা যাত্রা',
    },
    {
      'key': 'BUS_SEAT',
      'ownerRole': 'TRANSPORT_ADMIN',
      'label': 'Staff-bus seat',
      'labelBn': 'স্টাফ বাসের আসন',
    },
    {
      'key': 'FINANCE_SETTLEMENT',
      'ownerRole': 'FINANCE',
      'label': 'Pay, claims and advances',
      'labelBn': 'বেতন, দাবি ও অগ্রিম',
    },
    {
      'key': 'HR_EXIT_INTERVIEW',
      'ownerRole': 'HR_ADMIN',
      'label': 'Exit interview',
      'labelBn': 'প্রস্থান সাক্ষাৎকার',
    },
  ];

  static Json spec(String key) => items.firstWhere(
    (i) => i['key'] == key,
    orElse: () => throw validationError('key', 'Unknown clearance item'),
  );
}

/// Directory, profile and exit clearance (doc 06 MOD-16, BR-16).
abstract final class WorkforceEngine {
  static bool _has(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static bool _role(AuthContext a, String role) =>
      a.user.strList('roles').contains(role);

  static bool isHr(AuthContext a) => _has(a, 'employees:offboard');

  static bool isSelf(AuthContext a, Json emp) => emp['id'] == a.employeeId;

  static Set<String> managerChain(MockStore store, Json emp) {
    final out = <String>{};
    var cur = emp.objOrNull('lineManager')?.strOrNull('id');
    var hops = 0;
    while (cur != null && hops < 8) {
      out.add(cur);
      final next = store.get(Col.employees, cur);
      cur = next?.objOrNull('lineManager')?.strOrNull('id');
      hops++;
    }
    return out;
  }

  static bool isManagerOf(MockStore store, AuthContext a, Json emp) =>
      managerChain(store, emp).contains(a.employeeId);

  static bool canSeeHrFields(MockStore store, AuthContext a, Json emp) =>
      isHr(a) ||
      _has(a, 'employees:read-full') ||
      isSelf(a, emp) ||
      isManagerOf(store, a, emp);

  static bool canSeePii(AuthContext a, Json emp) =>
      _has(a, 'employees:pii') || isSelf(a, emp);

  static Json? openExit(MockStore store, String employeeId) {
    for (final c in store.all(Col.exitClearances)) {
      if (c['employeeId'] == employeeId && c['status'] == 'OPEN') return c;
    }
    return null;
  }

  static Json autoChecks(MockStore store, Json emp) {
    final uid = emp.strOrNull('userId');
    final openAssets = <String>[];
    if (uid != null) {
      for (final c in store.all(Col.assetCustody)) {
        if (c['employeeUserId'] == uid && c['releasedAt'] == null) {
          final a = store.get(Col.assets, c.str('assetId'));
          openAssets.add(a?.strOrNull('tag') ?? c.str('assetId'));
        }
      }
    }
    final bus = BusEngine.activeAllocation(store, emp.str('id'));
    final wait = BusEngine.openEntry(store, emp.str('id'));
    final claims = store
        .all(Col.claims)
        .where(
          (c) =>
              c['employeeId'] == emp['id'] &&
              const {
                'SUBMITTED',
                'IN_REVIEW',
                'APPROVED',
                'RETURNED',
              }.contains(c['status']),
        )
        .length;
    final advances = store
        .all(Col.advances)
        .where(
          (c) =>
              c['employeeId'] == emp['id'] &&
              c['status'] != 'SETTLED' &&
              c['status'] != 'CANCELLED' &&
              c['status'] != 'REJECTED',
        )
        .length;
    var openTrips = 0;
    if (uid != null) {
      openTrips = store
          .all(Col.fleetTrips)
          .where(
            (t) =>
                t['driverUserId'] == uid &&
                t['endedAt'] == null &&
                t['status'] != 'ENDED' &&
                t['status'] != 'CANCELLED',
          )
          .length;
    }
    return {
      'openAssets': openAssets,
      'busSeat': bus != null || wait != null,
      'unsettledClaims': claims,
      'openAdvances': advances,
      'openTrips': openTrips,
    };
  }

  static List<Json> reportsOf(MockStore store, String employeeId) => [
    for (final e in store.all(Col.employees))
      if (e.objOrNull('lineManager')?['id'] == employeeId)
        {
          'id': e['id'],
          'fullName': e['fullName'],
          'fullNameBn': e['fullNameBn'],
          'title': e.obj('designation')['title'],
        },
  ];

  static Json _itemWire(Json item) => {
    'key': item['key'],
    'ownerRole': item['ownerRole'],
    'label': item['label'],
    'labelBn': item['labelBn'],
    'status': item['status'],
    'note': item['note'],
    'waiveReason': item['waiveReason'],
    'clearedByName': item['clearedByName'],
    'clearedAt': item['clearedAt'],
  };

  static Json _exitWire(MockStore store, Json? c) {
    if (c == null) return {};
    return {
      'id': c['id'],
      'status': c['status'],
      'reason': c['reason'],
      'lastWorkingDay': c['lastWorkingDay'],
      'voucherNo': c['voucherNo'],
      'initiatedByName': c['initiatedByName'],
      'initiatedAt': c['initiatedAt'],
      'completedAt': c['completedAt'],
      'items': [for (final i in c.objList('items')) _itemWire(i)],
    };
  }

  static (String en, String bn) _next(AuthContext a, Json emp, Json? exit) {
    final status = emp.str('status');
    if (status == 'OFFBOARDED') {
      return (
        'This person has left. Nothing for you to do.',
        'এই ব্যক্তি আর এখানে কাজ করেন না। আপনার কিছু করার নেই।',
      );
    }
    if (status == 'ON_LEAVE') {
      return (
        'On approved leave. Directory only.',
        'অনুমোদিত ছুটিতে। শুধু তালিকা।',
      );
    }
    if (exit == null || exit['status'] != 'OPEN') {
      if (isHr(a) && !isSelf(a, emp)) {
        return (
          'HR can start an exit if they are leaving.',
          'চলে গেলে এইচআর প্রস্থান শুরু করতে পারেন।',
        );
      }
      return (
        'Nothing waiting on this card.',
        'এই কার্ডে কিছু অপেক্ষা করছে না।',
      );
    }
    final pending = exit
        .objList('items')
        .where((i) => i['status'] == 'PENDING')
        .toList();
    if (pending.isEmpty) {
      if (isHr(a)) {
        return (
          'Every desk is clear. Record the last day and close the file.',
          'সব ঘর মিটেছে। শেষ দিন লিখে ফাইল বন্ধ করুন।',
        );
      }
      return (
        'Waiting for HR to close the file.',
        'এইচআর ফাইল বন্ধ করার অপেক্ষা।',
      );
    }
    for (final i in pending) {
      if (_canClear(a, i.str('key'))) {
        return (
          'Your desk: ${i.str('label')}.',
          'আপনার ঘর: ${i.str('labelBn')}।',
        );
      }
    }
    final first = pending.first;
    return (
      'Waiting on ${first.str('label')}.',
      '${first.str('labelBn')} এর অপেক্ষা।',
    );
  }

  static bool _canClear(AuthContext a, String key) {
    final owner = WorkforcePolicy.spec(key).str('ownerRole');
    return _role(a, owner);
  }

  static Json me(MockStore store, AuthContext a, Json emp, Json? exit) {
    final next = _next(a, emp, exit);
    final keys = <String>[];
    if (exit != null && exit['status'] == 'OPEN') {
      for (final i in exit.objList('items')) {
        if (i['status'] == 'PENDING' && _canClear(a, i.str('key'))) {
          keys.add(i.str('key'));
        }
      }
    }
    final uid = emp.strOrNull('userId');
    return {
      'isSelf': isSelf(a, emp),
      'isHr': isHr(a),
      'canPatch': isHr(a) || isSelf(a, emp),
      'canOffboard':
          isHr(a) &&
          !isSelf(a, emp) &&
          emp['status'] == 'ACTIVE' &&
          !_protected(store, emp),
      'canFinalize': isHr(a) && exit != null && exit['status'] == 'OPEN',
      'canCancel': isHr(a) && exit != null && exit['status'] == 'OPEN',
      'canReclaim':
          (_has(a, 'employees:clearance') &&
              (_role(a, 'PLANT_GM') || isHr(a))) &&
          exit != null &&
          exit['status'] == 'OPEN' &&
          uid != null,
      'canReactivate': isHr(a) && emp['status'] == 'OFFBOARDED',
      'canWaive': isHr(a) && exit != null && exit['status'] == 'OPEN',
      'clearableKeys': keys,
      'nextEn': next.$1,
      'nextBn': next.$2,
    };
  }

  static bool _protected(MockStore store, Json emp) {
    final uid = emp.strOrNull('userId');
    final u = uid == null ? null : store.get(Col.users, uid);
    if (u == null) return false;
    return u.strList('roles').any(WorkforcePolicy.protectedRoles.contains);
  }

  static Json directoryWire(MockStore store, AuthContext a, Json emp) {
    final dsg = emp.obj('designation');
    final dept = emp.obj('department');
    final site = emp.obj('site');
    final mgr = emp.objOrNull('lineManager');
    final exit = openExit(store, emp.str('id'));
    final next = _next(a, emp, exit);
    return {
      'id': emp['id'],
      'empCode': emp['empCode'],
      'fullName': emp['fullName'],
      'fullNameBn': emp['fullNameBn'],
      'shortName': emp['shortName'],
      'initials': emp['initials'],
      'email': emp['email'],
      'phone': emp['phone'],
      'status': emp['status'],
      'avatarColor': emp['avatarColor'],
      'photoFileId': emp['photoFileId'],
      'designation': {'title': dsg['title'], 'titleBn': dsg['titleBn']},
      'department': {
        'id': dept['id'],
        'name': dept['name'],
        'nameBn': dept['nameBn'],
      },
      'site': {
        'id': site['id'],
        'name': site['name'],
        'nameBn': site['nameBn'],
      },
      'lineManager': mgr == null
          ? null
          : {'id': mgr['id'], 'fullName': mgr['fullName']},
      'nextEn': next.$1,
      'nextBn': next.$2,
    };
  }

  static Json detailWire(MockStore store, AuthContext a, Json emp) {
    final hr = canSeeHrFields(store, a, emp);
    final pii = canSeePii(a, emp);
    final exit =
        openExit(store, emp.str('id')) ?? _latestExit(store, emp.str('id'));
    final out = directoryWire(store, a, emp);
    out['me'] = me(store, a, emp, openExit(store, emp.str('id')));
    out['reports'] = reportsOf(store, emp.str('id'));
    out['autoChecks'] = autoChecks(store, emp);
    out['exitClearance'] = exit == null ? null : _exitWire(store, exit);
    if (hr) {
      out['joinDate'] = emp['joinDate'];
      out['grade'] = emp['grade'];
      out['leaveBalances'] = [
        for (final b in store.all(Col.leaveBalances))
          if (b['employeeId'] == emp['id'])
            {
              'leaveTypeId': b['leaveTypeId'],
              'entitled': b['entitled'],
              'used': b['used'],
            },
      ];
    }
    if (pii) {
      out['nationalId'] = emp['nationalId'];
      out['emergencyContact'] = emp['emergencyContact'];
      out['bloodGroup'] = emp['bloodGroup'];
    }
    final uid = emp.strOrNull('userId');
    if (uid != null && (hr || isSelf(a, emp) || _has(a, 'assets:read'))) {
      out['custodyAssets'] = [
        for (final c in store.all(Col.assetCustody))
          if (c['employeeUserId'] == uid && c['releasedAt'] == null)
            {
              'assetId': c['assetId'],
              'tag': store.get(Col.assets, c.str('assetId'))?['tag'],
            },
      ];
    }
    final bus = BusEngine.activeAllocation(store, emp.str('id'));
    if (bus != null && (hr || isSelf(a, emp))) {
      out['busAllocation'] = {
        'routeId': bus['routeId'],
        'status': bus['status'],
      };
    }
    return out;
  }

  static Json? _latestExit(MockStore store, String employeeId) {
    Json? best;
    for (final c in store.all(Col.exitClearances)) {
      if (c['employeeId'] != employeeId) continue;
      if (best == null ||
          (c.strOrNull('initiatedAt') ?? '').compareTo(
                best.strOrNull('initiatedAt') ?? '',
              ) >
              0) {
        best = c;
      }
    }
    return best;
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    final name = (body['fullName'] as String? ?? '').trim();
    if (name.length < 2) {
      throw validationError('fullName', 'Give their name');
    }
    final phone = (body['phone'] as String? ?? '').trim();
    if (phone.length < 8) {
      throw validationError('phone', 'Give a phone number');
    }
    final title = (body['title'] as String? ?? '').trim();
    if (title.length < 2) {
      throw validationError('title', 'Give their job title');
    }
    final dept = departments
        .where((d) => d['id'] == body['departmentId'])
        .toList();
    if (dept.isEmpty) {
      throw validationError('departmentId', 'Pick a department');
    }
    final site = sites.where((s) => s['id'] == body['siteId']).toList();
    if (site.isEmpty) throw validationError('siteId', 'Pick a workplace');

    final n = store.all(Col.employees).length + 2000;
    final code = 'EMP-${n.toString().padLeft(4, '0')}';
    final id = empId(code);
    var manager = <String, Object?>{};
    final mgrEmpId = body['lineManagerId'] as String?;
    final mgrUserId = body['lineManagerUserId'] as String?;
    if (mgrEmpId != null) {
      final m = store.get(Col.employees, mgrEmpId);
      if (m != null) manager = {'id': m['id'], 'fullName': m['fullName']};
    } else if (mgrUserId != null) {
      final u = store.get(Col.users, mgrUserId);
      final m = u == null
          ? null
          : store.get(Col.employees, u.str('employeeId'));
      if (m != null) manager = {'id': m['id'], 'fullName': m['fullName']};
    }

    final email = (body['email'] as String? ?? '').trim();
    final uid = email.contains('@') ? userIdFor(code) : null;
    final join = (body['joinDate'] as String? ?? store.nowIso())
        .split('T')
        .first;
    final emp = <String, Object?>{
      'id': id,
      'userId': uid,
      'empCode': code,
      'sapPernr': 'PR-${n.toString().padLeft(5, '0')}',
      'fullName': name,
      'fullNameBn': (body['fullNameBn'] as String? ?? name).trim(),
      'shortName': name.split(' ').first,
      'shortNameBn': (body['fullNameBn'] as String? ?? name).split(' ').first,
      'initials': name
          .split(' ')
          .where((p) => p.isNotEmpty)
          .map((p) => p[0])
          .take(2)
          .join()
          .toUpperCase(),
      'email': email.isEmpty ? null : email,
      'phone': phone,
      'designation': {
        'id': 'dsg_$n',
        'title': title,
        'titleBn': (body['titleBn'] as String? ?? title).trim(),
      },
      'grade': {
        'id': 'grd_O3',
        'code': body['gradeCode'] as String? ?? 'O3',
        'name': body['gradeName'] as String? ?? 'Officer',
      },
      'department': dept.first,
      'site': site.first,
      'lineManager': manager.isEmpty ? null : manager,
      'joinDate': join,
      'status': 'ACTIVE',
      'bloodGroup': body['bloodGroup'],
      'avatarColor': '#334155',
      'nationalId': body['nationalId'],
      'emergencyContact': body['emergencyContact'],
    };
    store.put(Col.employees, emp);
    if (uid != null) {
      store.put(Col.users, {
        'id': uid,
        'email': email,
        'phone': normalisePhone(phone),
        'employeeId': id,
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
    _entitleLeave(store, id);
    AuditEngine.log(
      store,
      action: 'EMPLOYEE_ONBOARDED',
      entityType: 'Employee',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {'empCode': code, 'departmentId': dept.first['id']},
    );
    return emp;
  }

  static void _entitleLeave(MockStore store, String employeeId) {
    final year = Dhaka.clock().year;
    for (final t in store.all(Col.leaveTypes)) {
      store.put(Col.leaveBalances, {
        'id': LeaveEngine.balanceId(employeeId, t.str('id'), year),
        'employeeId': employeeId,
        'leaveTypeId': t['id'],
        'year': year,
        'entitled': t['annualQuota'],
        'used': 0.0,
      });
    }
  }

  static Json patch(MockStore store, AuthContext auth, Json emp, Json body) {
    if (!isHr(auth) && !isSelf(auth, emp)) throw forbidden();
    if (isSelf(auth, emp) && !isHr(auth)) {
      if (body['phone'] is String) {
        emp['phone'] = (body['phone']! as String).trim();
      }
      if (body['emergencyContact'] is String) {
        emp['emergencyContact'] = (body['emergencyContact']! as String).trim();
      }
      store.put(Col.employees, emp);
      return emp;
    }
    for (final k in [
      'fullName',
      'fullNameBn',
      'phone',
      'email',
      'emergencyContact',
    ]) {
      if (body[k] is String) emp[k] = (body[k]! as String).trim();
    }
    store.put(Col.employees, emp);
    AuditEngine.log(
      store,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      actorUserId: auth.user.str('id'),
      entityId: emp.str('id'),
    );
    return emp;
  }

  static Json offboard(MockStore store, AuthContext auth, Json emp, Json body) {
    if (_protected(store, emp)) {
      throw policyViolation(
        'PROTECTED_ROLE',
        'The Chairman cannot be offboarded.',
      );
    }
    if (isSelf(auth, emp)) {
      throw policyViolation('SELF_EXIT', 'Someone else in HR must start this.');
    }
    if (emp['status'] != 'ACTIVE' && emp['status'] != 'ON_LEAVE') {
      throw invalidTransition('Exit is already open or finished.');
    }
    if (openExit(store, emp.str('id')) != null) {
      throw policyViolation('EXIT_OPEN', 'An exit file is already open.');
    }
    final reason = (body['reason'] as String? ?? '').trim();
    if (reason.length < 10) {
      throw validationError(
        'reason',
        'Say why they are leaving (10+ characters)',
      );
    }
    final last = (body['lastWorkingDay'] as String? ?? '').trim();
    if (last.length < 8) {
      throw validationError('lastWorkingDay', 'Give the last working day');
    }
    final n = store.all(Col.exitClearances).length + 1;
    final items = [
      for (final spec in WorkforcePolicy.items)
        {
          'key': spec['key'],
          'ownerRole': spec['ownerRole'],
          'label': spec['label'],
          'labelBn': spec['labelBn'],
          'status': 'PENDING',
          'note': null,
          'waiveReason': null,
          'clearedByName': null,
          'clearedAt': null,
        },
    ];
    final rec = <String, Object?>{
      'id': 'ex_$n',
      'employeeId': emp['id'],
      'status': 'OPEN',
      'reason': reason,
      'lastWorkingDay': last.split('T').first,
      'voucherNo': null,
      'initiatedByUserId': auth.user['id'],
      'initiatedByName': auth.employee['fullName'],
      'initiatedAt': store.nowIso(),
      'completedAt': null,
      'items': items,
    };
    emp['status'] = 'OFFBOARDING';
    store
      ..put(Col.exitClearances, rec)
      ..put(Col.employees, emp);
    AuditEngine.log(
      store,
      action: 'EXIT_INITIATED',
      entityType: 'ExitClearance',
      actorUserId: auth.user.str('id'),
      entityId: rec.str('id'),
      after: {'employeeId': emp['id']},
    );
    final name = emp.str('fullName');
    for (final spec in WorkforcePolicy.items) {
      NotificationEngine.notifyRole(
        store,
        role: spec.str('ownerRole'),
        type: 'EXIT_ITEM_OPEN',
        title: Bi('Clearance: $name', 'ছাড়পত্র: $name'),
        body: Bi(
          '${spec.str('label')} is waiting on you.',
          '${spec.str('labelBn')} আপনার অপেক্ষায়।',
        ),
        data: {'module': 'employees', 'route': '/home/people/${emp['id']}'},
      );
    }
    return rec;
  }

  static Json clearItem(
    MockStore store,
    AuthContext auth,
    Json rec,
    String key,
    Json body,
  ) {
    if (rec['status'] != 'OPEN') {
      throw invalidTransition('This exit file is closed.');
    }
    final waive = body['waive'] == true;
    if (waive && !isHr(auth)) throw forbidden();
    if (!waive && !_canClear(auth, key)) throw forbidden();
    final emp = store.get(Col.employees, rec.str('employeeId'));
    if (emp == null) throw notFound('Employee');
    if (!waive) _guardClear(store, emp, key, body);
    final note = (body['note'] as String? ?? '').trim();
    final reason = (body['waiveReason'] as String? ?? '').trim();
    if (waive && reason.length < 10) {
      throw validationError(
        'waiveReason',
        'Say why you are skipping this desk',
      );
    }
    if (key == 'HR_EXIT_INTERVIEW' && !waive && note.length < 10) {
      throw validationError(
        'note',
        'Write the interview notes (10+ characters)',
      );
    }
    final items = rec.objList('items');
    final next = <Json>[];
    var found = false;
    for (final i in items) {
      if (i['key'] != key) {
        next.add(i);
        continue;
      }
      found = true;
      if (i['status'] != 'PENDING') {
        throw invalidTransition('This desk is already done.');
      }
      next.add({
        ...i,
        'status': waive ? 'WAIVED' : 'CLEARED',
        'note': note.isEmpty ? null : note,
        'waiveReason': waive ? reason : null,
        'clearedByName': auth.employee['fullName'],
        'clearedAt': store.nowIso(),
      });
    }
    if (!found) throw notFound('Clearance item');
    rec['items'] = next;
    store.put(Col.exitClearances, rec);
    AuditEngine.log(
      store,
      action: waive ? 'EXIT_ITEM_WAIVED' : 'EXIT_ITEM_CLEARED',
      entityType: 'ExitClearance',
      actorUserId: auth.user.str('id'),
      entityId: rec.str('id'),
      after: {'key': key},
    );
    return rec;
  }

  static void _guardClear(MockStore store, Json emp, String key, Json body) {
    final checks = autoChecks(store, emp);
    switch (key) {
      case 'ASSETS_RETURNED':
        final open = (checks['openAssets'] as List?) ?? const [];
        if (open.isNotEmpty) {
          throw policyViolation(
            'ASSETS_OUTSTANDING',
            'Take the equipment back first (reclaim), then tick this desk.',
          );
        }
      case 'BUS_SEAT':
        if (checks['busSeat'] == true) {
          throw policyViolation(
            'BUS_SEAT_ACTIVE',
            'End the staff-bus seat before ticking this desk.',
          );
        }
      case 'VEHICLE_FUEL_CARD':
        if ((checks['openTrips'] as int? ?? 0) > 0) {
          throw policyViolation(
            'TRIPS_OPEN',
            'Finish their open car trips first.',
          );
        }
      case 'FINANCE_SETTLEMENT':
        if ((checks['unsettledClaims'] as int? ?? 0) > 0 ||
            (checks['openAdvances'] as int? ?? 0) > 0) {
          throw policyViolation(
            'FINANCE_OPEN',
            'Settle claims and advances first.',
          );
        }
      case 'RFID_BADGE':
        final badge =
            (body['badgeNo'] as String? ?? body['note'] as String? ?? '')
                .trim();
        if (badge.length < 2) {
          throw validationError(
            'note',
            'Write the badge number they handed in',
          );
        }
      default:
        break;
    }
  }

  static Json reclaim(MockStore store, AuthContext auth, Json rec) {
    if (rec['status'] != 'OPEN') {
      throw invalidTransition('This exit file is closed.');
    }
    final emp = store.get(Col.employees, rec.str('employeeId'));
    if (emp == null) throw notFound('Employee');
    final uid = emp.strOrNull('userId');
    if (uid != null) {
      AssetEngine.reclaimEmployeeAssets(store, auth, uid);
    }
    return _stampItem(
      store,
      auth,
      rec,
      'ASSETS_RETURNED',
      'CLEARED',
      'Reclaimed on exit',
    );
  }

  static Json _stampItem(
    MockStore store,
    AuthContext auth,
    Json rec,
    String key,
    String status,
    String note,
  ) {
    final next = <Json>[];
    for (final i in rec.objList('items')) {
      if (i['key'] != key) {
        next.add(i);
        continue;
      }
      next.add({
        ...i,
        'status': status,
        'note': note,
        'clearedByName': auth.employee['fullName'],
        'clearedAt': store.nowIso(),
      });
    }
    rec['items'] = next;
    store.put(Col.exitClearances, rec);
    return rec;
  }

  static Json finalize(MockStore store, AuthContext auth, Json rec, Json body) {
    if (rec['status'] != 'OPEN') {
      throw invalidTransition('This exit file is already closed.');
    }
    final pending = rec
        .objList('items')
        .where((i) => i['status'] == 'PENDING')
        .toList();
    if (pending.isNotEmpty) {
      throw policyViolation(
        'ITEMS_PENDING',
        'Every desk must be cleared or skipped first.',
      );
    }
    final voucher = (body['voucherNo'] as String? ?? '').trim();
    if (voucher.length < 3) {
      throw validationError('voucherNo', 'Write the final-pay voucher number');
    }
    final emp = store.get(Col.employees, rec.str('employeeId'));
    if (emp == null) throw notFound('Employee');
    rec['status'] = 'APPROVED';
    rec['voucherNo'] = voucher;
    rec['completedAt'] = store.nowIso();
    emp['status'] = 'OFFBOARDED';
    emp['exitDate'] = rec['lastWorkingDay'];
    emp['exitReason'] = rec['reason'];
    store
      ..put(Col.exitClearances, rec)
      ..put(Col.employees, emp);
    final uid = emp.strOrNull('userId');
    if (uid != null) {
      final u = store.get(Col.users, uid);
      if (u != null) {
        u['isActive'] = false;
        store.put(Col.users, u);
      }
    }
    AuditEngine.log(
      store,
      action: 'EXIT_FINALIZED',
      entityType: 'ExitClearance',
      actorUserId: auth.user.str('id'),
      entityId: rec.str('id'),
      after: {'employeeId': emp['id']},
    );
    NotificationEngine.notifyRole(
      store,
      role: 'HR_ADMIN',
      type: 'CLEARANCE_COMPLETED',
      title: Bi('${emp['fullName']} has left', '${emp['fullName']} চলে গেছেন'),
      body: Bi(
        'Exit file closed. Voucher $voucher.',
        'প্রস্থান ফাইল বন্ধ। ভাউচার $voucher।',
      ),
      data: {'module': 'employees', 'route': '/home/people/${emp['id']}'},
    );
    return rec;
  }

  static Json cancel(MockStore store, AuthContext auth, Json rec, Json body) {
    if (rec['status'] != 'OPEN') {
      throw invalidTransition('This exit file is already closed.');
    }
    final reason = (body['reason'] as String? ?? '').trim();
    if (reason.length < 10) {
      throw validationError('reason', 'Say why you are cancelling');
    }
    rec['status'] = 'CANCELLED';
    rec['cancelReason'] = reason;
    rec['completedAt'] = store.nowIso();
    final emp = store.get(Col.employees, rec.str('employeeId'));
    if (emp != null) {
      emp['status'] = 'ACTIVE';
      store.put(Col.employees, emp);
    }
    store.put(Col.exitClearances, rec);
    AuditEngine.log(
      store,
      action: 'EXIT_CANCELLED',
      entityType: 'ExitClearance',
      actorUserId: auth.user.str('id'),
      entityId: rec.str('id'),
    );
    return rec;
  }

  static Json reactivate(
    MockStore store,
    AuthContext auth,
    Json emp,
    Json body,
  ) {
    if (emp['status'] != 'OFFBOARDED') {
      throw invalidTransition('Only a former colleague can be re-hired.');
    }
    emp['status'] = 'ACTIVE';
    emp['joinDate'] = (body['joinDate'] as String? ?? store.nowIso())
        .split('T')
        .first;
    emp['exitDate'] = null;
    emp['exitReason'] = null;
    store.put(Col.employees, emp);
    final uid = emp.strOrNull('userId');
    if (uid != null) {
      final u = store.get(Col.users, uid);
      if (u != null) {
        u['isActive'] = true;
        store.put(Col.users, u);
      }
    }
    AuditEngine.log(
      store,
      action: 'EMPLOYEE_REACTIVATED',
      entityType: 'Employee',
      actorUserId: auth.user.str('id'),
      entityId: emp.str('id'),
    );
    return emp;
  }

  static Json kpis(MockStore store) {
    final all = store.all(Col.employees);
    final bySite = <String, int>{};
    final byDept = <String, int>{};
    var active = 0;
    var former = 0;
    var leaving = 0;
    for (final e in all) {
      final st = e.str('status');
      if (st == 'OFFBOARDED') {
        former++;
      } else if (st == 'OFFBOARDING') {
        leaving++;
        active++;
      } else {
        active++;
      }
      final site = e.obj('site').str('name');
      final dept = e.obj('department').str('name');
      bySite[site] = (bySite[site] ?? 0) + 1;
      byDept[dept] = (byDept[dept] ?? 0) + 1;
    }
    return {
      'active': active,
      'former': former,
      'leaving': leaving,
      'bySite': bySite,
      'byDepartment': byDept,
    };
  }
}
