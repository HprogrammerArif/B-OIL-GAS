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
      if (mounted) {
        ref.invalidate(chatChannelsProvider);
      }
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final rows = ref.watch(chatChannelsProvider);

    final allChannels = rows.asData?.value ?? const <ChatChannel>[];
    final cmdCount = allChannels.where((c) => !c.isDirect).length;
    final dmCount = allChannels.where((c) => c.isDirect).length;
    final unreadTotal = allChannels
        .where((c) => c.unreadCount > 0)
        .fold<int>(0, (acc, c) => acc + c.unreadCount);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          bangla ? 'কমান্ড ও এক্সিকিউটিভ চ্যাট' : 'Command & Executive Chat',
        ),
        actions: [
          IconButton(
            tooltip: bangla ? 'নতুন ডিরেক্ট মেসেজ' : 'New Direct Message',
            onPressed: () => unawaited(_direct()),
            icon: const Icon(Icons.person_add_alt_1_outlined),
          ),
          const AppBarActions(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => unawaited(_direct()),
        icon: const Icon(Icons.chat_outlined, size: 18),
        label: Text(bangla ? 'নতুন বার্তা' : 'New Message'),
      ),
      body: Column(
        children: [
          // Live Status & Summary Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Space.md,
                vertical: Space.sm,
              ),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(
                  color: scheme.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: BrandColors.crimson.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(Corner.md),
                    ),
                    child: const Icon(
                      Icons.hub_outlined,
                      color: BrandColors.crimson,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bangla
                              ? '$cmdCountটি কমান্ড চ্যানেল · $dmCountটি ডিরেক্ট মেসেজ সক্রিয়'
                              : '$cmdCount Command Channels · $dmCount Direct Lines Active',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          unreadTotal > 0
                              ? (bangla
                                    ? '$unreadTotalটি অপঠিত বার্তা · সদর দপ্তর ও কেরানীগঞ্জ সংযুক্ত'
                                    : '$unreadTotal unread messages · HQ & Refinery plants linked')
                              : (bangla
                                    ? 'সকল বার্তা পঠিত · সদর দপ্তর ও রিফাইনারি প্ল্যান্ট সংযুক্ত'
                                    : 'All caught up · Baridhara HQ & Refinery plants linked'),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                            fontSize: 11.5,
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
                    ? 'চ্যানেল, কর্মকর্তা বা বার্তা অনুসন্ধান...'
                    : 'Search channels, colleagues, or messages...',
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
              ),
              onChanged: (v) =>
                  setState(() => _search = v.trim().toLowerCase()),
            ),
          ),
          const SizedBox(height: Space.xs),

          // Filter Chips with Live Counts
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: Space.md),
            child: Row(
              children: [
                _filterChip(
                  'ALL',
                  bangla
                      ? 'সকল (${allChannels.length})'
                      : 'All (${allChannels.length})',
                ),
                _filterChip(
                  'COMMAND',
                  bangla
                      ? 'কমান্ড চ্যানেল ($cmdCount)'
                      : 'Channels # ($cmdCount)',
                ),
                _filterChip(
                  'DIRECT',
                  bangla ? 'ডিরেক্ট মেসেজ ($dmCount)' : 'Direct 1:1 ($dmCount)',
                ),
                if (unreadTotal > 0)
                  _filterChip(
                    'UNREAD',
                    bangla ? 'অপঠিত ($unreadTotal)' : 'Unread ($unreadTotal)',
                  ),
              ],
            ),
          ),
          const SizedBox(height: Space.xs),

          // Channel Stream
          Expanded(
            child: rows.when(
              skipLoadingOnReload: true,
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
                  if (_filter == 'UNREAD' && c.unreadCount == 0) return false;
                  if (_search.isNotEmpty) {
                    final h = c.heading(bangla: bangla).toLowerCase();
                    final sub = c.subheading(bangla: bangla).toLowerCase();
                    final prev = (c.lastPreview ?? '').toLowerCase();
                    if (!h.contains(_search) &&
                        !sub.contains(_search) &&
                        !prev.contains(_search)) {
                      return false;
                    }
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
                    padding: const EdgeInsets.only(bottom: 88),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => Divider(
                      height: 1,
                      indent: 72,
                      color: scheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                    itemBuilder: (context, i) => _RoomTile(
                      channel: filtered[i],
                      bangla: bangla,
                      onTap: () => unawaited(
                        context.push(AppRoutes.chatThread(filtered[i].id)),
                      ),
                      onCall: () => _showEncryptedCallModal(
                        filtered[i].heading(bangla: bangla),
                        filtered[i].subheading(bangla: bangla).isNotEmpty
                            ? filtered[i].subheading(bangla: bangla)
                            : (filtered[i].isDirect
                                  ? 'Direct Executive Line'
                                  : 'Command Voice Bridge'),
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
        visualDensity: VisualDensity.compact,
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _filter == key,
        onSelected: (_) {
          Haptics.tap();
          setState(() => _filter = key);
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
    required this.onCall,
  });

  final ChatChannel channel;
  final bool bangla;
  final VoidCallback onTap;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final preview = _preview(
      l10n,
      channel.lastPreview,
      channel.lastSender,
      channel.isDirect,
      bangla,
    );
    final time = channel.lastAt == null
        ? null
        : DateFmt.time(channel.lastAt!, lang);
    final unread = channel.unreadCount > 0;
    final sub = channel.subheading(bangla: bangla);

    final presence = channel.isDirect
        ? _presenceBadge(channel.name, channel.presence, bangla)
        : null;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Space.md,
          vertical: Space.sm + 2,
        ),
        child: Row(
          children: [
            // Channel Icon or Colleague Avatar with Status Dot
            Stack(
              children: [
                if (channel.isDirect)
                  Avatar(name: channel.heading(bangla: bangla))
                else
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: scheme.primaryContainer.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(Corner.md),
                    ),
                    child: Icon(
                      channel.isLocked ? Icons.campaign_outlined : Icons.tag,
                      color: scheme.primary,
                      size: 22,
                    ),
                  ),
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
                        border: Border.all(color: scheme.surface, width: 2),
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
                      if (channel.isLocked && !channel.isDirect) ...[
                        Icon(
                          Icons.verified_outlined,
                          size: 14,
                          color: scheme.primary,
                        ),
                        const SizedBox(width: 4),
                      ],
                      Expanded(
                        child: Text(
                          channel.heading(bangla: bangla),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: unread
                                ? FontWeight.w800
                                : FontWeight.w700,
                          ),
                        ),
                      ),
                      if (time != null)
                        Text(
                          time,
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: unread
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: unread
                                ? scheme.primary
                                : scheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                  if (sub.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      sub,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: channel.isDirect
                            ? scheme.primary.withValues(alpha: 0.85)
                            : scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          preview,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: unread
                                ? scheme.onSurface
                                : scheme.onSurfaceVariant,
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
            IconButton(
              tooltip: bangla ? 'কল করুন' : 'Voice Call',
              icon: const Icon(Icons.call_outlined, size: 18),
              onPressed: onCall,
            ),
          ],
        ),
      ),
    );
  }

  (String label, Color color) _presenceBadge(
    String name,
    String rawPresence,
    bool bangla,
  ) {
    if (name.contains('Harunur') || name.contains('হারুনুর')) {
      return (
        bangla ? 'প্ল্যান্টে উপস্থিত' : 'On Site at Keraniganj',
        BrandColors.info,
      );
    }
    if (rawPresence == 'IN_MEETING' ||
        name.contains('Sayeda') ||
        name.contains('সায়েদা')) {
      return (bangla ? 'মিটিংয়ে' : 'In Meeting', BrandColors.warning);
    }
    return (bangla ? 'অনলাইনে' : 'Online', BrandColors.success);
  }

  String _preview(
    AppL10n l10n,
    String? body,
    String? sender,
    bool isDirect,
    bool bangla,
  ) {
    if (body == null || body.isEmpty) return l10n.chNoMessages;
    var clean = body;
    if (body.startsWith('VOICE:')) {
      final parts = body.split('|');
      clean = parts.length > 1 && parts[1].trim().isNotEmpty
          ? '🎤 ${parts[1].trim()}'
          : '🎤 ${l10n.chVoice}';
    } else if (body.startsWith('[VOICE BRIEFING')) {
      clean =
          '🎤 ${body.replaceAll(RegExp(r'^\[VOICE BRIEFING[^\]]*\]\s*'), '')}';
    } else if (body.startsWith('Attached ')) {
      clean = '📎 $body';
    }
    if (!isDirect && sender != null && sender.isNotEmpty) {
      final shortSender = sender.split(' ').last;
      return '$shortSender: $clean';
    }
    return clean;
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
