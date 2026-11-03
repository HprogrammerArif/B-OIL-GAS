import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'auth_repository.g.dart';

/// Tokens returned by login/refresh.
class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  factory AuthTokens.fromJson(Map<String, Object?> json) => AuthTokens(
    accessToken: json['accessToken']! as String,
    refreshToken: json['refreshToken']! as String,
  );

  final String accessToken;
  final String refreshToken;
}

/// Talks to `/auth/*` and `/me*` exactly as it would a real API.
class AuthRepository {
  AuthRepository(this._dio, this._secure);

  final Dio _dio;
  final SecureStore _secure;

  Future<Map<String, Object>> _device() async {
    var id = await _secure.read(SecureKeys.deviceId);
    if (id == null) {
      id = 'android-${const Uuid().v4()}';
      await _secure.write(SecureKeys.deviceId, id);
    }
    return {'id': id, 'name': 'Android device', 'platform': 'ANDROID'};
  }

  Future<AuthTokens> login(String identifier, String password) async {
    try {
      final res = await _dio.post<Object?>(
        '/auth/login',
        data: {
          'identifier': identifier.trim(),
          'password': password,
          'rememberMe': true,
          'device': await _device(),
        },
      );
      return AuthTokens.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// Demo menu persona switch (mock only).
  Future<AuthTokens> demoSession(String empCode) async {
    try {
      final res = await _dio.post<Object?>(
        '/demo/session',
        data: {'empCode': empCode, 'device': await _device()},
      );
      return AuthTokens.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<AuthTokens> refresh(String refreshToken) async {
    try {
      final res = await _dio.post<Object?>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      return AuthTokens.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post<Object?>('/auth/logout');
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<Session> loadSession() async {
    try {
      final me = await _dio.get<Object?>('/me');
      final perms = await _dio.get<Object?>('/me/permissions');
      final permBody = Envelope.object(perms.data);
      return Session(
        profile: Profile.fromJson(Envelope.object(me.data)),
        grants: [
          for (final g in permBody['grants']! as List)
            Grant.fromJson(Map<String, Object?>.from(g! as Map)),
        ],
        navigation: [
          for (final m in permBody['navigation']! as List) m! as String,
        ],
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> setPreferredLanguage(String lang) async {
    try {
      await _dio.patch<Object?>('/me', data: {'preferredLang': lang});
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) =>
    AuthRepository(ref.watch(dioProvider), ref.watch(secureStoreProvider));
