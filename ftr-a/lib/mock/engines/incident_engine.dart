import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Settings behind doc 06 MOD-07 (BR-07-01 … BR-07-13).
abstract final class IncidentPolicy {
  static const types = {
    'NEAR_MISS',
    'HAZARD',
    'MEDICAL_TREATMENT',
    'LOST_TIME',
    'SPILL_LEAK',
    'FIRE_THERMAL',
    'EQUIPMENT_DAMAGE',
    'ENVIRONMENTAL',
    'VEHICLE_ACCIDENT',
    'PRESSURE_PIPING',
    'FATALITY',
  };
  static const stages = {
    'REPORTED',
    'TRIAGED',
    'UNDER_INVESTIGATION',
    'CAPA_EXECUTION',
    'MANAGEMENT_REVIEW',
    'CLOSED',
  };
  static const capaTypes = {
    'IMMEDIATE_CONTAINMENT',
    'CORRECTIVE',
    'PREVENTIVE',
  };
  static const capaStatus = {
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'VERIFIED',
    'OVERDUE',
  };
  static const personRoles = {'INJURED', 'WITNESS', 'FIRST_AIDER'};
  static const zones = <Json>[
    {
      'id': 'z_hq_yard',
      'siteId': 'site_hq',
      'name': 'Head-office yard',
      'nameBn': 'প্রধান কার্যালয়ের উঠান',
    },
    {
      'id': 'z_hq_park',
      'siteId': 'site_hq',
      'name': 'Car park',
      'nameBn': 'গাড়ি পার্ক',
    },
    {
      'id': 'z_pl_tank',
      'siteId': 'site_plant',
      'name': 'Storage Tank Yard TK-101–108',
      'nameBn': 'স্টোরেজ ট্যাংক ইয়ার্ড',
    },
    {
      'id': 'z_pl_proc',
      'siteId': 'site_plant',
      'name': 'Bitumen Thermal Processing Unit #2',
      'nameBn': 'বিটুমিন প্রক্রিয়াকরণ ইউনিট',
    },
    {
      'id': 'z_pl_gantry',
      'siteId': 'site_plant',
      'name': 'Bulk Tanker Loading Gantry',
      'nameBn': 'ট্যাংকার লোডিং গ্যান্ট্রি',
    },
    {
      'id': 'z_pl_gate',
      'siteId': 'site_plant',
      'name': 'Main truck gate',
      'nameBn': 'প্রধান ট্রাক গেট',
    },
  ];
  static const triageHours = {'EXTREME': 1, 'HIGH': 4, 'MEDIUM': 24, 'LOW': 72};
  static const capaDays = {
    'IMMEDIATE_CONTAINMENT': 1,
    'CORRECTIVE': 30,
    'PREVENTIVE': 60,
  };
}

/// Incidents, RCA, CAPA and two-signature close (doc 03 §13).
abstract final class IncidentEngine {
  static String? seedClock;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static String _me(AuthContext a) => a.user.str('id');

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static GrantScope _scope(AuthContext a, String key) {
    for (final g in a.grants) {
      if (g['key'] == key) return scopeFromWire(g.str('scope'));
    }
    return GrantScope.self;
  }

  static Json _data(Json i) => {
    'module': 'incidents',
    'route': '/home/incidents/${i['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json i,
    String type,
    Bi title,
    Bi body, {
    String priority = 'NORMAL',
    bool ack = false,
  }) => NotificationEngine.notify(
    store,
    userId: userId,
    type: type,
    title: title,
    body: body,
    priority: priority,
    ackRequired: ack,
    data: _data(i),
  );

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _next(
    MockStore store,
    String col,
    String field,
    String prefix,
  ) {
    final year = _year(store);
    var max = 0;
    for (final r in store.all(col)) {
      final n = r.strOrNull(field);
      if (n != null && n.startsWith('$prefix-$year-')) {
        final i = int.tryParse(n.substring(prefix.length + year.length + 2));
        if (i != null && i > max) max = i;
      }
    }
    return '$prefix-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static String? _text(Json b, String key, int min, int max) {
    final v = b[key];
    if (v == null) return null;
    if (v is! String || v.trim().length < min || v.length > max) {
      throw validationError(key, 'Invalid $key');
    }
    return v.trim();
  }

