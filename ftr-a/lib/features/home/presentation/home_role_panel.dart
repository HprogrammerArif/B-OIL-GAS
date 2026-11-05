import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/attendance/presentation/attendance_providers.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// The one job this role opens the web dashboard to do.
class HomeRolePanel extends ConsumerWidget {
  const HomeRolePanel({required this.dashboard, super.key});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return switch (dashboard.layout) {
      'CHAIRMAN' => const _Decisions(limit: 3, showLeaders: true),
      'HOD' => const _Decisions(limit: 5, showLeaders: false),
      'EMPLOYEE' => const _EmployeeWork(),
      'DRIVER' => _FromExtras(
        dashboard: dashboard,
        kinds: const ['driverTrip'],
      ),
      'PLANT_GM' => _PlantWork(dashboard: dashboard),
      'HR_ADMIN' => _FromExtras(
        dashboard: dashboard,
        kinds: const ['exits', 'sites'],
      ),
      'TRANSPORT_ADMIN' => _FromExtras(
        dashboard: dashboard,
        kinds: const ['transport'],
      ),
      _ => const SizedBox.shrink(),
    };
  }
}

class _Decisions extends ConsumerWidget {
  const _Decisions({required this.limit, required this.showLeaders});

  final int limit;
  final bool showLeaders;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final inbox = ref.watch(approvalInboxProvider);
    final rooms = showLeaders ? ref.watch(chatChannelsProvider) : null;
    final briefing = showLeaders
        ? ref
              .watch(dashboardMeProvider)
              .value
              ?.extras
              .where((e) => e.kind == 'briefing')
              .firstOrNull
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homeFilesWaiting),
        inbox.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
          data: (items) {
            final rows = items.take(limit).toList();
            if (rows.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: Space.lg),
                child: Text(
                  l10n.homeFilesClear,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              );
            }
            return GroupCard(
              margin: const EdgeInsets.symmetric(horizontal: Space.lg),
              children: [for (final item in rows) _FileRow(item: item)],
            );
          },
        ),
        if (briefing != null) _BriefingCard(extra: briefing),
        if (rooms != null)
          rooms.when(
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
            data: (list) {
              if (list.isEmpty) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SectionHeader(title: l10n.homeLeadersOnline),
                  GroupCard(
                    margin: const EdgeInsets.symmetric(horizontal: Space.lg),
                    children: [
                      for (final c in list.take(4))
                        ListRow(
                          inset: true,
                          title: c.heading(bangla: bangla),
                          subtitle: c.unreadCount > 0
                              ? l10n.homeUnread(c.unreadCount)
                              : l10n.homeRoomQuiet,
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => unawaited(
                            context.push(AppRoutes.chatThread(c.id)),
                          ),
                        ),
                    ],
                  ),
                ],
              );
            },
          ),
      ],
    );
  }
}

class _FileRow extends ConsumerWidget {
  const _FileRow({required this.item});

  final InboxItem item;

