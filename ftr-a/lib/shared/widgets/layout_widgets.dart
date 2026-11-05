import 'dart:typed_data';

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
              child: Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  letterSpacing: 0.2,
                ),
              ),
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
    this.inset = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  /// Draws a dashed outline for items queued offline.
  final bool pendingSync;

  /// Row inside a [GroupCard] — no individual chrome.
  final bool inset;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final radius = inset ? BorderRadius.zero : BorderRadius.circular(Corner.lg);
    final content = InkWell(
      borderRadius: radius,
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
                    Text(title, style: theme.textTheme.titleMedium),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
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
    if (inset) return content;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: radius,
        border: Border.all(
          color: pendingSync
              ? context.bogcl.warning
              : theme.colorScheme.outlineVariant.withValues(alpha: 0.85),
        ),
        boxShadow: pendingSync ? null : cardShadow(theme.colorScheme.shadow),
      ),
      child: Material(
        type: MaterialType.transparency,
        borderRadius: radius,
        clipBehavior: Clip.antiAlias,
        child: content,
      ),
    );
  }
}

/// Inset group of rows — one surface, dividers between items.
class GroupCard extends StatelessWidget {
  const GroupCard({required this.children, this.margin, super.key});

  final List<Widget> children;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final card = DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(Corner.lg),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.85),
        ),
        boxShadow: cardShadow(theme.colorScheme.shadow),
      ),
      child: Material(
        type: MaterialType.transparency,
        borderRadius: BorderRadius.circular(Corner.lg),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0)
                const Divider(height: 1, indent: Space.xxxl + Space.lg),
              children[i],
            ],
          ],
        ),
      ),
    );
    if (margin == null) return card;
    return Padding(padding: margin!, child: card);
  }
}

/// Circle avatar with initials fallback.
class Avatar extends StatelessWidget {
  const Avatar({required this.name, this.size = 40, this.image, super.key});

  final String name;
  final double size;

  /// Photo bytes; initials show when null.
  final Uint8List? image;

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
        backgroundImage: image == null ? null : MemoryImage(image!),
        child: image != null
            ? null
            : Text(
                _initials.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge
                    ?.copyWith(color: scheme.primary, fontSize: size * 0.36),
              ),
      ),
    );
  }
}
