import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

abstract final class VisitorPolicy {
  static const categories = {
    'VIP',
    'GOVT',
    'VENDOR',
    'CLIENT',
    'REGULAR',
  };
  static const statuses = {
    'PRE_REGISTERED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'OVERDUE',
    'CANCELLED',
  };
  static const overstayAlertMinutes = 30;
}

abstract final class VisitorEngine {
  static String? seedClock;
  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static String _year(MockStore s) => s.nowIso().substring(0, 4);

  static String _nextNo(MockStore store) {
    final year = _year(store);
    var max = 0;
    for (final v in store.all(Col.visitors)) {
      final ref = v.strOrNull('refNo');
      if (ref != null && ref.startsWith('VIS-$year-')) {
        final n = int.tryParse(ref.substring(9)) ?? 0;
        if (n > max) max = n;
      }
    }
    return 'VIS-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  static Json _safetyDefaults() => {
    'safetyBriefingCompleted': false,
    'ndaSigned': false,
    'ppeCleared': {
      'hardHat': false,
      'safetyGoggles': false,
      'safetyShoes': false,
      'hiVisVest': false,
      'h2sBriefing': false,
    },
  };

  /// Create a new visitor pre-registration.
  static Json create(HandlerContext ctx) {
    final a = ctx.requireAuth();
    ctx.requirePermission('visitors:create');
    final b = ctx.bodyObject();
    final now = _stamp(ctx.store);
    final id = ctx.store.generateId();
    final refNo = _nextNo(ctx.store);

    final host = ctx.store.get(Col.employees, a.employeeId);
    final visitor = <String, Object?>{
      'id': id,
      'refNo': refNo,
      'status': 'PRE_REGISTERED',
      'name': b.str('name'),
      'organization': b.strOrNull('organization') ?? '',
      'designation': b.strOrNull('designation') ?? '',
      'category': b.str('category'),
      'hostEmployeeId': a.employeeId,
      'hostName': host?.strOrNull('fullName') ?? '',
      'hostDept': host?.obj('department').strOrNull('name') ?? '',
      'siteId': a.employee.obj('site').str('id'),
      'purpose': b.str('purpose'),
      'expectedDate': b.str('expectedDate'),
      'expectedTime': b.str('expectedTime'),
      'vehiclePlate': b.strOrNull('vehiclePlate'),
      'phone': b.strOrNull('phone'),
      'email': b.strOrNull('email'),
      'idProofType': b.strOrNull('idProofType'),
      'idProofNumber': b.strOrNull('idProofNumber'),
      'permittedZones': b['permittedZones'] ?? <Object?>[],
      'vipProtocol': b['vipProtocol'] ?? false,
      ...?_safetyDefaults().cast<String, Object?>(),
      'createdAt': now,
      'updatedAt': now,
      'createdBy': a.user.str('id'),
    };
    ctx.store.put(Col.visitors, id, visitor);
    AuditEngine.log(ctx.store, a.user.str('id'), 'VISITOR_CREATED', {
      'visitorId': id,
      'refNo': refNo,
    });
    NotificationEngine.notifyRole(
      ctx.store,
      'SECURITY_GATE',
      NotificationEngine.build(
        type: 'VISITOR_REGISTERED',
        titleEn: 'New visitor registered',
        titleBn: 'নতুন দর্শনার্থী নিবন্ধিত',
        bodyEn: '${visitor['name']} (${visitor['category']}) expected ${visitor['expectedDate']}',
        bodyBn: '${visitor['name']} (${visitor['category']}) প্রত্যাশিত তারিখ ${visitor['expectedDate']}',
        data: {'route': '/home/visitors/$id', 'visitorId': id},
      ),
    );
    return visitor;
  }

  /// Gate check-in: security scans the pass and checks PPE.
  static Json checkIn(HandlerContext ctx, String id) {
    ctx.requirePermission('visitors:gate');
    final v = ctx.store.get(Col.visitors, id);
    if (v == null) throw notFound('Visitor not found');
    if (v['status'] != 'PRE_REGISTERED') {
      throw conflict('Visitor is already ${v['status']}');
    }
    final now = _stamp(ctx.store);
    final updated = {...v, 'status': 'CHECKED_IN', 'checkInTime': now, 'updatedAt': now};
    ctx.store.put(Col.visitors, id, updated);
    AuditEngine.log(ctx.store, ctx.requireAuth().user.str('id'), 'VISITOR_CHECKED_IN', {'visitorId': id});
    NotificationEngine.notify(
      ctx.store,
      v.str('createdBy'),
      NotificationEngine.build(
        type: 'VISITOR_ARRIVED',
        titleEn: 'Your visitor has arrived',
        titleBn: 'আপনার দর্শনার্থী এসেছেন',
        bodyEn: '${v['name']} checked in at the gate.',
        bodyBn: '${v['name']} গেটে প্রবেশ করেছেন।',
        data: {'route': '/home/visitors/$id', 'visitorId': id},
      ),
    );
    return updated;
  }

