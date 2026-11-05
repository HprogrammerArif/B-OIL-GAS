import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/chat_engine.dart';
import 'package:bogcl_oneops/mock/engines/licence_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Role home (doc 06 MOD-02). KPIs are counted from live collections
/// (BR-02-04). ROI numbers are declared settings, not computed (BR-02-07).
abstract final class DashboardPolicy {
  static const innerCircle = ['usr_0001', 'usr_0012', 'usr_0028', 'usr_0062'];

  /// Declared savings (BR-02-07). Shown as "declared", never as a formula.
  static const roi = <String, Object?>{
    'fleetSavings': 4200000,
    'vendorSavings': 1850000,
    'taxSavings': 960000,
    'accidentFreeBaselineDate': '2026-09-12',
  };

  static const layouts = [
    'CHAIRMAN',
    'PLANT_GM',
    'HR_ADMIN',
    'TRANSPORT_ADMIN',
    'HOD',
    'DRIVER',
    'EMPLOYEE',
  ];
}

abstract final class DashboardEngine {
  static bool _role(AuthContext a, String r) =>
      a.user.strList('roles').contains(r);

  static String layoutOf(AuthContext a) {
    if (_role(a, 'CHAIRMAN')) return 'CHAIRMAN';
    if (_role(a, 'PLANT_GM')) return 'PLANT_GM';
    if (_role(a, 'HR_ADMIN')) return 'HR_ADMIN';
    if (_role(a, 'TRANSPORT_ADMIN')) return 'TRANSPORT_ADMIN';
    if (_role(a, 'HOD')) return 'HOD';
    if (_role(a, 'DRIVER')) return 'DRIVER';
    return 'EMPLOYEE';
  }

  static String _today() => Dhaka.toWire(Dhaka.clock()).split('T').first;

  static List<Json> _mySteps(MockStore store, String userId) {
    final out = <Json>[];
    for (final inst in store.all(Col.workflowInstances)) {
      final step = WorkflowEngine.actionableStep(store, inst, userId);
      if (step != null) out.add(inst);
    }
    return out;
  }

  static double _amount(Json inst) {
    final s = inst.objOrNull('summary');
    final v = s?['amount'];
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0;
    return 0;
  }

  static int _pendingApprovals(MockStore store, AuthContext a) =>
      _mySteps(store, a.user.str('id')).length;

  static double _pendingValue(MockStore store, AuthContext a) {
    var n = 0.0;
    for (final i in _mySteps(store, a.user.str('id'))) {
      n += _amount(i);
    }
    return n;
  }

  static int _openIncidents(MockStore store, {String? siteId}) {
    var n = 0;
    for (final i in store.all(Col.incidents)) {
      if (i['stage'] == 'CLOSED') continue;
      if (siteId != null && i['siteId'] != siteId) continue;
      n++;
    }
    return n;
  }

  static int _licencesAtRisk(MockStore store, {String? siteId}) {
    var n = 0;
    for (final l in store.all(Col.compliance)) {
      if (siteId != null && l['siteId'] != siteId) continue;
      if (LicenceEngine.daysToExpiry(store, l) <= 30) n++;
    }
    return n;
  }

  static int _safeDays(MockStore store) {
    final baseline = DateTime.parse(
      DashboardPolicy.roi['accidentFreeBaselineDate']! as String,
    );
    var latest = baseline;
    for (final i in store.all(Col.incidents)) {
      final t = i['type'];
      if (t != 'LOST_TIME' && t != 'FATALITY') continue;
      final raw = i.strOrNull('occurredAt');
      if (raw == null) continue;
      final at = DateTime.parse(raw);
      if (at.isAfter(latest)) latest = at;
    }
    return Dhaka.clock().difference(latest).inDays.clamp(0, 9999);
  }

