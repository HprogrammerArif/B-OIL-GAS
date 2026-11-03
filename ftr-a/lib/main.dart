import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: BogclApp()));
}

/// Temporary shell; replaced by the real app shell in Phase 1.
class BogclApp extends StatelessWidget {
  const BogclApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      onGenerateTitle: (context) => AppL10n.of(context).appName,
      localizationsDelegates: AppL10n.localizationsDelegates,
      supportedLocales: AppL10n.supportedLocales,
      home: Scaffold(
        body: Center(
          child: Builder(
            builder: (context) => Text(AppL10n.of(context).appName),
          ),
        ),
      ),
    );
  }
}
