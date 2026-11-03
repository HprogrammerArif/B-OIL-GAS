import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

/// Builds the light and dark Material 3 themes (doc 05-F §6).
abstract final class AppTheme {
  static const _latin = 'Inter';
  static const _bengali = 'NotoSansBengali';

  static ThemeData light(Locale locale) => _build(
    locale,
    ColorScheme.fromSeed(seedColor: BrandColors.crimson).copyWith(
      primary: BrandColors.crimson,
      onPrimary: Colors.white,
      secondary: BrandColors.slate900,
      onSecondary: Colors.white,
      tertiary: BrandColors.gold,
      surface: Colors.white,
      onSurface: BrandColors.slate900,
      error: BrandColors.danger,
    ),
    scaffold: BrandColors.canvas,
    extension: BogclColors.light,
  );

  static ThemeData dark(Locale locale) => _build(
    locale,
    ColorScheme.fromSeed(
      seedColor: BrandColors.crimson,
      brightness: Brightness.dark,
    ).copyWith(
      primary: const Color(0xFFE5566B),
      onPrimary: Colors.white,
      secondary: const Color(0xFFCBD5E1),
      onSecondary: BrandColors.slate950,
      tertiary: BrandColors.gold,
      surface: BrandColors.slate900,
      onSurface: const Color(0xFFF1F5F9),
      error: const Color(0xFFF87171),
    ),
    scaffold: BrandColors.slate950,
    extension: BogclColors.dark,
  );

  static TextTheme _textTheme(Locale locale, Color color) {
    final isBn = locale.languageCode == 'bn';
    // Bengali needs taller lines so conjuncts and matras never clip.
    final height = isBn ? 1.45 : 1.3;
    TextStyle s(double size, FontWeight w, {double? h}) => TextStyle(
      fontFamily: isBn ? _bengali : _latin,
      fontFamilyFallback: const [_bengali, _latin],
      fontSize: size,
      fontWeight: w,
      height: h ?? height,
      color: color,
    );
    return TextTheme(
      displaySmall: s(32, FontWeight.w700),
      headlineLarge: s(28, FontWeight.w700),
      headlineMedium: s(24, FontWeight.w700),
      headlineSmall: s(22, FontWeight.w600),
      titleLarge: s(20, FontWeight.w600),
      titleMedium: s(16, FontWeight.w600),
      titleSmall: s(14, FontWeight.w600),
      bodyLarge: s(16, FontWeight.w400, h: isBn ? 1.45 : 1.5),
      bodyMedium: s(14, FontWeight.w400, h: isBn ? 1.45 : 1.45),
      bodySmall: s(12, FontWeight.w400),
      labelLarge: s(14, FontWeight.w600),
      labelMedium: s(12, FontWeight.w600),
      labelSmall: s(11, FontWeight.w500),
    );
  }

  static ThemeData _build(
    Locale locale,
    ColorScheme scheme, {
    required Color scaffold,
    required BogclColors extension,
  }) {
    final text = _textTheme(locale, scheme.onSurface);
    final outline = scheme.outlineVariant;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(Corner.md),
    );
    const minSize = WidgetStatePropertyAll(
      Size(kMinTouchTarget, kMinTouchTarget),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffold,
      textTheme: text,
      fontFamily: locale.languageCode == 'bn' ? _bengali : _latin,
      extensions: [extension],
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      appBarTheme: AppBarTheme(
        backgroundColor: scaffold,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Corner.lg),
          side: BorderSide(color: outline),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          minimumSize: minSize,
          shape: WidgetStatePropertyAll(shape),
          textStyle: WidgetStatePropertyAll(text.labelLarge),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          minimumSize: minSize,
          shape: WidgetStatePropertyAll(shape),
          textStyle: WidgetStatePropertyAll(text.labelLarge),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          minimumSize: minSize,
          shape: WidgetStatePropertyAll(shape),
          textStyle: WidgetStatePropertyAll(text.labelLarge),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Space.lg,
          vertical: Space.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primary.withValues(alpha: 0.12),
        labelTextStyle: WidgetStatePropertyAll(text.labelMedium),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
      ),
      dividerTheme: DividerThemeData(color: outline, space: 1, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: shape,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}
