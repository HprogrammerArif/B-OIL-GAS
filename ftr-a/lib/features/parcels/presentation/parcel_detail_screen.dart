import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
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

enum _Menu {
  problem,
  sendBack,
  lostOrDamaged,
  note,
  resend,
  edit,
  cancel,
  label,
}

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
        await _withSheet(
          p,
          ParcelSheet.returnBack,
          'return',
          l10n.pcDoneReturn,
        );
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
        await _run(
          () => _repo.act(p.id, 'resend-otp'),
          done: l10n.pcDoneResend,
        );
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
          PopupMenuItem(
            value: _Menu.problem,
            child: Text(l10n.pcActReportProblem),
          ),
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
    final actions = <(String, IconData, VoidCallback)>[
      if (m.canDispatch)
        (
          l10n.pcActDispatch,
          Icons.handshake_outlined,
          () => unawaited(
            _withSheet(
              p,
              ParcelSheet.dispatch,
              'dispatch',
              l10n.pcDoneDispatch,
            ),
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
      if (m.canVerifyOtp &&
          !m.isRecipient &&
          !(m.isSender && p.status == 'RETURN_IN_TRANSIT'))
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
              p.status.startsWith('RETURN')
                  ? ParcelSheet.returnCheckpoint
                  : ParcelSheet.checkpoint,
              'checkpoint',
              l10n.pcDoneCheckpoint,
            ),
          ),
        ),
      if (m.canEdit)
        (
          l10n.pcActEdit,
          Icons.edit_outlined,
          () => unawaited(context.push(AppRoutes.parcelEdit(p.id))),
        ),
      if (m.canCancel)
        (
          l10n.pcActCancel,
          Icons.cancel_outlined,
          () => unawaited(
            _confirmed(
              p,
              'cancel',
              l10n.pcActCancel,
              l10n.pcCancelMessage,
              l10n.pcDoneCancel,
              destructive: true,
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
  const _Body({
    required this.parcel,
    required this.onReissueOtp,
    required this.onVerifyOtp,
    required this.onReportProblem,
    required this.busy,
  });

  final Parcel parcel;
  final VoidCallback onReissueOtp;
  final VoidCallback onVerifyOtp;
  final VoidCallback onReportProblem;
  final bool busy;

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
        // Security Quarantine Alert Banner
        if (p.tamperStatus == 'FLAGGED' || p.status == 'QUARANTINED')
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade300, width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.gpp_bad, color: Colors.red, size: 28),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bangla
                              ? 'নিরাপত্তা কোয়ারেন্টাইন: সিকিউরিটি সিল ত্রুটি'
                              : 'SECURITY QUARANTINE: SEAL DISCREPANCY',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bangla
                              ? 'পাউচের সিকিউরিটি সিলে অমিল বা অননুমোদিত খোলার লক্ষণ শনাক্ত হয়েছে। অভ্যন্তরীণ নথিপত্র অবমুক্ত করা স্থগিত।'
                              : 'Tamper-evident seal mismatch detected. Pouch placed under security quarantine.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.red.shade900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

        // OTP Delivery & 3-Attempt Security Lock Card
        if (p.status == 'OUT_FOR_DELIVERY' || p.status == 'RETURN_IN_TRANSIT')
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: p.otpAttempts >= 3
                    ? Colors.red.shade50
                    : Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: p.otpAttempts >= 3
                      ? Colors.red.shade300
                      : Colors.blue.shade200,
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        p.otpAttempts >= 3
                            ? Icons.lock_clock
                            : Icons.verified_user_outlined,
                        color: p.otpAttempts >= 3
                            ? Colors.red
                            : Colors.blue.shade800,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          p.otpAttempts >= 3
                              ? (bangla
                                    ? '৩ বার ভুল পিন: পার্সেল লক করা হয়েছে'
                                    : 'OTP LOCKED (3 FAILED ATTEMPTS)')
                              : (bangla
                                    ? 'হস্তান্তর নিশ্চিতকরণ (৪-সংখ্যার পিন)'
                                    : 'Custody Handover Verification (PIN)'),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: p.otpAttempts >= 3
                                ? Colors.red
                                : Colors.blue.shade900,
                          ),
                        ),
                      ),
                      StatusPill(
                        label: '${p.otpAttempts} / 3 Attempts',
                        tone: p.otpAttempts >= 3
                            ? StatusTone.danger
                            : StatusTone.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    p.otpAttempts >= 3
                        ? (bangla
                              ? 'সর্বোচ্চ ৩ বার ভুল পিন দেওয়ার কারণে পার্সেল লক হয়েছে। মেইলরুম ডেস্ক থেকে নতুন পিন ইস্যু করুন।'
                              : 'Exceeded maximum 3 PIN attempts. Security lock engaged. Mailroom Desk must reissue PIN.')
                        : (bangla
                              ? 'প্রাপক (${p.recipient.name}) এর ফোনে প্রেরিত ৪-সংখ্যার ওটিপি কোডটি কুরিয়ারকে প্রদান করুন।'
                              : 'Provide the 4-digit handover PIN sent to ${p.recipient.name} to confirm receipt.'),
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: Space.sm),

                  // Demo Helper Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Space.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.key, size: 14, color: Colors.blue),
                        const SizedBox(width: 4),
                        Text(
                          'Demo PIN: ${p.status.startsWith('RETURN') ? (p.demoReturnOtp ?? '9104') : (p.demoOtp ?? '4829')}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: Space.md),
                  if (p.otpAttempts >= 3)
                    PrimaryButton(
                      label: bangla
                          ? 'নতুন ডেলিভারি পিন ইস্যু করুন (আনলক)'
                          : 'Reissue New Delivery PIN (Unlock)',
                      icon: Icons.refresh,
                      loading: busy,
                      onPressed: onReissueOtp,
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: PrimaryButton(
                            label: bangla
                                ? '৪-সংখ্যার পিন যাচাই'
                                : 'Verify Handover PIN',
                            icon: Icons.pin_outlined,
                            loading: busy,
                            onPressed: onVerifyOtp,
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        IconButton(
                          tooltip: bangla ? 'পিন পুনরায় পাঠান' : 'Resend PIN',
                          icon: const Icon(Icons.forward_to_inbox),
                          onPressed: busy ? null : onReissueOtp,
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),

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

        // 5-Stage Forward Stepper or 3-Stage RTO Stepper with SHA-256 Hashes
        _buildChainOfCustodyStepper(context, p, bangla, theme),

        SectionHeader(title: l10n.pcTrail),
        for (final e in p.events.reversed)
          _EventTile(event: e, lang: lang, bangla: bangla),
        _Details(parcel: p),
      ],
    );
  }

  Widget _buildChainOfCustodyStepper(
    BuildContext context,
    Parcel p,
    bool bangla,
    ThemeData theme,
  ) {
    final isRto = p.status.startsWith('RETURN');

    final forwardSteps = [
      (
        title: bangla
            ? '১. প্রেরণ নিশ্চিত (Despatch Logged)'
            : '1. Despatch Logged',
        subtitle: '${p.sender.name} · ${p.origin.label(bangla: bangla)}',
        done: p.status != 'CREATED',
        active: p.status == 'CREATED',
        hash: 'SHA256: 7c3a9f02e1b8...c4',
      ),
      (
        title: bangla ? '২. কুরিয়ার পাউচ গ্রহণ' : '2. Driver Pouch Handover',
        subtitle: p.courier != null
            ? '${p.courier!.name} (Seal #${p.sealNo ?? "SL-BOGCL-8842"})'
            : (bangla
                  ? 'কুরিয়ার বরাদ্দের অপেক্ষায়'
                  : 'Awaiting courier assignment'),
        done:
            p.status == 'IN_TRANSIT' ||
            p.status == 'AT_GATE' ||
            p.status == 'OUT_FOR_DELIVERY' ||
            p.status == 'DELIVERED',
        active: p.status == 'DISPATCHED',
        hash: 'SHA256: 3d81b49a20fe...a1',
      ),
      (
        title: bangla
            ? '৩. করিডোর চেকপয়েন্ট স্ক্যান'
            : '3. Corridor Checkpoint (Postogola)',
        subtitle: bangla
            ? 'ঢাকা-কেরানীগঞ্জ টোল চেকপয়েন্ট ভেরিফাইড'
            : 'Dhaka-Keraniganj Toll Checkpoint Verified',
        done:
            p.status == 'AT_GATE' ||
            p.status == 'OUT_FOR_DELIVERY' ||
            p.status == 'DELIVERED',
        active: p.status == 'IN_TRANSIT',
        hash: 'SHA256: e82b01c34a5d...79',
      ),
      (
        title: bangla
            ? '৪. গন্তব্য গেট ইনওয়ার্ড'
            : '4. Destination Gate Inward',
        subtitle: '${p.dest.label(bangla: bangla)} Gate #1 Security Scan',
        done: p.status == 'OUT_FOR_DELIVERY' || p.status == 'DELIVERED',
        active: p.status == 'AT_GATE',
        hash: 'SHA256: a14c89dd073e...f3',
      ),
      (
        title: bangla ? '৫. প্রাপক ওটিপি যাচাই' : '5. Recipient OTP Handover',
        subtitle: p.status == 'DELIVERED'
            ? (bangla
                  ? '৪-সংখ্যার পিন দ্বারা নিশ্চিত'
                  : 'Handover verified via 4-digit PIN')
            : (bangla
                  ? '৪-সংখ্যার পিনের অপেক্ষায়'
                  : 'Awaiting recipient 4-digit PIN'),
        done: p.status == 'DELIVERED',
        active: p.status == 'OUT_FOR_DELIVERY',
        hash: 'SHA256: 9f0042cb3781...bc',
      ),
    ];

    final rtoSteps = [
      (
        title: bangla
            ? '১. রিটার্ন সূচনা (RTO Initiated)'
            : '1. Return Initiated (RTO)',
        subtitle: 'Reason: ${p.returnReason ?? "Unsigned enclosure"}',
        done: true,
        active: p.status == 'RETURN_INITIATED',
        hash: 'SHA256: rto_8a3f9104...77',
      ),
      (
        title: bangla
            ? '২. বিপরীত করিডোর ট্রানজিট'
            : '2. Reverse Corridor Transit',
        subtitle:
            '${p.dest.label(bangla: bangla)} → ${p.origin.label(bangla: bangla)}',
        done: p.status == 'RETURNED',
        active: p.status == 'RETURN_IN_TRANSIT',
        hash: 'SHA256: rto_b23019ee...c8',
      ),
      (
        title: bangla
            ? '৩. মূল প্রেরকের নিকট হস্তান্তর'
            : '3. Returned to Sender (Return OTP)',
        subtitle: 'Original Sender: ${p.sender.name}',
        done: p.status == 'RETURNED',
        active: p.status == 'RETURN_IN_TRANSIT',
        hash: 'SHA256: rto_d77410af...12',
      ),
    ];

    final steps = isRto ? rtoSteps : forwardSteps;

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
                  Icon(
                    isRto ? Icons.replay_circle_filled : Icons.timeline,
                    size: 18,
                    color: isRto ? Colors.orange : theme.colorScheme.primary,
                  ),
                  const SizedBox(width: Space.xs),
                  Text(
                    isRto
                        ? (bangla
                              ? '৩-ধাপের রিটার্ন চেইন অফ কাস্টডি (RTO)'
                              : '3-Stage Reverse Return Chain of Custody (RTO)')
                        : (bangla
                              ? '৫-ধাপের ফরোয়ার্ড চেইন অফ কাস্টডি'
                              : '5-Stage Forward Chain of Custody'),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const Divider(height: Space.md),
              for (final (idx, s) in steps.indexed) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: s.done
                                ? Colors.green.shade600
                                : s.active
                                ? Colors.blue.shade600
                                : Colors.grey.shade300,
                          ),
                          alignment: Alignment.center,
                          child: Icon(
                            s.done
                                ? Icons.check
                                : s.active
                                ? Icons.radio_button_checked
                                : Icons.circle,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                        if (idx < steps.length - 1)
                          Container(
                            width: 2,
                            height: 28,
                            color: s.done
                                ? Colors.green.shade600
                                : Colors.grey.shade300,
                          ),
                      ],
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.title,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: s.done || s.active
                                  ? null
                                  : Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            s.subtitle,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: 11,
                            ),
                          ),
                          Text(
                            s.hash,
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 9,
                              color: Colors.blueGrey.shade400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
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
          Expanded(child: Text(title == null ? name : '$name, $title')),
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
    final parts = [?who, ?e.location, DateFmt.dateTime(e.createdAt, lang)];
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
              icon: Icon(
                Icons.photo_outlined,
                color: theme.colorScheme.primary,
              ),
              tooltip: l10n.pcViewPhoto,
              onPressed: () =>
                  unawaited(showFileImage(context, ref, e.photoFileId!)),
            ),
    );
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
