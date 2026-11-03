import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// Section title with optional trailing action.
class SectionHeader extends StatelessWidget {
  const SectionHeader({required this.title, this.trailing, super.key});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.xl,
        Space.lg,
        Space.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(title, style: Theme.of(context).textTheme.titleSmall),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Standard list row: leading, title/subtitle, trailing.
class ListRow extends StatelessWidget {
  const ListRow({
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.pendingSync = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  /// Draws a dashed outline for items queued offline.
  final bool pendingSync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final content = InkWell(
      borderRadius: BorderRadius.circular(Corner.lg),
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: kMinTouchTarget + Space.lg,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.md,
          ),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: Space.md),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: theme.textTheme.titleSmall),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: Space.md),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
    return Material(
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Corner.lg),
        side: BorderSide(
          color: pendingSync
              ? context.bogcl.warning
              : theme.colorScheme.outlineVariant,
        ),
      ),
      child: content,
    );
  }
}

/// Circle avatar with initials fallback.
class Avatar extends StatelessWidget {
  const Avatar({required this.name, this.size = 40, super.key});

  final String name;
  final double size;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'))
      ..removeWhere((p) => p.isEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first;
    return parts.first.characters.first + parts.last.characters.first;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      label: name,
      excludeSemantics: true,
      child: CircleAvatar(
        radius: size / 2,
        backgroundColor: scheme.primary.withValues(alpha: 0.12),
        child: Text(
          _initials.toUpperCase(),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: scheme.primary, fontSize: size * 0.36),
        ),
      ),
    );
  }
}
