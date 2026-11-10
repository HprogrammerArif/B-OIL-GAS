import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LicenceDetailScreen extends ConsumerStatefulWidget {
  const LicenceDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<LicenceDetailScreen> createState() =>
      _LicenceDetailScreenState();
}

class _LicenceDetailScreenState extends ConsumerState<LicenceDetailScreen> {
  bool _busy = false;

  LicenceRepository get _repo => ref.read(licenceRepositoryProvider);

  void _refresh() => ref
    ..invalidate(licenceDetailProvider)
    ..invalidate(licencesProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'FUND_NOT_APPROVED' => l10n.cpErrFund,
      'CHECKLIST_INCOMPLETE' => l10n.cpErrTicks,
      'CHECKLIST_FAILED' => l10n.cpErrFail,
      'LETTER_NOT_DUE' => l10n.cpErrLetter,
      'RENEWAL_OPEN' => l10n.cpErrOpen,
      'VALIDITY_RANGE' => l10n.cpErrValidity,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.cpErrFailed,
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

  EdgeInsets _sheetPad(BuildContext ctx) => EdgeInsets.fromLTRB(
    Space.lg,
    0,
    Space.lg,
    MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
  );

  Future<bool?> _sheet({required Widget Function(BuildContext) builder}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(padding: _sheetPad(ctx), child: builder(ctx)),
    );
  }