  static (int score, String cat) risk(int severity, int likelihood) {
    final score = severity * likelihood;
    final cat = score >= 16
        ? 'EXTREME'
        : score >= 10
        ? 'HIGH'
        : score >= 5
        ? 'MEDIUM'
        : 'LOW';
    return (score, cat);
  }

  static (bool reportable, String? body, int hours) statutoryFor({
    required String type,
    required int severity,
    required int injured,
  }) {
    if (type == 'FATALITY' || type == 'LOST_TIME') {
      return (true, 'DIFE', 24);
    }
    if (type == 'MEDICAL_TREATMENT' && injured >= 3) {
      return (true, 'DIFE', 24);
    }
    if (type == 'SPILL_LEAK' || type == 'ENVIRONMENTAL') {
      return (true, 'DOENV', 48);
    }
    if (type == 'FIRE_THERMAL') return (true, 'FSCD', 24);
    if (type == 'PRESSURE_PIPING' && severity >= 3) {
      return (true, 'DOEXP', 24);
    }
    if (type == 'VEHICLE_ACCIDENT' && injured > 0) {
      return (true, 'BRTA', 72);
    }
    return (false, null, 0);
  }

  static List<Json> capasOf(MockStore store, String incidentId) {
    final now = DateTime.parse(store.nowIso());
    return [
      for (final c in store.all(Col.incidentCapas))
        if (c['incidentId'] == incidentId) _tickCapa(store, c, now),
    ];
  }

