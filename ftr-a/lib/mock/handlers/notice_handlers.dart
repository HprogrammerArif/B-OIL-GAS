import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/notice_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json? _receipt(HandlerContext ctx, String noticeId) => ctx.store.get(
  Col.noticeReceipts,
  NoticeEngine.receiptId(noticeId, ctx.requireAuth().employeeId),
);

bool _isManager(HandlerContext ctx, Json notice) =>
    notice['authorEmployeeId'] == ctx.requireAuth().employeeId ||
    ctx.can('notices:manage');

/// Recipient (has a receipt), author, or `notices:manage`; else 404.
Json _readable(HandlerContext ctx) {
  final n = ctx.store.get(Col.notices, ctx.params['id']!);
  if (n == null) throw notFound('Notice');
  if (_receipt(ctx, n.str('id')) == null && !_isManager(ctx, n)) {
    throw notFound('Notice');
  }
  return n;
}

List<RouteDef> noticeRoutes() => [
  RouteDef('GET', '/notices/options', (ctx) async {
    final a = ctx.requireAuth();
    final roles = a.user.strList('roles');
    final grant = a.grants
        .where((g) => g['key'] == 'notices:publish')
        .firstOrNull;
    return ok({
      'canPublish': grant != null,
      'scope': grant?['scope'],
      'categories': NoticeEngine.allowedCategories(roles),
      'departments': [
        for (final d in departments)
          {'id': d['id'], 'name': d['name'], 'nameBn': d['nameBn']},
      ],
      'sites': [
        for (final s in sites)
          {'id': s['id'], 'name': s['name'], 'nameBn': s['nameBn']},
      ],
      'ownDepartmentId': a.employee.obj('department')['id'],
      'ownSiteId': a.employee.obj('site')['id'],
      'maxPinned': NoticePolicy.maxPinned,
    });
  }, permission: ['notices:read']),
  RouteDef('GET', '/notices', (ctx) async {
    final a = ctx.requireAuth();
    final filter = ctx.query['filter'] ?? 'all';
    if (!const {'all', 'unread', 'ack', 'mine'}.contains(filter)) {
      throw validationError('filter', 'Unknown filter');
    }
    final rows = <({Json notice, Json? receipt})>[];
    for (final n in ctx.store.all(Col.notices)) {
      final r = _receipt(ctx, n.str('id'));
      if (filter == 'mine') {
        if (n['authorEmployeeId'] == a.employeeId) {
          rows.add((notice: n, receipt: r));
        }
        continue;
      }
      if (r == null || !NoticeEngine.isActive(n)) continue;
      if (filter == 'unread' && r['readAt'] != null) continue;
      if (filter == 'ack' &&
          !(n['requiresAck'] == true && r['ackedAt'] == null)) {
        continue;
      }
      rows.add((notice: n, receipt: r));
    }
    rows.sort((x, y) {
      final pin =
          (y.notice['isPinned'] == true ? 1 : 0) -
          (x.notice['isPinned'] == true ? 1 : 0);
      if (pin != 0 && filter != 'mine') return pin;
      return y.notice.str('publishedAt').compareTo(x.notice.str('publishedAt'));
    });
    return paginate(
      [
        for (final r in rows)
          NoticeEngine.wire(
            ctx.store,
            r.notice,
            r.receipt,
            manager: filter == 'mine',
          ),
      ],
      ctx.query,
      defaultPageSize: 30,
    );
  }, permission: ['notices:read']),
  RouteDef('GET', '/notices/unread-count', (ctx) async {
    final a = ctx.requireAuth();
    var unread = 0;
    var ack = 0;
    for (final n in ctx.store.all(Col.notices)) {
      final r = _receipt(ctx, n.str('id'));
      if (r == null || !NoticeEngine.isActive(n)) continue;
      if (r['readAt'] == null) unread++;
      if (n['requiresAck'] == true && r['ackedAt'] == null) ack++;
    }
    return ok({
      'unread': unread,
      'awaitingAck': ack,
      'employeeId': a.employeeId,
    });
  }, permission: ['notices:read']),
  RouteDef('GET', '/notices/:id', (ctx) async {
    final n = _readable(ctx);
    final r = _receipt(ctx, n.str('id'));
    if (r != null && r['readAt'] == null) {
      r['readAt'] = ctx.store.nowIso();
      ctx.store.put(Col.noticeReceipts, r);
      await ctx.store.commit();
    }
    return ok(
      NoticeEngine.wire(
        ctx.store,
        n,
        r,
        detail: true,
        manager: _isManager(ctx, n),
      ),
    );
  }, permission: ['notices:read']),
  RouteDef('POST', '/notices/:id/ack', (ctx) async {
    final n = ctx.store.get(Col.notices, ctx.params['id']!);
    final r = n == null ? null : _receipt(ctx, n.str('id'));
    if (n == null || r == null) throw forbidden('You are not a recipient');
    if (n['requiresAck'] != true) {
      throw invalidTransition('This notice does not need acknowledgement');
    }
    if (r['ackedAt'] != null) {
      throw HttpError(ApiErrorCode.conflict, 'Already acknowledged');
    }
    final now = ctx.store.nowIso();
    r
      ..['ackedAt'] = now
      ..['readAt'] = r['readAt'] ?? now;
    ctx.store.put(Col.noticeReceipts, r);
    await ctx.store.commit();
    return ok(
      NoticeEngine.wire(
        ctx.store,
        n,
        r,
        detail: true,
        manager: _isManager(ctx, n),
      ),
    );
  }, permission: ['notices:read']),
  RouteDef('POST', '/notices', (ctx) async {
    final a = ctx.requireAuth();
    final notice = NoticeEngine.publish(ctx.store, a, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      NoticeEngine.wire(
        ctx.store,
        notice,
        _receipt(ctx, notice.str('id')),
        detail: true,
        manager: true,
      ),
      status: 201,
    );
  }, permission: ['notices:create']),
  RouteDef('GET', '/notices/:id/receipts', (ctx) async {
    final n = _readable(ctx);
    if (!_isManager(ctx, n)) throw forbidden('Not allowed to view receipts');
    final rows = ctx.store
        .all(Col.noticeReceipts)
        .where((r) => r['noticeId'] == n['id'])
        .toList();
    return ok({
      'stats': NoticeEngine.stats(ctx.store, n.str('id')),
      'items': [
        for (final r in rows)
          () {
            final e = ctx.store.get(Col.employees, r.str('employeeId'));
            return {
              'employeeId': r['employeeId'],
              'name': e?['fullName'] ?? '',
              'nameBn': e?['fullNameBn'] ?? '',
              'department': e?.obj('department')['name'],
              'readAt': r['readAt'],
              'ackedAt': r['ackedAt'],
            };
          }(),
      ],
    });
  }, permission: ['notices:read']),
];
