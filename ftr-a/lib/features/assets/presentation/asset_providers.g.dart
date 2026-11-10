// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(assets)
final assetsProvider = AssetsFamily._();

final class AssetsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Equipment>>,
          List<Equipment>,
          FutureOr<List<Equipment>>
        >
    with $FutureModifier<List<Equipment>>, $FutureProvider<List<Equipment>> {
  AssetsProvider._({
    required AssetsFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'assetsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$assetsHash();

  @override
  String toString() {
    return r'assetsProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<Equipment>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Equipment>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return assets(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is AssetsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$assetsHash() => r'9da35eca3ff20d4603e780444161ca2228db5952';

final class AssetsFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<Equipment>>,
          ({String view, String? query})
        > {
  AssetsFamily._()
    : super(
        retry: null,
        name: r'assetsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  AssetsProvider call({String view = 'mine', String? query}) =>
      AssetsProvider._(argument: (view: view, query: query), from: this);

  @override
  String toString() => r'assetsProvider';
}

@ProviderFor(assetDetail)
final assetDetailProvider = AssetDetailFamily._();

final class AssetDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<Equipment>,
          Equipment,
          FutureOr<Equipment>
        >
    with $FutureModifier<Equipment>, $FutureProvider<Equipment> {
  AssetDetailProvider._({
    required AssetDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'assetDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$assetDetailHash();

  @override
  String toString() {
    return r'assetDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Equipment> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Equipment> create(Ref ref) {
    final argument = this.argument as String;
    return assetDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is AssetDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$assetDetailHash() => r'0f883451ed4420e5e15a936de0156cba3948be40';

final class AssetDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Equipment>, String> {
  AssetDetailFamily._()
    : super(
        retry: null,
        name: r'assetDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  AssetDetailProvider call(String id) =>
      AssetDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'assetDetailProvider';
}

@ProviderFor(assetCategories)
final assetCategoriesProvider = AssetCategoriesProvider._();

final class AssetCategoriesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<AssetCategory>>,
          List<AssetCategory>,
          FutureOr<List<AssetCategory>>
        >
    with
        $FutureModifier<List<AssetCategory>>,
        $FutureProvider<List<AssetCategory>> {
  AssetCategoriesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'assetCategoriesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$assetCategoriesHash();

  @$internal
  @override
  $FutureProviderElement<List<AssetCategory>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<AssetCategory>> create(Ref ref) {
    return assetCategories(ref);
  }
}

String _$assetCategoriesHash() => r'e19b1ab5c6eb683e398b0adc026136abd655cbd9';
