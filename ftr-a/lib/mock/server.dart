import 'dart:async';
import 'dart:math';

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:bogcl_oneops/mock/handlers/attendance_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/audit_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/auth_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/bus_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/claim_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/demo_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/file_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/leave_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/me_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/notice_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/notification_handlers.dart';
import 'package:bogcl_oneops/mock/handlers/workflow_handlers.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:uuid/uuid.dart';

/// Failure that never reaches a handler (no response at all).
enum MockTransportFailure { offline, timeout }

class MockTransportError implements Exception {
  const MockTransportError(this.kind);

  final MockTransportFailure kind;
}

class _IdempotentEntry {
  const _IdempotentEntry(this.fingerprint, this.response, this.atMs);

  final String fingerprint;
  final MockResponse response;
  final int atMs;
}

/// In-app API server (doc 03). The only thing the Dio mock adapter talks to.
///
/// Flow: latency/failure injection -> route match -> auth -> permission ->
/// idempotency -> handler -> doc 03 envelope.
class MockServer {
  MockServer({
    required this.store,
    required this.config,
    required this.blobs,
    MockRouter? router,
    Random? random,
  }) : router = router ?? MockRouter(),
       _random = random ?? Random() {
    this.router.register([
      ...authRoutes(),
      ...meRoutes(),
      ...demoRoutes(),
      ...notificationRoutes(),
      ...auditRoutes(),
      ...workflowRoutes(),
      ...fileRoutes(),
      ...leaveRoutes(),
      ...attendanceRoutes(),
      ...noticeRoutes(),
      ...claimRoutes(),
      ...busRoutes(),
    ]);
  }

  final MockStore store;
  final BlobStore blobs;
  final MockRouter router;
  final MockConfig Function() config;
  final Random _random;
  final Map<String, _IdempotentEntry> _idempotency = {};
  static const int _idempotencyTtlMs = 24 * 60 * 60 * 1000;
  static const Uuid _uuid = Uuid();

  Future<void> _latency(MockConfig c) {
    final span = max(0, c.maxLatencyMs - c.minLatencyMs);
    final ms = c.minLatencyMs + (span == 0 ? 0 : _random.nextInt(span + 1));
    return ms == 0
        ? Future.value()
        : Future<void>.delayed(Duration(milliseconds: ms));
  }

  /// Resolves the caller from the bearer token, or null when absent.
  AuthContext? _resolveAuth(MockRequest req) {
    final header = req.headers['authorization'];
    if (header == null || !header.startsWith('Bearer ')) return null;
    final session = sessionForAccessToken(store, header.substring(7));
    if (session == null || session['revokedAt'] != null) {
      throw unauthenticated(
        'Session is no longer valid',
        reason: 'SESSION_REVOKED',
      );
    }
    if (session.intVal('accessExpiresAtMs') < store.nowMs()) {
      throw unauthenticated('Access token expired', reason: tokenExpiredReason);
    }
    final user = store.get(Col.users, session.str('userId'));
    final employee = user == null
        ? null
        : store.get(Col.employees, user.str('employeeId'));
    if (user == null || employee == null || !user.boolVal('isActive')) {
      throw unauthenticated('Account disabled', reason: 'ACCOUNT_DISABLED');
    }
    session['lastSeenAt'] = store.nowIso();
    return AuthContext(
      user: user,
      employee: employee,
      session: session,
      grants: grantsForRoles(user.strList('roles')),
    );
  }

  /// Runs one request. Throws [MockTransportError] for offline/timeout.
  Future<MockResponse> handle(MockRequest req) async {
    final cfg = config();
    final requestId = _uuid.v4();

    if (cfg.offline) {
      await Future<void>.delayed(const Duration(milliseconds: 120));
      throw const MockTransportError(MockTransportFailure.offline);
    }
    await _latency(cfg);

    try {
      if (cfg.failure == MockFailureMode.timeout) {
        throw const MockTransportError(MockTransportFailure.timeout);
      }
      if (cfg.failure == MockFailureMode.serverError &&
          !req.path.startsWith('/auth/')) {
        throw HttpError(ApiErrorCode.internal, 'Something went wrong');
      }
      if (cfg.failure == MockFailureMode.conflict &&
          req.method != 'GET' &&
          !req.path.startsWith('/auth/')) {
        throw HttpError(
          ApiErrorCode.conflict,
          'The record was changed by someone else',
        );
      }

      final found = router.match(req.method, req.path);
      if (found == null) throw routeNotFound(req.method, req.path);
      final route = found.route;

      AuthContext? auth;
      if (route.auth) {
        auth = _resolveAuth(req);
        if (auth == null) throw unauthenticated('Authentication required');
      }
      if (route.permission.isNotEmpty && auth != null) {
        final held = auth.grants.map((g) => g['key']).toSet();
        if (!route.permission.any(held.contains)) throw forbidden();
      }

      final idemKey = req.method == 'POST'
          ? req.headers['idempotency-key']
          : null;
      var fingerprint = '';
      if (idemKey != null) {
        fingerprint = Hash.sha256Hex(
          '${auth?.user['id'] ?? 'anon'}:${req.method}:${req.path}:'
          '${Hash.canonicalJson(req.body)}',
        );
        final prior = _idempotency[idemKey];
        if (prior != null && store.nowMs() - prior.atMs < _idempotencyTtlMs) {
          if (prior.fingerprint != fingerprint) {
            throw HttpError(
              ApiErrorCode.conflict,
              'Idempotency-Key reused with a different request',
              details: const [
                {'reason': 'IDEMPOTENCY_PAYLOAD_MISMATCH'},
              ],
            );
          }
          return prior.response;
        }
      }

      final response = await route.handler(
        HandlerContext(
          req: req,
          params: found.params,
          store: store,
          auth: auth,
          blobs: blobs,
        ),
      );
      if (idemKey != null && response.status < 500) {
        _idempotency[idemKey] = _IdempotentEntry(
          fingerprint,
          response,
          store.nowMs(),
        );
      }
      return response;
    } on HttpError catch (e) {
      return MockResponse(e.status, e.toBody(requestId));
    } on MockTransportError {
      rethrow;
    } on Object catch (e, st) {
      AppLog.error(
        'mock server error ${req.method} ${req.path}',
        error: e,
        stackTrace: st,
        tag: 'mock',
      );
      return MockResponse(
        500,
        HttpError(
          ApiErrorCode.internal,
          'Something went wrong',
        ).toBody(requestId),
      );
    }
  }
}
