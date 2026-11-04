import 'package:bogcl_oneops/mock/engines/fleet_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

final fleetHandlers = <RouteDef>[
  // Vehicles
  RouteDef('GET', '/fleet/vehicles', (ctx) async {
    ctx.requireAuth();
    final all = ctx.store.all(Col.fleetVehicles);
    return ok({'data': all, 'meta': {'total': all.length}});
  }),
  RouteDef('GET', '/fleet/vehicles/:id', (ctx) async {
    ctx.requireAuth();
    final v = ctx.store.get(Col.fleetVehicles, ctx.params['id']!);
    if (v == null) throw notFound('Vehicle not found');
    return ok({'data': v});
  }),
  // Drivers
  RouteDef('GET', '/fleet/drivers', (ctx) async {
    ctx.requireAuth();
    final all = ctx.store.all(Col.fleetDrivers);
    return ok({'data': all, 'meta': {'total': all.length}});
  }),
  // Requisitions
  RouteDef('GET', '/fleet/requisitions', (ctx) async {
    final reqs = FleetEngine.listRequisitions(ctx);
    return ok({'data': reqs, 'meta': {'total': reqs.length}});
  }),
  RouteDef('POST', '/fleet/requisitions', (ctx) async {
    final req = FleetEngine.createRequisition(ctx);
    return created({'data': req});
  }),
  RouteDef('GET', '/fleet/requisitions/:id', (ctx) async {
    ctx.requireAuth();
    final r = ctx.store.get(Col.fleetRequisitions, ctx.params['id']!);
    if (r == null) throw notFound('Requisition not found');
    return ok({'data': r});
  }),
  RouteDef('POST', '/fleet/requisitions/:id/assign', (ctx) async {
    final r = FleetEngine.assignRequisition(ctx, ctx.params['id']!);
    return ok({'data': r});
  }),
  RouteDef('POST', '/fleet/requisitions/:id/start', (ctx) async {
    final r = FleetEngine.startTrip(ctx, ctx.params['id']!);
    return ok({'data': r});
  }),
  RouteDef('POST', '/fleet/requisitions/:id/complete', (ctx) async {
    final r = FleetEngine.completeTrip(ctx, ctx.params['id']!);
    return ok({'data': r});
  }),
  RouteDef('POST', '/fleet/requisitions/:id/reject', (ctx) async {
    final r = FleetEngine.rejectRequisition(ctx, ctx.params['id']!);
    return ok({'data': r});
  }),
  // Fuel
  RouteDef('POST', '/fleet/vehicles/:id/fuel', (ctx) async {
    final log = FleetEngine.issueFuel(ctx, ctx.params['id']!);
    return created({'data': log});
  }),
  RouteDef('GET', '/fleet/fuel-logs', (ctx) async {
    ctx.requireAuth();
    final all = ctx.store.all(Col.fleetFuelLogs);
    return ok({'data': all, 'meta': {'total': all.length}});
  }),
];