  static int _activeStaff(MockStore store, {String? siteId, String? deptId}) {
    var n = 0;
    for (final e in store.all(Col.employees)) {
      final st = e.str('status');
      if (st == 'OFFBOARDED') continue;
      if (siteId != null && e.obj('site')['id'] != siteId) continue;
      if (deptId != null && e.obj('department')['id'] != deptId) continue;
      n++;
    }
    return n;
  }

  static int _onLeave(MockStore store, {String? siteId}) {
    var n = 0;
    for (final e in store.all(Col.employees)) {
      if (e['status'] != 'ON_LEAVE') continue;
      if (siteId != null && e.obj('site')['id'] != siteId) continue;
      n++;
    }
    return n;
  }

  static int _punchedToday(MockStore store) {
    final day = _today();
    final seen = <String>{};
    for (final p in store.all(Col.punches)) {
      final at = p.strOrNull('punchedAt') ?? '';
      if (!at.startsWith(day)) continue;
      seen.add(p.str('employeeId'));
    }
    return seen.length;
  }

  static int _openExits(MockStore store) =>
      store.all(Col.exitClearances).where((c) => c['status'] == 'OPEN').length;

  static int _waitlist(MockStore store) =>
      store.all(Col.busWaitlist).where((w) => w['status'] == 'WAITING').length;

  static int _reqsPending(MockStore store) => store
      .all(Col.fleetRequisitions)
      .where(
        (r) =>
            r['status'] == 'PENDING_APPROVAL' ||
            r['status'] == 'APPROVED' ||
            r['status'] == 'ASSIGNED',
      )
      .length;

  static int _onRoad(MockStore store) => store
      .all(Col.fleetTrips)
      .where((t) => t['endedAt'] == null && t['status'] != 'CANCELLED')
      .length;

  static int _operationalAssets(MockStore store) {
    var op = 0;
    var all = 0;
    for (final a in store.all(Col.assets)) {
      final st = a.strOrNull('stage') ?? '';
      if (const {
        'DISPOSED',
        'DECOMMISSIONED',
        'LOST',
        'REQUESTED',
        'PROCURED',
      }.contains(st)) {
        continue;
      }
      all++;
      if (st == 'OPERATIONAL') op++;
    }
    return all == 0 ? 0 : ((op / all) * 100).round();
  }

  static Json _kpi(String key, String en, String bn, Object? value) => {
    'key': key,
    'labelEn': en,
    'labelBn': bn,
    'value': value,
    'empty': value == null,
  };

  static Json _need(String tone, String en, String bn, String route) => {
    'tone': tone,
    'sentenceEn': en,
    'sentenceBn': bn,
    'route': route,
  };

