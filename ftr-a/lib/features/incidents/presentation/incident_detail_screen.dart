import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum _Tab { overview, rca, capa, gov }

List<_Tab> _tabsFor(SafetyIncident i) {
  final capaAct = i.capas.any(
    (c) => c.me.canStart || c.me.canComplete || c.me.canVerify,
  );
  return [
    _Tab.overview,
    if (i.stage != 'REPORTED' || i.rca != null || i.me.canRca) _Tab.rca,
    if (i.capas.isNotEmpty || i.me.canAddCapa || capaAct) _Tab.capa,
    if (i.statutoryReportable) _Tab.gov,
  ];
}

class IncidentDetailScreen extends ConsumerWidget {
  const IncidentDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(incidentDetailProvider(id));
    return async.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(context.l10n.moduleIncidents)),
        body: const SkeletonList(),
      ),
      error: (_, _) => Scaffold(
        appBar: AppBar(title: Text(context.l10n.moduleIncidents)),
        body: ErrorState(
          onRetry: () => ref.invalidate(incidentDetailProvider(id)),
        ),
      ),
      data: (i) => _Record(key: ValueKey(_tabsFor(i).length), incident: i),
    );
  }
}

class _Record extends ConsumerStatefulWidget {
  const _Record({required this.incident, super.key});

  final SafetyIncident incident;

  @override
  ConsumerState<_Record> createState() => _RecordState();
}

