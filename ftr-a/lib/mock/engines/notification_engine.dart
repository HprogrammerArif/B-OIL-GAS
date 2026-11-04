import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// English + Bangla text pair. Templates resolve per recipient language.
class Bi {
  const Bi(this.en, this.bn);

  final String en;
  final String bn;

  String of(String lang) => lang == 'BN' ? bn : en;
}

/// Doc 03 §4.2 category chips, derived from the notification `type`.
String notificationCategory(String type) {
  const approvals = [
    'APPROVAL_',
    'NOTE_SHEET_',
    'DELEGATION_',
    'LEAVE_REQ',
    'EXIT_',
    'CLEARANCE_',
  ];
  const safety = [
    'INCIDENT_',
    'CAPA_',
    'FLEET_SOS',
    'VISIT_MUSTER',
    'ASSET_LOTO',
    'ASSET_CALIBRATION',
  ];
  const transport = ['FLEET_', 'BUS_', 'PARCEL_', 'VISIT_'];
  bool any(List<String> prefixes) => prefixes.any(type.startsWith);
  if (any(approvals) || type == 'CLAIM_SUBMITTED') return 'APPROVALS';
  if (any(safety)) return 'SAFETY';
  if (any(transport)) return 'TRANSPORT';
  return 'OTHER';
}

/// Notification engine (doc 00 §6.3): the single entry point every module uses
/// to notify a user. In-app delivery is always on; push/SMS/email channels are
/// simulated and never leave the device.
abstract final class NotificationEngine {
  static const priorities = {'LOW', 'NORMAL', 'HIGH', 'CRITICAL'};

  /// Creates a notification for [userId]. The caller commits the store.
  static Json notify(
    MockStore store, {
    required String userId,
    required String type,
    required Bi title,
    required Bi body,
    String priority = 'NORMAL',
    Json? data,
    bool ackRequired = false,
    int? createdAtMs,
    bool read = false,
  }) {
    assert(priorities.contains(priority), 'Unknown priority $priority');
    final ms = createdAtMs ?? store.nowMs();
    final created = DateTime.fromMillisecondsSinceEpoch(
      ms,
      isUtc: true,
    ).toIso8601String();
    final id = 'ntf_${ms}_${store.collection(Col.notifications).length}';
    final record = <String, Object?>{
      'id': id,
      'userId': userId,
      'type': type,
      'priority': priority,
      'title': title.en,
      'titleBn': title.bn,
      'body': body.en,
      'bodyBn': body.bn,
      'data': data,
      'readAt': read ? created : null,
      'ackRequired': ackRequired,
      'ackedAt': null,
      'createdAt': created,
    };
    store.put(Col.notifications, record);
    return record;
  }

  /// Notifies every active user holding [role].
  static void notifyRole(
    MockStore store, {
    required String role,
    required String type,
    required Bi title,
    required Bi body,
    String priority = 'NORMAL',
    Json? data,
    bool ackRequired = false,
  }) {
    for (final u in store.all(Col.users)) {
      if (u['isActive'] == false) continue;
      if (!u.strList('roles').contains(role)) continue;
      notify(
        store,
        userId: u.str('id'),
        type: type,
        title: title,
        body: body,
        priority: priority,
        data: data,
        ackRequired: ackRequired,
      );
    }
  }

  /// Wire shape of [record] in the recipient's language.
  static Json toWire(Json record, String lang) {
    final bn = lang == 'BN';
    return {
      'id': record['id'],
      'type': record['type'],
      'priority': record['priority'],
      'title': bn ? record['titleBn'] : record['title'],
      'body': bn ? record['bodyBn'] : record['body'],
      'data': record['data'],
      'readAt': record['readAt'],
      'ackRequired': record['ackRequired'],
      'ackedAt': record['ackedAt'],
      'createdAt': record['createdAt'],
    };
  }
}
