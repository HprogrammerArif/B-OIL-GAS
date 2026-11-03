import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'files_repository.g.dart';

/// Server-side scan result (doc 03 `FileObject.scanStatus`).
enum ScanStatus {
  pending,
  clean,
  infected;

  static ScanStatus parse(String wire) => switch (wire) {
    'CLEAN' => clean,
    'INFECTED' => infected,
    _ => pending,
  };
}

/// Metadata of an uploaded file.
@immutable
class FileMeta {
  const FileMeta({
    required this.id,
    required this.fileName,
    required this.mime,
    required this.sizeBytes,
    required this.scanStatus,
  });

  factory FileMeta.fromJson(Map<String, Object?> json) => FileMeta(
    id: json['id']! as String,
    fileName: json['fileName']! as String,
    mime: json['mime']! as String,
    sizeBytes: (json['sizeBytes']! as num).toInt(),
    scanStatus: ScanStatus.parse(json['scanStatus']! as String),
  );

  final String id;
  final String fileName;
  final String mime;
  final int sizeBytes;
  final ScanStatus scanStatus;
}

/// A reserved upload: where to put the bytes.
@immutable
class PresignedUpload {
  const PresignedUpload({required this.id, required this.uploadUrl});

  final String id;
  final String uploadUrl;
}

/// `/files*` (doc 03 §4.1). The "PUT to the presigned URL" step is written to
/// the on-device [BlobStore], the stand-in for the private bucket.
class FilesRepository {
  FilesRepository(this._dio, this._blobs);

  final Dio _dio;
  final BlobStore _blobs;

  Future<PresignedUpload> presign({
    required String fileName,
    required String mime,
    required int sizeBytes,
    required String sha256,
    required String purpose,
  }) async {
    try {
      final res = await _dio.post<Object?>(
        '/files/presign',
        data: {
          'fileName': fileName,
          'mime': mime,
          'sizeBytes': sizeBytes,
          'sha256': sha256,
          'purpose': purpose,
        },
      );
      final body = Envelope.object(res.data);
      return PresignedUpload(
        id: body['id']! as String,
        uploadUrl: body['uploadUrl']! as String,
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> put(PresignedUpload upload, Uint8List bytes) =>
      _blobs.write(upload.id, bytes);

  Future<FileMeta> complete(String id) async {
    try {
      final res = await _dio.post<Object?>('/files/$id/complete');
      return FileMeta.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<FileMeta> meta(String id) async {
    try {
      final res = await _dio.get<Object?>('/files/$id');
      return FileMeta.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  /// Resolves a download URL (blocked until the scan is CLEAN) and reads the
  /// bytes from the vault.
  Future<Uint8List?> download(String id) async {
    try {
      await _dio.get<Object?>(
        '/files/$id/download',
        queryParameters: {'redirect': 'false'},
      );
      return await _blobs.read(id);
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _dio.delete<Object?>('/files/$id');
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
FilesRepository filesRepository(Ref ref) =>
    FilesRepository(ref.watch(dioProvider), ref.watch(blobStoreProvider));
