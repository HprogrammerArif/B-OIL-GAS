import 'package:flutter/material.dart';

/// Brand colour tokens (doc 05-F §6).
abstract final class BrandColors {
  static const crimson = Color(0xFFA51C30);
  static const crimsonDark = Color(0xFF7F1424);
  static const slate900 = Color(0xFF0B132B);
  static const slate950 = Color(0xFF060D1F);
  static const canvas = Color(0xFFF8FAFC);
  static const gold = Color(0xFFD4AF37);
  static const success = Color(0xFF059669);
  static const warning = Color(0xFFD97706);
  static const danger = Color(0xFFDC2626);
  static const info = Color(0xFF0284C7);
}

/// Spacing scale.
abstract final class Space {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
}

/// Corner radii.
abstract final class Corner {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double pill = 999;
}

/// Alias for [Corner] used by enterprise form & modal components.
typedef Radii = Corner;

/// Minimum touch target (a11y).
const double kMinTouchTarget = 48;

/// Soft card shadow used instead of a heavy wireframe border.
List<BoxShadow> cardShadow(Color shadow) => [
  BoxShadow(
    color: shadow.withValues(alpha: 0.07),
    blurRadius: 18,
    offset: const Offset(0, 6),
  ),
];

/// Semantic colours that are not part of [ColorScheme].
@immutable
class BogclColors extends ThemeExtension<BogclColors> {
  const BogclColors({
    required this.executiveGold,
    required this.success,
    required this.successContainer,
    required this.warning,
    required this.warningContainer,
    required this.danger,
    required this.dangerContainer,
    required this.info,
    required this.infoContainer,
    required this.mutedContainer,
  });

  static const light = BogclColors(
    executiveGold: BrandColors.gold,
    success: BrandColors.success,
    successContainer: Color(0xFFD1FAE5),
    warning: BrandColors.warning,
    warningContainer: Color(0xFFFEF3C7),
    danger: BrandColors.danger,
    dangerContainer: Color(0xFFFEE2E2),
    info: BrandColors.info,
    infoContainer: Color(0xFFE0F2FE),
    mutedContainer: Color(0xFFE2E8F0),
  );

  static const dark = BogclColors(
    executiveGold: BrandColors.gold,
    success: Color(0xFF34D399),
    successContainer: Color(0xFF064E3B),
    warning: Color(0xFFFBBF24),
    warningContainer: Color(0xFF78350F),
    danger: Color(0xFFF87171),
    dangerContainer: Color(0xFF7F1D1D),
    info: Color(0xFF38BDF8),
    infoContainer: Color(0xFF0C4A6E),
    mutedContainer: Color(0xFF1E293B),
  );

  final Color executiveGold;
  final Color success;
  final Color successContainer;
  final Color warning;
  final Color warningContainer;
  final Color danger;
  final Color dangerContainer;
  final Color info;
  final Color infoContainer;
  final Color mutedContainer;

  @override
  BogclColors copyWith({
    Color? executiveGold,
    Color? success,
    Color? successContainer,
    Color? warning,
    Color? warningContainer,
    Color? danger,
    Color? dangerContainer,
    Color? info,
    Color? infoContainer,
    Color? mutedContainer,
  }) {
    return BogclColors(
      executiveGold: executiveGold ?? this.executiveGold,
      success: success ?? this.success,
      successContainer: successContainer ?? this.successContainer,
      warning: warning ?? this.warning,
      warningContainer: warningContainer ?? this.warningContainer,
      danger: danger ?? this.danger,
      dangerContainer: dangerContainer ?? this.dangerContainer,
      info: info ?? this.info,
      infoContainer: infoContainer ?? this.infoContainer,
      mutedContainer: mutedContainer ?? this.mutedContainer,
    );
  }

  @override
  BogclColors lerp(ThemeExtension<BogclColors>? other, double t) {
    if (other is! BogclColors) return this;
    return BogclColors(
      executiveGold: Color.lerp(executiveGold, other.executiveGold, t)!,
      success: Color.lerp(success, other.success, t)!,
      successContainer: Color.lerp(
        successContainer,
        other.successContainer,
        t,
      )!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningContainer: Color.lerp(
        warningContainer,
        other.warningContainer,
        t,
      )!,
      danger: Color.lerp(danger, other.danger, t)!,
      dangerContainer: Color.lerp(dangerContainer, other.dangerContainer, t)!,
      info: Color.lerp(info, other.info, t)!,
      infoContainer: Color.lerp(infoContainer, other.infoContainer, t)!,
      mutedContainer: Color.lerp(mutedContainer, other.mutedContainer, t)!,
    );
  }
}

extension BogclThemeContext on BuildContext {
  BogclColors get bogcl => Theme.of(this).extension<BogclColors>()!;
}
