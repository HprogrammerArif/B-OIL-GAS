import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/sync_state.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Branches: 0 Home, 1 Attendance, 2 Approvals, 3 More.
class ShellScaffold extends ConsumerWidget {
  const ShellScaffold({required this.shell, super.key});

  final StatefulNavigationShell shell;

  static const _approvalsBranch = 2;
  static const _moreBranch = 3;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final offline = ref.watch(isOfflineProvider);
    final session = ref.watch(sessionControllerProvider).value;
    final showApprovals = session?.can('workflow:inbox') ?? false;
    final branch = shell.currentIndex;
    final selected = _barIndex(branch, showApprovals);

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
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
        ),
        child: NavigationBar(
          selectedIndex: selected,
          onDestinationSelected: (i) => shell.goBranch(
            _branchIndex(i, showApprovals),
            initialLocation: _branchIndex(i, showApprovals) == branch,
          ),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: l10n.navHome,
            ),
            NavigationDestination(
              icon: const Icon(Icons.fingerprint),
              selectedIcon: const Icon(Icons.fingerprint),
              label: l10n.navAttendance,
            ),
            if (showApprovals)
              NavigationDestination(
                icon: const Icon(Icons.fact_check_outlined),
                selectedIcon: const Icon(Icons.fact_check),
                label: l10n.navApprovals,
              ),
            NavigationDestination(
              icon: const Icon(Icons.menu),
              selectedIcon: const Icon(Icons.menu_open),
              label: l10n.navMore,
            ),
          ],
        ),
      ),
    );
  }

  static int _barIndex(int branch, bool showApprovals) {
    if (showApprovals) return branch;
    if (branch >= _moreBranch) return 2;
    if (branch == _approvalsBranch) return 0;
    return branch;
  }

  static int _branchIndex(int bar, bool showApprovals) {
    if (showApprovals) return bar;
    return bar >= 2 ? _moreBranch : bar;
  }
}
