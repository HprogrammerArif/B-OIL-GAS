// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'session_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Current session. `null` data means signed out.
///
/// Tokens live only in secure storage. On start-up the refresh token is
/// exchanged for a fresh access token, so a valid session survives restarts.

@ProviderFor(SessionController)
final sessionControllerProvider = SessionControllerProvider._();

/// Current session. `null` data means signed out.
///
/// Tokens live only in secure storage. On start-up the refresh token is
/// exchanged for a fresh access token, so a valid session survives restarts.
final class SessionControllerProvider
    extends $AsyncNotifierProvider<SessionController, Session?> {
  /// Current session. `null` data means signed out.
  ///
  /// Tokens live only in secure storage. On start-up the refresh token is
  /// exchanged for a fresh access token, so a valid session survives restarts.
  SessionControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'sessionControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$sessionControllerHash();

  @$internal
  @override
  SessionController create() => SessionController();
}

String _$sessionControllerHash() => r'1bc9cbb7456fd1cffddf76206d8f8d858907c901';

/// Current session. `null` data means signed out.
///
/// Tokens live only in secure storage. On start-up the refresh token is
/// exchanged for a fresh access token, so a valid session survives restarts.

abstract class _$SessionController extends $AsyncNotifier<Session?> {
  FutureOr<Session?> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<Session?>, Session?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<Session?>, Session?>,
              AsyncValue<Session?>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
