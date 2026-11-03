// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'blob_store.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The bucket shared by the upload client and the mock server. Overridden by
/// `bootstrapMock` with the instance the server also uses.

@ProviderFor(blobStore)
final blobStoreProvider = BlobStoreProvider._();

/// The bucket shared by the upload client and the mock server. Overridden by
/// `bootstrapMock` with the instance the server also uses.

final class BlobStoreProvider
    extends $FunctionalProvider<BlobStore, BlobStore, BlobStore>
    with $Provider<BlobStore> {
  /// The bucket shared by the upload client and the mock server. Overridden by
  /// `bootstrapMock` with the instance the server also uses.
  BlobStoreProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'blobStoreProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$blobStoreHash();

  @$internal
  @override
  $ProviderElement<BlobStore> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  BlobStore create(Ref ref) {
    return blobStore(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(BlobStore value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<BlobStore>(value),
    );
  }
}

String _$blobStoreHash() => r'0afed606413ad2867647837c5cc20ac40b14d212';
