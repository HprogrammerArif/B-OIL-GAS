// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'incident_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(incidents)
final incidentsProvider = IncidentsFamily._();

final class IncidentsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<SafetyIncident>>,
          List<SafetyIncident>,
          FutureOr<List<SafetyIncident>>
        >
    with
        $FutureModifier<List<SafetyIncident>>,
        $FutureProvider<List<SafetyIncident>> {
  IncidentsProvider._({
    required IncidentsFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'incidentsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$incidentsHash();

  @override
  String toString() {
    return r'incidentsProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<SafetyIncident>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<SafetyIncident>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return incidents(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is IncidentsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$incidentsHash() => r'5355d93e39449779e9a145323500a2168a43083d';

final class IncidentsFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<SafetyIncident>>,
          ({String view, String? query})
        > {
  IncidentsFamily._()
    : super(
        retry: null,
        name: r'incidentsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  IncidentsProvider call({String view = 'mine', String? query}) =>
      IncidentsProvider._(argument: (view: view, query: query), from: this);

  @override
  String toString() => r'incidentsProvider';
}

@ProviderFor(incidentDetail)
final incidentDetailProvider = IncidentDetailFamily._();

final class IncidentDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<SafetyIncident>,
          SafetyIncident,
          FutureOr<SafetyIncident>
        >
    with $FutureModifier<SafetyIncident>, $FutureProvider<SafetyIncident> {
  IncidentDetailProvider._({
    required IncidentDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'incidentDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$incidentDetailHash();

  @override
  String toString() {
    return r'incidentDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<SafetyIncident> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<SafetyIncident> create(Ref ref) {
    final argument = this.argument as String;
    return incidentDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is IncidentDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$incidentDetailHash() => r'd601b57325e8f4fb1ec3e2341b688391690c305a';

final class IncidentDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<SafetyIncident>, String> {
  IncidentDetailFamily._()
    : super(
        retry: null,
        name: r'incidentDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  IncidentDetailProvider call(String id) =>
      IncidentDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'incidentDetailProvider';
}

@ProviderFor(incidentZones)
final incidentZonesProvider = IncidentZonesFamily._();

final class IncidentZonesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<IncidentZone>>,
          List<IncidentZone>,
          FutureOr<List<IncidentZone>>
        >
    with
        $FutureModifier<List<IncidentZone>>,
        $FutureProvider<List<IncidentZone>> {
  IncidentZonesProvider._({
    required IncidentZonesFamily super.from,
    required String? super.argument,
  }) : super(
         retry: null,
         name: r'incidentZonesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$incidentZonesHash();

  @override
  String toString() {
    return r'incidentZonesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<IncidentZone>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<IncidentZone>> create(Ref ref) {
    final argument = this.argument as String?;
    return incidentZones(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is IncidentZonesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$incidentZonesHash() => r'ae3231a5a2624411df6d08a08c1322bddbcd87b7';

final class IncidentZonesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<IncidentZone>>, String?> {
  IncidentZonesFamily._()
    : super(
        retry: null,
        name: r'incidentZonesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  IncidentZonesProvider call(String? siteId) =>
      IncidentZonesProvider._(argument: siteId, from: this);

  @override
  String toString() => r'incidentZonesProvider';
}
