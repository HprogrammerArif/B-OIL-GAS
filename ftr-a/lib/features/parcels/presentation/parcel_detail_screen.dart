import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_label.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_sheets.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Menu { problem, sendBack, lostOrDamaged, note, resend, edit, cancel, label }

/// One parcel: where it is, who has it, what I do next, and the trail.
class ParcelDetailScreen extends ConsumerStatefulWidget {
  const ParcelDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ParcelDetailScreen> createState() => _ParcelDetailScreenState();
}

class _ParcelDetailScreenState extends ConsumerState<ParcelDetailScreen> {
  bool _busy = false;

  ParcelRepository get _repo => ref.read(parcelRepositoryProvider);

  void _refresh() => ref
    ..invalidate(parcelDetailProvider)
    ..invalidate(parcelsProvider);

  String _errorText(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'OTP_INVALID' => l10n.pcErrOtpInvalid,
      'OTP_EXPIRED' => l10n.pcErrOtpExpired,
      'OTP_LOCKED' => l10n.pcErrOtpLocked,
      'OTP_RATE_LIMIT' => l10n.pcErrOtpRate,
      'SEAL_REQUIRED' => l10n.pcErrSeal,
      'PHOTO_REQUIRED' => l10n.pcErrPhotoNeeded,
      'LOST_TOO_EARLY' => l10n.pcErrLostEarly,
      'TAMPER_FLAGGED' => l10n.pcErrFlagged,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : l10n.pcErrFailed,
    };
  }

  Future<void> _run(
    Future<Parcel> Function() call, {
    required String done,
  }) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _errorText(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _withSheet(
    Parcel p,
    ParcelSheet kind,
    String verb,
    String done,
  ) async {
    final body = await showParcelSheet(context, kind: kind, parcel: p);
    if (body == null || !mounted) return;
    await _run(() => _repo.act(p.id, verb, body), done: done);
  }

  Future<void> _confirmed(
    Parcel p,
    String verb,
    String title,
    String message,
    String done, {
    bool destructive = false,
  }) async {
    final ok = await showConfirmSheet(
      context,
      title: title,
      message: message,
      confirmLabel: title,
      destructive: destructive,
    );
    if (!ok || !mounted) return;
    await _run(() => _repo.act(p.id, verb), done: done);
  }

  Future<void> _menu(Parcel p, _Menu m) async {
    final l10n = context.l10n;
    switch (m) {
      case _Menu.problem:
        await _withSheet(p, ParcelSheet.flag, 'flag', l10n.pcDoneProblem);
      case _Menu.sendBack:
        await _withSheet(p, ParcelSheet.returnBack, 'return', l10n.pcDoneReturn);
      case _Menu.lostOrDamaged:
        await _withSheet(
          p,
          ParcelSheet.exception,
          'exception',
          l10n.pcDoneException,
        );
      case _Menu.note:
        await _withSheet(p, ParcelSheet.note, 'note', l10n.pcDoneNote);
      case _Menu.resend:
        await _run(() => _repo.act(p.id, 'resend-otp'), done: l10n.pcDoneResend);
      case _Menu.edit:
        await context.push(AppRoutes.parcelEdit(p.id));
      case _Menu.cancel:
        await _confirmed(
          p,
          'cancel',
          l10n.pcActCancel,
          l10n.pcCancelMessage,
          l10n.pcDoneCancel,
          destructive: true,
        );
      case _Menu.label:
        try {
          await printParcelLabel(p);
        } on Object {
          if (!mounted) return;
          AppToast.show(context, l10n.pcErrLabel, tone: StatusTone.danger);
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final async = ref.watch(parcelDetailProvider(widget.id));
    final p = async.value;
    final m = p?.me;
    final items = <PopupMenuEntry<_Menu>>[
      if (p != null && m != null) ...[
        if (m.canFlag)
          PopupMenuItem(value: _Menu.problem, child: Text(l10n.pcActReportProblem)),
        if (m.canReturn)
          PopupMenuItem(value: _Menu.sendBack, child: Text(l10n.pcActReturn)),
        if (m.canException)
          PopupMenuItem(
            value: _Menu.lostOrDamaged,
            child: Text(l10n.pcActException),
          ),
        if (m.canNote)
          PopupMenuItem(value: _Menu.note, child: Text(l10n.pcActAddNote)),
        if (m.canResendOtp)
          PopupMenuItem(value: _Menu.resend, child: Text(l10n.pcActResend)),
        if (m.canEdit)
          PopupMenuItem(value: _Menu.edit, child: Text(l10n.pcActEdit)),
        if (m.canCancel)
          PopupMenuItem(value: _Menu.cancel, child: Text(l10n.pcActCancel)),
        if (!p.hidden || m.isSender)
          PopupMenuItem(value: _Menu.label, child: Text(l10n.pcActLabel)),
      ],
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(p?.trackingNo ?? l10n.moduleParcels),
        actions: [
          if (p != null && items.isNotEmpty)
            PopupMenuButton<_Menu>(
              tooltip: l10n.pcMore,
              enabled: !_busy,
              onSelected: (v) => unawaited(_menu(p, v)),
              itemBuilder: (_) => items,
            ),
        ],
      ),
      bottomNavigationBar: p == null ? null : _bar(p),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(parcelDetailProvider(widget.id)),
        ),
        data: (p) => RefreshIndicator(
          onRefresh: () async {
            _refresh();
            await ref.read(parcelDetailProvider(widget.id).future);
          },
          child: _Body(parcel: p),
        ),
      ),
    );
  }

  Widget? _bar(Parcel p) {
    final l10n = context.l10n;
    final m = p.me;
    final onRoad = p.status == 'DISPATCHED' || p.status == 'IN_TRANSIT';
    final actions = <(String, IconData, VoidCallback)>[
      if (m.canDispatch)
        (
          l10n.pcActDispatch,
          Icons.handshake_outlined,
          () => unawaited(
            _withSheet(p, ParcelSheet.dispatch, 'dispatch', l10n.pcDoneDispatch),
          ),
        ),
      if (m.canGateIn)
        (
          l10n.pcActGateIn,
          Icons.sensor_door_outlined,
          () => unawaited(
            _withSheet(p, ParcelSheet.gateIn, 'gate-in', l10n.pcDoneGateIn),
          ),
        ),
      if (m.canOutForDelivery)
        (
          l10n.pcActOut,
          Icons.local_shipping_outlined,
          () => unawaited(
            _confirmed(
              p,
              'out-for-delivery',
              l10n.pcActOut,
              l10n.pcOutMessage(p.recipient.name),
              l10n.pcDoneOut,
            ),
          ),
        ),
      if (m.canAccept)
        (
          l10n.pcActReceive,
          Icons.check_circle_outline,
          () => unawaited(
            _confirmed(
              p,
              'accept',
              l10n.pcActReceive,
              l10n.pcReceiveMessage,
              l10n.pcDoneReceive,
            ),
          ),
        ),
      if (m.canVerifyOtp && !m.isRecipient && !(m.isSender && p.status == 'RETURN_IN_TRANSIT'))
        (
          l10n.pcActEnterCode,
          Icons.pin_outlined,
          () => unawaited(
            _withSheet(p, ParcelSheet.verify, 'verify-otp', l10n.pcDoneVerify),
          ),
        ),
      if (m.canCheckpoint)
        (
          l10n.pcActCheckpoint,
          Icons.place_outlined,
          () => unawaited(
            _withSheet(
              p,
              onRoad ? ParcelSheet.checkpoint : ParcelSheet.returnCheckpoint,
              'checkpoint',
              l10n.pcDoneCheckpoint,
            ),
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
                        icon: a.$2,
                        loading: _busy,
                        onPressed: a.$3,
                      )
                    : PrimaryButton.secondary(
                        label: a.$1,
                        icon: a.$2,
                        onPressed: _busy ? null : a.$3,
                      ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.parcel});

  final Parcel parcel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final theme = Theme.of(context);
    final p = parcel;
    final title = p.hidden || p.description == null
        ? l10n.pcConfidentialTitle
        : p.description!;
    final route =
        '${p.origin.label(bangla: bangla)} → ${p.dest.label(bangla: bangla)}';

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
                        label: parcelStatusLabel(l10n, p.status),
                        tone: parcelStatusTone(p.status),
                      ),
                      if (p.urgency != 'NORMAL')
                        StatusPill(
                          label: p.urgency == 'CRITICAL'
                              ? l10n.nsUrgCritical
                              : l10n.nsUrgHigh,
                          tone: StatusTone.danger,
                        ),
                      if (p.isConfidential)
                        StatusPill(
                          label: l10n.nsConfConfidential,
                          tone: StatusTone.executive,
                          icon: Icons.lock_outline,
                        ),
                      if (p.stuck)
                        StatusPill(
                          label: l10n.pcStuckPill(p.dwellHours),
                          tone: StatusTone.danger,
                        ),
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  Text(title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: Space.xs),
                  Text(
                    route,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.md),
                  _Who(label: l10n.pcFrom, person: p.sender, bangla: bangla),
                  _Who(label: l10n.pcTo, person: p.recipient, bangla: bangla),
                  if (p.courier != null)
                    _Who(
                      label: l10n.pcCarriedBy,
                      person: p.courier!,
                      bangla: bangla,
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
                          parcelNextLine(l10n, p, bangla: bangla),
                          style: theme.textTheme.titleSmall,
                        ),
                      ),
                    ],
                  ),
                  if (p.returnNo != null) ...[
                    const SizedBox(height: Space.sm),
                    Text(
                      l10n.pcReturnLine(
                        p.returnNo!,
                        parcelReturnReasonLabel(l10n, p.returnReason ?? ''),
                      ),
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        SectionHeader(title: l10n.pcTrail),
        for (final e in p.events.reversed)
          _EventTile(event: e, lang: lang, bangla: bangla),
        _Details(parcel: p),
      ],
    );
  }
}

