import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/files/presentation/file_image.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> showFileImage(
  BuildContext context,
  WidgetRef ref,
  String fileId,
) async {
  final l10n = context.l10n;
  try {
    final bytes = await ref.read(filesRepositoryProvider).download(fileId);
    if (!context.mounted) return;
    if (bytes == null) {
      AppToast.show(context, l10n.evPhotoOpenFailed, tone: StatusTone.danger);
      return;
    }
    await showDialog<void>(
      context: context,
      builder: (_) =>
          Dialog(child: InteractiveViewer(child: Image.memory(bytes))),
    );
  } on ApiException {
    if (!context.mounted) return;
    AppToast.show(context, l10n.evPhotoOpenFailed, tone: StatusTone.danger);
  }
}

/// Compact photo thumbs. Optional add tile uploads via [pickAttachment].
class EvidenceStrip extends ConsumerStatefulWidget {
  const EvidenceStrip({
    required this.fileIds,
    super.key,
    this.onAdded,
    this.canAdd = false,
    this.max = 6,
  });

  final List<String> fileIds;
  final Future<void> Function(String fileId)? onAdded;
  final bool canAdd;
  final int max;

  @override
  ConsumerState<EvidenceStrip> createState() => _EvidenceStripState();
}

class _EvidenceStripState extends ConsumerState<EvidenceStrip> {
  bool _busy = false;

  Future<void> _add() async {
    if (_busy || widget.fileIds.length >= widget.max) return;
    final picked = await pickAttachment(context, allowFiles: false);
    if (picked == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final up = ref.read(uploadServiceProvider);
      final meta = await up.upload(picked, purpose: 'PHOTO');
      await up.awaitClean(meta.id);
      await widget.onAdded?.call(meta.id);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? context.l10n.uploadNeedsConnection
            : e.message,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final ids = widget.fileIds;
    if (ids.isEmpty && !widget.canAdd) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          ids.isEmpty ? l10n.evPhotos : l10n.evPhotoCount(ids.length),
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: Space.xs),
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.sm,
          children: [
            for (final id in ids) _Thumb(fileId: id),
            if (widget.canAdd && ids.length < widget.max)
              InkWell(
                onTap: _busy ? null : () => unawaited(_add()),
                borderRadius: BorderRadius.circular(Radii.md),
                child: Container(
                  width: 72,
                  height: 72,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                  ),
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_a_photo_outlined, size: 22),
                            Text(
                              l10n.evAddPhoto,
                              style: Theme.of(context).textTheme.labelSmall,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _Thumb extends ConsumerWidget {
  const _Thumb({required this.fileId});

  final String fileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bytes = ref.watch(fileBytesProvider(fileId)).value;
    return InkWell(
      onTap: () => unawaited(showFileImage(context, ref, fileId)),
      borderRadius: BorderRadius.circular(Radii.md),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Radii.md),
        child: SizedBox(
          width: 72,
          height: 72,
          child: bytes == null
              ? ColoredBox(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: const Icon(Icons.photo_outlined),
                )
              : Image.memory(
                  bytes,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => ColoredBox(
                    color: Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest,
                    child: const Icon(Icons.insert_drive_file_outlined),
                  ),
                ),
        ),
      ),
    );
  }
}
