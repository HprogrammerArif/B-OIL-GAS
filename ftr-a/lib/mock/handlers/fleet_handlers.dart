import 'package:bogcl_oneops/mock/engines/chat_engine.dart';
import 'package:bogcl_oneops/mock/engines/fleet_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _req(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final r = ctx.store.get(Col.fleetRequisitions, ctx.params['id']!);
  if (r == null || !FleetEngine.visibleReq(ctx.store, a, r)) {
    throw notFound('Requisition');
  }
  return r;
}

Json _trip(HandlerContext ctx) {
  final t = ctx.store.get(Col.fleetTrips, ctx.params['id']!);
  if (t == null) throw notFound('Trip');
  final r = ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'));
  if (r == null || !FleetEngine.visibleReq(ctx.store, ctx.requireAuth(), r)) {
    throw notFound('Trip');
  }
  return t;
}

Json _out(HandlerContext ctx, Json r) =>
    FleetEngine.wireReq(ctx.store, ctx.requireAuth(), r);

List<RouteDef> fleetRoutes() => [
  RouteDef('GET', '/fleet/estimate', (ctx) async {
    ctx.requireAuth();
    final b = ctx.query;
    final pax = int.tryParse(b['passengerCount'] ?? '1') ?? 1;
    final est = FleetEngine.estimate(
      destination: b['destination'] ?? '',
      tripType: b['tripType'] ?? 'ONE_WAY',
      passengers: pax,
      stops: int.tryParse(b['stops'] ?? '0') ?? 0,
    );
    return ok({
      'estimatedKm': est.$1,
      'estimatedMinutes': est.$2,
      'estimatedCost': est.$3,
      'suggestedCapacityClass': est.$4,
    });
  }, permission: ['fleet:request']),
  RouteDef('GET', '/fleet/vehicles', (ctx) async {
    ctx.requireAuth();
    return ok([
      for (final v in ctx.store.all(Col.fleetVehicles))
        FleetEngine.vehicleWire(v),
    ]);
  }, permission: ['fleet:read', 'fleet:dispatch', 'fleet:request']),
  RouteDef('GET', '/fleet/drivers', (ctx) async {
    ctx.requireAuth();
    return ok([
      for (final d in ctx.store.all(Col.fleetDrivers))
        FleetEngine.driverWire(ctx.store, d),
    ]);
  }, permission: ['fleet:read', 'fleet:dispatch']),
  RouteDef('GET', '/fleet/assignable/:id', (ctx) async {
    final r = _req(ctx);
    return ok({
      'vehicles': [
        for (final v in FleetEngine.assignableVehicles(ctx.store, r))
          FleetEngine.vehicleWire(v),
      ],
      'drivers': [
        for (final d in {
          for (final v in FleetEngine.assignableVehicles(ctx.store, r))
            for (final dr in FleetEngine.assignableDrivers(ctx.store, v))
              dr.str('id'): dr,
        }.values)
          FleetEngine.driverWire(ctx.store, d),
      ],
    });
  }, permission: ['fleet:dispatch']),
  RouteDef('GET', '/fleet/sos', (ctx) async {
    ctx.requireAuth();
    final items = ctx.store.all(Col.fleetSos)
      ..sort((a, b) => b.str('createdAt').compareTo(a.str('createdAt')));
    return ok(items);
  }, permission: ['fleet:dispatch', 'fleet:gate', 'fleet:drive', 'fleet:read']),
  RouteDef('POST', '/fleet/sos', (ctx) async {
    final s = FleetEngine.standaloneSos(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(s, status: 201);
  }, permission: ['fleet:drive', 'fleet:dispatch']),
  RouteDef('POST', '/fleet/sos/:id/ack', (ctx) async {
    final s = ctx.store.get(Col.fleetSos, ctx.params['id']!);
    if (s == null) throw notFound('SOS');
    FleetEngine.ackSos(ctx.store, ctx.requireAuth(), s);
    await ctx.store.commit();
    return ok(s);
  }, permission: ['fleet:dispatch', 'fleet:gate']),
  RouteDef(
    'GET',
    '/vehicle-requisitions',
    (ctx) async {
      final a = ctx.requireAuth();
      final view = ctx.query['view'] ?? 'mine';
      final me = a.user.str('id');
      final q = (ctx.query['q'] ?? '').trim().toLowerCase();
      final items = ctx.store.all(Col.fleetRequisitions).where((r) {
        if (!FleetEngine.visibleReq(ctx.store, a, r)) return false;
        final t = r.strOrNull('tripId') == null
            ? null
            : ctx.store.get(Col.fleetTrips, r.str('tripId'));
        final scoped = switch (view) {
          'mine' => r['requesterUserId'] == me,
          'driving' => t?['driverUserId'] == me,
          'to-endorse' => r['status'] == 'PENDING_APPROVAL',
          'dispatch' => r['status'] == 'APPROVED' || r['status'] == 'ASSIGNED',
          'live' => r['status'] == 'IN_TRANSIT',
          _ => true,
        };
        if (!scoped) return false;
        if (q.isEmpty) return true;
        return [
          r.str('reqNo'),
          r.str('purpose'),
          r.str('destination'),
        ].any((x) => x.toLowerCase().contains(q));
      }).toList();
      final sorted = sortBy(items, ctx.query['sort'], '-createdAt');
      return paginate([for (final r in sorted) _out(ctx, r)], ctx.query);
    },
    permission: [
      'fleet:request',
      'fleet:drive',
      'fleet:dispatch',
      'fleet:endorse',
      'fleet:read',
      'fleet:gate',
    ],
  ),
  RouteDef('POST', '/vehicle-requisitions', (ctx) async {
    final r = FleetEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    if (ctx.bodyObject()['submit'] == true) {
      FleetEngine.submit(ctx.store, ctx.requireAuth(), r);
    }
    await ctx.store.commit();
    return ok(_out(ctx, r), status: 201);
  }, permission: ['fleet:request']),
  RouteDef(
    'GET',
    '/vehicle-requisitions/:id',
    (ctx) async {
      return ok(_out(ctx, _req(ctx)));
    },
    permission: [
      'fleet:request',
      'fleet:drive',
      'fleet:dispatch',
      'fleet:endorse',
      'fleet:read',
      'fleet:gate',
    ],
  ),
  RouteDef('POST', '/vehicle-requisitions/:id/submit', (ctx) async {
    final r = _req(ctx);
    FleetEngine.submit(ctx.store, ctx.requireAuth(), r);
    await ctx.store.commit();
    return ok(_out(ctx, r));
  }, permission: ['fleet:request']),
  RouteDef('POST', '/vehicle-requisitions/:id/cancel', (ctx) async {
    final r = _req(ctx);
    FleetEngine.cancel(ctx.store, ctx.requireAuth(), r, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, r));
  }, permission: ['fleet:request', 'fleet:dispatch']),
  RouteDef('POST', '/vehicle-requisitions/:id/assign', (ctx) async {
    final r = _req(ctx);
    FleetEngine.assign(ctx.store, ctx.requireAuth(), r, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, r));
  }, permission: ['fleet:dispatch']),
  RouteDef('POST', '/vehicle-requisitions/:id/rate', (ctx) async {
    final r = _req(ctx);
    FleetEngine.rate(ctx.store, ctx.requireAuth(), r, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, r));
  }, permission: ['fleet:request']),
  RouteDef('POST', '/trips/:id/gate-out', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.gateOut(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive', 'fleet:gate']),
  RouteDef('POST', '/trips/:id/checkpoint', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.checkpoint(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive']),
  RouteDef('POST', '/trips/:id/gate-in', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.gateIn(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive', 'fleet:gate']),
  RouteDef('POST', '/trips/:id/complete', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.complete(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive', 'fleet:dispatch']),
  RouteDef('POST', '/trips/:id/sos', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.sos(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive', 'fleet:dispatch']),
  RouteDef('POST', '/trips/:id/tolls', (ctx) async {
    final t = _trip(ctx);
    FleetEngine.addToll(ctx.store, ctx.requireAuth(), t, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      _out(ctx, ctx.store.get(Col.fleetRequisitions, t.str('requisitionId'))!),
    );
  }, permission: ['fleet:drive']),
  RouteDef('POST', '/toll-claims/:id/:verb', (ctx) async {
    final t = ctx.store.get(Col.fleetTolls, ctx.params['id']!);
    if (t == null) throw notFound('Toll');
    final verb = ctx.params['verb']!;
    if (!const {'approve', 'reject', 'pay'}.contains(verb)) {
      throw notFound('Action');
    }
    FleetEngine.decideToll(ctx.store, ctx.requireAuth(), t, verb);
    await ctx.store.commit();
    return ok(t);
  }, permission: ['fleet:tolls-approve', 'fleet:tolls-pay']),
  RouteDef('POST', '/fuel-vouchers', (ctx) async {
    final f = FleetEngine.issueFuel(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(f, status: 201);
  }, permission: ['fleet:fuel']),
  RouteDef('GET', '/fleet/pooling', (ctx) async {
    ctx.requireAuth();
    return ok(FleetEngine.pooling(ctx.store));
  }, permission: ['fleet:dispatch']),
  RouteDef(
    'GET',
    '/fleet/chat/:channel/messages',
    (ctx) async {
      final a = ctx.requireAuth();
      final raw = ctx.params['channel']!;
      final reqId = raw.startsWith('REQ:') ? raw.substring(4) : raw;
      final ch = ChatEngine.ensureReqChannel(ctx.store, reqId);
      if (!ChatEngine.isMember(ch, a.user.str('id'))) {
        ChatEngine.ensureReqChannel(ctx.store, reqId);
      }
      final fresh = ChatEngine.ensureReqChannel(ctx.store, reqId);
      await ctx.store.commit();
      return ok({
        'channelId': fresh['id'],
        'messages': ChatEngine.messages(ctx.store, fresh),
      });
    },
    permission: [
      'fleet:read',
      'fleet:drive',
      'fleet:request',
      'fleet:dispatch',
    ],
  ),
  RouteDef(
    'POST',
    '/fleet/chat/:channel/messages',
    (ctx) async {
      final a = ctx.requireAuth();
      final raw = ctx.params['channel']!;
      final reqId = raw.startsWith('REQ:') ? raw.substring(4) : raw;
      final ch = ChatEngine.ensureReqChannel(ctx.store, reqId);
      final rec = ChatEngine.send(ctx.store, a, ch, ctx.bodyObject());
      await ctx.store.commit();
      return ok(ChatEngine.messageWire(ctx.store, rec), status: 201);
    },
    permission: [
      'fleet:read',
      'fleet:drive',
      'fleet:request',
      'fleet:dispatch',
    ],
  ),
  RouteDef('POST', '/fuel-vouchers/:id/redeem', (ctx) async {
    final f = ctx.store.get(Col.fleetFuelLogs, ctx.params['id']!);
    if (f == null) throw notFound('Voucher');
    FleetEngine.redeemFuel(ctx.store, ctx.requireAuth(), f, ctx.bodyObject());
    await ctx.store.commit();
    return ok(f);
  }, permission: ['fleet:fuel']),
];
