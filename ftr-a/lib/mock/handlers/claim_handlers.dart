import 'package:bogcl_oneops/mock/engines/claim_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _statuses = {
  'DRAFT',
  'PENDING_MANAGER',
  'PENDING_FINANCE',
  'APPROVED',
  'SETTLED',
  'RETURNED',
  'REJECTED',
  'CANCELLED',
};

bool _participant(HandlerContext ctx, Json inst) {
  final me = ctx.requireAuth().user.str('id');
  return ctx.store
      .all(Col.workflowSteps)
      .any(
        (s) =>
            s['instanceId'] == inst['id'] &&
            (s.strList('approverUserIds').contains(me) ||
                s['delegatedToId'] == me ||
                s['decidedById'] == me),
      );
}

bool _inScope(HandlerContext ctx, String ownerId) {
  final owner = ctx.store.get(Col.employees, ownerId);
  if (owner == null) return false;
  return ctx.inScope(
    'claims:read',
    ownerEmployeeId: ownerId,
    departmentId: owner.obj('department').str('id'),
    siteId: owner.obj('site').str('id'),
    teamManagerId: owner.objOrNull('lineManager')?.strOrNull('id'),
  );
}

/// Owner, workflow participant, or `claims:read` scope; else 404.
Json _readable(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final c = ctx.store.get(Col.claims, ctx.params['id']!);
  if (c == null) throw notFound('Claim');
  if (c['employeeId'] == a.employeeId) return c;
  final instId = c.strOrNull('workflowInstanceId');
  final inst = instId == null
      ? null
      : ctx.store.get(Col.workflowInstances, instId);
  if ((inst != null && _participant(ctx, inst)) ||
      _inScope(ctx, c.str('employeeId'))) {
    return c;
  }
  throw notFound('Claim');
}

Json _owned(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final c = ctx.store.get(Col.claims, ctx.params['id']!);
  if (c == null || c['employeeId'] != a.employeeId) throw notFound('Claim');
  return c;
}

Json _ownedAdvance(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final adv = ctx.store.get(Col.advances, ctx.params['id']!);
  if (adv == null || adv['employeeId'] != a.employeeId) {
    throw notFound('Advance');
  }
  return adv;
}

