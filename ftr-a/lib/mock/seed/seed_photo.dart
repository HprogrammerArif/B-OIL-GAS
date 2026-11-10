import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

const _photoW = 240;
const _photoH = 160;

final List<int> _crcTable = List<int>.generate(256, (n) {
  var c = n;
  for (var k = 0; k < 8; k++) {
    c = (c & 1) != 0 ? 0xEDB88320 ^ (c >> 1) : c >> 1;
  }
  return c;
});

int _crc32(List<int> bytes) {
  var c = 0xFFFFFFFF;
  for (final b in bytes) {
    c = _crcTable[(c ^ b) & 0xFF] ^ (c >> 8);
  }
  return (c ^ 0xFFFFFFFF) & 0xFFFFFFFF;
}

void _chunk(BytesBuilder out, String type, List<int> data) {
  final typeBytes = ascii.encode(type);
  final crc = ByteData(4)..setUint32(0, _crc32([...typeBytes, ...data]));
  final len = ByteData(4)..setUint32(0, data.length);
  out
    ..add(len.buffer.asUint8List())
    ..add(typeBytes)
    ..add(data)
    ..add(crc.buffer.asUint8List());
}

/// 240×160 striped PNG so EvidenceStrip thumbs are visible (not a 1×1 pixel).
Uint8List seedPhotoBytes(String id) {
  final h = id.hashCode;
  final r = 48 + (h & 0x7F);
  final g = 48 + ((h >> 7) & 0x7F);
  final b = 48 + ((h >> 14) & 0x7F);
  final raw = BytesBuilder(copy: false);
  for (var y = 0; y < _photoH; y++) {
    raw.addByte(0);
    for (var x = 0; x < _photoW; x++) {
      final stripe = (x ~/ 24).isEven;
      raw
        ..addByte(stripe ? r : r * 2 ~/ 3)
        ..addByte(stripe ? g : g * 2 ~/ 3)
        ..addByte(stripe ? b : b * 2 ~/ 3);
    }
  }
  final compressed = ZLibEncoder().convert(raw.takeBytes());
  final ihdr = ByteData(13)
    ..setUint32(0, _photoW)
    ..setUint32(4, _photoH)
    ..setUint8(8, 8)
    ..setUint8(9, 2);
  final out = BytesBuilder(copy: false)
    ..add(const [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  _chunk(out, 'IHDR', ihdr.buffer.asUint8List());
  _chunk(out, 'IDAT', compressed);
  _chunk(out, 'IEND', const []);
  return out.takeBytes();
}

bool _isSeedPhotoId(String id) =>
    id.startsWith('file_vis_seed_') ||
    id.startsWith('rcpt_seed_') ||
    id.startsWith('file_inc_') ||
    id.startsWith('file_pkg_') ||
    id.startsWith('file_ast_');

Map<String, Object?> seedPhotoFile({
  required String id,
  required String uploaderUserId,
  required String createdAt,
  String fileName = 'photo.png',
  String purpose = 'PHOTO',
}) {
  final bytes = seedPhotoBytes(id);
  return {
    'id': id,
    'uploaderUserId': uploaderUserId,
    'fileName': fileName,
    'mime': 'image/png',
    'sizeBytes': bytes.length,
    'purpose': purpose,
    'status': 'UPLOADED',
    'scanStatus': 'CLEAN',
    'createdAt': createdAt,
  };
}

/// Puts 1–2 CLEAN PHOTO rows and returns their ids (blobs filled at bootstrap).
List<String> putSeedPhotos(
  MockStore store, {
  required String prefix,
  required String uploaderUserId,
  required String createdAt,
  int count = 2,
}) {
  final ids = <String>[for (var i = 1; i <= count; i++) '${prefix}_$i'];
  for (final id in ids) {
    store.put(
      Col.files,
      seedPhotoFile(
        id: id,
        uploaderUserId: uploaderUserId,
        createdAt: createdAt,
      ),
    );
  }
  return ids;
}

/// Writes PNG bytes for every seeded image file that is missing or still 1×1.
Future<void> writeMissingSeedPhotoBlobs(
  MockStore store,
  BlobStore blobs,
) async {
  for (final f in store.all(Col.files)) {
    final id = f['id'] as String?;
    if (id == null) continue;
    if (_isSeedPhotoId(id)) {
      f
        ..['status'] = 'UPLOADED'
        ..['scanStatus'] = 'CLEAN'
        ..['mime'] = 'image/png'
        ..['fileName'] =
            (f['fileName'] as String?) ??
            (f['originalName'] as String?) ??
            'photo.png'
        ..['purpose'] = id.startsWith('rcpt_seed_') ? 'CLAIM_RECEIPT' : 'PHOTO';
      final bytes = seedPhotoBytes(id);
      f['sizeBytes'] = bytes.length;
      store.put(Col.files, f);
    }
    if (f['status'] != 'UPLOADED') continue;
    final mime = f['mime'] as String? ?? '';
    if (!mime.startsWith('image/')) continue;
    final existing = await blobs.read(id);
    if (existing != null && existing.length >= 500) continue;
    await blobs.write(id, seedPhotoBytes(id));
  }
}
