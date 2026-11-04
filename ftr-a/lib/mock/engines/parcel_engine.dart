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

/// Settings behind doc 06 MOD-04 (BR-04-03 … BR-04-11).
abstract final class ParcelPolicy {
  static const categories = {
    'LEGAL_DOCS',
    'QC_SAMPLE',
    'SPARES',
    'TENDER_BID',
    'IT_HARDWARE',
    'GENERAL',
    'CONFIDENTIAL',
  };
  static const confidentialByDefault = {
    'CONFIDENTIAL',
    'LEGAL_DOCS',
    'TENDER_BID',
  };
  static const urgencies = {'NORMAL', 'HIGH', 'CRITICAL'};
  static const returnReasons = {
    'TAMPER_BROKEN',
    'DAMAGED_CONTENTS',
    'WRONG_DOCUMENTS',
    'RECIPIENT_REFUSED',
    'RECIPIENT_UNAVAILABLE',
  };
  static const terminal = {'DELIVERED', 'RETURNED', 'LOST', 'CANCELLED'};
  static const otpTtlHours = 72;
  static const maxOtpAttempts = 5;
  static const dwellAlertHours = 24;
  static const sealRequiredAbove = 100000;
  static const photoRequiredAbove = 50000;
  static const lostAfterHours = 72;
  static const resendPerHour = 3;
}

/// Parcel chain of custody: hash-chained events, tamper flags, OTP delivery
/// and return to sender. Events are embedded and append-only.
abstract final class ParcelEngine {
  static final _rand = math.Random.secure();

  /// Seed data sets this to place history in the past; null means now.
  static String? seedClock;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  // ---- Small helpers ----

  static String _me(AuthContext a) => a.user.str('id');

