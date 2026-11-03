import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'parcel_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Parcel>> parcels(
  Ref ref,
  String view, {
  String? query,
  bool stuckOnly = false,
}) {
  _watchUser(ref);
  return ref
      .watch(parcelRepositoryProvider)
      .list(view: view, query: query, stuckOnly: stuckOnly);
}

@riverpod
Future<Parcel> parcelDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(parcelRepositoryProvider).detail(id);
}

@riverpod
Future<List<Person>> parcelCouriers(Ref ref) {
  _watchUser(ref);
  return ref.watch(parcelRepositoryProvider).couriers();
}
