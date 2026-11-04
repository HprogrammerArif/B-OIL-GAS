import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'dashboard_repository.g.dart';

class DashboardRepository {
  DashboardRepository(this._dio);

  final Dio _dio;

  Future<Dashboard> me() async {
    try {
      final res = await _dio.get<Object?>('/dashboards/me');
      return Dashboard.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> publishBriefing(Map<String, Object?> body) async {
    try {
      await _dio.post<Object?>('/briefings', data: body);
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> playNextEvent() async {
    try {
      await _dio.post<Object?>('/demo/events/next');
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
DashboardRepository dashboardRepository(Ref ref) =>
    DashboardRepository(ref.watch(dioProvider));