  Future<void> _openBookInspection(Licence l) async {
    final l10n = context.l10n;
    final nameCtrl = TextEditingController();
    final confirmed = await _sheet(
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.cpActInspect, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.cpFieldInspector, controller: nameCtrl),
          const SizedBox(height: Space.md),
          PrimaryButton(
            label: l10n.cpActInspect,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    final name = nameCtrl.text.trim();
    nameCtrl.dispose();
    if (confirmed != true || !mounted) return;
    if (name.length < 3) {
      AppToast.show(context, l10n.cpErrInspector, tone: StatusTone.warning);
      return;
    }
    await _run(
      () => _repo.act(l.id, 'advance', {'inspectorName': name}),
      l10n.cpDoneAdvance,
    );
  }

  Future<void> _openFindings(Licence l) async {
    final l10n = context.l10n;
    final findingsCtrl = TextEditingController();
    final confirmed = await _sheet(
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.cpActFindings, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.cpFieldFindings,
            controller: findingsCtrl,
            maxLines: 4,
          ),
          const SizedBox(height: Space.md),
          PrimaryButton(
            label: l10n.cpActFindings,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    final findings = findingsCtrl.text.trim();
    findingsCtrl.dispose();
    if (confirmed != true || !mounted) return;
    if (findings.length < 10) {
      AppToast.show(context, l10n.cpErrSentence, tone: StatusTone.warning);
      return;
    }
    await _run(
      () => _repo.act(l.id, 'advance', {'auditFindings': findings}),
      l10n.cpDoneAdvance,
    );
  }

  Future<void> _openCertificate(Licence l) async {
    final l10n = context.l10n;
    final now = DateTime.now();
    final neu = DateTime(now.year, now.month + l.validityMonths, now.day);
    final certCtrl = TextEditingController(text: l.licenceNo);
    final expiryCtrl = TextEditingController(
      text:
          '${neu.year.toString().padLeft(4, '0')}-'
          '${neu.month.toString().padLeft(2, '0')}-'
          '${neu.day.toString().padLeft(2, '0')}',
    );
    final chalanCtrl = TextEditingController();
    final confirmed = await _sheet(
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.cpActComplete, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.cpFieldCert, controller: certCtrl),
          const SizedBox(height: Space.sm),
          AppTextField(label: l10n.cpFieldNewExpiry, controller: expiryCtrl),
          if (l.feeAmount > 0) ...[
            const SizedBox(height: Space.sm),
            AppTextField(label: l10n.cpFieldChalan, controller: chalanCtrl),
          ],
          const SizedBox(height: Space.md),
          PrimaryButton(
            label: l10n.cpActComplete,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    final cert = certCtrl.text.trim();
    final exp = expiryCtrl.text.trim();
    final chalan = chalanCtrl.text.trim();
    certCtrl.dispose();
    expiryCtrl.dispose();
    chalanCtrl.dispose();
    if (confirmed != true || !mounted) return;
    if (cert.isEmpty || exp.isEmpty) {
      AppToast.show(context, l10n.cpErrNo, tone: StatusTone.warning);
      return;
    }
    await _run(
      () => _repo.act(l.id, 'advance', {
        'certificateNo': cert,
        'newExpiresAt': exp.contains('T') ? exp : '${exp}T00:00:00.000Z',
        if (l.feeAmount > 0) 'chalanNo': chalan,
      }),
      l10n.cpDoneAdvance,
    );
  }

  Future<void> _openRevert(Licence l) async {
    final l10n = context.l10n;
    final reasonCtrl = TextEditingController();
    final confirmed = await _sheet(
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.cpActBack, style: Theme.of(ctx).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.cpFieldReason,
            controller: reasonCtrl,
            maxLines: 3,
          ),
          const SizedBox(height: Space.md),
          PrimaryButton.secondary(
            label: l10n.cpActBack,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    final reason = reasonCtrl.text.trim();
    reasonCtrl.dispose();
    if (confirmed != true || !mounted) return;
    if (reason.length < 10) {
      AppToast.show(context, l10n.cpErrSentence, tone: StatusTone.warning);
      return;
    }
    await _run(
      () => _repo.act(l.id, 'back', {'reason': reason}),
      l10n.cpDoneBack,
    );
  }

  Future<void> _openLetter(Licence l) async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final heading = l.heading(bangla: bangla);
    final subjectCtrl = TextEditingController(
      text: bangla
          ? '$heading নবায়ন দ্রুত ইস্যুর অনুরোধ।'
          : 'Request to expedite renewal of $heading.',
    );
    final bodyCtrl = TextEditingController(
      text: bangla
          ? '${l.licenceNo} নবায়নের প্রস্তুতি শেষ। সনদ ইস্যুর অনুরোধ।'
          : 'Renewal preparations for ${l.licenceNo} are complete. Please issue the certificate.',
    );
    var channel = 'EMAIL';
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: _sheetPad(ctx),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.cpActLetter, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: Space.md),
              Wrap(
                spacing: Space.xs,
                children: [
                  ChoiceChip(
                    label: Text(l10n.cpChannelEmail),
                    selected: channel == 'EMAIL',
                    onSelected: (_) => setModal(() => channel = 'EMAIL'),
                  ),
                  ChoiceChip(
                    label: Text(l10n.cpChannelCourier),
                    selected: channel == 'COURIER',
                    onSelected: (_) => setModal(() => channel = 'COURIER'),
                  ),
                  ChoiceChip(
                    label: Text(l10n.cpChannelHand),
                    selected: channel == 'HAND',
                    onSelected: (_) => setModal(() => channel = 'HAND'),
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              AppTextField(label: l10n.cpFieldSubject, controller: subjectCtrl),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.cpFieldLetter,
                controller: bodyCtrl,
                maxLines: 4,
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: l10n.cpActLetter,
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );
    final subject = subjectCtrl.text.trim();
    final body = bodyCtrl.text.trim();
    subjectCtrl.dispose();
    bodyCtrl.dispose();
    if (confirmed != true || !mounted) return;
    await _run(
      () => _repo.act(l.id, 'letters', {
        'subject': subject,
        'body': body,
        'channel': channel,
      }),
      l10n.cpDoneLetter,
    );
  }

  String _channelLabel(AppL10n l10n, String channel) => switch (channel) {
    'COURIER' || 'DISPATCH_RIDER' => l10n.cpChannelCourier,
    'HAND' => l10n.cpChannelHand,
    _ => l10n.cpChannelEmail,
  };

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final async = ref.watch(licenceDetailProvider(widget.id));
    final scheme = Theme.of(context).colorScheme;
    final heading = async.value?.heading(bangla: bangla);

    return Scaffold(
      appBar: AppBar(
        title: Text(heading ?? l10n.moduleCompliance),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(licenceDetailProvider(widget.id)),
        ),
        data: (l) {
          final m = l.me;
          final r = l.renewal;
          final who = l.owner?.display(bangla: bangla) ?? '';
          final expired = l.urgency == 'EXPIRED';
          final riskTk = l.shutdownRiskPerDay > 0
              ? l.shutdownRiskPerDay
              : l.exposurePerDay;
          final statute = l.statutoryLaw(bangla: bangla);
          final penalty = l.statutoryPenalty(bangla: bangla);
          final days = l.daysToExpiry < 0
              ? l10n.cpUrgExpired
              : l10n.cpDays(l.daysToExpiry);

          return ListView(
            padding: const EdgeInsets.all(Space.md),
            children: [
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: expired
                        ? scheme.error.withValues(alpha: 0.45)
                        : scheme.outlineVariant,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              l.heading(bangla: bangla),
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          if (expired)
                            StatusPill(
                              label: licenceUrgencyLabel(l10n, l.urgency),
                              tone: licenceUrgencyTone(l.urgency),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          l.bodyCode,
                          l.licenceNo,
                          l.siteLabel(bangla: bangla),
                        ].join(' · '),
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      ),
                      if (statute.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          statute,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: scheme.onSurfaceVariant),
                        ),
                      ],
                      if (l.expiresAt != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          l10n.cpExpires(
                            DateFmt.date(l.expiresAt!, bangla ? 'bn' : 'en'),
                          ),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: scheme.onSurfaceVariant),
                        ),
                      ],
                      if (who.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          l10n.cpWho(who, days),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: scheme.onSurfaceVariant),
                        ),
                      ],
                      const SizedBox(height: Space.sm),
                      Text(
                        licenceNextLine(l10n, l, bangla: bangla),
                        style: Theme.of(context).textTheme.bodyMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),

              if (penalty.isNotEmpty) ...[
                const SizedBox(height: Space.sm),
                Theme(
                  data: Theme.of(context)
                      .copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: const EdgeInsets.symmetric(
                      horizontal: Space.sm,
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(
                      Space.md,
                      0,
                      Space.md,
                      Space.md,
                    ),
                    title: Text(
                      l10n.cpWhyMatters,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          penalty,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                      if (riskTk > 0) ...[
                        const SizedBox(height: Space.xs),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            l10n.cpExposureDay(
                              licenceTaka(riskTk, bangla: bangla),
                            ),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: scheme.onSurfaceVariant),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],

              const SizedBox(height: Space.md),

              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: scheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _PipelineVisualStepper(
                              currentStage:
                                  r?.stage ??
                                  (l.status == 'ACTIVE' ? 'RENEWED' : null),
                              l10n: l10n,
                            ),
                          ),
                          if (r != null && r.stage == 'INTERNAL_REVIEW') ...[
                            const SizedBox(width: Space.sm),
                            Text(
                              l10n.cpReadyPct('${r.readinessPct.round()}'),
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: scheme.primary),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: Space.md),

              if (m.canRenew ||
                  m.canBack ||
                  (r != null && r.stage != 'RENEWED') ||
                  (r?.certificateNo != null))
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: scheme.outlineVariant),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(Space.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (r == null) ...[
                          if (m.canRenew)
                            PrimaryButton(
                              label: l10n.cpActRenew,
                              loading: _busy,
                              onPressed: _busy
                                  ? null
                                  : () => unawaited(
                                      _run(
                                        () => _repo.act(l.id, 'renewals'),
                                        l10n.cpDoneRenew,
                                      ),
                                    ),
                            ),
                        ],

                        if (r != null && r.stage == 'INTERNAL_REVIEW') ...[
                          Text(
                            l10n.cpChecklist,
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: Space.xs),
                          if (r.feeAmount > 0) ...[
                            Text(
                              l10n.cpFieldFee,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: scheme.onSurfaceVariant),
                            ),
                            Text(
                              licenceTaka(r.feeAmount, bangla: bangla),
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            const SizedBox(height: Space.sm),
                            if (m.canFund)
                              PrimaryButton(
                                label: l10n.cpActFund,
                                loading: _busy,
                                onPressed: _busy
                                    ? null
                                    : () => unawaited(
                                        _run(
                                          () => _repo.act(l.id, 'fund'),
                                          l10n.cpDoneFund,
                                        ),
                                      ),
                              ),
                            if (m.canFund) const SizedBox(height: Space.sm),
                          ],
                          for (final c in r.checklist)
                            CheckboxListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(c.display(bangla: bangla)),
                              value: c.status == 'PASSED',
                              subtitle: c.note != null ? Text(c.note!) : null,
                              onChanged:
                                  !m.canChecklist ||
                                      c.status == 'PASSED' ||
                                      _busy
                                  ? null
                                  : (_) => unawaited(
                                      _run(
                                        () => _repo.tickItem(l.id, c.id, {
                                          'status': 'PASSED',
                                        }),
                                        l10n.cpDoneTick,
                                      ),
                                    ),
                            ),
                          const SizedBox(height: Space.sm),
                          PrimaryButton(
                            label: l10n.cpActFile,
                            loading: _busy,
                            onPressed:
                                _busy ||
                                    !m.canAdvance ||
                                    r.checklist.any(
                                      (c) => c.status == 'PENDING',
                                    ) ||
                                    (r.feeAmount > 0 && !r.fundApproved)
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.act(l.id, 'advance'),
                                      l10n.cpDoneAdvance,
                                    ),
                                  ),
                          ),
                        ],