class _RecordState extends ConsumerState<_Record>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  late final List<_Tab> _kinds;
  bool _busy = false;

  SafetyIncident get i =>
      ref.watch(incidentDetailProvider(widget.incident.id)).value ??
      widget.incident;

  IncidentRepository get _repo => ref.read(incidentRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _kinds = _tabsFor(widget.incident);
    _tabs = TabController(length: _kinds.length, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

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

  Future<void> _triage() async {
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

  Future<void> _editRca() async {
    final l10n = context.l10n;
    final rca = i.rca;
    final why1 = TextEditingController(text: rca?.why1 ?? '');
    final why2 = TextEditingController(text: rca?.why2 ?? '');
    final why3 = TextEditingController(text: rca?.why3 ?? '');
    final why4 = TextEditingController(text: rca?.why4 ?? '');
    final why5 = TextEditingController(text: rca?.why5 ?? '');
    final root = TextEditingController(text: rca?.rootCause ?? '');
    final showExtra =
        (rca?.why4?.isNotEmpty ?? false) || (rca?.why5?.isNotEmpty ?? false);

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
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(l10n.inActRca, style: Theme.of(ctx).textTheme.titleMedium),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.inFieldWhy1,
                controller: why1,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.inFieldWhy2,
                controller: why2,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.inFieldWhy3,
                controller: why3,
                maxLines: 2,
              ),
              if (showExtra) ...[
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.inFieldWhy4,
                  controller: why4,
                  maxLines: 2,
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.inFieldWhy5,
                  controller: why5,
                  maxLines: 2,
                ),
              ],
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.inFieldRoot,
                controller: root,
                maxLines: 3,
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: l10n.inActRca,
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (ok == true) {
      await _run(
        () => _repo.saveRca(i.id, {
          'why1': why1.text.trim(),
          'why2': why2.text.trim(),
          'why3': why3.text.trim(),
          if (why4.text.trim().isNotEmpty) 'why4': why4.text.trim(),
          if (why5.text.trim().isNotEmpty) 'why5': why5.text.trim(),
          'rootCause': root.text.trim(),
        }),
        l10n.inDoneRca,
      );
    }
    why1.dispose();
    why2.dispose();
    why3.dispose();
    why4.dispose();
    why5.dispose();
    root.dispose();
  }

  Future<void> _addCapa() async {
    final l10n = context.l10n;
    final pick = await showPersonPicker(context, title: l10n.inFieldOwner);
    if (pick == null || !mounted) return;

    var type = 'CORRECTIVE';
    final desc = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  l10n.inActCapa,
                  style: Theme.of(ctx).textTheme.titleMedium,
                ),
                const SizedBox(height: Space.md),
                Wrap(
                  spacing: Space.sm,
                  runSpacing: Space.xs,
                  children: [
                    for (final t in const [
                      'IMMEDIATE_CONTAINMENT',
                      'CORRECTIVE',
                      'PREVENTIVE',
                    ])
                      ChoiceChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(capaTypeLabel(l10n, t)),
                        selected: type == t,
                        onSelected: (_) => setSheet(() => type = t),
                      ),
                  ],
                ),
                const SizedBox(height: Space.md),
                AppTextField(
                  label: l10n.inFieldCapa,
                  controller: desc,
                  maxLines: 3,
                ),
                const SizedBox(height: Space.sm),
                Text(pick.person.display(bangla: context.isBangla)),
                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: l10n.inActCapa,
                  onPressed: () => Navigator.pop(ctx, true),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (ok == true) {
      await _run(
        () => _repo.act(i.id, 'capas', {
          'type': type,
          'description': desc.text.trim(),
          'ownerUserId': pick.person.userId,
        }),
        l10n.inDoneCapa,
      );
    }
    desc.dispose();
  }

  Future<void> _fileStatutory() async {
    final l10n = context.l10n;
    final ack = TextEditingController();
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
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.inActStatutory,
              style: Theme.of(ctx).textTheme.titleMedium,
            ),
            const SizedBox(height: Space.md),
            AppTextField(label: l10n.inFieldReceipt, controller: ack),
            const SizedBox(height: Space.lg),
            PrimaryButton(
              label: l10n.inActStatutory,
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );
    if (ok == true && ack.text.trim().isNotEmpty) {
      await _run(
        () => _repo.act(i.id, 'statutory', {'receiptNo': ack.text.trim()}),
        l10n.inDoneStatutory,
      );
    }
    ack.dispose();
  }

  Widget? _bar(SafetyIncident i) {
    final l10n = context.l10n;
    final m = i.me;
    final actions = <(String, VoidCallback)>[
      if (m.canTriage) (l10n.inActTriage, () => unawaited(_triage())),
      if (m.canInvestigate)
        (
          l10n.inActInvest,
          () => unawaited(
            _run(() => _repo.act(i.id, 'investigate'), l10n.inDoneInvest),
          ),
        ),
      if (m.canReview)
        (
          l10n.inActReview,
          () => unawaited(
            _run(() => _repo.act(i.id, 'review'), l10n.inDoneReview),
          ),
        ),
      if (m.canCloseSafety)
        (
          l10n.inActSignSafety,
          () => unawaited(
            _run(() => _repo.act(i.id, 'close', {}), l10n.inDoneSignSafety),
          ),
        ),
      if (m.canCloseManager)
        (
          l10n.inActSignGm,
          () => unawaited(
            _run(() => _repo.act(i.id, 'close', {}), l10n.inDoneSignGm),
          ),
        ),
    ];
    if (actions.isEmpty) return null;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (idx, a) in actions.indexed)
              Padding(
                padding: EdgeInsets.only(top: idx == 0 ? 0 : Space.sm),
                child: idx == 0
                    ? PrimaryButton(
                        label: a.$1,
                        loading: _busy,
                        onPressed: a.$2,
                      )
                    : PrimaryButton.secondary(
                        label: a.$1,
                        onPressed: _busy ? null : a.$2,
                      ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final rec = i;
    String tabLabel(_Tab t) => switch (t) {
      _Tab.overview => l10n.inTabOverview,
      _Tab.rca => l10n.inTabRca,
      _Tab.capa => l10n.inTabFixes,
      _Tab.gov => l10n.inTabGov,
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(rec.title, overflow: TextOverflow.ellipsis),
        bottom: _kinds.length > 1
            ? TabBar(
                controller: _tabs,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: [for (final t in _kinds) Tab(text: tabLabel(t))],
              )
            : null,
      ),
      bottomNavigationBar: _bar(rec),
      body: TabBarView(
        controller: _tabs,
        children: [
          for (final t in _kinds)
            switch (t) {
              _Tab.overview => _Overview(
                incident: rec,
                lang: lang,
                bangla: bangla,
                onRefresh: () async {
                  _refresh();
                  await ref.read(incidentDetailProvider(rec.id).future);
                },
              ),
              _Tab.rca => _Rca(
                incident: rec,
                onEdit: rec.me.canRca || rec.stage == 'UNDER_INVESTIGATION'
                    ? () => unawaited(_editRca())
                    : null,
              ),
              _Tab.capa => _Fixes(
                incident: rec,
                lang: lang,
                bangla: bangla,
                busy: _busy,
                onAdd: rec.me.canAddCapa ? () => unawaited(_addCapa()) : null,
                onStart: (id) => unawaited(
                  _run(() => _repo.capaAct(id, 'start'), l10n.inDoneStart),
                ),
                onComplete: (c) => unawaited(_completeCapa(c, l10n)),
                onVerify: (id) => unawaited(
                  _run(() => _repo.capaAct(id, 'verify'), l10n.inDoneVerify),
                ),
              ),
              _Tab.gov => _Gov(
                incident: rec,
                lang: lang,
                onFile: rec.me.canStatutory && rec.statutoryReceiptNo == null
                    ? () => unawaited(_fileStatutory())
                    : null,
              ),
            },
        ],
      ),
    );
  }

  Future<void> _completeCapa(IncidentCapa c, AppL10n l10n) async {
    final evidence = TextEditingController();
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
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.inActComplete,
              style: Theme.of(ctx).textTheme.titleMedium,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.inFieldEvidence,
              controller: evidence,
              maxLines: 3,
            ),
            const SizedBox(height: Space.lg),
            PrimaryButton(
              label: l10n.inActComplete,
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );
    if (ok == true) {
      await _run(
        () =>
            _repo.capaAct(c.id, 'complete', {'evidence': evidence.text.trim()}),
        l10n.inDoneComplete,
      );
    }
    evidence.dispose();
  }
}