  static Json _tickCapa(MockStore store, Json c, DateTime now) {
    final due = DateTime.tryParse(c.strOrNull('dueAt') ?? '');
    final st = c.str('status');
    if (due != null &&
        due.isBefore(now) &&
        (st == 'PENDING' || st == 'IN_PROGRESS')) {
      c['status'] = 'OVERDUE';
      store.put(Col.incidentCapas, c);
    }
    return c;
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    final type = body['type'] as String? ?? '';
    if (!IncidentPolicy.types.contains(type)) {
      throw validationError('type', 'Unknown incident type');
    }
    final title = _text(body, 'title', 5, 160);
    final quick = body['quick'] == true;
    final desc = _text(body, 'description', quick ? 10 : 20, 4000);
    if (title == null) throw validationError('title', 'Say what happened');
    if (desc == null) {
      throw validationError('description', 'Describe what you saw');
    }
    final siteId = body['siteId'] as String? ?? auth.employee.obj('site')['id'];
    if (siteId is! String) throw validationError('siteId', 'Choose a site');
    final sev = (body['severity'] as num?)?.toInt();
    final like = (body['likelihood'] as num?)?.toInt();
    if (sev == null || sev < 1 || sev > 5) {
      throw validationError('severity', 'Choose 1 to 5');
    }
    if (like == null || like < 1 || like > 5) {
      throw validationError('likelihood', 'Choose 1 to 5');
    }
    final occurredRaw = body['occurredAt'];
    if (occurredRaw is! String) {
      throw validationError('occurredAt', 'When did this happen');
    }
    final occurred = DateTime.parse(occurredRaw);
    final now = DateTime.parse(_stamp(store));
    if (occurred.isAfter(now.add(const Duration(minutes: 5)))) {
      throw validationError('occurredAt', 'It cannot be in the future');
    }
    final late = occurred.isBefore(now.subtract(const Duration(days: 30)));
    final people = [
      for (final p in (body['people'] as List?) ?? const [])
        if (p is Map) Map<String, Object?>.from(p),
    ];
    final injured = people.where((p) => p['role'] == 'INJURED').length;
    final scored = risk(sev, like);
    final stat = statutoryFor(type: type, severity: sev, injured: injured);
    final anonymous = body['isAnonymous'] == true;
    final nowIso = _stamp(store);
    final i = <String, Object?>{
      'id':
          body['id'] as String? ??
          'inc_${store.collection(Col.incidents).length + 1}_${store.nowMs()}',
      'incidentNo': _next(store, Col.incidents, 'incidentNo', 'INC'),
      'stage': 'REPORTED',
      'type': type,
      'title': title,
      'description': desc,
      'siteId': siteId,
      'zone': _text(body, 'zone', 2, 120),
      'occurredAt': occurred.toUtc().toIso8601String(),
      'severity': sev,
      'likelihood': like,
      'riskScore': scored.$1,
      'riskCategory': scored.$2,
      'immediateActions': _text(body, 'immediateActions', 0, 400),
      'isAnonymous': anonymous,
      'reporterUserId': anonymous ? null : _me(auth),
      'investigatorUserId': null,
      'people': people,
      'rca': null,
      'statutoryReportable': stat.$1,
      'statutoryBodyCode': stat.$2,
      'statutoryDueAt': stat.$1
          ? occurred.add(Duration(hours: stat.$3)).toUtc().toIso8601String()
          : null,
      'statutoryReceiptNo': null,
      'lateReport': late,
      'closure': null,
      'photoFileIds': [
        for (final id in (body['attachmentFileIds'] as List?) ?? const [])
          if (id is String) id,
      ],
      'createdAt': nowIso,
      'updatedAt': nowIso,
    };
    for (final fid in i.strList('photoFileIds')) {
      FileEngine.attach(
        store,
        fid,
        ownerType: 'Incident',
        ownerId: i.str('id'),
      );
    }
    store.put(Col.incidents, i);
    final critical = scored.$2 == 'HIGH' || scored.$2 == 'EXTREME';
    for (final u in store.all(Col.users)) {
      final roles = u.strList('roles');
      if (roles.contains('HSE_OFFICER') || roles.contains('PLANT_GM')) {
        _notify(
          store,
          u.str('id'),
          i,
          'INCIDENT_REPORTED',
          const Bi(
            'A safety report needs you',
            'একটি নিরাপত্তা রিপোর্ট আপনার দরকার',
          ),
          Bi(title, title),
          priority: critical ? 'CRITICAL' : 'HIGH',
          ack: critical,
        );
      }
      if (critical && roles.contains('CHAIRMAN')) {
        _notify(
          store,
          u.str('id'),
          i,
          'INCIDENT_CRITICAL',
          const Bi('Serious incident reported', 'গুরুতর ঘটনা রিপোর্ট হয়েছে'),
          Bi(title, title),
          priority: 'CRITICAL',
          ack: true,
        );
      }
    }
    if (injured > 0) {
      NotificationEngine.notifyRole(
        store,
        role: 'HR_ADMIN',
        type: 'INCIDENT_EMPLOYEE_INJURED',
        title: const Bi('Someone was hurt', 'কেউ আহত হয়েছেন'),
        body: Bi(title, title),
        priority: 'HIGH',
        data: _data(i),
      );
    }
    return i;
  }

  static void triage(MockStore store, AuthContext auth, Json i, Json body) {
    if (!_can(auth, 'incidents:triage')) throw forbidden();
    if (i['stage'] != 'REPORTED') {
      throw invalidTransition('This report has already been triaged.');
    }
    final sev =
        (body['severity'] as num?)?.toInt() ??
        (i['severity'] as num?)?.toInt() ??
        1;
    final like =
        (body['likelihood'] as num?)?.toInt() ??
        (i['likelihood'] as num?)?.toInt() ??
        1;
    if (sev < 1 || sev > 5 || like < 1 || like > 5) {
      throw validationError('severity', 'Choose 1 to 5');
    }
    final scored = risk(sev, like);
    final investigator = body['investigatorUserId'] as String?;
    if (scored.$2 != 'LOW' && (investigator == null || investigator.isEmpty)) {
      throw validationError('investigatorUserId', 'Name who will investigate');
    }
    if (investigator != null && store.get(Col.users, investigator) == null) {
      throw notFound('Investigator');
    }
    i
      ..['severity'] = sev
      ..['likelihood'] = like
      ..['riskScore'] = scored.$1
      ..['riskCategory'] = scored.$2
      ..['investigatorUserId'] = investigator
      ..['stage'] = 'TRIAGED'
      ..['updatedAt'] = _stamp(store);
    if (body['statutoryReportable'] == true) {
      i['statutoryReportable'] = true;
      i['statutoryBodyCode'] =
          body['statutoryBodyCode'] ?? i['statutoryBodyCode'] ?? 'DIFE';
    }
    store.put(Col.incidents, i);
    if (investigator != null) {
      _notify(
        store,
        investigator,
        i,
        'INCIDENT_ASSIGNED',
        const Bi(
          'You are investigating a report',
          'আপনি একটি রিপোর্ট তদন্ত করছেন',
        ),
        Bi('${i['title']}', '${i['title']}'),
        priority: 'HIGH',
      );
    }
  }

