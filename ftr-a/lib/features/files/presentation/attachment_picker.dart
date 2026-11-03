import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart' hide PickedFile;

enum _Source { camera, gallery, files }

/// Bottom sheet to choose where a file comes from. Returns null when the user
/// cancels. The camera and gallery go through the system pickers, so the app
/// needs no storage or camera permission of its own.
Future<PickedFile?> pickAttachment(
  BuildContext context, {
  bool allowCamera = true,
  bool allowGallery = true,
  bool allowFiles = true,
}) async {
  final l10n = context.l10n;
  final source = await showModalBottomSheet<_Source>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SectionHeader(title: l10n.pickerTitle),
            if (allowCamera)
              ListRow(
                title: l10n.pickerCamera,
                leading: const Icon(Icons.photo_camera_outlined),
                onTap: () => Navigator.of(ctx).pop(_Source.camera),
              ),
            if (allowGallery) ...[
              const SizedBox(height: Space.sm),
              ListRow(
                title: l10n.pickerGallery,
                leading: const Icon(Icons.photo_library_outlined),
                onTap: () => Navigator.of(ctx).pop(_Source.gallery),
              ),
            ],
            if (allowFiles) ...[
              const SizedBox(height: Space.sm),
              ListRow(
                title: l10n.pickerFiles,
                leading: const Icon(Icons.folder_open_outlined),
                onTap: () => Navigator.of(ctx).pop(_Source.files),
              ),
            ],
          ],
        ),
      ),
    ),
  );
  if (source == null) return null;

  switch (source) {
    case _Source.camera || _Source.gallery:
      final x = await ImagePicker().pickImage(
        source: source == _Source.camera
            ? ImageSource.camera
            : ImageSource.gallery,
        maxWidth: 1600,
        imageQuality: 85,
      );
      if (x == null) return null;
      return PickedFile(
        name: x.name,
        bytes: await x.readAsBytes(),
        mime: mimeFromName(x.name),
      );
    case _Source.files:
      final f = await FilePicker.pickFile();
      if (f == null) return null;
      return PickedFile(
        name: f.name,
        bytes: await f.readAsBytes(),
        mime: mimeFromName(f.name),
      );
  }
}
