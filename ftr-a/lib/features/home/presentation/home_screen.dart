import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/modules.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/features/home/presentation/home_role_panel.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Role landing: operational context strip, role cockpit, and 6-tile module launcher.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  Timer? _poll;
  bool _isForeground = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _poll = Timer.periodic(const Duration(seconds: 20), (_) {
      if (_isForeground && mounted) {
        ref.invalidate(dashboardMeProvider);
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _isForeground = state == AppLifecycleState.resumed;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    return session.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(sessionControllerProvider)),
      data: (s) =>
          s == null ? const SizedBox.shrink() : _HomeScaffold(session: s),
    );
  }
}

String _greeting(AppL10n l10n, String name) {
  final hour = Dhaka.now().hour;
  if (hour < 12) return l10n.homeGoodMorning(name);
  if (hour < 17) return l10n.homeGoodAfternoon(name);
  return l10n.homeGoodEvening(name);
}

List<AppModule> _shortcuts(Session session) {
  final keys = switch (session.homeVariant) {
    HomeVariant.employee => const [
      'leave',
      'claims',
      'fleet',
      'bus',
      'parcels',
      'visitors',
    ],
    HomeVariant.driver => const [
      'fleet',
      'parcels',
      'claims',
      'incidents',
      'notices',
      'attendance',
    ],
    HomeVariant.operations =>
      session.hasRole('MAILROOM')
          ? const [
              'parcels',
              'visitors',
              'chat',
              'notices',
              'claims',
              'attendance',
            ]
          : session.hasRole('TRANSPORT_ADMIN')
          ? const ['fleet', 'bus', 'visitors', 'parcels', 'incidents', 'claims']
          : const [
              'incidents',
              'assets',
              'compliance',
              'visitors',
              'parcels',
              'note-sheets',
            ],
    HomeVariant.approver => const [
      'approvals',
      'note-sheets',
      'claims',
      'employees',
      'notices',
      'leave',
    ],
    HomeVariant.executive => const [
      'note-sheets',
      'approvals',
      'compliance',
      'incidents',
      'assets',
      'employees',
    ],
  };
  final result = <AppModule>[];
  for (final key in keys) {
    if (session.navigation.contains(key)) {
      for (final m in builtModules) {
        if (m.key == key) {
          result.add(m);
          break;
        }
      }
    }
    if (result.length >= 6) break;
  }
  return result;
}

/// Greeting stays still while the work list refreshes.
class _HomeBar extends ConsumerWidget implements PreferredSizeWidget {
  const _HomeBar();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final identity = ref.watch(
      sessionControllerProvider.select((async) {
        final session = async.value;
        final emp = session?.profile.employee;
        if (session == null || emp == null) return null;
        return (
          name: emp.shortDisplayName(bangla: bangla),
          title: emp.designationTitle(bangla: bangla),
        );
      }),
    );
    if (identity == null) return const SizedBox.shrink();
    return AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _greeting(l10n, identity.name),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            identity.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      actions: const [AppBarActions()],
    );
  }
}

class _HomeScaffold extends ConsumerWidget {
  const _HomeScaffold({required this.session});

  final Session session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final shortcuts = _shortcuts(session);
    return Scaffold(
      appBar: const _HomeBar(),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardMeProvider);
          await ref.read(dashboardMeProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: Space.xxxl),
          children: [
            _HomeWork(session: session),
            if (shortcuts.isNotEmpty) ...[
              SectionHeader(
                title: l10n.homeQuickActions,
                trailing: TextButton.icon(
                  onPressed: () {
                    Haptics.tap();
                    openAppRoute(context, AppRoutes.more);
                  },
                  icon: const Icon(Icons.apps_outlined, size: 16),
                  label: Text(bangla ? 'সকল মডিউল' : 'All Modules'),
                ),
              ),
              _BentoModuleGrid(shortcuts: shortcuts),
            ],
          ],
        ),
      ),
    );
  }
}

class _HomeWork extends ConsumerWidget {
  const _HomeWork({required this.session});

  final Session session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(dashboardMeProvider);
    return dash.when(
      skipLoadingOnReload: true,
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: Space.lg),
        child: SkeletonList(itemCount: 3),
      ),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(dashboardMeProvider)),
      data: (d) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (d.broadcast != null) _Banner(broadcast: d.broadcast!),
          HomeRolePanel(dashboard: d, session: session),
        ],
      ),
    );
  }
}

class _Banner extends ConsumerWidget {
  const _Banner({required this.broadcast});

  final DashBroadcast broadcast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      child: Material(
        color: theme.colorScheme.tertiaryContainer,
        borderRadius: BorderRadius.circular(Corner.md),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.sm,
            Space.xs,
            Space.sm,
          ),
          child: Row(
            children: [
              Icon(
                Icons.campaign_outlined,
                size: 20,
                color: theme.colorScheme.onTertiaryContainer,
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      broadcast.title(bangla: bangla),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall,
                    ),
                    Text(
                      broadcast.body(bangla: bangla),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: context.l10n.commonClose,
                onPressed: () async {
                  await ref
                      .read(dashboardRepositoryProvider)
                      .dismissBroadcast(broadcast.id);
                  ref.invalidate(dashboardMeProvider);
                },
                icon: const Icon(Icons.close),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BentoModuleGrid extends StatelessWidget {
  const _BentoModuleGrid({required this.shortcuts});

  final List<AppModule> shortcuts;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: shortcuts.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: Space.sm,
          crossAxisSpacing: Space.sm,
          childAspectRatio: 1.08,
        ),
        itemBuilder: (context, i) => _ShortcutTile(module: shortcuts[i]),
      ),
    );
  }
}

class _ShortcutTile extends StatelessWidget {
  const _ShortcutTile({required this.module});

  final AppModule module;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final label = module.label(context.l10n);
    final accent = _moduleAccent(module.key, scheme.primary);

    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: scheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Corner.lg),
          side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.6)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(Corner.lg),
          onTap: () {
            Haptics.tap();
            openAppRoute(context, module.route);
          },
          child: Padding(
            padding: const EdgeInsets.all(Space.sm),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(Corner.md),
                  ),
                  child: Icon(module.icon, color: accent, size: 22),
                ),
                const SizedBox(height: Space.xs),
                Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _moduleAccent(String key, Color fallback) => switch (key) {
    'note-sheets' || 'approvals' => BrandColors.crimson,
    'incidents' || 'compliance' => BrandColors.danger,
    'assets' || 'bus' => BrandColors.info,
    'claims' => const Color(0xFF7C3AED),
    'fleet' || 'parcels' => const Color(0xFFD97706),
    'leave' || 'visitors' || 'employees' => BrandColors.success,
    _ => fallback,
  };
}
