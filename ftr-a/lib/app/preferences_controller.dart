import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'preferences_controller.g.dart';

const _localeKey = 'pref.locale';
const _themeKey = 'pref.themeMode';

/// Non-sensitive UI preferences only. Tokens and keys never go here.
@Riverpod(keepAlive: true)
Future<SharedPreferences> sharedPrefs(Ref ref) =>
    SharedPreferences.getInstance();

/// Current app locale (EN/BN), persisted and applied instantly.
@Riverpod(keepAlive: true)
class LocaleController extends _$LocaleController {
  @override
  Locale build() {
    final prefs = ref.watch(sharedPrefsProvider).value;
    final code = prefs?.getString(_localeKey);
    return Locale(code == 'bn' ? 'bn' : 'en');
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await ref.read(sharedPrefsProvider.future);
    await prefs.setString(_localeKey, locale.languageCode);
  }
}

/// Light / dark / system, persisted.
@Riverpod(keepAlive: true)
class ThemeModeController extends _$ThemeModeController {
  @override
  ThemeMode build() {
    final prefs = ref.watch(sharedPrefsProvider).value;
    final name = prefs?.getString(_themeKey);
    return ThemeMode.values.firstWhere(
      (m) => m.name == name,
      orElse: () => ThemeMode.system,
    );
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final prefs = await ref.read(sharedPrefsProvider.future);
    await prefs.setString(_themeKey, mode.name);
  }
}