  /// Gate check-out.
  static Json checkOut(HandlerContext ctx, String id) {
    ctx.requirePermission('visitors:gate');
    final v = ctx.store.get(Col.visitors, id);
    if (v == null) throw notFound('Visitor not found');
    if (v['status'] != 'CHECKED_IN') {
      throw conflict('Visitor is not checked in');
    }
    final now = _stamp(ctx.store);
    final checkIn = DateTime.tryParse(v.strOrNull('checkInTime') ?? '');
    final durationMinutes = checkIn == null
        ? 0
        : DateTime.parse(now).difference(checkIn).inMinutes;
    final updated = {
      ...v,
      'status': 'CHECKED_OUT',
      'checkOutTime': now,
      'durationMinutes': durationMinutes,
      'updatedAt': now,
    };
    ctx.store.put(Col.visitors, id, updated);
    AuditEngine.log(ctx.store, ctx.requireAuth().user.str('id'), 'VISITOR_CHECKED_OUT', {'visitorId': id});
    return updated;
  }

  /// Update PPE clearance fields at the gate.
  static Json updatePpe(HandlerContext ctx, String id) {
    ctx.requirePermission('visitors:gate');
    final v = ctx.store.get(Col.visitors, id);
    if (v == null) throw notFound('Visitor not found');
    final b = ctx.bodyObject();
    final ppe = Map<String, Object?>.from(v.obj('ppeCleared'))
      ..addAll(Map<String, Object?>.from(b.obj('ppeCleared')));
    final updated = {...v, 'ppeCleared': ppe, 'updatedAt': _stamp(ctx.store)};
    ctx.store.put(Col.visitors, id, updated);
    return updated;
  }

  /// Complete safety briefing.
  static Json completeBriefing(HandlerContext ctx, String id) {
    ctx.requirePermission('visitors:gate');
    final v = ctx.store.get(Col.visitors, id);
    if (v == null) throw notFound('Visitor not found');
    final updated = {...v, 'safetyBriefingCompleted': true, 'updatedAt': _stamp(ctx.store)};
    ctx.store.put(Col.visitors, id, updated);
    return updated;
  }

  /// Cancel a pre-registration.
  static Json cancel(HandlerContext ctx, String id) {
    final a = ctx.requireAuth();
    final v = ctx.store.get(Col.visitors, id);
    if (v == null) throw notFound('Visitor not found');
    final isOwner = v.str('createdBy') == a.user.str('id');
    if (!isOwner) ctx.requirePermission('visitors:gate');
    if (VisitorPolicy.statuses.contains(v['status']) &&
        (v['status'] == 'CHECKED_IN' || v['status'] == 'CHECKED_OUT')) {
      throw conflict('Cannot cancel a checked-in visitor');
    }
    final updated = {...v, 'status': 'CANCELLED', 'updatedAt': _stamp(ctx.store)};
    ctx.store.put(Col.visitors, id, updated);
    AuditEngine.log(ctx.store, a.user.str('id'), 'VISITOR_CANCELLED', {'visitorId': id});
    return updated;
  }

  static List<Json> list(HandlerContext ctx) {
    final a = ctx.requireAuth();
    final status = ctx.query['status'];
    final category = ctx.query['category'];
    var all = ctx.store.all(Col.visitors);

    if (!ctx.can('visitors:gate') && !ctx.can('visitors:read', GrantScope.department)) {
      all = all.where((v) => v.str('createdBy') == a.user.str('id')).toList();
    }
    if (status != null && status.isNotEmpty) {
      all = all.where((v) => v['status'] == status).toList();
    }
    if (category != null && category.isNotEmpty) {
      all = all.where((v) => v['category'] == category).toList();
    }
    all.sort((a, b) => b.str('createdAt').compareTo(a.str('createdAt')));
    return all;
  }
}
