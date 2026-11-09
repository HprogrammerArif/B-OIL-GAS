import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_pass.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

class VisitorDetailScreen extends ConsumerStatefulWidget {
  const VisitorDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<VisitorDetailScreen> createState() =>
      _VisitorDetailScreenState();
}

class _VisitorDetailScreenState extends ConsumerState<VisitorDetailScreen> {
  bool _busy = false;

  VisitorRepository get _repo => ref.read(visitorRepositoryProvider);

  void _refresh() => ref
    ..invalidate(visitDetailProvider)
    ..invalidate(visitsProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'PPE_NOT_CLEARED' => l10n.visErrPpe,
      'ESCORT_REQUIRED' => l10n.visErrEscort,
      'WATCHLIST_HIT' => l10n.visErrWatchlist,
      'VISITOR_BLACKLISTED' => l10n.visErrBlacklist,
      'SITE_FULL' => l10n.visErrFull,
      'EXTEND_LIMIT' => l10n.visErrExtend,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : l10n.visErrFailed,
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

  Future<void> _confirm(
    Visit v,
    String verb,
    String title,
    String msg,
    String done,
  ) async {
    final ok = await showConfirmSheet(
      context,
      title: title,
      message: msg,
      confirmLabel: title,
    );
    if (!ok || !mounted) return;
    await _run(() => _repo.act(v.id, verb), done);
  }

  Future<void> _reason(Visit v, String verb, String title, String done) async {
    final c = TextEditingController();
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
            AppTextField(
              label: context.l10n.visFieldReason,
              controller: c,
              maxLines: 3,
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: title,
              onPressed: () => Navigator.pop(ctx, {'reason': c.text.trim()}),
            ),
          ],
        ),
      ),
    );
    if (body == null || !mounted) return;
    await _run(() => _repo.act(v.id, verb, body), done);
  }

  Future<void> _checkIn(Visit v) async {
    final l10n = context.l10n;
    String? photoId;
    var nda = false;
    var brief = false;
    var uploading = false;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => Padding(
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
              Text(
                l10n.visSheetCheckIn,
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.xs),
              Text(l10n.visSheetCheckInHelp),
              const SizedBox(height: Space.md),
              OutlinedButton.icon(
                onPressed: uploading
                    ? null
                    : () async {
                        final picked = await pickAttachment(
                          ctx,
                          allowFiles: false,
                        );
                        if (picked == null) return;
                        set(() => uploading = true);
                        try {
                          final up = ref.read(uploadServiceProvider);
                          final meta = await up.upload(
                            picked,
                            purpose: 'PHOTO',
                          );
                          await up.awaitClean(meta.id);
                          photoId = meta.id;
                        } finally {
                          set(() => uploading = false);
                        }
                      },
                icon: Icon(
                  photoId == null ? Icons.photo_camera_outlined : Icons.check,
                ),
                label: Text(
                  photoId == null ? l10n.visPhotoRequired : l10n.visPhotoAdded,
                ),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.visFieldNda),
                value: nda,
                onChanged: (x) => set(() => nda = x),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.visFieldBriefing),
                value: brief,
                onChanged: (x) => set(() => brief = x),
              ),
              PrimaryButton(
                label: l10n.visActCheckIn,
                onPressed: photoId == null
                    ? null
                    : () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );
    if (ok != true || photoId == null || !mounted) return;
    await _run(
      () => _repo.act(v.id, 'check-in', {
        'photoFileId': photoId,
        'ndaSigned': nda,
        'safetyBriefingDone': brief,
      }),
      l10n.visDoneCheckIn,
    );
  }

  Future<void> _ppe(Visit v) async {
    final l10n = context.l10n;
    final flags = {
      'hardHat': false,
      'shoes': false,
      'hiVisVest': false,
      'goggles': false,
      'h2sBriefing': false,
    };
    final ok = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => Padding(
          padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.visSheetPpe,
                      style: Theme.of(ctx).textTheme.titleLarge,
                    ),
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.flash_on, size: 16),
                    label: Text(
                      context.isBangla ? 'সব পাস (ডেমো)' : 'Approve All (Demo)',
                    ),
                    onPressed: () {
                      set(() {
                        flags['hardHat'] = true;
                        flags['shoes'] = true;
                        flags['hiVisVest'] = true;
                        flags['goggles'] = true;
                        flags['h2sBriefing'] = true;
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              Text(l10n.visSheetPpeHelp),
              for (final e in [
                ('hardHat', l10n.visPpeHat),
                ('shoes', l10n.visPpeShoes),
                ('hiVisVest', l10n.visPpeVest),
                if (v.escortRequired) ('goggles', l10n.visPpeGoggles),
                if (v.escortRequired) ('h2sBriefing', l10n.visPpeH2s),
              ])
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(e.$2),
                  value: flags[e.$1],
                  onChanged: (x) => set(() => flags[e.$1] = x ?? false),
                ),
              PrimaryButton(
                label: l10n.visActPpe,
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );
    if (ok != true || !mounted) return;
    await _run(() => _repo.act(v.id, 'ppe', flags), l10n.visDonePpe);
  }

  void _showPassDispatchSheet(Visit v) {
    final bangla = context.isBangla;
    unawaited(
      showModalBottomSheet<void>(
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
              Row(
                children: [
                  const Icon(Icons.send_to_mobile, color: Colors.teal),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'ডিজিটাল গেট পাস প্রেরণ (মাল্টি-চ্যানেল)'
                        : 'Multi-Channel Gate Pass Dispatch',
                    style: Theme.of(ctx).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'অতিথির কাছে কিউআর কোডসহ প্রবেশপত্র সরাসরি বার্তা হিসেবে পাঠান।'
                    : 'Dispatch verified digital gate pass with QR clearance to visitor.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),

              // Summary
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.teal.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pass No: ${v.visitNo} · ${v.guest.fullName}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Site: ${v.site.name} · Org: ${v.guest.organisation ?? "Individual"}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    if (v.guest.phoneMasked != null)
                      Text(
                        'Recipient: ${v.guest.phoneMasked}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: Space.md),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF25D366),
                  child: Icon(Icons.chat, color: Colors.white, size: 20),
                ),
                title: Text(
                  bangla
                      ? 'হোয়াটসঅ্যাপে প্রেরণ (WhatsApp QR)'
                      : 'Send via WhatsApp (Instant QR)',
                ),
                subtitle: Text(v.guest.phoneMasked ?? '+880 1711-XXXXXX'),
                onTap: () {
                  Haptics.heavy();
                  Navigator.pop(ctx);
                  unawaited(_openPassChannel(v, 'whatsapp'));
                },
              ),
              const Divider(height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: Icon(Icons.sms, color: Colors.white, size: 20),
                ),
                title: Text(
                  bangla
                      ? 'এসএমএস গেটওয়ে দিয়ে পাঠান (SMS)'
                      : 'Send via Official SMS Gateway',
                ),
                subtitle: const Text(
                  'BOGCL Gate Pass Link & 4-Digit Entry PIN',
                ),
                onTap: () {
                  Haptics.heavy();
                  Navigator.pop(ctx);
                  unawaited(_openPassChannel(v, 'sms'));
                },
              ),
              const Divider(height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Colors.indigo,
                  child: Icon(Icons.email, color: Colors.white, size: 20),
                ),
                title: Text(
                  bangla
                      ? 'অফিসিয়াল ইমেইলে প্রেরণ (PDF E-Pass)'
                      : 'Send via Official Email (PDF Pass)',
                ),
                subtitle: const Text('security.gate@bashundharagroup.com'),
                onTap: () {
                  Haptics.heavy();
                  Navigator.pop(ctx);
                  unawaited(_openPassChannel(v, 'email'));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openPassChannel(Visit v, String channel) async {
    final phone = (v.guest.phone ?? '').replaceAll(RegExp(r'\D'), '');
    final text =
        'BOGCL gate pass ${v.visitNo} for ${v.guest.fullName}. Site: ${v.site.name}.';
    final Uri uri;
    if (channel == 'email') {
      uri = Uri.parse(
        'mailto:?subject=${Uri.encodeComponent('Gate pass ${v.visitNo}')}&body=${Uri.encodeComponent(text)}',
      );
    } else {
      if (phone.isEmpty) {
        AppToast.show(
          context,
          context.isBangla
              ? 'এই অতিথির ফোন নম্বর নেই।'
              : 'This visitor has no phone number.',
          tone: StatusTone.danger,
        );
        return;
      }
      uri = channel == 'whatsapp'
          ? Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(text)}')
          : Uri.parse('sms:$phone?body=${Uri.encodeComponent(text)}');
    }
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!mounted || opened) return;
    AppToast.show(
      context,
      context.isBangla
          ? 'এই ফোনে সেই অ্যাপটি খোলা যায়নি।'
          : 'This phone could not open that app.',
      tone: StatusTone.danger,
    );
  }

  Future<void> _logBarrier(Visit v, String plate, bool bangla) async {
    try {
      await _repo.act(v.id, 'findings', {
        'area': 'Gate 1',
        'finding': 'Vehicle $plate admitted at barrier 1.',
        'status': 'OBSERVATION',
      });
      _refresh();
      if (!mounted) return;
      AppToast.show(
        context,
        bangla
            ? 'গেটে যানবাহন প্রবেশ লিপিবদ্ধ হয়েছে।'
            : 'Vehicle entry written on the visit.',
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, e.message, tone: StatusTone.danger);
    }
  }

  Future<void> _escort(Visit v) async {
    final pick = await showPersonPicker(
      context,
      title: context.l10n.visFieldEscort,
    );
    if (pick == null || !mounted) return;
    await _run(
      () => _repo.act(v.id, 'escort', {'escortUserId': pick.person.userId}),
      context.l10n.visDoneEscort,
    );
  }

  Future<void> _extend(Visit v) async {
    final l10n = context.l10n;
    final end = DateTime.now().toUtc().add(const Duration(hours: 2));
    await _run(
      () => _repo.act(v.id, 'extend', {'expectedEndAt': end.toIso8601String()}),
      l10n.visDoneExtend,
    );
  }

  Future<void> _finding(Visit v) async {
    final l10n = context.l10n;
    final area = TextEditingController();
    final note = TextEditingController();
    var status = 'OBSERVATION';
    final body = await showModalBottomSheet<Map<String, Object?>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                l10n.visSheetFinding,
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.md),
              AppTextField(label: l10n.visFieldArea, controller: area),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: l10n.visFieldFinding,
                controller: note,
                maxLines: 3,
              ),
              const SizedBox(height: Space.sm),
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                    value: 'OBSERVATION',
                    label: Text(l10n.visFindObs),
                  ),
                  ButtonSegment(
                    value: 'CRITICAL',
                    label: Text(l10n.visFindCrit),
                  ),
                ],
                selected: {status},
                onSelectionChanged: (s) => set(() => status = s.first),
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: l10n.visActFinding,
                onPressed: () => Navigator.pop(ctx, {
                  'area': area.text.trim(),
                  'finding': note.text.trim(),
                  'status': status,
                }),
              ),
            ],
          ),
        ),
      ),
    );
    if (body == null || !mounted) return;
    await _run(() => _repo.act(v.id, 'findings', body), l10n.visDoneFinding);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final async = ref.watch(visitDetailProvider(widget.id));
    final v = async.value;
    return Scaffold(
      appBar: AppBar(
        title: Text(v?.visitNo ?? l10n.moduleVisitors),
        actions: [
          if (v != null) ...[
            IconButton(
              tooltip: context.isBangla ? 'পাস শেয়ার করুন' : 'Share Gate Pass',
              icon: const Icon(Icons.share_outlined),
              onPressed: () => _showPassDispatchSheet(v),
            ),
            if (v.qrToken != null)
              IconButton(
                tooltip: l10n.visActPass,
                onPressed: () => unawaited(printVisitPass(v)),
                icon: const Icon(Icons.qr_code_2_outlined),
              ),
          ],
        ],
      ),
      bottomNavigationBar: v == null ? null : _bar(v),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(visitDetailProvider(widget.id)),
        ),
        data: (v) => RefreshIndicator(
          onRefresh: () async {
            _refresh();
            await ref.read(visitDetailProvider(widget.id).future);
          },
          child: _Body(
            visit: v,
            onPpeApprove: () => unawaited(_ppe(v)),
            onLogFinding: (area, text, status) => unawaited(
              _run(
                () => _repo.act(v.id, 'findings', {
                  'area': area,
                  'finding': text,
                  'status': status,
                }),
                l10n.visDoneFinding,
              ),
            ),
            onBarrier: (plate) =>
                unawaited(_logBarrier(v, plate, context.isBangla)),
          ),
        ),
      ),
    );
  }

  Widget? _bar(Visit v) {
    final l10n = context.l10n;
    final m = v.me;
    final actions = <(String, VoidCallback)>[
      if (m.canClearWatchlist)
        (
          l10n.visActClearWatch,
          () => unawaited(
            _run(
              () => _repo.act(v.id, 'watchlist', {'action': 'clear'}),
              l10n.visDoneWatch,
            ),
          ),
        ),
      if (m.canApprove)
        (
          l10n.visActApprove,
          () => unawaited(
            _confirm(
              v,
              'approve',
              l10n.visActApprove,
              l10n.visApproveMsg,
              l10n.visDoneApprove,
            ),
          ),
        ),
      if (m.canPpe && v.ppeRequired && !v.ppeCleared)
        (l10n.visActPpe, () => unawaited(_ppe(v))),
      if (m.canEscort && v.escortRequired && v.escort == null)
        (l10n.visActEscort, () => unawaited(_escort(v))),
      if (m.canCheckIn) (l10n.visActCheckIn, () => unawaited(_checkIn(v))),
      if (m.canCheckOut)
        (
          l10n.visActCheckOut,
          () => unawaited(
            _confirm(
              v,
              'check-out',
              l10n.visActCheckOut,
              l10n.visCheckOutMsg,
              l10n.visDoneCheckOut,
            ),
          ),
        ),
      if (m.canExtend) (l10n.visActExtend, () => unawaited(_extend(v))),
      if (m.canMusterSafe && v.musterSafeAt == null)
        (
          l10n.visActSafe,
          () => unawaited(
            _run(() => _repo.act(v.id, 'muster-safe'), l10n.visDoneSafe),
          ),
        ),
      if (m.canFinding) (l10n.visActFinding, () => unawaited(_finding(v))),
      if (m.canDeny)
        (
          l10n.visActDeny,
          () =>
              unawaited(_reason(v, 'deny', l10n.visActDeny, l10n.visDoneDeny)),
        ),
      if (m.canCancel)
        (
          l10n.visActCancel,
          () => unawaited(
            _reason(v, 'cancel', l10n.visActCancel, l10n.visDoneCancel),
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
            for (final (i, a) in actions.indexed)
              Padding(
                padding: EdgeInsets.only(top: i == 0 ? 0 : Space.sm),
                child: i == 0
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
}

class _Body extends StatelessWidget {
  const _Body({
    required this.visit,
    required this.onPpeApprove,
    required this.onLogFinding,
    required this.onBarrier,
  });

  final Visit visit;
  final VoidCallback onPpeApprove;
  final void Function(String area, String text, String status) onLogFinding;
  final void Function(String plate) onBarrier;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final theme = Theme.of(context);
    final v = visit;

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
                    runSpacing: Space.xs,
                    children: [
                      StatusPill(
                        label: visitStatusLabel(l10n, v.status),
                        tone: visitStatusTone(v.status),
                      ),
                      StatusPill(
                        label: visitCategoryLabel(l10n, v.category),
                        tone: v.category == 'VIP' || v.category == 'GOVT'
                            ? StatusTone.executive
                            : StatusTone.neutral,
                      ),
                      if (v.watchlistHit)
                        StatusPill(
                          label: l10n.visWatchPill,
                          tone: StatusTone.danger,
                        ),
                      if (v.status == 'OVERDUE')
                        StatusPill(
                          label: l10n.visStatusOverdue,
                          tone: StatusTone.danger,
                        ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  Text(v.guest.fullName, style: theme.textTheme.titleLarge),
                  if (v.guest.organisation != null) Text(v.guest.organisation!),
                  const SizedBox(height: Space.xs),
                  Text(v.purpose, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: Space.md),
                  Text(
                    l10n.visHostLine(
                      v.host.display(bangla: bangla),
                      v.site.label(bangla: bangla),
                    ),
                  ),
                  Text(
                    l10n.visWhenLine(
                      DateFmt.dateTime(v.expectedAt, lang),
                      DateFmt.dateTime(v.expectedEndAt, lang),
                    ),
                  ),
                  if (v.escort != null)
                    Text(l10n.visEscortLine(v.escort!.display(bangla: bangla))),
                  if (v.badgeNo != null) Text(l10n.visBadgeLine(v.badgeNo!)),
                  const Divider(height: Space.xl),
                  Text(
                    visitNextLine(l10n, v, bangla: bangla),
                    style: theme.textTheme.titleSmall,
                  ),
                ],
              ),
            ),
          ),
        ),

        // Permitted Plant Zones Detail Card
        _buildPlantZonesCard(v, bangla, theme),

        // 5-Item Refinery Safety PPE Clearance Card
        if (v.ppeRequired) _build5ItemPpeCard(context, v, bangla, theme),

        // ALPR Vehicle Gate Barrier Simulator
        _buildAlprBarrierCard(context, v, bangla, theme),

        // VIP Protocol & Govt Regulator Inspection Logger
        if (v.category == 'GOVT' || v.category == 'VIP')
          _buildRegulatorFindingsCard(context, v, bangla, theme),

        SectionHeader(title: l10n.visZones),
        for (final z in v.zones)
          ListRow(
            title: z.label(bangla: bangla),
            subtitle: z.level,
            trailing: z.escortRequired
                ? StatusPill(
                    label: l10n.visEscortNeed,
                    tone: StatusTone.warning,
                  )
                : null,
          ),
        if (v.findings.isNotEmpty) ...[
          SectionHeader(title: l10n.visFindings),
          for (final f in v.findings)
            ListRow(
              title: f.finding,
              subtitle: '${f.area} · ${DateFmt.dateTime(f.at, lang)}',
            ),
        ],
        ExpansionTile(
          title: Text(l10n.nsDetails),
          childrenPadding: const EdgeInsets.all(Space.lg),
          children: [
            if (v.guest.phoneMasked != null)
              Text('${l10n.visDetPhone}: ${v.guest.phoneMasked}'),
            if (v.guest.idProofLast4 != null)
              Text(
                '${l10n.visDetId}: ${v.guest.idProofType} ••••${v.guest.idProofLast4}',
              ),
            if (v.vehiclePlate != null)
              Text('${l10n.visDetPlate}: ${v.vehiclePlate}'),
            Text(
              v.ppeRequired
                  ? (v.ppeCleared ? l10n.visPpeOk : l10n.visPpeNeeded)
                  : l10n.visPpeNone,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPlantZonesCard(Visit v, bool bangla, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_outlined, color: Colors.teal),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'অনুমোদিত প্ল্যান্ট অঞ্চলসমূহ (Zone Clearance)'
                        : 'Permitted Plant Zones & Security Tier',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const Divider(height: Space.md),
              for (final z in v.zones)
                Padding(
                  padding: const EdgeInsets.only(bottom: Space.xs),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: z.level == 'RED'
                              ? Colors.red.shade100
                              : z.level == 'YELLOW'
                              ? Colors.amber.shade100
                              : Colors.green.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          z.level,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: z.level == 'RED'
                                ? Colors.red.shade900
                                : z.level == 'YELLOW'
                                ? Colors.amber.shade900
                                : Colors.green.shade900,
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Text(
                          z.label(bangla: bangla),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      Text(
                        z.escortRequired
                            ? (bangla
                                  ? 'এইচএসই এসকর্ট বাধ্যতামূলক'
                                  : 'Mandatory HSE Escort')
                            : (bangla
                                  ? 'এসকর্ট প্রয়োজন নেই'
                                  : 'Unescorted Access'),
                        style: TextStyle(
                          fontSize: 11,
                          color: z.escortRequired
                              ? Colors.red.shade700
                              : Colors.green.shade700,
                          fontWeight: z.escortRequired
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _build5ItemPpeCard(
    BuildContext context,
    Visit v,
    bool bangla,
    ThemeData theme,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
      child: Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(
          color: v.ppeCleared ? Colors.green.shade50 : Colors.amber.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: v.ppeCleared ? Colors.green.shade300 : Colors.amber.shade400,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        v.ppeCleared
                            ? Icons.verified
                            : Icons.health_and_safety_outlined,
                        color: v.ppeCleared
                            ? Colors.green.shade800
                            : Colors.amber.shade900,
                      ),
                      const SizedBox(width: Space.xs),
                      Flexible(
                        child: Text(
                          bangla
                              ? '৫-দফা রিফাইনারি পিপিই ও নিরাপত্তা ক্লিয়ারেন্স'
                              : '5-Item Refinery PPE & H2S Safety Gate',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: v.ppeCleared
                                ? Colors.green.shade900
                                : Colors.amber.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: Space.xs),
                StatusPill(
                  label: v.ppeCleared ? 'CLEARED' : 'PENDING GATE CHECK',
                  tone: v.ppeCleared ? StatusTone.success : StatusTone.warning,
                ),
              ],
            ),
            const SizedBox(height: Space.xs),
            Text(
              bangla
                  ? 'কেরানীগঞ্জ রিফাইনারি ইয়ার্ডে প্রবেশের জন্য হেলমেট, গগলস, সেফটি বুট, ভেস্ট ও এইচ২এস ব্রিফিং বাধ্যতামূলক।'
                  : 'Mandatory ANSI PPE and H2S safety briefing required before gate admission.',
              style: theme.textTheme.bodySmall,
            ),
            const Divider(height: Space.md),
            // The 5 checklist items
            Wrap(
              spacing: Space.sm,
              runSpacing: 4,
              children: [
                _buildCheckChip('Hard Hat (ANSI Z89.1)', v.ppeCleared),
                _buildCheckChip('Safety Goggles', v.ppeCleared),
                _buildCheckChip('Steel-Toe Boots', v.ppeCleared),
                _buildCheckChip('Hi-Vis Vest', v.ppeCleared),
                _buildCheckChip('H2S Briefing (3m Video)', v.ppeCleared),
              ],
            ),
            if (!v.ppeCleared) ...[
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'সব পিপিই ও ব্রিফিং অনুমোদন করুন (ডেমো)'
                    : 'Approve All PPE & H2S Briefing (Demo)',
                icon: Icons.check_circle_outline,
                onPressed: onPpeApprove,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCheckChip(String label, bool checked) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: checked ? Colors.green.shade100 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: checked ? Colors.green.shade400 : Colors.grey.shade300,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            checked ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 13,
            color: checked ? Colors.green.shade800 : Colors.grey,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: checked ? Colors.green.shade900 : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlprBarrierCard(
    BuildContext context,
    Visit v,
    bool bangla,
    ThemeData theme,
  ) {
    final plate = v.vehiclePlate ?? 'Dhaka Metro-Gha-15-9920';

    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.videocam_outlined, color: Colors.blue),
                        const SizedBox(width: Space.xs),
                        Flexible(
                          child: Text(
                            bangla
                                ? 'এএলপিআর গেট ক্যামেরা সিমুলেটর'
                                : 'ANPR Gate Camera Plate Match',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  const StatusPill(
                    label: '99.4% MATCH',
                    tone: StatusTone.success,
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                'Camera: Keraniganj Refinery Gate #1 (Inbound Logistics)',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: Space.sm),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: Space.sm,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey.shade900,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.directions_car,
                      color: Colors.amber,
                      size: 16,
                    ),
                    const SizedBox(width: Space.xs),
                    Text(
                      plate,
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'সিকিউরিটি বেরিয়ার #১ খুলুন এবং এন্ট্রি লগ করুন'
                    : 'Open Security Barrier #1 & Log Vehicle Entry',
                icon: Icons.meeting_room,
                onPressed: () {
                  Haptics.heavy();
                  onBarrier(plate);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRegulatorFindingsCard(
    BuildContext context,
    Visit v,
    bool bangla,
    ThemeData theme,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.fact_check_outlined, color: Colors.amber),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'সরকারি রেগুলেটর পরিদর্শন পর্যবেক্ষণ লগ'
                        : 'Govt Regulator Inspection Findings Logger',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'পরিদর্শন কর্মকর্তা বিএসটিআই / পরিবেশ অধিদপ্তর এর দ্রুত পরিদর্শন ফলাফল ও নোট সংযুক্ত করুন।'
                    : 'Log inspection findings and statutory compliance notes for BSTI / DoE / Explosives.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: Space.sm),
              Wrap(
                spacing: Space.xs,
                runSpacing: 4,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.check, size: 14),
                    label: const Text(
                      'Sampled TK-102 (Compliant)',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => onLogFinding(
                      'Bitumen Tank TK-102',
                      'Sampled Bitumen 60/70 from TK-102. Viscosity and penetration parameters fully compliant.',
                      'OBSERVATION',
                    ),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.check, size: 14),
                    label: const Text(
                      'ETP Outlet pH 7.2 (OK)',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => onLogFinding(
                      'Central ETP Unit',
                      'Verified ETP discharge outlet. pH 7.2 and dissolved oxygen within DoE permissible limits.',
                      'OBSERVATION',
                    ),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.check, size: 14),
                    label: const Text(
                      'Boiler Safety Valves OK',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => onLogFinding(
                      'Boiler Utility House',
                      'Annual hydrostatic pressure test records inspected. Relief valves certified.',
                      'OBSERVATION',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
