// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'incident_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(incidentRepository)
final incidentRepositoryProvider = IncidentRepositoryProvider._();

final class IncidentRepositoryProvider
    extends
        $FunctionalProvider<
          IncidentRepository,
          IncidentRepository,
          IncidentRepository
        >
    with $Provider<IncidentRepository> {
  IncidentRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'incidentRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$incidentRepositoryHash();

  @$internal
  @override
  $ProviderElement<IncidentRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  IncidentRepository create(Ref ref) {
    return incidentRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(IncidentRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<IncidentRepository>(value),
    );
  }
}

String _$incidentRepositoryHash() =>
    r'608c5773ab1765969d86be15a0ce0d78eb228c95';
