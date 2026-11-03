import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Authenticated caller resolved by the server for each request.
class AuthContext {
  const AuthContext({
    required this.user,
    required this.employee,
    required this.session,
    required this.grants,
  });

  final Json user;
  final Json employee;
  final Json session;
  final List<Json> grants;

  String get employeeId => employee.str('id');
}

class HandlerContext {
  const HandlerContext({
    required this.req,
    required this.params,
    required this.store,
    required this.auth,
    required this.blobs,
  });

  final MockRequest req;
  final Map<String, String> params;
  final MockStore store;
  final AuthContext? auth;

  /// Private object storage (presigned-upload stand-in).
  final BlobStore blobs;

  Map<String, String> get query => req.query;
  Object? get body => req.body;

  AuthContext requireAuth() =>
      auth ?? (throw unauthenticated('Authentication required'));

  /// JSON object body or a validation error.
  Json bodyObject() {
    final b = req.body;
    if (b is Map) return Map<String, Object?>.from(b);
    throw validationError('body', 'Request body must be a JSON object');
  }

  Json? _grant(String key) {
    final a = auth;
    if (a == null) return null;
    for (final g in a.grants) {
      if (g['key'] == key) return g;
    }
    return null;
  }

  bool can(String key, [GrantScope atLeast = GrantScope.self]) {
    final g = _grant(key);
    return g != null && scopeFromWire(g.str('scope')).index >= atLeast.index;
  }

  /// Returns the grant or throws FORBIDDEN.
  Json requirePermission(String key, [GrantScope atLeast = GrantScope.self]) {
    final g = _grant(key);
    if (g == null || scopeFromWire(g.str('scope')).index < atLeast.index) {
      throw forbidden();
    }
    return g;
  }

  /// Row-level filter: the widest grant scope for [key] decides visibility
  /// (doc 01 `scopeWhere`). Repositories apply this, never the client.
  bool inScope(
    String key, {
    String? ownerEmployeeId,
    String? departmentId,
    String? siteId,
    String? teamManagerId,
  }) {
    final a = auth;
    final g = _grant(key);
    if (a == null || g == null) return false;
    final meId = a.employeeId;
    switch (scopeFromWire(g.str('scope'))) {
      case GrantScope.company:
        return true;
      case GrantScope.site:
        return siteId == null ||
            siteId == a.employee.obj('site').str('id') ||
            ownerEmployeeId == meId;
      case GrantScope.department:
        return departmentId == null ||
            departmentId == a.employee.obj('department').str('id') ||
            ownerEmployeeId == meId;
      case GrantScope.team:
        return teamManagerId == meId || ownerEmployeeId == meId;
      case GrantScope.self:
        return ownerEmployeeId == meId;
    }
  }
}

typedef Handler = Future<MockResponse> Function(HandlerContext ctx);

class RouteDef {
  const RouteDef(
    this.method,
    this.path,
    this.handler, {
    this.auth = true,
    this.permission = const [],
  });

  final String method;
  final String path;
  final Handler handler;

  /// Public routes (login, refresh) set `auth: false`.
  final bool auth;

  /// Any one of these keys admits the caller (doc 03 `x-permission`).
  final List<String> permission;
}

class _Compiled {
  _Compiled(this.def) : keys = [], regex = RegExp('^${_compile(def.path)}\$');

  final RouteDef def;
  final List<String> keys;
  final RegExp regex;

  static String _compile(String path) => path
      .split('/')
      .map((seg) => seg.startsWith(':') ? '([^/]+)' : RegExp.escape(seg))
      .join('/');
}

/// Route registry. Modules register their handlers at bootstrap.
class MockRouter {
  final List<_Compiled> _routes = [];

  void register(List<RouteDef> defs) {
    for (final d in defs) {
      final c = _Compiled(d);
      for (final seg in d.path.split('/')) {
        if (seg.startsWith(':')) c.keys.add(seg.substring(1));
      }
      _routes.add(c);
    }
  }

  ({RouteDef route, Map<String, String> params})? match(
    String method,
    String path,
  ) {
    for (final c in _routes) {
      if (c.def.method != method) continue;
      final m = c.regex.firstMatch(path);
      if (m == null) continue;
      final params = <String, String>{};
      for (var i = 0; i < c.keys.length; i++) {
        params[c.keys[i]] = Uri.decodeComponent(m.group(i + 1) ?? '');
      }
      return (route: c.def, params: params);
    }
    return null;
  }

  /// True when some route exists for the path under another method.
  bool pathExists(String path) => _routes.any((c) => c.regex.hasMatch(path));
}

HttpError routeNotFound(String method, String path) =>
    HttpError(ApiErrorCode.notFound, 'No route for $method $path');
