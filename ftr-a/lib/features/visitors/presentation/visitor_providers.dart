import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'visitor_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Visit>> visits(Ref ref, {String view = 'mine', String? query}) {
  _watchUser(ref);
  return ref.watch(visitorRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<Visit> visitDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(visitorRepositoryProvider).detail(id);
}

@riverpod
Future<List<VisitZone>> visitZones(Ref ref, String? siteId) {
  _watchUser(ref);
  return ref.watch(visitorRepositoryProvider).zones(siteId);
}

@riverpod
Future<VisitMuster> visitMuster(Ref ref) {
  _watchUser(ref);
  return ref.watch(visitorRepositoryProvider).muster();
}
