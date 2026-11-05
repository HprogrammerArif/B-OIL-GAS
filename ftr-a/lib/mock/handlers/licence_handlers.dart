import 'package:bogcl_oneops/mock/engines/licence_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _lic(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final rec = ctx.store.get(Col.compliance, ctx.params['id']!);
  if (rec == null || !LicenceEngine.visible(ctx.store, a, rec)) {
    throw notFound('Licence');
  }
  return rec;
}

Json _out(HandlerContext ctx, Json lic) =>
    LicenceEngine.wire(ctx.store, ctx.requireAuth(), lic);

const _read = [
  'compliance:read',
  'compliance:manage',
  'compliance:dispatch-letter',
];

List<RouteDef> licenceRoutes() => [
  RouteDef('GET', '/licences/types', (ctx) async {
    ctx.requireAuth();
    return ok(LicencePolicy.types);
  }, permission: _read),
  RouteDef('GET', '/licences/bodies', (ctx) async {
    ctx.requireAuth();
    return ok(LicencePolicy.bodies);
  }, permission: _read),
  RouteDef('GET', '/licences', (ctx) async {
    final a = ctx.requireAuth();
    final view = ctx.query['view'] ?? 'mine';
    final me = a.user.str('id');
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final items =
        ctx.store.all(Col.compliance).where((raw) {
          if (!LicenceEngine.visible(ctx.store, a, raw)) return false;
          final days = LicenceEngine.daysToExpiry(ctx.store, raw);
          final band = LicenceEngine.urgency(days);
          final r = LicenceEngine.openRenewal(ctx.store, raw.str('id'));
          final scoped = switch (view) {
            'mine' => raw['ownerUserId'] == me,
            'critical' => band == 'CRITICAL',
            'warning' => band == 'WARNING',
            'expired' => band == 'EXPIRED' || raw['status'] == 'EXPIRED',
            'renewing' => r != null,
            _ => true,
          };
          if (!scoped) return false;
          if (q.isEmpty) return true;
          return [
            raw.str('title'),
            raw.strOrNull('titleBn') ?? '',
            raw.str('licenceNo'),
            raw.str('bodyCode'),
            raw.strOrNull('ref') ?? '',
          ].any((x) => x.toLowerCase().contains(q));
        }).toList()..sort((x, y) {
          final dx = LicenceEngine.daysToExpiry(ctx.store, x);
          final dy = LicenceEngine.daysToExpiry(ctx.store, y);
          return dx.compareTo(dy);
        });
    return paginate([for (final i in items) _out(ctx, i)], ctx.query);
  }, permission: _read),
  RouteDef('POST', '/licences', (ctx) async {
    final rec = LicenceEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec), status: 201);
  }, permission: ['compliance:create']),
  RouteDef('GET', '/licences/:id', (ctx) async {
    return ok(_out(ctx, _lic(ctx)));
  }, permission: _read),
  RouteDef('POST', '/licences/:id/renewals', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.startRenewal(ctx.store, ctx.requireAuth(), rec);
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['compliance:manage']),
  RouteDef('POST', '/licences/:id/fund', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.approveFund(ctx.store, ctx.requireAuth(), rec);
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['compliance:approve-fund']),
  RouteDef('POST', '/licences/:id/advance', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.advance(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['compliance:manage']),
  RouteDef('POST', '/licences/:id/back', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.back(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['compliance:manage']),
  RouteDef('PATCH', '/licences/:id/checklist/:itemId', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.tickItem(
      ctx.store,
      ctx.requireAuth(),
      rec,
      ctx.params['itemId']!,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: _read),
  RouteDef('POST', '/licences/:id/letters', (ctx) async {
    final rec = _lic(ctx);
    LicenceEngine.letter(ctx.store, ctx.requireAuth(), rec, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, rec));
  }, permission: ['compliance:dispatch-letter']),
];
