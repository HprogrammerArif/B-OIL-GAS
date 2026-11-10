// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visitor_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(visits)
final visitsProvider = VisitsFamily._();

final class VisitsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Visit>>,
          List<Visit>,
          FutureOr<List<Visit>>
        >
    with $FutureModifier<List<Visit>>, $FutureProvider<List<Visit>> {
  VisitsProvider._({
    required VisitsFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'visitsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$visitsHash();

  @override
  String toString() {
    return r'visitsProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<Visit>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Visit>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return visits(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is VisitsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$visitsHash() => r'50844f2a9927c1475e56d31947cf2252c8a9ea8d';

final class VisitsFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<Visit>>,
          ({String view, String? query})
        > {
  VisitsFamily._()
    : super(
        retry: null,
        name: r'visitsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  VisitsProvider call({String view = 'mine', String? query}) =>
      VisitsProvider._(argument: (view: view, query: query), from: this);

  @override
  String toString() => r'visitsProvider';
}

@ProviderFor(visitDetail)
final visitDetailProvider = VisitDetailFamily._();

final class VisitDetailProvider
    extends $FunctionalProvider<AsyncValue<Visit>, Visit, FutureOr<Visit>>
    with $FutureModifier<Visit>, $FutureProvider<Visit> {
  VisitDetailProvider._({
    required VisitDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'visitDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$visitDetailHash();

  @override
  String toString() {
    return r'visitDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Visit> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Visit> create(Ref ref) {
    final argument = this.argument as String;
    return visitDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is VisitDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$visitDetailHash() => r'a49de354d1a37b41b997c93f9ac2c7432c5be7b8';

final class VisitDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Visit>, String> {
  VisitDetailFamily._()
    : super(
        retry: null,
        name: r'visitDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  VisitDetailProvider call(String id) =>
      VisitDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'visitDetailProvider';
}

@ProviderFor(visitZones)
final visitZonesProvider = VisitZonesFamily._();

final class VisitZonesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<VisitZone>>,
          List<VisitZone>,
          FutureOr<List<VisitZone>>
        >
    with $FutureModifier<List<VisitZone>>, $FutureProvider<List<VisitZone>> {
  VisitZonesProvider._({
    required VisitZonesFamily super.from,
    required String? super.argument,
  }) : super(
         retry: null,
         name: r'visitZonesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$visitZonesHash();

  @override
  String toString() {
    return r'visitZonesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<VisitZone>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<VisitZone>> create(Ref ref) {
    final argument = this.argument as String?;
    return visitZones(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is VisitZonesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$visitZonesHash() => r'45f13e3c7cbf3569c5699b10ee1fb47268ab52d9';

final class VisitZonesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<VisitZone>>, String?> {
  VisitZonesFamily._()
    : super(
        retry: null,
        name: r'visitZonesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  VisitZonesProvider call(String? siteId) =>
      VisitZonesProvider._(argument: siteId, from: this);

  @override
  String toString() => r'visitZonesProvider';
}

@ProviderFor(visitMuster)
final visitMusterProvider = VisitMusterProvider._();

final class VisitMusterProvider
    extends
        $FunctionalProvider<
          AsyncValue<VisitMuster>,
          VisitMuster,
          FutureOr<VisitMuster>
        >
    with $FutureModifier<VisitMuster>, $FutureProvider<VisitMuster> {
  VisitMusterProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'visitMusterProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$visitMusterHash();

  @$internal
  @override
  $FutureProviderElement<VisitMuster> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<VisitMuster> create(Ref ref) {
    return visitMuster(ref);
  }
}

String _$visitMusterHash() => r'29bccea9d650643d3feea3af04bc9c50cef2d29f';
