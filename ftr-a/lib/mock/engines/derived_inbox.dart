import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/engines/licence_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Rows the web notification centre derives from live stores (permit, custody,
/// guests today, assigned trip). Upserted with stable ids so Inbox is not empty
/// after a reset.
abstract final class DerivedInbox {
  static String _today() => Dhaka.toWire(Dhaka.clock()).split('T').first;

  static void ensure(MockStore store, AuthContext a) {
    final uid = a.user.str('id');
    final empId = a.employeeId;

    for (final l in store.all(Col.compliance)) {
      final days = LicenceEngine.daysToExpiry(store, l);
      if (days > 30) continue;
      final id = 'n_der_lic_${l['id']}_$uid';
      if (store.get(Col.notifications, id) != null) continue;
      NotificationEngine.notify(
        store,
        id: id,
        userId: uid,
        type: 'LICENCE_EXPIRING',
        priority: days <= 7 ? 'CRITICAL' : 'HIGH',
        title: Bi('Permit runs out in $days days', 'অনুমতি $days দিনে শেষ'),
        body: Bi('${l['title']}', '${l['titleBn'] ?? l['title']}'),
        data: {'module': 'compliance', 'route': '/home/licences/${l['id']}'},
      );
    }

    for (final c in store.all(Col.assetCustody)) {
      if (c['holderEmployeeId'] != empId) continue;
      if (c['ackedAt'] != null) continue;
      final id = 'n_der_cust_${c['id']}_$uid';
      if (store.get(Col.notifications, id) != null) continue;
      NotificationEngine.notify(
        store,
        id: id,
        userId: uid,
        type: 'CUSTODY_UNSIGNED',
        priority: 'HIGH',
        title: const Bi(
          'Sign for equipment in your care',
          'আপনার জিনিসে স্বাক্ষর',
        ),
        body: const Bi(
          'A custody handover is waiting for you.',
          'একটি হস্তান্তর আপনার অপেক্ষায়।',
        ),
        data: {'module': 'assets', 'route': '/home/assets'},
      );
    }

    final day = _today();
    for (final v in store.all(Col.visits)) {
      if (v['hostEmployeeId'] != empId) continue;
      final at = v.strOrNull('expectedAt') ?? v.strOrNull('scheduledAt') ?? '';
      if (!at.startsWith(day)) continue;
      if (v['status'] == 'CHECKED_OUT' || v['status'] == 'CANCELLED') continue;
      final id = 'n_der_visit_${v['id']}_$uid';
      if (store.get(Col.notifications, id) != null) continue;
      NotificationEngine.notify(
        store,
        id: id,
        userId: uid,
        type: 'GUEST_TODAY',
        title: const Bi('A guest is due today', 'আজ একজন অতিথি আসছেন'),
        body: Bi(
          '${v['visitorName'] ?? v['passNo'] ?? 'Guest'}',
          '${v['visitorName'] ?? v['passNo'] ?? 'অতিথি'}',
        ),
        data: {'module': 'visitors', 'route': '/home/visits/${v['id']}'},
      );
    }

    for (final t in store.all(Col.fleetTrips)) {
      if (t['driverUserId'] != uid) continue;
      if (t['endedAt'] != null || t['status'] == 'CANCELLED') continue;
      final id = 'n_der_trip_${t['id']}_$uid';
      if (store.get(Col.notifications, id) != null) continue;
      NotificationEngine.notify(
        store,
        id: id,
        userId: uid,
        type: 'TRIP_ASSIGNED',
        priority: 'HIGH',
        title: const Bi('You have a trip to drive', 'আপনার একটি যাত্রা আছে'),
        body: const Bi(
          'Open the trip before you move.',
          'যাওয়ার আগে যাত্রা খুলুন।',
        ),
        data: {
          'module': 'fleet',
          'route': '/home/fleet/${t['requisitionId'] ?? t['id']}',
        },
      );
    }
  }
}
