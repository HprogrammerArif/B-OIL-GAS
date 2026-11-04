import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/features/fleet/presentation/fleet_providers.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class FleetDetailScreen extends ConsumerWidget {
  const FleetDetailScreen({required this.id, super.key});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(fleetRequisitionDetailProvider(id));
    return async.when(
      loading: () => Scaffold(appBar: AppBar(), body: const SkeletonList()),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body:
            ErrorState(onRetry: () => ref.invalidate(fleetRequisitionDetailProvider(id))),
      ),
      data: (req) => _Detail(req: req),
    );
  }
}

class _Detail extends ConsumerStatefulWidget {
  const _Detail({required this.req});
  final FleetRequisition req;

  @override
  ConsumerState<_Detail> createState() => _DetailState();
}

class _DetailState extends ConsumerState<_Detail> {
  bool _loading = false;

  void _refresh() {
    ref.invalidate(fleetRequisitionDetailProvider(widget.req.id));
    ref.invalidate(fleetRequisitionsProvider());
  }

  Future<void> _startTrip() async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context: context,
      title: l10n.fleetStartTrip,
      message: l10n.fleetStartTripConfirm,
    );
    if (!ok) return;
    setState(() => _loading = true);
    try {
      await ref.read(fleetRepositoryProvider).startTrip(widget.req.id);
      AppHaptics.success();
      _refresh();
      if (mounted) {
        showAppToast(context, context.l10n.fleetTripStarted, tone: ToastTone.success);
      }
    } catch (e) {
      if (mounted) showAppToast(context, e.toString(), tone: ToastTone.error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _completeTrip() async {
    final l10n = context.l10n;
    // Simple complete dialog
    final odo = TextEditingController(
      text: (widget.req.id.isNotEmpty ? '' : ''),
    );
    int rating = 5;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.fleetCompleteTrip),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: odo,
              decoration: InputDecoration(labelText: l10n.fleetEndOdometer),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: Space.md),
            Text(l10n.fleetRating),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (int i = 1; i <= 5; i++)
                  StatefulBuilder(
                    builder: (_, set) => IconButton(
                      icon: Icon(
                        i <= rating ? Icons.star : Icons.star_outline,
                        color: const Color(0xFFD4AF37),
                      ),
                      onPressed: () {
                        set(() => rating = i);
                        setState(() {});
                      },
                    ),
                  ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.fleetCompleteTrip),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _loading = true);
    try {
      await ref.read(fleetRepositoryProvider).completeTrip(
        widget.req.id,
        endOdometer: int.tryParse(odo.text) ?? 0,
        rating: rating,
      );
      AppHaptics.success();
      _refresh();
      if (mounted) {
        showAppToast(context, context.l10n.fleetTripCompleted, tone: ToastTone.success);
        context.pop();
      }
    } catch (e) {
      if (mounted) showAppToast(context, e.toString(), tone: ToastTone.error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final req = widget.req;
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider).value;
    final isDriver = session?.profile.roles.contains('DRIVER') ?? false;
    final isAdmin = session?.profile.roles.contains('TRANSPORT_ADMIN') ?? false;

    final canStart = isDriver && req.status == RequisitionStatus.assigned;
    final canComplete = isDriver && req.status == RequisitionStatus.inTransit;

    final (statusLabel, tone) = switch (req.status) {
      RequisitionStatus.pending => (l10n.fleetStatusPending, StatusTone.info),
      RequisitionStatus.assigned => (l10n.fleetStatusAssigned, StatusTone.warning),
      RequisitionStatus.inTransit => (l10n.fleetStatusInTransit, StatusTone.success),
      RequisitionStatus.completed => (l10n.fleetStatusDone, StatusTone.neutral),
      RequisitionStatus.rejected => (l10n.fleetStatusRejected, StatusTone.danger),
      RequisitionStatus.cancelled => (l10n.fleetStatusCancelled, StatusTone.neutral),
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(req.refNo),
        actions: [
          StatusPill(label: statusLabel, tone: tone),
          const SizedBox(width: Space.md),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: Space.xxxl),
              children: [
                // Route card
                Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Space.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${req.from}  →  ${req.to}',
                            style: theme.textTheme.titleMedium,
                          ),
                          if (req.intermediateStops.isNotEmpty) ...[
                            const SizedBox(height: Space.xs),
                            for (final stop in req.intermediateStops)
                              Padding(
                                padding: const EdgeInsets.only(
                                  left: Space.md,
                                  top: Space.xxs,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.stop_circle_outlined,
                                      size: 14,
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                    const SizedBox(width: Space.xs),
                                    Text(
                                      stop,
                                      style: theme.textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                          ],
                          const Divider(height: Space.xl),
                          _DetailRow(l10n.fleetDepartureTime, req.departureTime),
                          if (req.returnTime != null)
                            _DetailRow(l10n.fleetReturnTime, req.returnTime!),
                          _DetailRow(
                            l10n.fleetVehicleType,
                            _typeLabel(req.requiredCapacity, l10n),
                          ),
                          _DetailRow(
                            l10n.fleetPassengers,
                            '${req.passengersCount}: ${req.passengerNames}',
                          ),
                          _DetailRow(l10n.fleetPurpose, req.purpose),
                          if (req.costCenter.isNotEmpty)
                            _DetailRow(l10n.fleetCostCenter, req.costCenter),
                        ],
                      ),
                    ),
                  ),
                ),
                // Assignment
                if (req.assignedVehiclePlate != null)
                  _Section(
                    title: l10n.fleetAssignment,
                    children: [
                      _DetailRow(l10n.fleetAssignedVehicle, req.assignedVehiclePlate!),
                      _DetailRow(l10n.fleetAssignedDriver, req.assignedDriverName ?? ''),
                    ],
                  ),
                // Requester
                _Section(
                  title: l10n.fleetRequester,
                  children: [
                    _DetailRow(l10n.fleetRequesterName, req.requesterName),
                    _DetailRow(l10n.fleetDept, req.dept),
                  ],
                ),
                // Trip result
                if (req.status == RequisitionStatus.completed) ...[
                  _Section(
                    title: l10n.fleetTripResult,
                    children: [
                      if (req.endOdometer != null)
                        _DetailRow(l10n.fleetEndOdometer, '${req.endOdometer} km'),
                      if (req.tripRating != null)
                        _DetailRow(
                          l10n.fleetRating,
                          '★' * req.tripRating!,
                        ),
                      if (req.tripFeedback != null && req.tripFeedback!.isNotEmpty)
                        _DetailRow(l10n.fleetFeedback, req.tripFeedback!),
                    ],
                  ),
                ],
                if (req.rejectReason != null && req.rejectReason!.isNotEmpty)
                  _Section(
                    title: l10n.fleetRejectReason,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: Space.lg,
                          vertical: Space.xs,
                        ),
                        child: Text(
                          req.rejectReason!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                // Driver actions
                if (canStart || canComplete)
                  Padding(
                    padding: const EdgeInsets.all(Space.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (canStart)
                          FilledButton.icon(
                            onPressed: _startTrip,
                            icon: const Icon(Icons.play_arrow),
                            label: Text(l10n.fleetStartTrip),
                          ),
                        if (canComplete)
                          FilledButton.icon(
                            onPressed: _completeTrip,
                            icon: const Icon(Icons.flag_outlined),
                            label: Text(l10n.fleetCompleteTrip),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  String _typeLabel(String type, dynamic l10n) => switch (type) {
    'sedan_4' => l10n.fleetTypeSedan as String,
    'microbus_7' => l10n.fleetTypeMicrobus as String,
    'pickup_4x4' => l10n.fleetTypePickup as String,
    'tanker_heavy' => l10n.fleetTypeTanker as String,
    _ => type,
  };
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [SectionHeader(title: title), ...children],
  );
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.xs,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
