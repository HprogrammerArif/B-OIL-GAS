import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'incident_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<SafetyIncident>> incidents(
  Ref ref, {
  String view = 'mine',
  String? query,
}) {
  _watchUser(ref);
  return ref.watch(incidentRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<SafetyIncident> incidentDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(incidentRepositoryProvider).detail(id);
}

@riverpod
Future<List<IncidentZone>> incidentZones(Ref ref, String? siteId) {
  _watchUser(ref);
  return ref.watch(incidentRepositoryProvider).zones(siteId);
}