  static String _siteOf(AuthContext a) => a.employee.obj('site').str('id');

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static String _siteOfUser(MockStore store, String userId) {
    final u = store.get(Col.users, userId);
    final e = u == null ? null : store.get(Col.employees, u.str('employeeId'));
    return e?.obj('site').strOrNull('id') ?? '';
  }

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _nextNo(MockStore store, String key, String prefix) {
    final year = _year(store);
    var max = 0;
    for (final p in store.all(Col.parcels)) {
      final v = p.strOrNull(key);
      if (v != null && v.startsWith('$prefix-$year-')) {
        final n = int.tryParse(v.substring(prefix.length + year.length + 2));
        if (n != null && n > max) max = n;
      }
    }
    return '$prefix-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static String _otpHash(String parcelId, String purpose, String otp) =>
      Hash.sha256Hex('$parcelId|$purpose|$otp');

  static String _newOtp() => (100000 + _rand.nextInt(900000)).toString();

  static bool isStuck(MockStore store, Json p) {
    if (ParcelPolicy.terminal.contains(p['status'])) return false;
    if (p['status'] == 'CREATED') return false;
    final limit =
        ParcelPolicy.dwellAlertHours ~/ (p['urgency'] == 'CRITICAL' ? 2 : 1);
    return dwellHours(store, p) >= limit;
  }

  static int dwellHours(MockStore store, Json p) {
    final last = DateTime.parse(p.str('lastEventAt')).millisecondsSinceEpoch;
    return ((store.nowMs() - last) / 3600000).floor();
  }

  // ---- Events (hash chain, BR-04-01) ----

  static String eventHash({
    required String prev,
    required String type,
    required String actor,
    required String location,
    required String note,
    required String photo,
    required String at,
  }) => Hash.sha256Hex('$prev|$type|$actor|$location|$note|$photo|$at');

  static void _event(
    MockStore store,
    Json p,
    String type,
    String actor, {
    String? location,
    String? note,
    String? photoFileId,
    Json? metadata,
  }) {
    final list = p.objList('events');
    final at = _stamp(store);
    if (photoFileId != null) {
      FileEngine.attach(
        store,
        photoFileId,
        ownerType: 'Parcel',
        ownerId: p.str('id'),
      );
    }
    final prev = list.isEmpty ? '' : list.last.str('eventHash');
    list.add({
      'seqNo': list.length + 1,
      'type': type,
      'actorUserId': actor,
      'location': location,
      'note': note,
      'photoFileId': photoFileId,
      'metadata': metadata,
      'createdAt': at,
      'prevHash': prev,
      'eventHash': eventHash(
        prev: prev,
        type: type,
        actor: actor,
        location: location ?? '',
        note: note ?? '',
        photo: photoFileId ?? '',
        at: at,
      ),
    });
    p
      ..['events'] = list
      ..['lastEventAt'] = at
      ..['dwellAlerted'] = false
      ..['updatedAt'] = at;
    store.put(Col.parcels, p);
  }

  static bool chainValid(Json p) {
    var prev = '';
    for (final e in p.objList('events')) {
      final h = eventHash(
        prev: prev,
        type: e.str('type'),
        actor: e.str('actorUserId'),
        location: e.strOrNull('location') ?? '',
        note: e.strOrNull('note') ?? '',
        photo: e.strOrNull('photoFileId') ?? '',
        at: e.str('createdAt'),
      );
      if (e['prevHash'] != prev || e['eventHash'] != h) return false;
      prev = h;
    }
    return true;
  }

  // ---- Create, edit, cancel ----

  /// A photo the caller uploaded; must exist so the event never points nowhere.
  static String? _photoId(MockStore store, Json b) {
    final id = b['photoFileId'];
    if (id == null) return null;
    if (id is! String || store.get(Col.files, id) == null) {
      throw validationError('photoFileId', 'Photo not found. Upload it again.');
    }
    return id;
  }

  static String? _text(Json b, String key, int min, int max) {
    final v = b[key];
    if (v == null) return null;
    if (v is! String || v.trim().length < min || v.length > max) {
      throw validationError(key, 'Invalid $key');
    }
    return v.trim();
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    final now = _stamp(store);
    final p = <String, Object?>{
      'id': 'pkg_${store.collection(Col.parcels).length + 1}_${store.nowMs()}',
      'trackingNo': _nextNo(store, 'trackingNo', 'PKG'),
      'status': 'CREATED',
      'tamperStatus': 'SECURE',
      'senderUserId': _me(auth),
      'courierUserId': null,
      'sealNo': null,
      'otpHash': null,
      'otpExpiresAt': null,
      'otpAttempts': 0,
      'otpIssuedAt': <Object?>[],
      'returnOtpHash': null,
      'deliveredAt': null,
      'deliveredMethod': null,
      'events': <Json>[],
      'return': null,
      'dwellAlerted': false,
      'createdAt': now,
      'updatedAt': now,
      'lastEventAt': now,
    };
    _apply(store, p, body, auth: auth, creating: true);
    _event(
      store,
      p,
      'CREATED',
      _me(auth),
      location: _siteName(p.str('originSiteId')),
    );
    AuditEngine.log(
      store,
      action: 'PARCEL_CREATED',
      entityType: 'Parcel',
      actorUserId: _me(auth),
      entityId: p.str('id'),
      after: {'trackingNo': p['trackingNo']},
    );
    return p;
  }

  static String _siteName(String id) =>
      sites.firstWhere(
            (s) => s['id'] == id,
            orElse: () => {'name': id},
          )['name']!
          as String;

  static void _apply(
    MockStore store,
    Json p,
    Json b, {
    required AuthContext auth,
    bool creating = false,
  }) {
    final category = b['category'];
    if (category is! String || !ParcelPolicy.categories.contains(category)) {
      throw validationError('category', 'Choose what kind of parcel this is');
    }
    final description = _text(b, 'description', 5, 500);
    if (description == null) {
      throw validationError('description', 'Describe what is inside');
    }
    final urgency = b['urgency'] ?? 'NORMAL';
    if (!ParcelPolicy.urgencies.contains(urgency)) {
      throw validationError('urgency', 'Unknown urgency');
    }
    final value = b['declaredValue'];
    if (value != null && (value is! num || value < 0 || value > 1e10)) {
      throw validationError('declaredValue', 'Enter a valid value');
    }
    final recipient = b['recipientUserId'];
    if (recipient is! String) {
      throw validationError('recipientUserId', 'Choose who receives it');
    }
    final ru = store.get(Col.users, recipient);
    if (ru == null || ru['isActive'] == false) {
      throw validationError('recipientUserId', 'Recipient not found');
    }
    if (recipient == p['senderUserId']) {
      throw validationError(
        'recipientUserId',
        'You cannot send a parcel to yourself',
      );
    }
    final dest = _siteOfUser(store, recipient);
    final handling = b['specialHandling'] ?? const <Object?>[];
    if (handling is! List ||
        handling.any(
          (h) => !const {
            'FRAGILE',
            'COLD_CHAIN',
            'HAZMAT',
            'KEEP_UPRIGHT',
          }.contains(h),
        )) {
      throw validationError('specialHandling', 'Unknown handling');
    }
    final weight = b['weightKg'];
    if (weight != null && (weight is! num || weight <= 0 || weight > 5000)) {
      throw validationError('weightKg', 'Enter a valid weight');
    }
    final wb = _text(b, 'waybillNo', 3, 40);
    p
      ..['category'] = category
      ..['description'] = description
      ..['urgency'] = urgency
      ..['declaredValue'] = value
      ..['recipientUserId'] = recipient
      ..['originSiteId'] = creating ? _siteOf(auth) : p.str('originSiteId')
      ..['destSiteId'] = dest
      ..['isConfidential'] =
          ParcelPolicy.confidentialByDefault.contains(category) ||
          b['isConfidential'] == true
      ..['specialHandling'] = handling
      ..['weightKg'] = weight
      ..['waybillNo'] = wb
      ..['updatedAt'] = _stamp(store);
    store.put(Col.parcels, p);
  }

  static void update(MockStore store, AuthContext auth, Json p, Json body) {
    if (p['status'] != 'CREATED') {
      throw invalidTransition(
        'Only a parcel that is not sent yet can be edited',
      );
    }
    _apply(store, p, body, auth: auth);
  }

  static void cancel(MockStore store, AuthContext auth, Json p) {
    if (p['status'] != 'CREATED') {
      throw invalidTransition(
        'Only a parcel that is not sent yet can be cancelled',
      );
    }
    p['status'] = 'CANCELLED';
    _event(store, p, 'CANCELLED', _me(auth));
  }

  // ---- Movement ----

  static bool intraSite(Json p) => p['originSiteId'] == p['destSiteId'];

  /// BR-04-09: only the assigned courier, or someone who manages parcels.
  static void _requireCustodian(AuthContext a, Json p) {
    if (p['courierUserId'] == _me(a) || _can(a, 'parcels:manage')) return;
    throw forbidden('Only the assigned courier or the mailroom can do this');
  }

  static void dispatch(MockStore store, AuthContext auth, Json p, Json body) {
    if (p['status'] != 'CREATED') {
      throw invalidTransition('This parcel has already been handed over');
    }
    final courier = body['courierUserId'];
    final cu = courier is String ? store.get(Col.users, courier) : null;
    if (cu == null ||
        !(cu.strList('roles').contains('DRIVER') ||
            cu.strList('roles').contains('MAILROOM'))) {
      throw validationError(
        'courierUserId',
        'Choose a driver or mailroom officer to carry it',
      );
    }
    var seal = (body['sealNo'] as String?)?.trim();
    final value = (p['declaredValue'] as num?) ?? 0;
    if ((seal == null || seal.isEmpty) &&
        (p['isConfidential'] == true ||
            value >= ParcelPolicy.sealRequiredAbove)) {
      throw policyViolation(
        'SEAL_REQUIRED',
        'Confidential or high-value parcels need a seal number',
      );
    }
    seal = (seal == null || seal.isEmpty) ? null : seal;
    p
      ..['courierUserId'] = courier
      ..['sealNo'] = seal
      ..['status'] = 'DISPATCHED';
    _event(
      store,
      p,
      'HANDOVER',
      _me(auth),
      location: _siteName(p.str('originSiteId')),
      note: seal == null ? null : 'Seal $seal',
    );
    _notify(
      store,
      p.str('recipientUserId'),
      p,
      'PARCEL_DISPATCHED',
      const Bi(
        'A parcel is on its way to you',
        'আপনার জন্য একটি পার্সেল রওনা হয়েছে',
      ),
      Bi(
        '${p['trackingNo']} has been handed to the courier.',
        '${p['trackingNo']} কুরিয়ারকে দেওয়া হয়েছে।',
      ),
    );
    if (p['urgency'] == 'CRITICAL') {
      NotificationEngine.notifyRole(
        store,
        role: 'TRANSPORT_ADMIN',
        type: 'PARCEL_DISPATCHED',
        title: const Bi(
          'Critical parcel dispatched',
          'জরুরি পার্সেল পাঠানো হয়েছে',
        ),
        body: Bi(
          '${p['trackingNo']} is marked critical and is now moving.',
          '${p['trackingNo']} অতি জরুরি হিসেবে চিহ্নিত এবং এখন চলছে।',
        ),
        priority: 'HIGH',
        data: _data(p),
      );
    }
  }

  static void checkpoint(MockStore store, AuthContext auth, Json p, Json body) {
    final status = p.str('status');
    final ret = status == 'RETURN_INITIATED' || status == 'RETURN_IN_TRANSIT';
    if (!ret && status != 'DISPATCHED' && status != 'IN_TRANSIT') {
      throw invalidTransition('This parcel is not on the road');
    }
    _requireCustodian(auth, p);
    final location = _text(body, 'location', 2, 120);
    if (location == null) {
      throw validationError('location', 'Say where the parcel is now');
    }
    if (body['sealIntact'] == false) {
      throw validationError(
        'sealIntact',
        'Use "Report a problem" if the seal is broken',
      );
    }
    p['status'] = ret ? 'RETURN_IN_TRANSIT' : 'IN_TRANSIT';
    _event(
      store,
      p,
      ret ? 'RETURN_CHECKPOINT' : 'CHECKPOINT',
      _me(auth),
      location: location,
      note: _text(body, 'note', 1, 500),
    );
  }

  /// Gate-in at the destination site (BR-04 §5.3).
  static void gateIn(MockStore store, AuthContext auth, Json p, Json body) {
    final status = p.str('status');
    if (status != 'DISPATCHED' && status != 'IN_TRANSIT') {
      throw invalidTransition('This parcel is not on the road');
    }
    if (intraSite(p)) {
      throw invalidTransition(
        'This parcel stays inside one site; no gate scan',
      );
    }
    if (_siteOf(auth) != p['destSiteId'] && !_can(auth, 'parcels:manage')) {
      throw forbidden('Only the gate at the destination site can receive it');
    }
    if (body['sealIntact'] == false) {
      flag(store, auth, p, {
        'reason': 'TAMPER_BROKEN',
        'note': body['note'],
        'photoFileId': body['photoFileId'],
        'asGateIn': true,
      });
      return;
    }
    p['status'] = 'AT_GATE';
    _event(
      store,
      p,
      'GATE_IN',
      _me(auth),
      location: _siteName(p.str('destSiteId')),
      note: _text(body, 'note', 1, 500),
    );
    _notify(
      store,
      p.str('recipientUserId'),
      p,
      'PARCEL_AT_GATE',
      const Bi('Your parcel reached the gate', 'আপনার পার্সেল গেটে পৌঁছেছে'),
      Bi(
        '${p['trackingNo']} is at the gate. The mailroom will bring it to you.',
        '${p['trackingNo']} গেটে আছে। মেইলরুম আপনার কাছে পৌঁছে দেবে।',
      ),
    );
  }

  static void outForDelivery(MockStore store, AuthContext auth, Json p) {
    final status = p.str('status');
    final okFrom = intraSite(p)
        ? const {'DISPATCHED', 'IN_TRANSIT'}
        : const {'AT_GATE'};
    if (!okFrom.contains(status)) {
      throw invalidTransition(
        intraSite(p)
            ? 'The parcel has not been handed over yet'
            : 'The parcel must be received at the gate first',
      );
    }
    if (p['tamperStatus'] == 'FLAGGED') {
      throw policyViolation(
        'TAMPER_FLAGGED',
        'A flagged parcel cannot be delivered',
      );
    }
    if (_siteOf(auth) != p['destSiteId'] && !_can(auth, 'parcels:manage')) {
      throw forbidden('Only the destination mailroom can do this');
    }
    p['status'] = 'OUT_FOR_DELIVERY';
    _event(
      store,
      p,
      'OUT_FOR_DELIVERY',
      _me(auth),
      location: _siteName(p.str('destSiteId')),
    );
    _issueOtp(store, p);
  }

  /// Sends a fresh delivery code to the recipient (stand-in for the SMS).
  static void _issueOtp(MockStore store, Json p) {
    final otp = _newOtp();
    final now = store.nowMs();
    p
      ..['otpHash'] = _otpHash(p.str('id'), 'DELIVERY', otp)
      ..['otpExpiresAt'] = DateTime.fromMillisecondsSinceEpoch(
        now + ParcelPolicy.otpTtlHours * 3600000,
        isUtc: true,
      ).toIso8601String()
      ..['otpAttempts'] = 0
      ..['otpIssuedAt'] = [...(p['otpIssuedAt']! as List), now];
    store.put(Col.parcels, p);
    _notify(
      store,
      p.str('recipientUserId'),
      p,
      'PARCEL_OUT_FOR_DELIVERY',
      const Bi(
        'Your parcel is out for delivery',
        'আপনার পার্সেল বিতরণের জন্য বের হয়েছে',
      ),
      Bi(
        'Give code $otp to the courier to receive ${p['trackingNo']}. '
            'Or tap Receive in the app.',
        '${p['trackingNo']} গ্রহণ করতে কুরিয়ারকে $otp কোডটি দিন। '
            'অথবা অ্যাপে গ্রহণ চাপুন।',
      ),
      priority: 'HIGH',
    );
  }

  static void resendOtp(MockStore store, AuthContext auth, Json p) {
    final status = p.str('status');
    if (status != 'OUT_FOR_DELIVERY' && status != 'RETURN_IN_TRANSIT') {
      throw invalidTransition('There is no code to send right now');
    }
    final me = _me(auth);
    if (me != p['recipientUserId'] &&
        me != p['senderUserId'] &&
        !_can(auth, 'parcels:manage')) {
      throw forbidden();
    }
    final hourAgo = store.nowMs() - 3600000;
    final recent = (p['otpIssuedAt']! as List)
        .where((t) => (t as num) > hourAgo)
        .length;
    if (recent >= ParcelPolicy.resendPerHour) {
      throw policyViolation(
        'OTP_RATE_LIMIT',
        'Too many codes were sent. Try again in an hour.',
      );
    }
    if (status == 'OUT_FOR_DELIVERY') {
      _issueOtp(store, p);
    } else {
      _issueReturnOtp(store, p);
    }
    _event(store, p, 'NOTE', me, note: 'Code sent again');
  }

  static void _checkOtp(
    MockStore store,
    Json p, {
    required String purpose,
    required String field,
    required Object? given,
  }) {
    final hash = p.strOrNull(field);
    if (hash == null) {
      throw invalidTransition('No code is active. Ask for a new one.');
    }
    final exp = p.strOrNull('otpExpiresAt');
    if (exp != null &&
        DateTime.parse(exp).millisecondsSinceEpoch < store.nowMs()) {
      throw policyViolation(
        'OTP_EXPIRED',
        'The code has expired. Ask for a new one.',
      );
    }
    final attempts = (p['otpAttempts'] as num?)?.toInt() ?? 0;
    if (attempts >= ParcelPolicy.maxOtpAttempts) {
      throw policyViolation(
        'OTP_LOCKED',
        'Too many wrong codes. Ask for a new one.',
      );
    }
    if (given is! String ||
        !Hash.constantTimeEquals(_otpHash(p.str('id'), purpose, given), hash)) {
      p['otpAttempts'] = attempts + 1;
      store.put(Col.parcels, p);
      throw policyViolation(
        'OTP_INVALID',
        'The code is not correct. ${ParcelPolicy.maxOtpAttempts - attempts - 1} tries left.',
      );
    }
  }

  static void _deliver(
    MockStore store,
    Json p,
    String actor,
    String method, {
    String? receivedBy,
    String? photoFileId,
  }) {
    p
      ..['status'] = 'DELIVERED'
      ..['deliveredAt'] = _stamp(store)
      ..['deliveredMethod'] = method
      ..['otpHash'] = null;
    _event(
      store,
      p,
      'DELIVERED',
      actor,
      location: _siteName(p.str('destSiteId')),
      note: receivedBy == null ? null : 'Received by $receivedBy',
      photoFileId: photoFileId,
      metadata: {'method': method},
    );
    _notify(
      store,
      p.str('senderUserId'),
      p,
      'PARCEL_DELIVERED',
      const Bi('Your parcel was delivered', 'আপনার পার্সেল পৌঁছে গেছে'),
      Bi(
        '${p['trackingNo']} was received.',
        '${p['trackingNo']} গ্রহণ করা হয়েছে।',
      ),
    );
  }

  /// Courier or mailroom types the code the recipient gives them.
  static void verifyOtp(MockStore store, AuthContext auth, Json p, Json body) {
    if (p['status'] == 'RETURN_IN_TRANSIT') {
      _verifyReturn(store, auth, p, body);
      return;
    }
    if (p['status'] != 'OUT_FOR_DELIVERY') {
      throw invalidTransition('This parcel is not out for delivery');
    }
    final value = (p['declaredValue'] as num?) ?? 0;
    final photo = _photoId(store, body);
    if (value >= ParcelPolicy.photoRequiredAbove && photo == null) {
      throw policyViolation(
        'PHOTO_REQUIRED',
        'Take a photo of the handover for a parcel of this value',
      );
    }
    _checkOtp(
      store,
      p,
      purpose: 'DELIVERY',
      field: 'otpHash',
      given: body['otp'],
    );
    _event(store, p, 'OTP_VERIFIED', _me(auth), metadata: {'method': 'OTP'});
    _deliver(
      store,
      p,
      _me(auth),
      'OTP',
      receivedBy: _text(body, 'receivedByName', 2, 120),
      photoFileId: photo,
    );
  }

  /// BR-04-03: the recipient (or, on a return, the sender) accepts in the app.
  static void accept(MockStore store, AuthContext auth, Json p) {
    final me = _me(auth);
    if (p['status'] == 'OUT_FOR_DELIVERY' && p['recipientUserId'] == me) {
      _event(store, p, 'OTP_VERIFIED', me, metadata: {'method': 'IN_APP'});
      _deliver(store, p, me, 'IN_APP');
    } else if (p['status'] == 'RETURN_IN_TRANSIT' && p['senderUserId'] == me) {
      _returned(store, p, me, 'IN_APP');
    } else {
      throw forbidden('Only the person receiving it can accept it');
    }
  }

  // ---- Problems and returns ----

  static void flag(MockStore store, AuthContext auth, Json p, Json body) {
    if (ParcelPolicy.terminal.contains(p['status']) ||
        p['status'] == 'CREATED' ||
        p['status'] == 'QUARANTINED' ||
        p.str('status').startsWith('RETURN')) {
      throw invalidTransition('A problem cannot be reported at this stage');
    }
    final reason = body['reason'];
    if (reason != 'TAMPER_BROKEN' && reason != 'DAMAGED_CONTENTS') {
      throw validationError('reason', 'Choose what is wrong');
    }
    final note = _text(body, 'note', 10, 500);
    if (note == null || note.length < 10) {
      throw validationError(
        'note',
        'Describe the problem in at least 10 characters',
      );
    }
    final photo = _photoId(store, body);
    if (photo == null) {
      throw validationError(
        'photoFileId',
        'A photo of the problem is required',
      );
    }
    p
      ..['status'] = 'QUARANTINED'
      ..['tamperStatus'] = 'FLAGGED';
    _event(
      store,
      p,
      'TAMPER_FLAGGED',
      _me(auth),
      location: body['asGateIn'] == true
          ? _siteName(p.str('destSiteId'))
          : null,
      note: note,
      photoFileId: photo,
      metadata: {'reason': reason},
    );
    final t = Bi(
      'Problem reported on ${p['trackingNo']}',
      '${p['trackingNo']}-এ সমস্যা জানানো হয়েছে',
    );
    final b = Bi(note, note);
    for (final u in {p.str('senderUserId'), p.str('recipientUserId')}) {
      _notify(store, u, p, 'PARCEL_TAMPER_FLAGGED', t, b, priority: 'HIGH');
    }
    for (final r in ['MAILROOM', 'SECURITY_GATE']) {
      NotificationEngine.notifyRole(
        store,
        role: r,
        type: 'PARCEL_TAMPER_FLAGGED',
        title: t,
        body: b,
        priority: 'HIGH',
        data: _data(p),
      );
    }
  }

  static void startReturn(
    MockStore store,
    AuthContext auth,
    Json p,
    Json body,
  ) {
    final status = p.str('status');
    final isRecipient = p['recipientUserId'] == _me(auth);
    if (!const {
      'QUARANTINED',
      'OUT_FOR_DELIVERY',
      'DAMAGED',
      'AT_GATE',
    }.contains(status)) {
      throw invalidTransition('This parcel cannot be sent back right now');
    }
    if (!_can(auth, 'parcels:return') &&
        !(isRecipient && status == 'OUT_FOR_DELIVERY')) {
      throw forbidden();
    }
    final reason = body['reason'];
    if (reason is! String || !ParcelPolicy.returnReasons.contains(reason)) {
      throw validationError('reason', 'Choose why it is sent back');
    }
    final n =
        store.all(Col.parcels).where((x) => x['return'] != null).length + 1;
    p
      ..['status'] = 'RETURN_INITIATED'
      ..['otpHash'] = null
      ..['return'] = {
        'returnNo': 'RTO-${_year(store)}-${n.toString().padLeft(4, '0')}',
        'reason': reason,
        'details': _text(body, 'details', 1, 500),
        'initiatedAt': _stamp(store),
        'initiatedBy': _me(auth),
        'returnedAt': null,
      };
    _event(
      store,
      p,
      'RETURN_INITIATED',
      _me(auth),
      note: _text(body, 'details', 1, 500),
      metadata: {'reason': reason},
    );
    _issueReturnOtp(store, p);
  }

  static void _issueReturnOtp(MockStore store, Json p) {
    final otp = _newOtp();
    final now = store.nowMs();
    p
      ..['returnOtpHash'] = _otpHash(p.str('id'), 'RETURN', otp)
      ..['otpExpiresAt'] = DateTime.fromMillisecondsSinceEpoch(
        now + ParcelPolicy.otpTtlHours * 3600000,
        isUtc: true,
      ).toIso8601String()
      ..['otpAttempts'] = 0
      ..['otpIssuedAt'] = [...(p['otpIssuedAt']! as List), now];
    store.put(Col.parcels, p);
    _notify(
      store,
      p.str('senderUserId'),
      p,
      'PARCEL_RETURN_INITIATED',
      Bi(
        '${p['trackingNo']} is coming back to you',
        '${p['trackingNo']} আপনার কাছে ফেরত আসছে',
      ),
      Bi(
        'Give code $otp to the courier when it arrives, or tap Receive in the app.',
        'পৌঁছালে কুরিয়ারকে $otp কোডটি দিন, অথবা অ্যাপে গ্রহণ চাপুন।',
      ),
      priority: 'HIGH',
    );
  }

  static void _verifyReturn(
    MockStore store,
    AuthContext auth,
    Json p,
    Json body,
  ) {
    _checkOtp(
      store,
      p,
      purpose: 'RETURN',
      field: 'returnOtpHash',
      given: body['otp'],
    );
    _returned(store, p, _me(auth), 'OTP');
  }

  static void _returned(MockStore store, Json p, String actor, String method) {
    final r = Map<String, Object?>.from(p['return']! as Map)
      ..['returnedAt'] = _stamp(store);
    p
      ..['status'] = 'RETURNED'
      ..['return'] = r
      ..['returnOtpHash'] = null;
    _event(store, p, 'RETURNED', actor, metadata: {'method': method});
    _notify(
      store,
      p.str('recipientUserId'),
      p,
      'PARCEL_RETURN_INITIATED',
      Bi('${p['trackingNo']} went back', '${p['trackingNo']} ফেরত গেছে'),
      const Bi(
        'The sender has received the parcel back.',
        'প্রেরক পার্সেলটি ফেরত পেয়েছেন।',
      ),
    );
  }

  static void exception(MockStore store, AuthContext auth, Json p, Json body) {
    final status = p.str('status');
    if (ParcelPolicy.terminal.contains(status) ||
        status == 'CREATED' ||
        status == 'DAMAGED') {
      throw invalidTransition(
        'This parcel cannot be marked lost or damaged now',
      );
    }
    final kind = body['status'];
    if (kind != 'LOST' && kind != 'DAMAGED') {
      throw validationError('status', 'Choose lost or damaged');
    }
    final note = _text(body, 'note', 20, 500);
    if (note == null) {
      throw validationError(
        'note',
        'Explain what happened (20 characters or more)',
      );
    }
    if (kind == 'LOST' && dwellHours(store, p) < ParcelPolicy.lostAfterHours) {
      throw policyViolation(
        'LOST_TOO_EARLY',
        'A parcel can be marked lost only after ${ParcelPolicy.lostAfterHours} hours without news',
      );
    }
    final photo = _photoId(store, body);
    if (kind == 'DAMAGED' && photo == null) {
      throw validationError('photoFileId', 'A photo of the damage is required');
    }
    p['status'] = kind;
    _event(
      store,
      p,
      'EXCEPTION',
      _me(auth),
      note: note,
      photoFileId: photo,
      metadata: {'kind': kind},
    );
    final t = Bi(
      '${p['trackingNo']} marked ${(kind! as String).toLowerCase()}',
      '${p['trackingNo']} ${kind == 'LOST' ? 'হারিয়ে গেছে' : 'ক্ষতিগ্রস্ত'} হিসেবে চিহ্নিত',
    );
    final b = Bi(note, note);
    for (final u in {p.str('senderUserId'), p.str('recipientUserId')}) {
      _notify(store, u, p, 'PARCEL_EXCEPTION', t, b, priority: 'CRITICAL');
    }
    NotificationEngine.notifyRole(
      store,
      role: 'TRANSPORT_ADMIN',
      type: 'PARCEL_EXCEPTION',
      title: t,
      body: b,
      priority: 'CRITICAL',
      data: _data(p),
    );
  }

  static void addNote(MockStore store, AuthContext auth, Json p, Json body) {
    final note = _text(body, 'note', 1, 1000);
    if (note == null) throw validationError('note', 'Write the note');
    _event(store, p, 'NOTE', _me(auth), note: note);
  }

  // ---- Dwell alerts (BR-04-07), checked lazily on reads ----

  static void tick(MockStore store) {
    for (final p in store.all(Col.parcels)) {
      if (p['dwellAlerted'] == true || !isStuck(store, p)) continue;
      p['dwellAlerted'] = true;
      store.put(Col.parcels, p);
      final t = Bi(
        '${p['trackingNo']} has not moved',
        '${p['trackingNo']} নড়েনি',
      );
      final b = Bi(
        'No update for ${dwellHours(store, p)} hours.',
        '${dwellHours(store, p)} ঘণ্টা কোনো আপডেট নেই।',
      );
      _notify(store, p.str('senderUserId'), p, 'PARCEL_DWELL_EXCEEDED', t, b);
      NotificationEngine.notifyRole(
        store,
        role: 'MAILROOM',
        type: 'PARCEL_DWELL_EXCEEDED',
        title: t,
        body: b,
        data: _data(p),
      );
    }
  }

  // ---- Notifications ----

  static Json _data(Json p) => {
    'module': 'parcels',
    'route': '/home/parcels/${p['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json p,
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
    data: _data(p),
  );

  // ---- Wire ----

  static bool _sees(MockStore store, AuthContext a, Json p) {
    final me = _me(a);
    return p['senderUserId'] == me ||
        p['recipientUserId'] == me ||
        p['courierUserId'] == me ||
        _can(a, 'parcels:manage');
  }

  static Json wire(
    MockStore store,
    AuthContext a,
    Json p, {
    bool detail = false,
  }) {
    final me = _me(a);
    final status = p.str('status');
    final isSender = p['senderUserId'] == me;
    final isRecipient = p['recipientUserId'] == me;
    final isCourier = p['courierUserId'] == me;
    final fullView = _sees(store, a, p);
    final hidden = p['isConfidential'] == true && !fullView;
    final mySite = _siteOf(a);
    final manage = _can(a, 'parcels:manage');
    final atDest = mySite == p['destSiteId'] || manage;
    final onRoad = status == 'DISPATCHED' || status == 'IN_TRANSIT';
    final returning =
        status == 'RETURN_INITIATED' || status == 'RETURN_IN_TRANSIT';
    final canScan = _can(a, 'parcels:scan');
    final canOut =
        canScan && atDest && (intraSite(p) ? onRoad : status == 'AT_GATE');
    final out = <String, Object?>{
      'id': p['id'],
      'trackingNo': p['trackingNo'],
      'waybillNo': p['waybillNo'],
      'category': p['category'],
      'urgency': p['urgency'],
      'status': status,
      'tamperStatus': p['tamperStatus'],
      'description': hidden ? null : p['description'],
      'declaredValue': hidden ? null : p['declaredValue'],
      'isConfidential': p['isConfidential'],
      'hidden': hidden,
      'sender': WorkflowEngine.personRef(store, p.str('senderUserId')),
      'recipient': WorkflowEngine.personRef(store, p.str('recipientUserId')),
      'courier': WorkflowEngine.personRef(store, p.strOrNull('courierUserId')),
      'origin': {
        'id': p['originSiteId'],
        'name': _siteName(p.str('originSiteId')),
        'nameBn': _siteNameBn(p.str('originSiteId')),
      },
      'dest': {
        'id': p['destSiteId'],
        'name': _siteName(p.str('destSiteId')),
        'nameBn': _siteNameBn(p.str('destSiteId')),
      },
      'intraSite': intraSite(p),
      'sealNo': p['sealNo'],
      'specialHandling': p['specialHandling'],
      'weightKg': p['weightKg'],
      'dwellHours': dwellHours(store, p),
      'stuck': isStuck(store, p),
      'deliveredAt': p['deliveredAt'],
      'deliveredMethod': p['deliveredMethod'],
      'lastEventAt': p['lastEventAt'],
      'createdAt': p['createdAt'],
      'me': {
        'isSender': isSender,
        'isRecipient': isRecipient,
        'isCourier': isCourier,
        'canEdit': status == 'CREATED' && (isSender || manage),
        'canCancel': status == 'CREATED' && (isSender || manage),
        'canDispatch': status == 'CREATED' && _can(a, 'parcels:dispatch'),
        'canCheckpoint':
            (onRoad || returning) && canScan && (isCourier || manage),
        'canGateIn': onRoad && !intraSite(p) && canScan && atDest,
        'canOutForDelivery': canOut,
        'canVerifyOtp':
            (status == 'OUT_FOR_DELIVERY' || status == 'RETURN_IN_TRANSIT') &&
            _can(a, 'parcels:deliver'),
        'canAccept':
            (status == 'OUT_FOR_DELIVERY' && isRecipient) ||
            (status == 'RETURN_IN_TRANSIT' && isSender),
        'canResendOtp':
            (status == 'OUT_FOR_DELIVERY' || status == 'RETURN_IN_TRANSIT') &&
            (isSender || isRecipient || manage),
        'canFlag':
            canScan &&
            !ParcelPolicy.terminal.contains(status) &&
            status != 'CREATED' &&
            status != 'QUARANTINED' &&
            !returning &&
            status != 'DAMAGED' &&
            (isCourier || manage || atDest),
        'canReturn':
            (const {'QUARANTINED', 'DAMAGED', 'AT_GATE'}.contains(status) &&
                _can(a, 'parcels:return')) ||
            (status == 'OUT_FOR_DELIVERY' &&
                (isRecipient || _can(a, 'parcels:return'))),
        'canException':
            manage &&
            !ParcelPolicy.terminal.contains(status) &&
            status != 'CREATED' &&
            status != 'DAMAGED',
        'canNote': fullView && !ParcelPolicy.terminal.contains(status),
        'photoRequiredForDelivery':
            ((p['declaredValue'] as num?) ?? 0) >=
            ParcelPolicy.photoRequiredAbove,
        'sealRequired':
            p['isConfidential'] == true ||
            ((p['declaredValue'] as num?) ?? 0) >=
                ParcelPolicy.sealRequiredAbove,
      },
    };
    if (detail) {
      out
        ..['return'] = p['return']
        ..['events'] = [
          for (final e in p.objList('events'))
            {
              ...e,
              'actor': WorkflowEngine.personRef(
                store,
                e.strOrNull('actorUserId'),
              ),
            },
        ]
        ..['chainValid'] = chainValid(p);
    }
    return out;
  }

  static String _siteNameBn(String id) =>
      sites.firstWhere(
            (s) => s['id'] == id,
            orElse: () => {'nameBn': id},
          )['nameBn']!
          as String;

  /// Which parcels a user may see in lists (doc 03 §10.2 scope column).
  static bool visibleTo(MockStore store, AuthContext a, Json p) {
    if (_sees(store, a, p)) return true;
    if (!_can(a, 'parcels:read')) return false;
    final g = a.grants.firstWhere((g) => g['key'] == 'parcels:read');
    final scope = g['scope'];
    if (scope == 'COMPANY') return true;
    if (scope == 'SITE') {
      final s = _siteOf(a);
      return p['originSiteId'] == s || p['destSiteId'] == s;
    }
    return false;
  }
}
