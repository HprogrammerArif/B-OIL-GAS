import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

final RegExp _sha = RegExp(r'^[0-9a-f]{64}$');

/// Scheme of the mock "presigned" URLs. The client resolves it against the
/// on-device vault; there is no real network.
const String mockBucketScheme = 'mock-bucket';

Json _owned(HandlerContext ctx) {
  final f = ctx.store.get(Col.files, ctx.params['id']!);
  if (f == null) throw notFound('File');
  return f;
}

Json _readable(HandlerContext ctx) {
  final f = _owned(ctx);
  // Same answer for "missing" and "not yours": no existence leak.
  if (!FileEngine.canRead(ctx.store, ctx.requireAuth().user, f)) {
    throw notFound('File');
  }
  return f;
}

List<RouteDef> fileRoutes() => [
  RouteDef('POST', '/files/presign', permission: const ['files:upload'], (
    ctx,
  ) async {
    final a = ctx.requireAuth();
    final body = ctx.bodyObject();
    final purpose = body['purpose'];
    final rules = purpose is String ? filePurposes[purpose] : null;
    if (purpose is! String || rules == null) {
      throw validationError('purpose', 'Unknown upload purpose');
    }
    final name = body['fileName'] is String
        ? FileEngine.safeName(body['fileName']! as String)
        : '';
    if (name.isEmpty) {
      throw validationError('fileName', 'File name is required');
    }
    final mime = body['mime'];
    if (mime is! String || !rules.mimes.contains(mime)) {
      throw validationError('mime', 'This file type is not allowed here');
    }
    final size = body['sizeBytes'];
    if (size is! int || size <= 0) {
      throw validationError('sizeBytes', 'File size is required');
    }
    if (size > rules.maxBytes) {
      throw validationError(
        'sizeBytes',
        'File is larger than ${rules.maxBytes ~/ (1024 * 1024)} MB',
      );
    }
    final sha = body['sha256'];
    if (sha != null && (sha is! String || !_sha.hasMatch(sha))) {
      throw validationError('sha256', 'Invalid checksum');
    }
    final nowMs = ctx.store.nowMs();
    final id = 'file_${nowMs}_${ctx.store.collection(Col.files).length}';
    final expires = DateTime.fromMillisecondsSinceEpoch(
      nowMs + FileEngine.uploadTtlMs,
      isUtc: true,
    ).toIso8601String();
    ctx.store.put(Col.files, {
      'id': id,
      'uploaderUserId': a.user['id'],
      'fileName': name,
      'mime': mime,
      'sizeBytes': size,
      'sha256': sha,
      'purpose': purpose,
      'status': 'RESERVED',
      'scanStatus': 'PENDING',
      'scanReadyAtMs': 0,
      'ownerType': null,
      'ownerId': null,
      'createdAt': ctx.store.nowIso(),
      'uploadExpiresAt': expires,
    });
    await ctx.store.commit();
    return ok({
      'id': id,
      'uploadUrl': '$mockBucketScheme://files/$id',
      'method': 'PUT',
      'headers': {'Content-Type': mime},
      'expiresAt': expires,
    }, status: 201);
  }),
  RouteDef('POST', '/files/:id/complete', permission: const ['files:upload'], (
    ctx,
  ) async {
    final f = _owned(ctx);
    if (f['uploaderUserId'] != ctx.requireAuth().user['id']) {
      throw notFound('File');
    }
    if (f['status'] != 'RESERVED') {
      throw invalidTransition('This upload is already complete');
    }
    if (DateTime.parse(f.str('uploadExpiresAt')).millisecondsSinceEpoch <
        ctx.store.nowMs()) {
      await FileEngine.destroy(ctx.store, ctx.blobs, f.str('id'));
      await ctx.store.commit();
      throw policyViolation('UPLOAD_EXPIRED', 'The upload link has expired');
    }
    final bytes = await ctx.blobs.read(f.str('id'));
    if (bytes == null) {
      throw policyViolation('UPLOAD_MISSING', 'The file was not uploaded');
    }
    Never reject(String rule, String message) {
      // Bad content never stays in the bucket.
      ctx.store.remove(Col.files, f.str('id'));
      throw policyViolation(rule, message);
    }

    if (bytes.length != f.intVal('sizeBytes')) {
      await ctx.blobs.delete(f.str('id'));
      reject('SIZE_MISMATCH', 'The uploaded size does not match');
    }
    final declared = f.strOrNull('sha256');
    final actual = await Hash.sha256BytesAsync(bytes);
    if (declared != null && !Hash.constantTimeEquals(declared, actual)) {
      await ctx.blobs.delete(f.str('id'));
      reject('CHECKSUM_MISMATCH', 'The file was corrupted in transit');
    }
    // Server-side sniff: the declared MIME is never trusted.
    if (!mimeMatchesContent(f.str('mime'), bytes)) {
      await ctx.blobs.delete(f.str('id'));
      reject('MIME_MISMATCH', 'The file content does not match its type');
    }
    f
      ..['sha256'] = actual
      ..['status'] = 'UPLOADED'
      ..['scanStatus'] = 'PENDING'
      ..['scanReadyAtMs'] = ctx.store.nowMs() + FileEngine.scanDelayMs;
    ctx.store.touch(Col.files, f);
    await ctx.store.commit();
    return ok(FileEngine.toWire(ctx.store, f));
  }),
  RouteDef('GET', '/files/:id', permission: const ['files:read'], (ctx) async {
    final f = _readable(ctx);
    if (f['status'] != 'UPLOADED') throw notFound('File');
    final wire = FileEngine.toWire(ctx.store, f);
    await ctx.store.commit();
    return ok(wire);
  }),
  RouteDef('GET', '/files/:id/download', permission: const ['files:read'], (
    ctx,
  ) async {
    final f = _readable(ctx);
    if (f['status'] != 'UPLOADED') throw notFound('File');
    final scan = FileEngine.scanStatus(ctx.store, f);
    await ctx.store.commit();
    if (scan != 'CLEAN') {
      throw HttpError(
        ApiErrorCode.forbidden,
        scan == 'INFECTED'
            ? 'This file was blocked by the virus scan'
            : 'This file is still being scanned',
        details: [
          {'reason': scan == 'INFECTED' ? 'INFECTED' : 'SCAN_PENDING'},
        ],
      );
    }
    final id = f.str('id');
    final expires = DateTime.fromMillisecondsSinceEpoch(
      ctx.store.nowMs() + 5 * 60 * 1000,
      isUtc: true,
    ).toIso8601String();
    return ok({
      'url': '$mockBucketScheme://files/$id',
      'expiresAt': expires,
      'inline':
          f.str('mime').startsWith('image/') &&
          f.intVal('sizeBytes') < 2 * 1024 * 1024,
    });
  }),
  RouteDef('DELETE', '/files/:id', permission: const ['files:upload'], (
    ctx,
  ) async {
    final f = _owned(ctx);
    if (f['uploaderUserId'] != ctx.requireAuth().user['id']) {
      throw notFound('File');
    }
    if (f['ownerId'] != null) {
      throw policyViolation(
        'FILE_ATTACHED',
        'This file is attached to a record and cannot be deleted',
      );
    }
    await FileEngine.destroy(ctx.store, ctx.blobs, f.str('id'));
    await ctx.store.commit();
    return noContent();
  }),
];
