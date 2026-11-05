import 'package:bogcl_oneops/mock/engines/asset_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _asset(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final rec = ctx.store.get(Col.assets, ctx.params['id']!);
  if (rec == null || !AssetEngine.visible(ctx.store, a, rec)) {
    throw notFound('Equipment');
  }
  return rec;
}

Json _out(HandlerContext ctx, Json a) =>
    AssetEngine.wire(ctx.store, ctx.requireAuth(), a);

const _read = [
  'assets:read',
  'assets:maintain',
  'assets:loto',
  'assets:flag-defect',
];

List<RouteDef> assetRoutes() => [
  RouteDef('GET', '/assets/categories', (ctx) async {
    ctx.requireAuth();
    return ok(AssetPolicy.categories);
  }, permission: _read),
  RouteDef('GET', '/assets', (ctx) async {
    final a = ctx.requireAuth();
    final view = ctx.query['view'] ?? 'mine';
    final me = a.user.str('id');
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final items =
        ctx.store.all(Col.assets).where((raw) {
          if (!AssetEngine.visible(ctx.store, a, raw)) return false;
          final c = AssetEngine.openCustody(ctx.store, raw.str('id'));
          final fin = AssetEngine.financials(ctx.store, raw);
          final open = AssetEngine.openWos(ctx.store, raw.str('id'));
          final scoped = switch (view) {
            'mine' => c?['employeeUserId'] == me,
            'attention' => AssetEngine.attentionRank(ctx.store, raw) < 6,
            'custody-pending' => c != null && c['acknowledgedAt'] == null,
            'maintenance' => raw['stage'] == 'MAINTENANCE' || open.isNotEmpty,
            'calibration' =>
              raw['stage'] == 'CALIBRATION_DUE' ||
                  raw['calibrationExpired'] == true,
            'eol' => fin['isEolCandidate'] == true,
            'vehicles' => raw['assetClass'] == 'VEHICLE',
            'stock' => raw['stage'] == 'IN_STOCK',
            _ => true,
          };
          if (!scoped) return false;
          if (q.isEmpty) return true;
          return [
            raw.str('tag'),
            raw.str('name'),
            raw.strOrNull('nameBn') ?? '',
            raw.strOrNull('serialNo') ?? '',
            raw.strOrNull('oem') ?? '',
          ].any((x) => x.toLowerCase().contains(q));
        }).toList()..sort((x, y) {
          final rx = AssetEngine.attentionRank(ctx.store, x);
          final ry = AssetEngine.attentionRank(ctx.store, y);
          if (rx != ry) return rx.compareTo(ry);
          return x.str('name').compareTo(y.str('name'));
        });
    return paginate([for (final i in items) _out(ctx, i)], ctx.query);
  }, permission: _read),
  RouteDef('POST', '/assets/requisitions', (ctx) async {
    final rec = AssetEngine.requisition(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(rec, status: 201);
  }, permission: ['assets:read']),
  RouteDef('POST', '/assets', (ctx) async {
    final rec = AssetEngine.register(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec), status: 201);
  }, permission: ['assets:register', 'assets:commission']),
  RouteDef('GET', '/assets/:id', (ctx) async {
    return ok(_out(ctx, _asset(ctx)));
  }, permission: _read),
  RouteDef('POST', '/assets/:id/commission', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.commission(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:commission']),
  RouteDef('POST', '/assets/:id/custody', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.assignCustody(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:custody-assign']),
  RouteDef('POST', '/assets/:id/custody/ack', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.ackCustody(ctx.store, ctx.requireAuth(), rec);
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: _read),
  RouteDef('POST', '/assets/:id/custody/release', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.releaseCustody(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: _read),
  RouteDef('POST', '/assets/:id/flag-defect', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.flagDefect(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:flag-defect', 'assets:maintain']),
  RouteDef('POST', '/assets/:id/loto', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.loto(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:loto']),
  RouteDef('POST', '/assets/:id/certify', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.certify(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:calibrate']),
  RouteDef('POST', '/assets/:id/transfer', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.transfer(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:transfer']),
  RouteDef('POST', '/assets/:id/transfer/:tid/complete', (ctx) async {
    final rec = _asset(ctx);
    final t = ctx.store.get(Col.assetTransfers, ctx.params['tid']!);
    if (t == null || t['assetId'] != rec['id']) throw notFound('Transfer');
    AssetEngine.completeTransfer(
      ctx.store,
      ctx.requireAuth(),
      rec,
      t,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:transfer']),
  RouteDef('POST', '/assets/:id/decommission', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.decommission(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:decommission']),
  RouteDef('PATCH', '/assets/:id/disposal/checklist', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.patchChecklist(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:decommission', 'assets:write-off', 'assets:dispose']),
  RouteDef('POST', '/assets/:id/write-off', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.approveWriteOff(ctx.store, ctx.requireAuth(), rec);
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:write-off']),
  RouteDef('POST', '/assets/:id/dispose', (ctx) async {
    final rec = _asset(ctx);
    AssetEngine.disposeAsset(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['assets:dispose']),
  RouteDef('POST', '/work-orders/:id/start', (ctx) async {
    final wo = ctx.store.get(Col.assetWorkOrders, ctx.params['id']!);
    if (wo == null) throw notFound('Work order');
    final rec = ctx.store.get(Col.assets, wo.str('assetId'));
    if (rec == null ||
        !AssetEngine.visible(ctx.store, ctx.requireAuth(), rec)) {
      throw notFound('Equipment');
    }
    AssetEngine.startWo(ctx.store, ctx.requireAuth(), wo);
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: _read),
  RouteDef('POST', '/work-orders/:id/complete', (ctx) async {
    final wo = ctx.store.get(Col.assetWorkOrders, ctx.params['id']!);
    if (wo == null) throw notFound('Work order');
    final rec = ctx.store.get(Col.assets, wo.str('assetId'));
    if (rec == null ||
        !AssetEngine.visible(ctx.store, ctx.requireAuth(), rec)) {
      throw notFound('Equipment');
    }
    AssetEngine.completeWo(ctx.store, ctx.requireAuth(), wo, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: _read),
];
