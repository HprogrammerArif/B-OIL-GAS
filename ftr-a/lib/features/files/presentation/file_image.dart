import 'dart:typed_data';

import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'file_image.g.dart';

/// Bytes of an uploaded image, or null when unavailable (not scanned yet,
/// blocked, or missing). Never throws: callers fall back to initials.
@riverpod
Future<Uint8List?> fileBytes(Ref ref, String fileId) async {
  final repo = ref.watch(filesRepositoryProvider);
  try {
    return await repo.download(fileId);
  } on Object {
    return null;
  }
}
