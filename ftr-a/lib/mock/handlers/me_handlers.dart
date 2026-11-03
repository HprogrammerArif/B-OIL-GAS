import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

const _bloodGroups = {'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'};
const _channels = {'IN_APP', 'PUSH', 'SMS', 'EMAIL'};
final _hhmm = RegExp(r'^\d{2}:\d{2}$');

/// `GET /me` body (doc 03 §3): user + employee profile without HR-only fields.
Json toMe(MockStore store, Json user) {
  final emp = store.get(Col.employees, user.str('employeeId'))!;
  const hidden = {
    'userId',
    'email',
    'sapPernr',
    'nationalId',
    'emergencyContact',
    'exitDate',
    'exitReason',
    'clearance',
  };
  final employee = {
    for (final e in emp.entries)
      if (!hidden.contains(e.key)) e.key: e.value,
  };
  return {
    'id': user['id'],
    'email': user['email'],
    'phone': emp['phone'],
    'preferredLang': user['preferredLang'],
    'mfaEnabled': user['mfaEnabled'],
    'lastLoginAt': user['lastLoginAt'],
    'employee': employee,
    'roles': [
      for (final key in user.strList('roles'))
        {'key': key, 'name': roleNames[key] ?? key, 'siteId': null},
    ],
  };
}

Json _defaultPrefs(Json user) => {
  'id': user['id'],
  'lang': user['preferredLang'],
  'theme': 'SYSTEM',
  'notifications': {
    'channels': ['IN_APP', 'PUSH'],
    'quietStart': null,
    'quietEnd': null,
  },
};

Json _publicPrefs(Json prefs) => {
  for (final e in prefs.entries)
    if (e.key != 'id') e.key: e.value,
};

List<RouteDef> meRoutes() => [
  RouteDef('GET', '/me', (ctx) async {
    final a = ctx.requireAuth();
    return ok(toMe(ctx.store, a.user));
  }),
  RouteDef('PATCH', '/me', (ctx) async {
    final a = ctx.requireAuth();
    final body = ctx.bodyObject();
    final lang = body['preferredLang'];
    if (lang != null && lang != 'EN' && lang != 'BN') {
      throw validationError('preferredLang', 'Language must be EN or BN');
    }
    final emp = body['employee'];
    String? emergency;
    String? blood;
    if (emp != null) {
      if (emp is! Map) throw validationError('employee', 'Invalid profile');
      final e = Map<String, Object?>.from(emp);
      final ec = e['emergencyContact'];
      if (ec != null) {
        if (ec is! String || ec.trim().length < 5 || ec.trim().length > 80) {
          throw validationError(
            'employee.emergencyContact',
            'Emergency contact must be 5 to 80 characters',
          );
        }
        emergency = ec.trim();
      }
      final bg = e['bloodGroup'];
      if (bg != null) {
        if (bg is! String || !_bloodGroups.contains(bg)) {
          throw validationError('employee.bloodGroup', 'Invalid blood group');
        }
        blood = bg;
      }
    }
    if (lang != null) a.user['preferredLang'] = lang;
    if (emergency != null) a.employee['emergencyContact'] = emergency;
    if (blood != null) a.employee['bloodGroup'] = blood;
    ctx.store
      ..touch(Col.users, a.user)
      ..touch(Col.employees, a.employee);
    // Field names only: values (emergency contact etc.) are PII.
    AuditEngine.log(
      ctx.store,
      action: 'PROFILE_UPDATED',
      entityType: 'Employee',
      actorUserId: a.user.str('id'),
      entityId: a.employee.str('id'),
      after: {
        'fields': [
          if (lang != null) 'preferredLang',
          if (emergency != null) 'emergencyContact',
          if (blood != null) 'bloodGroup',
        ],
      },
    );
    await ctx.store.commit();
    return ok(toMe(ctx.store, a.user));
  }),
  RouteDef('GET', '/me/permissions', (ctx) async {
    final a = ctx.requireAuth();
    return ok({'grants': a.grants, 'navigation': navigationFor(a.grants)});
  }),
  RouteDef('GET', '/me/preferences', (ctx) async {
    final a = ctx.requireAuth();
    final prefs =
        ctx.store.get(Col.preferences, a.user.str('id')) ??
        _defaultPrefs(a.user);
    return ok(_publicPrefs(prefs));
  }),
  RouteDef('PATCH', '/me/preferences', (ctx) async {
    final a = ctx.requireAuth();
    final body = ctx.bodyObject();
    final current =
        ctx.store.get(Col.preferences, a.user.str('id')) ??
        _defaultPrefs(a.user);

    final lang = body['lang'];
    if (lang != null && lang != 'EN' && lang != 'BN') {
      throw validationError('lang', 'Language must be EN or BN');
    }
    final theme = body['theme'];
    if (theme != null && !{'LIGHT', 'DARK', 'SYSTEM'}.contains(theme)) {
      throw validationError('theme', 'Invalid theme');
    }
    final notif = Map<String, Object?>.from(current.obj('notifications'));
    final rawNotif = body['notifications'];
    if (rawNotif != null) {
      if (rawNotif is! Map) {
        throw validationError('notifications', 'Invalid notification settings');
      }
      final n = Map<String, Object?>.from(rawNotif);
      final ch = n['channels'];
      if (ch != null) {
        if (ch is! List || ch.any((c) => !_channels.contains(c))) {
          throw validationError('notifications.channels', 'Invalid channel');
        }
        // IN_APP can never be removed.
        notif['channels'] = <String>{'IN_APP', ...ch.cast<String>()}.toList();
      }
      for (final k in const ['quietStart', 'quietEnd']) {
        if (!n.containsKey(k)) continue;
        final v = n[k];
        if (v != null && (v is! String || !_hhmm.hasMatch(v))) {
          throw validationError('notifications.$k', 'Use HH:mm');
        }
        notif[k] = v;
      }
    }
    final next = <String, Object?>{
      'id': a.user['id'],
      'lang': lang ?? current['lang'],
      'theme': theme ?? current['theme'],
      'notifications': notif,
    };
    ctx.store.put(Col.preferences, next);
    if (lang != null) {
      a.user['preferredLang'] = lang;
      ctx.store.touch(Col.users, a.user);
    }
    AuditEngine.log(
      ctx.store,
      action: 'PREFERENCES_UPDATED',
      entityType: 'User',
      actorUserId: a.user.str('id'),
      entityId: a.user.str('id'),
      after: {
        'fields': [
          if (lang != null) 'lang',
          if (theme != null) 'theme',
          if (rawNotif != null) 'notifications',
        ],
      },
    );
    await ctx.store.commit();
    return ok(_publicPrefs(next));
  }),
];
