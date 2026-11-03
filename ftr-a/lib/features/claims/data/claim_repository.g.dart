// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'claim_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(claimRepository)
final claimRepositoryProvider = ClaimRepositoryProvider._();

final class ClaimRepositoryProvider
    extends
        $FunctionalProvider<ClaimRepository, ClaimRepository, ClaimRepository>
    with $Provider<ClaimRepository> {
  ClaimRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'claimRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$claimRepositoryHash();

  @$internal
  @override
  $ProviderElement<ClaimRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ClaimRepository create(Ref ref) {
    return claimRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ClaimRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ClaimRepository>(value),
    );
  }
}

String _$claimRepositoryHash() => r'136d43a7b36f317d2b3e617e1a02c26d37fb1e88';
