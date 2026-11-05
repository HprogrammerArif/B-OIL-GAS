import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/security/secure_flag.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canDir = session?.can('chat:directive-issue') ?? false;
    final ch = ref.watch(chatChannelProvider(widget.id));
    final msgs = ref.watch(chatMessagesProvider(widget.id));

    return SecureFlag(
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            ch.asData?.value.heading(bangla: bangla) ?? l10n.moduleChat,
          ),
          actions: [
            if (canDir)
              IconButton(
                tooltip: l10n.chActDirective,
                onPressed: () => unawaited(_directive()),
                icon: const Icon(Icons.campaign_outlined),
              ),
          ],
        ),
        body: Column(
          children: [
            Material(
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.lg,
                  vertical: Space.sm,
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 14,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: Text(
                        l10n.chSecureNote,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
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
                      return _Bubble(
                        message: m,
                        bangla: bangla,
                        busy: _busy,
                        canDirect: canDir,
                        onAck: m.directive == null
                            ? null
                            : () async {
                                await _repo.ack(m.directive!.id);
                                ref.invalidate(chatMessagesProvider(widget.id));
                              },
                        onDone: m.directive == null
                            ? null
                            : () async {
                                await _repo.execute(m.directive!.id);
                                ref.invalidate(chatMessagesProvider(widget.id));
                              },
                        onReact: (emoji) async {
                          await _repo.react(m.id, emoji);
                          ref.invalidate(chatMessagesProvider(widget.id));
                        },
                      );
                    },
                  );
                },
              ),
            ),
            _Composer(
              controller: _text,
              busy: _busy,
              hint: l10n.chHint,
              onSend: _send,
              onVoice: () async {
                setState(() => _busy = true);
                try {
                  await _repo.sendVoice(widget.id, 8);
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

  Future<void> _directive() async {
    final l10n = context.l10n;
    final title = TextEditingController();
    final body = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
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
          children: [
            Text(
              l10n.chActDirective,
              style: Theme.of(ctx).textTheme.titleLarge,
            ),
            TextField(
              controller: title,
              decoration: InputDecoration(labelText: l10n.chFieldTitle),
            ),
            TextField(
              controller: body,
              maxLines: 3,
              decoration: InputDecoration(labelText: l10n.chFieldBody),
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.chActDirective,
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );
    final t = title.text.trim();
    final b = body.text.trim();
    title.dispose();
    body.dispose();
    if (ok != true) return;
    try {
      await _repo.issue(widget.id, {'title': t, 'body': b});
      ref.invalidate(chatMessagesProvider(widget.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
        tone: StatusTone.danger,
      );
    }
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({
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
    final scheme = theme.colorScheme;
    final l10n = context.l10n;
    final mine = message.mine;
    final lang = Localizations.localeOf(context).languageCode;
    final time = message.createdAt == null
        ? null
        : DateFmt.time(message.createdAt!, lang);
    final bg = mine ? scheme.primary.withValues(alpha: 0.12) : scheme.surface;
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(Corner.lg),
      topRight: const Radius.circular(Corner.lg),
      bottomLeft: Radius.circular(mine ? Corner.lg : Corner.sm),
      bottomRight: Radius.circular(mine ? Corner.sm : Corner.lg),
    );

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Padding(
          padding: const EdgeInsets.only(bottom: Space.sm),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: bg,
              borderRadius: radius,
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                Space.sm,
                Space.md,
                Space.sm,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!mine && message.sender != null)
                    Text(
                      message.sender!.display(bangla: bangla),
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: scheme.primary,
                      ),
                    ),
                  if (message.type == 'VOICE' ||
                      (message.body ?? '').startsWith('VOICE:'))
                    _VoiceBubble(body: message.body ?? 'VOICE:8')
                  else
                    Text(message.body ?? '', style: theme.textTheme.bodyMedium),
                  if (message.directive != null) ...[
                    const SizedBox(height: Space.sm),
                    Text(
                      message.directive!.title,
                      style: theme.textTheme.titleSmall,
                    ),
                    Text(
                      message.directive!.body,
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      l10n.chAckCount(
                        message.directive!.acks,
                        message.directive!.needed,
                      ),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    if (message.directive!.executedAt == null && !mine)
                      TextButton(
                        onPressed: busy || onAck == null
                            ? null
                            : () async {
                                final ok = await _confirmDirective(
                                  context,
                                  l10n.chConfirmAck,
                                );
                                if (ok) await onAck!();
                              },
                        child: Text(l10n.chActAck),
                      ),
                    if (canDirect && message.directive!.executedAt == null)
                      TextButton(
                        onPressed: busy || onDone == null
                            ? null
                            : () async {
                                final ok = await _confirmDirective(
                                  context,
                                  l10n.chConfirmDone,
                                );
                                if (ok) await onDone!();
                              },
                        child: Text(l10n.chActDone),
                      ),
                  ],
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (message.reactions.isNotEmpty)
                        Text(
                          message.reactions.join(' '),
                          style: theme.textTheme.labelSmall,
                        ),
                      if (time != null) ...[
                        if (message.reactions.isNotEmpty)
                          const SizedBox(width: Space.sm),
                        Text(
                          time,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        tooltip: l10n.chReact,
                        onPressed: () => unawaited(_react(context)),
                        icon: Icon(
                          Icons.add_reaction_outlined,
                          size: 16,
                          color: scheme.onSurfaceVariant,
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

  Future<void> _react(BuildContext context) async {
    final emoji = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              for (final e in const ['👍', '✅', '⚠️', '🙏'])
                IconButton(
                  onPressed: () => Navigator.pop(ctx, e),
                  icon: Text(e, style: const TextStyle(fontSize: 28)),
                ),
            ],
          ),
        ),
      ),
    );
    if (emoji != null) await onReact(emoji);
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.busy,
    required this.hint,
    required this.onSend,
    required this.onVoice,
  });

  final TextEditingController controller;
  final bool busy;
  final String hint;
  final VoidCallback onSend;
  final VoidCallback onVoice;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    return Material(
      color: scheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.sm,
            Space.sm,
            Space.sm,
            Space.sm,
          ),
          child: Row(
            children: [
              IconButton(
                tooltip: l10n.chVoice,
                onPressed: busy ? null : onVoice,
                icon: const Icon(Icons.mic_none),
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
                    filled: true,
                    fillColor: scheme.surfaceContainerLow,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.lg,
                      vertical: Space.md,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(Corner.xl),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(Corner.xl),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: Space.xs),
              IconButton.filled(
                tooltip: l10n.chSend,
                onPressed: busy ? null : onSend,
                icon: const Icon(Icons.send, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VoiceBubble extends StatefulWidget {
  const _VoiceBubble({required this.body});

  final String body;

  @override
  State<_VoiceBubble> createState() => _VoiceBubbleState();
}

class _VoiceBubbleState extends State<_VoiceBubble> {
  bool _playing = false;

  int get _secs {
    final raw = widget.body.replaceFirst('VOICE:', '');
    return int.tryParse(raw) ?? 8;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return InkWell(
      onTap: () async {
        setState(() => _playing = true);
        await Future<void>.delayed(Duration(seconds: _secs.clamp(1, 8)));
        if (mounted) setState(() => _playing = false);
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _playing ? Icons.stop_circle_outlined : Icons.play_circle_outline,
          ),
          const SizedBox(width: Space.sm),
          Text(_playing ? l10n.chVoicePlay : '${l10n.chVoice} · ${_secs}s'),
        ],
      ),
    );
  }
}

Future<bool> _confirmDirective(BuildContext context, String title) async {
  final ok = await showModalBottomSheet<bool>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.all(Space.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(ctx).textTheme.titleMedium),
          const SizedBox(height: Space.md),
          Text(ctx.l10n.chConfirmBody),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: ctx.l10n.commonSave,
            onPressed: () => Navigator.pop(ctx, true),
          ),
          const SizedBox(height: Space.sm),
          PrimaryButton.secondary(
            label: ctx.l10n.commonCancel,
            onPressed: () => Navigator.pop(ctx, false),
          ),
        ],
      ),
    ),
  );
  return ok == true;
}
