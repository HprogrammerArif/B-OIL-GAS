import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/app/modules.dart';
import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/data/auth_repository.dart';
import 'package:bogcl_oneops/features/auth/presentation/app_lock.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/files/presentation/profile_avatar.dart';
import 'package:bogcl_oneops/features/home/presentation/search_sheet.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
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
  bool _uploadingPhoto = false;

  void _onVersionTap() {
    _taps++;
    if (_taps >= _demoTaps) {
      _taps = 0;
      Haptics.heavy();
      unawaited(showDemoMenu(context));
    }
  }

  Future<void> _changePhoto() async {
    final l10n = context.l10n;
    final picked = await pickAttachment(context, allowFiles: false);
    if (picked == null || !mounted) return;
    setState(() => _uploadingPhoto = true);
    var failure = l10n.uploadRejected;
    var done = false;
    try {
      final uploads = ref.read(uploadServiceProvider);
      final meta = await uploads.upload(picked, purpose: 'AVATAR');
      await uploads.awaitClean(meta.id);
      await ref.read(authRepositoryProvider).setPhoto(meta.id);
      await ref.read(sessionControllerProvider.notifier).reload();
      done = true;
    } on ApiException catch (e) {
      failure = switch (e.code) {
        ApiErrorCode.offline ||
        ApiErrorCode.timeout => l10n.uploadNeedsConnection,
        ApiErrorCode.forbidden => l10n.uploadBlocked,
        _ => l10n.uploadRejected,
      };
    }
    if (!mounted) return;
    setState(() => _uploadingPhoto = false);
    AppToast.show(
      context,
      done ? l10n.photoUpdated : failure,
      tone: done ? StatusTone.success : StatusTone.danger,
    );
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
    final allowed = {
      for (final m in builtModules)
        if (s.navigation.contains(m.key) &&
            m.key != 'attendance' &&
            m.key != 'approvals' &&
            !(m.key == 'chat' && s.showChatTab))
          m,
    };

    List<AppModule> group(Set<String> keys) => [
      for (final m in builtModules)
        if (allowed.contains(m) && keys.contains(m.key)) m,
    ];
    final myWork = group({'leave', 'claims', 'bus', 'note-sheets', 'chat'});
    final operations = group({
      'visitors',
      'parcels',
      'fleet',
      'incidents',
      'assets',
    });
    final company = group({'notices', 'employees', 'compliance'});

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.navMore),
        actions: const [AppBarActions()],
      ),
      body: ListView(
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
                        _EditableAvatar(
                          name: emp.fullName,
                          photoFileId: emp.photoFileId,
                          busy: _uploadingPhoto,
                          onTap: _changePhoto,
                        ),
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
          if (myWork.isNotEmpty) ...[
            SectionHeader(title: l10n.moreMyWork),
            _ModuleGroup(modules: myWork),
          ],
          if (operations.isNotEmpty) ...[
            SectionHeader(title: l10n.moreOperations),
            _ModuleGroup(modules: operations),
          ],
          if (company.isNotEmpty) ...[
            SectionHeader(title: l10n.moreCompany),
            _ModuleGroup(modules: company),
          ],
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
                          .setPreferredLanguage(
                            locale.languageCode.toUpperCase(),
                          )
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
              title: l10n.searchTitle,
              leading: const Icon(Icons.search),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => unawaited(showGlobalSearch(context)),
            ),
          ),
          const SizedBox(height: Space.md),
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
      ),
    );
  }
}

class _ModuleGroup extends StatelessWidget {
  const _ModuleGroup({required this.modules});

  final List<AppModule> modules;

  @override
  Widget build(BuildContext context) {
    return GroupCard(
      margin: const EdgeInsets.symmetric(horizontal: Space.lg),
      children: [
        for (final m in modules)
          ListRow(
            inset: true,
            title: m.label(context.l10n),
            leading: Icon(m.icon),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(m.route),
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

/// Profile photo with a camera badge; tap to change it.
class _EditableAvatar extends StatelessWidget {
  const _EditableAvatar({
    required this.name,
    required this.photoFileId,
    required this.busy,
    required this.onTap,
  });

  final String name;
  final String? photoFileId;
  final bool busy;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: context.l10n.moreChangePhoto,
      child: InkResponse(
        onTap: busy ? null : () => unawaited(onTap()),
        radius: 34,
        child: SizedBox(
          width: 56,
          height: 56,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              ProfileAvatar(name: name, photoFileId: photoFileId, size: 52),
              if (busy)
                const SizedBox(
                  width: 52,
                  height: 52,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
              Positioned(
                right: -2,
                bottom: -2,
                child: CircleAvatar(
                  radius: 11,
                  backgroundColor: scheme.primary,
                  child: Icon(
                    Icons.photo_camera,
                    size: 13,
                    color: scheme.onPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
