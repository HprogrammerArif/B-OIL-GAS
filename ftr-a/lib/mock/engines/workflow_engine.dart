import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Lifecycle events delivered to the owning module (doc 06 §16.3, BR-17-10).
enum WorkflowEvent {
  submitted,
  stepApproved,
  approved,
  rejected,
  returned,
  withdrawn,
}

/// Module callback. Runs inside the same commit as the decision.
typedef WorkflowHook = void Function(
  MockStore store,
  Json instance,
  WorkflowEvent event,
);

/// Registry of module callbacks keyed by `objectType`.
abstract final class WorkflowHooks {
  static final Map<String, WorkflowHook> _hooks = {};

  static void register(String objectType, WorkflowHook hook) =>
      _hooks[objectType] = hook;

  static void fire(MockStore store, Json instance, WorkflowEvent event) =>
      _hooks[instance.str('objectType')]?.call(store, instance, event);
}

const Set<String> _terminal = {
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'CANCELLED',
};
const Set<String> _signatureMethods = {'DRAWN', 'TYPED', 'STAMP', 'UPLOADED'};
const int _hourMs = 60 * 60 * 1000;

/// Generic approval engine (doc 00 §6.1, doc 06 MOD-17): routes any object
/// through a versioned template, with parallel groups, conditions, SLA clocks,
/// delegation and a full action trail. Modules call [submit] and [act]; they
/// never hand-roll approval state.
abstract final class WorkflowEngine {
  // ---- Conditions (safe subset: `field op literal`, joined by && / ||) ----

  static final RegExp _cmp = RegExp(
    r'^\s*(\w+)\s*(>=|<=|==|!=|>|<)\s*(.+?)\s*$',
  );

  /// Evaluates a restricted expression over [summary]. Empty means true.
  static bool evalCondition(String? expr, Json summary) {
    if (expr == null || expr.trim().isEmpty) return true;
    return expr
        .split('||')
        .any((or) => or.split('&&').every((term) => _term(term, summary)));
  }

