import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fleet_repository.g.dart';

@riverpod
FleetRepository fleetRepository(Ref ref) =>
    FleetRepository(ref.watch(dioProvider));

class FleetRepository {
  FleetRepository(this._dio);
  final Dio _dio;

  Future<List<FleetVehicle>> vehicles() async {
    try {
      final res = await _dio.get<Object?>('/fleet/vehicles');
      return Envelope.page(res.data, FleetVehicle.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<FleetDriver>> drivers() async {
    try {
      final res = await _dio.get<Object?>('/fleet/drivers');
      return Envelope.page(res.data, FleetDriver.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<FleetRequisition>> requisitions({String? status}) async {
    try {
      final res = await _dio.get<Object?>(
        '/fleet/requisitions',
        queryParameters: {
          if (status != null) 'status': status,
        },
      );
      return Envelope.page(res.data, FleetRequisition.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/fleet/requisitions/$id');
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> createRequisition(Map<String, Object?> body) async {
    try {
      final res =
          await _dio.post<Object?>('/fleet/requisitions', data: body);
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> assign(
    String id,
    String vehicleId,
    String driverId,
  ) async {
    try {
      final res = await _dio.post<Object?>(
        '/fleet/requisitions/$id/assign',
        data: {'vehicleId': vehicleId, 'driverId': driverId},
      );
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> startTrip(String id) async {
    try {
      final res = await _dio.post<Object?>('/fleet/requisitions/$id/start');
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> completeTrip(
    String id, {
    required int endOdometer,
    required int rating,
    String? feedback,
  }) async {
    try {
      final res = await _dio.post<Object?>(
        '/fleet/requisitions/$id/complete',
        data: {
          'endOdometer': endOdometer,
          'tripRating': rating,
          if (feedback != null) 'tripFeedback': feedback,
        },
      );
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FleetRequisition> reject(String id, String reason) async {
    try {
      final res = await _dio.post<Object?>(
        '/fleet/requisitions/$id/reject',
        data: {'reason': reason},
      );
      return FleetRequisition.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}