                        if (r != null && r.stage == 'APPLICATION_FILED') ...[
                          PrimaryButton(
                            label: l10n.cpActInspect,
                            loading: _busy,
                            onPressed: _busy || !m.canAdvance
                                ? null
                                : () => unawaited(_openBookInspection(l)),
                          ),
                        ],

                        if (r != null && r.stage == 'FIELD_INSPECTION') ...[
                          if (r.inspectorName != null) ...[
                            Text(
                              r.inspectorName!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(height: Space.sm),
                          ],
                          PrimaryButton(
                            label: l10n.cpActFindings,
                            loading: _busy,
                            onPressed: _busy || !m.canAdvance
                                ? null
                                : () => unawaited(_openFindings(l)),
                          ),
                        ],

                        if (r != null && r.stage == 'MINISTRY_VETTING') ...[
                          PrimaryButton(
                            label: l10n.cpActComplete,
                            loading: _busy,
                            onPressed: _busy || !m.canAdvance
                                ? null
                                : () => unawaited(_openCertificate(l)),
                          ),
                        ],

                        if (r != null &&
                            r.stage == 'RENEWED' &&
                            r.certificateNo != null)
                          Text(
                            r.certificateNo!,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),

                        if (m.canBack) ...[
                          const SizedBox(height: Space.md),
                          Center(
                            child: TextButton(
                              onPressed: _busy
                                  ? null
                                  : () => unawaited(_openRevert(l)),
                              child: Text(l10n.cpActBack),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

              if (m.canLetter) ...[
                const SizedBox(height: Space.md),
                PrimaryButton.secondary(
                  label: l10n.cpActLetter,
                  loading: _busy,
                  onPressed: _busy ? null : () => unawaited(_openLetter(l)),
                ),
              ],

              if (l.letters.isNotEmpty) ...[
                const SizedBox(height: Space.md),
                for (final letter in l.letters)
                  Padding(
                    padding: const EdgeInsets.only(bottom: Space.sm),
                    child: Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: scheme.outlineVariant),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(Space.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    letter.memoNo,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall,
                                  ),
                                ),
                                StatusPill(
                                  label: _channelLabel(l10n, letter.channel),
                                  tone: StatusTone.info,
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              letter.subject,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            if (letter.parcelId != null)
                              TextButton(
                                onPressed: () => unawaited(
                                  context.push(
                                    AppRoutes.parcelDetail(letter.parcelId!),
                                  ),
                                ),
                                child: Text(l10n.cpTrackParcel),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _PipelineVisualStepper extends StatelessWidget {
  const _PipelineVisualStepper({
    required this.currentStage,
    required this.l10n,
  });

  final String? currentStage;
  final AppL10n l10n;

  static const _codes = [
    'INTERNAL_REVIEW',
    'APPLICATION_FILED',
    'FIELD_INSPECTION',
    'MINISTRY_VETTING',
    'RENEWED',
  ];

  int _currentIndex() {
    if (currentStage == null) return -1;
    final idx = _codes.indexOf(currentStage!);
    return idx >= 0 ? idx : 0;
  }

  @override
  Widget build(BuildContext context) {
    final cur = _currentIndex();
    final scheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        for (var i = 0; i < _codes.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i < cur
                        ? scheme.primary
                        : (i == cur ? scheme.primary : scheme.outlineVariant),
                  ),
                  child: Center(
                    child: i < cur
                        ? Icon(Icons.check, size: 14, color: scheme.onPrimary)
                        : Text(
                            '${i + 1}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: i == cur
                                  ? scheme.onPrimary
                                  : scheme.onSurfaceVariant,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  licenceStageLabel(l10n, _codes[i]),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: i == cur ? FontWeight.bold : FontWeight.normal,
                    color: i == cur ? scheme.primary : scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          if (i < _codes.length - 1)
            Container(
              width: 8,
              height: 2,
              color: i < cur ? scheme.primary : scheme.outlineVariant,
            ),
        ],
      ],
    );
  }
}
