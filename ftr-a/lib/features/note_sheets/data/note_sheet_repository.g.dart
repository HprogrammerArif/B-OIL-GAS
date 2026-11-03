// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'note_sheet_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(noteSheetRepository)
final noteSheetRepositoryProvider = NoteSheetRepositoryProvider._();

final class NoteSheetRepositoryProvider
    extends
        $FunctionalProvider<
          NoteSheetRepository,
          NoteSheetRepository,
          NoteSheetRepository
        >
    with $Provider<NoteSheetRepository> {
  NoteSheetRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noteSheetRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noteSheetRepositoryHash();

  @$internal
  @override
  $ProviderElement<NoteSheetRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  NoteSheetRepository create(Ref ref) {
    return noteSheetRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NoteSheetRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NoteSheetRepository>(value),
    );
  }
}

String _$noteSheetRepositoryHash() =>
    r'a47d036a92c6cc989b6588ad9dd0828e2e34c266';
