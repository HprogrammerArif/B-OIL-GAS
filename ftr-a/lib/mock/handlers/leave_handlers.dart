import 'package:bogcl_oneops/mock/engines/leave_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _statuses = {'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'};

/// Owner, a participant of its workflow, or anyone `leave:read` reaches.
/// Everyone else gets 404 so ids do not leak.
Json _readable(HandlerContext ctx) {
  final a = ctx.requireAuth();
  final l = ctx.store.get(Col.leaveRequests, ctx.params['id']!);
  if (l == null) throw notFound('Leave request');
  final ownerId = l.str('employeeId');
  if (ownerId == a.employeeId) return l;
  final instId = l.strOrNull('workflowInstanceId');
  final inst = instId == null
      ? null
      : ctx.store.get(Col.workflowInstances, instId);
  final me = a.user.str('id');
  final participant =
      inst != null &&
      ctx.store
          .all(Col.workflowSteps)
          .any(
            (s) =>
                s['instanceId'] == inst['id'] &&
                (s.strList('approverUserIds').contains(me) ||
                    s['delegatedToId'] == me ||
                    s['decidedById'] == me),
          );
  if (participant || _visible(ctx, ownerId)) return l;
  throw notFound('Leave request');
}

bool _visible(HandlerContext ctx, String ownerEmployeeId) {
  final owner = ctx.store.get(Col.employees, ownerEmployeeId);
  if (owner == null) return false;
  return ctx.inScope(
    'leave:read',
    ownerEmployeeId: ownerEmployeeId,
    departmentId: owner.obj('department').str('id'),
    siteId: owner.obj('site').str('id'),
    teamManagerId: owner.objOrNull('lineManager')?.strOrNull('id'),
  );
}

List<RouteDef> leaveRoutes() => [
  RouteDef('GET', '/leave/types', (ctx) async {
    ctx.requireAuth();
    return ok([
      for (final t in LeaveEngine.types(ctx.store)) LeaveEngine.typeWire(t),
    ]);
  }),
  RouteDef('GET', '/leave/policy', (ctx) async {
    ctx.requireAuth();
    return ok(LeavePolicy.toWire());
  }),
  RouteDef('GET', '/leave/balances', (ctx) async {
    final a = ctx.requireAuth();
    final year =
        int.tryParse(ctx.query['year'] ?? '') ??
        LeaveEngine.yearOf(WorkCalendar.today());
    return ok(LeaveEngine.balances(ctx.store, a.employeeId, year));
  }, permission: ['leave:request', 'leave:read']),
  RouteDef('GET', '/leave/requests', (ctx) async {
    final a = ctx.requireAuth();
    final scope = ctx.query['scope'] ?? 'mine';
    if (scope != 'mine' && scope != 'team') {
      throw validationError('scope', 'Unknown scope');
    }
    final status = ctx.query['status'];
    if (status != null && !_statuses.contains(status)) {
      throw validationError('status', 'Unknown status');
    }
    final items = ctx.store.all(Col.leaveRequests).where((l) {
      if (status != null && l['status'] != status) return false;
      final owner = l.str('employeeId');
      if (scope == 'mine') return owner == a.employeeId;
      return owner != a.employeeId && _visible(ctx, owner);
    }).toList();
    return paginate(
      [
        for (final l in sortBy(items, '-createdAt', '-createdAt'))
          LeaveEngine.requestWire(ctx.store, l),
      ],
      ctx.query,
      defaultPageSize: 30,
    );
  }, permission: ['leave:request', 'leave:read', 'leave:approve']),
  RouteDef('POST', '/leave/requests', (ctx) async {
    final a = ctx.requireAuth();
    final leave = LeaveEngine.create(ctx.store, a, ctx.bodyObject());
    await ctx.store.commit();
    return ok(
      LeaveEngine.detailWire(ctx.store, leave, a.employeeId),
      status: 201,
    );
  }, permission: ['leave:request']),
  RouteDef('GET', '/leave/requests/:id', (ctx) async {
    final a = ctx.requireAuth();
    return ok(LeaveEngine.detailWire(ctx.store, _readable(ctx), a.employeeId));
  }, permission: ['leave:request', 'leave:read', 'leave:approve']),
  RouteDef('POST', '/leave/requests/:id/cancel', (ctx) async {
    final a = ctx.requireAuth();
    final l = _readable(ctx);
    if (l['employeeId'] != a.employeeId) {
      throw forbidden('Only the requester can cancel');
    }
    if (!LeaveEngine.canCancel(l, a.employeeId)) {
      throw invalidTransition('This leave can no longer be cancelled');
    }
    final raw = ctx.req.body is Map ? ctx.bodyObject()['reason'] : null;
    final reason = raw is String && raw.trim().isNotEmpty ? raw.trim() : null;
    if (reason != null && reason.length > 500) {
      throw validationError('reason', 'Reason is too long');
    }
    LeaveEngine.cancel(ctx.store, a, l, reason);
    await ctx.store.commit();
    return ok(LeaveEngine.detailWire(ctx.store, l, a.employeeId));
  }, permission: ['leave:request']),
];
