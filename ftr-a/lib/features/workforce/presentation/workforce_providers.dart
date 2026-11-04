import 'dart:async';

import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/workforce/data/workforce_repository.dart';
import 'package:bogcl_oneops/features/workforce/domain/workforce_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'workforce_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<StaffMember>> staffList(
  Ref ref, {
  String view = 'all',
  String? query,
}) {
  _watchUser(ref);
  return ref.watch(workforceRepositoryProvider).list(view: view, query: query);
}

@riverpod
Future<StaffMember> staffDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(workforceRepositoryProvider).detail(id);
}
