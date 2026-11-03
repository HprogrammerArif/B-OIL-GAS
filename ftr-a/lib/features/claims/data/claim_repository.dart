import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'claim_repository.g.dart';

/// `/claims/*` (doc 03 §17). Drafts are online-only because receipts are
/// uploaded first and the server computes entitlements and policy flags.
class ClaimRepository {
  ClaimRepository(this._dio);

  final Dio _dio;

  Future<ClaimPolicyInfo> policy() async {
    try {
      final res = await _dio.get<Object?>('/claims/policy');
      return ClaimPolicyInfo.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// [scope]: `mine`, `team` or `payable`.
  Future<List<Claim>> list({String scope = 'mine'}) async {
    try {
      final res = await _dio.get<Object?>(
        '/claims',
        queryParameters: {'scope': scope, 'pageSize': 100},
      );
      return Envelope.page(res.data, Claim.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Claim> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/claims/$id');
      return Claim.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Claim> save({String? id, required Map<String, Object?> body}) async {
    try {
      final res = id == null
          ? await _dio.post<Object?>('/claims', data: body)
          : await _dio.put<Object?>('/claims/$id', data: body);
      return Claim.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Claim> _action(String id, String action) async {
    try {
      final res = await _dio.post<Object?>('/claims/$id/$action');
      return Claim.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Claim> submit(String id) => _action(id, 'submit');
  Future<Claim> cancel(String id) => _action(id, 'cancel');
  Future<Claim> pay(String id) => _action(id, 'pay');

  Future<List<Advance>> advances({String scope = 'mine'}) async {
    try {
      final res = await _dio.get<Object?>(
        '/claims/advances',
        queryParameters: {'scope': scope, 'pageSize': 100},
      );
      return Envelope.page(res.data, Advance.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Advance> requestAdvance({
    required double amount,
    required String purpose,
    required String tourStart,
    required String tourEnd,
  }) async {
    try {
      final res = await _dio.post<Object?>(
        '/claims/advances',
        data: {
          'amount': amount,
          'purpose': purpose,
          'tourStart': tourStart,
          'tourEnd': tourEnd,
        },
      );
      return Advance.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Advance> _advanceAction(String id, String action) async {
    try {
      final res = await _dio.post<Object?>('/claims/advances/$id/$action');
      return Advance.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Advance> cancelAdvance(String id) => _advanceAction(id, 'cancel');
  Future<Advance> disburseAdvance(String id) => _advanceAction(id, 'disburse');
}

@Riverpod(keepAlive: true)
ClaimRepository claimRepository(Ref ref) =>
    ClaimRepository(ref.watch(dioProvider));