  static List<Json> _needs(MockStore store, AuthContext a, String layout) {
    final out = <Json>[];
    final pending = _pendingApprovals(store, a);
    if (pending > 0 &&
        const {'CHAIRMAN', 'PLANT_GM', 'HOD', 'HR_ADMIN'}.contains(layout)) {
      out.add(
        _need(
          'danger',
          pending == 1
              ? '1 file is waiting for you.'
              : '$pending files are waiting for you.',
          pending == 1
              ? '১টি ফাইল আপনার অপেক্ষায়।'
              : '$pendingটি ফাইল আপনার অপেক্ষায়।',
          '/home/approvals',
        ),
      );
    }
    final risk = _licencesAtRisk(
      store,
      siteId: layout == 'PLANT_GM' ? a.employee.obj('site').str('id') : null,
    );
    if (risk > 0 && const {'CHAIRMAN', 'PLANT_GM'}.contains(layout)) {
      out.add(
        _need(
          'danger',
          risk == 1
              ? '1 permit runs out within a month.'
              : '$risk permits run out within a month.',
          risk == 1
              ? '১টি অনুমতি এক মাসের মধ্যে শেষ।'
              : '$riskটি অনুমতি এক মাসের মধ্যে শেষ।',
          '/home/licences',
        ),
      );
    }
    final open = _openIncidents(
      store,
      siteId: layout == 'PLANT_GM' ? a.employee.obj('site').str('id') : null,
    );
    if (open > 0 && const {'CHAIRMAN', 'PLANT_GM', 'HOD'}.contains(layout)) {
      out.add(
        _need(
          'warning',
          open == 1
              ? '1 safety case is still open.'
              : '$open safety cases are still open.',
          open == 1
              ? '১টি নিরাপত্তা ঘটনা খোলা।'
              : '$openটি নিরাপত্তা ঘটনা খোলা।',
          '/home/incidents',
        ),
      );
    }
    if (layout == 'HR_ADMIN') {
      final x = _openExits(store);
      if (x > 0) {
        out.add(
          _need(
            'warning',
            x == 1
                ? '1 person is leaving — desks are open.'
                : '$x people are leaving — desks are open.',
            x == 1 ? '১ জন যাচ্ছেন — ঘর খোলা।' : '$x জন যাচ্ছেন — ঘর খোলা।',
            '/home/people',
          ),
        );
      }
    }
    if (layout == 'TRANSPORT_ADMIN') {
      final q = _reqsPending(store);
      if (q > 0) {
        out.add(
          _need(
            'warning',
            q == 1
                ? '1 car request needs a driver.'
                : '$q car requests need a driver.',
            q == 1
                ? '১টি গাড়ির অনুরোধে চালক লাগবে।'
                : '$qটি গাড়ির অনুরোধে চালক লাগবে।',
            '/home/fleet',
          ),
        );
      }
      final w = _waitlist(store);
      if (w > 0) {
        out.add(
          _need(
            'info',
            '$w people are waiting for a staff-bus seat.',
            '$w জন স্টাফ বাসের আসনের অপেক্ষায়।',
            '/home/bus',
          ),
        );
      }
    }
    if (layout == 'EMPLOYEE' || layout == 'DRIVER') {
      final mine = store
          .all(Col.leaveRequests)
          .where(
            (l) =>
                l['employeeId'] == a.employeeId &&
                const {'SUBMITTED', 'IN_REVIEW'}.contains(l['status']),
          )
          .length;
      if (mine > 0) {
        out.add(
          _need(
            'info',
            'Your leave request is still with your manager.',
            'আপনার ছুটির আবেদন এখনও ম্যানেজারের কাছে।',
            '/home/leave',
          ),
        );
      }
    }
    if (layout == 'DRIVER') {
      final trip = store.all(Col.fleetTrips).where((t) {
        return t['driverUserId'] == a.user['id'] && t['endedAt'] == null;
      });
      if (trip.isNotEmpty) {
        out.add(
          _need(
            'warning',
            'You have a trip on the road. Open it before you move.',
            'আপনার একটি যাত্রা চলছে। যাওয়ার আগে খুলুন।',
            '/home/fleet',
          ),
        );
      }
    }
    if (out.isEmpty) {
      out.add(_need('info', 'All clear for now.', 'এখন সব ঠিক আছে।', '/home'));
    }
    return out;
  }

