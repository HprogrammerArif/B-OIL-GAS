import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/mock/bootstrap.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Hidden presenter menu (long-press the logo or tap the version 7 times).
Future<void> showDemoMenu(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const _DemoMenu(),
  );
}

class _DemoMenu extends ConsumerWidget {
  const _DemoMenu();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final config = ref.watch(mockConfigControllerProvider);
    final controller = ref.read(mockConfigControllerProvider.notifier);
    final currentCode = ref
        .watch(sessionControllerProvider)
        .value
        ?.profile
        .employee
        .empCode;

    final failureLabels = {
      MockFailureMode.none: l10n.demoFailureNone,
      MockFailureMode.timeout: l10n.demoFailureTimeout,
      MockFailureMode.serverError: l10n.demoFailureServer,
      MockFailureMode.conflict: l10n.demoFailureConflict,
    };

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.8,
      maxChildSize: 0.95,
      builder: (context, scroll) => ListView(
        controller: scroll,
        padding: const EdgeInsets.only(bottom: Space.xxxl),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Text(
              l10n.demoTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          SectionHeader(title: l10n.demoSwitchPersona),
          for (final p in personas)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.lg,
                vertical: Space.xs,
              ),
              child: ListRow(
                title: bangla ? p.roleLabelBn : p.roleLabel,
                subtitle: p.code,
                leading: Avatar(name: p.roleLabel),
                trailing: p.code == currentCode
                    ? const Icon(Icons.check_circle, color: Colors.green)
                    : null,
                onTap: () async {
                  final nav = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  final text = l10n.demoPersonaSwitched(
                    bangla ? p.roleLabelBn : p.roleLabel,
                  );
                  await ref
                      .read(sessionControllerProvider.notifier)
                      .switchPersona(p.code);
                  nav.pop();
                  messenger.showSnackBar(SnackBar(content: Text(text)));
                },
              ),
            ),
          SectionHeader(title: l10n.demoSimulate),
          SwitchListTile(
            title: Text(l10n.demoOffline),
            value: config.offline,
            onChanged: (v) => controller.setOffline(value: v),
          ),
          SwitchListTile(
            title: Text(l10n.demoSlowNetwork),
            value: config.maxLatencyMs > 1000,
            onChanged: (v) => controller.setSlow(value: v),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.sm,
            ),
            child: Text(
              l10n.demoFailureMode,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Wrap(
              spacing: Space.sm,
              children: [
                for (final mode in MockFailureMode.values)
                  ChoiceChip(
                    label: Text(failureLabels[mode]!),
                    selected: config.failure == mode,
                    onSelected: (_) => controller.setFailure(mode),
                  ),
              ],
            ),
          ),
          SectionHeader(title: l10n.demoData),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: ListRow(
              title: l10n.demoResetData,
              leading: const Icon(Icons.restart_alt),
              onTap: () async {
                final nav = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                final done = l10n.demoResetDone;
                final ok = await showConfirmSheet(
                  context,
                  title: l10n.demoResetConfirmTitle,
                  message: l10n.demoResetConfirmMessage,
                  confirmLabel: l10n.demoResetData,
                  destructive: true,
                );
                if (!ok) return;
                await ref.read(mockStoreProvider).reset();
                await ref.read(sessionControllerProvider.notifier).logout();
                nav.pop();
                messenger.showSnackBar(SnackBar(content: Text(done)));
              },
            ),
          ),
        ],
      ),
    );
  }
}
