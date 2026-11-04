import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AssetDetailScreen extends ConsumerStatefulWidget {
  const AssetDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends ConsumerState<AssetDetailScreen> {
  bool _busy = false;

  AssetRepository get _repo => ref.read(assetRepositoryProvider);

  void _refresh() => ref
    ..invalidate(assetDetailProvider)
    ..invalidate(assetsProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'LOTO_ACTIVE' => l10n.asErrLoto,
      'LOTO_REQUIRED' => l10n.asErrLotoNeed,
      'CUSTODY_UNACKED' => l10n.asErrAck,
      'CHECKLIST_INCOMPLETE' => l10n.asErrList,
      'WRITE_OFF_NOT_APPROVED' => l10n.asErrWrite,
      'CALIBRATION_EXPIRED' => l10n.asErrCal,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.asErrFailed,
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
    final async = ref.watch(assetDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleAssets)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(assetDetailProvider(widget.id)),
        ),
        data: (e) {
          final m = e.me;
          final who = e.custody?.holder?.display(bangla: bangla);
          final d = e.disposal;
          return ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      e.title(bangla: bangla),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  StatusPill(
                    label: assetStageLabel(l10n, e.stage),
                    tone: assetStageTone(e.stage),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(l10n.asWhat),
              Text(
                [e.siteLabel(bangla: bangla), ?e.location, ?who].join(' · '),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: Space.sm),
              Text(
                l10n.asWhy(e.category?.display(bangla: bangla) ?? e.assetClass),
              ),
              const SizedBox(height: Space.sm),
              Text(assetNextLine(l10n, e, bangla: bangla)),
              const SizedBox(height: Space.md),
              Text(
                l10n.asLifeLine(
                  '${assetStageIndex(e.stage)}',
                  '${e.usefulLifeYears ?? 0}',
                ),
              ),
              const SizedBox(height: Space.sm),
              Text(
                l10n.asBook(
                  assetTaka(e.financials.nbv, bangla: bangla),
                  '${e.healthScore}',
                ),
              ),
              if (e.lotoActive) ...[
                const SizedBox(height: Space.sm),
                Text(l10n.asLotoOn(e.lotoPermitNo ?? '')),
              ],
              const SizedBox(height: Space.lg),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  if (m.canAck)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActAck,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(e.id, 'custody/ack'),
                                l10n.asDoneAck,
                              ),
                            ),
                    ),
                  if (m.canCommission)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActCommission,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActCommission,
                                fields: [('location', l10n.asFieldLocation, 1)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'commission', b),
                                l10n.asDoneCommission,
                              );
                            },
                    ),
                  if (m.canAssign)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActAssign,
                      onPressed: _busy
                          ? null
                          : () async {
                              final pick = await showPersonPicker(
                                context,
                                title: l10n.asFieldHolder,
                              );
                              if (pick == null) return;
                              await _run(
                                () => _repo.act(e.id, 'custody', {
                                  'employeeUserId': pick.person.userId,
                                }),
                                l10n.asDoneAssign,
                              );
                            },
                    ),
                  if (m.canFlag)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActFlag,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActFlag,
                                fields: [
                                  ('description', l10n.asFieldDefect, 3),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'flag-defect', b),
                                l10n.asDoneFlag,
                              );
                            },
                    ),
                  if (m.canLoto && !e.lotoActive)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActLotoOn,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActLotoOn,
                                fields: [('permitNo', l10n.asFieldPermit, 1)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'loto', {
                                  'action': 'APPLY',
                                  ...b,
                                }),
                                l10n.asDoneLotoOn,
                              );
                            },
                    ),
                  if (m.canLoto && e.lotoActive)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActLotoOff,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(e.id, 'loto', {
                                  'action': 'RELEASE',
                                }),
                                l10n.asDoneLotoOff,
                              ),
                            ),
                    ),
                  if (m.canTransfer)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActMove,
                      onPressed: _busy
                          ? null
                          : () async {
                              final site = await showModalBottomSheet<String>(
                                context: context,
                                showDragHandle: true,
                                builder: (ctx) => Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    ListTile(
                                      title: Text(l10n.asSiteHq),
                                      onTap: () =>
                                          Navigator.pop(ctx, 'site_hq'),
                                    ),
                                    ListTile(
                                      title: Text(l10n.asSitePlant),
                                      onTap: () =>
                                          Navigator.pop(ctx, 'site_plant'),
                                    ),
                                    ListTile(
                                      title: Text(l10n.asSiteCtg),
                                      onTap: () =>
                                          Navigator.pop(ctx, 'site_ctg'),
                                    ),
                                  ],
                                ),
                              );
                              if (site == null || !mounted) return;
                              final b = await _fields(
                                title: l10n.asActMove,
                                fields: [('reason', l10n.asFieldReason, 2)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'transfer', {
                                  ...b,
                                  'toSiteId': site,
                                }),
                                l10n.asDoneMove,
                              );
                            },
                    ),
                  if (m.canReceive && e.transferId != null)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActReceive,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () =>
                                    _repo.completeTransfer(e.id, e.transferId!),
                                l10n.asDoneReceive,
                              ),
                            ),
                    ),
                  if (m.canCertify)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActCertify,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActCertify,
                                fields: [
                                  ('certificateNo', l10n.asFieldCert, 1),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'certify', {
                                  'type': 'CAL',
                                  ...b,
                                }),
                                l10n.asDoneCertify,
                              );
                            },
                    ),
                  if (m.canDecommission)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.asActRetire,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActRetire,
                                fields: [
                                  ('reason', l10n.asFieldReason, 1),
                                  ('surveyNotes', l10n.asFieldSurvey, 3),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(e.id, 'decommission', b),
                                l10n.asDoneRetire,
                              );
                            },
                    ),
                  if (m.canWriteOff)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActWriteOff,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(e.id, 'write-off'),
                                l10n.asDoneWriteOff,
                              ),
                            ),
                    ),
                  if (m.canDispose)
                    PrimaryButton(
                      expand: false,
                      label: l10n.asActDispose,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActDispose,
                                fields: [('proceeds', l10n.asFieldProceeds, 1)],
                              );
                              if (b == null) return;
                              final p = double.tryParse('${b['proceeds']}');
                              await _run(
                                () => _repo.act(e.id, 'dispose', {
                                  'method': 'SCRAP_RECYCLING',
                                  'proceeds': p ?? 0,
                                }),
                                l10n.asDoneDispose,
                              );
                            },
                    ),
                ],
              ),
              if (e.workOrders.isNotEmpty) ...[
                const SizedBox(height: Space.lg),
                Text(
                  l10n.asJobs,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                for (final w in e.workOrders) ...[
                  const SizedBox(height: Space.sm),
                  Text('${w.woNo} · ${w.title}'),
                  if (w.canStart)
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.woAct(w.id, 'start'),
                                l10n.asDoneStart,
                              ),
                            ),
                      child: Text(l10n.asActStart),
                    ),
                  if (w.canComplete)
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.asActFinish,
                                fields: [
                                  ('actualCost', l10n.asFieldCost, 1),
                                  ('certificateNo', l10n.asFieldCert, 1),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.woAct(w.id, 'complete', {
                                  'actualCost':
                                      double.tryParse('${b['actualCost']}') ??
                                      0,
                                  'certificateNo': b['certificateNo'],
                                }),
                                l10n.asDoneFinish,
                              );
                            },
                      child: Text(l10n.asActFinish),
                    ),
                ],
              ],
              if (d != null) ...[
                const SizedBox(height: Space.lg),
                Text(
                  l10n.asRetireFile,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(d.reason),
                if (m.canChecklist) ...[
                  _tick(
                    l10n.asBoxSurvey,
                    d.technicalSurveySigned,
                    'technicalSurveySigned',
                    e,
                  ),
                  _tick(
                    l10n.asBoxClean,
                    d.decontaminationCertified,
                    'decontaminationCertified',
                    e,
                  ),
                  _tick(
                    l10n.asBoxSpares,
                    d.sparesHarvested,
                    'sparesHarvested',
                    e,
                  ),
                  _tick(l10n.asBoxFinance, d.financeVetted, 'financeVetted', e),
                ],
              ],
              const SizedBox(height: Space.xl),
              ExpansionTile(
                title: Text(l10n.asDetails),
                children: [
                  ListTile(
                    title: Text(l10n.asFieldBookFull),
                    subtitle: Text(
                      l10n.asBookFull(
                        assetTaka(e.financials.gross, bangla: bangla),
                        assetTaka(
                          e.financials.accumulatedDepreciation,
                          bangla: bangla,
                        ),
                        assetTaka(e.financials.nbv, bangla: bangla),
                        e.depreciationMethod ?? '',
                      ),
                    ),
                  ),
                  ListTile(
                    title: Text(l10n.asPassport),
                    subtitle: Text(
                      [
                        e.tag,
                        if (e.serialNo != null) e.serialNo,
                        if (e.oem != null) e.oem,
                      ].join(' · '),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _tick(String label, bool on, String key, Equipment e) {
    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      value: on,
      onChanged: on || _busy
          ? null
          : (_) => unawaited(
              _run(
                () => _repo.patchChecklist(e.id, {key: true}),
                context.l10n.asDoneTick,
              ),
            ),
    );
  }
}
