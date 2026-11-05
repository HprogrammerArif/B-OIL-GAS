import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
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

  Future<void> _direct() async {
    final l10n = context.l10n;
    final p = await showPersonPicker(context, title: l10n.chDirect);
    if (p == null || !mounted) return;
    final ch = await ref
        .read(chatRepositoryProvider)
        .openDirect(p.person.userId);
    ref.invalidate(chatChannelsProvider);
    if (!mounted) return;
    unawaited(context.push(AppRoutes.chatThread(ch.id)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final rows = ref.watch(chatChannelsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleChat),
        actions: [
          IconButton(
            tooltip: l10n.chDirect,
            onPressed: () => unawaited(_direct()),
            icon: const Icon(Icons.edit_outlined),
          ),
          const AppBarActions(),
        ],
      ),
      body: rows.when(
        loading: () => const SkeletonList(),
        error: (e, _) => ErrorState(
          message: e is ApiException ? e.message : l10n.commonErrorMessage,
          onRetry: () => ref.invalidate(chatChannelsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.forum_outlined,
              title: l10n.chEmptyTitle,
              message: l10n.chEmpty,
              actionLabel: l10n.chDirect,
              onAction: () => unawaited(_direct()),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(chatChannelsProvider);
              await ref.read(chatChannelsProvider.future);
            },
            child: ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, _) => Divider(
                height: 1,
                indent: 72,
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
              itemBuilder: (context, i) => _RoomTile(
                channel: list[i],
                bangla: bangla,
                onTap: () =>
                    unawaited(context.push(AppRoutes.chatThread(list[i].id))),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RoomTile extends StatelessWidget {
  const _RoomTile({
    required this.channel,
    required this.bangla,
    required this.onTap,
  });

  final ChatChannel channel;
  final bool bangla;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final preview = _preview(l10n, channel.lastPreview);
    final time = channel.lastAt == null
        ? null
        : DateFmt.time(channel.lastAt!, lang);
    final unread = channel.unreadCount > 0;

    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: kMinTouchTarget + Space.lg,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.md,
          ),
          child: Row(
            children: [
              Avatar(name: channel.heading(bangla: bangla)),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (channel.isLocked) ...[
                          Icon(
                            Icons.lock_outline,
                            size: 14,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: Space.xs),
                        ],
                        Expanded(
                          child: Text(
                            channel.heading(bangla: bangla),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: unread
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                            ),
                          ),
                        ),
                        if (time != null)
                          Text(
                            time,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: unread
                                  ? theme.colorScheme.primary
                                  : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            preview,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontWeight: unread
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                          ),
                        ),
                        if (unread) ...[
                          const SizedBox(width: Space.sm),
                          _Count(n: channel.unreadCount),
                        ],
                      ],
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

  String _preview(AppL10n l10n, String? body) {
    if (body == null || body.isEmpty) return l10n.chNoMessages;
    if (body.startsWith('VOICE:')) return l10n.chVoice;
    return body;
  }
}

class _Count extends StatelessWidget {
  const _Count({required this.n});

  final int n;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(Corner.xl),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        child: Text(
          n > 99 ? '99+' : '$n',
          style: Theme.of(context).textTheme.labelSmall
              ?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