List<RouteDef> claimRoutes() => [
  RouteDef('GET', '/claims/policy', (ctx) async {
    final a = ctx.requireAuth();
    return ok(ClaimEngine.policyWire(ctx.store, a.employee));
  }, permission: ['claims:create']),
  RouteDef('GET', '/claims/advances', (ctx) async {
    final a = ctx.requireAuth();
    final scope = ctx.query['scope'] ?? 'mine';
    final items = ctx.store.all(Col.advances).where((x) {
      if (scope == 'mine') return x['employeeId'] == a.employeeId;
      if (scope == 'payable') {
        return ctx.can('claims:settle') &&
            x['status'] == 'APPROVED' &&
            x['employeeId'] != a.employeeId;
      }
      throw validationError('scope', 'Unknown scope');
    }).toList();
    return paginate(
      [
        for (final x in sortBy(items, '-createdAt', '-createdAt'))
          ClaimEngine.advanceWire(ctx.store, x),
      ],
      ctx.query,
      defaultPageSize: 50,
    );
  }, permission: ['claims:create', 'claims:settle']),
  RouteDef('POST', '/claims/advances', (ctx) async {
    final a = ctx.requireAuth();
    final adv = ClaimEngine.createAdvance(ctx.store, a, ctx.bodyObject());
    await ctx.store.commit();
    return ok(ClaimEngine.advanceWire(ctx.store, adv), status: 201);
  }, permission: ['claims:advance']),
  RouteDef('POST', '/claims/advances/:id/cancel', (ctx) async {
    final a = ctx.requireAuth();
    final adv = _ownedAdvance(ctx);
    ClaimEngine.cancelAdvance(ctx.store, a, adv);
    await ctx.store.commit();
    return ok(ClaimEngine.advanceWire(ctx.store, adv));
  }, permission: ['claims:advance']),
  RouteDef('POST', '/claims/advances/:id/disburse', (ctx) async {
    final a = ctx.requireAuth();
    final adv = ctx.store.get(Col.advances, ctx.params['id']!);
    if (adv == null) throw notFound('Advance');
    ClaimEngine.disburse(ctx.store, a, adv);
    await ctx.store.commit();
    return ok(ClaimEngine.advanceWire(ctx.store, adv));
  }, permission: ['claims:settle']),
  RouteDef('GET', '/claims', (ctx) async {
    final a = ctx.requireAuth();
    final scope = ctx.query['scope'] ?? 'mine';
    if (!const {'mine', 'team', 'payable'}.contains(scope)) {
      throw validationError('scope', 'Unknown scope');
    }
    final status = ctx.query['status'];
    if (status != null && !_statuses.contains(status)) {
      throw validationError('status', 'Unknown status');
    }
    final type = ctx.query['type'];
    if (scope == 'payable' && !ctx.can('claims:settle')) {
      throw forbidden('Not allowed to view payables');
    }
    final items = ctx.store.all(Col.claims).where((c) {
      if (status != null && c['status'] != status) return false;
      if (type != null && c['type'] != type) return false;
      final owner = c.str('employeeId');
      switch (scope) {
        case 'mine':
          return owner == a.employeeId;
        case 'payable':
          return c['status'] == 'APPROVED' && owner != a.employeeId;
        default:
          return owner != a.employeeId &&
              c['status'] != 'DRAFT' &&
              _inScope(ctx, owner);
      }
    }).toList();
    return paginate(
      [
        for (final c in sortBy(items, '-createdAt', '-createdAt'))
          ClaimEngine.claimWire(ctx.store, c),
      ],
      ctx.query,
      defaultPageSize: 50,
    );
  }, permission: ['claims:create', 'claims:read', 'claims:settle']),
  RouteDef('POST', '/claims', (ctx) async {
    final a = ctx.requireAuth();
    final c = ClaimEngine.create(ctx.store, a, ctx.bodyObject());
    await ctx.store.commit();
    return ok(ClaimEngine.claimWire(ctx.store, c, detail: true), status: 201);
  }, permission: ['claims:create']),
  RouteDef('GET', '/claims/:id', (ctx) async {
    return ok(ClaimEngine.claimWire(ctx.store, _readable(ctx), detail: true));
  }, permission: ['claims:create', 'claims:read', 'claims:settle']),
  RouteDef('PUT', '/claims/:id', (ctx) async {
    final a = ctx.requireAuth();
    final c = _owned(ctx);
    ClaimEngine.apply(ctx.store, a, c, ctx.bodyObject());
    await ctx.store.commit();
    return ok(ClaimEngine.claimWire(ctx.store, c, detail: true));
  }, permission: ['claims:create']),
  RouteDef('POST', '/claims/:id/submit', (ctx) async {
    final a = ctx.requireAuth();
    final c = _owned(ctx);
    ClaimEngine.submit(ctx.store, a, c);
    await ctx.store.commit();
    return ok(ClaimEngine.claimWire(ctx.store, c, detail: true));
  }, permission: ['claims:submit']),
  RouteDef('POST', '/claims/:id/cancel', (ctx) async {
    final a = ctx.requireAuth();
    final c = _owned(ctx);
    ClaimEngine.cancel(ctx.store, a, c);
    await ctx.store.commit();
    return ok(ClaimEngine.claimWire(ctx.store, c, detail: true));
  }, permission: ['claims:create']),
  RouteDef('POST', '/claims/:id/pay', (ctx) async {
    final a = ctx.requireAuth();
    final c = ctx.store.get(Col.claims, ctx.params['id']!);
    if (c == null) throw notFound('Claim');
    ClaimEngine.pay(ctx.store, a, c);
    await ctx.store.commit();
    return ok(ClaimEngine.claimWire(ctx.store, c, detail: true));
  }, permission: ['claims:settle']),
];
