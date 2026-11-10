import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/files/presentation/file_image.dart';
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

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  final _text = TextEditingController();
  Timer? _poll;
  Timer? _voiceTimer;
  bool _busy = false;
  bool _showPinned = true;
  bool _colleagueTyping = false;

  // Reply state
  ChatMessage? _replyingTo;

  // Live Voice Recording state
  bool _isRecordingVoice = false;
  int _voiceSec = 0;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 8), (_) {
      if (mounted) {
        ref.invalidate(chatMessagesProvider(widget.id));
      }
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _voiceTimer?.cancel();
    _text.dispose();
    super.dispose();
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  String _cleanSnippet(String? raw, bool bangla) {
    if (raw == null || raw.isEmpty) return '';
    var s = raw;
    if (s.startsWith('> ')) {
      final idx = s.indexOf('\n');
      if (idx != -1) s = s.substring(idx + 1);
    }
    if (s.startsWith('VOICE:')) {
      final parts = s.split('|');
      return parts.length > 1
          ? parts[1]
          : (bangla ? 'ভয়েস নোট' : 'Voice Note');
    }
    return s;
  }

  String _replySnippet(ChatMessage m, bool bangla) {
    if (m.fileName != null && m.fileName!.isNotEmpty) return m.fileName!;
    return _cleanSnippet(m.body, bangla);
  }

  Future<void> _send() async {
    final rawText = _text.text.trim();
    if (rawText.isEmpty) return;

    final bangla = context.isBangla;
    var body = rawText;
    if (_replyingTo != null) {
      final senderName =
          _replyingTo!.sender?.display(bangla: bangla) ??
          (bangla ? 'আপনি' : 'You');
      final quoted = _replySnippet(_replyingTo!, bangla);
      body = '> $senderName: $quoted\n$rawText';
    }

    setState(() {
      _busy = true;
      _replyingTo = null;
    });
    try {
      await _repo.send(widget.id, body);
      _text.clear();
      Haptics.tap();
      setState(() => _colleagueTyping = true);
      Future<void>.delayed(const Duration(milliseconds: 900), () {
        if (mounted) {
          setState(() => _colleagueTyping = false);
          ref
            ..invalidate(chatMessagesProvider(widget.id))
            ..invalidate(chatChannelsProvider);
        }
      });
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

  void _startVoiceRecording() {
    Haptics.tap();
    _voiceTimer?.cancel();
    setState(() {
      _isRecordingVoice = true;
      _voiceSec = 1;
    });
    _voiceTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _voiceSec++);
    });
  }

  void _cancelVoiceRecording() {
    Haptics.tap();
    _voiceTimer?.cancel();
    setState(() {
      _isRecordingVoice = false;
      _voiceSec = 0;
    });
  }

  Future<void> _sendVoiceRecording(bool bangla) async {
    _voiceTimer?.cancel();
    final sec = _voiceSec.clamp(2, 120);
    setState(() {
      _isRecordingVoice = false;
      _busy = true;
    });
    final defaultTranscript = bangla
        ? 'আজকের শিফট হ্যান্ডওভারের আগে কেরানীগঞ্জ রিফাইনারি স্টোরেজ ট্যাংক ও পাইপলাইনের প্রেসার যাচাই করে রিপোর্ট পাঠান।'
        : 'Please verify the Keraniganj Refinery tank pressure and valve seals before shift handover and share the status update.';
    try {
      await _repo.send(widget.id, 'VOICE:$sec|$defaultTranscript');
      Haptics.success();
      ref
        ..invalidate(chatMessagesProvider(widget.id))
        ..invalidate(chatChannelsProvider);
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
                      Icons.lock_outline,
                      color: Colors.white70,
                      size: 14,
                    ),
                    const SizedBox(width: Space.xs),
                    Flexible(
                      child: Text(
                        bangla
                            ? 'অভ্যন্তরীণ ভয়েস কল'
                            : 'Enterprise Voice Call',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.lg),
                CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.white12,
                  child: Text(
                    name.isNotEmpty ? name.substring(0, 1) : 'E',
                    style: const TextStyle(
                      fontSize: 28,
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
                    fontSize: 17,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  role,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: Space.md),
                const Text(
                  '00:42 · Corporate Voice Line',
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
                          bangla ? 'কল সমাপ্ত হয়েছে।' : 'Voice call ended.',
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

  Future<void> _archiveRoom(ChatChannel channel) async {
    final l10n = context.l10n;
    if (channel.isLocked || channel.isDirect) {
      AppToast.show(context, l10n.chRoomLockedStay, tone: StatusTone.warning);
      return;
    }
    final ok = await showConfirmSheet(
      context,
      title: l10n.chRemoveRoomConfirm,
      message: l10n.chRemoveRoomBody,
      confirmLabel: l10n.chRemoveRoom,
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await ref.read(chatRepositoryProvider).archiveChannel(channel.id);
      if (!mounted) return;
      ref.invalidate(chatChannelsProvider);
      AppToast.show(context, l10n.chRoomRemoved, tone: StatusTone.success);
      context.go(AppRoutes.chat);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.code == ApiErrorCode.policyViolation
            ? l10n.chRoomLockedStay
            : e.message,
        tone: StatusTone.danger,
      );
    }
  }

  void _showChannelInfoSheet(
    ChatChannel channel,
    bool bangla, {
    required bool canManageRooms,
  }) {
    Haptics.tap();
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (ctx) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(Corner.md),
                      ),
                      child: Icon(
                        channel.isDirect
                            ? Icons.person_outline
                            : Icons.groups_outlined,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: Space.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            channel.heading(bangla: bangla),
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            channel.subheading(bangla: bangla),
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
                Text(
                  bangla
                      ? 'সদস্যবৃন্দ (${channel.members.length})'
                      : 'Participants (${channel.members.length})',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: Space.xs),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: channel.members.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (ctx, i) {
                      final m = channel.members[i];
                      final isOnline = m.presence == 'ONLINE';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Avatar(name: m.displayName(bangla: bangla)),
                        title: Row(
                          children: [
                            Flexible(
                              child: Text(
                                m.displayName(bangla: bangla),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                ),
                              ),
                            ),
                            if (m.isAdmin) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: scheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  bangla ? 'অ্যাডমিন' : 'Admin',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w600,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        subtitle: Text(
                          '${m.displayTitle(bangla: bangla)} · ${m.displaySite(bangla: bangla)}',
                          style: const TextStyle(fontSize: 11.5),
                        ),
                        trailing: Text(
                          isOnline
                              ? (bangla ? 'অনলাইন' : 'Online')
                              : (bangla ? 'ব্যস্ত' : 'Away'),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (canManageRooms && !channel.isDirect) ...[
                  const SizedBox(height: Space.md),
                  PrimaryButton.danger(
                    label: context.l10n.chRemoveRoom,
                    onPressed: () {
                      Navigator.pop(ctx);
                      unawaited(_archiveRoom(channel));
                    },
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _attachDocument() async {
    if (_busy) return;
    final l10n = context.l10n;
    final picked = await pickAttachment(context);
    if (picked == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final uploads = ref.read(uploadServiceProvider);
      final purpose = picked.mime.startsWith('image/') ? 'PHOTO' : 'DOCUMENT';
      final meta = await uploads.upload(picked, purpose: purpose);
      await uploads.awaitClean(meta.id);
      if (!mounted) return;
      await _repo.send(
        widget.id,
        picked.name,
        fileId: meta.id,
        fileName: picked.name,
        mime: picked.mime,
      );
      Haptics.tap();
      ref
        ..invalidate(chatMessagesProvider(widget.id))
        ..invalidate(chatChannelsProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, switch (e.code) {
        ApiErrorCode.offline ||
        ApiErrorCode.timeout => l10n.uploadNeedsConnection,
        ApiErrorCode.forbidden => l10n.uploadBlocked,
        _ => l10n.uploadRejected,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
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
        'All GMs and Department Heads join operational review at 04:00 PM with updated KPI sheets.',
      ),
      (
        'Stock Position Report',
        'Submit verified Bitumen 60/70 & 80/100 tank-farm stock position and RHD dispatch schedule within 2 hours.',
      ),
    ];

    var selectedPreset = presets.first;
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
                Text(
                  bangla ? 'নির্দেশনা জারি করুন' : 'Issue Official Directive',
                  style: Theme.of(ctx).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'সংশ্লিষ্ট বিভাগীয় প্রধানদের দ্বারা প্রাপ্তিস্বীকারের জন্য নির্দেশনা পাঠান।'
                      : 'Send an official instruction requiring acknowledgment from channel members.',
                  style: Theme.of(ctx).textTheme.bodySmall,
                ),
                const SizedBox(height: Space.md),
                Text(
                  bangla ? 'টেমপ্লেট' : 'Quick Templates',
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
                AppTextField(
                  label: bangla ? 'নির্দেশের শিরোনাম' : 'Directive Title',
                  controller: titleCtrl,
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: bangla ? 'নির্দেশের বিবরণ' : 'Instruction Details',
                  controller: bodyCtrl,
                  maxLines: 3,
                ),
                const SizedBox(height: Space.lg),
                PrimaryButton(
                  label: bangla ? 'নির্দেশনা পাঠান' : 'Send Directive',
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
        await _repo.issue(widget.id, {
          'title': titleCtrl.text.trim(),
          'body': bodyCtrl.text.trim(),
        });
        ref
          ..invalidate(chatMessagesProvider(widget.id))
          ..invalidate(chatChannelsProvider);
        if (!mounted) return;
        AppToast.show(
          context,
          bangla ? 'নির্দেশনা পাঠানো হয়েছে।' : 'Directive posted to channel.',
          tone: StatusTone.neutral,
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
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final session = ref.watch(sessionControllerProvider).value;
    final canDir = session?.can('chat:directive-issue') ?? false;
    final canManageRooms = session?.can('chat:create-channel') ?? false;
    final chAsync = ref.watch(chatChannelProvider(widget.id));
    final msgs = ref.watch(chatMessagesProvider(widget.id));
    final channel = chAsync.asData?.value;
    final channelName = channel?.heading(bangla: bangla) ?? l10n.moduleChat;
    final channelSubtitle = channel?.subheading(bangla: bangla) ?? '';

    final allMessages = msgs.asData?.value ?? const <ChatMessage>[];
    final pinnedMsg = allMessages
        .where((m) => !m.deleted && (m.pinned || m.directive != null))
        .lastOrNull;

    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(
          titleSpacing: 0,
          title: InkWell(
            borderRadius: BorderRadius.circular(Corner.sm),
            onTap: channel == null
                ? null
                : () => _showChannelInfoSheet(
                    channel,
                    bangla,
                    canManageRooms: canManageRooms,
                  ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.xs,
                vertical: 4,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    channelName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (channelSubtitle.isNotEmpty)
                    Text(
                      channelSubtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
          ),
          actions: [
            IconButton(
              tooltip: bangla ? 'ভয়েস কল' : 'Voice Call',
              icon: const Icon(Icons.call_outlined),
              onPressed: () => _showEncryptedCallModal(
                channelName,
                channelSubtitle.isNotEmpty ? channelSubtitle : 'Corporate Line',
              ),
            ),
            if (channel != null)
              IconButton(
                tooltip: bangla ? 'সদস্য ও তথ্য' : 'Participants & Info',
                icon: const Icon(Icons.info_outline),
                onPressed: () => _showChannelInfoSheet(
                  channel,
                  bangla,
                  canManageRooms: canManageRooms,
                ),
              ),
          ],
        ),
        body: Column(
          children: [
            // Calm Neutral Pinned Banner
            if (_showPinned && pinnedMsg != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerLow,
                  border: Border(
                    bottom: BorderSide(color: scheme.outlineVariant),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.push_pin_outlined,
                      size: 15,
                      color: scheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        pinnedMsg.directive != null
                            ? '${pinnedMsg.directive!.refNo}: ${pinnedMsg.directive!.title}'
                            : _cleanSnippet(pinnedMsg.body, bangla),
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: scheme.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    InkWell(
                      onTap: () => setState(() => _showPinned = false),
                      child: Icon(
                        Icons.close,
                        size: 15,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

            // Message Stream
            Expanded(
              child: msgs.when(
                skipLoadingOnReload: true,
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
                        onReply: () {
                          Haptics.tap();
                          setState(() => _replyingTo = m);
                        },
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
                                      ? 'প্রাপ্তিস্বীকার রেকর্ড করা হয়েছে।'
                                      : 'Directive acknowledged.',
                                  tone: StatusTone.neutral,
                                );
                              },
                        onDone: m.directive == null
                            ? null
                            : () async {
                                Haptics.heavy();
                                await _repo.execute(m.directive!.id);
                                ref.invalidate(chatMessagesProvider(widget.id));
                                if (!context.mounted) return;
                                AppToast.show(
                                  context,
                                  bangla
                                      ? 'নির্দেশনা সম্পন্ন হিসেবে চিহ্নিত হয়েছে।'
                                      : 'Directive marked as completed.',
                                  tone: StatusTone.neutral,
                                );
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

            // Simulated Colleague Typing Indicator
            if (_colleagueTyping)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 4,
                ),
                color: scheme.surfaceContainerLow,
                child: Row(
                  children: [
                    SizedBox(
                      width: 11,
                      height: 11,
                      child: CircularProgressIndicator(
                        strokeWidth: 1.8,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        bangla
                            ? '${(channel?.isDirect ?? false) ? channelName : "প্ল্যান্ট জিএম"} উত্তর লিখছেন...'
                            : '${(channel?.isDirect ?? false) ? channelName : "Plant GM"} is typing...',
                        style: TextStyle(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Reply Quote Preview Bar
            if (_replyingTo != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerLow,
                  border: Border(top: BorderSide(color: scheme.outlineVariant)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.reply, size: 16, color: scheme.onSurfaceVariant),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bangla
                                ? 'উত্তর: ${_replyingTo!.sender?.display(bangla: true) ?? "আপনি"}'
                                : 'Replying to ${_replyingTo!.sender?.display(bangla: false) ?? "You"}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurface,
                            ),
                          ),
                          Text(
                            _replySnippet(_replyingTo!, bangla),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.close, size: 16),
                      onPressed: () => setState(() => _replyingTo = null),
                    ),
                  ],
                ),
              ),

            // Live Voice Recording Bar or Standard Composer
            if (_isRecordingVoice)
              _VoiceRecordingBar(
                seconds: _voiceSec,
                bangla: bangla,
                onCancel: _cancelVoiceRecording,
                onSend: () => unawaited(_sendVoiceRecording(bangla)),
              )
            else
              _Composer(
                controller: _text,
                busy: _busy,
                hint: l10n.chHint,
                attachTooltip: l10n.chAttach,
                canDirect: canDir && !(channel?.isDirect ?? false),
                onSend: _send,
                onAttach: _attachDocument,
                onVoice: _startVoiceRecording,
                onDirective: _issueDirectiveSheet,
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
    required this.onReply,
    this.onAck,
    this.onDone,
  });

  final ChatMessage message;
  final bool bangla;
  final bool busy;
  final bool canDirect;
  final Future<void> Function(String emoji) onReact;
  final VoidCallback onReply;
  final Future<void> Function()? onAck;
  final Future<void> Function()? onDone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final mine = message.mine;
    final isDirective = message.directive != null;
    final time = message.createdAt == null
        ? null
        : DateFmt.time(message.createdAt!, lang);

    final rawBody = message.body ?? '';
    String? quotedLine;
    var mainBody = rawBody;
    if (rawBody.startsWith('> ')) {
      final nl = rawBody.indexOf('\n');
      if (nl != -1) {
        quotedLine = rawBody.substring(2, nl).trim();
        mainBody = rawBody.substring(nl + 1).trim();
      }
    }

    final isVoice =
        message.type == 'VOICE' ||
        mainBody.startsWith('VOICE:') ||
        mainBody.startsWith('[VOICE BRIEFING');
    final isDocument =
        message.type == 'DOCUMENT' &&
        message.fileId != null &&
        message.fileId!.isNotEmpty;
    final isAttachedRecord = mainBody.startsWith('Attached ');

    // Calm neutral bubble backgrounds
    final bg = mine ? scheme.surfaceContainerHighest : scheme.surface;
    final borderColor = isDirective ? scheme.outline : scheme.outlineVariant;

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 335),
        child: Padding(
          padding: const EdgeInsets.only(bottom: Space.sm),
          child: InkWell(
            borderRadius: BorderRadius.circular(Corner.md),
            onLongPress: () => _showMessageActions(context, mainBody),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(Corner.md),
                border: Border.all(
                  color: borderColor,
                  width: isDirective ? 1.2 : 1.0,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sender Header + Role Subtitle (neutral colors)
                    if (!mine && message.sender != null) ...[
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              message.sender!.display(bangla: bangla),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: scheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          if (message.sender!.title != null &&
                              message.sender!.title!.isNotEmpty) ...[
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                '· ${message.sender!.title!}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],

                    // Quoted Reply Block (neutral left border)
                    if (quotedLine != null) ...[
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: scheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(6),
                          border: Border(
                            left: BorderSide(color: scheme.outline, width: 2.5),
                          ),
                        ),
                        child: Text(
                          quotedLine,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],

                    // Message Content by Kind
                    if (isVoice)
                      _VoiceWaveformBubble(body: mainBody, bangla: bangla)
                    else if (isDocument)
                      _DocumentBubble(message: message)
                    else if (isAttachedRecord)
                      _OfficialRecordCard(raw: mainBody, bangla: bangla)
                    else if (isDirective) ...[
                      Row(
                        children: [
                          Icon(
                            Icons.assignment_outlined,
                            color: scheme.onSurface,
                            size: 16,
                          ),
                          const SizedBox(width: Space.xs),
                          Expanded(
                            child: Text(
                              message.directive!.title,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: scheme.onSurface,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${bangla ? "ডিরেক্টিভ" : "Directive"} · ${message.directive!.refNo}',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        message.directive!.body,
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: Space.xs),
                      Row(
                        children: [
                          Icon(
                            message.directive!.executedAt != null
                                ? Icons.check_circle
                                : Icons.schedule,
                            size: 14,
                            color: scheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              message.directive!.executedAt != null
                                  ? (bangla
                                        ? 'বাস্তবায়িত · ${l10n.chAckCount(message.directive!.acks, message.directive!.needed)}'
                                        : 'Completed · ${l10n.chAckCount(message.directive!.acks, message.directive!.needed)}')
                                  : l10n.chAckCount(
                                      message.directive!.acks,
                                      message.directive!.needed,
                                    ),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (message.directive!.executedAt == null) ...[
                        const SizedBox(height: Space.sm),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (!mine && onAck != null)
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  visualDensity: VisualDensity.compact,
                                ),
                                icon: const Icon(Icons.check, size: 14),
                                label: Text(
                                  bangla ? 'প্রাপ্তিস্বীকার' : 'Acknowledge',
                                  style: const TextStyle(fontSize: 11.5),
                                ),
                                onPressed: busy ? null : () => onAck!(),
                              ),
                            if (mine && canDirect && onDone != null)
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  visualDensity: VisualDensity.compact,
                                ),
                                icon: const Icon(
                                  Icons.task_alt_outlined,
                                  size: 14,
                                ),
                                label: Text(
                                  bangla
                                      ? 'সম্পন্ন চিহ্নিত করুন'
                                      : 'Mark Completed',
                                  style: const TextStyle(fontSize: 11.5),
                                ),
                                onPressed: busy ? null : () => onDone!(),
                              ),
                          ],
                        ),
                      ],
                    ] else
                      Text(mainBody, style: theme.textTheme.bodyMedium),

                    const SizedBox(height: 6),

                    // Footer: Reactions + Timestamp + Read Receipt + Reply
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        for (final entry in message.reactionCounts.entries)
                          InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => unawaited(onReact(entry.key)),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: scheme.surfaceContainerLow,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: scheme.outlineVariant,
                                ),
                              ),
                              child: Text(
                                '${entry.key} ${entry.value}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        if (time != null)
                          Text(
                            time,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: scheme.onSurfaceVariant,
                              fontSize: 10,
                            ),
                          ),
                        if (mine)
                          Icon(
                            Icons.done_all,
                            size: 13,
                            color: scheme.onSurfaceVariant,
                          ),
                        InkWell(
                          onTap: onReply,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            child: Icon(
                              Icons.reply_outlined,
                              size: 14,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () => unawaited(_reactSheet(context)),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            child: Icon(
                              Icons.add_reaction_outlined,
                              size: 14,
                              color: scheme.onSurfaceVariant,
                            ),
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
      ),
    );
  }

  Future<void> _showMessageActions(BuildContext context, String text) async {
    Haptics.tap();
    final action = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.md,
                vertical: Space.xs,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  for (final e in const ['👍', '✅', '⚡', '👁️', '🚨', '🙏'])
                    IconButton(
                      onPressed: () => Navigator.pop(ctx, 'REACT:$e'),
                      icon: Text(e, style: const TextStyle(fontSize: 24)),
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.reply_outlined),
              title: Text(bangla ? 'উত্তর দিন (Reply)' : 'Reply to Message'),
              onTap: () => Navigator.pop(ctx, 'REPLY'),
            ),
            ListTile(
              leading: const Icon(Icons.copy_outlined),
              title: Text(bangla ? 'টেক্সট কপি করুন' : 'Copy Message Text'),
              onTap: () => Navigator.pop(ctx, 'COPY'),
            ),
          ],
        ),
      ),
    );

    if (action == null) return;
    if (action.startsWith('REACT:')) {
      await onReact(action.substring(6));
    } else if (action == 'REPLY') {
      onReply();
    } else if (action == 'COPY') {
      await Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        AppToast.show(
          context,
          bangla ? 'ক্লিপবোর্ডে কপি করা হয়েছে' : 'Copied to clipboard',
        );
      }
    }
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

class _OfficialRecordCard extends StatelessWidget {
  const _OfficialRecordCard({required this.raw, required this.bangla});

  final String raw;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isNoteSheet = raw.contains('Note-Sheet');
    final isIncident = raw.contains('HSE Incident');

    final route = isNoteSheet
        ? AppRoutes.noteSheets
        : isIncident
        ? AppRoutes.incidents
        : AppRoutes.licences;

    final clean = raw.replaceFirst('Attached ', '');
    final parts = clean.split('|');
    final title = parts.first.trim();
    final sub = parts.length > 1 ? parts[1].trim() : '';

    return Container(
      padding: const EdgeInsets.all(Space.sm),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(Corner.md),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.description_outlined,
                size: 17,
                color: scheme.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
          if (sub.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              sub,
              style: TextStyle(fontSize: 11.5, color: scheme.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                visualDensity: VisualDensity.compact,
              ),
              onPressed: () {
                Haptics.tap();
                openAppRoute(context, route);
              },
              icon: const Icon(Icons.open_in_new, size: 13),
              label: Text(
                bangla ? 'নথি খুলুন' : 'Open Record',
                style: const TextStyle(fontSize: 11),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentBubble extends ConsumerWidget {
  const _DocumentBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fileId = message.fileId!;
    final name = message.fileName ?? message.body ?? 'File';
    final mime = message.mime ?? '';
    final isImage = mime.startsWith('image/');
    if (isImage) {
      final bytes = ref.watch(fileBytesProvider(fileId)).value;
      return InkWell(
        onTap: () => unawaited(showFileImage(context, ref, fileId)),
        borderRadius: BorderRadius.circular(Corner.md),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(Corner.md),
          child: SizedBox(
            width: 180,
            height: 120,
            child: bytes == null
                ? ColoredBox(
                    color: Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest,
                    child: const Icon(Icons.photo_outlined),
                  )
                : Image.memory(bytes, fit: BoxFit.cover),
          ),
        ),
      );
    }
    return InkWell(
      onTap: () => unawaited(_openDoc(context, ref, fileId)),
      child: Row(
        children: [
          Icon(
            Icons.insert_drive_file_outlined,
            size: 20,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: Space.sm),
          Expanded(
            child: Text(
              name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openDoc(
    BuildContext context,
    WidgetRef ref,
    String fileId,
  ) async {
    final l10n = context.l10n;
    try {
      await ref.read(filesRepositoryProvider).download(fileId);
      if (!context.mounted) return;
      AppToast.show(context, l10n.chFileSaved);
    } on ApiException {
      if (!context.mounted) return;
      AppToast.show(context, l10n.uploadRejected, tone: StatusTone.danger);
    }
  }
}

class _VoiceWaveformBubble extends StatefulWidget {
  const _VoiceWaveformBubble({required this.body, required this.bangla});

  final String body;
  final bool bangla;

  @override
  State<_VoiceWaveformBubble> createState() => _VoiceWaveformBubbleState();
}

class _VoiceWaveformBubbleState extends State<_VoiceWaveformBubble> {
  bool _playing = false;
  int _elapsed = 0;
  Timer? _timer;

  (int durationSec, String transcript) _parse() {
    final b = widget.body;
    if (b.startsWith('VOICE:')) {
      final rest = b.substring(6);
      final parts = rest.split('|');
      final sec = int.tryParse(parts.first.trim()) ?? 12;
      final tr = parts.length > 1 && parts[1].trim().isNotEmpty
          ? parts[1].trim()
          : (widget.bangla
                ? 'কেরানীগঞ্জ রিফাইনারি স্টোরেজ ট্যাংক ও পাইপলাইনের প্রেসার যাচাই করে রিপোর্ট পাঠান।'
                : 'Please verify tank TK-104 valve seal and hydro pressure before evening shift.');
      return (sec, tr);
    }
    if (b.startsWith('[VOICE BRIEFING')) {
      final closeIdx = b.indexOf(']');
      final tr = closeIdx != -1 ? b.substring(closeIdx + 1).trim() : b;
      return (8, tr);
    }
    return (12, b);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _togglePlay(int totalSec) {
    Haptics.tap();
    if (_playing) {
      _timer?.cancel();
      setState(() => _playing = false);
      return;
    }
    setState(() {
      _playing = true;
      _elapsed = 0;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_elapsed + 1 >= totalSec) {
        t.cancel();
        setState(() {
          _playing = false;
          _elapsed = 0;
        });
      } else {
        setState(() => _elapsed++);
      }
    });
  }

  String _fmtSec(int s) {
    final m = s ~/ 60;
    final rem = (s % 60).toString().padLeft(2, '0');
    return '$m:$rem';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (totalSec, transcript) = _parse();
    final progress = totalSec > 0 ? (_elapsed / totalSec).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              visualDensity: VisualDensity.compact,
              icon: Icon(
                _playing ? Icons.pause_circle_filled : Icons.play_circle_fill,
                color: scheme.onSurface,
                size: 28,
              ),
              onPressed: () => _togglePlay(totalSec),
            ),
            const SizedBox(width: 4),
            Row(
              children: [
                for (var i = 0; i < 16; i++)
                  Container(
                    width: 3,
                    height: (10 + (i % 5) * 4).toDouble(),
                    margin: const EdgeInsets.symmetric(horizontal: 1.5),
                    decoration: BoxDecoration(
                      color: _playing && (i / 16 <= progress + 0.15)
                          ? scheme.onSurface
                          : scheme.outlineVariant,
                      borderRadius: BorderRadius.circular(1.5),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 8),
            Text(
              _playing
                  ? '${_fmtSec(_elapsed)} / ${_fmtSec(totalSec)}'
                  : _fmtSec(totalSec),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            '"$transcript"',
            style: TextStyle(
              fontSize: 11,
              fontStyle: FontStyle.italic,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }
}

class _VoiceRecordingBar extends StatelessWidget {
  const _VoiceRecordingBar({
    required this.seconds,
    required this.bangla,
    required this.onCancel,
    required this.onSend,
  });

  final int seconds;
  final bool bangla;
  final VoidCallback onCancel;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final rem = (seconds % 60).toString().padLeft(2, '0');

    return Material(
      color: scheme.surfaceContainerHighest,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.md,
            vertical: Space.xs,
          ),
          child: Row(
            children: [
              Icon(Icons.mic, color: scheme.onSurface, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  bangla
                      ? 'ভয়েস নোট রেকর্ড হচ্ছে... 0:$rem'
                      : 'Recording voice note... 0:$rem',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12.5,
                    color: scheme.onSurface,
                  ),
                ),
              ),
              TextButton(
                onPressed: onCancel,
                child: Text(bangla ? 'বাতিল' : 'Cancel'),
              ),
              const SizedBox(width: 4),
              FilledButton.tonalIcon(
                style: FilledButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: onSend,
                icon: const Icon(Icons.send, size: 15),
                label: Text(bangla ? 'পাঠান' : 'Send'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.busy,
    required this.hint,
    required this.attachTooltip,
    required this.canDirect,
    required this.onSend,
    required this.onAttach,
    required this.onVoice,
    required this.onDirective,
  });

  final TextEditingController controller;
  final bool busy;
  final String hint;
  final String attachTooltip;
  final bool canDirect;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final VoidCallback onVoice;
  final VoidCallback onDirective;

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
                visualDensity: VisualDensity.compact,
                tooltip: attachTooltip,
                icon: Icon(
                  Icons.attach_file,
                  size: 20,
                  color: scheme.onSurfaceVariant,
                ),
                onPressed: busy ? null : onAttach,
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                tooltip: 'Record Voice Note',
                icon: Icon(
                  Icons.mic_none,
                  size: 20,
                  color: scheme.onSurfaceVariant,
                ),
                onPressed: busy ? null : onVoice,
              ),
              if (canDirect)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Issue Official Directive',
                  icon: Icon(
                    Icons.assignment_outlined,
                    size: 20,
                    color: scheme.onSurfaceVariant,
                  ),
                  onPressed: busy ? null : onDirective,
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
                icon: Icon(Icons.send_rounded, color: scheme.onSurface),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
