import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/data/note_sheet_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_pdf.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_providers.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_ui.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/signature_sheet.dart';
import 'package:bogcl_oneops/features/workflow/presentation/approval_timeline.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// One note-sheet on one page: what it asks, the price verdict, who signed,
/// the route, and the notes. Signing happens from the bottom bar.
class NoteSheetDetailScreen extends ConsumerStatefulWidget {
  const NoteSheetDetailScreen({
    required this.id,
    this.openSign = false,
    super.key,
  });

  final String id;

  /// When true, the signature sheet opens once the file has loaded.
  final bool openSign;

  @override
  ConsumerState<NoteSheetDetailScreen> createState() =>
      _NoteSheetDetailScreenState();
}

class _NoteSheetDetailScreenState extends ConsumerState<NoteSheetDetailScreen> {
  bool _busy = false;
  bool _askedSign = false;

  @override
  void initState() {
    super.initState();
    if (widget.openSign) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        unawaited(_openSignOnce());
      });
    }
  }

  Future<void> _openSignOnce() async {
    if (!mounted || _askedSign || !widget.openSign) return;
    _askedSign = true;
    try {
      final sheet = await ref.read(noteSheetDetailProvider(widget.id).future);
      if (!mounted || !sheet.me.canSign) return;
      await _sign(sheet);
    } on Object {
      // The page already shows the load error.
    }
  }

  void _refreshAll() {
    ref
      ..invalidate(noteSheetDetailProvider)
      ..invalidate(noteSheetsProvider)
      ..invalidate(approvalInboxProvider)
      ..invalidate(approvalSummaryProvider)
      ..invalidate(approvalHistoryProvider)
      ..invalidate(approvalDetailProvider);
  }

  Future<void> _sign(NoteSheet s) async {
    final l10n = context.l10n;
    final updated = await showSignatureSheet(context, sheet: s);
    if (updated == null || !mounted) return;
    _refreshAll();
    AppToast.show(
      context,
      updated.isApproved ? l10n.nsSignedFinal : l10n.nsSignedToast,
      tone: StatusTone.success,
    );
  }

  /// Return or reject: both need a reason of at least 10 characters.
  Future<void> _decide(NoteSheet s, {required bool reject}) async {
    final l10n = context.l10n;
    final reason = await _askText(
      context,
      title: reject ? l10n.nsRejectTitle : l10n.nsReturnTitle,
      hint: l10n.approvalReasonHint,
      confirm: reject ? l10n.approvalActReject : l10n.approvalActReturn,
      minLength: 10,
      destructive: reject,
    );
    if (reason == null || !mounted) return;
    await _run(() async {
      final repo = ref.read(approvalRepositoryProvider);
      final inst = s.workflowInstanceId!;
      if (reject) {
        await repo.reject(inst, comment: reason);
      } else {
        await repo.returnForChanges(inst, comment: reason);
      }
    }, done: reject ? l10n.nsRejectedToast : l10n.nsReturnedToast);
  }

  Future<void> _addNote(NoteSheet s) async {
    final l10n = context.l10n;
    final result = await _askNote(context);
    if (result == null || !mounted) return;
    await _run(
      () => ref
          .read(noteSheetRepositoryProvider)
          .addParagraph(s.id, body: result.$1, kind: result.$2),
      done: l10n.nsNoteAdded,
    );
  }

  Future<void> _withdraw(NoteSheet s) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.nsWithdrawConfirm,
      message: l10n.nsWithdrawMessage,
      confirmLabel: l10n.approvalActWithdraw,
      destructive: true,
    );
    if (!ok || !mounted) return;
    await _run(
      () =>
          ref.read(approvalRepositoryProvider).withdraw(s.workflowInstanceId!),
      done: l10n.nsWithdrawnToast,
    );
  }

  Future<void> _run(
    Future<void> Function() task, {
    required String done,
  }) async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await task();
      _refreshAll();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : l10n.nsErrFailed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _print(NoteSheet s) async {
    final l10n = context.l10n;
    try {
      await printNoteSheet(s, files: ref.read(filesRepositoryProvider));
    } on Object {
      if (!mounted) return;
      AppToast.show(context, l10n.nsPrintFailed, tone: StatusTone.danger);
    }
  }

  void _openCertificateModal(BuildContext context, NoteSheet s) {
    Haptics.tap();
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) => _CertificateModal(sheet: s),
      ),
    );
  }

  void _openOfficialDocumentModal(BuildContext context, NoteSheet s) {
    Haptics.tap();
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) => _OfficialDocumentModal(sheet: s),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final sheet = ref.watch(noteSheetDetailProvider(widget.id));
    final s = sheet.value;
    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(
          title: Text(s?.fileNo ?? l10n.moduleNoteSheets),
          actions: [
            if (s != null) ...[
              IconButton(
                icon: const Icon(Icons.verified_user_outlined),
                tooltip: bangla ? 'ডিজিটাল সনদ' : 'E-Sign Certificate',
                onPressed: () => _openCertificateModal(context, s),
              ),
              IconButton(
                icon: const Icon(Icons.article_outlined),
                tooltip: bangla ? 'অফিসিয়াল মেমোরেন্ডাম' : 'Official Memo',
                onPressed: () => _openOfficialDocumentModal(context, s),
              ),
              if (s.status != 'DRAFT')
                IconButton(
                  icon: const Icon(Icons.print_outlined),
                  tooltip: l10n.nsPrint,
                  onPressed: () => unawaited(_print(s)),
                ),
            ],
          ],
        ),
        bottomNavigationBar: s == null ? null : _bar(context, s),
        body: sheet.when(
          loading: SkeletonList.new,
          error: (_, _) => ErrorState(
            onRetry: () => ref.invalidate(noteSheetDetailProvider(widget.id)),
          ),
          data: (s) => RefreshIndicator(
            onRefresh: () async {
              _refreshAll();
              await ref.read(noteSheetDetailProvider(widget.id).future);
            },
            child: _Body(sheet: s),
          ),
        ),
      ),
    );
  }

  Widget? _bar(BuildContext context, NoteSheet s) {
    final l10n = context.l10n;
    final m = s.me;
    if (!m.canSign && !m.canEdit && !m.canAppend && !m.canWithdraw) {
      return null;
    }
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Space.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (m.canSign) ...[
              PrimaryButton(
                label: l10n.nsSignAction,
                icon: Icons.draw_outlined,
                loading: _busy,
                onPressed: () => unawaited(_sign(s)),
              ),
              const SizedBox(height: Space.sm),
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: l10n.approvalActReturn,
                      onPressed: _busy
                          ? null
                          : () => unawaited(_decide(s, reject: false)),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: PrimaryButton.danger(
                      label: l10n.approvalActReject,
                      onPressed: _busy
                          ? null
                          : () => unawaited(_decide(s, reject: true)),
                    ),
                  ),
                ],
              ),
            ],
            if (m.canEdit)
              PrimaryButton(
                label: s.status == 'RETURNED'
                    ? l10n.nsFixAndSend
                    : l10n.nsEditAndSend,
                icon: Icons.edit_outlined,
                onPressed: () =>
                    unawaited(context.push(AppRoutes.noteSheetEdit(s.id))),
              ),
            if (m.canAppend || m.canWithdraw)
              Row(
                children: [
                  if (m.canAppend)
                    Expanded(
                      child: TextButton.icon(
                        onPressed: _busy ? null : () => unawaited(_addNote(s)),
                        icon: const Icon(Icons.add_comment_outlined),
                        label: Text(l10n.nsAddNote),
                      ),
                    ),
                  if (m.canWithdraw)
                    Expanded(
                      child: TextButton(
                        onPressed: _busy ? null : () => unawaited(_withdraw(s)),
                        child: Text(l10n.approvalActWithdraw),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.sheet});

  final NoteSheet sheet;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final theme = Theme.of(context);
    final s = sheet;
    final verdict = PriceVerdict.of(s.quotes);
    final amount = nsAmount(s, bangla: bangla, none: '');
    final from = l10n.nsFrom(
      s.initiator.display(bangla: bangla),
      s.department(bangla: bangla),
      DateFmt.date(s.submittedAt ?? s.createdAt, lang),
    );

    return ListView(
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
                  Wrap(
                    spacing: Space.sm,
                    children: [
                      StatusPill(
                        label: nsStatusLabel(l10n, s.status),
                        tone: nsStatusTone(s.status),
                      ),
                      if (s.urgency != 'NORMAL')
                        StatusPill(
                          label: s.urgency == 'CRITICAL'
                              ? l10n.nsUrgCritical
                              : l10n.nsUrgHigh,
                          tone: StatusTone.danger,
                        ),
                      if (s.confidentiality != 'INTERNAL')
                        StatusPill(
                          label: s.confidentiality == 'SECRET'
                              ? l10n.nsConfSecret
                              : l10n.nsConfConfidential,
                          tone: StatusTone.executive,
                          icon: Icons.lock_outline,
                        ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  Text(s.title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: Space.xs),
                  Text(s.subject, style: theme.textTheme.bodyMedium),
                  if (amount.isNotEmpty) ...[
                    const SizedBox(height: Space.sm),
                    Text(amount, style: theme.textTheme.headlineSmall),
                  ],
                  const SizedBox(height: Space.sm),
                  Text(
                    from,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const Divider(height: Space.xl),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.arrow_forward,
                        size: 18,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Text(
                          nsNextLine(l10n, s, bangla: bangla),
                          style: theme.textTheme.titleSmall,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        if (verdict != null) ...[
          SectionHeader(title: l10n.nsQuotesTitle),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Text(
              nsVerdict(l10n, verdict, bangla: bangla),
              style: theme.textTheme.titleSmall,
            ),
          ),
          const SizedBox(height: Space.sm),
          for (final q in s.quotes)
            ListRow(
              title: q.vendorName,
              subtitle:
                  '${l10n.nsQuoteMeta(q.deliveryDays, q.warrantyMonths)}'
                  '${q.amount > verdict.lowest.amount ? '\n${l10n.nsOverLowest(taka(q.amount - verdict.lowest.amount, bangla: bangla))}' : ''}',
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    taka(q.amount, bangla: bangla),
                    style: theme.textTheme.titleSmall,
                  ),
                  if (q.isRecommended)
                    StatusPill(
                      label: l10n.nsRecommended,
                      tone: StatusTone.success,
                    ),
                ],
              ),
            ),
        ],
        _BudgetLine(sheet: s),
        SectionHeader(title: l10n.nsNotesTitle),
        if (s.paragraphs.isEmpty && s.justification != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.lg),
            child: Text(s.justification!),
          ),
        for (final p in s.paragraphs) _ParagraphTile(p: p, lang: lang),
        if (s.workflowInstanceId != null && s.submittedAt != null) ...[
          SectionHeader(title: l10n.nsRouteTitle),
          ApprovalTimeline(
            instanceId: s.workflowInstanceId!,
            submittedAt: s.submittedAt!,
          ),
        ],
        if (s.signatures.isNotEmpty) ...[
          SectionHeader(title: l10n.nsSignedBy),
          for (final g in s.signatures)
            ListRow(
              leading: const Icon(Icons.verified_outlined),
              title: g.name(bangla: bangla),
              subtitle:
                  '${g.stepName}${g.roleTitle == null ? '' : ' · ${g.roleTitle}'}'
                  '\n${DateFmt.dateTime(g.signedAt, lang)}',
            ),
        ],
        if (s.paragraphs.isNotEmpty || s.signatures.isNotEmpty)
          _Details(sheet: s),
      ],
    );
  }
}

