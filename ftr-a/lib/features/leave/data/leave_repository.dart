import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'leave_repository.g.dart';

/// `/leave/*` (doc 03 §16.2). Filing and cancelling are idempotent and go
/// through the outbox so they work offline.
class LeaveRepository {
  LeaveRepository(this._dio, this._outbox);

  final Dio _dio;
  final OutboxService _outbox;

  Future<List<LeaveType>> types() async {
    try {
      final res = await _dio.get<Object?>('/leave/types');
      return [
        for (final e in Envelope.data(res.data)! as List)
          LeaveType.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<LeavePolicyInfo> policy() async {
    try {
      final res = await _dio.get<Object?>('/leave/policy');
      return LeavePolicyInfo.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<LeaveBalance>> balances({int? year}) async {
    try {
      final res = await _dio.get<Object?>(
        '/leave/balances',
        queryParameters: {'year': ?year},
      );
      return [
        for (final e in Envelope.data(res.data)! as List)
          LeaveBalance.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<LeaveRequestItem>> requests({
    String scope = 'mine',
    LeaveStatus? status,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/leave/requests',
        queryParameters: {
          'scope': scope,
          'pageSize': 100,
          if (status != null) 'status': status.wire,
        },
      );
      return Envelope.page(res.data, LeaveRequestItem.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<LeaveRequestItem> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/leave/requests/$id');
      return LeaveRequestItem.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// [label] is shown in the Sync queue if the request has to wait offline.
  Future<SendResult> apply({
    required String leaveTypeId,
    required String startDate,
    required String endDate,
    required String reason,
    required String label,
    String? id,
    HalfDay? halfDay,
    String? attachmentFileId,
  }) => _outbox.sendOrQueue(
    method: id == null ? 'POST' : 'PUT',
    endpoint: id == null ? '/leave/requests' : '/leave/requests/$id',
    label: label,
    payload: {
      'leaveTypeId': leaveTypeId,
      'startDate': startDate,
      'endDate': endDate,
      'halfDay': halfDay?.wire,
      'reason': reason,
      'attachmentFileId': ?attachmentFileId,
    },
  );

  Future<SendResult> cancel(
    String id, {
    required String label,
    String? reason,
  }) => _outbox.sendOrQueue(
    method: 'POST',
    endpoint: '/leave/requests/$id/cancel',
    label: label,
    payload: {'reason': ?reason},
  );
}

@Riverpod(keepAlive: true)
LeaveRepository leaveRepository(Ref ref) =>
    LeaveRepository(ref.watch(dioProvider), ref.watch(outboxServiceProvider));
