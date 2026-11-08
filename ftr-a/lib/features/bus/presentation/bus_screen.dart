import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/bus/data/bus_repository.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_providers.dart';
import 'package:bogcl_oneops/features/bus/presentation/bus_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum _BusTab { mySeat, fleetAndDeck, supervisor }

class BusScreen extends ConsumerStatefulWidget {
  const BusScreen({super.key});

  @override
  ConsumerState<BusScreen> createState() => _BusScreenState();
}

class _BusScreenState extends ConsumerState<BusScreen> {
  _BusTab _tab = _BusTab.mySeat;
  var _supervisorMode = false;
  var _inbound = true; // true = Inbound to HQ/Plant, false = Outbound to Home
  var _selectedBusIndex = 0;
  String _seatSearch = '';

  // Local state for demo 52-seat modifications
  final Set<int> _myVacatedSeats = {};
  final Set<int> _boardedSeats = {
    1,
    2,
    3,
    5,
    6,
    7,
    8,
    9,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
  };
  final List<String> _waitlistQueue = [
    'Engr. Farhan (Civil, Keraniganj Plant) · Wait 4d',
    'Sadia Afrin (QA / Bitumen Lab) · Wait 6d',
    'Rashedul Islam (Supply Chain) · Wait 8d',
  ];

  static const List<
    ({
      String code,
      String route,
      String plate,
      int occupied,
      int vacated,
      int capacity,
      String status,
      String driver,
    })
  >
  _fleetBuses = [
    (
      code: 'BUS-01',
      route: 'Uttara → HQ → Plant',
      plate: 'Dhaka Metro-Ba-14-1101',
      occupied: 48,
      vacated: 2,
      capacity: 52,
      status: 'On Time',
      driver: 'Md. Kamal Hossain',
    ),
    (
      code: 'BUS-02',
      route: 'Mirpur 10/12 → HQ → Plant',
      plate: 'Dhaka Metro-Ba-14-1102',
      occupied: 50,
      vacated: 1,
      capacity: 52,
      status: 'On Time',
      driver: 'Abdul Malek',
    ),
    (
      code: 'BUS-03',
      route: 'Dhanmondi / Science Lab → Plant',
      plate: 'Dhaka Metro-Ba-14-1103',
      occupied: 52,
      vacated: 0,
      capacity: 52,
      status: 'Delayed 10m',
      driver: 'Anwar Hossain',
    ),
    (
      code: 'BUS-04',
      route: 'Mohammadpur / Asad Gate → HQ',
      plate: 'Dhaka Metro-Ba-14-1104',
      occupied: 46,
      vacated: 4,
      capacity: 52,
      status: 'On Time',
      driver: 'Jahangir Alam',
    ),
    (
      code: 'BUS-05',
      route: 'Banani / Gulshan 1 & 2 → Plant',
      plate: 'Dhaka Metro-Ba-14-1105',
      occupied: 49,
      vacated: 1,
      capacity: 52,
      status: 'On Time',
      driver: 'Shahjahan Ali',
    ),
    (
      code: 'BUS-06',
      route: 'Jatrabari / Signboard → Plant',
      plate: 'Dhaka Metro-Ba-14-1106',
      occupied: 51,
      vacated: 0,
      capacity: 52,
      status: 'On Time',
      driver: 'Nurul Islam',
    ),
    (
      code: 'BUS-07',
      route: 'Narayanganj / Chashara → Plant',
      plate: 'Dhaka Metro-Ba-14-1107',
      occupied: 45,
      vacated: 7,
      capacity: 52,
      status: 'On Time',
      driver: 'Golam Kibria',
    ),
    (
      code: 'BUS-08',
      route: 'Savar / Gabtoli → Plant',
      plate: 'Dhaka Metro-Ba-14-1108',
      occupied: 47,
      vacated: 2,
      capacity: 52,
      status: 'On Time',
      driver: 'Harunur Rashid',
    ),
    (
      code: 'BUS-09',
      route: 'Bashundhara R/A Shuttle Loop',
      plate: 'Dhaka Metro-Ba-14-1109',
      occupied: 38,
      vacated: 14,
      capacity: 52,
      status: 'On Time',
      driver: 'Saiful Islam',
    ),
    (
      code: 'BUS-10',
      route: 'Keraniganj Local Feeder',
      plate: 'Dhaka Metro-Ba-14-1110',
      occupied: 40,
      vacated: 12,
      capacity: 52,
      status: 'On Time',
      driver: 'Al-Amin Mia',
    ),
  ];