  static void investigate(MockStore store, AuthContext auth, Json i) {
    _mustInvestigator(auth, i);
    if (i['stage'] != 'TRIAGED') {
      throw invalidTransition('Triage this report first.');
    }
    i
      ..['stage'] = 'UNDER_INVESTIGATION'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
  }

  static void _mustInvestigator(AuthContext auth, Json i) {
    if (i['investigatorUserId'] == _me(auth)) return;
    if (_can(auth, 'incidents:manage')) return;
    throw forbidden();
  }

  static void saveRca(MockStore store, AuthContext auth, Json i, Json body) {
    _mustInvestigator(auth, i);
    if (i['stage'] != 'UNDER_INVESTIGATION' && i['stage'] != 'TRIAGED') {
      throw invalidTransition('Investigation has not started.');
    }
    if (i['stage'] == 'TRIAGED') {
      i['stage'] = 'UNDER_INVESTIGATION';
    }
    final why1 = _text(body, 'why1', 3, 500);
    final why2 = _text(body, 'why2', 3, 500);
    final why3 = _text(body, 'why3', 3, 500);
    final root = _text(body, 'rootCause', 10, 2000);
    if (why1 == null || why2 == null || why3 == null || root == null) {
      throw validationError(
        'rootCause',
        'Write at least three whys and the root cause',
      );
    }
    i
      ..['rca'] = {
        'why1': why1,
        'why2': why2,
        'why3': why3,
        'why4': _text(body, 'why4', 0, 500),
        'why5': _text(body, 'why5', 0, 500),
        'rootCause': root,
        'completedAt': _stamp(store),
      }
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
  }

  static Json addCapa(MockStore store, AuthContext auth, Json i, Json body) {
    if (!_can(auth, 'incidents:capa') && i['investigatorUserId'] != _me(auth)) {
      throw forbidden();
    }
    final rca = i['rca'];
    if (rca is! Map || rca['completedAt'] == null) {
      throw policyViolation(
        'RCA_REQUIRED',
        'Find the root cause before adding a fix.',
      );
    }
    final type = body['type'] as String? ?? 'CORRECTIVE';
    if (!IncidentPolicy.capaTypes.contains(type)) {
      throw validationError('type', 'Unknown fix type');
    }
    final desc = _text(body, 'description', 10, 400);
    if (desc == null) {
      throw validationError('description', 'Say what must be fixed');
    }
    final owner = body['ownerUserId'];
    if (owner is! String || store.get(Col.users, owner) == null) {
      throw validationError('ownerUserId', 'Name who will do this');
    }
    final days = IncidentPolicy.capaDays[type] ?? 30;
    final due =
        body['dueAt'] as String? ??
        DateTime.parse(_stamp(store))
            .add(Duration(days: days))
            .toIso8601String();
    final c = <String, Object?>{
      'id':
          'capa_${store.collection(Col.incidentCapas).length + 1}_${store.nowMs()}',
      'capaNo': _next(store, Col.incidentCapas, 'capaNo', 'CAPA'),
      'incidentId': i['id'],
      'type': type,
      'description': desc,
      'ownerUserId': owner,
      'status': 'PENDING',
      'dueAt': due,
      'evidence': null,
      'verifiedByUserId': null,
      'createdAt': _stamp(store),
    };
    store.put(Col.incidentCapas, c);
    if (i['stage'] == 'UNDER_INVESTIGATION' || i['stage'] == 'TRIAGED') {
      i['stage'] = 'CAPA_EXECUTION';
    }
    i['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
    _notify(
      store,
      owner,
      i,
      'INCIDENT_CAPA_ASSIGNED',
      const Bi('A safety fix is yours', 'একটি নিরাপত্তা সংশোধন আপনার'),
      Bi(desc, desc),
      priority: 'HIGH',
    );
    return c;
  }

  static void startCapa(MockStore store, AuthContext auth, Json c) {
    if (c['ownerUserId'] != _me(auth) && !_can(auth, 'incidents:capa')) {
      throw forbidden();
    }
    if (c['status'] != 'PENDING' && c['status'] != 'OVERDUE') {
      throw invalidTransition('This fix has already started.');
    }
    c
      ..['status'] = 'IN_PROGRESS'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidentCapas, c);
  }

