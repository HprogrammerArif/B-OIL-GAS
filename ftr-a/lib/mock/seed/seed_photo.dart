import 'dart:typed_data';

import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// 1×1 PNG so seeded photos decode in the pitch app.
final Uint8List seedPngBytes = Uint8List.fromList(const [
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0A,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0x00,
  0x01,
  0x00,
  0x00,
  0x05,
  0x00,
  0x01,
  0x0D,
  0x0A,
  0x2D,
  0xB4,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
]);

Map<String, Object?> seedPhotoFile({
  required String id,
  required String uploaderUserId,
  required String createdAt,
  String fileName = 'gate.png',
  String purpose = 'PHOTO',
}) => {
  'id': id,
  'uploaderUserId': uploaderUserId,
  'fileName': fileName,
  'mime': 'image/png',
  'sizeBytes': seedPngBytes.length,
  'purpose': purpose,
  'status': 'UPLOADED',
  'scanStatus': 'CLEAN',
  'createdAt': createdAt,
};

/// Writes PNG bytes for every seeded image file that is missing a vault blob.
Future<void> writeMissingSeedPhotoBlobs(
  MockStore store,
  BlobStore blobs,
) async {
  for (final f in store.all(Col.files)) {
    final id = f['id'] as String?;
    if (id == null) continue;
    final seed = id.startsWith('file_vis_seed_') || id.startsWith('rcpt_seed_');
    if (seed) {
      f
        ..['status'] = 'UPLOADED'
        ..['scanStatus'] = 'CLEAN'
        ..['mime'] = 'image/png'
        ..['fileName'] =
            (f['fileName'] as String?) ??
            (f['originalName'] as String?) ??
            'photo.png'
        ..['sizeBytes'] = seedPngBytes.length
        ..['purpose'] = id.startsWith('rcpt_seed_') ? 'CLAIM_RECEIPT' : 'PHOTO';
      store.put(Col.files, f);
    }
    if (f['status'] != 'UPLOADED') continue;
    final mime = f['mime'] as String? ?? '';
    if (!mime.startsWith('image/')) continue;
    if (await blobs.read(id) != null) continue;
    await blobs.write(id, seedPngBytes);
  }
}
