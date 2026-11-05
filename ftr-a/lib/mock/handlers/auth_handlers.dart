import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:uuid/uuid.dart';

const Uuid _uuid = Uuid();
const int accessTtlSeconds = 15 * 60;
const int _refreshTtlMs = 30 * 24 * 60 * 60 * 1000;
const int _maxFailed = 5;
const int _lockMs = 15 * 60 * 1000;
const int _dayMs = 24 * 60 * 60 * 1000;

String _newAccessToken() => 'mat_${_uuid.v4().replaceAll('-', '')}';
String _newRefreshToken() =>
    'mrt_${_uuid.v4().replaceAll('-', '')}${_uuid.v4().replaceAll('-', '')}';

HttpError _invalidCredentials() =>
    unauthenticated('Invalid credentials', reason: 'INVALID_CREDENTIALS');

Json? _findUser(MockStore store, String identifier) {
  final id = identifier.trim().toLowerCase();
  final phone = normalisePhone(id);
  for (final u in store.all(Col.users)) {
    if (u.str('email').toLowerCase() == id || u.str('phone') == phone) {
      return u;
    }
    final emp = store.get(Col.employees, u.str('employeeId'));
    if (emp != null && emp.str('empCode').toLowerCase() == id) return u;
  }
  return null;
}

/// Looks up the session for a bearer access token (hash compare).
Json? sessionForAccessToken(MockStore store, String token) {
  final hash = Hash.sha256Hex(token);
  for (final s in store.all(Col.sessions)) {
    if (Hash.constantTimeEquals(s.str('accessTokenHash'), hash)) return s;
  }
  return null;
}

Json _tokenResponse(Json session, Json user, String access, String refresh) => {
  'accessToken': access,
  'expiresIn': accessTtlSeconds,
  'tokenType': 'Bearer',
  'refreshToken': refresh,
  'refreshExpiresAt': session['refreshExpiresAt'],
  'user': {
    'id': user['id'],
    'email': user['email'],
    'roles': user['roles'],
    'preferredLang': user['preferredLang'],
    'mfaEnabled': user['mfaEnabled'],
  },
  'mustChangePassword': false,
};

/// Opens a session and returns the doc 03 login body. Shared with the demo
/// persona switch.
Json openSession(MockStore store, Json user, Json device) {
  final access = _newAccessToken();
  final refresh = _newRefreshToken();
  final now = store.nowMs();
  final session = <String, Object?>{
    'id': 'ses_${_uuid.v4()}',
    'userId': user['id'],
    'deviceId': device['id'],
    'deviceName': device['name'],
    'platform': device['platform'],
    'refreshTokenHash': Hash.sha256Hex(refresh),
    'accessTokenHash': Hash.sha256Hex(access),
    'accessExpiresAtMs': now + accessTtlSeconds * 1000,
    'refreshExpiresAt': DateTime.fromMillisecondsSinceEpoch(
      now + _refreshTtlMs,
      isUtc: true,
    ).toIso8601String(),
    'createdAt': store.nowIso(),
    'lastSeenAt': store.nowIso(),
    'revokedAt': null,
  };
  // One live session per device: signing in again replaces the old one.
  for (final s in store.all(Col.sessions)) {
    if (s['userId'] == user['id'] &&
        s['deviceId'] == device['id'] &&
        s['revokedAt'] == null) {
      s['revokedAt'] = store.nowIso();
      store.touch(Col.sessions, s);
    }
  }
  // Drop sessions revoked more than a day ago.
  for (final s in store.all(Col.sessions)) {
    final revoked = s.strOrNull('revokedAt');
    if (revoked != null &&
        now - DateTime.parse(revoked).millisecondsSinceEpoch > _dayMs) {
      store.remove(Col.sessions, s.str('id'));
    }
  }
  store.put(Col.sessions, session);
  AuditEngine.log(
    store,
    action: 'LOGIN_SUCCESS',
    entityType: 'User',
    actorUserId: user.str('id'),
    entityId: user.str('id'),
    after: {'platform': device['platform']},
  );
  user['lastLoginAt'] = store.nowIso();
  user['failedAttempts'] = 0;
  user['lockedUntil'] = null;
  store.touch(Col.users, user);
  return _tokenResponse(session, user, access, refresh);
}

