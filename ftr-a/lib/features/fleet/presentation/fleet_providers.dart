import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'fleet_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<VehicleRequisition>> fleetRequisitions(
  Ref ref, {
  String view = 'mine',
  String? query,
}) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<VehicleRequisition> fleetDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).detail(id);
}

@riverpod
Future<List<FleetSos>> fleetSos(Ref ref) {
  _watchUser(ref);
  return ref.watch(fleetRepositoryProvider).sosList();
}
