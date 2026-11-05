import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'bus_repository.g.dart';

/// `/bus/*`. Seat actions are first-come-first-served and time-boxed, so they
/// are online-only; the server decides who holds a seat.
class BusRepository {
  BusRepository(this._dio);

  final Dio _dio;

  Future<List<BusRoute>> routes() async {
    try {
      final res = await _dio.get<Object?>('/bus/routes');
      return [
        for (final e in Envelope.data(res.data)! as List)
          BusRoute.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<BusRoute> route(String id) async {
    try {
      final res = await _dio.get<Object?>('/bus/routes/$id');
      return BusRoute.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<MySeat> mySeat() async {
    try {
      final res = await _dio.get<Object?>('/bus/my-seat');
      return MySeat.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<MySeat> _post(String path, [Map<String, Object?>? body]) async {
    try {
      final res = await _dio.post<Object?>(path, data: body);
      return MySeat.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<MySeat> join(String routeId) => _post('/bus/routes/$routeId/waitlist');

  Future<MySeat> accept(String entryId, {required String stopId}) =>
      _post('/bus/waitlist/$entryId/accept', {'stopId': stopId});

  Future<MySeat> decline(String entryId) =>
      _post('/bus/waitlist/$entryId/decline');

  Future<MySeat> cancelWait(String entryId) =>
      _post('/bus/waitlist/$entryId/cancel');

  Future<MySeat> release(
    String allocationId, {
    required String from,
    required String to,
    required String reason,
  }) => _post('/bus/allocations/$allocationId/release', {
    'from': from,
    'to': to,
    'reason': reason,
  });

  Future<MySeat> reclaim(String allocationId) =>
      _post('/bus/allocations/$allocationId/reclaim');

  Future<void> _adminPost(String path, Map<String, Object?>? body) async {
    try {
      await _dio.post<Object?>(path, data: body);
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> endAllocation(String allocationId) =>
      _adminPost('/bus/allocations/$allocationId/end', null);

  Future<void> setPriority(
    String entryId, {
    required int priority,
    String? reason,
  }) => _adminPost('/bus/waitlist/$entryId/priority', {
    'priority': priority,
    'reason': ?reason,
  });

  Future<void> broadcast({required String message, String? routeId}) =>
      _adminPost('/bus/broadcasts', {'message': message, 'routeId': ?routeId});

  Future<Map<String, Object?>> verify(String routeId, String query) async {
    try {
      final res = await _dio.post<Object?>(
        '/bus/routes/$routeId/verify',
        data: {'query': query},
      );
      return Envelope.object(res.data);
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> registerBus(Map<String, Object?> body) =>
      _adminPost('/bus/routes', body);

  Future<void> reassignBus(String routeId, String busNo) =>
      _adminPost('/bus/routes/$routeId/bus', {'busNo': busNo});

  Future<void> setSeat(
    String routeId,
    int seatNo, {
    String? category,
    bool? boarded,
  }) => _adminPost('/bus/routes/$routeId/seats/$seatNo', {
    'category': ?category,
    'boarded': ?boarded,
  });

  Future<Map<String, Object?>> seatMap(String routeId) async {
    try {
      final res = await _dio.get<Object?>('/bus/routes/$routeId');
      final admin = Envelope.object(res.data)['admin'];
      if (admin is Map) return Map<String, Object?>.from(admin);
      return const {};
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> requestSwap(String routeId, int seatNo) async {
    try {
      await _dio.post<Object?>(
        '/bus/routes/$routeId/swap',
        data: {'seatNo': seatNo},
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
BusRepository busRepository(Ref ref) => BusRepository(ref.watch(dioProvider));
