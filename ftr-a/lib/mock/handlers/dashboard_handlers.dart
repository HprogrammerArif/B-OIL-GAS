import 'package:bogcl_oneops/mock/engines/dashboard_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

List<RouteDef> dashboardRoutes() => [
  RouteDef(
    'GET',
    '/dashboards/me',
    (ctx) async {
      return ok(DashboardEngine.me(ctx.store, ctx.requireAuth()));
    },
    permission: [
      'dashboards:read',
      'dashboards:hr',
      'dashboards:plant',
      'dashboards:transport',
    ],
  ),
  RouteDef('GET', '/me/dashboard', (ctx) async {
    return ok(DashboardEngine.me(ctx.store, ctx.requireAuth()));
  }),
  RouteDef('GET', '/dashboards/roi', (ctx) async {
    ctx.requireAuth();
    return ok(DashboardPolicy.roi);
  }, permission: ['dashboards:roi']),
  RouteDef('GET', '/briefings', (ctx) async {
    ctx.requireAuth();
    final items =
        ctx.store
            .all(Col.briefings)
            .where((b) => b['publishedAt'] != null)
            .toList()
          ..sort(
            (x, y) => y.str('publishedAt').compareTo(x.str('publishedAt')),
          );
    return ok(items);
  }, permission: ['briefings:read', 'briefings:create']),
  RouteDef('POST', '/briefings', (ctx) async {
    final rec = DashboardEngine.publishBriefing(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(rec, status: 201);
  }, permission: ['briefings:create']),
  RouteDef('POST', '/briefings/:id/listen', (ctx) async {
    DashboardEngine.listen(ctx.store, ctx.requireAuth(), ctx.params['id']!);
    await ctx.store.commit();
    return ok({'ok': true});
  }, permission: ['briefings:read']),
];
