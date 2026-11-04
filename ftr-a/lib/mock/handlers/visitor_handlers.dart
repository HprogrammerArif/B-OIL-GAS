import 'package:bogcl_oneops/mock/engines/visitor_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';

final visitorHandlers = <RouteDef>[
  RouteDef('GET', '/visitors', (ctx) async {
    final visitors = VisitorEngine.list(ctx);
    return ok({'data': visitors, 'meta': {'total': visitors.length}});
  }),
  RouteDef('POST', '/visitors', (ctx) async {
    final visitor = VisitorEngine.create(ctx);
    return created({'data': visitor});
  }),
  RouteDef('GET', '/visitors/:id', (ctx) async {
    final v = ctx.store.get('visitors', ctx.params['id']!);
    if (v == null) throw notFound('Visitor not found');
    return ok({'data': v});
  }),
  RouteDef('POST', '/visitors/:id/check-in', (ctx) async {
    final v = VisitorEngine.checkIn(ctx, ctx.params['id']!);
    return ok({'data': v});
  }),
  RouteDef('POST', '/visitors/:id/check-out', (ctx) async {
    final v = VisitorEngine.checkOut(ctx, ctx.params['id']!);
    return ok({'data': v});
  }),
  RouteDef('PATCH', '/visitors/:id/ppe', (ctx) async {
    final v = VisitorEngine.updatePpe(ctx, ctx.params['id']!);
    return ok({'data': v});
  }),
  RouteDef('POST', '/visitors/:id/briefing', (ctx) async {
    final v = VisitorEngine.completeBriefing(ctx, ctx.params['id']!);
    return ok({'data': v});
  }),
  RouteDef('DELETE', '/visitors/:id', (ctx) async {
    final v = VisitorEngine.cancel(ctx, ctx.params['id']!);
    return ok({'data': v});
  }),
];
