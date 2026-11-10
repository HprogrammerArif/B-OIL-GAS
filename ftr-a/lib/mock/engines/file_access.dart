import 'package:bogcl_oneops/mock/engines/chat_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Who may open files attached to a record (doc 03 §4.1: "uploader, or
/// anyone the owning module admits"). Wired once at start-up.
abstract final class FileAccess {
  static bool _widerThanSelf(Json user, String key) {
    for (final g in grantsForRoles(user.strList('roles'))) {
      if (g['key'] == key) return g['scope'] != 'SELF';
    }
    return false;
  }

  static bool _inRoute(MockStore store, Json user, Json record) {
    final id = record.strOrNull('workflowInstanceId');
    final inst = id == null ? null : store.get(Col.workflowInstances, id);
    return inst != null &&
        WorkflowEngine.isParticipant(store, inst, user.str('id'));
  }

  static void register() {
    FileEngine.registerOwnerAccess('Claim', (store, user, id) {
      final c = store.get(Col.claims, id);
      if (c == null) return false;
      return c['employeeId'] == user['employeeId'] ||
          _inRoute(store, user, c) ||
          _widerThanSelf(user, 'claims:read') ||
          _widerThanSelf(user, 'claims:settle');
    });
    FileEngine.registerOwnerAccess('LeaveRequest', (store, user, id) {
      final l = store.get(Col.leaveRequests, id);
      if (l == null) return false;
      return l['employeeId'] == user['employeeId'] ||
          _inRoute(store, user, l) ||
          _widerThanSelf(user, 'leave:read');
    });
    FileEngine.registerOwnerAccess('NoteSheet', (store, user, id) {
      final s = store.get(Col.noteSheets, id);
      if (s == null || s['status'] == 'DRAFT') return false;
      return s['initiatorUserId'] == user['id'] ||
          _inRoute(store, user, s) ||
          _widerThanSelf(user, 'note-sheets:read');
    });
    FileEngine.registerOwnerAccess('Visit', (store, user, id) {
      final v = store.get(Col.visits, id);
      if (v == null) return false;
      final me = user['id'];
      return v['hostUserId'] == me ||
          v['escortUserId'] == me ||
          _widerThanSelf(user, 'visitors:read') ||
          _widerThanSelf(user, 'visitors:gate');
    });
    FileEngine.registerOwnerAccess('Licence', (store, user, id) {
      final lic = store.get(Col.compliance, id);
      if (lic == null) return false;
      return lic['ownerUserId'] == user['id'] ||
          _widerThanSelf(user, 'compliance:read') ||
          _widerThanSelf(user, 'compliance:manage');
    });
    FileEngine.registerOwnerAccess('Asset', (store, user, id) {
      final a = store.get(Col.assets, id);
      if (a == null) return false;
      final me = user['id'];
      final open = store
          .all(Col.assetCustody)
          .where((c) => c['assetId'] == id && c['releasedAt'] == null);
      if (open.any((c) => c['employeeUserId'] == me)) return true;
      return _widerThanSelf(user, 'assets:read') ||
          _widerThanSelf(user, 'assets:maintain') ||
          _widerThanSelf(user, 'assets:loto');
    });
    FileEngine.registerOwnerAccess('Incident', (store, user, id) {
      final i = store.get(Col.incidents, id);
      if (i == null) return false;
      final me = user['id'];
      return i['reporterUserId'] == me ||
          i['investigatorUserId'] == me ||
          _widerThanSelf(user, 'incidents:read') ||
          _widerThanSelf(user, 'incidents:triage');
    });
    FileEngine.registerOwnerAccess('Trip', (store, user, id) {
      final t = store.get(Col.fleetTrips, id);
      if (t == null) return false;
      final r = store.get(Col.fleetRequisitions, t.str('requisitionId'));
      final me = user['id'];
      return t['driverUserId'] == me ||
          r?['requesterUserId'] == me ||
          _widerThanSelf(user, 'fleet:dispatch') ||
          _widerThanSelf(user, 'fleet:gate') ||
          _widerThanSelf(user, 'fleet:read');
    });
    FileEngine.registerOwnerAccess('ChatMessage', (store, user, id) {
      final m = store.get(Col.chatMessages, id);
      if (m == null) return false;
      final ch = store.get(Col.chatChannels, m.str('channelId'));
      return ch != null && ChatEngine.isMember(ch, user.str('id'));
    });
    FileEngine.registerOwnerAccess('Parcel', (store, user, id) {
      final p = store.get(Col.parcels, id);
      if (p == null) return false;
      final me = user['id'];
      return p['senderUserId'] == me ||
          p['recipientUserId'] == me ||
          p['courierUserId'] == me ||
          _widerThanSelf(user, 'parcels:read');
    });
  }
}
