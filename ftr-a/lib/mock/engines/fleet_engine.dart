import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

abstract final class FleetPolicy {
  static const vehicleStatuses = {
    'available',
    'in_transit',
    'maintenance',
    'decommissioned',
  };
  static const driverStatuses = {
    'available',
    'on_trip',
    'sick_leave',
    'on_leave',
    'rest_required',
  };
  static const requisitionStatuses = {
    'pending',
    'assigned',
    'in_transit',
    'completed',
    'rejected',
    'cancelled',
  };
  static const vehicleTypes = {'sedan_4', 'microbus_7', 'pickup_4x4', 'tanker_heavy'};
}

abstract final class FleetEngine {
  static String? seedClock;
  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _nextReqNo(MockStore store) {
    final year = _year(store);
    var max = 0;
    for (final r in store.all(Col.fleetRequisitions)) {
      final ref = r.strOrNull('refNo');
      if (ref != null && ref.startsWith('VR-$year-')) {
        final n = int.tryParse(ref.substring(8)) ?? 0;
        if (n > max) max = n;
      }
    }
    return 'VR-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  // ─── Requisitions ───────────────────────────────────────────────

  static Json createRequisition(HandlerContext ctx) {
    final a = ctx.requireAuth();
    ctx.requirePermission('fleet:request');
    final b = ctx.bodyObject();
    final id = ctx.store.generateId();
    final now = _stamp(ctx.store);
    final emp = a.employee;

    final req = <String, Object?>{
      'id': id,
      'refNo': _nextReqNo(ctx.store),
      'status': 'pending',
      'requesterEmployeeId': a.employeeId,
      'requesterName': emp.strOrNull('fullName') ?? '',
      'dept': emp.obj('department').strOrNull('name') ?? '',
      'from': b.str('from'),
      'to': b.str('to'),
      'tripType': b.strOrNull('tripType') ?? 'round_trip',
      'departureTime': b.str('departureTime'),
      'returnTime': b.strOrNull('returnTime'),
      'requiredCapacity': b.str('requiredCapacity'),
      'passengersCount': b['passengersCount'] ?? 1,
      'passengerNames': b.strOrNull('passengerNames') ?? '',
      'purpose': b.str('purpose'),
      'costCenter': b.strOrNull('costCenter') ?? '',
      'intermediateStops': b['intermediateStops'] ?? <Object?>[],
      'createdAt': now,
      'updatedAt': now,
    };
    ctx.store.put(Col.fleetRequisitions, id, req);
    AuditEngine.log(
      ctx.store,
      a.user.str('id'),
      'FLEET_REQUISITION_CREATED',
      {'reqId': id, 'refNo': req['refNo']},
    );
    NotificationEngine.notifyRole(
      ctx.store,
      'TRANSPORT_ADMIN',
      NotificationEngine.build(
        type: 'FLEET_REQUEST',
        titleEn: 'New vehicle requisition',
        titleBn: 'নতুন গাড়ি রিকুইজিশন',
        bodyEn: '${req['requesterName']} needs a vehicle: ${req['from']} → ${req['to']}',
        bodyBn: '${req['requesterName']} গাড়ি চাইছেন: ${req['from']} → ${req['to']}',
        data: {'route': '/home/fleet/${id}', 'reqId': id},
      ),
    );
    return req;
  }

  static Json assignRequisition(HandlerContext ctx, String id) {
    ctx.requirePermission('fleet:dispatch');
    final req = ctx.store.get(Col.fleetRequisitions, id);
    if (req == null) throw notFound('Requisition not found');
    if (req['status'] != 'pending') throw conflict('Not in pending state');
    final b = ctx.bodyObject();
    final vehicle = ctx.store.get(Col.fleetVehicles, b.str('vehicleId'));
    final driver = ctx.store.get(Col.fleetDrivers, b.str('driverId'));
    if (vehicle == null) throw validationError('vehicleId', 'Vehicle not found');
    if (driver == null) throw validationError('driverId', 'Driver not found');
    final now = _stamp(ctx.store);
    final updated = {
      ...req,
      'status': 'assigned',
      'assignedVehicleId': vehicle['id'],
      'assignedVehiclePlate': vehicle['plate'],
      'assignedDriverId': driver['id'],
      'assignedDriverName': driver['name'],
      'assignedAt': now,
      'updatedAt': now,
    };
    ctx.store.put(Col.fleetRequisitions, id, updated);
    ctx.store.put(Col.fleetVehicles, vehicle.str('id'), {
      ...vehicle,
      'status': 'in_transit',
      'updatedAt': now,
    });
    ctx.store.put(Col.fleetDrivers, driver.str('id'), {
      ...driver,
      'status': 'on_trip',
      'updatedAt': now,
    });
    NotificationEngine.notify(
      ctx.store,
      req.str('requesterEmployeeId'),
      NotificationEngine.build(
        type: 'FLEET_ASSIGNED',
        titleEn: 'Vehicle assigned',
        titleBn: 'গাড়ি বরাদ্দ হয়েছে',
        bodyEn: '${vehicle['plate']} · Driver: ${driver['name']}',
        bodyBn: '${vehicle['plate']} · চালক: ${driver['name']}',
        data: {'route': '/home/fleet/$id', 'reqId': id},
      ),
    );
    return updated;
  }

  static Json startTrip(HandlerContext ctx, String id) {
    ctx.requirePermission('fleet:drive');
    final req = ctx.store.get(Col.fleetRequisitions, id);
    if (req == null) throw notFound('Requisition not found');
    if (req['status'] != 'assigned') throw conflict('Not in assigned state');
    final now = _stamp(ctx.store);
    final updated = {
      ...req,
      'status': 'in_transit',
      'tripStartedAt': now,
      'updatedAt': now,
    };
    ctx.store.put(Col.fleetRequisitions, id, updated);
    return updated;
  }

  static Json completeTrip(HandlerContext ctx, String id) {
    ctx.requirePermission('fleet:drive');
    final req = ctx.store.get(Col.fleetRequisitions, id);
    if (req == null) throw notFound('Requisition not found');
    if (req['status'] != 'in_transit') throw conflict('Trip not started');
    final b = ctx.bodyObject();
    final now = _stamp(ctx.store);
    final vehicleId = req.strOrNull('assignedVehicleId');
    final driverId = req.strOrNull('assignedDriverId');
    final updated = {
      ...req,
      'status': 'completed',
      'tripCompletedAt': now,
      'endOdometer': b['endOdometer'],
      'tripRating': b['tripRating'],
      'tripFeedback': b.strOrNull('tripFeedback'),
      'updatedAt': now,
    };
    ctx.store.put(Col.fleetRequisitions, id, updated);
    if (vehicleId != null) {
      final v = ctx.store.get(Col.fleetVehicles, vehicleId);
      if (v != null) {
        ctx.store.put(Col.fleetVehicles, vehicleId, {
          ...v,
          'status': 'available',
          'odometer': b['endOdometer'] ?? v['odometer'],
          'updatedAt': now,
        });
      }
    }
    if (driverId != null) {
      final d = ctx.store.get(Col.fleetDrivers, driverId);
      if (d != null) {
        ctx.store.put(Col.fleetDrivers, driverId, {
          ...d,
          'status': 'available',
          'updatedAt': now,
        });
      }
    }
    return updated;
  }

  static Json rejectRequisition(HandlerContext ctx, String id) {
    ctx.requirePermission('fleet:dispatch');
    final req = ctx.store.get(Col.fleetRequisitions, id);
    if (req == null) throw notFound('Requisition not found');
    final b = ctx.bodyObject();
    final updated = {
      ...req,
      'status': 'rejected',
      'rejectReason': b.strOrNull('reason') ?? '',
      'updatedAt': _stamp(ctx.store),
    };
    ctx.store.put(Col.fleetRequisitions, id, updated);
    NotificationEngine.notify(
      ctx.store,
      req.str('requesterEmployeeId'),
      NotificationEngine.build(
        type: 'FLEET_REJECTED',
        titleEn: 'Vehicle request rejected',
        titleBn: 'গাড়ির অনুরোধ প্রত্যাখ্যান হয়েছে',
        bodyEn: updated['rejectReason'] as String? ?? '',
        bodyBn: updated['rejectReason'] as String? ?? '',
        data: {'route': '/home/fleet/$id', 'reqId': id},
      ),
    );
    return updated;
  }

  static Json issueFuel(HandlerContext ctx, String vehicleId) {
    ctx.requirePermission('fleet:fuel');
    final v = ctx.store.get(Col.fleetVehicles, vehicleId);
    if (v == null) throw notFound('Vehicle not found');
    final b = ctx.bodyObject();
    final id = ctx.store.generateId();
    final now = _stamp(ctx.store);
    final log = <String, Object?>{
      'id': id,
      'vehicleId': vehicleId,
      'vehiclePlate': v['plate'],
      'liters': b['liters'],
      'station': b.str('station'),
      'cost': b['cost'],
      'issuedAt': now,
      'issuedBy': ctx.requireAuth().user.str('id'),
    };
    ctx.store.put(Col.fleetFuelLogs, id, log);
    ctx.store.put(Col.fleetVehicles, vehicleId, {
      ...v,
      'lastFueled': now,
      'updatedAt': now,
    });
    return log;
  }

  static List<Json> listRequisitions(HandlerContext ctx) {
    final a = ctx.requireAuth();
    var all = ctx.store.all(Col.fleetRequisitions);
    if (!ctx.can('fleet:dispatch') && !ctx.can('fleet:drive')) {
      all = all
          .where((r) => r.str('requesterEmployeeId') == a.employeeId)
          .toList();
    } else if (ctx.can('fleet:drive')) {
      final driverRecs = ctx.store
          .all(Col.fleetDrivers)
          .where((d) => d.str('employeeId') == a.employeeId)
          .toList();
      if (driverRecs.isNotEmpty) {
        final dId = driverRecs.first.str('id');
        all = all
            .where(
              (r) =>
                  r.strOrNull('assignedDriverId') == dId ||
                  r.str('requesterEmployeeId') == a.employeeId,
            )
            .toList();
      }
    }
    final status = ctx.query['status'];
    if (status != null && status.isNotEmpty) {
      all = all.where((r) => r['status'] == status).toList();
    }
    all.sort((a, b) => b.str('createdAt').compareTo(a.str('createdAt')));
    return all;
  }
}
