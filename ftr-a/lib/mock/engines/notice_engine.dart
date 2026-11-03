import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Notices & broadcasts (doc 06 §2, `Setting notices.*`).
abstract final class NoticePolicy {
  static const int maxPinned = 5;
  static const int defaultExpiryDays = 90;
  static const int titleMax = 200;
  static const int bodyMax = 20000;
  static const List<String> categories = [
    'GENERAL',
    'POLICY',
    'SAFETY',
    'OPERATIONS',
    'ADMIN',
    'HR',
    'EXECUTIVE',
  ];
  static const List<String> priorities = ['NORMAL', 'HIGH', 'CRITICAL'];
}

abstract final class NoticeEngine {
  static String receiptId(String noticeId, String employeeId) =>
      '$noticeId:$employeeId';

  static String nextRef(MockStore store, int year) {
    var max = 0;
    for (final n in store.all(Col.notices)) {
      final ref = n.str('refNo');
      if (ref.startsWith('NOT-$year-')) {
        final v = int.tryParse(ref.substring(ref.lastIndexOf('-') + 1)) ?? 0;
        if (v > max) max = v;
      }
    }
    return 'NOT-$year-${(max + 1).toString().padLeft(4, '0')}';
  }

  /// Categories a user may publish (BR-01 role table). POLICY goes through
  /// the `NOTICE_PUBLISH` approval, which arrives with the Approvals Center.
  static List<String> allowedCategories(List<String> roles) {
    final out = <String>{};
    if (roles.contains('CHAIRMAN') || roles.contains('EXECUTIVE_ASSISTANT')) {
      out.add('EXECUTIVE');
    }
    if (roles.contains('HR_ADMIN') || roles.contains('CHAIRMAN')) {
      out.addAll(['GENERAL', 'HR', 'ADMIN', 'OPERATIONS', 'SAFETY']);
    }
    if (roles.contains('PLANT_GM') || roles.contains('HOD')) {
      out.addAll(['GENERAL', 'OPERATIONS', 'SAFETY', 'ADMIN']);
    }
    if (roles.contains('HSE_OFFICER')) out.add('SAFETY');
    return [
      for (final c in NoticePolicy.categories)
        if (out.contains(c)) c,
    ];
  }

  /// Active employees an audience reaches (BR-01-01).
  static List<Json> resolveAudience(MockStore store, Json audience) {
    final type = audience['type'];
    final ids = audience.strList('ids');
    return [
      for (final e in store.all(Col.employees))
        if (e['status'] == 'ACTIVE' &&
            e['userId'] != null &&
            (type == 'ALL' ||
                (type == 'DEPARTMENT' &&
                    ids.contains(e.obj('department').str('id'))) ||
                (type == 'SITE' && ids.contains(e.obj('site').str('id')))))
          e,
    ];
  }

  static Json audienceLabel(MockStore store, Json audience) {
    final type = audience['type'];
    if (type == 'ALL') return {'en': 'All employees', 'bn': 'সকল কর্মচারী'};
    final ids = audience.strList('ids');
    final names = <String>[];
    final namesBn = <String>[];
    final list = type == 'DEPARTMENT' ? departments : sites;
    for (final item in list) {
      if (ids.contains(item['id'])) {
        names.add(item.str('name'));
        namesBn.add(item.str('nameBn'));
      }
    }
    return {'en': names.join(', '), 'bn': namesBn.join(', ')};
  }

  static Json authorRef(MockStore store, String? employeeId) {
    final e = employeeId == null ? null : store.get(Col.employees, employeeId);
    return {
      'name': e?['fullName'] ?? 'BOGCL',
      'nameBn': e?['fullNameBn'] ?? 'বিওজিসিএল',
      'title': e?.obj('designation')['title'] ?? '',
      'titleBn': e?.obj('designation')['titleBn'] ?? '',
    };
  }

  static Json stats(MockStore store, String noticeId) {
    final rows = store
        .all(Col.noticeReceipts)
        .where((r) => r['noticeId'] == noticeId)
        .toList();
    return {
      'recipientCount': rows.length,
      'readCount': rows.where((r) => r['readAt'] != null).length,
      'ackCount': rows.where((r) => r['ackedAt'] != null).length,
    };
  }

  static bool isActive(Json notice) {
    if (notice['status'] != 'PUBLISHED') return false;
    final exp = notice.strOrNull('expiresAt');
    return exp == null || DateTime.parse(exp).isAfter(DateTime.now().toUtc());
  }

  /// List/detail shape for one recipient.
  static Json wire(
    MockStore store,
    Json n,
    Json? receipt, {
    bool detail = false,
    bool manager = false,
  }) {
    final body = n.str('body');
    return {
      'id': n['id'],
      'refNo': n['refNo'],
      'title': n['title'],
      'titleBn': n['titleBn'],
      'excerpt': body.length > 140 ? '${body.substring(0, 140)}…' : body,
      'category': n['category'],
      'priority': n['priority'],
      'requiresAck': n['requiresAck'],
      'isPinned': n['isPinned'],
      'status': n['status'],
      'publishedAt': n['publishedAt'],
      'expiresAt': n['expiresAt'],
      'author': authorRef(store, n.strOrNull('authorEmployeeId')),
      'readAt': receipt?['readAt'],
      'ackedAt': receipt?['ackedAt'],
      if (detail) ...{
        'body': n['body'],
        'bodyBn': n['bodyBn'],
        'audience': audienceLabel(store, n.obj('audience')),
        if (manager) 'stats': stats(store, n.str('id')),
      },
    };
  }

