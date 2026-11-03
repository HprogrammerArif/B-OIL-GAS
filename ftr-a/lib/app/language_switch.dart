import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// EN / বাংলা toggle. Persisted and applied instantly.
class LanguageSwitch extends ConsumerWidget {
  const LanguageSwitch({this.onChanged, super.key});

  /// Called after the locale changed (e.g. to sync the profile).
  final ValueChanged<Locale>? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeControllerProvider);
    final l10n = context.l10n;
    return SegmentedButton<String>(
      showSelectedIcon: false,
      segments: [
        ButtonSegment(value: 'en', label: Text(l10n.languageEnglish)),
        ButtonSegment(value: 'bn', label: Text(l10n.languageBangla)),
      ],
      selected: {locale.languageCode},
      onSelectionChanged: (s) {
        final next = Locale(s.first);
        unawaited(ref.read(localeControllerProvider.notifier).setLocale(next));
        onChanged?.call(next);
      },
    );
  }
}