  Future<void> _act(BuildContext context, WidgetRef ref, String type) async {
    final l10n = context.l10n;
    final messenger = ScaffoldMessenger.of(context);
    String? comment;
    if (type == 'RETURN') {
      comment = await _reason(context, l10n.homeReturnReason);
      if (comment == null || comment.trim().isEmpty) return;
    }
    try {
      final repo = ref.read(approvalRepositoryProvider);
      if (type == 'RETURN') {
        await repo.returnForChanges(item.instanceId, comment: comment!.trim());
      } else {
        await repo.approve(item.instanceId);
      }
      ref
        ..invalidate(approvalInboxProvider)
        ..invalidate(dashboardMeProvider);
    } on ApiException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final title = bangla ? item.summary.titleBn : item.summary.title;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.md,
        Space.lg,
        Space.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          Text(
            '${item.initiator.display(bangla: bangla)} · ${item.stepName}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: Space.sm),
          Row(
            children: [
              TextButton(
                onPressed: item.requiresSignature
                    ? () => unawaited(
                        context.push(AppRoutes.approvalDetail(item.instanceId)),
                      )
                    : () => unawaited(_act(context, ref, 'APPROVE')),
                child: Text(l10n.approvalActApprove),
              ),
              TextButton(
                onPressed: () => unawaited(_act(context, ref, 'RETURN')),
                child: Text(l10n.approvalActReturn),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BriefingCard extends ConsumerStatefulWidget {
  const _BriefingCard({required this.extra});

  final DashExtra extra;

  @override
  ConsumerState<_BriefingCard> createState() => _BriefingCardState();
}

class _BriefingCardState extends ConsumerState<_BriefingCard> {
  Timer? _timer;
  int _left = 0;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _play() {
    final id = widget.extra.id;
    if (id == null) return;
    _timer?.cancel();
    setState(() => _left = 45);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_left <= 1) {
        t.cancel();
        setState(() => _left = 0);
        unawaited(ref.read(dashboardRepositoryProvider).listenBriefing(id));
      } else {
        setState(() => _left -= 1);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.extra.title(bangla: bangla),
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: Space.sm),
              Text(
                widget.extra.body(bangla: bangla) ?? '',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: Space.sm),
              TextButton.icon(
                onPressed: _left > 0 ? null : _play,
                icon: Icon(_left > 0 ? Icons.graphic_eq : Icons.play_arrow),
                label: Text(
                  _left > 0
                      ? l10n.homeBriefingLeft(_left)
                      : l10n.homePlayBriefing,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmployeeWork extends ConsumerWidget {
  const _EmployeeWork();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final today = ref.watch(todayAttendanceProvider);
    final leave = ref.watch(leaveBalancesProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homeToday),
        today.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
          data: (day) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Text(
              day.day.firstInAt == null
                  ? l10n.homeNotPunched
                  : l10n.homePunchedAt(DateFmt.time(day.day.firstInAt!, lang)),
            ),
          ),
        ),
        const SizedBox(height: Space.md),
        leave.when(
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
          data: (rows) => GroupCard(
            margin: const EdgeInsets.symmetric(horizontal: Space.lg),
            children: [
              for (final b in rows.take(3))
                ListRow(
                  inset: true,
                  title: b.type.displayName(bangla: bangla),
                  subtitle: l10n.homeLeaveLeft(b.available.toStringAsFixed(0)),
                  onTap: () => unawaited(context.push(AppRoutes.leave)),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
          child: PrimaryButton.secondary(
            label: l10n.homeGatePass,
            icon: Icons.badge_outlined,
            onPressed: () => unawaited(context.push(AppRoutes.visitNew)),
          ),
        ),
      ],
    );
  }
}

class _PlantWork extends ConsumerWidget {
  const _PlantWork({required this.dashboard});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final permits = dashboard.extras
        .where((e) => e.kind == 'permits')
        .firstOrNull;
    final locks = [
      for (final item in permits?.items ?? const <Map<String, Object?>>[])
        if (item['status'] == 'LOCKED') item,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: permits?.title(bangla: bangla) ?? l10n.homeLocks),
        if (locks.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Text(l10n.homeLocksClear),
          )
        else
          GroupCard(
            margin: const EdgeInsets.symmetric(horizontal: Space.lg),
            children: [
              for (final item in locks)
                ListRow(
                  inset: true,
                  title: bangla
                      ? '${item['nameBn'] ?? item['name'] ?? ''}'
                      : '${item['name'] ?? ''}',
                  subtitle: bangla
                      ? '${item['bodyBn'] ?? item['body'] ?? ''}'
                      : '${item['body'] ?? ''}',
                  trailing: TextButton(
                    onPressed: item['id'] == null
                        ? null
                        : () async {
                            await ref
                                .read(dashboardRepositoryProvider)
                                .restorePermit('${item['id']}');
                            ref.invalidate(dashboardMeProvider);
                          },
                    child: Text(l10n.homeReleaseBatch),
                  ),
                ),
            ],
          ),
      ],
    );
  }
}

class _FromExtras extends StatelessWidget {
  const _FromExtras({required this.dashboard, required this.kinds});

  final Dashboard dashboard;
  final List<String> kinds;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final blocks = [
      for (final e in dashboard.extras)
        if (kinds.contains(e.kind)) e,
    ];
    if (blocks.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final extra in blocks) ...[
          SectionHeader(title: extra.title(bangla: bangla)),
          if (extra.body(bangla: bangla) != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                0,
                Space.lg,
                Space.sm,
              ),
              child: Text(extra.body(bangla: bangla)!),
            ),
          if (extra.items.isNotEmpty)
            GroupCard(
              margin: const EdgeInsets.symmetric(horizontal: Space.lg),
              children: [
                for (final item in extra.items.take(5))
                  ListRow(
                    inset: true,
                    title: bangla
                        ? '${item['nameBn'] ?? item['name'] ?? extra.title(bangla: true)}'
                        : '${item['name'] ?? extra.title(bangla: false)}',
                    subtitle: bangla
                        ? '${item['bodyBn'] ?? item['body'] ?? item['status'] ?? ''}'
                        : '${item['body'] ?? item['status'] ?? ''}',
                    trailing: item['route'] == null
                        ? null
                        : const Icon(Icons.chevron_right),
                    onTap: item['route'] == null
                        ? null
                        : () => openAppRoute(context, '${item['route']}'),
                  ),
              ],
            ),
          if (extra.route != null && extra.items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.lg),
              child: Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: () => openAppRoute(context, extra.route!),
                  child: Text(context.l10n.homeOpen),
                ),
              ),
            ),
        ],
      ],
    );
  }
}

Future<String?> _reason(BuildContext context, String title) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: TextField(controller: controller, autofocus: true),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text(ctx.l10n.commonCancel),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, controller.text),
          child: Text(ctx.l10n.commonSave),
        ),
      ],
    ),
  );
}
