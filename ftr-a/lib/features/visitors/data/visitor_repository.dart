import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'visitor_repository.g.dart';

@riverpod
VisitorRepository visitorRepository(Ref ref) =>
    VisitorRepository(ref.watch(dioProvider));

class VisitorRepository {
  VisitorRepository(this._dio);
  final Dio _dio;

  Future<List<Visitor>> list({String? status, String? category}) async {
    try {
      final res = await _dio.get<Object?>(
        '/visitors',
        queryParameters: {
          if (status != null) 'status': status,
          if (category != null) 'category': category,
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, Visitor.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/visitors/$id');
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/visitors', data: body);
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> checkIn(String id) async {
    try {
      final res = await _dio.post<Object?>('/visitors/$id/check-in');
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> checkOut(String id) async {
    try {
      final res = await _dio.post<Object?>('/visitors/$id/check-out');
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> updatePpe(String id, Map<String, bool> ppe) async {
    try {
      final res = await _dio.patch<Object?>(
        '/visitors/$id/ppe',
        data: {'ppeCleared': ppe},
      );
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> completeBriefing(String id) async {
    try {
      final res = await _dio.post<Object?>('/visitors/$id/briefing');
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visitor> cancel(String id) async {
    try {
      final res = await _dio.delete<Object?>('/visitors/$id');
      return Visitor.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}
