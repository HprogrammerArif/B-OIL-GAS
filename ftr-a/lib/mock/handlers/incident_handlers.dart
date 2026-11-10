import 'package:bogcl_oneops/mock/engines/incident_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _inc(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final i = ctx.store.get(Col.incidents, ctx.params['id']!);
  if (i == null || !IncidentEngine.visible(ctx.store, a, i)) {
    throw notFound('Incident');
  }
  return i;
}

Json _out(HandlerContext ctx, Json i) =>
    IncidentEngine.wire(ctx.store, ctx.requireAuth(), i);

const _read = [
  'incidents:read',
  'incidents:report',
  'incidents:triage',
  'incidents:manage',
];

List<RouteDef> incidentRoutes() => [
  RouteDef('GET', '/incidents/zones', (ctx) async {
    ctx.requireAuth();
    final site = ctx.query['siteId'];
    return ok([
      for (final z in IncidentPolicy.zones)
        if (site == null || z['siteId'] == site) z,
    ]);
  }, permission: ['incidents:report', 'incidents:read']),
  RouteDef('GET', '/incidents', (ctx) async {
    final a = ctx.requireAuth();
    final view = ctx.query['view'] ?? 'mine';
    final me = a.user.str('id');
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final items = ctx.store.all(Col.incidents).where((i) {
      if (!IncidentEngine.visible(ctx.store, a, i)) return false;
      final capas = IncidentEngine.capasOf(ctx.store, i.str('id'));
      final scoped = switch (view) {
        'mine' =>
          i['reporterUserId'] == me ||
              i['investigatorUserId'] == me ||
              capas.any((c) => c['ownerUserId'] == me),
        'open' => i['stage'] != 'CLOSED',
        'serious' =>
          (i['riskCategory'] == 'HIGH' || i['riskCategory'] == 'EXTREME') &&
              i['stage'] != 'CLOSED',
        'statutory' =>
          i['statutoryReportable'] == true && i['statutoryReceiptNo'] == null,
        'to-triage' => i['stage'] == 'REPORTED',
        'my-capa' => capas.any((c) => c['ownerUserId'] == me),
        _ => true,
      };
      if (!scoped) return false;
      if (q.isEmpty) return true;
      return [
        i.str('incidentNo'),
        i.str('title'),
        i.str('description'),
        i.strOrNull('zone') ?? '',
      ].any((x) => x.toLowerCase().contains(q));
    }).toList();
    final sorted = sortBy(items, ctx.query['sort'], '-occurredAt');
    return paginate([for (final i in sorted) _out(ctx, i)], ctx.query);
  }, permission: _read),
  RouteDef('POST', '/incidents', (ctx) async {
    final i = IncidentEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, i), status: 201);
  }, permission: ['incidents:report']),
  RouteDef('GET', '/incidents/:id', (ctx) async {
    return ok(_out(ctx, _inc(ctx)));
  }, permission: _read),
  RouteDef('POST', '/incidents/:id/attachments', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.addAttachment(
      ctx.store,
      ctx.requireAuth(),
      i,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:report', 'incidents:read', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/triage', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.triage(ctx.store, ctx.requireAuth(), i, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:triage']),
  RouteDef('POST', '/incidents/:id/investigate', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.investigate(ctx.store, ctx.requireAuth(), i);
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:read', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/rca', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.saveRca(ctx.store, ctx.requireAuth(), i, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:read', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/capas', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.addCapa(ctx.store, ctx.requireAuth(), i, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:capa', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/review', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.review(ctx.store, ctx.requireAuth(), i);
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:close', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/close', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.close(ctx.store, ctx.requireAuth(), i, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:close', 'incidents:manage']),
  RouteDef('POST', '/incidents/:id/statutory', (ctx) async {
    final i = _inc(ctx);
    IncidentEngine.fileStatutory(
      ctx.store,
      ctx.requireAuth(),
      i,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, i));
  }, permission: ['incidents:statutory']),
  RouteDef('POST', '/capas/:id/start', (ctx) async {
    final c = ctx.store.get(Col.incidentCapas, ctx.params['id']!);
    if (c == null) throw notFound('Fix');
    IncidentEngine.startCapa(ctx.store, ctx.requireAuth(), c);
    await ctx.store.commit();
    final i = ctx.store.get(Col.incidents, c.str('incidentId'))!;
    return ok(_out(ctx, i));
  }, permission: ['incidents:read', 'incidents:capa']),
  RouteDef('POST', '/capas/:id/complete', (ctx) async {
    final c = ctx.store.get(Col.incidentCapas, ctx.params['id']!);
    if (c == null) throw notFound('Fix');
    IncidentEngine.completeCapa(
      ctx.store,
      ctx.requireAuth(),
      c,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    final i = ctx.store.get(Col.incidents, c.str('incidentId'))!;
    return ok(_out(ctx, i));
  }, permission: ['incidents:read', 'incidents:capa']),
  RouteDef('POST', '/capas/:id/verify', (ctx) async {
    final c = ctx.store.get(Col.incidentCapas, ctx.params['id']!);
    if (c == null) throw notFound('Fix');
    IncidentEngine.verifyCapa(ctx.store, ctx.requireAuth(), c);
    await ctx.store.commit();
    final i = ctx.store.get(Col.incidents, c.str('incidentId'))!;
    return ok(_out(ctx, i));
  }, permission: ['incidents:capa-verify']),
];
