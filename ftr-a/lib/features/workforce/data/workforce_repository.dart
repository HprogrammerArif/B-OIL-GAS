import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/workforce/domain/workforce_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'workforce_repository.g.dart';

/// `/employees` and `/exit-clearances` (doc 03 §20).
class WorkforceRepository {
  WorkforceRepository(this._dio);

  final Dio _dio;

  Future<List<StaffMember>> list({String view = 'all', String? query}) async {
    try {
      final res = await _dio.get<Object?>(
        '/employees',
        queryParameters: {
          'view': view,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, StaffMember.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/employees/$id');
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/employees', data: body);
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> offboard(String id, Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>(
        '/employees/$id/offboard',
        data: body,
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> reactivate(String id, Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>(
        '/employees/$id/reactivate',
        data: body,
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> clearItem(
    String exitId,
    String key,
    Map<String, Object?> body,
  ) async {
    try {
      final res = await _dio.post<Object?>(
        '/exit-clearances/$exitId/items/$key/clear',
        data: body,
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> reclaim(String exitId) async {
    try {
      final res = await _dio.post<Object?>(
        '/exit-clearances/$exitId/reclaim-assets',
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> finalize(String exitId, Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>(
        '/exit-clearances/$exitId/finalize',
        data: body,
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<StaffMember> cancel(String exitId, Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>(
        '/exit-clearances/$exitId/cancel',
        data: body,
      );
      return StaffMember.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
WorkforceRepository workforceRepository(Ref ref) =>
    WorkforceRepository(ref.watch(dioProvider));
