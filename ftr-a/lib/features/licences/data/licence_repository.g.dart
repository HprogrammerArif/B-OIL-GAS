// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'licence_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(licenceRepository)
final licenceRepositoryProvider = LicenceRepositoryProvider._();

final class LicenceRepositoryProvider
    extends
        $FunctionalProvider<
          LicenceRepository,
          LicenceRepository,
          LicenceRepository
        >
    with $Provider<LicenceRepository> {
  LicenceRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'licenceRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$licenceRepositoryHash();

  @$internal
  @override
  $ProviderElement<LicenceRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  LicenceRepository create(Ref ref) {
    return licenceRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(LicenceRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<LicenceRepository>(value),
    );
  }
}

String _$licenceRepositoryHash() => r'64e76288265980f74a13e1b2f8c0b38d2fd7188f';
