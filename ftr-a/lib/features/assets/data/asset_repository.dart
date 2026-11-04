import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_repository.g.dart';

/// `/assets/*` (doc 03 §11).
class AssetRepository {
  AssetRepository(this._dio);

  final Dio _dio;

  Future<List<Equipment>> list({String view = 'mine', String? query}) async {
    try {
      final res = await _dio.get<Object?>(
        '/assets',
        queryParameters: {
          'view': view,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, Equipment.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/assets/$id');
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<AssetCategory>> categories() async {
    try {
      final res = await _dio.get<Object?>('/assets/categories');
      return [
        for (final e in Envelope.data(res.data)! as List)
          AssetCategory.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/assets', data: body);
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/assets/$id/$verb', data: body);
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> patchChecklist(String id, Map<String, Object?> body) async {
    try {
      final res = await _dio.patch<Object?>(
        '/assets/$id/disposal/checklist',
        data: body,
      );
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> completeTransfer(String id, String tid) async {
    try {
      final res = await _dio.post<Object?>(
        '/assets/$id/transfer/$tid/complete',
        data: const {},
      );
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Equipment> woAct(
    String woId,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>(
        '/work-orders/$woId/$verb',
        data: body,
      );
      return Equipment.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
AssetRepository assetRepository(Ref ref) =>
    AssetRepository(ref.watch(dioProvider));