  Future<void> _refresh() async {
    ref
      ..invalidate(busRoutesProvider)
      ..invalidate(mySeatProvider)
      ..invalidate(busRouteDetailProvider);
    await ref.read(mySeatProvider.future);
  }

  void _showBoardingPassModal(int seatNo, String routeName) {
    final bangla = context.isBangla;
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (ctx) => Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                bangla
                    ? 'ডিজিটাল শাটল বোর্ডিং পাস'
                    : 'Digital Shuttle Boarding Pass',
                style: Theme.of(ctx).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                routeName,
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(ctx).colorScheme.primary,
                ),
              ),
              const Divider(height: 24),
              Container(
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.qr_code_2,
                          size: 120,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    const SizedBox(height: Space.sm),
                    Text(
                      'SEAT $seatNo · BOGCL SHUTTLE',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        letterSpacing: 1,
                      ),
                    ),
                    const Text(
                      'Tanvir Ahmed · EMP-1042',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla ? 'সম্পন্ন' : 'Done',
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSeatActionModal(
    int seatNo,
    String routeName,
    bool isMySeat,
    bool isVacated,
    bool isFree,
  ) {
    final bangla = context.isBangla;
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setSheetState) => Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_seat_rounded, color: Colors.blue),
                    const SizedBox(width: Space.xs),
                    Text(
                      'Seat $seatNo · $routeName',
                      style: Theme.of(ctx).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const Divider(height: 20),

                // If it's the current user's seat
                if (isMySeat) ...[
                  Text(
                    bangla
                        ? 'আপনার বরাদ্দকৃত নিয়মিত আসন'
                        : 'Your permanent allocated seat',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  if (!_myVacatedSeats.contains(seatNo))
                    PrimaryButton.secondary(
                      label: bangla
                          ? 'আজকের জন্য আসন ছেড়ে দিন (Vacate Seat)'
                          : 'Vacate My Seat for Today',
                      onPressed: () {
                        Haptics.tap();
                        setState(() => _myVacatedSeats.add(seatNo));
                        Navigator.pop(ctx);
                        AppToast.show(
                          context,
                          bangla
                              ? 'আজকের জন্য আপনার আসনটি মুক্ত করা হয়েছে'
                              : 'Seat $seatNo vacated for today. Available for standby waitlist.',
                        );
                      },
                    )
                  else
                    PrimaryButton(
                      label: bangla
                          ? 'আসন পুনরুদ্ধার করুন (Reclaim Seat)'
                          : 'Reclaim My Vacated Seat',
                      onPressed: () {
                        Haptics.tap();
                        setState(() => _myVacatedSeats.remove(seatNo));
                        Navigator.pop(ctx);
                        AppToast.show(
                          context,
                          bangla
                              ? 'আসনটি পুনরায় গ্রহণ করা হয়েছে'
                              : 'Seat $seatNo reclaimed successfully',
                          tone: StatusTone.success,
                        );
                      },
                    ),
                  const SizedBox(height: Space.xs),
                  PrimaryButton.secondary(
                    label: bangla
                        ? 'সহকর্মীর সাথে আসন বিনিময় (Swap)'
                        : 'Request Seat Swap with Colleague',
                    onPressed: () {
                      Navigator.pop(ctx);
                      AppToast.show(
                        context,
                        bangla
                            ? 'আসন বিনিময়ের অনুরোধ পাঠানো হয়েছে'
                            : 'Seat swap request initiated',
                      );
                    },
                  ),
                  const SizedBox(height: Space.xs),
                  PrimaryButton(
                    label: bangla
                        ? 'ডিজিটাল বোর্ডিং পাস দেখুন'
                        : 'View Digital Boarding QR Pass',
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showBoardingPassModal(seatNo, routeName);
                    },
                  ),
                ] else if (isVacated || isFree) ...[
                  Text(
                    isVacated
                        ? (bangla
                              ? 'আজকের জন্য আসনটি মুক্ত আছে (Vacated Seat)'
                              : 'Seat voluntarily vacated for today')
                        : (bangla
                              ? 'আসনটি উন্মুক্ত রয়েছে'
                              : 'Seat is available'),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    bangla
                        ? 'আপনি আজকের ট্রিপের জন্য একক শিফট-পাস নিশ্চিত করতে পারেন।'
                        : "You can instantly book a single shift pass for today's trip.",
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                  const SizedBox(height: Space.md),
                  PrimaryButton(
                    label: bangla
                        ? 'একক শিফট-পাস বুক করুন (আজকের জন্য)'
                        : 'Book Single Shift Pass (Today Only)',
                    onPressed: () {
                      Haptics.success();
                      Navigator.pop(ctx);
                      AppToast.show(
                        context,
                        bangla
                            ? 'আসন $seatNo এর একক শিফট-পাস নিশ্চিত হয়েছে!'
                            : 'Confirmed! Single shift pass booked for Seat $seatNo',
                        tone: StatusTone.success,
                      );
                    },
                  ),
                  const SizedBox(height: Space.xs),
                  PrimaryButton.secondary(
                    label: bangla
                        ? 'নিয়মিত মাসিক বরাদ্দের আবেদন'
                        : 'Apply for Monthly Permanent Seat',
                    onPressed: () {
                      Navigator.pop(ctx);
                      AppToast.show(
                        context,
                        bangla
                            ? 'মাসিক বরাদ্দের আবেদন জমা হয়েছে'
                            : 'Monthly seat application submitted',
                      );
                    },
                  ),
                ] else ...[
                  Text(
                    bangla
                        ? 'আসনটি সংরক্ষিত / যাত্রী নির্ধারিত'
                        : 'Occupied Permanent Seat',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Occupant: Engr. M. Rahman · Shift: General (09:00 - 18:00)',
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                  const SizedBox(height: Space.md),
                  PrimaryButton.secondary(
                    label: bangla
                        ? 'আসন বিনিময়ের প্রস্তাব পাঠান'
                        : 'Propose Mutual Seat Swap',
                    onPressed: () {
                      Navigator.pop(ctx);
                      AppToast.show(
                        context,
                        bangla
                            ? 'আসন বিনিময়ের প্রস্তাব পাঠানো হয়েছে'
                            : 'Seat swap proposal sent to occupant',
                      );
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

  void _showBroadcastModal() {
    final bangla = context.isBangla;
    final msgCtrl = TextEditingController(
      text: 'Bus #01 delayed 12 mins at Mohakhali Flyover due to traffic.',
    );
    unawaited(
      showModalBottomSheet<void>(
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.campaign_outlined, color: Colors.orange),
                  const SizedBox(width: Space.xs),
                  Text(
                    bangla
                        ? 'রুটের যাত্রীদের জরুরি বার্তা প্রেরণ'
                        : 'Broadcast Route Delay / Traffic Alert',
                    style: Theme.of(ctx).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'এই বাসের সকল নিবন্ধিত যাত্রী ও অপেক্ষমাণ কর্মীদের ফোনে তাৎক্ষণিক পুশ নোটিফিকেশন যাবে।'
                    : 'Sends immediate push notification to all passengers riding this route today.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.sm),
              Wrap(
                spacing: Space.xs,
                children: [
                  ActionChip(
                    label: const Text(
                      'Delayed 12m (Mohakhali)',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => msgCtrl.text =
                        'Bus #01 delayed 12 mins at Mohakhali Flyover.',
                  ),
                  ActionChip(
                    label: const Text(
                      'Pickup Gate 2 today',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => msgCtrl.text =
                        'Alternate evening boarding at Refinery Gate #2 today.',
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: bangla ? 'বার্তার বিবরণ' : 'Alert Message Body',
                controller: msgCtrl,
                maxLines: 3,
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'সকলকে নোটিফিকেশন পাঠান'
                    : 'Broadcast Alert Now',
                onPressed: () {
                  Haptics.heavy();
                  Navigator.pop(ctx);
                  AppToast.show(
                    context,
                    bangla
                        ? 'রুটের ৪৮ জন যাত্রীকে বার্তা পাঠানো হয়েছে'
                        : 'Alert broadcast to 48 route passengers!',
                    tone: StatusTone.success,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canSeat = session?.can('bus:seat-self') ?? false;
    final canManage = session?.can('bus:manage') ?? false;
    final scheme = Theme.of(context).colorScheme;
    final effectiveTab = (!canSeat && _tab == _BusTab.mySeat)
        ? _BusTab.fleetAndDeck
        : _tab;

    Widget subTabChip(_BusTab tab, String label, IconData icon) => Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        avatar: Icon(icon, size: 16),
        label: Text(label),
        selected: effectiveTab == tab,
        onSelected: (_) => setState(() => _tab = tab),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.busTitle),
        actions: [
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
          ),
          if (canManage)
            IconButton(
              tooltip: bangla ? 'রুট ব্রডকাস্ট' : 'Broadcast Alert',
              onPressed: _showBroadcastModal,
              icon: const Icon(Icons.campaign_outlined, color: Colors.amber),
            ),
        ],
      ),
      body: Column(
        children: [
          // Perspective and Commute Direction Header
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.sm),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: scheme.outlineVariant),
              ),
              child: Row(
                children: [
                  // Direction Toggle Pill
                  InkWell(
                    onTap: () {
                      Haptics.tap();
                      setState(() => _inbound = !_inbound);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _inbound
                            ? Colors.blue.shade100
                            : Colors.indigo.shade100,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _inbound
                                ? Icons.login_rounded
                                : Icons.logout_rounded,
                            size: 14,
                            color: _inbound
                                ? Colors.blue.shade900
                                : Colors.indigo.shade900,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _inbound
                                ? (bangla
                                      ? 'ইনবাউন্ড (প্ল্যান্ট গমন)'
                                      : 'Inbound (To Plant)')
                                : (bangla
                                      ? 'আউটবাউন্ড (বাসা প্রত্যাবর্তন)'
                                      : 'Outbound (Home)'),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _inbound
                                  ? Colors.blue.shade900
                                  : Colors.indigo.shade900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Spacer(),
                  // Perspective Switch (Staff vs Supervisor)
                  if (canManage) ...[
                    Text(
                      bangla ? 'তত্ত্বাবধায়ক মোড' : 'Supervisor Mode',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Switch(
                      value: _supervisorMode,
                      onChanged: (v) {
                        Haptics.tap();
                        setState(() {
                          _supervisorMode = v;
                          if (v) _tab = _BusTab.supervisor;
                        });
                      },
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Sub-Tab Switcher
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (canSeat)
                    subTabChip(
                      _BusTab.mySeat,
                      bangla ? 'আমার আসন ও পাস' : 'My Seat & Pass',
                      Icons.event_seat_outlined,
                    ),
                  subTabChip(
                    _BusTab.fleetAndDeck,
                    bangla
                        ? '১০-বাস বহর ও ৫২-আসন ম্যাপ'
                        : '10-Bus Fleet & 52-Seat Deck',
                    Icons.directions_bus_filled_outlined,
                  ),
                  if (canManage)
                    subTabChip(
                      _BusTab.supervisor,
                      bangla ? 'কমান্ড ও ওয়েটিংলিস্ট' : 'Command & Waitlist',
                      Icons.admin_panel_settings_outlined,
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: Space.xs),

          // Tab Body
          Expanded(
            child: switch (effectiveTab) {
              _BusTab.mySeat => RefreshIndicator(
                onRefresh: _refresh,
                child: _MySeatTab(
                  onBrowse: () => setState(() => _tab = _BusTab.fleetAndDeck),
                ),
              ),
              _BusTab.fleetAndDeck => _buildFleetAndDeckTab(context, bangla),
              _BusTab.supervisor => _buildSupervisorTab(context, bangla),
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFleetAndDeckTab(BuildContext context, bool bangla) {
    final scheme = Theme.of(context).colorScheme;
    final activeBus = _fleetBuses[_selectedBusIndex];

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // 10-Bus Fleet Overview Grid
        Row(
          children: [
            Expanded(
              child: Text(
                bangla
                    ? '১০টি বাস বহর সারসংক্ষেপ (বাস নির্বাচন করুন)'
                    : '10-Bus Fleet Grid (Select Bus)',
                style: Theme.of(context).textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: Space.xs),
            Text(
              '${_selectedBusIndex + 1} of 10',
              style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
            ),
          ],
        ),
        const SizedBox(height: Space.xs),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _fleetBuses.length,
            separatorBuilder: (_, _) => const SizedBox(width: Space.xs),
            itemBuilder: (context, i) {
              final b = _fleetBuses[i];
              final isSel = i == _selectedBusIndex;
              return InkWell(
                onTap: () {
                  Haptics.tap();
                  setState(() => _selectedBusIndex = i);
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 168,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSel
                        ? scheme.primaryContainer
                        : scheme.surfaceContainerHighest.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSel ? scheme.primary : scheme.outlineVariant,
                      width: isSel ? 1.5 : 1.0,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              b.code,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: isSel
                                    ? scheme.primary
                                    : scheme.onSurface,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          StatusPill(
                            label: b.status,
                            tone: b.status.contains('Delay')
                                ? StatusTone.warning
                                : StatusTone.success,
                          ),
                        ],
                      ),
                      Text(
                        b.route,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        '${b.occupied}/${b.capacity} Seats · ${b.vacated} Free',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: Space.md),

        // Active Bus Information Header Card
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: scheme.outlineVariant),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.directions_bus, color: scheme.primary),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${activeBus.code}: ${activeBus.route}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      'Plate: ${activeBus.plate} · Driver: ${activeBus.driver}',
                      style: TextStyle(
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: Space.md),

        // Passenger Search Box
        TextField(
          decoration: InputDecoration(
            hintText: bangla
                ? 'যাত্রীর নাম বা আসন অনুসন্ধান করুন...'
                : 'Search passenger name or seat number...',
            prefixIcon: const Icon(Icons.search, size: 18),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.sm,
            ),
          ),
          onChanged: (v) =>
              setState(() => _seatSearch = v.trim().toLowerCase()),
        ),

        const SizedBox(height: Space.sm),

        // 52-Seat Coach Deck Legend
        Wrap(
          spacing: Space.sm,
          runSpacing: 4,
          alignment: WrapAlignment.spaceAround,
          children: [
            _LegendItem(
              color: Colors.blue.shade700,
              label: '★ YOU',
              border: true,
            ),
            _LegendItem(color: Colors.blueGrey.shade600, label: '● Occupied'),
            _LegendItem(
              color: Colors.amber.shade800,
              label: '◎ Vacated Today',
              dashed: true,
            ),
            _LegendItem(
              color: Colors.teal.shade700,
              label: '○ Free / Open',
              outline: true,
            ),
          ],
        ),

        const SizedBox(height: Space.sm),

        // 52-Seat Coach Deck (13 Rows x 4 Seats with Aisle)
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade400, width: 2),
          ),
          child: Column(
            children: [
              // Front Header: Driver & Door
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.drive_eta, size: 16),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              'Driver: ${activeBus.driver}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    const Row(
                      children: [
                        Icon(Icons.door_front_door_outlined, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'ENTRY / QR SCAN',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: Space.md),

              // 13 Rows of Seats
              for (var r = 1; r <= 13; r++) ...[
                Row(
                  children: [
                    // Seat A
                    Expanded(child: _buildSeatCell(r, 1, activeBus.route)),
                    const SizedBox(width: 6),
                    // Seat B
                    Expanded(child: _buildSeatCell(r, 2, activeBus.route)),
                    // Center Aisle
                    Container(
                      width: 24,
                      alignment: Alignment.center,
                      child: Text(
                        '$r',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade600,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    // Seat C
                    Expanded(child: _buildSeatCell(r, 3, activeBus.route)),
                    const SizedBox(width: 6),
                    // Seat D
                    Expanded(child: _buildSeatCell(r, 4, activeBus.route)),
                  ],
                ),
                const SizedBox(height: 6),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSeatCell(int row, int col, String routeName) {
    // Seat number calculation
    final seatNo = (row - 1) * 4 + col;
    final isMySeat = seatNo == 4; // Seat 4A is Tanvir Ahmed
    final isVacated =
        _myVacatedSeats.contains(seatNo) || seatNo == 10 || seatNo == 18;
    final isFree = seatNo == 51 || seatNo == 52;
    final isBoarded = _boardedSeats.contains(seatNo);

    // Tags
    String? categoryTag;
    if (row == 1 && (col == 1 || col == 2)) {
      categoryTag = '★ Exec';
    } else if ((row == 1 || row == 2) && (col == 3 || col == 4)) {
      categoryTag = '♀ Lady';
    }

    // Highlighting for search
    final isHighlighted =
        _seatSearch.isNotEmpty &&
        (seatNo.toString() == _seatSearch ||
            (isMySeat && 'tanvir'.contains(_seatSearch)) ||
            (seatNo == 1 && 'harun'.contains(_seatSearch)));

    var bgColor = Colors.blueGrey.shade600;
    var textColor = Colors.white;
    Border? border;

    if (isMySeat) {
      bgColor = Colors.blue.shade700;
      border = Border.all(color: Colors.blue.shade900, width: 2);
    } else if (isVacated) {
      bgColor = Colors.amber.shade100;
      textColor = Colors.amber.shade900;
      border = Border.all(color: Colors.amber.shade800, width: 1.5);
    } else if (isFree) {
      bgColor = Colors.teal.shade50;
      textColor = Colors.teal.shade900;
      border = Border.all(color: Colors.teal.shade700, width: 1.5);
    }

    if (isHighlighted) {
      border = Border.all(color: Colors.red, width: 2.5);
    }

    return InkWell(
      onTap: () {
        Haptics.tap();
        _showSeatActionModal(seatNo, routeName, isMySeat, isVacated, isFree);
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
          border: border,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  isMySeat ? '★ YOU' : '$seatNo',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                if (categoryTag != null)
                  Text(
                    categoryTag,
                    style: TextStyle(
                      fontSize: 8,
                      color: textColor.withValues(alpha: 0.9),
                    ),
                  ),
              ],
            ),
            if (isBoarded)
              Positioned(
                right: 2,
                top: 2,
                child: Icon(
                  Icons.check_circle,
                  size: 8,
                  color: Colors.green.shade300,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSupervisorTab(BuildContext context, bool bangla) {
    final scheme = Theme.of(context).colorScheme;
    final boardedCount = _boardedSeats.length;

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Live Conductor QR Boarding Progress Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.blue.shade300),
          ),
          color: Colors.blue.shade50.withValues(alpha: 0.3),
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        bangla
                            ? 'কন্ডাকটর কিউআর বোর্ডিং স্ক্যানার'
                            : 'Conductor QR Boarding Verification',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade900,
                        ),
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    Text(
                      '$boardedCount of 48 Boarded (${((boardedCount / 48) * 100).round()}%)',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: boardedCount / 48,
                    minHeight: 8,
                    backgroundColor: Colors.blue.shade100,
                    color: Colors.blue.shade700,
                  ),
                ),
                const SizedBox(height: Space.sm),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade800,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      Haptics.heavy();
                      setState(
                        () => _boardedSeats.add(_boardedSeats.length + 1),
                      );
                      AppToast.show(
                        context,
                        bangla
                            ? 'যাত্রী কিউআর স্ক্যান সফল · বোর্ডিং সম্পন্ন'
                            : 'Passenger QR scanned successfully · Boarded!',
                        tone: StatusTone.success,
                      );
                    },
                    icon: const Icon(Icons.qr_code_scanner, size: 16),
                    label: Text(
                      bangla
                          ? 'যাত্রী স্ক্যান / বোর্ডিং নিশ্চিত করুন'
                          : 'Scan / Mark Passenger Boarded',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: Space.md),

        // FIFO Waitlist Queue & 1-Tap Promotion Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.amber.shade300),
          ),
          color: Colors.amber.shade50.withValues(alpha: 0.3),
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.hourglass_top_rounded,
                      color: Colors.amber.shade900,
                      size: 20,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'এফআইএফও অপেক্ষমাণ তালিকা ও আসন বরাদ্দ'
                            : 'FIFO Standby Waitlist Queue & 1-Tap Promotion',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.amber.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'মুক্ত বা শূন্য আসনের বিপরীতে অগ্রাধিকারভিত্তিতে অপেক্ষমাণ কর্মীকে ১-ট্যাপে বরাদ্দ দিন।'
                      : 'Promote waiting employees into vacated seats according to priority order.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Divider(height: 16),
                for (var i = 0; i < _waitlistQueue.length; i++) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '#${i + 1} ${_waitlistQueue[i]}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (i == 0)
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            backgroundColor: Colors.green.shade800,
                            foregroundColor: Colors.white,
                          ),
                          onPressed: () {
                            Haptics.success();
                            setState(() => _waitlistQueue.removeAt(0));
                            AppToast.show(
                              context,
                              bangla
                                  ? 'ইঞ্জি. ফারহানকে শূন্য আসন ৩বি-তে বরাদ্দ দেওয়া হয়েছে!'
                                  : 'Assigned Engr. Farhan to vacated Seat 3B. SMS sent!',
                              tone: StatusTone.success,
                            );
                          },
                          icon: const Icon(Icons.check, size: 14),
                          label: Text(
                            bangla ? 'আসন ৩বি বরাদ্দ দিন' : 'Assign to Seat 3B',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                ],
              ],
            ),
          ),
        ),

        const SizedBox(height: Space.md),

        // Supervisor Administrative Actions Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: scheme.outlineVariant),
          ),
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bangla
                      ? 'রুট ও বাস ব্যবস্থাপনা'
                      : 'Route & Fleet Administration',
                  style: Theme.of(context).textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: Space.sm),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _showBroadcastModal,
                        icon: const Icon(Icons.campaign, size: 16),
                        label: Text(bangla ? 'বিলম্ব বার্তা' : 'Delay Alert'),
                      ),
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          AppToast.show(
                            context,
                            bangla
                                ? 'বাস পুনরায় বরাদ্দ সফল'
                                : 'Bus vehicle reassigned successfully',
                            tone: StatusTone.success,
                          );
                        },
                        icon: const Icon(Icons.swap_horiz, size: 16),
                        label: Text(bangla ? 'বাস বদল' : 'Swap Bus'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({
    required this.color,
    required this.label,
    this.outline = false,
    this.dashed = false,
    this.border = false,
  });

  final Color color;
  final String label;
  final bool outline;
  final bool dashed;
  final bool border;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: outline ? Colors.transparent : color,
            borderRadius: BorderRadius.circular(3),
            border: Border.all(
              color: outline || dashed || border ? color : Colors.transparent,
              width: 1.5,
            ),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

// --------------------------------------------------------------- My seat
class _MySeatTab extends ConsumerStatefulWidget {
  const _MySeatTab({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  ConsumerState<_MySeatTab> createState() => _MySeatTabState();
}

class _MySeatTabState extends ConsumerState<_MySeatTab> {
  bool _busy = false;

  Future<void> _run(Future<MySeat> Function() action, String done) async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await action();
      ref
        ..invalidate(mySeatProvider)
        ..invalidate(busRoutesProvider)
        ..invalidate(busRouteDetailProvider);
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      ref
        ..invalidate(mySeatProvider)
        ..invalidate(busRoutesProvider);
      if (!mounted) return;
      AppToast.show(context, switch (e.rule) {
        'OFFER_EXPIRED' => l10n.busErrOfferExpired,
        _ => l10n.busErrFailed,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _accept(WaitEntry w) async {
    final stop = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (_) => _StopSheet(stops: w.route.stops),
    );
    if (stop == null || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).accept(w.id, stopId: stop),
      context.l10n.busAccepted,
    );
  }

  Future<void> _decline(WaitEntry w) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busDeclineConfirm,
      message: l10n.busDeclineMessage,
      confirmLabel: l10n.busDecline,
      destructive: true,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).decline(w.id),
      l10n.busDeclined,
    );
  }

  Future<void> _leaveQueue(WaitEntry w) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.busLeaveConfirm,
      destructive: true,
      confirmLabel: l10n.busLeave,
    );
    if (!ok || !mounted) return;
    await _run(
      () => ref.read(busRepositoryProvider).cancelWait(w.id),
      l10n.busLeft,
    );
  }

  Future<void> _release(SeatAllocation a) async {
    final r =
        await showModalBottomSheet<({String from, String to, String reason})>(
          context: context,
          isScrollControlled: true,
          showDragHandle: true,
          builder: (_) => _ReleaseSheet(allocation: a),
        );
    if (r == null || !mounted) return;
    await _run(
      () => ref
          .read(busRepositoryProvider)
          .release(a.id, from: r.from, to: r.to, reason: r.reason),
      context.l10n.busReleased,
    );
  }

  Future<void> _reclaim(SeatAllocation a) async {
    await _run(
      () => ref.read(busRepositoryProvider).reclaim(a.id),
      context.l10n.busReclaimed,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final theme = Theme.of(context);
    final seatAsync = ref.watch(mySeatProvider);

    return seatAsync.when(
      loading: SkeletonList.new,
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(mySeatProvider)),
      data: (my) {
        final a = my.allocation;
        final w = my.waitlist;
        if (a == null && w == null) {
          return EmptyState(
            message: l10n.busEmptyMessage,
            actionLabel: l10n.busBrowse,
            onAction: widget.onBrowse,
          );
        }
        return ListView(
          padding: const EdgeInsets.all(Space.lg),
          children: [
            if (w != null && !w.offered)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.hourglass_top_outlined),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: Text(
                              w.route.displayName(bangla: bangla),
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          StatusPill(
                            label: l10n.busWaitingBadge,
                            tone: StatusTone.warning,
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.md),
                      Text(
                        '${l10n.busPosition(digits(w.position, bangla: bangla))} · ${l10n.busEstimate(digits(w.estimatedWaitDays, bangla: bangla))}',
                      ),
                      const SizedBox(height: Space.md),
                      PrimaryButton.danger(
                        label: l10n.busLeave,
                        loading: _busy,
                        onPressed: () => unawaited(_leaveQueue(w)),
                      ),
                    ],
                  ),
                ),
              ),
            if (w != null && w.offered)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.celebration_outlined),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: Text(
                              l10n.busOfferTitle(
                                digits(w.offerSeatNo ?? 0, bangla: bangla),
                              ),
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          StatusPill(
                            label: l10n.busOfferedBadge,
                            tone: StatusTone.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        bangla
                            ? '${w.route.displayName(bangla: true)} রুটে আপনার জন্য আসন নির্ধারণ করা হয়েছে।'
                            : 'A seat has been offered to you on the ${w.route.displayName(bangla: false)} route.',
                      ),
                      if (w.expiresAt != null)
                        Padding(
                          padding: const EdgeInsets.only(top: Space.xs),
                          child: Text(
                            bangla
                                ? 'মেয়াদ শেষ: ${DateFmt.dateTime(w.expiresAt!, lang)}'
                                : 'Offer expires: ${DateFmt.dateTime(w.expiresAt!, lang)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: context.bogcl.warning,
                            ),
                          ),
                        ),
                      const SizedBox(height: Space.md),
                      Row(
                        children: [
                          Expanded(
                            child: PrimaryButton(
                              label: l10n.busAccept,
                              loading: _busy,
                              onPressed: () => unawaited(_accept(w)),
                            ),
                          ),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: PrimaryButton.secondary(
                              label: l10n.busDecline,
                              onPressed: _busy
                                  ? null
                                  : () => unawaited(_decline(w)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            if (a != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.event_seat_outlined),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: Text(
                              l10n.busSeatNo(digits(a.seatNo, bangla: bangla)),
                              style: theme.textTheme.titleLarge,
                            ),
                          ),
                          StatusPill(
                            label: a.vacated
                                ? l10n.busReleasedBadge
                                : l10n.busMySeatBadge,
                            tone: a.vacated
                                ? StatusTone.warning
                                : StatusTone.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        '${a.route.code} · ${a.route.displayName(bangla: bangla)}',
                        style: theme.textTheme.titleSmall,
                      ),
                      if (a.route.busNo != null) Text(a.route.busNo!),
                      if (a.stop != null) ...[
                        const SizedBox(height: Space.sm),
                        Text(
                          l10n.busStopLine(
                            a.stop!.displayName(bangla: bangla),
                            clock(a.stop!.morning, bangla: bangla),
                            clock(a.stop!.evening, bangla: bangla),
                          ),
                        ),
                      ],
                      if (a.vacated &&
                          a.vacatedFrom != null &&
                          a.vacatedTo != null) ...[
                        const SizedBox(height: Space.sm),
                        Text(
                          l10n.busReleasedRange(
                            DateFmt.range(a.vacatedFrom!, a.vacatedTo!, lang),
                          ),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.bogcl.warning,
                          ),
                        ),
                      ],
                      const SizedBox(height: Space.md),
                      if (a.vacated)
                        PrimaryButton(
                          label: l10n.busReclaim,
                          loading: _busy,
                          onPressed: () => unawaited(_reclaim(a)),
                        )
                      else
                        PrimaryButton.secondary(
                          label: l10n.busRelease,
                          onPressed: _busy
                              ? null
                              : () => unawaited(_release(a)),
                        ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _StopSheet extends StatelessWidget {
  const _StopSheet({required this.stops});

  final List<BusStop> stops;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        Text(
          context.l10n.busChooseStop,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: Space.md),
        for (final s in stops)
          ListTile(
            title: Text(s.displayName(bangla: bangla)),
            subtitle: Text(
              context.l10n.busStopLine(
                s.displayName(bangla: bangla),
                clock(s.morning, bangla: bangla),
                clock(s.evening, bangla: bangla),
              ),
            ),
            onTap: () => Navigator.pop(context, s.id),
          ),
      ],
    );
  }
}

class _ReleaseSheet extends StatefulWidget {
  const _ReleaseSheet({required this.allocation});

  final SeatAllocation allocation;

  @override
  State<_ReleaseSheet> createState() => _ReleaseSheetState();
}

class _ReleaseSheetState extends State<_ReleaseSheet> {
  final _reason = TextEditingController();
  DateTime _from = DateTime.now().add(const Duration(days: 1));
  DateTime _to = DateTime.now().add(const Duration(days: 7));

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.busReleaseTitle,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: Space.xs),
          Text(l10n.busReleaseHint),
          const SizedBox(height: Space.md),
          OutlinedButton(
            onPressed: () async {
              final r = await showDateRangePicker(
                context: context,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 60)),
                initialDateRange: DateTimeRange(start: _from, end: _to),
              );
              if (r != null) {
                setState(() {
                  _from = r.start;
                  _to = r.end;
                });
              }
            },
            child: Text(
              DateFmt.range(
                _from.toIso8601String().substring(0, 10),
                _to.toIso8601String().substring(0, 10),
                lang,
              ),
            ),
          ),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.busReleaseReason, controller: _reason),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.busRelease,
            onPressed: () {
              Navigator.pop(context, (
                from: _from.toIso8601String().substring(0, 10),
                to: _to.toIso8601String().substring(0, 10),
                reason: _reason.text.trim(),
              ));
            },
          ),
        ],
      ),
    );
  }
}
