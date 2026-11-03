/// Route paths. Kept separate from the router so screens can navigate without
/// importing the router (which imports the screens).
abstract final class AppRoutes {
  static const loading = '/loading';
  static const login = '/login';
  static const home = '/home';
  static const inbox = '/inbox';
  static const more = '/more';
  static const outbox = '/more/outbox';
  static const activity = '/more/activity';
}
