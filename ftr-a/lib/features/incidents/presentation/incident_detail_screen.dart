import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class IncidentDetailScreen extends ConsumerStatefulWidget {
  const IncidentDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<IncidentDetailScreen> createState() =>
      _IncidentDetailScreenState();
}

class _IncidentDetailScreenState extends ConsumerState<IncidentDetailScreen> {
  bool _busy = false;

  IncidentRepository get _repo => ref.read(incidentRepositoryProvider);

  void _refresh() => ref
    ..invalidate(incidentDetailProvider)
    ..invalidate(incidentsProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'RCA_REQUIRED' => l10n.inErrRca,
      'CAPA_OPEN' => l10n.inErrCapaOpen,
      'CAPA_SELF' => l10n.inErrCapaSelf,
      'NOT_STATUTORY' => l10n.inErrNotStat,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : l10n.inErrFailed,
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

  Future<void> _triage(SafetyIncident i) async {
    final l10n = context.l10n;
    final pick = await showPersonPicker(
      context,
      title: l10n.inFieldInvestigator,
    );
    if (pick == null || !mounted) return;
    await _run(
      () => _repo.act(i.id, 'triage', {
        'severity': i.severity,
        'likelihood': i.likelihood,
        'investigatorUserId': pick.person.userId,
      }),
      l10n.inDoneTriage,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final async = ref.watch(incidentDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleIncidents)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(incidentDetailProvider(widget.id)),
        ),
        data: (i) {
          final m = i.me;
          final who = i.reporter?.display(bangla: bangla) ?? l10n.inAnonymous;
          return ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      i.title,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  StatusPill(
                    label: incidentStageLabel(l10n, i.stage),
                    tone: incidentStageTone(i.stage),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text('${i.incidentNo} · ${incidentTypeLabel(l10n, i.type)}'),
              const SizedBox(height: Space.md),
              Text(l10n.inWhat),
              Text(
                i.description,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.inWho(who, DateFmt.dateTime(i.createdAt, lang))),
              const SizedBox(height: Space.sm),
              Text(incidentNextLine(l10n, i, bangla: bangla)),
              const SizedBox(height: Space.md),
              StatusPill(
                label: incidentRiskLabel(l10n, i.riskCategory),
                tone: incidentRiskTone(i.riskCategory),
              ),
              const SizedBox(height: Space.sm),
              Text(
                l10n.inMeta(
                  incidentWhen(i, lang),
                  i.siteLabel(bangla: bangla),
                  i.zone ?? '—',
                  '${i.riskScore}',
                ),
              ),
              if (i.investigator != null) ...[
                const SizedBox(height: Space.sm),
                Text(
                  l10n.inInvestigator(i.investigator!.display(bangla: bangla)),
                ),
              ],
              if (i.statutoryReportable) ...[
                const SizedBox(height: Space.sm),
                Text(
                  i.statutoryReceiptNo == null
                      ? l10n.inStatutoryDue(
                          i.statutoryBodyCode ?? '',
                          i.statutoryDueAt == null
                              ? ''
                              : DateFmt.dateTime(i.statutoryDueAt!, lang),
                        )
                      : l10n.inStatutoryDone(i.statutoryReceiptNo!),
                ),
              ],
              const SizedBox(height: Space.lg),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  if (m.canTriage)
                    PrimaryButton(
                      expand: false,
                      label: l10n.inActTriage,
                      onPressed: _busy ? null : () => unawaited(_triage(i)),
                    ),
                  if (m.canInvestigate)
                    PrimaryButton(
                      expand: false,
                      label: l10n.inActInvest,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(i.id, 'investigate'),
                                l10n.inDoneInvest,
                              ),
                            ),
                    ),
                  if (m.canRca)
                    PrimaryButton(
                      expand: false,
                      label: l10n.inActRca,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.inActRca,
                                fields: [
                                  ('why1', l10n.inFieldWhy1, 2),
                                  ('why2', l10n.inFieldWhy2, 2),
                                  ('why3', l10n.inFieldWhy3, 2),
                                  ('rootCause', l10n.inFieldRoot, 3),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.saveRca(i.id, b),
                                l10n.inDoneRca,
                              );
                            },
                    ),
                  if (m.canAddCapa)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.inActCapa,
                      onPressed: _busy
                          ? null
                          : () async {
                              final pick = await showPersonPicker(
                                context,
                                title: l10n.inFieldOwner,
                              );
                              if (pick == null || !mounted) return;
                              final b = await _fields(
                                title: l10n.inActCapa,
                                fields: [('description', l10n.inFieldCapa, 3)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(i.id, 'capas', {
                                  ...b,
                                  'type': 'CORRECTIVE',
                                  'ownerUserId': pick.person.userId,
                                }),
                                l10n.inDoneCapa,
                              );
                            },
                    ),
                  if (m.canStatutory)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.inActStatutory,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.inActStatutory,
                                fields: [('receiptNo', l10n.inFieldReceipt, 1)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(i.id, 'statutory', b),
                                l10n.inDoneStatutory,
                              );
                            },
                    ),
                  if (m.canCloseSafety)
                    PrimaryButton(
                      expand: false,
                      label: l10n.inActSignSafety,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(i.id, 'close', {
                                  'remarks': 'Safety checks complete.',
                                }),
                                l10n.inDoneSignSafety,
                              ),
                            ),
                    ),
                  if (m.canCloseManager)
                    PrimaryButton(
                      expand: false,
                      label: l10n.inActSignGm,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(i.id, 'close', {
                                  'remarks': 'Plant head agrees.',
                                }),
                                l10n.inDoneSignGm,
                              ),
                            ),
                    ),
                ],
              ),
              if (i.rca != null) ...[
                const SizedBox(height: Space.xl),
                Text(
                  l10n.inRca,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(i.rca!.rootCause),
              ],
              if (i.capas.isNotEmpty) ...[
                const SizedBox(height: Space.xl),
                Text(
                  l10n.inFixes,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                for (final c in i.capas)
                  ListRow(
                    title: c.description,
                    subtitle:
                        '${c.capaNo} · ${c.owner?.display(bangla: bangla) ?? ''} · ${c.status}',
                    trailing: c.me.canStart
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.capaAct(c.id, 'start'),
                                      l10n.inDoneStart,
                                    ),
                                  ),
                            child: Text(l10n.inActStart),
                          )
                        : c.me.canComplete
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () async {
                                    final b = await _fields(
                                      title: l10n.inActComplete,
                                      fields: [
                                        ('evidence', l10n.inFieldEvidence, 3),
                                      ],
                                    );
                                    if (b == null) return;
                                    await _run(
                                      () => _repo.capaAct(c.id, 'complete', b),
                                      l10n.inDoneComplete,
                                    );
                                  },
                            child: Text(l10n.inActComplete),
                          )
                        : c.me.canVerify
                        ? TextButton(
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.capaAct(c.id, 'verify'),
                                      l10n.inDoneVerify,
                                    ),
                                  ),
                            child: Text(l10n.inActVerify),
                          )
                        : null,
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}
