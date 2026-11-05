import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'licence_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Licence>> licences(Ref ref, {String view = 'mine', String? query}) {
  _watchUser(ref);
  return ref.watch(licenceRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<Licence> licenceDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(licenceRepositoryProvider).detail(id);
}

@riverpod
Future<List<LicenceType>> licenceTypes(Ref ref) {
  _watchUser(ref);
  return ref.watch(licenceRepositoryProvider).types();
}
