// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bus_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(busRepository)
final busRepositoryProvider = BusRepositoryProvider._();

final class BusRepositoryProvider
    extends $FunctionalProvider<BusRepository, BusRepository, BusRepository>
    with $Provider<BusRepository> {
  BusRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'busRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$busRepositoryHash();

  @$internal
  @override
  $ProviderElement<BusRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  BusRepository create(Ref ref) {
    return busRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(BusRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<BusRepository>(value),
    );
  }
}

String _$busRepositoryHash() => r'd884c6c070a9690d7fd3b3d893ccf23af7892cf6';
