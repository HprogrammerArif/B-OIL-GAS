// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_state.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// True when the device has no network or the demo "Simulate offline" is on.

@ProviderFor(isOffline)
final isOfflineProvider = IsOfflineProvider._();

/// True when the device has no network or the demo "Simulate offline" is on.

final class IsOfflineProvider extends $FunctionalProvider<bool, bool, bool>
    with $Provider<bool> {
  /// True when the device has no network or the demo "Simulate offline" is on.
  IsOfflineProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'isOfflineProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$isOfflineHash();

  @$internal
  @override
  $ProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  bool create(Ref ref) {
    return isOffline(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$isOfflineHash() => r'b35904849ba874230511cd2f78eb837451582b0d';

/// Replays the outbox whenever connectivity returns or a session starts.
/// Watched once from the app root.

@ProviderFor(syncCoordinator)
final syncCoordinatorProvider = SyncCoordinatorProvider._();

/// Replays the outbox whenever connectivity returns or a session starts.
/// Watched once from the app root.

final class SyncCoordinatorProvider
    extends $FunctionalProvider<void, void, void>
    with $Provider<void> {
  /// Replays the outbox whenever connectivity returns or a session starts.
  /// Watched once from the app root.
  SyncCoordinatorProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncCoordinatorProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncCoordinatorHash();

  @$internal
  @override
  $ProviderElement<void> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  void create(Ref ref) {
    return syncCoordinator(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(void value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<void>(value),
    );
  }
}

String _$syncCoordinatorHash() => r'27a303fc4dbce691800aa82bf113574282737583';
