import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

/// Lightweight colleague picker shared by parcels, visitors and fleet. It
/// returns only what a picker needs, never phone, NID or other PII.
List<RouteDef> peopleRoutes() => [
  RouteDef('GET', '/people', (ctx) async {
    final a = ctx.requireAuth();
    final q = (ctx.query['q'] ?? '').trim().toLowerCase();
    final limit = (int.tryParse(ctx.query['limit'] ?? '') ?? 20).clamp(1, 50);
    final out = <Json>[];
    for (final u in ctx.store.all(Col.users)) {
      if (u['isActive'] == false || u['id'] == a.user['id']) continue;
      final e = ctx.store.get(Col.employees, u.str('employeeId'));
      if (e == null) continue;
      final hay = [
        e.str('fullName'),
        e.strOrNull('fullNameBn') ?? '',
        e.obj('designation').strOrNull('title') ?? '',
        e.obj('department').strOrNull('name') ?? '',
      ].join(' ').toLowerCase();
      if (q.isNotEmpty && !hay.contains(q)) continue;
      out.add({
        ...?WorkflowEngine.personRef(ctx.store, u.str('id')),
        'department': e.obj('department')['name'],
        'departmentBn': e.obj('department')['nameBn'],
        'site': e.obj('site')['name'],
        'siteBn': e.obj('site')['nameBn'],
      });
    }
    out.sort((x, y) => x.str('name').compareTo(y.str('name')));
    return ok(out.take(limit).toList());
  }),
];
