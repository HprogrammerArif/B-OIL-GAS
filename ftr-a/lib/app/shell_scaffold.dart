import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/sync_state.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Branches: 0 Home, 1 Attendance, 2 Approvals, 3 Chat, 4 More.
const shellHome = 0;
const shellAttendance = 1;
const shellApprovals = 2;
const shellChat = 3;
const shellMore = 4;

/// Opens a root tab via the shell, or pushes a module route.
void openAppRoute(BuildContext context, String route) {
  final shell = StatefulNavigationShell.maybeOf(context);
  final branch = switch (route) {
    AppRoutes.home => shellHome,
    AppRoutes.attendance => shellAttendance,
    AppRoutes.approvals => shellApprovals,
    AppRoutes.chat => shellChat,
    AppRoutes.more => shellMore,
    _ => null,
  };
  if (shell != null && branch != null) {
    shell.goBranch(branch, initialLocation: true);
    return;
  }
  if (route == AppRoutes.home ||
      route.startsWith('${AppRoutes.attendance}/') ||
      route.startsWith('${AppRoutes.approvals}/') ||
      route.startsWith('${AppRoutes.chat}/') ||
      route.startsWith('${AppRoutes.more}/')) {
    context.go(route);
    return;
  }
  unawaited(context.push(route));
}

class ShellScaffold extends ConsumerWidget {
  const ShellScaffold({required this.shell, super.key});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final offline = ref.watch(isOfflineProvider);
    final session = ref.watch(sessionControllerProvider).value;
    final showApprovals = session?.can('workflow:inbox') ?? false;
    final showChat = session?.showChatTab ?? false;
    final pendingApprovals = showApprovals
        ? (ref.watch(approvalSummaryProvider).value?.pending ?? 0)
        : 0;

    final visible = [
      shellHome,
      shellAttendance,
      if (showApprovals) shellApprovals,
      if (showChat) shellChat,
      shellMore,
    ];
    final branch = shell.currentIndex;
    var selected = visible.indexOf(branch);
    if (selected < 0) selected = 0;

    final items = <_TabSpec>[
      _TabSpec(shellHome, l10n.navHome, Icons.home_outlined, Icons.home),
      _TabSpec(
        shellAttendance,
        l10n.navAttendance,
        Icons.fingerprint,
        Icons.fingerprint,
      ),
      if (showApprovals)
        _TabSpec(
          shellApprovals,
          l10n.navApprovals,
          Icons.fact_check_outlined,
          Icons.fact_check,
          badgeCount: pendingApprovals,
        ),
      if (showChat)
        _TabSpec(shellChat, l10n.navChat, Icons.forum_outlined, Icons.forum),
      _TabSpec(shellMore, l10n.navMore, Icons.menu, Icons.menu_open),
    ];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (offline) const OfflineBanner(),
            Expanded(child: shell),
          ],
        ),
      ),
      bottomNavigationBar: _TabBar(
        items: items,
        selected: selected,
        onSelected: (i) => shell.goBranch(visible[i], initialLocation: true),
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec(
    this.branch,
    this.label,
    this.icon,
    this.selectedIcon, {
    this.badgeCount = 0,
  });

  final int branch;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final int badgeCount;
}

class _TabBar extends StatelessWidget {
  const _TabBar({
    required this.items,
    required this.selected,
    required this.onSelected,
  });

  final List<_TabSpec> items;
  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.outlineVariant)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _TabButton(
                    spec: items[i],
                    selected: i == selected,
                    onTap: () => onSelected(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.spec,
    required this.selected,
    required this.onTap,
  });

  final _TabSpec spec;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = selected ? scheme.primary : scheme.onSurfaceVariant;
    return Semantics(
      button: true,
      selected: selected,
      label: spec.label,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 2,
            vertical: Space.xs,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: selected
                      ? scheme.primary.withValues(alpha: 0.12)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(Corner.lg),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Space.md,
                    vertical: Space.xs,
                  ),
                  child: Badge(
                    isLabelVisible: spec.badgeCount > 0,
                    label: Text(
                      spec.badgeCount > 99 ? '99+' : '${spec.badgeCount}',
                    ),
                    child: Icon(
                      selected ? spec.selectedIcon : spec.icon,
                      size: 22,
                      color: color,
                    ),
                  ),
                ),
              ),
              Text(
                spec.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
