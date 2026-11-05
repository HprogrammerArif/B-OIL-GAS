import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  Future<void> _advance(Licence l) async {
    final l10n = context.l10n;
    final stage = l.renewal?.stage ?? '';
    final fields = switch (stage) {
      'APPLICATION_FILED' => [('inspectorName', l10n.cpFieldInspector, 1)],
      'FIELD_INSPECTION' => [('auditFindings', l10n.cpFieldFindings, 3)],
      'MINISTRY_VETTING' => [
        ('certificateNo', l10n.cpFieldCert, 1),
        ('newExpiresAt', l10n.cpFieldNewExpiry, 1),
        if (l.feeAmount > 0) ('chalanNo', l10n.cpFieldChalan, 1),
      ],
      _ => <(String, String, int)>[],
    };
    var extra = <String, Object?>{};
    if (fields.isNotEmpty) {
      final b = await _fields(
        title: licenceAdvanceLabel(l10n, stage),
        fields: fields,
      );
      if (b == null) return;
      extra = Map<String, Object?>.from(b);
      if (stage == 'MINISTRY_VETTING') {
        final raw = '${extra['newExpiresAt']}';
        extra['newExpiresAt'] = raw.contains('T')
            ? raw
            : DateTime.tryParse(raw)?.toIso8601String();
      }
    }
    await _run(() => _repo.act(l.id, 'advance', extra), l10n.cpDoneAdvance);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final async = ref.watch(licenceDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleCompliance)),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(licenceDetailProvider(widget.id)),
        ),
        data: (l) {
          final m = l.me;
          final r = l.renewal;
          final who = l.owner?.display(bangla: bangla) ?? '';
          return ListView(
            padding: const EdgeInsets.all(Space.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l.heading(bangla: bangla),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  StatusPill(
                    label: licenceUrgencyLabel(l10n, l.urgency),
                    tone: licenceUrgencyTone(l.urgency),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(l10n.cpWhat),
              Text(
                [
                  l.bodyCode,
                  l.licenceNo,
                  l.siteLabel(bangla: bangla),
                ].join(' · '),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: Space.sm),
              Text(
                l10n.cpWho(
                  who,
                  l.daysToExpiry < 0
                      ? l10n.cpUrgExpired
                      : l10n.cpDays(l.daysToExpiry),
                ),
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.cpWhy),
              const SizedBox(height: Space.sm),
              Text(licenceNextLine(l10n, l, bangla: bangla)),
              if (l.expiresAt != null) ...[
                const SizedBox(height: Space.sm),
                Text(l10n.cpExpires(DateFmt.date(l.expiresAt!, lang))),
              ],
              if (r != null) ...[
                const SizedBox(height: Space.sm),
                Text(
                  l10n.cpRenewLine(
                    licenceStageLabel(l10n, r.stage),
                    '${r.readinessPct}',
                  ),
                ),
              ],
              const SizedBox(height: Space.lg),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  if (m.canRenew)
                    PrimaryButton(
                      expand: false,
                      label: l10n.cpActRenew,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(l.id, 'renewals'),
                                l10n.cpDoneRenew,
                              ),
                            ),
                    ),
                  if (m.canFund)
                    PrimaryButton(
                      expand: false,
                      label: l10n.cpActFund,
                      onPressed: _busy
                          ? null
                          : () => unawaited(
                              _run(
                                () => _repo.act(l.id, 'fund'),
                                l10n.cpDoneFund,
                              ),
                            ),
                    ),
                  if (m.canAdvance)
                    PrimaryButton(
                      expand: false,
                      label: licenceAdvanceLabel(l10n, r?.stage ?? ''),
                      onPressed: _busy ? null : () => unawaited(_advance(l)),
                    ),
                  if (m.canBack)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.cpActBack,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.cpActBack,
                                fields: [('reason', l10n.cpFieldReason, 2)],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(l.id, 'back', b),
                                l10n.cpDoneBack,
                              );
                            },
                    ),
                  if (m.canLetter)
                    PrimaryButton.secondary(
                      expand: false,
                      label: l10n.cpActLetter,
                      onPressed: _busy
                          ? null
                          : () async {
                              final b = await _fields(
                                title: l10n.cpActLetter,
                                fields: [
                                  ('subject', l10n.cpFieldSubject, 1),
                                  ('body', l10n.cpFieldLetter, 3),
                                ],
                              );
                              if (b == null) return;
                              await _run(
                                () => _repo.act(l.id, 'letters', {
                                  ...b,
                                  'channel': 'EMAIL',
                                }),
                                l10n.cpDoneLetter,
                              );
                            },
                    ),
                ],
              ),
              if (r != null) ...[
                const SizedBox(height: Space.lg),
                Text(
                  l10n.cpChecklist,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                for (final c in r.checklist)
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(c.display(bangla: bangla)),
                    value: c.status == 'PASSED',
                    onChanged: !m.canChecklist || c.status == 'PASSED' || _busy
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
              ],
              const SizedBox(height: Space.lg),
              ExpansionTile(
                title: Text(l10n.cpDetails),
                children: [
                  ListTile(
                    title: Text(l10n.cpPassport),
                    subtitle: Text(
                      [l.ref, l.licenceNo, l.bodyCode].join(' · '),
                    ),
                  ),
                  if (l.feeAmount > 0)
                    ListTile(
                      title: Text(l10n.cpFieldFee),
                      subtitle: Text(licenceTaka(l.feeAmount, bangla: bangla)),
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
