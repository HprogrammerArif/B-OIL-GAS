import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fleet_repository.g.dart';

/// `/vehicle-requisitions` and `/trips` (doc 03 §15).
class FleetRepository {
  FleetRepository(this._dio);

  final Dio _dio;

  Future<List<VehicleRequisition>> list({
    String view = 'mine',
    String? query,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/vehicle-requisitions',
        queryParameters: {
          'view': view,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'pageSize': 100,
        },
      );
      return Envelope.page(res.data, VehicleRequisition.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VehicleRequisition> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/vehicle-requisitions/$id');
      return VehicleRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetEstimate> estimate({
    required String destination,
    required String tripType,
    required int passengers,
  }) async {
    try {
      final res = await _dio.get<Object?>(
        '/fleet/estimate',
        queryParameters: {
          'destination': destination,
          'tripType': tripType,
          'passengerCount': passengers,
        },
      );
      return FleetEstimate.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VehicleRequisition> create(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/vehicle-requisitions', data: body);
      return VehicleRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VehicleRequisition> act(
    String id,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>(
        '/vehicle-requisitions/$id/$verb',
        data: body,
      );
      return VehicleRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<VehicleRequisition> tripAct(
    String tripId,
    String verb, [
    Map<String, Object?> body = const {},
  ]) async {
    try {
      final res = await _dio.post<Object?>('/trips/$tripId/$verb', data: body);
      return VehicleRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetAssignable> assignable(String id) async {
    try {
      final res = await _dio.get<Object?>('/fleet/assignable/$id');
      return FleetAssignable.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> decideToll(String id, String verb) async {
    try {
      await _dio.post<Object?>('/toll-claims/$id/$verb');
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<FleetSos>> sosList() async {
    try {
      final res = await _dio.get<Object?>('/fleet/sos');
      return Envelope.page(res.data, FleetSos.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetSos> sendSos(Map<String, Object?> body) async {
    try {
      final res = await _dio.post<Object?>('/fleet/sos', data: body);
      return FleetSos.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> ackSos(String id) async {
    try {
      await _dio.post<Object?>('/fleet/sos/$id/ack');
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
FleetRepository fleetRepository(Ref ref) =>
    FleetRepository(ref.watch(dioProvider));
