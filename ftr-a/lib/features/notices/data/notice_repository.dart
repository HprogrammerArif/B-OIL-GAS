import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notice_repository.g.dart';

/// `/notices/*` (doc 03 §5). Reads are online; publishing and acknowledging
/// need a connection because they change what other people see.
class NoticeRepository {
  NoticeRepository(this._dio);

  final Dio _dio;

  /// [filter]: `all`, `unread`, `ack` or `mine` (notices I published).
  Future<List<Notice>> list({String filter = 'all'}) async {
    try {
      final res = await _dio.get<Object?>(
        '/notices',
        queryParameters: {'filter': filter, 'pageSize': 100},
      );
      return Envelope.page(res.data, Notice.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Notice> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/notices/$id');
      return Notice.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Notice> acknowledge(String id) async {
    try {
      final res = await _dio.post<Object?>('/notices/$id/ack');
      return Notice.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoticeOptions> options() async {
    try {
      final res = await _dio.get<Object?>('/notices/options');
      return NoticeOptions.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Map<String, int>> unreadCount() async {
    try {
      final res = await _dio.get<Object?>('/notices/unread-count');
      final j = Envelope.object(res.data);
      return {
        'unread': (j['unread']! as num).toInt(),
        'awaitingAck': (j['awaitingAck']! as num).toInt(),
      };
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Notice> publish({
    required String title,
    required String body,
    required NoticeCategory category,
    required NoticePriority priority,
    required bool requiresAck,
    required bool isPinned,
    required String audienceType,
    List<String> audienceIds = const [],
  }) async {
    try {
      final res = await _dio.post<Object?>(
        '/notices',
        data: {
          'title': title,
          'body': body,
          'category': category.wire,
          'priority': priority.wire,
          'requiresAck': requiresAck,
          'isPinned': isPinned,
          'audience': {'type': audienceType, 'ids': audienceIds},
        },
      );
      return Notice.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoticeReceipts> receipts(String id) async {
    try {
      final res = await _dio.get<Object?>('/notices/$id/receipts');
      return NoticeReceipts.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
NoticeRepository noticeRepository(Ref ref) =>
    NoticeRepository(ref.watch(dioProvider));
