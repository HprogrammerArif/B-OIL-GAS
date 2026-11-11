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

  /// Inbound keeps the plant routes. Outbound keeps the rest.
  List<
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
  get _visibleBuses {
    final chosen = _fleetBuses.where((b) {
      final toPlant = b.route.contains('Plant');
      return _inbound ? toPlant : !toPlant;
    }).toList();
    return chosen.isEmpty ? _fleetBuses : chosen;
  }

  BusRepository get _bus => ref.read(busRepositoryProvider);

  Future<BusRoute?> _selectedRoute() async {
    final routes = await _bus.routes();
    if (routes.isEmpty) return null;
    return routes[_selectedBusIndex.clamp(0, routes.length - 1)];
  }

  void _busFail(String message) {
    if (!mounted) return;
    AppToast.show(context, message, tone: StatusTone.danger);
  }

  BoxConstraints _fullSheet(BuildContext ctx) {
    final w = MediaQuery.sizeOf(ctx).width;
    return BoxConstraints(minWidth: w, maxWidth: w);
  }

  Future<void> _requestSwap(int seatNo) async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    try {
      final route = await _selectedRoute();
      if (route == null) {
        _busFail(l10n.busNoRoute);
        return;
      }
      await _bus.requestSwap(route.id, seatNo);
      if (!mounted) return;
      AppToast.show(context, l10n.busSwapSent(digits(seatNo, bangla: bangla)));
    } on ApiException {
      _busFail(l10n.busErrFailed);
    }
  }

  Future<void> _joinSelected() async {
    final l10n = context.l10n;
    try {
      final route = await _selectedRoute();
      if (route == null) {
        _busFail(l10n.busNoRoute);
        return;
      }
      await _bus.join(route.id);
      ref.invalidate(busRoutesProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.busWaitlisted(route.code));
    } on ApiException {
      _busFail(l10n.busErrFailed);
    }
  }

  Future<void> _broadcast(String message) async {
    final l10n = context.l10n;
    if (message.length < 5) {
      _busFail(l10n.busBroadcastShort);
      return;
    }
    try {
      final route = await _selectedRoute();
      await _bus.broadcast(message: message, routeId: route?.id);
      if (!mounted) return;
      AppToast.show(
        context,
        l10n.busAlertSent(route?.code ?? l10n.busRouteTitle),
      );
    } on ApiException {
      _busFail(l10n.busErrFailed);
    }
  }

  Future<void> _markBoarded() async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final seat = [for (var n = 1; n <= 52; n++) n]
        .where((n) => !_boardedSeats.contains(n))
        .firstOrNull;
    if (seat == null) {
      _busFail(l10n.busAllBoarded);
      return;
    }
    try {
      final route = await _selectedRoute();
      if (route == null) {
        _busFail(l10n.busNoRoute);
        return;
      }
      await _bus.setSeat(route.id, seat, boarded: true);
      if (!mounted) return;
      setState(() => _boardedSeats.add(seat));
      AppToast.show(
        context,
        l10n.busSeatBoarded(digits(seat, bangla: bangla), route.code),
      );
    } on ApiException {
      _busFail(l10n.busErrFailed);
    }
  }

  Future<void> _swapBus() async {
    final l10n = context.l10n;
    try {
      final routes = await _bus.routes();
      if (routes.length < 2) {
        _busFail(l10n.busNoOther);
        return;
      }
      final index = _selectedBusIndex.clamp(0, routes.length - 1);
      final current = routes[index];
      final other = routes[(index + 1) % routes.length];
      await _bus.reassignBus(current.id, other.busNo);
      ref.invalidate(busRoutesProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        l10n.busReassigned(
          other.busNo.isEmpty ? other.code : other.busNo,
          current.code,
        ),
      );
    } on ApiException {
      _busFail(l10n.busErrFailed);
    }
  }

  Future<void> _refresh() async {
    ref
      ..invalidate(busRoutesProvider)
      ..invalidate(mySeatProvider)
      ..invalidate(busRouteDetailProvider);
    await ref.read(mySeatProvider.future);
  }

  void _showBoardingPassModal(int seatNo, String routeName) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final scheme = Theme.of(context).colorScheme;
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        constraints: _fullSheet(context),
        builder: (ctx) => SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                0,
                Space.md,
                Space.md,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.busPassTitle,
                    style: Theme.of(ctx).textTheme.titleMedium,
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    routeName,
                    style: TextStyle(fontSize: 12, color: scheme.primary),
                  ),
                  const Divider(height: 24),
                  Container(
                    padding: const EdgeInsets.all(Space.md),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(Corner.md),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.qr_code_2,
                          size: 120,
                          color: scheme.onSurface,
                        ),
                        const SizedBox(height: Space.sm),
                        Text(
                          l10n.busPassSeat(digits(seatNo, bangla: bangla)),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          l10n.busPassHolder,
                          style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: Space.md),
                  PrimaryButton(
                    label: l10n.busDone,
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
            ),
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
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final scheme = Theme.of(context).colorScheme;
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        constraints: _fullSheet(context),
        builder: (ctx) => SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                0,
                Space.md,
                Space.md,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.event_seat_rounded, color: scheme.primary),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          l10n.busSeatHead(
                            digits(seatNo, bangla: bangla),
                            routeName,
                          ),
                          style: Theme.of(ctx).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  if (isMySeat) ...[
                    Text(
                      l10n.busSeatYours,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: Space.sm),
                    if (!_myVacatedSeats.contains(seatNo))
                      PrimaryButton.secondary(
                        label: l10n.busVacateToday,
                        onPressed: () {
                          Haptics.tap();
                          setState(() => _myVacatedSeats.add(seatNo));
                          Navigator.pop(ctx);
                          AppToast.show(context, l10n.busVacatedToast);
                        },
                      )
                    else
                      PrimaryButton(
                        label: l10n.busReclaimVacated,
                        onPressed: () {
                          Haptics.tap();
                          setState(() => _myVacatedSeats.remove(seatNo));
                          Navigator.pop(ctx);
                          AppToast.show(
                            context,
                            l10n.busReclaimedToast,
                            tone: StatusTone.success,
                          );
                        },
                      ),
                    const SizedBox(height: Space.xs),
                    PrimaryButton.secondary(
                      label: l10n.busSwapColleague,
                      onPressed: () {
                        Navigator.pop(ctx);
                        unawaited(_requestSwap(seatNo));
                      },
                    ),
                    const SizedBox(height: Space.xs),
                    PrimaryButton(
                      label: l10n.busViewPass,
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showBoardingPassModal(seatNo, routeName);
                      },
                    ),
                  ] else if (isVacated || isFree) ...[
                    Text(
                      isVacated ? l10n.busVacatedToday : l10n.busSeatOpen,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      l10n.busShiftPassHint,
                      style: Theme.of(ctx).textTheme.bodySmall,
                    ),
                    const SizedBox(height: Space.md),
                    PrimaryButton(
                      label: l10n.busBookShift,
                      onPressed: () {
                        Haptics.tap();
                        Navigator.pop(ctx);
                        unawaited(_joinSelected());
                      },
                    ),
                    const SizedBox(height: Space.xs),
                    PrimaryButton.secondary(
                      label: l10n.busApplyMonthly,
                      onPressed: () {
                        Navigator.pop(ctx);
                        unawaited(_joinSelected());
                      },
                    ),
                  ] else ...[
                    Text(
                      l10n.busSeatTaken,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.busOccupantDemo,
                      style: Theme.of(ctx).textTheme.bodySmall,
                    ),
                    const SizedBox(height: Space.md),
                    PrimaryButton.secondary(
                      label: l10n.busProposeSwap,
                      onPressed: () {
                        Navigator.pop(ctx);
                        unawaited(_requestSwap(seatNo));
                      },
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showBroadcastModal() {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final msgCtrl = TextEditingController(text: l10n.busBroadcastDelayBody);
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        constraints: _fullSheet(context),
        builder: (ctx) => SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                Space.md,
                0,
                Space.md,
                Space.md + MediaQuery.viewInsetsOf(ctx).bottom,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.campaign_outlined, color: scheme.primary),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          l10n.busBroadcastTitle,
                          style: Theme.of(ctx).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    l10n.busBroadcastHint,
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                  const SizedBox(height: Space.sm),
                  Wrap(
                    spacing: Space.xs,
                    children: [
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                          l10n.busBroadcastDelayChip,
                          style: const TextStyle(fontSize: 11),
                        ),
                        onPressed: () =>
                            msgCtrl.text = l10n.busBroadcastDelayBody,
                      ),
                      ActionChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                          l10n.busBroadcastGateChip,
                          style: const TextStyle(fontSize: 11),
                        ),
                        onPressed: () =>
                            msgCtrl.text = l10n.busBroadcastGateBody,
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: l10n.busBroadcastBody,
                    controller: msgCtrl,
                    maxLines: 3,
                  ),
                  const SizedBox(height: Space.md),
                  PrimaryButton(
                    label: l10n.busBroadcastSend,
                    onPressed: () {
                      final message = msgCtrl.text.trim();
                      Haptics.heavy();
                      Navigator.pop(ctx);
                      unawaited(_broadcast(message));
                    },
                  ),
                ],
              ),
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
    final session = ref.watch(sessionControllerProvider).value;
    final canSeat = session?.can('bus:seat-self') ?? false;
    final canManage = session?.can('bus:manage') ?? false;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final effectiveTab = (!canSeat && _tab == _BusTab.mySeat)
        ? _BusTab.fleetAndDeck
        : _tab;

    Widget subTabChip(_BusTab tab, String label, IconData icon) => Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        visualDensity: VisualDensity.compact,
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
            tooltip: l10n.busRefresh,
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
          ),
          if (canManage)
            IconButton(
              tooltip: l10n.busBroadcastTooltip,
              onPressed: _showBroadcastModal,
              icon: Icon(Icons.campaign_outlined, color: scheme.primary),
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Row(
              children: [
                FilterChip(
                  visualDensity: VisualDensity.compact,
                  selected: true,
                  showCheckmark: false,
                  avatar: Icon(
                    _inbound ? Icons.login_rounded : Icons.logout_rounded,
                    size: 16,
                  ),
                  label: Text(
                    _inbound ? l10n.busDirInbound : l10n.busDirOutbound,
                  ),
                  onSelected: (_) {
                    Haptics.tap();
                    setState(() {
                      _inbound = !_inbound;
                      _selectedBusIndex = 0;
                    });
                  },
                ),
                const Spacer(),
                if (canManage) ...[
                  Text(
                    l10n.busSupervisorMode,
                    style: theme.textTheme.labelMedium,
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
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (canSeat)
                    subTabChip(
                      _BusTab.mySeat,
                      l10n.busTabMySeat,
                      Icons.event_seat_outlined,
                    ),
                  subTabChip(
                    _BusTab.fleetAndDeck,
                    l10n.busTabFleet,
                    Icons.directions_bus_filled_outlined,
                  ),
                  if (canManage)
                    subTabChip(
                      _BusTab.supervisor,
                      l10n.busTabDesk,
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
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final buses = _visibleBuses;
    final index = _selectedBusIndex.clamp(0, buses.length - 1);
    final activeBus = buses[index];

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.busFleetPick,
                style: Theme.of(context).textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: Space.xs),
            Text(
              l10n.busFleetOf(
                digits(index + 1, bangla: bangla),
                digits(buses.length, bangla: bangla),
              ),
              style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
            ),
          ],
        ),
        const SizedBox(height: Space.xs),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: buses.length,
            separatorBuilder: (_, _) => const SizedBox(width: Space.xs),
            itemBuilder: (context, i) {
              final b = buses[i];
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
                        l10n.busFleetOcc(
                          digits(b.occupied, bangla: bangla),
                          digits(b.capacity, bangla: bangla),
                          digits(b.vacated, bangla: bangla),
                        ),
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

        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: scheme.outlineVariant),
          ),
          child: Row(
            children: [
              Icon(Icons.directions_bus, color: scheme.primary),
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
                      l10n.busFleetOcc(
                        digits(activeBus.occupied, bangla: bangla),
                        digits(activeBus.capacity, bangla: bangla),
                        digits(activeBus.vacated, bangla: bangla),
                      ),
                      style: TextStyle(
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      l10n.busFleetPlate(activeBus.plate, activeBus.driver),
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

        TextField(
          decoration: InputDecoration(
            hintText: l10n.busSearchSeat,
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

        Wrap(
          spacing: Space.sm,
          runSpacing: 4,
          alignment: WrapAlignment.spaceAround,
          children: [
            _LegendItem(
              color: scheme.primary,
              label: l10n.busLegendYou,
              border: true,
            ),
            _LegendItem(
              color: scheme.onSurfaceVariant,
              label: l10n.busLegendOccupied,
            ),
            _LegendItem(
              color: scheme.tertiary,
              label: l10n.busLegendVacated,
              dashed: true,
            ),
            _LegendItem(
              color: scheme.secondary,
              label: l10n.busLegendOpen,
              outline: true,
            ),
          ],
        ),

        const SizedBox(height: Space.sm),

        // 52-Seat Coach Deck (13 Rows x 4 Seats with Aisle)
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.outlineVariant),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Space.md,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest,
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
                              l10n.busDriver(activeBus.driver),
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
                    Row(
                      children: [
                        const Icon(Icons.door_front_door_outlined, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          l10n.busEntry,
                          style: const TextStyle(
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
                        digits(r, bangla: bangla),
                        style: TextStyle(
                          fontSize: 10,
                          color: scheme.onSurfaceVariant,
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
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final scheme = Theme.of(context).colorScheme;
    final seatNo = (row - 1) * 4 + col;
    final isMySeat = seatNo == 4; // Seat 4A is Tanvir Ahmed
    final isVacated =
        _myVacatedSeats.contains(seatNo) || seatNo == 10 || seatNo == 18;
    final isFree = seatNo == 51 || seatNo == 52;
    final isBoarded = _boardedSeats.contains(seatNo);

    String? categoryTag;
    if (row == 1 && (col == 1 || col == 2)) {
      categoryTag = '★ Exec';
    } else if ((row == 1 || row == 2) && (col == 3 || col == 4)) {
      categoryTag = '♀ Lady';
    }

    final isHighlighted =
        _seatSearch.isNotEmpty &&
        (seatNo.toString() == _seatSearch ||
            (isMySeat && 'tanvir'.contains(_seatSearch)) ||
            (seatNo == 1 && 'harun'.contains(_seatSearch)));

    var bgColor = scheme.onSurfaceVariant;
    var textColor = scheme.onPrimary;
    Border? border;

    if (isMySeat) {
      bgColor = scheme.primary;
      border = Border.all(color: scheme.primary, width: 2);
    } else if (isVacated) {
      bgColor = scheme.tertiaryContainer;
      textColor = scheme.onTertiaryContainer;
      border = Border.all(color: scheme.tertiary, width: 1.5);
    } else if (isFree) {
      bgColor = scheme.secondaryContainer;
      textColor = scheme.onSecondaryContainer;
      border = Border.all(color: scheme.secondary, width: 1.5);
    }

    if (isHighlighted) {
      border = Border.all(color: scheme.error, width: 2.5);
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
                  isMySeat ? l10n.busYou : digits(seatNo, bangla: bangla),
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
                  color: scheme.inversePrimary,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSupervisorTab(BuildContext context, bool bangla) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final boardedCount = _boardedSeats.length;
    final pct = ((boardedCount / 48) * 100).round();

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.busConductorTitle,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: scheme.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    Text(
                      l10n.busBoardedOf(
                        digits(boardedCount, bangla: bangla),
                        digits(48, bangla: bangla),
                        digits(pct, bangla: bangla),
                      ),
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
                    backgroundColor: scheme.surfaceContainerHighest,
                    color: scheme.primary,
                  ),
                ),
                const SizedBox(height: Space.sm),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      Haptics.heavy();
                      unawaited(_markBoarded());
                    },
                    icon: const Icon(Icons.qr_code_scanner, size: 16),
                    label: Text(l10n.busScanBoard),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.md),
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
                Row(
                  children: [
                    Icon(
                      Icons.hourglass_top_rounded,
                      color: scheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        l10n.busWaitPromote,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: scheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  l10n.busWaitPromoteHint,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Divider(height: 16),
                for (var i = 0; i < _waitlistQueue.length; i++) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '#${digits(i + 1, bangla: bangla)} ${_waitlistQueue[i]}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (i == 0)
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () {
                            Haptics.success();
                            setState(() => _waitlistQueue.removeAt(0));
                            AppToast.show(
                              context,
                              l10n.busAssignedFarhan,
                              tone: StatusTone.success,
                            );
                          },
                          icon: const Icon(Icons.check, size: 14),
                          label: Text(
                            l10n.busAssign3b,
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
                  l10n.busAdminTitle,
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
                        label: Text(l10n.busDelayAlert),
                      ),
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Haptics.tap();
                          unawaited(_swapBus());
                        },
                        icon: const Icon(Icons.swap_horiz, size: 16),
                        label: Text(l10n.busSwapCoach),
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
          padding: const EdgeInsets.all(Space.md),
          children: [
            if (w != null && !w.offered)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
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
                      const SizedBox(height: Space.sm),
                      Text(
                        '${l10n.busPosition(digits(w.position, bangla: bangla))} · ${l10n.busEstimate(digits(w.estimatedWaitDays, bangla: bangla))}',
                      ),
                      const SizedBox(height: Space.sm),
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
                  padding: const EdgeInsets.all(Space.md),
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
                        l10n.busOfferOnRoute(
                          w.route.displayName(bangla: bangla),
                        ),
                      ),
                      if (w.expiresAt != null)
                        Padding(
                          padding: const EdgeInsets.only(top: Space.xs),
                          child: Text(
                            l10n.busOfferExpires(
                              DateFmt.dateTime(w.expiresAt!, lang),
                            ),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: context.bogcl.warning,
                            ),
                          ),
                        ),
                      const SizedBox(height: Space.sm),
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
                  padding: const EdgeInsets.all(Space.md),
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
                      const SizedBox(height: Space.sm),
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
