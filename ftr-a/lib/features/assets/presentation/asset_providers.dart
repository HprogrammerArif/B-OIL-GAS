import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Equipment>> assets(Ref ref, {String view = 'mine', String? query}) {
  _watchUser(ref);
  return ref.watch(assetRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<Equipment> assetDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(assetRepositoryProvider).detail(id);
}

@riverpod
Future<List<AssetCategory>> assetCategories(Ref ref) {
  _watchUser(ref);
  return ref.watch(assetRepositoryProvider).categories();
}
