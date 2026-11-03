import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'parcel_repository.g.dart';

/// `/parcels/*` (doc 03 §10). Every movement is online: it writes the
/// hash-chained custody trail on the server.
class ParcelRepository {
  ParcelRepository(this._dio);

  final Dio _dio;

  /// [view]: `mine` (everything I am part of), `sent`, `incoming`,
  /// `carrying` or `all` (my site, or the company, by my scope).
  Future<List<Parcel>> list({
    String view = 'mine',
    String? status,
    String? query,
    bool stuckOnly = false,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/parcels',
        queryParameters: {
          'view': view,
          'status': ?status,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          if (stuckOnly) 'stuck': 'true',
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, Parcel.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Parcel> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/parcels/$id');
      return Parcel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Parcel> byTracking(String trackingNo) async {
    try {
      final res = await _dio.get<Object?>(
        '/parcels/by-tracking/${Uri.encodeComponent(trackingNo.trim())}',
      );
      return Parcel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<Person>> couriers() async {
    try {
      final res = await _dio.get<Object?>('/parcels/couriers');
      return [
        for (final e in Envelope.data(res.data)! as List)
          Person.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Parcel> save({required Map<String, Object?> body, String? id}) async {
    try {
      final res = id == null
          ? await _dio.post<Object?>('/parcels', data: body)
          : await _dio.put<Object?>('/parcels/$id', data: body);
      return Parcel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Parcel> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/parcels/$id/$verb', data: body);
      return Parcel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
ParcelRepository parcelRepository(Ref ref) =>
    ParcelRepository(ref.watch(dioProvider));