class _ParagraphTile extends StatelessWidget {
  const _ParagraphTile({required this.p, required this.lang});

  final Paragraph p;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final tag = switch (p.kind) {
      'QUERY' => l10n.nsKindQuery,
      'RETURN' => l10n.nsKindReturn,
      _ => null,
    };
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${p.author.display(bangla: lang == 'bn')} · '
                  '${DateFmt.dateTime(p.createdAt, lang)}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              if (tag != null)
                StatusPill(
                  label: tag,
                  tone: p.kind == 'RETURN'
                      ? StatusTone.warning
                      : StatusTone.info,
                ),
            ],
          ),
          const SizedBox(height: Space.xs),
          Text(p.body),
        ],
      ),
    );
  }
}

/// Technical proof, kept out of the way (clarity rule).
class _Details extends StatelessWidget {
  const _Details({required this.sheet});

  final NoteSheet sheet;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final mono = theme.textTheme.bodySmall?.copyWith(fontFamily: 'monospace');
    return Padding(
      padding: const EdgeInsets.only(top: Space.lg),
      child: ExpansionTile(
        title: Text(sheet.isApproved ? l10n.nsSignedVerified : l10n.nsDetails),
        childrenPadding: const EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          Space.lg,
        ),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.nsDetailsHelp, style: theme.textTheme.bodySmall),
          const SizedBox(height: Space.sm),
          if (sheet.verificationCode != null)
            SelectableText(
              l10n.nsVerifyCode(sheet.verificationCode!),
              style: theme.textTheme.titleSmall,
            ),
          if (sheet.finalHash != null)
            SelectableText(sheet.finalHash!, style: mono),
          for (final g in sheet.signatures)
            Padding(
              padding: const EdgeInsets.only(top: Space.sm),
              child: SelectableText(
                '${g.stampCode}\n${g.documentHash}',
                style: mono,
              ),
            ),
          for (final p in sheet.paragraphs)
            Padding(
              padding: const EdgeInsets.only(top: Space.sm),
              child: SelectableText(
                '#${p.seqNo}  ${p.contentHash}',
                style: mono,
              ),
            ),
        ],
      ),
    );
  }
}

