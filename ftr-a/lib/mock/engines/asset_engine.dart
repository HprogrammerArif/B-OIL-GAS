import 'dart:math' as math;

import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Settings behind doc 06 MOD-05 (BR-05-01 … BR-05-17).
abstract final class AssetPolicy {
  static const stages = {
    'REQUESTED',
    'PROCURED',
    'IN_STOCK',
    'OPERATIONAL',
    'IN_TRANSFER',
    'MAINTENANCE',
    'CALIBRATION_DUE',
    'QUARANTINE_LOTO',
    'DECOMMISSIONED',
    'DISPOSED',
    'LOST',
  };
  static const classes = {
    'PLANT',
    'VEHICLE',
    'IT',
    'SAFETY',
    'LAB',
    'CORPORATE',
  };
  static const woTypes = {'PM', 'CM', 'CBM', 'CAL'};
  static const calLeadDays = 30;
  static const custodyAckDays = 3;
  static const defaultCmEstimate = 25000.0;
  static const capexLifeYears = 2;
  static const eolRepairRatio = 50.0;
  static const eolHealthBelow = 55.0;
  static const lotoRequiredForPlant = true;
  static const defaultSalvagePct = 0.08;

  static const categories = <Json>[
    {
      'id': 'cat_plant',
      'code': 'PLT',
      'assetClass': 'PLANT',
      'name': 'Plant machinery',
      'nameBn': 'প্ল্যান্ট যন্ত্রপাতি',
      'defaultMethod': 'UOP',
      'calibrationCycleDays': 365,
      'regulator': 'DOEXP',
    },
    {
      'id': 'cat_vehicle',
      'code': 'VEH',
      'assetClass': 'VEHICLE',
      'name': 'Vehicles',
      'nameBn': 'যানবাহন',
      'defaultMethod': 'WDV',
      'calibrationCycleDays': null,
      'regulator': 'BRTA',
    },
    {
      'id': 'cat_it',
      'code': 'IT',
      'assetClass': 'IT',
      'name': 'Computers and phones',
      'nameBn': 'কম্পিউটার ও ফোন',
      'defaultMethod': 'SLM',
      'calibrationCycleDays': null,
      'regulator': null,
    },
    {
      'id': 'cat_safety',
      'code': 'SAF',
      'assetClass': 'SAFETY',
      'name': 'Safety equipment',
      'nameBn': 'নিরাপত্তা সরঞ্জাম',
      'defaultMethod': 'SLM',
      'calibrationCycleDays': 180,
      'regulator': 'BSTI',
    },
    {
      'id': 'cat_lab',
      'code': 'LAB',
      'assetClass': 'LAB',
      'name': 'Laboratory instruments',
      'nameBn': 'ল্যাব যন্ত্র',
      'defaultMethod': 'SLM',
      'calibrationCycleDays': 365,
      'regulator': 'ISO17025',
    },
    {
      'id': 'cat_corp',
      'code': 'CRP',
      'assetClass': 'CORPORATE',
      'name': 'Office equipment',
      'nameBn': 'অফিস সরঞ্জাম',
      'defaultMethod': 'SLM',
      'calibrationCycleDays': null,
      'regulator': null,
    },
  ];
}

/// Register, custody, work orders, LOTO, transfer and disposal (doc 03 §11).
abstract final class AssetEngine {
  static String? seedClock;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static DateTime _now(MockStore s) => DateTime.parse(_stamp(s));

  static String _me(AuthContext a) => a.user.str('id');

  static num _n(Object? v, [num fallback = 0]) => v is num ? v : fallback;

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static GrantScope _scope(AuthContext a, String key) {
    for (final g in a.grants) {
      if (g['key'] == key) return scopeFromWire(g.str('scope'));
    }
    return GrantScope.self;
  }

  static Json _data(Json a) => {
    'module': 'assets',
    'route': '/home/assets/${a['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json asset,
    String type,
    Bi title,
    Bi body, {
    String priority = 'NORMAL',
  }) => NotificationEngine.notify(
    store,
    userId: userId,
    type: type,
    title: title,
    body: body,
    priority: priority,
    data: _data(asset),
  );

  static Json category(String id) => AssetPolicy.categories.firstWhere(
    (c) => c['id'] == id,
    orElse: () => throw validationError('categoryId', 'Unknown category'),
  );

  static String _siteAbbr(String siteId) => switch (siteId) {
    'site_hq' => 'HQ',
    'site_plant' => 'KER',
    _ => 'CTG',
  };

  static String _tag(MockStore store, String siteId, String catId) {
    final code = category(catId).str('code');
    final prefix = 'BOGCL-${_siteAbbr(siteId)}-$code-';
    var n = 1;
    for (final a in store.all(Col.assets)) {
      final t = a.str('tag');
      if (t.startsWith(prefix)) {
        final part = int.tryParse(t.substring(prefix.length)) ?? 0;
        if (part >= n) n = part + 1;
      }
    }
    return '$prefix${n.toString().padLeft(3, '0')}';
  }

  static String _ref(MockStore store, String col, String prefix, String field) {
    final y = _now(store).year;
    var n = 1;
    for (final r in store.all(col)) {
      final v = r.str(field);
      if (v.startsWith('$prefix-$y-')) {
        final part = int.tryParse(v.split('-').last) ?? 0;
        if (part >= n) n = part + 1;
      }
    }
    return '$prefix-$y-${n.toString().padLeft(4, '0')}';
  }

  static Json? openCustody(MockStore store, String assetId) {
    for (final c in store.all(Col.assetCustody)) {
      if (c['assetId'] == assetId && c['releasedAt'] == null) return c;
    }
    return null;
  }

  static List<Json> wosOf(MockStore store, String assetId) => store
      .all(Col.assetWorkOrders)
      .where((w) => w['assetId'] == assetId)
      .toList();

  static List<Json> openWos(MockStore store, String assetId) =>
      wosOf(store, assetId).where((w) => w['status'] != 'COMPLETED').toList();

  static bool _lotoActive(Json a) =>
      a['stage'] == 'QUARANTINE_LOTO' ||
      (a.strOrNull('lotoPermitNo') != null && a['lotoReleasedAt'] == null);

  static bool _lotoRequired(Json a, Json cat) =>
      a['criticality'] == 'CRITICAL_A' ||
      (AssetPolicy.lotoRequiredForPlant && cat['assetClass'] == 'PLANT');