Json _parseDevice(Object? raw) {
  if (raw is! Map) {
    throw validationError('device', 'Device information is required');
  }
  final d = Map<String, Object?>.from(raw);
  final id = d['id'];
  if (id is! String || id.isEmpty || id.length > 100) {
    throw validationError('device.id', 'Device id is required');
  }
  final platform = d['platform'] == 'IOS' ? 'IOS' : 'ANDROID';
  final name = d['name'];
  return {
    'id': id,
    'name': name is String && name.isNotEmpty && name.length <= 120
        ? name
        : 'Mobile device',
    'platform': platform,
  };
}

List<RouteDef> authRoutes() => [
  RouteDef('POST', '/auth/login', auth: false, (ctx) async {
    final body = ctx.bodyObject();
    final identifier = (body['identifier'] as String?)?.trim() ?? '';
    final password = body['password'];
    if (identifier.length < 3 ||
        identifier.length > 120 ||
        password is! String ||
        password.isEmpty ||
        password.length > 128) {
      throw validationError(
        'identifier',
        'Enter your email, phone or employee ID and password',
      );
    }
    final device = _parseDevice(body['device']);
    final user = _findUser(ctx.store, identifier);
    // Always hash so timing does not reveal whether the identifier exists.
    final digest = Hash.sha256Hex(password);
    if (user == null) throw _invalidCredentials();

    final now = ctx.store.nowMs();
    final lockedUntil = user.strOrNull('lockedUntil');
    if (lockedUntil != null &&
        DateTime.parse(lockedUntil).millisecondsSinceEpoch > now) {
      throw unauthenticated(
        'Account temporarily locked',
        reason: 'ACCOUNT_LOCKED',
        extra: {'lockedUntil': lockedUntil},
      );
    }
    if (!user.boolVal('isActive')) {
      throw unauthenticated('Account disabled', reason: 'ACCOUNT_DISABLED');
    }
    if (!Hash.constantTimeEquals(digest, user.str('passwordDigest'))) {
      final failed = user.intVal('failedAttempts') + 1;
      if (failed >= _maxFailed) {
        user['lockedUntil'] = DateTime.fromMillisecondsSinceEpoch(
          now + _lockMs,
          isUtc: true,
        ).toIso8601String();
        user['failedAttempts'] = 0;
      } else {
        user['failedAttempts'] = failed;
      }
      ctx.store.touch(Col.users, user);
      AuditEngine.log(
        ctx.store,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        actorUserId: user.str('id'),
        entityId: user.str('id'),
        requestId: ctx.req.headers['x-request-id'],
      );
      await ctx.store.commit();
      throw _invalidCredentials();
    }
    final response = openSession(ctx.store, user, device);
    await ctx.store.commit();
    return ok(response);
  }),
  RouteDef('POST', '/auth/refresh', auth: false, (ctx) async {
    final token = ctx.bodyObject()['refreshToken'];
    HttpError invalid(String reason) =>
        unauthenticated('Refresh token invalid', reason: reason);
    if (token is! String || token.length < 10 || token.length > 200) {
      throw invalid('REFRESH_INVALID');
    }
    final hash = Hash.sha256Hex(token);
    Json? session;
    for (final s in ctx.store.all(Col.sessions)) {
      if (Hash.constantTimeEquals(s.str('refreshTokenHash'), hash)) {
        session = s;
        break;
      }
    }
    if (session == null) throw invalid('REFRESH_INVALID');
    if (session['revokedAt'] != null) {
      throw unauthenticated('Session revoked', reason: 'SESSION_REVOKED');
    }
    if (DateTime.parse(session.str('refreshExpiresAt')).millisecondsSinceEpoch <
        ctx.store.nowMs()) {
      throw unauthenticated('Session expired', reason: 'SESSION_EXPIRED');
    }
    final user = ctx.store.get(Col.users, session.str('userId'));
    if (user == null || !user.boolVal('isActive')) {
      throw unauthenticated('Account disabled', reason: 'ACCOUNT_DISABLED');
    }
    final access = _newAccessToken();
    final refresh = _newRefreshToken();
    session['refreshTokenHash'] = Hash.sha256Hex(refresh);
    session['accessTokenHash'] = Hash.sha256Hex(access);
    session['accessExpiresAtMs'] = ctx.store.nowMs() + accessTtlSeconds * 1000;
    session['lastSeenAt'] = ctx.store.nowIso();
    ctx.store.touch(Col.sessions, session);
    await ctx.store.commit();
    return ok(_tokenResponse(session, user, access, refresh));
  }),
  RouteDef('POST', '/auth/logout', (ctx) async {
    final a = ctx.requireAuth();
    a.session['revokedAt'] = ctx.store.nowIso();
    ctx.store.touch(Col.sessions, a.session);
    AuditEngine.log(
      ctx.store,
      action: 'LOGOUT',
      entityType: 'User',
      actorUserId: a.user.str('id'),
      entityId: a.user.str('id'),
    );
    await ctx.store.commit();
    return noContent();
  }),
  RouteDef('POST', '/auth/logout-all', (ctx) async {
    final a = ctx.requireAuth();
    final keepCurrent = ctx.query['keepCurrent'] == 'true';
    for (final s in ctx.store.all(Col.sessions)) {
      if (s['userId'] == a.user['id'] &&
          s['revokedAt'] == null &&
          !(keepCurrent && s['id'] == a.session['id'])) {
        s['revokedAt'] = ctx.store.nowIso();
        ctx.store.touch(Col.sessions, s);
      }
    }
    await ctx.store.commit();
    return noContent();
  }),
  RouteDef('GET', '/auth/sessions', (ctx) async {
    final a = ctx.requireAuth();
    final mine =
        ctx.store
            .all(Col.sessions)
            .where((s) => s['userId'] == a.user['id'] && s['revokedAt'] == null)
            .toList()
          ..sort((x, y) => y.str('lastSeenAt').compareTo(x.str('lastSeenAt')));
    return ok([
      for (final s in mine)
        {
          'id': s['id'],
          'platform': s['platform'],
          'deviceName': s['deviceName'],
          'ip': null,
          'lastSeenAt': s['lastSeenAt'],
          'createdAt': s['createdAt'],
          'isCurrent': s['id'] == a.session['id'],
        },
    ]);
  }),
  RouteDef('DELETE', '/auth/sessions/:id', (ctx) async {
    final a = ctx.requireAuth();
    final target = ctx.store.get(Col.sessions, ctx.params['id']!);
    if (target == null || target['userId'] != a.user['id']) {
      throw notFound('Session');
    }
    target['revokedAt'] = ctx.store.nowIso();
    ctx.store.touch(Col.sessions, target);
    await ctx.store.commit();
    return noContent();
  }),
  RouteDef('POST', '/auth/devices', (ctx) async {
    ctx.requireAuth();
    return noContent();
  }),
  RouteDef('POST', '/auth/unlock', (ctx) async {
    final a = ctx.requireAuth();
    final password = ctx.bodyObject()['password'];
    if (password is! String || password.isEmpty || password.length > 128) {
      throw validationError('password', 'Enter your password');
    }
    final digest = Hash.sha256Hex(password);
    final session = a.session;
    if (!Hash.constantTimeEquals(digest, a.user.str('passwordDigest'))) {
      final failed = (session['unlockFailures'] as num?)?.toInt() ?? 0;
      final next = failed + 1;
      session['unlockFailures'] = next;
      if (next >= 5) {
        session['revokedAt'] = ctx.store.nowIso();
        ctx.store.touch(Col.sessions, session);
        await ctx.store.commit();
        throw unauthenticated(
          'Too many unlock attempts',
          reason: 'UNLOCK_LOCKED_OUT',
        );
      }
      ctx.store.touch(Col.sessions, session);
      await ctx.store.commit();
      throw unauthenticated(
        'Password is incorrect',
        reason: 'UNLOCK_FAILED',
        extra: {'attemptsLeft': 5 - next},
      );
    }
    session['unlockFailures'] = 0;
    ctx.store.touch(Col.sessions, session);
    await ctx.store.commit();
    return ok({'ok': true});
  }),
];

/// `details[0].reason` the client uses to trigger a token refresh.
const tokenExpiredReason = 'TOKEN_EXPIRED';
