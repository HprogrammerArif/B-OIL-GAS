// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'workforce_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(workforceRepository)
final workforceRepositoryProvider = WorkforceRepositoryProvider._();

final class WorkforceRepositoryProvider
    extends
        $FunctionalProvider<
          WorkforceRepository,
          WorkforceRepository,
          WorkforceRepository
        >
    with $Provider<WorkforceRepository> {
  WorkforceRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'workforceRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$workforceRepositoryHash();

  @$internal
  @override
  $ProviderElement<WorkforceRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  WorkforceRepository create(Ref ref) {
    return workforceRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(WorkforceRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<WorkforceRepository>(value),
    );
  }
}

String _$workforceRepositoryHash() =>
    r'dba5d52b6080e3c0bdda6796443061ac6360e936';