  static bool _vehicleOnly(AuthContext a) {
    final roles = a.user.strList('roles');
    if (!roles.contains('TRANSPORT_ADMIN')) return false;
    const wider = {
      'PLANT_GM',
      'CHAIRMAN',
      'FINANCE',
      'HR_ADMIN',
      'HSE_OFFICER',
      'HOD',
    };
    return !roles.any(wider.contains);
  }

  static void _guardLoto(Json a) {
    if (_lotoActive(a)) {
      throw policyViolation(
        'LOTO_ACTIVE',
        'This machine is locked out (LOTO).',
      );
    }
  }

  static void _event(
    MockStore store,
    AuthContext auth,
    Json a,
    String type,
    String? from,
    String to,
    String note,
  ) {
    final prev =
        store
            .all(Col.assetEvents)
            .where((e) => e['assetId'] == a['id'])
            .toList()
          ..sort((x, y) => x.str('createdAt').compareTo(y.str('createdAt')));
    final last = prev.isEmpty ? '' : prev.last.str('eventHash');
    final at = _stamp(store);
    final rec = <String, Object?>{
      'id': 'aev_${store.collection(Col.assetEvents).length + 1}',
      'assetId': a['id'],
      'type': type,
      'fromStage': from,
      'toStage': to,
      'note': note,
      'actorUserId': _me(auth),
      'createdAt': at,
      'eventHash': Hash.sha256Hex('$last|$type|${a['id']}|$at|$note'),
    };
    store.put(Col.assetEvents, rec);
  }

  static void _setStage(
    MockStore store,
    AuthContext auth,
    Json a,
    String to,
    String type,
    String note,
  ) {
    final from = a.str('stage');
    if (from == to) return;
    a['stage'] = to;
    a['updatedAt'] = _stamp(store);
    store.put(Col.assets, a);
    _event(store, auth, a, type, from, to, note);
    _syncVehicle(store, a);
  }

  static void _syncVehicle(MockStore store, Json a) {
    final vid = a.strOrNull('vehicleId');
    if (vid == null) return;
    final v = store.get(Col.fleetVehicles, vid);
    if (v == null) return;
    v['siteId'] = a['siteId'];
    v['assetId'] = a['id'];
    if (a['stage'] == 'DECOMMISSIONED' || a['stage'] == 'DISPOSED') {
      v['status'] = 'RETIRED';
    }
    store.put(Col.fleetVehicles, v);
  }

