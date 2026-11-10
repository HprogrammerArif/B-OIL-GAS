import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Top identity strip showing who is filing or editing the form, their
/// department/site, and a live status pill.
class EnterpriseApplicantStrip extends ConsumerWidget {
  const EnterpriseApplicantStrip({
    this.badgeLabel,
    this.badgeIcon = Icons.verified_user_outlined,
    this.badgeColor,
    this.anonymousMode = false,
    this.subtitleOverride,
    super.key,
  });

  final String? badgeLabel;
  final IconData badgeIcon;
  final Color? badgeColor;
  final bool anonymousMode;
  final String? subtitleOverride;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final emp = session?.profile.employee;

    final name = anonymousMode
        ? (bangla ? 'গোপনীয় এইচএসই রিপোর্টার' : 'Anonymous HSE Reporter')
        : emp == null
        ? (bangla ? 'বিওজিসিএল কর্মকর্তা' : 'BOGCL Officer')
        : (bangla && (emp.fullNameBn?.isNotEmpty ?? false)
              ? emp.fullNameBn!
              : emp.fullName);

    final meta =
        subtitleOverride ??
        (anonymousMode
            ? (bangla
                  ? 'পরিচয় গোপন রেখে নিরাপত্তা পর্ষদে প্রেরিত হবে'
                  : 'Identity shielded under BOGCL HSE Whistleblower Policy')
            : emp == null
            ? 'BOGCL OneOps'
            : '${emp.designation.title} · ${emp.department.name} · ${emp.site.name}');

    final effectiveBadge =
        badgeLabel ?? (bangla ? 'অফিসিয়াল ফাইলিং' : 'OFFICIAL FILING');
    final accent = badgeColor ?? cs.primary;

    return Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cs.primaryContainer.withValues(alpha: 0.45),
            cs.surfaceContainerLow,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(Radii.md),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.65)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: accent.withValues(alpha: 0.14),
            child: Icon(
              anonymousMode ? Icons.shield_outlined : Icons.badge_outlined,
              color: accent,
              size: 20,
            ),
          ),
          const SizedBox(width: Space.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  meta,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: Space.sm),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.sm,
              vertical: 4,
            ),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(Radii.pill),
              border: Border.all(color: accent.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(badgeIcon, size: 13, color: accent),
                const SizedBox(width: 4),
                Text(
                  effectiveBadge,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Numbered section card for enterprise forms.
class EnterpriseSectionCard extends StatelessWidget {
  const EnterpriseSectionCard({
    required this.stepNumber,
    required this.icon,
    required this.title,
    required this.children,
    this.subtitle,
    this.trailing,
    super.key,
  });

  final int stepNumber;
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(Radii.md),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 24,
                height: 24,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: cs.primary,
                  borderRadius: BorderRadius.circular(Radii.pill),
                ),
                child: Text(
                  '$stepNumber',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: cs.onPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: Space.sm),
              Icon(icon, size: 18, color: cs.primary),
              const SizedBox(width: Space.xs),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          fontSize: 11.5,
                        ),
                      ),
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: Space.md),
          ...children,
        ],
      ),
    );
  }
}

/// Material 3 boxed dropdown selector for structured lists in forms.
class EnterpriseDropdownField<T> extends StatelessWidget {
  const EnterpriseDropdownField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.icon = Icons.list_alt_outlined,
    this.helperText,
    super.key,
  });

  final String label;
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final IconData icon;
  final String? helperText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.md,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(Radii.md),
            border: Border.all(
              color: cs.primary.withValues(alpha: 0.35),
              width: 1.2,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 14, color: cs.primary),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              DropdownButtonHideUnderline(
                child: DropdownButton<T>(
                  value: value,
                  isExpanded: true,
                  borderRadius: BorderRadius.circular(Radii.md),
                  icon: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: cs.primary,
                  ),
                  items: items,
                  onChanged: onChanged,
                ),
              ),
            ],
          ),
        ),
        if (helperText != null) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.xs),
            child: Text(
              helperText!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
                fontSize: 11.5,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// 1-tap BOGCL standard reason/purpose/description template dropdown.
class EnterpriseTemplateDropdown extends StatelessWidget {
  const EnterpriseTemplateDropdown({
    required this.presets,
    required this.controller,
    this.onPicked,
    this.labelEn = 'Standard BOGCL Template (Quick Fill)',
    this.labelBn = 'স্ট্যান্ডার্ড টেমপ্লেট (দ্রুত পূরণ)',
    super.key,
  });

  final List<(String en, String bn)> presets;
  final TextEditingController controller;
  final VoidCallback? onPicked;
  final String labelEn;
  final String labelBn;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final currentText = controller.text.trim();
    final matched = presets
        .map((p) => bangla ? p.$2 : p.$1)
        .where((t) => t == currentText)
        .firstOrNull;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 4),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(Radii.md),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: matched,
          isExpanded: true,
          borderRadius: BorderRadius.circular(Radii.md),
          icon: Icon(Icons.auto_fix_high_outlined, size: 18, color: cs.primary),
          hint: Row(
            children: [
              Icon(Icons.flash_on_outlined, size: 16, color: cs.primary),
              const SizedBox(width: Space.xs),
              Expanded(
                child: Text(
                  bangla ? labelBn : labelEn,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          items: [
            for (final p in presets)
              DropdownMenuItem<String>(
                value: bangla ? p.$2 : p.$1,
                child: Text(
                  bangla ? p.$2 : p.$1,
                  style: theme.textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
          onChanged: (v) {
            if (v == null) return;
            controller.text = v;
            controller.selection = TextSelection.collapsed(offset: v.length);
            onPicked?.call();
          },
        ),
      ),
    );
  }
}

/// Boxed date or date-time picker tile for enterprise forms.
class EnterpriseDateTile extends StatelessWidget {
  const EnterpriseDateTile({
    required this.label,
    required this.valueText,
    required this.onTap,
    this.icon = Icons.calendar_today_outlined,
    this.errorText,
    super.key,
  });

  final String label;
  final String valueText;
  final VoidCallback onTap;
  final IconData icon;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final hasError = errorText != null;
    return InkWell(
      borderRadius: BorderRadius.circular(Radii.md),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Space.md,
          vertical: Space.sm + 2,
        ),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(Radii.md),
          border: Border.all(
            color: hasError ? context.bogcl.danger : cs.outlineVariant,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(Radii.sm),
              ),
              child: Icon(icon, size: 18, color: cs.primary),
            ),
            const SizedBox(width: Space.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    valueText,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (hasError) ...[
                    const SizedBox(height: 2),
                    Text(
                      errorText!,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: context.bogcl.danger,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.edit_calendar_outlined, size: 18, color: cs.primary),
          ],
        ),
      ),
    );
  }
}

