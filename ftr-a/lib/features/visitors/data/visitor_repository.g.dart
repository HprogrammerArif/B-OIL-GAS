// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visitor_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(visitorRepository)
final visitorRepositoryProvider = VisitorRepositoryProvider._();

final class VisitorRepositoryProvider
    extends
        $FunctionalProvider<
          VisitorRepository,
          VisitorRepository,
          VisitorRepository
        >
    with $Provider<VisitorRepository> {
  VisitorRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'visitorRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$visitorRepositoryHash();

  @$internal
  @override
  $ProviderElement<VisitorRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  VisitorRepository create(Ref ref) {
    return visitorRepository(ref);
  }

  Override overrideWithValue(VisitorRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<VisitorRepository>(value),
    );
  }
}

String _$visitorRepositoryHash() => r'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
