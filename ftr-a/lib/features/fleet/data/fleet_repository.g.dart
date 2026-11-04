// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fleet_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(fleetRepository)
final fleetRepositoryProvider = FleetRepositoryProvider._();

final class FleetRepositoryProvider
    extends
        $FunctionalProvider<FleetRepository, FleetRepository, FleetRepository>
    with $Provider<FleetRepository> {
  FleetRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'fleetRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$fleetRepositoryHash();

  @$internal
  @override
  $ProviderElement<FleetRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  FleetRepository create(Ref ref) {
    return fleetRepository(ref);
  }

  Override overrideWithValue(FleetRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<FleetRepository>(value),
    );
  }
}

String _$fleetRepositoryHash() => r'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
