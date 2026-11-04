import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/workforce/data/workforce_repository.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PeopleDetailScreen extends ConsumerStatefulWidget {
  const PeopleDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<PeopleDetailScreen> createState() => _PeopleDetailScreenState();
}

class _PeopleDetailScreenState extends ConsumerState<PeopleDetailScreen> {
  bool _busy = false;

  WorkforceRepository get _repo => ref.read(workforceRepositoryProvider);

  void _refresh() => ref
    ..invalidate(staffDetailProvider)
    ..invalidate(staffListProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'PROTECTED_ROLE' => l10n.emErrProtected,
      'SELF_EXIT' => l10n.emErrSelf,
      'ASSETS_OUTSTANDING' => l10n.emErrAssets,
      'BUS_SEAT_ACTIVE' => l10n.emErrBus,
      'TRIPS_OPEN' => l10n.emErrTrips,
      'FINANCE_OPEN' => l10n.emErrFinance,
      'ITEMS_PENDING' => l10n.emErrPending,
      'EXIT_OPEN' => l10n.emErrOpen,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
    };
  }

  Future<void> _run(Future<void> Function() call, String done) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<Map<String, Object?>?> _fields({
    required String title,
    required List<(String key, String label, int lines)> fields,
  }) async {
    final cs = {for (final f in fields) f.$1: TextEditingController()};
    final body = await showModalBottomSheet<Map<String, Object?>>(
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
            Text(title, style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: Space.md),
            for (final f in fields) ...[
              AppTextField(label: f.$2, controller: cs[f.$1], maxLines: f.$3),
              const SizedBox(height: Space.sm),
            ],
            PrimaryButton(
              label: title,
              onPressed: () => Navigator.pop(ctx, {
                for (final e in cs.entries) e.key: e.value.text.trim(),
              }),
            ),
          ],
        ),
      ),
    );
    for (final c in cs.values) {
      c.dispose();
    }
    return body;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final async = ref.watch(staffDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleEmployees)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(staffDetailProvider(widget.id)),
        ),
        data: (e) {
          final m = e.me;
          final x = e.exit;
          return ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      e.heading(bangla: bangla),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  StatusPill(
                    label: staffStatusLabel(l10n, e.status),
                    tone: staffStatusTone(e.status),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(l10n.emWhat),
              Text(
                '${e.job(bangla: bangla)} · ${e.where(bangla: bangla)}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: Space.sm),
              Text(
                e.managerName == null
                    ? l10n.emWhoNone
                    : l10n.emWho(e.managerName!),
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.emWhy),
              const SizedBox(height: Space.sm),
              Text(e.next(bangla: bangla)),
              if (e.phone != null) ...[
                const SizedBox(height: Space.sm),
                Text(e.phone!),
              ],
              const SizedBox(height: Space.lg),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  if (m?.canOffboard == true)
                    PrimaryButton(
                      expand: false,
                      label: l10n.emActExit,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.emActExit,
                                fields: [
                                  ('lastWorkingDay', l10n.emFieldLastDay, 1),
                                  ('reason', l10n.emFieldExitReason, 3),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.offboard(e.id, b),
                                l10n.emDoneExit,
                              );
                            },
                    ),
                  if (m?.canReclaim == true && x != null)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.emActReclaim,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.reclaim(x.id),
                                l10n.emDoneReclaim,
                              ),
                            ),
                    ),
                  if (m?.canFinalize == true && x != null)
                    PrimaryButton(
                      expand: false,
                      label: l10n.emActClose,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.emActClose,
                                fields: [('voucherNo', l10n.emFieldVoucher, 1)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.finalize(x.id, b),
                                l10n.emDoneClose,
                              );
                            },
                    ),
                  if (m?.canCancel == true && x != null)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.emActCancel,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.emActCancel,
                                fields: [('reason', l10n.emFieldCancel, 3)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.cancel(x.id, b),
                                l10n.emDoneCancel,
                              );
                            },
                    ),
                  if (m?.canReactivate == true)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.emActRehire,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.reactivate(e.id, {}),
                                l10n.emDoneRehire,
                              ),
                            ),
                    ),
                ],
              ),
              if (x != null) ...[
                const SizedBox(height: Space.lg),
                Text(
                  l10n.emExitTitle,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(x.reason),
                if (x.lastWorkingDay.isNotEmpty)
                  Text(l10n.emLastDay(x.lastWorkingDay)),
                for (final i in x.items)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(i.heading(bangla: bangla)),
                    subtitle: Text(
                      [
                        itemStatusLabel(l10n, i.status),
                        if (i.clearedByName != null) i.clearedByName!,
                        if (i.note != null) i.note!,
                      ].join(' · '),
                    ),
                    trailing:
                        i.pending && (m?.clearableKeys.contains(i.key) ?? false)
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () async {
                                    final b = await _fields(
                                      title: i.heading(bangla: bangla),
                                      fields: [('note', l10n.emFieldNote, 2)],
                                    );
                                    if (b == null) return;
                                    await _run(
                                      () => _repo.clearItem(x.id, i.key, b),
                                      l10n.emDoneClear,
                                    );
                                  },
                            child: Text(l10n.emActClear),
                          )
                        : (i.pending && m?.canWaive == true
                              ? TextButton(
                                  onPressed: _busy
                                      ? null
                                      : () async {
                                          final b = await _fields(
                                            title: l10n.emActWaive,
                                            fields: [
                                              (
                                                'waiveReason',
                                                l10n.emFieldWaive,
                                                2,
                                              ),
                                            ],
                                          );
                                          if (b == null) return;
                                          await _run(
                                            () => _repo.clearItem(x.id, i.key, {
                                              ...b,
                                              'waive': true,
                                            }),
                                            l10n.emDoneWaive,
                                          );
                                        },
                                  child: Text(l10n.emActWaive),
                                )
                              : null),
                  ),
              ],
              const SizedBox(height: Space.lg),
              ExpansionTile(
                title: Text(l10n.emDetails),
                children: [
                  if (e.email != null)
                    ListTile(
                      title: Text(l10n.emFieldEmail),
                      subtitle: Text(e.email!),
                    ),
                  if (e.joinDate != null)
                    ListTile(
                      title: Text(l10n.emFieldJoined),
                      subtitle: Text(e.joinDate!),
                    ),
                  if (e.gradeName != null)
                    ListTile(
                      title: Text(l10n.emFieldGrade),
                      subtitle: Text(e.gradeName!),
                    ),
                  if (e.nationalId != null)
                    ListTile(
                      title: Text(l10n.emFieldNid),
                      subtitle: Text(e.nationalId!),
                    ),
                  if (e.emergencyContact != null)
                    ListTile(
                      title: Text(l10n.emFieldEmergency),
                      subtitle: Text(e.emergencyContact!),
                    ),
                  if (e.reports.isNotEmpty)
                    ListTile(
                      title: Text(l10n.emFieldReports),
                      subtitle: Text(e.reports.join(', ')),
                    ),
                  ListTile(
                    title: Text(l10n.emPassport),
                    subtitle: Text(e.empCode),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
