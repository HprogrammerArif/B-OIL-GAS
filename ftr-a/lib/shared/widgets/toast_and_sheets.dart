import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';

/// Floating toast with tone icon and haptic feedback.
abstract final class AppToast {
  static void show(
    BuildContext context,
    String message, {
    StatusTone tone = StatusTone.info,
  }) {
    final c = context.bogcl;
    final (icon, color) = switch (tone) {
      StatusTone.success => (Icons.check_circle, c.success),
      StatusTone.warning => (Icons.warning_amber_rounded, c.warning),
      StatusTone.danger => (Icons.error, c.danger),
      StatusTone.executive => (Icons.workspace_premium, c.executiveGold),
      StatusTone.info || StatusTone.neutral => (Icons.info, c.info),
    };
    if (tone == StatusTone.success) Haptics.success();
    if (tone == StatusTone.danger) Haptics.error();
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: Space.md),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
  }
}

/// Confirmation bottom sheet. Resolves `true` when confirmed.
Future<bool> showConfirmSheet(
  BuildContext context, {
  required String title,
  String? message,
  String? confirmLabel,
  bool destructive = false,
}) async {
  final l10n = AppL10n.of(context);
  final result = await showModalBottomSheet<bool>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Space.xxl,
          Space.sm,
          Space.xxl,
          Space.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(ctx).textTheme.titleLarge),
            if (message != null) ...[
              const SizedBox(height: Space.sm),
              Text(message, style: Theme.of(ctx).textTheme.bodyMedium),
            ],
            const SizedBox(height: Space.xxl),
            if (destructive)
              PrimaryButton.danger(
                label: confirmLabel ?? l10n.commonConfirm,
                onPressed: () => Navigator.of(ctx).pop(true),
              )
            else
              PrimaryButton(
                label: confirmLabel ?? l10n.commonConfirm,
                onPressed: () => Navigator.of(ctx).pop(true),
              ),
            const SizedBox(height: Space.sm),
            PrimaryButton.secondary(
              label: l10n.commonCancel,
              onPressed: () => Navigator.of(ctx).pop(false),
            ),
          ],
        ),
      ),
    ),
  );
  return result ?? false;
}
