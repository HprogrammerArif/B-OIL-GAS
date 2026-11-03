import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/sync_state.dart';
import 'package:bogcl_oneops/features/notifications/presentation/inbox_controller.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Signed-in shell: offline banner + bottom navigation. Tabs are added as the
/// modules behind them ship (no dead entries).
class ShellScaffold extends ConsumerWidget {
  const ShellScaffold({required this.shell, super.key});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final offline = ref.watch(isOfflineProvider);
    final unread = ref.watch(unreadSummaryControllerProvider).value?.total ?? 0;
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
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (i) =>
            shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: l10n.navHome,
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text(unread > 99 ? '99+' : '$unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: unread > 0,
              label: Text(unread > 99 ? '99+' : '$unread'),
              child: const Icon(Icons.notifications),
            ),
            label: l10n.navInbox,
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu),
            selectedIcon: const Icon(Icons.menu_open),
            label: l10n.navMore,
          ),
        ],
      ),
    );
  }
}