  static List<Json> _kpis(MockStore store, AuthContext a, String layout) {
    final site = a.employee.obj('site').str('id');
    final dept = a.employee.obj('department').str('id');
    switch (layout) {
      case 'CHAIRMAN':
        return [
          _kpi(
            'pendingApprovals',
            'Waiting for you',
            'আপনার অপেক্ষায়',
            _pendingApprovals(store, a),
          ),
          _kpi(
            'safeDays',
            'Days without a lost-time injury',
            'কাজ হারানো আঘাত ছাড়া দিন',
            _safeDays(store),
          ),
          _kpi(
            'licencesAtRisk',
            'Permits this month',
            'এই মাসের অনুমতি',
            _licencesAtRisk(store),
          ),
          _kpi(
            'present',
            'Punched in today',
            'আজ হাজিরা',
            _punchedToday(store),
          ),
        ];
      case 'PLANT_GM':
        return [
          _kpi(
            'openIncidents',
            'Open safety cases',
            'খোলা নিরাপত্তা',
            _openIncidents(store, siteId: site),
          ),
          _kpi(
            'licencesAtRisk',
            'Permits this month',
            'এই মাসের অনুমতি',
            _licencesAtRisk(store, siteId: site),
          ),
          _kpi(
            'safeDays',
            'Days without a lost-time injury',
            'কাজ হারানো আঘাত ছাড়া দিন',
            _safeDays(store),
          ),
          _kpi(
            'assetOk',
            'Machines in service %',
            'কাজে থাকা যন্ত্র %',
            _operationalAssets(store),
          ),
        ];
      case 'HR_ADMIN':
        return [
          _kpi(
            'headcount',
            'People on the books',
            'খাতায় মানুষ',
            _activeStaff(store),
          ),
          _kpi('onLeave', 'On leave today', 'আজ ছুটিতে', _onLeave(store)),
          _kpi('leaving', 'Leaving', 'যাচ্ছেন', _openExits(store)),
          _kpi(
            'present',
            'Punched in today',
            'আজ হাজিরা',
            _punchedToday(store),
          ),
        ];
      case 'TRANSPORT_ADMIN':
        return [
          _kpi('reqs', 'Car requests', 'গাড়ির অনুরোধ', _reqsPending(store)),
          _kpi('onRoad', 'On the road', 'রাস্তায়', _onRoad(store)),
          _kpi('waitlist', 'Bus waitlist', 'বাস অপেক্ষা', _waitlist(store)),
          _kpi(
            'pendingApprovals',
            'Waiting for you',
            'আপনার অপেক্ষায়',
            _pendingApprovals(store, a),
          ),
        ];
      case 'HOD':
        return [
          _kpi(
            'pendingApprovals',
            'Waiting for you',
            'আপনার অপেক্ষায়',
            _pendingApprovals(store, a),
          ),
          _kpi(
            'pendingValue',
            'Value in those files (৳)',
            'সেই ফাইলের টাকা',
            _pendingValue(store, a).round(),
          ),
          _kpi(
            'deptHeadcount',
            'Your department',
            'আপনার বিভাগ',
            _activeStaff(store, deptId: dept),
          ),
          _kpi(
            'openIncidents',
            'Open safety cases',
            'খোলা নিরাপত্তা',
            _openIncidents(store),
          ),
        ];
      case 'DRIVER':
        return [
          _kpi(
            'onRoad',
            'Your open trips',
            'আপনার খোলা যাত্রা',
            store
                .all(Col.fleetTrips)
                .where(
                  (t) =>
                      t['driverUserId'] == a.user['id'] && t['endedAt'] == null,
                )
                .length,
          ),
          _kpi(
            'safeDays',
            'Company safe days',
            'কোম্পানির নিরাপদ দিন',
            _safeDays(store),
          ),
        ];
      default:
        final bal = store
            .all(Col.leaveBalances)
            .where((b) => b['employeeId'] == a.employeeId);
        var left = 0.0;
        for (final b in bal) {
          left += ((b['entitled'] as num?) ?? 0) - ((b['used'] as num?) ?? 0);
        }
        return [
          _kpi(
            'leaveLeft',
            'Leave days left this year',
            'এই বছর ছুটি বাকি',
            left.round(),
          ),
          _kpi(
            'myClaims',
            'Your open claims',
            'আপনার খোলা দাবি',
            store
                .all(Col.claims)
                .where(
                  (c) =>
                      c['employeeId'] == a.employeeId &&
                      !const {
                        'SETTLED',
                        'REJECTED',
                        'CANCELLED',
                        'DRAFT',
                      }.contains(c['status']),
                )
                .length,
          ),
        ];
    }
  }

