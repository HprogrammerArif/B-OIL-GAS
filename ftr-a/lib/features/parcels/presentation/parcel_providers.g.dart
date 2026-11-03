// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'parcel_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(parcels)
final parcelsProvider = ParcelsFamily._();

final class ParcelsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Parcel>>,
          List<Parcel>,
          FutureOr<List<Parcel>>
        >
    with $FutureModifier<List<Parcel>>, $FutureProvider<List<Parcel>> {
  ParcelsProvider._({
    required ParcelsFamily super.from,
    required (String, {String? query, bool stuckOnly}) super.argument,
  }) : super(
         retry: null,
         name: r'parcelsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$parcelsHash();

  @override
  String toString() {
    return r'parcelsProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<Parcel>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Parcel>> create(Ref ref) {
    final argument = this.argument as (String, {String? query, bool stuckOnly});
    return parcels(
      ref,
      argument.$1,
      query: argument.query,
      stuckOnly: argument.stuckOnly,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is ParcelsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$parcelsHash() => r'52061761f1dc42de7aa9b689adbf07bfc91534f0';

final class ParcelsFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<Parcel>>,
          (String, {String? query, bool stuckOnly})
        > {
  ParcelsFamily._()
    : super(
        retry: null,
        name: r'parcelsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ParcelsProvider call(String view, {String? query, bool stuckOnly = false}) =>
      ParcelsProvider._(
        argument: (view, query: query, stuckOnly: stuckOnly),
        from: this,
      );

  @override
  String toString() => r'parcelsProvider';
}

@ProviderFor(parcelDetail)
final parcelDetailProvider = ParcelDetailFamily._();

final class ParcelDetailProvider
    extends $FunctionalProvider<AsyncValue<Parcel>, Parcel, FutureOr<Parcel>>
    with $FutureModifier<Parcel>, $FutureProvider<Parcel> {
  ParcelDetailProvider._({
    required ParcelDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'parcelDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$parcelDetailHash();

  @override
  String toString() {
    return r'parcelDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Parcel> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Parcel> create(Ref ref) {
    final argument = this.argument as String;
    return parcelDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ParcelDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$parcelDetailHash() => r'd0077f5b3bc25210cb0d39b72572e32292958d31';

final class ParcelDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Parcel>, String> {
  ParcelDetailFamily._()
    : super(
        retry: null,
        name: r'parcelDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ParcelDetailProvider call(String id) =>
      ParcelDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'parcelDetailProvider';
}

@ProviderFor(parcelCouriers)
final parcelCouriersProvider = ParcelCouriersProvider._();

final class ParcelCouriersProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Person>>,
          List<Person>,
          FutureOr<List<Person>>
        >
    with $FutureModifier<List<Person>>, $FutureProvider<List<Person>> {
  ParcelCouriersProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'parcelCouriersProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$parcelCouriersHash();

  @$internal
  @override
  $FutureProviderElement<List<Person>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Person>> create(Ref ref) {
    return parcelCouriers(ref);
  }
}

String _$parcelCouriersHash() => r'1243114a297d677239b1ae77d5edf8de1d7b3724';
