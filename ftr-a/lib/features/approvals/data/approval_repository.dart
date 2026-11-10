import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approval_repository.g.dart';

/// `/workflow/*` for the Approvals Center. Decisions are online-only: they are
/// final, audited and may race with another approver.
class ApprovalRepository {
  ApprovalRepository(this._dio);

  final Dio _dio;

  Future<List<InboxItem>> inbox() async {
    try {
      final res = await _dio.get<Object?>(
        '/workflow/inbox',
        queryParameters: {'pageSize': 100},
      );
      return Envelope.page(res.data, InboxItem.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<InboxSummary> summary() async {
    try {
      final res = await _dio.get<Object?>('/workflow/inbox/summary');
      return InboxSummary.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<HistoryItem>> history() async {
    try {
      final res = await _dio.get<Object?>(
        '/workflow/history',
        queryParameters: {'pageSize': 100},
      );
      return Envelope.page(res.data, HistoryItem.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<ApprovalDetail> detail(String instanceId) async {
    try {
      final res = await _dio.get<Object?>('/workflow/instances/$instanceId');
      return ApprovalDetail.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<Person>> delegates() async {
    try {
      final res = await _dio.get<Object?>('/workflow/delegates');
      return [
        for (final e in Envelope.data(res.data)! as List)
          Person.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> _act(String instanceId, Map<String, Object?> body) async {
    try {
      await _dio.post<Object?>(
        '/workflow/instances/$instanceId/actions',
        data: body,
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> approve(
    String instanceId, {
    String? comment,
    Map<String, Object?>? signature,
  }) => _act(instanceId, {
    'type': 'APPROVE',
    'comment': ?comment,
    'signature':
        signature ?? {'method': 'TYPED', 'typedName': 'Digital E-Sign'},
  });

  Future<void> reject(
    String instanceId, {
    required String comment,
    Map<String, Object?>? signature,
  }) => _act(instanceId, {
    'type': 'REJECT',
    'comment': comment,
    'signature': ?signature,
  });

  Future<void> returnForChanges(
    String instanceId, {
    required String comment,
    Map<String, Object?>? signature,
  }) => _act(instanceId, {
    'type': 'RETURN',
    'comment': comment,
    'signature': ?signature,
  });

  Future<void> delegate(String instanceId, {required String toUserId}) =>
      _act(instanceId, {'type': 'DELEGATE', 'delegateToUserId': toUserId});

  Future<void> comment(String instanceId, {required String text}) =>
      _act(instanceId, {'type': 'COMMENT', 'comment': text});

  Future<void> withdraw(String instanceId, {String? comment}) =>
      _act(instanceId, {'type': 'WITHDRAW', 'comment': ?comment});

  /// Approves several requests; returns how many succeeded and failed.
  Future<({int approved, int failed})> approveMany(List<String> ids) async {
    try {
      final res = await _dio.post<Object?>(
        '/workflow/instances/batch-actions',
        data: {'type': 'APPROVE', 'instanceIds': ids},
      );
      final rows = Envelope.data(res.data)! as List;
      final ok = rows.where((r) => (r! as Map)['ok'] == true).length;
      return (approved: ok, failed: rows.length - ok);
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
ApprovalRepository approvalRepository(Ref ref) =>
    ApprovalRepository(ref.watch(dioProvider));
