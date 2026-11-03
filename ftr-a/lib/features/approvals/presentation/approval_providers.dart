import 'package:bogcl_oneops/features/approvals/data/approval_repository.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approval_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<InboxItem>> approvalInbox(Ref ref) {
  _watchUser(ref);
  return ref.watch(approvalRepositoryProvider).inbox();
}

@riverpod
Future<InboxSummary> approvalSummary(Ref ref) {
  _watchUser(ref);
  return ref.watch(approvalRepositoryProvider).summary();
}

@riverpod
Future<List<HistoryItem>> approvalHistory(Ref ref) {
  _watchUser(ref);
  return ref.watch(approvalRepositoryProvider).history();
}

@riverpod
Future<ApprovalDetail> approvalDetail(Ref ref, String instanceId) {
  _watchUser(ref);
  return ref.watch(approvalRepositoryProvider).detail(instanceId);
}

@riverpod
Future<List<Person>> approvalDelegates(Ref ref) {
  _watchUser(ref);
  return ref.watch(approvalRepositoryProvider).delegates();
}