  static List<Json> _leaders(MockStore store) {
    final out = <Json>[];
    for (final id in DashboardPolicy.innerCircle) {
      final u = store.get(Col.users, id);
      final e = u == null
          ? null
          : store.get(Col.employees, u.str('employeeId'));
      if (e == null) continue;
      var status = 'PRESENT';
      if (e['status'] == 'ON_LEAVE') status = 'ON_APPROVED_LEAVE';
      if (e['status'] == 'OFFBOARDING') status = 'OFF';
      out.add({
        'userId': id,
        'name': e['fullName'],
        'nameBn': e['fullNameBn'],
        'title': e.obj('designation')['title'],
        'status': status,
        'site': e.obj('site')['name'],
        'phone': e['phone'],
      });
    }
    return out;
  }

  static List<Json> _extras(MockStore store, AuthContext a, String layout) {
    final extras = <Json>[];
    if (layout == 'CHAIRMAN') {
      extras
        ..add({
          'kind': 'leaders',
          'titleEn': 'Leadership today',
          'titleBn': 'আজ নেতৃত্ব',
          'leaders': _leaders(store),
        })
        ..add({
          'kind': 'roi',
          'titleEn': 'Declared savings (not a live calculation)',
          'titleBn': 'ঘোষিত সাশ্রয় (লাইভ হিসাব নয়)',
          'roi': DashboardPolicy.roi,
        });
      final briefs =
          store
              .all(Col.briefings)
              .where((b) => b['publishedAt'] != null)
              .toList()
            ..sort(
              (x, y) => y.str('publishedAt').compareTo(x.str('publishedAt')),
            );
      if (briefs.isNotEmpty) {
        extras.add({
          'kind': 'briefing',
          'titleEn': briefs.first.str('title'),
          'titleBn':
              briefs.first.strOrNull('titleBn') ?? briefs.first.str('title'),
          'bodyEn': briefs.first.str('transcript'),
          'bodyBn':
              briefs.first.strOrNull('transcriptBn') ??
              briefs.first.str('transcript'),
          'id': briefs.first['id'],
        });
      }
    }
    if (layout == 'HR_ADMIN') {
      extras
        ..add({
          'kind': 'exits',
          'titleEn': 'Open exit files',
          'titleBn': 'খোলা প্রস্থান ফাইল',
          'items': [
            for (final c in store.all(Col.exitClearances))
              if (c['status'] == 'OPEN')
                {
                  'employeeId': c['employeeId'],
                  'name': store.get(
                    Col.employees,
                    c.str('employeeId'),
                  )?['fullName'],
                  'lastWorkingDay': c['lastWorkingDay'],
                  'pending': c
                      .objList('items')
                      .where((i) => i['status'] == 'PENDING')
                      .length,
                  'route': '/home/people/${c['employeeId']}',
                },
          ],
        })
        ..add({
          'kind': 'sites',
          'titleEn': 'People at each workplace',
          'titleBn': 'প্রতি কর্মস্থলে মানুষ',
          'items': [
            for (final s in sites)
              {
                'name': s['name'],
                'nameBn': s['nameBn'],
                'body':
                    '${_activeStaff(store, siteId: s.str('id'))} on the books',
                'bodyBn':
                    '${_activeStaff(store, siteId: s.str('id'))} জন খাতায়',
                'route': '/home/people',
              },
          ],
        });
    }
    if (layout == 'PLANT_GM') {
      extras
        ..add({
          'kind': 'permits',
          'titleEn': 'Work permits and lock-outs',
          'titleBn': 'কাজের অনুমতি ও লক-আউট',
          'items': [
            for (final p in store.all(Col.workPermits))
              if (p['siteId'] == a.employee.obj('site')['id'])
                {
                  'id': p['id'],
                  'name': p['machine'],
                  'nameBn': p['machineBn'] ?? p['machine'],
                  'body': p['note'],
                  'bodyBn': p['noteBn'] ?? p['note'],
                  'status': p['status'],
                  'kind': p['kind'],
                  'canRestore': p['status'] == 'LOCKED',
                },
          ],
        })
        ..add({
          'kind': 'handovers',
          'titleEn': 'Shift handover',
          'titleBn': 'শিফট হস্তান্তর',
          'items': [
            for (final h in store.all(Col.shiftHandovers))
              if (h['siteId'] == a.employee.obj('site')['id'])
                {
                  'id': h['id'],
                  'name': h['shiftLabel'],
                  'nameBn': h['shiftLabelBn'] ?? h['shiftLabel'],
                  'body': h['notes'],
                  'bodyBn': h['notesBn'] ?? h['notes'],
                  'status': h['status'],
                  'canSign':
                      h['status'] == 'WAITING_SIGNATURE' &&
                      h['incomingUserId'] == a.user['id'],
                },
          ],
        })
        ..add({
          'kind': 'list',
          'titleEn': 'Permits that run out first',
          'titleBn': 'যে অনুমতি আগে শেষ',
          'items': [
            for (final l in store.all(Col.compliance))
              if (LicenceEngine.daysToExpiry(store, l) <= 90)
                {
                  'name': l['title'],
                  'body': '${LicenceEngine.daysToExpiry(store, l)} days',
                  'route': '/home/licences/${l['id']}',
                },
          ],
        });
    }
    if (layout == 'EMPLOYEE') {
      extras.add({
        'kind': 'leave',
        'titleEn': 'My leave this year',
        'titleBn': 'এই বছর আমার ছুটি',
        'items': [
          for (final b in store.all(Col.leaveBalances))
            if (b['employeeId'] == a.employeeId)
              {
                'name':
                    store.get(Col.leaveTypes, b.str('leaveTypeId'))?['name'] ??
                    b['leaveTypeId'],
                'left':
                    ((b['entitled'] as num?) ?? 0) - ((b['used'] as num?) ?? 0),
              },
        ],
      });
    }
    if (layout == 'HOD') {
      const ceiling = 12000000;
      const committed = 3840000;
      final pending = _pendingValue(store, a).round();
      final left = ceiling - committed - pending;
      final pct = ((left / ceiling) * 100).round();
      extras.add({
        'kind': 'budget',
        'titleEn': 'This quarter’s department money',
        'titleBn': 'এই ত্রৈমাসিকের বিভাগীয় টাকা',
        'bodyEn': pct < 10
            ? 'Less than 10% of the quarterly envelope is left (৳$left).'
            : 'About $pct% of the quarterly envelope is still free (৳$left).',
        'bodyBn': pct < 10
            ? 'ত্রৈমাসিক বাজেটের ১০%-এর কম বাকি (৳$left)।'
            : 'ত্রৈমাসিক বাজেটের প্রায় $pct% এখনও খালি (৳$left)।',
        'route': '/home/approvals',
      });
    }
    if (layout == 'TRANSPORT_ADMIN') {
      extras.add({
        'kind': 'transport',
        'titleEn': 'Cars waiting for a driver',
        'titleBn': 'চালকের অপেক্ষায় গাড়ি',
        'items': [
          for (final r in store.all(Col.fleetRequisitions))
            if (r['status'] == 'APPROVED' || r['status'] == 'PENDING_APPROVAL')
              {
                'id': r['id'],
                'name': r['destination'] ?? r['refNo'] ?? r['id'],
                'body': r['purpose'] ?? r['status'],
                'status': r['status'],
                'route': '/home/fleet/${r['id']}',
              },
        ],
      });
    }
    if (layout == 'DRIVER') {
      Json? trip;
      for (final t in store.all(Col.fleetTrips)) {
        if (t['driverUserId'] == a.user['id'] && t['endedAt'] == null) {
          trip = t;
          break;
        }
      }
      extras.add({
        'kind': 'driverTrip',
        'titleEn': trip == null ? 'No trip on the road' : 'Your current trip',
        'titleBn': trip == null
            ? 'রাস্তায় কোনো যাত্রা নেই'
            : 'আপনার চলতি যাত্রা',
        'bodyEn': trip == null
            ? 'When Transport assigns you a car, start and finish odometer will show here.'
            : 'Write the start and finish odometer on the trip before you move.',
        'bodyBn': trip == null
            ? 'পরিবহন গাড়ি দিলে শুরু ও শেষ ওডোমিটার এখানে দেখাবে।'
            : 'যাওয়ার আগে যাত্রায় শুরু ও শেষ ওডোমিটার লিখুন।',
        'route': trip == null
            ? '/home/fleet'
            : '/home/fleet/${trip['requisitionId'] ?? trip['id']}',
        'items': [
          if (trip != null)
            {
              'name': trip['destination'] ?? trip['id'],
              'body':
                  'Odo ${trip['startOdometer'] ?? '—'} → ${trip['endOdometer'] ?? '—'}',
              'route': '/home/fleet/${trip['requisitionId'] ?? trip['id']}',
            },
        ],
      });
    }
    return extras;
  }

