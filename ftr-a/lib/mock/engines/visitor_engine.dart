import 'dart:convert';
import 'dart:math' as math;

import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Settings behind doc 06 MOD-08 (BR-08-01 … BR-08-13).
abstract final class VisitPolicy {
  static const categories = {
    'VIP',
    'GOVT',
    'VENDOR',
    'CLIENT',
    'CONTRACTOR',
    'REGULAR',
  };
  static const needsApproval = {'VIP', 'GOVT'};
  static const vipTiers = {'VVIP_L1', 'VIP', 'GOVT'};
  static const idProofTypes = {'NID', 'PASSPORT', 'GOVT_BADGE', 'COMPANY_ID'};
  static const idProofRequired = {'VIP', 'GOVT', 'CONTRACTOR'};
  static const findingStatuses = {'OBSERVATION', 'MINOR', 'MAJOR', 'CRITICAL'};
  static const terminal = {'CHECKED_OUT', 'DENIED', 'CANCELLED'};
  static const defaultHours = 4;
  static const overstayGraceMinutes = 30;
  static const ppeValidHours = 12;
  static const maxExtensions = 2;
  static const maxExtendHours = 8;
  static const noShowHours = 24;
  static const maxInside = {'site_plant': 150, 'site_hq': 200, 'site_ctg': 80};

  static const zones = <Json>[
    {
      'id': 'z_hq_rec',
      'siteId': 'site_hq',
      'name': 'Reception',
      'nameBn': 'রিসেপশন',
      'level': 'GREEN',
    },
    {
      'id': 'z_hq_board',
      'siteId': 'site_hq',
      'name': 'Boardroom',
      'nameBn': 'বোর্ডরুম',
      'level': 'GREEN',
    },
    {
      'id': 'z_hq_recds',
      'siteId': 'site_hq',
      'name': 'Records room',
      'nameBn': 'রেকর্ড কক্ষ',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_tank',
      'siteId': 'site_plant',
      'name': 'Storage Tank Yard TK-101–108',
      'nameBn': 'স্টোরেজ ট্যাংক ইয়ার্ড',
      'level': 'RED',
    },
    {
      'id': 'z_pl_proc',
      'siteId': 'site_plant',
      'name': 'Bitumen Thermal Processing Unit #2',
      'nameBn': 'বিটুমিন প্রক্রিয়াকরণ ইউনিট',
      'level': 'RED',
    },
    {
      'id': 'z_pl_gantry',
      'siteId': 'site_plant',
      'name': 'Bulk Tanker Loading Gantry',
      'nameBn': 'ট্যাংকার লোডিং গ্যান্ট্রি',
      'level': 'RED',
    },
    {
      'id': 'z_pl_pump',
      'siteId': 'site_plant',
      'name': 'Circulation Pump House Unit-2',
      'nameBn': 'পাম্প হাউস',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_boiler',
      'siteId': 'site_plant',
      'name': 'Boiler House and Steam Utility',
      'nameBn': 'বয়লার হাউস',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_etp',
      'siteId': 'site_plant',
      'name': 'ETP',
      'nameBn': 'ইটিপি',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_shop',
      'siteId': 'site_plant',
      'name': 'Central Workshop',
      'nameBn': 'কেন্দ্রীয় ওয়ার্কশপ',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_sub',
      'siteId': 'site_plant',
      'name': 'Electrical Substation #3',
      'nameBn': 'সাবস্টেশন',
      'level': 'YELLOW',
    },
    {
      'id': 'z_pl_lab',
      'siteId': 'site_plant',
      'name': 'Central QC Lab',
      'nameBn': 'কিউসি ল্যাব',
      'level': 'GREEN',
    },
    {
      'id': 'z_pl_gate',
      'siteId': 'site_plant',
      'name': 'Main Truck Logistics Gate #2',
      'nameBn': 'প্রধান গেট',
      'level': 'GREEN',
    },
  ];
}

/// Guest and VIP passes (doc 03 §14 / doc 06 BR-08).
abstract final class VisitEngine {
  static final _rand = math.Random.secure();
  static String? seedClock;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static String _me(AuthContext a) => a.user.str('id');

