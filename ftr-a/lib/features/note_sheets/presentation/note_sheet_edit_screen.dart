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
import 'package:bogcl_oneops/features/people/data/people_repository.dart';
import 'package:bogcl_oneops/features/people/domain/person_pick.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _nsTemplates = <(String, String)>[
  (
    'Procurement of critical plant spares and safety valves for Keraniganj Filling Plant to ensure uninterrupted LPG cylinder bottling operations.',
    'কেরানীগঞ্জ ফিলিং প্ল্যান্টের নিরবচ্ছিন্ন এলপিজি সিলিন্ডার বোতলজাতকরণ নিশ্চিত করতে জরুরি প্ল্যান্ট স্পেয়ারস ও সেফটি ভালভ ক্রয় প্রস্তাব।',
  ),
  (
    'Renewal of annual maintenance contract (AMC) for industrial fire-fighting pumps and gas leak detection sensors across plant storage spheres.',
    'প্ল্যান্ট স্টোরেজ স্ফিয়ারের ইন্ডাস্ট্রিয়াল ফায়ার-ফাইটিং পাম্প ও গ্যাস লিক ডিটেকশন সেন্সরের বার্ষিক রক্ষণাবেক্ষণ চুক্তি (AMC) নবায়ন।',
  ),
  (
    'Approval for emergency calibration and hydro-testing equipment replacement required under Department of Explosives compliance guidelines.',
    'বিস্ফোরক পরিদপ্তরের কমপ্লায়েন্স নির্দেশিকা অনুযায়ী জরুরি ক্যালিব্রেশন ও হাইড্রো-টেস্টিং সরঞ্জাম প্রতিস্থাপনের অনুমোদন।',
  ),
  (
    'Administrative expenditure sanction for Head Office IT infrastructure upgrade and enterprise cybersecurity endpoint licensing.',
    'প্রধান কার্যালয়ের আইটি অবকাঠামো উন্নয়ন এবং এন্টারপ্রাইজ সাইবার সিকিউরিটি এন্ডপয়েন্ট লাইসেন্সিংয়ের প্রশাসনিক ব্যয় অনুমোদন।',
  ),
];

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
  late List<RouteSigner> _signers = widget.existing?.signatoryCustom == true
      ? [...widget.existing!.plannedSigners]
      : [];
  late bool _signersCustom = widget.existing?.signatoryCustom ?? false;
  Timer? _previewDebounce;
  bool _busy = false;
  String? _error;

  bool get _returned => widget.existing?.status == 'RETURNED';
  double get _amountValue => double.tryParse(_amount.text.trim()) ?? 0;
  bool get _needsReco {
    final v = PriceVerdict.of(_quotes);
    return v?.recommended != null && !v!.recommendedIsLowest;
  }

  bool get _quotesRequired => _amountValue >= quotesRequiredAbove;

  bool get _isReady =>
      _title.text.trim().length >= 5 &&
      _subject.text.trim().length >= 3 &&
      (_returned || _justification.text.trim().length >= 10) &&
      (!_quotesRequired || _quotes.length >= minQuotes) &&
      (_returned || _signers.isNotEmpty);

  @override
  void initState() {
    super.initState();
    if (!_returned && !_signersCustom) {
      unawaited(_loadPreview());
    }
  }

  @override
  void dispose() {
    _previewDebounce?.cancel();
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
    if (!_returned) 'signatoryUserIds': [for (final s in _signers) s.userId],
    if (!_returned) 'signatoryCustom': _signersCustom,
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
    if (!_returned && !_signersCustom) {
      _previewDebounce?.cancel();
      await _loadPreview();
    }
    if (send && !_returned && _signers.isEmpty) {
      setState(() => _error = l10n.nsRouteNeedOne);
      return;
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
          'SIGNERS_REQUIRED' => l10n.nsRouteNeedOne,
          'SIGNER_SELF' => l10n.nsErrSignerSelf,
          'SIGNER_DUPLICATE' => l10n.nsErrSignerDup,
          'SIGNER_UNKNOWN' => l10n.nsErrSignerMissing,
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

  void _onAmountChanged() {
    setState(() {});
    if (_returned || _signersCustom) return;
    _previewDebounce?.cancel();
    _previewDebounce = Timer(const Duration(milliseconds: 350), () {
      unawaited(_loadPreview());
    });
  }

  Future<void> _loadPreview() async {
    final amount = _amountValue;
    try {
      final list = await ref
          .read(noteSheetRepositoryProvider)
          .routePreview(amount);
      if (!mounted || _signersCustom || _returned || amount != _amountValue) {
        return;
      }
      setState(() => _signers = list);
    } on ApiException {
      // The writer can still add someone.
    }
  }

  void _restoreSuggested() {
    setState(() => _signersCustom = false);
    unawaited(_loadPreview());
  }

  void _removeSigner(int index) {
    if (_signers.length < 2) return;
    setState(() {
      _signers = [..._signers]..removeAt(index);
      _signersCustom = true;
    });
  }

  void _reorderSigners(int oldIndex, int newIndex) {
    setState(() {
      final next = [..._signers];
      final moved = next.removeAt(oldIndex);
      next.insert(newIndex, moved);
      _signers = next;
      _signersCustom = true;
    });
  }

  Future<void> _addSigner() async {
    final l10n = context.l10n;
    final taken = {for (final s in _signers) s.userId};
    final pick = await showModalBottomSheet<PersonPick>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => _AddSignerSheet(
        taken: taken,
        search: (q) => ref.read(peopleRepositoryProvider).search(q),
      ),
    );
    if (!mounted || pick == null) return;
    if (taken.contains(pick.person.userId)) {
      AppToast.show(context, l10n.nsRouteDuplicate, tone: StatusTone.warning);
      return;
    }
    setState(() {
      _signers = [
        ..._signers,
        RouteSigner(
          userId: pick.person.userId,
          name: pick.person.name,
          nameBn: pick.person.nameBn,
          title: pick.person.title,
        ),
      ];
      _signersCustom = true;
    });
  }

  Widget _signersSection(AppL10n l10n, bool bangla) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return _Card(
      title: l10n.nsWhoTitle,
      children: [
        Text(
          _returned
              ? l10n.nsRouteKept
              : _signersCustom
              ? l10n.nsRouteCustom
              : l10n.nsRouteSuggested,
          style: theme.textTheme.bodySmall?.copyWith(
            color: cs.onSurfaceVariant,
          ),
        ),
        if (!_returned) ...[
          const SizedBox(height: Space.sm),
          if (_signers.isEmpty)
            Text(
              l10n.nsRouteEmpty,
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            )
          else
            ReorderableListView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              buildDefaultDragHandles: false,
              onReorderItem: _reorderSigners,
              children: [
                for (var i = 0; i < _signers.length; i++)
                  _signerRow(l10n, bangla, i),
              ],
            ),
          if (_signersCustom)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton(
                onPressed: _restoreSuggested,
                child: Text(l10n.nsRouteRestore),
              ),
            ),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: TextButton.icon(
              onPressed: () => unawaited(_addSigner()),
              icon: const Icon(Icons.person_add_alt, size: 18),
              label: Text(l10n.nsRouteAdd),
            ),
          ),
        ],
      ],
    );
  }

  Widget _signerRow(AppL10n l10n, bool bangla, int index) {
    final signer = _signers[index];
    final last = index == _signers.length - 1;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final job = signer.title ?? '';
    return Material(
      key: ValueKey(signer.userId),
      color: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Space.xs),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ReorderableDragStartListener(
              index: index,
              child: Padding(
                padding: const EdgeInsets.only(top: Space.xs, right: Space.sm),
                child: Icon(
                  Icons.drag_handle,
                  color: cs.onSurfaceVariant,
                  semanticLabel: l10n.nsRouteDrag,
                ),
              ),
            ),
            CircleAvatar(
              radius: 12,
              backgroundColor: cs.primaryContainer,
              child: Text(
                '${index + 1}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: cs.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    signer.display(bangla: bangla),
                    style: theme.textTheme.titleSmall,
                  ),
                  if (job.isNotEmpty)
                    Text(
                      job,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  if (last)
                    Text(
                      l10n.nsRouteCloses,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: cs.primary,
                      ),
                    ),
                ],
              ),
            ),
            if (_signers.length > 1)
              IconButton(
                tooltip: l10n.nsRouteRemove,
                onPressed: () => _removeSigner(index),
                icon: const Icon(Icons.close),
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
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
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
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: _returned ? l10n.nsSendAgain : l10n.nsSend,
        loading: _busy,
        isReady: _isReady,
        errorMessage: _error,
        missingMessage: !_returned && _signers.isEmpty
            ? l10n.nsRouteNeedOne
            : l10n.nsRouteFields,
        secondaryLabel: _returned ? l10n.nsSaveChanges : l10n.nsSaveDraft,
        onSecondaryPressed: () => unawaited(_save(send: false)),
        onPrimaryPressed: () => unawaited(_save(send: true)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            Space.md,
            Space.sm,
            Space.md,
            Space.lg,
          ),
          children: [
            if (returnedWhy != null) ...[
              Container(
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(
                  color: context.bogcl.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(Radii.md),
                  border: Border.all(
                    color: context.bogcl.warning.withValues(alpha: 0.4),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.assignment_return_outlined,
                          size: 18,
                          color: context.bogcl.warning,
                        ),
                        const SizedBox(width: Space.xs),
                        Expanded(
                          child: Text(
                            l10n.nsWhyReturned(
                              returnedWhy.author.display(bangla: bangla),
                            ),
                            style: theme.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.xs),
                    Text(returnedWhy.body),
                  ],
                ),
              ),
              const SizedBox(height: Space.md),
            ],
            _Card(
              title: l10n.nsFieldTitle,
              children: [
                AppTextField(
                  label: l10n.nsFieldTitle,
                  controller: _title,
                  required: true,
                  maxLength: 200,
                  onChanged: (_) => setState(() {}),
                  validator: (v) =>
                      (v ?? '').trim().length < 5 ? l10n.nsErrTitle : null,
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.nsFieldSubject,
                  controller: _subject,
                  required: true,
                  maxLength: 200,
                  onChanged: (_) => setState(() {}),
                  validator: (v) =>
                      (v ?? '').trim().length < 3 ? l10n.nsErrSubject : null,
                ),
                const SizedBox(height: Space.sm),
                EnterpriseDropdownField<String>(
                  label: l10n.nsFieldUrgency,
                  icon: Icons.bolt_outlined,
                  value: _urgency,
                  items: [
                    DropdownMenuItem(
                      value: 'NORMAL',
                      child: Text(l10n.nsUrgNormal),
                    ),
                    DropdownMenuItem(
                      value: 'HIGH',
                      child: Text(l10n.nsUrgHigh),
                    ),
                    DropdownMenuItem(
                      value: 'CRITICAL',
                      child: Text(l10n.nsUrgCritical),
                    ),
                  ],
                  onChanged: (v) => setState(() => _urgency = v ?? _urgency),
                ),
                const SizedBox(height: Space.sm),
                EnterpriseDropdownField<String>(
                  label: l10n.nsFieldConfidentiality,
                  icon: Icons.lock_outline,
                  value: _confidentiality,
                  items: [
                    DropdownMenuItem(
                      value: 'INTERNAL',
                      child: Text(l10n.nsConfInternal),
                    ),
                    DropdownMenuItem(
                      value: 'CONFIDENTIAL',
                      child: Text(l10n.nsConfConfidential),
                    ),
                    DropdownMenuItem(
                      value: 'SECRET',
                      child: Text(l10n.nsConfSecret),
                    ),
                  ],
                  onChanged: (v) =>
                      setState(() => _confidentiality = v ?? _confidentiality),
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: l10n.nsFieldAmount,
                  controller: _amount,
                  helper: l10n.nsFieldAmountHelp,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (_) => _onAmountChanged(),
                ),
                if (!_returned) ...[
                  const SizedBox(height: Space.sm),
                  EnterpriseTemplateDropdown(
                    presets: _nsTemplates,
                    controller: _justification,
                    onPicked: () => setState(() {}),
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: l10n.nsFieldJustification,
                    controller: _justification,
                    required: true,
                    maxLines: 3,
                    maxLength: 10000,
                    onChanged: (_) => setState(() {}),
                    validator: (v) => (v ?? '').trim().length < 10
                        ? l10n.nsErrJustification
                        : null,
                  ),
                ],
              ],
            ),
            _Card(
              title: l10n.nsQuotesTitle,
              children: [
                Text(
                  _quotesRequired ? l10n.nsQuotesNeeded : l10n.nsQuotesOptional,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton.icon(
                    onPressed: _quotes.length >= 6
                        ? null
                        : () => unawaited(_editQuote()),
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(l10n.nsQuoteAdd),
                  ),
                ),
                if (_quotes.isNotEmpty)
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
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            visualDensity: VisualDensity.compact,
                            leading: Radio<int>(value: i),
                            title: Text(
                              q.vendorName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(taka(q.amount, bangla: bangla)),
                            onTap: () => unawaited(_editQuote(i)),
                            trailing: IconButton(
                              icon: const Icon(Icons.close, size: 18),
                              tooltip: l10n.commonCancel,
                              onPressed: () => setState(() {
                                _quotes = [..._quotes]..removeAt(i);
                              }),
                            ),
                          ),
                      ],
                    ),
                  ),
                if (_quotes.isNotEmpty) ...[
                  const SizedBox(height: Space.xs),
                  Text(
                    l10n.nsQuotePickHint,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
                if (_needsReco) ...[
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: l10n.nsRecoNote,
                    controller: _reco,
                    maxLines: 2,
                    maxLength: 1000,
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ],
            ),
            _signersSection(l10n, bangla),
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall),
              const SizedBox(height: Space.sm),
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}

