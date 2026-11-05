import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

const _batchMax = 25;
const _batchMaxAmount = 500000;

/// Inbox chip categories (doc 03 §4.6) from the object type.
String workflowCategory(String objectType) => switch (objectType) {
  'NoteSheet' || 'AssetRequisition' || 'AssetDisposal' => 'PROCUREMENT',
  'Claim' || 'Advance' => 'CLAIMS',
  'VehicleRequisition' || 'TollClaim' => 'FLEET',
  'LeaveRequest' || 'Regularisation' => 'LEAVE',
  'ExitClearance' => 'HR',
  'Visit' => 'VISITORS',
  'SeatAllocation' => 'BUS',
  'LicenceRenewal' || 'Incident' => 'COMPLIANCE',
  _ => 'OTHER',
};

String _me(HandlerContext ctx) => ctx.requireAuth().user.str('id');

Json _instanceOr404(HandlerContext ctx) {
  final i = ctx.store.get(Col.workflowInstances, ctx.params['id']!);
  if (i == null) throw notFound('Workflow instance');
  return i;
}

Json _stepWire(MockStore store, Json s) => {
  'id': s['id'],
  'stepNo': s['stepNo'],
  'key': s['key'],
  'name': s['name'],
  'status': s['status'],
  'decision': s['decision'],
  'comment': s['comment'],
  'remark': s['remark'],
  'requiresSignature': s['requiresSignature'],
  'approvers': [
    for (final u in s.strList('approverUserIds'))
      ?WorkflowEngine.personRef(store, u),
  ],
  'delegatedTo': WorkflowEngine.personRef(store, s.strOrNull('delegatedToId')),
  'decidedBy': WorkflowEngine.personRef(store, s.strOrNull('decidedById')),
  'onBehalfOf': [
    for (final u in s.strList('onBehalfOfUserIds'))
      ?WorkflowEngine.personRef(store, u),
  ],
  'activatedAt': s['activatedAt'],
  'dueAt': s['dueAt'],
  'decidedAt': s['decidedAt'],
  'sla': s['status'] == 'ACTIVE' ? WorkflowEngine.sla(store, s) : null,
};

Json _instanceWire(MockStore store, Json i) => {
  'id': i['id'],
  'objectType': i['objectType'],
  'objectId': i['objectId'],
  'status': i['status'],
  'templateKey': i['templateKey'],
  'currentStepNo': i['currentStepNo'],
  'summary': i['summary'],
  'initiator': WorkflowEngine.personRef(store, i.str('initiatorId')),
  'submittedAt': i['submittedAt'],
  'completedAt': i['completedAt'],
  'rejectionExplanation': i['rejectionExplanation'],
};

/// Active steps the caller can decide, as inbox rows.
List<Json> _inboxRows(HandlerContext ctx) {
  final me = _me(ctx);
  final rows = <Json>[];
  for (final inst in ctx.store.all(Col.workflowInstances)) {
    if (inst['status'] != 'IN_REVIEW') continue;
    for (final s in WorkflowEngine.stepsOf(ctx.store, inst)) {
      if (s['status'] != 'ACTIVE') continue;
      final direct = s.strList('approverUserIds').contains(me);
      if (!direct && s['delegatedToId'] != me) continue;
      final summary = inst.obj('summary');
      rows.add({
        'instanceId': inst['id'],
        'stepId': s['id'],
        'objectType': inst['objectType'],
        'objectId': inst['objectId'],
        'category': workflowCategory(inst.str('objectType')),
        'summary': summary,
        'amount': summary['amount'],
        'urgency': summary['urgency'] ?? 'NORMAL',
        'stepKey': s['key'],
        'stepName': s['name'],
        'requiresSignature': s['requiresSignature'],
        'submittedAt': inst['submittedAt'],
        'activatedAt': s['activatedAt'],
        'dueAt': s['dueAt'],
        'sla': WorkflowEngine.sla(ctx.store, s),
        'initiator': WorkflowEngine.personRef(
          ctx.store,
          inst.str('initiatorId'),
        ),
        'viaDelegation': !direct,
      });
    }
  }
  return rows;
}

List<Json> _filteredInbox(HandlerContext ctx) {
  final q = ctx.query;
  final types = csv(q['objectType']);
  return _inboxRows(ctx).where((r) {
    if (types.isNotEmpty && !types.contains(r['objectType'])) return false;
    if (q['category'] != null && r['category'] != q['category']) return false;
    if (q['urgency'] != null && r['urgency'] != q['urgency']) return false;
    if (q['slaBreachedOnly'] == 'true' && r.obj('sla')['state'] != 'overdue') {
      return false;
    }
    final summary = r.obj('summary');
    return matchesSearch(q['q'], [
      summary.strOrNull('title'),
      summary.strOrNull('refNo'),
    ]);
  }).toList();
}

