import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Who is still inside during a roll-call.
class VisitMusterScreen extends ConsumerWidget {
  const VisitMusterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final async = ref.watch(visitMusterProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.visMuster)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(visitMusterProvider)),
        data: (m) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(visitMusterProvider);
            await ref.read(visitMusterProvider.future);
          },
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(Space.lg),
                child: Text(
                  m.active
                      ? l10n.visMusterActive(m.safe, m.inside)
                      : l10n.visMusterIdle(m.inside),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                child: m.active
                    ? PrimaryButton.danger(
                        label: l10n.visMusterEnd,
                        onPressed: () => unawaited(_act(context, ref, 'end')),
                      )
                    : PrimaryButton(
                        label: l10n.visMusterStart,
                        onPressed: () => unawaited(_act(context, ref, 'start')),
                      ),
              ),
              for (final v in m.visits)
                ListRow(
                  title: (v['name'] as String?) ?? '',
                  subtitle: v['visitNo'] as String?,
                  trailing: v['musterSafeAt'] == null
                      ? StatusPill(
                          label: l10n.visMusterMissing,
                          tone: StatusTone.danger,
                        )
                      : StatusPill(
                          label: l10n.visMusterSafe,
                          tone: StatusTone.success,
                        ),
                  onTap: () =>
                      context.push(AppRoutes.visitDetail(v['id']! as String)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _act(BuildContext context, WidgetRef ref, String verb) async {
    try {
      await ref.read(visitorRepositoryProvider).musterAct(verb);
      ref.invalidate(visitMusterProvider);
    } on ApiException {
      if (!context.mounted) return;
      AppToast.show(
        context,
        context.l10n.visErrFailed,
        tone: StatusTone.danger,
      );
    }
  }
}
