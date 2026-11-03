import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _categories = {'APPROVALS', 'SAFETY', 'TRANSPORT', 'ALL'};

List<Json> _mine(HandlerContext ctx) {
  final me = ctx.requireAuth().user.str('id');
  return ctx.store
      .all(Col.notifications)
      .where((n) => n['userId'] == me)
      .toList();
}

String _lang(HandlerContext ctx) =>
    ctx.requireAuth().user.strOrNull('preferredLang') ?? 'EN';

Json _owned(HandlerContext ctx) {
  final n = ctx.store.get(Col.notifications, ctx.params['id']!);
  if (n == null || n['userId'] != ctx.requireAuth().user['id']) {
    throw notFound('Notification');
  }
  return n;
}

List<RouteDef> notificationRoutes() => [
  RouteDef('GET', '/notifications', (ctx) async {
    final q = ctx.query;
    final category = q['category'];
    if (category != null && !_categories.contains(category)) {
      throw validationError('category', 'Unknown category');
    }
    final priority = q['priority'];
    if (priority != null && !NotificationEngine.priorities.contains(priority)) {
      throw validationError('priority', 'Unknown priority');
    }
    final items = _mine(ctx).where((n) {
      if (q['unread'] == 'true' && n['readAt'] != null) return false;
      if (priority != null && n['priority'] != priority) return false;
      final module = q['module'];
      if (module != null && n.objOrNull('data')?['module'] != module) {
        return false;
      }
      if (category != null &&
          category != 'ALL' &&
          notificationCategory(n.str('type')) != category) {
        return false;
      }
      return true;
    }).toList();
    final lang = _lang(ctx);
    return paginate([
      for (final n in sortBy(items, '-createdAt', '-createdAt'))
        NotificationEngine.toWire(n, lang),
    ], q);
  }),
  RouteDef('GET', '/notifications/unread-count', (ctx) async {
    final unread = _mine(ctx).where((n) => n['readAt'] == null).toList();
    final byModule = <String, int>{};
    for (final n in unread) {
      final m = n.objOrNull('data')?.strOrNull('module');
      if (m != null) byModule[m] = (byModule[m] ?? 0) + 1;
    }
    return ok({
      'total': unread.length,
      'critical': unread.where((n) => n['priority'] == 'CRITICAL').length,
      'pendingAck': unread
          .where((n) => n['ackRequired'] == true && n['ackedAt'] == null)
          .length,
      'byModule': byModule,
    });
  }),
  RouteDef('POST', '/notifications/read-all', (ctx) async {
    final body = ctx.req.body;
    DateTime? before;
    if (body is Map && body['before'] != null) {
      before = DateTime.tryParse('${body['before']}');
      if (before == null) {
        throw validationError('before', 'Use an ISO-8601 timestamp');
      }
    }
    final now = ctx.store.nowIso();
    var changed = 0;
    for (final n in _mine(ctx)) {
      if (n['readAt'] != null) continue;
      if (before != null &&
          DateTime.parse(n.str('createdAt')).isAfter(before)) {
        continue;
      }
      n['readAt'] = now;
      ctx.store.touch(Col.notifications, n);
      changed++;
    }
    await ctx.store.commit();
    return ok({'updated': changed});
  }),
  RouteDef('POST', '/notifications/:id/read', (ctx) async {
    final n = _owned(ctx);
    if (n['readAt'] == null) {
      n['readAt'] = ctx.store.nowIso();
      ctx.store.touch(Col.notifications, n);
      await ctx.store.commit();
    }
    return ok(NotificationEngine.toWire(n, _lang(ctx)));
  }),
  RouteDef('POST', '/notifications/:id/ack', (ctx) async {
    final n = _owned(ctx);
    if (n['ackRequired'] != true) {
      throw policyViolation(
        'ACK_NOT_REQUIRED',
        'This notification does not need acknowledgement',
      );
    }
    if (n['ackedAt'] == null) {
      final now = ctx.store.nowIso();
      n['ackedAt'] = now;
      n['readAt'] ??= now;
      ctx.store.touch(Col.notifications, n);
      AuditEngine.log(
        ctx.store,
        action: 'NOTIFICATION_ACKED',
        entityType: 'Notification',
        actorUserId: ctx.requireAuth().user.str('id'),
        entityId: n.str('id'),
        after: {'type': n['type']},
      );
      await ctx.store.commit();
    }
    return ok(NotificationEngine.toWire(n, _lang(ctx)));
  }),
];
