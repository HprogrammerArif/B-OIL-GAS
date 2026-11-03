import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'leave_providers.g.dart';

/// Re-runs providers when the signed-in user changes.
void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<LeaveBalance>> leaveBalances(Ref ref) {
  _watchUser(ref);
  return ref.watch(leaveRepositoryProvider).balances();
}

@riverpod
Future<List<LeaveRequestItem>> myLeaveRequests(Ref ref) {
  _watchUser(ref);
  return ref.watch(leaveRepositoryProvider).requests();
}

@riverpod
Future<List<LeaveType>> leaveTypes(Ref ref) =>
    ref.watch(leaveRepositoryProvider).types();

@riverpod
Future<LeavePolicyInfo> leavePolicy(Ref ref) =>
    ref.watch(leaveRepositoryProvider).policy();

@riverpod
Future<LeaveRequestItem> leaveDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(leaveRepositoryProvider).detail(id);
}