class _Who extends StatelessWidget {
  const _Who({required this.label, required this.person, required this.bangla});

  final String label;
  final Person person;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final name = person.display(bangla: bangla);
    final title = person.title;
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(title == null ? name : '$name, $title'),
          ),
        ],
      ),
    );
  }
}

class _EventTile extends ConsumerWidget {
  const _EventTile({
    required this.event,
    required this.lang,
    required this.bangla,
  });

  final ParcelEvent event;
  final String lang;
  final bool bangla;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final e = event;
    final who = e.actor?.display(bangla: bangla);
    final parts = [
      ?who,
      ?e.location,
      DateFmt.dateTime(e.createdAt, lang),
    ];
    return ListRow(
      leading: Icon(parcelEventIcon(e.type)),
      title: parcelEventLabel(l10n, e.type),
      subtitle: [
        parts.join(' · '),
        if (e.note != null && e.note!.isNotEmpty) e.note!,
      ].join('\n'),
      trailing: e.photoFileId == null
          ? null
          : IconButton(
              icon: Icon(Icons.photo_outlined, color: theme.colorScheme.primary),
              tooltip: l10n.pcViewPhoto,
              onPressed: () => unawaited(_showPhoto(context, ref, e.photoFileId!)),
            ),
    );
  }

  Future<void> _showPhoto(BuildContext context, WidgetRef ref, String id) async {
    final l10n = context.l10n;
    try {
      final bytes = await ref.read(filesRepositoryProvider).download(id);
      if (!context.mounted || bytes == null) return;
      await showDialog<void>(
        context: context,
        builder: (_) => Dialog(child: InteractiveViewer(child: Image.memory(bytes))),
      );
    } on ApiException {
      if (!context.mounted) return;
      AppToast.show(context, l10n.pcErrPhotoOpen, tone: StatusTone.danger);
    }
  }
}

