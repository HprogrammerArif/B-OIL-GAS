import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/app/modules.dart';
import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
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
import 'package:bogcl_oneops/shared/widgets/persona_switcher_sheet.dart';
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
  bool _uploadingPhoto = false;

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
    final scheme = theme.colorScheme;
    final session = ref.watch(sessionControllerProvider);
    final themeMode = ref.watch(themeModeControllerProvider);
    final version = ref.watch(appVersionProvider).value;
    final biometricSupported =
        ref.watch(biometricSupportedProvider).value ?? false;
    final biometricEnabled = ref.watch(biometricEnabledProvider).value ?? true;
    final queued = ref.watch(outboxItemsProvider).value?.length ?? 0;
    final pendingApprovals =
        ref.watch(approvalSummaryProvider).value?.pending ?? 0;

    final s = session.value;
    if (s == null) {
      return session.hasError
          ? ErrorState(onRetry: () => ref.invalidate(sessionControllerProvider))
          : const SkeletonList();
    }
    final emp = s.profile.employee;
    final persona = findCanonicalPersona(emp.empCode);

    // Grouping modules into 5 B2B operational categories
    final allowedKeys = s.navigation.toSet();
    List<AppModule> group(Set<String> keys) => [
      for (final m in builtModules)
        if (allowedKeys.contains(m.key) && keys.contains(m.key)) m,
    ];

    final governanceModules = group({
      'approvals',
      'note-sheets',
      'compliance',
      'claims',
    });
    final dailyWorkModules = group({'attendance', 'employees', 'notices'});
    final transportModules = group({'fleet', 'bus'});
    final siteOpsModules = group({'parcels', 'visitors'});
    final refineryModules = group({'incidents', 'assets', 'chat'});

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.navMore),
        actions: const [AppBarActions()],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: Space.xxxl),
        children: [
          // 1-Tap Pitch Persona Switcher Card
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.sm,
              Space.lg,
              Space.xs,
            ),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Corner.xl),
                side: BorderSide(
                  color: scheme.primary.withValues(alpha: 0.25),
                  width: 1.2,
                ),
              ),
              color: scheme.primaryContainer.withValues(alpha: 0.2),
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
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
                        const SizedBox(width: Space.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      persona != null
                                          ? (bangla
                                                ? persona.roleLabelBn
                                                : persona.roleLabelEn)
                                          : emp.displayName(bangla: bangla),
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: Space.xs),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: persona?.isPlantSite == true
                                          ? Colors.amber.withValues(alpha: 0.2)
                                          : Colors.teal.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(
                                        Corner.sm,
                                      ),
                                    ),
                                    child: Text(
                                      persona?.isPlantSite == true
                                          ? (bangla ? 'প্ল্যান্ট' : 'Plant')
                                          : 'HQ',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: persona?.isPlantSite == true
                                            ? Colors.amber.shade900
                                            : Colors.teal.shade800,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                '${emp.displayName(bangla: bangla)} · ${emp.empCode}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                              Text(
                                emp.designationTitle(bangla: bangla),
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: scheme.onSurfaceVariant.withValues(
                                    alpha: 0.8,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (persona != null) ...[
                      const SizedBox(height: Space.sm),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: Space.sm,
                          vertical: Space.xs,
                        ),
                        decoration: BoxDecoration(
                          color: scheme.surface,
                          borderRadius: BorderRadius.circular(Corner.md),
                          border: Border.all(
                            color: scheme.outlineVariant.withValues(alpha: 0.5),
                          ),
                        ),
                        child: Text(
                          bangla
                              ? persona.pitchHighlightBn
                              : persona.pitchHighlightEn,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: scheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: Space.sm),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonalIcon(
                        onPressed: () =>
                            unawaited(showPersonaSwitcherSheet(context)),
                        icon: const Icon(Icons.swap_horiz, size: 20),
                        label: Text(
                          bangla
                              ? 'চরিত্র পরিবর্তন করুন (৭টি ভূমিকা)'
                              : 'Switch Persona (7 Pitch Roles)',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 1. Governance & Finance
          if (governanceModules.isNotEmpty) ...[
            SectionHeader(
              title: bangla ? 'সুশাসন ও অর্থ' : 'Governance & Finance',
            ),
            _ModuleGroup(
              modules: governanceModules,
              badgeProvider: (key) => key == 'approvals' ? pendingApprovals : 0,
            ),
          ],

          // 2. My Daily Work & HR
          if (dailyWorkModules.isNotEmpty) ...[
            SectionHeader(
              title: bangla ? 'দৈনন্দিন কাজ ও মানবসম্পদ' : 'My Daily Work & HR',
            ),
            _ModuleGroup(modules: dailyWorkModules),
          ],

          // 3. Transport & Commute
          if (transportModules.isNotEmpty) ...[
            SectionHeader(
              title: bangla ? 'পরিবহন ও যাতায়াত' : 'Transport & Commute',
            ),
            _ModuleGroup(modules: transportModules),
          ],

          // 4. Site Operations & Security
          if (siteOpsModules.isNotEmpty) ...[
            SectionHeader(
              title: bangla
                  ? 'সাইট অপারেশন ও নিরাপত্তা'
                  : 'Site Operations & Security',
            ),
            _ModuleGroup(modules: siteOpsModules),
          ],

          // 5. Refinery Safety, Assets & Executive Comms
          if (refineryModules.isNotEmpty) ...[
            SectionHeader(
              title: bangla
                  ? 'নিরাপত্তা, সম্পদ ও অভ্যন্তরীণ যোগাযোগ'
                  : 'Refinery Safety, Assets & Chat',
            ),
            _ModuleGroup(modules: refineryModules),
          ],

          // Settings & Preferences
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
                  onTap: () => unawaited(showDemoMenu(context)),
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
  const _ModuleGroup({required this.modules, this.badgeProvider});

  final List<AppModule> modules;
  final int Function(String key)? badgeProvider;

  @override
  Widget build(BuildContext context) {
    return GroupCard(
      margin: const EdgeInsets.symmetric(horizontal: Space.lg),
      children: [
        for (final m in modules)
          Builder(
            builder: (context) {
              final badgeCount = badgeProvider?.call(m.key) ?? 0;
              return ListRow(
                inset: true,
                title: m.label(context.l10n),
                leading: Icon(m.icon),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (badgeCount > 0) ...[
                      Badge(
                        label: Text(badgeCount > 99 ? '99+' : '$badgeCount'),
                      ),
                      const SizedBox(width: Space.sm),
                    ],
                    const Icon(Icons.chevron_right),
                  ],
                ),
                onTap: () => openAppRoute(context, m.route),
              );
            },
          ),
      ],
    );
  }
}

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
