import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class FleetSosScreen extends ConsumerStatefulWidget {
  const FleetSosScreen({super.key});

  @override
  ConsumerState<FleetSosScreen> createState() => _FleetSosScreenState();
}

class _FleetSosScreenState extends ConsumerState<FleetSosScreen> {
  bool _busy = false;

  Future<void> _ack(String id) async {
    setState(() => _busy = true);
    try {
      await ref.read(fleetRepositoryProvider).ackSos(id);
      ref.invalidate(fleetSosProvider);
      if (!mounted) return;
      AppToast.show(context, context.l10n.flDoneAck, tone: StatusTone.success);
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, context.l10n.flErrFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _send() async {
    final l10n = context.l10n;
    final c = TextEditingController();
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.flActSos, style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: Space.xs),
            Text(l10n.flSosHelp),
            const SizedBox(height: Space.md),
            AppTextField(label: l10n.flFieldSos, controller: c, maxLines: 3),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.flActSos,
              onPressed: () => Navigator.pop(ctx, c.text.trim()),
            ),
          ],
        ),
      ),
    );
    c.dispose();
    if (note == null || note.length < 3) return;
    setState(() => _busy = true);
    try {
      await ref.read(fleetRepositoryProvider).sendSos({'note': note});
      ref.invalidate(fleetSosProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.flDoneSos, tone: StatusTone.success);
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.flErrFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canSend =
        session?.can('fleet:drive') == true ||
        session?.can('fleet:dispatch') == true;
    final canAck =
        session?.can('fleet:dispatch') == true ||
        session?.can('fleet:gate') == true;
    final rows = ref.watch(fleetSosProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.flSos)),
      floatingActionButton: canSend
          ? FloatingActionButton.extended(
              onPressed: _busy ? null : () => unawaited(_send()),
              icon: const Icon(Icons.sos_outlined),
              label: Text(l10n.flActSos),
            )
          : null,
      body: rows.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(fleetSosProvider)),
        data: (list) {
          if (list.isEmpty) return EmptyState(message: l10n.flSosEmpty);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(fleetSosProvider);
              await ref.read(fleetSosProvider.future);
            },
            child: ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    Space.md,
                    Space.lg,
                    Space.xs,
                  ),
                  child: Text(l10n.flSosIntro),
                ),
                for (final s in list)
                  ListRow(
                    leading: Icon(
                      s.status == 'OPEN'
                          ? Icons.warning_amber_outlined
                          : Icons.check_circle_outline,
                    ),
                    title: s.note,
                    subtitle: DateFmt.dateTime(
                      s.createdAt,
                      bangla ? 'bn' : 'en',
                    ),
                    trailing: s.status == 'OPEN' && canAck
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () => unawaited(_ack(s.id)),
                            child: Text(l10n.flActAck),
                          )
                        : StatusPill(
                            label: s.status == 'OPEN'
                                ? l10n.flSosOpen
                                : l10n.flSosAcked,
                            tone: s.status == 'OPEN'
                                ? StatusTone.danger
                                : StatusTone.success,
                          ),
                    onTap: s.requisitionId == null
                        ? null
                        : () => unawaited(
                            context.push(
                              AppRoutes.fleetDetail(s.requisitionId!),
                            ),
                          ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
