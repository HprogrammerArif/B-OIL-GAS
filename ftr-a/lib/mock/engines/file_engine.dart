import 'dart:typed_data';

import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

const int _mb = 1024 * 1024;

const _pdf = 'application/pdf';
const _jpeg = 'image/jpeg';
const _png = 'image/png';
const _heic = 'image/heic';
const _docx =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const _xlsx =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/// MIME allow-list and size cap per purpose (doc 03 §4.1).
const Map<String, ({Set<String> mimes, int maxBytes})> filePurposes = {
  'CLAIM_RECEIPT': (mimes: {_pdf, _jpeg, _png}, maxBytes: 10 * _mb),
  'PHOTO': (mimes: {_jpeg, _png, _heic}, maxBytes: 15 * _mb),
  'DOCUMENT': (mimes: {_pdf, _docx, _xlsx}, maxBytes: 25 * _mb),
  'SIGNATURE': (mimes: {_png}, maxBytes: 1 * _mb),
  'VOICE': (
    mimes: {'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg'},
    maxBytes: 20 * _mb,
  ),
  'AVATAR': (mimes: {_jpeg, _png}, maxBytes: 3 * _mb),
  'CERTIFICATE': (mimes: {_pdf}, maxBytes: 25 * _mb),
};

/// Container family from magic bytes; null when unrecognised.
String? sniffKind(Uint8List b) {
  bool at(int offset, List<int> sig) {
    if (b.length < offset + sig.length) return false;
    for (var i = 0; i < sig.length; i++) {
      if (b[offset + i] != sig[i]) return false;
    }
    return true;
  }

  if (at(0, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (at(0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return 'png';
  if (at(0, [0xFF, 0xD8, 0xFF])) return 'jpeg';
  if (at(0, [0x50, 0x4B, 0x03, 0x04])) return 'zip';
  if (at(0, [0x4F, 0x67, 0x67, 0x53])) return 'ogg';
  if (at(0, [0xFF, 0xF1]) || at(0, [0xFF, 0xF9])) return 'aac';
  if (at(4, [0x66, 0x74, 0x79, 0x70]) && b.length >= 12) {
    final brand = String.fromCharCodes(b.sublist(8, 12));
    const heic = {'heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'};
    return heic.contains(brand) ? 'heic' : 'mp4';
  }
  return null;
}

String? _kindForMime(String mime) => switch (mime) {
  _pdf => 'pdf',
  _jpeg => 'jpeg',
  _png => 'png',
  _heic => 'heic',
  _docx || _xlsx => 'zip',
  'audio/mp4' || 'audio/x-m4a' => 'mp4',
  'audio/aac' => 'aac',
  'audio/ogg' => 'ogg',
  _ => null,
};

/// Does the file content match the declared MIME type?
bool mimeMatchesContent(String mime, Uint8List bytes) {
  final kind = sniffKind(bytes);
  return kind != null && kind == _kindForMime(mime);
}

/// Callback an owning module registers to say who may read its attachments.
typedef OwnerAccess = bool Function(MockStore store, Json user, String ownerId);

/// File metadata engine (doc 00 §6.4). Bytes live in a [BlobStore]; this keeps
/// the `FileObject` rows, scan state and attachment ownership.
abstract final class FileEngine {
  static const int uploadTtlMs = 15 * 60 * 1000;
  static const int orphanTtlMs = 24 * 60 * 60 * 1000;

  /// Simulated antivirus scan latency.
  static const scanDelayMs = 1500;

  static final Map<String, OwnerAccess> _access = {};

  static void registerOwnerAccess(String ownerType, OwnerAccess check) =>
      _access[ownerType] = check;

  static String safeName(String raw) {
    final base = raw.split(RegExp(r'[\\/]')).last.trim();
    final cleaned = base.replaceAll(RegExp(r'[\u0000-\u001F]'), '');
    return cleaned.length > 120
        ? cleaned.substring(cleaned.length - 120)
        : cleaned;
  }

  /// Settles a pending scan once its delay has passed. Names containing
  /// "eicar" simulate an infected upload for the demo.
  static String scanStatus(MockStore store, Json file) {
    if (file['status'] == 'UPLOADED' && file['scanStatus'] == 'PENDING') {
      if (store.nowMs() >= file.intVal('scanReadyAtMs')) {
        file['scanStatus'] =
            file.str('fileName').toLowerCase().contains('eicar')
            ? 'INFECTED'
            : 'CLEAN';
        store.touch(Col.files, file);
      }
    }
    return file.str('scanStatus');
  }

  /// Uploader, or anyone the owning module admits.
  static bool canRead(MockStore store, Json user, Json file) {
    if (file['uploaderUserId'] == user['id']) return true;
    final ownerType = file.strOrNull('ownerType');
    final ownerId = file.strOrNull('ownerId');
    if (ownerType == null || ownerId == null) return false;
    return _access[ownerType]?.call(store, user, ownerId) ?? false;
  }

  /// Links a file to its owning record. Called by modules, never by clients.
  static void attach(
    MockStore store,
    String fileId, {
    required String ownerType,
    required String ownerId,
  }) {
    final file = store.get(Col.files, fileId);
    if (file == null) throw notFound('File');
    file
      ..['ownerType'] = ownerType
      ..['ownerId'] = ownerId;
    store.touch(Col.files, file);
  }

  /// Removes a file row and its bytes.
  static Future<void> destroy(
    MockStore store,
    BlobStore blobs,
    String fileId,
  ) async {
    store.remove(Col.files, fileId);
    await blobs.delete(fileId);
  }

  /// Deletes unattached uploads older than 24 h.
  static Future<void> sweepOrphans(MockStore store, BlobStore blobs) async {
    final cutoff = store.nowMs() - orphanTtlMs;
    for (final f in store.all(Col.files)) {
      if (f['ownerId'] != null) continue;
      if (DateTime.parse(f.str('createdAt')).millisecondsSinceEpoch < cutoff) {
        await destroy(store, blobs, f.str('id'));
      }
    }
    await store.commit();
  }

  static Json toWire(MockStore store, Json f) => {
    'id': f['id'],
    'fileName': f['fileName'],
    'mime': f['mime'],
    'sizeBytes': f['sizeBytes'],
    'sha256': f['sha256'],
    'purpose': f['purpose'],
    'scanStatus': scanStatus(store, f),
    'attached': f['ownerId'] != null,
    'createdAt': f['createdAt'],
  };
}
