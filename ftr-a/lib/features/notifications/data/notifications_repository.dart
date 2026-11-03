import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/features/notifications/domain/notification_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notifications_repository.g.dart';

/// `/notifications*` (doc 03 §4.2). Writes are idempotent and go through the
/// outbox so they work offline.
class NotificationsRepository {
  NotificationsRepository(this._dio, this._outbox);

  final Dio _dio;
  final OutboxService _outbox;

  Future<Paged<AppNotification>> list({
    required int page,
    NotificationCategory category = NotificationCategory.all,
    bool unreadOnly = false,
    int pageSize = 20,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/notifications',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          if (category != NotificationCategory.all) 'category': category.wire,
          if (unreadOnly) 'unread': 'true',
        },
      );
      return Envelope.page(res.data, AppNotification.fromJson);
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<UnreadSummary> unreadSummary() async {
    try {
      final res = await _dio.get<Object?>('/notifications/unread-count');
      return UnreadSummary.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// [label] is the localised text shown in the Sync queue if this is queued.
  Future<SendResult> markRead(String id, {required String label}) =>
      _outbox.sendOrQueue(
        method: 'POST',
        endpoint: '/notifications/$id/read',
        label: label,
      );

  Future<SendResult> markAllRead({required String label}) =>
      _outbox.sendOrQueue(
        method: 'POST',
        endpoint: '/notifications/read-all',
        label: label,
        payload: const <String, Object?>{},
      );

  Future<SendResult> acknowledge(String id, {required String label}) =>
      _outbox.sendOrQueue(
        method: 'POST',
        endpoint: '/notifications/$id/ack',
        label: label,
      );
}

@Riverpod(keepAlive: true)
NotificationsRepository notificationsRepository(Ref ref) =>
    NotificationsRepository(
      ref.watch(dioProvider),
      ref.watch(outboxServiceProvider),
    );
