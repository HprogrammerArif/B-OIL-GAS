import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ChairmanCockpit extends ConsumerStatefulWidget {
  const ChairmanCockpit({required this.dashboard, super.key});

  final Dashboard dashboard;

  @override
  ConsumerState<ChairmanCockpit> createState() => _ChairmanCockpitState();
}

class _ChairmanCockpitState extends ConsumerState<ChairmanCockpit> {
  int _tabIndex = 0;
  bool _showVoiceBar = false;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final tabs = [
      if (bangla) 'সারসংক্ষেপ' else 'Overview',
      if (bangla) 'স্বাক্ষরের ফাইল' else 'Files to Sign',
      if (bangla) 'ইনার সার্কেল' else 'Inner Circle',
      if (bangla) 'নোটিশ' else 'Notices',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Voice Briefing Bar (Executive Audio Control)
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.xs,
          ),
          child: Row(
            children: [
              Expanded(
                child: FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    backgroundColor: _showVoiceBar
                        ? scheme.primaryContainer
                        : scheme.surfaceContainerHighest,
                  ),
                  icon: Icon(
                    _showVoiceBar ? Icons.mic : Icons.mic_none,
                    color: scheme.primary,
                    size: 20,
                  ),
                  label: Text(
                    _showVoiceBar
                        ? (bangla
                              ? 'ভয়েস ব্রিফিং বন্ধ করুন'
                              : 'Hide Voice Briefing')
                        : (bangla
                              ? 'নির্বাহী ভয়েস ব্রিফিং'
                              : 'Executive Voice Briefing'),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: scheme.primary,
                    ),
                  ),
                  onPressed: () {
                    Haptics.tap();
                    setState(() => _showVoiceBar = !_showVoiceBar);
                  },
                ),
              ),
            ],
          ),
        ),

        if (_showVoiceBar) const _VoiceBriefingBar(),

        // Role Sub-Tabs
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.sm,
            Space.lg,
            Space.xs,
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < tabs.length; i++) ...[
                  ChoiceChip(
                    label: Text(tabs[i]),
                    selected: _tabIndex == i,
                    onSelected: (_) {
                      Haptics.tap();
                      setState(() => _tabIndex = i);
                    },
                  ),
                  const SizedBox(width: Space.xs),
                ],
              ],
            ),
          ),
        ),

        // Sub-Tab Content
        switch (_tabIndex) {
          1 => const _FilesToSignTab(),
          2 => _InnerCircleTab(
            leaders:
                widget.dashboard.extras
                    .where((e) => e.kind == 'leaders')
                    .firstOrNull
                    ?.leaders ??
                const [],
          ),
          3 => const _NoticesTab(),
          _ => _OverviewTab(dashboard: widget.dashboard),
        },
      ],
    );
  }
}

class _VoiceBriefingBar extends StatefulWidget {
  const _VoiceBriefingBar();

  @override
  State<_VoiceBriefingBar> createState() => _VoiceBriefingBarState();
}

class _VoiceBriefingBarState extends State<_VoiceBriefingBar> {
  final bool _isPlaying = false;
  bool _isRecording = false;
  int _recordSeconds = 0;
  Timer? _recordTimer;

  @override
  void dispose() {
    _recordTimer?.cancel();
    super.dispose();
  }

