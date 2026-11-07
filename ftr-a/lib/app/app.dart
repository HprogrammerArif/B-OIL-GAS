import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/app/router.dart';
import 'package:bogcl_oneops/app/sync_state.dart';
import 'package:bogcl_oneops/core/theme/app_theme.dart';
import 'package:bogcl_oneops/features/auth/presentation/app_lock.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BogclApp extends ConsumerWidget {
  const BogclApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeControllerProvider);
    final themeMode = ref.watch(themeModeControllerProvider);
    final router = ref.watch(routerProvider);
    // Keeps the offline outbox syncing for the whole app lifetime.
    ref.watch(syncCoordinatorProvider);

    return MaterialApp.router(
      builder: (context, child) =>
          AppLockGate(child: child ?? const SizedBox.shrink()),
      onGenerateTitle: (context) => AppL10n.of(context).appName,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      locale: locale,
      localizationsDelegates: AppL10n.localizationsDelegates,
      supportedLocales: AppL10n.supportedLocales,
      theme: AppTheme.light(locale),
      darkTheme: AppTheme.dark(locale),
      themeMode: themeMode,
    );
  }
}
