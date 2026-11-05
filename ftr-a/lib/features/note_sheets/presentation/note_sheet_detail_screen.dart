import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
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
  const NoteSheetDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<NoteSheetDetailScreen> createState() =>
      _NoteSheetDetailScreenState();
}

class _NoteSheetDetailScreenState extends ConsumerState<NoteSheetDetailScreen> {
  bool _busy = false;

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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final sheet = ref.watch(noteSheetDetailProvider(widget.id));
    final s = sheet.value;
    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(
          title: Text(s?.fileNo ?? l10n.moduleNoteSheets),
          actions: [
            if (s != null && s.status != 'DRAFT')
              IconButton(
                icon: const Icon(Icons.print_outlined),
                tooltip: l10n.nsPrint,
                onPressed: () => unawaited(_print(s)),
              ),
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
