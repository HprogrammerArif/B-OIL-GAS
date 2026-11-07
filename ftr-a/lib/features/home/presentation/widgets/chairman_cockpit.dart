import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/presentation/approval_providers.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/presentation/chat_providers.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/dashboards/presentation/dashboard_providers.dart';
import 'package:bogcl_oneops/features/people/domain/person_pick.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
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
                    _showVoiceBar ? Icons.graphic_eq : Icons.mic_none,
                    color: scheme.primary,
                    size: 20,
                  ),
                  label: Text(
                    _showVoiceBar
                        ? (bangla
                              ? 'ভয়েস ব্রিফিং স্টুডিও বন্ধ করুন'
                              : 'Close Executive Voice Briefing')
                        : (bangla
                              ? 'নির্বাহী ভয়েস ব্রিফিং ও নির্দেশনা'
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

        if (_showVoiceBar) _VoiceBriefingConsole(dashboard: widget.dashboard),

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

class _VoiceBriefingConsole extends ConsumerStatefulWidget {
  const _VoiceBriefingConsole({required this.dashboard});

  final Dashboard dashboard;

  @override
  ConsumerState<_VoiceBriefingConsole> createState() =>
      _VoiceBriefingConsoleState();
}

class _VoiceBriefingConsoleState extends ConsumerState<_VoiceBriefingConsole> {
  static const int _totalSec = 30;
  static const List<int> _waveHeights = [
    10,
    16,
    22,
    14,
    24,
    18,
    12,
    22,
    26,
    15,
    20,
    24,
    14,
    18,
    25,
    19,
    12,
    22,
    16,
    20,
    24,
    15,
    12,
    16,
  ];

  // Section 1: Play Today's Briefing state
  bool _isPlaying = false;
  double _elapsedSec = 0;
  Timer? _playTimer;
  int _waveTick = 0;

  // Section 2: Recipient & 1-Tap Voice Order Recorder state
  // 0 = All Refineries, 4 = Single Particular Refinery, 3 = Single Employee, 1 = All BOGCL Staff, 2 = Leadership (GMs/HODs)
  int _targetIndex = 0;
  int _selectedRefineryIndex = 0;
  PersonPick? _pickedPerson;
  bool _isRecording = false;
  bool _hasRecorded = false;
  bool _isSending = false;
  bool _isSent = false;
  int _recordSec = 0;
  int _ackCount = 1;
  String? _sentChannelId;
  String _transcribedText = '';
  Timer? _recordTimer;
  Timer? _ackTimer;

  static const List<
    ({
      String nameEn,
      String nameBn,
      String staffEn,
      String staffBn,
      String headEn,
      String headBn,
      String voiceEn,
      String voiceBn,
    })
  >
  _refineries = [
    (
      nameEn: 'Keraniganj Bitumen Refinery Plant',
      nameBn: 'কেরানীগঞ্জ বিটুমিন রিফাইনারি প্ল্যান্ট',
      staffEn: '298 Staff',
      staffBn: '২৯৮ জন কর্মী',
      headEn: 'Plant GM: Engr. Harunur Rashid',
      headBn: 'প্ল্যান্ট জিএম: প্রকৌশলী হারুনুর রশিদ',
      voiceEn: 'Attention Keraniganj Bitumen Refinery team: complete the Vacuum Distillation Unit valve inspection and Tank TK-109 hydro-test with 100% PPE compliance today.',
      voiceBn: 'কেরানীগঞ্জ বিটুমিন রিফাইনারি টিমের প্রতি নির্দেশনা: আজ শতভাগ পিপিই ও নিরাপত্তা নিশ্চিত করে ভিডিইউ ভালভ পরিদর্শন এবং ট্যাংক TK-109 পরীক্ষা সম্পন্ন করুন।',
    ),
    (
      nameEn: 'Chattogram Refinery & Bulk Terminal',
      nameBn: 'চট্টগ্রাম রিফাইনারি ও বাল্ক টার্মিনাল',
      staffEn: '85 Staff',
      staffBn: '৮৫ জন কর্মী',
      headEn: 'Terminal Head: Engr. Mahmudul Hasan',
      headBn: 'টার্মিনাল প্রধান: প্রকৌশলী মাহমুদুল হাসান',
      voiceEn: 'Attention Chattogram Refinery & Terminal staff: verify jetty pipeline pressure seals and clear all coastal bitumen vessel loading manifests before 5:00 PM.',
      voiceBn: 'চট্টগ্রাম রিফাইনারি ও টার্মিনালের সকল কর্মীদের প্রতি: বিকেল ৫টার মধ্যে জেটি পাইপলাইনের প্রেসার সিল যাচাই করুন এবং বিটুমিন জাহাজ লোডিং ম্যানিফেস্ট সম্পন্ন করুন।',
    ),
    (
      nameEn: 'Mongla Petrochemical & LPG Refinery',
      nameBn: 'মোংলা পেট্রোকেমিক্যাল ও এলপিজি রিফাইনারি',
      staffEn: '60 Staff',
      staffBn: '৬০ জন কর্মী',
      headEn: 'Unit Head: Engr. Tariqul Islam',
      headBn: 'ইউনিট প্রধান: প্রকৌশলী তরিকুল ইসলাম',
      voiceEn: 'Attention Mongla Refinery Unit: complete the spherical storage tank safety valve calibration and submit the daily dispatch log to HQ.',
      voiceBn: 'মোংলা রিফাইনারি ইউনিটের সকল কর্মীদের প্রতি: স্টোরেজ ট্যাংকের সেফটি ভালভ ক্যালিব্রেশন সম্পন্ন করুন এবং দৈনিক ডিসপ্যাচ লগ সদর দপ্তরে পাঠান।',
    ),
  ];

  String _defaultVoiceText(bool bangla) {
    if (_targetIndex == 4) {
      final r = _refineries[_selectedRefineryIndex];
      return bangla ? r.voiceBn : r.voiceEn;
    }
    if (_targetIndex == 3 && _pickedPerson != null) {
      final name = _pickedPerson!.person.display(bangla: bangla);
      return bangla
          ? '$name, আজ বিকেল ৪টার মধ্যে কেরানীগঞ্জ রিফাইনারি পরিদর্শন প্রতিবেদন সম্পন্ন করে আমার দপ্তরে আপডেট দিন।'
          : '$name, please complete the Keraniganj refinery inspection report and update my office by 4:00 PM today.';
    }
    if (_targetIndex == 0) {
      return bangla
          ? 'সকল রিফাইনারি ইউনিটের (কেরানীগঞ্জ, চট্টগ্রাম ও মোংলা) কর্মীদের প্রতি নির্দেশনা: আজকের অপারেশন চলাকালীন শতভাগ পিপিই এবং H2S নিরাপত্তা প্রটোকল নিশ্চিত করুন।'
          : 'Attention all employees across Keraniganj, Chattogram, and Mongla Refineries: maintain 100% PPE and H2S safety compliance across all units today.';
    }
    if (_targetIndex == 1) {
      return bangla
          ? 'বসুন্ধরা অয়েল অ্যান্ড গ্যাসের সকল কর্মকর্তা ও কর্মচারীদের প্রতি: বারিধারা সদর দপ্তর ও সকল রিফাইনারি প্ল্যান্টে ডিজিটাল নোট-শিট ও সময়ানুবর্তিতা বজায় রাখুন।'
          : 'To all BOGCL employees across HQ and all Refinery Plants: continue maintaining our 40-day zero-injury safety record and digital workflow discipline.';
    }
    return bangla
        ? 'আজ বিকেল ৪টার মধ্যে কেরানীগঞ্জ ভিডিইউ ভালভ পরীক্ষা সম্পন্ন করুন এবং বিটুমিন ট্যাংক TK-109 ফাইল পেশ করুন।'
        : 'Please complete the Keraniganj VDU valve check and submit the Bitumen Tank TK-109 file by 4:00 PM today.';
  }

  String _recipientLabel(bool bangla) {
    if (_targetIndex == 4) {
      final r = _refineries[_selectedRefineryIndex];
      return bangla
          ? '${r.nameBn} (${r.staffBn})'
          : '${r.nameEn} (${r.staffEn})';
    }
    if (_targetIndex == 3 && _pickedPerson != null) {
      final name = _pickedPerson!.person.display(bangla: bangla);
      final title = _pickedPerson!.person.title;
      return title != null && title.isNotEmpty ? '$name ($title)' : name;
    }
    return switch (_targetIndex) {
      0 =>
        bangla
            ? 'সকল রিফাইনারি প্ল্যান্ট (কেরানীগঞ্জ, চট্টগ্রাম ও মোংলা · ৪৪৩ জন)'
            : 'All Refineries (Keraniganj, Chattogram & Mongla · 443 Staff)',
      1 =>
        bangla
            ? 'সকল কোম্পানি কর্মী (HQ ও সকল রিফাইনারি · ৫৫৭ জন)'
            : 'All BOGCL Employees (HQ + All Refineries · 557 Staff)',
      _ =>
        bangla
            ? 'সকল জিএম ও বিভাগীয় প্রধান (৬ জন)'
            : 'All GMs & HODs (Leadership)',
    };
  }

  Future<void> _pickSingleRefinery(bool bangla) async {
    Haptics.tap();
    final picked = await showModalBottomSheet<int>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        final scheme = theme.colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bangla
                      ? 'নির্দিষ্ট রিফাইনারি নির্বাচন করুন'
                      : 'Select Particular Refinery',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  bangla
                      ? 'যে রিফাইনারির সকল কর্মকর্তা ও কর্মচারীদের ভয়েস ব্রিফিং পাঠাতে চান তা বেছে নিন'
                      : 'Choose which refinery plant will receive this voice briefing',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                for (var i = 0; i < _refineries.length; i++) ...[
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: 2,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Corner.md),
                      side: BorderSide(
                        color: _targetIndex == 4 && _selectedRefineryIndex == i
                            ? scheme.primary
                            : scheme.outlineVariant,
                      ),
                    ),
                    leading: CircleAvatar(
                      backgroundColor: scheme.primaryContainer,
                      child: Icon(
                        Icons.factory_outlined,
                        color: scheme.primary,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      bangla ? _refineries[i].nameBn : _refineries[i].nameEn,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                      ),
                    ),
                    subtitle: Text(
                      bangla
                          ? '${_refineries[i].staffBn} · ${_refineries[i].headBn}'
                          : '${_refineries[i].staffEn} · ${_refineries[i].headEn}',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    trailing: _targetIndex == 4 && _selectedRefineryIndex == i
                        ? Icon(Icons.check_circle, color: scheme.primary)
                        : const Icon(Icons.chevron_right, size: 18),
                    onTap: () => Navigator.pop(ctx, i),
                  ),
                  const SizedBox(height: Space.xs),
                ],
              ],
            ),
          ),
        );
      },
    );
    if (picked == null || !mounted) return;
    setState(() {
      _targetIndex = 4;
      _selectedRefineryIndex = picked;
      _isSent = false;
      if (_hasRecorded) {
        _transcribedText = _defaultVoiceText(bangla);
      }
    });
  }

  Future<void> _pickSingleEmployee(bool bangla) async {
    Haptics.tap();
    final picked = await showPersonPicker(
      context,
      title: bangla
          ? 'ভয়েস ব্রিফিংয়ের জন্য কর্মী নির্বাচন করুন'
          : 'Select Employee for Voice Briefing',
    );
    if (picked == null || !mounted) return;
    setState(() {
      _targetIndex = 3;
      _pickedPerson = picked;
      _isSent = false;
      if (_hasRecorded) {
        _transcribedText = _defaultVoiceText(bangla);
      }
    });
  }

  @override
  void dispose() {
    _playTimer?.cancel();
    _recordTimer?.cancel();
    _ackTimer?.cancel();
    super.dispose();
  }

  void _togglePlay() {
    Haptics.tap();
    if (_isPlaying) {
      _playTimer?.cancel();
      setState(() => _isPlaying = false);
      return;
    }
    if (_elapsedSec >= _totalSec) {
      _elapsedSec = 0;
    }
    setState(() => _isPlaying = true);
    _playTimer?.cancel();
    _playTimer = Timer.periodic(const Duration(milliseconds: 250), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _waveTick++;
        _elapsedSec += 0.25;
        if (_elapsedSec >= _totalSec) {
          _elapsedSec = _totalSec.toDouble();
          _isPlaying = false;
          timer.cancel();
        }
      });
    });
  }

  void _startRecording(bool bangla) {
    Haptics.tap();
    if (_isPlaying) {
      _playTimer?.cancel();
      _isPlaying = false;
    }
    final words = _defaultVoiceText(bangla).split(' ');
    var tick = 0;

    setState(() {
      _isRecording = true;
      _hasRecorded = false;
      _isSent = false;
      _recordSec = 0;
      _transcribedText = '';
    });

    _recordTimer?.cancel();
    _recordTimer = Timer.periodic(const Duration(milliseconds: 250), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      tick++;
      setState(() {
        _waveTick++;
        _recordSec = tick ~/ 4;
        final count = (tick / 1.3).ceil().clamp(1, words.length);
        _transcribedText = words.take(count).join(' ');
        if (count >= words.length && tick >= 18) {
          _isRecording = false;
          _hasRecorded = true;
          _recordSec = 5;
          timer.cancel();
          Haptics.success();
        }
      });
    });
  }

  void _stopRecording(bool bangla) {
    Haptics.tap();
    _recordTimer?.cancel();
    setState(() {
      _isRecording = false;
      _hasRecorded = true;
      if (_recordSec < 2) _recordSec = 4;
      _transcribedText = _defaultVoiceText(bangla);
    });
  }

  void _cancelRecording() {
    Haptics.tap();
    _recordTimer?.cancel();
    setState(() {
      _isRecording = false;
      _hasRecorded = false;
      _transcribedText = '';
    });
  }

  Future<void> _sendVoiceOrder(bool bangla) async {
    if (_isSending) return;
    if (_targetIndex == 3 && _pickedPerson == null) {
      await _pickSingleEmployee(bangla);
      if (_pickedPerson == null) return;
    }

    Haptics.tap();
    setState(() => _isSending = true);

    final bodyText = _transcribedText.isNotEmpty
        ? _transcribedText
        : _defaultVoiceText(bangla);
    final recipient = _recipientLabel(bangla);

    String? channelId;
    try {
      final chatRepo = ref.read(chatRepositoryProvider);
      if (_targetIndex == 3 && _pickedPerson != null) {
        final directCh = await chatRepo.openDirect(
          _pickedPerson!.person.userId,
        );
        channelId = directCh.id;
      } else {
        final channels = await ref.read(chatChannelsProvider.future);
        if (channels.isNotEmpty) {
          channelId = channels.first.id;
        }
      }

      if (channelId != null) {
        await chatRepo.sendVoice(channelId, _recordSec.clamp(4, 30));
        await chatRepo.issue(channelId, {
          'title': bangla
              ? '🎙️ চেয়ারম্যান ভয়েস ব্রিফিং ($recipient)'
              : '🎙️ Chairman Voice Briefing ($recipient)',
          'body': bodyText,
        });
        ref
          ..invalidate(chatChannelsProvider)
          ..invalidate(chatMessagesProvider(channelId));
      }
    } on Object catch (_) {
      // Offline queue handles persistence automatically.
    }

    if (!mounted) return;
    Haptics.success();

    setState(() {
      _isSending = false;
      _hasRecorded = false;
      _isSent = true;
      _ackCount = 1;
      _sentChannelId = channelId;
    });

    AppToast.show(
      context,
      bangla
          ? 'ভয়েস ব্রিফিং পাঠানো হয়েছে: $recipient'
          : 'Voice Briefing sent to $recipient',
      tone: StatusTone.success,
    );

    _ackTimer?.cancel();
    _ackTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (!mounted || !_isSent) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_ackCount < 2) {
          _ackCount++;
        } else {
          timer.cancel();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inbox = ref.watch(approvalInboxProvider).value ?? const [];
    final pendingCount = inbox.isNotEmpty
        ? inbox.length
        : (int.tryParse(
                widget.dashboard.kpis.firstOrNull?.value?.toString() ?? '4',
              ) ??
              4);

    final curSec = _elapsedSec.floor().clamp(0, _totalSec);
    final progress = (_elapsedSec / _totalSec).clamp(0.0, 1.0);
    final activeBars = (progress * _waveHeights.length).round();

    // Which of the 3 bullet points is currently being read (0, 1, or 2)
    final activeBullet = !_isPlaying && _elapsedSec == 0
        ? -1
        : (curSec < 10 ? 0 : (curSec < 20 ? 1 : 2));

    final bullets = [
      (
        title: bangla ? '১. অনুমোদন' : '1. Approvals',
        body: bangla
            ? '$pendingCountটি ফাইল আপনার স্বাক্ষরের অপেক্ষায় (ট্যাংক TK-109 সহ)।'
            : '$pendingCount files waiting for your signature (led by Tank TK-109).',
      ),
      (
        title: bangla ? '২. রিফাইনারি ও নিরাপত্তা' : '2. Refinery & Safety',
        body: bangla
            ? 'কেরানীগঞ্জ উৎপাদন ১,৪২০ মেট্রিক টন (৯৪.৬%), ৪০ দিন দুর্ঘটনা-মুক্ত।'
            : 'Keraniganj at 1,420 MT/day (94.6%), 40 days injury-free.',
      ),
      (
        title: bangla ? '৩. লাইসেন্স ও সাশ্রয়' : '3. Compliance & Savings',
        body: bangla
            ? '৯৬% লাইসেন্স বৈধ · পরিবহনে ৳ ৪২.০ লক্ষ সাশ্রয়।'
            : '96% licences valid · BDT 42.0 Lakhs saved in fleet logistics.',
      ),
    ];

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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // SECTION 1: Play Today's Briefing
            Row(
              children: [
                IconButton.filled(
                  style: IconButton.styleFrom(
                    backgroundColor: scheme.primary,
                    foregroundColor: scheme.onPrimary,
                  ),
                  onPressed: _togglePlay,
                  icon: Icon(
                    _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    size: 24,
                  ),
                ),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              bangla
                                  ? 'আজকের সংক্ষিপ্ত ব্রিফিং শুনুন'
                                  : "Listen to Today's Summary",
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Text(
                            '0:${curSec.toString().padLeft(2, '0')} / 0:$_totalSec',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        height: 24,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            for (var i = 0; i < _waveHeights.length; i++)
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 160),
                                width: 3.5,
                                height: _isPlaying && i <= activeBars
                                    ? (_waveHeights[i] +
                                              ((_waveTick + i) % 4) * 2)
                                          .clamp(8, 24)
                                          .toDouble()
                                    : (_waveHeights[i] * 0.75).clamp(6, 22),
                                decoration: BoxDecoration(
                                  color: i <= activeBars
                                      ? scheme.primary
                                      : scheme.outlineVariant,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: Space.sm),

            // 3 Plain-Language Bullet Points
            Container(
              padding: const EdgeInsets.all(Space.sm),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(Corner.md),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var i = 0; i < bullets.length; i++)
                    Padding(
                      padding: EdgeInsets.only(bottom: i < 2 ? 6 : 0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            activeBullet == i
                                ? Icons.volume_up_rounded
                                : Icons.check_circle_outline,
                            size: 15,
                            color: activeBullet == i
                                ? scheme.primary
                                : scheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontSize: 12,
                                  height: 1.35,
                                  color: activeBullet == i
                                      ? scheme.onSurface
                                      : scheme.onSurfaceVariant,
                                ),
                                children: [
                                  TextSpan(
                                    text: '${bullets[i].title}: ',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: activeBullet == i
                                          ? scheme.primary
                                          : scheme.onSurface,
                                    ),
                                  ),
                                  TextSpan(
                                    text: bullets[i].body,
                                    style: TextStyle(
                                      fontWeight: activeBullet == i
                                          ? FontWeight.w700
                                          : FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            const Divider(height: Space.lg),

            // SECTION 2: Choose Recipient + 1-Tap Record & Send Voice Briefing
            Text(
              bangla
                  ? 'কাকে ভয়েস ব্রিফিং পাঠাতে চান নির্বাচন করুন:'
                  : 'Send Voice Briefing To:',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 6),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
                    avatar: const Icon(Icons.domain_outlined, size: 14),
                    label: Text(
                      bangla ? 'সকল রিফাইনারি (৪৪৩)' : 'All Refineries (443)',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    selected: _targetIndex == 0,
                    onSelected: (_) {
                      Haptics.tap();
                      setState(() {
                        _targetIndex = 0;
                        _isSent = false;
                        if (_hasRecorded) {
                          _transcribedText = _defaultVoiceText(bangla);
                        }
                      });
                    },
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
                    avatar: const Icon(Icons.factory_outlined, size: 14),
                    label: Text(
                      _targetIndex == 4
                          ? (bangla
                                ? _refineries[_selectedRefineryIndex].nameBn
                                : _refineries[_selectedRefineryIndex].nameEn)
                          : (bangla
                                ? 'নির্দিষ্ট রিফাইনারি...'
                                : 'Single Refinery...'),
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    selected: _targetIndex == 4,
                    onSelected: (_) => unawaited(_pickSingleRefinery(bangla)),
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
                    avatar: const Icon(Icons.person_search_outlined, size: 14),
                    label: Text(
                      _targetIndex == 3 && _pickedPerson != null
                          ? _pickedPerson!.person.display(bangla: bangla)
                          : (bangla
                                ? 'একজন কর্মী নির্বাচন...'
                                : 'Single Employee...'),
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    selected: _targetIndex == 3,
                    onSelected: (_) => unawaited(_pickSingleEmployee(bangla)),
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
                    avatar: const Icon(Icons.apartment_outlined, size: 14),
                    label: Text(
                      bangla
                          ? 'সকল কোম্পানি কর্মী (৫৫৭)'
                          : 'All Company Staff (557)',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    selected: _targetIndex == 1,
                    onSelected: (_) {
                      Haptics.tap();
                      setState(() {
                        _targetIndex = 1;
                        _isSent = false;
                        if (_hasRecorded) {
                          _transcribedText = _defaultVoiceText(bangla);
                        }
                      });
                    },
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    visualDensity: VisualDensity.compact,
                    avatar: const Icon(Icons.groups_outlined, size: 14),
                    label: Text(
                      bangla ? 'জিএম ও এইচওডি (৬)' : 'Leadership (GMs/HODs)',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                    selected: _targetIndex == 2,
                    onSelected: (_) {
                      Haptics.tap();
                      setState(() {
                        _targetIndex = 2;
                        _isSent = false;
                        if (_hasRecorded) {
                          _transcribedText = _defaultVoiceText(bangla);
                        }
                      });
                    },
                  ),
                ],
              ),
            ),

            // Selected Single Particular Refinery Banner
            if (_targetIndex == 4) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.sm,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(Corner.sm),
                  border: Border.all(
                    color: scheme.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.factory_outlined,
                      size: 16,
                      color: scheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        bangla
                            ? '${_refineries[_selectedRefineryIndex].nameBn} (${_refineries[_selectedRefineryIndex].staffBn}) · ${_refineries[_selectedRefineryIndex].headBn}'
                            : '${_refineries[_selectedRefineryIndex].nameEn} (${_refineries[_selectedRefineryIndex].staffEn}) · ${_refineries[_selectedRefineryIndex].headEn}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () => unawaited(_pickSingleRefinery(bangla)),
                      child: Text(
                        bangla ? 'পরিবর্তন' : 'Change',
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Selected Single Employee Banner (when a specific employee is chosen)
            if (_targetIndex == 3 && _pickedPerson != null) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.sm,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(Corner.sm),
                  border: Border.all(
                    color: scheme.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.person, size: 16, color: scheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${_pickedPerson!.person.display(bangla: bangla)}'
                        '${_pickedPerson!.person.title != null ? " · ${_pickedPerson!.person.title}" : ""}'
                        ' (${_pickedPerson!.where(bangla: bangla)})',
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () => unawaited(_pickSingleEmployee(bangla)),
                      child: Text(
                        bangla ? 'পরিবর্তন' : 'Change',
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: Space.sm),

            if (!_isRecording && !_hasRecorded && !_isSent)
              OutlinedButton.icon(
                onPressed: () => _startRecording(bangla),
                icon: const Icon(Icons.mic, size: 18),
                label: Text(
                  bangla
                      ? 'ভয়েস ব্রিফিং রেকর্ড করুন (${_recipientLabel(bangla)})'
                      : 'Record Voice Briefing for ${_recipientLabel(bangla)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              )
            else if (_isRecording || _hasRecorded)
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: _isRecording
                      ? Colors.red.shade50.withValues(alpha: 0.7)
                      : scheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(Corner.md),
                  border: Border.all(
                    color: _isRecording
                        ? Colors.red.shade300
                        : scheme.outlineVariant,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _isRecording
                              ? Icons.fiber_manual_record
                              : Icons.check_circle,
                          size: 16,
                          color: _isRecording
                              ? Colors.red
                              : BrandColors.success,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _isRecording
                                ? (bangla
                                      ? 'রেকর্ড হচ্ছে... 0:0$_recordSec'
                                      : 'Recording Voice Briefing... 0:0$_recordSec')
                                : (bangla
                                      ? 'ভয়েস ব্রিফিং প্রস্তুত (0:0$_recordSec) · প্রাপক: ${_recipientLabel(bangla)}'
                                      : 'Voice Ready (0:0$_recordSec) · To: ${_recipientLabel(bangla)}'),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: _isRecording
                                  ? Colors.red.shade800
                                  : scheme.onSurface,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '"$_transcribedText"',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: Space.sm),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _cancelRecording,
                            child: Text(bangla ? 'বাতিল' : 'Cancel'),
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: _isRecording
                              ? FilledButton.tonalIcon(
                                  onPressed: () => _stopRecording(bangla),
                                  icon: const Icon(Icons.stop, size: 16),
                                  label: Text(bangla ? 'থামান' : 'Stop'),
                                )
                              : FilledButton.icon(
                                  onPressed: _isSending
                                      ? null
                                      : () =>
                                            unawaited(_sendVoiceOrder(bangla)),
                                  icon: const Icon(Icons.send, size: 16),
                                  label: Text(
                                    bangla
                                        ? 'এখনই পাঠান'
                                        : 'Send Voice Briefing',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else if (_isSent)
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.teal.shade50.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(Corner.md),
                  border: Border.all(color: Colors.teal.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Colors.teal.shade800,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            bangla
                                ? 'ভয়েস ব্রিফিং পাঠানো হয়েছে: ${_recipientLabel(bangla)}'
                                : 'Voice Briefing Sent to ${_recipientLabel(bangla)}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Colors.teal.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '"$_transcribedText"',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _targetIndex == 4
                          ? (bangla
                                ? '✓ ${_refineries[_selectedRefineryIndex].nameBn}-এর সকল ${_refineries[_selectedRefineryIndex].staffBn}-এর কাছে পৌঁছেছে · ${_refineries[_selectedRefineryIndex].headBn} প্রাপ্তিস্বীকার করেছেন'
                                : '✓ Broadcasted to ${_refineries[_selectedRefineryIndex].nameEn} (${_refineries[_selectedRefineryIndex].staffEn}) · Acknowledged by ${_refineries[_selectedRefineryIndex].headEn}')
                          : (_targetIndex == 3 && _pickedPerson != null
                                ? (bangla
                                      ? '✓ ${_pickedPerson!.person.display(bangla: true)}-এর ব্যক্তিগত ডিভাইসে পৌঁছেছে ও প্রাপ্তিস্বীকার করা হয়েছে'
                                      : '✓ Delivered to ${_pickedPerson!.person.display(bangla: false)} & Acknowledged')
                                : (_targetIndex == 0
                                      ? (bangla
                                            ? '✓ কেরানীগঞ্জ, চট্টগ্রাম ও মোংলা রিফাইনারির সকল ৪৪৩ জন কর্মীর কাছে পৌঁছেছে · সকল প্ল্যান্ট প্রধান নিশ্চিত করেছেন'
                                            : '✓ Broadcasted across all 3 Refineries (Keraniganj, Chattogram & Mongla · 443 Staff) · Confirmed by Plant Heads')
                                      : (_targetIndex == 1
                                            ? (bangla
                                                  ? '✓ সদর দপ্তর ও সকল রিফাইনারির ৫৫৭ জন কর্মীর কাছে সম্প্রচারিত'
                                                  : '✓ Broadcasted to all 557 HQ & Refinery Employees · 6/6 HODs Acknowledged')
                                            : (_ackCount >= 2
                                                  ? (bangla
                                                        ? '✓ প্রাপ্তিস্বীকার: প্রকৌশলী হারুনুর রশিদ (প্ল্যান্ট জিএম) ও সায়েদা আফরোজা (এইচআর)'
                                                        : '✓ Acknowledged by Engr. Harunur Rashid (Plant GM) & Sayeda Afroza (HR)')
                                                  : (bangla
                                                        ? '✓ প্রাপ্তিস্বীকার: প্রকৌশলী হারুনুর রশিদ (প্ল্যান্ট জিএম)'
                                                        : '✓ Acknowledged by Engr. Harunur Rashid (Plant GM)'))))),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.green.shade800,
                      ),
                    ),
                    const SizedBox(height: Space.xs),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () => _startRecording(bangla),
                          child: Text(
                            bangla ? 'নতুন রেকর্ড' : 'Record Another',
                            style: const TextStyle(fontSize: 11.5),
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        FilledButton.tonalIcon(
                          style: FilledButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () {
                            Haptics.tap();
                            if (_sentChannelId != null) {
                              unawaited(
                                context.push(
                                  AppRoutes.chatThread(_sentChannelId!),
                                ),
                              );
                            } else {
                              openAppRoute(context, AppRoutes.chat);
                            }
                          },
                          icon: const Icon(Icons.forum_outlined, size: 15),
                          label: Text(
                            _targetIndex == 3
                                ? (bangla
                                      ? 'ডাইরেক্ট চ্যাট খুলুন'
                                      : 'Open Direct Chat')
                                : (bangla ? 'চ্যাটে দেখুন' : 'Open in Chat'),
                            style: const TextStyle(fontSize: 11.5),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
                    Expanded(
                      child: Text(
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
