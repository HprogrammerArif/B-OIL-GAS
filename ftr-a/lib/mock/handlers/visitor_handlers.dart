import 'package:bogcl_oneops/mock/engines/visitor_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _readable(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final v = ctx.store.get(Col.visits, ctx.params['id']!);
  if (v == null || !VisitEngine.visibleTo(ctx.store, a, v)) {
    throw notFound('Visit');
  }
  return v;
}

Json _out(HandlerContext ctx, Json v) =>
    VisitEngine.wire(ctx.store, ctx.requireAuth(), v);

RouteDef _action(
  String verb,
  String permission,
  void Function(HandlerContext ctx, Json v) run,
) => RouteDef('POST', '/visits/:id/$verb', (ctx) async {
  final v = _readable(ctx);
  run(ctx, v);
  await ctx.store.commit();
  return ok(_out(ctx, v));
}, permission: [permission]);

List<RouteDef> visitorRoutes() => [
  RouteDef('GET', '/visits/zones', (ctx) async {
    ctx.requireAuth();
    final site = ctx.query['siteId'];
    return ok([
      for (final z in VisitPolicy.zones)
        if (site == null || z['siteId'] == site) z,
    ]);
  }),
  RouteDef('GET', '/visits/kpis', (ctx) async {
    final a = ctx.requireAuth();
    VisitEngine.tick(ctx.store);
    final mine = ctx.store
        .all(Col.visits)
        .where((v) => VisitEngine.visibleTo(ctx.store, a, v));
    int n(bool Function(Json) f) => mine.where(f).length;
    return ok({
      'insideNow': n(
        (v) => v['status'] == 'CHECKED_IN' || v['status'] == 'OVERDUE',
      ),
      'expectedToday': n((v) {
        final d = (v.strOrNull('expectedAt') ?? '').substring(0, 10);
        return d == ctx.store.nowIso().substring(0, 10) &&
            (v['status'] == 'APPROVED' || v['status'] == 'PRE_REGISTERED');
      }),
      'overdue': n((v) => v['status'] == 'OVERDUE'),
      'toApprove': n((v) => v['status'] == 'PRE_REGISTERED'),
    });
  }, permission: ['visitors:read', 'visitors:gate']),
  RouteDef('GET', '/visits/muster', (ctx) async {
    return ok(VisitEngine.musterStatus(ctx.store, ctx.requireAuth()));
  }, permission: ['visitors:gate']),
  RouteDef('POST', '/visits/muster/start', (ctx) async {
    VisitEngine.musterStart(ctx.store, ctx.requireAuth());
    await ctx.store.commit();
    return ok(VisitEngine.musterStatus(ctx.store, ctx.requireAuth()));
  }, permission: ['visitors:gate']),
  RouteDef('POST', '/visits/muster/end', (ctx) async {
    VisitEngine.musterEnd(ctx.store, ctx.requireAuth());
    await ctx.store.commit();
    return ok(VisitEngine.musterStatus(ctx.store, ctx.requireAuth()));
  }, permission: ['visitors:gate']),
  RouteDef('POST', '/visits/scan', (ctx) async {
    final v = VisitEngine.scan(ctx.store, ctx.requireAuth(), ctx.bodyObject());
    if (v == null) throw notFound('Visit');
    return ok(_out(ctx, v));
  }, permission: ['visitors:gate']),
  RouteDef('GET', '/visits', (ctx) async {
    final a = ctx.requireAuth();
    VisitEngine.tick(ctx.store);
    final view = ctx.query['view'] ?? 'mine';
    if (!const {
      'mine',
      'expected',
      'inside',
      'overdue',
      'to-approve',
      'all',
    }.contains(view)) {
      throw validationError('view', 'Unknown view');
    }
    final status = ctx.query['status'];
    final category = ctx.query['category'];
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final today = ctx.store.nowIso().substring(0, 10);
    final me = a.user.str('id');
    final items = ctx.store.all(Col.visits).where((v) {
      if (!VisitEngine.visibleTo(ctx.store, a, v)) return false;
      if (status != null && v['status'] != status) return false;
      if (category != null && v['category'] != category) return false;
      final scoped = switch (view) {
        'mine' => v['hostUserId'] == me || v['escortUserId'] == me,
        'expected' =>
          (v['status'] == 'APPROVED' || v['status'] == 'PRE_REGISTERED') &&
              v.str('expectedAt').startsWith(today),
        'inside' => v['status'] == 'CHECKED_IN' || v['status'] == 'OVERDUE',
        'overdue' => v['status'] == 'OVERDUE',
        'to-approve' => v['status'] == 'PRE_REGISTERED',
        _ => true,
      };
      if (!scoped) return false;
      if (q.isEmpty) return true;
      final w = VisitEngine.wire(ctx.store, a, v);
      final guest = Map<String, Object?>.from(w['visitor']! as Map);
      return [
        v.str('visitNo'),
        guest['fullName'] ?? '',
        guest['organisation'] ?? '',
        v.strOrNull('vehiclePlate') ?? '',
        v.strOrNull('badgeNo') ?? '',
      ].any((t) => t.toString().toLowerCase().contains(q));
    }).toList();
    await ctx.store.commit();
    final sorted = sortBy(items, ctx.query['sort'], 'expectedAt');
    return paginate([for (final v in sorted) _out(ctx, v)], ctx.query);
  }, permission: ['visitors:read', 'visitors:gate']),
  RouteDef('POST', '/visits', (ctx) async {
    final v = VisitEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, v), status: 201);
  }, permission: ['visitors:create']),
  RouteDef('GET', '/visits/:id', (ctx) async {
    return ok(_out(ctx, _readable(ctx)));
  }, permission: ['visitors:read', 'visitors:gate']),
  _action(
    'approve',
    'visitors:approve',
    (ctx, v) => VisitEngine.approve(ctx.store, ctx.requireAuth(), v),
  ),
  _action(
    'deny',
    'visitors:read',
    (ctx, v) =>
        VisitEngine.deny(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'cancel',
    'visitors:read',
    (ctx, v) =>
        VisitEngine.cancel(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'watchlist',
    'visitors:watchlist',
    (ctx, v) => VisitEngine.clearWatchlist(
      ctx.store,
      ctx.requireAuth(),
      v,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'ppe',
    'visitors:gate',
    (ctx, v) =>
        VisitEngine.ppe(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'escort',
    'visitors:read',
    (ctx, v) => VisitEngine.setEscort(
      ctx.store,
      ctx.requireAuth(),
      v,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'check-in',
    'visitors:gate',
    (ctx, v) =>
        VisitEngine.checkIn(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'check-out',
    'visitors:gate',
    (ctx, v) =>
        VisitEngine.checkOut(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'extend',
    'visitors:read',
    (ctx, v) =>
        VisitEngine.extend(ctx.store, ctx.requireAuth(), v, ctx.bodyObject()),
  ),
  _action(
    'findings',
    'visitors:read',
    (ctx, v) => VisitEngine.addFinding(
      ctx.store,
      ctx.requireAuth(),
      v,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'muster-safe',
    'visitors:read',
    (ctx, v) => VisitEngine.musterSafe(ctx.store, ctx.requireAuth(), v),
  ),
];