class _AddSignerSheet extends StatefulWidget {
  const _AddSignerSheet({required this.search, required this.taken});

  final Future<List<PersonPick>> Function(String query) search;
  final Set<String> taken;

  @override
  State<_AddSignerSheet> createState() => _AddSignerSheetState();
}

class _AddSignerSheetState extends State<_AddSignerSheet> {
  final _query = TextEditingController();
  Timer? _debounce;
  List<PersonPick> _people = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    unawaited(_run(''));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    super.dispose();
  }

  Future<void> _run(String query) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final people = await widget.search(query);
      if (!mounted) return;
      setState(() {
        _people = [
          for (final p in people)
            if (!widget.taken.contains(p.person.userId)) p,
        ];
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final media = MediaQuery.of(context);
    final height = (media.size.height - media.viewInsets.bottom) * 0.55;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        Space.lg + media.viewInsets.bottom,
      ),
      child: SizedBox(
        height: height.clamp(240, 480),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.nsRouteAdd, style: theme.textTheme.titleMedium),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.nsRouteAddHint,
              controller: _query,
              onChanged: (value) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  unawaited(_run(value.trim()));
                });
              },
            ),
            const SizedBox(height: Space.sm),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                  ? Text(_error!)
                  : _people.isEmpty
                  ? Text(l10n.nsRouteNone)
                  : ListView.builder(
                      itemCount: _people.length,
                      itemBuilder: (context, i) {
                        final person = _people[i];
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(person.person.display(bangla: bangla)),
                          subtitle: Text(
                            person.person.title ?? person.where(bangla: bangla),
                          ),
                          onTap: () => Navigator.pop(context, person),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