/// Reference data and tamper proof, out of the way (clarity rule).
class _Details extends StatelessWidget {
  const _Details({required this.parcel});

  final Parcel parcel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final p = parcel;
    final rows = <(String, String)>[
      (l10n.pcDetCategory, parcelCategoryLabel(l10n, p.category)),
      if (p.waybillNo != null) (l10n.pcDetWaybill, p.waybillNo!),
      if (p.sealNo != null) (l10n.pcDetSeal, p.sealNo!),
      if (p.declaredValue != null)
        (l10n.pcDetValue, taka(p.declaredValue!, bangla: bangla)),
      if (p.weightKg != null) (l10n.pcDetWeight, '${p.weightKg} kg'),
      if (p.specialHandling.isNotEmpty)
        (
          l10n.pcDetHandling,
          p.specialHandling.map((h) => parcelHandlingLabel(l10n, h)).join(', '),
        ),
      if (p.tamperStatus == 'FLAGGED') (l10n.pcDetSeal, l10n.pcSealBroken),
      (l10n.pcDetTrail, p.chainValid ? l10n.pcChainOk : l10n.pcChainBroken),
    ];
    return Padding(
      padding: const EdgeInsets.only(top: Space.lg),
      child: ExpansionTile(
        title: Text(l10n.nsDetails),
        childrenPadding: const EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          Space.lg,
        ),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final (k, v) in rows)
            Padding(
              padding: const EdgeInsets.only(bottom: Space.xs),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '$k: ',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: v),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
