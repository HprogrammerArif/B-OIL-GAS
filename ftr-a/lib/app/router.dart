import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/features/activity/presentation/activity_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/loading_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/login_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/home/presentation/home_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_apply_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_detail_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_screen.dart';
import 'package:bogcl_oneops/features/more/presentation/more_screen.dart';
import 'package:bogcl_oneops/features/notifications/presentation/inbox_screen.dart';
import 'package:bogcl_oneops/features/outbox/presentation/outbox_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'router.g.dart';

/// App router with auth guards. Role-specific routes add their own redirects
/// as modules ship.
@Riverpod(keepAlive: true)
GoRouter router(Ref ref) {
  final refresh = ValueNotifier<int>(0);
  ref
    ..onDispose(refresh.dispose)
    ..listen(sessionControllerProvider, (_, _) => refresh.value++);

  String? guard(String location) {
    final session = ref.read(sessionControllerProvider);
    // Resolving the stored session (or failed to, e.g. offline at start).
    if (!session.hasValue) {
      return location == AppRoutes.loading ? null : AppRoutes.loading;
    }
    final signedIn = session.value != null;
    if (!signedIn) {
      return location == AppRoutes.login ? null : AppRoutes.login;
    }
    if (location == AppRoutes.login || location == AppRoutes.loading) {
      return AppRoutes.home;
    }
    return null;
  }

  return GoRouter(
    initialLocation: AppRoutes.loading,
    refreshListenable: refresh,
    redirect: (context, state) => guard(state.matchedLocation),
    routes: [
      GoRoute(
        path: AppRoutes.loading,
        builder: (context, state) => const LoadingScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => ShellScaffold(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (context, state) => const HomeScreen(),
                routes: [
                  GoRoute(
                    path: 'leave',
                    builder: (context, state) => const LeaveScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const LeaveApplyScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            LeaveDetailScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.inbox,
                builder: (context, state) => const InboxScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.more,
                builder: (context, state) => const MoreScreen(),
                routes: [
                  GoRoute(
                    path: 'outbox',
                    builder: (context, state) => const OutboxScreen(),
                  ),
                  GoRoute(
                    path: 'activity',
                    builder: (context, state) => const ActivityScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
