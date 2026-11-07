import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Append-only, hash-chained audit trail (doc 03 §4.4, doc 07).
///
/// Entries are never updated or deleted: there is deliberately no API for it.
/// Each entry stores `hash = sha256(prevHash + action + actor + createdAt +
/// canonical({entityType, entityId, before, after}))`, so any edit to history
/// breaks [verify].
abstract final class AuditEngine {
  static const genesisHash =
      '0000000000000000000000000000000000000000000000000000000000000000';

  static String _id(int seq) => 'aud_${seq.toString().padLeft(8, '0')}';

  /// Appends an entry. The caller commits the store.
  ///
  /// `before`/`after` must hold only non-PII field names or ids: PII values
  /// (phone, NID, emergency contact) never enter the trail.
  static Json log(
    MockStore store, {
    required String action,
    required String entityType,
    String? actorUserId,
    String? entityId,
    Json? before,
    Json? after,
    String? requestId,
    int? createdAtMs,
  }) {
    final col = store.collection(Col.auditLogs);
    final seq = col.length + 1;
    final prev = seq == 1 ? null : col[_id(seq - 1)];
    final createdAt = DateTime.fromMillisecondsSinceEpoch(
      createdAtMs ?? store.nowMs(),
      isUtc: true,
    ).toIso8601String();
    final prevHash = prev?.str('hash') ?? genesisHash;
    final entry = <String, Object?>{
      'id': _id(seq),
      'seq': seq,
      'actorUserId': actorUserId,
      'action': action,
      'entityType': entityType,
      'entityId': entityId,
      'before': before,
      'after': after,
      'requestId': requestId,
      'createdAt': createdAt,
      'prevHash': prevHash,
      'hash': _hash(
        prevHash: prevHash,
        action: action,
        actorUserId: actorUserId,
        createdAt: createdAt,
        entityType: entityType,
        entityId: entityId,
        before: before,
        after: after,
      ),
    };
    store.put(Col.auditLogs, entry);
    return entry;
  }

  static String _hash({
    required String prevHash,
    required String action,
    required String? actorUserId,
    required String createdAt,
    required String entityType,
    required String? entityId,
    required Json? before,
    required Json? after,
  }) => Hash.chainLink(
    prevHash: prevHash,
    type: action,
    actorUserId: actorUserId ?? '',
    createdAt: createdAt,
    note: Hash.canonicalJson({
      'entityType': entityType,
      'entityId': entityId,
      'before': before,
      'after': after,
    }),
  );

  /// Recomputes the whole chain. Returns the first broken `seq`, or null.
  static int? verify(MockStore store) {
    final entries = store.all(Col.auditLogs)
      ..sort((a, b) => a.intVal('seq').compareTo(b.intVal('seq')));
    var prev = genesisHash;
    for (final e in entries) {
      final expected = _hash(
        prevHash: prev,
        action: e.str('action'),
        actorUserId: e.strOrNull('actorUserId'),
        createdAt: e.str('createdAt'),
        entityType: e.str('entityType'),
        entityId: e.strOrNull('entityId'),
        before: e.objOrNull('before'),
        after: e.objOrNull('after'),
      );
      if (e.str('prevHash') != prev || e.str('hash') != expected) {
        return e.intVal('seq');
      }
      prev = expected;
    }
    return null;
  }

  /// Wire shape for `/audit-logs`.
  static Json toWire(Json e) => {
    'id': e['id'],
    'actorUserId': e['actorUserId'],
    'action': e['action'],
    'entityType': e['entityType'],
    'entityId': e['entityId'],
    'before': e['before'],
    'after': e['after'],
    'requestId': e['requestId'],
    'createdAt': e['createdAt'],
    'hash': e['hash'],
  };

  /// Redacted shape for the user's own `/me/activity` (no before/after, keeps cryptographic proof).
  static Json toActivity(Json e) => {
    'id': e['id'],
    'seq': e['seq'],
    'action': e['action'],
    'entityType': e['entityType'],
    'entityId': e['entityId'],
    'createdAt': e['createdAt'],
    'prevHash': e['prevHash'],
    'hash': e['hash'],
  };
}