  static Json me(MockStore store, AuthContext a) {
    final layout = layoutOf(a);
    return {
      'layout': layout,
      'needs': _needs(store, a, layout),
      'kpis': _kpis(store, a, layout),
      'extras': _extras(store, a, layout),
      'canBrief': _role(a, 'CHAIRMAN'),
      'canBroadcast': _role(a, 'CHAIRMAN') || _role(a, 'HR_ADMIN'),
      'badges': badges(store, a),
      'broadcast': activeBroadcast(store, a),
    };
  }

  static Json badges(MockStore store, AuthContext a) {
    final uid = a.user.str('id');
    var unreadChat = 0;
    for (final ch in store.all(Col.chatChannels)) {
      if (!ChatEngine.isMember(ch, uid)) continue;
      unreadChat += ChatEngine.unread(store, ch, uid);
    }
    var guestsInside = 0;
    for (final v in store.all(Col.visits)) {
      if (v['status'] == 'CHECKED_IN') guestsInside++;
    }
    var custody = 0;
    for (final c in store.all(Col.assetCustody)) {
      if (c['holderEmployeeId'] == a.employeeId && c['ackedAt'] == null) {
        custody++;
      }
    }
    return {
      'approvals': _pendingApprovals(store, a),
      'chat': unreadChat,
      'incidents': _openIncidents(store),
      'visitors': guestsInside,
      'licences': _licencesAtRisk(store),
      'fleet': _reqsPending(store),
      'assets': custody,
      'attendance': store
          .all(Col.regularisations)
          .where((r) => r['status'] == 'PENDING')
          .length,
    };
  }

