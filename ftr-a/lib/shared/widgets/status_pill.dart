import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:flutter/material.dart';

enum StatusTone { success, warning, danger, info, neutral, executive }

/// Small coloured label for statuses. Colour is never the only signal:
/// callers pass localised text and an optional icon.
class StatusPill extends StatelessWidget {
  const StatusPill({
    required this.label,
    this.tone = StatusTone.neutral,
    this.icon,
    super.key,
  });

  final String label;
  final StatusTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.bogcl;
    final scheme = Theme.of(context).colorScheme;
    final (bg, fg) = switch (tone) {
      StatusTone.success => (c.successContainer, c.success),
      StatusTone.warning => (c.warningContainer, c.warning),
      StatusTone.danger => (c.dangerContainer, c.danger),
      StatusTone.info => (c.infoContainer, c.info),
      StatusTone.executive => (
        c.executiveGold.withValues(alpha: 0.18),
        c.executiveGold,
      ),
      StatusTone.neutral => (c.mutedContainer, scheme.onSurfaceVariant),
    };
    return DecoratedBox(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(Corner.xl),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Space.md,
          vertical: Space.xs,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: fg),
              const SizedBox(width: Space.xs),
            ],
            Flexible(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium
                    ?.copyWith(color: fg),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
