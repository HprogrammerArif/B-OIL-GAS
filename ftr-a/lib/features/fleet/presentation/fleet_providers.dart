import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fleet_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<FleetVehicle>> fleetVehicles(Ref ref) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).vehicles();
}

@riverpod
Future<List<FleetDriver>> fleetDrivers(Ref ref) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).drivers();
}

@riverpod
Future<List<FleetRequisition>> fleetRequisitions(
  Ref ref, {
  String? status,
}) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).requisitions(status: status);
}

@riverpod
Future<FleetRequisition> fleetRequisitionDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).detail(id);
}
