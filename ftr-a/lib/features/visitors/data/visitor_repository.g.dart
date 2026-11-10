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

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(VisitorRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<VisitorRepository>(value),
    );
  }
}

String _$visitorRepositoryHash() => r'96fe2ed3c279c8a46a5481a798d6bcb3dda40001';