  static Json register(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'assets:register') && !_can(auth, 'assets:commission')) {
      throw policyViolation('FORBIDDEN', 'You cannot add equipment.');
    }
    final catId = body['categoryId'] as String? ?? '';
    final cat = category(catId);
    final siteId = body['siteId'] as String? ?? '';
    if (sites.every((s) => s['id'] != siteId)) {
      throw validationError('siteId', 'Unknown site');
    }
    final key = _can(auth, 'assets:register')
        ? 'assets:register'
        : 'assets:commission';
    if (_scope(auth, key) == GrantScope.site &&
        siteId != auth.employee.obj('site')['id']) {
      throw policyViolation(
        'FORBIDDEN',
        'You can only add equipment at your site.',
      );
    }
    final name = (body['name'] as String? ?? '').trim();
    if (name.length < 3) throw validationError('name', 'Name is too short');
    final cost = (body['purchaseCost'] as num?)?.toDouble() ?? 0;
    if (cost <= 0) throw validationError('purchaseCost', 'Enter the cost');
    final life = (body['usefulLifeYears'] as num?)?.toInt() ?? 0;
    if (life < 1) {
      throw validationError('usefulLifeYears', 'Life must be years');
    }
    final method =
        body['depreciationMethod'] as String? ?? cat.str('defaultMethod');
    if (!const {'SLM', 'WDV', 'UOP'}.contains(method)) {
      throw validationError('depreciationMethod', 'Unknown method');
    }
    final now = _stamp(store);
    final salvage =
        (body['salvageValue'] as num?)?.toDouble() ??
        cost * AssetPolicy.defaultSalvagePct;
    final rated = (body['ratedLifeHours'] as num?)?.toDouble() ?? life * 4000.0;
    final cycle = cat['calibrationCycleDays'] as int?;
    final purchaseDate = body['purchaseDate'] as String? ?? now;
    final id =
        body['id'] as String? ?? 'ast_${store.all(Col.assets).length + 1}';
    final a = <String, Object?>{
      'id': id,
      'tag': body['tag'] as String? ?? _tag(store, siteId, catId),
      'name': name,
      'nameBn': (body['nameBn'] as String?)?.trim(),
      'categoryId': catId,
      'assetClass': cat['assetClass'],
      'criticality': body['criticality'] as String? ?? 'GENERAL_C',
      'stage': 'IN_STOCK',
      'siteId': siteId,
      'departmentId': body['departmentId'] as String? ?? aDept(auth),
      'location': (body['location'] as String?)?.trim(),
      'oem': body['oem'],
      'modelNo': body['modelNo'],
      'serialNo': body['serialNo'],
      'purchaseCost': cost,
      'capexAdditions': 0.0,
      'opexToDate': (body['opexToDate'] as num?)?.toDouble() ?? 0.0,
      'salvageValue': salvage,
      'depreciationMethod': method,
      'usefulLifeYears': life,
      'ratedLifeHours': rated,
      'runtimeHours': (body['runtimeHours'] as num?)?.toDouble() ?? 0.0,
      'healthScore': (body['healthScore'] as num?)?.toInt() ?? 88,
      'purchaseDate': purchaseDate,
      'commissionedAt': null,
      'warrantyExpiresAt': body['warrantyExpiresAt'],
      'amcExpiresAt': body['amcExpiresAt'],
      'insuranceExpiresAt': body['insuranceExpiresAt'],
      'nextCalibrationAt':
          body['nextCalibrationAt'] ??
          (cycle == null
              ? null
              : DateTime.parse(purchaseDate)
                    .add(Duration(days: cycle))
                    .toIso8601String()),
      'nextServiceAt': body['nextServiceAt'],
      'calibrationExpired': false,
      'lotoPermitNo': null,
      'lotoReleasedAt': now,
      'vehicleId': body['vehicleId'],
      'qrPayload': body['qrPayload'] ?? 'QR-$id',
      'createdAt': now,
      'updatedAt': now,
    };
    store.put(Col.assets, a);
    _event(store, auth, a, 'CAPITALIZED', null, 'IN_STOCK', 'Registered');
    final custodian = body['custodianUserId'] as String?;
    if (body['commissionNow'] == true) {
      commission(store, auth, a, {
        'location': a['location'] ?? 'Plant floor',
        'custodianUserId': ?custodian,
      });
    }
    return store.get(Col.assets, id)!;
  }

  static String aDept(AuthContext auth) =>
      auth.employee.obj('department')['id']! as String;

  static void commission(MockStore store, AuthContext auth, Json a, Json body) {
    if (!_can(auth, 'assets:commission')) {
      throw policyViolation('FORBIDDEN', 'You cannot put this into service.');
    }
    if (a['stage'] != 'IN_STOCK') {
      throw invalidTransition('Only items in store can be put into service.');
    }
    if (a['calibrationExpired'] == true) {
      throw policyViolation('CALIBRATION_EXPIRED', 'Calibrate this first.');
    }
    _guardLoto(a);
    final loc = (body['location'] as String? ?? a.strOrNull('location') ?? '')
        .trim();
    if (loc.isEmpty) {
      throw validationError('location', 'Say where it will sit');
    }
    a['location'] = loc;
    a['commissionedAt'] = _stamp(store);
    store.put(Col.assets, a);
    _setStage(store, auth, a, 'OPERATIONAL', 'COMMISSIONED', loc);
    final uid = body['custodianUserId'] as String?;
    if (uid != null && _can(auth, 'assets:custody-assign')) {
      assignCustody(store, auth, a, {'employeeUserId': uid});
    }
  }

  static void assignCustody(
    MockStore store,
    AuthContext auth,
    Json a,
    Json body,
  ) {
    if (!_can(auth, 'assets:custody-assign')) {
      throw policyViolation('FORBIDDEN', 'You cannot hand this over.');
    }
    _guardLoto(a);
    final uid = body['employeeUserId'] as String? ?? '';
    if (store.get(Col.users, uid) == null) {
      throw validationError('employeeUserId', 'Unknown person');
    }
    final open = openCustody(store, a.str('id'));
    if (open != null) {
      open['releasedAt'] = _stamp(store);
      open['releaseReason'] = 'REASSIGN';
      store.put(Col.assetCustody, open);
    }
    final rec = <String, Object?>{
      'id': 'cstd_${store.all(Col.assetCustody).length + 1}',
      'assetId': a['id'],
      'employeeUserId': uid,
      'assignedAt': _stamp(store),
      'acknowledgedAt': null,
      'releasedAt': null,
      'note': body['note'],
    };
    store.put(Col.assetCustody, rec);
    _event(
      store,
      auth,
      a,
      'CUSTODY_ASSIGNED',
      a.str('stage'),
      a.str('stage'),
      'Handed over',
    );
    _notify(
      store,
      uid,
      a,
      'ASSET_CUSTODY_ASSIGNED',
      Bi('Sign for ${a['name']}', '${a['name']} হস্তান্তর স্বাক্ষর করুন'),
      const Bi(
        'You have three days to confirm you received this.',
        'তিন দিনের মধ্যে নিশ্চিত করুন।',
      ),
    );
  }

  static void ackCustody(MockStore store, AuthContext auth, Json a) {
    final c = openCustody(store, a.str('id'));
    if (c == null || c['employeeUserId'] != _me(auth)) {
      throw policyViolation('NOT_CUSTODIAN', 'This is not assigned to you.');
    }
    if (c['acknowledgedAt'] != null) {
      throw invalidTransition('Already signed.');
    }
    c['acknowledgedAt'] = _stamp(store);
    store.put(Col.assetCustody, c);
    _event(
      store,
      auth,
      a,
      'CUSTODY_SIGNED',
      a.str('stage'),
      a.str('stage'),
      'Signed',
    );
  }

  static void releaseCustody(
    MockStore store,
    AuthContext auth,
    Json a,
    Json body,
  ) {
    final c = openCustody(store, a.str('id'));
    if (c == null) throw invalidTransition('Nobody holds this.');
    final me = _me(auth);
    if (c['employeeUserId'] != me && !_can(auth, 'assets:custody-assign')) {
      throw policyViolation('FORBIDDEN', 'You cannot take this back.');
    }
    c['releasedAt'] = _stamp(store);
    c['releaseReason'] = body['reason'] as String? ?? 'RETURN';
    store.put(Col.assetCustody, c);
    _event(
      store,
      auth,
      a,
      'CUSTODY_RECLAIMED',
      a.str('stage'),
      a.str('stage'),
      c.str('releaseReason'),
    );
  }

  static void flagDefect(MockStore store, AuthContext auth, Json a, Json body) {
    final c = openCustody(store, a.str('id'));
    if (c?['employeeUserId'] != _me(auth) &&
        !_can(auth, 'assets:flag-defect')) {
      throw policyViolation('FORBIDDEN', 'You cannot flag this.');
    }
    final desc = (body['description'] as String? ?? '').trim();
    if (desc.length < 10) {
      throw validationError('description', 'Describe what is wrong');
    }
    final health = (a['healthScore'] as num?)?.toInt() ?? 80;
    a['healthScore'] = math.max(25, health - 10);
    a['updatedAt'] = _stamp(store);
    store.put(Col.assets, a);
    _event(
      store,
      auth,
      a,
      'DEFECT_FLAGGED',
      a.str('stage'),
      a.str('stage'),
      desc,
    );
    final underWarranty = _underWarranty(store, a);
    _createWo(store, auth, a, {
      'type': 'CM',
      'title': desc,
      'priority': health < 40 ? 'HIGH' : (body['severity'] ?? 'MEDIUM'),
      'estimatedCost': underWarranty ? 0.0 : AssetPolicy.defaultCmEstimate,
      'assigneeUserId': body['assigneeUserId'] ?? c?['employeeUserId'],
    });
    if (_n(a['healthScore']) < 25) {
      final open = openWos(store, a.str('id'));
      if (open.every((w) => w['type'] != 'CBM')) {
        _createWo(store, auth, a, {
          'type': 'CBM',
          'title': 'Condition-based check',
          'priority': 'HIGH',
          'estimatedCost': AssetPolicy.defaultCmEstimate,
        });
      }
    }
  }

  static bool _underWarranty(MockStore store, Json a) {
    final exp = a.strOrNull('warrantyExpiresAt');
    if (exp == null) return false;
    return !DateTime.parse(exp).isBefore(_now(store));
  }

  static Json _createWo(MockStore store, AuthContext auth, Json a, Json body) {
    final type = body['type'] as String? ?? 'CM';
    if (!AssetPolicy.woTypes.contains(type)) {
      throw validationError('type', 'Unknown work type');
    }
    final title = (body['title'] as String? ?? 'Work').trim();
    final wo = <String, Object?>{
      'id':
          body['id'] as String? ??
          'wo_${store.all(Col.assetWorkOrders).length + 1}',
      'woNo':
          body['woNo'] as String? ??
          _ref(store, Col.assetWorkOrders, 'WO', 'woNo'),
      'assetId': a['id'],
      'type': type,
      'status': 'SCHEDULED',
      'priority': body['priority'] ?? 'MEDIUM',
      'title': title,
      'estimatedCost': (body['estimatedCost'] as num?)?.toDouble() ?? 0,
      'actualCost': null,
      'isCapex': body['isCapex'] == true,
      'assigneeUserId': body['assigneeUserId'],
      'dueAt':
          body['dueAt'] ??
          _now(store).add(const Duration(days: 7)).toIso8601String(),
      'startedAt': null,
      'completedAt': null,
      'certificateNo': null,
      'createdAt': _stamp(store),
    };
    store.put(Col.assetWorkOrders, wo);
    final assignee = wo.strOrNull('assigneeUserId');
    if (assignee != null) {
      _notify(
        store,
        assignee,
        a,
        'ASSET_WO_ASSIGNED',
        Bi('Work on ${a['name']}', '${a['name']}-এ কাজ'),
        Bi(title, title),
      );
    }
    return wo;
  }

  static void startWo(MockStore store, AuthContext auth, Json wo) {
    final a = store.get(Col.assets, wo.str('assetId'));
    if (a == null) throw notFound('Equipment');
    final me = _me(auth);
    if (wo['assigneeUserId'] != me && !_can(auth, 'assets:maintain')) {
      throw policyViolation('FORBIDDEN', 'This job is not yours.');
    }
    if (wo['status'] != 'SCHEDULED') {
      throw invalidTransition('This job already started.');
    }
    final cat = category(a.str('categoryId'));
    if (_lotoRequired(a, cat) && !_lotoActive(a)) {
      throw policyViolation(
        'LOTO_REQUIRED',
        'Lock this machine out before work starts.',
      );
    }
    wo['status'] = 'IN_PROGRESS';
    wo['startedAt'] = _stamp(store);
    store.put(Col.assetWorkOrders, wo);
    if (a['stage'] == 'OPERATIONAL' || a['stage'] == 'CALIBRATION_DUE') {
      _setStage(
        store,
        auth,
        a,
        'MAINTENANCE',
        'DEFECT_FLAGGED',
        wo.str('woNo'),
      );
    }
  }

  static void completeWo(
    MockStore store,
    AuthContext auth,
    Json wo,
    Json body,
  ) {
    final a = store.get(Col.assets, wo.str('assetId'));
    if (a == null) throw notFound('Equipment');
    final me = _me(auth);
    if (wo['assigneeUserId'] != me && !_can(auth, 'assets:maintain')) {
      throw policyViolation('FORBIDDEN', 'This job is not yours.');
    }
    if (wo['status'] != 'IN_PROGRESS' && wo['status'] != 'SCHEDULED') {
      throw invalidTransition('This job is already finished.');
    }
    var cost = (body['actualCost'] as num?)?.toDouble();
    if (cost == null) {
      throw validationError('actualCost', 'Enter what it cost');
    }
    if (wo['type'] == 'CAL') {
      final cert = (body['certificateNo'] as String? ?? '').trim();
      if (cert.isEmpty) {
        throw validationError('certificateNo', 'Enter the certificate number');
      }
      wo['certificateNo'] = cert;
    }
    if (wo['type'] == 'CM' && _underWarranty(store, a)) {
      cost = 0;
      wo['vendorClaimRef'] = body['vendorClaimRef'] ?? 'WRN-CLAIM';
    }
    wo['actualCost'] = cost;
    wo['status'] = 'COMPLETED';
    wo['completedAt'] = _stamp(store);
    store.put(Col.assetWorkOrders, wo);

    final health = (a['healthScore'] as num?)?.toInt() ?? 70;
    if (wo['isCapex'] == true) {
      a['capexAdditions'] = _n(a['capexAdditions']).toDouble() + cost;
      a['usefulLifeYears'] =
          _n(a['usefulLifeYears']).toInt() + AssetPolicy.capexLifeYears;
      a['healthScore'] = math.min(100, health + 15);
      _event(
        store,
        auth,
        a,
        'CAPEX_OVERHAUL',
        a.str('stage'),
        a.str('stage'),
        wo.str('woNo'),
      );
    } else {
      a['opexToDate'] = _n(a['opexToDate']).toDouble() + cost;
      a['healthScore'] = math.min(100, health + 7);
      if (wo['type'] == 'CAL' || wo['type'] == 'PM') {
        _event(
          store,
          auth,
          a,
          'PM_CERTIFIED',
          a.str('stage'),
          a.str('stage'),
          wo.strOrNull('certificateNo') ?? wo.str('woNo'),
        );
      }
    }
    if (wo['type'] == 'CAL') {
      final cat = category(a.str('categoryId'));
      final days = cat['calibrationCycleDays'] as int? ?? 365;
      a['nextCalibrationAt'] = _now(store)
          .add(Duration(days: days))
          .toIso8601String();
      a['calibrationExpired'] = false;
    }
    a['updatedAt'] = _stamp(store);
    store.put(Col.assets, a);
    if (a['stage'] == 'MAINTENANCE' &&
        openWos(store, a.str('id')).isEmpty &&
        !_lotoActive(a)) {
      _setStage(
        store,
        auth,
        a,
        'OPERATIONAL',
        'PM_CERTIFIED',
        'Back in service',
      );
    }
  }

  static void loto(MockStore store, AuthContext auth, Json a, Json body) {
    if (!_can(auth, 'assets:loto') && !_can(auth, 'assets:maintain')) {
      throw policyViolation('FORBIDDEN', 'Only safety can lock this out.');
    }
    if (!_can(auth, 'assets:loto')) {
      throw policyViolation('FORBIDDEN', 'Only the safety officer locks this.');
    }
    final action = (body['action'] as String? ?? 'APPLY').toUpperCase();
    if (action == 'APPLY') {
      final no = (body['permitNo'] as String? ?? '').trim();
      if (!RegExp(r'^LOTO-\d{4}-\d{4}$').hasMatch(no)) {
        throw validationError('permitNo', 'Use LOTO-YYYY-NNNN');
      }
      a['lotoPermitNo'] = no;
      a['lotoReleasedAt'] = null;
      a['lotoAppliedBy'] = _me(auth);
      store.put(Col.assets, a);
      _setStage(store, auth, a, 'QUARANTINE_LOTO', 'LOTO_APPLIED', no);
      final c = openCustody(store, a.str('id'));
      if (c != null) {
        _notify(
          store,
          c.str('employeeUserId'),
          a,
          'ASSET_LOTO_APPLIED',
          Bi('${a['name']} locked out', '${a['name']} লকআউট'),
          const Bi(
            'Do not operate until safety releases it.',
            'নিরাপত্তা খোলা না করা পর্যন্ত চালাবেন না।',
          ),
          priority: 'HIGH',
        );
      }
    } else {
      if (a['stage'] != 'QUARANTINE_LOTO') {
        throw invalidTransition('This is not locked out.');
      }
      a['lotoReleasedAt'] = _stamp(store);
      store.put(Col.assets, a);
      final next = openWos(store, a.str('id')).isEmpty
          ? 'OPERATIONAL'
          : 'MAINTENANCE';
      _setStage(store, auth, a, next, 'LOTO_RELEASED', a.str('lotoPermitNo'));
    }
  }

  static void certify(MockStore store, AuthContext auth, Json a, Json body) {
    if (!_can(auth, 'assets:calibrate')) {
      throw policyViolation('FORBIDDEN', 'You cannot certify this.');
    }
    final type = body['type'] as String? ?? 'CAL';
    if (type != 'CAL' && type != 'PM') {
      throw validationError('type', 'Use CAL or PM');
    }
    final next = body['nextDueAt'] as String?;
    a['healthScore'] = math.min(
      100,
      ((a['healthScore'] as num?)?.toInt() ?? 70) + 7,
    );
    if (type == 'CAL') {
      final cat = category(a.str('categoryId'));
      final days = cat['calibrationCycleDays'] as int? ?? 365;
      a['nextCalibrationAt'] =
          next ?? _now(store).add(Duration(days: days)).toIso8601String();
      a['calibrationExpired'] = false;
    }
    a['updatedAt'] = _stamp(store);
    store.put(Col.assets, a);
    _event(
      store,
      auth,
      a,
      'PM_CERTIFIED',
      a.str('stage'),
      a.str('stage'),
      body['certificateNo'] as String? ?? type,
    );
    if (a['stage'] == 'CALIBRATION_DUE') {
      _setStage(store, auth, a, 'OPERATIONAL', 'PM_CERTIFIED', 'Certified');
    }
  }

  static void transfer(MockStore store, AuthContext auth, Json a, Json body) {
    if (!_can(auth, 'assets:transfer')) {
      throw policyViolation('FORBIDDEN', 'You cannot move this.');
    }
    if (a['stage'] != 'OPERATIONAL') {
      throw invalidTransition('Only working machines can move.');
    }
    if (a['calibrationExpired'] == true) {
      throw policyViolation('CALIBRATION_EXPIRED', 'Calibrate this first.');
    }
    _guardLoto(a);
    final c = openCustody(store, a.str('id'));
    if (c != null && c['acknowledgedAt'] == null) {
      throw policyViolation(
        'CUSTODY_UNACKED',
        'The current holder must sign first.',
      );
    }
    final toSite = body['toSiteId'] as String? ?? '';
    if (sites.every((s) => s['id'] != toSite)) {
      throw validationError('toSiteId', 'Unknown site');
    }
    if (toSite == a['siteId']) {
      throw validationError('toSiteId', 'Pick a different site');
    }
    final reason = (body['reason'] as String? ?? '').trim();
    if (reason.length < 5) {
      throw validationError('reason', 'Say why it is moving');
    }
    final t = <String, Object?>{
      'id': 'trf_${store.all(Col.assetTransfers).length + 1}',
      'transferNo': _ref(store, Col.assetTransfers, 'TRF', 'transferNo'),
      'gatePassNo': _ref(store, Col.assetTransfers, 'GP', 'gatePassNo'),
      'assetId': a['id'],
      'fromSiteId': a['siteId'],
      'toSiteId': toSite,
      'toLocation': body['toLocation'],
      'toEmployeeUserId': body['toEmployeeUserId'],
      'reason': reason,
      'status': 'INITIATED',
      'createdAt': _stamp(store),
      'completedAt': null,
    };
    store.put(Col.assetTransfers, t);
    a['openTransferId'] = t['id'];
    store.put(Col.assets, a);
    _setStage(store, auth, a, 'IN_TRANSFER', 'TRANSFER_INITIATED', reason);
    NotificationEngine.notifyRole(
      store,
      role: 'PLANT_GM',
      type: 'ASSET_TRANSFER_INITIATED',
      title: Bi('${a['name']} is on the way', '${a['name']} যাচ্ছে'),
      body: Bi(reason, reason),
      data: _data(a),
    );
  }

  static void completeTransfer(
    MockStore store,
    AuthContext auth,
    Json a,
    Json t,
    Json body,
  ) {
    if (!_can(auth, 'assets:transfer')) {
      throw policyViolation('FORBIDDEN', 'You cannot receive this.');
    }
    if (t['status'] != 'INITIATED') {
      throw invalidTransition('This move already finished.');
    }
    t['status'] = 'COMPLETED';
    t['completedAt'] = _stamp(store);
    t['receivedByUserId'] = _me(auth);
    t['receiveNote'] = body['note'];
    store.put(Col.assetTransfers, t);
    a['siteId'] = t['toSiteId'];
    a['location'] = t['toLocation'] ?? a['location'];
    a['openTransferId'] = null;
    store.put(Col.assets, a);
    _setStage(
      store,
      auth,
      a,
      'OPERATIONAL',
      'TRANSFER_COMPLETED',
      t.str('gatePassNo'),
    );
    final uid = t.strOrNull('toEmployeeUserId');
    if (uid != null) {
      assignCustody(store, auth, a, {'employeeUserId': uid});
    }
  }

  static void decommission(
    MockStore store,
    AuthContext auth,
    Json a,
    Json body,
  ) {
    if (!_can(auth, 'assets:decommission')) {
      throw policyViolation('FORBIDDEN', 'You cannot retire this.');
    }
    if (const {'DECOMMISSIONED', 'DISPOSED'}.contains(a['stage'])) {
      throw invalidTransition('Already retired.');
    }
    _guardLoto(a);
    final reason = (body['reason'] as String? ?? '').trim();
    final notes = (body['surveyNotes'] as String? ?? '').trim();
    if (reason.isEmpty) throw validationError('reason', 'Say why');
    if (notes.length < 10) {
      throw validationError('surveyNotes', 'Write the survey notes');
    }
    final c = openCustody(store, a.str('id'));
    if (c != null) {
      c['releasedAt'] = _stamp(store);
      c['releaseReason'] = 'DECOMMISSION';
      store.put(Col.assetCustody, c);
    }
    final fin = financials(store, a);
    final d = <String, Object?>{
      'id': 'dsp_${store.all(Col.assetDisposals).length + 1}',
      'assetId': a['id'],
      'reason': reason,
      'surveyNotes': notes,
      'technicalSurveySigned': false,
      'decontaminationCertified': false,
      'sparesHarvested': false,
      'financeVetted': false,
      'writeOffApproved': false,
      'writeOffApprovedBy': null,
      'method': null,
      'proceeds': null,
      'nbvAtDisposal': fin['nbv'],
      'gainLoss': null,
      'voucherNo': null,
      'createdAt': _stamp(store),
    };
    store.put(Col.assetDisposals, d);
    a['disposalId'] = d['id'];
    store.put(Col.assets, a);
    _setStage(store, auth, a, 'DECOMMISSIONED', 'DECOMMISSION_SURVEY', reason);
  }

  static void patchChecklist(
    MockStore store,
    AuthContext auth,
    Json a,
    Json body,
  ) {
    final d = _disposal(store, a);
    void tick(String key, {required bool finance}) {
      if (body[key] != true) return;
      if (finance &&
          !_can(auth, 'assets:write-off') &&
          !_can(auth, 'assets:dispose')) {
        throw policyViolation('FORBIDDEN', 'Finance must tick this box.');
      }
      if (!finance &&
          !_can(auth, 'assets:decommission') &&
          !_can(auth, 'assets:write-off')) {
        throw policyViolation('FORBIDDEN', 'You cannot tick this box.');
      }
      d[key] = true;
    }

    tick('technicalSurveySigned', finance: false);
    tick('decontaminationCertified', finance: false);
    tick('sparesHarvested', finance: false);
    tick('financeVetted', finance: true);
    store.put(Col.assetDisposals, d);
  }

  static void approveWriteOff(MockStore store, AuthContext auth, Json a) {
    if (!_can(auth, 'assets:write-off')) {
      throw policyViolation('FORBIDDEN', 'You cannot approve the write-off.');
    }
    final d = _disposal(store, a);
    d['writeOffApproved'] = true;
    d['writeOffApprovedBy'] = _me(auth);
    d['writeOffApprovedAt'] = _stamp(store);
    store.put(Col.assetDisposals, d);
  }

  static void disposeAsset(
    MockStore store,
    AuthContext auth,
    Json a,
    Json body,
  ) {
    if (!_can(auth, 'assets:dispose') && !_can(auth, 'assets:write-off')) {
      throw policyViolation('FORBIDDEN', 'Finance closes the books.');
    }
    if (!_can(auth, 'assets:dispose')) {
      throw policyViolation('FORBIDDEN', 'Finance closes the books.');
    }
    if (a['stage'] != 'DECOMMISSIONED') {
      throw invalidTransition('Retire it first.');
    }
    _guardLoto(a);
    final d = _disposal(store, a);
    if (d['technicalSurveySigned'] != true ||
        d['decontaminationCertified'] != true ||
        d['sparesHarvested'] != true ||
        d['financeVetted'] != true) {
      throw policyViolation(
        'CHECKLIST_INCOMPLETE',
        'Every retirement box must be ticked.',
      );
    }
    if (d['writeOffApproved'] != true) {
      throw policyViolation(
        'WRITE_OFF_NOT_APPROVED',
        'Write-off is not approved yet.',
      );
    }
    final method = body['method'] as String? ?? 'SCRAP_RECYCLING';
    final proceeds = (body['proceeds'] as num?)?.toDouble() ?? 0;
    final fin = financials(store, a);
    final nbv = _n(fin['nbv']).toDouble();
    d
      ..['method'] = method
      ..['buyer'] = body['buyer']
      ..['proceeds'] = proceeds
      ..['nbvAtDisposal'] = nbv
      ..['gainLoss'] = proceeds - nbv
      ..['voucherNo'] = _ref(store, Col.assetDisposals, 'VCH-RET', 'voucherNo');
    store.put(Col.assetDisposals, d);
    _setStage(store, auth, a, 'DISPOSED', 'DISPOSED', d.str('voucherNo'));
  }

  static Json _disposal(MockStore store, Json a) {
    final id = a.strOrNull('disposalId');
    final d = id == null ? null : store.get(Col.assetDisposals, id);
    if (d == null) throw notFound('Retirement file');
    return d;
  }

  /// Called by workforce exit (BR-05-16).
  static void reclaimEmployeeAssets(
    MockStore store,
    AuthContext auth,
    String userId,
  ) {
    for (final c in store.all(Col.assetCustody)) {
      if (c['employeeUserId'] != userId || c['releasedAt'] != null) continue;
      c['releasedAt'] = _stamp(store);
      c['releaseReason'] = 'EXIT';
      store.put(Col.assetCustody, c);
      final a = store.get(Col.assets, c.str('assetId'));
      if (a == null) continue;
      if (a['stage'] == 'OPERATIONAL') {
        _setStage(store, auth, a, 'IN_STOCK', 'CUSTODY_RECLAIMED', 'Exit');
      } else {
        _event(
          store,
          auth,
          a,
          'CUSTODY_RECLAIMED',
          a.str('stage'),
          a.str('stage'),
          'Exit',
        );
      }
    }
  }

  static Json tick(MockStore store, Json a) {
    final now = _now(store);
    final cal = a.strOrNull('nextCalibrationAt');
    if (cal != null &&
        a['stage'] == 'OPERATIONAL' &&
        !DateTime.parse(cal)
            .isAfter(now.add(const Duration(days: AssetPolicy.calLeadDays)))) {
      final openCal = openWos(
        store,
        a.str('id'),
      ).any((w) => w['type'] == 'CAL');
      a['stage'] = 'CALIBRATION_DUE';
      a['updatedAt'] = _stamp(store);
      store.put(Col.assets, a);
      if (!openCal) {
        final sys = seedAuthForSystem(store);
        _createWo(store, sys, a, {
          'type': 'CAL',
          'title': 'Calibration due',
          'priority': 'HIGH',
          'dueAt': cal,
          'assigneeUserId': openCustody(store, a.str('id'))?['employeeUserId'],
        });
      }
    }
    if (cal != null &&
        DateTime.parse(cal).isBefore(now) &&
        !wosOf(
          store,
          a.str('id'),
        ).any((w) => w['type'] == 'CAL' && w['status'] == 'COMPLETED')) {
      a['calibrationExpired'] = true;
      store.put(Col.assets, a);
    }
    return a;
  }

  static AuthContext seedAuthForSystem(MockStore store) =>
      seedAuthFor(store, 'EMP-0012');

  static Json financials(MockStore store, Json a) {
    final g =
        _n(a['purchaseCost']).toDouble() + _n(a['capexAdditions']).toDouble();
    var s = _n(a['salvageValue']).toDouble();
    s = math.min(s, 0.5 * g);
    final b = g - s;
    final life = _n(a['usefulLifeYears']).toDouble();
    final method = a.str('depreciationMethod');
    final startRaw = a.strOrNull('commissionedAt') ?? a.str('purchaseDate');
    final start = DateTime.parse(startRaw);
    final now = _now(store);
    final months = math.max(
      0,
      (now.year - start.year) * 12 + now.month - start.month - 1,
    );
    double accum;
    double annual;
    if (a['stage'] == 'DISPOSED') {
      accum = g;
      annual = 0;
    } else if (method == 'UOP') {
      final rated = _n(a['ratedLifeHours']).toDouble();
      final hours = _n(a['runtimeHours']).toDouble();
      accum = b * math.min(1, rated == 0 ? 0 : hours / rated);
      annual = 0;
    } else if (method == 'WDV') {
      final rate = _wdvRate(g, s, life);
      annual = g * rate;
      final nbvRaw = g * math.pow(1 - rate, months / 12.0);
      final nbv = math.max(s, nbvRaw);
      accum = g - nbv;
    } else {
      annual = life == 0 ? 0 : b / life;
      accum = math.min(b, (annual / 12) * months);
    }
    var nbv = a['stage'] == 'DISPOSED' ? 0.0 : math.max(s, g - accum);
    if (a['stage'] == 'DISPOSED') nbv = 0;
    final opex = _n(a['opexToDate']).toDouble();
    final repair = g == 0 ? 0.0 : opex / g * 100;
    final remaining = life - months / 12.0;
    final health = _n(a['healthScore']).toDouble();
    final eol =
        repair >= AssetPolicy.eolRepairRatio ||
        (remaining <= 0.5 && health < AssetPolicy.eolHealthBelow) ||
        a['stage'] == 'DECOMMISSIONED';
    return {
      'gross': _r2(g),
      'salvage': _r2(s),
      'accumulatedDepreciation': _r2(accum),
      'nbv': _r2(nbv),
      'annualDepreciation': _r2(annual),
      'tco': _r2(g + opex - s),
      'repairRatio': _r2(repair),
      'remainingLifeYears': _r2(remaining),
      'ageMonths': months,
      'isEolCandidate': eol,
    };
  }

  static double _wdvRate(double g, double s, double life) {
    if (g <= 0 || life <= 0) return 0.12;
    final raw = 1 - math.pow(s / g, 1 / life).toDouble();
    return raw.clamp(0.12, 0.35);
  }

  static double _r2(double v) => (v * 100).round() / 100.0;

  static String nextAction(MockStore store, AuthContext auth, Json a) {
    final c = openCustody(store, a.str('id'));
    if (c != null &&
        c['acknowledgedAt'] == null &&
        c['employeeUserId'] == _me(auth)) {
      return 'ACK_CUSTODY';
    }
    if (a['stage'] == 'IN_STOCK' && _can(auth, 'assets:commission')) {
      return 'COMMISSION';
    }
    if (a['stage'] == 'IN_TRANSFER' && _can(auth, 'assets:transfer')) {
      return 'TRANSFER_RECEIVE';
    }
    if (a['stage'] == 'QUARANTINE_LOTO' && _can(auth, 'assets:loto')) {
      return 'LOTO_RELEASE';
    }
    final open = openWos(store, a.str('id'));
    if (open.any(
      (w) =>
          (w['assigneeUserId'] == _me(auth) || _can(auth, 'assets:maintain')) &&
          w['status'] != 'COMPLETED',
    )) {
      return 'COMPLETE_WO';
    }
    if (a['stage'] == 'CALIBRATION_DUE' && _can(auth, 'assets:calibrate')) {
      return 'CALIBRATE';
    }
    if (a['stage'] == 'DECOMMISSIONED' &&
        (_can(auth, 'assets:write-off') || _can(auth, 'assets:dispose'))) {
      return 'RETIRE_REVIEW';
    }
    return 'NONE';
  }

  static bool visible(MockStore store, AuthContext auth, Json a) {
    tick(store, a);
    final me = _me(auth);
    final c = openCustody(store, a.str('id'));
    if (c?['employeeUserId'] == me) return true;
    if (wosOf(store, a.str('id')).any((w) => w['assigneeUserId'] == me)) {
      return true;
    }
    if (!_can(auth, 'assets:read') &&
        !_can(auth, 'assets:maintain') &&
        !_can(auth, 'assets:loto')) {
      return false;
    }
    if (_vehicleOnly(auth) && a['assetClass'] != 'VEHICLE') return false;
    var sc = GrantScope.self;
    for (final key in [
      'assets:read',
      'assets:maintain',
      'assets:loto',
      'assets:commission',
    ]) {
      if (_can(auth, key)) {
        final s = _scope(auth, key);
        if (s.index > sc.index) sc = s;
      }
    }
    if (sc == GrantScope.company) return true;
    if (sc == GrantScope.site) {
      return a['siteId'] == auth.employee.obj('site')['id'];
    }
    if (sc == GrantScope.department) {
      return a['departmentId'] == auth.employee.obj('department')['id'];
    }
    return false;
  }

  static int attentionRank(MockStore store, Json a) {
    final fin = financials(store, a);
    final c = openCustody(store, a.str('id'));
    if (c != null && c['acknowledgedAt'] == null) return 0;
    if (a['stage'] == 'QUARANTINE_LOTO') return 1;
    if (openWos(store, a.str('id')).any((w) => w['type'] == 'CM')) return 2;
    if (a['stage'] == 'MAINTENANCE' || a['stage'] == 'CALIBRATION_DUE') {
      return 3;
    }
    if (fin['isEolCandidate'] == true) return 4;
    final cal = a.strOrNull('nextCalibrationAt');
    if (cal != null &&
        DateTime.parse(cal).difference(_now(store)).inDays <= 30) {
      return 5;
    }
    return 6;
  }

  static Json wire(MockStore store, AuthContext auth, Json raw) {
    final a = tick(store, raw);
    final fin = financials(store, a);
    final c = openCustody(store, a.str('id'));
    final cat = category(a.str('categoryId'));
    final wos = wosOf(store, a.str('id'))
      ..sort((x, y) => y.str('createdAt').compareTo(x.str('createdAt')));
    final events =
        store
            .all(Col.assetEvents)
            .where((e) => e['assetId'] == a['id'])
            .toList()
          ..sort((x, y) => x.str('createdAt').compareTo(y.str('createdAt')));
    final trId = a.strOrNull('openTransferId');
    final tr = trId == null ? null : store.get(Col.assetTransfers, trId);
    Json? disposal;
    final did = a.strOrNull('disposalId');
    if (did != null) disposal = store.get(Col.assetDisposals, did);
    final me = _me(auth);
    final st = a.str('stage');
    final unacked = c != null && c['acknowledgedAt'] == null;
    return {
      'id': a['id'],
      'tag': a['tag'],
      'name': a['name'],
      'nameBn': a['nameBn'] ?? a['name'],
      'stage': st,
      'assetClass': a['assetClass'],
      'criticality': a['criticality'],
      'category': {
        'id': cat['id'],
        'name': cat['name'],
        'nameBn': cat['nameBn'],
        'assetClass': cat['assetClass'],
      },
      'site': _site(a.str('siteId')),
      'location': a['location'],
      'departmentId': a['departmentId'],
      'oem': a['oem'],
      'modelNo': a['modelNo'],
      'serialNo': a['serialNo'],
      'purchaseCost': a['purchaseCost'],
      'usefulLifeYears': a['usefulLifeYears'],
      'depreciationMethod': a['depreciationMethod'],
      'healthScore': a['healthScore'],
      'runtimeHours': a['runtimeHours'],
      'ratedLifeHours': a['ratedLifeHours'],
      'commissionedAt': a['commissionedAt'],
      'purchaseDate': a['purchaseDate'],
      'nextCalibrationAt': a['nextCalibrationAt'],
      'calibrationExpired': a['calibrationExpired'] == true,
      'lotoPermitNo': a['lotoPermitNo'],
      'lotoActive': _lotoActive(a),
      'vehicleId': a['vehicleId'],
      'financials': fin,
      'currentCustody': c == null
          ? null
          : {
              ...c,
              'holder': WorkflowEngine.personRef(
                store,
                c.strOrNull('employeeUserId'),
              ),
              'ackOverdue':
                  unacked &&
                  DateTime.parse(c.str('assignedAt'))
                      .add(const Duration(days: AssetPolicy.custodyAckDays))
                      .isBefore(_now(store)),
            },
      'openWorkOrders': [
        for (final w in wos.where((w) => w['status'] != 'COMPLETED'))
          {
            ...w,
            'assignee': WorkflowEngine.personRef(
              store,
              w.strOrNull('assigneeUserId'),
            ),
            'me': {
              'canStart':
                  w['status'] == 'SCHEDULED' &&
                  (w['assigneeUserId'] == me || _can(auth, 'assets:maintain')),
              'canComplete':
                  (w['status'] == 'IN_PROGRESS' ||
                      w['status'] == 'SCHEDULED') &&
                  (w['assigneeUserId'] == me || _can(auth, 'assets:maintain')),
            },
          },
      ],
      'transfer': tr,
      'disposal': disposal,
      'events': events,
      'nextAction': nextAction(store, auth, a),
      'createdAt': a['createdAt'],
      'me': {
        'isCustodian': c?['employeeUserId'] == me,
        'canAck': unacked && c['employeeUserId'] == me,
        'canAssign': _can(auth, 'assets:custody-assign') && !_lotoActive(a),
        'canRelease':
            (c?['employeeUserId'] == me ||
                _can(auth, 'assets:custody-assign')) &&
            c != null,
        'canFlag':
            c?['employeeUserId'] == me || _can(auth, 'assets:flag-defect'),
        'canCommission': st == 'IN_STOCK' && _can(auth, 'assets:commission'),
        'canTransfer': st == 'OPERATIONAL' && _can(auth, 'assets:transfer'),
        'canReceive': st == 'IN_TRANSFER' && _can(auth, 'assets:transfer'),
        'canLoto': _can(auth, 'assets:loto'),
        'canCertify': _can(auth, 'assets:calibrate'),
        'canDecommission':
            !const {'DECOMMISSIONED', 'DISPOSED'}.contains(st) &&
            _can(auth, 'assets:decommission'),
        'canChecklist':
            st == 'DECOMMISSIONED' &&
            (_can(auth, 'assets:decommission') ||
                _can(auth, 'assets:write-off')),
        'canWriteOff':
            st == 'DECOMMISSIONED' &&
            disposal?['writeOffApproved'] != true &&
            _can(auth, 'assets:write-off'),
        'canDispose': st == 'DECOMMISSIONED' && _can(auth, 'assets:dispose'),
      },
    };
  }

  /// Anyone who can see equipment can ask for a new piece.
  static Json requisition(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'assets:read')) {
      throw policyViolation('FORBIDDEN', 'You cannot ask for equipment.');
    }
    final name = (body['name'] as String? ?? '').trim();
    if (name.length < 3) throw validationError('name', 'Name is too short');
    final reason = (body['reason'] as String? ?? '').trim();
    if (reason.length < 3) {
      throw validationError('reason', 'Say why you need it');
    }
    final rec = <String, Object?>{
      'id': 'areq_${store.nowMs()}',
      'requesterUserId': auth.user['id'],
      'name': name,
      'reason': reason,
      'status': 'OPEN',
      'createdAt': _stamp(store),
    };
    store.put(Col.assetRequisitions, rec);
    return rec;
  }

  static Json? _site(String? id) {
    if (id == null) return null;
    final s = sites.where((x) => x['id'] == id).toList();
    if (s.isEmpty) return null;
    return {'id': id, 'name': s.first['name'], 'nameBn': s.first['nameBn']};
  }
}