/// Visual 3-step routing & workflow chain preview card.
class EnterpriseWorkflowCard extends StatelessWidget {
  const EnterpriseWorkflowCard({
    required this.title,
    required this.steps,
    this.slaNote,
    super.key,
  });

  final String title;
  final List<(IconData icon, String role, String subtitle)> steps;
  final String? slaNote;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(Radii.md),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.account_tree_outlined, size: 18, color: cs.primary),
              const SizedBox(width: Space.xs),
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          Row(
            children: [
              for (final (i, s) in steps.indexed) ...[
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(Space.sm),
                    decoration: BoxDecoration(
                      color: cs.surface,
                      borderRadius: BorderRadius.circular(Radii.sm),
                      border: Border.all(
                        color: i == 0
                            ? cs.primary.withValues(alpha: 0.45)
                            : cs.outlineVariant.withValues(alpha: 0.6),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          s.$1,
                          size: 18,
                          color: i == 0 ? cs.primary : cs.onSurfaceVariant,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s.$2,
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          s.$3,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 10,
                            color: cs.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
                if (i < steps.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 12,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
              ],
            ],
          ),
          if (slaNote != null) ...[
            const SizedBox(height: Space.sm),
            Row(
              children: [
                Icon(Icons.info_outline, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    slaNote!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontSize: 11.5,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Pinned bottom submit bar with live validation readiness feedback.
class EnterpriseFormBottomBar extends StatelessWidget {
  const EnterpriseFormBottomBar({
    required this.primaryLabel,
    required this.onPrimaryPressed,
    this.primaryIcon = Icons.send_outlined,
    this.loading = false,
    this.isReady = true,
    this.readyMessage,
    this.missingMessage,
    this.errorMessage,
    this.secondaryLabel,
    this.onSecondaryPressed,
    super.key,
  });

  final String primaryLabel;
  final VoidCallback? onPrimaryPressed;
  final IconData primaryIcon;
  final bool loading;
  final bool isReady;
  final String? readyMessage;
  final String? missingMessage;
  final String? errorMessage;
  final String? secondaryLabel;
  final VoidCallback? onSecondaryPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;

    final statusColor = errorMessage != null
        ? context.bogcl.danger
        : isReady
        ? context.bogcl.success
        : context.bogcl.warning;

    final statusText =
        errorMessage ??
        (isReady
            ? (readyMessage ??
                  (bangla
                      ? 'সকল তথ্য যাচাইকৃত · জমা দেওয়ার জন্য প্রস্তুত'
                      : 'All required fields verified · Ready to submit'))
            : (missingMessage ??
                  (bangla
                      ? 'অনুগ্রহ করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন'
                      : 'Complete the required fields above to proceed')));

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.sm,
          Space.lg,
          Space.md,
        ),
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border(
            top: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.6)),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.sm + 2,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(Radii.sm),
              ),
              child: Row(
                children: [
                  Icon(
                    errorMessage != null
                        ? Icons.error_outline
                        : isReady
                        ? Icons.check_circle_outline
                        : Icons.pending_outlined,
                    size: 15,
                    color: statusColor,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      statusText,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Space.sm),
            if (secondaryLabel != null)
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: secondaryLabel!,
                      onPressed: loading ? null : onSecondaryPressed,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    flex: 2,
                    child: PrimaryButton(
                      label: primaryLabel,
                      icon: primaryIcon,
                      loading: loading,
                      onPressed: loading ? null : onPrimaryPressed,
                    ),
                  ),
                ],
              )
            else
              PrimaryButton(
                label: primaryLabel,
                icon: primaryIcon,
                loading: loading,
                onPressed: loading ? null : onPrimaryPressed,
              ),
          ],
        ),
      ),
    );
  }
}

/// Standardized header for modal bottom sheets across the application.
class EnterpriseModalHeader extends StatelessWidget {
  const EnterpriseModalHeader({
    required this.title,
    required this.icon,
    this.subtitle,
    this.accentColor,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final accent = accentColor ?? cs.primary;
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(Radii.md),
            ),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(width: Space.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
