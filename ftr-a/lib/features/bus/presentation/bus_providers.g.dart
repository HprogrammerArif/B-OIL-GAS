// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bus_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(busRoutes)
final busRoutesProvider = BusRoutesProvider._();

final class BusRoutesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<BusRoute>>,
          List<BusRoute>,
          FutureOr<List<BusRoute>>
        >
    with $FutureModifier<List<BusRoute>>, $FutureProvider<List<BusRoute>> {
  BusRoutesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'busRoutesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$busRoutesHash();

  @$internal
  @override
  $FutureProviderElement<List<BusRoute>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<BusRoute>> create(Ref ref) {
    return busRoutes(ref);
  }
}

String _$busRoutesHash() => r'e951de9e7086c85538cce3dfc48a63e52b634e14';

@ProviderFor(busRouteDetail)
final busRouteDetailProvider = BusRouteDetailFamily._();

final class BusRouteDetailProvider
    extends
        $FunctionalProvider<AsyncValue<BusRoute>, BusRoute, FutureOr<BusRoute>>
    with $FutureModifier<BusRoute>, $FutureProvider<BusRoute> {
  BusRouteDetailProvider._({
    required BusRouteDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'busRouteDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$busRouteDetailHash();

  @override
  String toString() {
    return r'busRouteDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<BusRoute> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<BusRoute> create(Ref ref) {
    final argument = this.argument as String;
    return busRouteDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is BusRouteDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$busRouteDetailHash() => r'fe7c25afbed274c0a793a3e14cbbdeed22fb3ead';

final class BusRouteDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<BusRoute>, String> {
  BusRouteDetailFamily._()
    : super(
        retry: null,
        name: r'busRouteDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  BusRouteDetailProvider call(String id) =>
      BusRouteDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'busRouteDetailProvider';
}

@ProviderFor(mySeat)
final mySeatProvider = MySeatProvider._();

final class MySeatProvider
    extends $FunctionalProvider<AsyncValue<MySeat>, MySeat, FutureOr<MySeat>>
    with $FutureModifier<MySeat>, $FutureProvider<MySeat> {
  MySeatProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'mySeatProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$mySeatHash();

  @$internal
  @override
  $FutureProviderElement<MySeat> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<MySeat> create(Ref ref) {
    return mySeat(ref);
  }
}

String _$mySeatHash() => r'fecbcab63200f17e382203198badb5afac0bbdad';
