import 'dart:convert';
import 'dart:isolate';

import 'package:crypto/crypto.dart';

/// SHA-256 helpers (real hashes, used for note-sheet signing and audit chains).
abstract final class Hash {
  static String sha256Hex(String input) =>
      sha256.convert(utf8.encode(input)).toString();

  static String sha256Bytes(List<int> bytes) =>
      sha256.convert(bytes).toString();

  /// Constant-time string comparison for digests, tokens and OTPs.
  static bool constantTimeEquals(String a, String b) {
    final x = utf8.encode(a);
    final y = utf8.encode(b);
    var diff = x.length ^ y.length;
    for (var i = 0; i < x.length && i < y.length; i++) {
      diff |= x[i] ^ y[i];
    }
    return diff == 0;
  }

  /// Hash large payloads off the UI isolate.
  static Future<String> sha256BytesAsync(List<int> bytes) =>
      Isolate.run(() => sha256Bytes(bytes));

  /// Canonical JSON: sorted keys, no whitespace. Stable across platforms.
  static String canonicalJson(Object? value) => jsonEncode(_sorted(value));

  static Object? _sorted(Object? v) {
    if (v is Map) {
      final keys = v.keys.map((k) => k.toString()).toList()..sort();
      return {for (final k in keys) k: _sorted(v[k])};
    }
    if (v is List) return v.map(_sorted).toList();
    return v;
  }

  /// `sha256(prevHash + type + actor + createdAt + note)` chain link
  /// (doc 03, parcel/audit events).
  static String chainLink({
    required String prevHash,
    required String type,
    required String actorUserId,
    required String createdAt,
    String note = '',
  }) => sha256Hex('$prevHash$type$actorUserId$createdAt$note');
}
