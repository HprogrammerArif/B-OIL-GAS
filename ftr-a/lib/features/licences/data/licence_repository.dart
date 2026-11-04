import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'licence_repository.g.dart';

/// `/licences/*` (doc 03 §12).
class LicenceRepository {
  LicenceRepository(this._dio);

  final Dio _dio;

  Future<List<Licence>> list({String view = 'mine', String? query}) async {
    try {
      final res = await _dio.get<Object?>(
        '/licences',
        queryParameters: {
          'view': view,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, Licence.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Licence> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/licences/$id');
      return Licence.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<LicenceType>> types() async {
    try {
      final res = await _dio.get<Object?>('/licences/types');
      return [
        for (final e in Envelope.data(res.data)! as List)
          LicenceType.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Licence> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/licences', data: body);
      return Licence.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Licence> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/licences/$id/$verb', data: body);
      return Licence.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Licence> tickItem(
    String id,
    String itemId,
    Map<String, Object?> body,
  ) async {
    try {
      final res = await _dio.patch<Object?>(
        '/licences/$id/checklist/$itemId',
        data: body,
      );
      return Licence.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
LicenceRepository licenceRepository(Ref ref) =>
    LicenceRepository(ref.watch(dioProvider));