  static void completeCapa(
    MockStore store,
    AuthContext auth,
    Json c,
    Json body,
  ) {
    if (c['ownerUserId'] != _me(auth) && !_can(auth, 'incidents:capa')) {
      throw forbidden();
    }
    if (c['status'] != 'IN_PROGRESS' &&
        c['status'] != 'OVERDUE' &&
        c['status'] != 'PENDING') {
      throw invalidTransition('This fix cannot be completed now.');
    }
    final ev = _text(body, 'evidence', 10, 800);
    if (ev == null) {
      throw validationError('evidence', 'Say what you did, in a sentence');
    }
    c
      ..['status'] = 'COMPLETED'
      ..['evidence'] = ev
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidentCapas, c);
  }

  static void verifyCapa(MockStore store, AuthContext auth, Json c) {
    if (!_can(auth, 'incidents:capa-verify')) throw forbidden();
    if (c['ownerUserId'] == _me(auth)) {
      throw policyViolation(
        'CAPA_SELF',
        'Someone else must confirm your own fix.',
      );
    }
    if (c['status'] != 'COMPLETED') {
      throw invalidTransition('The owner must finish the fix first.');
    }
    c
      ..['status'] = 'VERIFIED'
      ..['verifiedByUserId'] = _me(auth)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidentCapas, c);
    final i = store.get(Col.incidents, c.str('incidentId'));
    if (i == null) return;
    final open = capasOf(
      store,
      i.str('id'),
    ).where((x) => x['status'] != 'VERIFIED');
    if (open.isEmpty && i['stage'] == 'CAPA_EXECUTION') {
      i
        ..['stage'] = 'MANAGEMENT_REVIEW'
        ..['updatedAt'] = _stamp(store);
      store.put(Col.incidents, i);
      for (final u in store.all(Col.users)) {
        if (u.strList('roles').contains('PLANT_GM') ||
            u.strList('roles').contains('HSE_OFFICER')) {
          _notify(
            store,
            u.str('id'),
            i,
            'INCIDENT_READY_FOR_CLOSURE',
            const Bi('Ready to close', 'বন্ধ করার জন্য প্রস্তুত'),
            Bi('${i['title']}', '${i['title']}'),
          );
        }
      }
    }
  }

  static void review(MockStore store, AuthContext auth, Json i) {
    if (!_can(auth, 'incidents:close') && !_can(auth, 'incidents:manage')) {
      throw forbidden();
    }
    if (i['stage'] != 'CAPA_EXECUTION') {
      throw invalidTransition('Fixes must finish first.');
    }
    final open = capasOf(
      store,
      i.str('id'),
    ).where((x) => x['status'] != 'VERIFIED');
    if (open.isNotEmpty) {
      throw policyViolation('CAPA_OPEN', 'Every fix must be confirmed first.');
    }
    i
      ..['stage'] = 'MANAGEMENT_REVIEW'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
  }

  static void close(MockStore store, AuthContext auth, Json i, Json body) {
    if (i['stage'] != 'MANAGEMENT_REVIEW') {
      throw invalidTransition('This report is not waiting for a signature.');
    }
    final closure = Map<String, Object?>.from(i['closure'] as Map? ?? {});
    final remarks = _text(body, 'remarks', 0, 400);
    if (closure['safetySignedAt'] == null) {
      if (!_can(auth, 'incidents:manage')) throw forbidden();
      if (i['investigatorUserId'] == _me(auth) &&
          !_can(auth, 'incidents:close')) {
        throw policyViolation(
          'HSE_SIGNER',
          'The investigator cannot also sign as safety lead.',
        );
      }
      closure
        ..['safetyOfficerUserId'] = _me(auth)
        ..['safetySignedAt'] = _stamp(store)
        ..['safetyRemarks'] = remarks;
      i['closure'] = closure;
      i['updatedAt'] = _stamp(store);
      store.put(Col.incidents, i);
      return;
    }
    if (closure['managerSignedAt'] != null) {
      throw invalidTransition('Already closed.');
    }
    if (!_can(auth, 'incidents:close')) throw forbidden();
    closure
      ..['managerUserId'] = _me(auth)
      ..['managerSignedAt'] = _stamp(store)
      ..['managerRemarks'] = remarks;
    i
      ..['closure'] = closure
      ..['stage'] = 'CLOSED'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
    final reporter = i.strOrNull('reporterUserId');
    if (reporter != null) {
      _notify(
        store,
        reporter,
        i,
        'INCIDENT_CLOSED',
        const Bi(
          'Your safety report is closed',
          'আপনার নিরাপত্তা রিপোর্ট বন্ধ',
        ),
        const Bi(
          'The plant head has signed it off.',
          'প্ল্যান্ট প্রধান স্বাক্ষর করেছেন।',
        ),
      );
    }
  }

  static void fileStatutory(
    MockStore store,
    AuthContext auth,
    Json i,
    Json body,
  ) {
    if (!_can(auth, 'incidents:statutory')) throw forbidden();
    if (i['statutoryReportable'] != true) {
      throw policyViolation(
        'NOT_STATUTORY',
        'This report does not need a government filing.',
      );
    }
    final receipt = _text(body, 'receiptNo', 3, 80);
    if (receipt == null) {
      throw validationError('receiptNo', 'Enter the receipt or diary number');
    }
    i
      ..['statutoryReceiptNo'] = receipt
      ..['statutorySubmittedAt'] = _stamp(store)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.incidents, i);
  }

  static bool visible(MockStore store, AuthContext a, Json i) {
    final me = _me(a);
    if (i['reporterUserId'] == me) return true;
    if (i['investigatorUserId'] == me) return true;
    for (final c in capasOf(store, i.str('id'))) {
      if (c['ownerUserId'] == me) return true;
    }
    if (_can(a, 'incidents:triage') ||
        _can(a, 'incidents:manage') ||
        _can(a, 'incidents:close')) {
      return _siteOk(a, i);
    }
    if (_can(a, 'incidents:read')) {
      final sc = _scope(a, 'incidents:read');
      if (sc == GrantScope.company) return true;
      if (sc == GrantScope.site) return _siteOk(a, i);
      if (sc == GrantScope.department) {
        final rid = i.strOrNull('reporterUserId');
        if (rid == null) return false;
        final ru = store.get(Col.users, rid);
        final re = ru == null
            ? null
            : store.get(Col.employees, ru.str('employeeId'));
        return re?.obj('department')['id'] ==
            a.employee.obj('department')['id'];
      }
    }
    return false;
  }

  static bool _siteOk(AuthContext a, Json i) {
    final sc = _can(a, 'incidents:manage')
        ? _scope(a, 'incidents:manage')
        : _can(a, 'incidents:triage')
        ? _scope(a, 'incidents:triage')
        : _scope(a, 'incidents:read');
    if (sc == GrantScope.company) return true;
    return i['siteId'] == a.employee.obj('site')['id'];
  }

  static Json wire(MockStore store, AuthContext a, Json i) {
    final capas = capasOf(store, i.str('id'));
    final me = _me(a);
    final st = i.str('stage');
    final anonymous = i['isAnonymous'] == true;
    final hideReporter = anonymous && !_can(a, 'incidents:manage');
    final isInv = i['investigatorUserId'] == me;
    final rca = i['rca'];
    final rcaDone = rca is Map && rca['completedAt'] != null;
    final closure = i['closure'] is Map
        ? Map<String, Object?>.from(i['closure']! as Map)
        : <String, Object?>{};
    return {
      'id': i['id'],
      'incidentNo': i['incidentNo'],
      'stage': st,
      'type': i['type'],
      'title': i['title'],
      'description': i['description'],
      'siteId': i['siteId'],
      'site': _site(store, i.strOrNull('siteId')),
      'zone': i['zone'],
      'occurredAt': i['occurredAt'],
      'severity': i['severity'],
      'likelihood': i['likelihood'],
      'riskScore': i['riskScore'],
      'riskCategory': i['riskCategory'],
      'immediateActions': i['immediateActions'],
      'isAnonymous': anonymous,
      'lateReport': i['lateReport'] == true,
      'reporter': hideReporter
          ? null
          : WorkflowEngine.personRef(store, i.strOrNull('reporterUserId')),
      'investigator': WorkflowEngine.personRef(
        store,
        i.strOrNull('investigatorUserId'),
      ),
      'people': i['people'],
      'rca': rca,
      'statutoryReportable': i['statutoryReportable'] == true,
      'statutoryBodyCode': i['statutoryBodyCode'],
      'statutoryDueAt': i['statutoryDueAt'],
      'statutoryReceiptNo': i['statutoryReceiptNo'],
      'photoFileIds': i['photoFileIds'],
      'capas': [
        for (final c in capas)
          {
            ...c,
            'owner': WorkflowEngine.personRef(
              store,
              c.strOrNull('ownerUserId'),
            ),
            'me': {
              'canStart':
                  (c['ownerUserId'] == me || _can(a, 'incidents:capa')) &&
                  (c['status'] == 'PENDING' || c['status'] == 'OVERDUE'),
              'canComplete':
                  (c['ownerUserId'] == me || _can(a, 'incidents:capa')) &&
                  const {
                    'PENDING',
                    'IN_PROGRESS',
                    'OVERDUE',
                  }.contains(c['status']),
              'canVerify':
                  _can(a, 'incidents:capa-verify') &&
                  c['status'] == 'COMPLETED' &&
                  c['ownerUserId'] != me,
            },
          },
      ],
      'closure': closure.isEmpty
          ? null
          : {
              ...closure,
              'safetyOfficer': WorkflowEngine.personRef(
                store,
                closure['safetyOfficerUserId'] as String?,
              ),
              'manager': WorkflowEngine.personRef(
                store,
                closure['managerUserId'] as String?,
              ),
            },
      'createdAt': i['createdAt'],
      'me': {
        'isReporter': i['reporterUserId'] == me,
        'isInvestigator': isInv,
        'canTriage': st == 'REPORTED' && _can(a, 'incidents:triage'),
        'canInvestigate':
            st == 'TRIAGED' && (isInv || _can(a, 'incidents:manage')),
        'canRca':
            (st == 'TRIAGED' || st == 'UNDER_INVESTIGATION') &&
            (isInv || _can(a, 'incidents:manage')),
        'canAddCapa':
            rcaDone &&
            const {'UNDER_INVESTIGATION', 'CAPA_EXECUTION'}.contains(st) &&
            (isInv || _can(a, 'incidents:capa')),
        'canReview':
            st == 'CAPA_EXECUTION' &&
            (_can(a, 'incidents:close') || _can(a, 'incidents:manage')),
        'canCloseSafety':
            st == 'MANAGEMENT_REVIEW' &&
            closure['safetySignedAt'] == null &&
            _can(a, 'incidents:manage'),
        'canCloseManager':
            st == 'MANAGEMENT_REVIEW' &&
            closure['safetySignedAt'] != null &&
            closure['managerSignedAt'] == null &&
            _can(a, 'incidents:close'),
        'canStatutory':
            i['statutoryReportable'] == true &&
            i['statutoryReceiptNo'] == null &&
            _can(a, 'incidents:statutory'),
      },
    };
  }

  static Json? _site(MockStore store, String? id) {
    if (id == null) return null;
    final s = sites.where((x) => x['id'] == id).toList();
    if (s.isEmpty) return null;
    return {'id': id, 'name': s.first['name'], 'nameBn': s.first['nameBn']};
  }
}