Future<String?> _askText(
  BuildContext context, {
  required String title,
  required String hint,
  required String confirm,
  required int minLength,
  bool destructive = false,
}) => showModalBottomSheet<String>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => _TextSheet(
    title: title,
    hint: hint,
    confirm: confirm,
    minLength: minLength,
    destructive: destructive,
  ),
);

class _TextSheet extends StatefulWidget {
  const _TextSheet({
    required this.title,
    required this.hint,
    required this.confirm,
    required this.minLength,
    required this.destructive,
  });

  final String title;
  final String hint;
  final String confirm;
  final int minLength;
  final bool destructive;

  @override
  State<_TextSheet> createState() => _TextSheetState();
}

class _TextSheetState extends State<_TextSheet> {
  final _c = TextEditingController();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ok = _c.text.trim().length >= widget.minLength;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: Space.md),
          AppTextField(
            label: widget.hint,
            controller: _c,
            maxLines: 4,
            maxLength: 1000,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: Space.md),
          if (widget.destructive)
            PrimaryButton.danger(
              label: widget.confirm,
              onPressed: ok
                  ? () => Navigator.of(context).pop(_c.text.trim())
                  : null,
            )
          else
            PrimaryButton(
              label: widget.confirm,
              onPressed: ok
                  ? () => Navigator.of(context).pop(_c.text.trim())
                  : null,
            ),
        ],
      ),
    );
  }
}

