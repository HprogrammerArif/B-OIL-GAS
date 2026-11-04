// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'licence_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(licences)
final licencesProvider = LicencesFamily._();

final class LicencesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Licence>>,
          List<Licence>,
          FutureOr<List<Licence>>
        >
    with $FutureModifier<List<Licence>>, $FutureProvider<List<Licence>> {
  LicencesProvider._({
    required LicencesFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'licencesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$licencesHash();

  @override
  String toString() => r'licencesProvider$argument';

  @$internal
  @override
  $FutureProviderElement<List<Licence>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Licence>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return licences(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is LicencesProvider && other.argument == argument;
  }

  @override
  int get hashCode => argument.hashCode;
}

String _$licencesHash() => r'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

final class LicencesFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<Licence>>,
          ({String view, String? query})
        > {
  LicencesFamily._()
    : super(
        retry: null,
        name: r'licencesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  LicencesProvider call({String view = 'mine', String? query}) =>
      LicencesProvider._(argument: (view: view, query: query), from: this);

  @override
  String toString() => r'licencesProvider';
}

@ProviderFor(licenceDetail)
final licenceDetailProvider = LicenceDetailFamily._();

final class LicenceDetailProvider
    extends $FunctionalProvider<AsyncValue<Licence>, Licence, FutureOr<Licence>>
    with $FutureModifier<Licence>, $FutureProvider<Licence> {
  LicenceDetailProvider._({
    required LicenceDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'licenceDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$licenceDetailHash();

  @override
  String toString() => r'licenceDetailProvider($argument)';

  @$internal
  @override
  $FutureProviderElement<Licence> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Licence> create(Ref ref) {
    return licenceDetail(ref, this.argument as String);
  }

  @override
  bool operator ==(Object other) {
    return other is LicenceDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode => argument.hashCode;
}

String _$licenceDetailHash() => r'cccccccccccccccccccccccccccccccccccccccc';

final class LicenceDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Licence>, String> {
  LicenceDetailFamily._()
    : super(
        retry: null,
        name: r'licenceDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  LicenceDetailProvider call(String id) =>
      LicenceDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'licenceDetailProvider';
}

@ProviderFor(licenceTypes)
final licenceTypesProvider = LicenceTypesProvider._();

final class LicenceTypesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LicenceType>>,
          List<LicenceType>,
          FutureOr<List<LicenceType>>
        >
    with
        $FutureModifier<List<LicenceType>>,
        $FutureProvider<List<LicenceType>> {
  LicenceTypesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'licenceTypesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$licenceTypesHash();

  @$internal
  @override
  $FutureProviderElement<List<LicenceType>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<LicenceType>> create(Ref ref) => licenceTypes(ref);
}

String _$licenceTypesHash() => r'dddddddddddddddddddddddddddddddddddddddd';
