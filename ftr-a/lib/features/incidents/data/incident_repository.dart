import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'incident_repository.g.dart';

/// `/incidents/*` (doc 03 §13).
class IncidentRepository {
  IncidentRepository(this._dio);

  final Dio _dio;

  Future<List<SafetyIncident>> list({
    String view = 'mine',
    String? query,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/incidents',
        queryParameters: {
          'view': view,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, SafetyIncident.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<SafetyIncident> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/incidents/$id');
      return SafetyIncident.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<IncidentZone>> zones(String? siteId) async {
    try {
      final res = await _dio.get<Object?>(
        '/incidents/zones',
        queryParameters: {'siteId': ?siteId},
      );
      return [
        for (final e in Envelope.data(res.data)! as List)
          IncidentZone.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<SafetyIncident> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/incidents', data: body);
      return SafetyIncident.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<SafetyIncident> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/incidents/$id/$verb', data: body);
      return SafetyIncident.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<SafetyIncident> saveRca(String id, Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/incidents/$id/rca', data: body);
      return SafetyIncident.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<SafetyIncident> capaAct(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/capas/$id/$verb', data: body);
      return SafetyIncident.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
IncidentRepository incidentRepository(Ref ref) =>
    IncidentRepository(ref.watch(dioProvider));
