import 'package:bogcl_oneops/features/files/presentation/file_image.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// [Avatar] that shows the employee's uploaded photo when there is one.
class ProfileAvatar extends ConsumerWidget {
  const ProfileAvatar({
    required this.name,
    this.photoFileId,
    this.size = 40,
    super.key,
  });

  final String name;
  final String? photoFileId;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = photoFileId;
    final bytes = id == null ? null : ref.watch(fileBytesProvider(id)).value;
    return Avatar(name: name, size: size, image: bytes);
  }
}
