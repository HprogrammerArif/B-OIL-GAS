import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'visitor_repository.g.dart';

/// `/visits/*` (doc 03 §14).
class VisitorRepository {
  VisitorRepository(this._dio);

  final Dio _dio;

  Future<List<Visit>> list({
    String view = 'mine',
    String? status,
    String? category,
    String? query,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/visits',
        queryParameters: {
          'view': view,
          'status': ?status,
          'category': ?category,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, Visit.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visit> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/visits/$id');
      return Visit.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<VisitZone>> zones(String? siteId) async {
    try {
      final res = await _dio.get<Object?>(
        '/visits/zones',
        queryParameters: {'siteId': ?siteId},
      );
      return [
        for (final e in Envelope.data(res.data)! as List)
          VisitZone.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VisitMuster> muster() async {
    try {
      final res = await _dio.get<Object?>('/visits/muster');
      return VisitMuster.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VisitMuster> musterAct(String verb) async {
    try {
      final res = await _dio.post<Object?>('/visits/muster/$verb');
      return VisitMuster.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visit> scan(String q) async {
    try {
      final res = await _dio.post<Object?>('/visits/scan', data: {'q': q});
      return Visit.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visit> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/visits', data: body);
      return Visit.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Visit> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/visits/$id/$verb', data: body);
      return Visit.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
VisitorRepository visitorRepository(Ref ref) =>
    VisitorRepository(ref.watch(dioProvider));
