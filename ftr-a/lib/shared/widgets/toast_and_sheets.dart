import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
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
    showDragHandle: true,
    builder: (ctx) {
      final theme = Theme.of(ctx);
      final cs = theme.colorScheme;
      final accent = destructive ? ctx.bogcl.danger : cs.primary;
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              EnterpriseModalHeader(
                title: title,
                icon: destructive
                    ? Icons.warning_amber_rounded
                    : Icons.verified_user_outlined,
                accentColor: accent,
              ),
              if (message != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(Radii.md),
                    border: Border.all(
                      color: cs.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Text(
                    message,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: Space.lg),
              ],
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: l10n.commonCancel,
                      onPressed: () => Navigator.of(ctx).pop(false),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    flex: 2,
                    child: destructive
                        ? PrimaryButton.danger(
                            label: confirmLabel ?? l10n.commonConfirm,
                            onPressed: () => Navigator.of(ctx).pop(true),
                          )
                        : PrimaryButton(
                            label: confirmLabel ?? l10n.commonConfirm,
                            onPressed: () => Navigator.of(ctx).pop(true),
                          ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
  return result ?? false;
}
