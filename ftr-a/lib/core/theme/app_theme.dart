import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

/// Builds the light and dark Material 3 themes (doc 05-F §6).
abstract final class AppTheme {
  static const _latin = 'Inter';
  static const _bengali = 'NotoSansBengali';

  static const _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: BrandColors.crimson,
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFF8D5DA),
    onPrimaryContainer: Color(0xFF3F0B14),
    secondary: BrandColors.slate900,
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFE2E8F0),
    onSecondaryContainer: BrandColors.slate900,
    tertiary: BrandColors.gold,
    onTertiary: BrandColors.slate950,
    tertiaryContainer: Color(0xFFF8EFC8),
    onTertiaryContainer: Color(0xFF3F3208),
    error: BrandColors.danger,
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF7F1D1D),
    surface: Color(0xFFFFFFFF),
    onSurface: BrandColors.slate900,
    onSurfaceVariant: Color(0xFF475569),
    outline: Color(0xFF94A3B8),
    outlineVariant: Color(0xFFE2E8F0),
    shadow: BrandColors.slate900,
    scrim: Color(0xFF000000),
    inverseSurface: BrandColors.slate900,
    onInverseSurface: Color(0xFFF1F5F9),
    inversePrimary: Color(0xFFE5566B),
    surfaceTint: BrandColors.crimson,
    surfaceContainerLowest: Color(0xFFFFFFFF),
    surfaceContainerLow: Color(0xFFF8FAFC),
    surfaceContainer: Color(0xFFF1F5F9),
    surfaceContainerHigh: Color(0xFFE8EEF4),
    surfaceContainerHighest: Color(0xFFE2E8F0),
  );

  static const _darkScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xFFE5566B),
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFF7F1424),
    onPrimaryContainer: Color(0xFFF8D5DA),
    secondary: Color(0xFFCBD5E1),
    onSecondary: BrandColors.slate950,
    secondaryContainer: Color(0xFF1E293B),
    onSecondaryContainer: Color(0xFFE2E8F0),
    tertiary: BrandColors.gold,
    onTertiary: BrandColors.slate950,
    tertiaryContainer: Color(0xFF3F3208),
    onTertiaryContainer: Color(0xFFF8EFC8),
    error: Color(0xFFF87171),
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFF7F1D1D),
    onErrorContainer: Color(0xFFFEE2E2),
    surface: BrandColors.slate900,
    onSurface: Color(0xFFF1F5F9),
    onSurfaceVariant: Color(0xFF94A3B8),
    outline: Color(0xFF64748B),
    outlineVariant: Color(0xFF1E293B),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: Color(0xFFF1F5F9),
    onInverseSurface: BrandColors.slate900,
    inversePrimary: BrandColors.crimson,
    surfaceTint: Color(0xFFE5566B),
    surfaceContainerLowest: BrandColors.slate950,
    surfaceContainerLow: Color(0xFF0F172A),
    surfaceContainer: Color(0xFF1E293B),
    surfaceContainerHigh: Color(0xFF273548),
    surfaceContainerHighest: Color(0xFF334155),
  );

  static ThemeData light(Locale locale) =>
      _build(locale, _lightScheme, BrandColors.canvas, BogclColors.light);

  static ThemeData dark(Locale locale) =>
      _build(locale, _darkScheme, BrandColors.slate950, BogclColors.dark);

  static TextTheme _textTheme(Locale locale, Color color) {
    final isBn = locale.languageCode == 'bn';
    final height = isBn ? 1.45 : 1.3;
    TextStyle s(double size, FontWeight w, {double? h}) => TextStyle(
      fontFamily: isBn ? _bengali : _latin,
      fontFamilyFallback: const [_bengali, _latin],
      fontSize: size,
      fontWeight: w,
      height: h ?? height,
      letterSpacing: size >= 22 ? -0.3 : 0,
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
    ColorScheme scheme,
    Color scaffold,
    BogclColors extension,
  ) {
    final text = _textTheme(locale, scheme.onSurface);
    final muted = text.bodySmall?.copyWith(color: scheme.onSurfaceVariant);
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(Corner.md),
    );
    final cardShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(Corner.lg),
    );
    const minSize = WidgetStatePropertyAll(Size(64, kMinTouchTarget));

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffold,
      textTheme: text,
      fontFamily: locale.languageCode == 'bn' ? _bengali : _latin,
      extensions: [extension],
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: scaffold,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
        titleSpacing: Space.lg,
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        surfaceTintColor: Colors.transparent,
        shadowColor: scheme.shadow.withValues(alpha: 0.08),
        shape: cardShape.copyWith(
          side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.8)),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: scheme.onSurfaceVariant,
        minVerticalPadding: Space.md,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: muted,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          minimumSize: minSize,
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: Space.xl, vertical: Space.md),
          ),
          shape: WidgetStatePropertyAll(shape),
          textStyle: WidgetStatePropertyAll(text.labelLarge),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          minimumSize: minSize,
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: Space.xl, vertical: Space.md),
          ),
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
          vertical: Space.lg,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Corner.md),
          borderSide: BorderSide(color: scheme.outlineVariant),
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
        elevation: 0,
        height: 72,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        indicatorColor: scheme.primary.withValues(alpha: 0.12),
        indicatorShape: const StadiumBorder(),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return (text.labelMedium ?? const TextStyle()).copyWith(
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 24,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        showDragHandle: true,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: cardShape,
      ),
      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant,
        space: 1,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        elevation: 2,
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