  static Json? activeBroadcast(MockStore store, AuthContext a) {
    Json? best;
    for (final b in store.all(Col.broadcasts)) {
      if (b['pinned'] != true) continue;
      if (best == null ||
          b.str('publishedAt').compareTo(best.str('publishedAt')) > 0) {
        best = b;
      }
    }
    if (best == null) return null;
    final dismissed = store.get(
      Col.broadcastDismissals,
      'bd_${best['id']}_${a.user['id']}',
    );
    if (dismissed != null) return null;
    return {
      'id': best['id'],
      'title': best['title'],
      'titleBn': best['titleBn'] ?? best['title'],
      'body': best['body'],
      'bodyBn': best['bodyBn'] ?? best['body'],
    };
  }

  static void dismissBroadcast(MockStore store, AuthContext a, String id) {
    if (store.get(Col.broadcasts, id) == null) throw notFound('Announcement');
    store.put(Col.broadcastDismissals, {
      'id': 'bd_${id}_${a.user['id']}',
      'broadcastId': id,
      'userId': a.user['id'],
      'at': store.nowIso(),
    });
  }

  static Json publishBroadcast(MockStore store, AuthContext a, Json body) {
    if (!_role(a, 'CHAIRMAN') && !_role(a, 'HR_ADMIN')) throw forbidden();
    final title = (body['title'] as String? ?? '').trim();
    final text = (body['body'] as String? ?? '').trim();
    if (title.length < 3) throw validationError('title', 'Give a short title');
    if (text.length < 10) throw validationError('body', 'Write the message');
    for (final b in store.all(Col.broadcasts)) {
      b['pinned'] = false;
      store.put(Col.broadcasts, b);
    }
    final n = store.all(Col.broadcasts).length + 1;
    final rec = <String, Object?>{
      'id': 'bc_$n',
      'title': title,
      'titleBn': (body['titleBn'] as String? ?? title).trim(),
      'body': text,
      'bodyBn': (body['bodyBn'] as String? ?? text).trim(),
      'authorUserId': a.user['id'],
      'publishedAt': store.nowIso(),
      'pinned': true,
    };
    store.put(Col.broadcasts, rec);
    return rec;
  }

