// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'files_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(filesRepository)
final filesRepositoryProvider = FilesRepositoryProvider._();

final class FilesRepositoryProvider
    extends
        $FunctionalProvider<FilesRepository, FilesRepository, FilesRepository>
    with $Provider<FilesRepository> {
  FilesRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'filesRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$filesRepositoryHash();

  @$internal
  @override
  $ProviderElement<FilesRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  FilesRepository create(Ref ref) {
    return filesRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(FilesRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<FilesRepository>(value),
    );
  }
}

String _$filesRepositoryHash() => r'def07b11147bcc180c3f7d4687867ed36711c767';
