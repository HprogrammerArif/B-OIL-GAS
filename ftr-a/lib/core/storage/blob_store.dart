import 'dart:io';
import 'dart:typed_data';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'blob_store.g.dart';

/// Stand-in for the private object-storage bucket (doc 00 §6.4). Blobs are
/// addressed by `FileObject.id` only; nothing is ever served from a public
/// path.
abstract interface class BlobStore {
  Future<void> write(String id, Uint8List bytes);

  Future<Uint8List?> read(String id);

  Future<void> delete(String id);
}

/// Keeps blobs in the app's private support directory (not shared storage,
/// not the gallery).
class DirectoryBlobStore implements BlobStore {
  Directory? _dir;

  Future<Directory> _root() async {
    final existing = _dir;
    if (existing != null) return existing;
    final base = await getApplicationSupportDirectory();
    final dir = Directory(p.join(base.path, 'vault'));
    if (!dir.existsSync()) await dir.create(recursive: true);
    return _dir = dir;
  }

  Future<File> _file(String id) async {
    // Ids are server-issued, but never let one escape the vault directory.
    final safe = id.replaceAll(RegExp('[^A-Za-z0-9_-]'), '_');
    return File(p.join((await _root()).path, safe));
  }

  @override
  Future<void> write(String id, Uint8List bytes) async {
    await (await _file(id)).writeAsBytes(bytes, flush: true);
  }

  @override
  Future<Uint8List?> read(String id) async {
    final f = await _file(id);
    return f.existsSync() ? await f.readAsBytes() : null;
  }

  @override
  Future<void> delete(String id) async {
    final f = await _file(id);
    if (f.existsSync()) await f.delete();
  }
}

/// In-memory store for tests.
class MemoryBlobStore implements BlobStore {
  final Map<String, Uint8List> _data = {};

  @override
  Future<void> write(String id, Uint8List bytes) async => _data[id] = bytes;

  @override
  Future<Uint8List?> read(String id) async => _data[id];

  @override
  Future<void> delete(String id) async => _data.remove(id);
}

/// The bucket shared by the upload client and the mock server. Overridden by
/// `bootstrapMock` with the instance the server also uses.
@Riverpod(keepAlive: true)
BlobStore blobStore(Ref ref) => DirectoryBlobStore();
