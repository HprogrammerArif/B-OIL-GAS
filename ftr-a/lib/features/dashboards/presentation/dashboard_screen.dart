import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
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
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final async = ref.watch(dashboardMeProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleDashboards)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(dashboardMeProvider)),
        data: (d) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardMeProvider);
            await ref.read(dashboardMeProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Text(l10n.dbWhat),
              const SizedBox(height: Space.xs),
              Text(l10n.dbWhy),
              const SizedBox(height: Space.md),
              Text(
                l10n.dbNeedsTitle,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              for (final n in d.needs)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(n.text(bangla: bangla)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    if (n.route != '/home') unawaited(context.push(n.route));
                  },
                ),
              const SizedBox(height: Space.md),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  for (final k in d.kpis)
                    SizedBox(
                      width: 156,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(Space.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                k.display(),
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall,
                              ),
                              Text(k.label(bangla: bangla)),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              for (final x in d.extras) ...[
                const SizedBox(height: Space.lg),
                Text(
                  x.title(bangla: bangla),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (x.body(bangla: bangla) != null)
                  Text(x.body(bangla: bangla)!),
                for (final p in x.leaders)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      bangla ? '${p['nameBn'] ?? p['name']}' : '${p['name']}',
                    ),
                    subtitle: Text('${p['title']} · ${p['status']}'),
                  ),
                for (final it in x.items)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${it['name'] ?? it['title'] ?? ''}'),
                    subtitle: Text(
                      '${it['body'] ?? it['lastWorkingDay'] ?? it['left'] ?? ''}',
                    ),
                    onTap: it['route'] is String
                        ? () => unawaited(context.push(it['route']! as String))
                        : null,
                  ),
                if (x.kind == 'roi' && x.roi.isNotEmpty)
                  Text(
                    l10n.dbRoiLine(
                      '${x.roi['fleetSavings']}',
                      '${x.roi['vendorSavings']}',
                    ),
                  ),
              ],
              if (d.canBrief) ...[
                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: l10n.dbActBrief,
                  onPressed: () => unawaited(_brief()),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _brief() async {
    final l10n = context.l10n;
    final title = TextEditingController();
    final body = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
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
          children: [
            Text(l10n.dbActBrief, style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: Space.md),
            AppTextField(label: l10n.dbFieldTitle, controller: title),
            const SizedBox(height: Space.sm),
            AppTextField(
              label: l10n.dbFieldBody,
              controller: body,
              maxLines: 4,
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.dbActBrief,
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );
    final t = title.text.trim();
    final b = body.text.trim();
    title.dispose();
    body.dispose();
    if (ok != true) return;
    try {
      await ref.read(dashboardRepositoryProvider).publishBriefing({
        'title': t,
        'transcript': b,
      });
      ref.invalidate(dashboardMeProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.dbDoneBrief, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
        tone: StatusTone.danger,
      );
    }
  }
}
