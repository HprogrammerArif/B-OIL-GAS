import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class FleetScreen extends ConsumerStatefulWidget {
  const FleetScreen({super.key});

  @override
  ConsumerState<FleetScreen> createState() => _FleetScreenState();
}

class _FleetScreenState extends ConsumerState<FleetScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    final session = ref.read(sessionControllerProvider).value;
    final isDriver =
        session?.profile.roles.contains('DRIVER') ?? false;
    final isAdmin =
        session?.profile.roles.contains('TRANSPORT_ADMIN') ?? false;
    _tabs = TabController(
      length: isAdmin ? 3 : (isDriver ? 2 : 1),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final session = ref.watch(sessionControllerProvider).value;
    final isAdmin = session?.profile.roles.contains('TRANSPORT_ADMIN') ?? false;
    final isDriver = session?.profile.roles.contains('DRIVER') ?? false;

    final tabs = [
      Tab(text: l10n.fleetMyRequests),
      if (isDriver) Tab(text: l10n.fleetMyTrips),
      if (isAdmin) ...[
        Tab(text: l10n.fleetVehicles),
        Tab(text: l10n.fleetDrivers),
      ],
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleFleet),
        actions: [
          if (!isDriver)
            IconButton(
              onPressed: () => context.push(AppRoutes.fleetNew),
              icon: const Icon(Icons.add_road_outlined),
              tooltip: l10n.fleetNewRequest,
            ),
        ],
        bottom: TabBar(controller: _tabs, tabs: tabs),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _RequisitionList(driverMode: false),
          if (isDriver) _RequisitionList(driverMode: true),
          if (isAdmin) ...[
            const _VehicleList(),
            const _DriverList(),
          ],
        ],
      ),
    );
  }
}

class _RequisitionList extends ConsumerWidget {
  const _RequisitionList({required this.driverMode});
  final bool driverMode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(fleetRequisitionsProvider());
    return async.when(
      loading: () => const SkeletonList(),
      error: (e, _) => ErrorState(
        onRetry: () => ref.invalidate(fleetRequisitionsProvider()),
      ),
      data: (reqs) {
        if (reqs.isEmpty) {
          return EmptyState(
            icon: Icons.directions_car_outlined,
            message: context.l10n.fleetNoRequests,
          );
        }
        return RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(fleetRequisitionsProvider()),
          child: ListView.separated(
            padding: const EdgeInsets.only(bottom: Space.xxxl),
            itemCount: reqs.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (ctx, i) => _ReqRow(req: reqs[i]),
          ),
        );
      },
    );
  }
}

class _ReqRow extends StatelessWidget {
  const _ReqRow({required this.req});
  final FleetRequisition req;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final (label, tone) = _statusLabel(req.status, l10n);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      onTap: () => context.push(AppRoutes.fleetDetail(req.id)),
      leading: Icon(
        _typeIcon(req.requiredCapacity),
        color: theme.colorScheme.primary,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              '${req.from} → ${req.to}',
              style: theme.textTheme.titleSmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          StatusPill(label: label, tone: tone),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            req.refNo,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          if (req.assignedVehiclePlate != null)
            Text(
              '${req.assignedVehiclePlate} · ${req.assignedDriverName ?? ''}',
              style: theme.textTheme.bodySmall,
            ),
        ],
      ),
    );
  }

  IconData _typeIcon(String type) => switch (type) {
    'microbus_7' => Icons.airport_shuttle_outlined,
    'pickup_4x4' => Icons.rv_hookup_outlined,
    'tanker_heavy' => Icons.local_shipping_outlined,
    _ => Icons.directions_car_outlined,
  };

  (String, StatusTone) _statusLabel(RequisitionStatus s, dynamic l10n) =>
      switch (s) {
        RequisitionStatus.pending => (l10n.fleetStatusPending as String, StatusTone.info),
        RequisitionStatus.assigned => (l10n.fleetStatusAssigned as String, StatusTone.warning),
        RequisitionStatus.inTransit => (l10n.fleetStatusInTransit as String, StatusTone.success),
        RequisitionStatus.completed => (l10n.fleetStatusDone as String, StatusTone.neutral),
        RequisitionStatus.rejected => (l10n.fleetStatusRejected as String, StatusTone.danger),
        RequisitionStatus.cancelled => (l10n.fleetStatusCancelled as String, StatusTone.neutral),
      };
}

class _VehicleList extends ConsumerWidget {
  const _VehicleList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(fleetVehiclesProvider);
    return async.when(
      loading: () => const SkeletonList(),
      error: (e, _) =>
          ErrorState(onRetry: () => ref.invalidate(fleetVehiclesProvider)),
      data: (vehicles) => ListView.separated(
        padding: const EdgeInsets.only(bottom: Space.xxxl),
        itemCount: vehicles.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (ctx, i) => _VehicleRow(vehicle: vehicles[i]),
      ),
    );
  }
}

class _VehicleRow extends StatelessWidget {
  const _VehicleRow({required this.vehicle});
  final FleetVehicle vehicle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final (label, tone) = switch (vehicle.status) {
      VehicleStatus.available => (l10n.fleetVehicleAvailable as String, StatusTone.success),
      VehicleStatus.inTransit => (l10n.fleetVehicleInTransit as String, StatusTone.info),
      VehicleStatus.maintenance => (l10n.fleetVehicleMaintenance as String, StatusTone.warning),
      VehicleStatus.decommissioned => (l10n.fleetVehicleDecommissioned as String, StatusTone.neutral),
    };
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      leading: Icon(
        vehicle.isExecutive
            ? Icons.airline_seat_recline_extra_outlined
            : Icons.directions_car_outlined,
        color: theme.colorScheme.primary,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              vehicle.displayName,
              style: theme.textTheme.titleSmall,
            ),
          ),
          StatusPill(label: label, tone: tone),
        ],
      ),
      subtitle: Text(
        '${vehicle.year} · ${vehicle.color} · ${vehicle.odometer} km',
        style: theme.textTheme.bodySmall,
      ),
    );
  }
}

class _DriverList extends ConsumerWidget {
  const _DriverList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(fleetDriversProvider);
    return async.when(
      loading: () => const SkeletonList(),
      error: (e, _) =>
          ErrorState(onRetry: () => ref.invalidate(fleetDriversProvider)),
      data: (drivers) => ListView.separated(
        padding: const EdgeInsets.only(bottom: Space.xxxl),
        itemCount: drivers.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (ctx, i) => _DriverRow(driver: drivers[i]),
      ),
    );
  }
}

class _DriverRow extends StatelessWidget {
  const _DriverRow({required this.driver});
  final FleetDriver driver;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final (label, tone) = switch (driver.status) {
      DriverStatus.available => (l10n.fleetDriverAvailable as String, StatusTone.success),
      DriverStatus.onTrip => (l10n.fleetDriverOnTrip as String, StatusTone.info),
      DriverStatus.sickLeave => (l10n.fleetDriverSick as String, StatusTone.warning),
      DriverStatus.onLeave => (l10n.fleetDriverLeave as String, StatusTone.neutral),
      DriverStatus.restRequired => (l10n.fleetDriverRest as String, StatusTone.warning),
    };
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      leading: CircleAvatar(
        child: Text(driver.name[0]),
      ),
      title: Row(
        children: [
          Expanded(child: Text(driver.name, style: theme.textTheme.titleSmall)),
          StatusPill(label: label, tone: tone),
        ],
      ),
      subtitle: Text(
        '${driver.licenseNo} · ${driver.tripsCompleted} trips · ★ ${driver.rating}',
        style: theme.textTheme.bodySmall,
      ),
    );
  }
}
