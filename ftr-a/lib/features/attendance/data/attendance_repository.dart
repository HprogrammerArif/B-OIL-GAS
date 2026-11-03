import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'attendance_repository.g.dart';

/// `/attendance/*` (doc 03 §16.1). Punching and regularising are idempotent
/// and go through the outbox, so an offline punch keeps its original time.
class AttendanceRepository {
  AttendanceRepository(this._dio, this._outbox, this._secure);

  final Dio _dio;
  final OutboxService _outbox;
  final SecureStore _secure;

  Future<TodayAttendance> today({double? lat, double? lng}) async {
    try {
      final res = await _dio.get<Object?>(
        '/attendance/me/today',
        queryParameters: {'lat': ?lat, 'lng': ?lng},
      );
      return TodayAttendance.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// [from] and [to] are `YYYY-MM-DD`.
  Future<AttendanceRange> range(String from, String to) async {
    try {
      final res = await _dio.get<Object?>(
        '/attendance/me',
        queryParameters: {'from': from, 'to': to},
      );
      return AttendanceRange.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<Regularisation>> regularisations() async {
    try {
      final res = await _dio.get<Object?>('/attendance/regularisations');
      return [
        for (final e in Envelope.data(res.data)! as List)
          Regularisation.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<String> _deviceId() async {
    var id = await _secure.read(SecureKeys.deviceId);
    if (id == null) {
      id = 'android-${const Uuid().v4()}';
      await _secure.write(SecureKeys.deviceId, id);
    }
    return id;
  }

  Future<SendResult> punch({
    required String type,
    required LocationFix fix,
    required String label,
    String? note,
  }) async {
    final deviceId = await _deviceId();
    return await _outbox.sendOrQueue(
      method: 'POST',
      endpoint: '/attendance/punch',
      label: label,
      payload: {
        'type': type,
        'punchedAt': DateTime.now().toUtc().toIso8601String(),
        'lat': fix.lat,
        'lng': fix.lng,
        'accuracyM': fix.accuracyM,
        'isMockLocation': fix.isMock,
        'platform': 'ANDROID',
        'deviceId': deviceId,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
  }

  Future<SendResult> regularise({
    required String date,
    required RegularisationType type,
    required String reason,
    required String label,
    DateTime? requestedIn,
    DateTime? requestedOut,
  }) => _outbox.sendOrQueue(
    method: 'POST',
    endpoint: '/attendance/regularisations',
    label: label,
    payload: {
      'date': date,
      'type': type.wire,
      'reason': reason.trim(),
      'requestedIn': requestedIn?.toUtc().toIso8601String(),
      'requestedOut': requestedOut?.toUtc().toIso8601String(),
    },
  );
}

@Riverpod(keepAlive: true)
AttendanceRepository attendanceRepository(Ref ref) => AttendanceRepository(
  ref.watch(dioProvider),
  ref.watch(outboxServiceProvider),
  ref.watch(secureStoreProvider),
);
