// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_lock.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Whether the device can do biometric / screen-lock authentication.

@ProviderFor(biometricSupported)
final biometricSupportedProvider = BiometricSupportedProvider._();

/// Whether the device can do biometric / screen-lock authentication.

final class BiometricSupportedProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Whether the device can do biometric / screen-lock authentication.
  BiometricSupportedProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'biometricSupportedProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$biometricSupportedHash();

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    return biometricSupported(ref);
  }
}

String _$biometricSupportedHash() =>
    r'fe5848dae15412adb355770da22dad198e4207b4';

/// User preference. On by default when the device supports it.

@ProviderFor(BiometricEnabled)
final biometricEnabledProvider = BiometricEnabledProvider._();

/// User preference. On by default when the device supports it.
final class BiometricEnabledProvider
    extends $AsyncNotifierProvider<BiometricEnabled, bool> {
  /// User preference. On by default when the device supports it.
  BiometricEnabledProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'biometricEnabledProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$biometricEnabledHash();

  @$internal
  @override
  BiometricEnabled create() => BiometricEnabled();
}

String _$biometricEnabledHash() => r'88d18bc13e887e477d84d30db59b0b5520879b55';

/// User preference. On by default when the device supports it.

abstract class _$BiometricEnabled extends $AsyncNotifier<bool> {
  FutureOr<bool> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<bool>, bool>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<bool>, bool>,
              AsyncValue<bool>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

/// Whether the lock overlay is showing.

@ProviderFor(AppLocked)
final appLockedProvider = AppLockedProvider._();

/// Whether the lock overlay is showing.
final class AppLockedProvider extends $NotifierProvider<AppLocked, bool> {
  /// Whether the lock overlay is showing.
  AppLockedProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'appLockedProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$appLockedHash();

  @$internal
  @override
  AppLocked create() => AppLocked();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$appLockedHash() => r'f2d3876a0fc8bb90c2dcb56810d93e9b2626505f';

/// Whether the lock overlay is showing.

abstract class _$AppLocked extends $Notifier<bool> {
  bool build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<bool, bool>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<bool, bool>,
              bool,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
