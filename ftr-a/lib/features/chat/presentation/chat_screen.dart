import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 12), (_) {
      ref.invalidate(chatChannelsProvider);
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final rows = ref.watch(chatChannelsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleChat)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final p = await showPersonPicker(context, title: l10n.chDirect);
          if (p == null || !context.mounted) return;
          final ch = await ref
              .read(chatRepositoryProvider)
              .openDirect(p.person.userId);
          ref.invalidate(chatChannelsProvider);
          if (!context.mounted) return;
          unawaited(context.push(AppRoutes.chatThread(ch.id)));
        },
        icon: const Icon(Icons.person_outline),
        label: Text(l10n.chDirect),
      ),
      body: rows.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(chatChannelsProvider)),
        data: (list) {
          if (list.isEmpty) return EmptyState(message: l10n.chEmpty);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(chatChannelsProvider);
              await ref.read(chatChannelsProvider.future);
            },
            child: ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    Space.md,
                    Space.lg,
                    Space.xs,
                  ),
                  child: Text(l10n.chIntro),
                ),
                for (final c in list)
                  ListRow(
                    leading: const Icon(Icons.forum_outlined),
                    title: c.heading(bangla: bangla),
                    subtitle: c.lastPreview ?? l10n.chNoMessages,
                    trailing: c.unreadCount > 0
                        ? StatusPill(
                            label: '${c.unreadCount}',
                            tone: StatusTone.danger,
                          )
                        : (c.isLocked
                              ? StatusPill(label: l10n.chLocked)
                              : null),
                    onTap: () =>
                        unawaited(context.push(AppRoutes.chatThread(c.id))),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
