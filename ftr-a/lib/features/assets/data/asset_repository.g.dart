// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(assetRepository)
final assetRepositoryProvider = AssetRepositoryProvider._();

final class AssetRepositoryProvider
    extends
        $FunctionalProvider<AssetRepository, AssetRepository, AssetRepository>
    with $Provider<AssetRepository> {
  AssetRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'assetRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$assetRepositoryHash();

  @$internal
  @override
  $ProviderElement<AssetRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AssetRepository create(Ref ref) {
    return assetRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AssetRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AssetRepository>(value),
    );
  }
}

String _$assetRepositoryHash() => r'17b4cecbab2f56642eadf4dabe0ef749f1fda598';