  void _toggleRecord() {
    Haptics.tap();
    if (_isRecording) {
      _recordTimer?.cancel();
      setState(() => _isRecording = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Voice briefing recorded & broadcast to Inner Circle'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      setState(() {
        _isRecording = true;
        _recordSeconds = 0;
      });
      _recordTimer = Timer.periodic(const Duration(seconds: 1), (t) {
        setState(() => _recordSeconds++);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Space.lg,
        Space.xs,
        Space.lg,
        Space.sm,
      ),
      child: Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(Corner.lg),
          border: Border.all(color: scheme.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: _isRecording ? Colors.red : scheme.primary,
                  child: Icon(
                    _isRecording
                        ? Icons.fiber_manual_record
                        : (_isPlaying ? Icons.pause : Icons.play_arrow),
                    color: Colors.white,
                    size: 18,
                  ),
                ),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isRecording
                            ? (bangla
                                  ? 'রেকর্ড হচ্ছে (০:$_recordSeconds)'
                                  : 'Recording (0:${_recordSeconds.toString().padLeft(2, '0')})...')
                            : (bangla
                                  ? 'দৈনিক চেয়ারম্যান ভয়েস বার্তা (০:৪২)'
                                  : "Today's Chairman Briefing (0:42)"),
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        bangla
                            ? '"কেরানীগঞ্জ ভিডিইউ ভালভ মেরামত শেষ করুন ও বিএসটিআই চালান দিন"'
                            : '"Prioritize Keraniganj VDU overhaul & clear BSTI challans"',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                          fontSize: 11,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(_isRecording ? Icons.stop_circle : Icons.mic),
                  color: _isRecording ? Colors.red : scheme.primary,
                  onPressed: _toggleRecord,
                  tooltip: _isRecording
                      ? 'Stop & Broadcast'
                      : 'Record New Briefing',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab({required this.dashboard});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inbox = ref.watch(approvalInboxProvider).value ?? const [];

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ROI Savings Card
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  scheme.primaryContainer.withValues(alpha: 0.5),
                  scheme.surface,
                ],
              ),
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(color: scheme.primary.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_graph, color: Colors.teal, size: 20),
                    const SizedBox(width: Space.xs),
                    Text(
                      bangla
                          ? 'অপারেশনাল সাশ্রয় ও কর্মদক্ষতা'
                          : 'OPERATIONAL EFFICIENCY SAVINGS',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.teal,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? '৳ ৪২.০ লক্ষ পরিবহন সাশ্রয়'
                      : 'BDT 42.0 Lakhs Saved in Fleet Logistics',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  bangla
                      ? 'ডিজিটাল স্মার্ট কারপুলিং ও নোট-শিট ই-স্বাক্ষরে সময় এবং জ্বালানি সাশ্রয়'
                      : 'Through smart pooling & digital note-sheet sign-offs across corridor',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // High-Value Files Awaiting Signature
          Text(
            bangla
                ? 'শীর্ষ অনুমোদনের ফাইল'
                : 'High-Value Files Awaiting Signature',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: Space.xs),
          if (inbox.isEmpty)
            Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Center(
                child: Text(
                  bangla
                      ? 'কোনো ফাইল অপেক্ষমান নেই'
                      : 'No files pending your signature',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ),
            )
          else
            for (final item in inbox.take(2))
              Padding(
                padding: const EdgeInsets.only(bottom: Space.sm),
                child: Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(Corner.lg),
                    border: Border.all(
                      color: scheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              bangla
                                  ? item.summary.titleBn
                                  : item.summary.title,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          if (item.summary.amount != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: scheme.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(Corner.sm),
                              ),
                              child: Text(
                                'BDT ${item.summary.amount}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: scheme.primary,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${item.initiator.display(bangla: bangla)} · ${item.stepName}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: Space.sm),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            onPressed: () => context.push(
                              AppRoutes.approvalDetail(item.instanceId),
                            ),
                            child: Text(bangla ? 'বিস্তারিত' : 'Open File'),
                          ),
                          const SizedBox(width: Space.sm),
                          FilledButton(
                            style: FilledButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            onPressed: () async {
                              Haptics.tap();
                              await ref
                                  .read(approvalRepositoryProvider)
                                  .approve(item.instanceId);
                              ref
                                ..invalidate(approvalInboxProvider)
                                ..invalidate(dashboardMeProvider);
                            },
                            child: Text(
                              bangla ? 'ডিজিটাল স্বাক্ষর' : 'E-Sign Now',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class _FilesToSignTab extends ConsumerWidget {
  const _FilesToSignTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inbox = ref.watch(approvalInboxProvider);

    return inbox.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(Space.xl),
        child: SkeletonList(itemCount: 3),
      ),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(approvalInboxProvider)),
      data: (items) {
        if (items.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(Space.xl),
            child: Center(
              child: Text(
                bangla
                    ? 'সব ফাইল স্বাক্ষরিত হয়েছে'
                    : 'All files signed and cleared',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ),
          );
        }
        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.sm,
          ),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: Space.sm),
          itemBuilder: (context, index) {
            final item = items[index];
            return Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(
                  color: scheme.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          bangla ? item.summary.titleBn : item.summary.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (item.summary.amount != null)
                        Text(
                          'BDT ${item.summary.amount}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: scheme.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.initiator.display(bangla: bangla)} · ${item.stepName}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => context.push(
                          AppRoutes.approvalDetail(item.instanceId),
                        ),
                        child: Text(bangla ? 'পর্যালোচনা' : 'Review'),
                      ),
                      const SizedBox(width: Space.sm),
                      FilledButton.tonal(
                        onPressed: () async {
                          Haptics.tap();
                          await ref
                              .read(approvalRepositoryProvider)
                              .approve(item.instanceId);
                          ref
                            ..invalidate(approvalInboxProvider)
                            ..invalidate(dashboardMeProvider);
                        },
                        child: Text(bangla ? 'অনুমোদন' : 'Approve'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _InnerCircleTab extends StatelessWidget {
  const _InnerCircleTab({required this.leaders});

  final List<Map<String, Object?>> leaders;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    if (leaders.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(Space.xl),
        child: Center(
          child: Text(
            bangla ? 'ইনার সার্কেল সদস্য নেই' : 'No leadership members found',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: scheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      itemCount: leaders.length,
      separatorBuilder: (_, _) => const SizedBox(height: Space.xs),
      itemBuilder: (context, index) {
        final l = leaders[index];
        final name =
            (bangla ? l['nameBn'] : l['name'])?.toString() ?? 'Executive';
        final title = l['title']?.toString() ?? '';
        final site = l['site']?.toString() ?? 'BOGCL';
        final isPlant = site.toLowerCase().contains('plant');

        return Container(
          padding: const EdgeInsets.all(Space.sm),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(Corner.lg),
            border: Border.all(
              color: scheme.outlineVariant.withValues(alpha: 0.5),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: isPlant
                    ? Colors.amber.shade800
                    : scheme.primary,
                child: Text(
                  name.isNotEmpty ? name[0] : 'E',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '$title · $site',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.flash_on, color: Colors.amber, size: 20),
                tooltip: 'Send Directive',
                onPressed: () => openAppRoute(context, AppRoutes.chat),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NoticesTab extends StatelessWidget {
  const _NoticesTab();

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    return Padding(
      padding: const EdgeInsets.all(Space.lg),
      child: Column(
        children: [
          ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Corner.lg),
              side: const BorderSide(color: Colors.black12),
            ),
            leading: const Icon(Icons.campaign, color: Colors.blue),
            title: Text(
              bangla
                  ? 'চেয়ারম্যান বিজ্ঞপ্তি সম্প্রচার'
                  : 'Broadcast Chairman Notice',
            ),
            subtitle: Text(
              bangla
                  ? 'সকল সাইট বা নির্দিষ্ট শাখায় পাঠান'
                  : 'Publish urgent circular to all sites',
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () => context.push(AppRoutes.noticeNew),
          ),
        ],
      ),
    );
  }
}
