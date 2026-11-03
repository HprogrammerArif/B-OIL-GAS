import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'dio_client.g.dart';

/// Base path of the (mock) API (doc 03 §1.1).
const apiBasePath = '/api/v1';

/// The only transport. Fails closed (connection error) until the in-app mock
/// server adapter is registered in Phase 1d by overriding this provider. No
/// real backend is ever contacted.
@Riverpod(keepAlive: true)
HttpClientAdapter httpAdapter(Ref ref) => _ClosedAdapter();

class _ClosedAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) {
    throw DioException.connectionError(
      requestOptions: options,
      reason: 'No transport configured',
    );
  }

  @override
  void close({bool force = false}) {}
}

/// Exchanges the refresh token for new tokens (true on success). The default
/// never refreshes; `main.dart` wires the session controller in.
@Riverpod(keepAlive: true)
Future<bool> Function() tokenRefresher(Ref ref) =>
    () async => false;

/// Shared Dio instance used by every repository.
@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://mock.bogcl.local$apiBasePath',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      contentType: Headers.jsonContentType,
    ),
  )..httpClientAdapter = ref.watch(httpAdapterProvider);

  final secure = ref.watch(secureStoreProvider);
  dio.interceptors.addAll([
    SessionInterceptor(
      accessToken: () => secure.read(SecureKeys.accessToken),
      languageCode: () => ref.read(localeControllerProvider).languageCode,
    ),
    IdempotencyInterceptor(),
    ErrorMappingInterceptor(),
    RefreshInterceptor(
      dio: dio,
      refresh: () => ref.read(tokenRefresherProvider)(),
    ),
  ]);
  return dio;
}
