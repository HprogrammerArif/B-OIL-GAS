import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
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

    return Scaffold(
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
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
            child: Text(l10n.chSecureNote),
          ),
          Expanded(
            child: msgs.when(
              loading: () => const SkeletonList(),
              error: (_, _) => ErrorState(
                onRetry: () => ref.invalidate(chatMessagesProvider(widget.id)),
              ),
              data: (list) {
                if (list.isEmpty) return EmptyState(message: l10n.chNoMessages);
                final last = list.last.id;
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  unawaited(_repo.read(widget.id, last));
                });
                return ListView.builder(
                  padding: const EdgeInsets.all(Space.lg),
                  itemCount: list.length,
                  itemBuilder: (ctx, i) {
                    final m = list[i];
                    if (m.deleted) return Text(l10n.chDeleted);
                    final align = m.mine
                        ? Alignment.centerRight
                        : Alignment.centerLeft;
                    return Align(
                      alignment: align,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 320),
                        child: Card(
                          color: m.type == 'DIRECTIVE'
                              ? Theme.of(ctx).colorScheme.tertiaryContainer
                              : null,
                          child: Padding(
                            padding: const EdgeInsets.all(Space.md),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!m.mine)
                                  Text(
                                    m.sender?.display(bangla: bangla) ?? '',
                                    style: Theme.of(ctx).textTheme.labelMedium,
                                  ),
                                Text(m.body ?? ''),
                                if (m.directive != null) ...[
                                  const SizedBox(height: Space.sm),
                                  Text(m.directive!.body),
                                  Text(
                                    l10n.chAckCount(
                                      m.directive!.acks,
                                      m.directive!.needed,
                                    ),
                                  ),
                                  if (m.directive!.executedAt == null &&
                                      !m.mine)
                                    TextButton(
                                      onPressed: _busy
                                          ? null
                                          : () async {
                                              await _repo.ack(m.directive!.id);
                                              ref.invalidate(
                                                chatMessagesProvider(widget.id),
                                              );
                                            },
                                      child: Text(l10n.chActAck),
                                    ),
                                  if (canDir && m.directive!.executedAt == null)
                                    TextButton(
                                      onPressed: _busy
                                          ? null
                                          : () async {
                                              await _repo.execute(
                                                m.directive!.id,
                                              );
                                              ref.invalidate(
                                                chatMessagesProvider(widget.id),
                                              );
                                            },
                                      child: Text(l10n.chActDone),
                                    ),
                                ],
                                if (m.reactions.isNotEmpty)
                                  Text(m.reactions.join(' ')),
                                Wrap(
                                  children: [
                                    for (final e in const [
                                      '👍',
                                      '✅',
                                      '⚠️',
                                      '🙏',
                                    ])
                                      TextButton(
                                        onPressed: () async {
                                          await _repo.react(m.id, e);
                                          ref.invalidate(
                                            chatMessagesProvider(widget.id),
                                          );
                                        },
                                        child: Text(e),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.lg,
                0,
                Space.lg,
                Space.md,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      decoration: InputDecoration(hintText: l10n.chHint),
                      minLines: 1,
                      maxLines: 4,
                    ),
                  ),
                  IconButton(
                    tooltip: l10n.chSend,
                    onPressed: _busy ? null : _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
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
