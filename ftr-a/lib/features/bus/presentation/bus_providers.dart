import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/bus/data/bus_repository.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'bus_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<BusRoute>> busRoutes(Ref ref) {
  _watchUser(ref);
  return ref.watch(busRepositoryProvider).routes();
}

@riverpod
Future<BusRoute> busRouteDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(busRepositoryProvider).route(id);
}

@riverpod
Future<MySeat> mySeat(Ref ref) {
  _watchUser(ref);
  return ref.watch(busRepositoryProvider).mySeat();
}
