// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dio_client.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The only transport. Fails closed (connection error) until the in-app mock
/// server adapter is registered in Phase 1d by overriding this provider. No
/// real backend is ever contacted.

@ProviderFor(httpAdapter)
final httpAdapterProvider = HttpAdapterProvider._();

/// The only transport. Fails closed (connection error) until the in-app mock
/// server adapter is registered in Phase 1d by overriding this provider. No
/// real backend is ever contacted.

final class HttpAdapterProvider
    extends
        $FunctionalProvider<
          HttpClientAdapter,
          HttpClientAdapter,
          HttpClientAdapter
        >
    with $Provider<HttpClientAdapter> {
  /// The only transport. Fails closed (connection error) until the in-app mock
  /// server adapter is registered in Phase 1d by overriding this provider. No
  /// real backend is ever contacted.
  HttpAdapterProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'httpAdapterProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$httpAdapterHash();

  @$internal
  @override
  $ProviderElement<HttpClientAdapter> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  HttpClientAdapter create(Ref ref) {
    return httpAdapter(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(HttpClientAdapter value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<HttpClientAdapter>(value),
    );
  }
}

String _$httpAdapterHash() => r'8ed1b7071b581b3c92e04a489549824d7c8b96fe';

/// Exchanges the refresh token for new tokens (true on success). The default
/// never refreshes; `main.dart` wires the session controller in.

@ProviderFor(tokenRefresher)
final tokenRefresherProvider = TokenRefresherProvider._();

/// Exchanges the refresh token for new tokens (true on success). The default
/// never refreshes; `main.dart` wires the session controller in.

final class TokenRefresherProvider
    extends
        $FunctionalProvider<
          Future<bool> Function(),
          Future<bool> Function(),
          Future<bool> Function()
        >
    with $Provider<Future<bool> Function()> {
  /// Exchanges the refresh token for new tokens (true on success). The default
  /// never refreshes; `main.dart` wires the session controller in.
  TokenRefresherProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tokenRefresherProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tokenRefresherHash();

  @$internal
  @override
  $ProviderElement<Future<bool> Function()> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  Future<bool> Function() create(Ref ref) {
    return tokenRefresher(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Future<bool> Function() value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Future<bool> Function()>(value),
    );
  }
}

String _$tokenRefresherHash() => r'a6ee569afc8f126db670acb9b5225c502fd92323';

/// Shared Dio instance used by every repository.

@ProviderFor(dio)
final dioProvider = DioProvider._();

/// Shared Dio instance used by every repository.

final class DioProvider extends $FunctionalProvider<Dio, Dio, Dio>
    with $Provider<Dio> {
  /// Shared Dio instance used by every repository.
  DioProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dioProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dioHash();

  @$internal
  @override
  $ProviderElement<Dio> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  Dio create(Ref ref) {
    return dio(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Dio value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Dio>(value),
    );
  }
}

String _$dioHash() => r'66e8e575ca3c294eab96cd1d1c7e28b4607459e8';
