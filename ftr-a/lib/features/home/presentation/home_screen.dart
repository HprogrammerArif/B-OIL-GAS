import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/modules.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/features/files/presentation/profile_avatar.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Role landing: who I am, what needs me, one next action.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 20), (_) {
      ref.invalidate(dashboardMeProvider);
    });
  }

  @override
  void dispose() {
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
      data: (s) => s == null ? const SizedBox.shrink() : _HomeBody(session: s),
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
    HomeVariant.employee => const ['leave', 'claims', 'visitors'],
    HomeVariant.driver => const ['fleet', 'claims', 'parcels'],
    HomeVariant.operations =>
      session.hasRole('MAILROOM')
          ? const ['parcels', 'visitors', 'chat']
          : session.hasRole('TRANSPORT_ADMIN')
          ? const ['fleet', 'bus', 'visitors']
          : const ['visitors', 'parcels', 'incidents'],
    HomeVariant.approver => const ['notices', 'leave', 'note-sheets'],
    HomeVariant.executive => const ['notices', 'note-sheets', 'people'],
  };
  return [
    for (final key in keys)
      if (session.navigation.contains(key))
        for (final m in builtModules)
          if (m.key == key) m,
  ];
}

class _HomeBody extends ConsumerWidget {
  const _HomeBody({required this.session});

  final Session session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final emp = session.profile.employee;
    final executive = session.homeVariant == HomeVariant.executive;
    final dash = ref.watch(dashboardMeProvider);
    final shortcuts = _shortcuts(session);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.navHome),
        actions: const [AppBarActions()],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardMeProvider);
          await ref.read(dashboardMeProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: Space.xxxl),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                Space.md,
                Space.lg,
                Space.sm,
              ),
              child: Row(
                children: [
                  ProfileAvatar(
                    name: emp.fullName,
                    photoFileId: emp.photoFileId,
                    size: 52,
                  ),
                  const SizedBox(width: Space.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _greeting(l10n, emp.shortDisplayName(bangla: bangla)),
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: executive
                                ? context.bogcl.executiveGold
                                : null,
                          ),
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
            ),
            dash.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(horizontal: Space.lg),
                child: SkeletonList(itemCount: 3),
              ),
              error: (_, _) => ErrorState(
                onRetry: () => ref.invalidate(dashboardMeProvider),
              ),
              data: (d) => _DashboardBlock(dashboard: d, session: session),
            ),
            if (shortcuts.isNotEmpty) ...[
              SectionHeader(title: l10n.homeQuickActions),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                child: Row(
                  children: [
                    for (var i = 0; i < shortcuts.length; i++) ...[
                      if (i > 0) const SizedBox(width: Space.md),
                      Expanded(child: _ShortcutTile(module: shortcuts[i])),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DashboardBlock extends ConsumerWidget {
  const _DashboardBlock({required this.dashboard, required this.session});

  final Dashboard dashboard;
  final Session session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final d = dashboard;
    final needs = d.needs.take(3).toList();
    final moreNeeds = d.needs.length > 3;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (d.broadcast != null) _Banner(broadcast: d.broadcast!),
        _RoleCard(dashboard: d, session: session),
        SectionHeader(title: l10n.dbNeedsTitle),
        if (needs.isNotEmpty)
          GroupCard(
            margin: const EdgeInsets.symmetric(horizontal: Space.lg),
            children: [
              for (final n in needs)
                ListRow(
                  inset: true,
                  title: n.text(bangla: bangla),
                  trailing: n.route == '/home'
                      ? null
                      : const Icon(Icons.chevron_right),
                  onTap: n.route == '/home'
                      ? null
                      : () => unawaited(context.push(n.route)),
                ),
            ],
          ),
        if (moreNeeds)
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: () => session.can('workflow:inbox')
                  ? context.go(AppRoutes.approvals)
                  : context.go(AppRoutes.more),
              child: Text(l10n.homeSeeAll),
            ),
          ),
      ],
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.dashboard, required this.session});

  final Dashboard dashboard;
  final Session session;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final variant = session.homeVariant;
    final kpis = dashboard.kpis.take(2).toList();
    final (title, action, route) = switch (variant) {
      HomeVariant.employee => (
        l10n.homePrimaryEmployee,
        l10n.homeActPunch,
        AppRoutes.attendance,
      ),
      HomeVariant.driver => (
        l10n.homePrimaryDriver,
        l10n.homeActTrip,
        AppRoutes.fleet,
      ),
      HomeVariant.operations =>
        session.hasRole('MAILROOM')
            ? (
                l10n.homePrimaryMail,
                l10n.homeActScanParcel,
                AppRoutes.parcelNew,
              )
            : session.hasRole('HSE_OFFICER')
            ? (l10n.homePrimaryHse, l10n.homeActIncidents, AppRoutes.incidents)
            : session.hasRole('TRANSPORT_ADMIN')
            ? (l10n.homePrimaryDriver, l10n.homeActTrip, AppRoutes.fleet)
            : (l10n.homePrimaryGate, l10n.homeActScanGuest, AppRoutes.visitNew),
      HomeVariant.approver => (
        l10n.homePrimaryApprover,
        l10n.homeActApprovals,
        AppRoutes.approvals,
      ),
      HomeVariant.executive => (
        l10n.homePrimaryApprover,
        dashboard.canBroadcast ? l10n.homeActAnnounce : l10n.homeActApprovals,
        dashboard.canBroadcast ? AppRoutes.noticeNew : AppRoutes.approvals,
      ),
    };

    return Card(
      margin: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      child: Padding(
        padding: const EdgeInsets.all(Space.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleMedium),
            if (kpis.isNotEmpty) ...[
              const SizedBox(height: Space.md),
              for (final k in kpis)
                Padding(
                  padding: const EdgeInsets.only(bottom: Space.xs),
                  child: Text(
                    '${k.label(bangla: bangla)} · ${k.display()}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
            ],
            const SizedBox(height: Space.md),
            PrimaryButton(label: action, onPressed: () => context.go(route)),
          ],
        ),
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
    return Card(
      margin: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      color: theme.colorScheme.tertiaryContainer,
      child: ListTile(
        leading: const Icon(Icons.campaign_outlined),
        title: Text(broadcast.title(bangla: bangla)),
        subtitle: Text(broadcast.body(bangla: bangla)),
        trailing: IconButton(
          tooltip: context.l10n.commonClose,
          onPressed: () async {
            await ref
                .read(dashboardRepositoryProvider)
                .dismissBroadcast(broadcast.id);
            ref.invalidate(dashboardMeProvider);
          },
          icon: const Icon(Icons.close),
        ),
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
    final label = module.label(context.l10n);
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.lg),
        onTap: () => unawaited(context.push(module.route)),
        child: Ink(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(Corner.lg),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.85),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.sm,
              vertical: Space.md,
            ),
            child: Column(
              children: [
                Icon(module.icon, color: theme.colorScheme.primary),
                const SizedBox(height: Space.xs),
                Text(
                  label,
                  style: theme.textTheme.labelMedium,
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
}