  static Json publish(
    MockStore store,
    AuthContext auth,
    Json body,
  ) {
    final roles = auth.user.strList('roles');
    final title = _text(body, 'title', 3, NoticePolicy.titleMax);
    final text = _text(body, 'body', 5, NoticePolicy.bodyMax);
    final titleBn = _optText(body, 'titleBn', NoticePolicy.titleMax);
    final textBn = _optText(body, 'bodyBn', NoticePolicy.bodyMax);
    final category = body['category'];
    if (category is! String || !NoticePolicy.categories.contains(category)) {
      throw validationError('category', 'Choose a category');
    }
    if (!allowedCategories(roles).contains(category)) {
      throw forbidden('You cannot publish $category notices');
    }
    final priority = body['priority'] ?? 'NORMAL';
    if (priority is! String || !NoticePolicy.priorities.contains(priority)) {
      throw validationError('priority', 'Choose a priority');
    }
    final audience = _audience(auth, body['audience']);
    final recipients = resolveAudience(store, audience);
    if (recipients.isEmpty) {
      throw validationError('audience', 'This audience has no recipients');
    }
    final pinned = body['isPinned'] == true;
    if (pinned) {
      final count = store
          .all(Col.notices)
          .where((n) => n['isPinned'] == true && isActive(n))
          .length;
      if (count >= NoticePolicy.maxPinned) {
        throw HttpError(
          ApiErrorCode.conflict,
          'Up to ${NoticePolicy.maxPinned} notices can be pinned',
          details: [
            {'rule': 'MAX_PINNED'},
          ],
        );
      }
    }
    final now = DateTime.fromMillisecondsSinceEpoch(store.nowMs(), isUtc: true);
    final id = 'not_${store.collection(Col.notices).length + 1}_${store.nowMs()}';
    final notice = <String, Object?>{
      'id': id,
      'refNo': nextRef(store, now.year),
      'title': title,
      'titleBn': titleBn ?? title,
      'body': text,
      'bodyBn': textBn ?? text,
      'category': category,
      'priority': priority,
      'requiresAck': body['requiresAck'] == true || priority == 'CRITICAL',
      'isPinned': pinned,
      'status': 'PUBLISHED',
      'audience': audience,
      'authorEmployeeId': auth.employeeId,
      'publishedAt': now.toIso8601String(),
      'expiresAt': now
          .add(const Duration(days: NoticePolicy.defaultExpiryDays))
          .toIso8601String(),
    };
    store.put(Col.notices, notice);
    for (final e in recipients) {
      store.put(Col.noticeReceipts, {
        'id': receiptId(id, e.str('id')),
        'noticeId': id,
        'employeeId': e['id'],
        'readAt': e['id'] == auth.employeeId ? now.toIso8601String() : null,
        'ackedAt': null,
      });
      if (e['id'] == auth.employeeId) continue;
      NotificationEngine.notify(
        store,
        userId: e.str('userId'),
        type: 'NOTICE_PUBLISHED',
        priority: priority == 'CRITICAL' ? 'CRITICAL' : 'NORMAL',
        title: Bi(title, titleBn ?? title),
        body: Bi(
          'New notice ${notice['refNo']}',
          'নতুন বিজ্ঞপ্তি ${notice['refNo']}',
        ),
        data: {'module': 'notices', 'route': '/home/notices/$id'},
        ackRequired: notice['requiresAck'] == true,
      );
    }
    AuditEngine.log(
      store,
      action: 'NOTICE_PUBLISHED',
      entityType: 'Notice',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {
        'refNo': notice['refNo'],
        'category': category,
        'recipients': recipients.length,
      },
    );
    return notice;
  }

  static Json _audience(AuthContext auth, Object? raw) {
    if (raw is! Map) throw validationError('audience', 'Choose an audience');
    final a = Map<String, Object?>.from(raw);
    final type = a['type'];
    final grant = auth.grants
        .where((g) => g['key'] == 'notices:publish')
        .firstOrNull;
    final scope = grant?.strOrNull('scope') ?? 'SELF';
    final dept = auth.employee.obj('department').str('id');
    final site = auth.employee.obj('site').str('id');
    if (type == 'ALL') {
      if (scope != 'COMPANY') throw forbidden('You cannot publish to everyone');
      return {'type': 'ALL', 'ids': <String>[]};
    }
    if (type != 'DEPARTMENT' && type != 'SITE') {
      throw validationError('audience', 'Choose an audience');
    }
    final ids = a.strList('ids');
    if (ids.isEmpty) throw validationError('audience', 'Choose an audience');
    final valid = {
      for (final x in type == 'DEPARTMENT' ? departments : sites) x.str('id'),
    };
    if (!ids.every(valid.contains)) {
      throw validationError('audience', 'Unknown audience');
    }
    if (scope == 'DEPARTMENT') {
      if (type != 'DEPARTMENT' || ids.any((i) => i != dept)) {
        throw forbidden('Outside your scope');
      }
    } else if (scope == 'SITE') {
      if (type == 'SITE' && ids.any((i) => i != site)) {
        throw forbidden('Outside your scope');
      }
    } else if (scope != 'COMPANY') {
      throw forbidden('Outside your scope');
    }
    return {'type': type, 'ids': ids};
  }

  static String _text(Json body, String key, int min, int max) {
    final v = body[key];
    final s = v is String ? v.trim() : '';
    if (s.length < min) throw validationError(key, '$key is too short');
    if (s.length > max) throw validationError(key, '$key is too long');
    return s;
  }

  static String? _optText(Json body, String key, int max) {
    final v = body[key];
    if (v == null) return null;
    if (v is! String || v.trim().length > max) {
      throw validationError(key, '$key is invalid');
    }
    final s = v.trim();
    return s.isEmpty ? null : s;
  }
}