  static Json restorePermit(MockStore store, AuthContext a, String id) {
    final p = store.get(Col.workPermits, id);
    if (p == null) throw notFound('Work permit');
    if (p['status'] != 'LOCKED') {
      throw invalidTransition('This lock-out is not waiting to be restored.');
    }
    p
      ..['status'] = 'RESTORED'
      ..['restoredAt'] = store.nowIso()
      ..['restoredBy'] = a.user['id'];
    store.put(Col.workPermits, p);
    return p;
  }

  static Json signHandover(MockStore store, AuthContext a, String id) {
    final h = store.get(Col.shiftHandovers, id);
    if (h == null) throw notFound('Handover');
    if (h['incomingUserId'] != a.user['id']) throw forbidden();
    if (h['status'] != 'WAITING_SIGNATURE') {
      throw invalidTransition('Already signed.');
    }
    h
      ..['status'] = 'SIGNED'
      ..['signedAt'] = store.nowIso();
    store.put(Col.shiftHandovers, h);
    return h;
  }

  static Json publishBriefing(MockStore store, AuthContext a, Json body) {
    final title = (body['title'] as String? ?? '').trim();
    final text = (body['transcript'] as String? ?? '').trim();
    if (title.length < 3) throw validationError('title', 'Give a short title');
    if (text.length < 20) {
      throw validationError('transcript', 'Write at least 20 characters');
    }
    final n = store.all(Col.briefings).length + 1;
    final rec = <String, Object?>{
      'id': 'vb_$n',
      'refNo': 'VB-2026-${n.toString().padLeft(4, '0')}',
      'title': title,
      'titleBn': (body['titleBn'] as String? ?? title).trim(),
      'transcript': text,
      'transcriptBn': (body['transcriptBn'] as String? ?? text).trim(),
      'authorUserId': a.user['id'],
      'publishedAt': store.nowIso(),
      'priority': body['priority'] ?? 'NORMAL',
    };
    store.put(Col.briefings, rec);
    NotificationEngine.notifyRole(
      store,
      role: 'HOD',
      type: 'BRIEFING_PUBLISHED',
      title: Bi(title, rec.str('titleBn')),
      body: Bi(text, rec.str('transcriptBn')),
      data: {'module': 'dashboards', 'route': '/home/dashboards'},
    );
    NotificationEngine.notifyRole(
      store,
      role: 'PLANT_GM',
      type: 'BRIEFING_PUBLISHED',
      title: Bi(title, rec.str('titleBn')),
      body: Bi(text, rec.str('transcriptBn')),
      data: {'module': 'dashboards', 'route': '/home/dashboards'},
    );
    return rec;
  }

  static void listen(MockStore store, AuthContext a, String id) {
    final b = store.get(Col.briefings, id);
    if (b == null) throw notFound('Briefing');
    store.put(Col.briefingListens, {
      'id': 'vbl_${id}_${a.user['id']}',
      'briefingId': id,
      'userId': a.user['id'],
      'at': store.nowIso(),
    });
  }
}
