import 'package:bogcl_oneops/mock/engines/parcel_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _statuses = {
  'CREATED',
  'DISPATCHED',
  'IN_TRANSIT',
  'AT_GATE',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'QUARANTINED',
  'RETURN_INITIATED',
  'RETURN_IN_TRANSIT',
  'RETURNED',
  'LOST',
  'DAMAGED',
  'CANCELLED',
};

/// A parcel I may open, or 404 (also for confidential ones I may not know of).
Json _readable(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final p = ctx.store.get(Col.parcels, ctx.params['id']!);
  if (p == null || !ParcelEngine.visibleTo(ctx.store, a, p)) {
    throw notFound('Parcel');
  }
  return p;
}

Json _out(HandlerContext ctx, Json p, {bool detail = true}) =>
    ParcelEngine.wire(ctx.store, ctx.requireAuth(), p, detail: detail);

/// POST /parcels/:id/VERB wrapping one engine call.
RouteDef _action(
  String verb,
  String permission,
  void Function(HandlerContext ctx, Json p) run,
) => RouteDef('POST', '/parcels/:id/$verb', (ctx) async {
  final p = _readable(ctx);
  run(ctx, p);
  await ctx.store.commit();
  return ok(_out(ctx, p));
}, permission: [permission]);

List<RouteDef> parcelRoutes() => [
  RouteDef('GET', '/parcels/kpis', (ctx) async {
    final a = ctx.requireAuth();
    final mine = ctx.store
        .all(Col.parcels)
        .where((p) => ParcelEngine.visibleTo(ctx.store, a, p))
        .toList();
    int count(bool Function(Json) f) => mine.where(f).length;
    final today = ctx.store.nowIso().substring(0, 10);
    return ok({
      'inTransit': count(
        (p) => const {
          'DISPATCHED',
          'IN_TRANSIT',
          'RETURN_IN_TRANSIT',
        }.contains(p['status']),
      ),
      'atGate': count((p) => p['status'] == 'AT_GATE'),
      'outForDelivery': count((p) => p['status'] == 'OUT_FOR_DELIVERY'),
      'deliveredToday': count(
        (p) => (p.strOrNull('deliveredAt') ?? '').startsWith(today),
      ),
      'flagged': count((p) => p['status'] == 'QUARANTINED'),
      'stuck': count((p) => ParcelEngine.isStuck(ctx.store, p)),
    });
  }, permission: ['parcels:read']),
  RouteDef('GET', '/parcels/couriers', (ctx) async {
    final out = <Json>[];
    for (final u in ctx.store.all(Col.users)) {
      final roles = u.strList('roles');
      if (u['isActive'] == false ||
          !(roles.contains('DRIVER') || roles.contains('MAILROOM'))) {
        continue;
      }
      final ref = WorkflowEngine.personRef(ctx.store, u.str('id'));
      if (ref != null) out.add(ref);
    }
    return ok(out);
  }, permission: ['parcels:dispatch']),
  RouteDef('GET', '/parcels/by-tracking/:no', (ctx) async {
    final a = ctx.requireAuth();
    final no = ctx.params['no']!.trim().toUpperCase();
    final p = ctx.store
        .all(Col.parcels)
        .where(
          (x) =>
              x.str('trackingNo').toUpperCase() == no &&
              ParcelEngine.visibleTo(ctx.store, a, x),
        )
        .firstOrNull;
    if (p == null) throw notFound('Parcel');
    return ok(_out(ctx, p));
  }, permission: ['parcels:read']),
  RouteDef('GET', '/parcels', (ctx) async {
    final a = ctx.requireAuth();
    final me = a.user.str('id');
    ParcelEngine.tick(ctx.store);
    final view = ctx.query['view'] ?? 'mine';
    if (!const {'sent', 'incoming', 'carrying', 'site', 'all'}.contains(view)) {
      throw validationError('view', 'Unknown view');
    }
    final status = ctx.query['status'];
    if (status != null && !_statuses.contains(status)) {
      throw validationError('status', 'Unknown status');
    }
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final items = ctx.store.all(Col.parcels).where((p) {
      if (!ParcelEngine.visibleTo(ctx.store, a, p)) return false;
      if (status != null && p['status'] != status) return false;
      if (ctx.query['stuck'] == 'true' && !ParcelEngine.isStuck(ctx.store, p)) {
        return false;
      }
      final scoped = switch (view) {
        'sent' => p['senderUserId'] == me,
        'incoming' => p['recipientUserId'] == me,
        'carrying' => p['courierUserId'] == me,
        _ => true,
      };
      if (!scoped) return false;
      if (q.isEmpty) return true;
      final w = ParcelEngine.wire(ctx.store, a, p);
      return [
        p.str('trackingNo'),
        p.strOrNull('waybillNo') ?? '',
        w['description'] ?? '',
        (w['recipient'] as Json?)?['name'] ?? '',
      ].any((t) => t.toString().toLowerCase().contains(q));
    }).toList();
    await ctx.store.commit();
    final sorted = sortBy(items, ctx.query['sort'], '-lastEventAt');
    return paginate([
      for (final p in sorted) _out(ctx, p, detail: false),
    ], ctx.query);
  }, permission: ['parcels:read']),
  RouteDef('POST', '/parcels', (ctx) async {
    final p = ParcelEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, p), status: 201);
  }, permission: ['parcels:create']),
  RouteDef('GET', '/parcels/:id', (ctx) async {
    return ok(_out(ctx, _readable(ctx)));
  }, permission: ['parcels:read']),
  RouteDef('PUT', '/parcels/:id', (ctx) async {
    final a = ctx.requireAuth();
    final p = _readable(ctx);
    final w = _out(ctx, p, detail: false);
    if (!((w['me']! as Json)['canEdit'] == true)) throw forbidden();
    ParcelEngine.update(ctx.store, a, p, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, p));
  }, permission: ['parcels:create']),
  _action('cancel', 'parcels:read', (ctx, p) {
    final a = ctx.requireAuth();
    if (!((_out(ctx, p, detail: false)['me']! as Json)['canCancel'] == true)) {
      throw forbidden();
    }
    ParcelEngine.cancel(ctx.store, a, p);
  }),
  _action(
    'dispatch',
    'parcels:dispatch',
    (ctx, p) => ParcelEngine.dispatch(
      ctx.store,
      ctx.requireAuth(),
      p,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'checkpoint',
    'parcels:scan',
    (ctx, p) => ParcelEngine.checkpoint(
      ctx.store,
      ctx.requireAuth(),
      p,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'gate-in',
    'parcels:scan',
    (ctx, p) =>
        ParcelEngine.gateIn(ctx.store, ctx.requireAuth(), p, ctx.bodyObject()),
  ),
  _action(
    'out-for-delivery',
    'parcels:scan',
    (ctx, p) => ParcelEngine.outForDelivery(ctx.store, ctx.requireAuth(), p),
  ),
  _action(
    'verify-otp',
    'parcels:deliver',
    (ctx, p) => ParcelEngine.verifyOtp(
      ctx.store,
      ctx.requireAuth(),
      p,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'accept',
    'parcels:read',
    (ctx, p) => ParcelEngine.accept(ctx.store, ctx.requireAuth(), p),
  ),
  _action(
    'resend-otp',
    'parcels:read',
    (ctx, p) => ParcelEngine.resendOtp(ctx.store, ctx.requireAuth(), p),
  ),
  _action(
    'flag',
    'parcels:scan',
    (ctx, p) =>
        ParcelEngine.flag(ctx.store, ctx.requireAuth(), p, ctx.bodyObject()),
  ),
  _action(
    'return',
    'parcels:read',
    (ctx, p) => ParcelEngine.startReturn(
      ctx.store,
      ctx.requireAuth(),
      p,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'exception',
    'parcels:manage',
    (ctx, p) => ParcelEngine.exception(
      ctx.store,
      ctx.requireAuth(),
      p,
      ctx.bodyObject(),
    ),
  ),
  _action(
    'note',
    'parcels:read',
    (ctx, p) =>
        ParcelEngine.addNote(ctx.store, ctx.requireAuth(), p, ctx.bodyObject()),
  ),
];
