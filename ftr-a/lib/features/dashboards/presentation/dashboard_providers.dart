import 'dart:async';

import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'dashboard_providers.g.dart';

@riverpod
Future<Dashboard> dashboardMe(Ref ref) {
  ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));
  return ref.watch(dashboardRepositoryProvider).me();
}
