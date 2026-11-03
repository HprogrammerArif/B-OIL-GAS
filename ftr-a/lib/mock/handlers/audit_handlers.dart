import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

List<Json> _newestFirst(List<Json> items) =>
    items..sort((a, b) => b.intVal('seq').compareTo(a.intVal('seq')));

List<RouteDef> auditRoutes() => [
  RouteDef('GET', '/audit-logs', permission: const ['admin:audit-read'], (
    ctx,
  ) async {
    final q = ctx.query;
    final from = q['from'] == null ? null : DateTime.tryParse(q['from']!);
    final to = q['to'] == null ? null : DateTime.tryParse(q['to']!);
    if ((q['from'] != null && from == null) ||
        (q['to'] != null && to == null)) {
      throw validationError('from', 'Use ISO-8601 timestamps');
    }
    final items = ctx.store.all(Col.auditLogs).where((e) {
      if (q['entityType'] != null && e['entityType'] != q['entityType']) {
        return false;
      }
      if (q['entityId'] != null && e['entityId'] != q['entityId']) {
        return false;
      }
      if (q['actorUserId'] != null && e['actorUserId'] != q['actorUserId']) {
        return false;
      }
      if (q['action'] != null && e['action'] != q['action']) return false;
      final at = DateTime.parse(e.str('createdAt'));
      if (from != null && at.isBefore(from)) return false;
      if (to != null && at.isAfter(to)) return false;
      return true;
    }).toList();
    return cursorPaginate(_newestFirst(items), q, shape: AuditEngine.toWire);
  }),
  RouteDef('GET', '/me/activity', (ctx) async {
    final me = ctx.requireAuth().user.str('id');
    final mine = ctx.store
        .all(Col.auditLogs)
        .where((e) => e['actorUserId'] == me)
        .toList();
    return cursorPaginate(
      _newestFirst(mine),
      ctx.query,
      defaultLimit: 20,
      shape: AuditEngine.toActivity,
    );
  }),
];
