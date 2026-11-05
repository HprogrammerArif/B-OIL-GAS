import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class _CenteredMessage extends StatelessWidget {
  const _CenteredMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Space.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainer,
                shape: BoxShape.circle,
              ),
              child: Padding(
                padding: const EdgeInsets.all(Space.xl),
                child: Icon(
                  icon,
                  size: 32,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(height: Space.lg),
            Text(
              title,
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Space.sm),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[const SizedBox(height: Space.xl), action!],
          ],
        ),
      ),
    );
  }
}

/// Empty list/section state. Text defaults are localised.
class EmptyState extends StatelessWidget {
  const EmptyState({
    this.title,
    this.message,
    this.icon = Icons.inbox_outlined,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String? title;
  final String? message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final l10n = AppL10n.of(context);
    return _CenteredMessage(
      icon: icon,
      title: title ?? l10n.commonEmptyTitle,
      message: message ?? l10n.commonEmptyMessage,
      action: actionLabel != null && onAction != null
          ? PrimaryButton(
              label: actionLabel!,
              onPressed: onAction,
              expand: false,
            )
          : null,
    );
  }
}

/// Error state with retry.
class ErrorState extends StatelessWidget {
  const ErrorState({this.title, this.message, this.onRetry, super.key});

  final String? title;
  final String? message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppL10n.of(context);
    return _CenteredMessage(
      icon: Icons.error_outline,
      title: title ?? l10n.commonErrorTitle,
      message: message ?? l10n.commonErrorMessage,
      action: onRetry == null
          ? null
          : PrimaryButton.secondary(
              label: l10n.commonRetry,
              icon: Icons.refresh,
              onPressed: onRetry,
              expand: false,
            ),
    );
  }
}

/// Shimmering placeholder rows shown while the first load is in flight.
class SkeletonList extends StatelessWidget {
  const SkeletonList({this.itemCount = 6, this.itemHeight = 72, super.key});

  final int itemCount;
  final double itemHeight;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final base = scheme.surfaceContainerHighest;
    final list = ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(Space.lg),
      itemCount: itemCount,
      separatorBuilder: (_, _) => const SizedBox(height: Space.md),
      itemBuilder: (_, _) => Container(
        height: itemHeight,
        decoration: BoxDecoration(
          color: base,
          borderRadius: BorderRadius.circular(Corner.lg),
        ),
      ),
    );
    return Semantics(
      label: AppL10n.of(context).commonLoading,
      child: reduceMotion
          ? list
          : Shimmer.fromColors(
              baseColor: base,
              highlightColor: scheme.surface,
              child: list,
            ),
    );
  }
}

/// Persistent banner shown when the device (or demo toggle) is offline.
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.bogcl;
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        color: c.warningContainer,
        padding: const EdgeInsets.symmetric(
          horizontal: Space.lg,
          vertical: Space.sm,
        ),
        child: Row(
          children: [
            Icon(Icons.cloud_off, size: 18, color: c.warning),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Text(
                AppL10n.of(context).commonOfflineBanner,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