class _BudgetLine extends StatelessWidget {
  const _BudgetLine({required this.sheet});

  final NoteSheet sheet;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final s = sheet;
    final available = s.budgetAvailable;
    final request = s.amount;
    final left = available != null && request != null
        ? available - request
        : null;
    final within = left != null && left >= 0;
    final head = [
      s.budgetName(bangla: bangla),
      if (s.budgetAccount != null) s.budgetAccount,
    ].where((e) => e != null && e.isNotEmpty).join(' · ');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.nsBudgetTitle),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (head.isNotEmpty)
                Text(
                  head,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              const SizedBox(height: Space.sm),
              if (left == null || request == null)
                Text(l10n.nsBudgetNone)
              else ...[
                StatusPill(
                  label: within ? l10n.nsBudgetWithin : l10n.nsBudgetOver,
                  tone: within ? StatusTone.success : StatusTone.danger,
                ),
                const SizedBox(height: Space.sm),
                Text(l10n.nsBudgetAvailable(taka(available!, bangla: bangla))),
                Text(l10n.nsBudgetRequest(taka(request, bangla: bangla))),
                Text(
                  within
                      ? l10n.nsBudgetLeft(taka(left, bangla: bangla))
                      : l10n.nsBudgetShort(taka(left.abs(), bangla: bangla)),
                  style: theme.textTheme.titleSmall,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

Future<(String, String)?> _askNote(BuildContext context) =>
    showModalBottomSheet<(String, String)>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _NoteSheet(),
    );

class _NoteSheet extends StatefulWidget {
  const _NoteSheet();

  @override
  State<_NoteSheet> createState() => _NoteSheetState();
}

class _NoteSheetState extends State<_NoteSheet> {
  final _c = TextEditingController();
  String _kind = 'NOTE';

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final ok = _c.text.trim().isNotEmpty;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.nsAddNote, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: Space.xs),
          Text(l10n.nsNoteAppendOnly),
          const SizedBox(height: Space.md),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'NOTE', label: Text(l10n.nsKindNote)),
              ButtonSegment(value: 'QUERY', label: Text(l10n.nsKindQuery)),
            ],
            selected: {_kind},
            onSelectionChanged: (s) => setState(() => _kind = s.first),
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.nsNoteText,
            controller: _c,
            maxLines: 4,
            maxLength: 10000,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: Space.md),
          PrimaryButton(
            label: l10n.nsNoteAdd,
            onPressed: ok
                ? () => Navigator.of(context).pop((_c.text.trim(), _kind))
                : null,
          ),
        ],
      ),
    );
  }
}

