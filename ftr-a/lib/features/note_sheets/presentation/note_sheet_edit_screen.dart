import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/note_sheets/data/note_sheet_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_providers.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/quote_sheet.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Write or fix a note-sheet. [id] null means a new one.
class NoteSheetEditScreen extends ConsumerWidget {
  const NoteSheetEditScreen({this.id, super.key});

  final String? id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    if (id == null) return const _Form();
    final sheet = ref.watch(noteSheetDetailProvider(id!));
    return sheet.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(l10n.nsEditTitle)),
        body: const SkeletonList(),
      ),
      error: (_, _) => Scaffold(
        appBar: AppBar(title: Text(l10n.nsEditTitle)),
        body: ErrorState(
          onRetry: () => ref.invalidate(noteSheetDetailProvider(id!)),
        ),
      ),
      data: (s) => _Form(existing: s),
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({this.existing});

  final NoteSheet? existing;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.existing?.title);
  late final _subject = TextEditingController(text: widget.existing?.subject);
  late final _amount = TextEditingController(
    text: (widget.existing?.amount ?? 0) > 0
        ? widget.existing!.amount!.toStringAsFixed(0)
        : '',
  );
  late final _justification = TextEditingController(
    text: widget.existing?.justification,
  );
  late final _reco = TextEditingController(
    text: widget.existing?.recommendationNote,
  );
  late String _urgency = widget.existing?.urgency ?? 'NORMAL';
  late String _confidentiality = widget.existing?.confidentiality ?? 'INTERNAL';
  late List<Quote> _quotes = [...?widget.existing?.quotes];
  bool _busy = false;
  String? _error;

  bool get _returned => widget.existing?.status == 'RETURNED';
  double get _amountValue => double.tryParse(_amount.text.trim()) ?? 0;
  bool get _needsReco {
    final v = PriceVerdict.of(_quotes);
    return v?.recommended != null && !v!.recommendedIsLowest;
  }

  bool get _quotesRequired => _amountValue >= quotesRequiredAbove;

  @override
  void dispose() {
    _title.dispose();
    _subject.dispose();
    _amount.dispose();
    _justification.dispose();
    _reco.dispose();
    super.dispose();
  }

  Map<String, Object?> _body() => {
    'title': _title.text.trim(),
    'subject': _subject.text.trim(),
    'amount': _amountValue > 0 ? _amountValue : null,
    'urgency': _urgency,
    'confidentiality': _confidentiality,
    if (!_returned) 'justification': _justification.text.trim(),
    'recommendationNote': _needsReco ? _reco.text.trim() : '',
    'quotes': [for (final q in _quotes) q.toJson()],
  };

  /// Quote rules, checked before sending (BR-03-06).
  String? _quoteProblem(AppL10n l10n) {
    if (!_quotesRequired) return null;
    if (_quotes.length < minQuotes) return l10n.nsErrQuotesMin;
    final picked = _quotes.where((q) => q.isRecommended).length;
    if (picked != 1) return l10n.nsErrQuotesPick;
    final lowest = _quotes.map((q) => q.amount).reduce((a, b) => a < b ? a : b);
    final rec = _quotes.firstWhere((q) => q.isRecommended);
    if (rec.amount > lowest && _reco.text.trim().length < 30) {
      return l10n.nsErrQuotesNote;
    }
    return null;
  }

  Future<void> _save({required bool send}) async {
    final l10n = context.l10n;
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;
    if (send) {
      final problem = _quoteProblem(l10n);
      if (problem != null) {
        setState(() => _error = problem);
        return;
      }
    }
    setState(() => _busy = true);
    final repo = ref.read(noteSheetRepositoryProvider);
    try {
      var saved = await repo.save(body: _body(), id: widget.existing?.id);
      if (send) saved = await repo.submit(saved.id);
      ref
        ..invalidate(noteSheetsProvider)
        ..invalidate(noteSheetDetailProvider)
        ..invalidate(approvalInboxProvider)
        ..invalidate(approvalSummaryProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        send ? l10n.nsSent : l10n.nsSaved,
        tone: StatusTone.success,
      );
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = switch (e.rule) {
          'QUOTES_REQUIRED' => l10n.nsErrQuotesMin,
          'RECOMMENDATION_REQUIRED' => l10n.nsErrQuotesPick,
          'RECOMMENDATION_NOTE_REQUIRED' => l10n.nsErrQuotesNote,
          _ =>
            e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
                ? l10n.claimErrOffline
                : l10n.nsErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.nsDeleteConfirm,
      confirmLabel: l10n.nsDeleteDraft,
      destructive: true,
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    try {
      await ref.read(noteSheetRepositoryProvider).delete(widget.existing!.id);
      ref.invalidate(noteSheetsProvider);
      if (!mounted) return;
      context
        ..pop()
        ..pop();
    } on ApiException {
      if (!mounted) return;
      setState(() => _error = l10n.nsErrFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editQuote([int? index]) async {
    final q = await showQuoteSheet(
      context,
      existing: index == null ? null : _quotes[index],
    );
    if (q == null) return;
    setState(() {
      final next = [..._quotes];
      if (index == null) {
        next.add(q);
      } else {
        next[index] = q;
      }
      _quotes = next;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final existing = widget.existing;
    final returnedWhy = existing?.paragraphs
        .where((p) => p.kind == 'RETURN')
        .lastOrNull;

    return Scaffold(
      appBar: AppBar(
        title: Text(existing == null ? l10n.nsNew : l10n.nsEditTitle),
        actions: [
          if (existing != null && existing.status == 'DRAFT')
            IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: l10n.nsDeleteDraft,
              onPressed: _busy ? null : () => unawaited(_delete()),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Space.lg),
          children: [
            if (returnedWhy != null) ...[
              Card(
                color: context.bogcl.warning.withValues(alpha: 0.12),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.nsWhyReturned(
                          returnedWhy.author.display(bangla: bangla),
                        ),
                        style: theme.textTheme.labelLarge,
                      ),
                      const SizedBox(height: Space.xs),
                      Text(returnedWhy.body),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Space.lg),
            ],
            AppTextField(
              label: l10n.nsFieldTitle,
              controller: _title,
              required: true,
              maxLength: 200,
              validator: (v) =>
                  (v ?? '').trim().length < 5 ? l10n.nsErrTitle : null,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.nsFieldSubject,
              controller: _subject,
              required: true,
              maxLength: 200,
              validator: (v) =>
                  (v ?? '').trim().length < 3 ? l10n.nsErrSubject : null,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.nsFieldAmount,
              controller: _amount,
              helper: l10n.nsFieldAmountHelp,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setState(() {}),
            ),
            if (!_returned) ...[
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.nsFieldJustification,
                controller: _justification,
                required: true,
                maxLines: 6,
                maxLength: 10000,
                validator: (v) => (v ?? '').trim().length < 10
                    ? l10n.nsErrJustification
                    : null,
              ),
            ],
            SectionHeader(title: l10n.nsFieldUrgency),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'NORMAL', label: Text(l10n.nsUrgNormal)),
                ButtonSegment(value: 'HIGH', label: Text(l10n.nsUrgHigh)),
                ButtonSegment(
                  value: 'CRITICAL',
                  label: Text(l10n.nsUrgCritical),
                ),
              ],
              selected: {_urgency},
              onSelectionChanged: (s) => setState(() => _urgency = s.first),
            ),
            SectionHeader(title: l10n.nsFieldConfidentiality),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(
                  value: 'INTERNAL',
                  label: Text(l10n.nsConfInternal),
                ),
                ButtonSegment(
                  value: 'CONFIDENTIAL',
                  label: Text(l10n.nsConfConfidential),
                ),
                ButtonSegment(value: 'SECRET', label: Text(l10n.nsConfSecret)),
              ],
              selected: {_confidentiality},
              onSelectionChanged: (s) =>
                  setState(() => _confidentiality = s.first),
            ),
            SectionHeader(
              title: l10n.nsQuotesTitle,
              trailing: TextButton.icon(
                onPressed: _quotes.length >= 6
                    ? null
                    : () => unawaited(_editQuote()),
                icon: const Icon(Icons.add),
                label: Text(l10n.nsQuoteAdd),
              ),
            ),
            Text(
              _quotesRequired ? l10n.nsQuotesNeeded : l10n.nsQuotesOptional,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: Space.sm),
            RadioGroup<int>(
              groupValue: _quotes.indexWhere((q) => q.isRecommended),
              onChanged: (i) => setState(() {
                _quotes = [
                  for (final (n, q) in _quotes.indexed)
                    q.copyWith(isRecommended: n == i),
                ];
              }),
              child: Column(
                children: [
                  for (final (i, q) in _quotes.indexed)
                    Card(
                      child: ListTile(
                        leading: Radio<int>(value: i),
                        title: Text(q.vendorName),
                        subtitle: Text(
                          '${taka(q.amount, bangla: bangla)}\n'
                          '${l10n.nsQuoteMeta(q.deliveryDays, q.warrantyMonths)}',
                        ),
                        isThreeLine: true,
                        onTap: () => unawaited(_editQuote(i)),
                        trailing: IconButton(
                          icon: const Icon(Icons.close),
                          tooltip: l10n.commonCancel,
                          onPressed: () => setState(() {
                            _quotes = [..._quotes]..removeAt(i);
                          }),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (_quotes.isNotEmpty)
              Text(
                l10n.nsQuotePickHint,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            if (_needsReco) ...[
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.nsRecoNote,
                controller: _reco,
                maxLines: 3,
                maxLength: 1000,
              ),
            ],
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: Space.md),
                child: Text(
                  _error!,
                  style: TextStyle(color: context.bogcl.danger),
                ),
              ),
            const SizedBox(height: Space.xl),
            PrimaryButton(
              label: _returned ? l10n.nsSendAgain : l10n.nsSend,
              icon: Icons.send_outlined,
              loading: _busy,
              onPressed: () => unawaited(_save(send: true)),
            ),
            if (!_returned) ...[
              const SizedBox(height: Space.sm),
              PrimaryButton.secondary(
                label: l10n.nsSaveDraft,
                onPressed: _busy ? null : () => unawaited(_save(send: false)),
              ),
            ] else ...[
              const SizedBox(height: Space.sm),
              PrimaryButton.secondary(
                label: l10n.nsSaveChanges,
                onPressed: _busy ? null : () => unawaited(_save(send: false)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
