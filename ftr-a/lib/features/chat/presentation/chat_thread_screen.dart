import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  final _text = TextEditingController();
  Timer? _poll;
  bool _busy = false;
  bool _isDirectiveMode = false;
  bool _showPinned = true;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 8), (_) {
      ref.invalidate(chatMessagesProvider(widget.id));
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _text.dispose();
    super.dispose();
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  Future<void> _send() async {
    final body = _text.text.trim();
    if (body.isEmpty) return;
    setState(() => _busy = true);
    try {
      await _repo.send(widget.id, body);
      _text.clear();
      ref
        ..invalidate(chatMessagesProvider(widget.id))
        ..invalidate(chatChannelsProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? context.l10n.emErrFailed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showEncryptedCallModal(String name, String role) {
    final bangla = context.isBangla;
    var muted = false;
    var speaker = true;

    unawaited(
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setCallState) => AlertDialog(
            backgroundColor: BrandColors.slate950,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: Space.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.lock,
                      color: BrandColors.success,
                      size: 14,
                    ),
                    const SizedBox(width: Space.xs),
                    Text(
                      bangla
                          ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড এক্সিকিউটিভ কল'
                          : 'End-to-End Encrypted Executive Call',
                      style: const TextStyle(
                        color: BrandColors.success,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.lg),
                CircleAvatar(
                  radius: 40,
                  backgroundColor: BrandColors.crimson,
                  child: Text(
                    name.isNotEmpty ? name.substring(0, 1) : 'E',
                    style: const TextStyle(
                      fontSize: 32,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: Space.md),
                Text(
                  name,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  role,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: Space.md),
                const Text(
                  '00:42 · HD Secure Audio (256-bit AES)',
                  style: TextStyle(color: Colors.white60, fontSize: 12),
                ),
                const SizedBox(height: Space.xl),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton(
                      icon: Icon(
                        muted ? Icons.mic_off : Icons.mic,
                        color: Colors.white,
                      ),
                      onPressed: () {
                        Haptics.tap();
                        setCallState(() => muted = !muted);
                      },
                    ),
                    IconButton(
                      icon: Icon(
                        speaker ? Icons.volume_up : Icons.volume_down,
                        color: Colors.white,
                      ),
                      onPressed: () {
                        Haptics.tap();
                        setCallState(() => speaker = !speaker);
                      },
                    ),
                    FloatingActionButton(
                      mini: true,
                      backgroundColor: BrandColors.danger,
                      onPressed: () {
                        Haptics.heavy();
                        Navigator.pop(ctx);
                        AppToast.show(
                          context,
                          bangla
                              ? 'কল সমাপ্ত হয়েছে।'
                              : 'Executive call ended.',
                          tone: StatusTone.neutral,
                        );
                      },
                      child: const Icon(Icons.call_end, color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _attachDocument() async {
    final bangla = context.isBangla;
    final pick = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bangla
                    ? 'অফিসিয়াল নথি বা রেকর্ড সংযুক্ত করুন'
                    : 'Attach Official BOGCL Record',
                style: Theme.of(ctx).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.sm),
              ListTile(
                leading: const Icon(
                  Icons.description,
                  color: BrandColors.crimson,
                ),
                title: const Text('Note-Sheet NS-2026-0042'),
                subtitle: const Text(
                  'PMB Processing Plant Reactor Overhaul Budget',
                ),
                onTap: () => Navigator.pop(
                  ctx,
                  'Attached Note-Sheet: NS-2026-0042 (PMB Plant CapEx)',
                ),
              ),
              ListTile(
                leading: const Icon(Icons.science, color: BrandColors.success),
                title: const Text('Bitumen Lab QC Batch B-88'),
                subtitle: const Text(
                  'BDS 1238:2020 Penetration Grade 60/70 Test Certificate',
                ),
                onTap: () => Navigator.pop(
                  ctx,
                  'Attached QC Report: BDS 1238:2020 Grade 60/70 (Batch B-88 Verified)',
                ),
              ),
              ListTile(
                leading: const Icon(
                  Icons.warning_amber,
                  color: BrandColors.warning,
                ),
                title: const Text('HSE Incident INC-2026-003'),
                subtitle: const Text('Flange Joint Gasket Weep at Tank TK-102'),
                onTap: () => Navigator.pop(
                  ctx,
                  'Attached HSE Incident: INC-2026-003 (Tank TK-102 Flange)',
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (pick != null) {
      await _repo.send(widget.id, pick);
      ref.invalidate(chatMessagesProvider(widget.id));
    }
  }

  Future<void> _issueDirectiveSheet() async {
    final bangla = context.isBangla;
    final l10n = context.l10n;

    final presets = [
      (
        'Valve Overhaul',
        'Complete Keraniganj VDU isolation valve overhaul within 6 hours and submit LOTO clearance certificate before evening shift.',
      ),
      (
        'Fast-Track Crude L/C',
        'Fast-track Treasury verification and L/C margin endorsement for 15,000 MT Bitumen feedstock shipment today.',
      ),
      (
        'Emergency Review Meeting',
        'All GMs and Department Heads join emergency operational review at 04:00 PM with updated KPI sheets.',
      ),
      (
        'Stock Position Report',
        'Submit verified Bitumen 60/70 & 80/100 tank-farm stock position and RHD dispatch schedule within 2 hours.',
      ),
    ];

    var selectedPreset = presets.first;
    var isUrgent = true;
    final titleCtrl = TextEditingController(text: selectedPreset.$1);
    final bodyCtrl = TextEditingController(text: selectedPreset.$2);

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
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
                    const Icon(Icons.campaign, color: BrandColors.crimson),
                    const SizedBox(width: Space.sm),
                    Text(
                      bangla
                          ? '⚡ এক্সিকিউটিভ ডিরেক্টিভ জারি করুন'
                          : '⚡ Issue Executive Directive',
                      style: Theme.of(ctx).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'উচ্চ অগ্রাধিকারের নির্দেশাবলী জারি করুন যা সংশ্লিষ্ট বিভাগীয় প্রধানদের দ্বারা বাধ্যতামূলকভাবে প্রাপ্তিস্বীকার করতে হবে।'
                      : 'Binding directive requiring mandatory digital acknowledgment by officers.',
                  style: Theme.of(ctx).textTheme.bodySmall,
                ),
                const SizedBox(height: Space.md),

                Text(
                  bangla
                      ? 'ওয়ান-ট্যাপ টেমপ্লেট নির্বাচন করুন'
                      : 'One-Tap BOGCL Directive Templates',
                  style: Theme.of(ctx).textTheme.labelMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: Space.xs),
                Wrap(
                  spacing: Space.xs,
                  runSpacing: Space.xs,
                  children: [
                    for (final p in presets)
                      ChoiceChip(
                        label: Text(p.$1, style: const TextStyle(fontSize: 11)),
                        selected: selectedPreset.$1 == p.$1,
                        onSelected: (_) {
                          setSheet(() {
                            selectedPreset = p;
                            titleCtrl.text = p.$1;
                            bodyCtrl.text = p.$2;
                          });
                        },
                      ),
                  ],
                ),
                const SizedBox(height: Space.md),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      bangla
                          ? 'জরুরি লাল সতর্কতা (URGENT / RED ALERT)'
                          : 'Priority: URGENT / RED ALERT',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: BrandColors.danger,
                      ),
                    ),
                    Switch(
                      value: isUrgent,
                      activeThumbColor: BrandColors.danger,
                      onChanged: (v) => setSheet(() => isUrgent = v),
                    ),
                  ],
                ),
                const SizedBox(height: Space.sm),

                AppTextField(
                  label: bangla ? 'নির্দেশের শিরোনাম' : 'Directive Title',
                  controller: titleCtrl,
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: bangla
                      ? 'নির্দেশের বিস্তারিত বিবরণ'
                      : 'Directive Action Items',
                  controller: bodyCtrl,
                  maxLines: 3,
                ),
                const SizedBox(height: Space.lg),

                PrimaryButton(
                  label: bangla
                      ? 'ডিরেক্টিভ জারি করুন'
                      : 'Broadcast Executive Directive',
                  onPressed: () => Navigator.pop(ctx, true),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (ok == true) {
      try {
        final prefix = isUrgent ? '[URGENT RED ALERT] ' : '';
        await _repo.issue(widget.id, {
          'title': '$prefix${titleCtrl.text.trim()}',
          'body': bodyCtrl.text.trim(),
        });
        ref.invalidate(chatMessagesProvider(widget.id));
        if (!mounted) return;
        AppToast.show(
          context,
          bangla
              ? 'এক্সিকিউটিভ ডিরেক্টিভ জারি করা হয়েছে।'
              : 'Executive directive broadcasted to command channel.',
          tone: StatusTone.success,
        );
      } on ApiException catch (e) {
        if (!mounted) return;
        AppToast.show(
          context,
          e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
          tone: StatusTone.danger,
        );
      }
    }
    titleCtrl.dispose();
    bodyCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canDir = session?.can('chat:directive-issue') ?? false;
    final ch = ref.watch(chatChannelProvider(widget.id));
    final msgs = ref.watch(chatMessagesProvider(widget.id));
    final channelName =
        ch.asData?.value.heading(bangla: bangla) ?? l10n.moduleChat;

    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(channelName, style: const TextStyle(fontSize: 16)),
              Text(
                bangla ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড' : 'End-to-End Encrypted',
                style: const TextStyle(
                  fontSize: 10,
                  color: BrandColors.success,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: bangla ? 'সিকিউর ভয়েস কল' : 'Secure Call',
              icon: const Icon(Icons.phone_in_talk_outlined),
              onPressed: () => _showEncryptedCallModal(
                channelName,
                'Official Executive Channel',
              ),
            ),
            if (canDir)
              IconButton(
                tooltip: l10n.chActDirective,
                onPressed: () => unawaited(_issueDirectiveSheet()),
                icon: const Icon(Icons.campaign, color: BrandColors.crimson),
              ),
          ],
        ),
        body: Column(
          children: [
            // Pinned Directive Banner
            if (_showPinned)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: BrandColors.crimson.withValues(alpha: 0.08),
                  border: Border(
                    bottom: BorderSide(
                      color: BrandColors.crimson.withValues(alpha: 0.2),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.push_pin,
                      size: 16,
                      color: BrandColors.crimson,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'পিনকৃত ডিরেক্টিভ: কেরানীগঞ্জ ভিডিইউ আইসোলেশন ভালভ ওভারহোল সম্পন্ন করুন (DIR-2026-042)'
                            : 'PINNED: Complete Keraniganj VDU isolation valve overhaul within 6 hours (DIR-2026-042)',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: BrandColors.crimson,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    InkWell(
                      onTap: () => setState(() => _showPinned = false),
                      child: const Icon(
                        Icons.close,
                        size: 14,
                        color: BrandColors.crimson,
                      ),
                    ),
                  ],
                ),
              ),

            // Message Stream
            Expanded(
              child: msgs.when(
                loading: () => const SkeletonList(),
                error: (_, _) => ErrorState(
                  onRetry: () =>
                      ref.invalidate(chatMessagesProvider(widget.id)),
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return EmptyState(message: l10n.chNoMessages);
                  }
                  final last = list.last.id;
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    unawaited(_repo.read(widget.id, last));
                  });
                  return ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.fromLTRB(
                      Space.md,
                      Space.md,
                      Space.md,
                      Space.sm,
                    ),
                    itemCount: list.length,
                    itemBuilder: (ctx, i) {
                      final m = list[list.length - 1 - i];
                      if (m.deleted) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                            vertical: Space.sm,
                          ),
                          child: Center(
                            child: Text(
                              l10n.chDeleted,
                              style: Theme.of(ctx).textTheme.labelSmall,
                            ),
                          ),
                        );
                      }
                      return _EnhancedBubble(
                        message: m,
                        bangla: bangla,
                        busy: _busy,
                        canDirect: canDir,
                        onAck: m.directive == null
                            ? null
                            : () async {
                                Haptics.heavy();
                                await _repo.ack(m.directive!.id);
                                ref.invalidate(chatMessagesProvider(widget.id));
                                if (!context.mounted) return;
                                AppToast.show(
                                  context,
                                  bangla
                                      ? 'ডিরেক্টিভ সফলভাবে প্রাপ্তিস্বীকার করা হয়েছে।'
                                      : 'Executive directive acknowledged with timestamp.',
                                  tone: StatusTone.success,
                                );
                              },
                        onDone: m.directive == null
                            ? null
                            : () async {
                                Haptics.heavy();
                                await _repo.execute(m.directive!.id);
                                ref.invalidate(chatMessagesProvider(widget.id));
                              },
                        onReact: (emoji) async {
                          Haptics.tap();
                          await _repo.react(m.id, emoji);
                          ref.invalidate(chatMessagesProvider(widget.id));
                        },
                      );
                    },
                  );
                },
              ),
            ),

            // Directive Quick Mode Toggle (for executives)
            if (canDir)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 4,
                ),
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(
                            _isDirectiveMode
                                ? Icons.campaign
                                : Icons.chat_bubble_outline,
                            size: 16,
                            color: _isDirectiveMode
                                ? BrandColors.crimson
                                : Colors.grey,
                          ),
                          const SizedBox(width: Space.xs),
                          Flexible(
                            child: Text(
                              _isDirectiveMode
                                  ? (bangla
                                        ? 'মোড: ⚡ এক্সিকিউটিভ ডিরেক্টিভ'
                                        : 'Mode: ⚡ Executive Directive')
                                  : (bangla
                                        ? 'মোড: সাধারণ মেসেজ'
                                        : 'Mode: Standard Message'),
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: _isDirectiveMode
                                    ? BrandColors.crimson
                                    : Colors.grey.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    TextButton(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        Haptics.tap();
                        setState(() => _isDirectiveMode = !_isDirectiveMode);
                        if (_isDirectiveMode) {
                          unawaited(_issueDirectiveSheet());
                        }
                      },
                      child: Text(
                        bangla ? 'মোড পরিবর্তন' : 'Toggle Mode',
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),

            // Composer
            _Composer(
              controller: _text,
              busy: _busy,
              hint: l10n.chHint,
              onSend: _send,
              onAttach: _attachDocument,
              onVoice: () async {
                setState(() => _busy = true);
                try {
                  await _repo.sendVoice(widget.id, 18);
                  ref
                    ..invalidate(chatMessagesProvider(widget.id))
                    ..invalidate(chatChannelsProvider);
                } finally {
                  if (mounted) setState(() => _busy = false);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _EnhancedBubble extends StatelessWidget {
  const _EnhancedBubble({
    required this.message,
    required this.bangla,
    required this.busy,
    required this.canDirect,
    required this.onReact,
    this.onAck,
    this.onDone,
  });

  final ChatMessage message;
  final bool bangla;
  final bool busy;
  final bool canDirect;
  final Future<void> Function(String emoji) onReact;
  final Future<void> Function()? onAck;
  final Future<void> Function()? onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final mine = message.mine;
    final isDirective = message.directive != null;
    final time = message.createdAt == null
        ? null
        : DateFmt.time(message.createdAt!, lang);

    final bg = isDirective
        ? BrandColors.crimson.withValues(alpha: 0.08)
        : (mine
              ? theme.colorScheme.primary.withValues(alpha: 0.12)
              : theme.colorScheme.surface);

    final borderColor = isDirective
        ? BrandColors.crimson.withValues(alpha: 0.5)
        : theme.colorScheme.outlineVariant;

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 330),
        child: Padding(
          padding: const EdgeInsets.only(bottom: Space.sm),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(Corner.md),
              border: Border.all(
                color: borderColor,
                width: isDirective ? 1.5 : 1.0,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!mine && message.sender != null)
                    Text(
                      message.sender!.display(bangla: bangla),
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  const SizedBox(height: 2),

                  // Voice Bubble with Waveform Player
                  if (message.type == 'VOICE' ||
                      (message.body ?? '').startsWith('VOICE:'))
                    _VoiceWaveformBubble(body: message.body ?? 'VOICE:18')
                  else if (isDirective) ...[
                    Row(
                      children: [
                        const Icon(
                          Icons.campaign,
                          color: BrandColors.crimson,
                          size: 18,
                        ),
                        const SizedBox(width: Space.xs),
                        Expanded(
                          child: Text(
                            message.directive!.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: BrandColors.crimson,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      message.directive!.body,
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: Space.xs),
                    Row(
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          size: 14,
                          color: BrandColors.success,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          l10n.chAckCount(
                            message.directive!.acks,
                            message.directive!.needed,
                          ),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (message.directive!.executedAt == null && !mine) ...[
                      const SizedBox(height: Space.sm),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: BrandColors.crimson,
                          foregroundColor: Colors.white,
                          visualDensity: VisualDensity.compact,
                        ),
                        icon: const Icon(Icons.check, size: 14),
                        label: Text(
                          bangla
                              ? 'প্রাপ্তিস্বীকার করুন'
                              : 'Acknowledge Directive',
                        ),
                        onPressed: busy || onAck == null
                            ? null
                            : () => onAck!(),
                      ),
                    ],
                  ] else
                    Text(message.body ?? '', style: theme.textTheme.bodyMedium),

                  const SizedBox(height: Space.xs),

                  // Timestamp & Emoji Reactions
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (message.reactions.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            message.reactions.join(' '),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      if (time != null) ...[
                        if (message.reactions.isNotEmpty)
                          const SizedBox(width: Space.sm),
                        Text(
                          time,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontSize: 10,
                          ),
                        ),
                      ],
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        tooltip: l10n.chReact,
                        onPressed: () => unawaited(_reactSheet(context)),
                        icon: Icon(
                          Icons.add_reaction_outlined,
                          size: 15,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _reactSheet(BuildContext context) async {
    final emoji = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              for (final e in const ['👍', '✅', '⚡', '👁️', '🚨', '🙏'])
                IconButton(
                  onPressed: () => Navigator.pop(ctx, e),
                  icon: Text(e, style: const TextStyle(fontSize: 26)),
                ),
            ],
          ),
        ),
      ),
    );
    if (emoji != null) await onReact(emoji);
  }
}

class _VoiceWaveformBubble extends StatefulWidget {
  const _VoiceWaveformBubble({required this.body});

  final String body;

  @override
  State<_VoiceWaveformBubble> createState() => _VoiceWaveformBubbleState();
}

class _VoiceWaveformBubbleState extends State<_VoiceWaveformBubble> {
  bool _playing = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(
                _playing ? Icons.pause_circle_filled : Icons.play_circle_fill,
                color: BrandColors.crimson,
                size: 30,
              ),
              onPressed: () async {
                Haptics.tap();
                setState(() => _playing = !_playing);
                if (_playing) {
                  await Future<void>.delayed(const Duration(seconds: 4));
                  if (mounted) setState(() => _playing = false);
                }
              },
            ),
            const SizedBox(width: Space.xs),
            Row(
              children: [
                for (var i = 0; i < 18; i++)
                  Container(
                    width: 3,
                    height: (10 + (i % 5) * 4).toDouble(),
                    margin: const EdgeInsets.symmetric(horizontal: 1.5),
                    decoration: BoxDecoration(
                      color: _playing && (i < 10)
                          ? BrandColors.crimson
                          : Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(1.5),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: Space.sm),
            const Text(
              '0:18',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Text(
            'Transcript: "Please verify tank TK-104 valve seal and hydro pressure before evening shift."',
            style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic),
          ),
        ),
      ],
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.busy,
    required this.hint,
    required this.onSend,
    required this.onAttach,
    required this.onVoice,
  });

  final TextEditingController controller;
  final bool busy;
  final String hint;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final VoidCallback onVoice;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Material(
      color: scheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.xs,
            Space.xs,
            Space.sm,
            Space.xs,
          ),
          child: Row(
            children: [
              IconButton(
                tooltip: 'Attach Official Record',
                icon: const Icon(Icons.attach_file),
                onPressed: busy ? null : onAttach,
              ),
              IconButton(
                tooltip: 'Record Voice Note',
                icon: const Icon(Icons.mic_none),
                onPressed: busy ? null : onVoice,
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => onSend(),
                  decoration: InputDecoration(
                    hintText: hint,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: 8,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: Space.xs),
              IconButton(
                onPressed: busy ? null : onSend,
                icon: const Icon(Icons.send, color: BrandColors.crimson),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