  static String _siteOf(AuthContext a) => a.employee.obj('site').str('id');

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _nextVisitNo(MockStore store) {
    final year = _year(store);
    var max = 0;
    for (final v in store.all(Col.visits)) {
      final n = v.strOrNull('visitNo');
      if (n != null && n.startsWith('VIS-$year-')) {
        final i = int.tryParse(n.substring(9));
        if (i != null && i > max) max = i;
      }
    }
    return 'VIS-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static String _normPhone(String raw) => raw.replaceAll(RegExp('[^0-9+]'), '');

  static String _maskPhone(String? raw) {
    final p = raw ?? '';
    if (p.length < 4) return '••••';
    return '${p.substring(0, 4)}••••${p.substring(p.length - 2)}';
  }

  static String _token() {
    final b = List<int>.generate(24, (_) => _rand.nextInt(256));
    return base64Url.encode(b).replaceAll('=', '');
  }

  static String _siteName(String id) =>
      sites.firstWhere(
            (s) => s['id'] == id,
            orElse: () => {'name': id},
          )['name']!
          as String;

  static String _siteNameBn(String id) =>
      sites.firstWhere(
            (s) => s['id'] == id,
            orElse: () => {'nameBn': id},
          )['nameBn']!
          as String;

  static String _siteAbbr(String id) => switch (id) {
    'site_hq' => 'HQ',
    'site_plant' => 'PLT',
    _ => 'CTG',
  };

  static Json? _zone(String id) => VisitPolicy.zones.cast<Json?>().firstWhere(
    (z) => z!['id'] == id,
    orElse: () => null,
  );

  static bool _hasLevel(Json v, String level) =>
      v.objList('zones').any((z) => z['level'] == level);

  static bool _ppeNeeded(Json v) =>
      _hasLevel(v, 'YELLOW') || _hasLevel(v, 'RED');

  static bool _needsApproval(Json v) =>
      VisitPolicy.needsApproval.contains(v['category']) || _hasLevel(v, 'RED');

  static bool _ppeOk(MockStore store, Json v) {
    if (!_ppeNeeded(v)) return true;
    final p = v.obj('ppe');
    final at = p.strOrNull('clearedAt');
    if (at == null) return false;
    final age = store.nowMs() - DateTime.parse(at).millisecondsSinceEpoch;
    if (age > VisitPolicy.ppeValidHours * 3600000) return false;
    if (p['hardHat'] != true || p['shoes'] != true || p['hiVisVest'] != true) {
      return false;
    }
    if (_hasLevel(v, 'RED') &&
        (p['goggles'] != true || p['h2sBriefing'] != true)) {
      return false;
    }
    return true;
  }

  static int _insideCount(MockStore store, String siteId) => store
      .all(Col.visits)
      .where(
        (v) =>
            v['siteId'] == siteId &&
            (v['status'] == 'CHECKED_IN' || v['status'] == 'OVERDUE'),
      )
      .length;

  static Json _data(Json v) => {
    'module': 'visitors',
    'route': '/home/visits/${v['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json v,
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
    data: _data(v),
  );

  static void _notifyGate(
    MockStore store,
    Json v,
    String type,
    Bi title,
    Bi body,
  ) {
    for (final u in store.all(Col.users)) {
      if (u['isActive'] == false) continue;
      final roles = u.strList('roles');
      if (!roles.contains('SECURITY_GATE') && !roles.contains('HR_ADMIN')) {
        continue;
      }
      final e = store.get(Col.employees, u.str('employeeId'));
      if (e == null || e.obj('site').str('id') != v['siteId']) {
        if (!roles.contains('HR_ADMIN')) continue;
      }
      _notify(store, u.str('id'), v, type, title, body);
    }
  }

  static String? _text(Json b, String key, int min, int max) {
    final v = b[key];
    if (v == null) return null;
    if (v is! String || v.trim().length < min || v.length > max) {
      throw validationError(key, 'Invalid $key');
    }
    return v.trim();
  }

  static Json _visitorOf(MockStore store, Json visit) =>
      store.get(Col.visitors, visit.str('visitorId')) ?? const {};

  static void _screen(MockStore store, Json visitor, Json visit) {
    if (visitor['isBlacklisted'] == true) {
      throw policyViolation(
        'VISITOR_BLACKLISTED',
        'This person cannot be registered.',
      );
    }
    final phone = visitor.strOrNull('phoneNorm') ?? '';
    final name = (visitor.strOrNull('fullName') ?? '').toLowerCase().trim();
    for (final w in store.all(Col.watchlist)) {
      final hitPhone = phone.isNotEmpty && w.strOrNull('phoneNorm') == phone;
      final hitName =
          name.isNotEmpty &&
          (w.strOrNull('fullName') ?? '').toLowerCase().trim() == name;
      if (hitPhone || hitName) {
        visit['watchlistHit'] = w.str('id');
        visit['watchlistCleared'] = false;
        return;
      }
    }
  }

  static Json _upsertVisitor(MockStore store, Json b) {
    final name = _text(b, 'fullName', 2, 120);
    if (name == null) throw validationError('fullName', 'Enter the guest name');
    final phoneRaw = _text(b, 'phone', 8, 20);
    if (phoneRaw == null) {
      throw validationError('phone', 'Enter a phone number');
    }
    final phone = _normPhone(phoneRaw);
    final existing = store
        .all(Col.visitors)
        .cast<Json?>()
        .firstWhere((v) => v!['phoneNorm'] == phone, orElse: () => null);
    final now = _stamp(store);
    final proofType = b['idProofType'];
    if (proofType != null &&
        (proofType is! String ||
            !VisitPolicy.idProofTypes.contains(proofType))) {
      throw validationError('idProofType', 'Unknown ID type');
    }
    final proofNo = b['idProofNo'] is String
        ? (b['idProofNo']! as String).trim()
        : '';
    final rec =
        existing ??
        <String, Object?>{
          'id':
              'gst_${store.collection(Col.visitors).length + 1}_${store.nowMs()}',
          'isBlacklisted': false,
          'createdAt': now,
        };
    rec
      ..['fullName'] = name
      ..['organisation'] =
          _text(b, 'organisation', 2, 120) ?? rec['organisation']
      ..['phone'] = phoneRaw.trim()
      ..['phoneNorm'] = phone
      ..['email'] = _text(b, 'email', 3, 120)
      ..['idProofType'] = proofType
      ..['updatedAt'] = now;
    if (proofNo.length >= 4) {
      rec
        ..['idProofNoHash'] = Hash.sha256Hex(proofNo.toUpperCase())
        ..['idProofLast4'] = proofNo.substring(proofNo.length - 4);
    }
    store.put(Col.visitors, rec);
    return rec;
  }

  static List<Json> _parseZones(Json b) {
    final raw = b['zones'] ?? const <Object?>[];
    if (raw is! List || raw.length > 10) {
      throw validationError('zones', 'Choose up to 10 areas');
    }
    final out = <Json>[];
    for (final e in raw) {
      if (e is! Map) throw validationError('zones', 'Unknown area');
      final id = e['zoneId'] ?? e['id'];
      final z = id is String ? _zone(id) : null;
      if (z == null) throw validationError('zones', 'Unknown area');
      out.add({
        'id': z['id'],
        'name': z['name'],
        'nameBn': z['nameBn'],
        'level': z['level'],
        'escortRequired': z['level'] == 'RED',
      });
    }
    return out;
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    final category = body['category'];
    if (category is! String || !VisitPolicy.categories.contains(category)) {
      throw validationError('category', 'Choose who this guest is');
    }
    if (VisitPolicy.idProofRequired.contains(category) &&
        (body['idProofNo'] is! String ||
            (body['idProofNo']! as String).trim().length < 4)) {
      throw validationError('idProofNo', 'ID number is required');
    }
    if (category == 'VIP' &&
        (body['vipTier'] is! String ||
            !VisitPolicy.vipTiers.contains(body['vipTier']))) {
      throw validationError('vipTier', 'Choose a VIP level');
    }
    final purpose = _text(body, 'purpose', 5, 400);
    if (purpose == null) {
      throw validationError('purpose', 'Say why they are coming');
    }
    final expectedRaw = body['expectedAt'];
    if (expectedRaw is! String) {
      throw validationError('expectedAt', 'Choose when they arrive');
    }
    final expected = DateTime.parse(expectedRaw);
    final now = DateTime.parse(_stamp(store));
    if (expected.isBefore(now.subtract(const Duration(hours: 1)))) {
      throw validationError(
        'expectedAt',
        'Arrival cannot be more than an hour ago',
      );
    }
    final end = body['expectedEndAt'] == null
        ? expected.add(const Duration(hours: VisitPolicy.defaultHours))
        : DateTime.parse(body['expectedEndAt']! as String);
    if (end.isAfter(expected.add(const Duration(hours: 24))) ||
        !end.isAfter(expected)) {
      throw validationError('expectedEndAt', 'Visit must end within 24 hours');
    }
    final hostId = body['hostUserId'] is String
        ? body.str('hostUserId')
        : _me(auth);
    if (hostId != _me(auth) && !_can(auth, 'visitors:gate')) {
      throw forbidden();
    }
    final host = store.get(Col.users, hostId);
    if (host == null) throw validationError('hostUserId', 'Host not found');
    final hostEmp = store.get(Col.employees, host.str('employeeId'));
    final siteId = body['siteId'] is String
        ? body.str('siteId')
        : hostEmp?.obj('site').str('id') ?? _siteOf(auth);
    if (sites.every((s) => s['id'] != siteId)) {
      throw validationError('siteId', 'Unknown site');
    }
    final visitor = _upsertVisitor(store, body);
    final zones = _parseZones(body);
    final nowIso = _stamp(store);
    final visit = <String, Object?>{
      'id': 'vis_${store.collection(Col.visits).length + 1}_${store.nowMs()}',
      'visitNo': _nextVisitNo(store),
      'status': 'PRE_REGISTERED',
      'category': category,
      'vipTier': category == 'VIP' ? body['vipTier'] : null,
      'purpose': purpose,
      'hostUserId': hostId,
      'siteId': siteId,
      'visitorId': visitor['id'],
      'expectedAt': expected.toUtc().toIso8601String(),
      'expectedEndAt': end.toUtc().toIso8601String(),
      'extensions': 0,
      'escortUserId': body['escortUserId'],
      'vehiclePlate': _text(body, 'vehiclePlate', 3, 32),
      'parkingSlot': _text(body, 'parkingSlot', 1, 20),
      'qrToken': _token(),
      'badgeNo': null,
      'checkedInAt': null,
      'checkedOutAt': null,
      'photoFileId': null,
      'ndaSigned': false,
      'safetyBriefingDone': false,
      'ppe': <String, Object?>{},
      'zones': zones,
      'findings': <Json>[],
      'watchlistHit': null,
      'watchlistCleared': true,
      'musterSafeAt': null,
      'notes': _text(body, 'notes', 0, 500),
      'createdAt': nowIso,
      'updatedAt': nowIso,
    };
    _screen(store, visitor, visit);
    if (visit['escortUserId'] is String) _assertEscort(store, visit);
    if (visit['watchlistHit'] == null && !_needsApproval(visit)) {
      visit['status'] = 'APPROVED';
    }
    store.put(Col.visits, visit);
    AuditEngine.log(
      store,
      action: 'VISIT_REGISTERED',
      entityType: 'Visit',
      actorUserId: _me(auth),
      entityId: visit.str('id'),
      after: {'visitNo': visit['visitNo']},
    );
    _notifyGate(
      store,
      visit,
      'VISIT_REGISTERED',
      const Bi('A guest is expected', 'একজন অতিথি আসছেন'),
      Bi(
        '${visitor['fullName']} is coming to see ${_person(store, hostId, false)}',
        '${visitor['fullName']} ${_person(store, hostId, true)}-এর সাথে দেখা করতে আসছেন',
      ),
    );
    if (visit['status'] == 'APPROVED') {
      _notify(
        store,
        hostId,
        visit,
        'VISIT_APPROVED',
        const Bi('Guest pass is ready', 'অতিথি পাস প্রস্তুত'),
        Bi(
          '${visitor['fullName']} can be received at the gate.',
          '${visitor['fullName']}-কে গেটে গ্রহণ করা যাবে।',
        ),
      );
    }
    return visit;
  }

  static String _person(MockStore store, String? userId, bool bn) {
    final p = WorkflowEngine.personRef(store, userId);
    if (p == null) return '';
    return (bn ? p['nameBn'] : p['name']) as String? ?? '';
  }

  static void _assertEscort(MockStore store, Json visit) {
    final id = visit['escortUserId'];
    if (id is! String) return;
    final u = store.get(Col.users, id);
    final e = u == null ? null : store.get(Col.employees, u.str('employeeId'));
    if (e == null || e.obj('site').str('id') != visit['siteId']) {
      throw validationError('escortUserId', 'Escort must work at this site');
    }
  }

  static void _mustOpen(Json v, Set<String> allowed) {
    if (!allowed.contains(v['status'])) {
      throw invalidTransition('This visit cannot do that now.');
    }
  }

  static void approve(MockStore store, AuthContext auth, Json v) {
    if (!_can(auth, 'visitors:approve')) throw forbidden();
    _mustOpen(v, {'PRE_REGISTERED'});
    if (v['watchlistHit'] != null && v['watchlistCleared'] != true) {
      throw policyViolation(
        'WATCHLIST_HIT',
        'Security must clear the watchlist first.',
      );
    }
    v
      ..['status'] = 'APPROVED'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
    _notify(
      store,
      v.str('hostUserId'),
      v,
      'VISIT_APPROVED',
      const Bi('Guest visit approved', 'অতিথি সফর অনুমোদিত'),
      Bi(
        '${_visitorOf(store, v)['fullName']} can be received at the gate.',
        '${_visitorOf(store, v)['fullName']}-কে গেটে গ্রহণ করা যাবে।',
      ),
    );
  }

  static void deny(MockStore store, AuthContext auth, Json v, Json body) {
    if (!_can(auth, 'visitors:approve') && !_can(auth, 'visitors:watchlist')) {
      throw forbidden();
    }
    _mustOpen(v, {'PRE_REGISTERED'});
    final reason = _text(body, 'reason', 5, 400);
    if (reason == null) throw validationError('reason', 'Say why');
    v
      ..['status'] = 'DENIED'
      ..['notes'] = reason
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
    _notify(
      store,
      v.str('hostUserId'),
      v,
      'VISIT_DENIED',
      const Bi('Guest visit was not approved', 'অতিথি সফর অনুমোদিত হয়নি'),
      Bi(reason, reason),
    );
  }

  static void cancel(MockStore store, AuthContext auth, Json v, Json body) {
    final me = _me(auth);
    if (v['hostUserId'] != me && !_can(auth, 'visitors:gate')) {
      throw forbidden();
    }
    _mustOpen(v, {'PRE_REGISTERED', 'APPROVED'});
    v
      ..['status'] = 'CANCELLED'
      ..['notes'] = _text(body, 'reason', 0, 400)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static void clearWatchlist(
    MockStore store,
    AuthContext auth,
    Json v,
    Json body,
  ) {
    if (!_can(auth, 'visitors:watchlist')) throw forbidden();
    if (v['watchlistHit'] == null) {
      throw invalidTransition('No watchlist hit on this visit.');
    }
    final action = body['action'];
    if (action == 'deny') {
      deny(store, auth, v, {
        'reason': _text(body, 'reason', 5, 400) ?? 'Watchlist confirmed',
      });
      return;
    }
    v
      ..['watchlistCleared'] = true
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static void ppe(MockStore store, AuthContext auth, Json v, Json body) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    if (v['siteId'] != _siteOf(auth) && !_can(auth, 'visitors:approve')) {
      throw forbidden();
    }
    _mustOpen(v, {'PRE_REGISTERED', 'APPROVED'});
    v['ppe'] = {
      'hardHat': body['hardHat'] == true,
      'goggles': body['goggles'] == true,
      'shoes': body['shoes'] == true,
      'hiVisVest': body['hiVisVest'] == true,
      'h2sBriefing': body['h2sBriefing'] == true,
      'clearedById': _me(auth),
      'clearedAt': _stamp(store),
    };
    v['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static void setEscort(MockStore store, AuthContext auth, Json v, Json body) {
    if (v['hostUserId'] != _me(auth) && !_can(auth, 'visitors:gate')) {
      throw forbidden();
    }
    _mustOpen(v, {'PRE_REGISTERED', 'APPROVED'});
    v['escortUserId'] = body['escortUserId'];
    _assertEscort(store, v);
    v['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static String _nextBadge(MockStore store, Json v) {
    final day = _stamp(store).substring(0, 10);
    final vip = VisitPolicy.needsApproval.contains(v['category']);
    final prefix = v['category'] == 'GOVT'
        ? 'GOVT'
        : vip
        ? 'VIP'
        : 'BDG-${_siteAbbr(v.str('siteId'))}';
    var max = 0;
    for (final x in store.all(Col.visits)) {
      final b = x.strOrNull('badgeNo');
      if (b == null || !b.startsWith('$prefix-')) continue;
      if ((x.strOrNull('checkedInAt') ?? '').substring(0, 10) != day &&
          x['status'] != 'CHECKED_IN' &&
          x['status'] != 'OVERDUE') {
        continue;
      }
      final n = int.tryParse(b.split('-').last);
      if (n != null && n > max) max = n;
    }
    return '$prefix-${(max + 1).toString().padLeft(2, '0')}';
  }

  static void checkIn(MockStore store, AuthContext auth, Json v, Json body) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    if (v['siteId'] != _siteOf(auth) && !_can(auth, 'visitors:approve')) {
      throw forbidden();
    }
    tick(store);
    _mustOpen(v, {'APPROVED'});
    final visitor = _visitorOf(store, v);
    if (visitor['isBlacklisted'] == true) {
      throw policyViolation('VISITOR_BLACKLISTED', 'This person cannot enter.');
    }
    if (v['watchlistHit'] != null && v['watchlistCleared'] != true) {
      throw policyViolation(
        'WATCHLIST_HIT',
        'Security must clear the watchlist first.',
      );
    }
    if (!_ppeOk(store, v)) {
      throw policyViolation(
        'PPE_NOT_CLEARED',
        'Clear PPE before they enter this area.',
      );
    }
    if (_hasLevel(v, 'RED') && v['escortUserId'] == null) {
      throw policyViolation(
        'ESCORT_REQUIRED',
        'A red area needs an escort on site.',
      );
    }
    final cap = VisitPolicy.maxInside[v.str('siteId')] ?? 200;
    if (_insideCount(store, v.str('siteId')) >= cap &&
        !_can(auth, 'visitors:watchlist')) {
      throw policyViolation(
        'SITE_FULL',
        'Too many guests inside. A security lead can override.',
      );
    }
    final photo = body['photoFileId'];
    if (photo is! String || store.get(Col.files, photo) == null) {
      throw validationError('photoFileId', 'Take a photo at the gate');
    }
    FileEngine.attach(store, photo, ownerType: 'Visit', ownerId: v.str('id'));
    v
      ..['status'] = 'CHECKED_IN'
      ..['checkedInAt'] = _stamp(store)
      ..['badgeNo'] =
          body['badgeNo'] is String &&
              (body['badgeNo']! as String).trim().length >= 3
          ? (body['badgeNo']! as String).trim()
          : _nextBadge(store, v)
      ..['photoFileId'] = photo
      ..['ndaSigned'] = body['ndaSigned'] == true
      ..['safetyBriefingDone'] = body['safetyBriefingDone'] == true
      ..['qrToken'] = _token()
      ..['musterSafeAt'] = null
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
    _notify(
      store,
      v.str('hostUserId'),
      v,
      'VISIT_CHECKED_IN',
      const Bi('Your guest is at the gate', 'আপনার অতিথি গেটে এসেছেন'),
      Bi(
        '${visitor['fullName']} has checked in.',
        '${visitor['fullName']} প্রবেশ করেছেন।',
      ),
    );
    if (v['escortUserId'] is String) {
      _notify(
        store,
        v.str('escortUserId'),
        v,
        'VISIT_ESCORT_ASSIGNED',
        const Bi('Please escort this guest', 'এই অতিথিকে সঙ্গে রাখুন'),
        Bi(
          '${visitor['fullName']} is inside. Stay with them in red areas.',
          '${visitor['fullName']} ভিতরে আছেন। লাল এলাকায় সঙ্গে থাকুন।',
        ),
      );
    }
  }

  static void checkOut(MockStore store, AuthContext auth, Json v, Json body) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    tick(store);
    _mustOpen(v, {'CHECKED_IN', 'OVERDUE'});
    if (body['badgeReturned'] == false) {
      final list = v.objList('findings')
        ..add({
          'id': 'fnd_${v.objList('findings').length + 1}',
          'area': 'Gate',
          'finding': 'Badge was not returned',
          'status': 'OBSERVATION',
          'byUserId': _me(auth),
          'at': _stamp(store),
        });
      v['findings'] = list;
    }
    v
      ..['status'] = 'CHECKED_OUT'
      ..['checkedOutAt'] = _stamp(store)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
    _notify(
      store,
      v.str('hostUserId'),
      v,
      'VISIT_CHECKED_OUT',
      const Bi('Your guest has left', 'আপনার অতিথি চলে গেছেন'),
      Bi(
        '${_visitorOf(store, v)['fullName']} checked out.',
        '${_visitorOf(store, v)['fullName']} বেরিয়ে গেছেন।',
      ),
    );
  }

  static void extend(MockStore store, AuthContext auth, Json v, Json body) {
    tick(store);
    if (v['hostUserId'] != _me(auth) && !_can(auth, 'visitors:gate')) {
      throw forbidden();
    }
    _mustOpen(v, {'CHECKED_IN', 'OVERDUE'});
    final n = (v['extensions'] as num?)?.toInt() ?? 0;
    if (n >= VisitPolicy.maxExtensions) {
      throw policyViolation(
        'EXTEND_LIMIT',
        'This visit has already been extended twice.',
      );
    }
    final raw = body['expectedEndAt'];
    if (raw is! String) {
      throw validationError('expectedEndAt', 'Choose a new end time');
    }
    final end = DateTime.parse(raw);
    final now = DateTime.parse(_stamp(store));
    if (!end.isAfter(now) ||
        end.isAfter(
          now.add(const Duration(hours: VisitPolicy.maxExtendHours)),
        )) {
      throw validationError('expectedEndAt', 'New end must be within 8 hours');
    }
    v
      ..['expectedEndAt'] = end.toUtc().toIso8601String()
      ..['extensions'] = n + 1
      ..['status'] = 'CHECKED_IN'
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static void addFinding(MockStore store, AuthContext auth, Json v, Json body) {
    if (!_can(auth, 'visitors:inspect') && !_can(auth, 'visitors:gate')) {
      throw forbidden();
    }
    final area = _text(body, 'area', 2, 80);
    final finding = _text(body, 'finding', 5, 400);
    final status = body['status'] ?? 'OBSERVATION';
    if (area == null || finding == null) {
      throw validationError('finding', 'Describe what you saw');
    }
    if (!VisitPolicy.findingStatuses.contains(status)) {
      throw validationError('status', 'Unknown finding type');
    }
    final list = v.objList('findings')
      ..add({
        'id': 'fnd_${v.objList('findings').length + 1}',
        'area': area,
        'finding': finding,
        'status': status,
        'byUserId': _me(auth),
        'at': _stamp(store),
      });
    v
      ..['findings'] = list
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
    if (status == 'CRITICAL') {
      NotificationEngine.notifyRole(
        store,
        role: 'HSE_OFFICER',
        type: 'VISIT_FINDING_CRITICAL',
        title: const Bi(
          'Critical finding on a visit',
          'সফরে গুরুতর পর্যবেক্ষণ',
        ),
        body: Bi(finding, finding),
        priority: 'HIGH',
        data: _data(v),
      );
    }
  }

  static Json? scan(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    tick(store);
    final q = (body['q'] ?? body['qrToken'] ?? body['visitNo'] ?? '')
        .toString()
        .trim();
    if (q.length < 3) {
      throw validationError('q', 'Scan or type the pass number');
    }
    final uq = q.toUpperCase();
    final v = store.all(Col.visits).cast<Json?>().firstWhere((x) {
      if (x == null) return false;
      if (!visibleTo(store, auth, x)) return false;
      return x.str('visitNo').toUpperCase() == uq ||
          x.strOrNull('qrToken') == q ||
          (x.strOrNull('vehiclePlate') ?? '').toUpperCase() == uq ||
          (x.strOrNull('badgeNo') ?? '').toUpperCase() == uq;
    }, orElse: () => null);
    return v;
  }

  static Json musterStatus(MockStore store, AuthContext auth) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    final site = _siteOf(auth);
    final m = store.get(Col.visitMusters, site);
    final inside = store
        .all(Col.visits)
        .where(
          (v) =>
              v['siteId'] == site &&
              (v['status'] == 'CHECKED_IN' || v['status'] == 'OVERDUE'),
        )
        .toList();
    return {
      'active': m?['active'] == true,
      'startedAt': m?['startedAt'],
      'inside': inside.length,
      'safe': inside.where((v) => v['musterSafeAt'] != null).length,
      'visits': [
        for (final v in inside)
          {
            'id': v['id'],
            'visitNo': v['visitNo'],
            'name': _visitorOf(store, v)['fullName'],
            'host': WorkflowEngine.personRef(store, v.str('hostUserId')),
            'musterSafeAt': v['musterSafeAt'],
          },
      ],
    };
  }

  static void musterStart(MockStore store, AuthContext auth) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    final site = _siteOf(auth);
    store.put(Col.visitMusters, {
      'id': site,
      'active': true,
      'startedAt': _stamp(store),
      'startedBy': _me(auth),
    });
    NotificationEngine.notifyRole(
      store,
      role: 'HSE_OFFICER',
      type: 'VISIT_MUSTER',
      title: const Bi('Visitor roll-call started', 'অতিথি হাজিরা শুরু'),
      body: Bi(
        'Mark every guest at ${_siteName(site)} as safe.',
        '${_siteNameBn(site)}-এর প্রতিটি অতিথিকে নিরাপদ চিহ্নিত করুন।',
      ),
      priority: 'CRITICAL',
    );
  }

  static void musterEnd(MockStore store, AuthContext auth) {
    if (!_can(auth, 'visitors:gate')) throw forbidden();
    store.put(Col.visitMusters, {
      'id': _siteOf(auth),
      'active': false,
      'startedAt': null,
      'startedBy': null,
    });
  }

  static void musterSafe(MockStore store, AuthContext auth, Json v) {
    if (!_can(auth, 'visitors:gate') &&
        v['hostUserId'] != _me(auth) &&
        v['escortUserId'] != _me(auth)) {
      throw forbidden();
    }
    v
      ..['musterSafeAt'] = _stamp(store)
      ..['updatedAt'] = _stamp(store);
    store.put(Col.visits, v);
  }

  static void tick(MockStore store) {
    final now = DateTime.parse(_stamp(store));
    for (final v in store.all(Col.visits)) {
      if (v['status'] == 'CHECKED_IN') {
        final end = DateTime.parse(v.str('expectedEndAt'));
        if (now.isAfter(
          end.add(const Duration(minutes: VisitPolicy.overstayGraceMinutes)),
        )) {
          v
            ..['status'] = 'OVERDUE'
            ..['updatedAt'] = store.nowIso();
          store.put(Col.visits, v);
          _notify(
            store,
            v.str('hostUserId'),
            v,
            'VISIT_OVERSTAY',
            const Bi(
              'Guest has stayed too long',
              'অতিথি অতিরিক্ত সময় ধরে আছেন',
            ),
            Bi(
              '${_visitorOf(store, v)['fullName']} should have left by now.',
              '${_visitorOf(store, v)['fullName']}-এর যাওয়ার সময় হয়ে গেছে।',
            ),
            priority: 'HIGH',
          );
        }
      }
      if (v['status'] == 'APPROVED') {
        final exp = DateTime.parse(v.str('expectedAt'));
        if (now.isAfter(
          exp.add(const Duration(hours: VisitPolicy.noShowHours)),
        )) {
          v
            ..['status'] = 'CANCELLED'
            ..['notes'] = 'No-show'
            ..['updatedAt'] = store.nowIso();
          store.put(Col.visits, v);
        }
      }
    }
  }

  static bool visibleTo(MockStore store, AuthContext a, Json v) {
    final me = _me(a);
    if (v['hostUserId'] == me || v['escortUserId'] == me) return true;
    if (!_can(a, 'visitors:read') && !_can(a, 'visitors:gate')) return false;
    final g = a.grants.cast<Json?>().firstWhere(
      (x) =>
          x!['key'] == 'visitors:read' ||
          x['key'] == 'visitors:gate' ||
          x['key'] == 'visitors:approve',
      orElse: () => null,
    );
    final scope = g?['scope'];
    if (scope == 'COMPANY') return true;
    if (scope == 'SITE') return v['siteId'] == _siteOf(a);
    return false;
  }

  static Json wire(MockStore store, AuthContext a, Json v) {
    tick(store);
    final me = _me(a);
    final status = v.str('status');
    final visitor = _visitorOf(store, v);
    final isHost = v['hostUserId'] == me;
    final isEscort = v['escortUserId'] == me;
    final gate = _can(a, 'visitors:gate');
    final atSite = v['siteId'] == _siteOf(a) || _can(a, 'visitors:approve');
    final watchOk = v['watchlistHit'] == null || v['watchlistCleared'] == true;
    return {
      'id': v['id'],
      'visitNo': v['visitNo'],
      'status': status,
      'category': v['category'],
      'vipTier': v['vipTier'],
      'purpose': v['purpose'],
      'expectedAt': v['expectedAt'],
      'expectedEndAt': v['expectedEndAt'],
      'extensions': v['extensions'],
      'vehiclePlate': v['vehiclePlate'],
      'parkingSlot': v['parkingSlot'],
      'badgeNo': v['badgeNo'],
      'checkedInAt': v['checkedInAt'],
      'checkedOutAt': v['checkedOutAt'],
      'photoFileId': v['photoFileId'],
      'qrToken': (isHost || gate) ? v['qrToken'] : null,
      'ndaSigned': v['ndaSigned'] == true,
      'safetyBriefingDone': v['safetyBriefingDone'] == true,
      'ppe': v['ppe'],
      'ppeCleared': _ppeOk(store, v),
      'ppeRequired': _ppeNeeded(v),
      'escortRequired': _hasLevel(v, 'RED'),
      'zones': v['zones'],
      'findings': [
        for (final f in v.objList('findings'))
          {
            ...f,
            'by': WorkflowEngine.personRef(store, f.strOrNull('byUserId')),
          },
      ],
      'watchlistHit': v['watchlistHit'] != null && !watchOk,
      'musterSafeAt': v['musterSafeAt'],
      'notes': v['notes'],
      'visitor': {
        'id': visitor['id'],
        'fullName': visitor['fullName'],
        'organisation': visitor['organisation'],
        'phoneMasked': _maskPhone(visitor.strOrNull('phone')),
        'idProofType': visitor['idProofType'],
        'idProofLast4': visitor['idProofLast4'],
      },
      'host': WorkflowEngine.personRef(store, v.str('hostUserId')),
      'escort': WorkflowEngine.personRef(store, v.strOrNull('escortUserId')),
      'site': {
        'id': v['siteId'],
        'name': _siteName(v.str('siteId')),
        'nameBn': _siteNameBn(v.str('siteId')),
      },
      'createdAt': v['createdAt'],
      'me': {
        'isHost': isHost,
        'isEscort': isEscort,
        'canApprove':
            status == 'PRE_REGISTERED' &&
            watchOk &&
            _can(a, 'visitors:approve') &&
            atSite,
        'canDeny':
            status == 'PRE_REGISTERED' &&
            (_can(a, 'visitors:approve') || _can(a, 'visitors:watchlist')),
        'canCancel':
            (isHost || gate) &&
            (status == 'PRE_REGISTERED' || status == 'APPROVED'),
        'canCheckIn': status == 'APPROVED' && gate && atSite,
        'canCheckOut':
            (status == 'CHECKED_IN' || status == 'OVERDUE') && gate && atSite,
        'canPpe':
            gate &&
            atSite &&
            (status == 'PRE_REGISTERED' || status == 'APPROVED'),
        'canExtend':
            (isHost || gate) && (status == 'CHECKED_IN' || status == 'OVERDUE'),
        'canClearWatchlist': !watchOk && _can(a, 'visitors:watchlist'),
        'canFinding':
            (gate || _can(a, 'visitors:inspect')) &&
            (status == 'CHECKED_IN' || status == 'OVERDUE'),
        'canEscort':
            (isHost || gate) &&
            (status == 'PRE_REGISTERED' || status == 'APPROVED'),
        'canMusterSafe':
            (status == 'CHECKED_IN' || status == 'OVERDUE') &&
            (gate || isHost || isEscort),
        'photoRequired': true,
      },
    };
  }
}
