import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/data/auth_repository.dart';
import 'package:bogcl_oneops/features/auth/presentation/app_lock.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'more_screen.g.dart';

@riverpod
Future<String> appVersion(Ref ref) async {
  final info = await PackageInfo.fromPlatform();
  return '${info.version} (${info.buildNumber})';
}

class MoreScreen extends ConsumerStatefulWidget {
  const MoreScreen({super.key});

  @override
  ConsumerState<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends ConsumerState<MoreScreen> {
  static const _demoTaps = 7;
  int _taps = 0;

  void _onVersionTap() {
    _taps++;
    if (_taps >= _demoTaps) {
      _taps = 0;
      Haptics.heavy();
      unawaited(showDemoMenu(context));
    }
  }

  Future<void> _signOut() async {
    final l10n = context.l10n;
    final confirmed = await showConfirmSheet(
      context,
      title: l10n.signOutConfirmTitle,
      message: l10n.signOutConfirmMessage,
      confirmLabel: l10n.signOut,
      destructive: true,
    );
    if (!confirmed) return;
    await ref.read(sessionControllerProvider.notifier).logout();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider);
    final themeMode = ref.watch(themeModeControllerProvider);
    final version = ref.watch(appVersionProvider).value;
    final biometricSupported =
        ref.watch(biometricSupportedProvider).value ?? false;
    final biometricEnabled = ref.watch(biometricEnabledProvider).value ?? true;
    final queued = ref.watch(outboxItemsProvider).value?.length ?? 0;

    final s = session.value;
    if (s == null) {
      return session.hasError
          ? ErrorState(onRetry: () => ref.invalidate(sessionControllerProvider))
          : const SkeletonList();
    }
    final emp = s.profile.employee;

    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxxl),
      children: [
        SectionHeader(title: l10n.moreProfile),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Avatar(name: emp.fullName, size: 52),
                      const SizedBox(width: Space.lg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              emp.displayName(bangla: bangla),
                              style: theme.textTheme.titleMedium,
                            ),
                            Text(
                              emp.designationTitle(bangla: bangla),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.lg),
                  _Detail(l10n.profileEmployeeId, emp.empCode),
                  _Detail(l10n.profileEmail, s.profile.email),
                  _Detail(l10n.profilePhone, s.profile.phone),
                ],
              ),
            ),
          ),
        ),
        SectionHeader(title: l10n.moreSettings),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.settingsLanguage,
                    style: theme.textTheme.labelLarge,
                  ),
                  const SizedBox(height: Space.sm),
                  LanguageSwitch(
                    onChanged: (locale) => ref
                        .read(authRepositoryProvider)
                        .setPreferredLanguage(locale.languageCode.toUpperCase())
                        .ignore(),
                  ),
                  const SizedBox(height: Space.xl),
                  Text(l10n.settingsTheme, style: theme.textTheme.labelLarge),
                  const SizedBox(height: Space.sm),
                  SegmentedButton<ThemeMode>(
                    showSelectedIcon: false,
                    segments: [
                      ButtonSegment(
                        value: ThemeMode.system,
                        label: Text(l10n.themeSystem),
                      ),
                      ButtonSegment(
                        value: ThemeMode.light,
                        label: Text(l10n.themeLight),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        label: Text(l10n.themeDark),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (m) => ref
                        .read(themeModeControllerProvider.notifier)
                        .setMode(m.first),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (biometricSupported)
          Padding(
            padding: const EdgeInsets.only(top: Space.lg),
            child: Card(
              margin: const EdgeInsets.symmetric(horizontal: Space.lg),
              child: SwitchListTile(
                title: Text(l10n.settingsBiometric),
                subtitle: Text(l10n.settingsBiometricHint),
                secondary: const Icon(Icons.fingerprint),
                value: biometricEnabled,
                onChanged: (v) => unawaited(
                  ref.read(biometricEnabledProvider.notifier).set(value: v),
                ),
              ),
            ),
          ),
        const SizedBox(height: Space.lg),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: ListRow(
            title: l10n.moreOutbox,
            leading: const Icon(Icons.sync_alt),
            trailing: queued > 0
                ? Badge(label: Text('$queued'))
                : const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.outbox),
          ),
        ),
        const SizedBox(height: Space.md),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: ListRow(
            title: l10n.moreActivity,
            leading: const Icon(Icons.history),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.activity),
          ),
        ),
        const SizedBox(height: Space.md),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: ListRow(
            title: l10n.signOut,
            leading: Icon(Icons.logout, color: theme.colorScheme.error),
            onTap: _signOut,
          ),
        ),
        if (version != null)
          Padding(
            padding: const EdgeInsets.only(top: Space.xl),
            child: Center(
              child: InkWell(
                onTap: _onVersionTap,
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Text(
                    l10n.versionLabel(version),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Space.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
