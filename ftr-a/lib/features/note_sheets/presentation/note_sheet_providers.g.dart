// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'note_sheet_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(noteSheets)
final noteSheetsProvider = NoteSheetsFamily._();

final class NoteSheetsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<NoteSheet>>,
          List<NoteSheet>,
          FutureOr<List<NoteSheet>>
        >
    with $FutureModifier<List<NoteSheet>>, $FutureProvider<List<NoteSheet>> {
  NoteSheetsProvider._({
    required NoteSheetsFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'noteSheetsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$noteSheetsHash();

  @override
  String toString() {
    return r'noteSheetsProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<NoteSheet>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<NoteSheet>> create(Ref ref) {
    final argument = this.argument as String;
    return noteSheets(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is NoteSheetsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$noteSheetsHash() => r'f1b3a3c09d11133a6b3fca5c50d6f0c2be7e0171';

final class NoteSheetsFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<NoteSheet>>, String> {
  NoteSheetsFamily._()
    : super(
        retry: null,
        name: r'noteSheetsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  NoteSheetsProvider call(String view) =>
      NoteSheetsProvider._(argument: view, from: this);

  @override
  String toString() => r'noteSheetsProvider';
}

@ProviderFor(noteSheetDetail)
final noteSheetDetailProvider = NoteSheetDetailFamily._();

final class NoteSheetDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<NoteSheet>,
          NoteSheet,
          FutureOr<NoteSheet>
        >
    with $FutureModifier<NoteSheet>, $FutureProvider<NoteSheet> {
  NoteSheetDetailProvider._({
    required NoteSheetDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'noteSheetDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$noteSheetDetailHash();

  @override
  String toString() {
    return r'noteSheetDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<NoteSheet> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<NoteSheet> create(Ref ref) {
    final argument = this.argument as String;
    return noteSheetDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is NoteSheetDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$noteSheetDetailHash() => r'bc87c8736d127ed0cac707696ae2a43922cf08dc';

final class NoteSheetDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<NoteSheet>, String> {
  NoteSheetDetailFamily._()
    : super(
        retry: null,
        name: r'noteSheetDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  NoteSheetDetailProvider call(String id) =>
      NoteSheetDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'noteSheetDetailProvider';
}
