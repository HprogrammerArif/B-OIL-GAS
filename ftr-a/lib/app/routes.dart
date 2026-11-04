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
  static const noteSheets = '/home/note-sheets';
  static const noteSheetNew = '/home/note-sheets/new';
  static String noteSheetDetail(String id) => '/home/note-sheets/$id';
  static String noteSheetEdit(String id) => '/home/note-sheets/$id/edit';
  static const parcels = '/home/parcels';
  static const parcelNew = '/home/parcels/new';
  static String parcelDetail(String id) => '/home/parcels/$id';
  static String parcelEdit(String id) => '/home/parcels/$id/edit';
  static const visits = '/home/visits';
  static const visitNew = '/home/visits/new';
  static const visitMuster = '/home/visits/muster';
  static String visitDetail(String id) => '/home/visits/$id';
  static const fleet = '/home/fleet';
  static const fleetNew = '/home/fleet/new';
  static const fleetSos = '/home/fleet/sos';
  static String fleetDetail(String id) => '/home/fleet/$id';
  static const approvals = '/home/approvals';
  static String approvalDetail(String instanceId) =>
      '/home/approvals/$instanceId';
  static const more = '/more';
  static const outbox = '/more/outbox';
  static const activity = '/more/activity';
}