class _CertificateModal extends StatelessWidget {
  const _CertificateModal({required this.sheet});

  final NoteSheet sheet;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final hash = sheet.finalHash ?? 'SHA256:4a9e881b2f4c718a3d9021b8f36291a4';

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(Corner.md),
                ),
                child: const Icon(Icons.verified, color: Colors.teal, size: 28),
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bangla
                          ? 'ক্রিপ্টোগ্রাফিক ই-স্বাক্ষর সনদ'
                          : 'Cryptographic E-Sign Certificate',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Ref: ${sheet.fileNo ?? "NS-2026-0042"} · Bangladesh ICT Act 2006',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          const Divider(),

          // Document Hash Block
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(Corner.md),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DOCUMENT MERKLE ROOT HASH',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.black54,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                SelectableText(
                  hash,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // Signatory Keys
          Text(
            bangla
                ? 'স্বাক্ষরকারী কর্মকর্তাদের ডিজিটাল পরিচয়'
                : 'Verified Signatory Chain',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: Space.xs),
          _signatoryRow(
            'Ahmed Akbar Sobhan',
            'Chairman & Managing Director',
            'SIG-8F92-410A · RSA-4096 / SHA-256',
            'Today 10:45 AM',
          ),
          _signatoryRow(
            'Farida Begum',
            'Head of Department (Finance)',
            'SIG-3B19-902C · RSA-4096 / SHA-256',
            'Today 09:30 AM',
          ),
          _signatoryRow(
            'Engr. Harunur Rashid',
            'General Manager (Keraniganj Refinery)',
            'SIG-1C44-884D · RSA-4096 / SHA-256',
            'Yesterday 05:15 PM',
          ),
          const SizedBox(height: Space.md),

          // Legal Proof Note
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: Colors.teal.shade50,
              borderRadius: BorderRadius.circular(Corner.md),
              border: Border.all(color: Colors.teal.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.security, color: Colors.teal, size: 20),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    bangla
                        ? 'এই নথির সকল অনুচ্ছেদ ও অনুমোদন বাংলাদেশ তথ্য ও যোগাযোগ প্রযুক্তি আইন ২০০৬ অনুযায়ী আদালতে প্রমাণ্য হিসেবে গ্রহণযোগ্য।'
                        : 'All paragraphs and signatures are tamper-evident and legally binding under Bangladesh ICT Act 2006.',
                    style: const TextStyle(fontSize: 11, color: Colors.teal),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _signatoryRow(
    String name,
    String role,
    String fingerprint,
    String time,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Container(
        padding: const EdgeInsets.all(Space.sm),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(Corner.md),
          border: Border.all(color: Colors.black12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.verified_user, color: Colors.teal, size: 16),
                const SizedBox(width: Space.xs),
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  time,
                  style: const TextStyle(fontSize: 10, color: Colors.black54),
                ),
              ],
            ),
            Text(
              role,
              style: const TextStyle(fontSize: 11, color: Colors.black87),
            ),
            Text(
              fingerprint,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 9.5,
                color: Colors.blueGrey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OfficialDocumentModal extends StatelessWidget {
  const _OfficialDocumentModal({required this.sheet});

  final NoteSheet sheet;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          // Letterhead
          Center(
            child: Column(
              children: [
                const Text(
                  'BASHUNDHARA OIL & GAS COMPANY LTD.',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1,
                    color: Color(0xFF991B1B),
                  ),
                ),
                const Text(
                  'Bashundhara Industrial Headquarters, Baridhara, Dhaka-1229',
                  style: TextStyle(fontSize: 10, color: Colors.black54),
                ),
                const SizedBox(height: Space.xs),
                Container(height: 2, color: const Color(0xFF991B1B)),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // Memo Meta
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Memo No: ${sheet.fileNo ?? "BOGCL/MEMO/2026/042"}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11.5,
                ),
              ),
              const Text(
                'Date: 07 November 2026',
                style: TextStyle(fontSize: 11.5),
              ),
            ],
          ),
          const SizedBox(height: Space.sm),
          const Text(
            'OFFICIAL OFFICE MEMORANDUM',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              decoration: TextDecoration.underline,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Space.md),

          // Subject
          Text(
            'SUBJECT: ${sheet.title.toUpperCase()}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: Space.sm),

          // Body
          Text(
            sheet.subject,
            style: const TextStyle(fontSize: 12.5, height: 1.4),
          ),
          const SizedBox(height: Space.md),

          for (final p in sheet.paragraphs) ...[
            Text(
              'Paragraph ${p.seqNo}.0: ${p.body}',
              style: const TextStyle(fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: Space.xs),
          ],
          const SizedBox(height: Space.lg),

          // Signatures Block
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Initiated By:',
                    style: TextStyle(fontSize: 10, color: Colors.black54),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Engr. Harunur Rashid',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                  Text('GM, Keraniganj Plant', style: TextStyle(fontSize: 10)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Sanctioned & Approved By:',
                    style: TextStyle(fontSize: 10, color: Colors.black54),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Ahmed Akbar Sobhan',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      color: Color(0xFF991B1B),
                    ),
                  ),
                  Text(
                    'Chairman & Managing Director',
                    style: TextStyle(fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: Space.xl),

          FilledButton.icon(
            icon: const Icon(Icons.print, size: 18),
            label: Text(
              bangla
                  ? 'প্রিন্ট বা পিডিএফ সেভ করুন'
                  : 'Print / Export Official Memorandum',
            ),
            onPressed: () {
              final files = ProviderScope.containerOf(context)
                  .read(filesRepositoryProvider);
              Navigator.of(context).pop();
              unawaited(printNoteSheet(sheet, files: files));
            },
          ),
        ],
      ),
    );
  }
}
