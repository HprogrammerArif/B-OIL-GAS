import 'dart:developer' as dev;

import 'package:flutter/foundation.dart';

/// App logger with PII redaction. Never use `print`.
///
/// Redacts bearer tokens, Bangladesh phone numbers, NID-like numbers, emails
/// and values of sensitive keys (`password`, `token`, `otp`, `nid`, ...).
abstract final class AppLog {
  static final _bearer = RegExp(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*');
  static final _phone = RegExp(r'(?:\+?88)?01[3-9]\d{8}');
  static final _nid = RegExp(r'\b(?:\d{10}|\d{13}|\d{17})\b');
  static final _email = RegExp(r'[\w.+-]+@[\w-]+\.[\w.-]+');
  static final _sensitiveKv = RegExp(
    r'''("?(?:password|passcode|token|accessToken|refreshToken|otp|pin|nid|secret|signature)"?\s*[:=]\s*)("[^"]*"|[^\s,}]+)''',
    caseSensitive: false,
  );

  static const _mask = '***';

  /// Returns [input] with sensitive data masked.
  static String redact(String input) {
    return input
        .replaceAll(_bearer, 'Bearer $_mask')
        .replaceAllMapped(_sensitiveKv, (m) => '${m[1]}$_mask')
        .replaceAll(_email, _mask)
        .replaceAll(_phone, _mask)
        .replaceAll(_nid, _mask);
  }

  static void debug(String message, {String tag = 'app'}) =>
      _emit(message, tag, 500);

  static void info(String message, {String tag = 'app'}) =>
      _emit(message, tag, 800);

  static void warn(String message, {String tag = 'app'}) =>
      _emit(message, tag, 900);

  static void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String tag = 'app',
  }) {
    final safeError = error == null ? null : redact(error.toString());
    _emit(
      safeError == null ? message : '$message | $safeError',
      tag,
      1000,
      stackTrace: stackTrace,
    );
  }

  static void _emit(
    String message,
    String tag,
    int level, {
    StackTrace? stackTrace,
  }) {
    if (kReleaseMode && level < 900) return;
    dev.log(redact(message), name: tag, level: level, stackTrace: stackTrace);
  }
}
