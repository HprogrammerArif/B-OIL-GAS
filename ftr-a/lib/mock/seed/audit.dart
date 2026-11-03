import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

const int _day = 24 * 60 * 60 * 1000;

/// Seeds a short sign-in history per account so "My activity" is never empty.
void seedAudit(MockStore store) {
  final now = store.nowMs();
  final users = store.all(Col.users)
    ..sort((a, b) => a.str('id').compareTo(b.str('id')));
  // Oldest first so the chain stays in time order.
  for (final days in [4, 2, 1]) {
    for (final (i, u) in users.indexed) {
      AuditEngine.log(
        store,
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        actorUserId: u.str('id'),
        entityId: u.str('id'),
        after: {'platform': 'ANDROID'},
        createdAtMs: now - days * _day + i * 60000,
      );
    }
  }
}
