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
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// The one job this role opens the app to do, plus at most three other needs.
class HomeRolePanel extends StatelessWidget {
  const HomeRolePanel({
    required this.dashboard,
    required this.session,
    super.key,
  });

  final Dashboard dashboard;
  final Session session;

  @override
  Widget build(BuildContext context) {
    if (session.homeVariant == HomeVariant.operations &&
        dashboard.layout == 'EMPLOYEE') {
      return _OpsWork(dashboard: dashboard, session: session);
    }
    return switch (dashboard.layout) {
      'CHAIRMAN' => _Decisions(dashboard: dashboard, limit: 3, briefing: true),
      'HOD' => _Decisions(dashboard: dashboard, limit: 3, briefing: false),
      'EMPLOYEE' => _EmployeeWork(dashboard: dashboard),
      'DRIVER' => _TripWork(dashboard: dashboard),
      'PLANT_GM' => _PlantWork(dashboard: dashboard),
      'HR_ADMIN' => _QueueWork(
        dashboard: dashboard,
        kinds: const ['exits', 'sites'],
        cover: '/home/people',
      ),
      'TRANSPORT_ADMIN' => _QueueWork(
        dashboard: dashboard,
        kinds: const ['transport'],
        cover: '/home/fleet',
      ),
      _ => _NeedWork(dashboard: dashboard, covered: const {}),
    };
  }
}

const _fileCap = 3;

/// Theme text buttons are full-width. Inside a row that width is unbounded.
final ButtonStyle _rowButton = TextButton.styleFrom(
  minimumSize: const Size(kMinTouchTarget, kMinTouchTarget),
  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
  padding: const EdgeInsets.symmetric(horizontal: Space.md),
);

bool _covers(Set<String> routes, String needRoute) {
  if (needRoute == '/home') return true;
  for (final route in routes) {
    if (route == needRoute || route.startsWith('$needRoute/')) return true;
    if (needRoute == route || needRoute.startsWith('$route/')) return true;
  }
  return false;
}

List<DashNeed> _extraNeeds(Dashboard dashboard, Set<String> covered) {
  return [
    for (final need in dashboard.needs)
      if (!_covers(covered, need.route)) need,
  ].take(_fileCap).toList();
}

class _WorkList extends StatelessWidget {
  const _WorkList({
    required this.children,
    this.status,
    this.onStatus,
    this.onSeeAll,
  });

  final String? status;
  final List<Widget> children;
  final VoidCallback? onStatus;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (status != null) _StatusLine(text: status!, onTap: onStatus),
        if (children.isNotEmpty)
          GroupCard(
            margin: const EdgeInsets.symmetric(horizontal: Space.lg),
            children: children,
          ),
        if (onSeeAll != null)
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              style: _rowButton,
              onPressed: onSeeAll,
              child: Text(l10n.homeSeeAll),
            ),
          ),
      ],
    );
  }
}

class _StatusLine extends StatelessWidget {
  const _StatusLine({required this.text, this.onTap});

  final String text;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final line = Text(text, style: theme.textTheme.titleMedium);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.lg,
        Space.lg,
        Space.sm,
      ),
      child: onTap == null
          ? line
          : Semantics(
              button: true,
              label: text,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(Corner.md),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: Space.xs),
                  child: Row(
                    children: [
                      Expanded(child: line),
                      Icon(
                        Icons.chevron_right,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}

class _Decisions extends ConsumerWidget {
  const _Decisions({
    required this.dashboard,
    required this.limit,
    required this.briefing,
  });

  final Dashboard dashboard;
  final int limit;
  final bool briefing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final inbox = ref.watch(approvalInboxProvider);
    final brief = briefing
        ? dashboard.extras.where((e) => e.kind == 'briefing').firstOrNull
        : null;
    return inbox.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: Space.lg),
        child: SkeletonList(itemCount: 2),
      ),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(approvalInboxProvider)),
      data: (items) {
        final rows = items.take(limit).toList();
        return _WorkList(
          status: l10n.homeFilesCount(items.length),
          onSeeAll: items.length > limit
              ? () => openAppRoute(context, AppRoutes.approvals)
              : null,
          children: [
            for (final item in rows) _FileRow(item: item),
            if (brief != null) _BriefingRow(extra: brief),
            for (final need in _extraNeeds(dashboard, {
              AppRoutes.approvals,
              AppRoutes.approvalsLegacy,
            }))
              _NeedRow(need: need),
          ],
        );
      },
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
                style: _rowButton,
                onPressed: item.requiresSignature
                    ? () => unawaited(
                        context.push(AppRoutes.approvalDetail(item.instanceId)),
                      )
                    : () => unawaited(_act(context, ref, 'APPROVE')),
                child: Text(l10n.approvalActApprove),
              ),
              TextButton(
                style: _rowButton,
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

class _BriefingRow extends ConsumerStatefulWidget {
  const _BriefingRow({required this.extra});

  final DashExtra extra;

  @override
  ConsumerState<_BriefingRow> createState() => _BriefingRowState();
}

class _BriefingRowState extends ConsumerState<_BriefingRow> {
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
    return ListRow(
      inset: true,
      title: widget.extra.title(bangla: bangla),
      trailing: TextButton(
        style: _rowButton,
        onPressed: _left > 0 ? null : _play,
        child: Text(
          _left > 0 ? l10n.homeBriefingLeft(_left) : l10n.homePlayBriefing,
        ),
      ),
    );
  }
}

