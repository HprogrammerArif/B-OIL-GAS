// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'parcel_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(parcelRepository)
final parcelRepositoryProvider = ParcelRepositoryProvider._();

final class ParcelRepositoryProvider
    extends
        $FunctionalProvider<
          ParcelRepository,
          ParcelRepository,
          ParcelRepository
        >
    with $Provider<ParcelRepository> {
  ParcelRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'parcelRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$parcelRepositoryHash();

  @$internal
  @override
  $ProviderElement<ParcelRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ParcelRepository create(Ref ref) {
    return parcelRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ParcelRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ParcelRepository>(value),
    );
  }
}

String _$parcelRepositoryHash() => r'481a7acade34cddad75195c407c1b95262471a7d';
