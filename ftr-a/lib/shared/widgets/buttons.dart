import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:flutter/material.dart';

enum _ButtonKind { primary, secondary, danger }

/// Filled brand button with loading state and haptic feedback.
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.expand = true,
    super.key,
  }) : _kind = _ButtonKind.primary;

  /// Outlined, lower emphasis.
  const PrimaryButton.secondary({
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.expand = true,
    super.key,
  }) : _kind = _ButtonKind.secondary;

  /// Destructive action (reject, cancel, delete).
  const PrimaryButton.danger({
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.expand = true,
    super.key,
  }) : _kind = _ButtonKind.danger;

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool expand;
  final _ButtonKind _kind;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final enabled = onPressed != null && !loading;
    void handle() {
      Haptics.tap();
      onPressed?.call();
    }

    final fg = switch (_kind) {
      _ButtonKind.primary => scheme.onPrimary,
      _ButtonKind.secondary => scheme.primary,
      _ButtonKind.danger => Colors.white,
    };
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        else if (icon != null)
          Icon(icon, size: 20),
        if (loading || icon != null) const SizedBox(width: Space.sm),
        Flexible(child: Text(label, textAlign: TextAlign.center)),
      ],
    );

    final button = switch (_kind) {
      _ButtonKind.primary => FilledButton(
        onPressed: enabled ? handle : null,
        child: child,
      ),
      _ButtonKind.secondary => OutlinedButton(
        onPressed: enabled ? handle : null,
        child: child,
      ),
      _ButtonKind.danger => FilledButton(
        onPressed: enabled ? handle : null,
        style: FilledButton.styleFrom(
          backgroundColor: context.bogcl.danger,
          foregroundColor: Colors.white,
        ),
        child: child,
      ),
    };

    return Semantics(
      button: true,
      enabled: enabled,
      child: expand ? SizedBox(width: double.infinity, child: button) : button,
    );
  }
}
