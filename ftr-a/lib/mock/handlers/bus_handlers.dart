import 'package:bogcl_oneops/mock/engines/bus_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _read = ['bus:read', 'bus:seat-self', 'bus:manage'];

/// Runs the offer-expiry sweep before answering, like the server job would.
Future<MockResponse> _swept(
  HandlerContext ctx,
  Future<MockResponse> Function() body,
) async {
  BusEngine.tick(ctx.store);
  return body();
}

String? _text(Json body, String key) {
  final v = body[key];
  return v is String ? v : null;
}

List<RouteDef> busRoutes() => [
  RouteDef(
    'GET',
    '/bus/routes',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      final routes = ctx.store.all(Col.busRoutes).toList()
        ..sort((x, y) => x.str('code').compareTo(y.str('code')));
      return ok([
        for (final r in routes) BusEngine.routeWire(ctx.store, r, a.employeeId),
      ]);
    }),
    permission: _read,
  ),
  RouteDef(
    'GET',
    '/bus/routes/:id',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      final r = BusEngine.route(ctx.store, ctx.params['id']!);
      if (r == null) throw notFound('Route');
      return ok({
        ...BusEngine.routeWire(ctx.store, r, a.employeeId),
        if (ctx.can('bus:manage')) 'admin': BusEngine.adminDetail(ctx.store, r),
      });
    }),
    permission: _read,
  ),
  RouteDef(
    'GET',
    '/bus/my-seat',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: _read,
  ),
  RouteDef(
    'POST',
    '/bus/routes/:id/waitlist',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.join(ctx.store, a, ctx.params['id']!);
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId), status: 201);
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/waitlist/:id/accept',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      final body = ctx.req.body is Map ? ctx.bodyObject() : <String, Object?>{};
      BusEngine.accept(ctx.store, a, ctx.params['id']!, _text(body, 'stopId'));
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/waitlist/:id/decline',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.decline(ctx.store, a, ctx.params['id']!);
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/waitlist/:id/cancel',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.cancelWait(ctx.store, a, ctx.params['id']!);
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/waitlist/:id/priority',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.setPriority(ctx.store, a, ctx.params['id']!, ctx.bodyObject());
      await ctx.store.commit();
      return ok({'ok': true});
    }),
    permission: ['bus:manage'],
  ),
  RouteDef(
    'POST',
    '/bus/allocations/:id/release',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.release(ctx.store, a, ctx.params['id']!, ctx.bodyObject());
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/allocations/:id/reclaim',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.reclaim(ctx.store, a, ctx.params['id']!);
      await ctx.store.commit();
      return ok(BusEngine.mySeat(ctx.store, a.employeeId));
    }),
    permission: ['bus:seat-self'],
  ),
  RouteDef(
    'POST',
    '/bus/allocations/:id/end',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      BusEngine.endAllocation(ctx.store, a, ctx.params['id']!);
      await ctx.store.commit();
      return ok({'ok': true});
    }),
    permission: ['bus:allocate'],
  ),
  RouteDef(
    'POST',
    '/bus/broadcasts',
    (ctx) => _swept(ctx, () async {
      final a = ctx.requireAuth();
      final body = ctx.bodyObject();
      final sent = BusEngine.broadcast(
        ctx.store,
        a,
        _text(body, 'routeId'),
        _text(body, 'message') ?? '',
      );
      await ctx.store.commit();
      return ok({'recipients': sent}, status: 201);
    }),
    permission: ['bus:broadcast'],
  ),
];
