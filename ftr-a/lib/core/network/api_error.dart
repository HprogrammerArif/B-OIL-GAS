import 'package:flutter/foundation.dart';

/// Stable error codes from doc 03 §1.3. Clients branch on these.
enum ApiErrorCode {
  validationError('VALIDATION_ERROR'),
  unauthenticated('UNAUTHENTICATED'),
  forbidden('FORBIDDEN'),
  notFound('NOT_FOUND'),
  conflict('CONFLICT'),
  invalidStateTransition('INVALID_STATE_TRANSITION'),
  rateLimited('RATE_LIMITED'),
  preconditionFailed('PRECONDITION_FAILED'),
  payloadTooLarge('PAYLOAD_TOO_LARGE'),
  unsupportedMediaType('UNSUPPORTED_MEDIA_TYPE'),
  policyViolation('POLICY_VIOLATION'),
  internal('INTERNAL'),

  /// Client-side only: no connectivity (real or simulated).
  offline('OFFLINE'),

  /// Client-side only: request timed out.
  timeout('TIMEOUT');

  ApiErrorCode(this.wire);

  final String wire;

  static ApiErrorCode fromWire(String? value) => ApiErrorCode.values.firstWhere(
    (c) => c.wire == value,
    orElse: () => ApiErrorCode.internal,
  );

  int get httpStatus => switch (this) {
    validationError || policyViolation => 422,
    unauthenticated => 401,
    forbidden => 403,
    notFound => 404,
    conflict || invalidStateTransition => 409,
    rateLimited => 429,
    preconditionFailed => 412,
    payloadTooLarge => 413,
    unsupportedMediaType => 415,
    internal => 500,
    offline || timeout => 0,
  };
}

/// Thrown by repositories. Controllers surface it as `AsyncValue.error`.
@immutable
class ApiException implements Exception {
  const ApiException({
    required this.code,
    required this.message,
    this.details = const [],
    this.requestId,
  });

  /// Builds from the doc 03 error envelope body.
  factory ApiException.fromBody(Map<String, Object?> body) {
    final err = body['error'];
    if (err is! Map) {
      return const ApiException(
        code: ApiErrorCode.internal,
        message: 'Unexpected response',
      );
    }
    final rawDetails = err['details'];
    return ApiException(
      code: ApiErrorCode.fromWire(err['code'] as String?),
      message: (err['message'] as String?) ?? 'Request failed',
      details: rawDetails is List
          ? [
              for (final d in rawDetails)
                if (d is Map) Map<String, Object?>.from(d),
            ]
          : const [],
      requestId: err['requestId'] as String?,
    );
  }

  final ApiErrorCode code;
  final String message;
  final List<Map<String, Object?>> details;
  final String? requestId;

  /// Business rule name for `POLICY_VIOLATION` (`details[0].rule`).
  String? get rule => details.isEmpty ? null : details.first['rule'] as String?;

  /// First detail's `reason` (e.g. `MFA_REQUIRED`).
  String? get reason =>
      details.isEmpty ? null : details.first['reason'] as String?;

  /// Field-level messages keyed by path (for `VALIDATION_ERROR`).
  Map<String, String> get fieldErrors => {
    for (final d in details)
      if (d['path'] is List && d['message'] is String)
        (d['path']! as List).join('.'): d['message']! as String,
  };

  /// True when a refetch is the right reaction (stale state).
  bool get shouldRefetch =>
      code == ApiErrorCode.invalidStateTransition ||
      code == ApiErrorCode.conflict;

  @override
  String toString() => 'ApiException(${code.wire}: $message)';
}
