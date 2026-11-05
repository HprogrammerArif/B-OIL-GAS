import 'package:bogcl_oneops/mock/engines/event_simulator.dart';
import 'package:bogcl_oneops/mock/handlers/auth_handlers.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

/// Demo-menu routes (mock only; no equivalent in the production API).
List<RouteDef> demoRoutes() => [
  /// Instant persona switch for pitches: opens a session without a password.
  RouteDef('POST', '/demo/session', auth: false, (ctx) async {
    final body = ctx.bodyObject();
    final code = body['empCode'];
    final device = body['device'];
    if (code is! String || device is! Map) {
      throw validationError('empCode', 'Employee code and device are required');
    }
    final user = ctx.store.get(Col.users, userIdFor(code));
    if (user == null) throw notFound('Persona');
    final response = openSession(
      ctx.store,
      user,
      Map<String, Object?>.from(device),
    );
    await ctx.store.commit();
    return ok(response);
  }),
  RouteDef('POST', '/demo/events/next', (ctx) async {
    final a = ctx.requireAuth();
    final rec = EventSimulator.play(ctx.store, notifyUserId: a.user.str('id'));
    await ctx.store.commit();
    return ok(rec);
  }),
];
