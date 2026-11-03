// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bootstrap.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The persisted mock store. Provided by [bootstrapMock] at startup.

@ProviderFor(mockStore)
final mockStoreProvider = MockStoreProvider._();

/// The persisted mock store. Provided by [bootstrapMock] at startup.

final class MockStoreProvider
    extends $FunctionalProvider<MockStore, MockStore, MockStore>
    with $Provider<MockStore> {
  /// The persisted mock store. Provided by [bootstrapMock] at startup.
  MockStoreProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'mockStoreProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$mockStoreHash();

  @$internal
  @override
  $ProviderElement<MockStore> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  MockStore create(Ref ref) {
    return mockStore(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(MockStore value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<MockStore>(value),
    );
  }
}

String _$mockStoreHash() => r'72e1ea5313cf5ac288f1a101be808e5a86170c02';
