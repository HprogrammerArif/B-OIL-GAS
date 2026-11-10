import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/features/activity/presentation/activity_screen.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_detail_screen.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approvals_screen.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_detail_screen.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_new_screen.dart';
import 'package:bogcl_oneops/features/assets/presentation/assets_screen.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_screen.dart';
import 'package:bogcl_oneops/features/attendance/presentation/regularise_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/loading_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/login_screen.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_route_screen.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_screen.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_screen.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_thread_screen.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/advance_request_screen.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_detail_screen.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_edit_screen.dart';
import 'package:bogcl_oneops/features/claims/presentation/claims_screen.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_detail_screen.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_new_screen.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_screen.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_sos_screen.dart';
import 'package:bogcl_oneops/features/home/presentation/home_screen.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_detail_screen.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_new_screen.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incidents_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_apply_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_detail_screen.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_screen.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_detail_screen.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_new_screen.dart';
import 'package:bogcl_oneops/features/licences/presentation/licences_screen.dart';
import 'package:bogcl_oneops/features/more/presentation/more_screen.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_detail_screen.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_edit_screen.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheets_screen.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_compose_screen.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_detail_screen.dart';
import 'package:bogcl_oneops/features/notices/presentation/notices_screen.dart';
import 'package:bogcl_oneops/features/notifications/presentation/inbox_screen.dart';
import 'package:bogcl_oneops/features/outbox/presentation/outbox_screen.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_detail_screen.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_edit_screen.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcels_screen.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visit_muster_screen.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_detail_screen.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_register_screen.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitors_screen.dart';
import 'package:bogcl_oneops/features/workforce/presentation/people_detail_screen.dart';
import 'package:bogcl_oneops/features/workforce/presentation/people_new_screen.dart';
import 'package:bogcl_oneops/features/workforce/presentation/people_screen.dart';
import 'package:flutter/widgets.dart';
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

  String? guard(GoRouterState state) {
    final location = state.matchedLocation;
    final query = state.uri.hasQuery ? '?${state.uri.query}' : '';
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
    if (location.startsWith(AppRoutes.attendanceLegacy)) {
      return AppRoutes.attendance +
          location.substring(AppRoutes.attendanceLegacy.length) +
          query;
    }
    if (location.startsWith(AppRoutes.approvalsLegacy)) {
      return AppRoutes.approvals +
          location.substring(AppRoutes.approvalsLegacy.length) +
          query;
    }
    if (location.startsWith(AppRoutes.chatLegacy)) {
      return AppRoutes.chat +
          location.substring(AppRoutes.chatLegacy.length) +
          query;
    }
    if (location.startsWith(AppRoutes.approvals) &&
        session.value?.can('workflow:inbox') != true) {
      return AppRoutes.home;
    }
    if (location.startsWith(AppRoutes.chat) &&
        session.value?.showChatTab != true) {
      return AppRoutes.home;
    }
    return null;
  }

  final rootKey = GlobalKey<NavigatorState>();
  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: AppRoutes.loading,
    refreshListenable: refresh,
    redirect: (context, state) => guard(state),
    routes: [
      GoRoute(
        path: AppRoutes.loading,
        builder: (context, state) => const LoadingScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.inbox,
        parentNavigatorKey: rootKey,
        builder: (context, state) => const InboxScreen(),
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
                    path: 'note-sheets',
                    builder: (context, state) => const NoteSheetsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) =>
                            const NoteSheetEditScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => NoteSheetDetailScreen(
                          id: state.pathParameters['id']!,
                          openSign: state.uri.queryParameters['sign'] == '1',
                        ),
                        routes: [
                          GoRoute(
                            path: 'edit',
                            builder: (context, state) => NoteSheetEditScreen(
                              id: state.pathParameters['id'],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'parcels',
                    builder: (context, state) => const ParcelsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const ParcelEditScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            ParcelDetailScreen(id: state.pathParameters['id']!),
                        routes: [
                          GoRoute(
                            path: 'edit',
                            builder: (context, state) => ParcelEditScreen(
                              id: state.pathParameters['id'],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'visits',
                    builder: (context, state) => const VisitorsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) =>
                            const VisitorRegisterScreen(),
                      ),
                      GoRoute(
                        path: 'muster',
                        builder: (context, state) => const VisitMusterScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => VisitorDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'fleet',
                    builder: (context, state) => const FleetScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const FleetNewScreen(),
                      ),
                      GoRoute(
                        path: 'sos',
                        builder: (context, state) => const FleetSosScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            FleetDetailScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'dashboards',
                    redirect: (context, state) => AppRoutes.home,
                  ),
                  GoRoute(
                    path: 'people',
                    builder: (context, state) => const PeopleScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const PeopleNewScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            PeopleDetailScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'licences',
                    builder: (context, state) => const LicencesScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const LicenceNewScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => LicenceDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'assets',
                    builder: (context, state) => const AssetsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const AssetNewScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            AssetDetailScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'incidents',
                    builder: (context, state) => const IncidentsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => const IncidentNewScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => IncidentDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'notices',
                    builder: (context, state) => const NoticesScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) =>
                            const NoticeComposeScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            NoticeDetailScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'claims',
                    builder: (context, state) => const ClaimsScreen(),
                    routes: [
                      GoRoute(
                        path: 'new',
                        builder: (context, state) => ClaimEditScreen(
                          type: ClaimType.parse(
                            state.uri.queryParameters['type'] ?? 'TADA',
                          ),
                        ),
                      ),
                      GoRoute(
                        path: 'advance',
                        builder: (context, state) =>
                            const AdvanceRequestScreen(),
                      ),
                      GoRoute(
                        path: ':id',
                        builder: (context, state) =>
                            ClaimDetailScreen(id: state.pathParameters['id']!),
                        routes: [
                          GoRoute(
                            path: 'edit',
                            builder: (context, state) =>
                                ClaimEditScreen(id: state.pathParameters['id']),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'bus',
                    builder: (context, state) => const BusScreen(),
                    routes: [
                      GoRoute(
                        path: 'routes/:id',
                        builder: (context, state) =>
                            BusRouteScreen(id: state.pathParameters['id']!),
                      ),
                    ],
                  ),
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
                        routes: [
                          GoRoute(
                            path: 'edit',
                            builder: (context, state) => LeaveApplyScreen(
                              id: state.pathParameters['id'],
                            ),
                          ),
                        ],
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
                path: AppRoutes.attendance,
                builder: (context, state) => const AttendanceScreen(),
                routes: [
                  GoRoute(
                    path: 'regularise',
                    builder: (context, state) => RegulariseScreen(
                      initialDate: state.uri.queryParameters['date'],
                      initialType: state.uri.queryParameters['type'],
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.approvals,
                builder: (context, state) => const ApprovalsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => ApprovalDetailScreen(
                      instanceId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.chat,
                builder: (context, state) => const ChatScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) =>
                        ChatThreadScreen(id: state.pathParameters['id']!),
                  ),
                ],
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
