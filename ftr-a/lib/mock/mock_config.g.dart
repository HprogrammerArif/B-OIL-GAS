// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mock_config.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Live mock-server knobs, driven by the hidden demo menu.

@ProviderFor(MockConfigController)
final mockConfigControllerProvider = MockConfigControllerProvider._();

/// Live mock-server knobs, driven by the hidden demo menu.
final class MockConfigControllerProvider
    extends $NotifierProvider<MockConfigController, MockConfig> {
  /// Live mock-server knobs, driven by the hidden demo menu.
  MockConfigControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'mockConfigControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$mockConfigControllerHash();

  @$internal
  @override
  MockConfigController create() => MockConfigController();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(MockConfig value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<MockConfig>(value),
    );
  }
}

String _$mockConfigControllerHash() =>
    r'25b5765e590230997548f5f683ec5543d9529237';

/// Live mock-server knobs, driven by the hidden demo menu.

abstract class _$MockConfigController extends $Notifier<MockConfig> {
  MockConfig build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<MockConfig, MockConfig>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<MockConfig, MockConfig>,
              MockConfig,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
