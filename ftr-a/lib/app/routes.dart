/// Route paths. Kept separate from the router so screens can navigate without
/// importing the router (which imports the screens).
abstract final class AppRoutes {
  static const loading = '/loading';
  static const login = '/login';
  static const home = '/home';
  static const inbox = '/inbox';
  static const attendance = '/home/attendance';
  static const attendanceRegularise = '/home/attendance/regularise';
  static const leave = '/home/leave';
  static const leaveNew = '/home/leave/new';
  static String leaveDetail(String id) => '/home/leave/$id';
  static const notices = '/home/notices';
  static const noticeNew = '/home/notices/new';
  static String noticeDetail(String id) => '/home/notices/$id';
  static const claims = '/home/claims';
  static const claimNew = '/home/claims/new';
  static const advanceNew = '/home/claims/advance';
  static String claimDetail(String id) => '/home/claims/$id';
  static String claimEdit(String id) => '/home/claims/$id/edit';
  static const bus = '/home/bus';
  static String busRoute(String id) => '/home/bus/routes/$id';
  static const approvals = '/home/approvals';
  static String approvalDetail(String instanceId) =>
      '/home/approvals/$instanceId';
  static const more = '/more';
  static const outbox = '/more/outbox';
  static const activity = '/more/activity';
}
