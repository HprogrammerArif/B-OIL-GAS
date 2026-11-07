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
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
          ? '🎤 ${parts[1]}'
          : (bangla ? '🎤 ভয়েস নোট' : '🎤 Voice Note');
    }
    return s;
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
      final quoted = _cleanSnippet(_replyingTo!.body, bangla);
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
                      Icons.lock,
                      color: BrandColors.success,
                      size: 14,
                    ),
                    const SizedBox(width: Space.xs),
                    Flexible(
                      child: Text(
                        bangla
                            ? 'সুরক্ষিত অভ্যন্তরীণ ভয়েস কল'
                            : 'Secure Enterprise Voice Call',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: BrandColors.success,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
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
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: Space.md),
                const Text(
                  '00:42 · HD Corporate Voice Line',
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

  void _showChannelInfoSheet(ChatChannel channel, bool bangla) {
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
                        color: scheme.primaryContainer,
                        borderRadius: BorderRadius.circular(Corner.md),
                      ),
                      child: Icon(
                        channel.isDirect
                            ? Icons.person_outline
                            : Icons.groups_outlined,
                        color: scheme.primary,
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
                      ? 'চ্যানেল সদস্যবৃন্দ (${channel.members.length})'
                      : 'Channel Participants (${channel.members.length})',
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
                                  color: scheme.primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  bangla ? 'অ্যাডমিন' : 'Admin',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                    color: scheme.primary,
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
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: isOnline
                                    ? BrandColors.success
                                    : BrandColors.warning,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isOnline
                                  ? (bangla ? 'অনলাইন' : 'Online')
                                  : (bangla ? 'ব্যস্ত' : 'Busy'),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
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
                    ? 'অফিসিয়াল BOGCL নথি সংযুক্ত করুন'
                    : 'Attach Official BOGCL Record',
                style: Theme.of(ctx).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'চ্যাটে সরাসরি নোট-শিট, ল্যাব রিপোর্ট বা নিরাপত্তা নথি শেয়ার করুন'
                    : 'Share a live clickable card linking directly to the operational record',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.sm),
              ListTile(
                leading: const Icon(
                  Icons.description,
                  color: BrandColors.crimson,
                ),
                title: const Text('Note-Sheet NS-2026-0042'),
                subtitle: const Text(
                  'New Bitumen Storage Tank TK-109 · BDT 32.0 Lakhs',
                ),
                onTap: () => Navigator.pop(
                  ctx,
                  'Attached Note-Sheet: NS-2026-0042 | New Bitumen Storage Tank TK-109 (BDT 32.0 Lakhs)',
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
                  'Attached QC Report: BDS 1238:2020 | Grade 60/70 Batch B-88 Verified (450 MT)',
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
                  'Attached HSE Incident: INC-2026-003 | Tank TK-102 Flange Gasket Inspection',
                ),
              ),
              ListTile(
                leading: const Icon(
                  Icons.gavel_outlined,
                  color: BrandColors.info,
                ),
                title: const Text('Explosives & Boiler Licence File'),
                subtitle: const Text(
                  'Keraniganj Refinery Statutory Renewal Package',
                ),
                onTap: () => Navigator.pop(
                  ctx,
                  'Attached Permit File: LIC-2026-019 | Keraniganj Refinery Statutory Renewal',
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (pick != null) {
      await _repo.send(widget.id, pick);
      ref
        ..invalidate(chatMessagesProvider(widget.id))
        ..invalidate(chatChannelsProvider);
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
                    Expanded(
                      child: Text(
                        bangla
                            ? '⚡ এক্সিকিউটিভ ডিরেক্টিভ জারি করুন'
                            : '⚡ Issue Executive Directive',
                        style: Theme.of(ctx).textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
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
                    Expanded(
                      child: Text(
                        bangla
                            ? 'জরুরি লাল সতর্কতা (URGENT / RED ALERT)'
                            : 'Priority: URGENT / RED ALERT',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: BrandColors.danger,
                        ),
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
        final prefix = isUrgent ? '[URGENT] ' : '';
        await _repo.issue(widget.id, {
          'title': '$prefix${titleCtrl.text.trim()}',
          'body': bodyCtrl.text.trim(),
        });
        ref
          ..invalidate(chatMessagesProvider(widget.id))
          ..invalidate(chatChannelsProvider);
        if (!mounted) return;
        AppToast.show(
          context,
          bangla
              ? 'এক্সিকিউটিভ ডিরেক্টিভ জারি করা হয়েছে।'
              : 'Executive directive broadcasted to channel.',
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
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final session = ref.watch(sessionControllerProvider).value;
    final canDir = session?.can('chat:directive-issue') ?? false;
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
                : () => _showChannelInfoSheet(channel, bangla),
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
                  Text(
                    channelSubtitle.isNotEmpty
                        ? channelSubtitle
                        : (bangla
                              ? 'অভ্যন্তরীণ এন্টারপ্রাইজ চ্যানেল'
                              : 'BOGCL Enterprise Channel'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            IconButton(
              tooltip: bangla ? 'সিকিউর ভয়েস কল' : 'Voice Call',
              icon: const Icon(Icons.phone_in_talk_outlined),
              onPressed: () => _showEncryptedCallModal(
                channelName,
                channelSubtitle.isNotEmpty
                    ? channelSubtitle
                    : 'Official Executive Channel',
              ),
            ),
            if (canDir && !(channel?.isDirect ?? false))
              IconButton(
                tooltip: l10n.chActDirective,
                onPressed: () => unawaited(_issueDirectiveSheet()),
                icon: const Icon(Icons.campaign, color: BrandColors.crimson),
              ),
            if (channel != null)
              IconButton(
                tooltip: bangla ? 'সদস্য ও তথ্য' : 'Channel Info & Members',
                icon: const Icon(Icons.info_outline),
                onPressed: () => _showChannelInfoSheet(channel, bangla),
              ),
          ],
        ),
        body: Column(
          children: [
            // Dynamic Pinned Directive / Message Banner
            if (_showPinned && pinnedMsg != null)
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
                        pinnedMsg.directive != null
                            ? '${bangla ? "পিনকৃত ডিরেক্টিভ" : "PINNED DIRECTIVE"} (${pinnedMsg.directive!.refNo}): ${pinnedMsg.directive!.title}'
                            : '${bangla ? "পিনকৃত বার্তা" : "PINNED"}: ${_cleanSnippet(pinnedMsg.body, bangla)}',
                        style: const TextStyle(
                          fontSize: 11.5,
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
                                if (!context.mounted) return;
                                AppToast.show(
                                  context,
                                  bangla
                                      ? 'ডিরেক্টিভ বাস্তবায়িত হিসেবে চিহ্নিত হয়েছে।'
                                      : 'Directive marked as executed.',
                                  tone: StatusTone.success,
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
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: scheme.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        bangla
                            ? '${(channel?.isDirect ?? false) ? channelName : "প্ল্যান্ট জিএম"} উত্তর লিখছেন...'
                            : '${(channel?.isDirect ?? false) ? channelName : "Plant GM"} is typing a reply...',
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

            // Reply Quote Preview Bar (when replying to a message)
            if (_replyingTo != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest,
                  border: Border(top: BorderSide(color: scheme.outlineVariant)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.reply, size: 16, color: scheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bangla
                                ? 'উত্তর দিচ্ছেন: ${_replyingTo!.sender?.display(bangla: true) ?? "আপনি"}'
                                : 'Replying to ${_replyingTo!.sender?.display(bangla: false) ?? "You"}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: scheme.primary,
                            ),
                          ),
                          Text(
                            _cleanSnippet(_replyingTo!.body, bangla),
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
    final isAttachedRecord = mainBody.startsWith('Attached ');

    final bg = isDirective
        ? BrandColors.crimson.withValues(alpha: 0.08)
        : (mine ? scheme.primary.withValues(alpha: 0.12) : scheme.surface);

    final borderColor = isDirective
        ? BrandColors.crimson.withValues(alpha: 0.5)
        : scheme.outlineVariant;

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
                  width: isDirective ? 1.5 : 1.0,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sender Header + Role Badge (for incoming messages)
                    if (!mine && message.sender != null) ...[
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              message.sender!.display(bangla: bangla),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          if (message.sender!.title != null &&
                              message.sender!.title!.isNotEmpty) ...[
                            const SizedBox(width: 6),
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: scheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  message.sender!.title!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w600,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],

                    // Quoted Reply Block (if replying to an earlier message)
                    if (quotedLine != null) ...[
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: scheme.surfaceContainerHighest.withValues(
                            alpha: 0.6,
                          ),
                          borderRadius: BorderRadius.circular(6),
                          border: Border(
                            left: BorderSide(color: scheme.primary, width: 3),
                          ),
                        ),
                        child: Text(
                          quotedLine,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],

                    // Message Content by Kind
                    if (isVoice)
                      _VoiceWaveformBubble(body: mainBody, bangla: bangla)
                    else if (isAttachedRecord)
                      _OfficialRecordCard(raw: mainBody, bangla: bangla)
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
                      const SizedBox(height: 2),
                      Text(
                        'Ref: ${message.directive!.refNo}',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
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
                                ? Icons.verified
                                : Icons.check_circle_outline,
                            size: 14,
                            color: BrandColors.success,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              message.directive!.executedAt != null
                                  ? (bangla
                                        ? 'বাস্তবায়িত · ${l10n.chAckCount(message.directive!.acks, message.directive!.needed)}'
                                        : 'Executed · ${l10n.chAckCount(message.directive!.acks, message.directive!.needed)}')
                                  : l10n.chAckCount(
                                      message.directive!.acks,
                                      message.directive!.needed,
                                    ),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
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
                              FilledButton.icon(
                                style: FilledButton.styleFrom(
                                  backgroundColor: BrandColors.crimson,
                                  foregroundColor: Colors.white,
                                  visualDensity: VisualDensity.compact,
                                ),
                                icon: const Icon(Icons.check, size: 14),
                                label: Text(
                                  bangla
                                      ? 'প্রাপ্তিস্বীকার করুন'
                                      : 'Acknowledge Directive',
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
                                      ? 'বাস্তবায়িত চিহ্নিত করুন'
                                      : 'Mark Executed',
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

                    // Footer: Grouped Reactions + Reply + Timestamp + Read Receipt
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
                                color: scheme.surfaceContainerHighest,
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
                          Icon(Icons.done_all, size: 14, color: scheme.primary),
                        InkWell(
                          onTap: onReply,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            child: Icon(
                              Icons.reply_outlined,
                              size: 15,
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
                              size: 15,
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
    final isQc = raw.contains('QC Report');
    final isIncident = raw.contains('HSE Incident');

    final icon = isNoteSheet
        ? Icons.description_outlined
        : isQc
        ? Icons.science_outlined
        : isIncident
        ? Icons.warning_amber_rounded
        : Icons.gavel_outlined;

    final color = isNoteSheet
        ? BrandColors.crimson
        : isQc
        ? BrandColors.success
        : isIncident
        ? BrandColors.warning
        : BrandColors.info;

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
        color: scheme.surface,
        borderRadius: BorderRadius.circular(Corner.md),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
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
            child: FilledButton.tonalIcon(
              style: FilledButton.styleFrom(
                visualDensity: VisualDensity.compact,
              ),
              onPressed: () {
                Haptics.tap();
                openAppRoute(context, route);
              },
              icon: const Icon(Icons.open_in_new, size: 14),
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
                color: BrandColors.crimson,
                size: 30,
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
                          ? BrandColors.crimson
                          : Colors.grey.shade400,
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
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            '"$transcript"',
            style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic),
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
      color: Colors.red.shade50,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.md,
            vertical: Space.xs,
          ),
          child: Row(
            children: [
              const Icon(
                Icons.fiber_manual_record,
                color: Colors.red,
                size: 18,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  bangla
                      ? 'ভয়েস নোট রেকর্ড হচ্ছে... 0:$rem'
                      : 'Recording Voice Note... 0:$rem',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5,
                    color: Colors.red.shade900,
                  ),
                ),
              ),
              TextButton(
                onPressed: onCancel,
                child: Text(bangla ? 'বাতিল' : 'Cancel'),
              ),
              const SizedBox(width: 4),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: scheme.primary,
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: onSend,
                icon: const Icon(Icons.send, size: 15),
                label: Text(bangla ? 'পাঠান' : 'Send Voice'),
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
    required this.canDirect,
    required this.onSend,
    required this.onAttach,
    required this.onVoice,
    required this.onDirective,
  });

  final TextEditingController controller;
  final bool busy;
  final String hint;
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
                tooltip: 'Attach Official Record',
                icon: const Icon(Icons.attach_file, size: 20),
                onPressed: busy ? null : onAttach,
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                tooltip: 'Record Voice Note',
                icon: const Icon(Icons.mic_none, size: 20),
                onPressed: busy ? null : onVoice,
              ),
              if (canDirect)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Issue Executive Directive',
                  icon: const Icon(
                    Icons.campaign_outlined,
                    size: 20,
                    color: BrandColors.crimson,
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
                icon: const Icon(Icons.send, color: BrandColors.crimson),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
