import 'dart:async';

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

const _uuid = Uuid();

/// Paths (relative to `/api/v1`) that never carry an `Idempotency-Key`.
bool _isIdempotencyExempt(String path) =>
    path.startsWith('/auth/') ||
    path.startsWith('/search') ||
    path.startsWith('/files/presign');

/// Adds `Idempotency-Key` (UUID v4) to creating/transitioning POSTs unless the
/// caller already set one (the offline queue replays with its stored key).
class IdempotencyInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.method.toUpperCase() == 'POST' &&
        !_isIdempotencyExempt(options.path) &&
        !options.headers.containsKey('Idempotency-Key')) {
      options.headers['Idempotency-Key'] = _uuid.v4();
    }
    handler.next(options);
  }
}

/// Adds `Authorization` and `Accept-Language` headers.
class SessionInterceptor extends Interceptor {
  SessionInterceptor({required this.accessToken, required this.languageCode});

  final FutureOr<String?> Function() accessToken;
  final String Function() languageCode;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await accessToken();
    if (token != null && !options.path.startsWith('/auth/')) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    options.headers['Accept-Language'] = languageCode();
    handler.next(options);
  }
}

/// Maps every failure to [ApiException] so repositories never see `DioException`
/// details. The mock adapter answers with real doc 03 error envelopes.
class ErrorMappingInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final mapped = _map(err);
    AppLog.warn(
      '${err.requestOptions.method} ${err.requestOptions.path} -> '
      '${mapped.code.wire}',
      tag: 'net',
    );
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: mapped,
        stackTrace: err.stackTrace,
      ),
    );
  }

  ApiException _map(DioException err) {
    if (err.error is ApiException) return err.error! as ApiException;
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.transformTimeout:
        return const ApiException(
          code: ApiErrorCode.timeout,
          message: 'The request timed out.',
        );
      case DioExceptionType.connectionError:
        return const ApiException(
          code: ApiErrorCode.offline,
          message: 'No connection.',
        );
      case DioExceptionType.badResponse:
      case DioExceptionType.badCertificate:
      case DioExceptionType.cancel:
      case DioExceptionType.unknown:
        final body = err.response?.data;
        if (body is Map) {
          return ApiException.fromBody(Map<String, Object?>.from(body));
        }
        return const ApiException(
          code: ApiErrorCode.internal,
          message: 'Unexpected response',
        );
    }
  }
}

/// On an expired access token (`UNAUTHENTICATED` / `TOKEN_EXPIRED`) refreshes
/// once and replays the request. Must run after [ErrorMappingInterceptor].
class RefreshInterceptor extends Interceptor {
  RefreshInterceptor({required this.dio, required this.refresh});

  final Dio dio;

  /// Returns true when new tokens were stored.
  final Future<bool> Function() refresh;

  static const _retriedKey = 'tokenRefreshed';

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final mapped = err.error;
    final opts = err.requestOptions;
    final expired =
        mapped is ApiException &&
        mapped.code == ApiErrorCode.unauthenticated &&
        mapped.reason == 'TOKEN_EXPIRED' &&
        !opts.path.startsWith('/auth/') &&
        opts.extra[_retriedKey] != true;
    if (!expired) return handler.next(err);

    if (!await refresh()) return handler.next(err);
    try {
      opts.extra[_retriedKey] = true;
      handler.resolve(await dio.fetch<Object?>(opts));
    } on DioException catch (retryErr) {
      handler.next(retryErr);
    }
  }
}

/// Unwraps the mapped [ApiException] from a `DioException`.
/// Repositories call this in their `catch` blocks.
Never throwApi(DioException e) {
  final err = e.error;
  if (err is ApiException) throw err;
  throw ApiException(code: ApiErrorCode.internal, message: e.message ?? '');
}
