import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/note_sheets/data/note_sheet_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'note_sheet_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<NoteSheet>> noteSheets(Ref ref, String view) {
  _watchUser(ref);
  return ref.watch(noteSheetRepositoryProvider).list(view: view);
}

@riverpod
Future<NoteSheet> noteSheetDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(noteSheetRepositoryProvider).detail(id);
}