class _EmployeeWork extends ConsumerWidget {
  const _EmployeeWork({required this.dashboard});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final today = ref.watch(todayAttendanceProvider);
    final needs = [
      for (final need in _extraNeeds(dashboard, const {})) _NeedRow(need: need),
    ];
    if (today.isLoading && !today.hasValue) {
      if (needs.isEmpty) {
        return const Padding(
          padding: EdgeInsets.symmetric(horizontal: Space.lg),
          child: SkeletonList(itemCount: 1),
        );
      }
      return _WorkList(children: needs);
    }
    if (today.hasError && !today.hasValue) {
      if (needs.isEmpty) {
        return ErrorState(
          onRetry: () => ref.invalidate(todayAttendanceProvider),
        );
      }
      return _WorkList(children: needs);
    }
    final day = today.requireValue;
    final status = day.day.firstInAt == null
        ? l10n.homeNotPunched
        : l10n.homePunchedAt(DateFmt.time(day.day.firstInAt!, lang));
    return _WorkList(
      status: status,
      onStatus: () => openAppRoute(context, AppRoutes.attendance),
      children: needs,
    );
  }
}

class _TripWork extends StatelessWidget {
  const _TripWork({required this.dashboard});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final extra = dashboard.extras
        .where((e) => e.kind == 'driverTrip')
        .firstOrNull;
    final bangla = context.isBangla;
    final route = extra?.route ?? AppRoutes.fleet;
    final covered = {route, AppRoutes.fleet};
    final items = extra?.items ?? const <Map<String, Object?>>[];
    return _WorkList(
      status:
          extra?.body(bangla: bangla) ??
          extra?.title(bangla: bangla) ??
          context.l10n.homePrimaryDriver,
      children: [
        if (items.isEmpty)
          ListRow(
            inset: true,
            title: extra?.title(bangla: bangla) ?? context.l10n.homeActTrip,
            trailing: const Icon(Icons.chevron_right),
            onTap: () => openAppRoute(context, route),
          )
        else
          for (final item in items.take(_fileCap))
            _ItemRow(
              item: item,
              fallback: extra!.title(bangla: bangla),
            ),
        for (final need in _extraNeeds(dashboard, covered))
          _NeedRow(need: need),
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
    return _WorkList(
      status: l10n.homeLocksCount(locks.length),
      children: [
        for (final item in locks)
          ListRow(
            inset: true,
            title: _label(item, bangla: bangla, fallback: ''),
            subtitle: _detail(item, bangla: bangla),
            trailing: TextButton(
              style: _rowButton,
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
        const _BatchRow(),
        for (final need in _extraNeeds(dashboard, const {}))
          _NeedRow(need: need),
      ],
    );
  }
}

class _BatchRow extends StatefulWidget {
  const _BatchRow();

  @override
  State<_BatchRow> createState() => _BatchRowState();
}

class _BatchRowState extends State<_BatchRow> {
  bool _done = false;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return ListRow(
      inset: true,
      title: l10n.homeBatchTitle,
      subtitle: _done ? l10n.homeBatchDone : l10n.homeBatchBody,
      trailing: _done
          ? null
          : TextButton(
              style: _rowButton,
              onPressed: () => setState(() => _done = true),
              child: Text(l10n.homeReleaseBatch),
            ),
    );
  }
}

class _QueueWork extends StatelessWidget {
  const _QueueWork({
    required this.dashboard,
    required this.kinds,
    required this.cover,
  });

  final Dashboard dashboard;
  final List<String> kinds;
  final String cover;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final blocks = [
      for (final extra in dashboard.extras)
        if (kinds.contains(extra.kind)) extra,
    ];
    final summary = dashboard.needs
        .where((need) => _covers({cover}, need.route))
        .firstOrNull;
    final status =
        summary?.text(bangla: bangla) ??
        (blocks.isEmpty
            ? context.l10n.homeFilesClear
            : blocks.first.title(bangla: bangla));
    final covered = <String>{cover};
    if (summary != null) covered.add(summary.route);
    return _WorkList(
      status: status,
      children: [
        for (final extra in blocks)
          for (final item in extra.items.take(_fileCap))
            _ItemRow(
              item: item,
              fallback: extra.title(bangla: bangla),
            ),
        for (final need in _extraNeeds(dashboard, covered))
          _NeedRow(need: need),
      ],
    );
  }
}

class _OpsWork extends StatelessWidget {
  const _OpsWork({required this.dashboard, required this.session});

