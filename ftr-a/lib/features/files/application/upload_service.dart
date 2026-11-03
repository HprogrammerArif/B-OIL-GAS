import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'upload_service.g.dart';

/// A file chosen by the user, fully in memory.
@immutable
class PickedFile {
  const PickedFile({
    required this.name,
    required this.bytes,
    required this.mime,
  });

  final String name;
  final Uint8List bytes;
  final String mime;
}

/// MIME type from a file name (the server re-checks the real content).
String mimeFromName(String name) {
  final dot = name.lastIndexOf('.');
  final ext = dot < 0 ? '' : name.substring(dot + 1).toLowerCase();
  return switch (ext) {
    'jpg' || 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'heic' || 'heif' => 'image/heic',
    'pdf' => 'application/pdf',
    'docx' =>
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx' =>
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'm4a' => 'audio/mp4',
    'aac' => 'audio/aac',
    'ogg' => 'audio/ogg',
    _ => 'application/octet-stream',
  };
}

/// Presign -> put -> complete. Needs a network round trip, so it throws
/// [ApiException] (offline/timeout) when the device is offline; the calling
/// module decides whether to retry later (doc 03: attachments upload after
/// reconnect).
class UploadService {
  UploadService(this._repo);

  final FilesRepository _repo;

  Future<FileMeta> upload(PickedFile file, {required String purpose}) async {
    final sha = await Hash.sha256BytesAsync(file.bytes);
    final upload = await _repo.presign(
      fileName: file.name,
      mime: file.mime,
      sizeBytes: file.bytes.length,
      sha256: sha,
      purpose: purpose,
    );
    await _repo.put(upload, file.bytes);
    return await _repo.complete(upload.id);
  }

  /// Waits for the antivirus scan. Throws [ApiException] `forbidden` when the
  /// file is infected.
  Future<FileMeta> awaitClean(
    String id, {
    Duration every = const Duration(milliseconds: 500),
    int maxTries = 20,
  }) async {
    for (var i = 0; i < maxTries; i++) {
      final meta = await _repo.meta(id);
      switch (meta.scanStatus) {
        case ScanStatus.clean:
          return meta;
        case ScanStatus.infected:
          throw const ApiException(
            code: ApiErrorCode.forbidden,
            message: 'File blocked by virus scan',
          );
        case ScanStatus.pending:
          await Future<void>.delayed(every);
      }
    }
    throw const ApiException(
      code: ApiErrorCode.timeout,
      message: 'Scan did not finish',
    );
  }
}

@Riverpod(keepAlive: true)
UploadService uploadService(Ref ref) =>
    UploadService(ref.watch(filesRepositoryProvider));
