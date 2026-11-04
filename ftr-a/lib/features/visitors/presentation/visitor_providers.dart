import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'visitor_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Visitor>> visitors(
  Ref ref, {
  String? status,
  String? category,
}) {
  _watchUser(ref);
  return ref
      .watch(visitorRepositoryProvider)
      .list(status: status, category: category);
}

@riverpod
Future<Visitor> visitorDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(visitorRepositoryProvider).detail(id);
}
