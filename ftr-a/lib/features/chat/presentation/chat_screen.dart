import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
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
  String _filter = 'ALL';
  String _search = '';

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
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                    fontFeatures: [],
                  ),
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final rows = ref.watch(chatChannelsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          bangla
              ? 'ইনার-সার্কেল লিডারশিপ চ্যাট'
              : 'Inner-Circle Leadership Chat',
        ),
        actions: [
          IconButton(
            tooltip: bangla ? 'সিকিউর কল' : 'Secure Call',
            icon: const Icon(Icons.phone_in_talk_outlined),
            onPressed: () => _showEncryptedCallModal(
              'Engr. Md. Harunur Rashid',
              'Plant General Manager (Keraniganj)',
            ),
          ),
          IconButton(
            tooltip: l10n.chDirect,
            onPressed: () => unawaited(_direct()),
            icon: const Icon(Icons.edit_outlined),
          ),
          const AppBarActions(),
        ],
      ),
      body: Column(
        children: [
          // Plain-Language Verdict Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant,
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.shield_outlined,
                    color: BrandColors.crimson,
                    size: 24,
                  ),
                  const SizedBox(width: Space.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bangla
                              ? '৪টি কমান্ড চ্যানেল ও এক্সিকিউটিভ ডিরেক্ট মেসেজ সক্রিয়'
                              : '4 command channels & executive direct lines active',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bangla
                              ? 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস অভ্যন্তরীণ প্রটোকলে সংরক্ষিত।'
                              : 'Encrypted under BOGCL internal executive protocol.',
                          style: TextStyle(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.sm),

          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.md),
            child: TextField(
              decoration: InputDecoration(
                hintText: bangla
                    ? 'চ্যানেল বা বার্তা অনুসন্ধান...'
                    : 'Search channels & messages...',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
              ),
              onChanged: (v) =>
                  setState(() => _search = v.trim().toLowerCase()),
            ),
          ),
          const SizedBox(height: Space.xs),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: Space.md),
            child: Row(
              children: [
                _filterChip('ALL', bangla ? 'সকল' : 'All Channels'),
                _filterChip(
                  'COMMAND',
                  bangla ? 'কমান্ড চ্যানেল (#)' : 'Command Channels (#)',
                ),
                _filterChip(
                  'DIRECT',
                  bangla ? 'ডিরেক্ট মেসেজ (১:১)' : 'Direct Messages (1:1)',
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xs),

          // Channel Stream
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (e, _) => ErrorState(
                message: e is ApiException
                    ? e.message
                    : l10n.commonErrorMessage,
                onRetry: () => ref.invalidate(chatChannelsProvider),
              ),
              data: (list) {
                final filtered = list.where((c) {
                  if (_filter == 'COMMAND' && c.isDirect) return false;
                  if (_filter == 'DIRECT' && !c.isDirect) return false;
                  if (_search.isNotEmpty &&
                      !c
                          .heading(bangla: bangla)
                          .toLowerCase()
                          .contains(_search)) {
                    return false;
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
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
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => Divider(
                      height: 1,
                      indent: 72,
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                    itemBuilder: (context, i) => _RoomTile(
                      channel: filtered[i],
                      bangla: bangla,
                      onTap: () => unawaited(
                        context.push(AppRoutes.chatThread(filtered[i].id)),
                      ),
                      onCall: () => _showEncryptedCallModal(
                        filtered[i].heading(bangla: bangla),
                        filtered[i].isDirect
                            ? 'Direct Line'
                            : 'Command Voice Bridge',
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String key, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _filter == key,
        onSelected: (_) => setState(() => _filter = key),
      ),
    );
  }
}

class _RoomTile extends StatelessWidget {
  const _RoomTile({
    required this.channel,
    required this.bangla,
    required this.onTap,
    required this.onCall,
  });

  final ChatChannel channel;
  final bool bangla;
  final VoidCallback onTap;
  final VoidCallback onCall;

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

    // Simulated presence status for direct executive messages
    final presence = channel.isDirect
        ? _presenceStatus(channel.name, bangla)
        : null;

    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: kMinTouchTarget + Space.lg,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.md,
            vertical: Space.md,
          ),
          child: Row(
            children: [
              Stack(
                children: [
                  Avatar(name: channel.heading(bangla: bangla)),
                  if (presence != null)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: presence.$2,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
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
                    if (presence != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        presence.$1,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: presence.$2,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.call_outlined, size: 18),
                onPressed: onCall,
              ),
            ],
          ),
        ),
      ),
    );
  }

  (String label, Color color) _presenceStatus(String name, bool bangla) {
    if (name.contains('Harunur')) {
      return (
        bangla
            ? '● প্ল্যান্টে উপস্থিত (কেরানীগঞ্জ)'
            : '● On Site at Keraniganj',
        BrandColors.info,
      );
    }
    if (name.contains('Farida')) {
      return (
        bangla ? '● অনলাইনে (হেড অফিস)' : '● Online at Baridhara HQ',
        BrandColors.success,
      );
    }
    if (name.contains('Sayeda')) {
      return (
        bangla ? '◐ মিটিংয়ে ব্যস্ত' : '◐ In Meeting',
        BrandColors.warning,
      );
    }
    return (bangla ? '○ দূরে আছেন' : '○ Away', Colors.grey);
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
