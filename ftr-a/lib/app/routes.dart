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
  static const more = '/more';
  static const outbox = '/more/outbox';
  static const activity = '/more/activity';
}