  final Dashboard dashboard;
  final Session session;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final (title, action, route) = session.hasRole('MAILROOM')
        ? (l10n.homePrimaryMail, l10n.homeActScanParcel, AppRoutes.parcelNew)
        : session.hasRole('HSE_OFFICER')
        ? (l10n.homePrimaryHse, l10n.homeActIncidents, AppRoutes.incidents)
        : (l10n.homePrimaryGate, l10n.homeActScanGuest, AppRoutes.visitNew);
    final pending = [
      for (final need in dashboard.needs)
        if (need.route != '/home') need,
    ];
    final covered = <String>{route, AppRoutes.attendance};
    if (pending.isNotEmpty) covered.add(pending.first.route);
    return _WorkList(
      status: pending.isEmpty ? title : pending.first.text(bangla: bangla),
      onStatus: () => openAppRoute(context, route),
      children: [
        ListRow(
          inset: true,
          title: action,
          trailing: const Icon(Icons.chevron_right),
          onTap: () => openAppRoute(context, route),
        ),
        for (final need in _extraNeeds(dashboard, covered))
          _NeedRow(need: need),
      ],
    );
  }
}

class _NeedWork extends StatelessWidget {
  const _NeedWork({required this.dashboard, required this.covered});

  final Dashboard dashboard;
  final Set<String> covered;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final first = dashboard.needs
        .where((need) => need.route != '/home')
        .firstOrNull;
    final used = {...covered};
    if (first != null) used.add(first.route);
    return _WorkList(
      status: first?.text(bangla: bangla) ?? context.l10n.homeFilesClear,
      children: [
        for (final need in _extraNeeds(dashboard, used)) _NeedRow(need: need),
      ],
    );
  }
}

class _NeedRow extends StatelessWidget {
  const _NeedRow({required this.need});

  final DashNeed need;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    return ListRow(
      inset: true,
      title: need.text(bangla: bangla),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => openAppRoute(context, need.route),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item, required this.fallback});

  final Map<String, Object?> item;
  final String fallback;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final route = item['route']?.toString();
    return ListRow(
      inset: true,
      title: _label(item, bangla: bangla, fallback: fallback),
      subtitle: _detail(item, bangla: bangla),
      trailing: route == null ? null : const Icon(Icons.chevron_right),
      onTap: route == null ? null : () => openAppRoute(context, route),
    );
  }
}

String _label(
  Map<String, Object?> item, {
  required bool bangla,
  required String fallback,
}) {
  final raw = bangla ? item['nameBn'] ?? item['name'] : item['name'];
  final text = raw?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String? _detail(Map<String, Object?> item, {required bool bangla}) {
  final raw = bangla
      ? item['bodyBn'] ?? item['body'] ?? item['status']
      : item['body'] ?? item['status'];
  final text = raw?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
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
          style: _rowButton,
          onPressed: () => Navigator.pop(ctx),
          child: Text(ctx.l10n.commonCancel),
        ),
        TextButton(
          style: _rowButton,
          onPressed: () => Navigator.pop(ctx, controller.text),
          child: Text(ctx.l10n.commonSave),
        ),
      ],
    ),
  );
}
