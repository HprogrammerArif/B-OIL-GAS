// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fleet_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(fleetRequisitions)
final fleetRequisitionsProvider = FleetRequisitionsFamily._();

final class FleetRequisitionsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<VehicleRequisition>>,
          List<VehicleRequisition>,
          FutureOr<List<VehicleRequisition>>
        >
    with
        $FutureModifier<List<VehicleRequisition>>,
        $FutureProvider<List<VehicleRequisition>> {
  FleetRequisitionsProvider._({
    required FleetRequisitionsFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'fleetRequisitionsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$fleetRequisitionsHash();

  @override
  String toString() {
    return r'fleetRequisitionsProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<VehicleRequisition>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<VehicleRequisition>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return fleetRequisitions(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is FleetRequisitionsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$fleetRequisitionsHash() => r'0370eebb84031cb457336dca3657dcd4a653aecc';

final class FleetRequisitionsFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<VehicleRequisition>>,
          ({String view, String? query})
        > {
  FleetRequisitionsFamily._()
    : super(
        retry: null,
        name: r'fleetRequisitionsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  FleetRequisitionsProvider call({String view = 'mine', String? query}) =>
      FleetRequisitionsProvider._(
        argument: (view: view, query: query),
        from: this,
      );

  @override
  String toString() => r'fleetRequisitionsProvider';
}

@ProviderFor(fleetDetail)
final fleetDetailProvider = FleetDetailFamily._();

final class FleetDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<VehicleRequisition>,
          VehicleRequisition,
          FutureOr<VehicleRequisition>
        >
    with
        $FutureModifier<VehicleRequisition>,
        $FutureProvider<VehicleRequisition> {
  FleetDetailProvider._({
    required FleetDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'fleetDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$fleetDetailHash();

  @override
  String toString() {
    return r'fleetDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<VehicleRequisition> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<VehicleRequisition> create(Ref ref) {
    final argument = this.argument as String;
    return fleetDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is FleetDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$fleetDetailHash() => r'994adefd28a53ebee4d8d3e8f2cf61d8f9626831';

final class FleetDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<VehicleRequisition>, String> {
  FleetDetailFamily._()
    : super(
        retry: null,
        name: r'fleetDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  FleetDetailProvider call(String id) =>
      FleetDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'fleetDetailProvider';
}

@ProviderFor(fleetSos)
final fleetSosProvider = FleetSosProvider._();

final class FleetSosProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<FleetSos>>,
          List<FleetSos>,
          FutureOr<List<FleetSos>>
        >
    with $FutureModifier<List<FleetSos>>, $FutureProvider<List<FleetSos>> {
  FleetSosProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'fleetSosProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$fleetSosHash();

  @$internal
  @override
  $FutureProviderElement<List<FleetSos>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<FleetSos>> create(Ref ref) {
    return fleetSos(ref);
  }
}

String _$fleetSosHash() => r'f474e51fc6514f85672d17d3e96319b7f552843d';
