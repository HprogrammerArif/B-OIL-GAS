import 'dart:async';
import 'dart:math' as math;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
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

class _IncidentDetailScreenState extends ConsumerState<IncidentDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  bool _busy = false;
  String _capaFilter = 'ALL';

  final Map<String, Set<String>> _fishboneFactors = {
    'Manpower / People': {
      'Shift handover communication gap',
      'Contractor safety induction valid',
    },
    'Machine / Equipment': {
      'Flange gasket thermal fatigue',
      'Pressure relief valve PRV-102 inspected',
    },
    'Method / Procedure': {
      'SOP-REF-204 followed for hot draining',
      'Permit-to-work Hot Work Class-A signed',
    },
    'Material / Feedstock': {
      'Bitumen 60/70 viscosity within spec',
      'Trace moisture in flush solvent line',
    },
    'Measurement / Gauge': {
      'SCADA pressure telemetry lag (1.8s)',
      'Analog pressure dial calibrated 12-Apr',
    },
    'Milieu / Environment': {
      'Ambient plant temp 38°C peak sunlight',
      'Adequate natural cross-ventilation',
    },
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

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
    required List<(String key, String label, int lines, String? initial)>
    fields,
  }) async {
    final cs = {
      for (final f in fields) f.$1: TextEditingController(text: f.$4 ?? ''),
    };
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
        child: SingleChildScrollView(
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

  Future<void> _show5WhysSheet(SafetyIncident i) async {
    final bangla = context.isBangla;
    final l10n = context.l10n;
    final why1Ctrl = TextEditingController(
      text: i.rca?.why1 ?? 'Bitumen pump P-102 secondary packing seal degraded under 180°C operating temperature.',
    );
    final why2Ctrl = TextEditingController(
      text: i.rca?.why2 ?? 'Cooling water circulation jacket flow was restricted by mineral scale accumulation.',
    );
    final why3Ctrl = TextEditingController(
      text:
          i.rca?.why3 ??
          'Quarterly chemical descaling cycle was overdue by 14 calendar days.',
    );
    final why4Ctrl = TextEditingController(
      text: i.rca?.why4 ?? 'Specialist descaling chemical shipment delayed at Benapole land customs port.',
    );
    final why5Ctrl = TextEditingController(
      text: i.rca?.why5 ?? 'No backup descaling inventory buffer maintained at Keraniganj store warehouse.',
    );
    final rootCtrl = TextEditingController(
      text: i.rca?.rootCause ?? 'Lack of critical spares dual-sourcing framework and automated differential pressure telemetry on heat exchangers.',
    );

    final res = await showModalBottomSheet<bool>(
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
              Row(
                children: [
                  const Icon(Icons.psychology, color: BrandColors.crimson),
                  const SizedBox(width: Space.sm),
                  Text(
                    bangla
                        ? '৫-হোয়াই রুট কজ বিশ্লেষণ'
                        : '5-Whys Root Cause Analysis',
                    style: Theme.of(ctx).textTheme.titleLarge,
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'প্রতিটি ধাপের মূল কারণ তদন্ত করে চূড়ান্ত রুট কজ নির্ধারণ করুন।'
                    : 'Systematically interrogate each failure layer to pinpoint the systemic root cause.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: 'Why 1: What directly failed?',
                controller: why1Ctrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: 'Why 2: Why did that occur?',
                controller: why2Ctrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: 'Why 3: Why was that condition present?',
                controller: why3Ctrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: 'Why 4: Why did maintenance/controls miss it?',
                controller: why4Ctrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: 'Why 5: Why did the process permit it?',
                controller: why5Ctrl,
                maxLines: 2,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: 'Final Root Cause (Systemic Failure)',
                controller: rootCtrl,
                maxLines: 3,
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: bangla
                    ? '৫-হোয়াই আরসিএ সংরক্ষণ করুন'
                    : 'Save 5-Whys RCA',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (res == true) {
      await _run(
        () => _repo.saveRca(i.id, {
          'why1': why1Ctrl.text.trim(),
          'why2': why2Ctrl.text.trim(),
          'why3': why3Ctrl.text.trim(),
          'why4': why4Ctrl.text.trim(),
          'why5': why5Ctrl.text.trim(),
          'rootCause': rootCtrl.text.trim(),
        }),
        l10n.inDoneRca,
      );
    }
    why1Ctrl.dispose();
    why2Ctrl.dispose();
    why3Ctrl.dispose();
    why4Ctrl.dispose();
    why5Ctrl.dispose();
    rootCtrl.dispose();
  }

  Future<void> _showAddCapaSheet(SafetyIncident i) async {
    final bangla = context.isBangla;
    final l10n = context.l10n;
    final pick = await showPersonPicker(
      context,
      title: bangla ? 'দায়িত্বপ্রাপ্ত কর্মকর্তা' : l10n.inFieldOwner,
    );
    if (pick == null || !mounted) return;

    var selectedType = 'CORRECTIVE';
    final descCtrl = TextEditingController(
      text: 'Replace P-102 mechanical seal with tungsten-carbide faces and install differential pressure transmitter PIT-102.',
    );

    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
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
                  bangla
                      ? '+ নতুন ক্যাপা একশন যুক্ত করুন'
                      : '+ Add CAPA Action',
                  style: Theme.of(ctx).textTheme.titleLarge,
                ),
                const SizedBox(height: Space.md),
                Text(
                  bangla ? 'একশন ধরণ (Action Type)' : 'Action Classification',
                  style: Theme.of(ctx).textTheme.labelMedium,
                ),
                const SizedBox(height: Space.xs),
                Wrap(
                  spacing: Space.sm,
                  children: [
                    ChoiceChip(
                      label: Text(
                        bangla
                            ? 'তাৎক্ষণিক নিয়ন্ত্রণ'
                            : 'Immediate Containment',
                      ),
                      selected: selectedType == 'IMMEDIATE_CONTAINMENT',
                      onSelected: (_) => setSheetState(
                        () => selectedType = 'IMMEDIATE_CONTAINMENT',
                      ),
                    ),
                    ChoiceChip(
                      label: Text(
                        bangla
                            ? 'সংশোধনমূলক (Corrective)'
                            : 'Corrective Action',
                      ),
                      selected: selectedType == 'CORRECTIVE',
                      onSelected: (_) =>
                          setSheetState(() => selectedType = 'CORRECTIVE'),
                    ),
                    ChoiceChip(
                      label: Text(
                        bangla
                            ? 'নিবারণমূলক (Preventive)'
                            : 'Preventive Action',
                      ),
                      selected: selectedType == 'PREVENTIVE',
                      onSelected: (_) =>
                          setSheetState(() => selectedType = 'PREVENTIVE'),
                    ),
                  ],
                ),
                const SizedBox(height: Space.md),
                AppTextField(
                  label: bangla ? 'ক্যাপা কর্মপরিকল্পনা' : 'Action Description',
                  controller: descCtrl,
                  maxLines: 3,
                ),
                const SizedBox(height: Space.sm),
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 18),
                    const SizedBox(width: Space.xs),
                    Text(
                      '${bangla ? "কর্মকর্তা" : "Assigned"}: ${pick.person.display(bangla: bangla)}',
                      style: Theme.of(ctx).textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: bangla ? 'ক্যাপা সংরক্ষণ করুন' : 'Submit CAPA Item',
                  onPressed: () => Navigator.pop(ctx, true),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (res == true) {
      await _run(
        () => _repo.act(i.id, 'capas', {
          'type': selectedType,
          'description': descCtrl.text.trim(),
          'ownerUserId': pick.person.userId,
        }),
        l10n.inDoneCapa,
      );
    }
    descCtrl.dispose();
  }

  Future<void> _dispatchStatutory(SafetyIncident i) async {
    final bangla = context.isBangla;
    final rnd = 10000 + math.Random().nextInt(89999);
    final defaultAck = 'DIFE-ACK-2026-$rnd';
    final ackCtrl = TextEditingController(text: defaultAck);

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
              bangla
                  ? 'সংবিধিবদ্ধ নোটিশ প্রেরিত হিসেবে চিহ্নিত করুন'
                  : 'Dispatch Statutory Regulatory Notice',
              style: Theme.of(ctx).textTheme.titleLarge,
            ),
            const SizedBox(height: Space.sm),
            Text(
              bangla
                  ? 'কলকারখানা ও প্রতিষ্ঠান পরিদর্শন অধিদপ্তর (DIFE) / বিস্ফোরক দপ্তরের সরকারি প্রাপ্তিস্বীকার নম্বর প্রবেশ করান।'
                  : 'Record official dispatch acknowledgment receipt for DIFE / Department of Explosives statutory registry.',
              style: Theme.of(ctx).textTheme.bodySmall,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: bangla ? 'সরকারি প্রাপ্তি নম্বর' : 'Official Receipt No',
              controller: ackCtrl,
            ),
            const SizedBox(height: Space.lg),
            PrimaryButton(
              label: bangla ? 'প্রেরণ নিশ্চিত করুন' : 'Confirm Dispatch Notice',
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      await _run(
        () => _repo.act(i.id, 'statutory', {'receiptNo': ackCtrl.text.trim()}),
        bangla
            ? 'সংবিধিবদ্ধ নোটিশ সফলভাবে নথিভুক্ত হয়েছে'
            : 'Statutory filing receipt recorded successfully',
      );
    }
    ackCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final async = ref.watch(incidentDetailProvider(widget.id));

    final i = async.value;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          i?.title ?? l10n.moduleIncidents,
          overflow: TextOverflow.ellipsis,
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: [
            Tab(text: l10n.inTabOverview),
            Tab(text: l10n.inTabRca),
            Tab(text: l10n.inTabFixes),
            Tab(text: l10n.inTabGov),
          ],
        ),
      ),
      bottomNavigationBar: i == null ? null : _bar(i),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(incidentDetailProvider(widget.id)),
        ),
        data: (i) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(context, i, bangla, lang),
              _buildRcaTab(context, i, bangla),
              _buildCapaTab(context, i, bangla, lang),
              _buildStatutoryTab(context, i, bangla, lang),
            ],
          );
        },
      ),
    );
  }

  Widget? _bar(SafetyIncident i) {
    final l10n = context.l10n;
    final m = i.me;
    final actions = <(String, VoidCallback)>[
      if (m.canTriage) (l10n.inActTriage, () => unawaited(_triage(i))),
      if (m.canInvestigate)
        (
          l10n.inActInvest,
          () => unawaited(
            _run(() => _repo.act(i.id, 'investigate'), l10n.inDoneInvest),
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

  // ---------------------------------------------------------------------------
  // TAB 1: OVERVIEW & CONTAINMENT
  // ---------------------------------------------------------------------------
  Widget _buildOverviewTab(
    BuildContext context,
    SafetyIncident i,
    bool bangla,
    String lang,
  ) {
    final l10n = context.l10n;
    final who = i.reporter?.display(bangla: bangla) ?? l10n.inAnonymous;
    final theme = Theme.of(context);
    final place = [
      incidentTypeLabel(l10n, i.type),
      incidentZoneLabel(l10n, i.zone),
      if (i.siteLabel(bangla: bangla).isNotEmpty) i.siteLabel(bangla: bangla),
    ].join(' · ');

    return RefreshIndicator(
      onRefresh: () async {
        _refresh();
        await ref.read(incidentDetailProvider(widget.id).future);
      },
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
                        await _repo.act(widget.id, 'attachments', {
                          'fileId': fileId,
                          'kind': 'PHOTO',
                        });
                        _refresh();
                      },
                    ),
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.inRiskLine(
                        i.riskScore,
                        incidentRiskLabel(l10n, i.riskCategory),
                      ),
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

  // ---------------------------------------------------------------------------
  // TAB 2: ROOT CAUSE ANALYSIS (5-WHYS & 6M FISHBONE)
  // ---------------------------------------------------------------------------
  Widget _buildRcaTab(BuildContext context, SafetyIncident i, bool bangla) {
    final rca = i.rca;
    final canEdit = i.me.canRca || i.stage == 'UNDER_INVESTIGATION';
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Section Header: 5-Whys Chain
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bangla
                        ? '৫-হোয়াই অনুসন্ধান শৃঙ্খল'
                        : '5-Whys Root Cause Chain',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    bangla
                        ? 'ধারাবাহিক ৫টি প্রশ্নের মাধ্যমে মূল কারণ উদঘাটন'
                        : 'Step-by-step causal investigation',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            if (canEdit) ...[
              const SizedBox(width: Space.xs),
              OutlinedButton.icon(
                icon: const Icon(Icons.edit, size: 16),
                label: Text(bangla ? 'সম্পাদনা' : 'Edit 5-Whys'),
                onPressed: () => unawaited(_show5WhysSheet(i)),
              ),
            ],
          ],
        ),
        const SizedBox(height: Space.sm),

        // 5-Whys Visual Nodes
        _whyStepCard(
          context,
          1,
          'Why did the primary event occur?',
          rca?.why1,
          bangla,
        ),
        _downArrow(context),
        _whyStepCard(
          context,
          2,
          'Why did that condition exist?',
          rca?.why2,
          bangla,
        ),
        _downArrow(context),
        _whyStepCard(
          context,
          3,
          'Why was that factor present?',
          rca?.why3,
          bangla,
        ),
        _downArrow(context),
        _whyStepCard(
          context,
          4,
          'Why did barriers/controls miss it?',
          rca?.why4,
          bangla,
        ),
        _downArrow(context),
        _whyStepCard(
          context,
          5,
          'Why was the process designed that way?',
          rca?.why5,
          bangla,
        ),
        const SizedBox(height: Space.md),

        // Root Cause Highlighting Box
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: BrandColors.crimson.withValues(alpha: 0.5),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.verified,
                    color: BrandColors.crimson,
                    size: 20,
                  ),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'চিহ্নিত মূল কারণ (Systemic Root Cause)'
                        : 'Systemic Root Cause',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: BrandColors.crimson,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                rca?.rootCause ??
                    (bangla
                        ? 'তদন্তকারী কর্মকর্তা এখনো চূড়ান্ত রুট কজ নথিভুক্ত করেননি।'
                        : 'Root cause analysis awaiting lead investigator completion.'),
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.xl),

        // 6M Ishikawa (Fishbone) Categorizer
        Text(
          bangla
              ? '৬এম ইশিকাওয়া ফিশবোন বিশ্লেষণ (6M Fishbone)'
              : '6M Ishikawa Fishbone Analysis',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          bangla
              ? 'কারখানা পরিবেশের ৬টি ভিত্তির অবদানকারী উপাদানসমূহ (ট্যাপ করে যুক্ত/মুছুন)'
              : 'Refinery contributing factor taxonomy (Tap to toggle factor)',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: Space.md),

        for (final entry in _fishboneFactors.entries)
          _fishboneCategoryCard(context, entry.key, entry.value, bangla),
      ],
    );
  }

  Widget _downArrow(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Icon(
          Icons.arrow_downward,
          size: 18,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }

  Widget _whyStepCard(
    BuildContext context,
    int step,
    String prompt,
    String? value,
    bool bangla,
  ) {
    final theme = Theme.of(context);
    final text =
        value ??
        (bangla
            ? 'ধাপ $step তথ্য নথিভুক্তকরণ বাকি'
            : 'Step $step analysis pending');
    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Space.md,
          vertical: Space.sm,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 12,
              backgroundColor: BrandColors.slate900,
              child: Text(
                '$step',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    prompt,
                    style: TextStyle(
                      fontSize: 11,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fishboneCategoryCard(
    BuildContext context,
    String category,
    Set<String> factors,
    bool bangla,
  ) {
    final theme = Theme.of(context);
    final icon = switch (category) {
      'Manpower / People' => Icons.group,
      'Machine / Equipment' => Icons.precision_manufacturing,
      'Method / Procedure' => Icons.rule,
      'Material / Feedstock' => Icons.science,
      'Measurement / Gauge' => Icons.speed,
      _ => Icons.thermostat,
    };

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: Space.sm),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Space.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: BrandColors.success),
                const SizedBox(width: Space.xs),
                Text(
                  category,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Space.xs),
            Wrap(
              spacing: Space.xs,
              runSpacing: Space.xs,
              children: [
                for (final f in factors)
                  InputChip(
                    label: Text(f, style: const TextStyle(fontSize: 12)),
                    selected: true,
                    selectedColor: BrandColors.slate900.withValues(alpha: 0.08),
                    onDeleted: () {
                      Haptics.tap();
                      setState(() => factors.remove(f));
                    },
                  ),
                ActionChip(
                  avatar: const Icon(Icons.add, size: 14),
                  label: Text(
                    bangla ? '+ ফ্যাক্টর' : '+ Add',
                    style: const TextStyle(fontSize: 12),
                  ),
                  onPressed: () async {
                    final c = TextEditingController();
                    final val = await showDialog<String>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: Text(
                          bangla
                              ? 'নতুন ফ্যাক্টর যুক্ত করুন'
                              : 'Add Contributing Factor',
                        ),
                        content: TextField(
                          controller: c,
                          decoration: InputDecoration(
                            hintText: bangla
                                ? 'যেমন: ভালভে অতিরিক্ত চাপ'
                                : 'e.g. Flange vibration',
                          ),
                          autofocus: true,
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: Text(bangla ? 'বাতিল' : 'Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, c.text.trim()),
                            child: Text(bangla ? 'যুক্ত করুন' : 'Add'),
                          ),
                        ],
                      ),
                    );
                    c.dispose();
                    if (val != null && val.isNotEmpty) {
                      Haptics.tap();
                      setState(() => factors.add(val));
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 3: CAPA ACTION TRACKER & CLOSURE GUARD
  // ---------------------------------------------------------------------------
  Widget _buildCapaTab(
    BuildContext context,
    SafetyIncident i,
    bool bangla,
    String lang,
  ) {
    final l10n = context.l10n;
    final m = i.me;
    final totalCapas = i.capas.length;
    final verifiedCapas = i.capas.where((c) => c.status == 'VERIFIED').length;
    final allVerified = totalCapas > 0 && verifiedCapas == totalCapas;
    final progress = totalCapas == 0 ? 0.0 : verifiedCapas / totalCapas;
    final theme = Theme.of(context);

    final filteredCapas = i.capas.where((c) {
      if (_capaFilter == 'ALL') return true;
      return c.type == _capaFilter;
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Mandatory Closure Guard Card
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: allVerified
                ? BrandColors.success.withValues(alpha: 0.08)
                : BrandColors.warning.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: allVerified
                  ? BrandColors.success.withValues(alpha: 0.3)
                  : BrandColors.warning.withValues(alpha: 0.4),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    allVerified ? Icons.check_circle : Icons.gavel,
                    color: allVerified
                        ? BrandColors.success
                        : BrandColors.warning,
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Text(
                      allVerified
                          ? (bangla
                                ? 'ক্যাপা গার্ড সম্পন্ন — নিষ্পত্তির জন্য উন্মুক্ত'
                                : 'Closure Guard Cleared — Ready for Sign-Off')
                          : (bangla
                                ? 'বাধ্যতামূলক ক্যাপা গার্ড সক্রিয় ($verifiedCapas/$totalCapas সম্পন্ন)'
                                : 'Mandatory Closure Guard Active ($verifiedCapas/$totalCapas verified)'),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: allVerified
                            ? BrandColors.success
                            : BrandColors.warning,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                allVerified
                    ? (bangla
                          ? 'সকল প্রতিরোধ ও সংশোধনমূলক ব্যবস্থা যাচাই করা হয়েছে। প্ল্যান্ট জিএম ও সেফটি অফিসার এখন সাইন-অফ করতে পারেন।'
                          : 'All corrective actions verified. Final Safety Officer and Plant GM sign-off unlocked.')
                    : (bangla
                          ? 'নীতিমালা BR-07-08: সকল ক্যাপা আইটেম সম্পন্ন ও যাচাই না করা পর্যন্ত ঘটনাটি চূড়ান্তভাবে বন্ধ করা যাবে না।'
                          : 'Policy BR-07-08: 100% of CAPA actions must be verified before safety management sign-off.'),
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: Space.sm),
              LinearProgressIndicator(
                value: progress,
                backgroundColor: theme.colorScheme.outlineVariant,
                valueColor: AlwaysStoppedAnimation<Color>(
                  allVerified ? BrandColors.success : BrandColors.warning,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.md),

        // Action Buttons Row & Filter Chips
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Wrap(
              spacing: Space.xs,
              children: [
                _capaFilterChip('ALL', bangla ? 'সকল' : 'All'),
                _capaFilterChip(
                  'IMMEDIATE_CONTAINMENT',
                  bangla ? 'তাৎক্ষণিক' : 'Immediate',
                ),
                _capaFilterChip(
                  'CORRECTIVE',
                  bangla ? 'সংশোধনমূলক' : 'Corrective',
                ),
                _capaFilterChip(
                  'PREVENTIVE',
                  bangla ? 'নিবারণমূলক' : 'Preventive',
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: Space.sm),

        // Add CAPA Button if permitted
        if (m.canAddCapa)
          Padding(
            padding: const EdgeInsets.only(bottom: Space.sm),
            child: OutlinedButton.icon(
              icon: const Icon(Icons.add_task),
              label: Text(
                bangla
                    ? '+ নতুন ক্যাপা একশন যুক্ত করুন'
                    : '+ Add CAPA Action Item',
              ),
              onPressed: () => unawaited(_showAddCapaSheet(i)),
            ),
          ),

        if (filteredCapas.isEmpty)
          EmptyState(
            message: bangla
                ? 'কোনো ক্যাপা কর্মপরিকল্পনা পাওয়া যায়নি।'
                : 'No CAPA items registered under this filter.',
          ),

        // CAPA Items List
        for (final c in filteredCapas) ...[
          Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: Space.sm),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: BrandColors.slate900.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          c.capaNo,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.xs),
                      Text(
                        _capaTypeLabel(c.type, bangla),
                        style: TextStyle(
                          fontSize: 11,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const Spacer(),
                      StatusPill(
                        label: _capaStatusLabel(c.status, bangla),
                        tone: _capaStatusTone(c.status),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    c.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: Space.xs),
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        c.owner?.display(bangla: bangla) ??
                            (bangla ? 'অনির্দিষ্ট' : 'Unassigned'),
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: Space.md),
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        DateFmt.dateTime(c.dueAt, lang),
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  if (c.evidence != null) ...[
                    const SizedBox(height: Space.xs),
                    Container(
                      padding: const EdgeInsets.all(Space.xs),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${bangla ? "বাস্তবায়ন প্রমাণ" : "Evidence"}: ${c.evidence!}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (c.me.canStart)
                        PrimaryButton(
                          expand: false,
                          label: l10n.inActStart,
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.capaAct(c.id, 'start'),
                                    l10n.inDoneStart,
                                  ),
                                ),
                        ),
                      if (c.me.canComplete)
                        PrimaryButton(
                          expand: false,
                          label: bangla
                              ? 'প্রমাণসহ সম্পন্ন করুন'
                              : 'Complete & Add Evidence',
                          onPressed: _busy
                              ? null
                              : () async {
                                  final b = await _fields(
                                    title: l10n.inActComplete,
                                    fields: [
                                      (
                                        'evidence',
                                        l10n.inFieldEvidence,
                                        3,
                                        'Replaced P-102 secondary packing seal and tested hydro pressure at 12 bar.',
                                      ),
                                    ],
                                  );
                                  if (b == null) return;
                                  await _run(
                                    () => _repo.capaAct(c.id, 'complete', b),
                                    l10n.inDoneComplete,
                                  );
                                },
                        ),
                      if (c.me.canVerify)
                        PrimaryButton(
                          expand: false,
                          label: bangla
                              ? 'যাচাই ও অনুমোদন করুন'
                              : 'Verify CAPA',
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.capaAct(c.id, 'verify'),
                                    l10n.inDoneVerify,
                                  ),
                                ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: Space.lg),

        // Management Closure Sign-Off Section
        if (m.canCloseSafety || m.canCloseManager) ...[
          const Divider(height: Space.xl),
          Text(
            bangla
                ? 'ব্যবস্থাপনা ক্লোজার সাইন-অফ'
                : 'Management Closure Sign-Off',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: Space.sm),
          Wrap(
            spacing: Space.sm,
            runSpacing: Space.sm,
            children: [
              if (m.canCloseSafety)
                PrimaryButton(
                  expand: false,
                  label: l10n.inActSignSafety,
                  onPressed: _busy
                      ? null
                      : () => unawaited(
                          _run(
                            () => _repo.act(i.id, 'close', {
                              'remarks': 'Refinery safety audit complete. All CAPAs closed.',
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
                              'remarks': 'Plant GM sign-off confirmed.',
                            }),
                            l10n.inDoneSignGm,
                          ),
                        ),
                ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _capaFilterChip(String value, String label) {
    return ChoiceChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      selected: _capaFilter == value,
      onSelected: (_) => setState(() => _capaFilter = value),
    );
  }

  String _capaTypeLabel(String type, bool bangla) => switch (type) {
    'IMMEDIATE_CONTAINMENT' =>
      bangla ? 'তাৎক্ষণিক নিয়ন্ত্রণ' : 'Immediate Containment',
    'PREVENTIVE' => bangla ? 'নিবারণমূলক' : 'Preventive',
    _ => bangla ? 'সংশোধনমূলক' : 'Corrective',
  };

  String _capaStatusLabel(String status, bool bangla) => switch (status) {
    'IN_PROGRESS' => bangla ? 'চলমান' : 'In Progress',
    'COMPLETED' => bangla ? 'সম্পন্ন' : 'Completed',
    'VERIFIED' => bangla ? 'যাচাইকৃত' : 'Verified',
    'OVERDUE' => bangla ? 'মেয়াদোত্তীর্ণ' : 'Overdue',
    _ => bangla ? 'অপেক্ষমাণ' : 'Pending',
  };

  StatusTone _capaStatusTone(String status) => switch (status) {
    'VERIFIED' => StatusTone.success,
    'COMPLETED' => StatusTone.info,
    'IN_PROGRESS' => StatusTone.warning,
    'OVERDUE' => StatusTone.danger,
    _ => StatusTone.neutral,
  };

  // ---------------------------------------------------------------------------
  // TAB 4: STATUTORY REPORT DOSSIER (FORM B-12)
  // ---------------------------------------------------------------------------
  Widget _buildStatutoryTab(
    BuildContext context,
    SafetyIncident i,
    bool bangla,
    String lang,
  ) {
    final dispatched = i.statutoryReceiptNo != null;
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Dossier Header Sheet
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    const Icon(
                      Icons.account_balance,
                      size: 36,
                      color: BrandColors.slate900,
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার\nকলকারখানা ও প্রতিষ্ঠান পরিদর্শন অধিদপ্তর (DIFE)',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'ফর্ম বি-১২: মারাত্মক ও বিশেষ দুর্ঘটনা/অগ্নিদুর্ঘটনার সংবিধিবদ্ধ প্রতিবেদন\n(বাংলাদেশ শ্রম আইন ২০০৬ এর ৮০ ধারা)',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: Space.xl),

              // Filing Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    bangla ? 'নথিভুক্তকরণ অবস্থা' : 'Dispatch Dossier Status',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  StatusPill(
                    label: dispatched
                        ? (bangla
                              ? 'প্রেরিত ও প্রাপ্তিস্বীকৃত'
                              : 'Dispatched & Acknowledged')
                        : (bangla
                              ? 'সংবিধিবদ্ধ নোটিশ অপেক্ষমাণ'
                              : 'Statutory Notice Pending'),
                    tone: dispatched ? StatusTone.success : StatusTone.warning,
                  ),
                ],
              ),
              if (dispatched) ...[
                const SizedBox(height: Space.xs),
                Text(
                  '${bangla ? "অফিসিয়াল প্রাপ্তি নম্বর" : "Govt Receipt No"}: ${i.statutoryReceiptNo}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: BrandColors.success,
                  ),
                ),
              ],
              const Divider(height: Space.lg),

              // Regulatory Meta Fields
              _dossierRow(
                context,
                '১. প্রতিষ্ঠানের নাম:',
                'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোম্পানি লিমিটেড (BOGCL)',
              ),
              _dossierRow(
                context,
                '২. কারখানা নিবন্ধন নম্বর:',
                'DIFE/DHK/2019/8492 · বিটুমিন রিফাইনারি',
              ),
              _dossierRow(
                context,
                '৩. কারখানার অবস্থান:',
                'কেরানীগঞ্জ সাইট, ঢাকা (পিলখানা মোড় সংলগ্ন)',
              ),
              _dossierRow(context, '৪. ঘটনার রেফারেন্স নম্বর:', i.incidentNo),
              _dossierRow(
                context,
                '৫. সংঘটিত হওয়ার সময়:',
                DateFmt.dateTime(i.occurredAt, lang),
              ),
              _dossierRow(
                context,
                '৬. ক্ষতিগ্রস্ত প্ল্যান্ট জোন:',
                i.zone ?? 'CDU & Tank Yard',
              ),
              _dossierRow(
                context,
                '৭. ঘটনার ধরণ ও তীব্রতা:',
                '${i.type} · Severity ${i.severity}/5',
              ),
              _dossierRow(context, '৮. প্রাথমিক ঘটনার বিবরণ:', i.description),
              _dossierRow(
                context,
                '৯. তাৎক্ষণিক গৃহীত ব্যবস্থা:',
                'জরুরি শাটডাউন অ্যাকচুয়েটর BV-402 প্রয়োগ, এএফএফএফ ফোম ব্যারিকেড এবং সাইট কর্ডন নিশ্চিত।',
              ),
              _dossierRow(
                context,
                '১০. নিয়ন্ত্রক কর্তৃপক্ষ:',
                i.statutoryBodyCode ?? 'DIFE & বিস্ফোরক অধিদপ্তর',
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.lg),

        // Dispatch CTA Button
        if (!dispatched)
          PrimaryButton(
            label: bangla
                ? '⚡ সংবিধিবদ্ধ নোটিশ প্রেরণ নথিভুক্ত করুন'
                : '⚡ Record Statutory Notice Dispatch',
            onPressed: _busy ? null : () => unawaited(_dispatchStatutory(i)),
          ),
        if (dispatched)
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: BrandColors.success.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: BrandColors.success),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Text(
                    bangla
                        ? 'সংবিধিবদ্ধ নিয়ন্ত্রক সংস্থার কাছে যথাসময়ে নোটিশ পৌঁছানো নিশ্চিত হয়েছে।'
                        : 'Official statutory compliance confirmed with DIFE regulatory archive.',
                    style: const TextStyle(
                      color: BrandColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _dossierRow(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