class _Overview extends ConsumerWidget {
  const _Overview({
    required this.incident,
    required this.lang,
    required this.bangla,
    required this.onRefresh,
  });

  final SafetyIncident incident;
  final String lang;
  final bool bangla;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final i = incident;
    final who = i.reporter?.display(bangla: bangla) ?? l10n.inAnonymous;
    final theme = Theme.of(context);
    final place = [
      incidentTypeLabel(l10n, i.type),
      incidentZoneLabel(l10n, i.zone),
      if (i.siteLabel(bangla: bangla).isNotEmpty) i.siteLabel(bangla: bangla),
    ].join(' · ');

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.only(bottom: Space.xxl),
        children: [
          Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(Space.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StatusPill(
                      label: incidentStageLabel(l10n, i.stage),
                      tone: incidentStageTone(i.stage),
                    ),
                    const SizedBox(height: Space.md),
                    Text(i.title, style: theme.textTheme.titleLarge),
                    const SizedBox(height: Space.xs),
                    Text(place),
                    Text(
                      l10n.inWhenBy(DateFmt.dateTime(i.occurredAt, lang), who),
                    ),
                    if (i.investigator != null)
                      Text(i.investigator!.display(bangla: bangla)),
                    const SizedBox(height: Space.md),
                    Text(i.description, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: Space.md),
                    EvidenceStrip(
                      fileIds: i.photoFileIds,
                      canAdd: i.me.isReporter || i.me.isInvestigator,
                      onAdded: (fileId) async {
                        await ref.read(incidentRepositoryProvider).act(
                          i.id,
                          'attachments',
                          {'fileId': fileId, 'kind': 'PHOTO'},
                        );
                        ref
                          ..invalidate(incidentDetailProvider)
                          ..invalidate(incidentsProvider);
                      },
                    ),
                    const SizedBox(height: Space.md),
                    StatusPill(
                      label: incidentRiskLabel(l10n, i.riskCategory),
                      tone: incidentRiskTone(i.riskCategory),
                    ),
                    const Divider(height: Space.xl),
                    Text(
                      incidentNextLine(l10n, i, bangla: bangla),
                      style: theme.textTheme.titleSmall,
                    ),
                  ],
                ),
              ),
            ),
          ),
          ExpansionTile(
            title: Text(l10n.nsDetails),
            childrenPadding: const EdgeInsets.all(Space.lg),
            children: [
              Text('${l10n.inDetNo}: ${i.incidentNo}'),
              if (i.statutoryReceiptNo != null)
                Text('${l10n.inFieldReceipt}: ${i.statutoryReceiptNo}'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Rca extends StatelessWidget {
  const _Rca({required this.incident, this.onEdit});

  final SafetyIncident incident;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final rca = incident.rca;
    if (rca == null || rca.rootCause.isEmpty) {
      return EmptyState(
        message: l10n.inEmptyRca,
        actionLabel: onEdit == null ? null : l10n.inActRca,
        onAction: onEdit,
      );
    }
    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxl),
      children: [
        if (onEdit != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: PrimaryButton.secondary(
                expand: false,
                label: l10n.inActRca,
                onPressed: onEdit,
              ),
            ),
          ),
        _Fact(l10n.inFieldWhy1, rca.why1),
        _Fact(l10n.inFieldWhy2, rca.why2),
        _Fact(l10n.inFieldWhy3, rca.why3),
        if (rca.why4 != null && rca.why4!.isNotEmpty)
          _Fact(l10n.inFieldWhy4, rca.why4!),
        if (rca.why5 != null && rca.why5!.isNotEmpty)
          _Fact(l10n.inFieldWhy5, rca.why5!),
        _Fact(l10n.inFieldRoot, rca.rootCause),
      ],
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Text(value, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _Fixes extends StatelessWidget {
  const _Fixes({
    required this.incident,
    required this.lang,
    required this.bangla,
    required this.busy,
    required this.onStart,
    required this.onComplete,
    required this.onVerify,
    this.onAdd,
  });

  final SafetyIncident incident;
  final String lang;
  final bool bangla;
  final bool busy;
  final VoidCallback? onAdd;
  final void Function(String id) onStart;
  final void Function(IncidentCapa c) onComplete;
  final void Function(String id) onVerify;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final capas = incident.capas;
    if (capas.isEmpty) {
      return EmptyState(
        message: l10n.inEmptyCapa,
        actionLabel: onAdd == null ? null : l10n.inActCapa,
        onAction: onAdd,
      );
    }
    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxl),
      children: [
        if (onAdd != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: PrimaryButton.secondary(
                expand: false,
                label: l10n.inActCapa,
                onPressed: busy ? null : onAdd,
              ),
            ),
          ),
        for (final c in capas)
          ListRow(
            title: c.description,
            subtitle: [
              capaTypeLabel(l10n, c.type),
              c.owner?.display(bangla: bangla) ?? l10n.inCapaUnassigned,
              DateFmt.date(c.dueAt, lang),
            ].join(' · '),
            trailing: StatusPill(
              label: capaStatusLabel(l10n, c.status),
              tone: capaStatusTone(c.status),
            ),
            onTap: busy
                ? null
                : c.me.canStart
                ? () => onStart(c.id)
                : c.me.canComplete
                ? () => onComplete(c)
                : c.me.canVerify
                ? () => onVerify(c.id)
                : null,
          ),
      ],
    );
  }
}

class _Gov extends StatelessWidget {
  const _Gov({required this.incident, required this.lang, this.onFile});

  final SafetyIncident incident;
  final String lang;
  final VoidCallback? onFile;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final i = incident;
    final due = i.statutoryDueAt;
    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        if (i.statutoryBodyCode != null)
          _Fact(l10n.inGovBody, i.statutoryBodyCode!),
        if (due != null)
          Padding(
            padding: const EdgeInsets.only(top: Space.md),
            child: Text(
              l10n.inStatutoryDue(
                i.statutoryBodyCode ?? '',
                DateFmt.date(due, lang),
              ),
            ),
          ),
        if (i.statutoryReceiptNo != null)
          Padding(
            padding: const EdgeInsets.only(top: Space.md),
            child: Text(l10n.inStatutoryDone(i.statutoryReceiptNo!)),
          ),
        if (onFile != null) ...[
          const SizedBox(height: Space.lg),
          PrimaryButton(label: l10n.inActStatutory, onPressed: onFile),
        ],
      ],
    );
  }
}