  static bool _term(String term, Json summary) {
    final m = _cmp.firstMatch(term);
    if (m == null) return false;
    final actual = summary[m.group(1)];
    final op = m.group(2)!;
    var raw = m.group(3)!;
    if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
      raw = raw.substring(1, raw.length - 1);
      return switch (op) {
        '==' => actual?.toString() == raw,
        '!=' => actual?.toString() != raw,
        _ => false,
      };
    }
    final b = num.tryParse(raw);
    final a = actual is num ? actual : num.tryParse('$actual');
    if (a == null || b == null) return false;
    return switch (op) {
      '>' => a > b,
      '>=' => a >= b,
      '<' => a < b,
      '<=' => a <= b,
      '==' => a == b,
      _ => a != b,
    };
  }

  // ---- Lookups ----

  static Json? latestTemplate(MockStore store, String key) {
    Json? best;
    for (final t in store.all(Col.workflowTemplates)) {
      if (t['key'] != key || t['isActive'] != true) continue;
      if (best == null || t.intVal('version') > best.intVal('version')) {
        best = t;
      }
    }
    return best;
  }

  /// Steps of the instance's current round, in route order.
  static List<Json> stepsOf(MockStore store, Json instance) =>
      store
          .all(Col.workflowSteps)
          .where(
            (s) =>
                s['instanceId'] == instance['id'] &&
                s['round'] == instance['round'],
          )
          .toList()
        ..sort((a, b) {
          final c = a.intVal('stepNo').compareTo(b.intVal('stepNo'));
          return c != 0 ? c : a.str('id').compareTo(b.str('id'));
        });

  static List<Json> actionsOf(MockStore store, String instanceId) =>
      store
          .all(Col.workflowActions)
          .where((a) => a['instanceId'] == instanceId)
          .toList()
        ..sort((a, b) => a.str('id').compareTo(b.str('id')));

  /// `{userId, name, nameBn, title}` for a user id.
  static Json? personRef(MockStore store, String? userId) {
    if (userId == null) return null;
    final user = store.get(Col.users, userId);
    final emp = user == null
        ? null
        : store.get(Col.employees, user.str('employeeId'));
    if (emp == null) return null;
    return {
      'userId': userId,
      'name': emp['fullName'],
      'nameBn': emp['fullNameBn'],
      'title': emp.obj('designation')['title'],
      'phone': emp['phone'],
    };
  }

  static String _personName(MockStore store, String? userId, bool bn) {
    final p = personRef(store, userId);
    if (p == null) return '';
    return (bn ? p['nameBn'] : null) as String? ?? p['name']! as String;
  }

  // ---- Approver resolution (BR-17-02) ----

  static List<String> _usersWithRole(MockStore store, String role) => [
    for (final u in store.all(Col.users))
      if (u['isActive'] == true && u.strList('roles').contains(role))
        u.str('id'),
  ];

  static String? _lineManagerUser(MockStore store, String userId) {
    final user = store.get(Col.users, userId);
    final emp = user == null
        ? null
        : store.get(Col.employees, user.str('employeeId'));
    final managerEmpId = emp?.objOrNull('lineManager')?.strOrNull('id');
    if (managerEmpId == null) return null;
    final uid = store.get(Col.employees, managerEmpId)?.strOrNull('userId');
    final mgr = uid == null ? null : store.get(Col.users, uid);
    return mgr != null && mgr['isActive'] == true ? uid : null;
  }

  static List<String> resolveApprovers(
    MockStore store,
    Json step,
    String initiatorUserId,
    Json summary,
  ) {
    final ref = step.strOrNull('approverRef');
    final found = switch (step.str('approverRule')) {
      'ROLE' => ref == null ? <String>[] : _usersWithRole(store, ref),
      'USER' => ref == null ? <String>[] : [ref],
      'LINE_MANAGER' => [?_lineManagerUser(store, initiatorUserId)],
      'DEPARTMENT_HEAD' => _departmentHeads(store, initiatorUserId, summary),
      _ => <String>[],
    };
    // Nobody approves their own request.
    return found.where((u) => u != initiatorUserId).toList();
  }

  static List<String> _departmentHeads(
    MockStore store,
    String initiatorUserId,
    Json summary,
  ) {
    final user = store.get(Col.users, initiatorUserId);
    final initEmp = user == null
        ? null
        : store.get(Col.employees, user.str('employeeId'));
    final deptId =
        summary.strOrNull('departmentId') ??
        initEmp?.objOrNull('department')?.strOrNull('id');
    final heads = [
      for (final id in _usersWithRole(store, 'HOD'))
        if (store
                .get(Col.employees, store.get(Col.users, id)!.str('employeeId'))
                ?.objOrNull('department')
                ?.strOrNull('id') ==
            deptId)
          id,
    ];
    if (heads.isNotEmpty) return heads;
    // BR-17-02 fallback: the initiator's line manager.
    return [?_lineManagerUser(store, initiatorUserId)];
  }

  // ---- Submit ----

  /// Starts (or restarts after RETURNED) approval of an object.
  static Json submit(
    MockStore store, {
    required String templateKey,
    required String objectType,
    required String objectId,
    required String initiatorUserId,
    required Json summary,
  }) {
    final template = latestTemplate(store, templateKey);
    if (template == null) throw notFound('Workflow template');
    final existing = store
        .all(Col.workflowInstances)
        .where(
          (i) => i['objectType'] == objectType && i['objectId'] == objectId,
        )
        .firstOrNull;
    if (existing != null &&
        existing['status'] != 'RETURNED' &&
        existing['status'] != 'DRAFT') {
      throw invalidTransition('This request is already in the approval route');
    }
    final now = store.nowIso();
    final instance =
        existing ??
        <String, Object?>{
          'id': 'wfi_${store.collection(Col.workflowInstances).length + 1}',
          'objectType': objectType,
          'objectId': objectId,
          'round': 0,
          'createdAt': now,
        };
    instance
      ..['templateId'] = template['id']
      ..['templateKey'] = templateKey
      ..['templateVersion'] = template['version']
      ..['status'] = 'SUBMITTED'
      ..['initiatorId'] = initiatorUserId
      ..['summary'] = summary
      ..['submittedAt'] = now
      ..['completedAt'] = null
      ..['round'] = instance.intVal('round') + 1;

    final defs = template.obj('definition').objList('steps');
    final steps = <Json>[];
    var stepNo = 0;
    final groups = <String, int>{};
    for (final (i, def) in defs.indexed) {
      final group = def.strOrNull('parallel');
      final int no;
      if (group != null && groups.containsKey(group)) {
        no = groups[group]!;
      } else {
        no = ++stepNo;
        if (group != null) groups[group] = no;
      }
      final step = <String, Object?>{
        'id': '${instance.str('id')}_r${instance['round']}_s${i + 1}',
        'instanceId': instance['id'],
        'round': instance['round'],
        'stepNo': no,
        'key': def['key'],
        'name': def['name'],
        'approverRule': def['approverRule'],
        'approverRef': def['approverRef'],
        'slaHours': def['slaHours'],
        'requiresSignature': def['requiresSignature'] == true,
        'isFinal': def['isFinal'] == true,
        'status': 'PENDING',
        'decision': null,
        'comment': null,
        'remark': null,
        'approverUserIds': <String>[],
        'delegatedToId': null,
        'delegationMaxAmount': null,
        'activatedAt': null,
        'dueAt': null,
        'decidedAt': null,
        'decidedById': null,
      };
      if (!evalCondition(def.strOrNull('condition'), summary)) {
        step
          ..['status'] = 'SKIPPED'
          ..['remark'] = 'CONDITION_FALSE';
      } else {
        var approvers = resolveApprovers(store, step, initiatorUserId, summary);
        if (approvers.isEmpty && def['escalateTo'] != null) {
          approvers = resolveApprovers(
            store,
            {'approverRule': 'ROLE', 'approverRef': def['escalateTo']},
            initiatorUserId,
            summary,
          );
        }
        if (approvers.isEmpty) {
          // Mock stand-in for WORKFLOW_UNRESOLVED_APPROVER: never auto-skip a
          // step that must be approved.
          throw policyViolation(
            'UNRESOLVED_APPROVER',
            'No approver could be resolved for ${def['name']}',
          );
        }
        step['approverUserIds'] = approvers;
      }
      steps.add(step);
      store.put(Col.workflowSteps, step);
    }

    store.put(Col.workflowInstances, instance);
    _record(store, instance, null, initiatorUserId, 'SUBMIT');
    WorkflowHooks.fire(store, instance, WorkflowEvent.submitted);
    _advance(store, instance, steps);
    return instance;
  }

  // ---- Activation / advancement ----

  /// Activates the next pending group, or completes the instance.
  static void _advance(MockStore store, Json instance, List<Json> steps) {
    final pending = steps.where((s) => s['status'] == 'PENDING').toList();
    if (pending.isEmpty) {
      _complete(store, instance, 'APPROVED');
      return;
    }
    final no = pending
        .map((s) => s.intVal('stepNo'))
        .reduce((a, b) => a < b ? a : b);
    instance
      ..['status'] = 'IN_REVIEW'
      ..['currentStepNo'] = no;
    store.touch(Col.workflowInstances, instance);
    for (final s in pending.where((s) => s['stepNo'] == no)) {
      _activate(store, instance, s);
    }
  }

  static void _activate(MockStore store, Json instance, Json step) {
    final nowMs = store.nowMs();
    final sla = step['slaHours'] as num?;
    step
      ..['status'] = 'ACTIVE'
      ..['activatedAt'] = store.nowIso()
      ..['dueAt'] = sla == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(
              nowMs + (sla * _hourMs).round(),
              isUtc: true,
            ).toIso8601String();
    final delegation = _activeDelegation(store, step, instance, nowMs);
    if (delegation != null) {
      step
        ..['delegatedToId'] = delegation.str('toUserId')
        ..['delegationMaxAmount'] = delegation['maxAmount'];
    }
    store.touch(Col.workflowSteps, step);

    final summary = instance.obj('summary');
    final ref = summary.strOrNull('refNo') ?? summary.strOrNull('title') ?? '';
    final recipients = {
      ...step.strList('approverUserIds'),
      ?step.strOrNull('delegatedToId'),
    };
    for (final userId in recipients) {
      NotificationEngine.notify(
        store,
        userId: userId,
        type: 'APPROVAL_PENDING',
        priority: summary['urgency'] == 'HIGH' ? 'HIGH' : 'NORMAL',
        title: Bi('Approval needed: $ref', 'অনুমোদন প্রয়োজন: $ref'),
        body: Bi(
          '${summary.strOrNull('title') ?? ref} is waiting for your decision.',
          '${summary.strOrNull('title') ?? ref} আপনার সিদ্ধান্তের অপেক্ষায়।',
        ),
        data: {
          'module': 'approvals',
          'objectType': instance['objectType'],
          'objectId': instance['objectId'],
          'workflowInstanceId': instance['id'],
        },
      );
    }
  }

  /// Active delegation from any of the step's approvers (CM-21).
  static Json? _activeDelegation(
    MockStore store,
    Json step,
    Json instance,
    int nowMs,
  ) {
    for (final d in store.all(Col.delegations)) {
      if (d['isActive'] != true) continue;
      if (!step.strList('approverUserIds').contains(d['fromUserId'])) continue;
      final starts = DateTime.parse(d.str('startsAt')).millisecondsSinceEpoch;
      final ends = DateTime.parse(d.str('endsAt')).millisecondsSinceEpoch;
      if (nowMs < starts || nowMs > ends) continue;
      final modules = d.strList('modules');
      if (modules.isNotEmpty && !modules.contains(instance['objectType'])) {
        continue;
      }
      if (d['toUserId'] == instance['initiatorId']) continue;
      return d;
    }
    return null;
  }

  static void _complete(MockStore store, Json instance, String status) {
    instance
      ..['status'] = status
      ..['currentStepNo'] = null
      ..['completedAt'] = store.nowIso();
    store.touch(Col.workflowInstances, instance);
  }

  // ---- Acting ----

  static Json _record(
    MockStore store,
    Json instance,
    Json? step,
    String actorUserId,
    String type, {
    String? comment,
    Json? metadata,
  }) {
    final seq = store.collection(Col.workflowActions).length + 1;
    final action = <String, Object?>{
      'id': 'wfa_${seq.toString().padLeft(8, '0')}',
      'instanceId': instance['id'],
      'stepId': step?['id'],
      'actorId': actorUserId,
      'type': type,
      'comment': comment,
      'metadata': metadata,
      'createdAt': store.nowIso(),
    };
    store.put(Col.workflowActions, action);
    AuditEngine.log(
      store,
      action: 'WORKFLOW_$type',
      entityType: 'WorkflowInstance',
      actorUserId: actorUserId,
      entityId: instance.str('id'),
      after: {'objectType': instance['objectType'], 'step': step?['key']},
    );
    return action;
  }

  /// The ACTIVE step [userId] may decide (approver or delegate).
  static Json? actionableStep(MockStore store, Json instance, String userId) {
    for (final s in stepsOf(store, instance)) {
      if (s['status'] != 'ACTIVE') continue;
      if (s.strList('approverUserIds').contains(userId) ||
          s['delegatedToId'] == userId) {
        return s;
      }
    }
    return null;
  }

  static bool isParticipant(MockStore store, Json instance, String userId) =>
      instance['initiatorId'] == userId ||
      stepsOf(store, instance).any(
        (s) =>
            s.strList('approverUserIds').contains(userId) ||
            s['delegatedToId'] == userId,
      );

  /// Performs one action. Validation happens before any mutation.
  static Json act(
    MockStore store, {
    required String instanceId,
    required String actorUserId,
    required String type,
    String? comment,
    Json? signature,
    String? delegateToUserId,
    Json? details,
  }) {
    final instance = store.get(Col.workflowInstances, instanceId);
    if (instance == null) throw notFound('Workflow instance');
    final text = comment?.trim() ?? '';
    final initiator = instance.str('initiatorId');

    switch (type) {
      case 'COMMENT':
        if (!isParticipant(store, instance, actorUserId)) throw forbidden();
        if (_terminal.contains(instance['status'])) {
          throw invalidTransition('This request is closed');
        }
        if (text.isEmpty || text.length > 1000) {
          throw validationError('comment', 'Comment is required (max 1000)');
        }
        _record(store, instance, null, actorUserId, type, comment: text);
        _notifyComment(store, instance, actorUserId);
        return instance;
      case 'WITHDRAW':
        return _withdraw(store, instance, actorUserId, text);
      case 'APPROVE' || 'REJECT' || 'RETURN' || 'DELEGATE':
        break;
      default:
        throw validationError('type', 'Unknown action type');
    }

    if (instance['status'] != 'IN_REVIEW') {
      throw invalidTransition('This request is not awaiting a decision');
    }
    if (actorUserId == initiator) {
      throw policyViolation(
        'SELF_APPROVAL',
        'You cannot decide your own request',
      );
    }
    final step = actionableStep(store, instance, actorUserId);
    if (step == null) throw forbidden();

    // A delegate acts within the delegation's amount limit.
    final asDelegate =
        step['delegatedToId'] == actorUserId &&
        !step.strList('approverUserIds').contains(actorUserId);
    final limit = step['delegationMaxAmount'];
    final amount = instance.obj('summary')['amount'];
    if (asDelegate && limit != null && amount is num) {
      final max = num.tryParse('$limit');
      if (max != null && amount > max) {
        throw policyViolation(
          'DELEGATION_AMOUNT_EXCEEDED',
          'This amount is above your delegated approval limit',
        );
      }
    }

    switch (type) {
      case 'APPROVE':
        if (step['requiresSignature'] == true) _checkSignature(signature);
        _decide(
          store,
          instance,
          step,
          actorUserId,
          'APPROVED',
          text,
          asDelegate,
        );
        _record(
          store,
          instance,
          step,
          actorUserId,
          type,
          comment: text.isEmpty ? null : text,
          metadata: asDelegate ? {'onBehalfOf': step['approverUserIds']} : null,
        );
        WorkflowHooks.fire(store, instance, WorkflowEvent.stepApproved);
        final steps = stepsOf(store, instance);
        final groupOpen = steps.any(
          (s) => s['stepNo'] == step['stepNo'] && s['status'] == 'ACTIVE',
        );
        if (!groupOpen) {
          _advance(store, instance, steps);
          if (instance['status'] == 'APPROVED') {
            WorkflowHooks.fire(store, instance, WorkflowEvent.approved);
            _notifyInitiator(store, instance, actorUserId, 'APPROVED', text);
          }
        }
      case 'REJECT':
        _needComment(text, 10);
        _decide(
          store,
          instance,
          step,
          actorUserId,
          'REJECTED',
          text,
          asDelegate,
        );
        _record(store, instance, step, actorUserId, type, comment: text);
        _closeOpenSteps(store, instance);
        _complete(store, instance, 'REJECTED');
        instance['rejectionExplanation'] = text;
        store.put(Col.workflowInstances, instance);
        WorkflowHooks.fire(store, instance, WorkflowEvent.rejected);
        _notifyInitiator(store, instance, actorUserId, 'REJECTED', text);
      case 'RETURN':
        _needComment(text, 10);
        _decide(
          store,
          instance,
          step,
          actorUserId,
          'RETURNED',
          text,
          asDelegate,
        );
        _record(
          store,
          instance,
          step,
          actorUserId,
          type,
          comment: text,
          metadata: details,
        );
        _closeOpenSteps(store, instance);
        instance
          ..['status'] = 'RETURNED'
          ..['currentStepNo'] = null;
        store.touch(Col.workflowInstances, instance);
        WorkflowHooks.fire(store, instance, WorkflowEvent.returned);
        _notifyInitiator(store, instance, actorUserId, 'RETURNED', text);
      case 'DELEGATE':
        _delegate(store, instance, step, actorUserId, delegateToUserId);
    }
    return instance;
  }

  static void _needComment(String text, int min) {
    if (text.length < min || text.length > 1000) {
      throw validationError(
        'comment',
        'Comment must be at least $min characters',
      );
    }
  }

  static void _checkSignature(Json? signature) {
    final method = signature?.strOrNull('method');
    if (signature == null || !_signatureMethods.contains(method)) {
      throw validationError(
        'signature',
        'A signature is required for this step',
      );
    }
    if ((method == 'DRAWN' || method == 'UPLOADED') &&
        signature.strOrNull('imageFileId') == null) {
      throw validationError(
        'signature.imageFileId',
        'Signature image is required',
      );
    }
  }

  static void _decide(
    MockStore store,
    Json instance,
    Json step,
    String actorUserId,
    String decision,
    String comment,
    bool asDelegate,
  ) {
    step
      ..['status'] = 'COMPLETED'
      ..['decision'] = decision
      ..['comment'] = comment.isEmpty ? null : comment
      ..['decidedAt'] = store.nowIso()
      ..['decidedById'] = actorUserId
      ..['onBehalfOfUserIds'] = asDelegate ? step['approverUserIds'] : null;
    store.touch(Col.workflowSteps, step);
  }

  /// REJECT/RETURN/WITHDRAW leave nothing active or pending (BR-17-04).
  static void _closeOpenSteps(MockStore store, Json instance) {
    for (final s in stepsOf(store, instance)) {
      if (s['status'] == 'ACTIVE' || s['status'] == 'PENDING') {
        s
          ..['status'] = 'SKIPPED'
          ..['remark'] = 'INSTANCE_CLOSED';
        store.touch(Col.workflowSteps, s);
      }
    }
  }

  static Json _withdraw(
    MockStore store,
    Json instance,
    String actorUserId,
    String comment,
  ) {
    if (instance['initiatorId'] != actorUserId) throw forbidden();
    const open = {'SUBMITTED', 'IN_REVIEW', 'RETURNED'};
    if (!open.contains(instance['status'])) {
      throw invalidTransition('This request can no longer be withdrawn');
    }
    final approved = stepsOf(
      store,
      instance,
    ).any((s) => s['decision'] == 'APPROVED');
    if (approved) {
      throw policyViolation(
        'WITHDRAW_AFTER_APPROVAL',
        'A step has already approved this request',
      );
    }
    final recipients = <String>{
      for (final s in stepsOf(store, instance))
        if (s['status'] == 'ACTIVE') ...s.strList('approverUserIds'),
    };
    _closeOpenSteps(store, instance);
    _complete(store, instance, 'WITHDRAWN');
    _record(
      store,
      instance,
      null,
      actorUserId,
      'WITHDRAW',
      comment: comment.isEmpty ? null : comment,
    );
    WorkflowHooks.fire(store, instance, WorkflowEvent.withdrawn);
    final ref = instance.obj('summary').strOrNull('refNo') ?? '';
    for (final u in recipients) {
      NotificationEngine.notify(
        store,
        userId: u,
        type: 'APPROVAL_DECIDED',
        title: Bi('Request withdrawn: $ref', 'অনুরোধ প্রত্যাহার: $ref'),
        body: const Bi(
          'The requester withdrew this request. No action is needed.',
          'অনুরোধকারী অনুরোধটি প্রত্যাহার করেছেন। কোনো পদক্ষেপ প্রয়োজন নেই।',
        ),
        data: _data(instance),
      );
    }
    return instance;
  }

  static void _delegate(
    MockStore store,
    Json instance,
    Json step,
    String actorUserId,
    String? toUserId,
  ) {
    final target = toUserId == null ? null : store.get(Col.users, toUserId);
    if (target == null || target['isActive'] != true) {
      throw validationError('delegateToUserId', 'Choose an active colleague');
    }
    if (toUserId == actorUserId || toUserId == instance['initiatorId']) {
      throw policyViolation(
        'INVALID_DELEGATE',
        'You cannot delegate to yourself or the requester',
      );
    }
    step
      ..['delegatedToId'] = toUserId
      ..['delegationMaxAmount'] = null;
    store.touch(Col.workflowSteps, step);
    _record(
      store,
      instance,
      step,
      actorUserId,
      'DELEGATE',
      metadata: {'toUserId': toUserId},
    );
    final ref = instance.obj('summary').strOrNull('refNo') ?? '';
    NotificationEngine.notify(
      store,
      userId: toUserId!,
      type: 'APPROVAL_DELEGATED',
      title: Bi(
        'Approval delegated to you: $ref',
        'আপনাকে অনুমোদন অর্পণ: $ref',
      ),
      body: Bi(
        '${_personName(store, actorUserId, false)} delegated this approval to you.',
        '${_personName(store, actorUserId, true)} এই অনুমোদন আপনাকে অর্পণ করেছেন।',
      ),
      data: _data(instance),
    );
  }

  static Json _data(Json instance) => {
    'module': 'approvals',
    'objectType': instance['objectType'],
    'objectId': instance['objectId'],
    'workflowInstanceId': instance['id'],
    'route': '/home/approvals/${instance['id']}',
  };

  static void _notifyInitiator(
    MockStore store,
    Json instance,
    String actorUserId,
    String decision,
    String comment,
  ) {
    final ref = instance.obj('summary').strOrNull('refNo') ?? '';
    final returned = decision == 'RETURNED';
    final (en, bn) = switch (decision) {
      'APPROVED' => ('approved', 'অনুমোদিত'),
      'REJECTED' => ('rejected', 'প্রত্যাখ্যাত'),
      _ => ('returned for changes', 'সংশোধনের জন্য ফেরত'),
    };
    NotificationEngine.notify(
      store,
      userId: instance.str('initiatorId'),
      type: returned ? 'APPROVAL_RETURNED' : 'APPROVAL_DECIDED',
      priority: decision == 'APPROVED' ? 'NORMAL' : 'HIGH',
      title: Bi('Request $en: $ref', 'অনুরোধ $bn: $ref'),
      body: Bi(
        comment.isEmpty
            ? '${_personName(store, actorUserId, false)} $en your request.'
            : comment,
        comment.isEmpty
            ? '${_personName(store, actorUserId, true)} আপনার অনুরোধ $bn করেছেন।'
            : comment,
      ),
      data: _data(instance),
    );
  }

  static void _notifyComment(
    MockStore store,
    Json instance,
    String actorUserId,
  ) {
    final ref = instance.obj('summary').strOrNull('refNo') ?? '';
    final recipients = <String>{
      instance.str('initiatorId'),
      for (final s in stepsOf(store, instance))
        if (s['status'] == 'ACTIVE') ...s.strList('approverUserIds'),
    }..remove(actorUserId);
    for (final u in recipients) {
      NotificationEngine.notify(
        store,
        userId: u,
        type: 'APPROVAL_COMMENT',
        title: Bi('New comment: $ref', 'নতুন মন্তব্য: $ref'),
        body: Bi(
          '${_personName(store, actorUserId, false)} commented on this request.',
          '${_personName(store, actorUserId, true)} অনুরোধটিতে মন্তব্য করেছেন।',
        ),
        data: _data(instance),
      );
    }
  }

  // ---- SLA (BR-17-08) ----

  /// `{remainingPct, state}`: ok, warn (<50 %), danger (<25 %), overdue.
  static Json sla(MockStore store, Json step) {
    final due = step.strOrNull('dueAt');
    final start = step.strOrNull('activatedAt');
    if (due == null || start == null) {
      return {'remainingPct': null, 'state': 'ok'};
    }
    final dueMs = DateTime.parse(due).millisecondsSinceEpoch;
    final startMs = DateTime.parse(start).millisecondsSinceEpoch;
    final now = store.nowMs();
    final total = dueMs - startMs;
    final pct = total <= 0 ? 0.0 : (dueMs - now) / total * 100;
    final state = now > dueMs
        ? 'overdue'
        : pct < 25
        ? 'danger'
        : pct < 50
        ? 'warn'
        : 'ok';
    return {'remainingPct': pct.clamp(0, 100).round(), 'state': state};
  }
}
