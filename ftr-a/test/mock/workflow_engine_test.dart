import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/workflow.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

const employee = 'usr_1042'; // Sales employee, manager = HOD Finance
const manager = 'usr_0062';
const hrAdmin = 'usr_0028';

Future<MockStore> _store() async {
  final store = MockStore(
    AppDatabase(NativeDatabase.memory()),
    seeders: [seedOrg, seedWorkflowTemplates],
  );
  await store.init();
  return store;
}

Json _leave(MockStore store, {required int days}) => WorkflowEngine.submit(
  store,
  templateKey: 'LEAVE_REQUEST',
  objectType: 'LeaveRequest',
  objectId: 'lv_1',
  initiatorUserId: employee,
  summary: {
    'refNo': 'LV-1',
    'title': 'Casual leave',
    'days': days,
    'hrReview': days > 5,
  },
);

void main() {
  group('conditions', () {
    test('numeric, string and boolean combinations', () {
      final s = {'amount': 600000, 'type': 'CAPEX'};
      expect(WorkflowEngine.evalCondition('amount > 500000', s), isTrue);
      expect(WorkflowEngine.evalCondition("type == 'OPEX'", s), isFalse);
      expect(
        WorkflowEngine.evalCondition("amount > 1 && type == 'CAPEX'", s),
        isTrue,
      );
      expect(
        WorkflowEngine.evalCondition("amount < 1 || type == 'CAPEX'", s),
        isTrue,
      );
      expect(WorkflowEngine.evalCondition('missing > 1', s), isFalse);
      expect(WorkflowEngine.evalCondition(null, s), isTrue);
    });
  });

  group('routing', () {
    test('short leave stops at the line manager', () async {
      final store = await _store();
      final i = _leave(store, days: 2);
      expect(i['status'], 'IN_REVIEW');
      final steps = WorkflowEngine.stepsOf(store, i);
      expect(steps.map((s) => s['status']), ['ACTIVE', 'SKIPPED']);
      expect(steps.first.strList('approverUserIds'), [manager]);

      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'APPROVE',
      );
      expect(i['status'], 'APPROVED');
    });

    test('long leave continues to HR', () async {
      final store = await _store();
      final i = _leave(store, days: 8);
      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'APPROVE',
      );
      expect(i['status'], 'IN_REVIEW');
      expect(
        WorkflowEngine.actionableStep(store, i, hrAdmin)?['key'],
        'HR_REVIEW',
      );
    });
  });

  group('guards', () {
    test('initiator cannot approve; strangers are forbidden', () async {
      final store = await _store();
      final i = _leave(store, days: 2);
      expect(
        () => WorkflowEngine.act(
          store,
          instanceId: i.str('id'),
          actorUserId: employee,
          type: 'APPROVE',
        ),
        throwsA(isA<HttpError>()),
      );
      expect(
        () => WorkflowEngine.act(
          store,
          instanceId: i.str('id'),
          actorUserId: hrAdmin,
          type: 'APPROVE',
        ),
        throwsA(isA<HttpError>()),
      );
    });

    test('reject needs a real comment and closes the route', () async {
      final store = await _store();
      final i = _leave(store, days: 8);
      expect(
        () => WorkflowEngine.act(
          store,
          instanceId: i.str('id'),
          actorUserId: manager,
          type: 'REJECT',
          comment: 'no',
        ),
        throwsA(isA<HttpError>()),
      );
      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'REJECT',
        comment: 'Team is short-staffed that week.',
      );
      expect(i['status'], 'REJECTED');
      expect(WorkflowEngine.stepsOf(store, i).map((s) => s['status']), [
        'COMPLETED',
        'SKIPPED',
      ]);
    });

    test('return then resubmit starts a new round', () async {
      final store = await _store();
      final i = _leave(store, days: 2);
      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'RETURN',
        comment: 'Please attach the planned handover.',
      );
      expect(i['status'], 'RETURNED');
      final again = _leave(store, days: 2);
      expect(again['id'], i['id']);
      expect(again['round'], 2);
      expect(again['status'], 'IN_REVIEW');
    });

    test('withdraw is blocked after a step approved', () async {
      final store = await _store();
      final i = _leave(store, days: 8);
      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'APPROVE',
      );
      expect(
        () => WorkflowEngine.act(
          store,
          instanceId: i.str('id'),
          actorUserId: employee,
          type: 'WITHDRAW',
        ),
        throwsA(isA<HttpError>()),
      );
    });
  });

  group('trail', () {
    test('every action is audited and the chain verifies', () async {
      final store = await _store();
      final i = _leave(store, days: 2);
      WorkflowEngine.act(
        store,
        instanceId: i.str('id'),
        actorUserId: manager,
        type: 'APPROVE',
      );
      expect(AuditEngine.verify(store), isNull);
      final actions = WorkflowEngine.actionsOf(store, i.str('id'));
      expect(actions.map((a) => a['type']), ['SUBMIT', 'APPROVE']);
    });
  });
}