Future<MockResponse> _inbox(HandlerContext ctx) async {
  final sort = ctx.query['sort'];
  final rows = _filteredInbox(ctx);
  return paginate(sortBy(rows, sort, 'dueAt'), ctx.query);
}

List<RouteDef> workflowRoutes() => [
  const RouteDef(
    'GET',
    '/workflow/inbox',
    permission: ['workflow:inbox'],
    _inbox,
  ),
  // doc 00 §6.1 wording.
  const RouteDef(
    'GET',
    '/approvals/inbox',
    permission: ['workflow:inbox'],
    _inbox,
  ),
  RouteDef(
    'GET',
    '/workflow/inbox/summary',
    permission: const ['workflow:inbox'],
    (ctx) async {
      final rows = _inboxRows(ctx);
      final states = [for (final r in rows) r.obj('sla')];
      var total = 0.0;
      for (final r in rows) {
        final a = r['amount'];
        if (a is num) total += a;
      }
      return ok({
        'pending': rows.length,
        'breachingIn12h': rows.where((r) {
          final due = r.strOrNull('dueAt');
          if (due == null || r.obj('sla')['state'] == 'overdue') return false;
          return DateTime.parse(due).millisecondsSinceEpoch -
                  ctx.store.nowMs() <
              12 * 60 * 60 * 1000;
        }).length,
        'breached': states.where((s) => s['state'] == 'overdue').length,
        'totalAmount': total.toStringAsFixed(2),
      });
    },
  ),
  // Colleagues the caller may delegate a decision to.
  RouteDef('GET', '/workflow/delegates', permission: const ['workflow:act'], (
    ctx,
  ) async {
    final me = _me(ctx);
    final rows = <Json>[];
    for (final u in ctx.store.all(Col.users)) {
      if (u['id'] == me || u['isActive'] != true) continue;
      final grants = grantsForRoles(u.strList('roles'));
      if (!grants.any((g) => g['key'] == 'workflow:act')) continue;
      final ref = WorkflowEngine.personRef(ctx.store, u.str('id'));
      if (ref != null) rows.add(ref);
    }
    return ok(sortBy(rows, 'name', 'name'));
  }),
  RouteDef('GET', '/workflow/history', permission: const ['workflow:inbox'], (
    ctx,
  ) async {
    final me = _me(ctx);
    final decision = ctx.query['decision'];
    if (decision != null &&
        !const {'APPROVED', 'REJECTED', 'RETURNED'}.contains(decision)) {
      throw validationError('decision', 'Unknown decision');
    }
    final from = DateTime.tryParse(ctx.query['from'] ?? '');
    final to = DateTime.tryParse(ctx.query['to'] ?? '');
    final rows = <Json>[];
    for (final s in ctx.store.all(Col.workflowSteps)) {
      if (s['decidedById'] != me) continue;
      final inst = ctx.store.get(Col.workflowInstances, s.str('instanceId'));
      if (inst == null) continue;
      rows.add({
        'kind': 'DECISION',
        'instanceId': inst['id'],
        'objectType': inst['objectType'],
        'summary': inst['summary'],
        'instanceStatus': inst['status'],
        'stepName': s['name'],
        // BR-17-05: always the actual decision, never a constant label.
        'decision': s['decision'],
        'comment': s['comment'],
        'at': s['decidedAt'],
        'onBehalfOf': [
          for (final u in s.strList('onBehalfOfUserIds'))
            ?WorkflowEngine.personRef(ctx.store, u),
        ],
      });
    }
    if (decision == null) {
      for (final inst in ctx.store.all(Col.workflowInstances)) {
        if (inst['initiatorId'] != me) continue;
        rows.add({
          'kind': 'INITIATED',
          'instanceId': inst['id'],
          'objectType': inst['objectType'],
          'summary': inst['summary'],
          'instanceStatus': inst['status'],
          'stepName': null,
          'decision': null,
          'comment': null,
          'at': inst['submittedAt'],
          'onBehalfOf': <Json>[],
        });
      }
    }
    final filtered = rows.where((r) {
      if (decision != null && r['decision'] != decision) return false;
      final at = DateTime.tryParse(r.strOrNull('at') ?? '');
      if (at == null) return true;
      if (from != null && at.isBefore(from)) return false;
      if (to != null && at.isAfter(to)) return false;
      return true;
    }).toList();
    return paginate(sortBy(filtered, '-at', '-at'), ctx.query);
  }),
  RouteDef('GET', '/workflow/instances/:id', (ctx) async {
    final inst = _instanceOr404(ctx);
    final me = _me(ctx);
    if (!WorkflowEngine.isParticipant(ctx.store, inst, me) &&
        !ctx.can('workflow:view-all')) {
      throw forbidden();
    }
    return ok({
      ..._instanceWire(ctx.store, inst),
      'steps': [
        for (final s in WorkflowEngine.stepsOf(ctx.store, inst))
          _stepWire(ctx.store, s),
      ],
      'actions': [
        for (final a in WorkflowEngine.actionsOf(ctx.store, inst.str('id')))
          {
            'id': a['id'],
            'type': a['type'],
            'stepId': a['stepId'],
            'comment': a['comment'],
            'actor': WorkflowEngine.personRef(ctx.store, a.str('actorId')),
            'createdAt': a['createdAt'],
          },
      ],
    });
  }),
  RouteDef('POST', '/workflow/instances/:id/actions', (ctx) async {
    // WITHDRAW and COMMENT are open to initiators/participants, who need not
    // hold `workflow:act`; the engine enforces who may do what.
    final body = ctx.bodyObject();
    final type = body['type'];
    if (type is! String) {
      throw validationError('type', 'Action type is required');
    }
    if (type != 'WITHDRAW' && type != 'COMMENT') {
      ctx.requirePermission('workflow:act');
    }
    final sig = body['signature'];
    final details = body['details'];
    final instance = WorkflowEngine.act(
      ctx.store,
      instanceId: ctx.params['id']!,
      actorUserId: _me(ctx),
      type: type,
      comment: body['comment'] as String?,
      signature: sig is Map ? Map<String, Object?>.from(sig) : null,
      delegateToUserId: body['delegateToUserId'] as String?,
      details: details is Map ? Map<String, Object?>.from(details) : null,
    );
    await ctx.store.commit();
    return ok({
      ..._instanceWire(ctx.store, instance),
      'steps': [
        for (final s in WorkflowEngine.stepsOf(ctx.store, instance))
          _stepWire(ctx.store, s),
      ],
    });
  }),
  RouteDef(
    'POST',
    '/workflow/instances/batch-actions',
    permission: const ['workflow:act'],
    (ctx) async {
      final body = ctx.bodyObject();
      final ids = body['instanceIds'];
      if (ids is! List || ids.isEmpty || ids.length > _batchMax) {
        throw validationError(
          'instanceIds',
          'Select between 1 and $_batchMax requests',
        );
      }
      if (body['type'] != 'APPROVE') {
        throw validationError('type', 'Only APPROVE is allowed in a batch');
      }
      final me = _me(ctx);
      final results = <Json>[];
      for (final raw in ids) {
        final id = '$raw';
        try {
          final inst = ctx.store.get(Col.workflowInstances, id);
          if (inst == null) throw notFound('Workflow instance');
          final step = WorkflowEngine.actionableStep(ctx.store, inst, me);
          final amount = inst.obj('summary')['amount'];
          if (step != null &&
              (step['requiresSignature'] == true ||
                  (amount is num && amount > _batchMaxAmount))) {
            throw policyViolation(
              'BATCH_NOT_ALLOWED',
              'This request needs an individual decision',
            );
          }
          WorkflowEngine.act(
            ctx.store,
            instanceId: id,
            actorUserId: me,
            type: 'APPROVE',
            comment: body['comment'] as String?,
          );
          results.add({'instanceId': id, 'ok': true});
        } on HttpError catch (e) {
          results.add({
            'instanceId': id,
            'ok': false,
            'error': {
              'code': e.code.wire,
              'message': e.message,
              'rule': e.details.firstOrNull?['rule'],
            },
          });
        }
      }
      await ctx.store.commit();
      return ok(results);
    },
  ),
  RouteDef(
    'GET',
    '/workflow/templates',
    permission: const ['workflow:templates'],
    (ctx) async => ok([
      for (final t in ctx.store.all(Col.workflowTemplates))
        {
          'id': t['id'],
          'key': t['key'],
          'objectType': t['objectType'],
          'version': t['version'],
          'name': t['name'],
          'isActive': t['isActive'],
        },
    ]),
  ),
  // Route preview for forms: which steps would apply to this request.
  RouteDef('GET', '/workflow/templates/resolve', (ctx) async {
    final key = ctx.query['templateKey'];
    final template = key == null
        ? null
        : WorkflowEngine.latestTemplate(ctx.store, key);
    if (template == null) throw notFound('Workflow template');
    final summary = <String, Object?>{
      for (final e in ctx.query.entries)
        e.key: num.tryParse(e.value) ?? e.value,
    };
    return ok({
      'key': template['key'],
      'version': template['version'],
      'steps': [
        for (final s in template.obj('definition').objList('steps'))
          if (WorkflowEngine.evalCondition(s.strOrNull('condition'), summary))
            {
              'key': s['key'],
              'name': s['name'],
              'slaHours': s['slaHours'],
              'requiresSignature': s['requiresSignature'],
            },
      ],
    });
  }),
];
