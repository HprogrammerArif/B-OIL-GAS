import 'package:bogcl_oneops/mock/engines/workforce_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

Json _emp(HandlerContext ctx) {
  ctx.requireAuth();
  final rec = ctx.store.get(Col.employees, ctx.params['id']!);
  if (rec == null) throw notFound('Person');
  return rec;
}

Json _exit(HandlerContext ctx) {
  ctx.requireAuth();
  final rec = ctx.store.get(Col.exitClearances, ctx.params['id']!);
  if (rec == null) throw notFound('Exit file');
  return rec;
}

List<RouteDef> workforceRoutes() => [
  RouteDef('GET', '/employees/kpis', (ctx) async {
    ctx.requireAuth();
    return ok(WorkforceEngine.kpis(ctx.store));
  }, permission: ['employees:read']),
  RouteDef('GET', '/employees', (ctx) async {
    final a = ctx.requireAuth();
    final view = ctx.query['view'] ?? 'all';
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final me = a.employeeId;
    final items = ctx.store.all(Col.employees).where((e) {
      final st = e.str('status');
      final scoped = switch (view) {
        'team' => e.objOrNull('lineManager')?['id'] == me,
        'leaving' => st == 'OFFBOARDING',
        'former' => st == 'OFFBOARDED',
        _ => st != 'OFFBOARDED',
      };
      if (!scoped) return false;
      if (q.isEmpty) return true;
      return [
        e.str('fullName'),
        e.strOrNull('fullNameBn') ?? '',
        e.str('empCode'),
        e.obj('designation').strOrNull('title') ?? '',
        e.obj('department').strOrNull('name') ?? '',
        e.strOrNull('phone') ?? '',
      ].any((x) => x.toLowerCase().contains(q));
    }).toList()..sort((x, y) => x.str('fullName').compareTo(y.str('fullName')));
    return paginate(
      [for (final e in items) WorkforceEngine.directoryWire(ctx.store, a, e)],
      ctx.query,
      defaultPageSize: 50,
    );
  }, permission: ['employees:read']),
  RouteDef('POST', '/employees', (ctx) async {
    final rec = WorkforceEngine.create(
      ctx.store,
      ctx.requireAuth(),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(
      WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), rec),
      status: 201,
    );
  }, permission: ['employees:create']),
  RouteDef('GET', '/employees/:id', (ctx) async {
    final a = ctx.requireAuth();
    return ok(WorkforceEngine.detailWire(ctx.store, a, _emp(ctx)));
  }, permission: ['employees:read']),
  RouteDef('PATCH', '/employees/:id', (ctx) async {
    final rec = WorkforceEngine.patch(
      ctx.store,
      ctx.requireAuth(),
      _emp(ctx),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), rec));
  }, permission: ['employees:read']),
  RouteDef('POST', '/employees/:id/offboard', (ctx) async {
    WorkforceEngine.offboard(
      ctx.store,
      ctx.requireAuth(),
      _emp(ctx),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(
      WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), _emp(ctx)),
    );
  }, permission: ['employees:offboard']),
  RouteDef('POST', '/employees/:id/reactivate', (ctx) async {
    final rec = WorkforceEngine.reactivate(
      ctx.store,
      ctx.requireAuth(),
      _emp(ctx),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), rec));
  }, permission: ['employees:offboard']),
  RouteDef(
    'GET',
    '/exit-clearances',
    (ctx) async {
      final a = ctx.requireAuth();
      final mine = ctx.query['itemOwnerRole'] == 'me';
      final out = <Json>[];
      for (final c in ctx.store.all(Col.exitClearances)) {
        if (c['status'] != 'OPEN') continue;
        if (mine) {
          final keys = c
              .objList('items')
              .where(
                (i) =>
                    i['status'] == 'PENDING' &&
                    a.user.strList('roles').contains(i.str('ownerRole')),
              );
          if (keys.isEmpty) continue;
        }
        final emp = ctx.store.get(Col.employees, c.str('employeeId'));
        if (emp == null) continue;
        out.add({
          ...WorkforceEngine.directoryWire(ctx.store, a, emp),
          'exitClearance': {'id': c['id'], 'status': c['status']},
        });
      }
      return paginate(out, ctx.query);
    },
    permission: ['employees:clearance', 'employees:offboard', 'employees:read'],
  ),
  RouteDef('GET', '/exit-clearances/:id', (ctx) async {
    final a = ctx.requireAuth();
    final rec = _exit(ctx);
    final emp = ctx.store.get(Col.employees, rec.str('employeeId'));
    if (emp == null) throw notFound('Person');
    return ok(WorkforceEngine.detailWire(ctx.store, a, emp));
  }, permission: ['employees:read']),
  RouteDef('POST', '/exit-clearances/:id/items/:key/clear', (ctx) async {
    WorkforceEngine.clearItem(
      ctx.store,
      ctx.requireAuth(),
      _exit(ctx),
      ctx.params['key']!,
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    final emp = ctx.store.get(Col.employees, _exit(ctx).str('employeeId'))!;
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), emp));
  }, permission: ['employees:clearance']),
  RouteDef('POST', '/exit-clearances/:id/reclaim-assets', (ctx) async {
    WorkforceEngine.reclaim(ctx.store, ctx.requireAuth(), _exit(ctx));
    await ctx.store.commit();
    final emp = ctx.store.get(Col.employees, _exit(ctx).str('employeeId'))!;
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), emp));
  }, permission: ['employees:clearance']),
  RouteDef('POST', '/exit-clearances/:id/finalize', (ctx) async {
    WorkforceEngine.finalize(
      ctx.store,
      ctx.requireAuth(),
      _exit(ctx),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    final emp = ctx.store.get(Col.employees, _exit(ctx).str('employeeId'))!;
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), emp));
  }, permission: ['employees:offboard']),
  RouteDef('POST', '/exit-clearances/:id/cancel', (ctx) async {
    WorkforceEngine.cancel(
      ctx.store,
      ctx.requireAuth(),
      _exit(ctx),
      ctx.bodyObject(),
    );
    await ctx.store.commit();
    final emp = ctx.store.get(Col.employees, _exit(ctx).str('employeeId'))!;
    return ok(WorkforceEngine.detailWire(ctx.store, ctx.requireAuth(), emp));
  }, permission: ['employees:offboard']),
];
