import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart' show StreamProvider;
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'outbox_service.g.dart';

/// Outcome of [OutboxService.sendOrQueue].
sealed class SendResult {
  const SendResult();
}

/// The server answered; [data] is the raw response body.
class Sent extends SendResult {
  const Sent(this.data);

  final Object? data;
}

/// The device was offline; the action is queued and will sync automatically.
class Queued extends SendResult {
  const Queued(this.id);

  final String id;
}

/// Persisted mutation queue (doc 05-F §5).
///
/// Offline-capable actions go through [sendOrQueue]. Queued items replay in
/// order with their stored `Idempotency-Key`, so the server applies each once.
class OutboxService {
  OutboxService(this._db, this._dio, this._secure);

  final AppDatabase _db;
  final Dio _dio;
  final SecureStore _secure;
  static const _uuid = Uuid();
  static const int _maxBackoffMs = 5 * 60 * 1000;

  Future<void>? _replaying;
  Timer? _retryTimer;

  /// Sends now; if the device is offline or the request times out, queues it.
  Future<SendResult> sendOrQueue({
    required String method,
    required String endpoint,
    required String label,
    Object? payload,
  }) async {
    final key = _uuid.v4();
    try {
      final res = await _dio.request<Object?>(
        endpoint,
        data: payload,
        options: Options(method: method, headers: {'Idempotency-Key': key}),
      );
      return Sent(res.data);
    } on DioException catch (e) {
      final err = e.error;
      final offline =
          err is ApiException &&
          (err.code == ApiErrorCode.offline ||
              err.code == ApiErrorCode.timeout);
      if (!offline) throwApi(e);
      final id = await enqueue(
        method: method,
        endpoint: endpoint,
        label: label,
        payload: payload,
        idempotencyKey: key,
      );
      return Queued(id);
    }
  }

  Future<String> enqueue({
    required String method,
    required String endpoint,
    required String label,
    Object? payload,
    String? idempotencyKey,
  }) async {
    final id = _uuid.v4();
    await _db.enqueue(
      OutboxCompanion.insert(
        id: id,
        method: method,
        endpoint: endpoint,
        payload: jsonEncode(payload),
        idempotencyKey: idempotencyKey ?? _uuid.v4(),
        createdAtMs: DateTime.now().millisecondsSinceEpoch,
        label: Value(label),
      ),
    );
    return id;
  }

  /// Replays due items in order. Single-flight. Stops at the first item that
  /// cannot be sent yet so ordering is preserved.
  Future<void> replay() {
    return _replaying ??= _replay().whenComplete(() => _replaying = null);
  }

  Future<void> _replay() async {
    // No session, nothing to send.
    if (await _secure.read(SecureKeys.accessToken) == null) return;
    await _db.resetStuckOutbox();
    _retryTimer?.cancel();

    while (true) {
      final due = (await _db.pendingOutbox())
          .where(
            (i) =>
                i.status == 'PENDING' &&
                i.nextAttemptAtMs <= DateTime.now().millisecondsSinceEpoch,
          )
          .toList();
      if (due.isEmpty) break;
      final item = due.first;
      await _db.updateOutbox(
        item.id,
        OutboxCompanion(
          status: const Value('SYNCING'),
          attempts: Value(item.attempts + 1),
        ),
      );
      try {
        await _dio.request<Object?>(
          item.endpoint,
          data: item.payload == 'null' ? null : jsonDecode(item.payload),
          options: Options(
            method: item.method,
            headers: {'Idempotency-Key': item.idempotencyKey},
          ),
        );
        await _db.deleteOutbox(item.id);
      } on DioException catch (e) {
        final err = e.error;
        final apiErr = err is ApiException ? err : null;
        final retryable =
            apiErr == null ||
            apiErr.code == ApiErrorCode.offline ||
            apiErr.code == ApiErrorCode.timeout ||
            apiErr.code == ApiErrorCode.internal ||
            apiErr.code == ApiErrorCode.rateLimited;
        final attempts = item.attempts + 1;
        await _db.updateOutbox(
          item.id,
          OutboxCompanion(
            status: Value(retryable ? 'PENDING' : 'FAILED'),
            lastError: Value(apiErr?.code.wire ?? 'UNKNOWN'),
            nextAttemptAtMs: Value(
              retryable
                  ? DateTime.now().millisecondsSinceEpoch + _backoffMs(attempts)
                  : 0,
            ),
          ),
        );
        AppLog.warn(
          'outbox ${item.method} ${item.endpoint}: '
          '${apiErr?.code.wire ?? 'error'} (attempt $attempts)',
          tag: 'outbox',
        );
        if (retryable) {
          _scheduleRetry(_backoffMs(attempts));
          break;
        }
        // Terminal failure: continue with the next item.
      }
    }
  }

  /// 2s, 4s, 8s ... capped at 5 minutes.
  static int _backoffMs(int attempts) =>
      min(_maxBackoffMs, 2000 * pow(2, attempts - 1).toInt());

  void _scheduleRetry(int ms) {
    _retryTimer?.cancel();
    _retryTimer = Timer(Duration(milliseconds: ms), () => unawaited(replay()));
  }

  /// Puts a failed item back in the queue.
  Future<void> retry(String id) async {
    await _db.updateOutbox(
      id,
      const OutboxCompanion(
        status: Value('PENDING'),
        nextAttemptAtMs: Value(0),
        lastError: Value(null),
      ),
    );
    unawaited(replay());
  }

  Future<void> discard(String id) => _db.deleteOutbox(id);

  void dispose() => _retryTimer?.cancel();
}

@Riverpod(keepAlive: true)
OutboxService outboxService(Ref ref) {
  final service = OutboxService(
    ref.watch(appDatabaseProvider),
    ref.watch(dioProvider),
    ref.watch(secureStoreProvider),
  );
  ref.onDispose(service.dispose);
  return service;
}

/// Live queue contents for the Outbox screen and badges.
// Hand-written: `OutboxData` is drift-generated and the riverpod generator
// cannot resolve it in the same build.
final StreamProvider<List<OutboxData>> outboxItemsProvider =
    StreamProvider<List<OutboxData>>(
      (ref) => ref.watch(appDatabaseProvider).watchOutbox(),
    );
